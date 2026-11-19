// "Data" tab on /leads: every Florida dealership from Genius Leads, searchable, sortable by size or
// distance. "Start lead" opens New lead with the dealer already filled in.
import { useEffect, useRef, useState } from "react";
import { C, AuthError, api } from "./shared.js";
import { STAGES } from "./Pipe.jsx";

const STAGE_LABEL = Object.fromEntries(STAGES.map(s => [s.key, s.label]));

const css = `
.dt-bar{display:grid;grid-template-columns:1fr;gap:10px;margin-top:14px}
@media(min-width:760px){.dt-bar{grid-template-columns:2fr 1fr 1fr}}
.dt-meta{margin-top:12px;font-size:14px;color:${C.mute}}
.dt-list{margin-top:10px;background:#fff;border:1px solid ${C.line};border-radius:14px;overflow:hidden}
.dt-row{display:grid;grid-template-columns:1fr;gap:8px;padding:14px 16px;border-top:1px solid ${C.line}}
.dt-row:first-child{border-top:0}
@media(min-width:960px){.dt-row{grid-template-columns:minmax(0,2.2fr) minmax(0,1.2fr) minmax(0,1.3fr) auto;align-items:center;gap:16px;padding:14px 20px}}
.dt-name{font-weight:700;color:${C.ink};font-size:16px}
.dt-sub{font-size:13px;color:${C.mute};margin-top:2px}
.dt-rate{font-size:14px;color:${C.text}}
.dt-rate b{color:#b45309}
.dt-links{display:flex;flex-direction:column;gap:2px;font-size:14px;min-width:0}
.dt-links a{color:${C.accent};text-decoration:none;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dt-act{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end}
@media(max-width:959px){.dt-act{justify-content:flex-start}}
.dt-in{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:3px 8px;border-radius:999px;background:rgba(5,150,105,.12);color:${C.good}}
.dt-empty{padding:28px 16px;text-align:center;color:${C.mute}}
`;

const fmt = n => Number(n).toLocaleString("en-US");
const domain = u => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };

export default function Data({ token, onAuthFail, onStartLead }) {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [sort, setSort] = useState("reviews");
  const [cities, setCities] = useState([]);
  const [res, setRes] = useState(null); // { total, dealers, disabled }
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const coords = useRef(null);
  const seq = useRef(0);

  const fail = x => (x instanceof AuthError ? onAuthFail() : setErr(x.message));

  useEffect(() => { api("data-cities", { token }).then(r => setCities(r.cities || [])).catch(fail); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const load = async (offset = 0) => {
    const n = ++seq.current;
    setBusy(true); setErr("");
    try {
      const p = new URLSearchParams({ sort, offset: String(offset) });
      if (q.trim()) p.set("q", q.trim());
      if (city) p.set("city", city);
      if (coords.current) { p.set("lat", coords.current.lat); p.set("lng", coords.current.lng); }
      const r = await api(`data?${p}`, { token });
      if (n !== seq.current) return;
      setRes(prev => (offset && prev ? { ...r, dealers: [...prev.dealers, ...r.dealers] } : r));
    } catch (x) { fail(x); }
    finally { if (n === seq.current) setBusy(false); }
  };

  // Search as you type (debounced); re-run when city/sort change.
  useEffect(() => { const t = setTimeout(() => load(0), q ? 300 : 0); return () => clearTimeout(t); }, [q, city, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickSort = v => {
    if (v === "near" && !coords.current) {
      if (!navigator.geolocation) return setErr("This browser can't share your location.");
      setBusy(true);
      navigator.geolocation.getCurrentPosition(
        p => { coords.current = { lat: p.coords.latitude, lng: p.coords.longitude }; setSort("near"); },
        () => { setBusy(false); setErr("Allow location access to sort by nearest."); },
        { timeout: 10000, maximumAge: 300000 },
      );
      return;
    }
    setSort(v);
  };

  const dealers = res?.dealers || [];

  return (
    <>
      <style>{css}</style>
      {res?.disabled ? (
        <div className="ld-card">
          <b style={{ color: C.ink }}>Dealer data isn't available right now.</b>
          <p className="ld-hint">Try Refresh in a minute.</p>
        </div>
      ) : (
        <>
          <div className="dt-bar">
            <input className="ld-input" placeholder="Search dealerships, cities, addresses…" value={q} onChange={e => setQ(e.target.value)} />
            <select className="ld-input" value={city} onChange={e => setCity(e.target.value)}>
              <option value="">All Florida cities</option>
              {cities.map(c => <option key={c.city} value={c.city}>{c.city} ({c.n})</option>)}
            </select>
            <select className="ld-input" value={sort} onChange={e => pickSort(e.target.value)}>
              <option value="reviews">Biggest first (most reviews)</option>
              <option value="near">Nearest to me</option>
              <option value="az">A–Z</option>
            </select>
          </div>
          <div className="dt-meta">
            {res ? `${fmt(res.total)} Florida dealership${res.total === 1 ? "" : "s"}${sort === "near" ? " within about 70 miles" : ""}` : "Loading…"}
            {busy && res ? " · updating…" : ""}
          </div>
          {err && <div className="ld-err">{err}</div>}
          <div className="dt-list">
            {res && !dealers.length && <div className="dt-empty">No dealerships match.</div>}
            {dealers.map(d => (
              <div key={d.id} className="dt-row">
                <div style={{ minWidth: 0 }}>
                  <div className="dt-name">{d.name}</div>
                  <div className="dt-sub">{[d.address, d.city].filter(Boolean).join(", ")}{d.miles != null ? ` · ${d.miles < 10 ? d.miles.toFixed(1) : Math.round(d.miles)} mi` : ""}</div>
                </div>
                <div className="dt-rate">
                  {d.rating != null ? <><b>★ {Number(d.rating).toFixed(1)}</b> · {fmt(d.rating_count || 0)} reviews</> : <span style={{ color: C.mute }}>No reviews</span>}
                </div>
                <div className="dt-links">
                  {d.phone && <a href={`tel:${d.phone.replace(/[^\d+]/g, "")}`}>{d.phone}</a>}
                  {d.website && <a href={d.website} target="_blank" rel="noopener">{domain(d.website)}</a>}
                </div>
                <div className="dt-act">
                  {d.lead && <span className="dt-in">{d.lead.archived_at ? "Archived" : `In Pipe: ${STAGE_LABEL[d.lead.pipeline_stage] || "New lead"}`}</span>}
                  <a className="ld-btn sm g" style={{ textDecoration: "none" }} target="_blank" rel="noopener"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${d.name} ${d.address || ""} ${d.city || ""} FL`)}${d.place_id ? `&query_place_id=${encodeURIComponent(d.place_id)}` : ""}`}>Map</a>
                  <button className="ld-btn sm" onClick={() => onStartLead(d)}>Start lead</button>
                </div>
              </div>
            ))}
          </div>
          {res && dealers.length < res.total && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
              <button className="ld-btn sm g" disabled={busy} onClick={() => load(dealers.length)}>{busy ? "Loading…" : `Show more (${fmt(res.total - dealers.length)} left)`}</button>
            </div>
          )}
        </>
      )}
    </>
  );
}
