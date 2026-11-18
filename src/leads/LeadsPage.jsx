// autosync360.com/leads: password-protected field tool.
// Walk a dealer's lot → snap photos/video → enter the GM's email → Send.
// Send saves the lead and emails the GM from your Gmail; leads-followups sends days 3/7/14 until they reply.
import { useEffect, useRef, useState } from "react";
import { ISSUES } from "./issues.js";

const TOKEN_KEY = "as360_leads_token";
const DRAFT_KEY = "as360_leads_draft";
const C = { bg: "#f6f8fc", card: "#fff", line: "rgba(15,23,42,0.10)", ink: "#0b1220", text: "#1e293b", mute: "#64748b", accent: "#2563eb", good: "#059669", warn: "#d97706", bad: "#dc2626" };

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* private mode */ } },
};

class AuthError extends Error {}

async function api(path, { token, body, method } = {}) {
  const res = await fetch(`/api/leads/${path}`, {
    method: method || (body ? "POST" : "GET"),
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({ error: `Server error (${res.status})` }));
  if (res.status === 401 && path !== "login") throw new AuthError(data.error);
  if (!res.ok) throw Object.assign(new Error(data.error || "Something went wrong"), { status: res.status, data });
  return data;
}

// Shrink phone photos (often 4–8 MB) to ~300 KB so uploads are quick on cell service.
async function compressImage(file, maxEdge = 1600) {
  try {
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * s);
    canvas.height = Math.round(bmp.height * s);
    canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(r => canvas.toBlob(r, "image/jpeg", 0.8));
    return blob || file;
  } catch {
    return file; // browser can't decode it (e.g. HEIC on desktop Chrome): upload the original
  }
}

