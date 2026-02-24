// Public Forms Page - Attendee-facing form submission interface
// Route: /e/:eventSlug/forms

import React from 'react';
import { useEvent } from '../../contexts';
import { useBrandSafe } from '../../contexts/BrandContext';
import { Button } from '../../components/ui/button';
import { FileText, ArrowLeft, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../components/ui/utils';

export function FormsPublic() {
  const { currentEvent } = useEvent();
  const { branding } = useBrandSafe();

  if (!currentEvent) return null;

  // Mock forms data for stub
  const forms = [
    {
      id: 'f1',
      title: 'General Registration',
      description: 'Standard attendee registration form',
      status: 'published' as const,
      responseCount: 45,
      isPaid: false,
    },
    {
      id: 'f2',
      title: 'Post-Event Survey',
      description: 'Share your feedback about the event experience',
      status: 'published' as const,
      responseCount: 12,
      isPaid: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-['Raleway']">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link
            to={`/e/${currentEvent.slug || currentEvent.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to event
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Forms & Surveys
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {currentEvent.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form List */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {forms.map((form) => (
            <div
              key={form.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    {form.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {form.description}
                  </p>
                </div>
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1',
                    form.status === 'published'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  )}
                >
                  <CheckCircle className="w-3 h-3" />
                  Open
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-3 mb-4">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  ~5 min to complete
                </span>
              </div>

              <Button size="sm" className="rounded-xl">
                Fill Out Form
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-600">
        Powered by Munar
      </div>
    </div>
  );
}
