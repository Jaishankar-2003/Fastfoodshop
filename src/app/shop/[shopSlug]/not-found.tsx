export default function ShopNotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold text-brand">Invalid shop URL</p>
      <h1 className="display mt-2 text-3xl">Shop not found</h1>
      <p className="mt-3 text-muted">This QR or link does not match an active shop.</p>
    </main>
  );
}
