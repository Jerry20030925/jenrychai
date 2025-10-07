import bcrypt from "bcryptjs";

// 临时内存存储（仅用于演示）
const users = new Map<string, {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
}>();

async function createUser(email: string, password: string, name: string = '') {
  if (users.has(email)) {
    throw new Error("邮箱已被注册");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  users.set(email, {
    id: userId,
    email,
    passwordHash,
    name,
    createdAt: new Date()
  });

  console.log(`User registered: ${email} (${userId})`);
  console.log(`Total users: ${users.size}`);

  return { id: userId };
}

export async function POST(request: Request): Promise<Response> {
  try {
    const { email, password, name } = await request.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "邮箱与密码必填" }), { status: 400 });
    }

    const result = await createUser(email, password, name);
    return new Response(JSON.stringify(result), { status: 201 });
  } catch (error: unknown) {
    console.error("Registration error:", error);
    const message = error instanceof Error ? error.message : "服务器错误";
    const status = message.includes("已被注册") ? 409 : 500;
    return new Response(JSON.stringify({ error: message }), { status });
  }
}
