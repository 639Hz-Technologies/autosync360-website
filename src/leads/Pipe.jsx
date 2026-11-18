// "Pipe" tab on /leads: a simple CRM board. Every lead from a lot visit starts in "New lead";
// drag cards across (or change the stage inside a card on a phone), set the demo date, and keep notes.
// Moving a lead out of "New lead" stops its automatic emails (you're talking to them now).
import { Fragment, useEffect, useMemo, useState } from "react";
import { C, AuthError, api } from "./shared.js";

export const STAGES = [
  { key: "new", label: "New lead", color: "#2563eb" },
  { key: "replied", label: "Replied", color: "#0891b2" },
  { key: "demo_scheduled", label: "Demo scheduled", color: "#7c3aed" },
  { key: "demo_completed", label: "Demo completed", color: "#9333ea" },
  { key: "vendor_setup", label: "Vendor setup ($1 demo)", color: "#d97706" },
  { key: "proposal_sent", label: "Proposal sent", color: "#ea580c" },
  { key: "closed_won", label: "Contract signed", color: "#059669" },
  { key: "lost", label: "Lost", color: "#64748b" },
];
const STAGE = Object.fromEntries(STAGES.map(s => [s.key, s]));

const EMAIL_STATUS = {
  active: "Emails running", replied: "Emails stopped", stopped: "Emails stopped", done: "All 4 emails sent",
  unsubscribed: "Unsubscribed", failed: "Email failed",
};

const css = `
.pp-board{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(250px,1fr);gap:12px;overflow-x:auto;padding:4px 2px 16px;margin-top:14px;scroll-snap-type:x proximity}
.pp-col{background:#eef2f8;border-radius:14px;display:flex;flex-direction:column;min-height:60vh;scroll-snap-align:start;border:2px solid transparent}
.pp-col.over{border-color:${C.accent};background:#e6eefc}
.pp-col-h{display:flex;align-items:center;gap:8px;padding:12px 12px 8px;font:700 13px Inter,sans-serif;color:${C.ink};text-transform:uppercase;letter-spacing:.05em}
.pp-dot{width:9px;height:9px;border-radius:50%;flex:none}
.pp-count{margin-left:auto;background:#fff;border-radius:999px;padding:1px 8px;font-size:12px;color:${C.mute}}
.pp-list{display:flex;flex-direction:column;gap:8px;padding:4px 8px 12px;flex:1}
.pp-card{background:#fff;border:1px solid ${C.line};border-radius:12px;padding:12px;cursor:pointer;box-shadow:0 1px 2px rgba(15,23,42,.04);text-align:left;font:inherit;color:inherit;width:100%}
.pp-card:hover{border-color:rgba(37,99,235,.4)}
.pp-card.dragging{opacity:.4}
.pp-card b{display:block;color:${C.ink};font-size:15px;line-height:1.3}
.pp-sub{font-size:13px;color:${C.mute};margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pp-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.pp-tag{font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px;background:${C.bg};color:${C.mute}}
.pp-tag.demo{background:rgba(124,58,237,.1);color:#7c3aed}
.pp-tag.test{background:rgba(217,119,6,.12);color:${C.warn}}
.pp-empty{font-size:13px;color:#94a3b8;text-align:center;padding:16px 8px}
.pp-drawer-bg{position:fixed;inset:0;background:rgba(11,18,32,.45);z-index:40;display:flex;justify-content:flex-end}
.pp-drawer{background:#fff;width:100%;max-width:520px;height:100%;overflow-y:auto;padding:20px 20px 40px;box-shadow:-12px 0 40px rgba(15,23,42,.2)}
.pp-drawer h2{font:700 24px/1.2 'Space Grotesk',sans-serif;color:${C.ink};letter-spacing:-.02em;margin-right:40px}
.pp-x{position:sticky;top:0;float:right;width:36px;height:36px;border-radius:50%;border:1px solid ${C.line};background:#fff;font-size:20px;line-height:1;cursor:pointer;color:${C.text}}
.pp-sec{margin-top:20px}
.pp-sec h3{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#0891b2;margin-bottom:8px}
.pp-kv{display:grid;grid-template-columns:90px 1fr;gap:6px 10px;font-size:14px}
.pp-kv span:nth-child(odd){color:${C.mute}}
.pp-kv a{color:${C.accent};text-decoration:none;font-weight:600;word-break:break-all}
.pp-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.pp-row .ld-input{flex:1;min-width:180px}
.pp-note{border-left:3px solid ${C.line};padding:4px 0 4px 12px;margin-top:10px}
.pp-note time{display:block;font-size:12px;color:${C.mute}}
.pp-note p{white-space:pre-wrap;font-size:14px}
.pp-tip{color:#94a3b8}
@media(max-width:700px){.pp-board{grid-auto-columns:82vw}.pp-tip{display:none}}
`;

