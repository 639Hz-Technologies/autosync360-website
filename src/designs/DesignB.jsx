// DESIGN B — "Clean Platform": light, friendly, story-first (auction → frontline).
import { useState } from "react";
import Icon from "./icons.jsx";
import { brand, journey, protection, audiences, vendorTypes, ai, modules, integrations, enterprise, faqs } from "./content.js";

const C = {
  bg: "#ffffff", soft: "#f5f7fb", ink: "#0f172a", text: "#334155", mute: "#64748b", line: "#e2e8f0",
  blue: "#1a56db", blueSoft: "#eef3ff", orange: "#f97316", green: "#16a34a", violet: "#7c3aed", violetSoft: "#f3efff",
};

function FleetMock() {
  const rows = [
    ["Stock 4471", "2022 Ford F-150", "In transit · Swift Haul", "12 mi · ETA 2:40", C.orange],
    ["Stock 4468", "2023 BMW X5", "Recon · Mechanical", "Bay 2", C.blue],
    ["Stock 4460", "2021 Honda Accord", "Tint · ClearView", "On site", C.violet],
    ["Stock 4452", "2020 Chevy Tahoe", "Frontline ready", "Lot B-14", C.green],
  ];
  return (
    <div style={{ position: "relative" }}>
      <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, boxShadow: "0 30px 80px rgba(15,23,42,0.12)", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${C.line}`, gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 700, color: C.ink }}>All units <span style={{ color: C.mute, fontWeight: 500 }}>· 47 active</span></div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ fontSize: 12, padding: "6px 10px", borderRadius: 8, background: C.soft, color: C.mute }}>Map view</span>
            <span style={{ fontSize: 12, padding: "6px 10px", borderRadius: 8, background: C.blue, color: "#fff", fontWeight: 600 }}>+ Add unit</span>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 620 }}>
            <thead><tr style={{ color: C.mute, textAlign: "left" }}>{["Unit", "Vehicle", "Stage", "Location"].map(h => <th key={h} style={{ padding: "12px 20px", fontWeight: 500 }}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r[0]} style={{ borderTop: `1px solid ${C.line}` }}>
                  <td style={{ padding: "14px 20px", color: C.mute }}>{r[0]}</td>
                  <td style={{ padding: "14px 20px", color: C.ink, fontWeight: 600 }}>{r[1]}</td>
                  <td style={{ padding: "14px 20px" }}><span style={{ padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: r[4], background: `${r[4]}14` }}>{r[2]}</span></td>
                  <td style={{ padding: "14px 20px", color: C.text, display: "flex", gap: 6, alignItems: "center" }}><Icon name="gps" size={13} color={C.mute} />{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="b-float" style={{ position: "absolute", right: -28, bottom: -44, width: 270, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, boxShadow: "0 20px 50px rgba(15,23,42,0.16)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: C.violet, marginBottom: 6, letterSpacing: 0.6 }}><Icon name="ai" size={13} color={C.violet} />AUTOSYNC AI</div>
        <div style={{ fontSize: 13, lineHeight: 1.5, color: C.ink }}>F-150 arrives at 2:40. Auction report flags a bumper scuff, so I've emailed the photos to body shop and booked detail for tomorrow at 9.</div>
      </div>
    </div>
  );
}

function AiMock({ kind }) {
  if (kind === "chat") {
    return (
      <div>
        {ai.chat.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
            <div style={{ maxWidth: "85%", padding: "12px 16px", borderRadius: 16, fontSize: 14, lineHeight: 1.55, background: m.from === "user" ? C.ink : C.violetSoft, color: m.from === "user" ? "#fff" : C.ink }}>{m.text}</div>
          </div>
        ))}
        <div style={{ padding: "12px 16px", borderRadius: 999, border: `1px solid ${C.line}`, color: C.mute, fontSize: 13, marginTop: 6 }}>Ask about any vehicle, vendor or job…</div>
      </div>
    );
  }
  if (kind === "workflow") {
    const stages = ["Arrived", "Inspection", "Mechanical", "Body", "Tint", "Detail", "Photos", "Frontline"];
    return (
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.mute, marginBottom: 12 }}>Your recon workflow · drag to reorder</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
          {stages.map((s, i) => <span key={s} style={{ padding: "8px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: i < 3 ? C.blueSoft : C.soft, color: i < 3 ? C.blue : C.text, border: `1px dashed ${i < 3 ? C.blue : C.line}` }}>{s}</span>)}
        </div>
        <div style={{ background: C.soft, borderRadius: 12, padding: 14, fontSize: 13, color: C.text, lineHeight: 1.7 }}>
          <b style={{ color: C.ink }}>Rule:</b> When the <b>auction condition report</b> lists body damage → add <b>Body</b> stage, email photos to the body shop manager, text ETA to the recon team.
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {[["Vendor invoices", "38 auto-created", C.blue], ["Payroll", "Runs Fri · 22 staff", C.green], ["Unread messages", "4 on Stock 4468", C.orange], ["QuickBooks", "Synced 2 min ago", C.violet]].map(([l, v, c]) => (
        <div key={l} style={{ background: C.soft, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, color: C.mute }}>{l}</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: c, marginTop: 6 }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

const aiRows = [
  { kind: "chat", eyebrow: "Ask AutoSync", title: "Just ask where it is.", body: "Your AI assistant knows every vehicle, vendor and job. Ask in plain English and get the answer, plus the next step." },
  { kind: "workflow", eyebrow: "Customizable automation", title: "Your process, on autopilot.", body: "Build the stages, rules and approvals that match how your store works. AutoSync AI routes every vehicle to the next vendor automatically and warns you before a frontline date slips." },
  { kind: "back", eyebrow: "Back office, handled", title: "Invoicing, payroll and messaging, built in.", body: "Finished work becomes vendor invoices. Tracked hours become payroll. Every conversation lives on the vehicle it's about. Connect your DMS, QuickBooks and other apps." },
];

const tiers = [
  { name: "Vendor", for: "Transporters & service shops", items: ["Vendor app (iOS & Android)", "GPS jobs & proof of delivery", "Invoicing & payments", "Run your own shop"] },
  { name: "Dealer", for: "Single-rooftop dealerships", items: ["Live tracking, auction to frontline", "Recon workflow & vendor network", "AutoSync AI", "Invoicing, payroll & messaging"], featured: true },
  { name: "Enterprise", for: "Dealer groups & high volume", items: ["Everything in Dealer", "Dedicated success manager", "Custom workflows & integrations", "Multi-rooftop"] },
];

export default function DesignB() {
  const [aud, setAud] = useState("dealer");
  const A = audiences[aud];

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", overflowX: "hidden" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0} body{margin:0;background:#fff}
        .b-wrap{max-width:1160px;margin:0 auto;padding:0 24px}
        .b-h{color:${C.ink};font-weight:800;letter-spacing:-0.03em}
        .b-h2{font-size:clamp(30px,4vw,46px);line-height:1.1}
        .b-btn{display:inline-flex;align-items:center;gap:8px;padding:14px 24px;border-radius:999px;font-weight:700;font-size:15px;text-decoration:none;border:none;cursor:pointer;font-family:inherit}
        .b-btn-p{background:${C.ink};color:#fff} .b-btn-p:hover{background:#1e293b}
        .b-btn-s{background:${C.blueSoft};color:${C.blue}}
        .b-sec{padding:100px 0}
        .b-row{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center}
        .b-row.rev>div:first-child{order:2}
        .b-nav a{color:${C.text};text-decoration:none;font-size:15px;font-weight:500}
        .b-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
        .b-toggle{display:inline-flex;padding:5px;border-radius:999px;background:${C.soft};border:1px solid ${C.line}}
        .b-toggle button{padding:11px 22px;border-radius:999px;border:none;background:transparent;font:700 15px 'Plus Jakarta Sans',sans-serif;color:${C.mute};cursor:pointer}
        .b-toggle button.on{background:#fff;color:${C.ink};box-shadow:0 2px 8px rgba(15,23,42,.08)}
        @media(max-width:900px){.b-row{grid-template-columns:1fr;gap:32px}.b-row.rev>div:first-child{order:0}.b-nav{display:none!important}.b-float{display:none}.b-tiers{grid-template-columns:1fr!important}.b-steps{grid-template-columns:1fr 1fr}}
        @media(max-width:600px){.b-sec{padding:64px 0}.b-wrap{padding:0 16px}.b-steps{grid-template-columns:1fr}}
      ` }} />

      {/* NAV */}
      <header style={{ borderBottom: `1px solid ${C.line}`, position: "sticky", top: 0, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)", zIndex: 50 }}>
        <div className="b-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 76 }}>
          <img src="/autosync360logo.png" alt="AutoSync 360" style={{ height: 52 }} />
          <nav className="b-nav" style={{ display: "flex", gap: 30 }}>
            <a href="#journey">How it works</a><a href="#who">Dealers & Vendors</a><a href="#ai">AI</a><a href="#pricing">Pricing</a><a href="#enterprise">Enterprise</a>
          </nav>
          <a className="b-btn b-btn-p" href="#demo" style={{ padding: "11px 20px", fontSize: 14 }}>Get a demo</a>
        </div>
      </header>

      {/* HERO */}
      <section style={{ padding: "84px 0 130px", background: `linear-gradient(180deg, ${C.blueSoft} 0%, #fff 70%)` }}>
        <div className="b-wrap" style={{ textAlign: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 999, background: "#fff", border: `1px solid ${C.line}`, fontSize: 13, fontWeight: 700, color: C.violet, marginBottom: 24 }}>
            <Icon name="ai" size={14} color={C.violet} />AI-powered operations for dealerships
          </span>
          <h1 className="b-h" style={{ fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 1.02, maxWidth: 940, margin: "0 auto 22px" }}>
            From the auction lane to the front line. <span style={{ color: C.blue }}>Automated.</span>
          </h1>
          <p style={{ fontSize: 19, lineHeight: 1.6, color: C.mute, maxWidth: 660, margin: "0 auto 34px" }}>{brand.sub}</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 72 }}>
            <a className="b-btn b-btn-p" href="#demo">I'm a dealer: get a demo <Icon name="arrow" size={16} /></a>
            <a className="b-btn b-btn-s" href="#who">I'm a vendor</a>
          </div>
          <div style={{ maxWidth: 940, margin: "0 auto", textAlign: "left" }}><FleetMock /></div>
        </div>
      </section>

      {/* JOURNEY */}
      <section id="journey" className="b-sec" style={{ paddingTop: 70 }}>
        <div className="b-wrap">
          <h2 className="b-h b-h2" style={{ textAlign: "center", marginBottom: 14 }}>Always know where every vehicle is.</h2>
          <p style={{ textAlign: "center", color: C.mute, fontSize: 17, maxWidth: 620, margin: "0 auto 52px" }}>One live record follows each unit through every vendor and every stage, with no phone calls or whiteboards.</p>
          <div className="b-steps">
            {journey.map((j, i) => (
              <div key={j.title} style={{ border: `1px solid ${C.line}`, borderRadius: 20, padding: 26, background: i === journey.length - 1 ? "#f0fdf4" : "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: i === journey.length - 1 ? "#dcfce7" : C.blueSoft, display: "grid", placeItems: "center" }}><Icon name={j.icon} size={22} color={i === journey.length - 1 ? C.green : C.blue} /></div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: C.line }}>{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div style={{ fontWeight: 800, color: C.ink, fontSize: 18, marginBottom: 6 }}>{j.title}</div>
                <p style={{ fontSize: 14.5, lineHeight: 1.65, color: C.mute }}>{j.desc}</p>
                <div style={{ height: 4, borderRadius: 4, background: C.soft, marginTop: 18 }}><div style={{ height: 4, borderRadius: 4, width: `${((i + 1) / journey.length) * 100}%`, background: i === journey.length - 1 ? C.green : C.blue }} /></div>
              </div>
            ))}
          </div>

          {/* PROTECTION: photo + video proof at pickup and delivery */}
          <div className="b-row" style={{ marginTop: 80, gap: 48 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.orange, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>Photo + video condition proof</div>
              <h3 className="b-h" style={{ fontSize: "clamp(26px, 3.2vw, 38px)", lineHeight: 1.12, marginBottom: 16 }}>{protection.title}</h3>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: C.mute }}>{protection.desc}</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[["Pickup", protection.pickup, C.blue], ["Delivered", protection.delivery, C.green]].map(([label, lines, c]) => (
                <div key={label} style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 18, padding: 16, boxShadow: "0 16px 40px rgba(15,23,42,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: c, marginBottom: 12 }}><Icon name={label === "Pickup" ? "camera" : "check"} size={14} color={c} width={2.5} />{label}</div>
                  {/* Placeholder thumbnails: swap for real vehicle photos */}
                  <div style={{ aspectRatio: "16/10", borderRadius: 12, background: `linear-gradient(135deg, ${C.blueSoft}, ${C.soft})`, display: "grid", placeItems: "center", marginBottom: 6 }}>
                    <span style={{ width: 36, height: 36, borderRadius: 36, background: "#fff", display: "grid", placeItems: "center", boxShadow: "0 4px 12px rgba(15,23,42,0.1)" }}><Icon name="video" size={15} color={C.ink} /></span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5, marginBottom: 10 }}>
                    {Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ aspectRatio: "1", borderRadius: 6, background: C.soft }} />)}
                  </div>
                  {lines.map((l, i) => <div key={l} style={{ fontSize: 12.5, color: i === 2 ? c : C.mute, fontWeight: i === 2 ? 700 : 500, marginTop: 4 }}>{l}</div>)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DEALERS & VENDORS */}
      <section id="who" className="b-sec" style={{ background: C.soft }}>
        <div className="b-wrap" style={{ textAlign: "center" }}>
          <h2 className="b-h b-h2" style={{ marginBottom: 14 }}>Dealers and their vendors, finally in sync.</h2>
          <p style={{ color: C.mute, fontSize: 17, marginBottom: 30 }}>{vendorTypes.map(v => v.name).join(" · ")}</p>
          <div className="b-toggle" style={{ marginBottom: 36 }}>
            {Object.entries(audiences).map(([k, v]) => <button key={k} className={aud === k ? "on" : ""} onClick={() => setAud(k)}>{v.label}</button>)}
          </div>
          <div className="b-row" style={{ textAlign: "left", background: "#fff", borderRadius: 24, padding: 40, border: `1px solid ${C.line}` }}>
            <div>
              <h3 className="b-h" style={{ fontSize: 30, marginBottom: 12 }}>{A.title}</h3>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: C.mute, marginBottom: 24 }}>{A.desc}</p>
              <a className="b-btn b-btn-p" href="#demo">{aud === "dealer" ? "Get a dealer demo" : "Join as a vendor"}</a>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {A.points.map(p => (
                <div key={p} style={{ background: C.soft, borderRadius: 14, padding: "14px 16px", fontSize: 14, fontWeight: 600, color: C.ink, display: "flex", gap: 10, alignItems: "flex-start" }}><Icon name="check" size={15} color={C.green} width={3} />{p}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AI ROWS */}
      <section id="ai" className="b-sec">
        <div className="b-wrap">
          <div style={{ textAlign: "center", marginBottom: 80 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: C.violet, letterSpacing: 1.2, textTransform: "uppercase" }}>AutoSync AI</span>
            <h2 className="b-h b-h2" style={{ maxWidth: 760, margin: "12px auto 14px" }}>{ai.headline}</h2>
            <p style={{ color: C.mute, fontSize: 17, maxWidth: 640, margin: "0 auto" }}>{ai.sub}</p>
          </div>
          <div style={{ display: "grid", gap: 100 }}>
            {aiRows.map((f, i) => (
              <div key={f.kind} className={`b-row ${i % 2 ? "rev" : ""}`}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.orange, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>{f.eyebrow}</div>
                  <h3 className="b-h" style={{ fontSize: "clamp(26px, 3.2vw, 38px)", lineHeight: 1.12, marginBottom: 16 }}>{f.title}</h3>
                  <p style={{ fontSize: 17, lineHeight: 1.7, color: C.mute }}>{f.body}</p>
                </div>
                <div style={{ background: "#fff", borderRadius: 22, padding: 24, border: `1px solid ${C.line}`, boxShadow: "0 20px 50px rgba(15,23,42,0.06)" }}><AiMock kind={f.kind} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EVERYTHING INCLUDED */}
      <section className="b-sec" style={{ background: C.soft }}>
        <div className="b-wrap">
          <h2 className="b-h b-h2" style={{ textAlign: "center", marginBottom: 48 }}>Everything your operation needs, in one place.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 28 }}>
            {modules.map(m => (
              <div key={m.key} style={{ display: "flex", gap: 14 }}>
                <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 12, background: "#fff", border: `1px solid ${C.line}`, display: "grid", placeItems: "center" }}><Icon name={m.key} size={19} color={C.blue} /></div>
                <div><div style={{ fontWeight: 700, color: C.ink, marginBottom: 4 }}>{m.title}</div><div style={{ fontSize: 14, lineHeight: 1.6, color: C.mute }}>{m.desc}</div></div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 56 }}>
            <span style={{ width: "100%", textAlign: "center", fontSize: 14, color: C.mute, marginBottom: 6 }}>Integrates with</span>
            {integrations.map(n => <span key={n} style={{ padding: "10px 18px", borderRadius: 999, background: "#fff", border: `1px solid ${C.line}`, fontWeight: 700, color: C.text, fontSize: 14 }}>{n}</span>)}
          </div>
        </div>
      </section>

      {/* ENTERPRISE */}
      <section id="enterprise" className="b-sec">
        <div className="b-wrap">
          <div className="b-row" style={{ background: C.ink, borderRadius: 28, padding: "56px 48px", color: "#cbd5e1" }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#93c5fd", letterSpacing: 1.2, textTransform: "uppercase" }}>Enterprise</span>
              <h2 style={{ fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", margin: "12px 0 16px", lineHeight: 1.1 }}>{enterprise.title}</h2>
              <p style={{ fontSize: 17, lineHeight: 1.7 }}>{enterprise.desc}</p>
            </div>
            <div>
              <div style={{ display: "flex", gap: 14, alignItems: "center", background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 18, marginBottom: 18 }}>
                <div style={{ width: 52, height: 52, borderRadius: 52, background: `linear-gradient(135deg, ${C.blue}, ${C.violet})`, display: "grid", placeItems: "center" }}><Icon name="user" size={22} color="#fff" /></div>
                <div><div style={{ color: "#fff", fontWeight: 700 }}>Your dedicated Success Manager</div><div style={{ fontSize: 13 }}>One person who knows your stores and vendors</div></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {enterprise.points.map(p => <div key={p} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}><Icon name="check" size={14} color="#4ade80" width={3} />{p}</div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SKELETON */}
      <section id="pricing" className="b-sec" style={{ background: C.soft }}>
        <div className="b-wrap">
          <h2 className="b-h b-h2" style={{ textAlign: "center", marginBottom: 12 }}>Plans for every side of the deal</h2>
          <p style={{ textAlign: "center", color: C.mute, marginBottom: 44 }}>Pricing placeholder: set real tiers before launch.</p>
          <div className="b-tiers" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {tiers.map(t => (
              <div key={t.name} style={{ background: t.featured ? C.ink : "#fff", color: t.featured ? "#cbd5e1" : C.text, borderRadius: 22, padding: 30, border: `1px solid ${t.featured ? C.ink : C.line}` }}>
                <div style={{ fontWeight: 800, fontSize: 20, color: t.featured ? "#fff" : C.ink }}>{t.name}</div>
                <div style={{ fontSize: 14, marginTop: 4, marginBottom: 20 }}>{t.for}</div>
                <div style={{ fontSize: 40, fontWeight: 800, color: t.featured ? "#fff" : C.ink, marginBottom: 22 }}>{t.name === "Enterprise" ? "Custom" : <>$—<span style={{ fontSize: 15, fontWeight: 500 }}>/mo</span></>}</div>
                {t.items.map(it => <div key={it} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14, marginBottom: 10 }}><Icon name="check" size={14} color={t.featured ? "#60a5fa" : C.green} width={3} />{it}</div>)}
                <a href="#demo" className="b-btn" style={{ marginTop: 18, width: "100%", justifyContent: "center", background: t.featured ? "#fff" : C.blueSoft, color: t.featured ? C.ink : C.blue }}>{t.name === "Vendor" ? "Get the app" : "Talk to sales"}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="b-sec">
        <div className="b-wrap">
          <h2 className="b-h b-h2" style={{ textAlign: "center", marginBottom: 48 }}>Questions, answered</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
            {faqs.map(f => <div key={f.q}><div style={{ fontWeight: 800, color: C.ink, fontSize: 17, marginBottom: 8 }}>{f.q}</div><p style={{ color: C.mute, lineHeight: 1.7 }}>{f.a}</p></div>)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="demo" style={{ padding: "0 0 100px" }}>
        <div className="b-wrap">
          <div style={{ background: C.blue, borderRadius: 28, padding: "64px 32px", textAlign: "center", color: "#fff" }}>
            <h2 style={{ fontSize: "clamp(30px, 4vw, 48px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 14 }}>See every vehicle, live.</h2>
            <p style={{ fontSize: 18, opacity: 0.85, marginBottom: 30 }}>A 15-minute demo built around your store or your vendor business.</p>
            {/* Skeleton form: not wired up yet */}
            <form onSubmit={e => e.preventDefault()} style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", maxWidth: 560, margin: "0 auto" }}>
              <input placeholder="Your work email" style={{ flex: "1 1 260px", padding: "14px 20px", borderRadius: 999, border: "none", font: "15px 'Plus Jakarta Sans', sans-serif", outline: "none" }} />
              <button className="b-btn b-btn-p">Get a demo</button>
            </form>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${C.line}`, padding: "48px 0 100px" }}>
        <div className="b-wrap" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 28, fontSize: 14, color: C.mute }}>
          <div><img src="/autosync360logo.png" alt="AutoSync 360" style={{ height: 48, marginBottom: 10 }} /><div>{brand.tagline}</div></div>
          <div><b style={{ color: C.ink }}>Platform</b>{["Live tracking", "Recon workflow", "AutoSync AI", "Invoicing & payroll", "Integrations"].map(l => <div key={l} style={{ marginTop: 10 }}>{l}</div>)}</div>
          <div><b style={{ color: C.ink }}>Who it's for</b>{["Dealerships", "Dealer groups", ...vendorTypes.map(v => v.name)].map(l => <div key={l} style={{ marginTop: 10 }}>{l}</div>)}</div>
          <div><b style={{ color: C.ink }}>Contact</b><div style={{ marginTop: 10 }}>{brand.phone}</div><div style={{ marginTop: 10 }}>{brand.email}</div><div style={{ marginTop: 10 }}>Orlando, FL</div></div>
        </div>
      </footer>
    </div>
  );
}
