import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { withAuth } from "@/lib/auth";
import { randomBytes } from "crypto";

export const GET = withAuth(async (_request, { session, params }) => {
    const { id } = params;

    const { data: membership } = await supabase
        .from("shared_team_members")
        .select("role")
        .eq("team_id", id)
        .eq("user_id", session.sharedUserId)
        .single();

    if (!membership || membership.role !== "owner") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: invites } = await supabase
        .from("shared_team_invites")
        .select("*")
        .eq("team_id", id)
        .is("accepted_at", null)
        .order("created_at", { ascending: false });

    return NextResponse.json(invites || []);
});

export const POST = withAuth(async (request, { session, params }) => {
    const { id } = params;

    const { data: membership } = await supabase
        .from("shared_team_members")
        .select("role")
        .eq("team_id", id)
        .eq("user_id", session.sharedUserId)
        .single();

    if (!membership || membership.role !== "owner") {
        return NextResponse.json({ error: "Only owners can invite" }, { status: 403 });
    }

    const { email, role } = await request.json();

    if (!email?.trim() || !["collaborator", "viewer"].includes(role)) {
        return NextResponse.json(
            { error: "Valid email and role (collaborator/viewer) required" },
            { status: 400 },
        );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if already a member
    const { data: existingUser } = await supabase
        .from("shared_users")
        .select("id")
        .eq("email", normalizedEmail)
        .single();

    if (existingUser) {
        const { data: existingMember } = await supabase
            .from("shared_team_members")
            .select("id")
            .eq("team_id", id)
            .eq("user_id", existingUser.id)
            .single();

        if (existingMember) {
            return NextResponse.json({ error: "User is already a team member" }, { status: 409 });
        }
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: invite, error } = await supabase
        .from("shared_team_invites")
        .upsert(
            {
                team_id: id,
                invited_by: session.sharedUserId,
                email: normalizedEmail,
                role,
                token,
                expires_at: expiresAt,
                accepted_at: null,
            },
            { onConflict: "team_id,email" },
        )
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
    }

    return NextResponse.json(invite, { status: 201 });
});
