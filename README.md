
# Munar Event Management Platform

A **modular event management system** with React frontend + Express.js backend. Features include ticketing, voting, merchandise, forms, sponsorships, and a website builder.

**Status**: Frontend with mock data ready; backend integration available

## Quick Start

### Frontend
```bash
npm install          # Install dependencies
npm run dev          # Start dev server → http://localhost:5173
npm run build        # Build for production
```

Frontend uses **React 18 + TypeScript + Vite + React Router v7 + Tailwind CSS v4 + Radix UI**.

### Backend (Optional)
```bash
cd backend
npm install
npm run dev          # Start API → http://localhost:3000

# Database setup
npm run db:push      # Push schema to Neon DB
npm run db:studio    # Browse DB visually
```

Backend uses **Express.js + Neon DB (PostgreSQL) + Drizzle ORM + JWT auth**.

## Architecture

### 4-Layer Component Hierarchy
```
AppShell (theme, auth, global state)
  └─ EventResolver (load event from URL)
    └─ BrandProvider (inject event branding)
      └─ Module (feature-specific component: tickets, voting, merch, etc.)
```

### Routing with React Router v7
- **Admin routes**: `/login`, `/events`, `/events/:eventId/...`
- **Public routes**: `/e/:eventSlug`, `/e/:eventSlug/tickets`, etc.
- **Module guarding**: Disabled modules show 404 with optional redirect to event website

### Module System
10 independent modules that can be enabled/disabled per event:
- **Core**: Website, Tickets, Program, Analytics
- **Growth**: Voting, Merchandise, DP Maker
- **Operations**: Forms, Gallery, Sponsors

Each module has:
- Public page (attendee-facing)
- Admin dashboard (organizer-facing)
- Service layer with mock + real API support
- Independent hook for state management

See [VOTING_MODULE_SPEC.md](./VOTING_MODULE_SPEC.md) for detailed module example.

## Configuration

### Frontend Environment (`.env`)
```bash
VITE_API_BASE_URL=http://localhost:3000/api  # Backend URL
VITE_USE_MOCK_DATA=true                      # Use mock data (no backend needed)
VITE_API_TIMEOUT=30000                       # Request timeout in ms
```

### Backend Environment (`backend/.env`)
```bash
DATABASE_URL=postgresql://...  # Neon DB connection string
JWT_ACCESS_SECRET=...          # Generate: openssl rand -hex 64
JWT_REFRESH_SECRET=...         # Generate: openssl rand -hex 64
CORS_ORIGINS=http://localhost:5173,https://yourdomain.com
```

## API Endpoints

### Authentication
| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/signup` | – |
| POST | `/api/auth/login` | – |
| POST | `/api/auth/forgot-password` | – |
| GET | `/api/auth/me` | ✓ |
| PATCH | `/api/auth/profile` | ✓ |

### Events
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/events` | ✓ |
| POST | `/api/events` | ✓ |
| GET | `/api/events/:id` | ✓ |
| PATCH | `/api/events/:id` | ✓ |
| GET | `/api/events/slug/:slug` | – |

### Per-Event Modules
All nested under `/api/events/:eventId/`:
- `/tickets` - CRUD + attendees + check-in
- `/program/speakers`, `/program/sessions` - Schedule management
- `/forms/:id/responses` - Custom forms + submissions
- `/voting/campaigns` - Campaigns, rounds, voting
- `/merchandise/products`, `/merchandise/orders` - Merch store
- `/sponsors` - Sponsor management
- `/website` - Website config

## Project Structure

```
├── src/
│   ├── pages/               # Full pages (auth, dashboard, admin)
│   ├── components/
│   │   ├── ui/              # Radix-based primitives
│   │   ├── AppShell.tsx     # App wrapper
│   │   ├── EventResolver.tsx # Event data loader
│   │   └── ModuleGuard.tsx  # Module access control
│   ├── modules/             # Feature modules (tickets, voting, merch, etc.)
│   ├── contexts/            # Global state (Auth, Event, Brand, Voting, Merchandise)
│   ├── hooks/               # Data hooks (useEvents, useTickets, etc.)
│   ├── services/            # API + mock service layer
│   ├── lib/                 # api-client, navigation, event-storage
│   ├── types/               # Global types + module system
│   ├── config/              # Environment config
│   └── styles/              # Global CSS + Tailwind variables
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── app.ts           # Express app setup
│   │   ├── server.ts        # Server entry point
│   │   ├── routes/          # API endpoints
│   │   ├── controllers/     # Business logic
│   │   ├── db/              # Drizzle schema + migrations
│   │   └── middleware/      # Auth, validation, error handling
│   ├── drizzle.config.ts    # ORM config
│   └── package.json
├── docs/                    # Documentation
├── VOTING_MODULE_SPEC.md    # Canonical module implementation guide
└── package.json
```

