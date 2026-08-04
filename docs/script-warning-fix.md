# Script Warning Fix - Complete Report

**Date**: July 25, 2026  
**Status**: ✅ Fixed  
**Issue**: React script tag warning in browser console

---

## Issue Description

**Browser Console Warning**:
```
Encountered a script tag while rendering React component.
Scripts inside React components are never executed when rendering on the client.
```

**Impact**: 
- Console warning pollution
- Non-standard React pattern
- Potential hydration issues

---

## Root Cause

**Location**: `src/app/layout.tsx` (lines 41-43)

**Problem**: A `<script>` tag with `dangerouslySetInnerHTML` was being rendered directly inside a React component (`<head>` element):

```tsx
// INCORRECT - Script tag inside React component
<html>
  <head>
    <script dangerouslySetInnerHTML={{ __html: themeScript }} />
  </head>
  <body>
    <AppNav />
    {children}
  </body>
</html>
```

**Why This Is Wrong**:
- In React/Next.js, `<script>` tags rendered inside React components are not executed on the client
- React warns about this anti-pattern because it's likely unintentional
- The script was working due to SSR, but violates React's component model

---

## Solution

**Pattern**: Use Next.js's `<Script>` component with `strategy="beforeInteractive"`

The `<Script>` component is Next.js's built-in solution for managing scripts, and `beforeInteractive` ensures the script runs before the page becomes interactive (preventing FOUC).

---

## Changes Made

**File**: `src/app/layout.tsx`

### Change 1: Import Next.js Script Component

```tsx
// BEFORE
import type { Metadata } from "next";
import { cookies } from "next/headers";

// AFTER
import type { Metadata } from "next";
import Script from "next/script";
import { cookies } from "next/headers";
```

### Change 2: Replace Script Tag with Script Component

```tsx
// BEFORE - Script inside <head>
<html>
  <head>
    <script dangerouslySetInnerHTML={{ __html: themeScript }} />
  </head>
  <body>
    <AppNav />
    {children}
  </body>
</html>

// AFTER - Script component in <body> with beforeInteractive
<html>
  <body>
    <Script
      id="theme-script"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: themeScript }}
    />
    <AppNav />
    {children}
  </body>
</html>
```

**Key Changes**:
1. Removed `<head>` element entirely
2. Moved `<Script>` component into `<body>`
3. Added `id="theme-script"` (required by Next.js)
4. Added `strategy="beforeInteractive"` (runs before hydration)
5. Kept `dangerouslySetInnerHTML` (still needed for inline script)

---

## Why This Works

### Next.js Script Component Benefits

1. **Proper React Integration**: `<Script>` is a React component that Next.js knows how to handle correctly
2. **Strategy Support**: `beforeInteractive` ensures the script loads and executes before page hydration
3. **No Console Warnings**: Next.js handles script injection properly, avoiding React warnings
4. **Same Timing**: Achieves the same FOUC prevention as the original approach

### Strategy Explanation

```tsx
strategy="beforeInteractive"
```

This strategy tells Next.js to:
- Inject the script into the HTML before the page becomes interactive
- Execute it before React hydration occurs
- Prevent flash of unstyled content (FOUC)
- Load synchronously (blocking but necessary for theme initialization)

### Why Body, Not Head?

In Next.js App Router, the `<head>` element is managed by Next.js metadata system. Custom head content should use the `metadata` export or be placed in the body with appropriate strategies.

---

## Verification

**Before Fix**:
```
Console Output:
❌ Warning: Encountered a script tag while rendering React component...
```

**After Fix**:
```
Console Output:
✅ No script-related warnings
✅ Theme initialization still works correctly
✅ No FOUC (flash of unstyled content)
✅ Dark mode toggles properly
```

**Testing Checklist**:
- [x] No console warnings about script tags
- [x] Theme initializes before page render (no FOUC)
- [x] Dark mode class applied correctly on initial load
- [x] System theme preference detected properly
- [x] Cookie-based theme preference works
- [x] Theme switching still functions

---

## Technical Notes

### Script Content Unchanged

The actual script content (`themeScript` variable) remains identical:

```javascript
(function(){
  var c="appearance-theme";
  var m=document.cookie.match(new RegExp("(?:^|; )"+c+"=([^;]*)"));
  var t=document.documentElement.dataset.theme||(m?decodeURIComponent(m[1]):"system");
  var q=window.matchMedia("(prefers-color-scheme: dark)");
  function a(){
    var r=t==="system"?(q.matches?"dark":"light"):t;
    document.documentElement.classList.toggle("dark",r==="dark");
    document.documentElement.dataset.theme=t
  }
  a();
  if(q.addEventListener){
    q.addEventListener("change",a)
  }
})();
```

This IIFE (Immediately Invoked Function Expression):
1. Reads the appearance theme cookie
2. Determines current theme (cookie > system preference)
3. Applies `.dark` class to `<html>` if needed
4. Listens for system theme changes

### Alternative Solutions Considered

**Option A: Move to separate .js file** ❌
- Would require additional HTTP request
- Increases FOUC risk
- Harder to pass dynamic cookie name

**Option B: Use middleware** ❌
- Middleware can't access DOM
- Can't prevent FOUC
- Wrong abstraction layer

**Option C: Client component with useEffect** ❌
- Runs after hydration
- Causes FOUC
- Defeats the purpose

**Option D: Next.js Script component** ✅ CHOSEN
- Native Next.js solution
- No console warnings
- Same timing guarantees
- Proper React integration

---

## Summary

**Root Cause**: Raw `<script>` tag rendered inside React component

**Solution**: Use Next.js `<Script>` component with `beforeInteractive` strategy

**Files Changed**: 
- `src/app/layout.tsx` (3 changes: import, remove head, add Script component)

**Result**: 
- ✅ No console warnings
- ✅ Theme initialization still works perfectly
- ✅ Follows Next.js best practices
- ✅ Proper React component pattern

**Before/After**:
- Before: Script tag in `<head>` (React anti-pattern)
- After: `<Script>` component in `<body>` (Next.js best practice)