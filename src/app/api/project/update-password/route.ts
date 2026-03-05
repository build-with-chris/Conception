import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import bcrypt from "bcryptjs";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** Setzt oder ändert das Projektpasswort. Beim Ändern muss das aktuelle Passwort zur Bestätigung mitgegeben werden. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, newPassword, currentPassword } = body as {
      projectId?: string;
      newPassword?: string;
      currentPassword?: string;
    };
    if (!projectId || typeof newPassword !== "string" || !newPassword.trim()) {
      return NextResponse.json({ error: "projectId und newPassword erforderlich" }, { status: 400 });
    }

    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("password_protected, password_hash")
      .eq("id", projectId)
      .maybeSingle();

    if (fetchError || !project) {
      return NextResponse.json({ error: "Projekt nicht gefunden" }, { status: 404 });
    }
    const row = project as { password_protected: boolean; password_hash: string | null };

    if (row.password_hash) {
      const current = typeof currentPassword === "string" ? currentPassword : "";
      const valid = await bcrypt.compare(current, row.password_hash);
      if (!valid) {
        return NextResponse.json({ error: "Aktuelles Passwort ist falsch" }, { status: 401 });
      }
    }

    const hash = await bcrypt.hash(newPassword.trim(), 10);
    // @ts-expect-error Supabase update type inference
    const { error } = await supabase.from("projects").update({ password_protected: true, password_hash: hash }).eq("id", projectId);

    if (error) {
      return NextResponse.json({ error: "Update fehlgeschlagen" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Update password error:", e);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
