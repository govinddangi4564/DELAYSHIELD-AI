import React from 'react';
import { Settings } from 'lucide-react';

const SettingsPage = () => {
  return (
    <div className="min-h-screen p-8 pt-8">
      <header className="mb-8 flex items-center gap-4">
        <div className="p-3 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-300">
          <Settings size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-blue-950">System Settings</h1>
          <p className="text-sm font-bold text-blue-500 uppercase tracking-widest">Configuration Profile</p>
        </div>
      </header>

      <div className="glass-panel p-8 border-2 border-blue-200 max-w-4xl min-h-[400px]">
        <h2 className="text-lg font-black text-blue-950 mb-6 pb-4 border-b-2 border-blue-100">
          Configuration Profile
        </h2>

        <div className="space-y-5">
          {/* API Keys */}
          <div className="p-5 bg-blue-50 rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-black text-blue-950 mb-1">API Integrations</h3>
                <p className="text-sm text-blue-600 font-medium">
                  Manage connection keys for OpenRouteService and Google Gemini.
                </p>
              </div>
              <button className="btn-secondary text-sm flex-shrink-0 ml-4">Manage API Keys</button>
            </div>
          </div>

          {/* Risk Engine */}
          <div className="p-5 bg-blue-50 rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-black text-blue-950 mb-1">Risk Weighting Engine</h3>
                <p className="text-sm text-blue-600 font-medium">
                  Adjust the multiplier parameters for Delay, Traffic, and Weather severity.
                </p>
              </div>
              <button className="btn-secondary text-sm flex-shrink-0 ml-4">Tune Strategy</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
