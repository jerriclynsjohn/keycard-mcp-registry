import { syncFromOfficialRegistry } from "../lib/sync";

async function testSync() {
  try {
    console.log("Starting sync...");
    await syncFromOfficialRegistry();
    console.log("Sync completed successfully!");
  } catch (error) {
    console.error("Sync failed:", error);
  }
}

testSync();