// Builder Canvas
// iframe-based live preview that receives config via postMessage

import React, { useRef, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { SectionId, WebsiteConfig, WebsitePreviewMessage, WebsiteSectionClickMessage } from '../../modules/website/types';

export type PreviewMode = 'desktop' | 'tablet' | 'mobile';

interface BuilderCanvasProps {
  eventSlug: string;
  config: WebsiteConfig;
  previewMode: PreviewMode;
  isReady: boolean;
  selectedSectionId?: SectionId | null;
  onIframeReady: () => void;
  /** Called when the user clicks a section in the iframe preview */
  onSectionClick?: (id: SectionId) => void;
}

const PREVIEW_WIDTHS: Record<PreviewMode, { container: string; iframe: string; label: string }> = {
  desktop: {
    container: 'w-full',
    iframe: 'w-full',
    label: 'Desktop',
  },
  tablet: {
    container: 'max-w-[768px] mx-auto',
    iframe: 'w-full',
    label: 'Tablet (768px)',
  },
  mobile: {
    container: 'max-w-[375px] mx-auto',
    iframe: 'w-full',
    label: 'Mobile (375px)',
  },
};

export function BuilderCanvas({
  eventSlug, config, previewMode, isReady, selectedSectionId,
  onIframeReady, onSectionClick,
}: BuilderCanvasProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewUrl = `${window.location.origin}/e/${config.slug || eventSlug}?preview=1`;
  const pw = PREVIEW_WIDTHS[previewMode];

  // Send config + selected section to iframe via postMessage
  const sendConfig = useCallback(() => {
    if (!iframeRef.current?.contentWindow) return;
    const msg: WebsitePreviewMessage = {
      type: 'WEBSITE_PREVIEW_CONFIG',
      config,
      eventSlug,
      selectedSectionId: selectedSectionId ?? null,
    };
    iframeRef.current.contentWindow.postMessage(msg, window.location.origin);
  }, [config, eventSlug, selectedSectionId]);

  // Listen for READY and SECTION_CLICK from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'WEBSITE_PREVIEW_READY') {
        onIframeReady();
        sendConfig();
      } else if (event.data?.type === 'WEBSITE_SECTION_CLICK') {
        const msg = event.data as WebsiteSectionClickMessage;
        onSectionClick?.(msg.sectionId);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sendConfig, onIframeReady, onSectionClick]);

  // Re-send config whenever it changes (iframe already loaded)
  useEffect(() => {
    if (isReady) sendConfig();
  }, [isReady, sendConfig]);

  return (
    <div className="flex-1 bg-slate-100 dark:bg-slate-950 overflow-auto flex flex-col">
      {/* Mode label */}
      <div className="flex items-center justify-center py-2 flex-shrink-0">
        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{pw.label}</span>
      </div>

      {/* Canvas container with shadow */}
      <div className="flex-1 px-4 pb-8">
        <div className={pw.container}>
          <div className="relative rounded-xl overflow-hidden shadow-2xl bg-white" style={{ minHeight: 600 }}>
            {!isReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 dark:bg-slate-900/80 z-10 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                  <span className="text-sm text-slate-500 font-medium">Loading preview…</span>
                </div>
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={previewUrl}
              title="Website Preview"
              className={`${pw.iframe} border-0`}
              style={{ height: '100vh', minHeight: 600, display: 'block' }}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
