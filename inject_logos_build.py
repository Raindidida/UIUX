import json
import re

b64 = open("opencheck_b64_small.txt", "r", encoding="ascii").read().strip()
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
  if (n.name === 'Animoca Minds Logo' || n.name === 'OpenCheck Logo') n.remove();
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

function _b64ToBytes(b64) {{
  const g = globalThis;
  if (typeof g.atob === 'function') {{
    const bin = g.atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }}
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes = [];
  let charbuf = 0, bits = 0;
  for (let i = 0; i < b64.length; i++) {{
    const c = b64[i];
    if (c === '=') break;
    const v = A.indexOf(c);
    if (v < 0) continue;
    charbuf = (charbuf << 6) | v;
    bits += 6;
    if (bits >= 8) {{
      bits -= 8;
      bytes.push((charbuf >>> bits) & 255);
    }}
  }}
  return new Uint8Array(bytes);
}}
const bytes = _b64ToBytes({json.dumps(b64)});
const img = figma.createImage(bytes);
const {{ width: iw, height: ih }} = await img.getSizeAsync();
const oc = figma.createRectangle();
oc.name = 'OpenCheck Logo';
const ocH = 28;
const ocW = (iw / ih) * ocH;
if (!Number.isFinite(ocW) || ocW <= 0) throw new Error('OpenCheck image size');
oc.resize(ocW, ocH);
oc.fills = [{{ type: 'IMAGE', imageHash: img.hash, scaleMode: 'FIT' }}];
oc.x = anim.x + anim.width + gap;
oc.y = 787 + (43 - ocH) / 2;
SPONSOR_ROW.appendChild(oc);

const addW = gap + anim.width + gap + oc.width;
SPONSOR_ROW.resize(SPONSOR_ROW.width + addW, SPONSOR_ROW.height);
WRAP.resize(WRAP.width + addW, WRAP.height);
OUTER.resize(OUTER.width + addW, OUTER.height);
COORG.x += addW;

return {{ ok: true, animW: anim.width, ocW: oc.width, addW, animId: anim.id, ocId: oc.id }};
"""

open("_figma_logo_inject.js", "w", encoding="utf-8").write(js)
print("chars", len(js))
