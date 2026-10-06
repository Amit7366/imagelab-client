export const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/avif,application/pdf";
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_UPLOAD_FILES = 200;

export type QueueKind = "file" | "folder";
export type QueueStatus = "queued" | "uploading" | "done" | "failed" | "skipped";

export interface QueueItem {
  id: string;
  kind: QueueKind;
  name: string;
  relativePath: string;
  size: number;
  file?: File;
  skip?: string;
  status: QueueStatus;
  progress: number;
  error?: string;
  url?: string;
}

let queueSeq = 0;

function nextId() {
  queueSeq += 1;
  return `q-${queueSeq}`;
}

export function isAllowedFile(file: File) {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return true;
  return file.type.startsWith("image/") && file.type !== "image/svg+xml";
}

function isHidden(name: string) {
  return name.startsWith(".") || name === "Thumbs.db" || name === "desktop.ini";
}

export function parentFolderPath(relativePath: string) {
  const normalized = relativeFilePath(relativePath);
  const slash = normalized.lastIndexOf("/");
  if (slash <= 0) return "";
  return normalized.slice(0, slash);
}

export function relativeFilePath(file: File | string) {
  if (typeof file === "string") return file.replace(/\\/g, "/").replace(/^\/+/, "");
  const relative = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  return (relative || file.name).replace(/\\/g, "/").replace(/^\/+/, "");
}

function skipReason(file: File): string | undefined {
  if (isHidden(file.name)) return "Hidden file";
  if (!isAllowedFile(file)) return "Use JPEG, PNG, WebP, GIF, AVIF, or PDF";
  if (file.size > MAX_UPLOAD_BYTES) return "Larger than 10 MB";
  return undefined;
}

export function filesToQueue(files: File[], emptyFolders: string[] = [], cap = MAX_UPLOAD_FILES): QueueItem[] {
  const items: QueueItem[] = [];
  let allowed = 0;

  for (const path of emptyFolders) {
    const relativePath = relativeFilePath(path);
    if (!relativePath || isHidden(relativePath.split("/").pop() ?? "")) continue;
    items.push({
      id: nextId(),
      kind: "folder",
      name: relativePath.split("/").pop() ?? relativePath,
      relativePath,
      size: 0,
      status: "queued",
      progress: 0,
    });
  }

  for (const file of files) {
    const relativePath = relativeFilePath(file);
    const skip = skipReason(file) ?? (allowed >= cap ? `Only ${cap} files per upload` : undefined);
    if (!skip) allowed += 1;
    items.push({
      id: nextId(),
      kind: "file",
      name: file.name,
      relativePath,
      size: file.size,
      file,
      skip,
      status: skip ? "skipped" : "queued",
      progress: skip ? 0 : 0,
      error: skip,
    });
  }

  return items;
}

export function allowedQueueFiles(items: QueueItem[]) {
  return items.filter((item) => item.kind === "file" && item.file && !item.skip);
}

export function folderPathsToEnsure(items: QueueItem[]) {
  const paths = new Set<string>();
  for (const item of items) {
    if (item.skip) continue;
    if (item.kind === "folder") {
      if (item.relativePath) paths.add(item.relativePath);
      continue;
    }
    const parent = parentFolderPath(item.relativePath);
    if (parent) paths.add(parent);
  }
  return [...paths].sort((a, b) => a.split("/").length - b.split("/").length || a.localeCompare(b));
}

type FsEntry = {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  file: (ok: (file: File) => void, err?: (error: DOMException) => void) => void;
  createReader: () => { readEntries: (ok: (entries: FsEntry[]) => void, err?: (error: DOMException) => void) => void };
};

async function readAllEntries(reader: { readEntries: (ok: (entries: FsEntry[]) => void, err?: (error: DOMException) => void) => void }) {
  const all: FsEntry[] = [];
  for (;;) {
    const batch = await new Promise<FsEntry[]>((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
    if (!batch.length) return all;
    all.push(...batch);
  }
}

async function walkEntry(entry: FsEntry, prefix: string, files: File[], emptyFolders: string[]) {
  const path = prefix ? `${prefix}/${entry.name}` : entry.name;
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) => entry.file(resolve, reject));
    Object.defineProperty(file, "webkitRelativePath", { value: path, configurable: true });
    files.push(file);
    return;
  }
  if (!entry.isDirectory) return;
  const children = await readAllEntries(entry.createReader());
  if (children.length === 0) emptyFolders.push(path);
  for (const child of children) {
    await walkEntry(child, path, files, emptyFolders);
  }
}

export async function collectDropped(data: DataTransfer): Promise<{ files: File[]; emptyFolders: string[] }> {
  const files: File[] = [];
  const emptyFolders: string[] = [];
  const items = [...data.items];
  const entries = items
    .map((item) => ("webkitGetAsEntry" in item ? (item.webkitGetAsEntry() as FsEntry | null) : null))
    .filter((entry): entry is FsEntry => Boolean(entry));

  if (entries.length) {
    for (const entry of entries) {
      await walkEntry(entry, "", files, emptyFolders);
    }
    return { files, emptyFolders };
  }

  return { files: [...data.files], emptyFolders };
}
