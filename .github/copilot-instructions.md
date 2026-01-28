# Munar Event Management Platform - AI Coding Instructions

## Project Overview
This is a **React + TypeScript + Vite** frontend for an event management platform. The UI was originally exported from Figma and uses a comprehensive component library based on **Radix UI primitives** with **Tailwind CSS v4** styling.

The project is **backend-ready** with a complete API layer, service modules, contexts, and hooks that currently use mock data but can be switched to real API calls via environment configuration.

## Architecture

### Navigation Pattern
The app uses a **single-page state-based routing** system via `useState` in [src/App.tsx](src/App.tsx):
- Pages receive `onNavigate: (page: Page) => void` prop for navigation
- The `Page` type union defines all valid routes
- No React Router - navigation is controlled via `setCurrentPage` state updates

### Component Organization
```
src/
├── pages/           # Full-page views (receive onNavigate prop)
├── components/
│   ├── ui/          # Radix-based primitives (Button, Input, Card, etc.)
│   ├── auth/        # Auth flow layouts (AuthLayout, AuthCard)
│   ├── dashboard/   # Dashboard chrome (TopBar, headers)
│   ├── event-dashboard/  # Event management features
│   │   ├── forms/   # Form builder components
│   │   └── program/ # Schedule/speaker management
│   └── events/      # Event listing components
├── config/          # Environment configuration
├── contexts/        # React Context providers (Auth, Event)
├── hooks/           # Custom data hooks (useEvents, useTickets, etc.)
├── lib/             # API client and utilities
├── services/        # API service modules with mock data support
├── types/           # API types and interfaces
├── imports/         # Figma-generated legacy components (avoid modifying)
└── assets/          # Static images (referenced via figma:asset aliases)
```

## Backend-Ready Architecture

### Configuration
Environment variables are managed in [src/config/index.ts](src/config/index.ts):
```tsx
import { config } from './config';

// API configuration
config.api.baseUrl      // API base URL
config.api.timeout      // Request timeout

// Feature flags
config.features.useMockData  // Toggle mock/real API (default: true)
```

Set up environment by copying `.env.example` to `.env`:
```bash
VITE_API_URL=http://localhost:3000/api
VITE_USE_MOCK_DATA=true
```

### API Client
The HTTP client in [src/lib/api-client.ts](src/lib/api-client.ts) handles:
- Authentication token injection
- Automatic 401 logout handling
- Request timeouts
- Typed responses

```tsx
import { apiClient } from './lib/api-client';

// Typed API calls
const events = await apiClient.get<Event[]>('/events');
await apiClient.post<Event>('/events', eventData);
```

### Service Layer
Services in `src/services/` abstract API calls with mock data support:

```tsx
import { authService, eventsService, ticketsService, programService, formsService } from './services';

// Each service checks config.features.useMockData internally
const events = await eventsService.getEvents();
const user = await authService.login(email, password);
```

**Service modules:**
- `auth.service.ts` - Login, signup, password reset, profile updates
- `events.service.ts` - Event CRUD, publishing, metrics, checklist
- `tickets.service.ts` - Ticket types, attendees, check-in, analytics
- `program.service.ts` - Speakers, sessions, tracks, schedule
- `forms.service.ts` - Custom forms, responses, export, analytics
- `merchandise.service.ts` - Products, orders, inventory, fulfilment, discounts

### React Contexts
Global state management via contexts in `src/contexts/`:

**AuthContext** - User authentication state:
```tsx
import { useAuth } from './contexts';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
}
```

**EventContext** - Current event data (wrap event pages):
```tsx
import { EventProvider, useEvent } from './contexts';

// In parent:
<EventProvider eventId={eventId}>
  <EventDashboard />
</EventProvider>

// In child:
const { currentEvent, metrics, updateEvent, publishEvent } = useEvent();
```

**MerchandiseContext** - Merchandise state for an event:
```tsx
import { MerchandiseProvider, useMerchandise } from './contexts';

// In parent:
<MerchandiseProvider eventId={eventId}>
  <MerchandiseManagement />
</MerchandiseProvider>

// In child:
const { products, orders, analytics, refreshProducts } = useMerchandise();
```

### Custom Hooks
Data fetching hooks in `src/hooks/` provide state management:

