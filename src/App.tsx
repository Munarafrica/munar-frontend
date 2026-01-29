import React, { useState } from 'react';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { EmailVerification } from './pages/EmailVerification';
import { ProfileSetup } from './pages/ProfileSetup';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { AccountType } from './pages/AccountType';
import { MyEvents } from './pages/MyEvents';
import { CreateEvent } from './pages/CreateEvent';
import { EventDashboard } from './pages/EventDashboard';
import { TicketManagement } from './pages/TicketManagement';
import { ProgramManagement } from './pages/ProgramManagement';
import { FormManagement } from './pages/FormManagement';
import { MerchandiseManagement } from './pages/MerchandiseManagement';
import { VotingManagement } from './pages/VotingManagement';
import { PublicVote } from './pages/PublicVote';
import { DPMakerAdmin } from './pages/DPMakerAdmin';
import { DPMakerPublic } from './pages/DPMakerPublic';
import { GalleryAdmin } from './pages/GalleryAdmin';
import { GalleryPublic } from './pages/GalleryPublic';
import { SponsorsManagement } from './pages/SponsorsManagement';
import { EventAnalytics } from './pages/EventAnalytics';

import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "./contexts";

export type Page = 'login' | 'signup' | 'verification' | 'account-type' | 'profile-setup' | 'forgot-password' | 'reset-password' | 'my-events' | 'create-event' | 'event-dashboard' | 'ticket-management' | 'program-management' | 'form-management' | 'merchandise-management' | 'voting-management' | 'public-vote' | 'dp-maker-admin' | 'dp-maker-public' | 'gallery-admin' | 'gallery-public' | 'sponsors-management' | 'event-analytics';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('event-dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <Login onNavigate={setCurrentPage} />;
      case 'signup':
        return <SignUp onNavigate={setCurrentPage} />;
      case 'verification':
        return <EmailVerification onNavigate={setCurrentPage} />;
      case 'account-type':
        return <AccountType onNavigate={setCurrentPage} />;
      case 'profile-setup':
        return <ProfileSetup onNavigate={setCurrentPage} />;
      case 'forgot-password':
        return <ForgotPassword onNavigate={setCurrentPage} />;
      case 'reset-password':
        return <ResetPassword onNavigate={setCurrentPage} />;
      case 'my-events':
        return <MyEvents onNavigate={setCurrentPage} />;
      case 'create-event':
        return <CreateEvent onClose={() => setCurrentPage('my-events')} onContinue={() => setCurrentPage('event-dashboard')} onNavigate={setCurrentPage} />;
      case 'event-dashboard':
        return <EventDashboard onNavigate={setCurrentPage} />;
      case 'ticket-management':
        return <TicketManagement onNavigate={setCurrentPage} />;
      case 'program-management':
        return <ProgramManagement onNavigate={setCurrentPage} />;
      case 'form-management':
        return <FormManagement onNavigate={setCurrentPage} />;
      case 'merchandise-management':
        return <MerchandiseManagement onNavigate={setCurrentPage} />;
      case 'sponsors-management':
        return <SponsorsManagement onNavigate={setCurrentPage} />;
      case 'voting-management':
        return <VotingManagement onNavigate={setCurrentPage} />;
      case 'public-vote':
        return <PublicVote onNavigate={setCurrentPage} />;
      case 'dp-maker-admin':
        return <DPMakerAdmin onNavigate={setCurrentPage} />;
      case 'dp-maker-public':
        return <DPMakerPublic onNavigate={setCurrentPage} />;
      case 'gallery-admin':
        return <GalleryAdmin onNavigate={setCurrentPage} />;
      case 'gallery-public':
        return <GalleryPublic onNavigate={setCurrentPage} />;
      case 'event-analytics':
        return <EventAnalytics onNavigate={setCurrentPage} />;
      default:
        return <Login onNavigate={setCurrentPage} />;
    }
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <AuthProvider>
        <div className="text-slate-900 dark:text-foreground bg-background antialiased selection:bg-purple-100 selection:text-purple-900">
          {renderPage()}
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;