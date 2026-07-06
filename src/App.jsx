import React, { useMemo, useRef, useState } from "react";
import { beads, cordColors, hardwareColors } from "./data.js";
import cordLoopSvgRaw from "./assets/cord-loop.svg?raw";

const beadById = new Map(beads.map((bead) => [bead.id, bead]));
const hardwareById = new Map(hardwareColors.map((color) => [color.id, color]));
const cordById = new Map(cordColors.map((color) => [color.id, color]));
const charmBeads = beads.filter((bead) => bead.suggestedUse.includes("charm"));
const MAX_CHARMS = 4;
const charmStarts = [
  { x: 318, y: 452 },
  { x: 526, y: 400 },
  { x: 300, y: 320 },
  { x: 480, y: 560 },
];

export default function App() {
  const [design, setDesign] = useState(randomDesign);
  const [activeStep, setActiveStep] = useState(0);
  const stepPagesRef = useRef(null);
  const charms = getDesignCharms(design);
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
          <button type="button" onClick={() => setDesign(randomDesign())}>
            Surprise me
          </button>
        </div>
      </section>

      <section className="editor-panel" aria-label="Keychain controls">
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
  const dragRef = useRef(null);

  const moveDraggedCharm = (event) => {
    const drag = dragRef.current;
    if (!drag || !svgRef.current) return;
    const point = getSvgPoint(event, svgRef.current);
    onMoveCharm(drag.charmId, clampCharmPosition(point.x + drag.dx, point.y + drag.dy));
  };

  const stopDraggingCharm = () => {
    dragRef.current = null;
  };

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
            strokeWidth="8"
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
                    event.preventDefault();
                    event.currentTarget.setPointerCapture?.(event.pointerId);
                    const point = getSvgPoint(event, svgRef.current);
                    const anchor = getCharmAnchor(charm);
                    dragRef.current = { charmId: charm.id, dx: anchor.x - point.x, dy: anchor.y - point.y };
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
  const isMetal = hardware.finish === "metal";

  return (
    <g filter="url(#softShadow)">
      <circle cx="390" cy="154" r="48" fill="none" stroke={isMetal ? "url(#metalHardware)" : hardware.value} strokeWidth="17" strokeLinecap="round" />
      {isMetal ? (
        <path d="M348 126 C338 140 336 158 344 176" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.55" />
      ) : null}
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

function getSvgPoint(event, svg) {
  if (!svg) return { x: 318, y: 452 };

  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
  const innerX = svgPoint.x;
  const innerY = svgPoint.y - 20;

  return {
    x: 390 + (innerX - 390) / 1.18,
    y: 370 + (innerY - 370) / 1.18,
  };
}

function clampCharmPosition(x, y) {
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