```tsx
import { useEvents, useTickets, useProgram, useForms, useProducts, useOrders } from './hooks';

// Events list with search/filter
const { events, isLoading, searchEvents, deleteEvent } = useEvents();

// Tickets and attendees
const { tickets, attendees, createTicket, checkInAttendee } = useTickets({ eventId });

// Program management
const { speakers, sessions, createSpeaker, updateSession } = useProgram({ eventId });

// Forms management  
const { forms, responses, createForm, exportResponses } = useForms({ eventId });

// Merchandise products
const { products, createProduct, duplicateProduct, adjustInventory } = useProducts({ eventId });

// Merchandise orders
const { orders, markFulfilled, cancelOrder, exportOrders } = useOrders({ eventId });
```

### API Types
Typed API structures in [src/types/api.ts](src/types/api.ts):
```tsx
import { ApiResponse, PaginatedResponse, LoginRequest, AuthResponse } from './types/api';
```

Merchandise types in [src/types/merchandise.ts](src/types/merchandise.ts):
```tsx
import { Product, Order, ProductVariant, FulfilmentConfig, MerchandiseAnalytics } from './types/merchandise';
```

## Styling Conventions

### Tailwind + CSS Variables
- Use CSS variables defined in [src/styles/globals.css](src/styles/globals.css) for theming
- Primary colors: `--primary`, `--muted`, `--accent`, `--destructive`
- Dark mode: Uses `.dark` class with `@custom-variant dark (&:is(.dark *))`
- Font: Raleway (`font-['Raleway']` on containers)

### Component Styling Pattern
Always use the `cn()` utility from [src/components/ui/utils.ts](src/components/ui/utils.ts) for conditional classes:
```tsx
import { cn } from './ui/utils';

<div className={cn("base-classes", isActive && "active-classes", className)} />
```

### Common Tailwind Classes
- Cards: `rounded-xl border bg-card`
- Buttons: `rounded-xl` (not `rounded-lg`)
- Spacing: Use `gap-6`, `p-6`, `space-y-8` for consistent rhythm
- Max widths: `max-w-[1440px]` for main content, `max-w-[540px]` for auth forms

### Dark Mode Color Patterns (CRITICAL)
Always pair light/dark mode classes. Use these established patterns:

**Backgrounds:**
| Element | Light | Dark |
|---------|-------|------|
| Page/Main | `bg-slate-50` | `dark:bg-slate-950` |
| Modal container | `bg-white` | `dark:bg-slate-900` |
| Card/Panel | `bg-white` | `dark:bg-slate-800/50` |
| Section bar/footer | `bg-slate-50/50` | `dark:bg-slate-900/80` |
| Input fields | `bg-white` | `dark:bg-slate-950` |
| Subtle highlight | `bg-slate-100` | `dark:bg-slate-800` |

**Borders:**
| Element | Light | Dark |
|---------|-------|------|
| Card/Modal | `border-slate-200` | `dark:border-slate-800` |
| Input/Divider | `border-slate-200` | `dark:border-slate-700` |
| Subtle separator | `border-slate-100` | `dark:border-slate-800` |

**Text:**
| Element | Light | Dark |
|---------|-------|------|
| Primary | `text-slate-900` | `dark:text-slate-100` |
| Secondary | `text-slate-600` | `dark:text-slate-300` |
| Muted | `text-slate-500` | `dark:text-slate-400` |
| Placeholder | `placeholder:text-slate-400` | `dark:placeholder:text-slate-500` |

**Hover States (IMPORTANT):**
| Element | Light | Dark |
|---------|-------|------|
| Table row | `hover:bg-slate-50` | `dark:hover:bg-slate-800/50` |
| Button/Icon | `hover:bg-slate-100` | `dark:hover:bg-slate-800` |
| Interactive card | `hover:bg-slate-50` | `dark:hover:bg-slate-800` |
| ⚠️ AVOID | - | `dark:hover:bg-slate-900/*` (too dark, text invisible) |

**Example - Modal structure:**
```tsx
// Backdrop
<div className="bg-black/40 backdrop-blur-sm" />

// Container
<div className="bg-white dark:bg-slate-900 border border-transparent dark:border-slate-800" />

// Header/Footer bars
<div className="bg-slate-50/50 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800" />

// Input field
<input className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100" />

// Table row with hover
<tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50" />
```

## UI Component Patterns

### Button Components
The project has **two button components**:

