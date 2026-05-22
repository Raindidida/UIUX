from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import textwrap

W, H = 3840, 2160
OUT = Path(__file__).resolve().parent
FONT_REG = "C:/Windows/Fonts/NotoSansSC-VF.ttf"
FONT_BOLD = "C:/Windows/Fonts/simhei.ttf"
FONT_SERIF = "C:/Windows/Fonts/NotoSerifSC-VF.ttf"


def font(size, bold=False, serif=False):
    return ImageFont.truetype(FONT_BOLD if bold else (FONT_SERIF if serif else FONT_REG), size=size)


F = {
    "title": font(86, True),
    "subtitle": font(36),
    "h1": font(43, True),
    "h2": font(34, True),
    "body": font(29),
    "small": font(24),
    "tiny": font(21),
    "chap": font(25),
    "chap_bold": font(28, True),
}

BG = "#f3ead7"
PAPER = "#fffaf0"
INK = "#243044"
MUTED = "#667085"
BLUE = "#2d6f9f"
GOLD = "#f0aa2d"
GREEN = "#21836e"
RED = "#c64a3f"
PURPLE = "#7857c5"
BROWN = "#9a6535"


def rgba(hex_color, a=255):
    h = hex_color.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (a,)


def base():
    img = Image.new("RGBA", (W, H), BG)
    d = ImageDraw.Draw(img)
    for y in range(0, H, 6):
        t = y / H
        c = tuple(int(rgba("#f7efde")[i] * (1 - t) + rgba("#eadbbd")[i] * t) for i in range(3)) + (255,)
        d.rectangle([0, y, W, y + 6], fill=c)
    # faint geographic arcs
    for x, y, r, col in [(450, 1580, 460, BLUE), (3250, 390, 380, GOLD), (3000, 1650, 520, GREEN)]:
        for n in range(6):
            d.arc([x - r - n * 34, y - r - n * 34, x + r + n * 34, y + r + n * 34],
                  205, 333, fill=rgba(col, 28), width=5)
    return img, d


def text_len(text, fnt):
    return ImageDraw.Draw(Image.new("RGB", (1, 1))).textlength(text, font=fnt)


def wrap_cn(text, fnt, max_w):
    lines, line = [], ""
    for ch in text:
        trial = line + ch
        if text_len(trial, fnt) <= max_w:
            line = trial
        else:
            if line:
                lines.append(line)
            line = ch
    if line:
        lines.append(line)
    return lines


def rounded_panel(d, box, fill=PAPER, outline="#dbc798", radius=26, shadow=True):
    x0, y0, x1, y1 = box
    if shadow:
        sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        sd = ImageDraw.Draw(sh)
        sd.rounded_rectangle([x0 + 9, y0 + 12, x1 + 9, y1 + 12], radius=radius, fill=rgba("#000000", 45))
        sh = sh.filter(ImageFilter.GaussianBlur(5))
        d.bitmap((0, 0), sh)
    d.rounded_rectangle(box, radius=radius, fill=rgba(fill, 242), outline=rgba(outline, 255), width=4)


def section(d, x, y, w, h, title, color, body_lines):
    rounded_panel(d, [x, y, x + w, y + h], radius=22)
    d.rectangle([x, y, x + 18, y + h], fill=rgba(color, 245))
    d.text((x + 42, y + 28), title, font=F["h2"], fill=rgba(color, 255))
    yy = y + 86
    for item in body_lines:
        if isinstance(item, tuple):
            head, body = item
            d.text((x + 42, yy), head, font=F["body"], fill=rgba(INK, 255))
            yy += 39
            for line in wrap_cn(body, F["small"], w - 92):
                d.text((x + 58, yy), line, font=F["small"], fill=rgba(MUTED, 255))
                yy += 32
            yy += 10
        else:
            for line in wrap_cn(item, F["body"], w - 92):
                d.text((x + 42, yy), line, font=F["body"], fill=rgba(INK, 255))
                yy += 38
            yy += 10


def draw_header(d, title, subtitle):
    rounded_panel(d, [120, 90, 2300, 250], fill="#fffdf7", radius=28, shadow=False)
    d.text((160, 105), title, font=F["title"], fill=rgba(INK, 255))
    d.text((166, 199), subtitle, font=F["subtitle"], fill=rgba(MUTED, 255))


