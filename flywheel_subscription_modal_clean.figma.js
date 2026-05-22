// Figma Plugin API script.
// Builds a Flywheel subscription modal concept beside the current canvas content.
// All major containers use auto layout and clean layer names.

const FONT_REG = { family: "Inter", style: "Regular" };
const FONT_MED = { family: "Inter", style: "Medium" };
const FONT_SEMI = { family: "Inter", style: "Semi Bold" };
const FONT_BOLD = { family: "Inter", style: "Bold" };

await Promise.all([
  figma.loadFontAsync(FONT_REG),
  figma.loadFontAsync(FONT_MED),
  figma.loadFontAsync(FONT_SEMI),
  figma.loadFontAsync(FONT_BOLD),
]);

const targetPage = figma.root.children.find((page) => page.id === "85:2200" || page.name === "Dashboard");
if (!targetPage) throw new Error("Target page Dashboard / 85:2200 was not found.");
await figma.setCurrentPageAsync(targetPage);

const c = {
  canvas: "#F3F4F6",
  app: "#F8FAFC",
  white: "#FFFFFF",
  ink: "#111827",
  black: "#0B0D12",
  muted: "#6B7280",
  faint: "#9CA3AF",
  border: "#E5E7EB",
  blue: "#1D72F3",
  blueSoft: "#EFF6FF",
  green: "#12A66A",
  greenSoft: "#EAFBF3",
  purpleSoft: "#F4E8FF",
  purple: "#7C3AED",
};

function rgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

function fill(hex, opacity = 1) {
  return [{ type: "SOLID", color: rgb(hex), opacity }];
}

function effects() {
  return [{
    type: "DROP_SHADOW",
    color: { ...rgb("#111827"), a: 0.14 },
    offset: { x: 0, y: 18 },
    radius: 48,
    spread: -10,
    visible: true,
    blendMode: "NORMAL",
  }];
}

function frame(name, w, h, props = {}) {
  const node = figma.createFrame();
  node.name = name;
  node.resize(w, h);
  node.fills = props.transparent ? [] : fill(props.fill || c.white, props.opacity ?? 1);
  node.strokes = props.stroke ? fill(props.stroke) : [];
  node.strokeWeight = props.strokeWeight ?? 1;
  node.cornerRadius = props.radius ?? 0;
  node.clipsContent = props.clipsContent ?? false;
  if (props.effects) node.effects = props.effects;
  if (props.layout) {
    node.layoutMode = props.layout;
    node.itemSpacing = props.gap ?? 0;
    node.paddingTop = props.pt ?? props.p ?? 0;
    node.paddingRight = props.pr ?? props.p ?? 0;
    node.paddingBottom = props.pb ?? props.p ?? 0;
    node.paddingLeft = props.pl ?? props.p ?? 0;
    node.primaryAxisSizingMode = props.primarySize || "AUTO";
    node.counterAxisSizingMode = props.counterSize || "FIXED";
    node.primaryAxisAlignItems = props.primary || "MIN";
    node.counterAxisAlignItems = props.counter || "MIN";
  }
  return node;
}

function txt(name, value, size, color = c.ink, font = FONT_REG, props = {}) {
  const node = figma.createText();
  node.name = name;
  node.fontName = font;
  node.characters = value;
  node.fontSize = size;
  node.fills = fill(color);
  node.lineHeight = { unit: "PIXELS", value: props.lh || Math.round(size * 1.35) };
  node.letterSpacing = { unit: "PIXELS", value: 0 };
  node.textAlignHorizontal = props.align || "LEFT";
  node.textAutoResize = "WIDTH_AND_HEIGHT";
  if (props.width) {
    node.resize(props.width, props.height || node.height);
    node.textAutoResize = "HEIGHT";
  }
  return node;
}

function add(parent, child, sizing = {}) {
  parent.appendChild(child);
  if (sizing.h) child.layoutSizingHorizontal = sizing.h;
  if (sizing.v) child.layoutSizingVertical = sizing.v;
  return child;
}

