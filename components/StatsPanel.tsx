'use client';

import { TokenStats } from '@/lib/types';
import { formatCarbonEmission } from '@/lib/gemini';

interface StatsPanelProps {
  stats: TokenStats;
}

export default function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Session Statistics</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Prompt Tokens</p>
          <p className="text-lg font-bold text-blue-600">{stats.promptTokens}</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Completion Tokens</p>
          <p className="text-lg font-bold text-green-600">{stats.completionTokens}</p>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Total Tokens</p>
          <p className="text-lg font-bold text-purple-600">{stats.totalTokens}</p>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Est. Cost</p>
          <p className="text-lg font-bold text-orange-600">
            ₹{stats.estimatedCost.toFixed(4)}
          </p>
        </div>
        <div className="bg-red-50 p-3 rounded-lg col-span-2">
          <p className="text-xs text-gray-600">Carbon Footprint</p>
          <p className="text-lg font-bold text-red-600">
            {formatCarbonEmission(stats.carbonEmission)}
          </p>
        </div>
      </div>
    </div>
  );
}
