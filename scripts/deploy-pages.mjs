import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const repository = "gabrielecapponi-ux/space-media-studio";
const remote = `https://github.com/${repository}.git`;
const run = (command, args, cwd = root) =>
  execFileSync(command, args, { cwd, stdio: "inherit" });
const read = (command, args, cwd = root) =>
  execFileSync(command, args, { cwd, encoding: "utf8" }).trim();

// Publish only the production bundle; preserve the source checkout and the
// existing deployment history. No credentials are copied into the site.
run("npm", ["run", "build"]);
const directory = mkdtempSync(join(tmpdir(), "space-media-pages-"));
try {
  const exists = read("git", ["ls-remote", "--heads", remote, "refs/heads/gh-pages"]);
  if (exists) {
    run("git", ["clone", "--depth", "1", "--single-branch", "--branch", "gh-pages", remote, directory]);
  } else {
    run("git", ["init", "-b", "gh-pages"], directory);
    run("git", ["remote", "add", "origin", remote], directory);
  }
  run("git", ["config", "user.name", read("git", ["config", "user.name"])], directory);
  run("git", ["config", "user.email", read("git", ["config", "user.email"])], directory);
  for (const entry of readdirSync(directory)) {
    if (entry !== ".git") rmSync(join(directory, entry), { recursive: true, force: true });
  }
  cpSync(resolve(root, "dist"), directory, { recursive: true });
  writeFileSync(join(directory, ".nojekyll"), "");
  run("git", ["add", "--all"], directory);
  const changes = spawnSync("git", ["diff", "--cached", "--quiet"], { cwd: directory });
  if (changes.status === 1) {
    run("git", ["commit", "-m", "Publish production website"], directory);
    run("git", ["push", "origin", "gh-pages"], directory);
  } else if (changes.status !== 0) {
    throw new Error("Unable to inspect the production bundle.");
  }
  console.log(`Published bundle: https://github.com/${repository}/tree/gh-pages`);
} finally {
  rmSync(directory, { recursive: true, force: true });
}
