#!/usr/bin/env python3
"""Builds privacy.html, terms.html and 404.html using the same centralized
config.json checkout URL / site name as index.html."""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

with open(os.path.join(ROOT, "config.json")) as f:
    cfg = json.load(f)

NAV = """<header class="site-nav">
  <div class="site-nav__inner">
    <a class="site-nav__logo" href="/">{site_name}</a>
    <a class="btn btn--nav" href="{checkout_url}">GET THE BOOK — {price}</a>
  </div>
</header>""".format(site_name=cfg["siteName"], checkout_url=cfg["checkoutUrl"], price=cfg["price"])

FOOTER = """<footer class="site-footer">
  <div class="site-footer__inner">
    <p>&copy; 2026 {site_name}. All rights reserved.</p>
    <nav aria-label="Legal">
      <a href="/privacy.html">Privacy</a>
      <a href="/terms.html">Terms</a>
    </nav>
  </div>
</footer>""".format(site_name=cfg["siteName"])

def page(title, description, body):
    return """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{description}">
<meta name="robots" content="noindex,follow">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="stylesheet" href="/styles.css">
</head>
<body>
{nav}
<main>
{body}
</main>
{footer}
</body>
</html>
""".format(title=title, description=description, nav=NAV, footer=FOOTER, body=body)

privacy_body = """<div class="legal-content">
  <h1>Privacy Policy</h1>
  <p class="legal-updated">This page describes how {site_name} handles information collected through this website.</p>

  <h2>What this site collects</h2>
  <p>This is a static marketing page for the digital book {book_title}. It does not require you to create an account or submit personal information to browse it.</p>
  <p>If optional analytics are enabled on this page, they may record anonymized usage data such as pages viewed and buttons clicked, to help us understand how visitors use the page. This never blocks or is required for browsing or purchasing.</p>

  <h2>Checkout &amp; payment</h2>
  <p>Purchases are processed by Lemon Squeezy, our payment provider and merchant of record. Lemon Squeezy collects the payment and contact details needed to complete your purchase and deliver digital access, under its own privacy policy. {site_name} does not receive or store your payment card details.</p>

  <h2>Contact</h2>
  <p>Questions about this policy can be directed through the contact options provided at checkout or on the {site_name} website.</p>
</div>""".format(site_name=cfg["siteName"], book_title=cfg["bookTitle"])

terms_body = """<div class="legal-content">
  <h1>Terms of Sale</h1>
  <p class="legal-updated">These terms apply to the purchase of {book_title}, a digital ebook by {author_name}.</p>

  <h2>The product</h2>
  <p>{book_title} is a {page_count}-page digital PDF ebook, delivered electronically after purchase. It is sold for {price} as a one-time payment. No physical item is shipped.</p>

  <h2>Educational purpose</h2>
  <p>{book_title} is an educational communication resource for healthcare professionals and students. It does not replace clinical judgment, professional training, or applicable healthcare standards, and should not be treated as clinical, legal, or medical advice.</p>

  <h2>Payment &amp; delivery</h2>
  <p>Checkout is processed securely by Lemon Squeezy. Digital access is provided through the purchase flow after payment is confirmed.</p>

  <h2>Refunds</h2>
  <p>Refund requests are handled in line with the payment processor's standard policy for digital goods. Contact the seller through the details provided at checkout for assistance.</p>
</div>""".format(
    book_title=cfg["bookTitle"],
    author_name=cfg["authorName"],
    page_count=cfg["pageCount"],
    price=cfg["price"],
)

notfound_body = """<div class="notfound">
  <h1>404</h1>
  <p>This page doesn't exist. You can still get Talking to Patients from the homepage.</p>
  <a class="btn btn--primary" href="/">BACK TO HOMEPAGE</a>
</div>"""

with open(os.path.join(ROOT, "privacy.html"), "w") as f:
    f.write(page("Privacy Policy — " + cfg["siteName"], "Privacy policy for " + cfg["siteName"] + ".", privacy_body))

with open(os.path.join(ROOT, "terms.html"), "w") as f:
    f.write(page("Terms of Sale — " + cfg["bookTitle"], "Terms of sale for " + cfg["bookTitle"] + ".", terms_body))

with open(os.path.join(ROOT, "404.html"), "w") as f:
    f.write(page("Page not found — " + cfg["siteName"], "Page not found.", notfound_body))

print("Built privacy.html, terms.html, 404.html")
