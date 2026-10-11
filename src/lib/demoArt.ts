// Self-contained SVG artwork for theme demos & landing previews.
// No external images: always instant, always sharp, works offline.
// Niche themes get realistic product illustrations (not emoji) so demo
// previews look like real stores.
const enc = (s: string) => `data:image/svg+xml;utf8,${encodeURIComponent(s)}`;

interface Backdrop { bg: [string, string]; glow: string; dark: boolean }
const BACKDROP: Record<string, Backdrop> = {
  gadget: { bg: ["#14141d", "#22222f"], glow: "#7c3aed", dark: true },
  jewel: { bg: ["#0a0a0c", "#17171c"], glow: "#d4af37", dark: true },
  kids: { bg: ["#fff7ed", "#ffedd5"], glow: "#fb923c", dark: false },
  beauty: { bg: ["#fff1f2", "#ffe4e6"], glow: "#fb7185", dark: false },
  organic: { bg: ["#f0fdf4", "#d9f5e3"], glow: "#22c55e", dark: false },
  pharma: { bg: ["#f0fdfa", "#c9f5ee"], glow: "#2dd4bf", dark: false },
  minimal: { bg: ["#fafafa", "#eef0f3"], glow: "#94a3b8", dark: false },
  lifestyle: { bg: ["#fafafa", "#edf0f4"], glow: "#0ea5e9", dark: false },
  food: { bg: ["#fffbeb", "#fef3c7"], glow: "#f59e0b", dark: false },
  furniture: { bg: ["#faf6ef", "#f0e6d4"], glow: "#b45309", dark: false },
  sport: { bg: ["#f8fafc", "#e2e8f0"], glow: "#ef4444", dark: false },
};

type Draw = (u: string) => string;

function frame(theme: string, seed: number, draw: Draw): string {
  const b = BACKDROP[theme] ?? BACKDROP.minimal;
  const u = `n${seed}`;
  const inner = draw(u);
  return enc(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">` +
    `<defs>` +
    `<radialGradient id="${u}g" cx="0.5" cy="0.36" r="0.9">` +
    `<stop offset="0" stop-color="${b.glow}" stop-opacity="0.32"/>` +
    `<stop offset="0.55" stop-color="${b.glow}" stop-opacity="0.07"/>` +
    `<stop offset="1" stop-color="${b.glow}" stop-opacity="0"/>` +
    `</radialGradient>` +
    `<linearGradient id="${u}b" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${b.bg[0]}"/><stop offset="1" stop-color="${b.bg[1]}"/>` +
    `</linearGradient></defs>` +
    `<rect width="600" height="600" fill="url(#${u}b)"/>` +
    `<rect width="600" height="600" fill="url(#${u}g)"/>` +
    `<ellipse cx="300" cy="496" rx="152" ry="20" fill="${b.dark ? "#000000" : "#1e293b"}" opacity="${b.dark ? "0.5" : "0.14"}"/>` +
    inner +
    `</svg>`
  );
}

const spark = (x: number, y: number, r: number, col = "#ffffff", op = 0.9) =>
  `<path d="M${x},${y - r} Q${x + r * 0.18},${y - r * 0.18} ${x + r},${y} Q${x + r * 0.18},${y + r * 0.18} ${x},${y + r} Q${x - r * 0.18},${y + r * 0.18} ${x - r},${y} Q${x - r * 0.18},${y - r * 0.18} ${x},${y - r} Z" fill="${col}" opacity="${op}"/>`;

/* ------------------------------- GADGET (dark) ------------------------------- */
const GADGET: Record<string, Draw> = {
  headphones: (u) => `<defs><linearGradient id="${u}c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#45454f"/><stop offset="0.5" stop-color="#1d1d24"/><stop offset="1" stop-color="#3a3a45"/></linearGradient></defs>` +
    `<path d="M175,305 Q175,140 300,140 Q425,140 425,305" stroke="#33333d" stroke-width="34" fill="none" stroke-linecap="round"/>` +
    `<path d="M175,305 Q175,140 300,140 Q425,140 425,305" stroke="#a78bfa" stroke-width="6" fill="none" opacity="0.55"/>` +
    `<rect x="138" y="272" width="86" height="158" rx="43" fill="url(#${u}c)"/>` +
    `<rect x="376" y="272" width="86" height="158" rx="43" fill="url(#${u}c)"/>` +
    `<rect x="150" y="292" width="62" height="118" rx="31" fill="#101014"/>` +
    `<rect x="388" y="292" width="62" height="118" rx="31" fill="#101014"/>` +
    `<rect x="152" y="292" width="20" height="100" rx="10" fill="#ffffff" opacity="0.14"/>` +
    `<rect x="390" y="292" width="20" height="100" rx="10" fill="#ffffff" opacity="0.14"/>` +
    spark(480, 180, 16) + spark(120, 420, 10, "#a78bfa", 0.8),
  smartwatch: (u) => `<defs><linearGradient id="${u}m" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#55555f"/><stop offset="0.5" stop-color="#26262e"/><stop offset="1" stop-color="#43434d"/></linearGradient>` +
    `<linearGradient id="${u}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8b5cf6"/><stop offset="1" stop-color="#2563eb"/></linearGradient></defs>` +
    `<rect x="270" y="86" width="60" height="120" rx="28" fill="#2b2b34"/><rect x="270" y="394" width="60" height="120" rx="28" fill="#2b2b34"/>` +
    `<rect x="212" y="192" width="176" height="236" rx="52" fill="url(#${u}m)"/>` +
    `<rect x="230" y="210" width="140" height="200" rx="40" fill="url(#${u}s)"/>` +
    `<rect x="386" y="262" width="14" height="44" rx="7" fill="#3d3d47"/>` +
    `<path d="M250,320 L272,320 L282,296 L294,340 L304,310 L330,310" stroke="#ffffff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<rect x="242" y="220" width="22" height="150" rx="11" fill="#ffffff" opacity="0.22"/>` +
    spark(470, 160, 14, "#a78bfa"),
  earbuds: (u) => `<defs><linearGradient id="${u}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3c3c47"/><stop offset="1" stop-color="#1b1b22"/></linearGradient></defs>` +
    `<rect x="228" y="238" width="58" height="112" rx="29" fill="#ececf2"/><circle cx="257" cy="238" r="20" fill="#d5d5dd"/><circle cx="257" cy="350" r="14" fill="#2b2b34"/>` +
    `<rect x="314" y="238" width="58" height="112" rx="29" fill="#ececf2"/><circle cx="343" cy="238" r="20" fill="#d5d5dd"/><circle cx="343" cy="350" r="14" fill="#2b2b34"/>` +
    `<rect x="196" y="352" width="208" height="126" rx="42" fill="url(#${u}c)"/>` +
    `<rect x="196" y="352" width="208" height="40" rx="20" fill="#4a4a56"/>` +
    `<circle cx="300" cy="430" r="9" fill="#a78bfa"/>` +
    `<rect x="212" y="366" width="24" height="90" rx="12" fill="#ffffff" opacity="0.12"/>` +
    spark(150, 200, 12, "#a78bfa", 0.8),
  speaker: (u) => `<defs><linearGradient id="${u}b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3d3d48"/><stop offset="0.5" stop-color="#1c1c23"/><stop offset="1" stop-color="#33333d"/></linearGradient></defs>` +
    `<rect x="222" y="150" width="156" height="330" rx="72" fill="url(#${u}b)"/>` +
    `<ellipse cx="300" cy="152" rx="78" ry="20" fill="#2b2b34"/>` +
    Array.from({ length: 6 }, (_, r) => Array.from({ length: 3 }, (_, c) => `<circle cx="${262 + c * 38}" cy="${215 + r * 40}" r="6" fill="#0e0e12"/>`).join("")).join("") +
    `<ellipse cx="300" cy="438" rx="56" ry="15" stroke="#a78bfa" stroke-width="7" fill="none" opacity="0.9"/>` +
    `<rect x="244" y="180" width="24" height="270" rx="12" fill="#ffffff" opacity="0.1"/>`,
  drone: (u) => `<defs><linearGradient id="${u}d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#46464f"/><stop offset="1" stop-color="#212128"/></linearGradient></defs>` +
    `<line x1="250" y1="300" x2="168" y2="228" stroke="#33333c" stroke-width="15" stroke-linecap="round"/>` +
    `<line x1="350" y1="300" x2="432" y2="228" stroke="#33333c" stroke-width="15" stroke-linecap="round"/>` +
    `<line x1="250" y1="322" x2="168" y2="392" stroke="#33333c" stroke-width="15" stroke-linecap="round"/>` +
    `<line x1="350" y1="322" x2="432" y2="392" stroke="#33333c" stroke-width="15" stroke-linecap="round"/>` +
    [[168, 228], [432, 228], [168, 392], [432, 392]].map(([x, y]) => `<ellipse cx="${x}" cy="${y - 14}" rx="58" ry="11" fill="#54545f" opacity="0.85"/><circle cx="${x}" cy="${y}" r="15" fill="#3c3c46"/>`).join("") +
    `<rect x="240" y="272" width="120" height="76" rx="32" fill="url(#${u}d)"/>` +
    `<circle cx="300" cy="348" r="21" fill="#101014"/><circle cx="300" cy="348" r="11" fill="#7c3aed"/><circle cx="304" cy="344" r="4" fill="#ffffff"/>` +
    `<line x1="262" y1="348" x2="262" y2="410" stroke="#33333c" stroke-width="10" stroke-linecap="round"/>` +
    `<line x1="338" y1="348" x2="338" y2="410" stroke="#33333c" stroke-width="10" stroke-linecap="round"/>` +
    spark(150, 150, 12, "#a78bfa", 0.7),
  phone: (u) => `<defs><linearGradient id="${u}p" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#484852"/><stop offset="0.5" stop-color="#232329"/><stop offset="1" stop-color="#3c3c46"/></linearGradient>` +
    `<linearGradient id="${u}w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a78bfa"/><stop offset="0.6" stop-color="#6366f1"/><stop offset="1" stop-color="#0ea5e9"/></linearGradient></defs>` +
    `<rect x="228" y="128" width="144" height="356" rx="38" fill="url(#${u}p)"/>` +
    `<rect x="240" y="146" width="120" height="320" rx="28" fill="url(#${u}w)"/>` +
    `<rect x="282" y="146" width="36" height="13" rx="6.5" fill="#101014"/>` +
    `<circle cx="300" cy="400" r="26" fill="#ffffff" opacity="0.25"/><circle cx="300" cy="400" r="26" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.5"/>` +
    `<rect x="252" y="160" width="16" height="200" rx="8" fill="#ffffff" opacity="0.2"/>`,
  gamepad: (u) => `<defs><linearGradient id="${u}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f3f49"/><stop offset="1" stop-color="#1e1e25"/></linearGradient></defs>` +
    `<path d="M205,285 Q205,238 258,238 L342,238 Q395,238 395,285 L418,368 Q424,408 388,402 Q358,397 350,360 L250,360 Q242,397 212,402 Q176,408 182,368 Z" fill="url(#${u}g)"/>` +
    `<rect x="238" y="292" width="22" height="64" rx="8" fill="#15151a"/><rect x="227" y="303" width="44" height="22" rx="8" fill="#15151a"/>` +
    `<circle cx="345" cy="292" r="13" fill="#22c55e"/><circle cx="372" cy="312" r="13" fill="#ef4444"/><circle cx="345" cy="332" r="13" fill="#3b82f6"/><circle cx="318" cy="312" r="13" fill="#eab308"/>` +
    `<circle cx="282" cy="352" r="17" fill="#15151a"/><circle cx="282" cy="352" r="8" fill="#2e2e37"/>` +
    `<rect x="222" y="252" width="20" height="70" rx="10" fill="#ffffff" opacity="0.1"/>`,
  camera: (u) => `<defs><linearGradient id="${u}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#41414b"/><stop offset="1" stop-color="#1f1f26"/></linearGradient>` +
    `<radialGradient id="${u}l" cx="0.4" cy="0.35" r="0.9"><stop offset="0" stop-color="#7dd3fc"/><stop offset="0.5" stop-color="#1e3a5f"/><stop offset="1" stop-color="#0b0b0f"/></radialGradient></defs>` +
    `<rect x="262" y="216" width="76" height="52" rx="12" fill="#33333c"/>` +
    `<rect x="182" y="252" width="236" height="142" rx="26" fill="url(#${u}c)"/>` +
    `<circle cx="300" cy="323" r="64" fill="#101014"/><circle cx="300" cy="323" r="52" fill="url(#${u}l)"/>` +
    `<circle cx="282" cy="304" r="12" fill="#ffffff" opacity="0.75"/>` +
    `<rect x="196" y="266" width="34" height="20" rx="6" fill="#a78bfa" opacity="0.85"/>` +
    `<rect x="182" y="252" width="60" height="142" rx="26" fill="#2b2b33"/>`,
};

