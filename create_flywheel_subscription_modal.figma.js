// Figma Plugin API script.
// Creates a Flywheel subscription modal mockup beside the current canvas content.

const FONT = { family: "Inter", style: "Regular" };
const FONT_MEDIUM = { family: "Inter", style: "Medium" };
const FONT_SEMIBOLD = { family: "Inter", style: "Semi Bold" };
const FONT_BOLD = { family: "Inter", style: "Bold" };

await Promise.all([
  figma.loadFontAsync(FONT),
  figma.loadFontAsync(FONT_MEDIUM),
  figma.loadFontAsync(FONT_SEMIBOLD),
  figma.loadFontAsync(FONT_BOLD),
]);

const colors = {
  canvas: "#F3F4F6",
  white: "#FFFFFF",
  black: "#0B0D12",
  text: "#111827",
  muted: "#6B7280",
  subtle: "#9CA3AF",
  border: "#E5E7EB",
  borderStrong: "#D1D5DB",
  blue: "#1D72F3",
  blueSoft: "#EFF6FF",
  blueBorder: "#93C5FD",
  green: "#12A66A",
  greenSoft: "#EAFBF3",
  purpleSoft: "#F4E8FF",
  purpleText: "#7C3AED",
  shadow: "#111827",
};

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const value = parseInt(normalized, 16);
  return {
    r: ((value >> 16) & 255) / 255,
    g: ((value >> 8) & 255) / 255,
    b: (value & 255) / 255,
  };
}

function solid(hex, opacity = 1) {
  return [{ type: "SOLID", color: hexToRgb(hex), opacity }];
}

function shadow(y = 18, blur = 48, opacity = 0.14) {
  return [
    {
      type: "DROP_SHADOW",
      color: { ...hexToRgb(colors.shadow), a: opacity },
      offset: { x: 0, y },
      radius: blur,
      spread: -10,
      visible: true,
      blendMode: "NORMAL",
    },
  ];
}

function frame(name, width, height, options = {}) {
  const node = figma.createFrame();
  node.name = name;
  node.resize(width, height);
  node.fills = solid(options.fill || colors.white, options.opacity ?? 1);
  node.strokes = options.stroke ? solid(options.stroke) : [];
  node.strokeWeight = options.strokeWeight ?? 1;
  node.cornerRadius = options.radius ?? 0;
  node.clipsContent = options.clipsContent ?? false;
  if (options.effects) node.effects = options.effects;
  if (options.layoutMode) {
    node.layoutMode = options.layoutMode;
    node.itemSpacing = options.gap ?? 0;
    node.paddingTop = options.paddingTop ?? options.padding ?? 0;
    node.paddingRight = options.paddingRight ?? options.padding ?? 0;
    node.paddingBottom = options.paddingBottom ?? options.padding ?? 0;
    node.paddingLeft = options.paddingLeft ?? options.padding ?? 0;
    node.primaryAxisSizingMode = options.primaryAxisSizingMode || "AUTO";
    node.counterAxisSizingMode = options.counterAxisSizingMode || "FIXED";
    node.primaryAxisAlignItems = options.primaryAxisAlignItems || "MIN";
    node.counterAxisAlignItems = options.counterAxisAlignItems || "MIN";
  }
  return node;
}

function text(name, content, size, color = colors.text, weight = FONT, options = {}) {
  const node = figma.createText();
  node.name = name;
  node.fontName = weight;
  node.characters = content;
  node.fontSize = size;
  node.fills = solid(color);
  node.lineHeight = { unit: "PIXELS", value: options.lineHeight || Math.round(size * 1.35) };
  node.letterSpacing = { unit: "PIXELS", value: 0 };
  node.textAlignHorizontal = options.align || "LEFT";
  node.textAutoResize = options.autoResize || "WIDTH_AND_HEIGHT";
  if (options.width) {
    node.resize(options.width, options.height || node.height);
    node.textAutoResize = "HEIGHT";
  }
  return node;
}

function append(parent, child, sizing = {}) {
  parent.appendChild(child);
  if (sizing.h) child.layoutSizingHorizontal = sizing.h;
  if (sizing.v) child.layoutSizingVertical = sizing.v;
  return child;
}

function pill(name, label, dotColor, fillColor, textColor = colors.text) {
  const node = frame(name, 10, 10, {
    layoutMode: "HORIZONTAL",
    gap: 6,
    paddingTop: 5,
    paddingRight: 10,
    paddingBottom: 5,
    paddingLeft: 10,
    radius: 99,
    fill: fillColor,
    counterAxisSizingMode: "AUTO",
    counterAxisAlignItems: "CENTER",
  });
  const dot = figma.createEllipse();
  dot.name = "Status dot";
  dot.resize(7, 7);
  dot.fills = solid(dotColor);
  append(node, dot);
  append(node, text("Label", label, 12, textColor, FONT_MEDIUM));
  return node;
}

