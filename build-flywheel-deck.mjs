import fs from "node:fs/promises";
import {
  Presentation,
  PresentationFile,
} from "file:///C:/Users/Mayn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const W = 1280;
const H = 720;
const OUT = "D:/UIUX/flywheel-go-deck-v0.2-redesign.pptx";
const PREVIEW_DIR = "D:/UIUX/flywheel-previews";
const baseline = JSON.parse(
  await fs.readFile("D:/UIUX/flywheel-text-baseline.json", "utf8"),
);

const C = {
  bg: "FAFAF9",
  bgBlue: "F6FAFF",
  card: "FFFFFF",
  line: "E5E7EB",
  lineBlue: "CFE1FF",
  text: "171310",
  muted: "464555",
  soft: "F1F5F9",
  softBlue: "EAF2FF",
  blue: "3B82F6",
  blueDark: "2563EB",
  green: "22C55E",
  amber: "F59E0B",
  pink: "EC4899",
  purple: "8B5CF6",
};

const presentation = Presentation.create({
  slideSize: { width: W, height: H },
});

function slideText(n) {
  return baseline[n - 1].texts.map((x) => x.text);
}

function addShape(slide, { left, top, width, height, fill = C.card, line = C.line, radius = 0, geometry = "rect", rotation = 0 }) {
  const shape = slide.shapes.add({
    geometry,
    position: { left, top, width, height, rotation },
    fill: fill ? { type: "solid", color: fill.replace("#", "") } : undefined,
    line: line ? { style: "solid", fill: line.replace("#", ""), width: 1 } : { width: 0 },
  });
  if (radius && (geometry === "rect" || geometry === "roundRect")) shape.borderRadius = radius;
  return shape;
}

function addText(slide, value, box, style = {}) {
  const shape = slide.shapes.add({
    geometry: "rect",
    position: box,
    line: { width: 0 },
  });
  shape.text.style = {
    typeface: style.typeface ?? "Aptos",
    fontSize: style.fontSize ?? 18,
    color: `#${(style.color ?? C.text).replace("#", "")}`,
    bold: style.bold ?? false,
    alignment: style.alignment ?? "left",
    verticalAlignment: style.verticalAlignment ?? "top",
  };
  shape.text = value;
  return shape;
}

function addFooter(slide, t, page) {
  addText(slide, t[t.length - 2], { left: 68, top: 676, width: 250, height: 22 }, { fontSize: 11, color: "8A8F98" });
  addText(slide, t[t.length - 1], { left: 1170, top: 674, width: 44, height: 24 }, { fontSize: 14, color: "8A8F98", bold: true, alignment: "right" });
  addShape(slide, { left: 68, top: 658, width: 72, height: 3, fill: page % 2 ? C.blue : C.text, line: null, radius: 2 });
}

function addChrome(slide, page, tinted = false) {
  addShape(slide, { left: 0, top: 0, width: W, height: H, fill: tinted ? C.bgBlue : C.bg, line: null });
  addShape(slide, { left: 978, top: -230, width: 430, height: 430, fill: "F2F7FF", line: null, geometry: "ellipse" });
  addShape(slide, { left: -188, top: 540, width: 300, height: 300, fill: tinted ? C.softBlue : C.soft, line: null, geometry: "ellipse" });
  addShape(slide, { left: 1110, top: 80, width: 54, height: 54, fill: "EDF5FF", line: "D8E7FF", radius: 27, geometry: "ellipse" });
  addText(slide, "Flywheel", { left: 88, top: 42, width: 110, height: 22 }, { fontSize: 14, bold: true, color: C.text });
  addShape(slide, { left: 68, top: 45, width: 16, height: 16, fill: C.text, line: null, geometry: "triangle", rotation: 180 });
}

function titleBlock(slide, t, width = 760) {
  addText(slide, t[0], { left: 68, top: 58, width, height: 24 }, { fontSize: 12, bold: true, color: C.blueDark });
  addText(slide, t[1], { left: 68, top: 88, width, height: 86 }, { fontSize: 36, bold: true, color: C.text, typeface: "Aptos Display" });
  addText(slide, t[2], { left: 70, top: 186, width: Math.min(width, 720), height: 70 }, { fontSize: 17, color: C.muted });
}

