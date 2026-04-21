import React from 'react';
import { PackageSearch } from 'lucide-react';

const ShipmentsPage = () => {
  return (
    <div className="min-h-screen p-4 md:p-8 pt-6 md:pt-8">
      <header className="mb-8 flex items-center gap-4">
        <div className="p-3 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-300">
          <PackageSearch size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-blue-950">All Shipments</h1>
          <p className="text-sm font-bold text-blue-500 uppercase tracking-widest">Shipment Directory</p>
        </div>
      </header>

      <div className="glass-panel p-6 md:p-12 border-2 border-blue-200 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="p-5 bg-blue-100 rounded-2xl mb-4 border-2 border-blue-300">
          <PackageSearch size={48} className="text-blue-600" />
        </div>
        <h2 className="text-xl font-black text-blue-950 mb-2">Shipment Directory</h2>
        <p className="text-blue-600 font-medium max-w-md mx-auto">
          This page will contain the full searchable list of all active and historical shipments.
          Backend data integration is in progress.
        </p>
      </div>
    </div>
  );
};

export default ShipmentsPage;