function button(name, label, variant = "primary") {
  const isPrimary = variant === "primary";
  const node = frame(name, 180, 44, {
    layoutMode: "HORIZONTAL",
    padding: 0,
    radius: 7,
    fill: isPrimary ? colors.blue : colors.white,
    stroke: isPrimary ? colors.blue : colors.border,
    primaryAxisAlignItems: "CENTER",
    counterAxisAlignItems: "CENTER",
    counterAxisSizingMode: "FIXED",
  });
  append(node, text("Label", label, 14, isPrimary ? colors.white : colors.text, FONT_SEMIBOLD));
  return node;
}

function checkIcon(name, color = colors.blue) {
  const wrap = frame(name, 16, 16, {
    layoutMode: "HORIZONTAL",
    radius: 99,
    fill: color,
    primaryAxisAlignItems: "CENTER",
    counterAxisAlignItems: "CENTER",
  });
  const mark = text("Check", "✓", 10, colors.white, FONT_BOLD);
  append(wrap, mark);
  return wrap;
}

function lineIcon(name, strokeColor = colors.blue) {
  const icon = frame(name, 20, 20, { fill: colors.white, opacity: 0, layoutMode: "VERTICAL" });
  icon.fills = [];
  const box = figma.createRectangle();
  box.name = "Icon body";
  box.resize(18, 18);
  box.cornerRadius = 4;
  box.strokes = solid(strokeColor);
  box.strokeWeight = 1.4;
  box.fills = [];
  box.x = 1;
  box.y = 1;
  icon.appendChild(box);
  return icon;
}

function featureRow(title, detail, iconName) {
  const row = frame(`Row / ${title}`, 560, 28, {
    layoutMode: "HORIZONTAL",
    gap: 14,
    fill: colors.white,
    opacity: 0,
    counterAxisAlignItems: "CENTER",
    counterAxisSizingMode: "AUTO",
  });
  row.fills = [];
  append(row, lineIcon(`Icon / ${iconName}`));
  append(row, text("Title", title, 14, colors.text, FONT_SEMIBOLD), { h: "FIXED" });
  row.children[1].resize(190, row.children[1].height);
  append(row, text("Detail", detail, 13, colors.muted, FONT), { h: "FILL" });
  return row;
}

function planCard(name, title, tag, description, bullets, selected = false) {
  const card = frame(`Plan card / ${name}`, 278, 250, {
    layoutMode: "VERTICAL",
    gap: 14,
    padding: 16,
    radius: 8,
    fill: selected ? "#FBFDFF" : colors.white,
    stroke: selected ? colors.blue : colors.border,
    counterAxisSizingMode: "FIXED",
  });
  const top = frame("Header", 246, 34, {
    layoutMode: "HORIZONTAL",
    fill: colors.white,
    opacity: 0,
    primaryAxisSizingMode: "FIXED",
    counterAxisSizingMode: "AUTO",
    counterAxisAlignItems: "CENTER",
  });
  top.fills = [];
  const titleStack = frame("Title stack", 150, 34, {
    layoutMode: "VERTICAL",
    gap: 5,
    fill: colors.white,
    opacity: 0,
  });
  titleStack.fills = [];
  append(titleStack, text("Plan name", title, 18, colors.text, FONT_SEMIBOLD));
  const tagNode = frame("Role tag", 78, 22, {
    layoutMode: "HORIZONTAL",
    paddingTop: 4,
    paddingRight: 8,
    paddingBottom: 4,
    paddingLeft: 8,
    radius: 99,
    fill: selected ? colors.blueSoft : colors.purpleSoft,
    counterAxisSizingMode: "AUTO",
    primaryAxisAlignItems: "CENTER",
    counterAxisAlignItems: "CENTER",
  });
  append(tagNode, text("Label", tag, 11, selected ? colors.blue : colors.purpleText, FONT_MEDIUM));
  append(titleStack, tagNode);
  append(top, titleStack, { h: "FILL" });
  if (selected) {
    const badge = frame("Badge / Recommended", 90, 22, {
      layoutMode: "HORIZONTAL",
      gap: 4,
      paddingTop: 4,
      paddingRight: 8,
      paddingBottom: 4,
      paddingLeft: 8,
      radius: 99,
      fill: colors.blue,
      counterAxisSizingMode: "AUTO",
      primaryAxisAlignItems: "CENTER",
      counterAxisAlignItems: "CENTER",
    });
    append(badge, text("Check", "✓", 10, colors.white, FONT_BOLD));
    append(badge, text("Label", "Recommended", 10, colors.white, FONT_SEMIBOLD));
    append(top, badge);
  }
  append(card, top, { h: "FILL" });
  append(card, text("Description", description, 13, colors.muted, FONT, { width: 246, lineHeight: 18 }));
  const list = frame("Included list", 246, 86, {
    layoutMode: "VERTICAL",
    gap: 8,
    fill: colors.white,
    opacity: 0,
  });
  list.fills = [];
  for (const bullet of bullets) {
    const row = frame(`Benefit / ${bullet}`, 246, 18, {
      layoutMode: "HORIZONTAL",
      gap: 8,
      fill: colors.white,
      opacity: 0,
      counterAxisAlignItems: "CENTER",
      counterAxisSizingMode: "AUTO",
    });
    row.fills = [];
    append(row, checkIcon("Check", selected ? colors.blue : colors.subtle));
    append(row, text("Label", bullet, 12, colors.text, FONT));
    append(list, row, { h: "FILL" });
  }
  append(card, list, { h: "FILL" });
  append(card, button(selected ? "Button / Start Pro" : "Button / Stay Free", selected ? "Start Pro and execute" : "Stay on Free", selected ? "primary" : "secondary"), { h: "FILL" });
  card.children[card.children.length - 1].resize(246, 36);
  return card;
}

