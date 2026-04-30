import json

b64 = open("opencheck_b64_small.txt", "r", encoding="ascii").read().strip()

js = f"""const SPONSOR_ROW = await figma.getNodeByIdAsync('1:78');
const WRAP = await figma.getNodeByIdAsync('1:77');
const OUTER = await figma.getNodeByIdAsync('1:75');
const COORG = await figma.getNodeByIdAsync('1:146');
if (!SPONSOR_ROW || !WRAP || !OUTER || !COORG) throw new Error('missing nodes');

for (const n of [...SPONSOR_ROW.children]) {{
  if (n.name === 'OpenCheck Logo') n.remove();
}}

let anim = null;
for (const c of SPONSOR_ROW.children) {{
  if (c.name === 'Animoca Minds Logo') {{ anim = c; break; }}
}}
if (!anim) throw new Error('Animoca Minds Logo not found');

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
const gap = 20;
oc.x = anim.x + anim.width + gap;
oc.y = 787 + (43 - ocH) / 2;
SPONSOR_ROW.appendChild(oc);

const addW = gap + oc.width;
SPONSOR_ROW.resize(SPONSOR_ROW.width + addW, SPONSOR_ROW.height);
WRAP.resize(WRAP.width + addW, WRAP.height);
OUTER.resize(OUTER.width + addW, OUTER.height);
COORG.x += addW;

return {{ ok: true, ocW: oc.width, addW, ocId: oc.id }};
"""

open("_figma_inject_opencheck.js", "w", encoding="utf-8").write(js)
print("chars", len(js))
