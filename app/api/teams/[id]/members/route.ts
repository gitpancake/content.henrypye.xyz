import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { withAuth } from "@/lib/auth";

export const GET = withAuth(async (_request, { session, params }) => {
    const { id } = params;

    const { data: membership } = await supabase
        .from("shared_team_members")
        .select("id")
        .eq("team_id", id)
        .eq("user_id", session.sharedUserId)
        .single();

    if (!membership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: members } = await supabase
        .from("shared_team_members")
        .select("id, user_id, role, joined_at, shared_users(display_name, email, photo_url)")
        .eq("team_id", id)
        .order("joined_at", { ascending: true });

    const formatted = (members || []).map((m: any) => ({
        id: m.id,
        userId: m.user_id,
        role: m.role,
        user: {
            displayName: m.shared_users?.display_name ?? null,
            email: m.shared_users?.email ?? "",
            photoUrl: m.shared_users?.photo_url ?? null,
        },
    }));

    return NextResponse.json(formatted);
});
