export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/login", "/_next", "/favicon"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const authPassword = process.env.AUTH_PASSWORD;
  if (!authPassword) return NextResponse.next(); // No auth configured

  const token = request.cookies.get("auth_token")?.value;
  if (token) {
    try {
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      if (decoded === authPassword) return NextResponse.next();
    } catch {}
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