function trustItem(title, detail, symbol) {
  const item = frame(`Trust item / ${title}`, 176, 58, {
    layoutMode: "HORIZONTAL",
    gap: 10,
    fill: colors.white,
    opacity: 0,
    counterAxisSizingMode: "AUTO",
  });
  item.fills = [];
  const icon = frame(`Icon / ${symbol}`, 24, 24, {
    layoutMode: "HORIZONTAL",
    radius: 99,
    fill: colors.white,
    stroke: colors.border,
    primaryAxisAlignItems: "CENTER",
    counterAxisAlignItems: "CENTER",
  });
  append(icon, text("Glyph", symbol, 13, colors.text, FONT_SEMIBOLD));
  append(item, icon);
  const copy = frame("Copy", 142, 58, { layoutMode: "VERTICAL", gap: 3, fill: colors.white, opacity: 0 });
  copy.fills = [];
  append(copy, text("Title", title, 12, colors.text, FONT_SEMIBOLD));
  append(copy, text("Detail", detail, 11, colors.muted, FONT, { width: 142, lineHeight: 15 }));
  append(item, copy, { h: "FILL" });
  return item;
}

function createBackgroundScreen() {
  const bg = frame("Reference backdrop / Campaign plan", 960, 690, {
    layoutMode: "HORIZONTAL",
    fill: colors.canvas,
    radius: 0,
  });
  const sidebar = frame("Sidebar", 172, 690, {
    layoutMode: "VERTICAL",
    gap: 16,
    padding: 24,
    fill: colors.white,
    stroke: colors.border,
    counterAxisSizingMode: "FIXED",
  });
  append(sidebar, text("Brand", "Flywheel", 18, colors.text, FONT_BOLD));
  for (const label of ["Dashboard", "Campaigns", "Content", "Knowledge", "Team", "Settings"]) {
    const item = frame(`Nav / ${label}`, 124, 34, {
      layoutMode: "HORIZONTAL",
      paddingLeft: 10,
      paddingRight: 10,
      radius: 6,
      fill: label === "Campaigns" ? colors.blueSoft : colors.white,
      primaryAxisAlignItems: "CENTER",
      counterAxisAlignItems: "CENTER",
    });
    append(item, text("Label", label, 12, label === "Campaigns" ? colors.blue : colors.muted, FONT_MEDIUM));
    append(sidebar, item, { h: "FILL" });
  }
  const main = frame("Plan content", 788, 690, {
    layoutMode: "VERTICAL",
    gap: 18,
    padding: 30,
    fill: "#F8FAFC",
    counterAxisSizingMode: "FIXED",
  });
  const header = frame("Header", 728, 44, {
    layoutMode: "HORIZONTAL",
    fill: "#F8FAFC",
    opacity: 0,
    counterAxisAlignItems: "CENTER",
  });
  header.fills = [];
  append(header, text("Title", "30-Day Growth Strategy for kcex", 18, colors.text, FONT_BOLD), { h: "FILL" });
  append(header, button("Button / Start execution", "Start execution", "primary"));
  header.children[1].resize(140, 36);
  append(main, header, { h: "FILL" });
  const grid = frame("Cards grid", 728, 560, {
    layoutMode: "HORIZONTAL",
    gap: 18,
    fill: "#F8FAFC",
    opacity: 0,
  });
  grid.fills = [];
  for (const colName of ["Campaign brief", "Specialist assignments"]) {
    const card = frame(`Plan card / ${colName}`, 355, 240, {
      layoutMode: "VERTICAL",
      gap: 12,
      padding: 20,
      fill: colors.white,
      stroke: colors.border,
      radius: 8,
    });
    append(card, text("Title", colName, 15, colors.text, FONT_BOLD));
    for (const line of ["Objective", "Target audience", "Key message", "Success metrics"]) {
      append(card, text(`Text / ${line}`, line, 12, colors.muted, FONT_MEDIUM));
    }
    append(grid, card);
  }
  append(main, grid, { h: "FILL" });
  append(bg, sidebar);
  append(bg, main);
  bg.opacity = 0.35;
  return bg;
}

