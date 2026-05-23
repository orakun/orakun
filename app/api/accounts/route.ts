import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const accounts = await prisma.account.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(accounts);
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "İsim zorunlu" }, { status: 400 });
  const account = await prisma.account.create({ data: { name: name.trim() } });
  return NextResponse.json(account, { status: 201 });
}
