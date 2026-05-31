import React, { useMemo, useState } from "react";
import { beads, cordColors, defaultDesign, hardwareColors } from "./data.js";

const beadById = new Map(beads.map((bead) => [bead.id, bead]));
const hardwareById = new Map(hardwareColors.map((color) => [color.id, color]));
const cordById = new Map(cordColors.map((color) => [color.id, color]));

export default function App() {
  const [design, setDesign] = useState(defaultDesign);
  const [beadFilter, setBeadFilter] = useState("all");

  const selectedHardware = hardwareById.get(design.hardwareColor) || hardwareColors[0];
  const selectedCord = cordById.get(design.cordColor) || cordColors[0];
  const selectedBeads = design.beads.map((item) => ({ ...beadById.get(item.id), key: item.key })).filter(Boolean);
  const selectedCharm = design.charm ? beadById.get(design.charm.beadId) : null;

  const filteredBeads = useMemo(() => {
    if (beadFilter === "all") return beads;
    if (beadFilter === "charm") return beads.filter((bead) => bead.suggestedUse.includes("charm"));
    return beads.filter((bead) => bead.shape === beadFilter);
  }, [beadFilter]);

  const addBead = (id) => {
    setDesign((current) => ({
      ...current,
      beads: [...current.beads, { id, key: `${id}-${crypto.randomUUID()}` }],
    }));
  };

  const removeBead = (key) => {
    setDesign((current) => ({
      ...current,
      beads: current.beads.filter((bead) => bead.key !== key),
    }));
  };

  const moveBead = (index, direction) => {
    setDesign((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.beads.length) return current;
      const next = [...current.beads];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return { ...current, beads: next };
    });
  };

  const setCharm = (beadId) => {
    setDesign((current) => ({
      ...current,
      charm: {
        beadId,
        attachmentPoint: current.charm?.attachmentPoint || "lowerLoop",
      },
    }));
  };

  return (
    <main className="app-shell">
      <section className="studio-stage" aria-label="Keychain preview">
        <div className="stage-topline">
          <div>
            <p className="eyebrow">Keychain Studio</p>
            <h1>Build your bead loot</h1>
          </div>
          <div className="save-slot" aria-label="Current design summary">
            <span>{selectedBeads.length} beads</span>
            <span>{selectedCharm ? "1 charm" : "no charm"}</span>
          </div>
        </div>

        <KeychainCanvas
          hardwareType={design.hardwareType}
          hardware={selectedHardware}
          cord={selectedCord}
          beads={selectedBeads}
          charm={selectedCharm}
          charmAttachment={design.charm?.attachmentPoint || "lowerLoop"}
        />

        <div className="stage-actions">
          <button type="button" className="primary-action" onClick={() => downloadPreview()}>
            Download PNG
          </button>
          <button type="button" onClick={() => setDesign(defaultDesign)}>
            Reset
          </button>
        </div>
      </section>

      <section className="editor-panel" aria-label="Keychain controls">
        <HardwarePicker design={design} setDesign={setDesign} />
        <CordPicker selected={design.cordColor} setDesign={setDesign} />
        <BeadTray filteredBeads={filteredBeads} filter={beadFilter} setFilter={setBeadFilter} addBead={addBead} />
        <BeadSequence beads={selectedBeads} removeBead={removeBead} moveBead={moveBead} />
        <CharmPicker design={design} setDesign={setDesign} setCharm={setCharm} selectedCharm={selectedCharm} />
      </section>
    </main>
  );
}