function findCanvasPosition(width) {
  let maxX = 0;
  for (const child of figma.currentPage.children) {
    maxX = Math.max(maxX, child.x + child.width);
  }
  return { x: maxX + 96, y: 80 };
}

const createdNodeIds = [];
const board = frame("Subscription modal concept / Flywheel", 960, 690, {
  layoutMode: "HORIZONTAL",
  fill: colors.canvas,
  radius: 0,
  primaryAxisAlignItems: "CENTER",
  counterAxisAlignItems: "CENTER",
});
const pos = findCanvasPosition(board.width);
board.x = pos.x;
board.y = pos.y;
figma.currentPage.appendChild(board);
createdNodeIds.push(board.id);

const backdrop = createBackgroundScreen();
append(board, backdrop);

const overlay = frame("Overlay", 960, 690, {
  layoutMode: "HORIZONTAL",
  fill: "#111827",
  opacity: 0.34,
  primaryAxisAlignItems: "CENTER",
  counterAxisAlignItems: "CENTER",
});
overlay.x = 0;
overlay.y = 0;
board.appendChild(overlay);
createdNodeIds.push(overlay.id);

const modal = frame("Modal / Subscription unlock", 680, 578, {
  layoutMode: "VERTICAL",
  gap: 16,
  paddingTop: 24,
  paddingRight: 28,
  paddingBottom: 24,
  paddingLeft: 28,
  radius: 12,
  fill: colors.white,
  stroke: colors.border,
  effects: shadow(),
  counterAxisSizingMode: "FIXED",
});
modal.x = 140;
modal.y = 56;
board.appendChild(modal);
createdNodeIds.push(modal.id);

const modalHeader = frame("Header", 624, 26, {
  layoutMode: "HORIZONTAL",
  fill: colors.white,
  opacity: 0,
  counterAxisSizingMode: "AUTO",
  counterAxisAlignItems: "CENTER",
});
modalHeader.fills = [];
const brand = frame("Brand", 160, 26, {
  layoutMode: "HORIZONTAL",
  gap: 8,
  fill: colors.white,
  opacity: 0,
  counterAxisAlignItems: "CENTER",
});
brand.fills = [];
const logo = figma.createPolygon();
logo.name = "Logo mark";
logo.resize(24, 20);
logo.pointCount = 3;
logo.rotation = 180;
logo.fills = solid(colors.black);
append(brand, logo);
append(brand, text("Wordmark", "Flywheel", 18, colors.text, FONT_BOLD));
append(modalHeader, brand, { h: "FILL" });
append(modalHeader, text("Close", "×", 24, colors.text, FONT));
append(modal, modalHeader, { h: "FILL" });

const hero = frame("Hero copy", 624, 78, {
  layoutMode: "VERTICAL",
  gap: 9,
  fill: colors.white,
  opacity: 0,
  primaryAxisAlignItems: "CENTER",
  counterAxisAlignItems: "CENTER",
});
hero.fills = [];
append(hero, pill("Status / Campaign ready", "Campaign ready", colors.green, colors.greenSoft, "#166534"));
append(hero, text("Title", "Your CMO is ready to start executing", 26, colors.text, FONT_BOLD, { align: "CENTER" }));
append(hero, text("Subtitle", "The first week is planned. Unlock execution so your specialist team can begin.", 14, colors.muted, FONT, { align: "CENTER" }));
append(modal, hero, { h: "FILL" });

