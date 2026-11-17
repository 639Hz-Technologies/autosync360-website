// Interactive "Ask AutoSync" demo. Scripted answers over sample vehicles — no real AI or backend.
// Visitors type or tap a suggestion; it remembers the last vehicle so follow-ups ("show its history") work.
import { useEffect, useRef, useState } from "react";
import Icon from "./icons.jsx";

const VEHICLES = [
  {
    id: "2290", name: "2020 Chevy Tahoe", keys: ["tahoe", "chevy", "chevrolet", "2290"], status: "On a test drive", tone: "violet",
    where: "Colonial Dr · heading back, ~4 min out",
    text: "The 2020 Chevy Tahoe (#2290) is out on a test drive. Joey Stuman took it out with a customer at 2:05 PM, about 22 minutes ago. GPS shows it on Colonial Dr heading back to the lot, about 4 minutes out.",
    history: [["Oct 30", "Bought at auction · condition report: light scratches, tires 6/32"], ["Nov 1", "Delivered by Swift Haul · 24 photos + walkaround video"], ["Nov 2", "Recon: 2 new tires, paint correction, full detail"], ["Nov 3", "Frontline ready · listed online"], ["Today 2:05 PM", "Test drive with Joey Stuman + customer"]],
  },
  {
    id: "5120", name: "2023 BMW X5", keys: ["bmw", "x5", "5120"], status: "Recon · wheel repair", tone: "warn",
    where: "Elite Wheel & Body · Bay 2",
    text: "The 2023 BMW X5 (#5120) is in recon at Elite Wheel & Body getting the left rear rim fixed (curb rash). They started at 10:40 AM and expect it done by 4:00 PM. Next it goes to detail, then frontline tomorrow morning.",
    history: [["Nov 8", "Trade-in · appraised by Maria Lopez"], ["Nov 9", "Mechanical inspection passed · oil service"], ["Nov 10", "Condition photos flag left rear rim curb rash"], ["Today 10:40 AM", "Sent to Elite Wheel & Body for rim repair"]],
  },
  {
    id: "6012", name: "2019 Toyota Camry", keys: ["camry", "toyota", "6012"], status: "Mechanical shop", tone: "accent",
    where: "Service · Bay 5 with Luis",
    text: "The 2019 Toyota Camry (#6012) is in the mechanic shop, Bay 5 with Luis. Front brakes and rotors are being replaced; the parts arrived this morning. Should be done by 5:00 PM, then it moves to detail.",
    history: [["Nov 6", "Bought at auction · report notes brake noise"], ["Nov 8", "Delivered · no new damage vs. pickup photos"], ["Nov 12", "Parts ordered: front pads + rotors ($312)"], ["Today 11:30 AM", "In Bay 5 with Luis"]],
  },
  {
    id: "3308", name: "2021 Honda Accord", keys: ["accord", "honda", "3308"], status: "Detailing · Bay 3", tone: "accent2",
    where: "Detail · Bay 3 with Mike R.",
    text: "The 2021 Honda Accord (#3308) is in detailing, Bay 3. Mike R. started a full detail at 1:15 PM, about 45 minutes left. After that it's photos, then it goes frontline.",
    history: [["Nov 5", "Dealer trade from Sunshine Ford"], ["Nov 6", "Delivered · 24 photos + walkaround video"], ["Nov 11", "Mechanical: new front brakes, alignment"], ["Today 1:15 PM", "Full detail, Bay 3"]],
  },
  {
    id: "4471", name: "2022 Ford F-150", keys: ["f-150", "f150", "f 150", "ford", "4471"], status: "In transit", tone: "accent2",
    where: "Swift Haul · Florida's Turnpike, 12 mi out",
    text: "The 2022 Ford F-150 (#4471) is in transit with Swift Haul, 12 miles out, ETA 2:40 PM. The auction report flags a rear bumper scuff and worn tires, so I've booked body at 3:00 and tires + detail tomorrow. Projected frontline: Thursday.",
    history: [["Nov 12", "Bought at auction in Atlanta, GA"], ["Today 9:12 AM", "Picked up by Swift Haul · 24 photos + 45s walkaround video"], ["Today", "In transit · I-75 → Florida's Turnpike"]],
  },
];
const byId = id => VEHICLES.find(v => v.id === id);

