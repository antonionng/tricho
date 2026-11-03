import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/** Every source file in the hub and its components. */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) return files(p);
    return /\.tsx?$/.test(f) && !f.endsWith(".test.ts") ? [p] : [];
  });
}

const root = path.resolve(__dirname, "../..");
const hubFiles = [...files(path.join(root, "app/hub")), ...files(path.join(root, "components/hub"))];

describe("the hub stays apart from the member area", () => {
  it("has source files to check", () => {
    expect(hubFiles.length).toBeGreaterThan(5);
  });

  it.each(hubFiles.map((f) => [path.relative(root, f), f]))("%s never links into /members or the community", (_, file) => {
    const src = readFileSync(file, "utf8");
    expect(src).not.toMatch(/["'`]\/members/);
    expect(src).not.toMatch(/["'`]\/community/);
    expect(src).not.toMatch(/MemberShell|SiteFooter/);
  });
});
