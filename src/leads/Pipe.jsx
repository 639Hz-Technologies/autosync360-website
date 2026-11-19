// "Pipe" tab on /leads: a simple CRM board. Every lead from a lot visit starts in "New lead";
// drag cards across (or change the stage inside a card on a phone), set the demo date, and keep notes.
// Moving a lead out of "New lead" stops its automatic emails (you're talking to them now).
import { Fragment, useEffect, useMemo, useState } from "react";
import { C, AuthError, api } from "./shared.js";
import { PROFILE_FIELDS, PROFILE_KEYS, fmtMoney, monthlyRevenue } from "./profile.js";

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
.pp-drawer-bg{position:fixed;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(11,18,32,.28);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);animation:ppFade .15s ease-out}
.pp-drawer{background:#fff;width:100%;max-width:640px;max-height:calc(100vh - 48px);overflow-y:auto;padding:24px 28px 28px;border-radius:18px;box-shadow:0 24px 70px rgba(15,23,42,.3);animation:ppPop .18s ease-out}
@keyframes ppFade{from{opacity:0}to{opacity:1}}
@keyframes ppPop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}
@media(max-width:600px){.pp-drawer-bg{padding:12px}.pp-drawer{padding:18px 16px 22px;max-height:calc(100vh - 24px)}}
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
.pp-tag.arch{background:#e2e8f0;color:#475569}
.pp-tag.vol{background:rgba(5,150,105,.1);color:#047857}
.pp-card.archived{opacity:.6}
.pp-vol{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pp-vol label{display:flex;flex-direction:column;gap:4px;font-size:13px;color:${C.mute};font-weight:500}
.pp-vol .ld-input{padding:10px 12px;font-size:15px}
.pp-vol .wide{grid-column:1 / -1}
.pp-pair{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pp-rev{margin-top:14px;border:1px solid rgba(5,150,105,.25);background:rgba(5,150,105,.06);border-radius:12px;padding:12px 14px}
.pp-rev-line{display:flex;justify-content:space-between;gap:12px;font-size:13px;color:${C.mute};padding:2px 0}
.pp-rev-line b{color:${C.text};font-weight:600;white-space:nowrap}
.pp-rev-total{display:flex;justify-content:space-between;align-items:baseline;gap:12px;border-top:1px solid rgba(5,150,105,.25);margin-top:8px;padding-top:8px}
.pp-rev-total span{font-size:13px;font-weight:700;color:#047857;text-transform:uppercase;letter-spacing:.06em}
.pp-rev-total b{font:700 24px 'Space Grotesk',sans-serif;color:#047857}
.pp-rev-total small{display:block;font-size:12px;color:${C.mute};font-weight:500;text-align:right}
.pp-money{position:relative}.pp-money span{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:${C.mute};font-size:15px;pointer-events:none}
.pp-money .ld-input{padding-left:24px;width:100%;box-sizing:border-box}
.pp-arch{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:24px;padding-top:16px;border-top:1px solid ${C.line}}
.pp-arch-banner{background:#f1f5f9;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;margin-top:12px;font-size:14px;color:#475569}
.ld-btn.danger{background:#fff;color:${C.bad};border:1px solid rgba(220,38,38,.35);box-shadow:none}
@media(max-width:520px){.pp-vol{grid-template-columns:1fr}}
@media(max-width:700px){.pp-board{grid-auto-columns:82vw}.pp-tip{display:none}}
`;

// Short summary on the card, e.g. "120 on lot · 80 used/mo"
const volumeTag = p => [
  p?.cars_on_lot != null && `${p.cars_on_lot} on lot`,
  p?.used_per_month != null && `${p.used_per_month} used/mo${p.used_price != null ? ` @ ${fmtMoney(p.used_price)}` : ""}`,
].filter(Boolean).join(" · ");

const fmtDate = d => new Date(d).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const toLocalInput = d => { if (!d) return ""; const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };

export default function Pipe({ token, onAuthFail }) {
  const [leads, setLeads] = useState(null);
  const [err, setErr] = useState("");
  const [openId, setOpenId] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [overStage, setOverStage] = useState(null);
  const [hideTests, setHideTests] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

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

  const shown = useMemo(() => (leads || []).filter(l => !(hideTests && l.test_mode) && (showArchived || !l.archived_at)), [leads, hideTests, showArchived]);
  const archivedCount = (leads || []).filter(l => l.archived_at).length;
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
          <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
            <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} /> Show archived{archivedCount ? ` (${archivedCount})` : ""}
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
                <div key={l.id} role="button" tabIndex={0} className={`pp-card${dragId === l.id ? " dragging" : ""}${l.archived_at ? " archived" : ""}`} draggable
                  onKeyDown={e => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setOpenId(l.id))}
                  onDragStart={e => { setDragId(l.id); e.dataTransfer.setData("text/plain", l.id); e.dataTransfer.effectAllowed = "move"; }}
                  onDragEnd={() => { setDragId(null); setOverStage(null); }}
                  onClick={() => setOpenId(l.id)}>
                  <b>{l.dealership}</b>
                  <div className="pp-sub">{l.contact_name ? `${l.contact_name} · ` : ""}{l.contact_email}</div>
                  <div className="pp-tags">
                    {l.archived_at && <span className="pp-tag arch">Archived</span>}
                    {l.demo_at && <span className="pp-tag demo">Demo {fmtDate(l.demo_at)}</span>}
                    {volumeTag(l.profile) && <span className="pp-tag vol">{volumeTag(l.profile)}</span>}
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

      {open && <LeadDrawer lead={open} token={token} onClose={() => setOpenId(null)} onMove={move} onSaved={row => { merge(row); if (row.archived_at && !showArchived) setOpenId(null); }} onFail={fail} />}
    </>
  );
}

function LeadDrawer({ lead, token, onClose, onMove, onSaved, onFail }) {
  const [note, setNote] = useState("");
  const [demo, setDemo] = useState(toLocalInput(lead.demo_at));
  const [busy, setBusy] = useState("");
  const [vol, setVol] = useState(() => Object.fromEntries(PROFILE_KEYS.map(k => [k, lead.profile?.[k] ?? ""])));
  const volDirty = PROFILE_KEYS.some(k => String(vol[k] ?? "") !== String(lead.profile?.[k] ?? ""));

  useEffect(() => {
    const onKey = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const save = async (what, path, body) => {
    setBusy(what);
    try { onSaved((await api(path, { token, body: { id: lead.id, ...body } })).lead); return true; }
    catch (x) { onFail(x); return false; }
    finally { setBusy(""); }
  };

  // One Save button (under Volume) saves the demo date and the volume together.
  const demoDirty = demo !== toLocalInput(lead.demo_at);
  const dirty = demoDirty || volDirty;
  const saveAll = async () => {
    if (demoDirty && !(await save("all", "demo", { demoAt: demo ? new Date(demo).toISOString() : null }))) return;
    if (volDirty) await save("all", "profile", { profile: vol });
  };

  const notes = [...(lead.notes_log || [])].reverse();
  const stopsEmails = lead.pipeline_stage === "new" && lead.status === "active";

  return (
    <div className="pp-drawer-bg" onClick={onClose}>
      <aside className="pp-drawer" role="dialog" aria-modal="true" aria-label={lead.dealership} onClick={e => e.stopPropagation()}>
        <button className="pp-x" onClick={onClose} aria-label="Close">×</button>
        <h2>{lead.dealership}</h2>
        <div className="ld-hint">Added {fmtDate(lead.created_at)}{lead.test_mode ? " · test run" : ""}</div>
        {lead.archived_at && <div className="pp-arch-banner">Archived {fmtDate(lead.archived_at)}. It's hidden from Pipe and Campaign and gets no emails.</div>}

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
            {lead.demo_at && <button className="ld-btn sm g" disabled={busy === "demo"} onClick={async () => { if (await save("demo", "demo", { demoAt: null })) setDemo(""); }}>Clear</button>}
          </div>
          {lead.demo_at && <p className="ld-hint">Scheduled for {fmtDate(lead.demo_at)}</p>}
        </div>

        <div className="pp-sec">
          <h3>Volume</h3>
          <div className="pp-vol">
            {PROFILE_FIELDS.map(f => f.price ? (
              // Volume on the left, what they pay per unit on the right.
              <div key={f.key} className="pp-pair wide">
                <label>
                  {f.label}
                  <input className="ld-input" inputMode="numeric" value={vol[f.key]} placeholder="0"
                    onChange={e => setVol(v => ({ ...v, [f.key]: e.target.value.replace(/[^\d]/g, "") }))} />
                </label>
                <label>
                  {f.price.label}
                  <div className="pp-money"><span>$</span>
                    <input className="ld-input" inputMode="decimal" value={vol[f.price.key]} placeholder="0"
                      onChange={e => setVol(v => ({ ...v, [f.price.key]: e.target.value.replace(/[^\d.]/g, "") }))} />
                  </div>
                </label>
              </div>
            ) : (
              <label key={f.key} className={f.type === "select" || f.key === "price_per_detail" ? "wide" : ""}>
                {f.label}
                {f.type === "select" ? (
                  <select className="ld-input" value={vol[f.key]} onChange={e => setVol(v => ({ ...v, [f.key]: e.target.value }))}>
                    <option value="">Not sure yet</option>
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input className="ld-input" inputMode={f.type === "number" ? "numeric" : undefined} value={vol[f.key]}
                    placeholder={f.type === "number" ? "0" : f.key === "price_per_detail" ? "e.g. $25 quick wash, $150 heavy recon" : ""}
                    onChange={e => setVol(v => ({ ...v, [f.key]: f.type === "number" ? e.target.value.replace(/[^\d]/g, "") : e.target.value }))} />
                )}
              </label>
            ))}
          </div>
          {(() => {
            const rev = monthlyRevenue(vol);
            return (
              <div className="pp-rev">
                {rev.lines.map(l => (
                  <div key={l.key} className="pp-rev-line">
                    <span>{l.label}: {l.qty.toLocaleString()}{l.key === "cars_on_lot" ? " cars" : ""} × {fmtMoney(l.price)}{l.times !== 1 ? ` × ${l.times} washes` : ""}</span>
                    <b>{fmtMoney(l.amount)}</b>
                  </div>
                ))}
                {!rev.lines.length && <div className="pp-rev-line"><span>Add a volume and what they pay to see their monthly spend.</span></div>}
                {rev.needsWashFrequency && <div className="pp-rev-line"><span>Pick how often they wash the lot to include the lot wash.</span></div>}
                <div className="pp-rev-total">
                  <span>Monthly revenue</span>
                  <b>{fmtMoney(rev.total)}<small>{fmtMoney(Math.round(rev.total * 12 * 100) / 100)} / year</small></b>
                </div>
              </div>
            );
          })()}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
            <button className="ld-btn sm" disabled={!dirty || busy === "all"} onClick={saveAll}>{busy === "all" ? "Saving…" : dirty ? "Save" : "Saved"}</button>
          </div>
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

        <div className="pp-arch">
          <span className="ld-hint" style={{ margin: 0 }}>{lead.archived_at ? "Bring it back onto the board." : "Done with this lead? Archive hides it and stops any emails."}</span>
          {lead.archived_at
            ? <button className="ld-btn sm g" disabled={busy === "arch"} onClick={() => save("arch", "archive", { archived: false })}>{busy === "arch" ? "Saving…" : "Unarchive"}</button>
            : <button className="ld-btn sm danger" disabled={busy === "arch"} onClick={() => save("arch", "archive", { archived: true })}>{busy === "arch" ? "Archiving…" : "Archive lead"}</button>}
        </div>
      </aside>
    </div>
  );
}
