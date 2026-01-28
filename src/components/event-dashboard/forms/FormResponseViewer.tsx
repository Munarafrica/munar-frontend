import React, { useState } from 'react';
import { Form, FormResponse, FormField } from '../types';
import { ArrowLeft, Download, Filter, Search, CheckCircle, XCircle, Clock, CreditCard, DollarSign, Eye } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { cn } from '../../ui/utils';

interface FormResponseViewerProps {
  form: Form;
  onCancel: () => void;
}

export const FormResponseViewer: React.FC<FormResponseViewerProps> = ({ form, onCancel }) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'partial'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock Responses Data
  const [responses] = useState<FormResponse[]>([
    {
      id: 'r1',
      formId: form.id,
      respondentName: 'Alice Freeman',
      respondentEmail: 'alice@example.com',
      submittedAt: '2026-01-25T14:30:00',
      status: 'completed',
      paymentStatus: 'paid',
      answers: {
        'field1': 'Alice Freeman',
        'field2': 'alice@example.com',
      }
    },
    {
      id: 'r2',
      formId: form.id,
      respondentName: 'Bob Smith',
      respondentEmail: 'bob@example.com',
      submittedAt: '2026-01-25T15:45:00',
      status: 'completed',
      paymentStatus: 'pending',
      answers: {
        'field1': 'Bob Smith',
        'field2': 'bob@example.com',
      }
    },
    {
      id: 'r3',
      formId: form.id,
      respondentName: 'Charlie Brown',
      respondentEmail: 'charlie@example.com',
      submittedAt: '2026-01-24T09:15:00',
      status: 'partial',
      paymentStatus: 'failed',
      answers: {
        'field1': 'Charlie Brown',
      }
    },
    {
      id: 'r4',
      formId: form.id,
      respondentName: 'Diana Prince',
      respondentEmail: 'diana@example.com',
      submittedAt: '2026-01-23T11:20:00',
      status: 'completed',
      paymentStatus: 'paid',
      answers: {
        'field1': 'Diana Prince',
        'field2': 'diana@example.com',
      }
    },
  ]);

  // Derived Stats
  const totalResponses = responses.length;
  const completedResponses = responses.filter(r => r.status === 'completed').length;
  const completionRate = totalResponses > 0 ? Math.round((completedResponses / totalResponses) * 100) : 0;
  
  const totalRevenue = responses
    .filter(r => r.paymentStatus === 'paid')
    .reduce((acc, _) => acc + (form.settings.price || 0), 0);

  const filteredResponses = responses.filter(r => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesSearch = 
      (r.respondentName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (r.respondentEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950/50 min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 sticky top-0 z-10">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onCancel} className="shrink-0">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2 text-xs">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 max-w-[1440px] mx-auto w-full space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Total Responses</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{totalResponses}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Completion Rate</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{completionRate}%</p>
          </div>
          {form.settings.isPaid && (
            <>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Total Revenue</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                   {form.settings.currency} {totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Pending Payments</p>
                <p className="text-2xl font-bold text-amber-500 mt-1">
                   {responses.filter(r => r.paymentStatus === 'pending').length}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Filters & Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
           {/* Toolbar */}
           <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative w-full sm:w-72">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                    type="text" 
                    placeholder="Search name or email..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                 />
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                  <button 
                    onClick={() => setFilterStatus('all')}
                    className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-lg border whitespace-nowrap transition-colors",
                        filterStatus === 'all' 
                            ? "bg-slate-100 border-slate-300 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" 
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
                    )}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setFilterStatus('completed')}
                    className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-lg border whitespace-nowrap transition-colors",
                        filterStatus === 'completed' 
                            ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400" 
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
                    )}
                  >
                    Completed
                  </button>
                  <button 
                    onClick={() => setFilterStatus('partial')}
                    className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-lg border whitespace-nowrap transition-colors",
                        filterStatus === 'partial' 
                            ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400" 
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
                    )}
                  >
                    Partial
                  </button>
              </div>
           </div>

           {/* Table */}
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                       <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Respondent</th>
                       <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Date</th>
                       <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                       {form.settings.isPaid && (
                          <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Payment</th>
                       )}
                       {/* Dynamic Field Columns (First 2 fields only to prevent clutter) */}
                       {form.fields.slice(0, 2).map(field => (
                          <th key={field.id} className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                             {field.label}
                          </th>
                       ))}
                       <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredResponses.length === 0 ? (
                       <tr>
                          <td colSpan={10} className="py-12 text-center text-slate-500 dark:text-slate-400">
                             No responses found matching your filters.
                          </td>
                       </tr>
                    ) : (
                       filteredResponses.map(response => (
                          <tr key={response.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                             <td className="py-3 px-4">
                                <div className="flex flex-col">
                                   <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                      {response.respondentName || 'Anonymous'}
                                   </span>
                                   <span className="text-xs text-slate-500 dark:text-slate-400">
                                      {response.respondentEmail}
                                   </span>
                                </div>
                             </td>
                             <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {new Date(response.submittedAt).toLocaleDateString()} <span className="text-xs opacity-70">{new Date(response.submittedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                             </td>
                             <td className="py-3 px-4">
                                <Badge variant="secondary" className={cn(
                                   "text-[10px] font-medium border-0 px-2 h-5",
                                   response.status === 'completed' 
                                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                )}>
                                   {response.status === 'completed' ? 'Completed' : 'Partial'}
                                </Badge>
                             </td>
                             {form.settings.isPaid && (
                                <td className="py-3 px-4">
                                   <div className={cn(
                                      "flex items-center gap-1.5 text-xs font-medium",
                                      response.paymentStatus === 'paid' ? "text-emerald-600 dark:text-emerald-400" :
                                      response.paymentStatus === 'pending' ? "text-amber-600 dark:text-amber-400" :
                                      "text-red-600 dark:text-red-400"
                                   )}>
                                      {response.paymentStatus === 'paid' && <CheckCircle className="w-3.5 h-3.5" />}
                                      {response.paymentStatus === 'pending' && <Clock className="w-3.5 h-3.5" />}
                                      {response.paymentStatus === 'failed' && <XCircle className="w-3.5 h-3.5" />}
                                      <span className="capitalize">{response.paymentStatus}</span>
                                   </div>
                                </td>
                             )}
                             {/* Dynamic Data */}
                             {form.fields.slice(0, 2).map(field => (
                                <td key={field.id} className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400 max-w-[150px] truncate">
                                   {typeof response.answers[field.id] === 'object' 
                                      ? JSON.stringify(response.answers[field.id]) 
                                      : response.answers[field.id] || '-'}
                                </td>
                             ))}
                             <td className="py-3 px-4 text-right">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                                   <Eye className="w-4 h-4" />
                                </Button>
                             </td>
                          </tr>
                       ))
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
};