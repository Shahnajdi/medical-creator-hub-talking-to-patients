#!/usr/bin/env python3
"""Single build step: bakes config.json values into every purchase CTA and
meta tag in src/index.template.html, writing the deployable v3/index.html.

This is the ONE centralized configuration point for the checkout URL —
every CTA in the template uses __CHECKOUT_URL__, so there is exactly one
place (config.json) to change it.
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # v3/

with open(os.path.join(ROOT, "config.json")) as f:
    cfg = json.load(f)

with open(os.path.join(ROOT, "src", "index.template.html")) as f:
    html = f.read()

replacements = {
    "__CHECKOUT_URL__": cfg["checkoutUrl"],
    "__PRICE__": cfg["price"],
    "__PAGE_COUNT__": str(cfg["pageCount"]),
    "__CANONICAL__": cfg["canonical"],
    "__SITE_NAME__": cfg["siteName"],
    "__BOOK_TITLE__": cfg["bookTitle"],
    "__AUTHOR_NAME__": cfg["authorName"],
}

for token, value in replacements.items():
    html = html.replace(token, value)

import re
leftover_tokens = re.findall(r"__[A-Z_]+__", html)
if leftover_tokens:
    print("WARNING: unreplaced placeholders found:", set(leftover_tokens))

with open(os.path.join(ROOT, "index.html"), "w") as f:
    f.write(html)

print(f"Built index.html with checkout URL: {cfg['checkoutUrl']}")
