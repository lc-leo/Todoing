#!/usr/bin/env python3
"""Rasterize the Todoing mark into PNG + ICO for the Windows build."""
from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path

OUT = Path("/workspace/desktop/build")
BLUE = (0x00, 0x78, 0xD4, 255)
WHITE = (255, 255, 255, 255)
TRANSPARENT = (0, 0, 0, 0)


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def blend(dst: tuple[int, int, int, int], src: tuple[int, int, int, int], a: float) -> tuple[int, int, int, int]:
    a = max(0.0, min(1.0, a))
    inv = 1.0 - a
    return (
        round(dst[0] * inv + src[0] * a),
        round(dst[1] * inv + src[1] * a),
        round(dst[2] * inv + src[2] * a),
        round(dst[3] * inv + src[3] * a),
    )


def rounded_rect_coverage(x: float, y: float, size: int, radius: float) -> float:
    # Signed distance to rounded rect covering [0,size] x [0,size]
    cx = size / 2
    cy = size / 2
    hw = size / 2
    hh = size / 2
    dx = abs(x - cx) - (hw - radius)
    dy = abs(y - cy) - (hh - radius)
    outside = math.hypot(max(dx, 0), max(dy, 0))
    inside = min(max(dx, dy), 0)
    dist = outside + inside - radius
    # 1 inside, 0 outside, AA across ~1px
    return max(0.0, min(1.0, 0.5 - dist))


def stroke_coverage(px: float, py: float, ax: float, ay: float, bx: float, by: float, width: float) -> float:
    vx, vy = bx - ax, by - ay
    length = math.hypot(vx, vy) or 1.0
    t = max(0.0, min(1.0, ((px - ax) * vx + (py - ay) * vy) / (length * length)))
    qx, qy = ax + t * vx, ay + t * vy
    dist = math.hypot(px - qx, py - qy)
    half = width / 2
    return max(0.0, min(1.0, half + 0.5 - dist))


def render(size: int) -> bytes:
    radius = size * 0.25
    stroke = max(2.0, size * 0.12)
    p1 = (size * 0.234, size * 0.512)
    p2 = (size * 0.406, size * 0.691)
    p3 = (size * 0.766, size * 0.303)
    rows = []
    for y in range(size):
        row = bytearray()
        for x in range(size):
            # 2x2 supersample
            acc = [0.0, 0.0, 0.0, 0.0]
            for oy in (0.25, 0.75):
                for ox in (0.25, 0.75):
                    px, py = x + ox, y + oy
                    cover = rounded_rect_coverage(px, py, size, radius)
                    pixel = blend(TRANSPARENT, BLUE, cover)
                    check = max(
                        stroke_coverage(px, py, *p1, *p2, stroke),
                        stroke_coverage(px, py, *p2, *p3, stroke),
                    )
                    pixel = blend(pixel, WHITE, check * cover)
                    acc[0] += pixel[0]
                    acc[1] += pixel[1]
                    acc[2] += pixel[2]
                    acc[3] += pixel[3]
            row.extend(int(v / 4) for v in acc)
        rows.append(b"\x00" + bytes(row))
    return encode_png(size, size, b"".join(rows))


def encode_png(width: int, height: int, raw: bytes) -> bytes:
    def chunk(tag: bytes, data: bytes) -> bytes:
        crc = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")


def encode_ico(images: list[tuple[int, bytes]]) -> bytes:
    header = struct.pack("<HHH", 0, 1, len(images))
    directory = b""
    payload = b""
    offset = 6 + 16 * len(images)
    for size, png in images:
        w = 0 if size >= 256 else size
        directory += struct.pack("<BBBBHHII", w, w, 0, 0, 1, 32, len(png), offset)
        payload += png
        offset += len(png)
    return header + directory + payload


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    sizes = (16, 32, 48, 64, 128, 256)
    rendered = [(size, render(size)) for size in sizes]
    (OUT / "icon.png").write_bytes(dict(rendered)[256])
    (OUT / "icon.ico").write_bytes(encode_ico(rendered))
    print(f"wrote {OUT / 'icon.png'} and {OUT / 'icon.ico'}")


if __name__ == "__main__":
    main()
