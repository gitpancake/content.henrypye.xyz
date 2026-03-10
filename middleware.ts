import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "firebase-token";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow access to login page, auth API, and public route pages
    if (
        pathname === "/login" ||
        pathname.startsWith("/api/") ||
        pathname.startsWith("/route/") ||
        pathname.startsWith("/invite")
    ) {
        return NextResponse.next();
    }

    // Allow static files
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon") ||
        pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    // Check for firebase auth cookie
    const authToken = request.cookies.get(SESSION_COOKIE);

    if (!authToken) {
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
