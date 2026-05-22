from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path
import math

W, H = 3840, 2160
BBOX = (11.0, 29.0, 38.8, 42.8)  # lon_min, lat_min, lon_max, lat_max
OUT = Path(__file__).resolve().parent

FONT_REG = "C:/Windows/Fonts/NotoSansSC-VF.ttf"
FONT_BOLD = "C:/Windows/Fonts/simhei.ttf"
FONT_SERIF = "C:/Windows/Fonts/NotoSerifSC-VF.ttf"


def font(size, bold=False, serif=False):
    path = FONT_BOLD if bold else (FONT_SERIF if serif else FONT_REG)
    return ImageFont.truetype(path, size=size)


F = {
    "title": font(82, True),
    "subtitle": font(34),
    "region": font(34, True),
    "city": font(28, True),
    "small": font(24),
    "tiny": font(20),
    "label": font(28),
    "label_bold": font(31, True),
    "legend": font(26),
}


def xy(lon, lat):
    lon_min, lat_min, lon_max, lat_max = BBOX
    x = (lon - lon_min) / (lon_max - lon_min) * W
    y = (lat_max - lat) / (lat_max - lat_min) * H
    return x, y


def pts(coords):
    return [xy(lon, lat) for lon, lat in coords]


def rgba(hex_color, a=255):
    h = hex_color.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (a,)


LAND = "#efe7d1"
LAND2 = "#e3d6bb"
SEA = "#b9d9e8"
SEA_DEEP = "#7fb4ce"
INK = "#253040"
MUTED = "#5a6472"
GRID = "#ffffff"
CAESAREA = "#f5b335"
PAUL = "#c3483a"
PAUL2 = "#7d5cc6"
PAUL3 = "#21917a"
ROME = "#2d6cdf"
PETER = "#2f6f9f"
PETER2 = "#8c4f9f"


regions = {
    "意大利": (13.5, 42.0),
    "马其顿": (22.9, 40.6),
    "亚该亚": (23.4, 38.2),
    "亚细亚": (28.3, 38.8),
    "加拉太": (32.0, 39.4),
    "叙利亚": (36.5, 35.2),
    "塞浦路斯": (33.1, 35.0),
    "犹太": (35.1, 31.8),
    "撒玛利亚": (35.2, 32.3),
    "加利利": (35.3, 32.9),
    "埃及": (30.2, 30.0),
    "克里特": (24.8, 35.2),
}


city = {
    "罗马": (12.496, 41.902),
    "庇推利": (14.12, 40.83),
    "叙拉古": (15.29, 37.08),
    "利基翁": (15.65, 38.11),
    "马耳他": (14.37, 35.94),
    "腓立比": (24.28, 41.01),
    "帖撒罗尼迦": (22.94, 40.64),
    "庇哩亚": (22.20, 40.52),
    "雅典": (23.73, 37.98),
    "哥林多": (22.93, 37.94),
    "特罗亚": (26.16, 39.75),
    "亚朔": (26.34, 39.48),
    "米推利尼": (26.55, 39.11),
    "基阿": (26.13, 38.37),
    "撒摩": (26.98, 37.75),
    "米利都": (27.28, 37.53),
    "以弗所": (27.36, 37.94),
    "士每拿": (27.14, 38.42),
    "别迦摩": (27.18, 39.12),
    "别加": (30.86, 36.91),
    "旁非利亚": (30.7, 36.9),
    "彼西底安提阿": (31.19, 38.31),
    "以哥念": (32.49, 37.87),
    "路司得": (32.34, 37.58),
    "特庇": (33.88, 37.35),
    "大数": (34.89, 36.92),
    "安提阿": (36.16, 36.20),
    "撒拉米": (33.90, 35.17),
    "帕弗": (32.42, 34.77),
    "推罗": (35.20, 33.27),
    "多利买": (35.08, 32.93),
    "凯撒利亚": (34.89, 32.50),
    "约帕": (34.75, 32.05),
    "吕大": (34.89, 31.95),
    "耶路撒冷": (35.21, 31.78),
    "撒玛利亚城": (35.20, 32.28),
    "大马士革": (36.30, 33.51),
    "西顿": (35.37, 33.56),
    "每拉": (29.99, 36.26),
    "佳澳": (24.74, 34.93),
    "米拉": (29.99, 36.26),
}


