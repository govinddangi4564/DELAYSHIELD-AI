import React from 'react';
import { Package, MapPin, Clock } from 'lucide-react';

const ShipmentCard = ({ shipment, isSelected, onClick }) => {
  return (
    <div
      onClick={() => onClick(shipment)}
      className={`glass-panel glass-panel-hover p-5 cursor-pointer transition-all duration-300 ${
        isSelected
          ? 'ring-2 ring-blue-500 border-blue-500 scale-[1.02] shadow-xl shadow-blue-200'
          : 'hover:scale-[1.01]'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg text-white shadow-sm shadow-blue-300">
            <Package size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-blue-950">{shipment.id}</h3>
            <span className={`text-xs px-2 py-1 rounded-full font-bold ${
              shipment.riskScore === 'High'   ? 'bg-red-100 text-red-700 border border-red-300' :
              shipment.riskScore === 'Medium' ? 'bg-amber-100 text-amber-700 border border-amber-300' :
                                               'bg-emerald-100 text-emerald-700 border border-emerald-300'
            }`}>
              {shipment.riskScore} Risk
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-blue-800">
          <MapPin size={16} className="text-blue-500 flex-shrink-0" />
          <span className="font-medium">
            {shipment.origin.name}
            <span className="text-blue-400 mx-1">→</span>
            {shipment.destination.name}
          </span>
        </div>

        <div className="flex items-start gap-2 text-sm">
          <Clock size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="text-xs text-blue-500 font-medium">ETA: {shipment.etas.original}</span>
            <span className="font-bold text-amber-600">Updated: {shipment.etas.updated}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipmentCard;
