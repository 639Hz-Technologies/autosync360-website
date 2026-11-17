// Shared Design A layout: palette, global styles, header and footer.
// Used by the homepage (DesignA) and every industry page.
import { brand } from "./content.js";
import { industries } from "./industries.js";

export const C = {
  bg: "#ffffff", bg2: "#f6f8fc", card: "#ffffff", line: "rgba(15,23,42,0.09)", ink: "#0b1220",
  text: "#1e293b", mute: "#64748b", accent: "#2563eb", accent2: "#0891b2", good: "#059669", warn: "#d97706", violet: "#7c3aed",
};

// Homepage URL while designs are previewed via ?design=a. Change to "/" when Design A goes live.
export const HOME = "/";
export const industryHref = slug => `/industries/${slug}`;

const css = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0} body{margin:0;background:${C.bg}}
        .a-wrap{max-width:1180px;margin:0 auto;padding:0 24px}
        .a-h{font-family:'Space Grotesk',sans-serif;letter-spacing:-0.02em;color:${C.ink}}
        .a-h2{font-size:clamp(28px,3.5vw,42px);line-height:1.12}
        .a-eyebrow{font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:${C.accent2}}
        .a-btn{display:inline-flex;align-items:center;gap:8px;padding:13px 22px;border-radius:10px;font-weight:600;font-size:14px;text-decoration:none;cursor:pointer;border:none;font-family:inherit}
        .a-btn-p{background:${C.accent};color:#fff;box-shadow:0 8px 24px rgba(59,130,246,.35)} .a-btn-p:hover{background:#2563eb}
        .a-btn-g{background:transparent;color:${C.text};border:1px solid ${C.line}} .a-btn-g:hover{border-color:${C.mute}}
        .a-card{background:${C.card};border:1px solid ${C.line};border-radius:14px;box-shadow:0 1px 2px rgba(15,23,42,.04),0 10px 30px rgba(15,23,42,.05)}
        .a-sec{padding:96px 0;border-top:1px solid ${C.line}}
        .a-nav a{color:${C.mute};text-decoration:none;font-size:14px} .a-nav a:hover{color:${C.ink}}
        .a-grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
        .a-grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
        .a-journey{display:grid;grid-template-columns:repeat(6,1fr);gap:14px;position:relative}
        .a-journey:before{content:"";position:absolute;left:4%;right:4%;top:23px;height:2px;background:linear-gradient(90deg,${C.accent2},${C.accent},${C.good});opacity:.5}
        .a-seg{display:inline-flex;padding:4px;border-radius:12px;border:1px solid ${C.line};background:${C.bg2}}
        .a-seg button{padding:10px 18px;border-radius:9px;border:none;background:transparent;color:${C.mute};font:600 14px Inter,sans-serif;cursor:pointer}
        .a-seg button.on{background:${C.ink};color:#fff}
        .a-input{width:100%;padding:12px 14px;border-radius:10px;border:1px solid ${C.line};background:${C.bg2};color:${C.text};font:14px Inter,sans-serif;outline:none}
        .a-input:focus{border-color:${C.accent}}
        .a-ping{transform-box:fill-box;transform-origin:center;animation:aPing 2s ease-out infinite}
        .a-ping2{animation-delay:1s}
        @keyframes aPing{0%{transform:scale(.8);opacity:.45}100%{transform:scale(2.6);opacity:0}}
        .a-ticker{display:flex;width:max-content;animation:aTick 45s linear infinite}
        .a-ticker:hover{animation-play-state:paused}
        @keyframes aTick{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .a-ticker-mask{-webkit-mask-image:linear-gradient(90deg,transparent,#000 40px,#000 calc(100% - 60px),transparent);mask-image:linear-gradient(90deg,transparent,#000 40px,#000 calc(100% - 60px),transparent)}
        .a-blink{animation:aBlink 1.1s ease-in-out infinite}
        @keyframes aBlink{0%,100%{opacity:1}50%{opacity:.15}}
        @media(prefers-reduced-motion:reduce){.a-ping,.a-blink,.a-ticker{animation:none}}
        @media(max-width:1000px){.a-journey{grid-template-columns:repeat(3,1fr)}.a-journey:before{display:none}}
        @media(max-width:960px){.a-grid4{grid-template-columns:repeat(2,1fr)}.a-grid3{grid-template-columns:repeat(2,1fr)}.a-split{grid-template-columns:1fr!important}.a-nav{display:none!important}.a-float{display:none}}
        @media(max-width:640px){.a-logo{height:20px!important}.a-grid4,.a-grid3,.a-journey{grid-template-columns:1fr}.a-track{grid-template-columns:1fr!important}.a-sec{padding:64px 0}.a-wrap{padding:0 16px}}
      `;

export function Shell({ base = "", children }) {
  const onHome = base === "";
  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", overflowX: "hidden" }}>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.line}` }}>
        <div className="a-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
          {/* multiply blend drops the logo's off-white background on light sections */}
          <a href={onHome ? "#" : base} onClick={onHome ? e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); } : undefined} style={{ display: "flex" }}>
            <img className="a-logo" src="/autosync360-wordmark.png" alt="AutoSync 360" style={{ height: 26, width: "auto", mixBlendMode: "multiply" }} />
          </a>
          <nav className="a-nav" style={{ display: "flex", gap: 28 }}>
            {[["journey", "How it works"], ["ai", "AI"], ["industries", "Industries"], ["platform", "Platform"], ["integrations", "Integrations"], ["enterprise", "Enterprise"]].map(([id, l]) => <a key={id} href={`${base}#${id}`}>{l}</a>)}
          </nav>
          <div style={{ display: "flex", gap: 10 }}>
            <a className="a-btn a-btn-g a-nav" href="#">Log in</a>
            <a className="a-btn a-btn-p" href={`${base}#demo`}>Book a demo</a>
          </div>
        </div>
      </header>

      {children}

      <footer style={{ borderTop: `1px solid ${C.line}`, padding: "48px 0 96px" }}>
        <div className="a-wrap">
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.mute, marginBottom: 14 }}>Industries</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 24px" }}>
              {industries.map(i => <a key={i.slug} href={industryHref(i.slug)} style={{ color: C.text, fontSize: 14, textDecoration: "none" }}>AutoSync for {i.name}</a>)}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20, color: C.mute, fontSize: 13, borderTop: `1px solid ${C.line}`, paddingTop: 24 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <img src="/autosync360-wordmark.png" alt="AutoSync 360" style={{ height: 22, width: "auto", mixBlendMode: "multiply" }} />
              <span>© {new Date().getFullYear()} AutoSync 360 · Orlando, FL</span>
            </span>
            <span style={{ display: "flex", gap: 20, flexWrap: "wrap" }}><a href="#" style={{ color: C.mute }}>Privacy</a><a href="#" style={{ color: C.mute }}>Terms</a><a href={brand.phoneHref} style={{ color: C.mute }}>{brand.phone}</a><a href={`mailto:${brand.email}`} style={{ color: C.mute }}>{brand.email}</a></span>
          </div>
        </div>
      </footer>
    </div>
  );
}

