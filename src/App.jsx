import React, { useMemo, useRef, useState } from "react";
import { beads, cordColors, defaultDesign, hardwareColors } from "./data.js";
import cordLoopSvgRaw from "./assets/cord-loop.svg?raw";

const beadById = new Map(beads.map((bead) => [bead.id, bead]));
const hardwareById = new Map(hardwareColors.map((color) => [color.id, color]));
const cordById = new Map(cordColors.map((color) => [color.id, color]));
const charmBeads = beads.filter((bead) => bead.suggestedUse.includes("charm"));
const MAX_CHARMS = 2;
const charmStarts = [
  { x: 318, y: 452 },
  { x: 526, y: 400 },
];

export default function App() {
  const [design, setDesign] = useState(defaultDesign);
  const [activeStep, setActiveStep] = useState(0);
  const stepPagesRef = useRef(null);
  const charms = getDesignCharms(design);
  const order = useMemo(
    () => ({
      number: String(Math.floor(1000000 + Math.random() * 9000000)),
      placedAt: new Date()
        .toLocaleString("en-US", { month: "2-digit", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
        .replace(",", "  "),
    }),
    [],
  );

  const selectedHardware = hardwareById.get(design.hardwareColor) || hardwareColors[0];
  const selectedCord = cordById.get(design.cordColor) || cordColors[0];

  const toggleCharm = (beadId) => {
    setDesign((current) => {
      const currentCharms = getDesignCharms(current);
      const existing = currentCharms.find((charm) => charm.beadId === beadId);

      if (existing) {
        return { ...current, charms: currentCharms.filter((charm) => charm.id !== existing.id) };
      }
      if (currentCharms.length >= MAX_CHARMS) return current;

      return {
        ...current,
        charms: [
          ...currentCharms,
          {
            id: `charm-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            ...charmStarts[currentCharms.length],
            beadId,
          },
        ],
      };
    });
  };

  const removeCharm = (charmId) => {
    setDesign((current) => ({
      ...current,
      charms: getDesignCharms(current).filter((charm) => charm.id !== charmId),
    }));
  };

  const moveCharm = (charmId, position) => {
    setDesign((current) => ({
      ...current,
      charms: getDesignCharms(current).map((charm) => charm.id === charmId ? { ...charm, ...position } : charm),
    }));
  };

  const selectedCharmBeadIds = new Set(charms.map((charm) => charm.beadId));

  const goToStep = (step) => {
    const nextStep = (step + 3) % 3;
    setActiveStep(nextStep);
    stepPagesRef.current?.children[nextStep]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
  };

  const syncStepFromScroll = (event) => {
    const element = event.currentTarget;
    const nextStep = Math.round(element.scrollLeft / element.clientWidth);
    setActiveStep(Math.max(0, Math.min(2, nextStep)));
  };

  return (
    <main className="app-shell">
      <section className="studio-stage" aria-label="Keychain preview">
        <KeychainCanvas
          hardwareType={design.hardwareType}
          hardware={selectedHardware}
          cord={selectedCord}
          charms={charms}
          onMoveCharm={moveCharm}
        />

        <div className="stage-actions">
          <button type="button" onClick={downloadPreviewImage}>
            Save PNG
          </button>
          <button type="button" onClick={() => setDesign(randomDesign())}>
            Surprise me
          </button>
        </div>
      </section>

      <section className="editor-panel" aria-label="Keychain controls">
        <div className="receipt-header" aria-hidden="true">
          <div className="receipt-title">
            <span>✿</span>
            <strong>Custom Order</strong>
            <span>✿</span>
          </div>
          <div className="receipt-meta">
            <span>Order # {order.number}</span>
            <span>{order.placedAt}</span>
          </div>
        </div>
        <div className="mobile-step-tabs">
          {["Hardware", "Cord", "Charm"].map((label, index) => (
            <button
              key={label}
              type="button"
              className={`step-tab ${activeStep === index ? "active" : ""}`}
              onClick={() => goToStep(index)}
              aria-label={`Show ${label} controls`}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <b>{label}</b>
            </button>
          ))}
        </div>
        <div className="step-pages" ref={stepPagesRef} onScroll={syncStepFromScroll}>
          <HardwarePicker design={design} setDesign={setDesign} />
          <CordPicker selected={design.cordColor} setDesign={setDesign} />
          <CharmPicker
            charms={charms}
            selectedCharmBeadIds={selectedCharmBeadIds}
            toggleCharm={toggleCharm}
            removeCharm={removeCharm}
          />
        </div>
        <div className="mobile-nav">
          <button type="button" className="mobile-nav-button" onClick={() => goToStep(activeStep - 1)}>
            ← Prev
          </button>
          <button type="button" className="mobile-nav-button" onClick={() => goToStep(activeStep + 1)}>
            Next →
          </button>
        </div>
      </section>
    </main>
  );
}

function HardwarePicker({ design, setDesign }) {
  return (
    <section className="tool-panel">
      <PanelHeader number="01" title="Hardware" />
      <SwatchGrid
        colors={hardwareColors}
        selected={design.hardwareColor}
        onPick={(hardwareColor) => setDesign((current) => ({ ...current, hardwareColor }))}
        getMeta={(color) => color.finish === "metal" ? "shiny" : "matte"}
      />
    </section>
  );
}

function CordPicker({ selected, setDesign }) {
  return (
    <section className="tool-panel">
      <PanelHeader number="02" title="Cord color" />
      <SwatchGrid
        colors={cordColors}
        selected={selected}
        onPick={(cordColor) => setDesign((current) => ({ ...current, cordColor }))}
        getMeta={() => "braided"}
      />
    </section>
  );
}

function CharmPicker({ charms, selectedCharmBeadIds, toggleCharm, removeCharm }) {
  const atLimit = charms.length >= MAX_CHARMS;

  return (
    <section className="tool-panel">
      <PanelHeader number="03" title={`Charms · max ${MAX_CHARMS}`} />
      <div className="charm-strip">
        {charmBeads.map((bead) => {
          const selected = selectedCharmBeadIds.has(bead.id);

          return (
            <button
              key={bead.id}
              type="button"
              className={selected ? "active" : ""}
              disabled={atLimit && !selected}
              onClick={() => toggleCharm(bead.id)}
              aria-label={selected ? `Remove ${bead.name} charm` : `Add ${bead.name} charm`}
            >
              <img src={bead.src} alt="" />
            </button>
          );
        })}
      </div>
      {charms.length > 0 ? (
        <div className="charm-lines" aria-label="Charms on this order">
          {charms.map((charm) => {
            const bead = beadById.get(charm.beadId);
            if (!bead) return null;

            return (
              <button key={charm.id} type="button" onClick={() => removeCharm(charm.id)} aria-label={`Remove ${bead.name}`}>
                <img src={bead.src} alt="" />
                <span className="charm-name">{bead.name}</span>
                <i className="leader" aria-hidden="true" />
                <b className="remove-mark">✕</b>
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function PanelHeader({ number, title }) {
  return (
    <div className="panel-header">
      <span>{number}</span>
      <h2>{title}</h2>
    </div>
  );
}

function SwatchGrid({ colors, selected, onPick, getMeta }) {
  return (
    <div className="swatch-grid">
      {colors.map((color) => (
        <button
          key={color.id}
          type="button"
          className={selected === color.id ? "selected" : ""}
          style={{ "--swatch": color.value, "--accent": color.accent || color.value }}
          onClick={() => onPick(color.id)}
          aria-label={`${color.name} ${getMeta(color)}`}
        >
          <span data-finish={color.finish || "cord"} />
          <b>{color.name}</b>
          <small>{getMeta(color)}</small>
        </button>
      ))}
    </div>
  );
}

function KeychainCanvas({ hardwareType, hardware, cord, charms, onMoveCharm }) {
  const isMetal = hardware.finish === "metal";
  const svgRef = useRef(null);
  const [dragCharmId, setDragCharmId] = useState(null);

  const moveDraggedCharm = (event) => {
    if (!dragCharmId || !svgRef.current) return;
    onMoveCharm(dragCharmId, getSvgCharmPosition(event, svgRef.current));
  };

  const stopDraggingCharm = () => setDragCharmId(null);

  return (
    <div className="canvas-wrap">
      <svg
        id="keychain-preview-svg"
        ref={svgRef}
        viewBox="0 0 780 888"
        role="img"
        aria-label="Completed keychain preview"
        onPointerMove={moveDraggedCharm}
        onPointerUp={stopDraggingCharm}
        onPointerCancel={stopDraggingCharm}
        onPointerLeave={stopDraggingCharm}
      >
        <defs>
          <radialGradient id="matteHardware" cx="34%" cy="24%" r="72%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="34%" stopColor={hardware.value} />
            <stop offset="100%" stopColor={shade(hardware.value, -28)} />
          </radialGradient>
          <linearGradient id="metalHardware" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isMetal && hardware.id === "gold" ? "#fff0a8" : "#ffffff"} />
            <stop offset="18%" stopColor={hardware.value} />
            <stop offset="34%" stopColor={isMetal && hardware.id === "gold" ? "#8d6221" : "#777d82"} />
            <stop offset="50%" stopColor="#fffdf4" />
            <stop offset="68%" stopColor={hardware.value} />
            <stop offset="100%" stopColor={isMetal && hardware.id === "gold" ? "#7a5318" : "#676b70"} />
          </linearGradient>
          <linearGradient id="charmSilver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="28%" stopColor="#cfd3d6" />
            <stop offset="52%" stopColor="#f9fbfb" />
            <stop offset="100%" stopColor="#8f969b" />
          </linearGradient>
          <pattern id="cordBraid" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <rect width="18" height="18" fill={cord.value} />
            <path d="M0 1 H18 M0 9 H18 M0 17 H18" stroke={cord.accent} strokeWidth="4" opacity="0.55" />
            <path d="M0 5 H18 M0 13 H18" stroke={shade(cord.value, -26)} strokeWidth="3" opacity="0.35" />
          </pattern>
          <filter id="softShadow" x="-30%" y="-30%" width="160%" height="170%">
            <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#53351f" floodOpacity="0.2" />
          </filter>
          <filter id="tinyShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="7" stdDeviation="5" floodColor="#120c19" floodOpacity="0.25" />
          </filter>
          <filter id="paperShadow" x="-12%" y="-12%" width="124%" height="124%">
            <feDropShadow dx="0" dy="12" stdDeviation="11" floodColor="#2d210f" floodOpacity="0.22" />
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#ffffff" floodOpacity="0.55" />
          </filter>
        </defs>

        <g transform="translate(0 20)">
          <path
            d={wavyRectPath(86, 26, 608, 836, 44, 9)}
            fill="#fff9ef"
            stroke="#c5161d"
            strokeWidth="4"
            filter="url(#paperShadow)"
          />
          <BackingCardPrint />
          <g transform="translate(390 370) scale(1.18) translate(-390 -370)">
            {hardwareType === "round" ? <RoundRing hardware={hardware} /> : <Clasp hardware={hardware} />}
            <CordLoopSvg hardwareType={hardwareType} cord={cord} />
            {charms.map((charm) => {
              const bead = beadById.get(charm.beadId);
              if (!bead) return null;

              return (
                <Charm
                  key={charm.id}
                  bead={bead}
                  charm={charm}
                  onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture?.(event.pointerId);
                    setDragCharmId(charm.id);
                    onMoveCharm(charm.id, getSvgCharmPosition(event, svgRef.current));
                  }}
                />
              );
            })}
          </g>
          <StapleTacks />
        </g>
      </svg>
    </div>
  );
}

const printMono = "'Space Mono', 'Courier New', monospace";

function BackingCardPrint() {
  const barWidths = [3, 1, 2, 1, 1, 3, 2, 1, 3, 1, 1, 2, 3, 1, 2, 2, 1, 3, 1, 2];

  let barX = 0;
  const bars = barWidths.map((width, index) => {
    const bar = index % 2 === 0 ? <rect key={index} x={barX} y="0" width={width * 2.4} height="30" fill="#46311f" /> : null;
    barX += width * 2.4 + 2.4;
    return bar;
  });

  return (
    <g aria-hidden="true">
      <g fill="#c5161d" fontFamily={printMono} fontWeight="700">
        <text x="122" y="86" fontSize="27" letterSpacing="3">KEYCHAIN</text>
        <text x="122" y="115" fontSize="27" letterSpacing="3">STUDIO</text>
        <text x="122" y="140" fontSize="12" fontWeight="400" letterSpacing="1.5">HAND-TIED · ONE OF ONE</text>
      </g>
      <g transform="translate(196 792) rotate(-8)" opacity="0.82">
        <rect x="-96" y="-27" width="192" height="54" rx="9" fill="none" stroke="#c5161d" strokeWidth="3" />
        <rect x="-89" y="-20" width="178" height="40" rx="6" fill="none" stroke="#c5161d" strokeWidth="1.5" />
        <text x="0" y="7" textAnchor="middle" fontFamily={printMono} fontWeight="700" fontSize="19" letterSpacing="2" fill="#c5161d">
          MADE TO ORDER
        </text>
      </g>
      <g transform="translate(556 780)">
        {bars}
        <text x="0" y="48" fontFamily={printMono} fontSize="12" letterSpacing="2" fill="#46311f">
          KCS-0100-STU
        </text>
      </g>
    </g>
  );
}

function StapleTacks() {
  return (
    <g aria-hidden="true" filter="url(#tinyShadow)">
      <rect x="-15" y="-3.5" width="30" height="7" rx="3.5" transform="translate(352 73) rotate(48)" fill="url(#charmSilver)" stroke="#6f757a" strokeWidth="0.8" />
      <rect x="-15" y="-3.5" width="30" height="7" rx="3.5" transform="translate(428 73) rotate(-48)" fill="url(#charmSilver)" stroke="#6f757a" strokeWidth="0.8" />
    </g>
  );
}

function RoundRing({ hardware }) {
  return (
    <g filter="url(#softShadow)">
      <circle cx="390" cy="154" r="48" fill="none" stroke={hardware.value} strokeWidth="17" strokeLinecap="round" />
    </g>
  );
}

function Clasp() {
  return (
    <g filter="url(#softShadow)">
      <path d="M354 178 V128 C354 92 426 92 426 128 V172" fill="none" stroke="url(#metalHardware)" strokeWidth="17" strokeLinecap="round" />
      <rect x="336" y="170" width="108" height="44" rx="11" fill="url(#metalHardware)" stroke="#35281e" strokeWidth="2" opacity="0.96" />
      <circle cx="424" cy="192" r="10" fill="#fff8ec" stroke="url(#metalHardware)" strokeWidth="4" />
      <circle cx="390" cy="238" r="28" fill="none" stroke="url(#metalHardware)" strokeWidth="10" />
      <path d="M415 108 C426 119 432 138 425 161" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.45" />
    </g>
  );
}

function CordLoopSvg({ hardwareType, cord }) {
  const joinY = hardwareType === "round" ? 272 : 346;
  const cordSvg = useMemo(() => {
    const dark = shade(cord.value, -54);
    const highlight = cord.accent || shade(cord.value, 42);
    const coloredSvg = cordLoopSvgRaw
      .replaceAll("#FF162A", cord.value)
      .replaceAll("#D30012", cord.value)
      .replaceAll("#990013", dark)
      .replaceAll("#82000A", dark)
      .replaceAll("#FF7885", highlight)
      .replaceAll("#E1E1E1", "#f5f7f7");

    return `data:image/svg+xml;utf8,${encodeURIComponent(coloredSvg)}`;
  }, [cord]);

  return (
    <g filter="url(#tinyShadow)">
      <image
        href={cordSvg}
        x="159"
        y={joinY - 132}
        width="462"
        height="632"
        preserveAspectRatio="xMidYMid meet"
      />
    </g>
  );
}

function Charm({ bead, charm, onPointerDown }) {
  const anchor = getCharmAnchor(charm);
  const beadSize = getCanvasBeadSize(bead);

  return (
    <g className="draggable-charm" filter="url(#tinyShadow)" onPointerDown={onPointerDown}>
      <circle cx={anchor.ringX} cy={anchor.ringY} r="9" fill="none" stroke="url(#charmSilver)" strokeWidth="3" />
      <image href={bead.src} x={anchor.x - beadSize / 2} y={anchor.y - 20} width={beadSize} height={beadSize} preserveAspectRatio="xMidYMid meet" />
    </g>
  );
}

function getCharmAnchor(charm) {
  const x = Number.isFinite(charm.x) ? charm.x : charmStarts[0].x;
  const y = Number.isFinite(charm.y) ? charm.y : charmStarts[0].y;

  return { x, y, ringX: x, ringY: y - 18 };
}

function getSvgCharmPosition(event, svg) {
  if (!svg) return { x: 318, y: 452 };

  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
  const innerX = svgPoint.x;
  const innerY = svgPoint.y - 20;
  const x = 390 + (innerX - 390) / 1.18;
  const y = 370 + (innerY - 370) / 1.18;

  return {
    x: Math.max(210, Math.min(570, x)),
    y: Math.max(190, Math.min(690, y)),
  };
}

function getCanvasBeadSize(bead) {
  if (!bead.id.startsWith("assorted-")) return 108;
  if (bead.shape !== "round") return 54;
  return 72;
}

function getDesignCharms(design) {
  if (Array.isArray(design.charms)) return design.charms;
  if (!design.charm) return [];

  const start = design.charm.attachmentPoint === "lowerLoop" ? charmStarts[1] : charmStarts[0];
  return [{ id: "charm-1", ...start, beadId: design.charm.beadId }];
}

function shade(hex, amount) {
  const color = hex.replace("#", "");
  const number = parseInt(color, 16);
  const r = Math.max(0, Math.min(255, (number >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((number >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (number & 0xff) + amount));
  return `#${(b | (g << 8) | (r << 16)).toString(16).padStart(6, "0")}`;
}

async function downloadPreviewImage() {
  const sourceSvg = document.getElementById("keychain-preview-svg");
  if (!sourceSvg) return;

  const svgNamespace = "http://www.w3.org/2000/svg";
  const exportWidth = 780;
  const exportHeight = 980;
  const clone = sourceSvg.cloneNode(true);
  clone.setAttribute("xmlns", svgNamespace);
  clone.setAttribute("viewBox", `0 0 ${exportWidth} ${exportHeight}`);
  clone.setAttribute("width", String(exportWidth));
  clone.setAttribute("height", String(exportHeight));

  await Promise.all([...clone.querySelectorAll("image")].map(async (image) => {
    const href = image.getAttribute("href");
    if (href && !href.startsWith("data:")) {
      const response = await fetch(new URL(href, window.location.href).href);
      const blob = await response.blob();
      image.setAttribute("href", await blobToDataUrl(blob));
    }
  }));

  let defs = clone.querySelector("defs");
  if (!defs) {
    defs = document.createElementNS(svgNamespace, "defs");
    clone.prepend(defs);
  }

  const pattern = document.createElementNS(svgNamespace, "pattern");
  pattern.setAttribute("id", "downloadGingham");
  pattern.setAttribute("width", "52");
  pattern.setAttribute("height", "52");
  pattern.setAttribute("patternUnits", "userSpaceOnUse");

  const clothBase = document.createElementNS(svgNamespace, "rect");
  clothBase.setAttribute("width", "52");
  clothBase.setAttribute("height", "52");
  clothBase.setAttribute("fill", "#fff3df");

  const stripeAcross = document.createElementNS(svgNamespace, "rect");
  stripeAcross.setAttribute("width", "52");
  stripeAcross.setAttribute("height", "26");
  stripeAcross.setAttribute("fill", "rgba(224, 88, 74, 0.16)");

  const stripeDown = document.createElementNS(svgNamespace, "rect");
  stripeDown.setAttribute("width", "26");
  stripeDown.setAttribute("height", "52");
  stripeDown.setAttribute("fill", "rgba(224, 88, 74, 0.16)");

  pattern.append(clothBase, stripeAcross, stripeDown);
  defs.append(pattern);

  const background = document.createElementNS(svgNamespace, "rect");
  background.setAttribute("x", "0");
  background.setAttribute("y", "0");
  background.setAttribute("width", String(exportWidth));
  background.setAttribute("height", String(exportHeight));
  background.setAttribute("fill", "url(#downloadGingham)");
  defs.after(background);

  const svgText = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = new Image();
    image.decoding = "async";
    const loaded = new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });
    image.src = svgUrl;
    await loaded;

    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = exportWidth * scale;
    canvas.height = exportHeight * scale;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    const pngUrl = URL.createObjectURL(pngBlob);
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = "keychain-studio.png";
    link.click();
    URL.revokeObjectURL(pngUrl);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function wavyRectPath(x, y, width, height, wavelength, amplitude) {
  const right = x + width;
  const bottom = y + height;
  const corner = 40;
  let path = `M ${x + corner} ${y}`;

  const waveEdge = (from, to, fixed, axis) => {
    const distance = to - from;
    const count = Math.max(1, Math.round(Math.abs(distance) / wavelength));
    const step = distance / count;
    let segment = "";

    for (let i = 0; i < count; i += 1) {
      const start = from + step * i;
      const end = from + step * (i + 1);
      const mid = (start + end) / 2;
      const wave = i % 2 === 0 ? amplitude : -amplitude;

      if (axis === "top") segment += ` Q ${mid} ${fixed + wave} ${end} ${fixed}`;
      if (axis === "right") segment += ` Q ${fixed - wave} ${mid} ${fixed} ${end}`;
      if (axis === "bottom") segment += ` Q ${mid} ${fixed - wave} ${end} ${fixed}`;
      if (axis === "left") segment += ` Q ${fixed + wave} ${mid} ${fixed} ${end}`;
    }

    return segment;
  };

  path += waveEdge(x + corner, right - corner, y, "top");
  path += ` Q ${right} ${y} ${right} ${y + corner}`;
  path += waveEdge(y + corner, bottom - corner, right, "right");
  path += ` Q ${right} ${bottom} ${right - corner} ${bottom}`;
  path += waveEdge(right - corner, x + corner, bottom, "bottom");
  path += ` Q ${x} ${bottom} ${x} ${bottom - corner}`;
  path += waveEdge(bottom - corner, y + corner, x, "left");
  path += ` Q ${x} ${y} ${x + corner} ${y}`;

  return `${path} Z`;
}

function randomDesign() {
  const count = 1 + Math.floor(Math.random() * MAX_CHARMS);
  const shuffledBeads = [...charmBeads].sort(() => Math.random() - 0.5).slice(0, count);

  return {
    hardwareType: "round",
    hardwareColor: pick(hardwareColors).id,
    cordColor: pick(cordColors).id,
    beads: [],
    charms: shuffledBeads.map((bead, index) => ({
      id: `charm-${Date.now()}-${index}`,
      ...charmStarts[index],
      beadId: bead.id,
    })),
  };
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}
