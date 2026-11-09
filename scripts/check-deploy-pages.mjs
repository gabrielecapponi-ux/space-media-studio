import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parseReleaseArgs, replaceProductionBundle } from "./deploy-pages.mjs";

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

console.log(JSON.stringify({ groups, browser: false, remoteRequests: false }));