const summary = frame("Execution summary", 624, 104, {
  layoutMode: "VERTICAL",
  gap: 14,
  padding: 16,
  radius: 8,
  fill: colors.white,
  stroke: colors.border,
  counterAxisSizingMode: "FIXED",
});
append(summary, featureRow("First week scheduled", "5 tasks ready", "calendar"), { h: "FILL" });
append(summary, featureRow("Specialist team assigned", "Content Specialist, Social Media, Growth Analyst", "team"), { h: "FILL" });
append(summary, featureRow("First draft queued", "Review before anything goes live", "draft"), { h: "FILL" });
append(modal, summary, { h: "FILL" });

append(modal, text("Section label", "Choose how you want to move forward", 14, colors.text, FONT_SEMIBOLD));

const plans = frame("Plan comparison", 624, 250, {
  layoutMode: "HORIZONTAL",
  gap: 14,
  fill: colors.white,
  opacity: 0,
});
plans.fills = [];
append(plans, planCard("Free", "Free", "CMO advisor", "Keep planning and preview the Campaign.", ["Strategy saved", "Execution paused", "Manual next steps"], false), { h: "FILL" });
append(plans, planCard("Pro", "Pro", "CMO operator", "Let CMO and specialists execute this Campaign.", ["Start Campaign execution", "Generate full content", "Connect channels", "Track results"], true), { h: "FILL" });
append(modal, plans, { h: "FILL" });

const note = frame("Value note", 624, 40, {
  layoutMode: "HORIZONTAL",
  gap: 10,
  paddingTop: 10,
  paddingRight: 12,
  paddingBottom: 10,
  paddingLeft: 12,
  radius: 7,
  fill: colors.white,
  stroke: colors.border,
  counterAxisAlignItems: "CENTER",
});
append(note, text("Spark", "✦", 14, colors.blue, FONT_BOLD));
append(note, text("Copy", "Flywheel: Continuous growth engine for ongoing optimization across multiple Campaigns.", 11, colors.text, FONT), { h: "FILL" });
append(note, text("Link", "Learn more", 11, colors.blue, FONT_MEDIUM));
append(modal, note, { h: "FILL" });

const trust = frame("Trust row", 624, 58, {
  layoutMode: "HORIZONTAL",
  gap: 18,
  fill: colors.white,
  opacity: 0,
});
trust.fills = [];
append(trust, trustItem("7-day refund guarantee", "Get a full refund within 7 days.", "↺"), { h: "FILL" });
append(trust, trustItem("Cancel anytime", "No long-term commitment.", "↩"), { h: "FILL" });
append(trust, trustItem("Fair usage", "Credits are shown later for clarity.", "□"), { h: "FILL" });
append(modal, trust, { h: "FILL" });

const divider = figma.createLine();
divider.name = "Divider";
divider.resize(624, 0);
divider.strokes = solid(colors.border);
divider.strokeWeight = 1;
append(modal, divider, { h: "FILL" });

const checkout = frame("Checkout row", 624, 34, {
  layoutMode: "HORIZONTAL",
  gap: 10,
  fill: colors.white,
  opacity: 0,
  counterAxisAlignItems: "CENTER",
});
checkout.fills = [];
append(checkout, text("Secure note", "Secure checkout. Multiple ways to pay.", 11, colors.muted, FONT), { h: "FILL" });
for (const label of ["Card", "Pay", "More options"]) {
  const chip = frame(`Payment / ${label}`, label === "More options" ? 118 : 78, 30, {
    layoutMode: "HORIZONTAL",
    gap: 6,
    radius: 7,
    fill: colors.white,
    stroke: colors.border,
    primaryAxisAlignItems: "CENTER",
    counterAxisAlignItems: "CENTER",
  });
  append(chip, text("Label", label, 11, colors.text, FONT_MEDIUM));
  append(checkout, chip);
}
append(modal, checkout, { h: "FILL" });

const cta = button("Button / Primary CTA", "Start Pro and execute", "primary");
cta.resize(624, 40);
append(modal, cta, { h: "FILL" });

const draft = text("Text button / Keep as draft", "Keep as draft", 12, colors.blue, FONT_MEDIUM, { align: "CENTER" });
append(modal, draft);

figma.currentPage.selection = [board];
figma.viewport.scrollAndZoomIntoView([board]);

return {
  ok: true,
  createdNodeIds,
  boardId: board.id,
  modalId: modal.id,
  message: "Created Flywheel subscription modal concept with auto layout and clean layer names.",
};
