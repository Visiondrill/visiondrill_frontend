'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Trophy, Download, ExternalLink, Calendar, ShieldCheck, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const res = await api.get('/student/certificates');
        const certs = res.data || [];
        // Also fetch issue status for each certificate's course
        const enriched = await Promise.all(
          certs.map(async (cert: any) => {
            if (cert.course?.id) {
              try {
                const issueRes = await api.post(`/student/courses/${cert.course.id}/certificate`);
                return { ...cert, issue_status: issueRes.data };
              } catch {
                return cert;
              }
            }
            return cert;
          })
        );
        setCertificates(enriched);
      } catch (err) {
        toast.error('Failed to load certificates.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCertificates();
  }, []);

  const filteredCerts = certificates.filter(cert => 
    cert.course?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cert.serial_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      
      {/* Header section with search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight capitalize mb-2 flex items-center gap-3">
            <Trophy className="text-blue-600" size={32} /> Your Achievements
          </h1>
          <p className="text-gray-500 font-medium max-w-lg">
            View and download certificates for all courses you've successfully mastered on VisionDrill.
          </p>
        </div>
        
        <div className="relative">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
           <input 
             type="text"
             placeholder="Search by course or serial..."
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
             className="w-full md:w-80 bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium focus:border-blue-500 outline-none shadow-sm transition-all"
           />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {[...Array(3)].map((_, i) => (
             <div key={i} className="h-64 bg-gray-100 rounded-[2.5rem] animate-pulse"></div>
           ))}
        </div>
      ) : filteredCerts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCerts.map((cert) => (
            <div key={cert.id} className="group flex flex-col bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:shadow-blue-100/50 transition-all duration-500">
               
               {/* Certificate Decorative Top */}
               <div className="h-28 bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                  <ShieldCheck size={48} className="text-white/20 absolute bottom-4 right-6 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/20 w-fit">
                    Verified ID: {cert.serial_number}
                  </div>
               </div>

               {/* Content */}
               <div className="p-8 space-y-6 flex-1 flex flex-col">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 leading-tight mb-2 capitalize line-clamp-2">
                       {cert.course?.title || 'Unknown Course'}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-bold capitalize">
                       <Calendar size={14} className="text-blue-500" /> Issued on {new Date(cert.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="mt-auto space-y-4 pt-4 border-t border-gray-50">
                     <div className="flex items-center justify-between text-xs font-medium text-gray-400">
                        <span>Platform Certified</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                     </div>
                     
                     <div className="flex gap-3">
                        <button 
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-50 hover:bg-blue-600 hover:text-white text-gray-900 font-black rounded-2xl text-xs transition-all shadow-sm"
                          onClick={() => window.open(cert.download_link, '_blank')}
                        >
                           <Download size={16} /> Download
                        </button>
                        <button className="p-3 bg-gray-50 text-gray-400 hover:text-blue-600 rounded-2xl transition-colors">
                           <ExternalLink size={18} />
                        </button>
                     </div>
                  </div>
               </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] p-16 text-center border border-gray-100 shadow-sm space-y-6 max-w-2xl mx-auto">
           <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
              <Trophy size={40} />
           </div>
           <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900">No certificates yet!</h2>
              <p className="text-gray-500 font-medium leading-relaxed px-10">
                 Complete all lessons in a course to 100% and ace the quizzes to earn your verified VisionDrill certificate.
              </p>
           </div>
           <div className="pt-4">
              <button 
                onClick={() => window.location.href = '/student/courses'}
                className="px-10 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:shadow-blue-300 transition-all active:scale-95"
              >
                 Resume Learning
              </button>
           </div>
        </div>
      )}

    </div>
  );
}
