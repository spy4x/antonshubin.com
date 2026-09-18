#!/usr/bin/env python3
"""
Measure exact pixel coordinates of sensitive text regions in each SmartLite
screenshot. Run once, paste the output into the redaction script.

Heuristic: scan rows looking for non-background pixels in known x-bands, then
report tight bounding boxes. Backgrounds differ per region (white card,
white sidebar, light-gray table cell), so we pass the expected bg colour per
image.
"""
from __future__ import annotations
from pathlib import Path
from PIL import Image
import sys

IMG = Path(__file__).resolve().parents[1] / "static" / "img" / "projects" / "smartlite"


def bbox(img: Image.Image, x0: int, y0: int, x1: int, y1: int, bg: tuple[int, int, int], tol: int = 25):
    """Bounding box of pixels within rect that differ from bg by more than tol."""
    px = img.load()
    minx = x1
    miny = y1
    maxx = x0
    maxy = y0
    found = False
    for y in range(y0, y1):
        for x in range(x0, x1):
            r, g, b = px[x, y][:3]
            if abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2]) > tol:
                minx = min(minx, x)
                miny = min(miny, y)
                maxx = max(maxx, x)
                maxy = max(maxy, y)
                found = True
    return (minx, miny, maxx, maxy) if found else None


def main():
    targets = [
        # (file, scan_windows) — each window is (x0, y0, x1, y1, bg_label)
        ("01-dashboard.png", [
            ("Lamp Box GB ID badge", 990, 645, 1110, 685, "card-bg"),  # white card
            ("Map area (full bottom)", 360, 575, 1090, 1000, "map-bg"),
        ]),
        ("02-lampboxes.png", [
            ("GB ID column header + rows", 485, 290, 580, 960, "row-bg"),
        ]),
        ("03-alerts.png", [
            ("Alert # column rows", 340, 320, 410, 940, "card-bg"),
            ("GB ID column rows", 580, 320, 740, 940, "card-bg"),
            ("Sidebar 327 badge", 160, 115, 220, 160, "sidebar-bg"),
        ]),
        ("07-gateways.png", [
            ("Device ID column", 510, 290, 615, 950, "row-bg"),
            ("GB ID column", 750, 290, 890, 950, "row-bg"),
        ]),
        ("08-sensors.png", [
            ("GB ID column", 740, 290, 900, 950, "row-bg"),
        ]),
    ]
    # Background colours sampled from each image region
    bgs = {
        "card-bg": (255, 255, 255),
        "sidebar-bg": (102, 51, 153),  # purple
        "row-bg": (252, 252, 252),     # table light gray
        "map-bg": (220, 230, 220),
    }
    for name, windows in targets:
        img = Image.open(IMG / name).convert("RGB")
        print(f"=== {name}  {img.size} ===")
        for label, x0, y0, x1, y1, bg_key in windows:
            bb = bbox(img, x0, y0, x1, y1, bgs[bg_key])
            if bb is None:
                print(f"  {label:35s} → empty")
            else:
                bx0, by0, bx1, by1 = bb
                w, h = bx1 - bx0 + 1, by1 - by0 + 1
                print(f"  {label:35s} → ({bx0},{by0})..({bx1},{by1})  {w}x{h}")


if __name__ == "__main__":
    main()
