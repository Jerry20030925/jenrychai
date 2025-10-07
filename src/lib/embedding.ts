// Simplified embedding service - temporarily disabled

export interface EmbeddingResult {
  id: string;
  title: string;
  content: string;
  category: string;
  importance: number;
  similarity: number;
  createdAt: Date;
  lastAccessed?: Date;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  // Temporarily disabled
  return [];
}

export async function searchMemories(
  userId: string,
  query: string,
  limit: number = 5,
  minSimilarity: number = 0.3
): Promise<EmbeddingResult[]> {
  // Temporarily disabled
  return [];
}

export async function createMemory(
  userId: string,
  title: string,
  content: string,
  category: string,
  importance: number = 5,
  source?: string,
  conversationId?: string,
  tags: string[] = []
): Promise<string> {
  // Temporarily disabled
  return 'temp_id';
}

export async function updateMemory(
  memoryId: string,
  updates: {
    title?: string;
    content?: string;
    category?: string;
    importance?: number;
    tags?: string[];
  }
): Promise<void> {
  // Temporarily disabled
}

export async function deleteMemory(memoryId: string): Promise<void> {
  // Temporarily disabled
}

export async function getMemoryStats(userId: string) {
  // Temporarily disabled
  return {
    totalMemories: 0,
    byCategory: []
  };
}

export async function extractMemoriesFromConversation(
  userId: string,
  conversationId: string,
  messages: any[]
): Promise<void> {
  // Temporarily disabled
}