import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { withAuth } from "@/lib/auth";

export const GET = withAuth(async (_request, { session }) => {
    const { data: memberships } = await supabase
        .from("shared_team_members")
        .select("team_id, role, shared_teams(id, name)")
        .eq("user_id", session.sharedUserId);

    if (!memberships) return NextResponse.json([]);

    const teams = memberships.map((m: any) => ({
        id: m.shared_teams.id,
        name: m.shared_teams.name,
        role: m.role,
    }));

    return NextResponse.json(teams);
});

export const POST = withAuth(async (request, { session }) => {
    const { name } = await request.json();

    if (!name?.trim()) {
        return NextResponse.json({ error: "Team name required" }, { status: 400 });
    }

    const { data: team, error } = await supabase
        .from("shared_teams")
        .insert({ name: name.trim(), created_by: session.sharedUserId })
        .select("id")
        .single();

    if (error || !team) {
        return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
    }

    await supabase
        .from("shared_team_members")
        .insert({ team_id: team.id, user_id: session.sharedUserId, role: "owner" });

    return NextResponse.json({ id: team.id, name: name.trim(), role: "owner" }, { status: 201 });
});
