// DESIGN A — "Command Center": light (white) AI/tech-forward. Live tracking map is the hero.
import { useState } from "react";
import Icon from "./icons.jsx";
import { brand, journey, protection, audiences, vendorTypes, ai, modules, stats, enterprise, faqs } from "./content.js";
import IntegrationLogos from "./IntegrationLogos.jsx";
import GaFlMap from "./GaFlMap.jsx";
import AskDemo from "./AskDemo.jsx";
import DemoBooking from "./DemoBooking.jsx";

import { C, Shell, industryHref } from "./layoutA.jsx";
import { industries } from "./industries.js";

// Sample live activity for the ticker strip (dealers + each vendor type).
const ticker = [
  { icon: "truck", who: "Transport", text: "2022 F-150 picked up in Atlanta, GA · 24 photos + video", ago: "2m ago" },
  { icon: "dealerships", who: "Dealership", text: "2020 Tahoe out on a test drive with Joey S.", ago: "4m ago" },
  { icon: "mechanic", who: "Mechanical", text: "2019 Camry front brakes started · Bay 5", ago: "6m ago" },
  { icon: "body", who: "Body & Paint", text: "2023 BMW X5 left rear rim repair 60% done", ago: "9m ago" },
  { icon: "tint", who: "Tint & PPF", text: "2024 Model Y ceramic tint complete", ago: "12m ago" },
  { icon: "wash", who: "Detail & Wash", text: "2021 Accord full detail · Bay 3", ago: "15m ago" },
  { icon: "truck", who: "Transport", text: "2021 Silverado delivered to Orlando · no new damage", ago: "18m ago" },
  { icon: "audio", who: "Car Audio", text: "2023 Silverado amp + sub install complete", ago: "20m ago" },
  { icon: "gps", who: "Fleet", text: "Van #07 oil change scheduled · 200 mi to due", ago: "22m ago" },
  { icon: "dealerships", who: "Dealership", text: "2022 RAV4 frontline ready · listed online", ago: "25m ago" },
];