function pill(slide, label, left, top, width, color = C.blue) {
  addShape(slide, { left, top, width, height: 38, fill: "FFFFFF", line: "DCE8FF", radius: 19 });
  addShape(slide, { left: left + 12, top: top + 13, width: 12, height: 12, fill: color, line: null, geometry: "ellipse" });
  addText(slide, label, { left: left + 32, top: top + 9, width: width - 44, height: 18 }, { fontSize: 12, color: C.muted, bold: true });
}

function card(slide, { left, top, width, height, title, body, label, accent = C.blue, index }) {
  addShape(slide, { left, top, width, height, fill: C.card, line: C.line, radius: 14 });
  if (index) addText(slide, index, { left: left + 20, top: top + 18, width: 42, height: 28 }, { fontSize: 22, bold: true, color: accent });
  if (label) addText(slide, label, { left: left + 20, top: top + 18, width: width - 40, height: 18 }, { fontSize: 11, bold: true, color: accent });
  addText(slide, title, { left: left + 20, top: top + (label || index ? 50 : 24), width: width - 40, height: 42 }, { fontSize: 20, bold: true, color: C.text });
  addText(slide, body, { left: left + 20, top: top + (label || index ? 92 : 72), width: width - 40, height: height - 96 }, { fontSize: 13, color: C.muted });
}

async function dataUrl(path) {
  const bytes = await fs.readFile(path);
  return `data:image/png;base64,${Buffer.from(bytes).toString("base64")}`;
}

function image(slide, dataUrlValue, left, top, width, height, fit = "cover") {
  return slide.images.add({
    dataUrl: dataUrlValue,
    contentType: "image/png",
    alt: "Flywheel reference visual",
    position: { left, top, width, height },
    fit,
  });
}

const landingHero = await dataUrl("D:/UIUX/flywheel-assets/landing-hero.png");
const dashboardMain = await dataUrl("D:/UIUX/flywheel-assets/dashboard-main.png");
const landingCards = await dataUrl("D:/UIUX/flywheel-assets/landing-cards.png");

function s1() {
  const slide = presentation.slides.add();
  const t = slideText(1);
  addChrome(slide, 1, true);
  image(slide, landingHero, 530, 54, 690, 418, "cover");
  addShape(slide, { left: 520, top: 320, width: 720, height: 270, fill: "FAFAF9", line: null });
  addText(slide, t[0], { left: 68, top: 70, width: 220, height: 22 }, { fontSize: 13, bold: true, color: C.blueDark });
  addText(slide, t[1], { left: 68, top: 118, width: 630, height: 118 }, { fontSize: 42, bold: true, color: C.text, typeface: "Aptos Display" });
  addText(slide, t[2], { left: 70, top: 256, width: 560, height: 68 }, { fontSize: 18, color: C.muted });
  [t[3], t[4], t[5], t[6]].forEach((x, i) => pill(slide, x, 72 + i * 124, 360, 108, [C.blue, C.green, C.pink, C.amber][i]));
  addText(slide, t[7], { left: 72, top: 424, width: 560, height: 52 }, { fontSize: 17, color: C.muted });
  addShape(slide, { left: 72, top: 514, width: 206, height: 46, fill: C.text, line: null, radius: 8 });
  addText(slide, t[8], { left: 94, top: 526, width: 160, height: 20 }, { fontSize: 14, color: "FFFFFF", bold: true });
  addFooter(slide, t, 1);
}

function s2() {
  const slide = presentation.slides.add();
  const t = slideText(2);
  addChrome(slide, 2, false);
  titleBlock(slide, t, 760);
  const items = [[t[3], t[4]], [t[5], t[6]], [t[7], t[8]], [t[9], t[10]]];
  items.forEach(([a, b], i) => card(slide, { left: 72 + i * 244, top: 292, width: 212, height: 132, label: a, title: b, body: "", accent: [C.blue, C.green, C.pink, C.amber][i] }));
  addShape(slide, { left: 1018, top: 302, width: 124, height: 124, fill: C.softBlue, line: "D8E7FF", geometry: "ellipse" });
  addText(slide, t[11], { left: 1036, top: 328, width: 88, height: 26 }, { fontSize: 24, bold: true, alignment: "center", color: C.blueDark });
  addText(slide, t[12], { left: 1012, top: 420, width: 134, height: 24 }, { fontSize: 14, bold: true, alignment: "center", color: C.muted });
  card(slide, { left: 76, top: 486, width: 500, height: 116, title: t[13], body: t[14], accent: C.blue });
  card(slide, { left: 606, top: 486, width: 500, height: 116, title: t[15], body: t[16], accent: C.blue });
  addFooter(slide, t, 2);
}

