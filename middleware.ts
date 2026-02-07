import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow access to login page, auth API, and public route pages
    if (
        pathname === "/login" ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/route/")
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

    const validUsername = process.env.AUTH_USERNAME;
    const validPassword = process.env.AUTH_PASSWORD;

    // If no auth configured, allow access
    if (!validUsername || !validPassword) {
        return NextResponse.next();
    }

    // Check for auth cookie
    const authToken = request.cookies.get("auth_token");

    if (!authToken) {
        // Redirect to login page
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
