// Horizon Template
// Clean, modern event website template
// Design: White background, card-based sections, generous whitespace, Indigo accents

import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, MapPin, Clock, Ticket, Vote, ShoppingBag, FileText, Image, ExternalLink, Users, Mic, ChevronRight, Menu } from 'lucide-react';
import { EventData } from '../../../components/event-dashboard/types';
import { Speaker, Session } from '../../../components/event-dashboard/types';
import { Sponsor } from '../../../types/sponsors';
import { WebsiteConfig, SectionId } from '../types';
import { cn } from '../../../components/ui/utils';

interface HorizonTemplateProps {
  event: EventData;
  config: WebsiteConfig;
  speakers?: Speaker[];
  sessions?: Session[];
  sponsors?: Sponsor[];
  /** In builder mode, section click highlights it in the panel */
  onSectionClick?: (id: SectionId) => void;
  selectedSection?: SectionId | null;
}

function sectionStyle(isSelected: boolean) {
  return isSelected
    ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-white relative cursor-pointer transition-all'
    : 'relative cursor-pointer transition-all hover:ring-1 hover:ring-blue-300/50 hover:ring-offset-1';
}

function getRadius(br: WebsiteConfig['theme']['borderRadius'], size: 'sm' | 'md' | 'lg' = 'md'): string {
  if (br === 'sharp') return '0px';
  if (br === 'pill') return '9999px';
  const map = { sm: '8px', md: '12px', lg: '16px' };
  return map[size];
}

