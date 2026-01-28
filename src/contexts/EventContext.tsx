// Event Context - manages current event state across dashboard pages
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { EventData, Metric, ChecklistItem, Module, Activity } from '../components/event-dashboard/types';
import { eventsService } from '../services';

interface EventContextState {
  currentEvent: EventData | null;
  metrics: Metric[];
  checklist: ChecklistItem[];
  modules: Module[];
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
}

interface EventContextValue extends EventContextState {
  loadEvent: (eventId: string) => Promise<void>;
  updateEvent: (data: Partial<EventData>) => Promise<void>;
  publishEvent: () => Promise<void>;
  unpublishEvent: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  refreshActivities: () => Promise<void>;
  clearEvent: () => void;
}

const EventContext = createContext<EventContextValue | undefined>(undefined);

interface EventProviderProps {
  children: React.ReactNode;
  eventId?: string; // Optional initial event ID
}

export function EventProvider({ children, eventId }: EventProviderProps) {
  const [state, setState] = useState<EventContextState>({
    currentEvent: null,
    metrics: [],
    checklist: [],
    modules: [],
    activities: [],
    isLoading: false,
    error: null,
  });

  const loadEvent = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Load all event data in parallel
      const [event, metrics, checklist, modules, activities] = await Promise.all([
        eventsService.getEvent(id),
        eventsService.getEventMetrics(id),
        eventsService.getEventChecklist(id),
        eventsService.getEventModules(id),
        eventsService.getEventActivities(id),
      ]);
      
      setState({
        currentEvent: event,
        metrics,
        checklist,
        modules,
        activities,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load event',
      }));
    }
  }, []);

  const updateEvent = useCallback(async (data: Partial<EventData>) => {
    if (!state.currentEvent) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const updated = await eventsService.updateEvent(state.currentEvent.id, data);
      setState(prev => ({
        ...prev,
        currentEvent: updated,
        isLoading: false,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to update event',
      }));
      throw err;
    }
  }, [state.currentEvent]);

  const publishEvent = useCallback(async () => {
    if (!state.currentEvent) return;
    
    try {
      const updated = await eventsService.publishEvent(state.currentEvent.id);
      setState(prev => ({
        ...prev,
        currentEvent: updated,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to publish event',
      }));
      throw err;
    }
  }, [state.currentEvent]);

  const unpublishEvent = useCallback(async () => {
    if (!state.currentEvent) return;
    
    try {
      const updated = await eventsService.unpublishEvent(state.currentEvent.id);
      setState(prev => ({
        ...prev,
        currentEvent: updated,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to unpublish event',
      }));
      throw err;
    }
  }, [state.currentEvent]);

  const refreshMetrics = useCallback(async () => {
    if (!state.currentEvent) return;
    
    try {
      const metrics = await eventsService.getEventMetrics(state.currentEvent.id);
      setState(prev => ({ ...prev, metrics }));
    } catch {
      // Silently fail - metrics are non-critical
    }
  }, [state.currentEvent]);

  const refreshActivities = useCallback(async () => {
    if (!state.currentEvent) return;
    
    try {
      const activities = await eventsService.getEventActivities(state.currentEvent.id);
      setState(prev => ({ ...prev, activities }));
    } catch {
      // Silently fail
    }
  }, [state.currentEvent]);

  const clearEvent = useCallback(() => {
    setState({
      currentEvent: null,
      metrics: [],
      checklist: [],
      modules: [],
      activities: [],
      isLoading: false,
      error: null,
    });
  }, []);

  // Load initial event if ID provided
  useEffect(() => {
    if (eventId) {
      loadEvent(eventId);
    }
  }, [eventId, loadEvent]);

  const value: EventContextValue = {
    ...state,
    loadEvent,
    updateEvent,
    publishEvent,
    unpublishEvent,
    refreshMetrics,
    refreshActivities,
    clearEvent,
  };

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
}

// Hook to use event context
export function useEvent(): EventContextValue {
  const context = useContext(EventContext);
  
  if (context === undefined) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  
  return context;
}

// Optional: Hook that also loads event if not loaded
export function useEventWithId(eventId: string): EventContextValue {
  const context = useEvent();
  
  useEffect(() => {
    if (eventId && context.currentEvent?.id !== eventId) {
      context.loadEvent(eventId);
    }
  }, [eventId, context]);
  
  return context;
}
