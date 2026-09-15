# Asset Manifest — Talking to Patients V3

All imagery is real product/book material supplied for this build. Nothing was
AI-generated to fill gaps, and no fake interior pages were created.

## Product photography (`assets/cover/`, `assets/mockups/`)

| File | Source | Used in |
|---|---|---|
| `cover-*.jpg/webp` | Clean book cover artwork (1254×1254 original) | Hero (desktop + mobile), Offer section context |
| `mockups/author-*.jpg/webp` | Photo of Shahin Najdi holding the printed book (1024×1536 original) | Author section |
| `mockups/tablet-*.jpg/webp` | Book cover displayed on a tablet mockup (1024×1536 original) | Offer / Product section |

Each is exported at multiple widths (up to the source resolution) in both
JPEG and WebP, served via `<picture>` + `srcset` so the browser picks the
smallest sufficient file for the viewport/DPR.

**Two supplied mockups were deliberately not used:**
`03-standing-book-mockup.png` and `04-book-stack-mockup.png`. Both are
otherwise good compositions, but their AI-generated spine text has visible
typos ("SHAHIN MAJDD" on the standing mockup; "SHAHIN NAJDY" / "S'AIHN NAJDI"
on the stacked mockup). Rather than ship a premium sales page with a
misspelled author name visible on the product, the build uses the three
verified-correct assets instead. Regenerate the mockups with correct spine
text and add them back via `scripts/process_images.py` if wanted.

## Interior page previews (`assets/pages/`)

All 8 are direct renders of the real published book (`Talking_to_Patients_FINAL.pdf`,
107 pages), supplied as high-resolution JPGs (1200×1800) and re-exported at
1200/800/500px widths in JPEG + WebP.

| File | PDF page | Featured as |
|---|---|---|
| `page-01-*` | p.14 | "The Question Behind the Question" |
| `page-02-*` | p.22 | "The Four Communication Needs" |
| `page-03-*` | p.39 | "Trust" |
| `page-04-*` | p.69 | "Crying" |
| `page-05-*` | p.71 | "Anger & Aggression" |
| `page-06-*` | p.76 | '"I Googled It"' |
| `page-07-*` | p.88 | "Money & Cost" |
| `page-08-*` | p.102 | "Field Guide" |

Captions under each page in the "Look Inside" section are drawn directly from
real pull-quotes/headlines visible on that page (e.g., "Presence first.
Explanation second." from p.69) — not invented marketing copy.

## Icons

`favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`, `favicon-512.png/webp`
are all cropped directly from the real cover art (the lips + gloved-finger
mark), not a separately designed logo — keeping the favicon recognizably tied
to the book.

## Total payload

~5.5MB uncompressed across 90 files (before Cloudflare's automatic Brotli
compression on serve). No PDF, no source design files, no unused assets are
included in the deployment package.