function button(name, label, primary = false) {
  const node = frame(name, 160, 40, {
    layout: "HORIZONTAL",
    radius: 7,
    fill: primary ? c.blue : c.white,
    stroke: primary ? c.blue : c.border,
    primary: "CENTER",
    counter: "CENTER",
    counterSize: "FIXED",
  });
  add(node, txt("Label", label, 14, primary ? c.white : c.ink, FONT_SEMI));
  return node;
}

function statusPill() {
  const pill = frame("Status pill / Campaign ready", 132, 24, {
    layout: "HORIZONTAL",
    gap: 7,
    pt: 5,
    pr: 10,
    pb: 5,
    pl: 10,
    radius: 999,
    fill: c.greenSoft,
    primary: "CENTER",
    counter: "CENTER",
    counterSize: "AUTO",
  });
  const dot = figma.createEllipse();
  dot.name = "Dot";
  dot.resize(7, 7);
  dot.fills = fill(c.green);
  add(pill, dot);
  add(pill, txt("Label", "Campaign ready", 12, "#166534", FONT_MED));
  return pill;
}

function circleText(name, label, bg = c.blue, fg = c.white) {
  const node = frame(name, 16, 16, {
    layout: "HORIZONTAL",
    radius: 99,
    fill: bg,
    primary: "CENTER",
    counter: "CENTER",
  });
  add(node, txt("Glyph", label, 9, fg, FONT_BOLD));
  return node;
}

function lineIcon(name) {
  const icon = frame(`Icon / ${name}`, 20, 20, { transparent: true });
  const box = figma.createRectangle();
  box.name = "Outline";
  box.resize(18, 18);
  box.x = 1;
  box.y = 1;
  box.cornerRadius = 4;
  box.fills = [];
  box.strokes = fill(c.blue);
  box.strokeWeight = 1.4;
  icon.appendChild(box);
  return icon;
}

function summaryRow(title, detail, iconName) {
  const row = frame(`Summary row / ${title}`, 592, 24, {
    layout: "HORIZONTAL",
    gap: 14,
    transparent: true,
    counter: "CENTER",
    counterSize: "AUTO",
  });
  add(row, lineIcon(iconName));
  const label = txt("Title", title, 14, c.ink, FONT_SEMI);
  label.resize(190, label.height);
  add(row, label);
  add(row, txt("Detail", detail, 13, c.muted, FONT_REG), { h: "FILL" });
  return row;
}

function benefit(label, selected) {
  const row = frame(`Benefit / ${label}`, 248, 18, {
    layout: "HORIZONTAL",
    gap: 8,
    transparent: true,
    counter: "CENTER",
    counterSize: "AUTO",
  });
  add(row, circleText("Check", "v", selected ? c.blue : c.faint));
  add(row, txt("Label", label, 12, c.ink, FONT_REG));
  return row;
}

