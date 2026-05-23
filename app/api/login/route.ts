import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const expected = process.env.AUTH_PASSWORD;
  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Yanlış şifre" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("auth_token", Buffer.from(password).toString("base64"), {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
  });
  return res;
}
