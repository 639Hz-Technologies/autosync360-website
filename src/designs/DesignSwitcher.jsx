// Floating pill for flipping between design skeletons during review. Remove before launch.
const options = [
  { key: "a", label: "A · Command Center" },
  { key: "b", label: "B · Clean Platform" },
  { key: "current", label: "Current site" },
];

export default function DesignSwitcher({ active }) {
  return (
    <div style={{
      position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)", zIndex: 9999,
      display: "flex", gap: 4, padding: 4, borderRadius: 999,
      background: "rgba(17,24,39,0.92)", boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
      fontFamily: "Inter, system-ui, sans-serif", maxWidth: "calc(100vw - 32px)", overflowX: "auto",
    }}>
      {options.map(o => (
        <a key={o.key} href={`/?design=${o.key}`} style={{
          padding: "8px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
          textDecoration: "none", color: active === o.key ? "#111827" : "#d1d5db",
          background: active === o.key ? "#fff" : "transparent",
        }}>{o.label}</a>
      ))}
    </div>
  );
}
