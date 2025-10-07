// 临时替换有问题的 API
const stubContent = `export async function GET() {
  return new Response(JSON.stringify({ error: "API under maintenance" }), { 
    status: 503,
    headers: { "Content-Type": "application/json" }
  });
}

export async function POST() {
  return new Response(JSON.stringify({ error: "API under maintenance" }), { 
    status: 503,
    headers: { "Content-Type": "application/json" }
  });
}

export async function PUT() {
  return new Response(JSON.stringify({ error: "API under maintenance" }), { 
    status: 503,
    headers: { "Content-Type": "application/json" }
  });
}

export async function DELETE() {
  return new Response(JSON.stringify({ error: "API under maintenance" }), { 
    status: 503,
    headers: { "Content-Type": "application/json" }
  });
}`;

console.log(stubContent);