import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Keep the generation master outside the public bundle; publish bounded,
// silent H.264 derivatives that Safari can decode natively.
const root = fileURLToPath(new URL("../", import.meta.url));
const master = process.argv[2] && resolve(process.argv[2]);
if (!master) throw new Error("Usage: node scripts/prepare-films.mjs <original.mp4>");
mkdirSync(resolve(root, "public/films"), { recursive: true });
const ffmpeg = (args) => execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", master, ...args], { stdio: "inherit" });
for (const [format, filter, crf] of [
  ["desktop", "scale=1600:-2", "22"],
  ["mobile", "crop=min(iw\\,ih):min(iw\\,ih),scale=640:640", "24"],
]) {
  const codec = ["-an", "-c:v", "libx264", "-preset", "slow", "-crf", crf, "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-map_metadata", "-1"];
  ffmpeg(["-vf", `${filter},fps=24`, ...codec, resolve(root, `public/films/spark-${format}.mp4`)]);
  // The exhibition returns through the same construction path. Matched
  // endpoints keep the repeated study of the sculpture continuous.
  ffmpeg(["-filter_complex", `[0:v]${filter},fps=24,split[a][b];[b]reverse[back];[a][back]concat=n=2:v=1:a=0[loop]`, "-map", "[loop]", ...codec, resolve(root, `public/films/spark-loop-${format}.mp4`)]);
}
for (const name of ["hero-spark", "portal-spark"]) {
  ffmpeg(["-ss", "0", "-frames:v", "1", "-vf", "scale=1280:-2", "-q:v", "3", "-update", "1", resolve(root, `public/images/${name}.jpg`)]);
  ffmpeg(["-ss", "0", "-frames:v", "1", "-vf", "crop=min(iw\\,ih):min(iw\\,ih),scale=640:640", "-q:v", "3", "-update", "1", resolve(root, `public/images/${name}-mobile.jpg`)]);
}
ffmpeg(["-ss", "10.9", "-frames:v", "1", "-vf", "crop=min(iw\\,ih):min(iw\\,ih),scale=720:720", "-q:v", "3", "-update", "1", resolve(root, "public/images/hero-static-spark.jpg")]);
