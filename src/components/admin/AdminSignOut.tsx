"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AdminSignOut() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={signOut} className="h-10 rounded-full px-3 text-sm font-semibold text-muted">
      Sign out
    </button>
  );
}
