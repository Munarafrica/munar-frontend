// Sections Panel
// Manages section visibility and ordering with HTML5 drag-and-drop

import React, { useState } from 'react';
import { Eye, EyeOff, GripVertical } from 'lucide-react';
import { SectionId, WebsiteConfig } from '../../../modules/website/types';
import { cn } from '../../ui/utils';

interface SectionsPanelProps {
  config: WebsiteConfig;
  selectedSection: SectionId | null;
  onSelectSection: (id: SectionId) => void;
  onToggleSection: (id: SectionId) => void;
  onSwapSections: (fromId: SectionId, toId: SectionId) => void;
}

const SECTION_META: Record<SectionId, { label: string; description: string }> = {
  hero:     { label: 'Hero',        description: 'Event name, date & main CTA' },
  about:    { label: 'About',       description: 'Event description and details' },
  tickets:  { label: 'Tickets',     description: 'Registration and ticket CTA' },
  schedule: { label: 'Schedule',    description: 'Programme and sessions' },
  speakers: { label: 'Speakers',    description: 'Speaker cards and profiles' },
  sponsors: { label: 'Sponsors',    description: 'Partner logos and tiers' },
  voting:   { label: 'Voting',      description: 'Vote now CTA' },
  merch:    { label: 'Merchandise', description: 'Shop and product links' },
  forms:    { label: 'Forms',       description: 'Surveys and data collection' },
  gallery:  { label: 'Gallery',     description: 'Media and photo gallery' },
  faq:      { label: 'FAQ',         description: 'Frequently asked questions' },
  footer:   { label: 'Footer',      description: 'Links and powered by Munar' },
};

export function SectionsPanel({
  config,
  selectedSection,
  onSelectSection,
  onToggleSection,
  onSwapSections,
}: SectionsPanelProps) {
  const sorted = [...config.sections].sort((a, b) => a.order - b.order);
  const [dragId, setDragId] = useState<SectionId | null>(null);
  const [dragOverId, setDragOverId] = useState<SectionId | null>(null);

  const handleDragStart = (e: React.DragEvent, id: SectionId) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };
  const handleDragOver = (e: React.DragEvent, id: SectionId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== dragId) setDragOverId(id);
  };
  const handleDrop = (e: React.DragEvent, targetId: SectionId) => {
    e.preventDefault();
    if (dragId && dragId !== targetId) onSwapSections(dragId, targetId);
    setDragId(null); setDragOverId(null);
  };
  const handleDragEnd = () => { setDragId(null); setDragOverId(null); };

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Sections</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Drag to reorder · Click eye to show/hide
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-1">
          {sorted.map((section) => {
            const meta = SECTION_META[section.id];
            const isDragging = dragId === section.id;
            const isDragTarget = dragOverId === section.id && dragId !== section.id;
            const isSelected = selectedSection === section.id;

            return (
              <div
                key={section.id}
                draggable
                onDragStart={(e) => handleDragStart(e, section.id)}
                onDragOver={(e) => handleDragOver(e, section.id)}
                onDrop={(e) => handleDrop(e, section.id)}
                onDragEnd={handleDragEnd}
                onClick={() => onSelectSection(section.id)}
                className={cn(
                  'group flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all border select-none',
                  isDragging && 'opacity-40 scale-95',
                  isDragTarget && 'border-indigo-400 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 scale-[1.01] shadow-sm',
                  !isDragging && !isDragTarget && isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800'
                    : !isDragging && !isDragTarget
                    ? 'bg-white dark:bg-slate-900 border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    : ''
                )}
              >
                <span className="cursor-grab active:cursor-grabbing flex-shrink-0 touch-none">
                  <GripVertical className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 transition-colors" />
                </span>

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-semibold truncate',
                    section.visible ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-600'
                  )}>
                    {meta?.label || section.label}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                    {meta?.description}
                  </p>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); onToggleSection(section.id); }}
                  className={cn(
                    'flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all',
                    section.visible
                      ? 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                      : 'text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                  )}
                  title={section.visible ? 'Hide section' : 'Show section'}
                >
                  {section.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {sorted.filter(s => s.visible).length}/{sorted.length} visible
        </span>
        <span className="text-xs text-slate-300 dark:text-slate-600">↕ drag to reorder</span>
      </div>
    </div>
  );
}
