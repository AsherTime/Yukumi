import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
    const token = req.cookies.get("firebase-auth-token")?.value; // Get the auth token

    // You can set headers or modify requests if needed
    const requestHeaders = new Headers(req.headers);
    if (token) {
        requestHeaders.set("X-User-Authenticated", "true");
    } else {
        requestHeaders.set("X-User-Authenticated", "false");
    }

    return NextResponse.next({
        headers: requestHeaders,
    });
}

// Middleware applies to these routes (optional)
export const config = {
    matcher: ["/tracker/:path*"], // Middleware still runs on tracker pages
};
