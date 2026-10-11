// POST /api/ingest: the advisor's files in (multipart, field "files"), the
// prep out: client file, sources and a Mandate draft for review. Any Claude
// failure keeps what the code could read, so valid input never gets a 5xx.
import { NextResponse } from "next/server";
import { MAX_FILES, MAX_TOTAL_BYTES, ingestFiles, type UploadedFile } from "@/lib/engine/ingest";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  if (Number(req.headers.get("content-length")) > MAX_TOTAL_BYTES + 64 * 1024) {
    return bad("Files are too large together. Keep the upload under 4 MB.", 413);
  }
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad("Send the files as multipart form data.");
  }
  const entries = form
    .getAll("files")
    .filter((f): f is File => typeof f === "object" && f !== null && "arrayBuffer" in f);
  if (entries.length === 0) return bad("Add at least one file.");
  if (entries.length > MAX_FILES) return bad(`Add at most ${MAX_FILES} files.`);
  const total = entries.reduce((n, f) => n + f.size, 0);
  if (total > MAX_TOTAL_BYTES) return bad("Files are too large together. Keep the upload under 4 MB.", 413);

  const files: UploadedFile[] = await Promise.all(
    entries.map(async (f) => ({
      name: (f.name || "file").slice(0, 200),
      data: Buffer.from(await f.arrayBuffer()),
    })),
  );
  const result = await ingestFiles(files, req.signal);
  // Nothing readable: say so, rather than open a review with nothing in it.
  if (result.sources.length === 0 && result.files.every((f) => !f.read)) {
    const why = result.files.map((f) => `${f.name}: ${f.note ?? "could not be read"}`).join(" ");
    return bad(`None of these files could be read. ${why}`.trim(), 422);
  }
  return NextResponse.json(result);
}
