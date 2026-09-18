#!/usr/bin/env python3
"""
Blur/map-mask and ID-redact SmartLite portfolio screenshots.

Client asked to:
  - blur the map shown on the dashboard
  - redact (black-fill, like the existing 06-users.png) every hardware /
    identifier number visible in the UI

Coordinates were measured from the original 1440x1000 screenshots. If the
screenshots are regenerated at the same size, the regions remain valid; if
not, re-measure with scripts/measure-regions.py.

Run from repo root:
  python3 scripts/blur-smartlite-images.py
"""

from __future__ import annotations

import sys
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

REPO_ROOT = Path(__file__).resolve().parents[1]
IMG_DIR = REPO_ROOT / "static" / "img" / "projects" / "smartlite"

# Matches the existing redaction style on 06-users.png (solid black bars).
ID_FILL = (0, 0, 0)
# Pillar-box for the blurred map. Solid fill matches the surrounding card
# surface so the box doesn't stand out before the blur.
MAP_SOLID = (170, 211, 223)
# Sidebar accent is purple; the unread-badge redaction is purple so the
# rect blends into the sidebar surface.
SIDEBAR_FILL = (88, 28, 135)


@dataclass(frozen=True)
class Region:
    x0: int
    y0: int
    x1: int
    y1: int
    fill: tuple[int, int, int]
    blur: bool = False


def apply(img: Image.Image, regions: list[Region]) -> Image.Image:
    out = img.copy()
    for r in regions:
        if not r.blur:
            continue
        crop = out.crop((r.x0, r.y0, r.x1, r.y1))
        blurred = crop.filter(ImageFilter.GaussianBlur(radius=30))
        out.paste(blurred, (r.x0, r.y0))
    draw = ImageDraw.Draw(out)
    for r in regions:
        if r.blur:
            continue
        draw.rectangle((r.x0, r.y0, r.x1, r.y1), fill=r.fill)
    return out


# ─────────────────────────────────────────────────────────────────────────────
# Per-image region definitions. All coordinates measured from 1440x1000
# originals via scripts/measure-regions.py + manual pixel inspection.
# ─────────────────────────────────────────────────────────────────────────────


def regions_for(name: str) -> list[Region]:
    if name == "01-dashboard.png":
        return [
            # "GB ID: BW-LP-009" — entire purple pill (white-on-purple text).
            Region(1125, 617, 1225, 646, fill=ID_FILL),
            # "Region: Broadwalk" — value portion only (label stays).
            Region(1135, 705, 1210, 720, fill=ID_FILL),
            # "Gateway: BW-GW-09" — value portion only.
            Region(1135, 725, 1235, 740, fill=ID_FILL),
            # "Zones: 1, 82, 83, 87, 127" — value portion only. Generous bounds
            # so the comma tail and descender are fully covered.
            Region(1118, 744, 1240, 762, fill=ID_FILL),
            # Leaflet map of Gardens by the Bay (bottom half).
            Region(325, 540, 1090, 999, fill=MAP_SOLID, blur=True),
        ]

    if name == "02-lampboxes.png":
        # GB ID column — header + 8 visible rows.
        return [Region(517, 260, 600, 935, fill=ID_FILL)]

    if name == "03-alerts.png":
        return [
            # Sidebar unread badge "327".
            Region(168, 119, 215, 152, fill=SIDEBAR_FILL),
            # Alert number column "#3066x" — covers from "#" to digits.
            Region(355, 300, 570, 940, fill=ID_FILL),
            # GB ID column ("BW-LP-031", "BW-LP-023", …).
            Region(580, 300, 740, 940, fill=ID_FILL),
        ]

    if name == "07-gateways.png":
        return [
            Region(530, 250, 615, 960, fill=ID_FILL),  # Device ID
            Region(728, 250, 820, 960, fill=ID_FILL),  # GB ID
        ]

    if name == "08-sensors.png":
        return [Region(740, 250, 880, 960, fill=ID_FILL)]  # GB ID

    return []


def main() -> int:
    changed: list[str] = []
    for png in sorted(IMG_DIR.glob("*.png")):
        regions = regions_for(png.name)
        if not regions:
            continue
        with Image.open(png) as src:
            src.load()
            out = apply(src.convert("RGB"), regions)
        out.save(png, format="PNG", optimize=True)
        webp = png.with_suffix(".webp")
        out.save(webp, format="WEBP", quality=85, method=6)
        changed.append(f"{png.relative_to(REPO_ROOT)} (+ {webp.name})")
    if not changed:
        print("No regions to redact — nothing changed.")
        return 0
    print("Updated:")
    for c in changed:
        print(f"  {c}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