function HardwarePicker({ design, setDesign }) {
  return (
    <section className="tool-panel">
      <PanelHeader number="01" title="Hardware" />
      <div className="segmented" role="group" aria-label="Hardware type">
        <button
          type="button"
          className={design.hardwareType === "round" ? "active" : ""}
          onClick={() => setDesign((current) => ({ ...current, hardwareType: "round" }))}
        >
          Round ring
        </button>
        <button
          type="button"
          className={design.hardwareType === "clasp" ? "active" : ""}
          onClick={() => setDesign((current) => ({ ...current, hardwareType: "clasp" }))}
        >
          Clasp
        </button>
      </div>
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

function BeadTray({ filteredBeads, filter, setFilter, addBead }) {
  const filters = ["all", "star", "round", "cube", "barrel", "diamond"];

  return (
    <section className="tool-panel bead-tool">
      <PanelHeader number="03" title="Bead tray" />
      <div className="chip-row" role="group" aria-label="Filter bead options">
        {filters.map((item) => (
          <button key={item} type="button" className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>
            {item}
          </button>
        ))}
      </div>
      <div className="bead-grid">
        {filteredBeads.map((bead) => (
          <button key={bead.id} type="button" className="bead-card" onClick={() => addBead(bead.id)}>
            <img src={bead.src} alt="" />
            <span>{bead.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function BeadSequence({ beads, removeBead, moveBead }) {
  return (
    <section className="tool-panel">
      <PanelHeader number="04" title="Strand order" />
      <div className="sequence-list">
        {beads.map((bead, index) => (
          <div className="sequence-item" key={bead.key}>
            <img src={bead.src} alt="" />
            <span>{bead.name}</span>
            <div>
              <button type="button" onClick={() => moveBead(index, -1)} disabled={index === 0}>
                Up
              </button>
              <button type="button" onClick={() => moveBead(index, 1)} disabled={index === beads.length - 1}>
                Down
              </button>
              <button type="button" onClick={() => removeBead(bead.key)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CharmPicker({ design, setDesign, setCharm, selectedCharm }) {
  const charmOptions = beads.filter((bead) => bead.suggestedUse.includes("charm"));

  return (
    <section className="tool-panel">
      <PanelHeader number="05" title="Loop charm" />
      <div className="segmented" role="group" aria-label="Charm attachment">
        <button
          type="button"
          className={design.charm?.attachmentPoint === "hardwareLoop" ? "active" : ""}
          onClick={() =>
            setDesign((current) => ({
              ...current,
              charm: { beadId: current.charm?.beadId || charmOptions[0].id, attachmentPoint: "hardwareLoop" },
            }))
          }
        >
          Hardware loop
        </button>
        <button
          type="button"
          className={design.charm?.attachmentPoint !== "hardwareLoop" ? "active" : ""}
          onClick={() =>
            setDesign((current) => ({
              ...current,
              charm: { beadId: current.charm?.beadId || charmOptions[0].id, attachmentPoint: "lowerLoop" },
            }))
          }
        >
          Lower loop
        </button>
      </div>
      <div className="charm-strip">
        {charmOptions.map((bead) => (
          <button
            key={bead.id}
            type="button"
            className={selectedCharm?.id === bead.id ? "active" : ""}
            onClick={() => setCharm(bead.id)}
            aria-label={`Use ${bead.name} as charm`}
          >
            <img src={bead.src} alt="" />
          </button>
        ))}
      </div>
      <button type="button" className="full-width" onClick={() => setDesign((current) => ({ ...current, charm: null }))}>
        Remove charm
      </button>
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
          onClick={() => onPick(color.id)}
          aria-label={`${color.name} ${getMeta(color)}`}
        >
          <span style={{ "--swatch": color.value, "--accent": color.accent || color.value }} data-finish={color.finish || "cord"} />
          <b>{color.name}</b>
          <small>{getMeta(color)}</small>
        </button>
      ))}
    </div>
  );
}

function KeychainCanvas({ hardwareType, hardware, cord, beads, charm, charmAttachment }) {
  const beadSlots = beads.slice(0, 9);
  const isMetal = hardware.finish === "metal";

  return (
    <div className="canvas-wrap">
      <svg id="keychain-preview-svg" viewBox="0 0 780 860" role="img" aria-label="Completed keychain preview">
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
        </defs>

        <rect x="32" y="28" width="716" height="804" rx="34" fill="#fff7e8" />
        <path d="M62 154 C168 62 314 56 428 120 C578 204 624 390 531 532 C448 658 254 674 146 555 C53 454 44 270 144 181" fill="none" stroke="#f9b9d4" strokeWidth="3" strokeDasharray="10 12" opacity="0.55" />

        {hardwareType === "round" ? <RoundRing hardware={hardware} /> : <Clasp hardware={hardware} />}
        <Cord cord={cord} hardwareType={hardwareType} />
        <BeadStrand beads={beadSlots} />
        {charm ? <Charm bead={charm} attachment={charmAttachment} /> : null}

        <g className="sparkles" aria-hidden="true">
          <path d="M612 148 l11 25 25 11 -25 11 -11 25 -11 -25 -25 -11 25 -11z" fill="#ffe15a" />
          <path d="M146 701 l8 18 18 8 -18 8 -8 18 -8 -18 -18 -8 18 -8z" fill="#8df6dc" />
          <circle cx="628" cy="690" r="9" fill="#ff74a8" />
          <circle cx="122" cy="178" r="7" fill="#6ccfff" />
        </g>
      </svg>
    </div>
  );
}

function RoundRing() {
  return (
    <g filter="url(#softShadow)">
      <circle cx="390" cy="148" r="90" fill="none" stroke="url(#metalHardware)" strokeWidth="30" strokeLinecap="round" />
      <circle cx="333" cy="205" r="12" fill="url(#metalHardware)" stroke="#3b3327" strokeWidth="3" opacity="0.65" />
      <path d="M318 232 l30 -18" stroke="#2f241c" strokeWidth="5" strokeLinecap="round" opacity="0.55" />
      <path d="M322 78 C348 42 425 42 459 77" stroke="#fff" strokeWidth="7" strokeLinecap="round" opacity="0.55" />
    </g>
  );
}

function Clasp() {
  return (
    <g filter="url(#softShadow)">
      <path d="M326 202 V116 C326 54 454 54 454 116 V192" fill="none" stroke="url(#metalHardware)" strokeWidth="30" strokeLinecap="round" />
      <rect x="294" y="188" width="190" height="76" rx="18" fill="url(#metalHardware)" stroke="#35281e" strokeWidth="4" opacity="0.96" />
      <circle cx="450" cy="226" r="18" fill="#fff7e8" stroke="url(#metalHardware)" strokeWidth="8" />
      <circle cx="390" cy="306" r="50" fill="none" stroke="url(#metalHardware)" strokeWidth="18" />
      <path d="M431 82 C452 100 462 136 450 174" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.45" />
    </g>
  );
}

function Cord({ hardwareType }) {
  const startY = hardwareType === "round" ? 232 : 348;

  return (
    <g filter="url(#tinyShadow)">
      <path d={`M390 ${startY} C304 288 258 390 286 486 C310 570 470 570 496 486 C524 390 476 288 390 ${startY}`} fill="none" stroke="url(#cordBraid)" strokeWidth="30" strokeLinecap="round" />
      <path d={`M390 ${startY} C304 288 258 390 286 486 C310 570 470 570 496 486 C524 390 476 288 390 ${startY}`} fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" opacity="0.38" />
      <circle cx="390" cy={startY + 6} r="22" fill="url(#cordBraid)" />
    </g>
  );
}

function BeadStrand({ beads }) {
  const slots = [
    [286, 403, -18],
    [304, 468, 10],
    [347, 515, -8],
    [404, 530, 12],
    [461, 512, -14],
    [502, 464, 12],
    [508, 397, -10],
    [474, 334, 14],
    [414, 304, -8],
  ];

  return (
    <g filter="url(#tinyShadow)">
      {beads.map((bead, index) => {
        const [x, y, rotate] = slots[index] || slots[slots.length - 1];
        const size = bead.shape === "star" ? 88 : 72;
        return (
          <image
            key={bead.key}
            href={bead.src}
            x={x - size / 2}
            y={y - size / 2}
            width={size}
            height={size}
            transform={`rotate(${rotate} ${x} ${y})`}
            preserveAspectRatio="xMidYMid meet"
          />
        );
      })}
    </g>
  );
}

function Charm({ bead, attachment }) {
  const anchor = attachment === "hardwareLoop" ? { x: 320, y: 224 } : { x: 510, y: 493 };
  const charm = attachment === "hardwareLoop" ? { x: 258, y: 302 } : { x: 574, y: 592 };

  return (
    <g filter="url(#tinyShadow)">
      <path d={`M${anchor.x} ${anchor.y} C${anchor.x - 14} ${anchor.y + 28} ${charm.x + 12} ${charm.y - 50} ${charm.x} ${charm.y - 22}`} fill="none" stroke="#d8b35d" strokeWidth="7" strokeLinecap="round" />
      <circle cx={anchor.x} cy={anchor.y} r="14" fill="none" stroke="url(#metalHardware)" strokeWidth="7" />
      <circle cx={charm.x} cy={charm.y - 24} r="13" fill="none" stroke="url(#metalHardware)" strokeWidth="7" />
      <image href={bead.src} x={charm.x - 54} y={charm.y - 20} width="108" height="108" preserveAspectRatio="xMidYMid meet" />
    </g>
  );
}

function shade(hex, amount) {
  const color = hex.replace("#", "");
  const number = parseInt(color, 16);
  const r = Math.max(0, Math.min(255, (number >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((number >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (number & 0xff) + amount));
  return `#${(b | (g << 8) | (r << 16)).toString(16).padStart(6, "0")}`;
}

async function downloadPreview() {
  const svg = document.getElementById("keychain-preview-svg");
  if (!svg) return;

  const clone = svg.cloneNode(true);
  const imageNodes = [...clone.querySelectorAll("image")];

  await Promise.all(
    imageNodes.map(async (node) => {
      const href = node.getAttribute("href");
      if (!href || href.startsWith("data:")) return;
      const response = await fetch(href);
      const blob = await response.blob();
      const dataUrl = await blobToDataUrl(blob);
      node.setAttribute("href", dataUrl);
    }),
  );

  const svgText = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const image = new Image();

  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1560;
    canvas.height = 1720;
    const context = canvas.getContext("2d");
    context.fillStyle = "#fff7e8";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    const link = document.createElement("a");
    link.download = "keychain-studio-design.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  image.src = url;
}

function blobToDataUrl(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}
