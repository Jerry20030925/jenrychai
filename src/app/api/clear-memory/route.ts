import { clearMemoryData } from "@/lib/database-hybrid";

export async function POST(): Promise<Response> {
  try {
    clearMemoryData();
    return new Response(JSON.stringify({ success: true, message: "Memory cleared successfully" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to clear memory";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
