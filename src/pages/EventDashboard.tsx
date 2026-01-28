import React, { useState, useEffect } from 'react';
import { TopBar } from "../components/dashboard/TopBar";
import { EventHeader } from "../components/event-dashboard/EventHeader";
import { OverviewAnalytics } from "../components/event-dashboard/OverviewAnalytics";
import { SmartSetupChecklist } from "../components/event-dashboard/SmartSetupChecklist";
import { ModulesHub } from "../components/event-dashboard/ModulesHub";
import { ActivityFeed } from "../components/event-dashboard/ActivityFeed";
import { EventData, EventPhase, Metric, ChecklistItem, Module, Activity } from "../components/event-dashboard/types";
import { cn } from "../components/ui/utils";
import { Page } from "../App";

interface EventDashboardProps {
  onNavigate?: (page: Page) => void;
}

export const EventDashboard: React.FC<EventDashboardProps> = ({ onNavigate }) => {
  // --- MOCK DATA STATE ---
  const [phase, setPhase] = useState<EventPhase>('setup');
  
  const [event, setEvent] = useState<EventData>({
    id: "evt-123",
    name: "Lagos Tech Summit 2026",
    date: "2026-06-12",
    time: "09:00 AM WAT",
    type: "Hybrid",
    websiteUrl: "https://lagostech2026.munar.site",
    status: "draft",
    phase: "setup"
  });

  // Keep event phase in sync with demo toggle
  useEffect(() => {
    setEvent(prev => ({
      ...prev,
      phase,
      status: phase === 'setup' ? 'draft' : phase === 'live' ? 'published' : 'published'
    }));
  }, [phase]);

  // Analytics Data
  const metrics: Metric[] = [
    { id: 'm1', label: 'Tickets Sold/registrations', value: '3/5', context: 'setup' },
    { id: 'm2', label: 'Website Views', value: '12', context: 'setup' },
    { id: 'm3', label: 'Voting Activity', value: 'Not Configured', context: 'setup' },
    { id: 'm4', label: 'Total Revenue', value: '₦4.5M', context: 'setup' },
    { id: 'm5', label: 'Check-ins', value: '0', context: 'setup' },
    { id: 'm6', label: 'Survey Responses', value: '0', context: 'setup' },
  ];

  // Checklist Data
  const checklistItems: ChecklistItem[] = [
    { id: 'c1', label: 'Add tickets or registration', status: 'not-started', actionLabel: 'Set up', phase: 'setup' },
    { id: 'c2', label: 'Customize event website', status: 'in-progress', actionLabel: 'Customize', phase: 'setup' },
    { id: 'c3', label: 'Add speakers and schedule', status: 'not-started', actionLabel: 'Set up', phase: 'setup' },
  ];

  // Modules Data matching screenshot
  const modules: Module[] = [
    { id: 'mod1', name: 'Event Website', description: 'Customize your landing page', icon: 'globe', status: 'active', actionLabel: 'Manage', category: 'Core', iconColor: 'green' },
    { id: 'mod2', name: 'Tickets', description: 'Create and manage ticket tiers', icon: 'ticket', status: 'not-started', actionLabel: 'Manage', category: 'Core', iconColor: 'orange' },
    { id: 'mod3', name: 'Schedule & Agenda', description: 'Manage sessions and timeline', icon: 'calendar', status: 'not-started', actionLabel: 'Create', category: 'Core', iconColor: 'pink' },
    { id: 'mod4', name: 'People & Speakers', description: 'Speaker profiles and Bios', icon: 'mic', status: 'not-started', actionLabel: 'Set up', category: 'Growth', iconColor: 'green' },
    { id: 'mod5', name: 'Sponsors', description: 'create and manage brand partners', icon: 'users', status: 'not-started', actionLabel: 'Set up', category: 'Growth', iconColor: 'blue' },
    { id: 'mod6', name: 'Forms and surveys', description: 'Customize your landing page', icon: 'file-text', status: 'active', actionLabel: 'Manage', category: 'Core', iconColor: 'pink' },
    { id: 'mod7', name: 'Voting', description: 'Setup live polls and awards', icon: 'vote', status: 'not-started', actionLabel: 'Manage', category: 'Growth', iconColor: 'indigo' },
    { id: 'mod8', name: 'Event Media & Gallery', description: 'Customize your landing page', icon: 'globe', status: 'not-started', actionLabel: 'Manage', category: 'Growth', iconColor: 'purple' },
    { id: 'mod9', name: 'Merchandise', description: 'Sell items and add-ons', icon: 'shopping-bag', status: 'not-started', actionLabel: 'Manage', category: 'Operations', iconColor: 'gray' },
    { id: 'mod10', name: 'DP & Cover Maker', description: 'Create branded social images', icon: 'image', status: 'not-started', actionLabel: 'Manage', category: 'Growth', iconColor: 'purple' },
  ];

  const activities: Activity[] = [
    { id: 'a1', type: 'ticket', message: 'New VIP Ticket purchased by John Doe', timestamp: new Date().toISOString(), isHighPriority: true },
    { id: 'a2', type: 'form', message: 'Speaker application received', timestamp: new Date(Date.now() - 3600000).toISOString(), isHighPriority: false },
    { id: 'a3', type: 'system', message: 'Event website published', timestamp: "2026-01-24T10:00:00", isHighPriority: false },
    { id: 'a4', type: 'ticket', message: 'Sponsorship proposal sent to Acme Corp', timestamp: new Date(Date.now() - 7200000).toISOString(), isHighPriority: false },
    { id: 'a5', type: 'form', message: 'Registration form updated', timestamp: new Date(Date.now() - 10800000).toISOString(), isHighPriority: false },
  ];

  // Logic to handle actions
  const handlePublish = () => {
    setEvent(prev => ({ ...prev, status: 'published' }));
  };

  const handleUnpublish = () => {
    setEvent(prev => ({ ...prev, status: 'unpublished' }));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-background flex flex-col font-['Raleway']">
      <TopBar onNavigate={onNavigate} />
      
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-6 py-8 space-y-8">
        {/* Header */}
        <section>
             <EventHeader 
                event={event} 
                onPublish={handlePublish}
                onNavigate={onNavigate}
            />
        </section>

        {/* Dashboard Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 h-full">
                <SmartSetupChecklist items={checklistItems} className="h-full" />
            </div>
            <div className="lg:col-span-2 h-full">
                <OverviewAnalytics metrics={metrics} phase={phase} />
            </div>
        </section>

        {/* Modules */}
        <section>
            <ModulesHub modules={modules} onNavigate={onNavigate} />
        </section>

        {/* Activity */}
        <section>
            <ActivityFeed activities={activities} />
        </section>
      </main>
    </div>
  );
};

export default EventDashboard;
