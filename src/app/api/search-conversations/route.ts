export async function GET() { return new Response(JSON.stringify({ error: "API under maintenance" }), { status: 503, headers: { "Content-Type": "application/json" } }); }
