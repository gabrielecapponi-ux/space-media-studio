import { execFileSync, spawn, spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readdirSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";

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
  "images", "licenses", "previews", "atelier.html", "showcase",
  "models", // Space Media's Blender intro; the client sites remain separate roots.
]);

function validateBundleTree(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) validateBundleTree(join(directory, entry.name));
    else if (!entry.isFile()) throw new Error(`Unsupported bundle entry: ${join(directory, entry.name)}`);
  }
}

export function replaceProductionBundle(bundleDirectory, destinationDirectory) {
  const source = realpathSync(bundleDirectory);
  const destination = realpathSync(destinationDirectory);
  const contains = (parent, child) => {
    const path = relative(parent, child);
    return path === "" || (!isAbsolute(path) && path !== ".." && !path.startsWith(`..${sep}`));
  };
  if (contains(source, destination) || contains(destination, source)) {
    throw new Error("The production bundle and publishing checkout must be separate, non-nested directories.");
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

export function parseReleaseArgs(args) {
  if (args.length !== 2 || args[0] !== "--ref" || !args[1] || args[1].startsWith("-")) {
    throw new Error("Usage: npm run deploy -- --ref <committed-and-pushed-source-ref>");
  }
  return args[1];
}

export async function extractCommittedSource(repositoryDirectory, commit, sourceDirectory) {
  // Own only a newly created directory. Never clean up a caller's existing path.
  mkdirSync(sourceDirectory);
  let archive;
  let extract;
  const observe = (child, label) => {
    let stderr = "";
    let spawnError;
    child.stderr.on("data", (chunk) => { stderr = (stderr + chunk.toString()).slice(-65536); });
    child.on("error", (error) => { spawnError = error; });
    return new Promise((resolveResult) => {
      child.on("close", (code, signal) => resolveResult(
        spawnError || code !== 0
          ? new Error(`${label} failed (${spawnError?.message || signal || code}): ${stderr.trim()}`)
          : null,
      ));
    });
  };
  try {
    if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error("The source archive requires an immutable commit SHA.");
    archive = spawn("git", ["archive", "--format=tar", commit], {
      cwd: repositoryDirectory, stdio: ["ignore", "pipe", "pipe"],
    });
    const archiveResult = observe(archive, "git archive");
    extract = spawn("tar", ["-xf", "-", "-C", sourceDirectory], {
      cwd: repositoryDirectory, stdio: ["pipe", "ignore", "pipe"],
    });
    const extractResult = observe(extract, "tar extraction");
    const streamResult = pipeline(archive.stdout, extract.stdin).then(() => null, (error) => {
      archive.kill();
      extract.kill();
      return error;
    });
    const errors = (await Promise.all([archiveResult, extractResult, streamResult])).filter(Boolean);
    if (errors.length) throw new AggregateError(errors, `Source extraction failed: ${errors.map((error) => error.message).join("; ")}`);
  } catch (error) {
    archive?.kill();
    extract?.kill();
    rmSync(sourceDirectory, { recursive: true, force: true });
    throw error;
  }
}

async function publish(sourceRef) {
  // Resolve once before network work. Never build the mutable working folder.
  const commit = read("git", ["rev-parse", "--verify", "--end-of-options", `${sourceRef}^{commit}`]);
  const release = mkdtempSync(join(tmpdir(), "space-media-release-"));
  const sourceDirectory = join(release, "source");
  const bundleDirectory = join(release, "bundle");
  const directory = join(release, "pages");
  try {
    // Verify remote main, then archive the immutable commit already in this
    // repository. Dirty workspace files and other clients' local edits are never
    // copied. This avoids duplicating the complete media history on a small disk.
    const remoteHead = read("git", ["ls-remote", "--heads", remote, "refs/heads/main"]).split(/\s+/)[0];
    if (!/^[a-f0-9]{40}$/.test(remoteHead)) throw new Error("Remote main could not be resolved.");
    run("git", ["fetch", "--no-tags", remote, remoteHead]);
    const publishedSource = spawnSync("git", ["merge-base", "--is-ancestor", commit, remoteHead], { cwd: root });
    if (publishedSource.status !== 0) {
      throw new Error(`Source ${commit} is not available on remote main. Push the intended source commit before deploying.`);
    }
    await extractCommittedSource(root, commit, sourceDirectory);
    run("npm", ["ci"], sourceDirectory);
    run("npm", ["test"], sourceDirectory);
    run("npm", ["run", "build"], sourceDirectory);
    renameSync(join(sourceDirectory, "dist"), bundleDirectory);
    rmSync(sourceDirectory, { recursive: true, force: true });
    const exists = read("git", ["ls-remote", "--heads", remote, "refs/heads/gh-pages"]);
    if (exists) {
      run("git", ["clone", "--depth", "1", "--single-branch", "--branch", "gh-pages", remote, directory]);
    } else {
      mkdirSync(directory);
      run("git", ["init", "-b", "gh-pages"], directory);
      run("git", ["remote", "add", "origin", remote], directory);
    }
    const identity = read("git", ["var", "GIT_COMMITTER_IDENT"]).match(/^(.+) <([^>]+)> \d+ [+-]\d+$/);
    if (!identity) throw new Error("Unable to resolve the current Git committer identity.");
    run("git", ["config", "user.name", identity[1]], directory);
    run("git", ["config", "user.email", identity[2]], directory);
    replaceProductionBundle(bundleDirectory, directory);
    run("git", ["add", "--all"], directory);
    const changes = spawnSync("git", ["diff", "--cached", "--quiet"], { cwd: directory });
    if (changes.status === 1) {
      run("git", ["commit", "-m", `Publish Space Media from ${commit}`], directory);
      run("git", ["push", "origin", "gh-pages"], directory);
    } else if (changes.status !== 0) {
      throw new Error("Unable to inspect the production bundle.");
    }
    console.log(`Pages branch updated from source ${commit}: https://github.com/${repository}/tree/gh-pages`);
    console.log("Verify the GitHub Pages job and public URL before recording a publication time.");
  } finally {
    rmSync(release, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await publish(parseReleaseArgs(process.argv.slice(2)));
