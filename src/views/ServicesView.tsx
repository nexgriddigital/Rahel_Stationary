import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
  DollarSign,
  FileText,
  Printer,
  Copy,
  Scan,
  BookOpen,
  CalendarCheck,
  ShieldAlert,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { storage } from '../services/storage';
import { ServiceItem } from '../types';

interface ServicesViewProps {
  onNavigateToPos?: () => void;
  onAddServiceToPos?: (service: ServiceItem) => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({
  onNavigateToPos,
  onAddServiceToPos
}) => {
  const [services, setServices] = useState<ServiceItem[]>(() => storage.getServices());
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    price: string;
    unit: string;
    description: string;
    isActive: boolean;
  }>({
    name: '',
    price: '',
    unit: 'service',
    description: '',
    isActive: true
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const settings = storage.getSettings();
  const allSales = storage.getSales();

  const refreshServices = () => {
    setServices(storage.getServices());
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Calculate metrics
  const totalServices = services.length;
  const activeCount = services.filter(s => s.isActive).length;

  // Calculate total revenue generated specifically from services
  let totalServiceRevenue = 0;
  let serviceSalesCount = 0;
  allSales.forEach(sale => {
    if (sale.status === 'refunded') return;
    let hasServiceInSale = false;
    sale.items.forEach(item => {
      if (item.isService || storage.isService(item.productId) || storage.isService(item.productName)) {
        totalServiceRevenue += item.total;
        hasServiceInSale = true;
      }
    });
    if (hasServiceInSale) {
      serviceSalesCount++;
    }
  });

  const getServiceIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('passport')) return CalendarCheck;
    if (lower.includes('print')) return Printer;
    if (lower.includes('photo') || lower.includes('copy')) return Copy;
    if (lower.includes('scan')) return Scan;
    if (lower.includes('bind')) return BookOpen;
    if (lower.includes('laminat')) return Layers;
    return FileText;
  };

  const handleOpenAddModal = () => {
    setEditingService(null);
    setFormData({
      name: '',
      price: '',
      unit: 'job',
      description: '',
      isActive: true
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (srv: ServiceItem) => {
    setEditingService(srv);
    setFormData({
      name: srv.name,
      price: srv.price.toString(),
      unit: srv.unit || 'job',
      description: srv.description || '',
      isActive: srv.isActive
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formData.name.trim();

    if (!cleanName) {
      setErrorMessage('Service name is required.');
      return;
    }

    if (cleanName.toLowerCase() === 'document typing') {
      setErrorMessage('Document Typing service is removed and cannot be added.');
      return;
    }

    const priceVal = parseFloat(formData.price);
    if (isNaN(priceVal) || priceVal < 0) {
      setErrorMessage('Please enter a valid non-negative price.');
      return;
    }

    const serviceToSave: ServiceItem = {
      id: editingService ? editingService.id : 'srv_' + Date.now(),
      name: cleanName,
      price: Number(priceVal.toFixed(2)),
      unit: formData.unit.trim() || 'service',
      description: formData.description.trim(),
      isActive: formData.isActive,
      createdAt: editingService ? editingService.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const res = storage.saveService(serviceToSave);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to save service.');
      return;
    }

    refreshServices();
    setIsModalOpen(false);
    showToast(`Saved service "${cleanName}" successfully.`);
  };

  const handleDelete = (srv: ServiceItem) => {
    if (confirm(`Are you sure you want to remove the service "${srv.name}"?`)) {
      const res = storage.deleteService(srv.id);
      if (res.success) {
        refreshServices();
        showToast(`Removed service "${srv.name}".`);
      }
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset services to the standard default list (Printing, Laminating, Photocopying, Scanning, Binding, Passport Appointment)?')) {
      storage.resetServices();
      refreshServices();
      showToast('Services reset to default catalog.');
    }
  };

  const handleAddDirectToPos = (srv: ServiceItem) => {
    if (onAddServiceToPos) {
      onAddServiceToPos(srv);
      showToast(`Added 1× "${srv.name}" to POS cart.`);
    } else if (onNavigateToPos) {
      onNavigateToPos();
    }
  };

  return (
    <div className="min-h-full bg-[#0a0a0c] text-[#f4efe8] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Toast */}
      {successToast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-2xl bg-[#141417] border border-[#d4af37] text-[#f5d77f] text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 text-[#d4af37]" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#26221c]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#f5d77f]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#f4efe8] tracking-tight">
                Services Management
              </h1>
              <p className="text-xs text-[#a39c90] mt-0.5">
                Configurable commercial services sold at POS without inventory deductions or QR code labels.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetDefaults}
            className="px-3 py-2 rounded-xl text-xs font-medium bg-[#141417] hover:bg-[#1a1a20] text-[#a39c90] hover:text-[#f4efe8] border border-[#2a261f] transition-all flex items-center gap-1.5 cursor-pointer"
            title="Reset to 6 standard services"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>

          {onNavigateToPos && (
            <button
              onClick={onNavigateToPos}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#18181d] hover:bg-[#222228] text-[#f5d77f] border border-[#d4af37]/40 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Go to POS Register</span>
            </button>
          )}

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#d4af37] to-[#c59b27] text-black shadow-xs hover:brightness-110 active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>Add Service</span>
          </button>
        </div>
      </div>

      {/* Product / Service Separation Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#141418] via-[#16161d] to-[#121216] border border-[#2e2a22] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-sky-950/60 border border-sky-800/40 text-sky-300 shrink-0 mt-0.5">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">
                Product & Service Separation Architecture
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                Live & Active
              </span>
            </div>
            <p className="text-xs text-[#c4bcad] mt-1 leading-relaxed">
              <strong>Products</strong> maintain stock inventory, low-stock threshold monitoring (≤3), and printable QR code labels. <br className="hidden sm:inline" />
              <strong>Services</strong> require <strong>No Inventory</strong> and <strong>No QR Code</strong>, but are sold seamlessly through POS tickets, sales history, and daily/weekly/monthly revenue reports.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 pl-11 md:pl-0">
          <div className="text-right">
            <span className="block text-[10px] uppercase tracking-wider text-[#8c8273]">Excluded Service</span>
            <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-rose-400">
              <ShieldAlert className="w-3.5 h-3.5" />
              Document Typing: Removed
            </span>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#121215] border border-[#26221c]">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#8c8273]">Active Services</div>
          <div className="text-2xl font-black font-mono text-[#f5d77f] mt-1">
            {activeCount} <span className="text-xs font-normal text-[#8c8273]">/ {totalServices}</span>
          </div>
          <div className="text-[11px] text-[#a39c90] mt-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span>Configurable catalogue</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121215] border border-[#26221c]">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#8c8273]">Inventory Required</div>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
            None (0)
          </div>
          <div className="text-[11px] text-[#8c8273] mt-1">
            Services bypass stock tracking
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121215] border border-[#26221c]">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#8c8273]">QR Codes Required</div>
          <div className="text-2xl font-black font-mono text-sky-400 mt-1">
            None (0)
          </div>
          <div className="text-[11px] text-[#8c8273] mt-1">
            Reserved for physical products
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121215] border border-[#26221c]">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#8c8273]">All-Time Service Sales</div>
          <div className="text-2xl font-black font-mono text-[#f5d77f] mt-1">
            {settings.currencySymbol} {totalServiceRevenue.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#8c8273] mt-1">
            {serviceSalesCount} transactions recorded
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#f4efe8] flex items-center gap-2">
            <span>Official Store Services</span>
            <span className="px-2 py-0.5 rounded-full bg-[#1e1e24] text-[#f5d77f] text-xs font-mono font-bold border border-[#2a261f]">
              {services.length} Total
            </span>
          </h2>
          <span className="text-xs text-[#8c8273]">
            Click any service to edit its price or add directly to POS ticket
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {services.map((srv) => {
            const IconComponent = getServiceIcon(srv.name);
            const isPassport = srv.name === 'Passport Appointment';

            return (
              <div
                key={srv.id}
                className={`p-4 rounded-2xl bg-[#141417] border transition-all hover:border-[#d4af37]/60 flex flex-col justify-between relative overflow-hidden group ${
                  isPassport
                    ? 'border-[#d4af37]/50 shadow-xs bg-gradient-to-b from-[#18181f] to-[#121215]'
                    : 'border-[#26221c]'
                }`}
              >
                {/* Special highlight badge for Passport Appointment */}
                {isPassport && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-[#d4af37] to-[#b38e22] text-black text-[9px] font-black uppercase tracking-wider px-3 py-0.5 rounded-bl-xl shadow-xs">
                    Official Appointment
                  </div>
                )}

                <div>
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl border shrink-0 ${
                        isPassport
                          ? 'bg-[#d4af37]/20 border-[#d4af37]/40 text-[#f5d77f]'
                          : 'bg-[#1e1e24] border-[#2e2a22] text-[#d4af37]'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div className="flex-1 pr-12">
                      <h3 className="font-bold text-sm text-[#f4efe8] group-hover:text-[#f5d77f] transition-colors">
                        {srv.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 text-[10px] font-mono">
                          Service
                        </span>
                        <span className="text-[10px] text-[#8c8273] font-mono">
                          per {srv.unit || 'job'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#a39c90] mt-3 line-clamp-2 leading-relaxed min-h-[32px]">
                    {srv.description || 'Commercial in-store service provided upon request.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#26221c] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8c8273] block">
                      Price / Rate
                    </span>
                    <span className="text-base font-black font-mono text-[#f5d77f]">
                      {settings.currencySymbol} {srv.price.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(srv)}
                      className="p-2 rounded-xl bg-[#1c1c22] hover:bg-[#24242c] text-[#c4bcad] hover:text-[#f5d77f] border border-[#2a261f] transition-all cursor-pointer"
                      title="Edit price & details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleAddDirectToPos(srv)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c59b27] hover:brightness-110 text-black text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
                      title="Add to active POS checkout ticket"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add to POS</span>
                    </button>

                    {!['srv_printing', 'srv_laminating', 'srv_photocopying', 'srv_scanning', 'srv_binding', 'srv_passport_appointment'].includes(srv.id) && (
                      <button
                        onClick={() => handleDelete(srv)}
                        className="p-2 rounded-xl bg-[#1c1c22] hover:bg-rose-950 text-[#8c8273] hover:text-rose-300 border border-[#2a261f] transition-all cursor-pointer"
                        title="Delete service"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparison Reference Table */}
      <div className="p-4 rounded-2xl bg-[#121215] border border-[#26221c] space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#a39c90]">
          Standard Services Catalog Reference
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#26221c] text-[#8c8273] font-mono text-[11px]">
                <th className="py-2 px-3">Service Name</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Inventory Required</th>
                <th className="py-2 px-3">QR Code Required</th>
                <th className="py-2 px-3">Default Unit</th>
                <th className="py-2 px-3 text-right">Configured Price</th>
                <th className="py-2 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e24]">
              {services.map((srv) => (
                <tr key={srv.id} className="hover:bg-white/[0.02]">
                  <td className="py-2.5 px-3 font-semibold text-[#f4efe8]">
                    {srv.name}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-sky-950/60 text-sky-300 border border-sky-800/40 text-[10px] font-mono">
                      Service
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[#a39c90]">No</td>
                  <td className="py-2.5 px-3 font-mono text-[#a39c90]">No</td>
                  <td className="py-2.5 px-3 font-mono text-[#8c8273]">{srv.unit || 'job'}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-right text-[#f5d77f]">
                    {settings.currencySymbol} {srv.price.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-[#141417] border border-[#d4af37]/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#26221c]">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#f5d77f]" />
                <h3 className="font-bold text-base text-[#f4efe8]">
                  {editingService ? `Edit ${editingService.name}` : 'Add New Service'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#8c8273] hover:text-[#f4efe8] text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800/60 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#c4bcad] mb-1">
                  Service Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Passport Appointment, Printing, Laminating"
                  className="w-full px-3 py-2 rounded-xl bg-[#1c1c22] border border-[#2a261f] text-sm text-[#f4efe8] placeholder-[#7d7465] focus:outline-hidden focus:border-[#d4af37]"
                />
                <p className="text-[10px] text-[#8c8273] mt-1">
                  Do NOT enter "Document Typing" (prohibited).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#c4bcad] mb-1">
                    Price ({settings.currencySymbol}) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-[#1c1c22] border border-[#2a261f] text-sm font-mono text-[#f5d77f] focus:outline-hidden focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#c4bcad] mb-1">
                    Billing Unit
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="e.g. appointment, page, copy"
                    className="w-full px-3 py-2 rounded-xl bg-[#1c1c22] border border-[#2a261f] text-sm text-[#f4efe8] focus:outline-hidden focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#c4bcad] mb-1">
                  Service Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of service scope and client instructions..."
                  className="w-full px-3 py-2 rounded-xl bg-[#1c1c22] border border-[#2a261f] text-xs text-[#f4efe8] placeholder-[#7d7465] focus:outline-hidden focus:border-[#d4af37]"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#18181e] border border-[#26221c] space-y-1 text-xs text-[#a39c90]">
                <div className="font-semibold text-[#f4efe8]">Architecture Notice:</div>
                <div>• Inventory Required: <strong>No</strong> (does not decrease stock)</div>
                <div>• QR Code Required: <strong>No</strong> (no barcode/QR label generated)</div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1c1c22] hover:bg-[#24242c] text-[#c4bcad] border border-[#2a261f] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#d4af37] to-[#c59b27] text-black shadow-xs hover:brightness-110 cursor-pointer"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
