"use client";

import { useState, useRef } from "react";
import { uploadMentorImage } from "@/lib/actions/upload";

export function ImageUpload({
  type,
  currentUrl,
  label,
}: {
  type: "avatar" | "banner";
  currentUrl?: string | null;
  label: string;
}) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setError(null);

    const fd = new FormData();
    fd.set("file", file);
    fd.set("type", type);

    const res = await uploadMentorImage(fd);
    setUploading(false);

    if (res.error) {
      setError(res.error);
      setPreview(currentUrl ?? null);
    } else if (res.url) {
      setPreview(res.url);
    }
  }

  const isAvatar = type === "avatar";

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-neutral-300">{label}</p>
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer overflow-hidden border-2 border-dashed border-white/10 transition-colors hover:border-white/20 ${
          isAvatar
            ? "h-24 w-24 rounded-full"
            : "h-36 w-full rounded-xl"
        } ${uploading ? "opacity-60" : ""}`}
      >
        {preview ? (
          <img
            src={preview}
            alt={label}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-500">
            <svg
              className={isAvatar ? "h-8 w-8" : "h-10 w-10"}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
              />
            </svg>
          </div>
        )}
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
      <p className="text-xs text-neutral-500">
        {isAvatar ? "Square, max 2MB" : "Landscape, max 5MB"} · JPG, PNG, or WebP
      </p>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
