import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { delimiter, join } from "node:path";
import { tmpdir } from "node:os";
import { extractCommittedSource, parseReleaseArgs, replaceProductionBundle } from "./deploy-pages.mjs";

let groups = 0;
function test(name, check) {
  const root = mkdtempSync(join(tmpdir(), "space-deploy-test-"));
  try {
    const bundle = join(root, "bundle");
    const destination = join(root, "pages");
    mkdirSync(bundle);
    mkdirSync(destination);
    writeFileSync(join(bundle, "index.html"), "new home");
    writeFileSync(join(destination, "index.html"), "old home");
    check({ root, bundle, destination });
    groups += 1;
    console.log(`PASS ${name}`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("Replaces owned files and preserves client site and domain configuration", ({ bundle, destination }) => {
  mkdirSync(join(destination, "mrsmeet"));
  writeFileSync(join(destination, "mrsmeet", "index.html"), "client home");
  writeFileSync(join(destination, "CNAME"), "example.test");
  mkdirSync(join(destination, "assets"));
  writeFileSync(join(destination, "assets", "old.js"), "old");
  replaceProductionBundle(bundle, destination);
  assert.equal(readFileSync(join(destination, "index.html"), "utf8"), "new home");
  assert.equal(readFileSync(join(destination, "mrsmeet", "index.html"), "utf8"), "client home");
  assert.equal(readFileSync(join(destination, "CNAME"), "utf8"), "example.test");
  assert.equal(existsSync(join(destination, "assets", "old.js")), false);
  assert.equal(existsSync(join(destination, ".nojekyll")), true);
});

test("Rejects an unknown root without changing the previous home", ({ bundle, destination }) => {
  mkdirSync(join(bundle, "mrsmeet"));
  assert.throws(() => replaceProductionBundle(bundle, destination), /Unowned production path/);
  assert.equal(readFileSync(join(destination, "index.html"), "utf8"), "old home");
});

test("Rejects a nested symlink without changing the previous home", ({ root, bundle, destination }) => {
  mkdirSync(join(bundle, "assets"));
  writeFileSync(join(root, "private.txt"), "private");
  symlinkSync(join(root, "private.txt"), join(bundle, "assets", "private.txt"));
  assert.throws(() => replaceProductionBundle(bundle, destination), /Unsupported bundle entry/);
  assert.equal(readFileSync(join(destination, "index.html"), "utf8"), "old home");
});

test("Rejects source inside destination before any deletion", ({ destination }) => {
  const nested = join(destination, "assets", "bundle");
  mkdirSync(nested, { recursive: true });
  writeFileSync(join(nested, "index.html"), "nested home");
  assert.throws(() => replaceProductionBundle(nested, destination), /non-nested directories/);
  assert.equal(readFileSync(join(destination, "index.html"), "utf8"), "old home");
  assert.equal(readFileSync(join(nested, "index.html"), "utf8"), "nested home");
});

test("Rejects destination inside source and identical paths", ({ bundle }) => {
  const nested = join(bundle, "assets");
  mkdirSync(nested);
  assert.throws(() => replaceProductionBundle(bundle, nested), /non-nested directories/);
  assert.throws(() => replaceProductionBundle(bundle, bundle), /non-nested directories/);
  assert.equal(readFileSync(join(bundle, "index.html"), "utf8"), "new home");
});

test("Resolves directory aliases before checking overlap", ({ root, destination }) => {
  const alias = join(root, "alias");
  symlinkSync(destination, alias);
  assert.throws(() => replaceProductionBundle(alias, destination), /non-nested directories/);
  assert.equal(readFileSync(join(destination, "index.html"), "utf8"), "old home");
});

test("Requires an explicit source ref and rejects extra options", () => {
  assert.equal(parseReleaseArgs(["--ref", "HEAD"]), "HEAD");
  for (const args of [[], ["--ref"], ["--ref", ""], ["--ref", "--help"], ["--ref", "HEAD", "extra"]]) {
    assert.throws(() => parseReleaseArgs(args), /Usage:/);
  }
});

const archiveRoot = mkdtempSync(join(tmpdir(), "space-archive-test-"));
try {
  const repository = join(archiveRoot, "repository");
  mkdirSync(repository);
  const git = (...args) => execFileSync("git", args, { cwd: repository, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git("init", "-b", "main");
  writeFileSync(join(repository, "index.html"), "committed home");
  git("add", "index.html");
  git("-c", "user.name=Deploy Test", "-c", "user.email=deploy@example.test", "commit", "-m", "Initial fixture");
  const commit = git("rev-parse", "HEAD");
  writeFileSync(join(repository, "later.txt"), "later commit");
  git("add", "later.txt");
  git("-c", "user.name=Deploy Test", "-c", "user.email=deploy@example.test", "commit", "-m", "Later fixture");
  writeFileSync(join(repository, "index.html"), "dirty home");
  writeFileSync(join(repository, "private.txt"), "untracked local content");
  const status = git("status", "--porcelain");
  const destination = join(archiveRoot, "extracted");
  await extractCommittedSource(repository, commit, destination);
  assert.equal(readFileSync(join(destination, "index.html"), "utf8"), "committed home");
  for (const excluded of ["later.txt", "private.txt", ".git"]) assert.equal(existsSync(join(destination, excluded)), false);
  assert.equal(readFileSync(join(repository, "index.html"), "utf8"), "dirty home");
  assert.equal(git("status", "--porcelain"), status);
  groups += 1;
  console.log("PASS Streams the exact immutable commit and preserves dirty/untracked source files");

  const invalidDestination = join(archiveRoot, "invalid");
  let continued = false;
  await assert.rejects(async () => {
    await extractCommittedSource(repository, "f".repeat(40), invalidDestination);
    continued = true;
  }, (error) => error instanceof AggregateError && error.errors.some((cause) => /git archive failed/.test(cause.message)));
  assert.equal(continued, false);
  assert.equal(existsSync(invalidDestination), false);
  assert.equal(git("status", "--porcelain"), status);
  groups += 1;
  console.log("PASS Rejects a missing commit, prevents continuation and cleans partial extraction");

  await assert.rejects(() => extractCommittedSource(repository, commit, destination), /EEXIST/);
  assert.equal(readFileSync(join(destination, "index.html"), "utf8"), "committed home");
  groups += 1;
  console.log("PASS Never replaces or cleans an existing extraction directory");

  const toolDirectory = join(archiveRoot, "tools");
  mkdirSync(toolDirectory);
  const failingTar = join(toolDirectory, "tar");
  writeFileSync(failingTar, `#!${process.execPath}\nconst fs = require("node:fs");\nconst path = require("node:path");\nfs.writeFileSync(path.join(process.argv.at(-1), "partial.txt"), "partial");\nprocess.stderr.write("intentional extractor failure");\nprocess.exit(23);\n`);
  chmodSync(failingTar, 0o755);
  const failingDestination = join(archiveRoot, "failed-extraction");
  const originalPath = process.env.PATH;
  try {
    process.env.PATH = `${toolDirectory}${delimiter}${originalPath || ""}`;
    await assert.rejects(() => extractCommittedSource(repository, commit, failingDestination),
      (error) => error instanceof AggregateError && error.errors.some((cause) => /tar extraction failed.*intentional extractor failure/.test(cause.message)));
  } finally {
    if (originalPath === undefined) delete process.env.PATH;
    else process.env.PATH = originalPath;
  }
  assert.equal(existsSync(failingDestination), false);
  assert.equal(git("status", "--porcelain"), status);
  groups += 1;
  console.log("PASS Propagates extractor failure and cleans partially written files");
} finally {
  rmSync(archiveRoot, { recursive: true, force: true });
}

console.log(JSON.stringify({ groups, browser: false, remoteRequests: false }));
