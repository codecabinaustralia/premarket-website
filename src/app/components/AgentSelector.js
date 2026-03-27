'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, User } from 'lucide-react';

export default function AgentSelector({ agents, selectedAgentId, onSelect, onAddNew }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = agents.find((a) => a.id === selectedAgentId);

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-2">Assign Agent (Optional)</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all text-left"
      >
        {selected ? (
          <>
            {selected.avatar ? (
              <img src={selected.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-orange-600" />
              </div>
            )}
            <span className="text-sm font-medium text-slate-900 flex-1 truncate">{selected.name}</span>
          </>
        ) : (
          <span className="text-sm text-slate-400 flex-1">No agent selected</span>
        )}
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {/* None option */}
          <button
            type="button"
            onClick={() => { onSelect(null); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left text-sm text-slate-500"
          >
            No agent
          </button>

          {agents.map((agent) => (
            <button
              key={agent.id}
              type="button"
              onClick={() => { onSelect(agent.id); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 text-left transition-colors ${
                selectedAgentId === agent.id ? 'bg-orange-50' : ''
              }`}
            >
              {agent.avatar ? (
                <img src={agent.avatar} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-3.5 h-3.5 text-orange-600" />
                </div>
              )}
              <span className="text-sm font-medium text-slate-900 truncate">{agent.name}</span>
            </button>
          ))}

          {/* Add new agent */}
          <button
            type="button"
            onClick={() => { onAddNew(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 border-t border-slate-100 hover:bg-slate-50 text-left"
          >
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Plus className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <span className="text-sm font-semibold text-orange-600">Add new agent</span>
          </button>
        </div>
      )}
    </div>
  );
}