def draw_background_card():
    img, d = base()
    draw_header(d, "使徒行传：背景、对象与写作目的", "路加福音续篇 · 福音从耶路撒冷直到地极")

    # central verse spine
    rounded_panel(d, [2460, 105, 3718, 430], fill="#f9f3e5", radius=28)
    d.text((2515, 142), "全书钥节：使徒行传 1:8", font=F["h1"], fill=rgba(BLUE, 255))
    verse = "“圣灵降临在你们身上，你们就必得着能力；并要在耶路撒冷、犹太全地和撒玛利亚，直到地极，作我的见证。”"
    yy = 210
    for line in wrap_cn(verse, font(32, serif=True), 1120):
        d.text((2515, yy), line, font=font(32, serif=True), fill=rgba(INK, 255))
        yy += 43

    section(d, 120, 330, 1120, 500, "写作对象", BLUE, [
        ("提阿非罗", "路加福音与使徒行传都写给“提阿非罗”。路1:3；徒1:1"),
        ("更广读者", "面向需要明白耶稣与教会历史根基的信徒，也帮助外邦读者认识福音如何传开。"),
        ("写作方式", "路加按次序查考、叙述，使读者知道所学之道都是确实的。路1:1-4"),
    ])
    section(d, 1360, 330, 980, 500, "写作背景", GREEN, [
        "耶稣复活升天后，门徒在圣灵能力中作见证；教会从耶路撒冷诞生，经历逼迫、分散、差派，并扩展到外邦世界。",
        "全书覆盖约主后30年至60年代初的初代教会历史，终点停在保罗抵达罗马并放胆传讲。徒28:30-31",
    ])
    section(d, 2460, 500, 1258, 520, "写作时间", GOLD, [
        "常见推定：约主后60-62年，因全书结束于保罗在罗马软禁两年，尚未记载保罗殉道、尼禄大逼迫或耶路撒冷被毁。",
        "保守说法：第一世纪60年代前后。重点不是年代本身，而是说明福音在圣灵引导下持续扩展。徒28:30-31",
    ])

    section(d, 120, 910, 1120, 590, "作者路加背景", PURPLE, [
        ("保罗同工", "《使徒行传》多处出现“我们”叙事，显示作者参与部分旅程。徒16:10；20:5；21:1；27:1"),
        ("医生路加", "保罗称他为“亲爱的医生路加”。西4:14"),
        ("写作特色", "重视历史次序、地点、人物、航程和官员，也特别关注外邦人、妇女、贫穷人和被忽略者。"),
    ])
    section(d, 1360, 910, 980, 590, "前书主旨", RED, [
        "前书是《路加福音》：耶稣是神所差来的救主，祂寻找、拯救失丧的人。",
        "核心经文：路19:10 “人子来，为要寻找、拯救失丧的人。”",
        "《路加福音》讲耶稣在地上的工作；《使徒行传》讲复活升天的耶稣借圣灵和教会继续作工。徒1:1-2",
    ])
    section(d, 2460, 1100, 1258, 620, "写作目的", BROWN, [
        ("证明耶稣工作继续", "“我已经作了前书，论到耶稣开头一切所行所教训的。”徒1:1-2"),
        ("说明圣灵推动宣教", "圣灵赐能力，使门徒作见证直到地极。徒1:8"),
        ("见证福音临到外邦", "神赐外邦人悔改得生命。徒11:18；15:7-11"),
        ("显明福音无人禁止", "保罗在罗马放胆传讲神国和主耶稣。徒28:30-31"),
    ])

    rounded_panel(d, [120, 1605, 2340, 1958], fill="#fffdf7", radius=26)
    d.text((165, 1645), "全书结构", font=F["h1"], fill=rgba(INK, 255))
    structure = [
        ("徒1-7", "耶路撒冷：教会诞生，见证与逼迫开始"),
        ("徒8-12", "犹太、撒玛利亚、凯撒利亚：福音越过边界"),
        ("徒13-28", "安提阿到罗马：保罗宣教，福音进入外邦世界"),
    ]
    x = 175
    for ref, text in structure:
        rounded_panel(d, [x, 1725, x + 660, 1905], fill="#f7efe0", radius=20, shadow=False)
        d.text((x + 30, 1752), ref, font=font(44, True), fill=rgba(BLUE, 255))
        for line in wrap_cn(text, F["body"], 590):
            d.text((x + 30, 1812), line, font=F["body"], fill=rgba(INK, 255))
            x_line = 0
        x += 710

    rounded_panel(d, [2460, 1800, 3718, 1958], fill="#fffdf7", radius=22, shadow=False)
    d.text((2500, 1835), "一句话总结", font=F["h1"], fill=rgba(GREEN, 255))
    d.text((2500, 1895), "复活的主借圣灵建立教会，并使福音从耶路撒冷传到万邦。", font=F["body"], fill=rgba(INK, 255))

    d.text((120, 2040), "学习用途信息图 · 经文出处按中文和合本章节编号标注", font=F["small"], fill=rgba(MUTED, 255))
    d.text((3370, 2040), "16:9 · 3840×2160", font=F["small"], fill=rgba(MUTED, 255))
    img.convert("RGB").save(OUT / "acts_background_purpose_4k_cn.png", quality=96)