function planCard(name, title, tag, copy, benefits, selected) {
  const card = frame(`Plan card / ${name}`, 290, 252, {
    layout: "VERTICAL",
    gap: 14,
    p: 16,
    radius: 8,
    fill: selected ? "#FBFDFF" : c.white,
    stroke: selected ? c.blue : c.border,
    counterSize: "FIXED",
  });

  const top = frame("Header", 258, 38, {
    layout: "HORIZONTAL",
    transparent: true,
    counter: "CENTER",
    counterSize: "AUTO",
  });
  const left = frame("Title stack", 150, 38, { layout: "VERTICAL", gap: 5, transparent: true });
  add(left, txt("Plan name", title, 18, c.ink, FONT_SEMI));
  const tagNode = frame("Role tag", 84, 22, {
    layout: "HORIZONTAL",
    pt: 4,
    pr: 8,
    pb: 4,
    pl: 8,
    radius: 99,
    fill: selected ? c.blueSoft : c.purpleSoft,
    primary: "CENTER",
    counter: "CENTER",
    counterSize: "AUTO",
  });
  add(tagNode, txt("Label", tag, 11, selected ? c.blue : c.purple, FONT_MED));
  add(left, tagNode);
  add(top, left, { h: "FILL" });

  if (selected) {
    const badge = frame("Badge / Recommended", 96, 22, {
      layout: "HORIZONTAL",
      gap: 4,
      pt: 4,
      pr: 8,
      pb: 4,
      pl: 8,
      radius: 99,
      fill: c.blue,
      primary: "CENTER",
      counter: "CENTER",
      counterSize: "AUTO",
    });
    add(badge, circleText("Icon", "v", c.white, c.blue));
    add(badge, txt("Label", "Recommended", 10, c.white, FONT_SEMI));
    add(top, badge);
  }

  add(card, top, { h: "FILL" });
  add(card, txt("Description", copy, 13, c.muted, FONT_REG, { width: 258, lh: 18 }));

  const list = frame("Included benefits", 258, 86, { layout: "VERTICAL", gap: 8, transparent: true });
  for (const item of benefits) add(list, benefit(item, selected), { h: "FILL" });
  add(card, list, { h: "FILL" });

  const action = button(selected ? "Button / Start Pro" : "Button / Stay Free", selected ? "Start Pro and execute" : "Stay on Free", selected);
  action.resize(258, 36);
  add(card, action, { h: "FILL" });
  return card;
}

function trustItem(title, copy, glyph) {
  const item = frame(`Trust item / ${title}`, 186, 58, {
    layout: "HORIZONTAL",
    gap: 10,
    transparent: true,
    counterSize: "AUTO",
  });
  const icon = frame("Icon", 24, 24, {
    layout: "HORIZONTAL",
    radius: 99,
    fill: c.white,
    stroke: c.border,
    primary: "CENTER",
    counter: "CENTER",
  });
  add(icon, txt("Glyph", glyph, 12, c.ink, FONT_SEMI));
  add(item, icon);
  const stack = frame("Copy", 150, 58, { layout: "VERTICAL", gap: 3, transparent: true });
  add(stack, txt("Title", title, 12, c.ink, FONT_SEMI));
  add(stack, txt("Detail", copy, 11, c.muted, FONT_REG, { width: 150, lh: 15 }));
  add(item, stack, { h: "FILL" });
  return item;
}

function planBackdrop() {
  const bg = frame("Reference backdrop / Campaign plan", 960, 690, {
    layout: "HORIZONTAL",
    fill: c.canvas,
  });
  const sidebar = frame("Sidebar", 174, 690, {
    layout: "VERTICAL",
    gap: 16,
    p: 24,
    fill: c.white,
    stroke: c.border,
    counterSize: "FIXED",
  });
  add(sidebar, txt("Brand", "Flywheel", 18, c.ink, FONT_BOLD));
  for (const label of ["Dashboard", "Campaigns", "Content", "Knowledge", "Team", "Settings"]) {
    const nav = frame(`Nav item / ${label}`, 126, 34, {
      layout: "HORIZONTAL",
      pl: 10,
      pr: 10,
      radius: 6,
      fill: label === "Campaigns" ? c.blueSoft : c.white,
      primary: "CENTER",
      counter: "CENTER",
    });
    add(nav, txt("Label", label, 12, label === "Campaigns" ? c.blue : c.muted, FONT_MED));
    add(sidebar, nav, { h: "FILL" });
  }

  const main = frame("Plan content", 786, 690, {
    layout: "VERTICAL",
    gap: 18,
    p: 30,
    fill: c.app,
    counterSize: "FIXED",
  });
  const header = frame("Header", 726, 44, {
    layout: "HORIZONTAL",
    transparent: true,
    counter: "CENTER",
  });
  add(header, txt("Title", "30-Day Growth Strategy for kcex", 18, c.ink, FONT_BOLD), { h: "FILL" });
  const start = button("Button / Start execution", "Start execution", true);
  start.resize(140, 36);
  add(header, start);
  add(main, header, { h: "FILL" });

  const grid = frame("Plan cards", 726, 560, { layout: "HORIZONTAL", gap: 18, transparent: true });
  for (const col of ["Campaign brief", "Specialist assignments"]) {
    const card = frame(`Content card / ${col}`, 354, 240, {
      layout: "VERTICAL",
      gap: 12,
      p: 20,
      radius: 8,
      fill: c.white,
      stroke: c.border,
    });
    add(card, txt("Title", col, 15, c.ink, FONT_BOLD));
    for (const line of ["Objective", "Target audience", "Key message", "Success metrics"]) {
      add(card, txt(`Metadata / ${line}`, line, 12, c.muted, FONT_MED));
    }
    add(grid, card);
  }
  add(main, grid, { h: "FILL" });
  add(bg, sidebar);
  add(bg, main);
  bg.opacity = 0.35;
  return bg;
}

