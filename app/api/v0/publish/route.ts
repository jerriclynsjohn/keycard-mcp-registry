import { NextResponse } from "next/server";

export async function POST() {
  // For now, return not implemented as this is optional
  return NextResponse.json(
    { error: "Publishing is not supported by this registry" },
    { status: 501 }
  );
}