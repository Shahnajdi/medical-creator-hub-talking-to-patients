# QA Report — Talking to Patients V3

Tested with Playwright + Chromium (bundled headless Chrome) and Lighthouse against
a local static server (`python3 -m http.server`), simulating the exact Cloudflare
Pages static-hosting model.

## 1. Responsive widths (no horizontal overflow, no console errors)

| Width | Horizontal overflow | Console errors |
|---|---|---|
| 320px | ✅ none (fixed — see "Bugs found & fixed") | ✅ none |
| 360px | ✅ none | ✅ none |
| 375px | ✅ none | ✅ none |
| 390px | ✅ none | ✅ none |
| 430px | ✅ none | ✅ none |
| 768px | ✅ none | ✅ none |
| 1024px | ✅ none | ✅ none |
| 1280px | ✅ none | ✅ none |
| 1440px | ✅ none | ✅ none |
| 1920px | ✅ none | ✅ none |

Verified with `document.documentElement.scrollWidth <= clientWidth` at every width,
plus a full DOM sweep for any element whose bounding box exceeds the viewport.

## 2. Checkout URL audit

- Single source of truth: `config.json` → `checkoutUrl`.
- All 7 purchase CTAs (nav, hero, mid-page "What You'll Learn", offer section,
  final close, sticky mobile bar, and structured data `Offer.url`) resolve to
  exactly one string:
  `https://medicalcreator.lemonsqueezy.com/checkout/buy/05898310-c771-43ed-9ab4-099d8b27052c`
- Confirmed via `grep` across the built `index.html`: **zero** other checkout
  domains or stale URLs present.
- Confirmed the same hrefs are present and correct **with JavaScript fully
  disabled** (Playwright `javaScriptEnabled: false`) — the page never depends
  on JS to populate a purchase link.

## 3. JavaScript-disabled fallback

With JS off: hero, all copy, all 8 interior page preview images (native
`loading="lazy"`, no JS needed), and all 7 CTAs render and link correctly.
The only things that don't appear without JS (by design, as enhancements):
the lightbox zoom, the scroll-reveal fade-ins, the sticky mobile CTA bar, and
analytics event pushes. None of these gate the ability to understand or buy
the book.

## 4. Reduced motion

With `prefers-reduced-motion: reduce`: the hero's floating book animation is
disabled (`animation-name: none` confirmed via computed style), and the JS
scroll-reveal system detects the media query and skips adding `[data-reveal]`
entirely, so content is simply visible immediately with no fade/slide.

## 5. Keyboard & accessibility

- Skip-to-content link is the first tab stop.
- Lightbox: opens on click, closes on `Escape` or backdrop click, arrow-key
  navigation between pages, focus moves to the close button on open and
  returns to the trigger on close, and Tab is trapped inside the dialog while open.
- FAQ uses native `<details>/<summary>` — keyboard-operable with no JS.
- All interactive elements have visible `:focus-visible` outlines.
- All images have descriptive alt text; decorative elements use no redundant alt.

## 6. Lighthouse (headless Chromium, mobile emulation defaults)

| Category | Score |
|---|---|
| Performance | **99** |
| Accessibility | **100** |
| Best Practices | **100** |
| SEO | **100** |

Core Web Vitals:
- **LCP**: 1.8s
- **CLS**: 0
- **TBT**: 90ms
- **Speed Index**: 0.9s

The remaining 1 performance point is from unminified CSS/JS and dev-server
cache headers — both non-issues in production, since Cloudflare Pages serves
with Brotli compression automatically and the shipped `_headers` file sets
long-lived cache lifetimes for `/assets/*`, `.jpg`, and `.webp`.

## 7. Bugs found during QA and fixed

1. **Grid image blowout at 320px width.** The offer section's grid item was
   overflowing ~19px because CSS Grid items don't shrink below their
   content's intrinsic size by default. Fixed with a global `min-width: 0`
   reset on all elements (the standard fix for this well-known grid behavior).
2. **Long CTA label overflow at ≤400px width.** "GET INSTANT ACCESS — $19" at
   full padding/font-size overflowed very narrow screens. Fixed with a
   small-viewport override that reduces padding/font-size and allows wrapping.
3. **Every image on the page was stretched vertically.** The global `img`
   rule set `max-width: 100%` but not `height: auto`, so images with
   `width`/`height` HTML attributes (used correctly for layout-shift
   prevention) had their height locked to the literal attribute value in
   pixels regardless of the width the image actually rendered at. This
   silently distorted the (perfectly square) book cover into a tall
   rectangle, and would have similarly distorted the author photo, tablet
   mockup, and all 8 interior pages. Fixed by adding `height: auto` to the
   global `img` rule. Re-verified: every image now renders at its correct
   intrinsic aspect ratio at every tested width.
4. **Button color contrast (WCAG AA).** The primary button used `--blue`
   (#2C7BE5) as a background with white text, which measured 4.14:1 —
   just under the 4.5:1 required for 16px bold text. Switched primary
   button backgrounds to the darker `--blue-deep` (#1B5FC4, 6.0:1 with
   white), which also reads as more premium against the ivory page. `--blue`
   is still used for text/accent purposes where its contrast is sufficient
   (e.g., on the dark navy sections, 4.0:1 against large bold text).

## 8. Known non-blockers / suggestions for a future pass

- **Open Graph image is square (1254×1254)**, not the ideal 1200×630 landscape
  ratio some platforms prefer. It will still render (most platforms center-crop
  square OG images), but a dedicated landscape OG crop would look better on
  Twitter/X and iMessage link previews.
- **No analytics vendor is wired up.** `app.js` pushes all required events
  (`hero_cta_click`, `mid_cta_click`, `pricing_cta_click`, `final_cta_click`,
  `checkout_outbound`, `preview_open`, `preview_navigation`) to
  `window.dataLayer` in GA4-compatible shape. Drop a GA4 or Meta Pixel snippet
  into `<head>` and events will start flowing with zero code changes — until
  then this is a harmless no-op, per the "analytics must never block anything"
  requirement.
- **CSS/JS are unminified** for readability/maintainability. Cloudflare Pages'
  automatic Brotli compression already shrinks transfer size significantly;
  minifying would only trim parse time slightly. Safe to add later with any
  standard minifier if desired.
- **Reviews section**: intentionally omitted per instructions (no fabricated
  testimonials, and none exist yet to show).
