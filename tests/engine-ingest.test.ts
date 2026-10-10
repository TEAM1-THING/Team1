import { deflateRawSync } from "node:zlib";
import { afterEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/ingest/route";
import { setClientForTests } from "@/lib/engine/client";
import { ingestFiles, prepareFiles, traceClientFile } from "@/lib/engine/ingest";
import { docxText, kindOf, pptxText, unzip, xlsxText } from "@/lib/engine/office";
import type { ClientFile } from "@/lib/types";

// A minimal zip writer for fixtures: stored or deflated entries, CRC left 0
// (the reader does not check it).
function zip(entries: Record<string, string>, deflate = false): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const [name, text] of Object.entries(entries)) {
    const raw = Buffer.from(text, "utf8");
    const data = deflate ? deflateRawSync(raw) : raw;
    const n = Buffer.from(name, "utf8");
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(deflate ? 8 : 0, 8);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(n.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(deflate ? 8 : 0, 10);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(n.length, 28);
    central.writeUInt32LE(offset, 42);
    locals.push(local, n, data);
    centrals.push(central, n);
    offset += 30 + n.length + data.length;
  }
  const dir = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(Object.keys(entries).length, 8);
  eocd.writeUInt16LE(Object.keys(entries).length, 10);
  eocd.writeUInt32LE(dir.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, dir, eocd]);
}

const DOCX = zip(
  {
    "word/document.xml":
      "<w:document><w:body><w:p><w:r><w:t>Keep a $180,000 reserve &amp; invest</w:t></w:r></w:p><w:p><w:r><w:t>6 tranches</w:t></w:r></w:p></w:body></w:document>",
  },
  true,
);
const XLSX = zip({
  "xl/workbook.xml": '<workbook><sheets><sheet name="Client" sheetId="1"/></sheets></workbook>',
  "xl/sharedStrings.xml": "<sst><si><t>Cash on hand</t></si><si><t>Dana</t></si></sst>",
  "xl/worksheets/sheet1.xml":
    '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1"><v>300000</v></c></row><row r="2"><c r="B2" t="inlineStr"><is><t>note</t></is></c><c r="A2" t="s"><v>1</v></c></row></sheetData></worksheet>',
});
const PPTX = zip({
  "ppt/slides/slide2.xml": "<p:sld><a:p><a:t>Second</a:t></a:p></p:sld>",
  "ppt/slides/slide1.xml": "<p:sld><a:p><a:t>First</a:t></a:p></p:sld>",
});

describe("office text extraction", () => {
  it("reads Word paragraphs, decoding entities", () => {
    expect(docxText(DOCX)).toBe("Keep a $180,000 reserve & invest\n6 tranches");
  });

  it("reads Excel rows in column order with shared and inline strings", () => {
    expect(xlsxText(XLSX)).toBe("Sheet: Client\nCash on hand | 300000\nDana | note");
  });

  it("reads PowerPoint slides in numeric order", () => {
    expect(pptxText(PPTX)).toBe("Slide 1:\nFirst\nSlide 2:\nSecond");
  });

  it("rejects a file that is not a zip", () => {
    expect(() => unzip(Buffer.from("not a zip at all, just some text"), () => true)).toThrow();
  });

  it("detects kinds by extension and magic bytes", () => {
    const pdf = Buffer.from("%PDF-1.7");
    expect(kindOf("plan.pdf", pdf)).toBe("pdf");
    expect(kindOf("plan.pdf", Buffer.from("hello"))).toBe("unknown");
    expect(kindOf("plan.docx", DOCX)).toBe("docx");
    expect(kindOf("fake.docx", Buffer.from("hello"))).toBe("unknown");
    expect(kindOf("scan.JPG", Buffer.alloc(4))).toBe("image");
    expect(kindOf("old.doc", Buffer.alloc(4))).toBe("legacy");
    expect(kindOf("data.csv", Buffer.alloc(4))).toBe("text");
    expect(kindOf("program.exe", Buffer.alloc(4))).toBe("unknown");
  });
});

describe("prepareFiles", () => {
  it("reads text formats, queues PDFs for Claude, and explains what it skips", () => {
    const { prepared, reports } = prepareFiles([
      { name: "plan.docx", data: DOCX },
      { name: "plan.pdf", data: Buffer.from("%PDF-1.7 ...") },
      { name: "old.xls", data: Buffer.alloc(8) },
      { name: "broken.xlsx", data: Buffer.from("PK broken") },
    ]);
    expect(prepared.map((p) => [p.name, p.text === null])).toEqual([
      ["plan.docx", false],
      ["plan.pdf", true],
    ]);
    expect(reports.filter((r) => !r.read).map((r) => r.name)).toEqual(["old.xls", "broken.xlsx"]);
  });
});

describe("traceClientFile", () => {
  const cf: ClientFile = {
    name: "Dana",
    age: 58,
    horizonYears: 12,
    cashOnHand: 300000,
    investable: 2000000,
    riskTolerance: "moderate",
    statedGoals: [],
    statedConcerns: [],
  };

  it("zeroes a figure the documents do not state and reports it missing", () => {
    const { clientFile, missing } = traceClientFile(cf, ["Age 58, retire at 70. Cash on hand $300,000."], []);
    expect(clientFile.investable).toBe(0);
    expect(missing).toContain("investable");
    expect(clientFile.cashOnHand).toBe(300000);
    // 12 is not written, but 70 - 58 is.
    expect(clientFile.horizonYears).toBe(12);
  });
});

describe("ingestFiles without Claude", () => {
  afterEach(() => setClientForTests(undefined));

  it("keeps the text it could read and asks the advisor to fill in the client file", async () => {
    setClientForTests(null);
    const r = await ingestFiles([
      { name: "plan.docx", data: DOCX },
      { name: "plan.pdf", data: Buffer.from("%PDF-1.7") },
    ]);
    expect(r.source).toBe("text-only");
    expect(r.sources).toHaveLength(1);
    expect(r.sources[0].text).toContain("$180,000");
    expect(r.files.find((f) => f.name === "plan.pdf")?.read).toBe(false);
    expect(r.clientFile.investable).toBe(0);
  });
});

describe("POST /api/ingest", () => {
  it("rejects a request with no files", async () => {
    const res = await POST(
      new Request("http://x/api/ingest", {
        method: "POST",
        body: new FormData(),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a body that is not multipart", async () => {
    const res = await POST(
      new Request("http://x/api/ingest", {
        method: "POST",
        body: "{}",
        headers: { "content-type": "application/json" },
      }),
    );
    expect(res.status).toBe(400);
  });
});
