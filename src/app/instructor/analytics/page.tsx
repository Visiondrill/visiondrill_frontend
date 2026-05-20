'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { 
  BarChart3, Users, BookOpen, Target, TrendingUp, TrendingDown, Clock, 
  ArrowUpRight, ArrowDownRight, Globe, Filter, Download, Zap, Sparkles
} from 'lucide-react';

export default function InstructorAnalytics() {
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, analyticsRes] = await Promise.all([
          api.get('/instructor/dashboard-stats'),
          api.get('/instructor/analytics')
        ]);
        setStats(statsRes.data);
        setAnalytics(analyticsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-16 h-16 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-xs font-black text-gray-400 tracking-[0.3em] uppercase animate-pulse">Initializing Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
             <div className="px-3 py-1 bg-blue-600/10 border border-blue-600/20 rounded-full text-blue-600 text-[10px] font-black tracking-widest uppercase">
                Tactical Telemetry
             </div>
             <span className="text-xs text-gray-400 font-bold">• Last Sync: {new Date().toLocaleTimeString()}</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter leading-tight">
             Performance <br /><span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent italic">Command Center.</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-4 bg-white border border-gray-100 rounded-2xl text-[10px] font-black text-gray-500 hover:bg-gray-50 transition-all shadow-sm active:scale-95">
             <Filter size={14} /> FILTER ENGINE
          </button>
          <button className="flex items-center gap-2 px-6 py-4 bg-blue-950 text-white rounded-2xl text-[10px] font-black hover:bg-black transition-all shadow-2xl shadow-blue-100 active:scale-95">
             <Download size={14} /> EXPORT AUDIT
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          icon={Users} 
          label="NETWORK REACH" 
          value={stats?.total_students || 0} 
          trend="+12.4%" 
          positive={true} 
          color="blue"
        />
        <MetricCard 
          icon={BookOpen} 
          label="MODULE UTILIZATION" 
          value={analytics?.utilization || "0%"} 
          trend="+3.1%" 
          positive={true} 
          color="emerald"
        />
        <MetricCard 
          icon={Target} 
          label="COMPLETION VELOCITY" 
          value={analytics?.completion_velocity || "0%"} 
          trend="-1.2%" 
          positive={false} 
          color="indigo"
        />
        <MetricCard 
          icon={TrendingUp} 
          label="REVENUE YIELD" 
          value={`KES ${stats?.total_earnings || 0}`} 
          trend="+18.7%" 
          positive={true} 
          color="blue"
        />
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Engagement Velocity Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-[3rem] p-10 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-40 bg-blue-50/20 blur-[120px] rounded-full -mr-20 -mt-20 group-hover:bg-blue-100/30 transition-colors duration-1000"></div>
           <div className="relative z-10">
              <div className="flex items-center justify-between mb-10">
                 <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Access Velocity</h3>
                    <p className="text-sm text-gray-400 font-medium mt-1">Student registration cycles monitored over 30 days.</p>
                 </div>
                 <div className="flex gap-2 bg-gray-50 p-1.5 rounded-2xl">
                    {['24H', '7D', '30D', 'ALL'].map(t => (
                       <button key={t} className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all ${t === '30D' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>
                          {t}
                       </button>
                    ))}
                 </div>
              </div>
              
              <div className="h-72 flex items-end justify-between gap-2 px-2 mt-12">
                 {(analytics?.velocity || Array(30).fill(0)).map((val: number, i: number) => (
                    <div key={i} className="flex-1 group/bar relative h-full flex flex-col justify-end">
                       <div 
                         style={{ height: `${Math.max(10, (val/20) * 100)}%` }} 
                         className="bg-gray-100 group-hover/bar:bg-blue-600 transition-all rounded-full relative"
                       >
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-all scale-75 group-hover/bar:scale-100 whitespace-nowrap z-20 pointer-events-none shadow-xl">
                             DAY {i+1}: {val} ENROLLS
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
              <div className="pt-8 border-t border-gray-50 mt-8 flex justify-between">
                 <p className="text-[10px] font-black text-gray-300 tracking-[0.2em] uppercase">SYSTEM START</p>
                 <p className="text-[10px] font-black text-blue-600 tracking-[0.2em] uppercase">REAL-TIME ACTIVE</p>
              </div>
           </div>
        </div>

        {/* Breakdown Panel */}
        <div className="bg-gray-900 rounded-[3rem] p-12 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 left-0 p-32 bg-blue-600/10 blur-[100px] rounded-full -ml-16 -mt-16"></div>
           <div className="relative z-10">
              <h3 className="text-2xl font-black tracking-tight mb-10 leading-tight">Segment<br /><span className="text-blue-400 italic font-medium">Architecture</span></h3>
              <div className="space-y-8">
                 {(analytics?.segments || []).map((seg: any, idx: number) => (
                   <SegmentRow key={idx} label={seg.label} percentage={seg.percentage} color={idx === 1 ? "bg-indigo-400" : idx === 2 ? "bg-blue-400" : "bg-blue-600"} />
                 ))}
              </div>
           </div>
           
           <div className="pt-12 border-t border-white/5 relative z-10">
              <div className="bg-white/5 rounded-[2rem] p-8 border border-white/5 hover:bg-white/10 transition-colors cursor-default">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-600/20 rounded-xl text-blue-400">
                       <Globe size={20} />
                    </div>
                    <p className="text-[11px] font-black tracking-widest uppercase text-gray-400">Primary Territory</p>
                 </div>
                 <p className="text-3xl font-black">Nairobi, KE</p>
                 <p className="text-xs text-gray-500 font-bold mt-2">Dominating 42% of global session throughput.</p>
              </div>
           </div>
        </div>
      </div>

      {/* Asset Performance Table */}
      <div className="bg-white border border-gray-100 rounded-[3rem] overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-700">
        <div className="p-12 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
           <div>
              <h3 className="text-2xl font-black tracking-tight text-gray-900">Module Intelligence Audit</h3>
              <p className="text-sm text-gray-400 font-medium mt-1">Deep-dive performance metrics for every live instructional asset.</p>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex -space-x-4">
                 {[1,2,3].map(i => (
                   <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400">
                      {i}
                   </div>
                 ))}
                 <div className="w-10 h-10 rounded-full border-4 border-white bg-blue-600 flex items-center justify-center text-[10px] font-black text-white">
                    +8
                 </div>
              </div>
           </div>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-12 py-6 text-[11px] font-black text-gray-400 tracking-widest uppercase">INSTRUCTIONAL MODULE</th>
                    <th className="px-12 py-6 text-[11px] font-black text-gray-400 tracking-widest uppercase text-center">TRAFFIC</th>
                    <th className="px-12 py-6 text-[11px] font-black text-gray-400 tracking-widest uppercase text-center">COMPLETION</th>
                    <th className="px-12 py-6 text-[11px] font-black text-gray-400 tracking-widest uppercase text-center">SCORE INDEX</th>
                    <th className="px-12 py-6 text-[11px] font-black text-gray-400 tracking-widest uppercase text-right">SYSTEM TAG</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {(analytics?.asset_audit || []).map((module: any, idx: number) => (
                    <ModuleRow 
                      key={idx}
                      name={module.name} 
                      enrollment={module.enrollment} 
                      completion={module.completion} 
                      quiz={module.quiz} 
                      status={module.status} 
                    />
                 ))}
                 {(!analytics?.asset_audit || analytics?.asset_audit?.length === 0) && (
                   <tr>
                     <td colSpan={5} className="px-12 py-24 text-center ">
                        <BarChart3 className="mx-auto mb-4 text-gray-100" size={64} />
                        <p className="text-gray-400 font-black tracking-widest text-xs uppercase">No intelligence data points discovered.</p>
                     </td>
                   </tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, trend, positive, color }: any) {
  return (
    <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:shadow-2xl hover:border-blue-200 transition-all duration-500 relative overflow-hidden">
       <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
             <div className={`p-4 rounded-2xl ${color === 'blue' ? 'bg-blue-50 text-blue-600' : color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'} group-hover:scale-110 transition-transform`}>
                <Icon size={22} strokeWidth={2.5} />
             </div>
             <div className={`flex items-center gap-1 text-[11px] font-black px-3 py-1.5 rounded-full ${positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {trend}
             </div>
          </div>
          <p className="text-[11px] font-black text-gray-400 tracking-widest uppercase mb-1">{label}</p>
          <p className="text-4xl font-black text-gray-900 tracking-tighter">{value}</p>
       </div>
    </div>
  );
}

function SegmentRow({ label, percentage, color }: any) {
  return (
    <div className="space-y-3">
       <div className="flex justify-between text-[11px] font-black tracking-widest uppercase">
          <span className="text-gray-500">{label}</span>
          <span className="text-white text-xs">{percentage}%</span>
       </div>
       <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(37,99,235,0.4)]`} style={{ width: `${percentage}%` }}></div>
       </div>
    </div>
  );
}

function ModuleRow({ name, enrollment, completion, quiz, status }: any) {
  return (
    <tr className="hover:bg-gray-50/50 transition-all cursor-default group">
       <td className="px-12 py-8">
          <p className="text-base font-black text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors">{name}</p>
       </td>
       <td className="px-12 py-8 text-center">
          <span className="text-sm font-bold text-gray-500 font-sans tracking-tight">{enrollment} Users</span>
       </td>
       <td className="px-12 py-8 text-center">
          <div className="flex items-center justify-center gap-3">
             <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden shrink-0">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: completion }}></div>
             </div>
             <span className="text-xs font-black text-gray-900 w-12">{completion}</span>
          </div>
       </td>
       <td className="px-12 py-8 text-center font-mono text-[11px] font-black text-gray-400">
          {quiz}
       </td>
       <td className="px-12 py-8 text-right">
          <div className={`inline-flex px-4 py-2 rounded-xl text-[10px] font-black tracking-widest shadow-sm ${
            status === 'OPTIMAL' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
            status === 'HIGH PFM' ? 'bg-blue-600/10 text-blue-600 border border-blue-600/20' : 
            'bg-amber-500/10 text-amber-500 border border-amber-500/20'
          }`}>
             {status}
          </div>
       </td>
    </tr>
  );
}
