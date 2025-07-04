// yukumi-main/app/api/upload/route.ts

export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // get form data from the incoming request
    const formData = await req.formData();

    // forward it to your separate Render server
    const response = await fetch("https://yukumi-upload-server.onrender.com/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Upload proxy error:", err);
    return NextResponse.json({ error: "Proxy upload failed" }, { status: 500 });
  }
}

// optionally block GET
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/unauthorized", req.url));
}
