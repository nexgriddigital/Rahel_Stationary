import React, { useState } from 'react';
import { storage } from '../services/storage';
import { ActivityLog } from '../types';
import { ScrollText, Search, Shield, Filter, Clock } from 'lucide-react';

export const ActivityLogsView: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>(storage.getLogs());
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredLogs = logs.filter((log) => {
    const matchesCat = selectedCategory === 'all' || log.category === selectedCategory;
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col p-4 sm:p-6 overflow-hidden bg-[#0a0a0c] text-[#f4efe8]">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#26221c]">
        <div>
          <h2 className="text-xl font-bold text-[#f5d77f]">
            System Activity & Security Audit Logs
          </h2>
          <p className="text-xs text-[#998b7a]">
            Tamper-evident chronological ledger tracking transactions, staff logins, price modifications & cash shift events.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#f5d77f] font-semibold bg-[#d4af37]/15 px-3 py-1.5 rounded-xl border border-[#d4af37]/40 shadow-xs">
          <Shield className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Audit Log Immutable ({logs.length} events)</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7d6f]" />
          <input
            type="text"
            placeholder="Search audit trail by staff, action keyword, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[#141417] border border-[#26221c] text-[#f4efe8] placeholder-[#736657] focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-[#141417] p-1 rounded-xl border border-[#26221c] text-xs">
          {(['all', 'sale', 'inventory', 'shift', 'staff', 'expense', 'security'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg font-medium capitalize transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#aa8010] text-black font-bold shadow-xs'
                  : 'text-[#998b7a] hover:text-[#f4efe8] hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="flex-1 rounded-2xl border border-[#26221c] bg-[#141417] overflow-hidden flex flex-col shadow-2xs">
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-[#18181c] text-[#998b7a] font-medium border-b border-[#26221c]">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-3">Action Event</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Performed By</th>
                <th className="py-2.5 px-4">Audit Details & Event Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#26221c] text-[#f4efe8]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#8b7d6f]">
                    No activity logs match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-[#998b7a]">
                      {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-xs text-[#f5d77f]">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold tracking-wider bg-[#26221c] text-[#d4af37] border border-[#d4af37]/30">
                        {log.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#f4efe8]">{log.performedBy}</td>
                    <td className="py-2.5 px-4 text-[#c4bbb0] text-[11px] max-w-md">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
