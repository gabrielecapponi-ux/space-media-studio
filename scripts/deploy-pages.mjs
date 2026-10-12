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

// This branch may host other sites and domain configuration. Extend this
// explicit list when Space Media adds a new root entry to its build.
const ownedProductionPaths = new Set([
  "index.html", "favicon.svg", ".nojekyll", "assets", "films", "fonts",
  "images", "licenses", "previews",
]);

function validateBundleTree(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) validateBundleTree(join(directory, entry.name));
    else if (!entry.isFile()) throw new Error(`Unsupported bundle entry: ${join(directory, entry.name)}`);
  }
}

export function replaceProductionBundle(bundleDirectory, destinationDirectory) {
  if (resolve(bundleDirectory) === resolve(destinationDirectory)) {
    throw new Error("The production bundle and publishing checkout must be separate directories.");
  }
  const entries = readdirSync(bundleDirectory, { withFileTypes: true });
  if (!entries.some((entry) => entry.name === "index.html" && entry.isFile())) {
    throw new Error("The production bundle must contain an index.html file.");
  }
  // Validate everything before making changes. An unexpected built root path
  // must never become permission to replace an unrelated deployed directory.
  for (const entry of entries) {
    if (!ownedProductionPaths.has(entry.name)) {
      throw new Error(`Unowned production path: ${entry.name}. Add an intentional Space Media path to ownedProductionPaths before publishing.`);
    }
  }
  validateBundleTree(bundleDirectory);
  for (const entry of ownedProductionPaths) {
    rmSync(join(destinationDirectory, entry), { recursive: true, force: true });
  }
  for (const entry of entries) {
    cpSync(join(bundleDirectory, entry.name), join(destinationDirectory, entry.name), {
      recursive: true, force: false, errorOnExist: true,
    });
  }
  writeFileSync(join(destinationDirectory, ".nojekyll"), "");
}

function publish() {
  // Publish only Space Media's production paths; preserve the source checkout,
  // other deployed sites and deployment history. Never copy credentials.
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
    replaceProductionBundle(resolve(root, "dist"), directory);
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
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) publish();
