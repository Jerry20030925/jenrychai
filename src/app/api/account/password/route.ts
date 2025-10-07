import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// PUT - 修改密码
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    const userId = ((session as any)?.user as any)?.id || (session as any)?.userId as string | undefined;

    if (!userId) {
      return new Response(JSON.stringify({ error: '未登录' }), { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return new Response(JSON.stringify({ error: '请提供当前密码和新密码' }), { status: 400 });
    }

    if (newPassword.length < 6) {
      return new Response(JSON.stringify({ error: '新密码至少需要6个字符' }), { status: 400 });
    }

    // 优先从Supabase数据库验证和更新
    if (prisma) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, passwordHash: true }
        });

        if (user && user.passwordHash) {
          const storedPassword = user.passwordHash;
          
          if (!storedPassword) {
            return new Response(JSON.stringify({ error: '密码未设置' }), { status: 400 });
          }
          
          // 验证当前密码
          const isValid = await bcrypt.compare(currentPassword, storedPassword);
          
          if (!isValid) {
            return new Response(JSON.stringify({ error: '当前密码不正确' }), { status: 400 });
          }

          // 加密新密码
          const hashedPassword = await bcrypt.hash(newPassword, 10);

            // 更新密码到Supabase数据库
            await prisma.user.update({
              where: { id: userId },
              data: { 
                passwordHash: hashedPassword,
                updatedAt: new Date()
              }
            });

          console.log('✅ 密码已更新到Supabase数据库');
          return new Response(JSON.stringify({ message: '密码修改成功' }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (dbError) {
        console.log('⚠️ Supabase数据库操作失败，尝试内存存储:', dbError);
      }
    }

    // 从内存存储验证和更新
    const { findUserById, updateUserPassword } = await import('@/lib/database-hybrid');
    const user = await findUserById(userId);

    if (!user || !user.password) {
      return new Response(JSON.stringify({ error: '用户不存在或未设置密码' }), { status: 404 });
    }

    // 验证当前密码
    const isValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValid) {
      return new Response(JSON.stringify({ error: '当前密码不正确' }), { status: 400 });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await updateUserPassword(userId, hashedPassword);

    return new Response(JSON.stringify({ message: '密码修改成功' }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('修改密码失败:', error);
    return new Response(JSON.stringify({ error: '服务器错误' }), { status: 500 });
  }
}

