// Public Tickets Page - Attendee-facing ticket purchase interface
// Route: /e/:eventSlug/tickets
// This page is accessible directly via URL even if the event website is unpublished

import React, { useState } from 'react';
import { useEvent } from '../../contexts';
import { useBrandSafe } from '../../contexts/BrandContext';
import { cn } from '../../components/ui/utils';
import { Button } from '../../components/ui/button';
import { Ticket, Calendar, MapPin, Clock, ShoppingCart, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function TicketsPublic() {
  const { currentEvent } = useEvent();
  const { branding } = useBrandSafe();
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});

  if (!currentEvent) return null;

  // Mock ticket data for stub — will come from ticketsService
  const ticketTypes = [
    { id: 't1', name: 'General Admission', price: 5000, currency: 'NGN', available: 55, isFree: false },
    { id: 't2', name: 'VIP Access', price: 25000, currency: 'NGN', available: 18, isFree: false },
    { id: 't3', name: 'Student', price: 0, currency: 'NGN', available: 100, isFree: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-['Raleway']">
      {/* Event Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link
            to={`/e/${currentEvent.slug || currentEvent.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to event
          </Link>

          {currentEvent.coverImageUrl && (
            <div className="w-full h-40 rounded-xl overflow-hidden mb-4">
              <img
                src={currentEvent.coverImageUrl}
                alt={currentEvent.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {currentEvent.name}
          </h1>

          <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {currentEvent.date}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {currentEvent.time}
            </span>
            {currentEvent.venueLocation && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {currentEvent.venueLocation}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Selection */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Ticket className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Select Tickets
          </h2>
        </div>

        <div className="space-y-3">
          {ticketTypes.map((ticket) => {
            const qty = selectedTickets[ticket.id] || 0;
            return (
              <div
                key={ticket.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    {ticket.name}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {ticket.isFree
                      ? 'Free'
                      : `${ticket.currency} ${ticket.price.toLocaleString()}`}
                    {' · '}
                    {ticket.available} available
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setSelectedTickets((prev) => ({
                        ...prev,
                        [ticket.id]: Math.max(0, qty - 1),
                      }))
                    }
                    disabled={qty === 0}
                    className={cn(
                      'w-8 h-8 rounded-lg border flex items-center justify-center text-sm font-semibold transition-colors',
                      qty === 0
                        ? 'border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600'
                        : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-semibold text-slate-900 dark:text-slate-100">
                    {qty}
                  </span>
                  <button
                    onClick={() =>
                      setSelectedTickets((prev) => ({
                        ...prev,
                        [ticket.id]: Math.min(ticket.available, qty + 1),
                      }))
                    }
                    className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cart Summary */}
        {Object.values(selectedTickets).some((q) => q > 0) && (
          <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                <ShoppingCart className="w-4 h-4 inline mr-1.5" />
                Order Summary
              </span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                NGN{' '}
                {Object.entries(selectedTickets)
                  .reduce((total, [id, qty]) => {
                    const ticket = ticketTypes.find((t) => t.id === id);
                    return total + (ticket?.price || 0) * qty;
                  }, 0)
                  .toLocaleString()}
              </span>
            </div>
            <Button className="w-full rounded-xl" size="lg">
              Proceed to Checkout
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-600">
        Powered by Munar
      </div>
    </div>
  );
}
