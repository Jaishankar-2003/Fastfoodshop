import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <p className="text-sm font-semibold text-brand">SHOP OWNER</p>
      <h1 className="display mt-2 text-4xl">Admin sign in</h1>
      <p className="mt-3 text-sm text-muted">Customers never need an account. Only the shop owner signs in here.</p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