function findPosition() {
  const paymentAnchor = figma.getNodeById("3007:37031");
  if (paymentAnchor && "x" in paymentAnchor && "y" in paymentAnchor) {
    return { x: paymentAnchor.x + 420, y: paymentAnchor.y - 360 };
  }
  const plansAnchor = figma.getNodeById("2901:28247");
  if (plansAnchor && "x" in plansAnchor && "y" in plansAnchor) {
    return { x: plansAnchor.x + 3150, y: plansAnchor.y + 120 };
  }
  let maxX = 0;
  for (const node of figma.currentPage.children) maxX = Math.max(maxX, node.x + node.width);
  return { x: maxX + 96, y: 80 };
}

const createdNodeIds = [];
const board = frame("Subscription modal concept / Flywheel", 960, 690, {
  layout: "HORIZONTAL",
  fill: c.canvas,
  primary: "CENTER",
  counter: "CENTER",
});
const pos = findPosition();
board.x = pos.x;
board.y = pos.y;
figma.currentPage.appendChild(board);
createdNodeIds.push(board.id);

add(board, planBackdrop());

const overlay = frame("Overlay scrim", 960, 690, {
  layout: "HORIZONTAL",
  fill: "#111827",
  opacity: 0.34,
  primary: "CENTER",
  counter: "CENTER",
});
overlay.x = 0;
overlay.y = 0;
board.appendChild(overlay);
createdNodeIds.push(overlay.id);

const modal = frame("Modal / Subscription unlock", 680, 578, {
  layout: "VERTICAL",
  gap: 16,
  pt: 24,
  pr: 28,
  pb: 24,
  pl: 28,
  radius: 12,
  fill: c.white,
  stroke: c.border,
  effects: effects(),
  counterSize: "FIXED",
});
modal.x = 140;
modal.y = 56;
board.appendChild(modal);
createdNodeIds.push(modal.id);

const header = frame("Header", 624, 26, { layout: "HORIZONTAL", transparent: true, counter: "CENTER", counterSize: "AUTO" });
const brand = frame("Brand", 160, 26, { layout: "HORIZONTAL", gap: 8, transparent: true, counter: "CENTER" });
const logo = figma.createPolygon();
logo.name = "Logo mark";
logo.resize(24, 20);
logo.pointCount = 3;
logo.rotation = 180;
logo.fills = fill(c.black);
add(brand, logo);
add(brand, txt("Wordmark", "Flywheel", 18, c.ink, FONT_BOLD));
add(header, brand, { h: "FILL" });
add(header, txt("Close", "X", 18, c.ink, FONT_REG));
add(modal, header, { h: "FILL" });

const hero = frame("Hero copy", 624, 78, {
  layout: "VERTICAL",
  gap: 9,
  transparent: true,
  primary: "CENTER",
  counter: "CENTER",
});
add(hero, statusPill());
add(hero, txt("Title", "Your CMO is ready to start executing", 26, c.ink, FONT_BOLD, { align: "CENTER" }));
add(hero, txt("Subtitle", "The first week is planned. Unlock execution so your specialist team can begin.", 14, c.muted, FONT_REG, { align: "CENTER" }));
add(modal, hero, { h: "FILL" });

