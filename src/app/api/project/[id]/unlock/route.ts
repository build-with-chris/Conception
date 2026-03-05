import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { isProjectUnlocked } from "@/lib/unlock-cookie";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** Liefert, ob das Projekt passwortgeschützt ist und ob der Zugriff per Cookie entsperrt ist. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    if (!projectId) {
      return NextResponse.json({ unlocked: false, passwordProtected: false }, { status: 400 });
    }
    const { data: project } = await supabase
      .from("projects")
      .select("password_protected, password_hash")
      .eq("id", projectId)
      .maybeSingle();
    const row = project as { password_protected: boolean; password_hash: string | null } | null;
    const passwordProtected = row?.password_protected === true && !!row?.password_hash;

    const unlocked = await isProjectUnlocked(projectId);
    return NextResponse.json({ unlocked, passwordProtected });
  } catch (e) {
    console.error("Unlock check error:", e);
    return NextResponse.json({ unlocked: false, passwordProtected: false }, { status: 500 });
  }
}
