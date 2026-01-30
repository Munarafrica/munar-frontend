import React, { useState, useEffect } from 'react';
import { TopBar } from "../components/dashboard/TopBar";
import { EventHeader } from "../components/event-dashboard/EventHeader";
import { OverviewAnalytics } from "../components/event-dashboard/OverviewAnalytics";
import { SmartSetupChecklist } from "../components/event-dashboard/SmartSetupChecklist";
import { ModulesHub } from "../components/event-dashboard/ModulesHub";
import { ActivityFeed } from "../components/event-dashboard/ActivityFeed";
import { EventData, EventPhase, Metric, ChecklistItem, Module, Activity } from "../components/event-dashboard/types";
import { Page } from "../App";
import { eventsService } from '../services';
import { getCurrentEventId, setCurrentEventId } from '../lib/event-storage';

interface EventDashboardProps {
  onNavigate?: (page: Page) => void;
}

export const EventDashboard: React.FC<EventDashboardProps> = ({ onNavigate }) => {
  // --- MOCK DATA STATE ---
  const [phase, setPhase] = useState<EventPhase>('setup');
  
  const [event, setEvent] = useState<EventData | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [eventId, setEventId] = useState(() => getCurrentEventId());

  // Keep event phase in sync with demo toggle
  useEffect(() => {
    setEvent(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        phase,
        status: phase === 'setup' ? 'draft' : phase === 'live' ? 'published' : 'published'
      };
    });
  }, [phase]);

  useEffect(() => {
    const current = getCurrentEventId();
    if (current !== eventId) {
      setEventId(current);
    }
  }, [eventId]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const [eventData, metricsData, checklistData, moduleData, activityData] = await Promise.all([
          eventsService.getEvent(eventId),
          eventsService.getEventMetrics(eventId),
          eventsService.getEventChecklist(eventId),
          eventsService.getEventModules(eventId),
          eventsService.getEventActivities(eventId),
        ]);

        if (!isMounted) return;
        setEvent(eventData);
        setMetrics(metricsData);
        setChecklistItems(checklistData);
        setModules(moduleData);
        setActivities(activityData);
      } catch {
        if (eventId !== 'evt-1') {
          setCurrentEventId('evt-1');
          setEventId('evt-1');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [eventId]);

  // Logic to handle actions
  const handlePublish = () => {
    if (!event) return;
    eventsService.updateEvent(event.id, { status: 'published' }).then(setEvent).catch(() => null);
  };

  const handleUnpublish = () => {
    if (!event) return;
    eventsService.updateEvent(event.id, { status: 'unpublished' }).then(setEvent).catch(() => null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-background flex flex-col font-['Raleway']">
      <TopBar onNavigate={onNavigate} />
      
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-6 py-8 space-y-8">
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-slate-500 dark:text-slate-400">
            Loading event...
          </div>
        )}

        {!isLoading && event && (
          <>
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
                <SmartSetupChecklist items={checklistItems} className="h-full" onNavigate={onNavigate} />
              </div>
              <div className="lg:col-span-2 h-full">
                <OverviewAnalytics metrics={metrics} phase={phase} onNavigate={onNavigate} />
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
          </>
        )}
      </main>
    </div>
  );
};

export default EventDashboard;