const SUGGESTIONS = ["Where's the Tahoe?", "What's in recon?", "Show the BMW X5's history", "Where's stock #4471?", "What's in detailing?"];

function reply(raw, last) {
  const q = raw.toLowerCase();
  const has = (...w) => w.some(x => q.includes(x));
  const v = VEHICLES.find(x => x.keys.some(k => q.includes(k))) || (has("it", "its", "that", "this") && last ? last : null);
  const wantsHistory = has("history", "timeline", "been through", "before", "past", "everything on");

  if (v && wantsHistory) return { text: `Here's the history for the ${v.name} (#${v.id}):`, history: v, last: v };
  if (v) return { text: v.text, card: v, last: v };
  if (wantsHistory && last) return { text: `Here's the history for the ${last.name} (#${last.id}):`, history: last, last };
  if (has("test drive", "ride", "joey", "sales", "customer", "drive")) return { text: byId("2290").text, card: byId("2290"), last: byId("2290") };
  if (has("recon", "repair", "rim", "wheel", "body")) return { text: "Two vehicles are in recon right now:", list: ["5120", "6012"].map(byId) };
  if (has("detail", "wash", "clean")) return { text: byId("3308").text, card: byId("3308"), last: byId("3308") };
  if (has("mechanic", "shop", "brake", "service")) return { text: byId("6012").text, card: byId("6012"), last: byId("6012") };
  if (has("transit", "truck", "coming", "arriv", "incoming", "transport", "eta")) return { text: byId("4471").text, card: byId("4471"), last: byId("4471") };
  if (has("late", "delay", "behind", "stuck", "slip")) return { text: "Nothing is late right now. Closest to slipping: the BMW X5's rim repair is due at 4:00 PM. I'll text the recon manager if it runs over." };
  if (has("all", "everything", "overview", "summary", "how many", "inventory", "status", "lot")) return { text: "Here's everything I'm tracking in this demo:", list: VEHICLES };
  if (has("hi", "hello", "hey", "yo")) return { text: "Hey! Ask me where any vehicle is, what's being done to it, or its full history." };
  return { text: "In this demo I'm tracking 5 sample vehicles: a Tahoe, BMW X5, Camry, Accord and F-150. Try asking where one is, what's in recon, or for a vehicle's history." };
}

