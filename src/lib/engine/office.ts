// Text out of the advisor's uploaded files, server-side, with no dependencies.
// .docx, .xlsx and .pptx are zip archives of XML: a minimal zip reader plus
// tag stripping gets their text. PDFs and images are not read here; ingest.ts
// hands those to Claude as document and image blocks.
import { inflateRawSync } from "node:zlib";

// Zip-bomb guard: no single entry may inflate past this.
const MAX_ENTRY_BYTES = 8 * 1024 * 1024;
// What one file may contribute to the prompt.
export const MAX_TEXT_CHARS = 60_000;

export type FileKind = "pdf" | "image" | "docx" | "xlsx" | "pptx" | "text" | "legacy" | "unknown";

const IMAGE_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
};
const TEXT_EXT = new Set(["txt", "md", "csv", "tsv", "json", "html", "htm", "xml", "rtf"]);
const LEGACY_EXT = new Set(["doc", "xls", "ppt", "pages", "numbers", "key", "odt", "ods", "odp"]);

const ext = (name: string) => name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";

export function imageMediaType(name: string): string | null {
  return IMAGE_TYPES[ext(name)] ?? null;
}

// By extension, checked against the magic bytes where they are cheap to read.
export function kindOf(name: string, head: Uint8Array): FileKind {
  const e = ext(name);
  const isPdf = head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46; // %PDF
  const isZip = head[0] === 0x50 && head[1] === 0x4b; // PK
  if (e === "pdf" || isPdf) return isPdf ? "pdf" : "unknown";
  if (IMAGE_TYPES[e]) return "image";
  if (e === "docx" || e === "xlsx" || e === "xlsm" || e === "pptx") {
    if (!isZip) return "unknown";
    return e === "docx" ? "docx" : e === "pptx" ? "pptx" : "xlsx";
  }
  if (TEXT_EXT.has(e)) return "text";
  if (LEGACY_EXT.has(e)) return "legacy";
  return "unknown";
}

// The entries of a zip whose names pass `want`. Stored and deflated entries
// only, no zip64: enough for Office files. Throws on a malformed archive.
export function unzip(buf: Buffer, want: (name: string) => boolean): Map<string, Buffer> {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 0xffff); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("not a zip archive");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = new Map<string, Buffer>();
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("bad zip directory");
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const usize = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    p += 46 + nameLen + extraLen + commentLen;
    if (!want(name) || usize > MAX_ENTRY_BYTES) continue;
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const raw = buf.subarray(start, start + csize);
    if (method === 0) out.set(name, Buffer.from(raw));
    else if (method === 8) out.set(name, inflateRawSync(raw, { maxOutputLength: MAX_ENTRY_BYTES }));
  }
  return out;
}

export function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, "&");
}

const stripTags = (s: string) => decodeXml(s.replace(/<[^>]+>/g, ""));
const tidy = (s: string) =>
  s
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .slice(0, MAX_TEXT_CHARS);

// Entries named like prefix + number + ".xml", in numeric order.
function numbered(files: Map<string, Buffer>, prefix: string): Buffer[] {
  const re = new RegExp(`^${prefix}(\\d+)\\.xml$`);
  return [...files.entries()]
    .map(([name, data]) => ({ n: Number(name.match(re)?.[1] ?? NaN), data }))
    .filter((e) => Number.isFinite(e.n))
    .sort((a, b) => a.n - b.n)
    .map((e) => e.data);
}

export function docxText(buf: Buffer): string {
  const xml =
    unzip(buf, (n) => n === "word/document.xml")
      .get("word/document.xml")
      ?.toString("utf8") ?? "";
  return tidy(
    stripTags(
      xml
        .replace(/<w:tab\/>/g, "\t")
        .replace(/<w:br\/>/g, "\n")
        .replace(/<\/w:tc>/g, " | ")
        .replace(/<\/w:p>/g, "\n"),
    ),
  );
}

export function pptxText(buf: Buffer): string {
  const files = unzip(buf, (n) => /^ppt\/slides\/slide\d+\.xml$/.test(n));
  const slides = numbered(files, "ppt/slides/slide").map((data, i) => {
    const xml = data.toString("utf8").replace(/<\/a:p>/g, "\n");
    return `Slide ${i + 1}:\n${stripTags(xml)}`;
  });
  return tidy(slides.join("\n"));
}

// Column letters of a cell reference ("BC12" -> 54).
const colIndex = (ref: string) =>
  [...(ref.match(/^[A-Z]+/)?.[0] ?? "A")].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0);

export function xlsxText(buf: Buffer): string {
  const files = unzip(
    buf,
    (n) => n === "xl/sharedStrings.xml" || n === "xl/workbook.xml" || /^xl\/worksheets\/sheet\d+\.xml$/.test(n),
  );
  const shared = [...(files.get("xl/sharedStrings.xml")?.toString("utf8") ?? "").matchAll(/<si>([\s\S]*?)<\/si>/g)].map(
    (m) => [...m[1].matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((t) => decodeXml(t[1])).join(""),
  );
  const names = [
    ...(files.get("xl/workbook.xml")?.toString("utf8") ?? "").matchAll(/<sheet\b[^>]*\bname="([^"]*)"/g),
  ].map((m) => decodeXml(m[1]));
  const sheets = numbered(files, "xl/worksheets/sheet").map((data, i) => {
    const rows = new Map<number, { col: number; value: string }[]>();
    for (const c of data.toString("utf8").matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = c[1];
      const ref = attrs.match(/\br="([A-Z]+\d+)"/)?.[1];
      if (!ref || !c[2]) continue;
      const type = attrs.match(/\bt="(\w+)"/)?.[1];
      const v = c[2].match(/<v>([^<]*)<\/v>/)?.[1];
      const inline = [...c[2].matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((t) => decodeXml(t[1])).join("");
      const value = type === "s" ? (shared[Number(v)] ?? "") : type === "inlineStr" ? inline : decodeXml(v ?? "");
      if (!value.trim()) continue;
      const row = Number(ref.match(/\d+$/)?.[0]);
      if (!rows.has(row)) rows.set(row, []);
      rows.get(row)!.push({ col: colIndex(ref), value: value.trim() });
    }
    const lines = [...rows.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, cells]) =>
        cells
          .sort((a, b) => a.col - b.col)
          .map((c) => c.value)
          .join(" | "),
      );
    return `Sheet: ${names[i] ?? `Sheet ${i + 1}`}\n${lines.join("\n")}`;
  });
  return tidy(sheets.join("\n\n"));
}

// HTML and plain text formats as readable text.
export function plainText(name: string, buf: Buffer): string {
  const raw = buf.toString("utf8");
  const e = ext(name);
  if (e === "html" || e === "htm") {
    return tidy(
      stripTags(raw.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, "").replace(/<\/(p|div|tr|li|h\d)>/gi, "\n")),
    );
  }
  return tidy(raw);
}

// The text of a file this module can read, or null for PDFs, images and
// formats it cannot. Throws on a corrupt archive.
export function extractText(name: string, kind: FileKind, buf: Buffer): string | null {
  switch (kind) {
    case "docx":
      return docxText(buf);
    case "xlsx":
      return xlsxText(buf);
    case "pptx":
      return pptxText(buf);
    case "text":
      return plainText(name, buf);
    default:
      return null;
  }
}
