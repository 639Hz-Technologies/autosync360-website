// Industry landing page template: /industries/<slug>. Content lives in industries.js.
import { useEffect } from "react";
import Icon from "./icons.jsx";
import IntegrationLogos from "./IntegrationLogos.jsx";
import { C, Shell, HOME, industryHref } from "./layoutA.jsx";
import { industries, industryBySlug } from "./industries.js";

function setMeta(title, desc) {
  document.title = title;
  let m = document.querySelector('meta[name="description"]');
  if (!m) { m = document.createElement("meta"); m.name = "description"; document.head.appendChild(m); }
  m.content = desc;
}

export default function IndustryPage({ slug }) {
  const ind = industryBySlug[slug];
  useEffect(() => { if (ind) setMeta(ind.seoTitle, ind.metaDesc); window.scrollTo(0, 0); }, [ind]);

  if (!ind) {
    return (
      <Shell base={HOME}>
        <section className="a-sec" style={{ borderTop: "none", textAlign: "center" }}>
          <div className="a-wrap">
            <h1 className="a-h a-h2" style={{ marginBottom: 16 }}>We couldn't find that page.</h1>
            <a className="a-btn a-btn-p" href={`${HOME}#industries`}>See all industries</a>
          </div>
        </section>
      </Shell>
    );
  }

  const tone = { accent: C.accent, accent2: C.accent2, good: C.good, warn: C.warn, violet: C.violet };
  const others = industries.filter(i => i.slug !== slug);

  return (
    <Shell base={HOME}>
      {/* HERO */}
      <section style={{ padding: "80px 0 96px", background: `radial-gradient(800px 400px at 75% 10%, rgba(59,130,246,0.16), transparent), radial-gradient(600px 300px at 10% 80%, rgba(167,139,250,0.08), transparent)` }}>
        <div className="a-wrap a-split" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
          <div>
            <nav aria-label="Breadcrumb" style={{ fontSize: 13, color: C.mute, marginBottom: 18 }}>
              <a href={HOME} style={{ color: C.mute, textDecoration: "none" }}>Home</a> / <a href={`${HOME}#industries`} style={{ color: C.mute, textDecoration: "none" }}>Industries</a> / <span style={{ color: C.text }}>{ind.name}</span>
            </nav>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, border: `1px solid ${C.line}`, background: "#fff", fontSize: 12, fontWeight: 600, color: C.accent2, marginBottom: 20 }}>
              <Icon name={ind.icon} size={14} color={C.accent2} />AutoSync 360 for {ind.name}
            </div>
            <h1 className="a-h" style={{ fontSize: "clamp(34px, 4.5vw, 54px)", lineHeight: 1.06, marginBottom: 20 }}>{ind.h1}</h1>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: C.mute, marginBottom: 30, maxWidth: 540 }}>{ind.sub}</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a className="a-btn a-btn-p" href={`${HOME}#demo`}>Book a demo <Icon name="arrow" size={16} /></a>
              <a className="a-btn a-btn-g" href="#features">See features</a>
            </div>
          </div>

          {/* Sample board for this industry */}
          <div className="a-card" style={{ overflow: "hidden", boxShadow: "0 40px 120px rgba(59,130,246,0.18)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", borderBottom: `1px solid ${C.line}` }}>
              {["#ef4444", "#f59e0b", "#22c55e"].map(c => <span key={c} style={{ width: 9, height: 9, borderRadius: 9, background: c, opacity: 0.7 }} />)}
              <span style={{ marginLeft: 12, fontSize: 11, color: C.mute }}>app.autosync360.com / today</span>
              <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: C.accent2 }}><span className="a-blink" style={{ width: 7, height: 7, borderRadius: 7, background: "#22c55e" }} />LIVE</span>
            </div>
            <div style={{ padding: 18, display: "grid", gap: 10 }}>
              <div style={{ fontSize: 11, color: C.mute, textTransform: "uppercase", letterSpacing: 0.8 }}>Today's board</div>
              {ind.board.map(([what, st, t]) => (
                <div key={what} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: C.bg2, border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px" }}>
                  <b style={{ fontSize: 14, color: C.ink, fontWeight: 600 }}>{what}</b>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: tone[t], whiteSpace: "nowrap" }}><span style={{ width: 6, height: 6, borderRadius: 6, background: tone[t] }} />{st}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PAINS */}
      <section className="a-sec" style={{ background: C.bg2 }}>
        <div className="a-wrap">
          <div className="a-eyebrow">Sound familiar?</div>
          <h2 className="a-h a-h2" style={{ margin: "12px 0 36px", maxWidth: 720 }}>What AutoSync fixes for {ind.name.toLowerCase()}.</h2>
          <div className="a-grid3">
            {ind.pains.map(p => (
              <div key={p} className="a-card" style={{ padding: 22, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 8, display: "grid", placeItems: "center", background: "rgba(217,119,6,0.1)" }}><Icon name="alert" size={16} color={C.warn} /></span>
                <p style={{ fontSize: 15, lineHeight: 1.5, color: C.text, fontWeight: 500 }}>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="a-sec">
        <div className="a-wrap">
          <div className="a-eyebrow">Features</div>
          <h2 className="a-h a-h2" style={{ margin: "12px 0 36px", maxWidth: 720 }}>Everything your {ind.name.toLowerCase()} business needs, in one app.</h2>
          <div className="a-grid3">
            {ind.features.map(f => (
              <div key={f.title} className="a-card" style={{ padding: 24 }}>
                <span style={{ width: 40, height: 40, borderRadius: 10, display: "grid", placeItems: "center", background: "rgba(8,145,178,0.1)" }}><Icon name={f.icon} size={20} color={C.accent2} /></span>
                <h3 style={{ fontSize: 17, color: C.ink, margin: "16px 0 6px" }}>{f.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: C.mute }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="a-sec" style={{ background: C.bg2 }}>
        <div className="a-wrap">
          <div className="a-eyebrow">How it works</div>
          <h2 className="a-h a-h2" style={{ margin: "12px 0 36px" }}>Up and running in four steps.</h2>
          <div className="a-grid4">
            {ind.steps.map((s, i) => (
              <div key={s} className="a-card" style={{ padding: 22 }}>
                <span style={{ width: 32, height: 32, borderRadius: 32, display: "grid", placeItems: "center", background: C.ink, color: "#fff", fontWeight: 700, fontSize: 14 }}>{i + 1}</span>
                <p style={{ fontSize: 15, lineHeight: 1.5, color: C.text, fontWeight: 500, marginTop: 14 }}>{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section className="a-sec">
        <div className="a-wrap">
          <div className="a-eyebrow">Integrations</div>
          <h2 className="a-h a-h2" style={{ margin: "12px 0 36px" }}>Works with the tools you already use.</h2>
          <IntegrationLogos C={C} />
        </div>
      </section>

      {/* FAQ */}
      <section className="a-sec" style={{ background: C.bg2 }}>
        <div className="a-wrap" style={{ maxWidth: 820 }}>
          <div className="a-eyebrow">FAQ</div>
          <h2 className="a-h a-h2" style={{ margin: "12px 0 28px" }}>Questions from {ind.name.toLowerCase()}.</h2>
          {ind.faqs.map(f => (
            <div key={f.q} style={{ borderBottom: `1px solid ${C.line}`, padding: "18px 0" }}>
              <h3 style={{ fontSize: 16, color: C.ink, marginBottom: 6 }}>{f.q}</h3>
              <p style={{ color: C.mute, lineHeight: 1.7 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="a-sec" style={{ background: `radial-gradient(700px 300px at 50% 0%, rgba(59,130,246,0.18), transparent)`, textAlign: "center" }}>
        <div className="a-wrap">
          <h2 className="a-h" style={{ fontSize: "clamp(28px, 4vw, 44px)", marginBottom: 14 }}>See AutoSync for {ind.name.toLowerCase()} in 20 minutes.</h2>
          <p style={{ color: C.mute, fontSize: 16, marginBottom: 28 }}>We'll set it up around your shop, your jobs and your team.</p>
          <a className="a-btn a-btn-p" href={`${HOME}#demo`}>Book a demo <Icon name="arrow" size={16} /></a>
        </div>
      </section>

      {/* OTHER INDUSTRIES (internal links help SEO) */}
      <section className="a-sec">
        <div className="a-wrap">
          <div className="a-eyebrow" style={{ marginBottom: 18 }}>Also built for</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {others.map(o => (
              <a key={o.slug} href={industryHref(o.slug)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.line}`, color: C.text, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
                <Icon name={o.icon} size={16} color={C.accent2} />{o.name}
              </a>
            ))}
          </div>
        </div>
      </section>
    </Shell>
  );
}