export function HorizonTemplate({ event, config, speakers = [], sessions = [], sponsors = [], onSectionClick, selectedSection }: HorizonTemplateProps) {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const slug = eventSlug || event.slug || event.id;
  const { theme } = config;

  const visibleSections = [...config.sections]
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order);

  const isVisible = (id: SectionId) => visibleSections.some((s) => s.id === id);

  const handleClick = (id: SectionId) => {
    if (onSectionClick) onSectionClick(id);
  };

  const cssVars = {
    '--h-primary': theme.primaryColor,
    '--h-secondary': theme.secondaryColor,
    '--h-accent': theme.accentColor,
    '--h-bg': theme.backgroundColor,
  } as React.CSSProperties;

  return (
    <div
      style={{ ...cssVars, backgroundColor: theme.backgroundColor, fontFamily: theme.bodyFont + ', sans-serif' }}
      className="min-h-screen text-slate-900"
    >
      {/* ── STICKY NAVBAR ──────────────────────────────────────────────────── */}
      {config.navbarEnabled !== false && (
        <nav
          className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm"
          style={{ fontFamily: theme.headingFont + ', sans-serif' }}
        >
          <div className="max-w-5xl mx-auto px-6 sm:px-8 h-14 flex items-center justify-between gap-6">
            <div className="flex items-center gap-3 min-w-0">
              {config.logoUrl ? (
                <img src={config.logoUrl} alt="Logo" className="h-8 w-auto object-contain flex-shrink-0" />
              ) : event.branding?.logo ? (
                <img src={event.branding.logo} alt="Logo" className="h-8 w-auto object-contain flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ backgroundColor: theme.primaryColor }} />
              )}
              <span className="text-sm font-bold text-slate-900 truncate hidden sm:block">{event.name}</span>
            </div>
            <div className="hidden md:flex items-center gap-5 text-sm font-medium">
              {isVisible('about') && <a href="#about" className="text-slate-500 hover:text-slate-900 transition-colors">About</a>}
              {isVisible('schedule') && <a href="#schedule" className="text-slate-500 hover:text-slate-900 transition-colors">Schedule</a>}
              {isVisible('speakers') && <a href="#speakers" className="text-slate-500 hover:text-slate-900 transition-colors">Speakers</a>}
              {isVisible('sponsors') && <a href="#sponsors" className="text-slate-500 hover:text-slate-900 transition-colors">Sponsors</a>}
            </div>
            {isVisible('tickets') && (
              <Link
                to={`/e/${slug}/tickets`}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: theme.primaryColor, borderRadius: getRadius(theme.borderRadius, 'sm') }}
                onClick={(e) => e.stopPropagation()}
              >
                <Ticket className="w-3.5 h-3.5" />
                Tickets
              </Link>
            )}
          </div>
        </nav>
      )}
      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      {isVisible('hero') && (
        <section
          onClick={() => handleClick('hero')}
          className={cn('relative', sectionStyle(selectedSection === 'hero'))}
        >
          {/* Background */}
          <div className="relative overflow-hidden" style={{ minHeight: 480 }}>
            {event.coverImageUrl ? (
              <img
                src={event.coverImageUrl}
                alt={event.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${theme.primaryColor}ee 0%, ${theme.secondaryColor}cc 100%)`,
                }}
              />
            )}
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

            {/* Content */}
            <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8 py-24 flex flex-col justify-end" style={{ minHeight: 480 }}>
              {/* Logo */}
              {event.branding?.logo && (
                <img src={event.branding.logo} alt="Logo" className="w-14 h-14 rounded-xl object-contain mb-5 shadow-lg" />
              )}

              {/* Status badge */}
              <div className="mb-4">
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase"
                  style={{ backgroundColor: `${theme.accentColor}33`, color: theme.accentColor, border: `1px solid ${theme.accentColor}55` }}
                >
                  {event.status === 'published' ? 'Live' : 'Coming Soon'}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4 max-w-2xl">
                {event.name}
              </h1>

              <div className="flex flex-wrap gap-5 text-white/80 text-sm mb-8">
                {event.date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" style={{ color: theme.accentColor }} />
                    {event.date}
                  </span>
                )}
                {event.time && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" style={{ color: theme.accentColor }} />
                    {event.time}
                  </span>
                )}
                {(event.venueLocation || event.country) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" style={{ color: theme.accentColor }} />
                    {event.venueLocation || event.country}
                  </span>
                )}
              </div>

              {/* Primary CTA */}
              {isVisible('tickets') && (
                <div className="flex gap-3 flex-wrap">
                  <Link
                    to={`/e/${slug}/tickets`}
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm text-white shadow-lg hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: theme.primaryColor }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Ticket className="w-4 h-4" />
                    Get Tickets
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── MAIN CONTENT CONTAINER ────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 sm:px-8">

        {/* ── ABOUT SECTION ─────────────────────────────────────────────── */}
        {isVisible('about') && (event.description || event.type) && (
          <section
            onClick={() => handleClick('about')}
            className={cn('py-16 border-b border-slate-100', sectionStyle(selectedSection === 'about'))}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="md:col-span-2">
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: theme.primaryColor }}>
                  About the Event
                </p>
                <h2 className="text-3xl font-bold text-slate-900 mb-5">
                  {event.name}
                </h2>
                {event.description ? (
                  <p className="text-slate-600 leading-relaxed text-base">
                    {event.description}
                  </p>
                ) : (
                  <p className="text-slate-400 italic">
                    Event description goes here.
                  </p>
                )}
              </div>

              {/* Event Details Card */}
              <div className="bg-slate-50 rounded-2xl p-6 space-y-4 self-start">
                <h3 className="font-semibold text-slate-900 text-sm">Event Details</h3>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-0.5">Date</dt>
                    <dd className="text-slate-700 font-medium">{event.date || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-0.5">Time</dt>
                    <dd className="text-slate-700 font-medium">{event.time || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-0.5">Type</dt>
                    <dd className="text-slate-700 font-medium">{event.type || '—'}</dd>
                  </div>
                  {(event.venueLocation || event.country) && (
                    <div>
                      <dt className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-0.5">Location</dt>
                      <dd className="text-slate-700 font-medium">{event.venueLocation || event.country}</dd>
                    </div>
                  )}
                  {event.categories && event.categories.length > 0 && (
                    <div>
                      <dt className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-0.5">Category</dt>
                      <dd className="flex flex-wrap gap-1 mt-1">
                        {event.categories.map((cat) => (
                          <span key={cat} className="px-2 py-0.5 bg-white rounded-lg text-xs text-slate-600 border border-slate-200">
                            {cat}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </section>
        )}

        {/* ── TICKETS SECTION ───────────────────────────────────────────── */}
        {isVisible('tickets') && (
          <section
            onClick={() => handleClick('tickets')}
            className={cn('py-16 border-b border-slate-100', sectionStyle(selectedSection === 'tickets'))}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: theme.primaryColor }}>
              Tickets
            </p>
            <div className="flex items-end justify-between mb-8">
              <h2 className="text-3xl font-bold text-slate-900">Register Now</h2>
              <Link
                to={`/e/${slug}/tickets`}
                className="text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                style={{ color: theme.primaryColor }}
                onClick={(e) => e.stopPropagation()}
              >
                View all tickets <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Ticket CTA card */}
            <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-100">
              <div
                className="p-8 flex flex-col sm:flex-row items-center justify-between gap-6"
                style={{ background: `linear-gradient(135deg, ${theme.primaryColor}11, ${theme.secondaryColor}11)` }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    <Ticket className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Secure Your Spot</h3>
                    <p className="text-slate-500 text-sm mt-0.5">Get your tickets before they sell out</p>
                  </div>
                </div>
                <Link
                  to={`/e/${slug}/tickets`}
                  className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white shadow hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: theme.primaryColor }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Ticket className="w-4 h-4" />
                  Get Tickets
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── SCHEDULE SECTION ──────────────────────────────────────────── */}
        {isVisible('schedule') && (
          <section
            id="schedule"
            onClick={() => handleClick('schedule')}
            className={cn('py-16 border-b border-slate-100', sectionStyle(selectedSection === 'schedule'))}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: theme.primaryColor }}>
              Programme
            </p>
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Schedule</h2>
            {sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-start gap-4 p-4 bg-slate-50 border border-slate-100"
                    style={{ borderRadius: getRadius(theme.borderRadius) }}
                  >
                    <div className="flex-shrink-0 text-center min-w-[60px]">
                      <div className="text-xs font-bold text-slate-400 uppercase">{session.startTime}</div>
                      <div className="text-xs text-slate-300">–{session.endTime}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {session.track && (
                          <span
                            className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${session.trackColor || theme.primaryColor}22`, color: session.trackColor || theme.primaryColor }}
                          >
                            {session.track}
                          </span>
                        )}
                        {session.location && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{session.location}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-slate-900 mt-1 text-sm">{session.title}</p>
                      {session.description && (
                        <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{session.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-100 overflow-hidden bg-slate-50 p-10 text-center">
                <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="font-semibold text-slate-500">Schedule Coming Soon</p>
                <p className="text-slate-400 text-sm mt-1">The full programme will be published before the event.</p>
              </div>
            )}
          </section>
        )}

        {/* ── SPEAKERS SECTION ──────────────────────────────────────────── */}
        {isVisible('speakers') && (
          <section
            id="speakers"
            onClick={() => handleClick('speakers')}
            className={cn('py-16 border-b border-slate-100', sectionStyle(selectedSection === 'speakers'))}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: theme.primaryColor }}>
              Speakers
            </p>
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Who's Speaking</h2>
            {speakers.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                {speakers.map((sp) => (
                  <div key={sp.id} className="text-center">
                    {sp.imageUrl ? (
                      <img
                        src={sp.imageUrl}
                        alt={sp.name}
                        className="w-20 h-20 object-cover mx-auto mb-3 border-2 border-slate-100"
                        style={{ borderRadius: getRadius(theme.borderRadius, 'lg') }}
                      />
                    ) : (
                      <div
                        className="w-20 h-20 mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold border-2 border-slate-100"
                        style={{ backgroundColor: theme.primaryColor, borderRadius: getRadius(theme.borderRadius, 'lg') }}
                      >
                        {sp.name.charAt(0)}
                      </div>
                    )}
                    <p className="font-semibold text-slate-900 text-sm">{sp.name}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{sp.role}</p>
                    {sp.organization && <p className="text-slate-400 text-xs">{sp.organization}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-100 overflow-hidden bg-slate-50 p-10 text-center">
                <Mic className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="font-semibold text-slate-500">Speakers Being Announced</p>
                <p className="text-slate-400 text-sm mt-1">Speaker lineup will be revealed soon. Stay tuned!</p>
              </div>
            )}
          </section>
        )}

        {/* ── SPONSORS SECTION ──────────────────────────────────────────── */}
        {isVisible('sponsors') && (
          <section
            id="sponsors"
            onClick={() => handleClick('sponsors')}
            className={cn('py-16 border-b border-slate-100', sectionStyle(selectedSection === 'sponsors'))}
          >
            <div className="text-center mb-10">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: theme.primaryColor }}>
                Partners
              </p>
              <h2 className="text-3xl font-bold text-slate-900">Our Sponsors</h2>
            </div>
            {sponsors.length > 0 ? (
              <div className="flex flex-wrap items-center justify-center gap-6">
                {sponsors.map((sp) => (
                  <a
                    key={sp.id}
                    href={sp.websiteUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center p-4 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
                    style={{ borderRadius: getRadius(theme.borderRadius) }}
                    title={sp.name}
                  >
                    {sp.logoUrl ? (
                      <img src={sp.logoUrl} alt={sp.name} className="h-10 max-w-[140px] object-contain" />
                    ) : (
                      <span className="text-sm font-semibold text-slate-600">{sp.name}</span>
                    )}
                  </a>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-10 text-center">
                <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="font-semibold text-slate-500">Sponsors Being Confirmed</p>
                <p className="text-slate-400 text-sm mt-1">Our amazing sponsors will be announced soon.</p>
              </div>
            )}
          </section>
        )}

        {/* ── VOTING SECTION ────────────────────────────────────────────── */}
        {isVisible('voting') && (
          <section
            onClick={() => handleClick('voting')}
            className={cn('py-16 border-b border-slate-100', sectionStyle(selectedSection === 'voting'))}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: theme.primaryColor }}>
              Voting
            </p>
            <div className="rounded-2xl overflow-hidden">
              <div
                className="p-8 flex flex-col sm:flex-row items-center justify-between gap-6"
                style={{ background: `linear-gradient(135deg, ${theme.secondaryColor}22, ${theme.accentColor}22)` }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow"
                    style={{ backgroundColor: theme.secondaryColor }}
                  >
                    <Vote className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Cast Your Vote</h3>
                    <p className="text-slate-500 text-sm mt-0.5">Have your say in live polls and awards</p>
                  </div>
                </div>
                <Link
                  to={`/e/${slug}/voting`}
                  className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white shadow hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: theme.secondaryColor }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Vote className="w-4 h-4" />
                  Vote Now
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── MERCH SECTION ─────────────────────────────────────────────── */}
        {isVisible('merch') && (
          <section
            onClick={() => handleClick('merch')}
            className={cn('py-16 border-b border-slate-100', sectionStyle(selectedSection === 'merch'))}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: theme.primaryColor }}>
              Shop
            </p>
            <div className="rounded-2xl overflow-hidden">
              <div
                className="p-8 flex flex-col sm:flex-row items-center justify-between gap-6"
                style={{ background: `linear-gradient(135deg, ${theme.accentColor}22, ${theme.primaryColor}22)` }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow"
                    style={{ backgroundColor: theme.accentColor }}
                  >
                    <ShoppingBag className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Official Merchandise</h3>
                    <p className="text-slate-500 text-sm mt-0.5">Get exclusive event merchandise and collectibles</p>
                  </div>
                </div>
                <Link
                  to={`/e/${slug}/merch`}
                  className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white shadow hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: theme.accentColor }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Shop Now
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── FORMS SECTION ─────────────────────────────────────────────── */}
        {isVisible('forms') && (
          <section
            onClick={() => handleClick('forms')}
            className={cn('py-16 border-b border-slate-100', sectionStyle(selectedSection === 'forms'))}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: theme.primaryColor }}>
              Engage
            </p>
            <div className="rounded-2xl overflow-hidden">
              <div
                className="p-8 flex flex-col sm:flex-row items-center justify-between gap-6"
                style={{ background: `linear-gradient(135deg, ${theme.primaryColor}11, ${theme.accentColor}11)` }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Forms & Surveys</h3>
                    <p className="text-slate-500 text-sm mt-0.5">Share your thoughts and register interest</p>
                  </div>
                </div>
                <Link
                  to={`/e/${slug}/forms`}
                  className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white shadow hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: theme.primaryColor }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <FileText className="w-4 h-4" />
                  Open Forms
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── GALLERY SECTION ───────────────────────────────────────────── */}
        {isVisible('gallery') && (
          <section
            onClick={() => handleClick('gallery')}
            className={cn('py-16 border-b border-slate-100', sectionStyle(selectedSection === 'gallery'))}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: theme.primaryColor }}>
              Gallery
            </p>
            <div className="flex items-end justify-between mb-8">
              <h2 className="text-3xl font-bold text-slate-900">Event Media</h2>
              <Link
                to={`/e/${slug}/gallery`}
                className="text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                style={{ color: theme.primaryColor }}
                onClick={(e) => e.stopPropagation()}
              >
                View gallery <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-10 text-center">
              <Image className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-slate-500">Gallery Coming Soon</p>
            </div>
          </section>
        )}

        {/* ── FAQ SECTION ───────────────────────────────────────────────── */}
        {isVisible('faq') && (
          <section
            onClick={() => handleClick('faq')}
            className={cn('py-16 border-b border-slate-100', sectionStyle(selectedSection === 'faq'))}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: theme.primaryColor }}>
              FAQ
            </p>
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                { q: 'How do I get my ticket?', a: 'Tickets are delivered to your email after purchase. You can also find them in your Munar account.' },
                { q: 'Is there parking available?', a: 'Please check the venue details for parking information closer to the event date.' },
                { q: 'Can I transfer my ticket?', a: 'Ticket transfers may be available. Contact the organiser for details.' },
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-5">
                  <p className="font-semibold text-slate-800 mb-2">{item.q}</p>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── FOOTER SECTION ────────────────────────────────────────────────── */}
      {isVisible('footer') && (
        <footer
          onClick={() => handleClick('footer')}
          className={cn('mt-10', sectionStyle(selectedSection === 'footer'))}
          style={{ backgroundColor: '#0f172a' }}
        >
          <div className="max-w-5xl mx-auto px-6 sm:px-8 py-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                {event.branding?.logo ? (
                  <img src={event.branding.logo} alt="Logo" className="w-10 h-10 rounded-xl object-contain mb-3" />
                ) : (
                  <div className="w-10 h-10 rounded-xl mb-3" style={{ backgroundColor: theme.primaryColor }} />
                )}
                <h3 className="font-bold text-white text-lg">{event.name}</h3>
                <p className="text-slate-400 text-sm mt-1">{event.date} · {event.venueLocation || event.country || 'TBD'}</p>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-2 text-sm">
                {isVisible('tickets') && (
                  <Link
                    to={`/e/${slug}/tickets`}
                    className="font-medium hover:opacity-80 transition-opacity"
                    style={{ color: theme.accentColor }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Get Tickets
                  </Link>
                )}
                {isVisible('forms') && (
                  <Link
                    to={`/e/${slug}/forms`}
                    className="text-slate-400 hover:text-white transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Forms
                  </Link>
                )}
              </div>
            </div>
            <div className="border-t border-white/10 mt-8 pt-6 text-center text-xs text-slate-500">
              Powered by{' '}
              <span className="font-semibold" style={{ color: theme.primaryColor }}>
                Munar
              </span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
