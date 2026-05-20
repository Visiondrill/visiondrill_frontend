'use client';

import React, { useState } from 'react';
import { 
  X, ChevronRight, Zap, Loader2, ShieldCheck, Sparkles, Check
} from 'lucide-react';

interface CourseCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { course_title: string; category_id: string; price: string }) => Promise<void>;
  isCreating: boolean;
}

import { api } from '@/lib/api';

interface Category {
  id: number;
  name: string;
}

export default function CourseCreateModal({ isOpen, onClose, onSubmit, isCreating }: CourseCreateModalProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ course_title: '', category_id: '', price: '' });
  const [categories, setCategories] = useState<Category[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      api.get('/instructor/categories')
        .then(res => setCategories(res.data))
        .catch(err => console.error('Failed to fetch categories:', err));
    }
  }, [isOpen]);

  const handleNext = () => {
    if (step === 1 && !form.course_title) return;
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleDeploy = async () => {
    await onSubmit(form);
    setStep(1);
    setForm({ course_title: '', category_id: '', price: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-blue-950/20 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl relative">
        <button 
          onClick={() => {
            onClose();
            setStep(1);
          }} 
          className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors z-10"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col md:flex-row h-full">
          {/* Mobile Step Indicator */}
          <div className="md:hidden flex justify-between px-10 pt-10 pb-0">
             {[1, 2, 3].map(n => (
               <div key={n} className={`h-1 flex-1 mx-1 rounded-full ${step >= n ? 'bg-blue-600' : 'bg-gray-100'}`}></div>
             ))}
          </div>

          {/* Step Indicator Sidebar (Desktop) */}
          <div className="w-full md:w-64 bg-gray-50 p-10 border-r border-gray-100 hidden md:block">
            <div className="space-y-8">
              <StepItem number={1} label="Identity" active={step === 1} completed={step > 1} />
              <StepItem number={2} label="Monetization" active={step === 2} completed={step > 2} />
              <StepItem number={3} label="Architecture" active={step === 3} completed={step > 3} />
            </div>
          </div>

          <div className="flex-1 p-8 md:p-12">
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                   <h2 className="text-3xl font-black text-gray-900 tracking-tighter mb-2">Course Identity</h2>
                   <p className="text-xs font-medium text-gray-400">Initialize your curriculum with a strong title and focus area.</p>
                </div>
                <div className="space-y-6">
                  <div className="group">
                    <label className="block text-[10px] font-black text-gray-400 tracking-widest mb-3">TITLE</label>
                    <input
                      autoFocus
                      required
                      placeholder="e.g. Advanced System Architecture..."
                      value={form.course_title}
                      onChange={e => setForm({ ...form, course_title: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-8 focus:ring-blue-50 focus:border-blue-200 transition-all"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-black text-gray-400 tracking-widest mb-3">VERTICAL</label>
                    <select
                      value={form.category_id}
                      onChange={e => setForm({ ...form, category_id: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-8 focus:ring-blue-50 focus:border-blue-200 transition-all appearance-none"
                    >
                      <option value="">Select a category...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button 
                  onClick={handleNext}
                  className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl text-sm hover:bg-gray-900 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-100 active:scale-95"
                >
                  Infrastructure settings <ChevronRight size={18} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div>
                   <h2 className="text-3xl font-black text-gray-900 tracking-tighter mb-2">Revenue Model</h2>
                   <p className="text-xs font-medium text-gray-400">Set the market value for this instructional asset.</p>
                </div>
                <div className="space-y-6">
                  <div className="group">
                    <label className="block text-[10px] font-black text-gray-400 tracking-widest mb-3">VALUATION (KES)</label>
                    <input
                      type="number"
                      placeholder="0 for free course..."
                      value={form.price}
                      onChange={e => setForm({ ...form, price: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-8 focus:ring-blue-50 focus:border-blue-200 transition-all"
                    />
                  </div>
                  <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                     <div className="flex gap-3">
                        <Sparkles size={18} className="text-blue-600 shrink-0" />
                        <p className="text-xs text-blue-900 font-medium leading-relaxed">
                           Instructors who set a valuation typically see 4x higher retention rates compared to free assets.
                        </p>
                     </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={handleBack}
                    className="flex-1 py-5 bg-gray-50 text-gray-400 font-black rounded-2xl text-sm hover:bg-gray-100 transition-all active:scale-95"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleNext}
                    className="flex-[2] py-5 bg-blue-600 text-white font-black rounded-2xl text-sm hover:bg-gray-900 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-100 active:scale-95"
                  >
                    Finalize architecture <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center py-6">
                   <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Zap size={32} className="text-blue-600 animate-pulse" />
                   </div>
                   <h2 className="text-3xl font-black text-gray-900 tracking-tighter mb-2">Ready for deployment</h2>
                   <p className="text-xs font-medium text-gray-400 max-w-[280px] mx-auto">
                      Internal systems have verified the course configuration. You are now ready to initialize the asset.
                   </p>
                </div>
                
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleDeploy} 
                    disabled={isCreating} 
                    className="w-full py-5 bg-gray-900 text-white font-black rounded-2xl text-sm hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl shadow-gray-200 active:scale-95"
                  >
                    {isCreating ? <Loader2 className="animate-spin" /> : <ShieldCheck size={18} />} Deploy course
                  </button>
                  <button 
                     onClick={handleBack}
                     className="w-full py-4 text-xs font-black text-gray-400 hover:text-gray-900 transition-all"
                  >
                     Review configuration
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepItem({ number, label, active, completed }: { number: number, label: string, active: boolean, completed: boolean }) {
  return (
    <div className={`flex items-center gap-4 transition-all ${active || completed ? 'opacity-100' : 'opacity-30'}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${
        completed ? 'bg-emerald-500 text-white' :
        active ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 
        'bg-white text-gray-400 border border-gray-100'
      }`}>
        {completed ? <Check size={14} /> : number}
      </div>
      <span className={`text-[10px] font-black tracking-widest uppercase transition-colors ${active ? 'text-gray-900' : 'text-gray-400'}`}>
        {label}
      </span>
    </div>
  );
}
