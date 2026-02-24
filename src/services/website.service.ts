// Website Service
// Manages website configuration persistence for each event

import { WebsiteConfig, DEFAULT_WEBSITE_CONFIG, DEFAULT_SECTIONS } from '../modules/website/types';

const STORAGE_KEY_PREFIX = 'munar_website_config_';

function getStorageKey(eventId: string): string {
  return `${STORAGE_KEY_PREFIX}${eventId}`;
}

export const websiteService = {
  /**
   * Load the website config for an event.
   * Falls back to default config if none is saved yet.
   */
  getConfig(eventId: string): WebsiteConfig {
    try {
      const raw = localStorage.getItem(getStorageKey(eventId));
      if (!raw) return { ...DEFAULT_WEBSITE_CONFIG, sections: [...DEFAULT_SECTIONS] };
      const parsed = JSON.parse(raw) as WebsiteConfig;
      // Ensure all default sections exist (forward-compatible)
      const existingIds = new Set(parsed.sections.map((s) => s.id));
      const missingSections = DEFAULT_SECTIONS.filter((s) => !existingIds.has(s.id));
      if (missingSections.length > 0) {
        parsed.sections = [...parsed.sections, ...missingSections];
      }
      return parsed;
    } catch {
      return { ...DEFAULT_WEBSITE_CONFIG, sections: [...DEFAULT_SECTIONS] };
    }
  },

  /**
   * Save the website config for an event.
   */
  saveConfig(eventId: string, config: WebsiteConfig): WebsiteConfig {
    const updated: WebsiteConfig = {
      ...config,
      lastSaved: new Date().toISOString(),
    };
    try {
      localStorage.setItem(getStorageKey(eventId), JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save website config:', e);
    }
    return updated;
  },

  /**
   * Publish (or unpublish) the website.
   */
  publish(eventId: string, config: WebsiteConfig): WebsiteConfig {
    return this.saveConfig(eventId, { ...config, status: 'published' });
  },

  unpublish(eventId: string, config: WebsiteConfig): WebsiteConfig {
    return this.saveConfig(eventId, { ...config, status: 'draft' });
  },

  /**
   * Check if the event has a saved (non-default) website config.
   */
  hasConfig(eventId: string): boolean {
    return !!localStorage.getItem(getStorageKey(eventId));
  },
};