function s3() {
  const slide = presentation.slides.add();
  const t = slideText(3);
  addChrome(slide, 3, false);
  titleBlock(slide, t, 820);
  const cols = [
    [t[3], t[4], t[5]],
    [t[6], t[7], t[8]],
    [t[9], t[10], t[11]],
  ];
  cols.forEach(([label, title, body], i) => {
    card(slide, { left: 76 + i * 374, top: 300, width: 328, height: 206, label, title, body, accent: [C.purple, C.blue, C.amber][i] });
  });
  addShape(slide, { left: 164, top: 548, width: 952, height: 54, fill: C.text, line: null, radius: 27 });
  addText(slide, t[12], { left: 194, top: 564, width: 892, height: 22 }, { fontSize: 15, color: "FFFFFF", bold: true, alignment: "center" });
  addFooter(slide, t, 3);
}

function s4() {
  const slide = presentation.slides.add();
  const t = slideText(4);
  addChrome(slide, 4, true);
  titleBlock(slide, t, 700);
  addShape(slide, { left: 550, top: 250, width: 180, height: 180, fill: C.blue, line: null, radius: 90, geometry: "ellipse" });
  addText(slide, t[3], { left: 585, top: 318, width: 110, height: 28 }, { fontSize: 24, bold: true, color: "FFFFFF", alignment: "center" });
  card(slide, { left: 810, top: 210, width: 330, height: 116, title: t[5], body: t[6], label: t[5], accent: C.green });
  card(slide, { left: 810, top: 354, width: 330, height: 116, title: t[7], body: t[8], label: t[7], accent: C.pink });
  card(slide, { left: 340, top: 472, width: 330, height: 116, title: t[9], body: t[10], label: t[9], accent: C.amber });
  addText(slide, t[4], { left: 420, top: 248, width: 330, height: 60 }, { fontSize: 15, color: C.muted, alignment: "center" });
  addShape(slide, { left: 446, top: 606, width: 388, height: 42, fill: C.text, line: null, radius: 21 });
  addText(slide, t[11], { left: 478, top: 618, width: 324, height: 18 }, { fontSize: 14, bold: true, color: "FFFFFF", alignment: "center" });
  addFooter(slide, t, 4);
}

function s5() {
  const slide = presentation.slides.add();
  const t = slideText(5);
  addChrome(slide, 5, false);
  titleBlock(slide, t, 780);
  const steps = [
    [t[3], t[4], t[5]], [t[6], t[7], t[8]], [t[9], t[10], t[11]], [t[12], t[13], t[14]],
    [t[15], t[16], t[17]], [t[18], t[19], t[20]], [t[21], t[22], t[23]],
  ];
  const start = 70;
  steps.forEach(([code, title, sub], i) => {
    const x = start + i * 166;
    addShape(slide, { left: x, top: 324, width: 126, height: 126, fill: i % 2 ? C.card : C.softBlue, line: "D8E7FF", radius: 63, geometry: "ellipse" });
    addText(slide, code, { left: x + 31, top: 344, width: 64, height: 20 }, { fontSize: 12, bold: true, color: C.blueDark, alignment: "center" });
    addText(slide, title, { left: x + 18, top: 378, width: 90, height: 24 }, { fontSize: 18, bold: true, color: C.text, alignment: "center" });
    addText(slide, sub, { left: x + 8, top: 414, width: 110, height: 32 }, { fontSize: 10, color: C.muted, alignment: "center" });
    if (i < steps.length - 1) addShape(slide, { left: x + 128, top: 383, width: 38, height: 4, fill: C.blue, line: null, radius: 2 });
  });
  addShape(slide, { left: 126, top: 526, width: 1028, height: 54, fill: C.text, line: null, radius: 27 });
  addText(slide, t[24], { left: 160, top: 542, width: 960, height: 20 }, { fontSize: 14, color: "FFFFFF", alignment: "center", bold: true });
  addFooter(slide, t, 5);
}