const summary = frame("Execution summary", 624, 104, {
  layout: "VERTICAL",
  gap: 14,
  p: 16,
  radius: 8,
  fill: c.white,
  stroke: c.border,
  counterSize: "FIXED",
});
add(summary, summaryRow("First week scheduled", "5 tasks ready", "calendar"), { h: "FILL" });
add(summary, summaryRow("Specialist team assigned", "Content Specialist, Social Media, Growth Analyst", "team"), { h: "FILL" });
add(summary, summaryRow("First draft queued", "Review before anything goes live", "draft"), { h: "FILL" });
add(modal, summary, { h: "FILL" });

add(modal, txt("Section label", "Choose how you want to move forward", 14, c.ink, FONT_SEMI));

const plans = frame("Plan comparison", 624, 252, { layout: "HORIZONTAL", gap: 14, transparent: true });
add(plans, planCard("Free", "Free", "CMO advisor", "Keep planning and preview the Campaign.", ["Strategy saved", "Execution paused", "Manual next steps"], false), { h: "FILL" });
add(plans, planCard("Pro", "Pro", "CMO operator", "Let CMO and specialists execute this Campaign.", ["Start Campaign execution", "Generate full content", "Connect channels", "Track results"], true), { h: "FILL" });
add(modal, plans, { h: "FILL" });

const note = frame("Value note", 624, 40, {
  layout: "HORIZONTAL",
  gap: 10,
  pt: 10,
  pr: 12,
  pb: 10,
  pl: 12,
  radius: 7,
  fill: c.white,
  stroke: c.border,
  counter: "CENTER",
});
add(note, txt("Spark", "*", 14, c.blue, FONT_BOLD));
add(note, txt("Copy", "Flywheel: Continuous growth engine for ongoing optimization across multiple Campaigns.", 11, c.ink, FONT_REG), { h: "FILL" });
add(note, txt("Link", "Learn more", 11, c.blue, FONT_MED));
add(modal, note, { h: "FILL" });

const trust = frame("Trust row", 624, 58, { layout: "HORIZONTAL", gap: 18, transparent: true });
add(trust, trustItem("7-day refund guarantee", "Get a full refund within 7 days.", "7d"), { h: "FILL" });
add(trust, trustItem("Cancel anytime", "No long-term commitment.", "R"), { h: "FILL" });
add(trust, trustItem("Fair usage", "Credits are shown later for clarity.", "i"), { h: "FILL" });
add(modal, trust, { h: "FILL" });

const divider = figma.createLine();
divider.name = "Divider";
divider.resize(624, 0);
divider.strokes = fill(c.border);
divider.strokeWeight = 1;
add(modal, divider, { h: "FILL" });

const checkout = frame("Checkout row", 624, 34, { layout: "HORIZONTAL", gap: 10, transparent: true, counter: "CENTER" });
add(checkout, txt("Secure note", "Secure checkout. Multiple ways to pay.", 11, c.muted, FONT_REG), { h: "FILL" });
for (const label of ["Card", "Pay", "More options"]) {
  const chip = frame(`Payment option / ${label}`, label === "More options" ? 118 : 78, 30, {
    layout: "HORIZONTAL",
    gap: 6,
    radius: 7,
    fill: c.white,
    stroke: c.border,
    primary: "CENTER",
    counter: "CENTER",
  });
  add(chip, txt("Label", label, 11, c.ink, FONT_MED));
  add(checkout, chip);
}
add(modal, checkout, { h: "FILL" });

const cta = button("Button / Primary CTA", "Start Pro and execute", true);
cta.resize(624, 40);
add(modal, cta, { h: "FILL" });

add(modal, txt("Text button / Keep as draft", "Keep as draft", 12, c.blue, FONT_MED, { align: "CENTER" }));

figma.currentPage.selection = [board];
figma.viewport.scrollAndZoomIntoView([board]);

return {
  ok: true,
  createdNodeIds,
  boardId: board.id,
  modalId: modal.id,
  message: "Created Flywheel subscription modal concept with auto layout and clean layer names.",
};
