// Bundles each process's entry point with esbuild. Preloads are sandboxed, so
// they must be single files; the worklet is inlined into the audio preload.
import { build } from "esbuild";
import { copyFile, mkdir } from "node:fs/promises";

const common = { bundle: true, logLevel: "warning", target: "es2022", sourcemap: "inline" };
const node = { ...common, platform: "node", format: "cjs", external: ["electron"] };

await mkdir("dist", { recursive: true });
const worklet = await build({ ...common, sourcemap: false, platform: "browser", format: "iife", write: false, entryPoints: ["src/worklet/vad-worklet.ts"] });

await Promise.all([
  build({ ...node, entryPoints: ["src/main/main.ts"], outfile: "dist/main.js" }),
  build({ ...node, entryPoints: ["src/pipeline/pipeline.ts"], outfile: "dist/pipeline.js" }),
  build({ ...node, entryPoints: ["src/preload/overlay.ts"], outfile: "dist/preload-overlay.js" }),
  build({
    ...node,
    entryPoints: ["src/preload/audio.ts"],
    outfile: "dist/preload-audio.js",
    define: { __VAD_WORKLET__: JSON.stringify(worklet.outputFiles[0].text) },
  }),
  copyFile("static/audio.html", "dist/audio.html"),
]);
console.log("built desktop/dist");
