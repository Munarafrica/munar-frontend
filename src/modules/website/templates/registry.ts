// Template Registry - All available website templates
import { TemplateDefinition } from '../types';

export const TEMPLATE_REGISTRY: TemplateDefinition[] = [
  {
    id: 'horizon',
    name: 'Horizon',
    description: 'Clean, modern layout with elegant typography and generous white space.',
    category: 'Single Event',
    useCase: 'Ideal for conferences, product launches, corporate events, and professional gatherings.',
    supportedModules: ['tickets', 'schedule', 'speakers', 'sponsors', 'forms', 'gallery'],
    accentStyle: 'light',
    previewColors: {
      bg: '#f8fafc',
      header: '#1e293b',
      accent: '#6366f1',
      text: '#475569',
      card: '#ffffff',
    },
  },
  {
    id: 'pulse',
    name: 'Pulse',
    description: 'Bold, high-energy design with vibrant colors and immersive full-bleed visuals.',
    category: 'Festival',
    useCase: 'Perfect for music festivals, award shows, entertainment events, and conferences.',
    supportedModules: ['tickets', 'schedule', 'speakers', 'sponsors', 'voting', 'merch', 'gallery'],
    accentStyle: 'dark',
    previewColors: {
      bg: '#0f172a',
      header: '#0f172a',
      accent: '#f59e0b',
      text: '#cbd5e1',
      card: '#1e293b',
    },
  },
];

export const getTemplateById = (id: string): TemplateDefinition =>
  TEMPLATE_REGISTRY.find((t) => t.id === id) ?? TEMPLATE_REGISTRY[0];
