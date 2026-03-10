import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { withAuth } from "@/lib/auth";

export const GET = withAuth(async (_request, { session }) => {
    const { data: invites } = await supabase
        .from("shared_team_invites")
        .select("id, token, role, expires_at, shared_teams(name), shared_users!shared_team_invites_invited_by_fkey(display_name, email)")
        .eq("email", session.email.toLowerCase())
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString());

    const formatted = (invites || []).map((inv: any) => ({
        id: inv.id,
        token: inv.token,
        teamName: inv.shared_teams?.name,
        role: inv.role,
        invitedBy: inv.shared_users?.display_name ?? inv.shared_users?.email,
        expiresAt: inv.expires_at,
    }));

    return NextResponse.json(formatted);
});
