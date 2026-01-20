'use client';

import { ChatSession } from '@/lib/types';
import { formatCarbonEmission } from '@/lib/gemini';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
}: SidebarProps) {
  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <span>+</span>
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-gray-400 text-sm">No chats yet</div>
        ) : (
          sessions.map((session) => {
            const sessionId = session._id || session.id;
            if (!sessionId) return null;
            return (
              <div
                key={sessionId}
                className={`p-3 border-b border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors group ${
                  activeSessionId === sessionId ? 'bg-gray-800' : ''
                }`}
                onClick={() => onSelectSession(sessionId)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{session.title}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {session.messages.length} messages
                    </p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500">
                        ₹{session.stats.estimatedCost.toFixed(4)}
                      </p>
                      <p className="text-xs text-red-400">
                        {formatCarbonEmission(session.stats.carbonEmission)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(sessionId);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-600 rounded"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
