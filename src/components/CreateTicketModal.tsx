import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Info, Users, Ticket, DollarSign, Calendar, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from './ui/utils';
import { TicketType, TicketStatus, TicketTypeType, TicketVisibility } from './event-dashboard/types';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ticket: Partial<TicketType>) => void;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ isOpen, onClose, onSave }) => {
  const [activeSection, setActiveSection] = useState<'basic' | 'advanced'>('basic');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<TicketType>>({
    type: 'Single',
    name: '',
    isFree: false,
    price: 0,
    quantityTotal: 100,
    minPerOrder: 1,
    maxPerOrder: 10,
    salesStart: '',
    salesEnd: '',
    visibility: 'Public',
    status: 'Draft',
    allowTransfer: true,
    allowResale: true,
    refundPolicy: 'Refundable',
    requireAttendeeInfo: true,
    groupSize: 1
  });

  if (!isOpen) return null;

  const handleInputChange = (field: keyof TicketType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Basic validation
    if (!formData.name) return;
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] border border-transparent dark:border-slate-800 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Create Ticket</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Set up your ticket details and pricing</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Ticket Type */}
          <section className="space-y-4">
             <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Ticket Type</label>
             <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleInputChange('type', 'Single')}
                  className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                    formData.type === 'Single' 
                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 dark:border-indigo-500" 
                        : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-transparent"
                  )}
                >
                    <div className={cn("p-3 rounded-full", formData.type === 'Single' ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400")}>
                        <Ticket className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                        <span className={cn("block font-bold text-sm", formData.type === 'Single' ? "text-indigo-900 dark:text-indigo-300" : "text-slate-900 dark:text-slate-100")}>Single Ticket</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">One person per ticket</span>
                    </div>
                </button>

                <button 
                   onClick={() => handleInputChange('type', 'Group')}
                   className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                    formData.type === 'Group' 
                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 dark:border-indigo-500" 
                        : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-transparent"
                  )}
                >
                    <div className={cn("p-3 rounded-full", formData.type === 'Group' ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400")}>
                        <Users className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                        <span className={cn("block font-bold text-sm", formData.type === 'Group' ? "text-indigo-900 dark:text-indigo-300" : "text-slate-900 dark:text-slate-100")}>Group Ticket</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Multiple people per ticket</span>
                    </div>
                </button>
             </div>
          </section>

          {/* Basic Info */}
          <section className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ticket Name</label>
                    <input 
                        type="text" 
                        placeholder="e.g. Early Bird, VIP" 
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                    />
                </div>
                {formData.type === 'Group' && (
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Attendees per Ticket</label>
                        <input 
                            type="number" 
                            min="2"
                            value={formData.groupSize}
                            onChange={(e) => handleInputChange('groupSize', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                        />
                    </div>
                )}
             </div>

             {/* Pricing */}
             <div className="space-y-3">
                 <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Pricing</label>
                 <div className="flex items-center gap-4">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button 
                            onClick={() => handleInputChange('isFree', false)}
                            className={cn(
                                "px-4 py-1.5 rounded-md text-sm font-medium transition-all", 
                                !formData.isFree 
                                    ? "bg-white dark:bg-slate-950 shadow-sm text-slate-900 dark:text-slate-100" 
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                            )}
                        >
                            Paid
                        </button>
                        <button 
                            onClick={() => handleInputChange('isFree', true)}
                            className={cn(
                                "px-4 py-1.5 rounded-md text-sm font-medium transition-all", 
                                formData.isFree 
                                    ? "bg-white dark:bg-slate-950 shadow-sm text-slate-900 dark:text-slate-100" 
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                            )}
                        >
                            Free
                        </button>
                    </div>
                    
                    {!formData.isFree && (
                        <div className="relative flex-1 max-w-[200px]">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₦</span>
                            <input 
                                type="number" 
                                placeholder="0.00"
                                value={formData.price}
                                onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                                className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                            />
                        </div>
                    )}
                 </div>
             </div>

             {/* Quantity & Limits */}
             <div className="grid grid-cols-3 gap-4 pt-2">
                 <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Quantity</label>
                    <input 
                        type="number" 
                        value={formData.quantityTotal}
                        onChange={(e) => handleInputChange('quantityTotal', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Min per Order</label>
                    <input 
                        type="number" 
                        value={formData.minPerOrder}
                        onChange={(e) => handleInputChange('minPerOrder', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Max per Order</label>
                    <input 
                        type="number" 
                        value={formData.maxPerOrder}
                        onChange={(e) => handleInputChange('maxPerOrder', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    />
                 </div>
             </div>
          </section>

          {/* Schedule */}
          <section className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
             <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold text-sm">
                <Calendar className="w-4 h-4" />
                <h3>Sales Schedule</h3>
             </div>
             <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Starts</label>
                    <input 
                        type="datetime-local" 
                        value={formData.salesStart}
                        onChange={(e) => handleInputChange('salesStart', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950"
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Ends</label>
                    <input 
                        type="datetime-local" 
                        value={formData.salesEnd}
                        onChange={(e) => handleInputChange('salesEnd', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950"
                    />
                 </div>
             </div>
          </section>

          {/* Visibility */}
           <section className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
             <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold text-sm">
                <Eye className="w-4 h-4" />
                <h3>Visibility</h3>
             </div>
             <div className="flex flex-wrap gap-2">
                 {(['Public', 'Hidden', 'Invite Only'] as const).map((vis) => (
                     <button
                        key={vis}
                        onClick={() => handleInputChange('visibility', vis)}
                        className={cn(
                            "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                            formData.visibility === vis 
                                ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-500 text-indigo-700 dark:text-indigo-400" 
                                : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                        )}
                     >
                        {vis}
                     </button>
                 ))}
             </div>
           </section>

           {/* Advanced Options Toggle */}
           <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
             <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full text-left p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors group"
             >
                <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">Advanced Options</span>
                {showAdvanced ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
             </button>
             
             {showAdvanced && (
                 <div className="pt-4 space-y-6 animate-in slide-in-from-top-2 fade-in duration-200">
                    {/* Access Rules */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Access & Transfers</h4>
                        <div className="space-y-2">
                            <label className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-lg">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Allow Ticket Transfers</span>
                                <input 
                                    type="checkbox" 
                                    checked={formData.allowTransfer}
                                    onChange={(e) => handleInputChange('allowTransfer', e.target.checked)}
                                    className="accent-indigo-600 w-4 h-4"
                                />
                            </label>
                            <label className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-lg">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Allow Resale</span>
                                <input 
                                    type="checkbox" 
                                    checked={formData.allowResale}
                                    onChange={(e) => handleInputChange('allowResale', e.target.checked)}
                                    className="accent-indigo-600 w-4 h-4"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Attendee Info */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attendee Information</h4>
                        <label className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-lg">
                            <div className="text-sm">
                                <span className="block font-medium text-slate-700 dark:text-slate-300">Require Attendee Details</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">Collect name and email for each ticket holder</span>
                            </div>
                            <input 
                                type="checkbox" 
                                checked={formData.requireAttendeeInfo}
                                onChange={(e) => handleInputChange('requireAttendeeInfo', e.target.checked)}
                                className="accent-indigo-600 w-4 h-4"
                            />
                        </label>
                    </div>

                    {/* Refund Policy */}
                     <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Refund Policy</h4>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                                <input 
                                    type="radio" 
                                    name="refund"
                                    checked={formData.refundPolicy === 'Refundable'}
                                    onChange={() => handleInputChange('refundPolicy', 'Refundable')}
                                    className="accent-indigo-600"
                                />
                                <span className="text-sm text-slate-700 dark:text-slate-300">Refundable</span>
                            </label>
                             <label className="flex items-center gap-2">
                                <input 
                                    type="radio" 
                                    name="refund"
                                    checked={formData.refundPolicy === 'Non-refundable'}
                                    onChange={() => handleInputChange('refundPolicy', 'Non-refundable')}
                                    className="accent-indigo-600"
                                />
                                <span className="text-sm text-slate-700 dark:text-slate-300">Non-refundable</span>
                            </label>
                        </div>
                    </div>
                 </div>
             )}
           </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0">
           <Button variant="ghost" onClick={onClose} className="text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200">Cancel</Button>
           <Button onClick={handleSave} className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700">Create Ticket</Button>
        </div>
      </div>
    </div>
  );
};