const fmtDate = d => new Date(d).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const toLocalInput = d => { if (!d) return ""; const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };

export default function Pipe({ token, onAuthFail }) {
  const [leads, setLeads] = useState(null);
  const [err, setErr] = useState("");
  const [openId, setOpenId] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [overStage, setOverStage] = useState(null);
  const [hideTests, setHideTests] = useState(false);

  const fail = x => (x instanceof AuthError ? onAuthFail() : setErr(x.message));
  const load = () => api("list", { token }).then(r => setLeads(r.leads)).catch(fail);
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const merge = row => setLeads(ls => ls.map(l => (l.id === row.id ? { ...l, ...row, report_url: l.report_url, media_count: l.media_count } : l)));

  const move = async (id, stage) => {
    const prev = leads.find(l => l.id === id);
    if (!prev || prev.pipeline_stage === stage) return;
    merge({ id, pipeline_stage: stage }); // move it right away, then save
    try { merge((await api("stage", { token, body: { id, stage } })).lead); }
    catch (x) { merge({ id, pipeline_stage: prev.pipeline_stage }); fail(x); }
  };

  const shown = useMemo(() => (leads || []).filter(l => !(hideTests && l.test_mode)), [leads, hideTests]);
  const byStage = useMemo(() => Object.fromEntries(STAGES.map(s => [s.key, shown.filter(l => (l.pipeline_stage || "new") === s.key)])), [shown]);
  const open = leads?.find(l => l.id === openId);
  const won = byStage.closed_won?.length || 0;

  return (
    <>
      <style>{css}</style>
      <div className="ld-toolbar">
        <span>{leads ? `${shown.length} lead${shown.length === 1 ? "" : "s"} · ${won} signed` : "Loading…"}<span className="pp-tip"> · Drag cards between columns, or open a card to move it.</span></span>
        <span className="pp-row">
          <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
            <input type="checkbox" checked={hideTests} onChange={e => setHideTests(e.target.checked)} /> Hide test runs
          </label>
          <button className="ld-btn sm g" onClick={() => { setLeads(null); load(); }}>Refresh</button>
        </span>
      </div>
      {err && <div className="ld-err">{err}</div>}

      <div className="pp-board">
        {STAGES.map(s => (
          <section key={s.key} className={`pp-col${overStage === s.key ? " over" : ""}`}
            onDragOver={e => { e.preventDefault(); setOverStage(s.key); }}
            onDragLeave={() => setOverStage(o => (o === s.key ? null : o))}
            onDrop={e => { e.preventDefault(); setOverStage(null); const id = e.dataTransfer.getData("text/plain") || dragId; if (id) move(id, s.key); }}>
            <div className="pp-col-h"><span className="pp-dot" style={{ background: s.color }} />{s.label}<span className="pp-count">{byStage[s.key]?.length || 0}</span></div>
            <div className="pp-list">
              {(byStage[s.key] || []).map(l => (
                <div key={l.id} role="button" tabIndex={0} className={`pp-card${dragId === l.id ? " dragging" : ""}`} draggable
                  onKeyDown={e => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setOpenId(l.id))}
                  onDragStart={e => { setDragId(l.id); e.dataTransfer.setData("text/plain", l.id); e.dataTransfer.effectAllowed = "move"; }}
                  onDragEnd={() => { setDragId(null); setOverStage(null); }}
                  onClick={() => setOpenId(l.id)}>
                  <b>{l.dealership}</b>
                  <div className="pp-sub">{l.contact_name ? `${l.contact_name} · ` : ""}{l.contact_email}</div>
                  <div className="pp-tags">
                    {l.demo_at && <span className="pp-tag demo">Demo {fmtDate(l.demo_at)}</span>}
                    {(l.notes_log || []).length > 0 && <span className="pp-tag">{l.notes_log.length} note{l.notes_log.length === 1 ? "" : "s"}</span>}
                    <span className="pp-tag">{EMAIL_STATUS[l.status] || l.status}</span>
                    {l.test_mode && <span className="pp-tag test">Test</span>}
                  </div>
                </div>
              ))}
              {leads && !(byStage[s.key] || []).length && <div className="pp-empty">Drop leads here</div>}
            </div>
          </section>
        ))}
      </div>

      {open && <LeadDrawer lead={open} token={token} onClose={() => setOpenId(null)} onMove={move} onSaved={merge} onFail={fail} />}
    </>
  );
}

