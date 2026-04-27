import React, { useState } from 'react';
import { X, Copy, Check, Share2, Link as LinkIcon, ExternalLink } from 'lucide-react';

const ShareModal = ({ isOpen, onClose, shipmentId }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/share/${shipmentId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Share2 size={20} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Share Route Details</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-slate-600 font-medium mb-6">
            Share this live tracking link with the delivery team. No login is required to view this specific route.
          </p>

          <div className="space-y-6">
            {/* Link Box */}
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-600/5 rounded-2xl border-2 border-dashed border-blue-200 group-hover:border-blue-400 transition-colors"></div>
              <div className="relative flex items-center gap-3 p-4">
                <LinkIcon size={18} className="text-blue-500 flex-shrink-0" />
                <span className="text-sm font-bold text-slate-700 truncate flex-1">
                  {shareUrl}
                </span>
                <button 
                  onClick={handleCopy}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                    copied 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30'
                  }`}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy Link'}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <a 
                href={shareUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-2xl transition-all border border-slate-200"
              >
                <ExternalLink size={18} /> Preview Shared Page
              </a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-2xl border border-amber-100">
              <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-amber-700 font-black text-xs">!</span>
              </div>
              <div>
                <p className="text-xs font-bold text-amber-900 mb-1">Security Note</p>
                <p className="text-[11px] text-amber-800/80 font-medium leading-relaxed">
                  Anyone with this link can view the live shipment location and route details. The link is tied specifically to shipment ID <span className="font-bold">{shipmentId}</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
