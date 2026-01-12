# WinnStorm Context Handoff - December 2025

## Current Session Fixes

### 1. Fixed Upload Page Radio Button Styling
- Changed `bg-blue-50` to `bg-primary/10 dark:bg-primary/20` for dark mode compatibility
- Changed `border-neutral-medium` to `border-muted-foreground/30 hover:border-muted-foreground/50`
- Changed `text-neutral-darker` to `text-foreground`
- Added `transition-colors` for smooth hover effects

### 2. Fixed Google Maps Drawing Component (CRITICAL)
The component was causing "Failed to execute 'removeChild' on 'Node'" errors due to:
- Using deprecated Drawing library (deprecated Aug 2025)
- Global state conflicting with React's DOM management
- Invalid hook call errors from lifecycle issues

**Solution:**
- Removed deprecated 'drawing' library (only using 'places', 'geometry')
- Converted from global state to refs (mapInstanceRef, geocoderRef, overlaysRef)
- Proper cleanup with isCancelled flag and mountedRef
- Added error state handling for missing API key
- Simplified UI to show map view without drawing tools

### 3. Component Cleanup
- Removed unused imports (Square, Circle, Type, RotateCcw)
- Removed unused state (selectedTool, mapReady)
- Removed unused functions (setDrawingMode, clearAllDrawings)

## Recently Completed
1. ✅ Database migration - All 47 tables
2. ✅ Stripe subscription flow - Fixed VITE_STRIPE_PUBLIC_KEY env var
3. ✅ PaymentElement readiness tracking
4. ✅ Subscription status verification
5. ✅ Upload page styling fix
6. ✅ Google Maps Drawing component DOM fix

## Important
- Production domain: https://winnstorm.com
- Demo login: demo@winnstorm.com / DemoTest123!
- Google Maps API key is configured in VITE_GOOGLE_MAPS_API_KEY

## LSP Notes
- property-map.tsx has TypeScript warnings about 'google' global (runtime works fine, just missing type declaration)
