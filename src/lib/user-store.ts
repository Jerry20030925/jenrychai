import bcrypt from "bcryptjs";

// 临时内存存储（仅用于演示）
const users = new Map<string, {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
}>();

export async function createUser(email: string, password: string, name: string = '') {
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

export async function findUserByEmail(email: string) {
  return users.get(email) || null;
}

export async function verifyPassword(password: string, passwordHash: string) {
  return await bcrypt.compare(password, passwordHash);
}

export { users };
