'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { collection, getDocs, getDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../../../../firebase/clientApp';
import {
  Search,
  Home,
  Building2,
  Eye,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export default function PropertiesTab({ user }) {
  const [properties, setProperties] = useState([]);
  const [allUsers, setAllUsers] = useState({});
  const [allAgentDocs, setAllAgentDocs] = useState({});
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [propertiesSnap, usersRes] = await Promise.all([
          getDocs(collection(db, 'properties')),
          fetch(`/api/admin/users?adminUid=${user.uid}`),
        ]);
        const usersData = await usersRes.json();

        const userMap = {};
        for (const u of usersData.users || []) {
          userMap[u.id] = u;
        }

        const props = propertiesSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p) => p.active !== false && p.archived !== true)
          .sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
            const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
            return bTime - aTime;
          });

        // Fetch opinion + registered interest counts from offers collection
        const propertyIds = props.map(p => p.id);
        const opinionCounts = {};
        const interestCounts = {};
        for (let i = 0; i < propertyIds.length; i += 30) {
          const batch = propertyIds.slice(i, i + 30);
          const offersSnap = await getDocs(
            query(collection(db, 'offers'), where('propertyId', 'in', batch))
          );
          offersSnap.docs.forEach(d => {
            const data = d.data();
            if (data.type === 'opinion') {
              opinionCounts[data.propertyId] = (opinionCounts[data.propertyId] || 0) + 1;
              if (data.serious === true) {
                interestCounts[data.propertyId] = (interestCounts[data.propertyId] || 0) + 1;
              }
            }
          });
        }

        // Attach counts to properties
        const propsWithCounts = props.map(p => ({
          ...p,
          _opinionCount: opinionCounts[p.id] || 0,
          _interestCount: interestCounts[p.id] || 0,
        }));

        setAllUsers(userMap);
        setProperties(propsWithCounts);

        // Fetch all agent docs referenced by properties
        const agentIds = [...new Set(props.map(p => p.agentId).filter(Boolean))];
        if (agentIds.length > 0) {
          const agentDocsMap = {};
          await Promise.all(
            agentIds.map(async (agentId) => {
              try {
                const agentDoc = await getDoc(doc(db, 'agents', agentId));
                if (agentDoc.exists()) {
                  agentDocsMap[agentId] = { id: agentId, ...agentDoc.data() };
                }
              } catch (err) {
                console.error('Error fetching agent doc:', agentId, err);
              }
            })
          );
          setAllAgentDocs(agentDocsMap);
        }
      } catch (err) {
        console.error('Properties fetch error:', err);
      } finally {
        setPropertiesLoading(false);
      }
    }
    fetchData();
  }, [user.uid]);

  const filteredProperties = useMemo(() => {
    let result = properties;

    if (filter === 'public') result = result.filter((p) => p.visibility === true);
    else if (filter === 'private') result = result.filter((p) => !p.visibility);
    else if (filter === 'archived') result = result.filter((p) => p.archived === true);

    if (agentFilter) {
      result = result.filter((p) => p.agentId === agentFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => {
        const address = (p.address || p.formattedAddress || '').toLowerCase();
        const agentUid = p.userId || p.uid;
        const agent = allUsers[agentUid];
        const agentName = agent
          ? [agent.firstName, agent.lastName].filter(Boolean).join(' ').toLowerCase()
          : '';
        return address.includes(q) || agentName.includes(q);
      });
    }

    return result;
  }, [properties, search, filter, agentFilter, allUsers]);

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'public', label: 'Public' },
    { key: 'private', label: 'Private' },
    { key: 'archived', label: 'Archived' },
  ];

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by address or agent name..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm text-sm"
        />
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              filter === f.key
                ? 'bg-orange-500 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
        {Object.keys(allAgentDocs).length > 0 && (
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium rounded-full border border-slate-200 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="">All agents</option>
            {Object.values(allAgentDocs).map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-600">
            Properties ({filteredProperties.length})
          </h2>
        </div>

        {propertiesLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500" />
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-16">
            <Home className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No properties found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredProperties.map((p) => {
              const agentUid = p.userId || p.uid;
              const agent = allUsers[agentUid];
              const agentName = agent
                ? [agent.firstName, agent.lastName].filter(Boolean).join(' ')
                : 'Unknown';

              return (
                <Link
                  key={p.id}
                  href={`/dashboard/property/${p.id}`}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group block"
                >
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {p.imageUrls?.[0] || p.imageUrl || p.images?.[0] ? (
                      <img src={p.imageUrls?.[0] || p.imageUrl || p.images?.[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">
                      {p.address || p.formattedAddress || 'No address'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {agentName}
                      {p.agentId && allAgentDocs[p.agentId] && (
                        <span className="text-orange-500"> ({allAgentDocs[p.agentId].name})</span>
                      )}
                      {' '}&middot; {p.price || '--'}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 flex-shrink-0 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {p.stats?.views || 0}
                    </span>
                    <span>{p._opinionCount || 0} opinions</span>
                    <span>{p._interestCount || 0} interested</span>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full flex-shrink-0 ${
                    p.visibility ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {p.visibility ? 'Public' : 'Private'}
                  </span>
                  <div className="hidden sm:block text-xs text-slate-500 w-28 text-right">
                    {formatDate(p.createdAt)}
                  </div>
                  <button
                    title="Open public listing"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(`/find-property?propertyId=${p.id}`, '_blank'); }}
                    className="p-1.5 hover:bg-orange-50 rounded-lg text-slate-400 hover:text-orange-500 transition-colors flex-shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
