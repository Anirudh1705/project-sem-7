'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ChatSession, Message } from '@/lib/types';
import AuthForm from '@/components/AuthForm';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';
import InputBox from '@/components/InputBox';
import StatsPanel from '@/components/StatsPanel';
import ExportMenu from '@/components/ExportMenu';
import { calculateCost, calculateCarbonEmission } from '@/lib/gemini';

export default function Home() {
  const { user, token, login, register, logout, isLoading: authLoading } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeySet, setApiKeySet] = useState(false);

  useEffect(() => {
    setApiKeySet(!!process.env.NEXT_PUBLIC_GEMINI_API_KEY);
  }, []);

  // Load sessions when user logs in
  useEffect(() => {
    if (user && token) {
      loadSessions();
    }
  }, [user, token]);

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        // Migrate sessions that don't have carbonEmission field
        const migratedSessions = data.map((session: any) => ({
          ...session,
          stats: {
            ...session.stats,
            carbonEmission: session.stats.carbonEmission || 0,
          },
        }));
        setSessions(migratedSessions);
        if (migratedSessions.length > 0) {
          setActiveSessionId(migratedSessions[0]._id);
        }
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const handleAuth = async (email: string, password: string, name?: string) => {
    if (isLoginMode) {
      await login(email, password);
    } else {
      if (!name) {
        throw new Error('Name is required for registration');
      }
      await register(email, password, name);
    }
  };

  const activeSession = sessions.find((s) => s._id === activeSessionId);

  const handleNewSession = async () => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: 'New Chat' }),
      });

      if (response.ok) {
        const newSession = await response.json();
        setSessions([newSession, ...sessions]);
        setActiveSessionId(newSession._id);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
  };

  const handleDeleteSession = async (id: string) => {
    try {
      const response = await fetch(`/api/sessions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setSessions(sessions.filter((s) => s._id !== id));
        if (activeSessionId === id) {
          const remaining = sessions.filter((s) => s._id !== id);
          setActiveSessionId(remaining.length > 0 ? (remaining[0]._id || null) : null);
        }
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!activeSession) return;

    setIsLoading(true);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    // Auto-generate title from first message if it's still "New Chat"
    let updatedSession = { ...activeSession };
    if (activeSession.title === 'New Chat' && activeSession.messages.length === 0) {
      // Generate title from first message (first 50 chars)
      const title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
      updatedSession.title = title;
    }

    updatedSession = {
      ...updatedSession,
      messages: [...updatedSession.messages, userMessage],
      updatedAt: new Date(),
    };

    setSessions(
      sessions.map((s) => (s._id === activeSessionId ? updatedSession : s))
    );

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: content,
          history: activeSession.messages,
          sessionId: activeSessionId,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.text,
        timestamp: new Date(),
      };

      const cost = calculateCost(data.promptTokens, data.completionTokens);
      const carbonEmission = calculateCarbonEmission(data.promptTokens, data.completionTokens);

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, assistantMessage],
        stats: {
          promptTokens: updatedSession.stats.promptTokens + data.promptTokens,
          completionTokens:
            updatedSession.stats.completionTokens + data.completionTokens,
          totalTokens: updatedSession.stats.totalTokens + data.totalTokens,
          estimatedCost: updatedSession.stats.estimatedCost + cost,
          carbonEmission: (updatedSession.stats.carbonEmission || 0) + carbonEmission,
        },
      };

      setSessions(
        sessions.map((s) => (s._id === activeSessionId ? finalSession : s))
      );
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to send message. Check your API key and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthForm
        onSubmit={handleAuth}
        isLoading={authLoading}
        isLogin={isLoginMode}
        onToggle={() => setIsLoginMode(!isLoginMode)}
      />
    );
  }

  if (!apiKeySet) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold mb-4">Setup Required</h1>
          <p className="text-gray-600 mb-4">
            Please set your Gemini API key in the .env.local file:
          </p>
          <code className="bg-gray-100 p-3 rounded block text-sm mb-4">
            NEXT_PUBLIC_GEMINI_API_KEY=your_key_here
          </code>
          <p className="text-sm text-gray-500">
            Get your API key from{' '}
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Google AI Studio
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
      />

      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {activeSession?.title || 'Testbot Chat'}
            </h1>
            <p className="text-sm text-gray-500">Welcome, {user.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <ExportMenu session={activeSession || null} />
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {activeSession ? (
          <>
            <ChatWindow messages={activeSession.messages} isLoading={isLoading} />
            <StatsPanel stats={activeSession.stats} />
            <InputBox onSend={handleSendMessage} isLoading={isLoading} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={handleNewSession}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Start New Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