## Development Workflow

### Adding a New Module
1. Define `ModuleType` in [src/types/modules.ts](src/types/modules.ts)
2. Add to `MODULE_REGISTRY` with metadata
3. Create `src/modules/my-module/` folder with:
   - `MyModulePublic.tsx` - Public page
   - `types.ts` - Module types
   - `hooks.ts` - Custom hooks
   - `components/` - UI components
4. Add admin page in `src/pages/MyModuleManagement.tsx`
5. Create service in `src/services/my-module.service.ts` with mock + API support
6. Add routes to [src/router/index.tsx](src/router/index.tsx)
7. Apply dark mode styling throughout

See [VOTING_MODULE_SPEC.md](./VOTING_MODULE_SPEC.md) for a complete step-by-step example.

### Mock-First Development
All services check `config.features.useMockData` and automatically handle:
- Mock data in development (`VITE_USE_MOCK_DATA=true`)
- Real API when connected (`VITE_USE_MOCK_DATA=false`)
- No code changes needed - just flip the env var

Mock data files: `src/services/mock/*-data.ts`

### Styling
- **Framework**: Tailwind CSS v4 with CSS variables
- **Components**: Radix UI primitives wrapped in `src/components/ui/`
- **Font**: Raleway on containers
- **Dark mode**: Always pair light/dark classes; see [.github/copilot-instructions.md](./.github/copilot-instructions.md#dark-mode-critical---always-pair-lightdark-classes)

### Navigation
- **Router**: React Router v7 with `useNavigate()` hook
- **Legacy support**: Some components still use `onNavigate` prop via `useAppNavigate()` bridge
- **Routes**: Defined in [src/router/index.tsx](src/router/index.tsx)

## Troubleshooting

### Frontend won't load
- Check Node version: `node -v` (requires 18+)
- Clear `node_modules`: `rm -r node_modules && npm install`
- Check port 5173 is available

### Backend connection failing
- Is backend running? Check `http://localhost:3000/api/health`
- Is `VITE_USE_MOCK_DATA=false`?
- Check CORS_ORIGINS in `backend/.env`
- Verify JWT secrets match between frontend and backend

### Tokens keep expiring
- JWT tokens are stored in localStorage (`munar_auth_token`, `munar_refresh_token`)
- Refresh token flow is automatic via api-client.ts
- If stuck in 401 loop, clear localStorage and log in again

### Dark mode not working
- Isn't applied? Check that light and dark classes are paired (e.g., `bg-white dark:bg-slate-900`)
- Theme stored in localStorage: `vite-ui-theme`
- Access theme with `useTheme()` hook from [src/components/theme-provider.tsx](src/components/theme-provider.tsx)

## Contributing

Follow the patterns established in this codebase:

1. **Services**: Always support both mock and real API
2. **Hooks**: Return `{ data, isLoading, error, ...mutations }`
3. **Components**: Use dark mode pairs, Radix primitives, cn() utility
4. **Types**: Extend existing types rather than duplicating
5. **Routing**: Use React Router `useNavigate()`
6. **Modules**: Follow [VOTING_MODULE_SPEC.md](./VOTING_MODULE_SPEC.md) structure

See [.github/copilot-instructions.md](./.github/copilot-instructions.md) for detailed AI coding guidelines.

## Resources

- **Figma Design**: [Event Management Platform UI](https://www.figma.com/design/TM9cwp5R3xfovh1VLvreHy/Event-Management-Platform-UI)
- **Backend Docs**: [backend/README.md](./backend/README.md)
- **Module Specs**: [VOTING_MODULE_SPEC.md](./VOTING_MODULE_SPEC.md)
- **AI Coding Guide**: [.github/copilot-instructions.md](./.github/copilot-instructions.md)

## License

MIT
