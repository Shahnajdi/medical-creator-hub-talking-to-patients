# Talking to Patients — V3 (preview build, not yet deployed to production)

This is the new conversion-focused sales page for the *Talking to Patients* ebook.
It is a **separate build** — nothing in production (if any exists) has been touched.

## Preview it locally

```
cd v3
python3 -m http.server 8000
# open http://localhost:8000/
```

No build step is required to preview — `index.html` is already built and ready to serve as-is.

## Structure

```
v3/
  index.html          ← built page (do not hand-edit — see "Editing" below)
  styles.css
  app.js
  _headers            ← Cloudflare Pages security + caching headers
  robots.txt
  sitemap.xml
  privacy.html / terms.html / 404.html
  assets/
    cover/            ← book cover, responsive JPG+WebP
    mockups/          ← author photo, tablet mockup, responsive JPG+WebP
    pages/            ← 8 real interior page previews, responsive JPG+WebP
    favicon*, apple-touch-icon.png

  config.json         ← THE single source of truth for the checkout URL,
                         price, page count, canonical domain, etc.
  src/index.template.html   ← page source with __PLACEHOLDER__ tokens
  scripts/
    build.py                ← bakes config.json into src/index.template.html → index.html
    build_static_pages.py   ← builds privacy.html / terms.html / 404.html from config.json
    process_images.py       ← regenerates all responsive JPG/WebP assets
```

## Editing

- **To change the checkout URL, price, or page count**: edit `config.json`, then run
  `python3 scripts/build.py && python3 scripts/build_static_pages.py`. Every purchase
  CTA (7 of them) is generated from that one file — there is no second place to update.
- **To change copy/layout**: edit `src/index.template.html`, then re-run `scripts/build.py`.
- **To change styles**: edit `styles.css` directly (no build step needed).
- **To swap in new imagery**: replace the source files referenced at the top of
  `scripts/process_images.py` and re-run it.

## Deploying to Cloudflare Pages

Upload the contents of `v3/` (or the provided flat ZIP) with `index.html` at the
project root. `_headers` is picked up automatically by Cloudflare Pages for
security headers and cache lifetimes. No environment variables, build command,
or backend are required — this is a fully static site.

## What's intentionally excluded

- The paid PDF itself is never present anywhere in this build.
- Two of the five supplied product mockups (`03-standing-book-mockup` /
  `04-book-stack-mockup`) are not used on the page — their AI-generated spine
  text has visible typos ("SHAHIN MAJDD" / "S'AIHN NAJDI"), so they were left
  out rather than shipped with an obviously misspelled author name. The
  clean cover, the author-holding-book photo, and the tablet mockup (all
  verified correct) are used instead.

See `QA_REPORT.md` for full test results and `ASSET_MANIFEST.md` for asset sourcing.