land_polys = [
    # Anatolia / Levant / Mesopotamia
    [(26.0, 42.8), (42.5, 42.8), (42.5, 29.0), (36.0, 29.0), (35.1, 31.0),
     (34.8, 32.0), (35.0, 33.0), (35.4, 34.2), (36.0, 35.0), (35.8, 36.0),
     (36.4, 36.2), (35.6, 36.8), (34.6, 36.7), (33.6, 36.4), (32.4, 36.2),
     (31.0, 36.3), (29.5, 36.5), (28.2, 36.7), (27.3, 37.0), (27.0, 37.5),
     (26.9, 38.2), (26.3, 39.0), (26.0, 40.0), (26.2, 41.0)],
    # Greece / Balkans
    [(21.0, 42.8), (26.0, 42.8), (25.6, 41.3), (24.7, 40.7), (23.8, 40.2),
     (23.1, 39.5), (22.8, 38.7), (23.6, 38.0), (22.9, 37.4), (22.2, 36.8),
     (21.4, 36.7), (21.0, 37.5)],
    # North Africa
    [(21.0, 31.8), (27.0, 31.6), (30.8, 31.3), (33.3, 31.1), (34.2, 31.3),
     (34.7, 30.3), (35.0, 29.0), (21.0, 29.0)],
    # Italy edge
    [(21.0, 42.8), (21.0, 36.0), (17.2, 36.5), (16.2, 38.0), (15.2, 39.2),
     (14.5, 40.5), (13.0, 41.8), (12.1, 42.8)],
]

islands = [
    [(32.3, 35.6), (33.0, 35.7), (34.0, 35.5), (34.6, 35.2), (34.2, 34.8),
     (33.2, 34.6), (32.3, 34.7), (32.0, 35.0)],
    [(23.2, 35.6), (25.2, 35.5), (26.6, 35.2), (26.0, 34.8), (24.5, 34.7),
     (23.0, 34.9)],
    [(14.0, 36.1), (14.6, 36.1), (14.7, 35.8), (14.2, 35.7)],
    [(26.1, 39.3), (26.7, 39.2), (26.6, 38.9), (26.0, 39.0)],
    [(26.7, 38.7), (27.2, 38.6), (27.1, 38.3), (26.6, 38.4)],
]


def draw_background(draw):
    bg = Image.new("RGBA", (W, H), SEA)
    g = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(g)
    for i in range(0, H, 8):
        t = i / H
        col = tuple(int(rgba(SEA)[j] * (1 - t) + rgba(SEA_DEEP)[j] * t) for j in range(3)) + (255,)
        gd.rectangle([0, i, W, i + 8], fill=col)
    draw.bitmap((0, 0), g)

    for lon in range(12, 39, 2):
        x, _ = xy(lon, BBOX[1])
        draw.line([(x, 0), (x, H)], fill=rgba(GRID, 55), width=1)
    for lat in range(30, 43, 2):
        _, y = xy(BBOX[0], lat)
        draw.line([(0, y), (W, y)], fill=rgba(GRID, 55), width=1)

    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    for p in land_polys + islands:
        sd.polygon(pts(p), fill=rgba("#3e3a32", 70))
    shadow = shadow.filter(ImageFilter.GaussianBlur(12))
    draw.bitmap((9, 12), shadow)

    for p in land_polys:
        draw.polygon(pts(p), fill=LAND, outline=rgba("#b9a982", 255))
    for p in islands:
        draw.polygon(pts(p), fill=LAND2, outline=rgba("#b9a982", 255))

    # Mountains / terrain hints
    for lon, lat, w, h in [(31.5, 39.2, 6, 2), (36.3, 34.2, 4, 2), (23.2, 40.1, 4, 2)]:
        x, y = xy(lon, lat)
        for n in range(8):
            draw.arc([x + n * 25, y + math.sin(n) * 10, x + w * 30 + n * 25, y + h * 25],
                     190, 350, fill=rgba("#c9b78d", 90), width=3)

    draw.text((640, 1210), "地中海", font=font(62, True, True), fill=rgba("#336c88", 140))
    draw.text((3380, 1610), "死海", font=font(34, True), fill=rgba("#336c88", 120))

    for name, pos in regions.items():
        if BBOX[0] <= pos[0] <= BBOX[2] and BBOX[1] <= pos[1] <= BBOX[3]:
            x, y = xy(*pos)
            draw.text((x, y), name, font=F["region"], fill=rgba("#65583d", 150), anchor="mm")


