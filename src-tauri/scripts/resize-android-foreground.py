#!/usr/bin/env python
"""
Rescale Android adaptive-icon foreground PNGs to add transparent padding.

Adaptive icons only render the center ~66-72dp of the 108dp foreground canvas.
Shrinking the opaque content (and keeping the canvas size) makes the launcher
icon appear smaller / more padded.

Usage:
    python resize_android_foreground.py [SCALE]

SCALE is the multiplier applied to the current content size (default 0.75).
0.75 turns ~50% canvas-fill into ~38% canvas-fill.
"""

import sys
import typing as t
from pathlib import Path

from PIL import Image

if t.TYPE_CHECKING:
    from PIL.Image import Image as Image_
    from PIL.ImageFile import ImageFile

FILE_PATH: t.Final[Path] = Path(__file__)
RESOURCE_PATH: t.Final[Path] = Path("gen/android/app/src/main/res")
RESOLVED_PATH: t.Final[Path] = Path.resolve(FILE_PATH.parent.parent / RESOURCE_PATH)

DENSITIES: t.Final[list[str]] = ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"]


def main() -> None:
    scale = float(sys.argv[1]) if len(sys.argv) > 1 else 0.75
    for d in DENSITIES:
        p: Path = RESOLVED_PATH / f"mipmap-{d}" / "ic_launcher_foreground.png"
        im: ImageFile = Image.open(p).convert("RGBA")
        w, h = t.cast("tuple[int, int]", im.size)
        bbox: tuple[int, int, int, int] | None = im.split()[3].getbbox()
        content: Image_ = im.crop(bbox)
        cw, ch = t.cast("tuple[int, int]", content.size)
        nw, nh = max(1, round(cw * scale)), max(1, round(ch * scale))
        content: Image_ = content.resize((nw, nh), Image.LANCZOS)
        out: Image_ = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        out.paste(content, ((w - nw) // 2, (h - nh) // 2), content)
        out.save(p)
        sys.stdout.write(f"{d}: {cw}x{ch} -> {nw}x{nh} on {w}x{h} ({nw / w:.0%} fill)")


if __name__ == "__main__":
    main()
