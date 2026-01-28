import React from 'react';
import { ChecklistItem } from './types';
import { ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';

interface SmartSetupChecklistProps {
  items: ChecklistItem[];
  className?: string;
}

export const SmartSetupChecklist: React.FC<SmartSetupChecklistProps> = ({ items, className }) => {
  const completedCount = 1; // Hardcoded to match design for now, or derive from items
  const totalCount = 8;
  const percentage = 25;

  return (
    <div className={cn("bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col transition-colors", className)}>
      {/* Header */}
      <div className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
             {/* Circular Progress */}
            <div className="relative w-[34px] h-[34px] flex items-center justify-center shrink-0">
               <svg className="w-full h-full transform -rotate-90">
                 <circle cx="17" cy="17" r="14" stroke="currentColor" strokeWidth="2.5" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                 <circle cx="17" cy="17" r="14" stroke="currentColor" strokeWidth="2.5" fill="transparent" 
                   strokeDasharray={88} 
                   strokeDashoffset={88 - (88 * percentage) / 100} 
                   strokeLinecap="round"
                   className="text-indigo-600 dark:text-indigo-500" 
                 />
               </svg>
               <span className="absolute text-[9px] font-bold text-slate-900 dark:text-slate-100">{percentage}%</span>
            </div>
            
            <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-tight">Checklist for setting up your event</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{completedCount} of {totalCount} tasks completed</p>
            </div>
        </div>

        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full">
            <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* List */}
      <div className="flex-1 p-2">
          {items.map((item, idx) => (
              <div key={item.id} className={cn(
                  "flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group cursor-pointer",
                  idx !== items.length - 1 && "border-b border-slate-50 dark:border-slate-800"
              )}>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.label}</span>
                  <span className={cn(
                      "text-sm font-semibold hover:underline",
                      item.actionLabel === "Customize" ? "text-indigo-600 dark:text-indigo-400" : "text-indigo-600 dark:text-indigo-400"
                  )}>
                      {item.actionLabel}
                  </span>
              </div>
          ))}
      </div>
    </div>
  );
};
