import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - 获取用户信息
export async function GET() {
  try {
    const session = await getServerSession(authOptions as any);
    const userId = ((session as any)?.user as any)?.id || (session as any)?.userId as string | undefined;

    if (!userId) {
      return new Response(JSON.stringify({ error: '未登录' }), { status: 401 });
    }

    // 优先从Supabase数据库获取
    if (prisma) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            bio: true,
            createdAt: true,
            updatedAt: true
          }
        });

        if (user) {
          console.log('✅ 从Supabase数据库获取用户信息成功');
          return new Response(JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.name || '',
            phone: (user as any).phone || '',
            bio: (user as any).bio || '',
            createdAt: user.createdAt
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (dbError) {
        console.log('⚠️ Supabase数据库查询失败，使用内存存储:', dbError);
      }
    }

    // 从内存存储获取
    const { findUserById } = await import('@/lib/database-hybrid');
    const user = await findUserById(userId);

    if (!user) {
      return new Response(JSON.stringify({ error: '用户不存在' }), { status: 404 });
    }

    return new Response(JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name || '',
      phone: user.phone || '',
      bio: user.bio || '',
      createdAt: user.createdAt
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('获取用户信息失败:', error);
    return new Response(JSON.stringify({ error: '服务器错误' }), { status: 500 });
  }
}

// PUT - 更新用户信息
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    const userId = ((session as any)?.user as any)?.id || (session as any)?.userId as string | undefined;

    if (!userId) {
      return new Response(JSON.stringify({ error: '未登录' }), { status: 401 });
    }

    const body = await request.json();
    const { name, phone, bio } = body;

    // 优先更新Supabase数据库
    if (prisma) {
      try {
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            name: name || null,
            phone: phone || null,
            bio: bio || null,
            updatedAt: new Date()
          },
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            bio: true,
            updatedAt: true
          }
        });

        console.log('✅ 用户信息已更新到Supabase数据库');

        // 更新内存缓存
        const { updateUser } = await import('@/lib/database-hybrid');
        await updateUser(userId, { name, phone, bio });

        return new Response(JSON.stringify({
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name || '',
          phone: (updatedUser as any).phone || '',
          bio: (updatedUser as any).bio || '',
          sessionUpdate: true // 标记需要更新会话
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (dbError) {
        console.log('⚠️ Supabase数据库更新失败，使用内存存储:', dbError);
      }
    }

    // 更新内存存储
    const { updateUser } = await import('@/lib/database-hybrid');
    const updatedUser = await updateUser(userId, { name, phone, bio });

    return new Response(JSON.stringify({
      id: updatedUser?.id || userId,
      email: updatedUser?.email || '',
      name: updatedUser?.name || '',
      phone: updatedUser?.phone || '',
      bio: updatedUser?.bio || '',
      sessionUpdate: true // 标记需要更新会话
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('更新用户信息失败:', error);
    return new Response(JSON.stringify({ error: '服务器错误' }), { status: 500 });
  }
}
