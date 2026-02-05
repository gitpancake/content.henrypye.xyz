import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { username, password } = await request.json();

  const validUsername = process.env.AUTH_USERNAME;
  const validPassword = process.env.AUTH_PASSWORD;

  if (!validUsername || !validPassword) {
    // No auth configured, allow access
    const response = NextResponse.json({ success: true });
    (await cookies()).set("auth_token", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
    return response;
  }

  if (username === validUsername && password === validPassword) {
    // Create a simple auth token (in production you'd want something more secure)
    const token = Buffer.from(`${username}:${Date.now()}`).toString("base64");

    const response = NextResponse.json({ success: true });
    (await cookies()).set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
    return response;
  }

  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}