def route(draw, names, color, width=9, dash=False, alpha=235):
    coords = [city[n] for n in names]
    p = pts(coords)
    if dash:
        for a, b in zip(p, p[1:]):
            dashed_line(draw, a, b, fill=rgba(color, alpha), width=width)
    else:
        draw.line(p, fill=rgba(color, alpha), width=width, joint="curve")
    for a, b in zip(p, p[1:]):
        arrowhead(draw, a, b, color)


def dashed_line(draw, a, b, fill, width=6, dash=28, gap=18):
    ax, ay = a
    bx, by = b
    length = math.hypot(bx - ax, by - ay)
    if length == 0:
        return
    dx, dy = (bx - ax) / length, (by - ay) / length
    dist = 0
    while dist < length:
        end = min(dist + dash, length)
        draw.line([(ax + dx * dist, ay + dy * dist), (ax + dx * end, ay + dy * end)], fill=fill, width=width)
        dist += dash + gap


def arrowhead(draw, a, b, color):
    ax, ay = a
    bx, by = b
    ang = math.atan2(by - ay, bx - ax)
    midx = ax + (bx - ax) * 0.72
    midy = ay + (by - ay) * 0.72
    size = 26
    p1 = (midx + math.cos(ang) * size, midy + math.sin(ang) * size)
    p2 = (midx + math.cos(ang + 2.55) * size * 0.68, midy + math.sin(ang + 2.55) * size * 0.68)
    p3 = (midx + math.cos(ang - 2.55) * size * 0.68, midy + math.sin(ang - 2.55) * size * 0.68)
    draw.polygon([p1, p2, p3], fill=rgba(color, 230))


def city_dot(draw, name, color="#253040", size=10, label=True, offset=(12, -12)):
    x, y = xy(*city[name])
    draw.ellipse([x - size, y - size, x + size, y + size], fill=rgba("#ffffff", 245), outline=rgba(color, 255), width=4)
    if label:
        draw.text((x + offset[0], y + offset[1]), name, font=F["city"], fill=rgba(INK, 245), stroke_width=3, stroke_fill=rgba("#fff6df", 220))


def caesarea_highlight(draw):
    x, y = xy(*city["凯撒利亚"])
    for r, a in [(72, 70), (50, 120), (30, 210)]:
        draw.ellipse([x - r, y - r, x + r, y + r], outline=rgba(CAESAREA, a), width=8)
    draw.ellipse([x - 16, y - 16, x + 16, y + 16], fill=rgba(CAESAREA, 255), outline=rgba("#5d3b00", 255), width=4)
    draw.text((x + 42, y - 62), "凯撒利亚", font=font(43, True), fill=rgba("#5d3b00", 255),
              stroke_width=5, stroke_fill=rgba("#fff6dc", 245))


