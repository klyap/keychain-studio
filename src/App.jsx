import React, { useMemo, useRef, useState } from "react";
import { beads, cordColors, defaultDesign, hardwareColors } from "./data.js";
import cordLoopSvgRaw from "./assets/cord-loop.svg?raw";

const beadById = new Map(beads.map((bead) => [bead.id, bead]));
const hardwareById = new Map(hardwareColors.map((color) => [color.id, color]));
const cordById = new Map(cordColors.map((color) => [color.id, color]));
const charmBeads = beads.filter((bead) => bead.suggestedUse.includes("charm"));

export default function App() {
  const [design, setDesign] = useState(defaultDesign);
  const [activeStep, setActiveStep] = useState(0);
  const stepPagesRef = useRef(null);
  const charms = getDesignCharms(design);

  const selectedHardware = hardwareById.get(design.hardwareColor) || hardwareColors[0];
  const selectedCord = cordById.get(design.cordColor) || cordColors[0];

  const addCharm = (beadId) => {
    setDesign((current) => ({
      ...current,
      charms: [
        ...getDesignCharms(current),
        {
          id: `charm-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          ...getCharmStart(current.charmAttachment || "hardwareLoop"),
          beadId,
          attachmentPoint: current.charmAttachment || "hardwareLoop",
        },
      ],
      charm: null,
    }));
  };

  const removeCharm = (charmId) => {
    setDesign((current) => ({
      ...current,
      charms: getDesignCharms(current).filter((charm) => charm.id !== charmId),
      charm: null,
    }));
  };

  const moveCharm = (charmId, position) => {
    setDesign((current) => ({
      ...current,
      charms: getDesignCharms(current).map((charm) => charm.id === charmId ? { ...charm, ...position } : charm),
      charm: null,
    }));
  };

  const setCharmAttachment = (attachmentPoint) => {
    setDesign((current) => ({
      ...current,
      charmAttachment: attachmentPoint,
      charms: getDesignCharms(current),
      charm: null,
    }));
  };

  const clearCharms = () => {
    setDesign((current) => ({
      ...current,
      charms: [],
      charm: null,
    }));
  };

  const randomize = () => {
    const nextAttachment = pick(["hardwareLoop", "lowerLoop"]);
    setDesign({
      hardwareType: "round",
      hardwareColor: pick(hardwareColors).id,
      cordColor: pick(cordColors).id,
      beads: [],
      charmAttachment: nextAttachment,
      charms: [
        {
          id: `charm-${Date.now()}`,
          ...getCharmStart(nextAttachment),
          beadId: pick(charmBeads).id,
          attachmentPoint: nextAttachment,
        },
      ],
    });
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
            Download
          </button>
          <button type="button" onClick={randomize}>
            Randomize
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
            <span>Order # 0007824</span>
            <span>05/18/2024&nbsp;&nbsp;11:32 AM</span>
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
            charmAttachment={design.charmAttachment || "hardwareLoop"}
            selectedCharmBeadIds={selectedCharmBeadIds}
            addCharm={addCharm}
            removeCharm={removeCharm}
            clearCharms={clearCharms}
            setCharmAttachment={setCharmAttachment}
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

function CharmPicker({ charms, charmAttachment, selectedCharmBeadIds, addCharm, removeCharm, clearCharms, setCharmAttachment }) {
  const charmOptions = charmBeads;

  return (
    <section className="tool-panel">
      <PanelHeader number="03" title="Loop charm" />
      <div className="segmented" role="group" aria-label="Charm attachment">
        <button
          type="button"
          className={charmAttachment === "hardwareLoop" ? "active" : ""}
          onClick={() => setCharmAttachment("hardwareLoop")}
        >
          Inner
        </button>
        <button
          type="button"
          className={charmAttachment === "lowerLoop" ? "active" : ""}
          onClick={() => setCharmAttachment("lowerLoop")}
        >
          Outer
        </button>
        <button
          type="button"
          className={charms.length === 0 ? "active" : ""}
          onClick={clearCharms}
        >
          Clear
        </button>
      </div>
      <div className="charm-strip">
        {charmOptions.map((bead) => (
          <button
            key={bead.id}
            type="button"
            className={selectedCharmBeadIds.has(bead.id) ? "active" : ""}
            onClick={() => addCharm(bead.id)}
            aria-label={`Add ${bead.name} charm`}
          >
            <img src={bead.src} alt="" />
          </button>
        ))}
      </div>
      {charms.length > 0 ? (
        <div className="selected-charms" aria-label="Selected charms">
          {charms.map((charm, index) => {
            const bead = beadById.get(charm.beadId);
            if (!bead) return null;

            return (
              <button key={charm.id} type="button" onClick={() => removeCharm(charm.id)} aria-label={`Remove ${bead.name}`}>
                <img src={bead.src} alt="" />
                <span>Remove {index + 1}</span>
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
            stroke="#278BEA"
            strokeWidth="5"
            filter="url(#paperShadow)"
          />
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
        </g>
      </svg>
    </div>
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
      <circle cx="424" cy="192" r="10" fill="#FDFFBE" stroke="url(#metalHardware)" strokeWidth="4" />
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
  const fallback = getCharmStart(charm.attachmentPoint || "hardwareLoop");
  const x = Number.isFinite(charm.x) ? charm.x : fallback.x;
  const y = Number.isFinite(charm.y) ? charm.y : fallback.y;

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

  return [
    {
      id: "charm-1",
      ...getCharmStart(design.charm.attachmentPoint || "hardwareLoop"),
      beadId: design.charm.beadId,
      attachmentPoint: design.charm.attachmentPoint || "hardwareLoop",
    },
  ];
}

function getCharmStart(attachmentPoint) {
  return attachmentPoint === "lowerLoop" ? { x: 526, y: 400 } : { x: 318, y: 452 };
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
  pattern.setAttribute("id", "downloadChecker");
  pattern.setAttribute("width", "160");
  pattern.setAttribute("height", "160");
  pattern.setAttribute("patternUnits", "userSpaceOnUse");

  const blueSquare = document.createElementNS(svgNamespace, "rect");
  blueSquare.setAttribute("width", "160");
  blueSquare.setAttribute("height", "160");
  blueSquare.setAttribute("fill", "#B3FBC5");

  const creamA = document.createElementNS(svgNamespace, "rect");
  creamA.setAttribute("width", "80");
  creamA.setAttribute("height", "80");
  creamA.setAttribute("fill", "#FDFFBE");

  const creamB = document.createElementNS(svgNamespace, "rect");
  creamB.setAttribute("x", "80");
  creamB.setAttribute("y", "80");
  creamB.setAttribute("width", "80");
  creamB.setAttribute("height", "80");
  creamB.setAttribute("fill", "#FDFFBE");

  pattern.append(blueSquare, creamA, creamB);
  defs.append(pattern);

  const background = document.createElementNS(svgNamespace, "rect");
  background.setAttribute("x", "0");
  background.setAttribute("y", "0");
  background.setAttribute("width", String(exportWidth));
  background.setAttribute("height", String(exportHeight));
  background.setAttribute("fill", "url(#downloadChecker)");
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
  const attachmentPoint = pick(["hardwareLoop", "lowerLoop"]);

  return {
    hardwareType: "round",
    hardwareColor: pick(hardwareColors).id,
    cordColor: pick(cordColors).id,
    beads: [],
    charmAttachment: attachmentPoint,
    charms: [{ id: `charm-${Date.now()}`, ...getCharmStart(attachmentPoint), beadId: pick(charmBeads).id, attachmentPoint }],
  };
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}
