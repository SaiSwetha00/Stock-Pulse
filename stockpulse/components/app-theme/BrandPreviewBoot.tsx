import { appBrandSans } from './fonts'

/**
 * Applies the preview theme BEFORE the first paint — PREVIEW ONLY.
 *
 * THE PROBLEM THIS SOLVES. BrandPreviewTheme sets the theme class from a
 * `useEffect`, which cannot run until React has hydrated. Until then the page
 * paints in the app's own beige, so every load started with a visible flash of
 * the old design — distracting on its own, and actively misleading while
 * somebody is reviewing a redesign.
 *
 * WHY A SYNCHRONOUS INLINE SCRIPT IS THE ONLY OPTION HERE. The flag lives in
 * sessionStorage, which the server cannot read, so the server cannot render
 * the class itself. The classic no-flash theme script is the standard answer:
 * the browser runs this the moment it parses it, and because it is rendered
 * above the shell it runs before any of the app's markup has been painted.
 *
 * WHY TOUCHING <html> HERE IS SAFE. app/layout.tsx already sets
 * `suppressHydrationWarning` on <html> precisely because its class list is
 * expected to be adjusted outside React, so React does not diff these names
 * and no mismatch is possible.
 *
 * WHAT IT CAN DO: add or remove two class names and write one sessionStorage
 * key. Nothing else — no request, no cookie, no server state, no access to any
 * data. Every storage access is wrapped because sessionStorage throws in a
 * private window, and a preview flag must never take the dashboard down.
 */

const THEME_CLASS = 'sp-brand'
const STORAGE_KEY = 'sp-brand-preview'

/*
 * Small and dependency-free. Every interpolated value is a constant declared
 * above — nothing from a request, a user or the database reaches this string,
 * so there is no path by which content could be injected into it.
 */
const BOOT = `(function(){try{
var p=new URLSearchParams(location.search).get('brand');
var on;
if(p==='1'){on=true;try{sessionStorage.setItem('${STORAGE_KEY}','1')}catch(e){}}
else if(p==='0'){on=false;try{sessionStorage.removeItem('${STORAGE_KEY}')}catch(e){}}
else{try{on=sessionStorage.getItem('${STORAGE_KEY}')==='1'}catch(e){on=false}}
var r=document.documentElement;
if(on){r.classList.add('${THEME_CLASS}','${appBrandSans.variable}');}
else{r.classList.remove('${THEME_CLASS}','${appBrandSans.variable}');}
}catch(e){}})();`

export default function BrandPreviewBoot() {
  return <script dangerouslySetInnerHTML={{ __html: BOOT }} />
}