def label_box(draw, title, body, lon, lat, color, side="right", w=620):
    x, y = xy(lon, lat)
    pad = 22
    lines = wrap(body, F["label"], w - pad * 2)
    h = pad * 2 + 42 + len(lines) * 35
    if side == "left":
        x0, y0 = x - w, y
    else:
        x0, y0 = x, y
    x0 = max(120, min(x0, W - w - 120))
    y0 = max(260, min(y0, H - h - 330))
    rect = [x0, y0, x0 + w, y0 + h]
    draw.rounded_rectangle([rect[0] + 7, rect[1] + 9, rect[2] + 7, rect[3] + 9], radius=18, fill=rgba("#2b2b2b", 45))
    draw.rounded_rectangle(rect, radius=18, fill=rgba("#fffaf0", 238), outline=rgba(color, 235), width=5)
    draw.rectangle([x0, y0, x0 + 15, y0 + h], fill=rgba(color, 235))
    draw.text((x0 + pad, y0 + pad - 4), title, font=F["label_bold"], fill=rgba(color, 255))
    yy = y0 + pad + 45
    for line in lines:
        draw.text((x0 + pad, yy), line, font=F["label"], fill=rgba(INK, 245))
        yy += 35


def wrap(text, fnt, max_w):
    out, line = [], ""
    for ch in text:
        trial = line + ch
        if ImageDraw.Draw(Image.new("RGB", (1, 1))).textlength(trial, font=fnt) <= max_w:
            line = trial
        else:
            if line:
                out.append(line)
            line = ch
    if line:
        out.append(line)
    return out


def title(draw, main, sub):
    draw.rounded_rectangle([120, 95, 1880, 235], radius=24, fill=rgba("#fff9ea", 232))
    draw.text((155, 108), main, font=F["title"], fill=rgba(INK, 255))
    draw.text((162, 198), sub, font=F["subtitle"], fill=rgba(MUTED, 255))


def scale_and_note(draw, note):
    draw.rounded_rectangle([120, 1950, 3720, 2070], radius=18, fill=rgba("#fffaf0", 225))
    draw.text((155, 1980), note, font=F["small"], fill=rgba("#445063", 255))
    draw.text((3370, 2020), "16:9 · 3840×2160", font=F["small"], fill=rgba("#445063", 210))


def legend(draw, items):
    x, y = 2700, 112
    h = 58 * len(items) + 32
    draw.rounded_rectangle([x, y, x + 1010, y + h], radius=22, fill=rgba("#fffaf0", 232), outline=rgba("#d8c79e", 230), width=3)
    yy = y + 25
    for label, col, dashed in items:
        if dashed:
            dashed_line(draw, (x + 32, yy + 18), (x + 135, yy + 18), rgba(col, 235), width=8, dash=18, gap=10)
        else:
            draw.line([(x + 32, yy + 18), (x + 135, yy + 18)], fill=rgba(col, 235), width=9)
        draw.text((x + 158, yy), label, font=F["legend"], fill=rgba(INK, 240))
        yy += 58