function s6() {
  const slide = presentation.slides.add();
  const t = slideText(6);
  addChrome(slide, 6, false);
  titleBlock(slide, t, 760);
  image(slide, dashboardMain, 720, 104, 448, 398, "cover");
  addShape(slide, { left: 714, top: 96, width: 460, height: 414, fill: null, line: C.blue, radius: 18 });
  const steps = [[t[3], t[4], t[5]], [t[6], t[7], t[8]], [t[9], t[10], t[11]], [t[12], t[13], t[14]]];
  steps.forEach(([num, title, body], i) => card(slide, { left: 78 + (i % 2) * 286, top: 310 + Math.floor(i / 2) * 132, width: 250, height: 108, index: num, title, body, accent: C.blue }));
  addText(slide, t[15], { left: 80, top: 592, width: 768, height: 30 }, { fontSize: 15, bold: true, color: C.blueDark });
  addFooter(slide, t, 6);
}

function s7() {
  const slide = presentation.slides.add();
  const t = slideText(7);
  addChrome(slide, 7, false);
  titleBlock(slide, t, 860);
  image(slide, landingCards, 704, 272, 456, 160, "cover");
  const areas = [[t[3], t[4]], [t[5], t[6]], [t[7], t[8]], [t[9], t[10]]];
  areas.forEach(([title, body], i) => card(slide, { left: 76 + (i % 2) * 304, top: 306 + Math.floor(i / 2) * 142, width: 268, height: 118, label: title, title, body, accent: [C.blue, C.green, C.pink, C.amber][i] }));
  addFooter(slide, t, 7);
}

function s8() {
  const slide = presentation.slides.add();
  const t = slideText(8);
  addChrome(slide, 8, true);
  titleBlock(slide, t, 760);
  const steps = [[t[3], t[4], t[5]], [t[6], t[7], t[8]], [t[9], t[10], t[11]], [t[12], t[13], t[14]]];
  steps.forEach(([num, title, body], i) => {
    const x = 120 + i * 278;
    addShape(slide, { left: x, top: 322, width: 88, height: 88, fill: C.blue, line: null, geometry: "ellipse" });
    addText(slide, num, { left: x + 32, top: 346, width: 24, height: 28 }, { fontSize: 26, bold: true, color: "FFFFFF", alignment: "center" });
    addText(slide, title, { left: x - 42, top: 434, width: 172, height: 28 }, { fontSize: 17, bold: true, color: C.text, alignment: "center" });
    addText(slide, body, { left: x - 62, top: 470, width: 212, height: 58 }, { fontSize: 12, color: C.muted, alignment: "center" });
    if (i < steps.length - 1) addShape(slide, { left: x + 98, top: 363, width: 170, height: 4, fill: C.lineBlue, line: null, radius: 2 });
  });
  addShape(slide, { left: 256, top: 586, width: 768, height: 42, fill: C.text, line: null, radius: 21 });
  addText(slide, t[15], { left: 286, top: 598, width: 708, height: 18 }, { fontSize: 14, color: "FFFFFF", bold: true, alignment: "center" });
  addFooter(slide, t, 8);
}

function s9() {
  const slide = presentation.slides.add();
  const t = slideText(9);
  addChrome(slide, 9, false);
  titleBlock(slide, t, 850);
  const lefts = [[t[3], t[4]], [t[5], t[6]], [t[7], t[8]]];
  lefts.forEach(([title, body], i) => card(slide, { left: 76, top: 286 + i * 110, width: 396, height: 92, title, body, accent: [C.blue, C.green, C.amber][i] }));
  addText(slide, t[9], { left: 560, top: 286, width: 440, height: 28 }, { fontSize: 22, bold: true, color: C.text });
  addText(slide, t[10], { left: 560, top: 322, width: 520, height: 38 }, { fontSize: 14, color: C.muted });
  const loop = [[t[11], t[12], t[13]], [t[14], t[15], t[16]], [t[17], t[18], t[19]], [t[20], t[21], t[22]], [t[23], t[24], t[25]]];
  loop.forEach(([num, title, body], i) => {
    const y = 384 + i * 48;
    addText(slide, num, { left: 560, top: y, width: 34, height: 18 }, { fontSize: 12, bold: true, color: C.blueDark });
    addText(slide, title, { left: 604, top: y - 4, width: 230, height: 20 }, { fontSize: 14, bold: true, color: C.text });
    addText(slide, body, { left: 846, top: y - 2, width: 300, height: 20 }, { fontSize: 11, color: C.muted });
  });
  addFooter(slide, t, 9);
}