def draw_chapter_card():
    img, d = base()
    draw_header(d, "使徒行传每章梗概", "写作时间：约主后60-62年 · 全书主线：徒1:8")

    rounded_panel(d, [2460, 105, 3718, 250], fill="#fffdf7", radius=28, shadow=False)
    d.text((2508, 137), "结构：耶路撒冷 → 犹太与撒玛利亚 → 直到地极", font=F["h2"], fill=rgba(BLUE, 255))
    d.text((2508, 188), "摘要刻意压缩，适合放入教学导图。", font=F["small"], fill=rgba(MUTED, 255))

    chapters = [
        ("1", "耶稣升天；应许圣灵；补选马提亚。"),
        ("2", "五旬节圣灵降临；彼得讲道；教会诞生。"),
        ("3", "美门瘸腿者得医治；彼得呼召悔改。"),
        ("4", "使徒受审仍放胆；教会同心祷告。"),
        ("5", "亚拿尼亚夫妇受审；使徒受逼迫仍传道。"),
        ("6", "设立七人；司提反被诬告。"),
        ("7", "司提反回顾历史并殉道。"),
        ("8", "逼迫使福音到撒玛利亚；埃提阿伯太监受洗。"),
        ("9", "扫罗归主；彼得医治以尼雅、使多加复活。"),
        ("10", "哥尼流一家归主；外邦人领受圣灵。"),
        ("11", "彼得解释外邦归主；安提阿教会兴起。"),
        ("12", "雅各殉道；彼得出监；神的道兴旺。"),
        ("13", "安提阿差派；第一次宣教旅程开始。"),
        ("14", "以哥念、路司得、特庇传道；坚固门徒。"),
        ("15", "耶路撒冷会议确认外邦人因恩得救。"),
        ("16", "马其顿异象；腓立比教会起始。"),
        ("17", "帖撒罗尼迦、庇哩亚、雅典作见证。"),
        ("18", "哥林多长期事奉；亚波罗受教。"),
        ("19", "以弗所事奉；主道兴旺；银匠骚乱。"),
        ("20", "坚固众教会；米利都劝勉长老。"),
        ("21", "保罗上耶路撒冷并被捕。"),
        ("22", "保罗向群众述说归主与蒙召。"),
        ("23", "主应许保罗到罗马作见证；押往凯撒利亚。"),
        ("24", "保罗在腓力斯前受审，被留监两年。"),
        ("25", "保罗向凯撒上诉。"),
        ("26", "保罗在亚基帕前见证复活主。"),
        ("27", "押往罗马途中遇风暴与海难。"),
        ("28", "马耳他获救；保罗在罗马放胆传道。"),
    ]

    col_x = [120, 1035, 1950, 2865]
    y0, row_h, col_w = 330, 210, 855
    colors = [BLUE, GREEN, PURPLE, RED]
    for idx, (num, summary) in enumerate(chapters):
        col = idx // 7
        row = idx % 7
        x = col_x[col]
        y = y0 + row * row_h
        c = colors[col]
        rounded_panel(d, [x, y, x + col_w, y + 165], fill="#fffaf0", radius=20)
        d.ellipse([x + 28, y + 38, x + 98, y + 108], fill=rgba(c, 255))
        d.text((x + 63, y + 53), num, font=F["chap_bold"], fill=rgba("#ffffff", 255), anchor="mm")
        d.text((x + 125, y + 30), f"第{num}章", font=F["chap_bold"], fill=rgba(c, 255))
        yy = y + 78
        for line in wrap_cn(summary, F["chap"], col_w - 160):
            d.text((x + 125, yy), line, font=F["chap"], fill=rgba(INK, 255))
            yy += 34

    labels = [
        (120, 1810, "徒1-7：耶路撒冷见证", BLUE),
        (1035, 1810, "徒8-12：福音越过边界", GREEN),
        (1950, 1810, "徒13-20：宣教与建立教会", PURPLE),
        (2865, 1810, "徒21-28：受审并到罗马", RED),
    ]
    for x, y, text, c in labels:
        rounded_panel(d, [x, y, x + 855, y + 108], fill="#fffdf7", radius=18, shadow=False)
        d.text((x + 34, y + 34), text, font=F["h2"], fill=rgba(c, 255))

    rounded_panel(d, [120, 1960, 3718, 2050], fill="#fffdf7", radius=18, shadow=False)
    d.text((160, 1987), "总线索：圣灵赐能力，教会在见证、逼迫、差派和受审中继续扩展，直到罗马仍“放胆传讲”。徒1:8；28:30-31", font=F["small"], fill=rgba(INK, 255))
    d.text((3370, 2075), "16:9 · 3840×2160", font=F["small"], fill=rgba(MUTED, 255))
    img.convert("RGB").save(OUT / "acts_chapter_overview_4k_cn.png", quality=96)


if __name__ == "__main__":
    draw_background_card()
    draw_chapter_card()
    print(OUT / "acts_background_purpose_4k_cn.png")
    print(OUT / "acts_chapter_overview_4k_cn.png")