def draw_paul():
    img = Image.new("RGBA", (W, H), SEA)
    draw = ImageDraw.Draw(img)
    draw_background(draw)
    title(draw, "保罗宣教与作见证路线图", "使徒行传 13-28：从安提阿出发，直到罗马")

    route(draw, ["安提阿", "撒拉米", "帕弗", "别加", "彼西底安提阿", "以哥念", "路司得", "特庇", "路司得", "以哥念", "彼西底安提阿", "别加", "安提阿"], PAUL)
    route(draw, ["安提阿", "大数", "特庇", "路司得", "以哥念", "彼西底安提阿", "特罗亚", "腓立比", "帖撒罗尼迦", "庇哩亚", "雅典", "哥林多", "以弗所", "凯撒利亚", "耶路撒冷", "安提阿"], PAUL2)
    route(draw, ["安提阿", "大数", "特庇", "路司得", "以弗所", "特罗亚", "腓立比", "哥林多", "腓立比", "特罗亚", "亚朔", "米推利尼", "基阿", "撒摩", "米利都", "推罗", "多利买", "凯撒利亚", "耶路撒冷"], PAUL3)
    route(draw, ["凯撒利亚", "西顿", "每拉", "佳澳", "马耳他", "叙拉古", "利基翁", "庇推利", "罗马"], ROME, dash=True)

    for n in ["安提阿", "撒拉米", "帕弗", "彼西底安提阿", "以哥念", "路司得", "特庇", "特罗亚", "腓立比", "帖撒罗尼迦", "雅典", "哥林多", "以弗所", "米利都", "推罗", "多利买", "凯撒利亚", "耶路撒冷", "马耳他", "罗马"]:
        city_dot(draw, n, size=8, label=n != "凯撒利亚")
    caesarea_highlight(draw)

    label_box(draw, "安提阿：被差派", "圣灵差遣巴拿巴和扫罗，第一次宣教旅程开始。徒13:1-3", 36.55, 36.55, PAUL, w=650)
    label_box(draw, "路司得：医治与逼迫", "医治瘸腿者，后又被石头打，以为已死。徒14:8-20", 32.8, 37.05, PAUL, w=690)
    label_box(draw, "腓立比：欧洲首站", "吕底亚信主；保罗西拉下监，狱卒全家受洗。徒16:11-34", 25.1, 41.3, PAUL2, w=720)
    label_box(draw, "雅典：亚略巴古", "向敬拜“未识之神”的人讲明创造主与复活。徒17:16-34", 18.8, 37.5, PAUL2, w=690)
    label_box(draw, "以弗所：长期事奉", "推喇奴学房讲论；主道大大兴旺。徒19:8-20", 27.6, 38.25, PAUL3, w=675)
    label_box(draw, "米利都：长老告别", "嘱咐以弗所长老牧养神的群羊。徒20:17-38", 26.7, 36.85, PAUL3, w=700)
    label_box(draw, "凯撒利亚：关键转折", "住传福音的腓利家；亚迦布预言捆绑。后从此被押往罗马。徒21:8-14；23:23-35；27:1", 32.7, 31.35, CAESAREA, w=760)
    label_box(draw, "罗马：放胆传讲", "被囚仍接待众人，讲论神国和主耶稣。徒28:16-31", 12.0, 41.25, ROME, w=660)

    legend(draw, [
        ("第一次宣教旅程（徒13-14）", PAUL, False),
        ("第二次宣教旅程（徒15:36-18:22）", PAUL2, False),
        ("第三次宣教旅程（徒18:23-21:17）", PAUL3, False),
        ("凯撒利亚至罗马作见证航线（徒27-28）", ROME, True),
        ("凯撒利亚高亮", CAESAREA, False),
    ])
    scale_and_note(draw, "注：本图为学习《使徒行传》的示意地图，城市位置和路线按古代地名作近似定位；路线强调叙事顺序与关键事件。")
    img.convert("RGB").save(OUT / "paul_missionary_map_4k_cn.png", quality=96)


