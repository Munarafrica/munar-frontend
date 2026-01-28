import React, { useState } from 'react';
import { TopBar } from "../components/dashboard/TopBar";
import { Page, Speaker, Session } from "../components/event-dashboard/types";
import { Button } from "../components/ui/button";
import { Users, Calendar, ChevronLeft } from 'lucide-react';
import { cn } from "../components/ui/utils";
import { SpeakersTab } from "../components/event-dashboard/program/SpeakersTab";
import { ScheduleTab } from "../components/event-dashboard/program/ScheduleTab";

interface ProgramManagementProps {
  onNavigate?: (page: Page) => void;
}

export const ProgramManagement: React.FC<ProgramManagementProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'speakers' | 'schedule'>('speakers');

  // Mock Data - Speakers
  const [speakers, setSpeakers] = useState<Speaker[]>([
    {
      id: 's1',
      name: 'Sarah Connor',
      role: 'Chief Product Officer',
      organization: 'TechCorp Inc.',
      bio: 'Sarah is a visionary leader with over 15 years of experience in product management and AI.',
      categories: ['Keynote'],
      isFeatured: true,
      linkedInUrl: 'https://linkedin.com',
      twitterUrl: 'https://twitter.com'
    },
    {
      id: 's2',
      name: 'John Smith',
      role: 'Head of Engineering',
      organization: 'StartUp World',
      bio: 'John leads the engineering team building the next generation of cloud infrastructure.',
      categories: ['Panelist'],
      isFeatured: false
    }
  ]);

  // Mock Data - Sessions
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: 'sess1',
      title: 'Opening Keynote: The Future of Tech',
      description: 'An inspiring look at what lies ahead for the technology industry in 2026 and beyond.',
      date: '2026-05-15',
      startTime: '09:00',
      endTime: '10:00',
      location: 'Main Hall',
      track: 'Main Stage',
      trackColor: '#6366f1',
      speakerIds: ['s1']
    },
    {
      id: 'sess2',
      title: 'Building Scalable Systems',
      description: 'A deep dive into architectural patterns for high-scale applications.',
      date: '2026-05-15',
      startTime: '10:30',
      endTime: '11:30',
      location: 'Workshop Room A',
      track: 'Engineering',
      trackColor: '#10b981',
      speakerIds: ['s2']
    },
    {
        id: 'sess3',
        title: 'Panel: AI Ethics',
        description: 'Discussing the ethical implications of artificial intelligence in everyday life.',
        date: '2026-05-16',
        startTime: '14:00',
        endTime: '15:00',
        location: 'Main Hall',
        track: 'Main Stage',
        trackColor: '#6366f1',
        speakerIds: ['s1', 's2']
      }
  ]);

  // --- Speaker Actions ---
  const handleAddSpeaker = (newSpeaker: Partial<Speaker>) => {
    const speaker: Speaker = {
      id: `s${Date.now()}`,
      categories: [],
      isFeatured: false,
      name: '',
      role: '',
      bio: '',
      ...newSpeaker
    };
    setSpeakers([...speakers, speaker]);
  };

  const handleEditSpeaker = (updatedSpeaker: Speaker) => {
    setSpeakers(speakers.map(s => s.id === updatedSpeaker.id ? updatedSpeaker : s));
  };

  const handleDeleteSpeaker = (id: string) => {
    if (window.confirm("Are you sure? This will remove them from any assigned sessions.")) {
      setSpeakers(speakers.filter(s => s.id !== id));
      // Optional: Cleanup session assignments
      setSessions(sessions.map(sess => ({
          ...sess,
          speakerIds: sess.speakerIds.filter(sid => sid !== id)
      })));
    }
  };

  // --- Session Actions ---
  const handleAddSession = (newSession: Partial<Session>) => {
    const session: Session = {
        id: `sess${Date.now()}`,
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        speakerIds: [],
        ...newSession
    };
    setSessions([...sessions, session]);
  };

  const handleEditSession = (updatedSession: Session) => {
      setSessions(sessions.map(s => s.id === updatedSession.id ? updatedSession : s));
  };

  const handleDeleteSession = (id: string) => {
      if (window.confirm("Delete this session?")) {
          setSessions(sessions.filter(s => s.id !== id));
      }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-background flex flex-col font-['Raleway']">
       <TopBar onNavigate={onNavigate} />
       
       <main className="flex-1 max-w-[1440px] mx-auto w-full px-6 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">
                        <button onClick={() => onNavigate?.('event-dashboard')} className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                            Back
                        </button>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Program Management</h1>
                </div>
            </div>

            {/* Tabs & Content */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[600px] flex flex-col transition-colors">
                {/* Tabs Header */}
                <div className="border-b border-slate-200 dark:border-slate-800 px-2 flex overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => setActiveTab('speakers')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap",
                            activeTab === 'speakers' 
                                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400" 
                                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
                        )}
                    >
                        <Users className="w-4 h-4" />
                        Speakers
                    </button>
                    <button
                        onClick={() => setActiveTab('schedule')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap",
                            activeTab === 'schedule' 
                                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400" 
                                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
                        )}
                    >
                        <Calendar className="w-4 h-4" />
                        Schedule
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-6 flex-1">
                    {activeTab === 'speakers' && (
                        <SpeakersTab 
                            speakers={speakers}
                            sessions={sessions}
                            onAddSpeaker={handleAddSpeaker}
                            onEditSpeaker={handleEditSpeaker}
                            onDeleteSpeaker={handleDeleteSpeaker}
                        />
                    )}

                    {activeTab === 'schedule' && (
                        <ScheduleTab
                            sessions={sessions}
                            speakers={speakers}
                            onAddSession={handleAddSession}
                            onEditSession={handleEditSession}
                            onDeleteSession={handleDeleteSession}
                        />
                    )}
                </div>
            </div>
       </main>
    </div>
  );
};

export default ProgramManagement;
