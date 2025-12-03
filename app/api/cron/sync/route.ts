 import { NextResponse } from "next/server";
import { syncFromOfficialRegistry } from "@/lib/sync";

export async function POST() {
  console.log("Sync endpoint called");

  try {
    await syncFromOfficialRegistry();
    console.log("Sync completed successfully");
    return NextResponse.json({ success: true, message: "Sync completed successfully" });
  } catch (error) {
    console.error("Sync failed:", error);
    return NextResponse.json(
      { success: false, error: "Sync failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}