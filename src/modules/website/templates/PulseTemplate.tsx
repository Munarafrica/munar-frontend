// Pulse Template
// Bold, high-energy dark event website template
// Design: Dark background, vibrant accents, full-bleed sections, dramatic typography

import React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Calendar, MapPin, Clock, Ticket, Vote, ShoppingBag, FileText,
  Image, Users, Mic, ChevronRight, ExternalLink, Zap
} from 'lucide-react';
import { EventData } from '../../../components/event-dashboard/types';
import { Speaker, Session } from '../../../components/event-dashboard/types';
import { Sponsor } from '../../../types/sponsors';
import { WebsiteConfig, SectionId } from '../types';
import { cn } from '../../../components/ui/utils';

interface PulseTemplateProps {
  event: EventData;
  config: WebsiteConfig;
  speakers?: Speaker[];
  sessions?: Session[];
  sponsors?: Sponsor[];
  onSectionClick?: (id: SectionId) => void;
  selectedSection?: SectionId | null;
}

function sectionStyle(isSelected: boolean) {
  return isSelected
    ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-950 relative cursor-pointer transition-all'
    : 'relative cursor-pointer transition-all hover:ring-1 hover:ring-yellow-400/30 hover:ring-offset-1 hover:ring-offset-slate-950';
}

function getRadius(br: WebsiteConfig['theme']['borderRadius'], size: 'sm' | 'md' | 'lg' = 'md'): string {
  if (br === 'sharp') return '0px';
  if (br === 'pill') return '9999px';
  const map = { sm: '8px', md: '12px', lg: '16px' };
  return map[size];
}

