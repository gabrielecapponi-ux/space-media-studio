import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
const value = (flag) => {
  const index = args.indexOf(flag);
  return index < 0 ? undefined : args[index + 1];
};
const fixture = args.includes("--test-fixture");
const output = resolve(value("--output") || join(root, fixture ? "outputs/.composition-test" : "outputs/spark-local"));
const frames = value("--frames") ? resolve(value("--frames")) : fixture ? join(output, "frames") : undefined;
if (!frames) throw new Error("Usage: node scripts/compose-local-film.mjs --frames <PNG directory> [--output <directory>] [--test-fixture]");
const api = "http://127.0.0.1:8188";
const seed = 61739;
const fps = 24;
const chapters = [
  { name: "idea", first: 1, last: 36 },
  { name: "fragments", first: 37, last: 122 },
  { name: "identity", first: 123, last: 264 },
];
const runId = `${fixture ? "fixture" : "film"}-${Date.now()}`;
const ffmpeg = (argv) => execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...argv], { stdio: "inherit" });
const probe = (path) => JSON.parse(execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,codec_name,pix_fmt,r_frame_rate,nb_frames:format=duration", "-of", "json", path], { encoding: "utf8" }));
async function jsonRequest(path, options) {
  const response = await fetch(`${api}${path}`, { ...options, signal: AbortSignal.timeout(15000) });
  const body = await response.text();
  if (!response.ok) throw new Error(`ComfyUI ${path}: HTTP ${response.status}: ${body}`);
  return JSON.parse(body);
}
await mkdir(output, { recursive: true });
if (fixture && !value("--frames")) {
  await mkdir(frames, { recursive: true });
  ffmpeg(["-f", "lavfi", "-i", "testsrc2=size=320x180:rate=24:duration=11", "-frames:v", "264", join(frames, "fixture-%04d.png")]);
}
const pngs = (await readdir(frames)).filter((name) => name.toLowerCase().endsWith(".png"));
const match = pngs[0]?.match(/^(.*?)(\d+)\.png$/i);
if (!match || pngs.length !== 264) throw new Error(`Expected exactly 264 numbered PNG frames; found ${pngs.length}.`);
const [prefix, digits] = [match[1], match[2].length];
const names = new Set(pngs);
for (let frame = 1; frame <= 264; frame++) {
  const name = `${prefix}${String(frame).padStart(digits, "0")}.png`;
  if (!names.has(name)) throw new Error(`Missing frame: ${name}`);
}
const inputPattern = join(frames, `${prefix}%0${digits}d.png`);
const info = await jsonRequest("/object_info");
for (const [name, input] of [["LoadVideo", "file"], ["ConcatenateVideo", "videos"], ["SaveVideo", "format"]]) {
  if (!info[name]?.input?.required?.[input]) throw new Error(`The running ComfyUI lacks the expected ${name}.${input} node input.`);
  if (info[name].api_node) throw new Error(`Refusing API node: ${name}`);
}
if (info.ConcatenateVideo.input.required.videos[0] !== "COMFY_AUTOGROW_V3" || info.ConcatenateVideo.input.required.videos[1].template.prefix !== "video") throw new Error("ConcatenateVideo schema changed; inspect its inputs before composing.");
if (info.SaveVideo.input.required.format[0] !== "COMFY_DYNAMICCOMBO_V3") throw new Error("SaveVideo schema changed; inspect its format inputs before composing.");
const format = info.SaveVideo.input.required.format[1].options.find((option) => option.key === "mp4");
if (!format?.inputs?.required?.codec?.[1]?.options?.some((option) => option.key === "auto")) throw new Error("SaveVideo no longer exposes MP4 with automatic stream preservation.");
const uploaded = [];
for (const [index, chapter] of chapters.entries()) {
  const chapterPath = join(output, `${chapter.name}.mp4`);
  ffmpeg([
    "-framerate", String(fps), "-start_number", String(chapter.first), "-i", inputPattern,
    "-frames:v", String(chapter.last - chapter.first + 1), "-an", "-c:v", "libx264", "-preset", "medium",
    "-crf", "18", "-pix_fmt", "yuv420p", "-g", "24", "-keyint_min", "24", "-sc_threshold", "0", "-bf", "0",
    "-movflags", "+faststart", "-map_metadata", "-1", chapterPath,
  ]);
  const data = await readFile(chapterPath);
  const form = new FormData();
  form.set("image", new Blob([data], { type: "video/mp4" }), `space-spark-${runId}-${index + 1}.mp4`);
  form.set("type", "input");
  const upload = await jsonRequest("/upload/image", { method: "POST", body: form });
  if (!upload.name || upload.type !== "input") throw new Error(`Unexpected upload response: ${JSON.stringify(upload)}`);
  const file = upload.subfolder ? `${upload.subfolder}/${upload.name}` : upload.name;
  uploaded.push({ ...chapter, path: chapterPath, file, bytes: data.length, sha256: createHash("sha256").update(data).digest("hex"), upload });
  console.log(`Uploaded ${chapter.name}: ${file}`);
}
const available = await jsonRequest("/object_info/LoadVideo");
const options = available.LoadVideo.input.required.file[1].options;
for (const chapter of uploaded) {
  if (!options.includes(chapter.file)) throw new Error(`LoadVideo does not list the uploaded file: ${chapter.file}`);
}
const prompt = Object.fromEntries(uploaded.map((chapter, index) => [String(index + 1), { class_type: "LoadVideo", inputs: { file: chapter.file } }]));
prompt["4"] = { class_type: "ConcatenateVideo", inputs: { "videos.video0": ["1", 0], "videos.video1": ["2", 0], "videos.video2": ["3", 0], codec: "auto" } };
// DynamicCombo inputs are flattened in API prompts; ComfyUI builds the nested format/codec objects.
prompt["5"] = { class_type: "SaveVideo", inputs: { video: ["4", 0], filename_prefix: `space-media/spark-${runId}`, format: "mp4", "format.codec": "auto" } };
const metadata = {
  title: fixture ? "Composition pipeline fixture" : "Space Media Studio — Idea / Fragments / Identity",
  seed,
  source: fixture ? "Synthetic FFmpeg test pattern; not a website film" : "Original deterministic Blender 3D render",
  method: "PNG frames encoded to three compatible H.264 chapters, then composed by native local ComfyUI video nodes without materializing a frame tensor",
  expected: { width: fixture ? 320 : 1600, height: fixture ? 180 : 900, fps, frames: 264, duration: 11 },
  chapters: uploaded,
};
const request = { prompt, client_id: randomUUID(), extra_data: { extra_pnginfo: { seed, title: metadata.title, source: metadata.source } } };
await writeFile(join(output, "workflow-api.json"), `${JSON.stringify(request, null, 2)}\n`);
const submitted = await jsonRequest("/prompt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) });
if (!submitted.prompt_id) throw new Error(`ComfyUI returned no job identifier: ${JSON.stringify(submitted)}`);
metadata.jobId = submitted.prompt_id;
metadata.submission = submitted;
await writeFile(join(output, "metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`);
console.log(`ComfyUI job submitted: ${metadata.jobId}`);
const deadline = Date.now() + 10 * 60 * 1000;
let history;
while (Date.now() < deadline) {
  history = (await jsonRequest(`/history/${metadata.jobId}`))[metadata.jobId];
  if (history) break;
  await new Promise((done) => setTimeout(done, 1000));
}
if (!history) throw new Error(`ComfyUI job timed out; inspect /history/${metadata.jobId}.`);
await writeFile(join(output, "history.json"), `${JSON.stringify(history, null, 2)}\n`);
if (history.status?.status_str !== "success") throw new Error(`ComfyUI job failed: ${JSON.stringify(history.status)}`);
const saved = history.outputs?.["5"]?.images?.[0];
if (!saved?.filename) throw new Error(`SaveVideo returned no file: ${JSON.stringify(history.outputs?.["5"])}`);
const view = new URL(`${api}/view`);
for (const key of ["filename", "subfolder", "type"]) if (saved[key]) view.searchParams.set(key, saved[key]);
const response = await fetch(view, { signal: AbortSignal.timeout(60000) });
if (!response.ok) throw new Error(`Cannot retrieve the completed video: HTTP ${response.status}`);
const video = Buffer.from(await response.arrayBuffer());
const master = fixture ? join(output, "fixture-master.mp4") : join(dirname(output), "spark-master.mp4");
await writeFile(master, video);
const validation = probe(master);
const stream = validation.streams[0];
if (!stream || Number(stream.nb_frames) !== 264 || stream.r_frame_rate !== "24/1" || Math.abs(Number(validation.format.duration) - 11) > 0.01) throw new Error(`Unexpected composed video: ${JSON.stringify(validation)}`);
if (stream.width !== metadata.expected.width || stream.height !== metadata.expected.height || stream.codec_name !== "h264" || stream.pix_fmt !== "yuv420p") throw new Error(`Unexpected video format: ${JSON.stringify(stream)}`);
metadata.output = { path: master, serverFile: saved, bytes: video.length, sha256: createHash("sha256").update(video).digest("hex"), validation };
await writeFile(join(output, "metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`);
console.log(JSON.stringify({ jobId: metadata.jobId, output: master, validation }, null, 2));
