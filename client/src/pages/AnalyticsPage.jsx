import React from 'react';
import { BarChart3 } from 'lucide-react';
import HistoryPanel from '../components/HistoryPanel';
import { MOCK_ROUTE_HISTORY } from '../services/mockData';

const AnalyticsPage = () => {
  return (
    <div className="min-h-screen p-8 pt-8">
      <header className="mb-8 flex items-center gap-4">
        <div className="p-3 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-300">
          <BarChart3 size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-blue-950">Advanced Analytics</h1>
          <p className="text-sm font-bold text-blue-500 uppercase tracking-widest">Performance Insights</p>
        </div>
      </header>

      {/* Route Decision History */}
      <div className="mb-8">
        <HistoryPanel historyData={MOCK_ROUTE_HISTORY} />
      </div>

      {/* Placeholder for future analytics charts */}
      <div className="glass-panel p-10 border-2 border-blue-200 text-center flex flex-col items-center justify-center min-h-[200px]">
        <div className="p-4 bg-blue-100 rounded-2xl mb-3 border-2 border-blue-300">
          <BarChart3 size={36} className="text-blue-600" />
        </div>
        <h2 className="text-lg font-black text-blue-950 mb-1">More Analytics Coming Soon</h2>
        <p className="text-blue-500 font-medium text-sm max-w-md mx-auto">
          Cost trend charts, AI performance metrics, and global route optimization insights.
        </p>
      </div>
    </div>
  );
};

export default AnalyticsPage;
