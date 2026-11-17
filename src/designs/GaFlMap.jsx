// Stylized Georgia → Florida map for the hero tracking mock (Atlanta auction → Orlando dealer).
// Hand-simplified outlines, not survey-accurate. Swap for a real map (Mapbox/Google) in the app.
import Icon from "./icons.jsx";

// Simple equirectangular projection: lon -88.2..-79.2, lat 35.0..27.0 → 312 × 320 viewBox.
const P = (lon, lat) => [+((lon + 88.2) * 34.64).toFixed(1), +((35.0 - lat) * 40).toFixed(1)];
const pts = list => list.map(([lon, lat]) => P(lon, lat).join(",")).join(" ");

const land = [
  [-88.6, 35.6], [-78.6, 35.6], [-78.6, 33.9], [-79.0, 33.5], [-79.2, 33.2], [-79.9, 32.75], [-80.4, 32.45],
  [-80.9, 32.05], [-81.1, 31.75], [-81.3, 31.25], [-81.45, 30.75], [-81.4, 30.35], [-81.25, 29.8], [-81.0, 29.2],
  [-80.8, 28.8], [-80.55, 28.45], [-80.6, 28.0], [-80.4, 27.6], [-80.2, 27.0], [-80.1, 26.6], [-80.1, 26.0],
  [-82.0, 26.0], [-82.1, 26.6], [-82.4, 27.1], [-82.65, 27.5], [-82.8, 27.95], [-82.7, 28.4], [-82.65, 28.75],
  [-82.8, 29.1], [-83.1, 29.3], [-83.4, 29.6], [-83.7, 29.95], [-84.1, 30.08], [-84.4, 29.95], [-84.9, 29.7],
  [-85.3, 29.68], [-85.4, 29.9], [-85.7, 30.15], [-86.2, 30.38], [-86.8, 30.4], [-87.5, 30.3], [-88.0, 30.4], [-88.6, 30.35],
];

const borders = [
  [[-87.6, 30.3], [-87.6, 31.0], [-85.0, 31.0], [-84.86, 30.7], [-82.2, 30.57], [-81.45, 30.72]], // AL/FL + GA/FL
  [[-85.0, 31.0], [-85.1, 31.6], [-85.0, 32.3], [-85.2, 32.9], [-85.6, 35.0]],                    // AL/GA
  [[-80.9, 32.05], [-81.4, 32.6], [-81.9, 33.3], [-82.2, 33.6], [-82.6, 34.0], [-83.1, 34.5], [-83.3, 35.0]], // GA/SC
];

const roads = [
  [[-81.03, 34.0], [-82.0, 33.47], [-84.39, 33.75], [-86.8, 33.5]],                                  // I-20
  [[-82.4, 34.85], [-83.3, 34.4], [-84.39, 33.75], [-86.3, 32.38]],                                  // I-85
  [[-83.63, 32.84], [-82.9, 32.54], [-81.6, 32.2], [-81.1, 32.08]],                                  // I-16
  [[-79.8, 34.2], [-80.67, 32.9], [-81.2, 32.1], [-81.5, 31.15], [-81.66, 30.33], [-81.35, 29.9], [-81.1, 29.2], [-80.85, 28.6], [-80.7, 28.1], [-80.4, 27.4], [-80.2, 26.8]], // I-95
  [[-87.2, 30.5], [-86.5, 30.6], [-85.5, 30.75], [-84.28, 30.44], [-83.4, 30.45], [-82.64, 30.19], [-81.66, 30.33]], // I-10
  [[-82.04, 28.86], [-82.3, 28.5], [-82.4, 28.0], [-82.5, 27.3]],                                     // I-75 south of Wildwood
  [[-82.4, 28.0], [-81.95, 28.05], [-81.38, 28.54], [-81.1, 29.2]],                                   // I-4
];

// Route: Atlanta down I-75, Florida's Turnpike into Orlando. Truck sits ~12 mi out.
const route = [[-84.39, 33.75], [-84.2, 33.4], [-83.63, 32.84], [-83.73, 32.46], [-83.78, 31.96], [-83.51, 31.45],
  [-83.28, 30.83], [-82.64, 30.19], [-82.35, 29.65], [-82.14, 29.19], [-82.04, 28.86], [-81.85, 28.7], [-81.6, 28.6]];
