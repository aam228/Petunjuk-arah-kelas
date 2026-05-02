# 🎥 Camera View Fix

## Issue
`#arjs-video` (AR.js video element) ketutup oleh `.mobile-frame` karena `overflow: hidden`, sehingga kamera tidak terlihat.

## Root Cause
1. A-Frame scene berada di dalam `.mobile-frame`
2. `.mobile-frame` memiliki `overflow: hidden` dan `max-width: 430px`
3. `#arjs-video` yang di-generate oleh AR.js terbatas oleh parent container
4. Video kamera tidak bisa full screen

## Solution

### 1. Restructure HTML - Move A-Frame Scene Outside Mobile Frame
```html
<!-- BEFORE -->
<body class="ar-body">
    <div class="mobile-frame">
        <a-scene id="arScene">...</a-scene>  ← Inside mobile-frame
        <div class="ar-overlay">...</div>
    </div>
</body>

<!-- AFTER -->
<body class="ar-body">
    <a-scene id="arScene">...</a-scene>  ← Outside, full screen!
    
    <div class="mobile-frame">
        <div class="ar-overlay">...</div>  ← Only UI inside
    </div>
</body>
```

### 2. Make A-Frame Scene Full Screen
```css
/* A-Frame Scene - Full Screen */
.ar-body #arScene {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;   /* Full viewport width */
    height: 100vh;  /* Full viewport height */
    z-index: 0;     /* Behind UI */
}

/* AR.js Video Element - Full Screen */
.ar-body #arjs-video {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    object-fit: cover;
    z-index: 0;
}
```

### 3. Make Mobile Frame Transparent for AR
```css
/* Mobile Frame for AR - UI Overlay Container */
.ar-body .mobile-frame {
    background: transparent;  /* Transparent, don't block camera */
    pointer-events: none;     /* Don't block camera interaction */
    position: relative;
    z-index: 10;              /* Above camera */
}
```

### 4. Keep Overlay Transparent
```css
/* AR Overlay */
.ar-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.ar-overlay > * {
    pointer-events: auto;  /* UI elements are clickable */
}

.ar-overlay,
.marker-guide {
    background: transparent !important;
}
```

## How It Works

### Layer Structure
```
┌─────────────────────────────────────────┐
│  FULL SCREEN (100vw x 100vh)            │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ A-Frame Scene (z-index: 0)      │   │  ← Full screen camera
│  │ #arjs-video (fixed, full)       │   │
│  │ 📷 Camera Feed                   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Mobile Frame (z-index: 10)      │   │  ← 430px centered
│  │ (transparent, 430px max-width)  │   │
│  │                                 │   │
│  │ ┌─────────────────────────────┐ │   │
│  │ │ AR Overlay (transparent)    │ │   │
│  │ │                             │ │   │
│  │ │ [Status Panel - opaque]     │ │   │
│  │ │                             │ │   │
│  │ │ [Marker Guide - transparent]│ │   │
│  │ │                             │ │   │
│  │ │ [Debug Panel - opaque]      │ │   │
│  │ │                             │ │   │
│  │ │ [Control Panel - opaque]    │ │   │
│  │ └─────────────────────────────┘ │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Desktop View
```
┌───────────────────────────────────────────────────┐
│  Dark Background (#0a0a0a)                        │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ Full Screen Camera Feed                     │ │
│  │                                             │ │
│  │        ┌─────────────────────┐             │ │
│  │        │ Mobile Frame (430px)│             │ │
│  │        │ [UI Overlay]        │             │ │
│  │        └─────────────────────┘             │ │
│  │                                             │ │
│  └─────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
```

### Mobile View
```
┌─────────────────────────┐
│ Full Screen Camera      │
│                         │
│ ┌─────────────────────┐ │
│ │ Mobile Frame (100%) │ │
│ │ [UI Overlay]        │ │
│ └─────────────────────┘ │
│                         │
└─────────────────────────┘
```

## Result

### Before ❌
```
┌─────────────────────────────────┐
│ Mobile Frame (430px)            │
│ ┌─────────────────────────────┐ │
│ │ A-Frame Scene (limited)     │ │  ← Limited by parent
│ │ Video (430px max)           │ │  ← Can't go full screen
│ │ ████████████████████████    │ │  ← Blocked
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### After ✅
```
┌─────────────────────────────────────────┐
│ A-Frame Scene (100vw x 100vh)           │  ← Full screen!
│ 📷 Camera Feed (full screen)            │
│                                         │
│    ┌─────────────────────┐             │
│    │ Mobile Frame (430px)│             │  ← Only UI
│    │ [UI Overlay]        │             │
│    └─────────────────────┘             │
│                                         │
└─────────────────────────────────────────┘
```

## Visual Comparison

### Before
- ❌ A-Frame scene inside mobile-frame
- ❌ Video limited to 430px max-width
- ❌ Camera view cropped
- ❌ Overflow hidden blocks video
- ❌ Can't see full camera feed

### After
- ✅ A-Frame scene outside mobile-frame
- ✅ Video full screen (100vw x 100vh)
- ✅ Camera view full screen
- ✅ No overflow restrictions
- ✅ Full camera feed visible
- ✅ UI overlay centered (430px)

## Key Changes

| Element | Before | After |
|---------|--------|-------|
| A-Frame Scene | Inside `.mobile-frame` | Outside, full screen |
| Scene Position | `absolute` | `fixed` |
| Scene Size | `100%` (limited by parent) | `100vw x 100vh` |
| Video Size | Limited by parent | `100vw x 100vh` |
| Mobile Frame | Contains scene + UI | Contains UI only |
| Mobile Frame BG | `#000` | `transparent` |
| Z-index | Scene: 0, Overlay: 10 | Scene: 0, Frame: 10 |

## Files Modified
1. **ar.html** - Moved `<a-scene>` outside `.mobile-frame`
2. **style.css** - Updated AR scene to be full screen with `fixed` position

## Testing

### Desktop
1. Open ar.html
2. Allow camera access
3. ✅ Verify camera feed is FULL SCREEN
4. ✅ Verify UI overlay is centered (430px)
5. ✅ Verify status panel visible at top
6. ✅ Verify control panel visible at bottom
7. Point camera at HIRO marker
8. ✅ Verify marker detected
9. ✅ Verify AR object appears

### Mobile
1. Open ar.html on mobile
2. Allow camera access
3. ✅ Verify camera feed is FULL SCREEN
4. ✅ Verify UI overlay is full width
5. ✅ Verify all UI elements visible
6. ✅ Test marker detection
7. ✅ Verify AR object appears

## Status
✅ **FIXED** - Camera now full screen, not blocked by mobile-frame!

---

**Fixed by:** Kiro AI Assistant  
**Date:** May 2, 2026  
**Issue:** `#arjs-video` blocked by `.mobile-frame` overflow  
**Solution:** Move A-Frame scene outside mobile-frame, make it full screen
