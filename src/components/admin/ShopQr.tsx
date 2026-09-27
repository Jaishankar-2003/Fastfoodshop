"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { appUrl } from "@/lib/env";

export function ShopQr({ slug, name }: { slug: string; name: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const shopUrl = `${typeof window !== "undefined" ? window.location.origin : appUrl()}/shop/${slug}`;

  useEffect(() => {
    const url = `${window.location.origin}/shop/${slug}`;
    QRCode.toDataURL(url, { margin: 1, width: 480, color: { dark: "#1c140d", light: "#ffffff" } })
      .then(setDataUrl)
      .catch(() => undefined);
  }, [slug]);

  return (
    <div className="max-w-md rounded-3xl bg-card p-5 text-center ring-1 ring-line">
      <h2 className="display text-2xl">{name}</h2>
      <p className="mt-1 text-sm text-muted">Print this and stick it on the stall.</p>
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt="Shop QR code" className="mx-auto mt-4 h-64 w-64" />
      ) : (
        <p className="mt-8 text-muted">Generating QR…</p>
      )}
      <p className="mt-4 break-all text-sm font-semibold">{shopUrl}</p>
      <a
        href={dataUrl ?? "#"}
        download={`${slug}-qr.png`}
        className="mt-5 inline-flex h-12 items-center rounded-2xl bg-brand px-5 font-bold text-white"
      >
        Download QR
      </a>
    </div>
  );
}
