# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

FlexBookmark is a Chrome extension (Manifest V3) built with React/TypeScript that provides a comprehensive new tab replacement with bookmark management, task management, habit tracking, and financial management capabilities. The extension leverages Google OAuth2 for authentication and Google Sheets API for data synchronization.

## Development Commands

### Build and Development
```bash
# Development build with hot reload
npm run dev

# Production build
npm run build

# Build service worker (automatically runs after build)
npm run postbuild

# Watch build (auto-rebuild on file changes if enabled)
npm run watchbuild

# Toggle watch build on/off
npm run toggle-watchbuild

# Lint code
npm run lint

# Preview build
npm run preview
```

### Chrome Extension Development
- Load the extension: Build first (`npm run build`), then load the `dist/` directory in Chrome Extensions (Developer Mode)
- The extension replaces the new tab page and includes a popup interface
- Service worker handles background tasks and Chrome APIs integration

## Architecture Overview

### Core Structure
- **New Tab Application**: Full-featured React app that replaces Chrome's new tab
- **Popup Interface**: Lightweight interface accessible from extension icon
- **Service Worker**: Background script handling Chrome APIs, bookmark sync, and OAuth

### Key Architectural Patterns

#### Tab-Based Main Application
The main app uses a tab system with keyboard shortcuts (1-5) for quick navigation:
- Dashboard (1): Weather, clock, bookmark previews
- BookmarkManager (2): Full bookmark CRUD with drag-and-drop
- TaskManager (3): Google Tasks integration
- HabitManager (4): Habit tracking with Google Sheets
- MoneyManager (5): Financial tracking with Google Sheets

#### Layered Architecture
- **Presentation Layer**: `src/presentation/` - UI components, tabs, providers
- **Service Layer**: Each tab has its own `services/` folder with API integration
- **Hook Layer**: Custom hooks for state management (`hooks/` in each tab)
- **Context Layer**: `src/contexts/` - Global state management (Auth)
- **Utils Layer**: `src/utils/` - Chrome API wrappers and utilities

#### Chrome Extension Integration
- **Manifest V3**: Uses service workers instead of background pages
- **Chrome Identity API**: OAuth2 flow for Google services
- **Chrome Bookmarks API**: Real-time bookmark synchronization
- **Chrome Storage API**: Local data persistence

### Key Technologies
- **React 18** with TypeScript
- **Vite** for build tooling
- **TailwindCSS** for styling
- **@dnd-kit** for drag-and-drop functionality
- **TanStack Query** for API state management
- **Radix UI** for accessible component primitives
- **Google APIs**: Tasks, Sheets, OAuth2

## Development Notes

### Chrome Extension Specifics
- Service worker is built separately via `tsconfig` compilation
- Manifest permissions include bookmarks, storage, tabs, identity, geolocation
- OAuth2 configuration requires specific client ID and scopes
- Content Security Policy restricts script execution

### Data Flow
- **Bookmarks**: Chrome Bookmarks API → Service Worker → Local Storage → React State
- **Tasks/Habits/Money**: Google APIs → Service Layer → TanStack Query → React Components
- **Authentication**: Chrome Identity API → AuthContext → Service Layers

### File Organization
- Components follow atomic design principles (ui/ → common/ → feature-specific/)
- Each major feature (tab) is self-contained with its own types, services, hooks
- Shared utilities and contexts are in root `src/` directories

### Build System
- Vite handles React app building
- Custom `watchbuild.js` provides optional auto-rebuild on file changes
- Static assets are copied via `vite-plugin-static-copy`
- Service worker is compiled separately and copied to dist

### Development Workflow
1. Make changes to source files
2. Run `npm run build` to compile for Chrome extension
3. Reload extension in Chrome Extensions page
4. Use Chrome DevTools for debugging (both extension pages and service worker)

## Testing and Quality

### Linting
- ESLint configuration with TypeScript, React, and React Hooks rules
- Automatic formatting and error checking
- Custom rules for React refresh and component exports

### Browser Compatibility
- Chrome Extension Manifest V3 (Chrome 88+)
- Modern JavaScript/TypeScript features via Vite transpilation
- Chrome APIs usage requires extension context

## API Integration

### Google Services Authentication
- OAuth2 scopes: openid, email, profile, tasks, drive.file, spreadsheets
- Token management via Chrome Identity API
- Automatic token refresh and error handling

### Data Synchronization
- Real-time bookmark sync via Chrome Bookmarks API listeners
- Google Sheets integration for habits and financial data
- Local caching with Chrome Storage API