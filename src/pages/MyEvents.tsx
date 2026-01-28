import React, { useState, useMemo } from "react";
import { TopBar } from "../components/dashboard/TopBar";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { EventGrid } from "../components/events/EventGrid";
import { EventList } from "../components/events/EventList";
import { EmptyEvents } from "../components/events/EmptyEvents";
import { Event } from "../components/events/EventCard";

const MOCK_EVENTS: Event[] = [
  {
    id: "1",
    name: "Lagos Tech Fair",
    type: "Physical",
    status: "Published",
    date: "17 Jun 2025",
    time: "9:00 AM WAT",
    ticketsSold: 10,
  },
  {
    id: "2",
    name: "Abuja Startup Summit",
    type: "Virtual",
    status: "Scheduled",
    date: "25 Sep 2025",
    time: "2:00 PM WAT",
    ticketsSold: 100,
  },
  {
    id: "3",
    name: "Port Harcourt Innovation Expo",
    type: "Hybrid",
    status: "Published",
    date: "12 Nov 2025",
    time: "10:00 AM WAT",
    ticketsSold: "500.000", 
  },
  {
    id: "4",
    name: "Ibadan Digital Workshop",
    type: "Physical",
    status: "Draft",
    date: "5 Sep 2025",
    time: "11:00 AM WAT",
    ticketsSold: 25,
  },
  
];

export const MyEvents = ({ onNavigate }: { onNavigate?: (page: string) => void }) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [events, setEvents] = useState<Event[]>(MOCK_EVENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");

  // Filter and search events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Search filter
      const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           event.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           event.status.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      const matchesStatus = filterStatus === "All" || event.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [events, searchQuery, filterStatus]);

  const handleNewEvent = () => {
    console.log("New Event Clicked");
    onNavigate?.('create-event' as any);
  };

  const handleEditEvent = (eventId: string) => {
    console.log("Edit event:", eventId);
    // Navigate to edit page or open edit modal
  };

  const handleViewEvent = (eventId: string) => {
    console.log("View event:", eventId);
    // Navigate to event details page
  };

  const handleCloneEvent = (eventId: string) => {
    const eventToClone = events.find(e => e.id === eventId);
    if (eventToClone) {
      const clonedEvent = {
        ...eventToClone,
        id: `${Date.now()}`,
        name: `${eventToClone.name} (Copy)`,
        status: "Draft" as const
      };
      setEvents([...events, clonedEvent]);
      console.log("Cloned event:", clonedEvent);
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      setEvents(events.filter(e => e.id !== eventId));
      console.log("Deleted event:", eventId);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-background flex flex-col font-['Raleway']">
      <TopBar onNavigate={onNavigate as any} />
      
      <DashboardHeader 
        viewMode={viewMode} 
        setViewMode={setViewMode} 
        onNewEvent={handleNewEvent}
        showControls={events.length > 0}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
      />

      <div className="flex-1 w-full overflow-visible">
        {filteredEvents.length === 0 && events.length === 0 ? (
          <EmptyEvents onNewEvent={handleNewEvent} />
        ) : filteredEvents.length === 0 ? (
          <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-12 text-center">
            <p className="text-slate-500 dark:text-slate-400">No events found matching your search criteria.</p>
          </div>
        ) : (
          viewMode === "grid" ? (
            <EventGrid 
              events={filteredEvents}
              onEdit={handleEditEvent}
              onView={handleViewEvent}
              onClone={handleCloneEvent}
              onDelete={handleDeleteEvent}
            />
          ) : (
            <EventList 
              events={filteredEvents}
              onEdit={handleEditEvent}
              onView={handleViewEvent}
              onClone={handleCloneEvent}
              onDelete={handleDeleteEvent}
            />
          )
        )}
      </div>
    </div>
  );
};
