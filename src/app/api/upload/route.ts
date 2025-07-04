export const runtime = "edge";

export async function POST(req: Request) {
  const response = await fetch("https://your-node-server.com/api/upload", {
    method: "POST",
    headers: req.headers,
    body: req.body,
  });
  return response;
}

export async function GET() {
  return new Response("Unauthorized", { status: 401 });
}
