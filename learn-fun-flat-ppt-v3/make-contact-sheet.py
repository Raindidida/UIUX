from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent
slides_dir = root / "slides"
paths = sorted(slides_dir.glob("slide-*.png"))

thumb_w = 480
thumb_h = 270
gap = 28
label_h = 36
cols = 4
rows = (len(paths) + cols - 1) // cols

sheet = Image.new("RGB", (cols * thumb_w + (cols + 1) * gap, rows * (thumb_h + label_h) + (rows + 1) * gap), "#f3f0ee")
draw = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype("arial.ttf", 18)
except Exception:
    font = ImageFont.load_default()

for idx, path in enumerate(paths):
    img = Image.open(path).convert("RGB").resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
    col = idx % cols
    row = idx // cols
    x = gap + col * (thumb_w + gap)
    y = gap + row * (thumb_h + label_h + gap)
    sheet.paste(img, (x, y))
    draw.text((x, y + thumb_h + 10), path.stem, fill="#101330", font=font)

sheet.save(root / "contact-sheet.png")
print(root / "contact-sheet.png")
