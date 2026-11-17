// Two-step "Book a demo": qualifying details → request a day/time → confirmation.
// The request (details + preferred slot) is emailed to the team via the send-email Netlify
// function (Postmark); the team confirms the time by email/phone. Nothing is auto-booked.
// Later: swap step 2 for a Calendly / Cal.com / Google appointment-schedule embed.
import { useMemo, useState } from "react";
import Icon from "./icons.jsx";
import { vendorTypes } from "./content.js";

const ROLES = ["Owner / GM", "Used car or inventory manager", "Recon or service manager", "Office / accounting", "Operations / dispatch", "Other"];
const LOCATIONS = ["1", "2–5", "6–20", "21+"];
const VOLUME = ["Under 50", "50–150", "150–500", "500+"];
const DMS = ["CDK", "Reynolds & Reynolds", "Dealertrack", "Tekion", "DealerSocket", "Frazer", "Other", "None / not sure"];
const GOALS = ["Vehicle tracking & GPS", "Recon workflow", "Vendor management", "Billing & invoicing", "Payroll & team", "AI automation"];
const TIMES = ["9:00", "9:30", "10:00", "10:30", "11:00", "11:30", "1:00", "1:30", "2:00", "2:30", "3:00", "3:30", "4:00", "4:30"];

// Next 10 business days, starting tomorrow.
function businessDays(n = 10) {
  const out = []; const d = new Date(); d.setHours(0, 0, 0, 0);
  while (out.length < n) { d.setDate(d.getDate() + 1); if (d.getDay() % 6 !== 0) out.push(new Date(d)); }
  return out;
}
const fmtDay = d => d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
const ampm = t => { const h = +t.split(":")[0]; return `${t} ${h >= 9 && h <= 11 ? "AM" : "PM"}`; };

