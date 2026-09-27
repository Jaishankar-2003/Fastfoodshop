// "use client";

// import { useState } from "react";
// import { createClient } from "@/lib/supabase/client";
// import { createIdempotencyKey } from "@/lib/idempotency";

// type Props = {
//   shopId: string;
//   folder: "products" | "shop";
//   value: string;
//   onChange: (url: string) => void;
// };

// export function ImageUpload({ shopId, folder, value, onChange }: Props) {
//   const [busy, setBusy] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   async function onFile(file: File | undefined) {
//     if (!file) return;
//     setBusy(true);
//     setError(null);
//     try {
//       const supabase = createClient();
//       const ext = file.name.split(".").pop() ?? "jpg";
//       const path = `${shopId}/${folder}/${crypto.randomUUID()}.${ext}`;
//       const { error: uploadError } = await supabase.storage.from("shop-media").upload(path, file, { upsert: true });
//       if (uploadError) throw uploadError;
//       const { data } = supabase.storage.from("shop-media").getPublicUrl(path);
//       onChange(data.publicUrl);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Upload failed.");
//     } finally {
//       setBusy(false);
//     }
//   }

//   return (
//     <div>
//       <p className="text-sm font-semibold">Image</p>
//       {value ? (
//         // eslint-disable-next-line @next/next/no-img-element
//         <img src={value} alt="" className="mt-2 h-24 w-24 rounded-xl object-cover" />
//       ) : null}
//       <input
//         type="file"
//         accept="image/*"
//         className="mt-2 w-full text-sm"
//         disabled={busy}
//         onChange={(e) => void onFile(e.target.files?.[0])}
//       />
//       {busy ? <p className="text-xs text-muted">Uploading…</p> : null}
//       {error ? <p className="text-xs text-red-600">{error}</p> : null}
//     </div>
//   );
// }



"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createIdempotencyKey } from "@/lib/idempotency";

type Props = {
  shopId: string;
  folder: "products" | "shop";
  value: string;
  onChange: (url: string) => void;
};

export function ImageUpload({ shopId, folder, value, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;

    setBusy(true);
    setError(null);

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

      onChange(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="text-sm font-semibold">Image</p>

      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt=""
          className="mt-2 h-24 w-24 rounded-xl object-cover"
        />
      ) : null}

      <input
        type="file"
        accept="image/*"
        className="mt-2 w-full text-sm"
        disabled={busy}
        onChange={(e) => void onFile(e.target.files?.[0])}
      />

      {busy ? (
        <p className="text-xs text-muted">Uploading…</p>
      ) : null}

      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : null}
    </div>
  );
}

