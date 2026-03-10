import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { withAuth } from "@/lib/auth";

export const POST = withAuth(async (request, { session }) => {
    const { token } = await request.json();

    if (!token) {
        return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const { data: invite } = await supabase
        .from("shared_team_invites")
        .select("*, shared_teams(name)")
        .eq("token", token)
        .single();

    if (!invite) {
        return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
    }

    if (invite.accepted_at) {
        return NextResponse.json({ error: "Invite already accepted" }, { status: 409 });
    }

    if (new Date(invite.expires_at) < new Date()) {
        return NextResponse.json({ error: "Invite expired" }, { status: 410 });
    }

    // Check if already a member
    const { data: existing } = await supabase
        .from("shared_team_members")
        .select("id")
        .eq("team_id", invite.team_id)
        .eq("user_id", session.sharedUserId)
        .single();

    if (existing) {
        return NextResponse.json({ error: "Already a member" }, { status: 409 });
    }

    // Add to team
    await supabase
        .from("shared_team_members")
        .insert({ team_id: invite.team_id, user_id: session.sharedUserId, role: invite.role });

    // Mark invite as accepted
    await supabase
        .from("shared_team_invites")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", invite.id);

    return NextResponse.json({
        ok: true,
        teamId: invite.team_id,
        teamName: invite.shared_teams?.name,
        role: invite.role,
    });
});