def draw_peter():
    img = Image.new("RGBA", (W, H), SEA)
    draw = ImageDraw.Draw(img)
    draw_background(draw)
    title(draw, "彼得宣教与见证路线图", "使徒行传 1-12：耶路撒冷、撒玛利亚、约帕、凯撒利亚")

    route(draw, ["耶路撒冷", "撒玛利亚城", "耶路撒冷"], PETER2, width=10)
    route(draw, ["耶路撒冷", "吕大", "约帕", "凯撒利亚", "约帕", "耶路撒冷"], PETER, width=11)
    route(draw, ["耶路撒冷", "安提阿"], "#a05a2c", width=8, dash=True, alpha=190)

    for n in ["耶路撒冷", "撒玛利亚城", "吕大", "约帕", "凯撒利亚", "安提阿"]:
        city_dot(draw, n, PETER, size=10, label=n != "凯撒利亚")
    caesarea_highlight(draw)

    # Inset for Judea/Samaria, because Peter's Acts route is geographically compact.
    ix, iy, iw, ih = 2140, 645, 1420, 860
    draw.rounded_rectangle([ix, iy, ix + iw, iy + ih], radius=28, fill=rgba("#fffaf0", 238), outline=rgba("#d1bd8d", 245), width=5)
    draw.text((ix + 38, iy + 30), "犹太与撒玛利亚放大示意", font=font(42, True), fill=rgba(INK, 255))

    def inset(lon, lat):
        lon_min, lat_min, lon_max, lat_max = 34.55, 31.55, 35.45, 32.75
        return (ix + 80 + (lon - lon_min) / (lon_max - lon_min) * (iw - 160),
                iy + 130 + (lat_max - lat) / (lat_max - lat_min) * (ih - 210))

    coastline = [(34.65, 32.65), (34.72, 32.45), (34.75, 32.20), (34.76, 31.95), (34.78, 31.65)]
    draw.line([inset(*p) for p in coastline], fill=rgba("#5c9fbd", 180), width=10)
    for a, b in [("耶路撒冷", "撒玛利亚城"), ("耶路撒冷", "吕大"), ("吕大", "约帕"), ("约帕", "凯撒利亚"), ("凯撒利亚", "耶路撒冷")]:
        draw.line([inset(*city[a]), inset(*city[b])], fill=rgba(PETER, 230), width=9)
        arrowhead(draw, inset(*city[a]), inset(*city[b]), PETER)
    for n in ["耶路撒冷", "撒玛利亚城", "吕大", "约帕", "凯撒利亚"]:
        x, y = inset(*city[n])
        fill = CAESAREA if n == "凯撒利亚" else "#ffffff"
        draw.ellipse([x - 15, y - 15, x + 15, y + 15], fill=rgba(fill, 255), outline=rgba(PETER, 255), width=4)
        draw.text((x + 22, y - 18), n, font=F["city"], fill=rgba(INK, 245), stroke_width=3, stroke_fill=rgba("#fffaf0", 230))

    label_box(draw, "耶路撒冷：五旬节", "圣灵降临，彼得讲道，约三千人受洗。徒2:1-41", 12.2, 35.0, PETER, w=720)
    label_box(draw, "圣殿门口：医治瘸腿者", "奉耶稣基督的名叫人起来行走，并向百姓作见证。徒3:1-26", 12.2, 33.85, PETER, w=740)
    label_box(draw, "耶路撒冷：出监", "希律下手苦害教会，彼得被天使救出监牢。徒12:1-17", 12.2, 32.65, PETER, w=720)
    label_box(draw, "吕大：以尼雅得医治", "瘫痪八年的以尼雅起来，许多人归向主。徒9:32-35", 20.5, 34.15, PETER, w=700)
    label_box(draw, "约帕：多加复活", "彼得祷告，叫大比大起来；多人信主。徒9:36-43", 20.5, 33.05, PETER, w=700)
    label_box(draw, "撒玛利亚：福音扩展", "彼得约翰按手，撒玛利亚人领受圣灵；责备西门。徒8:14-25", 28.8, 33.8, PETER2, w=760)
    label_box(draw, "凯撒利亚：哥尼流一家", "彼得进入外邦人家，圣灵降在听道的人身上。徒10:1-48", 27.7, 32.65, CAESAREA, w=780)
    label_box(draw, "耶路撒冷：解释外邦归主", "彼得说明异象与圣灵工作，众人归荣耀给神。徒11:1-18", 27.7, 31.5, PETER, w=760)

    legend(draw, [
        ("彼得在犹太、撒玛利亚的见证路线（徒2-12）", PETER, False),
        ("撒玛利亚确认福音扩展（徒8）", PETER2, False),
        ("传统上后续与安提阿有关的方向性延伸", "#a05a2c", True),
        ("凯撒利亚高亮：外邦人蒙恩的重要节点", CAESAREA, False),
    ])
    scale_and_note(draw, "注：本图聚焦《使徒行传》中彼得相关事件；安提阿虚线为后续早期教会活动的方向性提示，非徒1-12的详细行程。")
    img.convert("RGB").save(OUT / "peter_missionary_map_4k_cn.png", quality=96)


if __name__ == "__main__":
    draw_paul()
    draw_peter()
    print(OUT / "paul_missionary_map_4k_cn.png")
    print(OUT / "peter_missionary_map_4k_cn.png")
