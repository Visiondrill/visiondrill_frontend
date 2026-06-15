'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { DollarSign, TrendingUp, Download, PieChart, BarChart3, ArrowUpRight, Loader2, CreditCard, Layout, X, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '@/components/Button';

export default function InstructorRevenue() {
  const [stats, setStats] = useState<any>(null);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [affiliateData, setAffiliateData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTransactions, setShowTransactions] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txPage, setTxPage] = useState(1);
  const [txLoading, setTxLoading] = useState(false);
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [withdrawalMessage, setWithdrawalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardRes, revenueRes, growthRes, affiliateRes] = await Promise.all([
          api.get('/instructor/dashboard-stats'),
          api.get('/instructor/revenue'),
          api.get('/instructor/revenue-growth'),
          api.get('/instructor/affiliate-earnings')
        ]);
        setStats({ ...dashboardRes.data, ...revenueRes.data });
        setGrowthData(growthRes.data);
        setAffiliateData(affiliateRes.data);
      } catch (err) {
        console.error('Failed to load data', err);
      } finally {
        setTimeout(() => setIsLoading(false), 500);
      }
    };
    fetchData();
  }, []);

  const handleRequestWithdrawal = async () => {
    setWithdrawalLoading(true);
    setWithdrawalMessage(null);
    try {
      const res = await api.post('/instructor/request-withdrawal', {});
      setWithdrawalMessage({ type: 'success', text: res.data.message || 'Withdrawal request submitted successfully.' });
      // Refresh stats
      const revenueRes = await api.get('/instructor/revenue');
      setStats((prev: any) => ({ ...prev, ...revenueRes.data }));
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to submit withdrawal request.';
      setWithdrawalMessage({ type: 'error', text: msg });
    } finally {
      setWithdrawalLoading(false);
    }
  };

  const fetchTransactions = async (page = 1) => {
    setTxLoading(true);
    try {
      const res = await api.get(`/instructor/transactions?page=${page}`);
      setTransactions(res.data?.data || res.data || []);
      setTxPage(page);
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    } finally {
      setTxLoading(false);
    }
  };

  const handleViewTransactions = () => {
    setShowTransactions(true);
    fetchTransactions(1);
  };

  const formatCurrency = (val: any) => {
    const num = parseFloat(val);
    return isNaN(num) ? '0.00' : num.toLocaleString(undefined, { minimumFractionDigits: 2 });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="bg-gray-50/50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">Revenue analytics</h1>
            <p className="text-gray-500 font-medium">Track your earnings, withdrawal history, and course performance.</p>
          </div>
          <Button 
            onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/instructor/export-revenue`, '_blank')}
            className="flex items-center gap-2 px-6 py-4 bg-gray-900 hover:bg-black text-sm font-semibold rounded-2xl transition-all shadow-xl shadow-gray-200"
          >
            <Download size={16} /> Export report
          </Button>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <FinanceCard title="Total earnings" value={`$${formatCurrency(stats?.total_earnings)}`} trend="+12.5%" icon={<DollarSign size={20} />} color="text-blue-600" bg="bg-blue-50" />
          <FinanceCard title="Pending payout" value={`$${formatCurrency(stats?.pending_payout)}`} trend="-0.0%" icon={<TrendingUp size={20} />} color="text-purple-600" bg="bg-purple-50" />
          <FinanceCard title="Courses sold" value={stats?.total_students?.toString() || '0'} trend="+5.0%" icon={<Layout size={20} />} color="text-orange-600" bg="bg-orange-50" />
          <FinanceCard title="Referral earnings" value={`$${formatCurrency(affiliateData?.total)}`} trend={`+${affiliateData?.referred_students || 0}.0%`} icon={<ArrowUpRight size={20} />} color="text-green-600" bg="bg-green-50" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Chart Placeholder */}
          <div className="lg:col-span-2 bg-white border border-gray-100 p-8 rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-gray-900 tracking-tighter flex items-center gap-3">
                <BarChart3 className="text-blue-600" size={20} /> Monthly revenue
              </h3>
              <select className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-semibold outline-none focus:border-blue-400">
                <option>Last 6 months</option>
                <option>Last year</option>
              </select>
            </div>
            <div className="h-[300px] w-full bg-gray-50 rounded-3xl p-8 flex flex-col justify-end gap-2 border border-gray-100 group-hover:border-blue-100 transition-colors">
              <div className="flex items-end justify-between h-full gap-4">
                {growthData.length > 0 ? (
                  growthData.map((item: any, idx: number) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group/bar">
                      <div 
                        className="w-full bg-blue-100 rounded-t-lg group-hover/bar:bg-blue-600 transition-all relative overflow-hidden"
                        style={{ height: `${Math.min(100, (item.total / (Math.max(...growthData.map(d => d.total)) || 1)) * 100)}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent" />
                      </div>
                      <span className="text-[9px] font-black text-gray-400 tracking-tighter uppercase">{item.month.split('-')[1]}</span>
                      <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-10 bg-black text-white text-[10px] py-1 px-2 rounded font-black whitespace-nowrap transition-opacity">
                        KES {item.total}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                    <PieChart className="text-gray-200 group-hover:text-blue-100 transition-colors" size={64} />
                    <p className="text-xs font-medium text-gray-400">No revenue data for the selected period</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Sales */}
          <div className="lg:col-span-1 bg-white border border-gray-100 p-8 rounded-2xl shadow-sm">
            <h3 className="text-lg font-black text-gray-900 tracking-tighter mb-8 flex items-center gap-3">
              <CreditCard className="text-purple-600" size={20} /> Latest sales
            </h3>
            <div className="space-y-4">
              {stats?.recent_sales?.length > 0 ? (
                stats.recent_sales.map((sale: any) => (
                  <div key={sale.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl hover:bg-white hover:shadow-lg hover:shadow-gray-100 transition-all border border-transparent hover:border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm font-semibold text-xs">
                        #{sale.id}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate max-w-[120px]">{sale.course_title}</p>
                        <p className="text-xs text-gray-400 font-medium">{sale.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-gray-900">+${sale.amount}</p>
                      <span className="text-xs font-semibold text-green-500 bg-green-50 px-2 py-0.5 rounded">{sale.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-xs font-medium text-gray-400">No recent sales</p>
                </div>
              )}
            </div>
            <button
              onClick={handleViewTransactions}
              className="w-full mt-6 py-4 text-xs font-semibold text-gray-400 hover:text-blue-600 border-t border-gray-50 transition-colors"
            >
              View all transactions
            </button>
          </div>
        </div>

        {/* Withdrawal Area */}
        <div className="bg-blue-950 rounded-2xl p-10 text-white relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 p-24 bg-blue-500/10 blur-[100px] rounded-full -mr-20 -mt-20" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <h2 className="text-3xl font-black mb-4">Cashing out your profit?</h2>
              <p className="text-gray-400 font-medium leading-relaxed mb-8">
                We process all instructor payouts on a bi-weekly basis. Ensure your payout details (M-Pesa/Bank) are correctly verified in your school settings.
              </p>
              <div className="flex flex-wrap items-center gap-8">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Available for withdrawal</p>
                  <p className="text-4xl font-black text-blue-400">KES {formatCurrency(stats?.available_withdrawal)}</p>
                </div>
                <div className="h-12 w-px bg-white/10 hidden md:block" />
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Total Earned (Verified)</p>
                  <p className="text-xl font-black text-white">KES {formatCurrency(stats?.total_earnings)}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <button
                onClick={handleRequestWithdrawal}
                disabled={withdrawalLoading}
                className="px-12 py-5 bg-blue-600 hover:bg-black text-white font-semibold rounded-xl transition-all shadow-2xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {withdrawalLoading ? 'Submitting...' : 'Request withdrawal'}
              </button>
              {withdrawalMessage && (
                <div className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg ${withdrawalMessage.type === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                  {withdrawalMessage.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  {withdrawalMessage.text}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Transactions Modal */}
      {showTransactions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-900">All Transactions</h3>
              <button onClick={() => setShowTransactions(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh] p-8">
              {txLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-blue-600" size={32} />
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm font-semibold text-xs">
                          #{tx.id}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-900">{tx.course?.course_title || 'Course'}</p>
                          <p className="text-[10px] text-gray-400 font-medium">
                            {tx.user?.first_name || 'Student'} {tx.user?.last_name || ''} · {new Date(tx.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-gray-900">${formatCurrency(tx.instructor_revenue)}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${tx.payment_status === 'completed' ? 'bg-green-50 text-green-500' : 'bg-amber-50 text-amber-500'}`}>
                          {tx.payment_status || 'pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-xs font-medium text-gray-400">No transactions found.</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-center gap-4">
              <button
                onClick={() => fetchTransactions(Math.max(1, txPage - 1))}
                disabled={txPage <= 1 || txLoading}
                className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-blue-600 disabled:opacity-30"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-xs font-bold text-gray-900">Page {txPage}</span>
              <button
                onClick={() => fetchTransactions(txPage + 1)}
                disabled={transactions.length < 20 || txLoading}
                className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-blue-600 disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FinanceCard({ title, value, trend, icon, color, bg }: any) {
  const isUp = trend.startsWith('+');
  return (
    <div className="bg-white border border-gray-100 p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className={`${bg} ${color} w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
          {icon}
        </div>
        <div className="flex flex-col items-end">
          <span className={`text-xs font-semibold ${isUp ? 'text-blue-500' : 'text-red-500'}`}>{trend}</span>
          <span className="text-xs font-medium text-gray-400 mt-1">Status</span>
        </div>
      </div>
      <div className="text-3xl font-black text-gray-900 tracking-tighter mb-1">{value}</div>
      <p className="text-xs font-medium text-gray-400">{title}</p>
    </div>
  );
}