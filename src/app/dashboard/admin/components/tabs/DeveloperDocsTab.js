'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import DevDocsContent from './DevDocsContent';

export default function DeveloperDocsTab() {
  const [expandedSection, setExpandedSection] = useState('architecture');

  const sections = [
    { key: 'architecture', title: 'Architecture Overview' },
    { key: 'data-model', title: 'Data Model' },
    { key: 'buyer-score', title: 'Buyer Score Algorithm' },
    { key: 'seller-score', title: 'Seller Score Algorithm' },
    { key: 'market-forecast', title: 'Market Forecast' },
    { key: 'score-pipeline', title: 'Score Pre-computation Pipeline' },
    { key: 'api-endpoints', title: 'API Endpoints' },
    { key: 'tech-stack', title: 'Tech Stack' },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Internal Developer Documentation</h2>
        <p className="text-sm text-slate-500">
          Platform architecture, algorithms, and technical reference. Admin-only.
        </p>
      </div>

      {sections.map((section) => (
        <div key={section.key} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === section.key ? null : section.key)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
            <ChevronRight
              className={`w-4 h-4 text-slate-400 transition-transform ${
                expandedSection === section.key ? 'rotate-90' : ''
              }`}
            />
          </button>
          {expandedSection === section.key && (
            <div className="px-6 pb-6 border-t border-slate-100 pt-4">
              <DevDocsContent sectionKey={section.key} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