1. **`button.tsx`** (shadcn-style, flexible) - Use for dashboards and general UI:
   ```tsx
   import { Button } from './ui/button';
   <Button variant="default" size="default">Click me</Button>
   <Button variant="outline" size="sm">Secondary</Button>
   ```
   Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
   Sizes: `default`, `sm`, `lg`, `xl`, `icon`

2. **`AuthButton.tsx`** (full-width, auth forms only) - Use for login/signup:
   ```tsx
   import { Button } from './ui/AuthButton';
   <Button variant="primary">Submit</Button>
   <Button variant="google">Sign in with Google</Button>
   ```
   Variants: `primary`, `google`, `link`

### Form Inputs
- Use custom `Input` component with built-in label and password toggle
- Wrap forms in `<form>` with `onSubmit` handling `e.preventDefault()`

### Modals/Dialogs
- Use Radix Dialog primitives for modals
- Pattern: backdrop with `bg-black/40 backdrop-blur-sm`
- Modal container: `rounded-xl shadow-2xl max-h-[90vh]`

## Type Definitions
Event-related types are centralized in [src/components/event-dashboard/types.ts](src/components/event-dashboard/types.ts):
- `EventData`, `EventPhase`, `EventStatus`
- `TicketType`, `Module`, `Activity`, `ChecklistItem`
- Always extend these types rather than creating duplicates

## Theme System
Dark/light mode via [src/components/theme-provider.tsx](src/components/theme-provider.tsx):
- Wraps app in `ThemeProvider` with `storageKey="vite-ui-theme"`
- Access theme with `useTheme()` hook
- Apply dark styles with `dark:` prefix

## Development Commands
```bash
npm install    # Install dependencies
npm run dev    # Start Vite dev server
```

## Key Patterns to Follow
1. **Props drilling for navigation**: Pass `onNavigate` through component hierarchy
2. **Figma assets**: Import via `figma:asset/...` aliases configured in vite.config.ts
3. **Component composition**: Use data-slot attributes for compound components (see Card)
4. **State management**: Use contexts for global state, hooks for feature-specific data
5. **Icon usage**: Import from `lucide-react` for icons, custom icons in [src/components/icons.tsx](src/components/icons.tsx)
6. **API integration**: Always use service modules, never call API directly
7. **Mock data toggle**: Use `config.features.useMockData` for development

## When Connecting Backend
1. Set `VITE_USE_MOCK_DATA=false` in `.env`
2. Set `VITE_API_URL` to your backend URL
3. Services will automatically switch to real API calls
4. Implement any missing service methods as needed

## Avoid
- Modifying files in `src/imports/` (Figma-generated, may be overwritten)
- Creating new routing systems - use existing `onNavigate` pattern
- Inline styles - use Tailwind classes with CSS variables
- Generic Radix imports - use the wrapped components in `src/components/ui/`
- Direct API calls - always use service modules
- Creating duplicate type definitions - extend existing types in `types/` or `event-dashboard/types.ts`
- Creating new UI components when equivalent exists (see list below)

## Existing UI Components (DO NOT DUPLICATE)
Before creating a new component, check if it already exists in `src/components/ui/`:

**Form Elements:**
- `Input` - Text input with optional label, password toggle, dark mode support
- `Checkbox` - Styled checkbox with label
- `label` - Form labels

**Layout & Containers:**
- `Card`, `CardHeader`, `CardContent`, `CardFooter` - Card containers
- `Divider` - Horizontal divider
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter` - Modal dialogs (use for new modals)

**Buttons & Actions:**
- `button.tsx` - Primary button component (use for dashboards)
- `AuthButton.tsx` - Auth-specific button (use only in auth flows)
- `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` - Dropdown menus

**Feedback:**
- `Badge` - Status badges with variants
- `Alert` - Alert messages
- `Progress` - Progress bars
- `Skeleton` - Loading skeletons

**Navigation:**
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` - Tabbed interfaces
- `Accordion` - Collapsible sections
- `Breadcrumb` - Breadcrumb navigation

**Data Display:**
- `Avatar` - User avatars
- `Tooltip` - Hover tooltips

**Merchandise Module Components (in `src/components/merchandise/`):**
- `ProductCard` - Product display card
- `ProductModal` - Add/edit product wizard
- `OrderRow` - Order table row
- `OrderDetailModal` - Order details view
- `ImageUploader` - Multi-image upload with drag & drop
- `VariantBuilder` - Product variant manager
- `AnalyticsTab` - Analytics dashboard
- `SettingsTab` - Settings panel