export default function DemoBooking({ C }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", business: "", email: "", phone: "", type: "", role: "", locations: "", volume: "", dms: "", goals: [] });
  const days = useMemo(() => businessDays(), []);
  const [day, setDay] = useState(0);
  const [time, setTime] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const toggleGoal = g => setForm(f => ({ ...f, goals: f.goals.includes(g) ? f.goals.filter(x => x !== g) : [...f.goals, g] }));
  const isVendor = form.type.startsWith("Vendor");
  const isFleet = form.type === "Fleet manager";

  const label = { fontSize: 12, fontWeight: 600, color: C.mute, marginBottom: 6, display: "block" };
  const chip = on => ({ fontSize: 13, padding: "8px 12px", borderRadius: 999, cursor: "pointer", fontFamily: "inherit", border: `1px solid ${on ? C.accent : C.line}`, background: on ? "rgba(37,99,235,0.08)" : "#fff", color: on ? C.accent : C.text, fontWeight: on ? 600 : 500 });

  const Steps = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
      {["Your details", "Request a time"].map((s, i) => {
        const n = i + 1, done = step > n, on = step === n;
        return (
          <span key={s} style={{ display: "flex", alignItems: "center", gap: 8, color: on || done ? C.ink : C.mute }}>
            {i > 0 && <span style={{ width: 24, height: 1, background: C.line }} />}
            <span style={{ width: 22, height: 22, borderRadius: 22, display: "grid", placeItems: "center", fontSize: 11, background: done ? C.good : on ? C.accent : C.bg2, color: done || on ? "#fff" : C.mute, border: done || on ? "none" : `1px solid ${C.line}` }}>
              {done ? <Icon name="check" size={12} color="#fff" width={3} /> : n}
            </span>{s}
          </span>
        );
      })}
    </div>
  );

  if (step === 3) {
    return (
      <div className="a-card" style={{ padding: 32, textAlign: "center" }}>
        <span style={{ width: 52, height: 52, borderRadius: 52, display: "inline-grid", placeItems: "center", background: "rgba(5,150,105,0.12)", marginBottom: 16 }}><Icon name="check" size={24} color={C.good} width={3} /></span>
        <h3 className="a-h" style={{ fontSize: 24, marginBottom: 8 }}>Request received, {form.name.split(" ")[0] || "thanks"}!</h3>
        <p style={{ color: C.text, fontSize: 15, fontWeight: 600 }}>Requested: {fmtDay(days[day])} · {ampm(time)} ET</p>
        <p style={{ color: C.mute, fontSize: 14, lineHeight: 1.6, margin: "10px auto 0", maxWidth: 380 }}>We'll confirm your time at <b style={{ color: C.text }}>{form.email}</b>, usually within one business day, and tailor the demo to {form.goals.length ? form.goals.slice(0, 2).join(" and ").toLowerCase() : "your workflow"}.</p>
      </div>
    );
  }

  const submit = async e => {
    e.preventDefault();
    if (!time || sending) return;
    setSending(true); setError("");
    const message = [
      `DEMO REQUEST: ${fmtDay(days[day])} at ${ampm(time)} ET (please confirm with the customer)`,
      "",
      `I am a: ${form.type}`,
      `Role: ${form.role || "N/A"}`,
      `${isVendor ? "Dealers served" : isFleet ? "Locations" : "Rooftops"}: ${form.locations || "N/A"}`,
      `${isVendor ? "Jobs per month" : isFleet ? "Vehicles in fleet" : "Vehicles per month"}: ${form.volume || "N/A"}`,
      !isVendor && !isFleet ? `DMS: ${form.dms || "N/A"}` : null,
      `Wants to fix first: ${form.goals.join(", ") || "N/A"}`,
      `Page: ${window.location.href}`,
    ].filter(l => l !== null).join("\n");
    try {
      const res = await fetch("/.netlify/functions/send-email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: form.name, company: form.business, phone: form.phone, email: form.email, message }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStep(3);
    } catch {
      setError("We couldn't send your request. Please try again or call us.");
    } finally {
      setSending(false);
    }
  };

  if (step === 2) {
    return (
      <form className="a-card" onSubmit={submit} style={{ padding: 28, display: "grid", gap: 18 }}>
        <Steps />
        <div>
          <span style={label}>Choose a day</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {days.map((d, i) => (
              <button type="button" key={i} onClick={() => { setDay(i); setTime(""); }} style={{ ...chip(day === i), borderRadius: 10, padding: "8px 4px", textAlign: "center" }}>
                <div style={{ fontSize: 11, opacity: 0.8 }}>{d.toLocaleDateString("en-US", { weekday: "short" })}</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{d.getDate()}</div>
                <div style={{ fontSize: 10, opacity: 0.7 }}>{d.toLocaleDateString("en-US", { month: "short" })}</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <span style={label}>{fmtDay(days[day])} · times in Eastern (ET) · 20 min</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {TIMES.map(t => {
              return (
                <button type="button" key={t} onClick={() => setTime(t)} style={{ ...chip(time === t), borderRadius: 8, padding: "9px 4px" }}>{ampm(t)}</button>
              );
            })}
          </div>
        </div>
        {error && <p role="alert" style={{ fontSize: 14, color: "#b91c1c" }}>{error}</p>}
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="a-btn a-btn-g" onClick={() => setStep(1)}>Back</button>
          <button className="a-btn a-btn-p" disabled={!time || sending} style={{ flex: 1, justifyContent: "center", opacity: time && !sending ? 1 : 0.5, cursor: time && !sending ? "pointer" : "not-allowed" }}>
            {sending ? "Sending…" : time ? `Request ${days[day].toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at ${ampm(time)}` : "Pick a time"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form className="a-card" onSubmit={e => { e.preventDefault(); setStep(2); }} style={{ padding: 28, display: "grid", gap: 12 }}>
      <Steps />
      <div className="a-two" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <input className="a-input" required placeholder="Full name *" value={form.name} onChange={set("name")} autoComplete="name" />
        <input className="a-input" required placeholder="Business name *" value={form.business} onChange={set("business")} autoComplete="organization" />
        <input className="a-input" required type="email" placeholder="Work email *" value={form.email} onChange={set("email")} autoComplete="email" />
        <input className="a-input" required type="tel" placeholder="Mobile phone *" value={form.phone} onChange={set("phone")} autoComplete="tel" />
        <select className="a-input" required value={form.type} onChange={set("type")}>
          <option value="" disabled>I am a… *</option>
          <option>Dealership</option><option>Dealer group (multi-rooftop)</option><option>Fleet manager</option>
          {vendorTypes.map(v => <option key={v.key}>Vendor: {v.name}</option>)}
        </select>
        <select className="a-input" value={form.role} onChange={set("role")}>
          <option value="" disabled>Your role</option>
          {ROLES.map(r => <option key={r}>{r}</option>)}
        </select>
        <select className="a-input" value={form.locations} onChange={set("locations")}>
          <option value="" disabled>{isVendor ? "Dealers you serve" : isFleet ? "Locations" : "Number of rooftops"}</option>
          {LOCATIONS.map(r => <option key={r}>{r}</option>)}
        </select>
        <select className="a-input" value={form.volume} onChange={set("volume")}>
          <option value="" disabled>{isVendor ? "Jobs per month" : isFleet ? "Vehicles in fleet" : "Vehicles per month"}</option>
          {VOLUME.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>
      {!isVendor && !isFleet && (
        <select className="a-input" value={form.dms} onChange={set("dms")}>
          <option value="" disabled>Which DMS do you use?</option>
          {DMS.map(r => <option key={r}>{r}</option>)}
        </select>
      )}
      <div>
        <span style={{ ...label, marginTop: 4 }}>What do you want to fix first?</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {GOALS.map(g => <button type="button" key={g} onClick={() => toggleGoal(g)} style={chip(form.goals.includes(g))} aria-pressed={form.goals.includes(g)}>{g}</button>)}
        </div>
      </div>
      <button className="a-btn a-btn-p" style={{ justifyContent: "center", marginTop: 6 }}>Next: request a time <Icon name="arrow" size={16} color="#fff" /></button>
      <style dangerouslySetInnerHTML={{ __html: `@media(max-width:520px){.a-two{grid-template-columns:1fr!important}}` }} />
    </form>
  );
}