export function PulseTemplate({ event, config, speakers = [], sessions = [], sponsors = [], onSectionClick, selectedSection }: PulseTemplateProps) {
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

  return (
    <div
      style={{ backgroundColor: theme.backgroundColor, fontFamily: theme.bodyFont + ', sans-serif' }}
      className="min-h-screen text-white"
    >
      {/* ── STICKY NAVBAR ──────────────────────────────────────────────────── */}
      {config.navbarEnabled !== false && (
        <nav
          className="sticky top-0 z-50 backdrop-blur-sm border-b"
          style={{
            backgroundColor: `${theme.backgroundColor}ee`,
            borderColor: `${theme.primaryColor}22`,
            fontFamily: theme.headingFont + ', sans-serif',
          }}
        >
          <div className="max-w-6xl mx-auto px-6 sm:px-10 h-14 flex items-center justify-between gap-6">
            <div className="flex items-center gap-3 min-w-0">
              {config.logoUrl ? (
                <img src={config.logoUrl} alt="Logo" className="h-8 w-auto object-contain flex-shrink-0" />
              ) : event.branding?.logo ? (
                <img src={event.branding.logo} alt="Logo" className="h-8 w-auto object-contain flex-shrink-0" />
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  <Zap className="w-4 h-4 text-black" />
                </div>
              )}
              <span className="text-sm font-black text-white truncate hidden sm:block">{event.name}</span>
            </div>
            <div className="hidden md:flex items-center gap-5 text-xs font-bold uppercase tracking-widest">
              {isVisible('about') && <a href="#about" className="text-slate-400 hover:text-white transition-colors">About</a>}
              {isVisible('schedule') && <a href="#schedule" className="text-slate-400 hover:text-white transition-colors">Schedule</a>}
              {isVisible('speakers') && <a href="#speakers" className="text-slate-400 hover:text-white transition-colors">Speakers</a>}
              {isVisible('sponsors') && <a href="#sponsors" className="text-slate-400 hover:text-white transition-colors">Sponsors</a>}
            </div>
            {isVisible('tickets') && (
              <Link
                to={`/e/${slug}/tickets`}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold hover:opacity-90 transition-opacity"
                style={{ backgroundColor: theme.primaryColor, color: theme.backgroundColor, borderRadius: getRadius(theme.borderRadius, 'sm') }}
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
          {/* Full-bleed background */}
          <div className="relative overflow-hidden" style={{ minHeight: 580 }}>
            {event.coverImageUrl ? (
              <>
                <img
                  src={event.coverImageUrl}
                  alt={event.name}
                  className="absolute inset-0 w-full h-full object-cover scale-105"
                  style={{ filter: 'brightness(0.3)' }}
                />
              </>
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(ellipse at top left, ${theme.primaryColor}44 0%, ${theme.backgroundColor} 60%)`,
                }}
              />
            )}

            {/* Gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to top, ${theme.backgroundColor} 0%, ${theme.backgroundColor}88 30%, transparent 70%)`,
              }}
            />

            {/* Animated accent lines */}
            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: theme.primaryColor }} />

            {/* Content */}
            <div
              className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 flex flex-col justify-end"
              style={{ minHeight: 580, paddingBottom: '5rem' }}
            >
              {/* Logo */}
              {event.branding?.logo && (
                <img
                  src={event.branding.logo}
                  alt="Logo"
                  className="w-16 h-16 rounded-2xl object-contain mb-6"
                />
              )}

              {/* Badge */}
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
                  style={{ backgroundColor: theme.primaryColor, color: '#000' }}
                >
                  <Zap className="w-3 h-3" />
                  {event.status === 'published' ? 'Now Live' : 'Upcoming'}
                </div>
                <span className="text-slate-500 text-xs font-medium">{event.type}</span>
              </div>

              <h1
                className="text-5xl sm:text-6xl lg:text-7xl font-black leading-none mb-6 max-w-3xl"
                style={{ letterSpacing: '-0.02em' }}
              >
                {event.name}
              </h1>

              <div className="flex flex-wrap gap-6 mb-10">
                {event.date && (
                  <span className="flex items-center gap-2 text-sm text-slate-300">
                    <Calendar className="w-4 h-4" style={{ color: theme.primaryColor }} />
                    <span className="font-medium">{event.date}</span>
                  </span>
                )}
                {event.time && (
                  <span className="flex items-center gap-2 text-sm text-slate-300">
                    <Clock className="w-4 h-4" style={{ color: theme.primaryColor }} />
                    <span className="font-medium">{event.time}</span>
                  </span>
                )}
                {(event.venueLocation || event.country) && (
                  <span className="flex items-center gap-2 text-sm text-slate-300">
                    <MapPin className="w-4 h-4" style={{ color: theme.primaryColor }} />
                    <span className="font-medium">{event.venueLocation || event.country}</span>
                  </span>
                )}
              </div>

              {/* CTAs */}
              <div className="flex gap-3 flex-wrap">
                {isVisible('tickets') && (
                  <Link
                    to={`/e/${slug}/tickets`}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm shadow-lg hover:opacity-90 hover:scale-105 transition-all"
                    style={{ backgroundColor: theme.primaryColor, color: theme.backgroundColor }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Ticket className="w-4 h-4" />
                    Get Tickets
                  </Link>
                )}
                {isVisible('voting') && (
                  <Link
                    to={`/e/${slug}/voting`}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm border-2 hover:bg-white/5 transition-all"
                    style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Vote className="w-4 h-4" />
                    Vote
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── ABOUT SECTION ─────────────────────────────────────────────────── */}
      {isVisible('about') && (event.description || event.type) && (
        <section
          onClick={() => handleClick('about')}
          className={cn('py-20 max-w-6xl mx-auto px-6 sm:px-10', sectionStyle(selectedSection === 'about'))}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-14 items-start">
            <div>
              <div
                className="w-10 h-1 mb-6 rounded-full"
                style={{ backgroundColor: theme.primaryColor }}
              />
              <h2 className="text-4xl font-black mb-6 leading-tight">
                About the <br />
                <span style={{ color: theme.primaryColor }}>Event</span>
              </h2>
              {event.description ? (
                <p className="text-slate-300 leading-relaxed text-base">
                  {event.description}
                </p>
              ) : (
                <p className="text-slate-500 italic">
                  Event description goes here.
                </p>
              )}
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Date', value: event.date || '—', icon: <Calendar className="w-5 h-5" /> },
                { label: 'Time', value: event.time || '—', icon: <Clock className="w-5 h-5" /> },
                { label: 'Type', value: event.type || '—', icon: <Zap className="w-5 h-5" /> },
                { label: 'Location', value: event.venueLocation || event.country || '—', icon: <MapPin className="w-5 h-5" /> },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl p-5"
                  style={{ backgroundColor: `${theme.primaryColor}11`, border: `1px solid ${theme.primaryColor}22` }}
                >
                  <div className="mb-2" style={{ color: theme.primaryColor }}>{item.icon}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">{item.label}</div>
                  <div className="font-bold text-white text-sm">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FULL-WIDTH DIVIDER ─────────────────────────────────────────────── */}
      {(isVisible('about') || isVisible('tickets')) && (
        <div className="w-full h-px" style={{ backgroundColor: `${theme.primaryColor}22` }} />
      )}

      {/* ── TICKETS SECTION ───────────────────────────────────────────────── */}
      {isVisible('tickets') && (
        <section
          onClick={() => handleClick('tickets')}
          className={cn('py-20', sectionStyle(selectedSection === 'tickets'))}
        >
          <div className="max-w-6xl mx-auto px-6 sm:px-10">
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="w-10 h-1 rounded-full mb-5" style={{ backgroundColor: theme.primaryColor }} />
                <h2 className="text-4xl font-black">
                  Get Your <span style={{ color: theme.primaryColor }}>Tickets</span>
                </h2>
              </div>
              <Link
                to={`/e/${slug}/tickets`}
                className="hidden sm:flex items-center gap-1 text-sm font-semibold hover:gap-2 transition-all"
                style={{ color: theme.primaryColor }}
                onClick={(e) => e.stopPropagation()}
              >
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Ticket CTA */}
            <div
              className="rounded-3xl overflow-hidden p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-8"
              style={{
                background: `linear-gradient(135deg, ${theme.primaryColor}33 0%, ${theme.secondaryColor}22 100%)`,
                border: `1px solid ${theme.primaryColor}44`,
              }}
            >
              <div className="flex items-center gap-5">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  <Ticket className="w-7 h-7" style={{ color: theme.backgroundColor }} />
                </div>
                <div>
                  <h3 className="font-black text-xl text-white">Reserve Your Place</h3>
                  <p className="text-slate-400 mt-1">Limited spots available — secure yours now</p>
                </div>
              </div>
              <Link
                to={`/e/${slug}/tickets`}
                className="flex-shrink-0 inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold shadow-lg hover:opacity-90 hover:scale-105 transition-all"
                style={{ backgroundColor: theme.primaryColor, color: theme.backgroundColor }}
                onClick={(e) => e.stopPropagation()}
              >
                <Ticket className="w-4 h-4" />
                Get Tickets
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── SCHEDULE SECTION ──────────────────────────────────────────────── */}
      {isVisible('schedule') && (
        <section
          id="schedule"
          onClick={() => handleClick('schedule')}
          className={cn('py-20', sectionStyle(selectedSection === 'schedule'))}
          style={{ backgroundColor: `${theme.primaryColor}08` }}
        >
          <div className="max-w-6xl mx-auto px-6 sm:px-10">
            <div className="w-10 h-1 rounded-full mb-5" style={{ backgroundColor: theme.primaryColor }} />
            <h2 className="text-4xl font-black mb-10">
              The <span style={{ color: theme.primaryColor }}>Programme</span>
            </h2>
            {sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-start gap-5 p-5"
                    style={{
                      backgroundColor: `${theme.primaryColor}0d`,
                      border: `1px solid ${theme.primaryColor}22`,
                      borderRadius: getRadius(theme.borderRadius),
                    }}
                  >
                    <div className="flex-shrink-0 text-center min-w-[64px]">
                      <div className="text-xs font-black uppercase tracking-widest" style={{ color: theme.primaryColor }}>{session.startTime}</div>
                      <div className="text-xs text-slate-500">&ndash;{session.endTime}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {session.track && (
                          <span
                            className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5"
                            style={{
                              borderRadius: getRadius(theme.borderRadius, 'sm'),
                              backgroundColor: `${session.trackColor || theme.primaryColor}22`,
                              color: session.trackColor || theme.primaryColor,
                            }}
                          >
                            {session.track}
                          </span>
                        )}
                        {session.location && (
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{session.location}
                          </span>
                        )}
                      </div>
                      <p className="font-black text-white text-sm">{session.title}</p>
                      {session.description && (
                        <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{session.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="rounded-3xl p-12 text-center"
                style={{ border: `1px solid ${theme.primaryColor}22`, backgroundColor: theme.backgroundColor }}
              >
                <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: `${theme.primaryColor}55` }} />
                <p className="font-black text-lg text-white">Schedule Coming Soon</p>
                <p className="text-slate-400 mt-2">The full lineup will be published before the event.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── SPEAKERS SECTION ──────────────────────────────────────────────── */}
      {isVisible('speakers') && (
        <section
          id="speakers"
          onClick={() => handleClick('speakers')}
          className={cn('py-20', sectionStyle(selectedSection === 'speakers'))}
        >
          <div className="max-w-6xl mx-auto px-6 sm:px-10">
            <div className="w-10 h-1 rounded-full mb-5" style={{ backgroundColor: theme.primaryColor }} />
            <h2 className="text-4xl font-black mb-10">
              Featured <span style={{ color: theme.primaryColor }}>Speakers</span>
            </h2>
            {speakers.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {speakers.map((sp) => (
                  <div
                    key={sp.id}
                    className="text-center p-4"
                    style={{
                      backgroundColor: `${theme.primaryColor}0d`,
                      border: `1px solid ${theme.primaryColor}22`,
                      borderRadius: getRadius(theme.borderRadius, 'lg'),
                    }}
                  >
                    {sp.imageUrl ? (
                      <img
                        src={sp.imageUrl}
                        alt={sp.name}
                        className="w-20 h-20 object-cover mx-auto mb-3"
                        style={{ borderRadius: getRadius(theme.borderRadius, 'lg') }}
                      />
                    ) : (
                      <div
                        className="w-20 h-20 mx-auto mb-3 flex items-center justify-center text-2xl font-black"
                        style={{ backgroundColor: `${theme.primaryColor}33`, color: theme.primaryColor, borderRadius: getRadius(theme.borderRadius, 'lg') }}
                      >
                        {sp.name.charAt(0)}
                      </div>
                    )}
                    <p className="font-black text-white text-sm">{sp.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: theme.primaryColor }}>{sp.role}</p>
                    {sp.organization && <p className="text-slate-500 text-xs">{sp.organization}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="rounded-3xl p-12 text-center"
                style={{ border: `1px solid ${theme.primaryColor}22` }}
              >
                <Mic className="w-12 h-12 mx-auto mb-4" style={{ color: `${theme.primaryColor}55` }} />
                <p className="font-black text-lg text-white">Lineup Being Announced</p>
                <p className="text-slate-400 mt-2">Our incredible speakers will be revealed soon. Stay tuned!</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── SPONSORS SECTION ──────────────────────────────────────────────── */}
      {isVisible('sponsors') && (
        <section
          id="sponsors"
          onClick={() => handleClick('sponsors')}
          className={cn('py-20', sectionStyle(selectedSection === 'sponsors'))}
          style={{ backgroundColor: `${theme.primaryColor}08` }}
        >
          <div className="max-w-6xl mx-auto px-6 sm:px-10">
            <div className="text-center mb-10">
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: theme.primaryColor }} />
              <h2 className="text-4xl font-black">
                Our <span style={{ color: theme.primaryColor }}>Sponsors</span>
              </h2>
              <p className="text-slate-400 mt-3">The organisations making this event possible</p>
            </div>
            {sponsors.length > 0 ? (
              <div className="flex flex-wrap items-center justify-center gap-5">
                {sponsors.map((sp) => (
                  <a
                    key={sp.id}
                    href={sp.websiteUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center p-5 hover:scale-105 transition-all"
                    style={{
                      borderRadius: getRadius(theme.borderRadius),
                      border: `1px solid ${theme.primaryColor}33`,
                      backgroundColor: `${theme.primaryColor}0d`,
                    }}
                    title={sp.name}
                  >
                    {sp.logoUrl ? (
                      <img src={sp.logoUrl} alt={sp.name} className="h-10 max-w-[140px] object-contain filter brightness-150 contrast-75" />
                    ) : (
                      <span className="text-sm font-black" style={{ color: theme.primaryColor }}>{sp.name}</span>
                    )}
                  </a>
                ))}
              </div>
            ) : (
              <div
                className="rounded-3xl p-12 text-center"
                style={{ border: `1px solid ${theme.primaryColor}22`, backgroundColor: theme.backgroundColor }}
              >
                <Users className="w-12 h-12 mx-auto mb-4" style={{ color: `${theme.primaryColor}55` }} />
                <p className="font-black text-lg text-white">Sponsors Being Confirmed</p>
                <p className="text-slate-400 mt-2">Our amazing partners will be announced soon.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── VOTING SECTION ────────────────────────────────────────────────── */}
      {isVisible('voting') && (
        <section
          onClick={() => handleClick('voting')}
          className={cn('py-20', sectionStyle(selectedSection === 'voting'))}
        >
          <div className="max-w-6xl mx-auto px-6 sm:px-10">
            <div
              className="rounded-3xl overflow-hidden p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-8"
              style={{
                background: `linear-gradient(135deg, ${theme.secondaryColor}44 0%, ${theme.primaryColor}22 100%)`,
                border: `1px solid ${theme.primaryColor}44`,
              }}
            >
              <div className="flex items-center gap-5">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: theme.secondaryColor }}
                >
                  <Vote className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-2xl text-white">Cast Your Vote</h3>
                  <p className="text-slate-300 mt-1">Have your say in live polls and awards</p>
                </div>
              </div>
              <Link
                to={`/e/${slug}/voting`}
                className="flex-shrink-0 inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold hover:opacity-90 hover:scale-105 transition-all text-white"
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

      {/* ── MERCH SECTION ─────────────────────────────────────────────────── */}
      {isVisible('merch') && (
        <section
          onClick={() => handleClick('merch')}
          className={cn('py-20', sectionStyle(selectedSection === 'merch'))}
          style={{ backgroundColor: `${theme.primaryColor}08` }}
        >
          <div className="max-w-6xl mx-auto px-6 sm:px-10">
            <div className="w-10 h-1 rounded-full mb-5" style={{ backgroundColor: theme.primaryColor }} />
            <div className="flex items-end justify-between mb-10">
              <h2 className="text-4xl font-black">
                Official <span style={{ color: theme.primaryColor }}>Merch</span>
              </h2>
              <Link
                to={`/e/${slug}/merch`}
                className="hidden sm:flex items-center gap-1 text-sm font-semibold hover:gap-2 transition-all"
                style={{ color: theme.primaryColor }}
                onClick={(e) => e.stopPropagation()}
              >
                Shop all <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div
              className="rounded-3xl p-12 text-center"
              style={{ border: `1px solid ${theme.primaryColor}22`, backgroundColor: theme.backgroundColor }}
            >
              <ShoppingBag className="w-12 h-12 mx-auto mb-4" style={{ color: `${theme.primaryColor}55` }} />
              <p className="font-black text-lg text-white">Merch Store Coming Soon</p>
              <p className="text-slate-400 mt-2">Exclusive event merch will be available here.</p>
              <Link
                to={`/e/${slug}/merch`}
                className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: theme.primaryColor, color: theme.backgroundColor }}
                onClick={(e) => e.stopPropagation()}
              >
                <ShoppingBag className="w-4 h-4" />
                Visit Store
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── FORMS SECTION ─────────────────────────────────────────────────── */}
      {isVisible('forms') && (
        <section
          onClick={() => handleClick('forms')}
          className={cn('py-20', sectionStyle(selectedSection === 'forms'))}
        >
          <div className="max-w-6xl mx-auto px-6 sm:px-10">
            <div
              className="rounded-3xl p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-8"
              style={{
                background: `linear-gradient(135deg, ${theme.accentColor}22 0%, ${theme.primaryColor}11 100%)`,
                border: `1px solid ${theme.accentColor}33`,
              }}
            >
              <div className="flex items-center gap-5">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: theme.accentColor }}
                >
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-2xl text-white">Forms & Surveys</h3>
                  <p className="text-slate-300 mt-1">Share your thoughts and register interest</p>
                </div>
              </div>
              <Link
                to={`/e/${slug}/forms`}
                className="flex-shrink-0 inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold hover:opacity-90 transition-opacity text-white"
                style={{ backgroundColor: theme.accentColor }}
                onClick={(e) => e.stopPropagation()}
              >
                <FileText className="w-4 h-4" />
                Fill Forms
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── GALLERY SECTION ───────────────────────────────────────────────── */}
      {isVisible('gallery') && (
        <section
          onClick={() => handleClick('gallery')}
          className={cn('py-20', sectionStyle(selectedSection === 'gallery'))}
          style={{ backgroundColor: `${theme.primaryColor}08` }}
        >
          <div className="max-w-6xl mx-auto px-6 sm:px-10">
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="w-10 h-1 rounded-full mb-5" style={{ backgroundColor: theme.primaryColor }} />
                <h2 className="text-4xl font-black">
                  <span style={{ color: theme.primaryColor }}>Gallery</span>
                </h2>
              </div>
              <Link
                to={`/e/${slug}/gallery`}
                className="flex items-center gap-1 text-sm font-semibold hover:gap-2 transition-all"
                style={{ color: theme.primaryColor }}
                onClick={(e) => e.stopPropagation()}
              >
                View all <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div
              className="rounded-3xl p-12 text-center"
              style={{ border: `1px solid ${theme.primaryColor}22`, backgroundColor: theme.backgroundColor }}
            >
              <Image className="w-12 h-12 mx-auto mb-4" style={{ color: `${theme.primaryColor}55` }} />
              <p className="font-black text-lg text-white">Gallery Coming Soon</p>
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ SECTION ───────────────────────────────────────────────────── */}
      {isVisible('faq') && (
        <section
          onClick={() => handleClick('faq')}
          className={cn('py-20', sectionStyle(selectedSection === 'faq'))}
        >
          <div className="max-w-6xl mx-auto px-6 sm:px-10">
            <div className="w-10 h-1 rounded-full mb-5" style={{ backgroundColor: theme.primaryColor }} />
            <h2 className="text-4xl font-black mb-10">
              <span style={{ color: theme.primaryColor }}>FAQ</span>
            </h2>
            <div className="space-y-3">
              {[
                { q: 'How do I get my ticket?', a: 'Tickets are delivered to your email after purchase. You can also find them in your Munar account.' },
                { q: 'Is there parking available?', a: 'Please check the venue details for parking information closer to the event date.' },
                { q: 'Can I transfer my ticket?', a: 'Ticket transfers may be available. Contact the organiser for details.' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-5"
                  style={{ backgroundColor: `${theme.primaryColor}11`, border: `1px solid ${theme.primaryColor}22` }}
                >
                  <p className="font-bold text-white mb-2">{item.q}</p>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER SECTION ────────────────────────────────────────────────── */}
      {isVisible('footer') && (
        <footer
          onClick={() => handleClick('footer')}
          className={cn(sectionStyle(selectedSection === 'footer'))}
          style={{ borderTop: `1px solid ${theme.primaryColor}22` }}
        >
          <div className="max-w-6xl mx-auto px-6 sm:px-10 py-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                {event.branding?.logo ? (
                  <img src={event.branding.logo} alt="Logo" className="w-12 h-12 rounded-2xl object-contain mb-3" />
                ) : (
                  <div
                    className="w-12 h-12 rounded-2xl mb-3"
                    style={{ backgroundColor: `${theme.primaryColor}33`, border: `2px solid ${theme.primaryColor}` }}
                  />
                )}
                <h3 className="font-black text-lg text-white">{event.name}</h3>
                <p className="text-slate-500 text-sm mt-1">
                  {event.date} {event.venueLocation || event.country ? `· ${event.venueLocation || event.country}` : ''}
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                {isVisible('tickets') && (
                  <Link
                    to={`/e/${slug}/tickets`}
                    className="font-bold hover:opacity-80 transition-opacity"
                    style={{ color: theme.primaryColor }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Tickets
                  </Link>
                )}
                {isVisible('voting') && (
                  <Link
                    to={`/e/${slug}/voting`}
                    className="text-slate-400 hover:text-white transition-colors font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Vote
                  </Link>
                )}
                {isVisible('merch') && (
                  <Link
                    to={`/e/${slug}/merch`}
                    className="text-slate-400 hover:text-white transition-colors font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Merch
                  </Link>
                )}
                {isVisible('forms') && (
                  <Link
                    to={`/e/${slug}/forms`}
                    className="text-slate-400 hover:text-white transition-colors font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Forms
                  </Link>
                )}
              </div>
            </div>

            <div
              className="mt-8 pt-6 text-center text-xs text-slate-600"
              style={{ borderTop: `1px solid ${theme.primaryColor}11` }}
            >
              Powered by{' '}
              <span className="font-bold" style={{ color: theme.primaryColor }}>
                Munar
              </span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
