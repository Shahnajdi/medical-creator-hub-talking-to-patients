#!/usr/bin/env python3
"""Generate responsive JPEG + WebP variants for all V3 site imagery.
Run once during the build; outputs land in v3/assets/**.
"""
import os
import subprocess
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # v3/
ASSETS = os.path.join(ROOT, "assets")

PRODUCT_SRC = "/tmp/claude-0/-home-user-medical-creator-hub-talking-to-patients/b712870f-b63d-5ad3-8dbf-8e89338dd966/scratchpad/product_assets/talking-to-patients-product-assets"
PAGES_SRC = "/tmp/claude-0/-home-user-medical-creator-hub-talking-to-patients/b712870f-b63d-5ad3-8dbf-8e89338dd966/scratchpad/assets_extract/talking-to-patients-web-previews"

def emit(im, out_base, widths, quality=82, webp_quality=78):
    """Write {out_base}-{w}.jpg and .webp for each width <= source width."""
    src_w, src_h = im.size
    written = []
    for w in widths:
        w = min(w, src_w)
        h = round(src_h * (w / src_w))
        resized = im.resize((w, h), Image.LANCZOS) if w != src_w else im
        jpg_path = f"{out_base}-{w}.jpg"
        resized.convert("RGB").save(jpg_path, "JPEG", quality=quality, optimize=True, progressive=True)
        webp_path = f"{out_base}-{w}.webp"
        subprocess.run(
            ["cwebp", "-quiet", "-q", str(webp_quality), jpg_path, "-o", webp_path],
            check=True,
        )
        written.append((w, jpg_path, webp_path))
    return written

def main():
    os.makedirs(os.path.join(ASSETS, "cover"), exist_ok=True)
    os.makedirs(os.path.join(ASSETS, "mockups"), exist_ok=True)
    os.makedirs(os.path.join(ASSETS, "pages"), exist_ok=True)

    # --- Product / hero imagery ---
    cover = Image.open(os.path.join(PRODUCT_SRC, "05-clean-cover.png"))
    emit(cover, os.path.join(ASSETS, "cover", "cover"), [1254, 900, 600, 375], quality=88, webp_quality=84)

    author = Image.open(os.path.join(PRODUCT_SRC, "01-author-holding-book.png"))
    emit(author, os.path.join(ASSETS, "mockups", "author"), [1024, 760, 520, 340], quality=84, webp_quality=80)

    tablet = Image.open(os.path.join(PRODUCT_SRC, "02-tablet-mockup.png"))
    emit(tablet, os.path.join(ASSETS, "mockups", "tablet"), [1024, 760, 520, 340], quality=84, webp_quality=80)

    # --- Interior page previews (already 1200x1800) ---
    page_files = [
        ("01-question-behind-the-question-p14", "page-01"),
        ("02-four-communication-needs-p22", "page-02"),
        ("03-trust-p39", "page-03"),
        ("04-fear-crying-p69", "page-04"),
        ("05-anger-aggression-p71", "page-05"),
        ("06-i-googled-it-p76", "page-06"),
        ("07-cost-money-p88", "page-07"),
        ("08-field-guide-p102", "page-08"),
    ]
    for src_name, out_name in page_files:
        im = Image.open(os.path.join(PAGES_SRC, f"{src_name}.jpg"))
        emit(im, os.path.join(ASSETS, "pages", out_name), [1200, 800, 500], quality=82, webp_quality=78)

    print("Done.")

if __name__ == "__main__":
    main()
