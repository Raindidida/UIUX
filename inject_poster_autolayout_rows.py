"""Generate Figma plugin JS: insert Animoca Minds + OpenCheck into horizontal auto-layout sponsor rows (1920 posters)."""
import json
import re

b64 = open("opencheck_b64_small.txt", "r", encoding="ascii").read().strip()
svg = open(r"d:\下载\Telegram Desktop\animoca-minds-logo.svg", "r", encoding="utf-8").read()
svg = svg.replace('fill="white"', 'fill="#0B2731"')
svg = re.sub(r"<clipPath[^>]+>.*?</clipPath>", "", svg, flags=re.S)
svg = re.sub(r'\sclip-path="url\(#clip0_418_41\)"', "", svg)
svg_min = re.sub(r">\s+<", "><", svg)

# Horizontal auto-layout rows that contain Nansen (1920x1080 variants + one wide frame)
ROW_IDS = ["88:111", "2:2376", "88:550", "88:998", "117:88"]

js = f"""
const ROW_IDS = {json.dumps(ROW_IDS)};
const ANIM_SVG = {json.dumps(svg_min)};
const B64 = {json.dumps(b64)};

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

function prepAutoLayoutChild(n) {{
  try {{
    if ('layoutSizingHorizontal' in n) n.layoutSizingHorizontal = 'HUG';
    if ('layoutSizingVertical' in n) n.layoutSizingVertical = 'HUG';
    if ('layoutAlign' in n) n.layoutAlign = 'CENTER';
  }} catch (e) {{}}
}}

const bytes = _b64ToBytes(B64);
const sharedImg = figma.createImage(bytes);
const {{ width: iw, height: ih }} = await sharedImg.getSizeAsync();
const results = [];

for (const rowId of ROW_IDS) {{
  const row = await figma.getNodeByIdAsync(rowId);
  if (!row || !('children' in row)) {{
    results.push({{ rowId, err: 'missing row' }});
    continue;
  }}
  for (const n of [...row.children]) {{
    if (n.name === 'Animoca Minds Logo' || n.name === 'OpenCheck Logo') n.remove();
  }}
  const anim = figma.createNodeFromSvg(ANIM_SVG);
  anim.name = 'Animoca Minds Logo';
  const targetH = Math.min(36, Math.max(20, row.height - 8));
  anim.resize(anim.width * (targetH / anim.height), targetH);
  prepAutoLayoutChild(anim);

  const oc = figma.createRectangle();
  oc.name = 'OpenCheck Logo';
  const ocH = targetH;
  const ocW = (iw / ih) * ocH;
  if (!Number.isFinite(ocW) || ocW <= 0) throw new Error('OpenCheck image size');
  oc.resize(ocW, ocH);
  oc.fills = [{{ type: 'IMAGE', imageHash: sharedImg.hash, scaleMode: 'FIT' }}];
  prepAutoLayoutChild(oc);

  row.appendChild(anim);
  row.appendChild(oc);
  results.push({{ rowId, ok: true, animId: anim.id, ocId: oc.id, rowW: row.width }});
}}

return {{ ok: true, results }};
"""

open("_figma_poster_autolayout_inject.js", "w", encoding="utf-8").write(js)
print("chars", len(js))
