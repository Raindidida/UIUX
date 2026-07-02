from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent
paths = [
    root / "slide-10-next-milestones.png",
    root / "slide-11-team.png",
    root / "slide-12-past-traction.png",
    root / "slide-13-why-now.png",
]
thumb_w, thumb_h = 640, 360
gap, label_h = 28, 36
sheet = Image.new("RGB", (thumb_w * 2 + gap * 3, (thumb_h + label_h) * 2 + gap * 3), "#f3f0ee")
draw = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype("arial.ttf", 18)
except Exception:
    font = ImageFont.load_default()

for idx, path in enumerate(paths):
    img = Image.open(path).convert("RGB").resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
    x = gap + (idx % 2) * (thumb_w + gap)
    y = gap + (idx // 2) * (thumb_h + label_h + gap)
    sheet.paste(img, (x, y))
    draw.text((x, y + thumb_h + 10), path.stem, fill="#101330", font=font)

sheet.save(root / "contact-sheet.png")
print(root / "contact-sheet.png")
