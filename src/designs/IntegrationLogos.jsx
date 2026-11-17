// Grouped integration logo grid. Real logos come from Simple Icons (bundled, no CDN);
// brands not in Simple Icons render a monogram until official partner logo files are added.
// Named imports only, so the bundle includes just these icons, not the whole set.
import { siQuickbooks, siXero, siStripe, siTwilio, siGoogle, siZapier } from "simple-icons";
import { integrationGroups } from "./content.js";

const si = { siQuickbooks, siXero, siStripe, siTwilio, siGoogle, siZapier };

function Logo({ item, ink, size = 22 }) {
  const icon = item.si && si[item.si];
  if (icon) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={icon.title} style={{ flexShrink: 0 }}>
        <path d={icon.path} fill={`#${icon.hex}`} />
      </svg>
    );
  }
  // Monogram placeholder: replace with partner-supplied logo file (e.g. /logos/manheim.svg).
  const letters = item.name.replace(/[^A-Za-z0-9 ]/g, "").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <span aria-hidden="true" style={{
      width: size + 4, height: size + 4, borderRadius: 7, flexShrink: 0, display: "grid", placeItems: "center",
      background: ink, color: "#fff", fontSize: 10, fontWeight: 800, letterSpacing: 0.3,
    }}>{letters}</span>
  );
}

export default function IntegrationLogos({ C }) {
  return (
    <div style={{ display: "grid", gap: 22 }}>
      {integrationGroups.map(g => (
        <div key={g.group} className="int-row" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16, alignItems: "start" }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.mute, paddingTop: 16 }}>{g.group}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {g.items.map(item => (
              <div key={item.name} title={item.note || item.name} style={{
                display: "flex", alignItems: "center", gap: 10, height: 52, padding: "0 16px 0 12px",
                background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
                boxShadow: "0 1px 2px rgba(15,23,42,.04)",
              }}>
                <Logo item={item} ink={C.ink} />
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, whiteSpace: "nowrap" }}>{item.name}</div>
                  {item.note && <div style={{ fontSize: 11, color: C.mute, whiteSpace: "nowrap" }}>{item.note}</div>}
                </div>
                {item.live
                  ? <span style={{ fontSize: 10, fontWeight: 700, color: C.good, background: "rgba(5,150,105,0.1)", padding: "3px 7px", borderRadius: 999 }}>LIVE</span>
                  : <span style={{ fontSize: 10, fontWeight: 700, color: C.mute, background: C.bg2, padding: "3px 7px", borderRadius: 999 }}>SOON</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
      <style dangerouslySetInnerHTML={{ __html: `@media(max-width:760px){.int-row{grid-template-columns:1fr!important}.int-row>div:first-child{padding-top:0!important}}` }} />
    </div>
  );
}