function guessType(file) {
  if (file.type) return file.type;
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  return { mov: "video/quicktime", mp4: "video/mp4", m4v: "video/x-m4v", webm: "video/webm", heic: "image/heic", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" }[ext] || "";
}

function putWithProgress(url, blob, type, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", type);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = e => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status}) ${xhr.responseText.slice(0, 120)}`)));
    xhr.onerror = () => reject(new Error("Upload failed: check your connection"));
    xhr.send(blob);
  });
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{margin:0;background:${C.bg}}
.ld{min-height:100vh;background:${C.bg};font:15px/1.5 Inter,system-ui,sans-serif;color:${C.text};padding-bottom:110px}
.ld-top{position:sticky;top:0;z-index:5;background:#fff;border-bottom:1px solid ${C.line}}
.ld-top-in{max-width:640px;margin:0 auto;padding:10px 16px;display:flex;align-items:center;gap:12px}
.ld-top img{height:22px;width:auto;mix-blend-mode:multiply;display:block}
.ld-tabs{margin-left:auto;display:flex;background:${C.bg};border:1px solid ${C.line};border-radius:10px;padding:3px}
.ld-tabs button{border:0;background:transparent;font:600 13px Inter,sans-serif;color:${C.mute};padding:7px 12px;border-radius:8px;cursor:pointer}
.ld-tabs button.on{background:${C.ink};color:#fff}
.ld-main{max-width:640px;margin:0 auto;padding:16px}
.ld-h{font:700 24px/1.2 'Space Grotesk',sans-serif;color:${C.ink};letter-spacing:-.02em}
.ld-card{background:#fff;border:1px solid ${C.line};border-radius:14px;padding:16px;margin-top:14px}
.ld-step{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#0891b2;margin-bottom:10px}
.ld-label{display:block;font-size:13px;font-weight:600;color:${C.ink};margin:12px 0 6px}
.ld-label:first-of-type{margin-top:0}
.ld-input{width:100%;padding:13px 14px;border-radius:10px;border:1px solid ${C.line};background:${C.bg};color:${C.text};font:16px Inter,sans-serif;outline:none}
.ld-input:focus{border-color:${C.accent};background:#fff}
.ld-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ld-capture{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ld-capture label{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:18px 8px;border-radius:12px;border:1.5px dashed rgba(37,99,235,.45);background:rgba(37,99,235,.05);color:${C.accent};font-weight:600;cursor:pointer;text-align:center}
.ld-capture input{display:none}
.ld-thumbs{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}
.ld-thumb{position:relative;aspect-ratio:1;border-radius:10px;overflow:hidden;background:#e2e8f0}
.ld-thumb img,.ld-thumb video{width:100%;height:100%;object-fit:cover;display:block}
.ld-thumb .x{position:absolute;top:4px;right:4px;width:24px;height:24px;border-radius:50%;border:0;background:rgba(11,18,32,.75);color:#fff;font-size:14px;line-height:24px;cursor:pointer}
.ld-thumb .bar{position:absolute;left:0;bottom:0;height:4px;background:${C.accent};transition:width .2s}
.ld-thumb .tag{position:absolute;left:4px;bottom:6px;font-size:10px;font-weight:700;color:#fff;background:rgba(11,18,32,.75);padding:1px 6px;border-radius:6px}
.ld-thumb.err{outline:2px solid ${C.bad}}
.ld-chips{display:flex;flex-wrap:wrap;gap:8px}
.ld-chip{border:1px solid ${C.line};background:#fff;border-radius:999px;padding:9px 13px;font:500 14px Inter,sans-serif;color:${C.text};cursor:pointer}
.ld-chip.on{background:${C.ink};border-color:${C.ink};color:#fff}
.ld-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:15px 18px;border-radius:12px;border:0;font:700 16px Inter,sans-serif;cursor:pointer;background:${C.accent};color:#fff;box-shadow:0 8px 24px rgba(37,99,235,.3)}
.ld-btn:disabled{opacity:.5;cursor:default;box-shadow:none}
.ld-btn.g{background:#fff;color:${C.text};border:1px solid ${C.line};box-shadow:none}
.ld-btn.sm{width:auto;padding:8px 12px;font-size:13px;border-radius:9px;box-shadow:none}
.ld-bottom{position:fixed;left:0;right:0;bottom:0;background:rgba(255,255,255,.96);backdrop-filter:blur(8px);border-top:1px solid ${C.line};padding:12px 16px calc(12px + env(safe-area-inset-bottom))}
.ld-bottom-in{max-width:640px;margin:0 auto}
.ld-hint{font-size:13px;color:${C.mute};margin-top:8px}
.ld-err{background:#fef2f2;border:1px solid #fecaca;color:#991b1b;border-radius:10px;padding:10px 12px;font-size:14px;margin-top:12px}
.ld-ac{position:relative}
.ld-ac-list{position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:10;background:#fff;border:1px solid ${C.line};border-radius:12px;box-shadow:0 12px 32px rgba(15,23,42,.14);overflow:hidden}
.ld-ac-list button{display:block;width:100%;text-align:left;border:0;background:#fff;padding:12px 14px;font:15px Inter,sans-serif;color:${C.text};cursor:pointer;border-bottom:1px solid ${C.line}}
.ld-ac-list button:hover,.ld-ac-list button:focus{background:${C.bg};outline:none}
.ld-ac-list small{display:block;color:${C.mute};font-size:13px;margin-top:1px}
.ld-ac-foot{padding:6px 14px;font-size:11px;color:${C.mute};text-align:right}
.ld-found{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center;font-size:13px;color:${C.good};margin-top:8px}
.ld-found a{color:${C.accent};text-decoration:none;font-weight:600}
.ld-domain{margin-top:8px;border:1px dashed rgba(37,99,235,.45);background:rgba(37,99,235,.05);color:${C.accent};border-radius:999px;padding:6px 12px;font:600 13px Inter,sans-serif;cursor:pointer}
.ld-ok{text-align:center;padding:40px 8px}
.ld-ok .big{width:64px;height:64px;border-radius:50%;background:rgba(5,150,105,.12);color:${C.good};font-size:32px;line-height:64px;margin:0 auto 14px}
.ld-sheet-bg{position:fixed;inset:0;background:rgba(11,18,32,.45);z-index:20;display:flex;align-items:flex-end;justify-content:center}
.ld-sheet{background:#fff;width:100%;max-width:640px;border-radius:18px 18px 0 0;padding:20px 16px calc(20px + env(safe-area-inset-bottom))}
.ld-sheet ol{margin:12px 0 16px 20px;color:${C.text}}
.ld-sheet li{margin:4px 0}
.ld-sheet.tall{max-height:92vh;display:flex;flex-direction:column}
.ld-preview{flex:1;min-height:50vh;width:100%;border:1px solid ${C.line};border-radius:12px;margin:10px 0 12px;background:#fff}
.ld-subj{font-size:14px;color:${C.mute};margin-top:4px}
.ld-lead{display:flex;gap:12px;align-items:flex-start}
.ld-lead + .ld-lead{border-top:1px solid ${C.line};padding-top:14px;margin-top:14px}
.ld-pill{display:inline-block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:3px 8px;border-radius:999px}
.ld-login{max-width:380px;margin:12vh auto 0;padding:0 16px}
.ld-login img{height:28px;width:auto;mix-blend-mode:multiply;display:block;margin-bottom:26px}
a.ld-link{color:${C.accent};font-weight:600;text-decoration:none}
`;

const PILL = {
  active: [`rgba(37,99,235,.1)`, C.accent, "In campaign"],
  replied: [`rgba(5,150,105,.12)`, C.good, "Replied"],
  stopped: [`rgba(100,116,139,.12)`, C.mute, "Stopped"],
  unsubscribed: [`rgba(100,116,139,.12)`, C.mute, "Unsubscribed"],
  failed: [`rgba(220,38,38,.1)`, C.bad, "Failed"],
  done: [`rgba(100,116,139,.12)`, C.mute, "Done"],
};

export default function LeadsPage() {
  const [token, setToken] = useState(() => store.get(TOKEN_KEY));
  const [tab, setTab] = useState("new");

  useEffect(() => {
    document.title = "Leads | AutoSync 360";
    const m = document.createElement("meta");
    m.name = "robots"; m.content = "noindex,nofollow";
    document.head.appendChild(m);
    return () => m.remove();
  }, []);

  const logout = () => { store.set(TOKEN_KEY, null); setToken(null); };
  const login = t => { store.set(TOKEN_KEY, t); setToken(t); };

  return (
    <div className="ld">
      <style>{css}</style>
      {!token ? <Login onLogin={login} /> : (
        <>
          <div className="ld-top"><div className="ld-top-in">
            <img src="/autosync360-wordmark.png" alt="AutoSync 360" />
            <div className="ld-tabs">
              <button className={tab === "new" ? "on" : ""} onClick={() => setTab("new")}>New lead</button>
              <button className={tab === "list" ? "on" : ""} onClick={() => setTab("list")}>Campaign</button>
            </div>
          </div></div>
          <div className="ld-main">
            {tab === "new" ? <NewLead token={token} onAuthFail={logout} /> : <Campaign token={token} onAuthFail={logout} />}
            <p className="ld-hint" style={{ textAlign: "center", marginTop: 28 }}><a className="ld-link" href="#" onClick={e => { e.preventDefault(); logout(); }}>Log out</a></p>
          </div>
        </>
      )}
    </div>
  );
}

function Login({ onLogin }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async e => {
    e.preventDefault();
    setBusy(true); setErr("");
    try { onLogin((await api("login", { body: { password: pw } })).token); }
    catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <form className="ld-login" onSubmit={submit}>
      <img src="/autosync360-wordmark.png" alt="AutoSync 360" />
      <h1 className="ld-h">Field leads</h1>
      <p className="ld-hint" style={{ marginBottom: 18 }}>Team login</p>
      <input className="ld-input" type="password" autoComplete="current-password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} autoFocus />
      {err && <div className="ld-err">{err}</div>}
      <button className="ld-btn" style={{ marginTop: 14 }} disabled={!pw || busy}>{busy ? "Checking…" : "Log in"}</button>
    </form>
  );
}

const emptyForm = { dealership: "", address: "", placeId: "", website: "", phone: "", contactName: "", contactTitle: "General Manager", email: "", issues: [], notes: "" };

function loadDraft() {
  try { return JSON.parse(store.get(DRAFT_KEY)) || null; } catch { return null; }
}

const domainOf = url => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } };

// Dealership name box: suggests car dealers from Google near where you're standing; picking one fills in the address.
function DealerSearch({ token, onAuthFail, value, onType, onPick }) {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const session = useRef(crypto.randomUUID());
  const coords = useRef(null);
  const asked = useRef(false);
  const off = useRef(false); // server has no Google key: behave like a plain text box
  const timer = useRef();
  const seq = useRef(0);

  const locate = () => {
    if (asked.current || !navigator.geolocation) return;
    asked.current = true;
    navigator.geolocation.getCurrentPosition(p => { coords.current = { lat: p.coords.latitude, lng: p.coords.longitude }; }, () => {}, { timeout: 8000, maximumAge: 600000 });
  };

  const search = q => {
    clearTimeout(timer.current);
    if (off.current || q.trim().length < 2) { setList([]); return; }
    timer.current = setTimeout(async () => {
      const n = ++seq.current;
      try {
        const r = await api("places", { token, body: { input: q, sessionToken: session.current, ...(coords.current || {}) } });
        if (r.disabled) off.current = true;
        if (n === seq.current) { setList(r.suggestions || []); setOpen(true); }
      } catch (x) {
        if (x instanceof AuthError) onAuthFail();
      }
    }, 250);
  };

  const pick = async s => {
    setOpen(false); setList([]);
    onPick({ name: s.name, address: s.secondary, placeId: s.placeId, website: "", phone: "" });
    try {
      onPick(await api("place", { token, body: { placeId: s.placeId, sessionToken: session.current } }));
    } catch (x) {
      if (x instanceof AuthError) onAuthFail();
    }
    session.current = crypto.randomUUID(); // Google bills a search + pick as one session
  };

  return (
    <div className="ld-ac">
      <input id="dl" className="ld-input" value={value} placeholder="Start typing: Sunshine Ford…" autoComplete="off"
        onFocus={() => { locate(); list.length && setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={e => { onType(e.target.value); search(e.target.value); }} />
      {open && list.length > 0 && (
        <div className="ld-ac-list">
          {list.map(s => (
            <button key={s.placeId} type="button" onMouseDown={e => e.preventDefault()} onClick={() => pick(s)}>
              <b>{s.name}</b><small>{s.secondary}</small>
            </button>
          ))}
          <div className="ld-ac-foot">Results from Google</div>
        </div>
      )}
    </div>
  );
}

function NewLead({ token, onAuthFail }) {
  const draft = useRef(loadDraft()).current;
  const [f, setF] = useState(draft?.form || emptyForm);
  // media item: { key, kind: "image"|"video", preview, status: "uploading"|"done"|"error", progress, path, error }
  const [media, setMedia] = useState(draft?.media || []);
  const [confirming, setConfirming] = useState(false);
  const [preview, setPreview] = useState(null); // {subject, html, from} | "loading"
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [dup, setDup] = useState(null);
  const [sent, setSent] = useState(null);

  // Keep a draft so a reload or a dropped signal on the lot doesn't lose the work.
  useEffect(() => {
    const done = media.filter(m => m.status === "done").map(({ key, kind, path, url }) => ({ key, kind, path, url, preview: url, status: "done", progress: 1 }));
    store.set(DRAFT_KEY, JSON.stringify({ form: f, media: done }));
  }, [f, media]);

  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const toggleIssue = k => setF(p => ({ ...p, issues: p.issues.includes(k) ? p.issues.filter(x => x !== k) : [...p.issues, k] }));
  const patch = (key, p) => setMedia(list => list.map(m => (m.key === key ? { ...m, ...p } : m)));

  const addFiles = async (fileList, kind) => {
    const files = [...fileList];
    const items = files.map(file => ({ key: crypto.randomUUID(), kind, file, preview: URL.createObjectURL(file), status: "uploading", progress: 0 }));
    setMedia(list => [...list, ...items]);
    for (const it of items) {
      try {
        const blob = kind === "image" ? await compressImage(it.file) : it.file;
        const type = blob === it.file ? guessType(it.file) : "image/jpeg";
        const { path, uploadUrl, url } = await api("upload", { token, body: { type } });
        await putWithProgress(uploadUrl, blob, type, p => patch(it.key, { progress: p }));
        patch(it.key, { status: "done", progress: 1, path, url, file: undefined });
      } catch (x) {
        if (x instanceof AuthError) return onAuthFail();
        patch(it.key, { status: "error", error: x.message });
        setErr(x.message);
      }
    }
  };

  const remove = key => setMedia(list => list.filter(m => m.key !== key));
  const uploading = media.some(m => m.status === "uploading");
  const ready = media.filter(m => m.status === "done");
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim());
  const canSend = f.dealership.trim() && emailOk && ready.length && !uploading;

  const send = async force => {
    setSending(true); setErr(""); setDup(null);
    try {
      const r = await api("send", { token, body: { ...f, media: ready.map(m => ({ path: m.path, type: m.kind })), force } });
      setSent({ ...r, email: f.email, dealership: f.dealership });
      store.set(DRAFT_KEY, null);
    } catch (x) {
      if (x instanceof AuthError) return onAuthFail();
      if (x.status === 409) setDup(x.message); else setErr(x.message);
    } finally {
      setSending(false); setConfirming(false);
    }
  };

  const reset = () => { setF(emptyForm); setMedia([]); setSent(null); setErr(""); setDup(null); window.scrollTo(0, 0); };

  if (sent) return (
    <div className="ld-card ld-ok">
      <div className="big">✓</div>
      <h2 className="ld-h">Sent to {sent.email}</h2>
      <p className="ld-hint" style={{ fontSize: 15 }}>{sent.dealership} is in the campaign. Follow-ups go out on days 3, 7 and 14, and stop automatically as soon as they reply.</p>
      <p style={{ margin: "16px 0 22px" }}><a className="ld-link" href={sent.report_url} target="_blank" rel="noopener">View their lot page →</a></p>
      <button className="ld-btn" onClick={reset}>Next dealership</button>
    </div>
  );

  return (
    <>
      <h1 className="ld-h">New lot visit</h1>

      <div className="ld-card">
        <div className="ld-step">1 · Dealership</div>
        <label className="ld-label" htmlFor="dl">Dealership name</label>
        <DealerSearch token={token} onAuthFail={onAuthFail} value={f.dealership}
          onType={v => setF(p => ({ ...p, dealership: v, placeId: "", website: "", phone: "" }))}
          onPick={d => setF(p => ({ ...p, dealership: d.name, address: d.address || p.address, placeId: d.placeId, website: d.website, phone: d.phone }))} />
        <label className="ld-label" htmlFor="ad">Address</label>
        <input id="ad" className="ld-input" value={f.address} onChange={set("address")} placeholder="Pick the dealership above to fill this in" autoComplete="street-address" />
        {f.placeId && (
          <div className="ld-found">
            <span>✓ Matched on Google</span>
            {f.website && <a href={f.website} target="_blank" rel="noopener">{domainOf(f.website)}</a>}
            {f.phone && <a href={`tel:${f.phone.replace(/[^\d+]/g, "")}`}>{f.phone}</a>}
          </div>
        )}
      </div>

      <div className="ld-card">
        <div className="ld-step">2 · Photos & video</div>
        <div className="ld-capture">
          <label>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
            Add photos
            <input type="file" accept="image/*" multiple onChange={e => { addFiles(e.target.files, "image"); e.target.value = ""; }} />
          </label>
          <label>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>
            Add video
            <input type="file" accept="video/*" onChange={e => { addFiles(e.target.files, "video"); e.target.value = ""; }} />
          </label>
        </div>
        {media.length > 0 && (
          <div className="ld-thumbs">
            {media.map(m => (
              <div key={m.key} className={`ld-thumb${m.status === "error" ? " err" : ""}`}>
                {m.kind === "video" ? <video src={m.preview} muted playsInline preload="metadata" /> : <img src={m.preview} alt="" />}
                {m.kind === "video" && <span className="tag">VIDEO</span>}
                {m.status === "uploading" && <div className="bar" style={{ width: `${Math.max(6, m.progress * 100)}%` }} />}
                <button className="x" onClick={() => remove(m.key)} aria-label="Remove">×</button>
              </div>
            ))}
          </div>
        )}
        <p className="ld-hint">{uploading ? "Uploading…" : ready.length ? `${ready.length} uploaded. The first 4 photos go in the email; everything shows on their lot page.` : "Dirty wheels, dusty hoods, water spots: get close."}</p>

        <label className="ld-label" style={{ marginTop: 16 }}>What did you see?</label>
        <div className="ld-chips">
          {Object.entries(ISSUES).map(([k, v]) => (
            <button key={k} type="button" className={`ld-chip${f.issues.includes(k) ? " on" : ""}`} onClick={() => toggleIssue(k)}>{v.label}</button>
          ))}
        </div>
      </div>

      <div className="ld-card">
        <div className="ld-step">3 · Who gets the email</div>
        <div className="ld-row">
          <div>
            <label className="ld-label" htmlFor="cn">Name</label>
            <input id="cn" className="ld-input" value={f.contactName} onChange={set("contactName")} placeholder="Mike Torres" autoComplete="off" />
          </div>
          <div>
            <label className="ld-label" htmlFor="ct">Title</label>
            <input id="ct" className="ld-input" value={f.contactTitle} onChange={set("contactTitle")} autoComplete="off" />
          </div>
        </div>
        <label className="ld-label" htmlFor="em">Email</label>
        <input id="em" className="ld-input" type="email" inputMode="email" autoCapitalize="none" value={f.email} onChange={set("email")} placeholder={f.website ? `gm@${domainOf(f.website)}` : "gm@dealership.com"} autoComplete="off" />
        {f.website && !f.email.includes("@") && (
          <button type="button" className="ld-domain" onClick={() => setF(p => ({ ...p, email: `${p.email.trim()}@${domainOf(p.website)}` }))}>
            {f.email.trim() ? `${f.email.trim()}@${domainOf(f.website)}` : `Add @${domainOf(f.website)}`}
          </button>
        )}
        <label className="ld-label" htmlFor="nt">Notes (internal, not emailed)</label>
        <textarea id="nt" className="ld-input" rows={3} value={f.notes} onChange={set("notes")} placeholder="Spoke to the porter, GM is in Tues–Sat…" />
      </div>

      {err && <div className="ld-err">{err}</div>}
      {dup && (
        <div className="ld-err">
          {dup}
          <div style={{ marginTop: 10 }}><button className="ld-btn sm" onClick={() => send(true)} disabled={sending}>Send anyway</button></div>
        </div>
      )}

      <div className="ld-bottom"><div className="ld-bottom-in">
        <button className="ld-btn" disabled={!canSend || sending} onClick={() => setConfirming(true)}>
          {uploading ? "Uploading…" : sending ? "Sending…" : "Send & start campaign"}
        </button>
      </div></div>

      {confirming && (
        <div className="ld-sheet-bg" onClick={() => setConfirming(false)}>
          <div className="ld-sheet" onClick={e => e.stopPropagation()}>
            <h2 className="ld-h" style={{ fontSize: 20 }}>Send to {f.email.trim()}?</h2>
            <ol>
              <li><b>Now:</b> email about {f.dealership.trim()} with a link to its lot page ({ready.length} file{ready.length === 1 ? "" : "s"})</li>
              <li><b>Day 3, 7, 14:</b> follow-ups in the same thread. They stop as soon as they reply.</li>
            </ol>
            <button className="ld-btn g" style={{ marginBottom: 10 }} disabled={preview === "loading"} onClick={async () => {
              setPreview("loading");
              try { setPreview(await api("preview", { token, body: { ...f, media: ready.map(m => ({ path: m.path, type: m.kind })) } })); }
              catch (x) { if (x instanceof AuthError) return onAuthFail(); setErr(x.message); setPreview(null); }
            }}>{preview === "loading" ? "Loading…" : "Preview email"}</button>
            <button className="ld-btn" onClick={() => send(false)} disabled={sending}>{sending ? "Sending…" : "Send"}</button>
            <button className="ld-btn g" style={{ marginTop: 10 }} onClick={() => setConfirming(false)}>Back</button>
          </div>
        </div>
      )}

      {preview && preview !== "loading" && (
        <div className="ld-sheet-bg" style={{ zIndex: 30 }} onClick={() => setPreview(null)}>
          <div className="ld-sheet tall" onClick={e => e.stopPropagation()}>
            <h2 className="ld-h" style={{ fontSize: 18 }}>{preview.subject}</h2>
            <div className="ld-subj">From {preview.from} · to {f.email.trim()}</div>
            <iframe className="ld-preview" title="Email preview" sandbox="" srcDoc={preview.html} />
            <button className="ld-btn g" onClick={() => setPreview(null)}>Close preview</button>
          </div>
        </div>
      )}
    </>
  );
}

const shortDate = d => new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

function Campaign({ token, onAuthFail }) {
  const [leads, setLeads] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(null);

  const load = () => api("list", { token }).then(r => setLeads(r.leads)).catch(x => (x instanceof AuthError ? onAuthFail() : setErr(x.message)));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setStatus = async (id, status) => {
    setBusy(id); setErr("");
    try {
      await api("status", { token, body: { id, status } });
      setLeads(ls => ls.map(l => (l.id === id ? { ...l, status, next_send_at: null } : l)));
    } catch (x) {
      if (x instanceof AuthError) return onAuthFail();
      setErr(x.message);
    } finally { setBusy(null); }
  };

  return (
    <>
      <h1 className="ld-h">Campaign</h1>
      {err && <div className="ld-err">{err}</div>}
      <div className="ld-card">
        {!leads ? <p className="ld-hint">Loading…</p> : !leads.length ? <p className="ld-hint">No leads yet. Your first lot visit will show up here.</p> : leads.map(l => {
          const [bg, fg, label] = PILL[l.status] || PILL.done;
          const days = Math.floor((Date.now() - new Date(l.created_at)) / 864e5);
          return (
            <div key={l.id} className="ld-lead">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: C.ink }}>{l.dealership}</div>
                <div className="ld-hint" style={{ marginTop: 2, overflow: "hidden", textOverflow: "ellipsis" }}>{l.contact_name ? `${l.contact_name} · ` : ""}{l.contact_email}</div>
                <div className="ld-hint" style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span className="ld-pill" style={{ background: bg, color: fg }}>{label}</span>
                  <span>{days === 0 ? "today" : `${days}d ago`} · {l.media_count} file{l.media_count === 1 ? "" : "s"}</span>
                  {l.step > 0 && <span>· {l.step} of 4 emails sent{l.status === "active" && l.next_send_at ? ` · next ${shortDate(l.next_send_at)}` : ""}</span>}
                  <a className="ld-link" href={l.report_url} target="_blank" rel="noopener">Lot page</a>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {l.status === "active" && <>
                  <button className="ld-btn sm" disabled={busy === l.id} onClick={() => setStatus(l.id, "replied")}>Replied</button>
                  <button className="ld-btn sm g" disabled={busy === l.id} onClick={() => setStatus(l.id, "stopped")}>Stop</button>
                </>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
