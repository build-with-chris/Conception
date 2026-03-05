import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import bcrypt from "bcryptjs";
import { createUnlockCookie } from "@/lib/unlock-cookie";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, password } = body as { projectId?: string; password?: string };
    if (!projectId || typeof password !== "string") {
      return NextResponse.json({ error: "projectId und password erforderlich" }, { status: 400 });
    }

    const { data, error: fetchError } = await supabase
      .from("projects")
      .select("id, password_protected, password_hash")
      .eq("id", projectId)
      .maybeSingle();

    if (fetchError || !data) {
      return NextResponse.json({ error: "Projekt nicht gefunden" }, { status: 404 });
    }
    const project = data as { id: string; password_protected: boolean; password_hash: string | null };
    if (!project.password_protected) {
      return NextResponse.json({ error: "Projekt ist nicht passwortgeschützt" }, { status: 400 });
    }
    if (!project.password_hash) {
      return NextResponse.json({
        error: "Passwort wurde noch nicht eingerichtet. Bitte einloggen und unter Bearbeiten ein Passwort setzen.",
        code: "NO_PASSWORD_SET",
      }, { status: 400 });
    }

    const valid = await bcrypt.compare(password, project.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Falsches Passwort" }, { status: 401 });
    }

    const { name, value, maxAge } = createUnlockCookie(project.id);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(name, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
      path: "/",
    });
    return res;
  } catch (e) {
    console.error("Unlock error:", e);
    return NextResponse.json({ error: "Fehler beim Entsperren" }, { status: 500 });
  }
}