function s10() {
  const slide = presentation.slides.add();
  const t = slideText(10);
  addChrome(slide, 10, false);
  titleBlock(slide, t, 830);
  const segs = [[t[3], t[4], t[5]], [t[6], t[7], t[8]], [t[9], t[10], t[11]]];
  segs.forEach(([label, title, body], i) => card(slide, { left: 86 + i * 384, top: 304, width: 334, height: 208, label, title, body, accent: [C.blue, C.green, C.amber][i] }));
  addShape(slide, { left: 176, top: 566, width: 928, height: 44, fill: C.text, line: null, radius: 22 });
  addText(slide, t[12], { left: 208, top: 578, width: 864, height: 18 }, { fontSize: 14, color: "FFFFFF", bold: true, alignment: "center" });
  addFooter(slide, t, 10);
}

function s11() {
  const slide = presentation.slides.add();
  const t = slideText(11);
  addChrome(slide, 11, true);
  titleBlock(slide, t, 860);
  const asks = [[t[3], t[4], t[5]], [t[6], t[7], t[8]], [t[9], t[10], t[11]]];
  asks.forEach(([label, title, body], i) => card(slide, { left: 88 + i * 374, top: 312, width: 328, height: 180, label, title, body, accent: [C.blue, C.green, C.purple][i] }));
  addShape(slide, { left: 174, top: 558, width: 932, height: 50, fill: C.text, line: null, radius: 25 });
  addText(slide, t[12], { left: 210, top: 573, width: 860, height: 18 }, { fontSize: 14, color: "FFFFFF", alignment: "center", bold: true });
  addFooter(slide, t, 11);
}

function s12() {
  const slide = presentation.slides.add();
  const t = slideText(12);
  addChrome(slide, 12, true);
  image(slide, landingHero, 500, 32, 740, 450, "cover");
  addShape(slide, { left: 0, top: 360, width: W, height: 360, fill: C.bgBlue, line: null });
  addText(slide, t[0], { left: 68, top: 58, width: 300, height: 24 }, { fontSize: 12, bold: true, color: C.blueDark });
  addText(slide, t[1], { left: 68, top: 130, width: 780, height: 132 }, { fontSize: 42, bold: true, color: C.text, typeface: "Aptos Display" });
  addText(slide, t[2], { left: 70, top: 286, width: 590, height: 52 }, { fontSize: 18, color: C.muted });
  addShape(slide, { left: 70, top: 400, width: 210, height: 44, fill: C.blue, line: null, radius: 8 });
  addText(slide, t[3], { left: 94, top: 412, width: 162, height: 18 }, { fontSize: 14, color: "FFFFFF", bold: true, alignment: "center" });
  addText(slide, t[4], { left: 70, top: 470, width: 650, height: 34 }, { fontSize: 17, color: C.text, bold: true });
  addText(slide, t[5], { left: 70, top: 524, width: 380, height: 24 }, { fontSize: 15, color: C.blueDark, bold: true });
  addText(slide, t[6], { left: 70, top: 578, width: 700, height: 28 }, { fontSize: 15, color: C.muted });
  addFooter(slide, t, 12);
}

[s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12].forEach((fn) => fn());

await fs.mkdir(PREVIEW_DIR, { recursive: true });
const pptx = await PresentationFile.exportPptx(presentation);
await pptx.save(OUT);

for (const [i, slide] of presentation.slides.items.entries()) {
  const png = await slide.export({ format: "png" });
  await fs.writeFile(`${PREVIEW_DIR}/slide-${String(i + 1).padStart(2, "0")}.png`, new Uint8Array(await png.arrayBuffer()));
}

console.log(JSON.stringify({ output: OUT, previews: PREVIEW_DIR, slides: presentation.slides.count }, null, 2));