export default function AskDemo({ C }) {
  const tone = { violet: C.violet, warn: C.warn, accent: C.accent, accent2: C.accent2, good: C.good };
  const [msgs, setMsgs] = useState([{ from: "ai", text: "Hi, I'm AutoSync. Ask me where any vehicle is, what's being done to it, or its history." }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [last, setLast] = useState(null);
  const body = useRef(null);
  const timer = useRef(null);

  useEffect(() => { if (body.current) body.current.scrollTop = body.current.scrollHeight; }, [msgs, typing]);
  useEffect(() => () => clearTimeout(timer.current), []);

  function ask(text) {
    const t = text.trim();
    if (!t || typing) return;
    setInput("");
    setMsgs(m => [...m, { from: "user", text: t }]);
    setTyping(true);
    const r = reply(t, last);
    timer.current = setTimeout(() => {
      setTyping(false);
      if (r.last) setLast(r.last);
      setMsgs(m => [...m, { from: "ai", ...r }]);
    }, 700 + Math.random() * 500);
  }

  const Pill = ({ v }) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: tone[v.tone] }}>
      <span className="a-blink" style={{ width: 6, height: 6, borderRadius: 6, background: tone[v.tone] }} />{v.status}
    </span>
  );
  const Card = ({ v }) => (
    <button onClick={() => ask(`Show the ${v.name.split(" ").slice(1).join(" ")}'s history`)} style={{ all: "unset", cursor: "pointer", display: "block", marginTop: 10, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 12px" }} title="Show history">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
        <b style={{ fontSize: 13, color: C.ink }}>{v.name}</b><span style={{ fontSize: 11, color: C.mute }}>#{v.id}</span>
      </div>
      <div style={{ marginTop: 4 }}><Pill v={v} /></div>
      <div style={{ fontSize: 11, color: C.mute, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}><Icon name="gps" size={11} color={C.mute} />{v.where}</div>
    </button>
  );

  return (
    <div className="a-card" style={{ padding: 20, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 14, borderBottom: `1px solid ${C.line}` }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center", background: "rgba(167,139,250,0.16)" }}><Icon name="ai" size={15} color={C.violet} /></span>
        <b style={{ color: C.ink, fontSize: 14 }}>Ask AutoSync</b>
        <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: C.violet, background: "rgba(124,58,237,0.08)", padding: "3px 8px", borderRadius: 999 }}>TRY IT · SAMPLE DATA</span>
      </div>

      <div ref={body} style={{ height: 360, overflowY: "auto", padding: "16px 2px 4px", scrollBehavior: "smooth" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
            <div style={{ maxWidth: "88%", padding: "11px 14px", borderRadius: 12, fontSize: 14, lineHeight: 1.55, background: m.from === "user" ? C.accent : C.bg2, color: m.from === "user" ? "#fff" : C.text, border: m.from === "user" ? "none" : `1px solid ${C.line}` }}>
              {m.text}
              {m.card && <Card v={m.card} />}
              {m.list && m.list.map(v => <Card key={v.id} v={v} />)}
              {m.history && (
                <div style={{ marginTop: 10, borderLeft: `2px solid ${C.line}`, paddingLeft: 12 }}>
                  {m.history.history.map(([when, what], j) => (
                    <div key={j} style={{ position: "relative", paddingBottom: j === m.history.history.length - 1 ? 0 : 10 }}>
                      <span style={{ position: "absolute", left: -17, top: 5, width: 8, height: 8, borderRadius: 8, background: j === m.history.history.length - 1 ? tone[m.history.tone] : "#cbd5e1" }} />
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.mute }}>{when}</div>
                      <div style={{ fontSize: 13, color: C.text }}>{what}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div style={{ display: "inline-flex", gap: 4, padding: "12px 14px", borderRadius: 12, background: C.bg2, border: `1px solid ${C.line}` }}>
            {[0, 1, 2].map(d => <span key={d} className="a-dot" style={{ width: 6, height: 6, borderRadius: 6, background: C.mute, animationDelay: `${d * 0.15}s` }} />)}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "10px 0" }}>
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => ask(s)} disabled={typing} style={{ fontSize: 12, padding: "6px 10px", borderRadius: 999, border: `1px solid ${C.line}`, background: "#fff", color: C.text, cursor: "pointer", fontFamily: "inherit" }}>{s}</button>
        ))}
      </div>

      <form onSubmit={e => { e.preventDefault(); ask(input); }} style={{ display: "flex", gap: 8 }}>
        <input className="a-input" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about any vehicle, vendor or job…" aria-label="Ask AutoSync" />
        <button type="submit" className="a-btn a-btn-p" style={{ padding: "0 16px" }} disabled={typing} aria-label="Send"><Icon name="arrow" size={16} color="#fff" /></button>
      </form>
      <style dangerouslySetInnerHTML={{ __html: `.a-dot{animation:aDot 1s ease-in-out infinite}@keyframes aDot{0%,100%{opacity:.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}@media(prefers-reduced-motion:reduce){.a-dot{animation:none}}` }} />
    </div>
  );
}
