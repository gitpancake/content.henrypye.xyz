import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { withAuth } from "@/lib/auth";

export const PATCH = withAuth(async (request, { session, params }) => {
    const { id, memberId } = params;

    const { data: membership } = await supabase
        .from("shared_team_members")
        .select("role")
        .eq("team_id", id)
        .eq("user_id", session.sharedUserId)
        .single();

    if (!membership || membership.role !== "owner") {
        return NextResponse.json({ error: "Only owners can change roles" }, { status: 403 });
    }

    const { role } = await request.json();
    if (!["collaborator", "viewer"].includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const { data: target } = await supabase
        .from("shared_team_members")
        .select("id, team_id, user_id")
        .eq("id", memberId)
        .single();

    if (!target || target.team_id !== id) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    if (target.user_id === session.sharedUserId) {
        return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
    }

    const { data: updated } = await supabase
        .from("shared_team_members")
        .update({ role })
        .eq("id", memberId)
        .select()
        .single();

    return NextResponse.json(updated);
});

export const DELETE = withAuth(async (_request, { session, params }) => {
    const { id, memberId } = params;

    const { data: target } = await supabase
        .from("shared_team_members")
        .select("id, team_id, user_id")
        .eq("id", memberId)
        .single();

    if (!target || target.team_id !== id) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const { data: membership } = await supabase
        .from("shared_team_members")
        .select("role")
        .eq("team_id", id)
        .eq("user_id", session.sharedUserId)
        .single();

    if (!membership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const isOwner = membership.role === "owner";
    const isSelf = target.user_id === session.sharedUserId;

    if (!isOwner && !isSelf) {
        return NextResponse.json({ error: "Only owners can remove members" }, { status: 403 });
    }
    if (isOwner && isSelf) {
        return NextResponse.json({ error: "Owner cannot leave their own team" }, { status: 400 });
    }

    await supabase.from("shared_team_members").delete().eq("id", memberId);

    return NextResponse.json({ ok: true });
});
