import { cookies } from "next/headers";
import { adminAuth } from "./firebase-admin";
import { supabaseAdmin } from "./supabase-admin";

const SESSION_COOKIE = "firebase-token";
const TEAM_COOKIE = "active-team";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type TeamRole = "owner" | "collaborator" | "viewer";

export interface SessionUser {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  sharedUserId: string;
  activeTeamId: string;
  teamRole: TeamRole;
}

async function resolveToken(token: string): Promise<SessionUser | null> {
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const userRecord = await adminAuth.getUser(decoded.uid);

    const email = userRecord.email ?? "";
    const displayName = userRecord.displayName ?? null;
    const photoURL = userRecord.photoURL ?? null;

    // Upsert shared_users
    const { data: existingUser } = await supabaseAdmin
      .from("shared_users")
      .select("id")
      .eq("firebase_uid", decoded.uid)
      .single();

    let sharedUserId: string;
    if (existingUser) {
      sharedUserId = existingUser.id;
      await supabaseAdmin
        .from("shared_users")
        .update({ email, display_name: displayName, photo_url: photoURL, updated_at: new Date().toISOString() })
        .eq("id", sharedUserId);
    } else {
      const { data: newUser, error } = await supabaseAdmin
        .from("shared_users")
        .insert({ firebase_uid: decoded.uid, email, display_name: displayName, photo_url: photoURL })
        .select("id")
        .single();
      if (error || !newUser) return null;
      sharedUserId = newUser.id;
    }

    // Get memberships
    let { data: memberships } = await supabaseAdmin
      .from("shared_team_members")
      .select("id, team_id, role, shared_teams(id, name)")
      .eq("user_id", sharedUserId);

    // Auto-create personal team if none
    if (!memberships || memberships.length === 0) {
      const { data: team } = await supabaseAdmin
        .from("shared_teams")
        .insert({ name: `${displayName || email}'s Team`, created_by: sharedUserId })
        .select("id")
        .single();

      if (team) {
        await supabaseAdmin
          .from("shared_team_members")
          .insert({ team_id: team.id, user_id: sharedUserId, role: "owner" });
      }

      const { data: refreshed } = await supabaseAdmin
        .from("shared_team_members")
        .select("id, team_id, role, shared_teams(id, name)")
        .eq("user_id", sharedUserId);
      memberships = refreshed;
    }

    if (!memberships || memberships.length === 0) return null;

    // Resolve active team from cookie
    const jar = await cookies();
    const activeTeamCookie = jar.get(TEAM_COOKIE)?.value;

    let activeMembership = activeTeamCookie
      ? memberships.find((m: any) => m.team_id === activeTeamCookie)
      : null;
    if (!activeMembership) activeMembership = memberships[0];

    return {
      uid: decoded.uid,
      email,
      displayName,
      photoURL,
      sharedUserId,
      activeTeamId: activeMembership.team_id,
      teamRole: activeMembership.role as TeamRole,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const cookieToken = jar.get(SESSION_COOKIE)?.value;
  if (cookieToken) {
    return resolveToken(cookieToken);
  }
  return null;
}

export async function setSession(idToken: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(TEAM_COOKIE);
}

export function assertCanWrite(session: SessionUser): Response | null {
  if (session.teamRole === "viewer") {
    return new Response(
      JSON.stringify({ error: "Viewers cannot modify data" }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }
  return null;
}

export function withAuth(
  handler: (request: Request, context: { session: SessionUser; params?: any }) => Promise<Response>
) {
  return async (request: Request, routeContext?: any): Promise<Response> => {
    const session = await getSession();
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const params = routeContext?.params ? await routeContext.params : undefined;
    return handler(request, { session, params });
  };
}
