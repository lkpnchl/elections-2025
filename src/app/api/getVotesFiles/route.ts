import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET() {
  try {
    const dirPath = path.join(process.cwd(), "public/VOTES");
    const files = fs
      .readdirSync(dirPath)
      .filter((file) => file.endsWith(".json"));

    return NextResponse.json({ files });
  } catch (error) {
    console.error("Error reading VOTES folder:", error);
    return NextResponse.json(
      { files: [], error: "Failed to read files." },
      { status: 500 }
    );
  }
}
