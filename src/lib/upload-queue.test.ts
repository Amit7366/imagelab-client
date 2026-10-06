import { describe, expect, it } from "vitest";
import {
  ACCEPT,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_FILES,
  allowedQueueFiles,
  filesToQueue,
  folderPathsToEnsure,
  isAllowedFile,
  parentFolderPath,
  relativeFilePath,
} from "./upload-queue";

function fakeFile(name: string, options: { type?: string; size?: number; relativePath?: string } = {}) {
  const size = options.size ?? 128;
  const type = options.type ?? "image/png";
  const file = new File([new Uint8Array(size)], name, { type });
  if (options.relativePath) {
    Object.defineProperty(file, "webkitRelativePath", { value: options.relativePath, configurable: true });
  }
  return file;
}

describe("upload queue", () => {
  it("accepts images and pdfs only", () => {
    expect(isAllowedFile(fakeFile("a.png", { type: "image/png" }))).toBe(true);
    expect(isAllowedFile(fakeFile("a.pdf", { type: "application/pdf" }))).toBe(true);
    expect(isAllowedFile(fakeFile("a.svg", { type: "image/svg+xml" }))).toBe(false);
    expect(isAllowedFile(fakeFile("a.txt", { type: "text/plain" }))).toBe(false);
    expect(ACCEPT).toContain("image/png");
  });

  it("reads relative paths from folder picks", () => {
    const file = fakeFile("cover.png", { relativePath: "Campaign/Heroes/cover.png" });
    expect(relativeFilePath(file)).toBe("Campaign/Heroes/cover.png");
    expect(parentFolderPath("Campaign/Heroes/cover.png")).toBe("Campaign/Heroes");
    expect(parentFolderPath("cover.png")).toBe("");
  });

  it("skips hidden, oversized, and disallowed files", () => {
    const items = filesToQueue([
      fakeFile(".DS_Store", { type: "application/octet-stream", relativePath: "Campaign/.DS_Store" }),
      fakeFile("big.png", { type: "image/png", size: MAX_UPLOAD_BYTES + 1 }),
      fakeFile("notes.txt", { type: "text/plain" }),
      fakeFile("ok.png", { type: "image/png", relativePath: "Campaign/ok.png" }),
    ]);
    expect(items.filter((item) => item.status === "skipped")).toHaveLength(3);
    expect(allowedQueueFiles(items)).toHaveLength(1);
    expect(folderPathsToEnsure(items)).toEqual(["Campaign"]);
  });

  it("keeps empty folders and sorts ensure paths by depth", () => {
    const items = filesToQueue(
      [fakeFile("a.png", { type: "image/png", relativePath: "A/B/a.png" })],
      ["A/Empty", "A/B/AlsoEmpty"],
    );
    expect(folderPathsToEnsure(items)).toEqual(["A/B", "A/Empty", "A/B/AlsoEmpty"]);
  });

  it("caps allowed files per confirm", () => {
    const files = Array.from({ length: 3 }, (_, i) => fakeFile(`f${i}.png`, { type: "image/png" }));
    const items = filesToQueue(files, [], 2);
    expect(allowedQueueFiles(items)).toHaveLength(2);
    expect(items.find((item) => item.skip)?.skip).toContain(String(2));
    expect(MAX_UPLOAD_FILES).toBe(200);
  });
});
