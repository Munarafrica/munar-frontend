// Router Configuration - React Router setup for Munar
// Implements the URL and Routing Architecture from the spec:
//
// Admin Routes (organiser):
//   /login, /signup, etc.     → Auth pages
//   /events                   → My Events list
//   /events/create            → Create Event
//   /events/:eventId          → Event Dashboard
//   /events/:eventId/tickets  → Ticket Management (admin)
//   /events/:eventId/voting   → Voting Management (admin)
//   /events/:eventId/...      → Other module admin pages
//
// Public Routes (attendee):
//   /e/:eventSlug             → Event Website
//   /e/:eventSlug/tickets     → Public Ticket Purchase
//   /e/:eventSlug/voting      → Public Voting
//   /e/:eventSlug/merch       → Public Merchandise Store
//   /e/:eventSlug/forms       → Public Forms
//   /e/:eventSlug/dp-maker    → Public DP Maker
//   /e/:eventSlug/gallery     → Public Gallery

import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';

// App Shell & Layout
import { AppShell, EventLayout, PublicLayout } from '../components/AppShell';
import { EventResolver } from '../components/EventResolver';
import { ModuleGuard } from '../components/ModuleGuard';

// Auth Pages
import { Login } from '../pages/Login';
import { SignUp } from '../pages/SignUp';
import { EmailVerification } from '../pages/EmailVerification';
import { ProfileSetup } from '../pages/ProfileSetup';
import { ForgotPassword } from '../pages/ForgotPassword';
import { ResetPassword } from '../pages/ResetPassword';
import { AccountType } from '../pages/AccountType';

// Platform Pages
import { MyEvents } from '../pages/MyEvents';
import { CreateEvent } from '../pages/CreateEvent';

// Event Admin Pages
import { EventDashboard } from '../pages/EventDashboard';
import { TicketManagement } from '../pages/TicketManagement';
import { ProgramManagement } from '../pages/ProgramManagement';
import { FormManagement } from '../pages/FormManagement';
import { MerchandiseManagement } from '../pages/MerchandiseManagement';
import { VotingManagement } from '../pages/VotingManagement';
import { DPMakerAdmin } from '../pages/DPMakerAdmin';
import { GalleryAdmin } from '../pages/GalleryAdmin';
import { SponsorsManagement } from '../pages/SponsorsManagement';
import { EventAnalytics } from '../pages/EventAnalytics';
import { WebsiteBuilder } from '../pages/WebsiteBuilder';

// Public Module Pages
import { TicketsPublic } from '../modules/tickets/TicketsPublic';
import { VotingPublic } from '../modules/voting/VotingPublic';
import { MerchPublic } from '../modules/merch/MerchPublic';
import { FormsPublic } from '../modules/forms/FormsPublic';
import { DPMakerPublic } from '../pages/DPMakerPublic';
import { GalleryPublic } from '../pages/GalleryPublic';
import { EventWebsitePublic } from '../modules/website/EventWebsitePublic';

// 404 Pages
import { NotFound } from '../pages/NotFound';

// Navigation compatibility wrapper
import { useAppNavigate } from '../lib/navigation';

// ─── Route Wrapper Components ────────────────────────────────────────────────
// These wrap existing page components to inject React Router navigation

function WithNav({ Component, extraProps }: { Component: React.ComponentType<any>; extraProps?: Record<string, any> }) {
  const onNavigate = useAppNavigate();
  return <Component onNavigate={onNavigate} {...extraProps} />;
}

function CreateEventRoute() {
  const onNavigate = useAppNavigate();
  return (
    <CreateEvent
      onClose={() => onNavigate('my-events')}
      onContinue={() => onNavigate('event-dashboard')}
      onNavigate={onNavigate}
    />
  );
}

// ─── Router Definition ───────────────────────────────────────────────────────

export const router = createBrowserRouter([
  {
    // Root layout with AppShell (Theme + Auth)
    element: <AppShell />,
    children: [
      // ── Auth Routes ──────────────────────────────────────────────────
      { path: '/login', element: <WithNav Component={Login} /> },
      { path: '/signup', element: <WithNav Component={SignUp} /> },
      { path: '/verify-email', element: <WithNav Component={EmailVerification} /> },
      { path: '/account-type', element: <WithNav Component={AccountType} /> },
      { path: '/profile-setup', element: <WithNav Component={ProfileSetup} /> },
      { path: '/forgot-password', element: <WithNav Component={ForgotPassword} /> },
      { path: '/reset-password', element: <WithNav Component={ResetPassword} /> },

      // ── Platform Routes ──────────────────────────────────────────────
      { path: '/', element: <Navigate to="/events" replace /> },
      { path: '/events', element: <WithNav Component={MyEvents} /> },
      { path: '/events/create', element: <CreateEventRoute /> },

      // ── Event Admin Routes (wrapped in EventResolver) ────────────────
      {
        path: '/events/:eventId',
        element: (
          <EventResolver>
            <EventLayout>
              <Outlet />
            </EventLayout>
          </EventResolver>
        ),
        children: [
          { index: true, element: <WithNav Component={EventDashboard} /> },
          { path: 'tickets', element: <WithNav Component={TicketManagement} /> },
          { path: 'program', element: <WithNav Component={ProgramManagement} /> },
          { path: 'forms', element: <WithNav Component={FormManagement} /> },
          { path: 'merchandise', element: <WithNav Component={MerchandiseManagement} /> },
          { path: 'voting', element: <WithNav Component={VotingManagement} /> },
          { path: 'sponsors', element: <WithNav Component={SponsorsManagement} /> },
          { path: 'dp-maker', element: <WithNav Component={DPMakerAdmin} /> },
          { path: 'gallery', element: <WithNav Component={GalleryAdmin} /> },
          { path: 'analytics', element: <WithNav Component={EventAnalytics} /> },
          { path: 'website', element: <WebsiteBuilder /> },
        ],
      },

      // ── Public Event Routes (attendee-facing) ────────────────────────
      {
        path: '/e/:eventSlug',
        element: (
          <EventResolver useSlug>
            <PublicLayout>
              <Outlet />
            </PublicLayout>
          </EventResolver>
        ),
        children: [
          // Event Website (root)
          { index: true, element: <EventWebsitePublic /> },

          // Standalone module public pages
          {
            path: 'tickets',
            element: (
              <ModuleGuard moduleType="tickets">
                <TicketsPublic />
              </ModuleGuard>
            ),
          },
          {
            path: 'voting',
            element: (
              <ModuleGuard moduleType="voting">
                <VotingPublic />
              </ModuleGuard>
            ),
          },
          {
            path: 'merch',
            element: (
              <ModuleGuard moduleType="merch">
                <MerchPublic />
              </ModuleGuard>
            ),
          },
          {
            path: 'forms',
            element: (
              <ModuleGuard moduleType="forms">
                <FormsPublic />
              </ModuleGuard>
            ),
          },
          {
            path: 'dp-maker',
            element: (
              <ModuleGuard moduleType="dp-maker">
                <WithNav Component={DPMakerPublic} />
              </ModuleGuard>
            ),
          },
          {
            path: 'gallery',
            element: (
              <ModuleGuard moduleType="gallery">
                <WithNav Component={GalleryPublic} />
              </ModuleGuard>
            ),
          },
        ],
      },

      // ── Catch-all 404 ────────────────────────────────────────────────
      { path: '*', element: <NotFound /> },
    ],
  },
]);