function TrackingMock() {
  const units = [
    { car: "2022 Ford F-150", st: "In transit · 12 mi", c: C.accent2 },
    { car: "2023 BMW X5", st: "Recon · Mechanical", c: C.accent },
    { car: "2021 Honda Accord", st: "Detail · Bay 3", c: C.violet },
    { car: "2020 Chevy Tahoe", st: "Frontline ready", c: C.good },
  ];
  return (
    <div style={{ position: "relative" }}>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 40px 120px rgba(59,130,246,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", borderBottom: `1px solid ${C.line}` }}>
          {["#ef4444", "#f59e0b", "#22c55e"].map(c => <span key={c} style={{ width: 9, height: 9, borderRadius: 9, background: c, opacity: 0.7 }} />)}
          <span style={{ marginLeft: 12, fontSize: 11, color: C.mute }}>app.autosync360.com / live-tracking</span>
        </div>
        <div className="a-track" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr" }}>
          {/* Stylized GA → FL map: swap for a real map (Mapbox/Google) in the app */}
          <div style={{ position: "relative", minHeight: 300, overflow: "hidden" }}>
            <GaFlMap C={C} />
            <div style={{ position: "absolute", right: 12, top: 12, fontSize: 11, padding: "5px 9px", borderRadius: 6, background: "rgba(255,255,255,0.92)", border: `1px solid ${C.line}`, color: C.accent2, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <span className="a-blink" style={{ width: 7, height: 7, borderRadius: 7, background: "#22c55e" }} />LIVE · ETA 2:40 PM
            </div>
          </div>
          <div style={{ padding: 14, borderLeft: `1px solid ${C.line}` }}>
            <div style={{ fontSize: 11, color: C.mute, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Units · 47 active</div>
            {units.map(u => (
              <div key={u.car} style={{ background: C.bg2, border: `1px solid ${C.line}`, borderRadius: 8, padding: "9px 10px", marginBottom: 7 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{u.car}</div>
                <div style={{ fontSize: 11, color: u.c, marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 6, height: 6, borderRadius: 6, background: u.c }} />{u.st}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Floating AI bubble */}
      <div className="a-float" style={{ position: "absolute", left: -48, bottom: -92, width: 250, background: "rgba(255,255,255,0.97)", border: `1px solid rgba(167,139,250,0.35)`, borderRadius: 14, padding: 14, boxShadow: "0 20px 60px rgba(15,23,42,0.14)", backdropFilter: "blur(8px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: C.violet, marginBottom: 6 }}><Icon name="ai" size={13} color={C.violet} />AUTOSYNC AI</div>
        <div style={{ fontSize: 12, lineHeight: 1.55, color: C.text }}>F-150 arrives at 2:40. Auction report flags a rear bumper scuff, so I've sent the photos to body shop and booked detail. <span style={{ color: C.accent2 }}>View recon plan →</span></div>
      </div>
    </div>
  );
}

export default function DesignA() {
  const [aud, setAud] = useState("dealer");
  const [open, setOpen] = useState(0);
  const A = audiences[aud];

  return (
    <Shell>

      {/* HERO */}
      <section style={{ padding: "88px 0 110px", background: `radial-gradient(800px 400px at 70% 10%, rgba(59,130,246,0.18), transparent), radial-gradient(600px 300px at 10% 80%, rgba(167,139,250,0.1), transparent)` }}>
        <div className="a-wrap a-split" style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 56, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, border: `1px solid rgba(167,139,250,0.35)`, background: "rgba(167,139,250,0.08)", fontSize: 12, fontWeight: 600, color: C.violet, marginBottom: 22 }}>
              <Icon name="ai" size={13} color={C.violet} />AI-powered dealer operations
            </div>
            <h1 className="a-h" style={{ fontSize: "clamp(38px, 5vw, 60px)", lineHeight: 1.05, marginBottom: 22 }}>
              Know where every vehicle is. <span style={{ color: C.accent2 }}>Automate everything after.</span>
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: C.mute, marginBottom: 32, maxWidth: 520 }}>{brand.sub}</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a className="a-btn a-btn-p" href="#demo">Book a demo <Icon name="arrow" size={16} /></a>
              <a className="a-btn a-btn-g" href="#who">I'm a vendor</a>
            </div>
            <div style={{ display: "flex", gap: 18, marginTop: 28, flexWrap: "wrap", fontSize: 13, color: C.mute }}>
              {["Live GPS tracking", "Fully customizable", "Web, iOS & Android"].map(t => (
                <span key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="check" size={14} color={C.good} />{t}</span>
              ))}
            </div>
          </div>
          <TrackingMock />
        </div>
      </section>

      {/* LIVE TICKER: dealers + vendors activity, scrolls left */}
      <div style={{ borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, background: C.bg2, display: "flex", alignItems: "stretch", overflow: "hidden" }}>
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8, padding: "0 20px", background: C.ink, color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: 1, zIndex: 1 }}>
          <span className="a-blink" style={{ width: 8, height: 8, borderRadius: 8, background: "#22c55e" }} />LIVE
        </div>
        <div className="a-ticker-mask" style={{ overflow: "hidden", flex: 1 }}>
          <div className="a-ticker">
            {[0, 1].map(copy => (
              <div key={copy} aria-hidden={copy === 1} style={{ display: "flex", gap: 40, paddingRight: 40 }}>
                {ticker.map(t => (
                  <span key={t.text} style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", fontSize: 14, color: C.text, padding: "20px 0" }}>
                    <Icon name={t.icon} size={16} color={t.icon === "dealerships" ? C.accent : C.accent2} />
                    <b style={{ color: C.ink, fontWeight: 600 }}>{t.who}</b>
                    <span style={{ color: C.mute }}>{t.text}</span>
                    <span style={{ fontSize: 11, color: C.mute, opacity: 0.7 }}>{t.ago}</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* JOURNEY */}
      <section id="journey" className="a-sec" style={{ borderTop: "none" }}>
        <div className="a-wrap">
          <div className="a-eyebrow">Auction to frontline</div>
          <h2 className="a-h a-h2" style={{ margin: "12px 0 14px", maxWidth: 680 }}>Every vehicle, every handoff, tracked in one place.</h2>
          <p style={{ color: C.mute, fontSize: 16, maxWidth: 600, marginBottom: 56 }}>From the moment you buy a unit to the moment it hits the line, dealers and vendors work from the same live record.</p>
          <div className="a-journey">
            {journey.map((j, i) => (
              <div key={j.title} style={{ position: "relative" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, display: "grid", placeItems: "center", background: C.card, border: `1px solid ${C.line}`, marginBottom: 18, position: "relative", zIndex: 1 }}>
                  <Icon name={j.icon} size={20} color={i === journey.length - 1 ? C.good : C.accent2} />
                </div>
                <div style={{ fontFamily: "'Space Grotesk'", fontSize: 12, color: C.mute, marginBottom: 6 }}>STEP 0{i + 1}</div>
                <h3 style={{ fontSize: 16, color: C.ink, marginBottom: 8 }}>{j.title}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: C.mute }}>{j.desc}</p>
              </div>
            ))}
          </div>

          {/* PROTECTION: photo + video proof at pickup and delivery */}
          <div className="a-card a-split" style={{ marginTop: 64, padding: 32, display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 36, alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center", background: "rgba(34,211,238,0.12)" }}><Icon name="camera" size={18} color={C.accent2} /></span>
                <span style={{ width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center", background: "rgba(34,211,238,0.12)" }}><Icon name="video" size={18} color={C.accent2} /></span>
              </div>
              <h3 className="a-h" style={{ fontSize: 28, marginBottom: 12 }}>{protection.title}</h3>
              <p style={{ color: C.mute, lineHeight: 1.7 }}>{protection.desc}</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[["Pickup", protection.pickup, C.accent2], ["Delivery", protection.delivery, C.good]].map(([label, lines, c]) => (
                <div key={label} style={{ background: C.bg2, border: `1px solid ${C.line}`, borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: c, letterSpacing: 1, marginBottom: 10 }}>{label.toUpperCase()}</div>
                  {/* Placeholder thumbnails: swap for real vehicle photos */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5, marginBottom: 10 }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} style={{ aspectRatio: "4/3", borderRadius: 5, background: i === 0 ? "rgba(37,99,235,0.14)" : C.card, display: "grid", placeItems: "center" }}>{i === 0 && <Icon name="video" size={12} color={C.accent} />}</div>
                    ))}
                  </div>
                  {lines.map((l, i) => <div key={l} style={{ fontSize: 12, color: i === 2 ? c : C.mute, marginTop: 4, display: "flex", gap: 5, alignItems: "center" }}>{i === 2 && <Icon name="check" size={12} color={c} width={3} />}{l}</div>)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AI */}
      <section id="ai" className="a-sec" style={{ background: `radial-gradient(700px 400px at 20% 30%, rgba(167,139,250,0.12), transparent), ${C.bg2}` }}>
        <div className="a-wrap">
          <div className="a-split" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center", marginBottom: 56 }}>
            <div>
              <div className="a-eyebrow" style={{ color: C.violet }}>AutoSync AI</div>
              <h2 className="a-h a-h2" style={{ margin: "12px 0 16px" }}>{ai.headline}</h2>
              <p style={{ color: C.mute, fontSize: 16, lineHeight: 1.7 }}>{ai.sub}</p>
            </div>
            <AskDemo C={C} />
          </div>
          <div className="a-grid4">
            {ai.features.map(f => (
              <div key={f.title} className="a-card" style={{ padding: 22 }}>
                <Icon name={f.icon} size={20} color={C.violet} />
                <h3 style={{ fontSize: 16, color: C.ink, margin: "14px 0 6px" }}>{f.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: C.mute }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEALERS & VENDORS */}
      <section id="who" className="a-sec">
        <div className="a-wrap">
          <div className="a-eyebrow">Two sides, one platform</div>
          <h2 className="a-h a-h2" style={{ margin: "12px 0 28px" }}>Built for dealers and the vendors who serve them.</h2>
          <div className="a-seg" style={{ marginBottom: 28 }}>
            {Object.entries(audiences).map(([k, v]) => <button key={k} className={aud === k ? "on" : ""} onClick={() => setAud(k)}>{v.label}</button>)}
          </div>
          <div className="a-card a-split" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" }}>
            <div style={{ padding: 36 }}>
              <h3 className="a-h" style={{ fontSize: 28, marginBottom: 12 }}>{A.title}</h3>
              <p style={{ color: C.mute, lineHeight: 1.7, marginBottom: 26 }}>{A.desc}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {A.points.map(p => (
                  <div key={p} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14 }}>
                    <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 6, display: "grid", placeItems: "center", background: "rgba(52,211,153,0.14)" }}><Icon name="check" size={12} color={C.good} width={3} /></span>{p}
                  </div>
                ))}
              </div>
            </div>
            {/* Placeholder: dealer dashboard screenshot / vendor phone app screenshot */}
            <div style={{ minHeight: 320, background: `linear-gradient(135deg, rgba(59,130,246,0.25), rgba(34,211,238,0.06))`, display: "grid", placeItems: "center", borderLeft: `1px solid ${C.line}` }}>
              {aud === "vendor" ? (
                <div style={{ width: 170, height: 300, borderRadius: 28, border: `6px solid ${C.ink}`, background: C.bg2, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 11, color: C.mute }}>New job</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Pickup · Manheim Orlando</div>
                  <div style={{ fontSize: 11, color: C.mute }}>2022 Ford F-150 → Sunshine Ford</div>
                  <div style={{ flex: 1, borderRadius: 10, background: C.card, border: `1px solid ${C.line}`, display: "grid", placeItems: "center" }}><Icon name="gps" size={26} color={C.accent2} /></div>
                  <div style={{ padding: 9, borderRadius: 8, background: C.accent, color: "#fff", fontSize: 12, fontWeight: 700, textAlign: "center" }}>Scan VIN & start</div>
                </div>
              ) : (
                <div style={{ textAlign: "center", color: C.mute }}><Icon name="reports" size={60} color={C.mute} width={1.2} /><div style={{ fontSize: 12, marginTop: 12, letterSpacing: 1, textTransform: "uppercase" }}>Dealer dashboard screenshot</div></div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* INDUSTRIES: links to each industry landing page */}
      <section id="industries" className="a-sec" style={{ background: C.bg2 }}>
        <div className="a-wrap">
          <div className="a-eyebrow">Built for</div>
          <h2 className="a-h a-h2" style={{ margin: "12px 0 12px", maxWidth: 760 }}>One platform for every business that touches a vehicle.</h2>
          <p style={{ color: C.mute, fontSize: 16, maxWidth: 620, marginBottom: 40 }}>Use it alongside your dealers, or run your own shop's inventory, jobs, team and invoicing on it.</p>
          <div className="a-grid3">
            {industries.map(i => (
              <a key={i.slug} href={industryHref(i.slug)} className="a-card a-ind" style={{ padding: 22, textDecoration: "none", display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0, width: 42, height: 42, borderRadius: 10, display: "grid", placeItems: "center", background: "rgba(8,145,178,0.1)" }}><Icon name={i.icon} size={20} color={C.accent2} /></span>
                <span>
                  <b style={{ display: "block", fontSize: 16, color: C.ink, marginBottom: 4 }}>{i.name}</b>
                  <span style={{ fontSize: 14, lineHeight: 1.5, color: C.mute }}>{i.short}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: C.accent, marginTop: 10 }}>Learn more <Icon name="arrow" size={14} color={C.accent} /></span>
                </span>
              </a>
            ))}
          </div>
          <style dangerouslySetInnerHTML={{ __html: `.a-ind{transition:transform .15s,box-shadow .15s}.a-ind:hover{transform:translateY(-2px);box-shadow:0 14px 40px rgba(15,23,42,.1)}` }} />
        </div>
      </section>

      {/* PLATFORM MODULES */}
      <section id="platform" className="a-sec" style={{ background: C.bg2 }}>
        <div className="a-wrap">
          <div className="a-eyebrow">The platform</div>
          <h2 className="a-h a-h2" style={{ margin: "12px 0 14px", maxWidth: 680 }}>Your whole operation. One login. Fully customizable.</h2>
          <p style={{ color: C.mute, fontSize: 16, maxWidth: 580, marginBottom: 48 }}>Turn on the modules you need, shape them to how your store works, and connect the apps you already use.</p>
          <div className="a-grid4">
            {modules.map(m => (
              <div key={m.key} className="a-card" style={{ padding: 22 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, display: "grid", placeItems: "center", background: "rgba(59,130,246,0.14)", marginBottom: 16 }}><Icon name={m.key} size={20} color={C.accent} /></div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: C.ink, marginBottom: 8 }}>{m.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: C.mute }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section id="integrations" className="a-sec">
        <div className="a-wrap">
          <div className="a-eyebrow">Integrations</div>
          <h2 className="a-h a-h2" style={{ margin: "12px 0 14px", maxWidth: 700 }}>Plugs into the tools your business already runs on.</h2>
          <p style={{ color: C.mute, fontSize: 16, maxWidth: 600, marginBottom: 44 }}>Invoices sync to your books, payments and payroll run in one place, and your team gets texts and emails automatically. Need something else? Enterprise accounts get custom integrations.</p>
          <IntegrationLogos C={C} />
        </div>
      </section>

      {/* STATS */}
      <section className="a-sec">
        <div className="a-wrap a-grid4">
          {stats.map(s => (
            <div key={s.label}>
              <div className="a-h" style={{ fontSize: 44, background: `linear-gradient(90deg, ${C.accent}, ${C.accent2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{s.value}</div>
              <div style={{ color: C.mute, fontSize: 14, marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ENTERPRISE */}
      <section id="enterprise" className="a-sec" style={{ background: C.bg2 }}>
        <div className="a-wrap a-split" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 48, alignItems: "center" }}>
          <div>
            <div className="a-eyebrow">Enterprise</div>
            <h2 className="a-h a-h2" style={{ margin: "12px 0 16px" }}>{enterprise.title}</h2>
            <p style={{ color: C.mute, fontSize: 16, lineHeight: 1.7, marginBottom: 28 }}>{enterprise.desc}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {enterprise.points.map(p => <div key={p} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14 }}><Icon name="check" size={14} color={C.good} width={3} />{p}</div>)}
            </div>
          </div>
          <div className="a-card" style={{ padding: 28 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18 }}>
              <div style={{ width: 56, height: 56, borderRadius: 56, background: `linear-gradient(135deg, ${C.accent}, ${C.violet})`, display: "grid", placeItems: "center" }}><Icon name="user" size={24} color="#fff" /></div>
              <div><div style={{ color: C.ink, fontWeight: 700 }}>Your Success Manager</div><div style={{ color: C.mute, fontSize: 13 }}>Dedicated to your dealer group</div></div>
            </div>
            {[["Quarterly growth review", "Scheduled"], ["Vendor scorecard rollout", "In progress"], ["QuickBooks sync", "Live"]].map(([a, b]) => (
              <div key={a} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: `1px solid ${C.line}`, fontSize: 14 }}><span>{a}</span><span style={{ color: C.accent2 }}>{b}</span></div>
            ))}
            <a className="a-btn a-btn-p" href="#demo" style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>Talk to enterprise sales</a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="a-sec">
        <div className="a-wrap" style={{ maxWidth: 760 }}>
          <h2 className="a-h" style={{ fontSize: "clamp(28px, 3.5vw, 40px)", marginBottom: 28 }}>Questions</h2>
          {faqs.map((f, i) => (
            <div key={f.q} style={{ borderBottom: `1px solid ${C.line}` }}>
              <button onClick={() => setOpen(open === i ? -1 : i)} style={{ width: "100%", textAlign: "left", background: "none", border: "none", color: C.ink, font: "600 16px Inter, sans-serif", padding: "20px 0", cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 12 }}>
                {f.q}<span style={{ color: C.mute }}>{open === i ? "−" : "+"}</span>
              </button>
              {open === i && <p style={{ color: C.mute, lineHeight: 1.7, paddingBottom: 20 }}>{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* DEMO CTA */}
      <section id="demo" className="a-sec" style={{ background: `radial-gradient(700px 300px at 50% 0%, rgba(59,130,246,0.2), transparent), ${C.bg2}` }}>
        <div className="a-wrap a-split" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
          <div>
            <h2 className="a-h" style={{ fontSize: "clamp(30px, 4vw, 48px)", marginBottom: 16 }}>See every vehicle, live, in 20 minutes.</h2>
            <p style={{ color: C.mute, fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>We'll walk you through AutoSync 360 with your own workflow, for your store or your vendor business.</p>
            <div style={{ display: "grid", gap: 10, marginBottom: 28 }}>
              {["Request a time that works for you on the next step", "20 minutes, tailored to your store or vendor business", "Live look at GPS tracking, recon workflow and AI", "No pressure, no credit card"].map(t => (
                <span key={t} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, color: C.text }}><Icon name="check" size={16} color={C.good} width={2.5} />{t}</span>
              ))}
            </div>
            <a href={brand.phoneHref} style={{ color: C.ink, textDecoration: "none", display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}><Icon name="phone" size={16} />Rather talk now? {brand.phone}</a>
          </div>
          <DemoBooking C={C} />
        </div>
      </section>

    </Shell>
  );
}
