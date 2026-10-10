"use client";

import { createClient } from "@/lib/supabase/client";

export function AdminSignOut() {

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  }

  return (
    <button type="button" onClick={signOut} className="h-10 rounded-full px-3 text-sm font-semibold text-muted">
      Sign out
    </button>
  );
}
