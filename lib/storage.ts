import { ChatSession, Message, TokenStats } from './types';

const STORAGE_KEY = 'testbot_chat_sessions';

export function getSessions(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveSession(session: ChatSession): void {
  if (typeof window === 'undefined') return;
  const sessions = getSessions();
  const index = sessions.findIndex((s) => s.id === session.id);
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.push(session);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function deleteSession(id: string): void {
  if (typeof window === 'undefined') return;
  const sessions = getSessions().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function createNewSession(title: string = 'New Chat'): ChatSession {
  return {
    id: Date.now().toString(),
    title,
    messages: [],
    stats: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCost: 0,
      carbonEmission: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function exportChatAsJSON(session: ChatSession): string {
  return JSON.stringify(session, null, 2);
}

export function exportChatAsMarkdown(session: ChatSession): string {
  let markdown = `# ${session.title}\n\n`;
  markdown += `**Created:** ${session.createdAt.toLocaleString()}\n`;
  markdown += `**Updated:** ${session.updatedAt.toLocaleString()}\n\n`;
  markdown += `## Statistics\n`;
  markdown += `- **Total Tokens:** ${session.stats.totalTokens}\n`;
  markdown += `- **Prompt Tokens:** ${session.stats.promptTokens}\n`;
  markdown += `- **Completion Tokens:** ${session.stats.completionTokens}\n`;
  markdown += `- **Estimated Cost:** ₹${session.stats.estimatedCost.toFixed(4)}\n`;
  markdown += `- **Carbon Emission:** ${(session.stats.carbonEmission || 0).toFixed(6)}g CO₂\n\n`;
  markdown += `## Conversation\n\n`;

  session.messages.forEach((msg) => {
    const role = msg.role === 'user' ? '👤 You' : '🤖 Assistant';
    markdown += `### ${role}\n${msg.content}\n\n`;
  });

  return markdown;
}

export function exportChatAsCSV(session: ChatSession): string {
  let csv = 'Timestamp,Role,Message\n';
  session.messages.forEach((msg) => {
    const timestamp = msg.timestamp.toISOString();
    const role = msg.role;
    const content = `"${msg.content.replace(/"/g, '""')}"`;
    csv += `${timestamp},${role},${content}\n`;
  });
  return csv;
}
