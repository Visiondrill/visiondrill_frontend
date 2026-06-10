'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { 
  Users, 
  Search, 
  Mail, 
  PlusCircle, 
  X, 
  Loader2, 
  CheckCircle, 
  BookOpen,
  Filter,
  MoreVertical,
  Target
} from 'lucide-react';
import Button from '@/components/Button';

interface Employee {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  courses: { id: number; title: string; completed: boolean }[];
}

interface Program {
  id: number;
  title: string;
}

export default function StaffManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [assignForm, setAssignForm] = useState({ employee_email: '', course_id: '' });
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignStatus, setAssignStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [empRes, progRes] = await Promise.all([
        api.get('/business/employees'),
        api.get('/business/training-programs'),
      ]);
      setEmployees(empRes.data);
      setPrograms(progRes.data);
    } catch (err) {
      console.error('Failed to load staff data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignStatus(null);
    setIsAssigning(true);
    try {
      await api.post('/business/assign-course', {
        employee_email: assignForm.employee_email,
        course_id: parseInt(assignForm.course_id),
      });
      setAssignStatus('success');
      setTimeout(() => {
         setShowAssignModal(false);
         setAssignStatus(null);
         setAssignForm({ employee_email: '', course_id: '' });
      }, 2000);
      fetchData();
    } catch (err: any) {
      setAssignStatus(err.response?.data?.message || 'Assignment failed.');
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-600" size={40} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900  tracking-tight mb-2">Staff Registry</h1>
          <p className="text-gray-500 font-medium">Assign programs and monitor employee training compliance.</p>
        </div>
        <Button 
          onClick={() => setShowAssignModal(true)}
          className="flex items-center gap-2 px-8 py-5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-3xl  tracking-widest text-[11px] shadow-xl shadow-purple-100"
        >
          <PlusCircle size={18} /> Assign Training
        </Button>
      </div>

      <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        {/* Filters */}
        <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex flex-col md:flex-row gap-4">
           <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                 type="text" 
                 placeholder="Search staff by name or email..."
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-purple-50 focus:border-purple-400 outline-none font-medium transition-all"
              />
           </div>
           <button className="px-6 py-4 bg-white border border-gray-100 rounded-2xl flex items-center gap-3 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
              <Filter size={18} /> Filter List
           </button>
        </div>

        {/* List */}
        <div className="flex-grow p-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEmployees.map(emp => (
                 <div key={emp.id} className="p-6 bg-white border border-gray-50 rounded-[2rem] hover:border-purple-100 hover:shadow-xl hover:shadow-purple-50/20 transition-all group flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                       <div className="flex items-center gap-4">
                           <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 font-black text-xl shadow-inner overflow-hidden relative">
                              <span className="absolute inset-0 flex items-center justify-center">{emp.name[0]}</span>
                              {emp.avatar && (
                                 <img 
                                    src={emp.avatar} 
                                    className="absolute inset-0 w-full h-full object-cover" 
                                    alt="" 
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                 />
                              )}
                           </div>
                          <div>
                             <h4 className="font-black text-gray-900 group-hover:text-purple-600 transition-colors  tracking-tight">{emp.name}</h4>
                             <div className="flex items-center gap-2 mt-1 text-xs font-medium text-gray-400">
                                <Mail size={12} /> {emp.email}
                             </div>
                          </div>
                       </div>
                       <button className="p-2 text-gray-300 hover:text-gray-900 transition-colors">
                          <MoreVertical size={20} />
                       </button>
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-center justify-between text-[10px] font-black  tracking-widest text-gray-400">
                          <span>Assigned Programs</span>
                          <span>{emp.courses.length} Total</span>
                       </div>
                       <div className="flex flex-wrap gap-2">
                          {emp.courses.length === 0 ? (
                             <span className="text-[10px] font-bold text-gray-300 italic">No courses assigned yet.</span>
                          ) : (
                             emp.courses.map(course => (
                                <div key={course.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black  tracking-wider ${course.completed ? 'bg-green-50 border-green-100 text-green-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                                   {course.completed ? <CheckCircle size={10} /> : <Target size={10} />}
                                   <span className="truncate max-w-[120px]">{course.title}</span>
                                </div>
                             ))
                          )}
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl relative animate-in zoom-in duration-300">
            <button onClick={() => setShowAssignModal(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400">
              <X size={24} />
            </button>
            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6 shadow-inner">
               <BookOpen size={32} />
            </div>
            <h3 className="text-2xl font-black text-gray-900  tracking-tight mb-2">Enroll Employee</h3>
            <p className="text-sm text-gray-500 font-medium mb-8">Assign a mandatory training program to a staff member.</p>

            {assignStatus === 'success' ? (
              <div className="p-12 text-center space-y-4">
                 <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto animate-bounce">
                    <CheckCircle size={40} />
                 </div>
                 <p className="text-green-700 font-black  tracking-widest text-sm">Enrollment Complete!</p>
              </div>
            ) : (
              <form onSubmit={handleAssign} className="space-y-6">
                {assignStatus && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold">{assignStatus}</div>
                )}
                <div>
                  <label className="block text-[10px] font-black text-gray-400  tracking-widest mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      required
                      placeholder="employee@corp.com"
                      value={assignForm.employee_email}
                      onChange={e => setAssignForm({ ...assignForm, employee_email: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-purple-50 focus:border-purple-400 outline-none transition-all placeholder:text-gray-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400  tracking-widest mb-2">Target Program</label>
                  <select
                    required
                    value={assignForm.course_id}
                    onChange={e => setAssignForm({ ...assignForm, course_id: e.target.value })}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-purple-50 focus:border-purple-400 outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Select a course...</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <Button 
                   type="submit" 
                   disabled={isAssigning || !assignForm.course_id}
                   className="w-full h-16 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl  tracking-widest text-sm shadow-xl shadow-purple-100 transition-all flex items-center justify-center gap-3"
                >
                  {isAssigning ? <Loader2 className="animate-spin" size={20} /> : <Target size={20} />} Assign Mandatory Training
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
