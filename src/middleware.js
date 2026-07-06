import { NextResponse } from "next/server";

const PUBLIC_PATHS  = ["/login"];
const PROTECTED_PREFIX = "/promonkey";

export function middleware(request) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get("crm_auth_token")?.value;

    // if on a protected route and no token → redirect to login
    if (pathname.startsWith(PROTECTED_PREFIX) && !token) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("from", pathname); // preserve intended destination
        return NextResponse.redirect(loginUrl);
    }

    // if already logged in and trying to visit /login → redirect to dashboard
    if (pathname === "/login" && token) {
        return NextResponse.redirect(new URL("/promonkey/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/login",
        "/promonkey/:path*",
    ],
};