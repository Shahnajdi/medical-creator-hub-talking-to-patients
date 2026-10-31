# Third-party SDK, analytics and tracking audit

Audited from the code, not from assumptions. Re-run this audit whenever a script, SDK or vendor is added.

| Third party | Loaded where | When | Data sent | Cookies | Can be disabled |
| --- | --- | --- | --- | --- | --- |
| Google Analytics 4 (`googletagmanager.com`) | Public site only (`TrackerLoader`) | Only after **Analytics** consent and only if `GA4_MEASUREMENT_ID` is set | Page views, consented events, `anonymize_ip` | `_ga`, `_ga_*` | Yes: reject, or withdraw (page reloads) |
| Meta Pixel (`connect.facebook.net`) | Public site only | Only after **Advertising** consent, if `META_PIXEL_ID` is set; never with Global Privacy Control | PageView, consented custom events with shared `eventID` | `_fbp` | Yes |
| Meta Conversions API | Server | **Not implemented yet** (env var reserved) | — | — | — |
| Resend | Server (email) | Transactional always; marketing only with consent | Recipient email, name, message | — | Driver switch |
| Fonts (Vazirmatn, Inter) | Self-hosted | Always | **Nothing**: no Google Fonts request | — | — |
| Video embeds | Not used; CSP allows only `youtube-nocookie.com` and `player.vimeo.com` frames if added later | — | — | — | — |

**No other third-party scripts, SDKs, chat widgets, heatmaps or session recorders are included.** The CSP enforces this: scripts may only load from self, `googletagmanager.com` and `connect.facebook.net`.

npm runtime dependencies (all run server-side or are bundled first-party; none phone home): next, react, react-dom, next-intl, drizzle-orm, postgres, zod, lucide-react, clsx, tailwind-merge, server-only, @fontsource-variable/*. Next.js telemetry is build-time only and disabled via `NEXT_TELEMETRY_DISABLED=1` in Docker/CI.
