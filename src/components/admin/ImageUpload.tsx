"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { createIdempotencyKey } from "@/lib/idempotency";

type Props = {
  shopId: string;
  folder: "products" | "shop";
  value: string;
  onChange: (url: string) => void;
};

const VALID_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "svg", "avif"];

export function ImageUpload({ shopId, folder, value, onChange }: Props) {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState(value ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);

  // Sync internal urlInput when parent value changes
  useEffect(() => {
    setUrlInput(value ?? "");
    setPreviewError(false);
  }, [value]);

  async function onFile(file: File | undefined) {
    if (!file) return;

    setBusy(true);
    setError(null);
    setPreviewError(false);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";

      const path = `${shopId}/${folder}/${createIdempotencyKey()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("shop-media")
        .upload(path, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("shop-media")
        .getPublicUrl(path);

      const uploadedUrl = data.publicUrl;
      setUrlInput(uploadedUrl);
      onChange(uploadedUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  function validateAndApplyUrl(input: string) {
    const trimmed = input.trim();
    setPreviewError(false);

    if (!trimmed) {
      setError(null);
      onChange("");
      return;
    }

    // Must start with http:// or https://
    if (!/^https?:\/\//i.test(trimmed)) {
      setError("URL must start with http:// or https://");
      return;
    }

    // Must point to a valid image format or image host
    const hasImageExt = VALID_IMAGE_EXTENSIONS.some((ext) =>
      trimmed.toLowerCase().includes(`.${ext}`)
    );
    const isKnownImageHost = /(unsplash\.com|cloudinary\.com|imgur\.com|supabase\.co|googleusercontent\.com|pinimg\.com|fbcdn\.net|cdn\.)/i.test(
      trimmed
    );

    if (!hasImageExt && !isKnownImageHost) {
      setError(
        "URL must point to a valid image file (.jpg, .jpeg, .png, .webp, .gif, .svg, .avif)"
      );
      return;
    }

    // Test image loading in browser
    const img = new Image();
    img.onload = () => {
      setError(null);
      setPreviewError(false);
      onChange(trimmed);
    };
    img.onerror = () => {
      setError("Unable to load image from URL. Please ensure it is a valid public image link.");
    };
    img.src = trimmed;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground">
          Product Image
        </label>
        {value ? (
          <button
            type="button"
            onClick={() => {
              setUrlInput("");
              setError(null);
              setPreviewError(false);
              onChange("");
            }}
            className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline"
          >
            Remove Image
          </button>
        ) : null}
      </div>

      {/* Mode Switcher */}
      <div className="flex rounded-xl bg-muted/20 p-1 ring-1 ring-line">
        <button
          type="button"
          onClick={() => {
            setMode("upload");
            setError(null);
          }}
          className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
            mode === "upload"
              ? "bg-card text-foreground shadow-sm ring-1 ring-line"
              : "text-muted hover:text-foreground"
          }`}
        >
          📁 Upload Image
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("url");
            setError(null);
          }}
          className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
            mode === "url"
              ? "bg-card text-foreground shadow-sm ring-1 ring-line"
              : "text-muted hover:text-foreground"
          }`}
        >
          🔗 Image URL
        </button>
      </div>

      {/* Option 1: Upload File */}
      {mode === "upload" ? (
        <div>
          <input
            type="file"
            accept="image/*"
            className="w-full text-sm text-muted file:mr-3 file:rounded-xl file:border-0 file:bg-brand/10 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-brand hover:file:bg-brand/20"
            disabled={busy}
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          {busy ? (
            <p className="mt-1.5 text-xs font-medium text-brand animate-pulse">
              Uploading file…
            </p>
          ) : null}
        </div>
      ) : (
        /* Option 2: Image URL */
        <div>
          <input
            type="url"
            placeholder="https://images.unsplash.com/..."
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              setError(null);
            }}
            onBlur={(e) => validateAndApplyUrl(e.target.value)}
            className="h-11 w-full rounded-2xl bg-card px-4 text-sm text-foreground ring-1 ring-line placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
          <p className="mt-1 text-[11px] text-muted">
            Paste a direct link starting with http:// or https:// (.jpg, .png, .webp, Unsplash, etc.)
          </p>
        </div>
      )}

      {/* Inline Error Message */}
      {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}

      {/* Active Live Preview */}
      {value ? (
        <div className="flex items-center gap-3 rounded-2xl bg-card p-2.5 ring-1 ring-line">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-orange-50 ring-1 ring-line">
            {!previewError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value}
                alt="Product preview"
                className="h-full w-full object-cover"
                onError={() => setPreviewError(true)}
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-red-50 p-1 text-center text-[10px] font-semibold text-red-500">
                ⚠️ Invalid Image
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-foreground">
              Live Image Preview
            </p>
            <p className="mt-0.5 truncate text-[11px] text-muted" title={value}>
              {value}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}


