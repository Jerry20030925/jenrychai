// Supabase 客户端配置
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nhxgpiwowhoqlyejrelj.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oeGdwaXdvd2hvcWx5ZWpyZWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MTg4ODQsImV4cCI6MjA3NTI5NDg4NH0.SAvlMRnsPVujWGdJvAmTyYJJi1qs1egx-LT23vzGyu4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 用户相关操作
export const userOperations = {
  async create(userData: {
    email: string;
    password?: string;
    passwordHash?: string;
    name?: string;
    phone?: string;
    bio?: string;
    image?: string;
  }) {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        email: userData.email,
        password: userData.password,
        password_hash: userData.passwordHash,
        name: userData.name,
        phone: userData.phone,
        bio: userData.bio,
        image: userData.image,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async findByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async findById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async count() {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  },

  async findAll() {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};

// 对话相关操作
export const conversationOperations = {
  async create(conversationData: {
    title: string;
    userId: string;
  }) {
    const { data, error } = await supabase
      .from('conversations')
      .insert([{
        title: conversationData.title,
        user_id: conversationData.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async findByUserId(userId: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async findById(id: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
};

// 消息相关操作
export const messageOperations = {
  async create(messageData: {
    conversationId: string;
    role: string;
    content: string;
  }) {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        conversation_id: messageData.conversationId,
        role: messageData.role,
        content: messageData.content,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async findByConversationId(conversationId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }
};

// 记忆相关操作
export const memoryOperations = {
  async create(memoryData: {
    userId: string;
    content: string;
    category: string;
    importance?: number;
  }) {
    const { data, error } = await supabase
      .from('memories')
      .insert([{
        user_id: memoryData.userId,
        content: memoryData.content,
        category: memoryData.category,
        importance: memoryData.importance || 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async findByUserId(userId: string) {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