function LeadDrawer({ lead, token, onClose, onMove, onSaved, onFail }) {
  const [note, setNote] = useState("");
  const [demo, setDemo] = useState(toLocalInput(lead.demo_at));
  const [busy, setBusy] = useState("");

  useEffect(() => {
    const onKey = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = async (what, path, body) => {
    setBusy(what);
    try { onSaved((await api(path, { token, body: { id: lead.id, ...body } })).lead); return true; }
    catch (x) { onFail(x); return false; }
    finally { setBusy(""); }
  };

  const notes = [...(lead.notes_log || [])].reverse();
  const stopsEmails = lead.pipeline_stage === "new" && lead.status === "active";

  return (
    <div className="pp-drawer-bg" onClick={onClose}>
      <aside className="pp-drawer" onClick={e => e.stopPropagation()}>
        <button className="pp-x" onClick={onClose} aria-label="Close">×</button>
        <h2>{lead.dealership}</h2>
        <div className="ld-hint">Added {fmtDate(lead.created_at)}{lead.test_mode ? " · test run" : ""}</div>

        <div className="pp-sec">
          <h3>Stage</h3>
          <select className="ld-input" value={lead.pipeline_stage || "new"} onChange={e => onMove(lead.id, e.target.value)}>
            {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          {stopsEmails && <p className="ld-hint">Moving out of New lead stops the automatic follow-up emails.</p>}
        </div>

        <div className="pp-sec">
          <h3>Demo</h3>
          <div className="pp-row">
            <input className="ld-input" type="datetime-local" value={demo} onChange={e => setDemo(e.target.value)} />
            <button className="ld-btn sm" disabled={!demo || busy === "demo"} onClick={() => save("demo", "demo", { demoAt: new Date(demo).toISOString() })}>{busy === "demo" ? "Saving…" : "Save"}</button>
            {lead.demo_at && <button className="ld-btn sm g" disabled={busy === "demo"} onClick={async () => { if (await save("demo", "demo", { demoAt: null })) setDemo(""); }}>Clear</button>}
          </div>
          {lead.demo_at && <p className="ld-hint">Scheduled for {fmtDate(lead.demo_at)}</p>}
        </div>

        <div className="pp-sec">
          <h3>Notes</h3>
          <textarea className="ld-input" rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Talked to Mike, wants a quote for 40 units…" />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button className="ld-btn sm" disabled={!note.trim() || busy === "note"} onClick={async () => { if (await save("note", "note", { text: note })) setNote(""); }}>{busy === "note" ? "Saving…" : "Add note"}</button>
          </div>
          {notes.map((n, i) => <div key={i} className="pp-note"><time>{fmtDate(n.at)}</time><p>{n.text}</p></div>)}
          {lead.notes && <div className="pp-note"><time>From the lot visit</time><p>{lead.notes}</p></div>}
          {!notes.length && !lead.notes && <p className="ld-hint">No notes yet.</p>}
        </div>

        <div className="pp-sec">
          <h3>Contact</h3>
          <div className="pp-kv">
            {lead.contact_name && <><span>Name</span><span>{lead.contact_name}{lead.contact_title ? `, ${lead.contact_title}` : ""}</span></>}
            <span>Email</span><a href={`mailto:${lead.contact_email}`}>{lead.contact_email}</a>
            {(lead.cc || []).map(c => <Fragment key={c.email}><span>CC</span><a href={`mailto:${c.email}`}>{c.name ? `${c.name}${c.title ? `, ${c.title}` : ""} · ` : ""}{c.email}</a></Fragment>)}
            {lead.phone && <><span>Phone</span><a href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`}>{lead.phone}</a></>}
            {lead.website && <><span>Website</span><a href={lead.website} target="_blank" rel="noopener">{lead.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</a></>}
            {lead.address && <><span>Address</span><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lead.dealership} ${lead.address}`)}`} target="_blank" rel="noopener">{lead.address}</a></>}
            <span>Lot page</span><a href={lead.report_url} target="_blank" rel="noopener">{lead.media_count} photo{lead.media_count === 1 ? "" : "s"}/videos</a>
            <span>Emails</span><span>{lead.step || 0} of 4 sent · {EMAIL_STATUS[lead.status] || lead.status}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
