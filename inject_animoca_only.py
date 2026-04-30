import json
import re

svg = open(r"d:\下载\Telegram Desktop\animoca-minds-logo.svg", "r", encoding="utf-8").read()
svg = svg.replace('fill="white"', 'fill="#0B2731"')
svg = re.sub(r"<clipPath[^>]+>.*?</clipPath>", "", svg, flags=re.S)
svg = re.sub(r'\sclip-path="url\(#clip0_418_41\)"', "", svg)
svg_min = re.sub(r">\s+<", "><", svg)

js = f"""const SPONSOR_ROW = await figma.getNodeByIdAsync('1:78');
const WRAP = await figma.getNodeByIdAsync('1:77');
const OUTER = await figma.getNodeByIdAsync('1:75');
const COORG = await figma.getNodeByIdAsync('1:146');
if (!SPONSOR_ROW || !WRAP || !OUTER || !COORG) throw new Error('missing nodes');

for (const n of [...SPONSOR_ROW.children]) {{
  if (n.name === 'Animoca Minds Logo') n.remove();
}}

const ANIM_SVG = {json.dumps(svg_min)};
const anim = figma.createNodeFromSvg(ANIM_SVG);
anim.name = 'Animoca Minds Logo';
const H = 28;
anim.resize(anim.width * (H / anim.height), H);
const lastX = 842 + 109;
const gap = 20;
anim.x = lastX + gap;
anim.y = 787 + (43 - H) / 2;
SPONSOR_ROW.appendChild(anim);

const addW = gap + anim.width;
SPONSOR_ROW.resize(SPONSOR_ROW.width + addW, SPONSOR_ROW.height);
WRAP.resize(WRAP.width + addW, WRAP.height);
OUTER.resize(OUTER.width + addW, OUTER.height);
COORG.x += addW;

return {{ ok: true, animW: anim.width, addW, animId: anim.id }};
"""

open("_figma_inject_animoca.js", "w", encoding="utf-8").write(js)
print("chars", len(js))