/* ------------------------------- JEWEL (black & gold) ------------------------------- */
const GOLD_A = "#f5d76e", GOLD_B = "#d4af37", GOLD_C = "#9a7b1e";
const JEWEL: Record<string, Draw> = {
  ring: (u) => `<defs><linearGradient id="${u}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${GOLD_A}"/><stop offset="0.5" stop-color="${GOLD_B}"/><stop offset="1" stop-color="${GOLD_C}"/></linearGradient></defs>` +
    `<circle cx="300" cy="345" r="104" stroke="url(#${u}g)" stroke-width="30" fill="none"/>` +
    `<path d="M232,300 A104,104 0 0 1 300,241" stroke="#ffffff" stroke-width="9" fill="none" opacity="0.55" stroke-linecap="round"/>` +
    `<polygon points="300,148 258,208 342,208" fill="#e8f4ff"/>` +
    `<polygon points="258,208 342,208 300,282" fill="#bcd9f5"/>` +
    `<polygon points="258,208 279,208 300,282" fill="#dff0ff" opacity="0.8"/>` +
    `<polygon points="279,178 321,178 310,208 290,208" fill="#ffffff" opacity="0.9"/>` +
    `<rect x="288" y="196" width="24" height="14" fill="url(#${u}g)"/>` +
    spark(300, 178, 20) + spark(196, 240, 12) + spark(404, 250, 10, GOLD_A),
  necklace: (u) => `<defs><linearGradient id="${u}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${GOLD_A}"/><stop offset="1" stop-color="${GOLD_C}"/></linearGradient></defs>` +
    `<path d="M168,108 C168,300 226,414 300,424 C374,414 432,300 432,108" stroke="url(#${u}g)" stroke-width="7" fill="none"/>` +
    Array.from({ length: 22 }, (_, i) => { const t = i / 21; const x = 168 + (432 - 168) * t; const y = 108 + (424 - 108) * Math.sin(t * Math.PI) * 0.98 + 8 * Math.sin(t * Math.PI); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.5" fill="url(#${u}g)"/>`; }).join("") +
    `<path d="M300,424 C272,448 264,478 300,502 C336,478 328,448 300,424 Z" fill="url(#${u}g)"/>` +
    `<circle cx="300" cy="464" r="15" fill="#e8f4ff"/><circle cx="295" cy="459" r="5" fill="#ffffff"/>` +
    spark(300, 430, 12, "#ffffff", 0.9) + spark(180, 200, 10, GOLD_A, 0.8),
  earrings: (u) => `<defs><linearGradient id="${u}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${GOLD_A}"/><stop offset="1" stop-color="${GOLD_C}"/></linearGradient></defs>` +
    [242, 358].map((x) => `<path d="M${x},150 q0,-34 30,-34" stroke="url(#${u}g)" stroke-width="7" fill="none" stroke-linecap="round"/>` +
      `<circle cx="${x}" cy="168" r="7" fill="url(#${u}g)"/>` +
      `<path d="M${x},180 C${x - 26},206 ${x - 30},238 ${x},262 C${x + 30},238 ${x + 26},206 ${x},180 Z" fill="url(#${u}g)"/>` +
      `<circle cx="${x}" cy="224" r="11" fill="#dff0ff"/><circle cx="${x - 4}" cy="220" r="4" fill="#ffffff"/>`).join("") +
    spark(300, 300, 14) + spark(180, 330, 10, GOLD_A, 0.8),
  bracelet: (u) => `<defs><linearGradient id="${u}g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${GOLD_C}"/><stop offset="0.5" stop-color="${GOLD_A}"/><stop offset="1" stop-color="${GOLD_C}"/></linearGradient></defs>` +
    `<ellipse cx="300" cy="330" rx="136" ry="112" stroke="url(#${u}g)" stroke-width="26" fill="none"/>` +
    `<path d="M196,280 A136,112 0 0 1 300,218" stroke="#ffffff" stroke-width="8" fill="none" opacity="0.5" stroke-linecap="round"/>` +
    `<polygon points="300,428 282,452 318,452" fill="#e8f4ff"/><polygon points="282,452 318,452 300,476" fill="#bcd9f5"/>` +
    `<circle cx="300" cy="452" r="6" fill="url(#${u}g)"/>` +
    spark(420, 260, 12, GOLD_A, 0.85) + spark(180, 380, 10),
  diamond: (u) => `<defs><linearGradient id="${u}d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2f9ff"/><stop offset="1" stop-color="#a9cdf2"/></linearGradient></defs>` +
    `<polygon points="215,265 385,265 340,195 260,195" fill="url(#${u}d)"/>` +
    `<polygon points="215,265 385,265 300,415" fill="#9dc0e8"/>` +
    `<polygon points="215,265 260,265 300,415" fill="#c2dcf7"/>` +
    `<polygon points="340,265 385,265 300,415" fill="#8fb4dd"/>` +
    `<polygon points="260,195 340,195 322,225 278,225" fill="#ffffff" opacity="0.95"/>` +
    `<line x1="260" y1="195" x2="278" y2="265" stroke="#ffffff" stroke-width="3" opacity="0.7"/>` +
    `<line x1="340" y1="195" x2="322" y2="265" stroke="#ffffff" stroke-width="3" opacity="0.7"/>` +
    `<line x1="300" y1="195" x2="300" y2="415" stroke="#ffffff" stroke-width="3" opacity="0.6"/>` +
    spark(300, 180, 22) + spark(200, 300, 14) + spark(410, 320, 12, GOLD_A, 0.9),
  chain: (u) => `<defs><linearGradient id="${u}g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${GOLD_A}"/><stop offset="1" stop-color="${GOLD_C}"/></linearGradient></defs>` +
    Array.from({ length: 11 }, (_, i) => { const t = i / 10; const x = 150 + 300 * t; const y = 200 + 190 * Math.sin(t * Math.PI); const r = i % 2 ? 24 : -24; return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="30" ry="18" fill="none" stroke="url(#${u}g)" stroke-width="11" transform="rotate(${r} ${x.toFixed(1)} ${y.toFixed(1)})"/>`; }).join("") +
    `<circle cx="300" cy="430" r="26" fill="url(#${u}g)"/><circle cx="300" cy="430" r="12" fill="#0a0a0c"/>` +
    spark(160, 160, 12, GOLD_A, 0.8) + spark(440, 170, 10),
  brooch: (u) => `<defs><radialGradient id="${u}p" cx="0.5" cy="0.4" r="0.8"><stop offset="0" stop-color="${GOLD_A}"/><stop offset="1" stop-color="${GOLD_C}"/></radialGradient></defs>` +
    Array.from({ length: 6 }, (_, i) => { const a = i * 60; return `<ellipse cx="300" cy="300" rx="44" ry="95" fill="url(#${u}p)" transform="rotate(${a} 300 300)" opacity="0.95"/>`; }).join("") +
    `<circle cx="300" cy="300" r="44" fill="#dff0ff"/><circle cx="300" cy="300" r="30" fill="#bcd9f5"/>` +
    `<circle cx="290" cy="290" r="10" fill="#ffffff" opacity="0.9"/>` +
    `<circle cx="300" cy="300" r="52" fill="none" stroke="url(#${u}p)" stroke-width="6"/>` +
    spark(300, 170, 14) + spark(430, 350, 12, GOLD_A, 0.85),
  pearls: (u) => `<defs><radialGradient id="${u}w" cx="0.35" cy="0.3" r="0.9"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d9d4c7"/></radialGradient></defs>` +
    Array.from({ length: 15 }, (_, i) => { const t = i / 14; const x = 170 + 260 * t; const y = 150 + 250 * Math.sin(t * Math.PI); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="19" fill="url(#${u}w)"/><circle cx="${(x - 6).toFixed(1)}" cy="${(y - 6).toFixed(1)}" r="6" fill="#ffffff" opacity="0.9"/>`; }).join("") +
    `<rect x="288" y="392" width="24" height="34" rx="8" fill="${GOLD_B}"/>` +
    spark(170, 130, 12) + spark(430, 140, 10, GOLD_A, 0.8),
};

/* ------------------------------- KIDS (bright & playful) ------------------------------- */
const KIDS: Record<string, Draw> = {
  teddy: () => `<circle cx="232" cy="158" r="34" fill="#a06a42"/><circle cx="368" cy="158" r="34" fill="#a06a42"/>` +
    `<circle cx="232" cy="158" r="16" fill="#e8c39a"/><circle cx="368" cy="158" r="16" fill="#e8c39a"/>` +
    `<ellipse cx="212" cy="380" rx="32" ry="62" fill="#a06a42" transform="rotate(18 212 380)"/>` +
    `<ellipse cx="388" cy="380" rx="32" ry="62" fill="#a06a42" transform="rotate(-18 388 380)"/>` +
    `<ellipse cx="300" cy="392" rx="96" ry="106" fill="#b07a4f"/>` +
    `<ellipse cx="300" cy="404" rx="56" ry="66" fill="#e8c39a"/>` +
    `<ellipse cx="248" cy="486" rx="38" ry="30" fill="#a06a42"/><ellipse cx="352" cy="486" rx="38" ry="30" fill="#a06a42"/>` +
    `<circle cx="300" cy="208" r="76" fill="#b07a4f"/>` +
    `<ellipse cx="300" cy="234" rx="40" ry="30" fill="#e8c39a"/>` +
    `<ellipse cx="300" cy="220" rx="13" ry="10" fill="#4a2e18"/>` +
    `<circle cx="272" cy="192" r="10" fill="#2d1f14"/><circle cx="328" cy="192" r="10" fill="#2d1f14"/>` +
    `<circle cx="275" cy="189" r="3.5" fill="#ffffff"/><circle cx="331" cy="189" r="3.5" fill="#ffffff"/>` +
    `<path d="M282,244 Q300,256 318,244" stroke="#4a2e18" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  blocks: () => ([["#ef4444", 200, 310, "A"], ["#3b82f6", 322, 310, "B"], ["#f59e0b", 261, 196, "C"]] as [string, number, number, string][]).map(([c, x, y, L]) =>
    `<rect x="${x}" y="${y}" width="118" height="118" rx="16" fill="${c}"/>` +
    `<rect x="${x}" y="${y}" width="118" height="118" rx="16" fill="none" stroke="#ffffff" stroke-width="6" opacity="0.35"/>` +
    `<text x="${x + 59}" y="${y + 84}" font-family="system-ui" font-size="64" font-weight="800" text-anchor="middle" fill="#ffffff">${L}</text>`).join("") +
    `<ellipse cx="300" cy="452" rx="120" ry="14" fill="#000000" opacity="0.06"/>`,
  toycar: () => `<path d="M168,362 Q168,318 222,312 L252,268 Q262,252 284,252 L344,252 Q366,252 376,268 L406,312 Q458,318 458,362 L452,392 L174,392 Z" fill="#ef4444"/>` +
    `<path d="M262,276 L282,262 L342,262 L362,276 L356,306 L268,306 Z" fill="#bfe3ff"/>` +
    `<rect x="400" y="300" width="52" height="16" rx="8" fill="#b91c1c"/>` +
    `<circle cx="244" cy="392" r="40" fill="#1f2937"/><circle cx="244" cy="392" r="17" fill="#d1d5db"/><circle cx="244" cy="392" r="6" fill="#6b7280"/>` +
    `<circle cx="384" cy="392" r="40" fill="#1f2937"/><circle cx="384" cy="392" r="17" fill="#d1d5db"/><circle cx="384" cy="392" r="6" fill="#6b7280"/>` +
    `<rect x="180" y="330" width="60" height="14" rx="7" fill="#fca5a5"/>` +
    spark(140, 220, 12, "#fbbf24", 0.9),
  ball: () => { const cols = ["#ef4444", "#ffffff", "#f59e0b", "#ffffff", "#3b82f6", "#ffffff"]; return `<circle cx="300" cy="320" r="112" fill="#ffffff"/>` +
    cols.map((c, i) => { const a0 = (i * 60 - 90) * Math.PI / 180, a1 = ((i + 1) * 60 - 90) * Math.PI / 180;
      return `<path d="M300,320 L${(300 + 112 * Math.cos(a0)).toFixed(1)},${(320 + 112 * Math.sin(a0)).toFixed(1)} A112,112 0 0 1 ${(300 + 112 * Math.cos(a1)).toFixed(1)},${(320 + 112 * Math.sin(a1)).toFixed(1)} Z" fill="${c}"/>`; }).join("") +
    `<circle cx="300" cy="320" r="30" fill="#ffffff"/><ellipse cx="262" cy="272" rx="34" ry="20" fill="#ffffff" opacity="0.5" transform="rotate(-30 262 272)"/>`; },
  robot: () => `<line x1="300" y1="150" x2="300" y2="112" stroke="#64748b" stroke-width="10" stroke-linecap="round"/><circle cx="300" cy="102" r="14" fill="#ef4444"/>` +
    `<rect x="238" y="150" width="124" height="104" rx="26" fill="#94a3b8"/>` +
    `<rect x="238" y="150" width="124" height="104" rx="26" fill="none" stroke="#64748b" stroke-width="6"/>` +
    `<circle cx="278" cy="196" r="17" fill="#0ea5e9"/><circle cx="322" cy="196" r="17" fill="#0ea5e9"/>` +
    `<circle cx="278" cy="196" r="7" fill="#ffffff"/><circle cx="322" cy="196" r="7" fill="#ffffff"/>` +
    `<rect x="272" y="226" width="56" height="12" rx="6" fill="#475569"/>` +
    `<rect x="232" y="262" width="136" height="150" rx="22" fill="#64748b"/>` +
    `<circle cx="300" cy="310" r="24" fill="#f59e0b"/><circle cx="300" cy="310" r="12" fill="#fbbf24"/>` +
    `<circle cx="266" cy="356" r="10" fill="#22c55e"/><circle cx="300" cy="356" r="10" fill="#ef4444"/><circle cx="334" cy="356" r="10" fill="#3b82f6"/>` +
    `<rect x="196" y="280" width="28" height="90" rx="14" fill="#94a3b8"/><rect x="376" y="280" width="28" height="90" rx="14" fill="#94a3b8"/>` +
    `<rect x="252" y="412" width="36" height="60" rx="14" fill="#475569"/><rect x="312" y="412" width="36" height="60" rx="14" fill="#475569"/>` +
    `<rect x="244" y="462" width="52" height="22" rx="10" fill="#334155"/><rect x="304" y="462" width="52" height="22" rx="10" fill="#334155"/>`,
  kite: () => `<polygon points="300,130 300,300 190,300" fill="#ef4444"/><polygon points="300,130 410,300 300,300" fill="#f59e0b"/>` +
    `<polygon points="190,300 300,300 300,470" fill="#3b82f6"/><polygon points="300,300 410,300 300,470" fill="#22c55e"/>` +
    `<line x1="300" y1="130" x2="300" y2="470" stroke="#ffffff" stroke-width="6" opacity="0.7"/>` +
    `<line x1="190" y1="300" x2="410" y2="300" stroke="#ffffff" stroke-width="6" opacity="0.7"/>` +
    `<path d="M300,470 Q290,510 310,530 Q330,550 315,575" stroke="#92400e" stroke-width="6" fill="none"/>` +
    `<polygon points="306,522 326,530 308,542" fill="#f472b6"/><polygon points="318,556 338,562 322,576" fill="#60a5fa"/>`,
  rings: () => `<ellipse cx="300" cy="452" rx="96" ry="20" fill="#d97706"/>` +
    `<rect x="291" y="170" width="18" height="282" rx="9" fill="#92400e"/>` +
    (([["#ef4444", 404, 74], ["#f59e0b", 358, 64], ["#22c55e", 314, 54], ["#3b82f6", 272, 44]]) as [string, number, number][]).map(([c, y, rx]) =>
      `<ellipse cx="300" cy="${y}" rx="${rx}" ry="22" fill="${c}"/>` +
      `<ellipse cx="300" cy="${y - 6}" rx="${rx}" ry="18" fill="#ffffff" opacity="0.25"/>`).join("") +
    `<circle cx="300" cy="196" r="24" fill="#f472b6"/>`,
  puzzle: () => { const P = (x: number, y: number, c: string, rot: number) => `<g transform="rotate(${rot} ${x + 55} ${y + 55})">` +
    `<rect x="${x}" y="${y}" width="110" height="110" rx="18" fill="${c}"/>` +
    `<circle cx="${x + 55}" cy="${y}" r="20" fill="${c}"/><circle cx="${x + 110}" cy="${y + 55}" r="20" fill="${c}"/>` +
    `<rect x="${x + 14}" y="${y + 14}" width="82" height="82" rx="12" fill="#ffffff" opacity="0.2"/></g>`; return P(190, 200, "#ef4444", 0) + P(310, 200, "#3b82f6", 0) + P(190, 320, "#f59e0b", 0) + P(310, 320, "#22c55e", 0); },
};

/* ------------------------------- BEAUTY (soft rose) ------------------------------- */
const BEAUTY: Record<string, Draw> = {
  serum: (u) => `<defs><linearGradient id="${u}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fda4af"/><stop offset="1" stop-color="#f43f5e"/></linearGradient></defs>` +
    `<rect x="288" y="148" width="24" height="52" rx="8" fill="#fce7f3" opacity="0.9"/>` +
    `<rect x="270" y="192" width="60" height="72" rx="12" fill="#27272a"/>` +
    `<rect x="270" y="192" width="60" height="72" rx="12" fill="none" stroke="#52525b" stroke-width="4"/>` +
    `<rect x="252" y="262" width="96" height="196" rx="22" fill="#ffffff" opacity="0.6"/>` +
    `<rect x="252" y="330" width="96" height="128" rx="22" fill="url(#${u}l)" opacity="0.85"/>` +
    `<rect x="262" y="330" width="76" height="52" rx="8" fill="#ffffff"/>` +
    `<rect x="272" y="342" width="56" height="7" rx="3.5" fill="#f9a8d4"/><rect x="272" y="356" width="40" height="7" rx="3.5" fill="#fbcfe8"/>` +
    `<rect x="262" y="276" width="14" height="150" rx="7" fill="#ffffff" opacity="0.7"/>` +
    spark(420, 220, 12, "#f9a8d4", 0.9) + spark(180, 360, 10),
  cream: (u) => `<defs><linearGradient id="${u}j" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ffe4e6"/></linearGradient>` +
    `<linearGradient id="${u}ld" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f0ab9e"/><stop offset="0.5" stop-color="#e8b4a0"/><stop offset="1" stop-color="#d6937f"/></linearGradient></defs>` +
    `<rect x="212" y="288" width="176" height="52" rx="22" fill="url(#${u}ld)"/>` +
    `<rect x="222" y="336" width="156" height="118" rx="26" fill="url(#${u}j)"/>` +
    `<rect x="222" y="336" width="156" height="118" rx="26" fill="none" stroke="#fecdd3" stroke-width="4"/>` +
    `<ellipse cx="300" cy="392" rx="52" ry="30" fill="#ffffff"/>` +
    `<rect x="282" y="376" width="36" height="8" rx="4" fill="#f9a8d4"/><rect x="288" y="390" width="24" height="8" rx="4" fill="#fbcfe8"/>` +
    `<rect x="236" y="348" width="16" height="90" rx="8" fill="#ffffff" opacity="0.8"/>` +
    spark(430, 300, 12, "#f9a8d4", 0.9),
  lipstick: (u) => `<defs><linearGradient id="${u}b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e11d48"/><stop offset="1" stop-color="#9f1239"/></linearGradient></defs>` +
    `<path d="M273,360 L273,296 Q273,272 297,262 Q321,272 321,296 L321,360 Z" fill="url(#${u}b)"/>` +
    `<ellipse cx="297" cy="272" rx="20" ry="8" fill="#fb7185" opacity="0.7" transform="rotate(-18 297 272)"/>` +
    `<rect x="268" y="352" width="58" height="20" rx="6" fill="#d4a24e"/>` +
    `<rect x="264" y="370" width="66" height="96" rx="10" fill="#27272a"/>` +
    `<rect x="264" y="370" width="66" height="96" rx="10" fill="none" stroke="#52525b" stroke-width="4"/>` +
    `<rect x="274" y="382" width="12" height="72" rx="6" fill="#ffffff" opacity="0.14"/>` +
    spark(400, 250, 12, "#f9a8d4", 0.9) + spark(200, 400, 10),
  perfume: (u) => `<defs><linearGradient id="${u}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fda4af"/><stop offset="1" stop-color="#fb7185"/></linearGradient></defs>` +
    `<rect x="276" y="196" width="48" height="74" rx="12" fill="#d4a24e"/>` +
    `<rect x="288" y="262" width="24" height="26" fill="#b98a3a"/>` +
    `<rect x="242" y="286" width="116" height="172" rx="30" fill="#ffffff" opacity="0.55"/>` +
    `<rect x="242" y="350" width="116" height="108" rx="30" fill="url(#${u}l)" opacity="0.8"/>` +
    `<rect x="258" y="368" width="84" height="56" rx="10" fill="#ffffff"/>` +
    `<rect x="272" y="382" width="56" height="8" rx="4" fill="#f9a8d4"/><rect x="280" y="398" width="40" height="8" rx="4" fill="#fbcfe8"/>` +
    `<rect x="254" y="300" width="16" height="130" rx="8" fill="#ffffff" opacity="0.7"/>` +
    spark(420, 200, 14) + spark(180, 380, 10, "#f9a8d4", 0.9),
  pump: (u) => `<defs><linearGradient id="${u}b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff7f5"/><stop offset="1" stop-color="#ffe4e6"/></linearGradient></defs>` +
    `<rect x="288" y="226" width="24" height="66" fill="#d6d3d1"/>` +
    `<rect x="264" y="208" width="76" height="26" rx="10" fill="#a8a29e"/>` +
    `<rect x="264" y="216" width="34" height="12" rx="6" fill="#78716c"/>` +
    `<rect x="258" y="290" width="84" height="168" rx="18" fill="url(#${u}b)"/>` +
    `<rect x="258" y="290" width="84" height="168" rx="18" fill="none" stroke="#fecdd3" stroke-width="4"/>` +
    `<rect x="270" y="330" width="60" height="70" rx="8" fill="#ffffff"/>` +
    `<rect x="280" y="344" width="40" height="8" rx="4" fill="#f9a8d4"/><rect x="280" y="360" width="28" height="8" rx="4" fill="#fbcfe8"/>` +
    `<rect x="268" y="300" width="12" height="140" rx="6" fill="#ffffff" opacity="0.8"/>`,
  compact: (u) => `<defs><linearGradient id="${u}m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e2e8f0"/></linearGradient></defs>` +
    `<ellipse cx="300" cy="400" rx="104" ry="34" fill="#d4a24e"/>` +
    `<ellipse cx="300" cy="394" rx="104" ry="34" fill="#e8b4a0"/>` +
    `<ellipse cx="300" cy="390" rx="78" ry="24" fill="#f9a8d4"/>` +
    `<ellipse cx="300" cy="388" rx="78" ry="24" fill="none" stroke="#f472b6" stroke-width="3" opacity="0.6"/>` +
    `<g transform="rotate(-24 300 300)"><ellipse cx="300" cy="212" rx="92" ry="92" fill="#d4a24e"/><ellipse cx="300" cy="212" rx="76" ry="76" fill="url(#${u}m)"/><ellipse cx="282" cy="192" rx="30" ry="22" fill="#ffffff" opacity="0.65"/></g>` +
    `<rect x="292" y="296" width="16" height="60" fill="#b98a3a"/>` +
    spark(430, 180, 12, "#f9a8d4", 0.9),
  mascara: (u) => `<defs><linearGradient id="${u}t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3f3f46"/><stop offset="0.5" stop-color="#18181b"/><stop offset="1" stop-color="#34343b"/></linearGradient></defs>` +
    `<rect x="272" y="252" width="56" height="206" rx="24" fill="url(#${u}t)"/>` +
    `<rect x="264" y="196" width="72" height="62" rx="14" fill="#d4a24e"/>` +
    `<rect x="264" y="196" width="72" height="62" rx="14" fill="none" stroke="#b98a3a" stroke-width="4"/>` +
    `<rect x="284" y="300" width="32" height="70" rx="8" fill="#ffffff"/>` +
    `<rect x="292" y="314" width="16" height="8" rx="4" fill="#f9a8d4"/><rect x="292" y="330" width="16" height="8" rx="4" fill="#f472b6"/>` +
    `<rect x="282" y="262" width="10" height="180" rx="5" fill="#ffffff" opacity="0.14"/>` +
    spark(410, 220, 12, "#f9a8d4", 0.9),
  cleanser: (u) => `<defs><linearGradient id="${u}t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#fce7f3"/></linearGradient></defs>` +
    `<path d="M266,286 L334,286 L318,448 L282,448 Z" fill="url(#${u}t)"/>` +
    `<path d="M266,286 L334,286 L330,320 L270,320 Z" fill="#f9a8d4" opacity="0.7"/>` +
    `<rect x="282" y="448" width="36" height="30" rx="8" fill="#f472b6"/>` +
    `<rect x="278" y="340" width="44" height="60" rx="8" fill="#ffffff"/>` +
    `<circle cx="300" cy="362" r="14" fill="#fbcfe8"/><rect x="290" y="384" width="20" height="6" rx="3" fill="#f9a8d4"/>` +
    spark(410, 260, 12, "#f9a8d4", 0.9) + spark(190, 380, 10),
};

/* ------------------------------- ORGANIC (fresh green) ------------------------------- */
const ORGANIC: Record<string, Draw> = {
  tomato: (u) => `<defs><radialGradient id="${u}t" cx="0.38" cy="0.32" r="0.95"><stop offset="0" stop-color="#f87171"/><stop offset="0.6" stop-color="#dc2626"/><stop offset="1" stop-color="#991b1b"/></radialGradient></defs>` +
    `<circle cx="300" cy="330" r="108" fill="url(#${u}t)"/>` +
    `<ellipse cx="262" cy="288" rx="34" ry="22" fill="#ffffff" opacity="0.35" transform="rotate(-24 262 288)"/>` +
    `<polygon points="300,222 282,250 252,238 268,264 240,268 268,280 258,306 286,296 296,322 306,296 334,306 324,280 352,268 324,264 340,238 310,250" fill="#16a34a"/>` +
    `<rect x="294" y="196" width="12" height="40" rx="6" fill="#15803d" transform="rotate(8 300 216)"/>`,
  carrot: () => `<polygon points="300,252 258,452 342,452" fill="#f97316"/>` +
    `<polygon points="300,252 258,452 342,452" fill="none" stroke="#c2410c" stroke-width="5"/>` +
    `<line x1="282" y1="320" x2="312" y2="320" stroke="#c2410c" stroke-width="5" stroke-linecap="round"/>` +
    `<line x1="276" y1="360" x2="306" y2="360" stroke="#c2410c" stroke-width="5" stroke-linecap="round"/>` +
    `<line x1="272" y1="400" x2="300" y2="400" stroke="#c2410c" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M300,252 C290,210 270,190 250,182 C272,178 292,190 300,210 C308,190 328,178 350,182 C330,190 310,210 300,252" fill="#22c55e"/>` +
    `<path d="M300,252 C296,220 296,196 300,176" stroke="#16a34a" stroke-width="7" fill="none" stroke-linecap="round"/>` +
    `<ellipse cx="282" cy="300" rx="10" ry="40" fill="#ffffff" opacity="0.25" transform="rotate(12 282 300)"/>`,
  honey: (u) => `<defs><linearGradient id="${u}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbbf24"/><stop offset="1" stop-color="#d97706"/></linearGradient></defs>` +
    `<rect x="352" y="230" width="16" height="180" rx="8" fill="#b45309" transform="rotate(18 360 320)"/>` +
    `<rect x="330" y="196" width="60" height="52" rx="14" fill="#92400e" transform="rotate(18 360 222)"/>` +
    `<line x1="338" y1="210" x2="382" y2="210" stroke="#78350f" stroke-width="4" transform="rotate(18 360 222)"/>` +
    `<line x1="336" y1="224" x2="384" y2="224" stroke="#78350f" stroke-width="4" transform="rotate(18 360 222)"/>` +
    `<rect x="228" y="252" width="144" height="38" rx="14" fill="#a16207"/>` +
    `<rect x="238" y="288" width="124" height="164" rx="26" fill="#fef3c7" opacity="0.55"/>` +
    `<rect x="238" y="330" width="124" height="122" rx="26" fill="url(#${u}h)"/>` +
    `<rect x="252" y="360" width="96" height="56" rx="10" fill="#ffffff"/>` +
    `<rect x="266" y="374" width="68" height="9" rx="4.5" fill="#d97706"/><rect x="276" y="392" width="48" height="9" rx="4.5" fill="#f59e0b"/>` +
    `<rect x="250" y="300" width="14" height="120" rx="7" fill="#ffffff" opacity="0.7"/>` +
    spark(420, 200, 12, "#fbbf24", 0.9),
  avocado: (u) => `<defs><linearGradient id="${u}a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4d7c0f"/><stop offset="1" stop-color="#1a2e05"/></linearGradient></defs>` +
    `<path d="M300,180 C260,180 238,230 238,300 C238,400 262,470 300,470 C338,470 362,400 362,300 C362,230 340,180 300,180 Z" fill="url(#${u}a)"/>` +
    `<path d="M300,208 C272,208 258,246 258,300 C258,384 274,442 300,442 C326,442 342,384 342,300 C342,246 328,208 300,208 Z" fill="#d9f99d"/>` +
    `<circle cx="300" cy="360" r="44" fill="#92400e"/><circle cx="300" cy="360" r="44" fill="none" stroke="#78350f" stroke-width="5"/>` +
    `<circle cx="286" cy="346" r="12" fill="#b45309" opacity="0.8"/>` +
    `<ellipse cx="272" cy="260" rx="14" ry="40" fill="#ecfccb" opacity="0.7" transform="rotate(-8 272 260)"/>`,
  broccoli: () => [[260, 280, 40], [340, 280, 40], [300, 240, 44], [228, 320, 34], [372, 320, 34], [300, 300, 46]].map(([x, y, r]) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="#16a34a"/><circle cx="${x - r * 0.25}" cy="${y - r * 0.25}" r="${r * 0.45}" fill="#4ade80" opacity="0.7"/>`).join("") +
    `<polygon points="272,360 328,360 312,460 288,460" fill="#a3b86a"/>` +
    `<polygon points="272,360 328,360 320,400 280,400" fill="#84a355"/>`,
  apple: (u) => `<defs><radialGradient id="${u}a" cx="0.38" cy="0.3" r="0.95"><stop offset="0" stop-color="#f87171"/><stop offset="0.6" stop-color="#dc2626"/><stop offset="1" stop-color="#991b1b"/></radialGradient></defs>` +
    `<circle cx="300" cy="332" r="102" fill="url(#${u}a)"/>` +
    `<ellipse cx="300" cy="244" rx="26" ry="10" fill="#7f1d1d" opacity="0.6"/>` +
    `<rect x="296" y="200" width="10" height="52" rx="5" fill="#78350f" transform="rotate(10 301 226)"/>` +
    `<ellipse cx="344" cy="230" rx="34" ry="16" fill="#22c55e" transform="rotate(-24 344 230)"/>` +
    `<ellipse cx="262" cy="292" rx="30" ry="20" fill="#ffffff" opacity="0.35" transform="rotate(-24 262 292)"/>`,
  spinach: () => `<polygon points="200,360 400,360 368,460 232,460" fill="#c98d4b"/>` +
    `<polygon points="200,360 400,360 392,392 208,392" fill="#b57a3a"/>` +
    `<line x1="230" y1="404" x2="370" y2="404" stroke="#8f5e28" stroke-width="6"/>` +
    [[250, 320, -20], [300, 290, 10], [350, 320, 25], [275, 250, -8], [330, 255, 15], [300, 330, 0]].map(([x, y, r]) =>
      `<ellipse cx="${x}" cy="${y}" rx="34" ry="52" fill="#22c55e" transform="rotate(${r} ${x} ${y})"/>` +
      `<line x1="${x}" y1="${y! - 44}" x2="${x}" y2="${y! + 44}" stroke="#15803d" stroke-width="5" transform="rotate(${r} ${x} ${y})"/>`).join(""),
  eggs: () => `<polygon points="196,380 404,380 372,462 228,462" fill="#d9a066"/>` +
    `<polygon points="196,380 404,380 396,408 204,408" fill="#c68b4e"/>` +
    [[250, 330], [300, 330], [350, 330], [250, 268], [300, 268], [350, 268]].map(([x, y]) =>
      `<ellipse cx="${x}" cy="${y}" rx="30" ry="38" fill="#fef3c7"/><ellipse cx="${x}" cy="${y}" rx="30" ry="38" fill="none" stroke="#e7c88a" stroke-width="4"/>` +
      `<ellipse cx="${x - 9}" cy="${y - 11}" rx="9" ry="13" fill="#ffffff" opacity="0.8"/>`).join(""),
};

/* ------------------------------- PHARMA (clean teal) ------------------------------- */
const PHARMA: Record<string, Draw> = {
  pillbottle: (u) => `<defs><linearGradient id="${u}b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f0fdfa"/></linearGradient></defs>` +
    `<rect x="240" y="212" width="120" height="44" rx="12" fill="#0d9488"/>` +
    `<line x1="240" y1="230" x2="360" y2="230" stroke="#0b7c72" stroke-width="5"/>` +
    `<rect x="248" y="254" width="104" height="202" rx="18" fill="url(#${u}b)"/>` +
    `<rect x="248" y="254" width="104" height="202" rx="18" fill="none" stroke="#99f6e4" stroke-width="4"/>` +
    `<rect x="260" y="300" width="80" height="96" rx="10" fill="#ffffff" stroke="#5eead4" stroke-width="3"/>` +
    `<rect x="288" y="316" width="24" height="64" rx="6" fill="#14b8a6"/><rect x="276" y="340" width="48" height="16" rx="6" fill="#14b8a6"/>` +
    `<rect x="272" y="404" width="56" height="8" rx="4" fill="#99f6e4"/><rect x="282" y="418" width="36" height="8" rx="4" fill="#ccfbf1"/>` +
    `<rect x="258" y="266" width="12" height="170" rx="6" fill="#5eead4" opacity="0.35"/>`,
  syrup: (u) => `<defs><linearGradient id="${u}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbbf24"/><stop offset="1" stop-color="#d97706"/></linearGradient></defs>` +
    `<rect x="282" y="176" width="36" height="40" rx="8" fill="#0d9488"/>` +
    `<rect x="274" y="214" width="52" height="34" fill="#e6fffa"/>` +
    `<path d="M246,248 L354,248 L354,420 Q354,456 318,456 L282,456 Q246,456 246,420 Z" fill="#ffffff" opacity="0.7"/>` +
    `<path d="M246,320 L354,320 L354,420 Q354,456 318,456 L282,456 Q246,456 246,420 Z" fill="url(#${u}l)" opacity="0.9"/>` +
    `<rect x="262" y="340" width="76" height="66" rx="10" fill="#ffffff"/>` +
    `<rect x="288" y="352" width="24" height="42" rx="6" fill="#14b8a6"/><rect x="278" y="364" width="44" height="14" rx="6" fill="#14b8a6"/>` +
    `<rect x="258" y="260" width="12" height="120" rx="6" fill="#ffffff" opacity="0.8"/>`,
  capsules: () => { const cap = (x: number, y: number, r: number, c1: string, c2: string) => `<g transform="rotate(${r} ${x} ${y})">` +
    `<rect x="${x - 58}" y="${y - 23}" width="116" height="46" rx="23" fill="${c1}"/>` +
    `<path d="M${x},${y - 23} L${x},${y + 23} A23,23 0 0 0 ${x},${y - 23} Z" fill="${c2}"/>` +
    `<rect x="${x - 58}" y="${y - 23}" width="116" height="46" rx="23" fill="none" stroke="#00000022" stroke-width="3"/>` +
    `<rect x="${x - 44}" y="${y - 14}" width="40" height="10" rx="5" fill="#ffffff" opacity="0.5"/></g>`;
    return cap(300, 250, -18, "#14b8a6", "#f0fdfa") + cap(290, 350, 12, "#f59e0b", "#fffbeb") + cap(320, 440, -8, "#3b82f6", "#eff6ff"); },
  ointment: (u) => `<defs><linearGradient id="${u}t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f0fdfa"/></linearGradient></defs>` +
    `<path d="M262,270 L338,270 L322,440 L278,440 Z" fill="url(#${u}t)"/>` +
    `<path d="M262,270 L338,270 L334,306 L266,306 Z" fill="#14b8a6" opacity="0.85"/>` +
    `<rect x="278" y="440" width="44" height="32" rx="8" fill="#0d9488"/>` +
    `<rect x="274" y="330" width="52" height="70" rx="8" fill="#ffffff" stroke="#5eead4" stroke-width="3"/>` +
    `<rect x="292" y="344" width="16" height="42" rx="5" fill="#14b8a6"/><rect x="284" y="358" width="32" height="12" rx="5" fill="#14b8a6"/>` +
    spark(410, 250, 12, "#5eead4", 0.9),
  drops: () => `<rect x="284" y="180" width="32" height="56" rx="10" fill="#0d9488"/>` +
    `<rect x="292" y="150" width="16" height="34" rx="8" fill="#5eead4"/>` +
    `<rect x="262" y="234" width="76" height="150" rx="24" fill="#ffffff" opacity="0.75"/>` +
    `<rect x="262" y="300" width="76" height="84" rx="24" fill="#99f6e4" opacity="0.8"/>` +
    `<path d="M300,404 q-14,20 0,30 q14,-10 0,-30" fill="#2dd4bf"/>` +
    `<rect x="274" y="316" width="52" height="44" rx="8" fill="#ffffff"/>` +
    `<rect x="292" y="326" width="16" height="26" rx="5" fill="#14b8a6"/><rect x="286" y="340" width="28" height="10" rx="5" fill="#14b8a6"/>`,
  spray: () => `<rect x="252" y="196" width="96" height="30" rx="12" fill="#0d9488"/>` +
    `<rect x="282" y="168" width="36" height="32" rx="8" fill="#14b8a6"/>` +
    `<rect x="270" y="224" width="60" height="26" fill="#e6fffa"/>` +
    `<rect x="258" y="248" width="84" height="208" rx="22" fill="#ffffff"/>` +
    `<rect x="258" y="248" width="84" height="208" rx="22" fill="none" stroke="#99f6e4" stroke-width="4"/>` +
    `<rect x="270" y="300" width="60" height="80" rx="10" fill="#ffffff" stroke="#5eead4" stroke-width="3"/>` +
    `<rect x="292" y="314" width="16" height="52" rx="5" fill="#14b8a6"/><rect x="284" y="330" width="32" height="12" rx="5" fill="#14b8a6"/>` +
    `<rect x="268" y="260" width="12" height="170" rx="6" fill="#5eead4" opacity="0.35"/>` +
    spark(400, 180, 10, "#5eead4", 0.9),
  firstaid: () => `<path d="M250,268 Q250,238 280,238 L320,238 Q350,238 350,268" stroke="#0d9488" stroke-width="18" fill="none"/>` +
    `<rect x="206" y="264" width="188" height="150" rx="20" fill="#ffffff"/>` +
    `<rect x="206" y="264" width="188" height="150" rx="20" fill="none" stroke="#5eead4" stroke-width="5"/>` +
    `<rect x="282" y="300" width="36" height="84" rx="8" fill="#ef4444"/><rect x="258" y="324" width="84" height="36" rx="8" fill="#ef4444"/>` +
    `<rect x="222" y="278" width="40" height="12" rx="6" fill="#99f6e4" opacity="0.7"/>`,
  thermometer: (u) => `<defs><linearGradient id="${u}b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f0fdfa"/></linearGradient></defs>` +
    `<rect x="268" y="216" width="64" height="180" rx="32" fill="url(#${u}b)"/>` +
    `<rect x="268" y="216" width="64" height="180" rx="32" fill="none" stroke="#5eead4" stroke-width="5"/>` +
    `<rect x="280" y="248" width="40" height="56" rx="10" fill="#134e4a"/>` +
    `<text x="300" y="284" font-family="system-ui" font-size="24" font-weight="700" text-anchor="middle" fill="#5eead4">36.6</text>` +
    `<circle cx="300" cy="340" r="14" fill="#14b8a6"/><circle cx="300" cy="340" r="7" fill="#0d9488"/>` +
    `<rect x="292" y="396" width="16" height="80" rx="8" fill="#99f6e4"/>` +
    `<rect x="278" y="228" width="10" height="150" rx="5" fill="#5eead4" opacity="0.3"/>`,
};


/* ------------------------- legacy generic art (kept for old themes) ------------------------- */
export function productArt(seed: number, emoji: string, hue: number): string {
  const h2 = (hue + 45) % 360;
  return enc(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">` +
    `<defs><linearGradient id="g${seed}" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${hue},72%,90%)"/><stop offset="1" stop-color="hsl(${h2},68%,74%)"/>` +
    `</linearGradient></defs>` +
    `<rect width="600" height="600" fill="url(#g${seed})"/>` +
    `<circle cx="492" cy="96" r="150" fill="hsl(${h2},72%,82%)" opacity="0.6"/>` +
    `<circle cx="84" cy="528" r="120" fill="hsl(${hue},72%,82%)" opacity="0.55"/>` +
    `<circle cx="300" cy="300" r="170" fill="#ffffff" opacity="0.28"/>` +
    `<text x="300" y="318" font-size="190" text-anchor="middle" dominant-baseline="middle">${emoji}</text>` +
    `</svg>`
  );
}

export function heroArt(seed: number, hue: number): string {
  const h2 = (hue + 55) % 360, h3 = (hue + 110) % 360;
  return enc(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">` +
    `<defs><linearGradient id="h${seed}" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${hue},60%,42%)"/><stop offset="1" stop-color="hsl(${h2},62%,30%)"/>` +
    `</linearGradient></defs>` +
    `<rect width="1600" height="900" fill="url(#h${seed})"/>` +
    `<circle cx="1330" cy="180" r="380" fill="hsl(${h2},65%,52%)" opacity="0.5"/>` +
    `<circle cx="180" cy="760" r="300" fill="hsl(${h3},60%,48%)" opacity="0.45"/>` +
    `<ellipse cx="820" cy="450" rx="560" ry="240" fill="#ffffff" opacity="0.07"/>` +
    `<circle cx="1050" cy="620" r="90" fill="#ffffff" opacity="0.12"/>` +
    `</svg>`
  );
}

export function collectionArt(seed: number, emoji: string, hue: number): string {
  const h2 = (hue + 45) % 360;
  return enc(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">` +
    `<defs><linearGradient id="c${seed}" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${hue},65%,55%)"/><stop offset="1" stop-color="hsl(${h2},62%,38%)"/>` +
    `</linearGradient></defs>` +
    `<rect width="800" height="800" fill="url(#c${seed})"/>` +
    `<circle cx="640" cy="160" r="200" fill="#ffffff" opacity="0.14"/>` +
    `<circle cx="140" cy="660" r="160" fill="#ffffff" opacity="0.1"/>` +
    `<text x="400" y="430" font-size="260" text-anchor="middle" dominant-baseline="middle">${emoji}</text>` +
    `</svg>`
  );
}

/* ------------------------------- LIFESTYLE (light studio, for minimal/fashion/bold/craft) ------------------------------- */
const LIFE: Record<string, Draw> = {
  tote: (u) => `<defs><linearGradient id="${u}t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7c9a0"/><stop offset="1" stop-color="#c49a6c"/></linearGradient></defs>` +
    `<path d="M252,220 Q252,150 300,150 Q348,150 348,220" stroke="#8a5a33" stroke-width="18" fill="none"/>` +
    `<path d="M228,250 L372,250 L352,460 L248,460 Z" fill="url(#${u}t)"/>` +
    `<path d="M228,250 L372,250 L368,290 L232,290 Z" fill="#8a5a33" opacity="0.35"/>` +
    `<rect x="272" y="300" width="56" height="44" rx="8" fill="#8a5a33" opacity="0.5"/>` +
    `<rect x="244" y="270" width="14" height="170" fill="#ffffff" opacity="0.3"/>`,
  sneakers: (u) => `<defs><linearGradient id="${u}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8fafc"/><stop offset="1" stop-color="#cbd5e1"/></linearGradient></defs>` +
    `<path d="M170,400 Q170,330 230,320 L300,260 Q320,245 345,255 L380,290 L430,310 Q460,320 458,360 L456,400 Z" fill="url(#${u}s)"/>` +
    `<path d="M170,400 L456,400 L452,430 L174,430 Z" fill="#334155"/>` +
    `<path d="M300,260 Q320,245 345,255 L360,270 L315,300 Z" fill="#94a3b8"/>` +
    `<circle cx="330" cy="320" r="8" fill="#475569"/><circle cx="350" cy="335" r="8" fill="#475569"/><circle cx="370" cy="348" r="8" fill="#475569"/>` +
    `<path d="M315,305 L375,345" stroke="#475569" stroke-width="8" stroke-linecap="round"/>` +
    `<path d="M200,340 Q260,330 300,350" stroke="#f43f5e" stroke-width="10" fill="none" stroke-linecap="round"/>`,
  mug: (u) => `<defs><linearGradient id="${u}m" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e2e8f0"/></linearGradient></defs>` +
    `<path d="M360,300 q70,10 60,80 q-8,60 -80,55" stroke="#cbd5e1" stroke-width="26" fill="none"/>` +
    `<path d="M225,270 L375,270 L360,450 Q358,470 338,470 L262,470 Q242,470 240,450 Z" fill="url(#${u}m)"/>` +
    `<path d="M225,270 L375,270 L372,310 L228,310 Z" fill="#0ea5e9" opacity="0.75"/>` +
    `<ellipse cx="300" cy="270" rx="75" ry="16" fill="#e0f2fe"/>` +
    `<path d="M270,200 q-14,-30 6,-55 q20,-24 6,-55" stroke="#cbd5e1" stroke-width="10" fill="none" stroke-linecap="round"/>` +
    `<path d="M315,205 q-14,-30 6,-55 q20,-24 6,-55" stroke="#cbd5e1" stroke-width="10" fill="none" stroke-linecap="round"/>` +
    `<rect x="252" y="340" width="96" height="40" rx="8" fill="#0ea5e9" opacity="0.25"/>`,
  jacket: (u) => `<defs><linearGradient id="${u}j" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a6fa5"/><stop offset="1" stop-color="#2c4a73"/></linearGradient></defs>` +
    `<path d="M230,180 L270,160 L300,190 L330,160 L370,180 L410,240 L385,260 L395,450 L205,450 L215,260 L190,240 Z" fill="url(#${u}j)"/>` +
    `<path d="M300,190 L300,450" stroke="#1e3a5f" stroke-width="8"/>` +
    `<path d="M270,160 L300,190 L285,220 L255,180 Z" fill="#2c4a73"/><path d="M330,160 L300,190 L315,220 L345,180 Z" fill="#2c4a73"/>` +
    `<circle cx="285" cy="260" r="7" fill="#dbeafe"/><circle cx="285" cy="310" r="7" fill="#dbeafe"/><circle cx="285" cy="360" r="7" fill="#dbeafe"/>` +
    `<path d="M230,420 L205,420 M395,420 L370,420" stroke="#1e3a5f" stroke-width="8"/>`,
  wallet: (u) => `<defs><linearGradient id="${u}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5a33"/><stop offset="1" stop-color="#5b3a1e"/></linearGradient></defs>` +
    `<rect x="180" y="240" width="240" height="170" rx="22" fill="url(#${u}w)"/>` +
    `<rect x="180" y="240" width="240" height="170" rx="22" fill="none" stroke="#3d2612" stroke-width="5"/>` +
    `<rect x="200" y="262" width="200" height="34" rx="8" fill="#3d2612" opacity="0.4"/>` +
    `<rect x="200" y="308" width="200" height="34" rx="8" fill="#3d2612" opacity="0.3"/>` +
    `<rect x="330" y="330" width="70" height="56" rx="10" fill="#d4a24e"/>` +
    `<circle cx="365" cy="358" r="10" fill="#8a5a33"/>` +
    `<rect x="196" y="254" width="16" height="140" rx="8" fill="#ffffff" opacity="0.18"/>`,
  tee: (u) => `<defs><linearGradient id="${u}t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e8edf3"/></linearGradient></defs>` +
    `<path d="M250,170 L300,200 L350,170 L420,210 L390,280 L350,260 L350,450 L250,450 L250,260 L210,280 L180,210 Z" fill="url(#${u}t)"/>` +
    `<path d="M250,170 L300,200 L350,170 L420,210 L390,280 L350,260 L350,450 L250,450 L250,260 L210,280 L180,210 Z" fill="none" stroke="#cbd5e1" stroke-width="5"/>` +
    `<path d="M270,185 Q300,215 330,185" stroke="#cbd5e1" stroke-width="10" fill="none"/>` +
    `<circle cx="300" cy="330" r="42" fill="#0ea5e9" opacity="0.2"/><path d="M282,330 L300,306 L318,330 L300,354 Z" fill="#0ea5e9" opacity="0.5"/>`,
  lamp: (u) => `<defs><linearGradient id="${u}l" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#475569"/><stop offset="1" stop-color="#1e293b"/></linearGradient></defs>` +
    `<ellipse cx="300" cy="460" rx="90" ry="18" fill="url(#${u}l)"/>` +
    `<rect x="292" y="300" width="16" height="160" fill="url(#${u}l)"/>` +
    `<circle cx="300" cy="290" r="20" fill="#334155"/>` +
    `<rect x="300" y="270" width="130" height="16" rx="8" fill="url(#${u}l)" transform="rotate(-24 300 278)"/>` +
    `<path d="M400,210 L440,250 L400,290 L360,250 Z" fill="url(#${u}l)"/>` +
    `<path d="M410,232 L425,250 L410,268" stroke="#fbbf24" stroke-width="10" fill="none" stroke-linecap="round"/>` +
    `<circle cx="417" cy="250" r="34" fill="#fbbf24" opacity="0.25"/>`,
  scarf: () => `<path d="M220,200 Q300,180 380,200 L370,300 Q300,280 230,300 Z" fill="#e11d48"/>` +
    `<path d="M230,300 Q300,280 370,300 L360,440 Q300,420 240,440 Z" fill="#be123c"/>` +
    `<path d="M250,195 L245,300 M280,190 L278,290 M310,188 L310,285 M340,190 L342,292 M365,196 L360,300" stroke="#881337" stroke-width="6" opacity="0.6"/>` +
    `<path d="M240,440 L232,480 M270,432 L265,475 M300,428 L300,472 M330,432 L335,475 M360,440 L368,480" stroke="#881337" stroke-width="8" stroke-linecap="round"/>` +
    `<rect x="250" y="210" width="100" height="26" rx="13" fill="#fda4af" opacity="0.5"/>`,
  backpack: (u) => `<defs><linearGradient id="${u}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b45309"/><stop offset="1" stop-color="#92400e"/></linearGradient></defs>` +
    `<path d="M240,230 Q240,160 300,160 Q360,160 360,230" stroke="#78350f" stroke-width="20" fill="none"/>` +
    `<rect x="215" y="220" width="170" height="230" rx="70" fill="url(#${u}b)"/>` +
    `<rect x="245" y="320" width="110" height="90" rx="30" fill="#78350f" opacity="0.55"/>` +
    `<rect x="245" y="320" width="110" height="26" rx="13" fill="#451a03" opacity="0.6"/>` +
    `<rect x="230" y="240" width="18" height="180" rx="9" fill="#ffffff" opacity="0.15"/>` +
    `<circle cx="300" cy="200" r="12" fill="#451a03"/>`,
  sunglasses: (u) => `<defs><linearGradient id="${u}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#334155"/><stop offset="1" stop-color="#0f172a"/></linearGradient></defs>` +
    `<path d="M150,280 L450,280" stroke="#1e293b" stroke-width="16" stroke-linecap="round"/>` +
    `<path d="M275,280 Q300,300 325,280" stroke="#1e293b" stroke-width="14" fill="none"/>` +
    `<rect x="150" y="270" width="125" height="95" rx="40" fill="url(#${u}s)"/>` +
    `<rect x="325" y="270" width="125" height="95" rx="40" fill="url(#${u}s)"/>` +
    `<rect x="150" y="270" width="125" height="95" rx="40" fill="none" stroke="#0f172a" stroke-width="6"/>` +
    `<rect x="325" y="270" width="125" height="95" rx="40" fill="none" stroke="#0f172a" stroke-width="6"/>` +
    `<path d="M175,290 L230,290 L195,345 Z" fill="#ffffff" opacity="0.25"/>` +
    `<path d="M350,290 L405,290 L370,345 Z" fill="#ffffff" opacity="0.25"/>`,
  pillow: (u) => `<defs><linearGradient id="${u}p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fef3c7"/><stop offset="1" stop-color="#fde68a"/></linearGradient></defs>` +
    `<rect x="190" y="230" width="220" height="200" rx="60" fill="url(#${u}p)"/>` +
    `<rect x="190" y="230" width="220" height="200" rx="60" fill="none" stroke="#f59e0b" stroke-width="6" opacity="0.5"/>` +
    `<circle cx="300" cy="330" r="16" fill="#f59e0b" opacity="0.6"/>` +
    `<circle cx="245" cy="285" r="10" fill="#f59e0b" opacity="0.35"/><circle cx="355" cy="285" r="10" fill="#f59e0b" opacity="0.35"/>` +
    `<circle cx="245" cy="375" r="10" fill="#f59e0b" opacity="0.35"/><circle cx="355" cy="375" r="10" fill="#f59e0b" opacity="0.35"/>` +
    `<rect x="215" y="255" width="60" height="30" rx="15" fill="#ffffff" opacity="0.5"/>`,
  bottle: (u) => `<defs><linearGradient id="${u}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bae6fd"/><stop offset="1" stop-color="#38bdf8"/></linearGradient></defs>` +
    `<rect x="282" y="150" width="36" height="34" rx="8" fill="#334155"/>` +
    `<path d="M282,184 L318,184 L330,230 L270,230 Z" fill="#e0f2fe"/>` +
    `<path d="M255,230 L345,230 L335,440 Q334,462 312,462 L288,462 Q266,462 265,440 Z" fill="#ffffff" opacity="0.65"/>` +
    `<path d="M258,300 L342,300 L335,440 Q334,462 312,462 L288,462 Q266,462 265,440 Z" fill="url(#${u}w)" opacity="0.85"/>` +
    `<rect x="272" y="250" width="14" height="180" rx="7" fill="#ffffff" opacity="0.8"/>` +
    `<rect x="270" y="330" width="60" height="46" rx="8" fill="#ffffff"/>` +
    `<rect x="282" y="342" width="36" height="8" rx="4" fill="#38bdf8"/>`,
};

/* ------------------------------- FOOD (warm) ------------------------------- */
const FOOD: Record<string, Draw> = {
  biryani: (u) => `<defs><radialGradient id="${u}r" cx="0.42" cy="0.36" r="0.9"><stop offset="0" stop-color="#fde68a"/><stop offset="0.55" stop-color="#f59e0b"/><stop offset="1" stop-color="#b45309"/></radialGradient></defs>` +
    `<ellipse cx="300" cy="420" rx="140" ry="88" fill="#1e3a8a"/>` +
    `<path d="M160,420 L440,420 L410,470 Q300,500 190,470 Z" fill="#172c6b"/>` +
    `<ellipse cx="300" cy="410" rx="140" ry="80" fill="url(#${u}r)"/>` +
    `<ellipse cx="300" cy="392" rx="118" ry="62" fill="#fbbf24"/>` +
    `<circle cx="252" cy="372" r="16" fill="#fef3c7"/><circle cx="348" cy="382" r="13" fill="#fde68a"/><circle cx="300" cy="356" r="18" fill="#fff7ed"/>` +
    `<ellipse cx="300" cy="330" rx="52" ry="34" fill="#f97316"/>` +
    `<ellipse cx="300" cy="322" rx="38" ry="24" fill="#fdba74"/>` +
    `<circle cx="300" cy="318" r="14" fill="#fde047"/>` +
    `<path d="M272,300 q10,-18 20,-4 M318,296 q12,-16 20,-2" stroke="#16a34a" stroke-width="6" fill="none" stroke-linecap="round"/>` +
    spark(160, 220, 14) + spark(452, 260, 11, "#fde68a", 0.9),
  burger: (u) => `<defs><linearGradient id="${u}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbbf24"/><stop offset="1" stop-color="#d97706"/></linearGradient></defs>` +
    `<ellipse cx="300" cy="452" rx="150" ry="26" fill="#92400e" opacity="0.35"/>` +
    `<path d="M168,380 Q168,252 300,252 Q432,252 432,380 Q432,420 300,420 Q168,420 168,380" fill="url(#${u}b)"/>` +
    `<ellipse cx="300" cy="330" rx="132" ry="78" fill="#fbbf24"/>` +
    `<ellipse cx="240" cy="300" rx="10" ry="6" fill="#fef3c7"/><ellipse cx="310" cy="284" rx="10" ry="6" fill="#fef3c7"/><ellipse cx="366" cy="310" rx="10" ry="6" fill="#fef3c7"/>` +
    `<rect x="170" y="392" width="260" height="26" rx="13" fill="#65a30d"/>` +
    `<path d="M170,405 h260" stroke="#4d7c0f" stroke-width="4"/>` +
    `<rect x="176" y="418" width="248" height="20" rx="10" fill="#dc2626"/>` +
    `<rect x="186" y="438" width="228" height="26" rx="13" fill="#92400e"/>` +
    `<path d="M162,452 Q162,492 300,492 Q438,492 438,452 L438,444 L162,444 Z" fill="url(#${u}b)"/>` +
    spark(140, 200, 13) + spark(460, 230, 10, "#fde68a", 0.9),
  cake: (u) => `<defs><linearGradient id="${u}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7c2d12"/><stop offset="1" stop-color="#431407"/></linearGradient></defs>` +
    `<ellipse cx="300" cy="470" rx="150" ry="22" fill="#ffffff" opacity="0.6"/>` +
    `<path d="M170,300 L430,300 L400,470 L200,470 Z" fill="url(#${u}c)"/>` +
    `<path d="M170,300 L430,300 L424,344 L176,344 Z" fill="#a16207"/>` +
    `<path d="M176,344 L424,344 L418,388 L182,388 Z" fill="#fef3c7"/>` +
    `<path d="M182,388 L418,388 L400,470 L200,470 Z" fill="url(#${u}c)"/>` +
    `<path d="M170,300 Q300,262 430,300 L430,318 Q300,280 170,318 Z" fill="#f472b6"/>` +
    `<circle cx="250" cy="292" r="10" fill="#dc2626"/><circle cx="330" cy="288" r="10" fill="#2563eb"/><circle cx="292" cy="298" r="8" fill="#16a34a"/>` +
    `<rect x="294" y="220" width="12" height="52" fill="#f472b6"/><circle cx="300" cy="210" r="14" fill="#fbbf24"/>` +
    spark(150, 380, 12, "#fbcfe8", 0.9) + spark(452, 350, 10),
  pizza: (u) => `<defs><linearGradient id="${u}z" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdba74"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs>` +
    `<path d="M300,470 L170,220 Q300,180 430,220 Z" fill="url(#${u}z)"/>` +
    `<path d="M170,220 Q300,180 430,220 L422,252 Q300,214 178,252 Z" fill="#b45309"/>` +
    `<circle cx="280" cy="300" r="20" fill="#dc2626"/><circle cx="330" cy="340" r="20" fill="#dc2626"/><circle cx="300" cy="390" r="20" fill="#dc2626"/>` +
    `<circle cx="280" cy="300" r="8" fill="#fca5a5"/><circle cx="330" cy="340" r="8" fill="#fca5a5"/><circle cx="300" cy="390" r="8" fill="#fca5a5"/>` +
    `<circle cx="312" cy="268" r="12" fill="#16a34a"/><circle cx="262" cy="360" r="12" fill="#16a34a"/>` +
    `<path d="M292,470 q8,-14 16,0" stroke="#92400e" stroke-width="6" fill="none" stroke-linecap="round"/>` +
    spark(150, 200, 13) + spark(452, 300, 10, "#fde68a", 0.9),
  fuchka: (u) => `<defs><radialGradient id="${u}f" cx="0.4" cy="0.35" r="0.9"><stop offset="0" stop-color="#fde68a"/><stop offset="1" stop-color="#d97706"/></radialGradient></defs>` +
    `<ellipse cx="300" cy="430" rx="150" ry="70" fill="#1e40af"/>` +
    `<ellipse cx="300" cy="414" rx="150" ry="66" fill="#3b82f6"/>` +
    `<ellipse cx="300" cy="406" rx="128" ry="54" fill="#172c6b"/>` +
    `<circle cx="228" cy="392" r="40" fill="url(#${u}f)"/><circle cx="312" cy="384" r="46" fill="url(#${u}f)"/><circle cx="388" cy="396" r="38" fill="url(#${u}f)"/>` +
    `<circle cx="228" cy="382" r="14" fill="#92400e"/><circle cx="312" cy="372" r="16" fill="#92400e"/><circle cx="388" cy="386" r="13" fill="#92400e"/>` +
    `<path d="M200,250 q100,-40 200,0" stroke="#16a34a" stroke-width="8" fill="none" stroke-linecap="round"/>` +
    spark(150, 220, 12) + spark(455, 250, 10, "#fde68a", 0.9),
  lassi: (u) => `<defs><linearGradient id="${u}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fde68a"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs>` +
    `<path d="M230,230 L370,230 L350,470 Q348,486 332,486 L268,486 Q252,486 250,470 Z" fill="#ffffff" opacity="0.85"/>` +
    `<path d="M238,280 L362,280 L350,470 Q348,486 332,486 L268,486 Q252,486 250,470 Z" fill="url(#${u}l)"/>` +
    `<ellipse cx="300" cy="280" rx="62" ry="18" fill="#fef3c7"/>` +
    `<rect x="286" y="180" width="28" height="90" rx="14" fill="#f97316" transform="rotate(12 300 225)"/>` +
    `<circle cx="268" cy="252" r="10" fill="#dc2626"/><circle cx="330" cy="246" r="8" fill="#dc2626"/>` +
    `<path d="M250,320 q50,18 100,0" stroke="#b45309" stroke-width="5" fill="none" opacity="0.5"/>` +
    `<rect x="244" y="250" width="14" height="180" rx="7" fill="#ffffff" opacity="0.55"/>` +
    spark(160, 200, 12) + spark(450, 240, 10, "#fde68a", 0.9),
  friedchicken: (u) => `<defs><linearGradient id="${u}k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbbf24"/><stop offset="1" stop-color="#c2410c"/></linearGradient></defs>` +
    `<path d="M190,340 L410,340 L390,480 L210,480 Z" fill="#dc2626"/>` +
    `<path d="M190,340 L410,340 L406,372 L194,372 Z" fill="#ffffff"/>` +
    `<text x="300" y="362" font-size="26" text-anchor="middle" fill="#dc2626" font-weight="bold" font-family="sans-serif">CRISPY</text>` +
    `<ellipse cx="252" cy="300" rx="42" ry="50" fill="url(#${u}k)" transform="rotate(-18 252 300)"/>` +
    `<ellipse cx="348" cy="296" rx="42" ry="50" fill="url(#${u}k)" transform="rotate(16 348 296)"/>` +
    `<ellipse cx="300" cy="272" rx="44" ry="52" fill="url(#${u}k)"/>` +
    `<rect x="240" y="336" width="18" height="46" rx="9" fill="#fef3c7" transform="rotate(-18 249 359)"/>` +
    `<rect x="339" y="332" width="18" height="46" rx="9" fill="#fef3c7" transform="rotate(16 348 355)"/>` +
    `<rect x="291" y="312" width="18" height="48" rx="9" fill="#fef3c7"/>` +
    spark(150, 220, 13) + spark(455, 240, 10, "#fde68a", 0.9),
  pasta: (u) => `<defs><radialGradient id="${u}p" cx="0.45" cy="0.4" r="0.9"><stop offset="0" stop-color="#fef3c7"/><stop offset="1" stop-color="#f59e0b"/></radialGradient></defs>` +
    `<ellipse cx="300" cy="430" rx="155" ry="66" fill="#7c2d12"/>` +
    `<ellipse cx="300" cy="414" rx="155" ry="62" fill="#a16207"/>` +
    `<ellipse cx="300" cy="404" rx="132" ry="50" fill="url(#${u}p)"/>` +
    `<path d="M200,390 q25,-22 50,-6 q25,-20 50,-4 q25,-18 50,-2 q20,-12 36,2" stroke="#fbbf24" stroke-width="10" fill="none" stroke-linecap="round"/>` +
    `<path d="M212,410 q24,-18 48,-4 q24,-16 48,-2 q24,-14 46,0" stroke="#f59e0b" stroke-width="9" fill="none" stroke-linecap="round"/>` +
    `<circle cx="262" cy="392" r="10" fill="#dc2626"/><circle cx="338" cy="398" r="10" fill="#dc2626"/><circle cx="300" cy="382" r="9" fill="#16a34a"/>` +
    `<circle cx="300" cy="340" r="26" fill="#f97316"/><circle cx="300" cy="340" r="12" fill="#fdba74"/>` +
    spark(155, 230, 12) + spark(450, 260, 10, "#fde68a", 0.9),
};

/* ------------------------------- FURNITURE (warm) ------------------------------- */
const FURNITURE: Record<string, Draw> = {
  sofa: (u) => `<defs><linearGradient id="${u}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b45309"/><stop offset="1" stop-color="#78350f"/></linearGradient></defs>` +
    `<rect x="150" y="252" width="300" height="120" rx="28" fill="url(#${u}s)"/>` +
    `<rect x="132" y="300" width="52" height="120" rx="24" fill="url(#${u}s)"/>` +
    `<rect x="416" y="300" width="52" height="120" rx="24" fill="url(#${u}s)"/>` +
    `<rect x="184" y="372" width="232" height="60" rx="18" fill="#92400e"/>` +
    `<rect x="196" y="300" width="96" height="72" rx="14" fill="#d97706" opacity="0.85"/>` +
    `<rect x="308" y="300" width="96" height="72" rx="14" fill="#d97706" opacity="0.85"/>` +
    `<rect x="160" y="432" width="26" height="52" rx="10" fill="#451a03"/><rect x="414" y="432" width="26" height="52" rx="10" fill="#451a03"/>` +
    `<ellipse cx="230" cy="300" rx="24" ry="12" fill="#ffffff" opacity="0.18"/>` +
    spark(130, 200, 13) + spark(470, 230, 10, "#fde68a", 0.9),
  table: (u) => `<defs><linearGradient id="${u}t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a16207"/><stop offset="1" stop-color="#713f12"/></linearGradient></defs>` +
    `<rect x="130" y="280" width="340" height="36" rx="12" fill="url(#${u}t)"/>` +
    `<rect x="150" y="316" width="30" height="160" rx="12" fill="#713f12"/><rect x="420" y="316" width="30" height="160" rx="12" fill="#713f12"/>` +
    `<rect x="150" y="420" width="300" height="22" rx="10" fill="#92400e"/>` +
    `<ellipse cx="300" cy="280" rx="60" ry="14" fill="#fde68a" opacity="0.5"/>` +
    `<rect x="252" y="216" width="96" height="52" rx="10" fill="#1e3a8a"/>` +
    `<rect x="252" y="216" width="96" height="14" rx="7" fill="#3b82f6"/>` +
    `<circle cx="380" cy="252" r="22" fill="#dc2626"/><rect x="372" y="252" width="16" height="28" fill="#7f1d1d"/>` +
    spark(140, 180, 12) + spark(460, 200, 10, "#fde68a", 0.9),
  chair: (u) => `<defs><linearGradient id="${u}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6a05c"/><stop offset="1" stop-color="#92600f"/></linearGradient></defs>` +
    `<rect x="252" y="180" width="96" height="150" rx="26" fill="url(#${u}c)"/>` +
    `<rect x="216" y="330" width="168" height="56" rx="20" fill="url(#${u}c)"/>` +
    `<rect x="216" y="330" width="40" height="56" rx="18" fill="#92600f" opacity="0.6"/><rect x="344" y="330" width="40" height="56" rx="18" fill="#92600f" opacity="0.6"/>` +
    `<rect x="232" y="386" width="22" height="96" rx="10" fill="#5c3a08"/><rect x="346" y="386" width="22" height="96" rx="10" fill="#5c3a08"/>` +
    `<rect x="222" y="440" width="156" height="16" rx="8" fill="#5c3a08"/>` +
    `<ellipse cx="300" cy="240" rx="30" ry="40" fill="#ffffff" opacity="0.16"/>` +
    spark(160, 160, 12) + spark(450, 200, 10, "#fde68a", 0.9),
  lamp: (u) => `<defs><linearGradient id="${u}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fde68a"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs>` +
    `<ellipse cx="300" cy="480" rx="90" ry="18" fill="#451a03"/>` +
    `<rect x="288" y="360" width="24" height="112" rx="10" fill="#78350f"/>` +
    `<path d="M300,360 L190,220 L410,220 Z" fill="url(#${u}l)" opacity="0.95"/>` +
    `<path d="M190,220 L410,220 L396,196 L204,196 Z" fill="#92400e"/>` +
    `<rect x="292" y="150" width="16" height="46" fill="#451a03"/>` +
    `<ellipse cx="300" cy="300" rx="70" ry="60" fill="#fef3c7" opacity="0.35"/>` +
    `<circle cx="300" cy="262" r="20" fill="#fffbeb"/>` +
    spark(160, 180, 13) + spark(448, 220, 10, "#fde68a", 0.9),
  rug: (u) => `<defs><linearGradient id="${u}r" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b45309"/><stop offset="0.5" stop-color="#d97706"/><stop offset="1" stop-color="#92400e"/></linearGradient></defs>` +
    `<ellipse cx="300" cy="400" rx="190" ry="110" fill="url(#${u}r)"/>` +
    `<ellipse cx="300" cy="400" rx="150" ry="84" fill="none" stroke="#fde68a" stroke-width="10" opacity="0.7"/>` +
    `<ellipse cx="300" cy="400" rx="104" ry="56" fill="none" stroke="#78350f" stroke-width="8" opacity="0.6"/>` +
    `<ellipse cx="300" cy="400" rx="58" ry="30" fill="#fde68a" opacity="0.5"/>` +
    `<circle cx="180" cy="330" r="12" fill="#fde68a"/><circle cx="420" cy="470" r="12" fill="#fde68a"/><circle cx="420" cy="330" r="10" fill="#fef3c7"/><circle cx="180" cy="470" r="10" fill="#fef3c7"/>` +
    spark(150, 200, 12) + spark(455, 220, 10, "#fde68a", 0.9),
  shelf: (u) => `<defs><linearGradient id="${u}h" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a16207"/><stop offset="1" stop-color="#713f12"/></linearGradient></defs>` +
    `<rect x="200" y="170" width="200" height="300" rx="10" fill="url(#${u}h)"/>` +
    `<rect x="214" y="184" width="172" height="76" rx="6" fill="#451a03"/>` +
    `<rect x="214" y="274" width="172" height="76" rx="6" fill="#451a03"/>` +
    `<rect x="214" y="364" width="172" height="92" rx="6" fill="#451a03"/>` +
    `<rect x="228" y="200" width="22" height="60" rx="4" fill="#dc2626"/><rect x="256" y="192" width="22" height="68" rx="4" fill="#2563eb"/><rect x="284" y="204" width="22" height="56" rx="4" fill="#16a34a"/><rect x="312" y="196" width="22" height="64" rx="4" fill="#f59e0b"/>` +
    `<rect x="228" y="290" width="60" height="60" rx="8" fill="#0ea5e9"/><circle cx="330" cy="320" r="30" fill="#f472b6"/>` +
    `<rect x="228" y="380" width="80" height="60" rx="8" fill="#8b5cf6"/><rect x="318" y="388" width="54" height="52" rx="8" fill="#fbbf24"/>` +
    spark(150, 180, 12) + spark(455, 220, 10, "#fde68a", 0.9),
  vase: (u) => `<defs><linearGradient id="${u}v" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0ea5e9"/><stop offset="0.5" stop-color="#0369a1"/><stop offset="1" stop-color="#075985"/></linearGradient></defs>` +
    `<ellipse cx="300" cy="470" rx="90" ry="16" fill="#0c4a6e" opacity="0.4"/>` +
    `<path d="M270,210 Q270,280 240,330 Q210,400 250,462 L350,462 Q390,400 360,330 Q330,280 330,210 Z" fill="url(#${u}v)"/>` +
    `<path d="M262,240 Q262,300 240,348" stroke="#ffffff" stroke-width="12" fill="none" opacity="0.35" stroke-linecap="round"/>` +
    `<rect x="262" y="186" width="76" height="30" rx="10" fill="#075985"/>` +
    `<line x1="300" y1="186" x2="300" y2="120" stroke="#16a34a" stroke-width="8" stroke-linecap="round"/>` +
    `<line x1="300" y1="150" x2="268" y2="108" stroke="#16a34a" stroke-width="7" stroke-linecap="round"/>` +
    `<line x1="300" y1="150" x2="332" y2="104" stroke="#16a34a" stroke-width="7" stroke-linecap="round"/>` +
    `<circle cx="262" cy="100" r="20" fill="#f472b6"/><circle cx="338" cy="96" r="22" fill="#fb7185"/><circle cx="300" cy="108" r="18" fill="#fda4af"/>` +
    spark(160, 200, 12) + spark(450, 240, 10, "#bae6fd", 0.9),
  cushion: (u) => `<defs><linearGradient id="${u}k" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f472b6"/><stop offset="1" stop-color="#be185d"/></linearGradient></defs>` +
    `<rect x="170" y="240" width="260" height="220" rx="56" fill="url(#${u}k)"/>` +
    `<rect x="170" y="240" width="260" height="220" rx="56" fill="none" stroke="#9d174d" stroke-width="6"/>` +
    `<circle cx="170" cy="240" r="16" fill="#9d174d"/><circle cx="430" cy="240" r="16" fill="#9d174d"/><circle cx="170" cy="460" r="16" fill="#9d174d"/><circle cx="430" cy="460" r="16" fill="#9d174d"/>` +
    `<path d="M230,300 q70,-34 140,0" stroke="#fbcfe8" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.8"/>` +
    `<path d="M230,350 q70,-30 140,0" stroke="#fbcfe8" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.6"/>` +
    `<circle cx="300" cy="410" r="26" fill="#fbcfe8" opacity="0.85"/><circle cx="300" cy="410" r="12" fill="#be185d"/>` +
    spark(140, 190, 12) + spark(462, 230, 10, "#fbcfe8", 0.9),
};

/* ------------------------------- SPORT (energetic) ------------------------------- */
const SPORT: Record<string, Draw> = {
  bat: (u) => `<defs><linearGradient id="${u}b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d6a05c"/><stop offset="1" stop-color="#92600f"/></linearGradient></defs>` +
    `<rect x="283" y="140" width="34" height="110" rx="14" fill="#5c3a08"/>` +
    `<path d="M272,250 L328,250 L320,470 Q317,492 300,492 Q283,492 280,470 Z" fill="url(#${u}b)"/>` +
    `<path d="M286,270 L314,270 L310,460 L290,460 Z" fill="#ffffff" opacity="0.14"/>` +
    `<line x1="276" y1="330" x2="324" y2="330" stroke="#5c3a08" stroke-width="5" opacity="0.5"/>` +
    `<circle cx="420" cy="400" r="42" fill="#dc2626"/><path d="M392,380 q28,20 56,0" stroke="#ffffff" stroke-width="6" fill="none"/>` +
    spark(150, 180, 13) + spark(160, 420, 10, "#fca5a5", 0.9),
  football: (u) => `<defs><radialGradient id="${u}f" cx="0.38" cy="0.34" r="0.95"><stop offset="0" stop-color="#ffffff"/><stop offset="0.7" stop-color="#e2e8f0"/><stop offset="1" stop-color="#94a3b8"/></radialGradient></defs>` +
    `<circle cx="300" cy="330" r="120" fill="url(#${u}f)"/>` +
    `<circle cx="300" cy="330" r="120" fill="none" stroke="#1e293b" stroke-width="6"/>` +
    `<polygon points="300,292 336,318 322,360 278,360 264,318" fill="#1e293b"/>` +
    `<polygon points="300,238 318,268 282,268" fill="#1e293b"/><polygon points="384,300 388,336 356,336" fill="#1e293b"/><polygon points="216,300 212,336 244,336" fill="#1e293b"/>` +
    `<polygon points="340,408 318,428 300,408" fill="#1e293b"/><polygon points="260,408 282,428 300,408" fill="#1e293b"/>` +
    `<line x1="300" y1="360" x2="300" y2="408" stroke="#1e293b" stroke-width="5"/><line x1="336" y1="318" x2="384" y2="300" stroke="#1e293b" stroke-width="5"/><line x1="264" y1="318" x2="216" y2="300" stroke="#1e293b" stroke-width="5"/>` +
    spark(150, 200, 13) + spark(455, 250, 10),
  shoes: (u) => `<defs><linearGradient id="${u}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ef4444"/><stop offset="1" stop-color="#991b1b"/></linearGradient></defs>` +
    `<ellipse cx="300" cy="470" rx="160" ry="20" fill="#1e293b" opacity="0.25"/>` +
    `<path d="M150,400 Q150,330 210,322 L250,318 L268,250 Q272,232 292,236 L312,240 Q330,244 328,262 L322,310 L430,330 Q458,336 452,368 L446,400 Q444,424 420,424 L180,424 Q150,424 150,400" fill="url(#${u}s)"/>` +
    `<path d="M150,400 L446,400 L442,424 L180,424 Z" fill="#ffffff"/>` +
    `<path d="M268,250 L322,310" stroke="#ffffff" stroke-width="10" stroke-linecap="round"/>` +
    `<line x1="290" y1="272" x2="310" y2="276" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/>` +
    `<line x1="284" y1="290" x2="304" y2="294" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/>` +
    `<circle cx="400" cy="360" r="14" fill="#ffffff" opacity="0.8"/>` +
    spark(140, 200, 12) + spark(460, 240, 10, "#fecaca", 0.9),
  dumbbell: (u) => `<defs><linearGradient id="${u}d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#64748b"/><stop offset="1" stop-color="#1e293b"/></linearGradient></defs>` +
    `<rect x="150" y="316" width="300" height="28" rx="14" fill="#94a3b8"/>` +
    `<rect x="170" y="240" width="52" height="180" rx="22" fill="url(#${u}d)"/>` +
    `<rect x="232" y="262" width="44" height="136" rx="20" fill="url(#${u}d)"/>` +
    `<rect x="324" y="262" width="44" height="136" rx="20" fill="url(#${u}d)"/>` +
    `<rect x="378" y="240" width="52" height="180" rx="22" fill="url(#${u}d)"/>` +
    `<rect x="182" y="260" width="28" height="140" rx="14" fill="#ffffff" opacity="0.14"/>` +
    `<rect x="390" y="260" width="28" height="140" rx="14" fill="#ffffff" opacity="0.14"/>` +
    spark(150, 190, 13) + spark(455, 200, 10),
  yogamat: (u) => `<defs><linearGradient id="${u}y" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8b5cf6"/><stop offset="0.5" stop-color="#6d28d9"/><stop offset="1" stop-color="#4c1d95"/></linearGradient></defs>` +
    `<rect x="200" y="200" width="200" height="260" rx="100" fill="url(#${u}y)"/>` +
    `<ellipse cx="300" cy="200" rx="100" ry="34" fill="#a78bfa"/>` +
    `<ellipse cx="300" cy="200" rx="66" ry="20" fill="#4c1d95"/>` +
    `<rect x="228" y="200" width="34" height="260" rx="17" fill="#ffffff" opacity="0.16"/>` +
    `<rect x="150" y="330" width="300" height="26" rx="13" fill="#4c1d95"/>` +
    `<rect x="150" y="330" width="300" height="26" rx="13" fill="none" stroke="#a78bfa" stroke-width="4"/>` +
    spark(150, 190, 12) + spark(455, 230, 10, "#ddd6fe", 0.9),
  racket: (u) => `<defs><radialGradient id="${u}r" cx="0.5" cy="0.5" r="0.6"><stop offset="0.82" stop-color="#ffffff" stop-opacity="0"/><stop offset="0.86" stop-color="#dc2626"/><stop offset="1" stop-color="#991b1b"/></radialGradient></defs>` +
    `<ellipse cx="300" cy="280" rx="110" ry="130" fill="none" stroke="#991b1b" stroke-width="22"/>` +
    `<ellipse cx="300" cy="280" rx="110" ry="130" fill="url(#${u}r)"/>` +
    `<line x1="210" y1="230" x2="390" y2="230" stroke="#e2e8f0" stroke-width="4"/><line x1="200" y1="280" x2="400" y2="280" stroke="#e2e8f0" stroke-width="4"/><line x1="210" y1="330" x2="390" y2="330" stroke="#e2e8f0" stroke-width="4"/>` +
    `<line x1="250" y1="170" x2="250" y2="390" stroke="#e2e8f0" stroke-width="4"/><line x1="300" y1="160" x2="300" y2="400" stroke="#e2e8f0" stroke-width="4"/><line x1="350" y1="170" x2="350" y2="390" stroke="#e2e8f0" stroke-width="4"/>` +
    `<rect x="286" y="400" width="28" height="80" rx="12" fill="#451a03"/>` +
    `<rect x="278" y="440" width="44" height="52" rx="14" fill="#1e293b"/>` +
    `<circle cx="430" cy="400" r="30" fill="#fbbf24"/><path d="M408,400 q22,-14 44,0" stroke="#ffffff" stroke-width="5" fill="none"/>` +
    spark(150, 180, 12) + spark(160, 420, 10, "#fecaca", 0.9),
  duffel: (u) => `<defs><linearGradient id="${u}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#334155"/><stop offset="1" stop-color="#0f172a"/></linearGradient></defs>` +
    `<path d="M230,250 Q230,180 300,180 Q370,180 370,250" stroke="#0f172a" stroke-width="26" fill="none"/>` +
    `<rect x="150" y="250" width="300" height="190" rx="70" fill="url(#${u}g)"/>` +
    `<rect x="150" y="330" width="300" height="26" fill="#dc2626"/>` +
    `<rect x="230" y="250" width="26" height="190" fill="#1e293b"/><rect x="344" y="250" width="26" height="190" fill="#1e293b"/>` +
    `<rect x="276" y="380" width="48" height="34" rx="8" fill="#fbbf24"/>` +
    `<ellipse cx="240" cy="300" rx="40" ry="60" fill="#ffffff" opacity="0.1"/>` +
    spark(140, 190, 12) + spark(462, 230, 10),
  bottle: (u) => `<defs><linearGradient id="${u}w" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#bae6fd"/><stop offset="0.5" stop-color="#38bdf8"/><stop offset="1" stop-color="#0284c7"/></linearGradient></defs>` +
    `<rect x="278" y="150" width="44" height="34" rx="10" fill="#0c4a6e"/>` +
    `<rect x="286" y="184" width="28" height="40" fill="#bae6fd"/>` +
    `<path d="M270,224 Q240,260 240,330 L240,440 Q240,470 270,470 L330,470 Q360,470 360,440 L360,330 Q360,260 330,224 Z" fill="url(#${u}w)" opacity="0.92"/>` +
    `<path d="M252,300 Q300,330 348,300 L348,440 Q348,458 330,458 L270,458 Q252,458 252,440 Z" fill="#0284c7" opacity="0.55"/>` +
    `<rect x="256" y="250" width="16" height="170" rx="8" fill="#ffffff" opacity="0.5"/>` +
    `<path d="M240,330 q60,26 120,0" stroke="#ffffff" stroke-width="5" fill="none" opacity="0.6"/>` +
    spark(160, 190, 12) + spark(450, 240, 10, "#bae6fd", 0.9),
};

/* ------------------------------- registry ------------------------------- */
const ART: Record<string, Record<string, Draw>> = {
  gadget: GADGET, jewel: JEWEL, kids: KIDS, beauty: BEAUTY, organic: ORGANIC, pharma: PHARMA,
  lifestyle: LIFE, food: FOOD, furniture: FURNITURE, sport: SPORT,
};

export const NICHE_KINDS: Record<string, string[]> = {
  gadget: ["headphones", "smartwatch", "earbuds", "speaker", "drone", "phone", "gamepad", "camera"],
  jewel: ["ring", "necklace", "earrings", "bracelet", "diamond", "chain", "brooch", "pearls"],
  kids: ["teddy", "blocks", "toycar", "ball", "robot", "kite", "rings", "puzzle"],
  beauty: ["serum", "cream", "lipstick", "perfume", "pump", "compact", "mascara", "cleanser"],
  organic: ["tomato", "carrot", "honey", "avocado", "broccoli", "apple", "spinach", "eggs"],
  pharma: ["pillbottle", "syrup", "capsules", "ointment", "drops", "spray", "firstaid", "thermometer"],
  furniture: ["sofa", "table", "chair", "lamp", "rug", "shelf", "vase", "cushion"],
  sport: ["bat", "football", "shoes", "dumbbell", "yogamat", "racket", "duffel", "bottle"],
  food: ["biryani", "burger", "cake", "pizza", "fuchka", "lassi", "friedchicken", "pasta"],
  lifestyle: ["tote", "sneakers", "mug", "jacket", "wallet", "tee", "lamp", "scarf", "backpack", "sunglasses", "pillow", "bottle"],
};

/** Detailed product illustration for a niche theme. Falls back to the generic art. */
export function nicheProductArt(theme: string, kind: string, seed = 0): string {
  const draw = ART[theme]?.[kind];
  if (!draw) return productArt(seed, "🛍️", 220);
  return frame(theme, seed * 7 + kind.length, draw);
}

