import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Users, Truck, Warehouse, CheckCircle2, 
  Clock, AlertTriangle, Send, Mail, Phone, Bell, 
  ChevronRight, User, Building, TrendingUp, X, Loader, Edit2, Plus, Sparkles
} from 'lucide-react';
import { 
  getCommunicationLogs, 
  getCommunicationTemplates, 
  updateCommunicationTemplate, 
  triggerManualNotification,
  getShipments
} from '../services/api';

const KPICard = ({ title, value, trend, trendUp, icon: Icon, colorClass, borderClass, bgClass }) => (
  <div className={`bg-white rounded-2xl border border-blue-100 shadow-lg shadow-blue-100/50 p-6 border-l-4 ${borderClass} transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bgClass}`}>
        <Icon className={`w-6 h-6 ${colorClass}`} />
      </div>
      <div className={`flex items-center gap-1 text-sm font-bold ${trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
        {trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingUp className="w-4 h-4 rotate-180" />}
        {trend}
      </div>
    </div>
    <div>
      <h3 className="text-3xl font-black text-slate-800 mb-1">{value}</h3>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{title}</p>
    </div>
  </div>
);

const CommunicationCenterPage = () => {
  const [activeTab, setActiveTab] = useState('Driver');
  const [logs, setLogs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals & Action States
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [triggerResult, setTriggerResult] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // Trigger form state
  const [triggerForm, setTriggerForm] = useState({
    shipmentId: '',
    eventType: 'Delay Risk',
    reason: 'Heavy traffic congestion near expressway toll',
    alternative: 'NH48 Express Corridor',
    timeSaving: '35'
  });

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [fetchedLogs, fetchedTemplates, fetchedShipments] = await Promise.all([
        getCommunicationLogs().catch(() => []),
        getCommunicationTemplates().catch(() => []),
        getShipments().catch(() => [])
      ]);
      setLogs(fetchedLogs);
      setTemplates(fetchedTemplates);
      setShipments(fetchedShipments);

      // Pre-fill first shipment if form shipment ID is empty
      if (fetchedShipments.length > 0 && !triggerForm.shipmentId) {
        setTriggerForm(prev => ({ ...prev, shipmentId: fetchedShipments[0].id }));
      }
    } catch (error) {
      console.error('Failed to load Communication Center data:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatRelativeTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
      
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Recent';
    }
  };

  const handleUpdateTemplate = async (e) => {
    e.preventDefault();
    if (!editingTemplate) return;
    setSaveLoading(true);
    try {
      await updateCommunicationTemplate(editingTemplate.id, {
        subject: editingTemplate.subject,
        body: editingTemplate.body,
        channel: editingTemplate.channel
      });
      setEditingTemplate(null);
      await fetchData(true); // reload templates silently
    } catch (error) {
      console.error('Failed to update template:', error);
      alert('Error updating template, please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleTriggerNotification = async (e) => {
    e.preventDefault();
    if (!triggerForm.shipmentId) {
      alert('Please select or specify a Shipment ID');
      return;
    }
    setTriggerLoading(true);
    setTriggerResult(null);
    try {
      const response = await triggerManualNotification(triggerForm);
      if (response.success) {
        setTriggerResult(response.data);
        await fetchData(true); // refresh logs and KPIs silently
      } else {
        alert(response.message || 'Failed to trigger notifications');
      }
    } catch (error) {
      console.error('Trigger notifications error:', error);
      alert('Failed to send alerts. Verify your network or inputs.');
    } finally {
      setTriggerLoading(false);
    }
  };

  // KPI calculations
  const driverLogs = logs.filter(l => l.stakeholderType === 'Driver');
  const customerLogs = logs.filter(l => l.stakeholderType === 'Customer');
  const warehouseLogs = logs.filter(l => l.stakeholderType === 'Warehouse');
  
  const totalLogs = logs.length;
  const successfulLogsCount = logs.filter(l => l.status === 'Delivered').length;
  const successRate = totalLogs > 0 ? ((successfulLogsCount / totalLogs) * 100).toFixed(1) : '98.7';

  // Group templates by active stakeholder tab
  const activeTemplates = templates.filter(t => t.stakeholderType === activeTab);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full p-8">
        <Loader className="w-10 h-10 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600 font-bold">Synchronizing Communication Engine...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full animate-fade-in pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-teal-600 rounded-2xl flex items-center justify-center shadow-xl shadow-teal-500/30 text-white">
            <MessageSquare size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-blue-950 tracking-tight font-display">Communication Center</h1>
            <p className="text-xs font-bold text-blue-500/80 uppercase tracking-widest mt-1">Automated Stakeholder Communication</p>
          </div>
        </div>
        <div>
          <button 
            onClick={() => {
              setTriggerResult(null);
              setShowTriggerModal(true);
            }}
            className="flex items-center gap-2 bg-teal-600 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-teal-500/20 hover:bg-teal-700 hover:shadow-teal-500/35 active:scale-95 transition-all text-sm"
          >
            <Sparkles className="w-4 h-4" />
            Trigger Test Alert
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard title="Driver Notifications" value={driverLogs.length} trend="15%" trendUp={true} icon={Truck} colorClass="text-blue-600" borderClass="border-l-blue-500" bgClass="bg-blue-50" />
        <KPICard title="Customer Notifications" value={customerLogs.length} trend="22%" trendUp={true} icon={Users} colorClass="text-emerald-600" borderClass="border-l-emerald-500" bgClass="bg-emerald-50" />
        <KPICard title="WH Notifications" value={warehouseLogs.length} trend="8%" trendUp={true} icon={Warehouse} colorClass="text-purple-600" borderClass="border-l-purple-500" bgClass="bg-purple-50" />
        <KPICard title="Success Rate" value={`${successRate}%`} trend="0.3%" trendUp={true} icon={CheckCircle2} colorClass="text-teal-600" borderClass="border-l-teal-500" bgClass="bg-teal-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Timeline */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-lg shadow-blue-50/50 p-6 flex flex-col h-[650px]">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" /> Recent Communications
          </h2>
          <div className="relative border-l-2 border-slate-100 ml-3 space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No notification logs recorded yet.</p>
                <p className="text-xs">Run shipment analyses to auto-generate logs.</p>
              </div>
            ) : (
              logs.map((item, i) => (
                <div key={item._id || i} className="relative pl-6">
                  <div className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ring-4 ring-white ${
                    item.stakeholderType === 'Driver' ? 'bg-blue-500' :
                    item.stakeholderType === 'Customer' ? 'bg-emerald-500' : 'bg-purple-500'
                  }`}></div>
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-xs font-bold text-slate-400">{formatRelativeTime(item.createdAt)}</div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600' : 
                      item.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded mb-1">
                    {item.stakeholderType === 'Driver' && <Truck className="w-3 h-3" />}
                    {item.stakeholderType === 'Customer' && <User className="w-3 h-3" />}
                    {item.stakeholderType === 'Warehouse' && <Building className="w-3 h-3" />}
                    {item.stakeholderType} : {item.shipmentId}
                  </div>
                  <div className="text-sm font-semibold text-slate-700 mt-1">{item.subject}</div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{item.body}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Message Previews */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-blue-100 shadow-lg shadow-blue-50/50 p-6 flex flex-col min-h-[650px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Mail className="w-5 h-5 text-slate-400" /> Message Templates & Previews
            </h2>
            <div className="flex bg-slate-100 p-1 rounded-xl self-start">
              {['Driver', 'Customer', 'Warehouse'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${
                    activeTab === tab 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            {activeTemplates.length === 0 ? (
              <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-150 rounded-xl">
                <Mail className="w-8 h-8 mx-auto mb-2 text-slate-350" />
                <p className="text-sm">No templates configured for {activeTab}s.</p>
              </div>
            ) : (
              activeTemplates.map((msg) => (
                <div key={msg._id || msg.id} className={`bg-slate-50 rounded-xl border border-slate-200 p-5 border-l-4 ${
                  activeTab === 'Driver' ? 'border-l-blue-500' :
                  activeTab === 'Customer' ? 'border-l-emerald-500' : 'border-l-purple-500'
                }`}>
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <h3 className="font-bold text-slate-800 leading-snug">{msg.subject}</h3>
                    <button 
                      onClick={() => setEditingTemplate(msg)}
                      className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
                      title="Edit Template"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-xs text-slate-600 leading-relaxed border border-slate-100 mb-4 font-mono shadow-sm whitespace-pre-wrap">
                    {msg.body}
                  </div>
                  <div className="flex flex-wrap gap-3 items-center justify-between border-t border-slate-200 pt-3">
                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[10px] uppercase font-bold px-2.5 py-1 rounded-md">
                      <Send className="w-3 h-3 text-slate-400" /> {msg.channel}
                    </span>
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                      Event: {msg.eventType}
                    </span>
                  </div>
                </div>
              ))
            )}
            
            <div 
              onClick={() => {
                setEditingTemplate({
                  id: `${activeTab}_${Date.now()}`,
                  stakeholderType: activeTab,
                  eventType: 'Delay Risk',
                  subject: 'New Alert Subject',
                  body: 'Standard message for {{shipmentId}}',
                  channel: 'SMS'
                });
              }}
              className="mt-6 border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 hover:border-slate-350 transition-colors cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
              <p className="font-bold text-slate-700 text-sm">Create New Template</p>
              <p className="text-xs text-slate-500 mt-1">Add a custom template rule for {activeTab.toLowerCase()} notifications</p>
            </div>
          </div>
        </div>

      </div>

      {/* Edit Template Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-lg w-full p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-slate-800">Configure Message Template</h3>
              <button onClick={() => setEditingTemplate(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateTemplate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Subject Template</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={editingTemplate.subject}
                  onChange={(e) => setEditingTemplate({...editingTemplate, subject: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Stakeholder</label>
                  <input 
                    type="text" 
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                    value={editingTemplate.stakeholderType}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Delivery Channel</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    value={editingTemplate.channel}
                    onChange={(e) => setEditingTemplate({...editingTemplate, channel: e.target.value})}
                  >
                    <option value="SMS">SMS</option>
                    <option value="Push Notification">Push Notification</option>
                    <option value="Email">Email</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="System Alert">System Alert</option>
                    <option value="Email + SMS">Email + SMS</option>
                    <option value="SMS + Push">SMS + Push</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Trigger Event</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={editingTemplate.eventType}
                  onChange={(e) => setEditingTemplate({...editingTemplate, eventType: e.target.value})}
                >
                  <option value="Delay Risk">Delay Risk</option>
                  <option value="Route Change">Route Change</option>
                  <option value="Warehouse Change">Warehouse Change</option>
                  <option value="Updated ETA">Updated ETA</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 font-sans">Message Template Body</label>
                <textarea 
                  rows={5}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono leading-relaxed"
                  value={editingTemplate.body}
                  onChange={(e) => setEditingTemplate({...editingTemplate, body: e.target.value})}
                  required
                />
                <div className="bg-blue-50 text-blue-700 p-3 rounded-xl mt-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1">Insertable Variables:</p>
                  <div className="flex flex-wrap gap-1.5 text-[9px] font-mono">
                    <span className="bg-white/80 border border-blue-200 px-1 py-0.5 rounded">{"{{shipmentId}}"}</span>
                    <span className="bg-white/80 border border-blue-200 px-1 py-0.5 rounded">{"{{delay}}"}</span>
                    <span className="bg-white/80 border border-blue-200 px-1 py-0.5 rounded">{"{{origin}}"}</span>
                    <span className="bg-white/80 border border-blue-200 px-1 py-0.5 rounded">{"{{destination}}"}</span>
                    <span className="bg-white/80 border border-blue-200 px-1 py-0.5 rounded">{"{{reason}}"}</span>
                    <span className="bg-white/80 border border-blue-200 px-1 py-0.5 rounded">{"{{alternative}}"}</span>
                    <span className="bg-white/80 border border-blue-200 px-1 py-0.5 rounded">{"{{timeSaving}}"}</span>
                    <span className="bg-white/80 border border-blue-200 px-1 py-0.5 rounded">{"{{updatedEta}}"}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setEditingTemplate(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saveLoading}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 flex items-center gap-2"
                >
                  {saveLoading && <Loader className="w-3.5 h-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trigger Manual Notification Modal */}
      {showTriggerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-lg w-full p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-slate-800">Trigger Simulated Alerts</h3>
              <button 
                onClick={() => { setShowTriggerModal(false); setTriggerResult(null); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {triggerResult ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Stakeholder Messages Broadcasted</p>
                    <p className="text-[10px] font-medium text-emerald-600 mt-0.5">3 messages successfully generated via DelayShield engine.</p>
                  </div>
                </div>
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {triggerResult.map((log, i) => (
                    <div key={log._id || i} className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-black text-slate-700">{log.stakeholderType} : {log.channel}</span>
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[9px]">{log.status}</span>
                      </div>
                      <div className="font-mono text-[10px] text-slate-600 bg-white p-2 rounded border border-slate-100 leading-relaxed">
                        <span className="font-bold block text-slate-700 mb-1 border-b border-slate-100 pb-1">Sub: {log.subject}</span>
                        {log.body}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => { setShowTriggerModal(false); setTriggerResult(null); }}
                    className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
                  >
                    Close & Sync Logs
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleTriggerNotification} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Target Shipment ID</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    value={triggerForm.shipmentId}
                    onChange={(e) => setTriggerForm({...triggerForm, shipmentId: e.target.value})}
                    required
                  >
                    <option value="">-- Select Shipment --</option>
                    {shipments.map(s => (
                      <option key={s.id} value={s.id}>{s.id} ({s.origin?.name?.split(',')[0]} → {s.destination?.name?.split(',')[0]})</option>
                    ))}
                    <option value="SHP-2034">SHP-2034 (Mock New Target)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Trigger Event Protocol</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    value={triggerForm.eventType}
                    onChange={(e) => setTriggerForm({...triggerForm, eventType: e.target.value})}
                  >
                    <option value="Delay Risk">Delay Risk</option>
                    <option value="Route Change">Route Change</option>
                    <option value="Warehouse Change">Warehouse Change</option>
                    <option value="Updated ETA">Updated ETA</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Reason for Event</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none"
                      value={triggerForm.reason}
                      onChange={(e) => setTriggerForm({...triggerForm, reason: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Alternative Action / Route</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none"
                      value={triggerForm.alternative}
                      onChange={(e) => setTriggerForm({...triggerForm, alternative: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Estimated Time Saved (Minutes)</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none"
                    value={triggerForm.timeSaving}
                    onChange={(e) => setTriggerForm({...triggerForm, timeSaving: e.target.value})}
                    required
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setShowTriggerModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={triggerLoading}
                    className="px-5 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 disabled:bg-slate-300 flex items-center gap-2 active:scale-95 transition-all shadow-md shadow-teal-500/10"
                  >
                    {triggerLoading ? (
                      <>
                        <Loader className="w-3.5 h-3.5 animate-spin" />
                        Generating Messages...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Broadcast Alerts
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationCenterPage;
