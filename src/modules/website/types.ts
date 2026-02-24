// Website Module Types
// Configuration for the Event Website Builder

export type WebsiteTemplateId = 'horizon' | 'pulse';
export type WebsiteStatus = 'draft' | 'published';
export type AccessControl = 'public' | 'password' | 'private';

export type SectionId =
  | 'hero'
  | 'about'
  | 'schedule'
  | 'speakers'
  | 'sponsors'
  | 'tickets'
  | 'voting'
  | 'merch'
  | 'forms'
  | 'gallery'
  | 'faq'
  | 'footer';

export interface SectionConfig {
  id: SectionId;
  label: string;
  visible: boolean;
  order: number;
  variant?: string;
}

export interface WebsiteTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  headingFont: string;
  bodyFont: string;
  borderRadius: 'sharp' | 'rounded' | 'pill';
  buttonStyle: 'solid' | 'outline' | 'ghost';
}

export const DEFAULT_SECTIONS: SectionConfig[] = [
  { id: 'hero', label: 'Hero', visible: true, order: 0 },
  { id: 'about', label: 'About', visible: true, order: 1 },
  { id: 'tickets', label: 'Tickets', visible: true, order: 2 },
  { id: 'schedule', label: 'Schedule', visible: true, order: 3 },
  { id: 'speakers', label: 'Speakers', visible: true, order: 4 },
  { id: 'sponsors', label: 'Sponsors', visible: true, order: 5 },
  { id: 'voting', label: 'Voting', visible: false, order: 6 },
  { id: 'merch', label: 'Merchandise', visible: false, order: 7 },
  { id: 'forms', label: 'Forms', visible: false, order: 8 },
  { id: 'gallery', label: 'Gallery', visible: false, order: 9 },
  { id: 'faq', label: 'FAQ', visible: false, order: 10 },
  { id: 'footer', label: 'Footer', visible: true, order: 11 },
];

export interface WebsiteConfig {
  templateId: WebsiteTemplateId;
  status: WebsiteStatus;
  theme: WebsiteTheme;
  sections: SectionConfig[];
  seo: {
    title: string;
    description: string;
    socialImage?: string;
  };
  slug?: string;
  accessControl: AccessControl;
  password?: string;
  lastSaved?: string;
  /** Custom logo URL shown in the website navbar */
  logoUrl?: string;
  /** Whether the sticky navbar is shown */
  navbarEnabled?: boolean;
}

export const DEFAULT_THEME_HORIZON: WebsiteTheme = {
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6',
  accentColor: '#f59e0b',
  backgroundColor: '#ffffff',
  headingFont: 'Raleway',
  bodyFont: 'Raleway',
  borderRadius: 'rounded',
  buttonStyle: 'solid',
};

export const DEFAULT_THEME_PULSE: WebsiteTheme = {
  primaryColor: '#f59e0b',
  secondaryColor: '#ef4444',
  accentColor: '#06b6d4',
  backgroundColor: '#0f172a',
  headingFont: 'Raleway',
  bodyFont: 'Raleway',
  borderRadius: 'rounded',
  buttonStyle: 'solid',
};

export const DEFAULT_WEBSITE_CONFIG: WebsiteConfig = {
  templateId: 'horizon',
  status: 'draft',
  theme: DEFAULT_THEME_HORIZON,
  sections: DEFAULT_SECTIONS,
  seo: { title: '', description: '' },
  accessControl: 'public',
};

// Template definition for the template picker
export interface TemplateDefinition {
  id: WebsiteTemplateId;
  name: string;
  description: string;
  category: string;
  useCase: string;
  supportedModules: string[];
  accentStyle: 'light' | 'dark';
  previewColors: {
    bg: string;
    header: string;
    accent: string;
    text: string;
    card: string;
  };
}

// PostMessage event for real-time preview sync between builder and iframe
export interface WebsitePreviewMessage {
  type: 'WEBSITE_PREVIEW_CONFIG';
  config: WebsiteConfig;
  eventSlug: string;
  /** Highlights the given section in the live preview */
  selectedSectionId?: SectionId | null;
}

export interface WebsitePreviewReadyMessage {
  type: 'WEBSITE_PREVIEW_READY';
}

/** Sent from the iframe template back to the builder when a section is clicked */
export interface WebsiteSectionClickMessage {
  type: 'WEBSITE_SECTION_CLICK';
  sectionId: SectionId;
}
