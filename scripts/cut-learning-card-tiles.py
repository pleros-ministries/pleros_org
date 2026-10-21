"""Cut a snug square around each artwork's object, anchored to its bottom-right, and
sample the field colour, so a card can place the object at a fixed size in its corner."""
import sys
import numpy as np
from PIL import Image, ImageFilter

OUT = "/Users/letroot/code/fcc/pleros_org/public/assets/dashboard/learning-cards"
SOURCES = dict(arg.split("=") for arg in sys.argv[1:])  # key=file.png

for key, path in SOURCES.items():
    im = Image.open(path).convert("RGB")
    w, h = im.size
    a = np.asarray(im.filter(ImageFilter.GaussianBlur(3)), dtype=np.float32)
    field = a[int(h * .05):int(h * .35), int(w * .03):int(w * .4)].reshape(-1, 3).mean(0)
    # The field is a soft gradient: fit it as a plane from the top and left bands (all field),
    # so only the object differs from it.
    yy, xx = np.mgrid[0:h, 0:w]
    sel = (yy < h * .4) | (xx < w * .4)
    A = np.stack([xx[sel], yy[sel], np.ones(sel.sum())], 1).astype(np.float32)
    plane = np.empty_like(a)
    for c in range(3):
        coef, *_ = np.linalg.lstsq(A, a[..., c][sel], rcond=None)
        plane[..., c] = coef[0] * xx + coef[1] * yy + coef[2]
    diff = np.abs(a - plane).sum(2)
    mask = diff > 38  # the object (and its glow), not the textured field
    ys, xs = np.nonzero(mask)
    # Ignore stray specks: keep the bulk of the object.
    x0, x1 = np.percentile(xs, 1), xs.max()
    y0, y1 = np.percentile(ys, 1), ys.max()
    size = int(max(x1 - x0, y1 - y0) * 1.45)  # a field margin on the top and left to feather into
    right, bottom = min(w, int(x1) + int(size * .04)), min(h, int(y1) + int(size * .04))
    left, top = max(0, right - size), max(0, bottom - size)
    tile = im.crop((left, top, right, bottom))
    for px in (192, 384):
        tile.resize((px, px), Image.LANCZOS).save(f"{OUT}/{key}-tile-{px}.webp", quality=86)
    print(key, "field #%02x%02x%02x" % tuple(int(c) for c in field), "tile", tile.size, "object box", int(x0), int(y0), int(x1), int(y1))
