import Link from "next/link";

export default function FoldersPage() {
  return (
    <div className="flex h-full items-center justify-center p-10 text-center">
      <div className="max-w-md">
        <span className="material-symbols-outlined text-[36px] text-primary">folder</span>
        <h1 className="mt-3 font-headline-lg text-4xl font-bold text-on-surface">Folders</h1>
        <p className="mt-3 text-body-sm text-on-surface-variant">
          Folder organization is not available on the API yet. Browse, upload, and share files from the media library.
        </p>
        <Link href="/dashboard#library" className="mt-5 inline-block text-sm text-primary">
          Open media library
        </Link>
      </div>
    </div>
  );
}