const remaining = [[-81.6, 28.6], [-81.38, 28.54]];

const cities = [["Macon", -83.63, 32.84], ["Savannah", -81.1, 32.08], ["Tallahassee", -84.28, 30.44],
  ["Jacksonville", -81.66, 30.33], ["Tampa", -82.46, 27.95]];

const labels = [["GEORGIA", -82.75, 31.55], ["FLORIDA", -81.15, 27.7], ["ALABAMA", -86.7, 32.2], ["S. CAROLINA", -80.55, 33.45]];

export default function GaFlMap({ C }) {
  const [ax, ay] = P(-84.39, 33.75);
  const [dx, dy] = P(-81.38, 28.54);
  const [tx, ty] = P(-81.6, 28.6);
  return (
    <svg viewBox="0 0 312 320" preserveAspectRatio="xMidYMax slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-label="Live map: truck en route from Atlanta, GA to Orlando, FL">
      <rect width="312" height="320" fill="#e6f0fb" />
      <text x="262" y="215" fontSize="7" fill="#94a3b8" fontStyle="italic" textAnchor="middle" letterSpacing="1">ATLANTIC</text>
      <text x="40" y="282" fontSize="7" fill="#94a3b8" fontStyle="italic" textAnchor="middle" letterSpacing="1">GULF OF MEXICO</text>
      <polygon points={pts(land)} fill="#fbfcfe" stroke="#cbd8e8" strokeWidth="0.8" />
      {borders.map((b, i) => <polyline key={i} points={pts(b)} fill="none" stroke="#b6c2d2" strokeWidth="0.8" strokeDasharray="3 2" />)}
      {roads.map((r, i) => <polyline key={i} points={pts(r)} fill="none" stroke="#e2e8f0" strokeWidth="1.6" strokeLinejoin="round" />)}
      {labels.map(([t, lon, lat]) => { const [x, y] = P(lon, lat); return <text key={t} x={x} y={y} fontSize="7.5" fontWeight="600" fill="#a3b1c4" textAnchor="middle" letterSpacing="1.5">{t}</text>; })}
      {cities.map(([n, lon, lat]) => { const [x, y] = P(lon, lat); return (
        <g key={n}><circle cx={x} cy={y} r="1.8" fill="#94a3b8" /><text x={x + 4} y={y + 2.5} fontSize="6.5" fill="#94a3b8">{n}</text></g>
      ); })}

      {/* Route: driven (solid) + remaining (dashed) */}
      <polyline points={pts(route)} fill="none" stroke={C.accent2} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={pts(remaining)} fill="none" stroke={C.accent2} strokeWidth="2.4" strokeDasharray="3 3" strokeLinecap="round" />

      {/* Auction pickup */}
      <circle cx={ax} cy={ay} r="4.5" fill="#64748b" stroke="#fff" strokeWidth="1.5" />
      <text x={ax + 8} y={ay - 4} fontSize="7.5" fontWeight="600" fill="#475569">Auction</text>
      <text x={ax + 8} y={ay + 5} fontSize="6.5" fill="#94a3b8">Atlanta, GA</text>

      {/* Dealer drop-off */}
      <circle cx={dx} cy={dy} r="4.5" fill={C.good} stroke="#fff" strokeWidth="1.5" />
      <text x={dx + 8} y={dy + 2} fontSize="7.5" fontWeight="600" fill="#475569">Dealer</text>
      <text x={dx + 8} y={dy + 11} fontSize="6.5" fill="#94a3b8">Orlando, FL</text>

      {/* Live GPS beacon */}
      <circle className="a-ping" cx={tx} cy={ty} r="10" fill={C.accent2} />
      <circle className="a-ping a-ping2" cx={tx} cy={ty} r="10" fill={C.accent2} />
      <circle cx={tx} cy={ty} r="9" fill="#fff" stroke={C.accent2} strokeWidth="1.5" />
      <g transform={`translate(${tx - 5.5},${ty - 5.5})`}><Icon name="truck" size={11} color={C.accent2} /></g>
      <circle className="a-blink" cx={tx + 7} cy={ty - 7} r="2.6" fill="#22c55e" stroke="#fff" strokeWidth="1" />
    </svg>
  );
}
