// "Photos & videos" editor for a lead that's already been sent: add more (or remove some) and they
// show on the dealer's lot page. Used in the Pipe pop-up and from Campaign ("Add photos/videos").
// Same rules as New lead: photos are shrunk, videos must be 15 s or less and under the size cap.
import { useEffect, useState } from "react";
import { C, AuthError, api } from "./shared.js";
import { checkVideos, uploadFile, MAX_VIDEO_SECONDS } from "./media.js";

const css = `
.lm-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:0 0 10px}
@media(min-width:700px){.lm-grid{grid-template-columns:repeat(5,1fr)}}
.lm-item{position:relative;aspect-ratio:1;border-radius:10px;overflow:hidden;background:#e2e8f0}
.lm-item img,.lm-item video{width:100%;height:100%;object-fit:cover;display:block}
.lm-item a{display:block;width:100%;height:100%}
.lm-item .x{position:absolute;top:4px;right:4px;width:24px;height:24px;border-radius:50%;border:0;background:rgba(11,18,32,.75);color:#fff;font-size:14px;line-height:24px;cursor:pointer}
.lm-item .tag{position:absolute;left:4px;bottom:6px;font-size:10px;font-weight:700;color:#fff;background:rgba(11,18,32,.75);padding:1px 6px;border-radius:6px}
.lm-item .bar{position:absolute;left:0;bottom:0;height:4px;background:${C.accent};transition:width .2s}
.lm-modal-bg{position:fixed;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(11,18,32,.28);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px)}
.lm-modal{background:#fff;width:100%;max-width:640px;max-height:calc(100vh - 48px);overflow-y:auto;padding:24px 28px 28px;border-radius:18px;box-shadow:0 24px 70px rgba(15,23,42,.3)}
.lm-modal h2{font:700 22px/1.2 'Space Grotesk',sans-serif;color:${C.ink};margin:0 40px 16px 0}
.lm-x{float:right;width:36px;height:36px;border-radius:50%;border:1px solid ${C.line};background:#fff;font-size:20px;line-height:1;cursor:pointer;color:${C.text}}
@media(max-width:600px){.lm-modal-bg{padding:12px}.lm-modal{padding:18px 16px 22px}}
`;

export default function LeadMedia({ lead, token, onAuthFail, onChange }) {
  const [items, setItems] = useState(null);        // saved: { path, type, url }
  const [pending, setPending] = useState([]);      // uploading: { key, kind, preview, progress }
  const [err, setErr] = useState("");

  const fail = x => (x instanceof AuthError ? onAuthFail() : setErr(x.message));
  const call = async body => {
    const r = await api("media", { token, body: { id: lead.id, ...body } });
    setItems(r.media);
    onChange?.(r.media_count);
  };

  useEffect(() => { call({}).catch(fail); }, [lead.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const addFiles = async (fileList, kind) => {
    let files = [...fileList];
    setErr("");
    if (kind === "video") {
      const { ok, error } = await checkVideos(files);
      setErr(error);
      files = ok;
    }
    const batch = files.map(file => ({ key: crypto.randomUUID(), kind, file, preview: URL.createObjectURL(file), progress: 0 }));
    setPending(p => [...p, ...batch]);
    for (const it of batch) {
      try {
        const up = await uploadFile(it.file, kind, token, progress => setPending(p => p.map(x => (x.key === it.key ? { ...x, progress } : x))));
        await call({ add: [{ path: up.path, type: kind }] });
      } catch (x) {
        fail(x);
      } finally {
        setPending(p => p.filter(x => x.key !== it.key));
        URL.revokeObjectURL(it.preview);
      }
    }
  };

  const remove = async m => {
    if (!window.confirm(`Remove this ${m.type === "video" ? "video" : "photo"} from the lot page?`)) return;
    setErr("");
    try { await call({ remove: [m.path] }); } catch (x) { fail(x); }
  };

  return (
    <div>
      <style>{css}</style>
      {items === null ? <p className="ld-hint">Loading…</p> : (
        <div className="lm-grid">
          {items.map(m => (
            <div key={m.path} className="lm-item">
              <a href={m.url} target="_blank" rel="noopener">
                {m.type === "video" ? <video src={m.url} muted playsInline preload="metadata" /> : <img src={m.url} alt="" loading="lazy" />}
              </a>
              {m.type === "video" && <span className="tag">VIDEO</span>}
              <button type="button" className="x" onClick={() => remove(m)} aria-label="Remove">×</button>
            </div>
          ))}
          {pending.map(m => (
            <div key={m.key} className="lm-item">
              {m.kind === "video" ? <video src={m.preview} muted playsInline preload="metadata" /> : <img src={m.preview} alt="" />}
              <div className="bar" style={{ width: `${Math.max(6, m.progress * 100)}%` }} />
            </div>
          ))}
        </div>
      )}
      <div className="ld-capture">
        <label>
          Add photos
          <input type="file" accept="image/*" multiple onChange={e => { addFiles(e.target.files, "image"); e.target.value = ""; }} />
        </label>
        <label>
          Add video
          <input type="file" accept="video/*" onChange={e => { addFiles(e.target.files, "video"); e.target.value = ""; }} />
        </label>
      </div>
      <p className="ld-hint">{pending.length ? "Uploading…" : `Shows on their lot page within a minute. Videos: ${MAX_VIDEO_SECONDS} seconds or less.`}</p>
      {err && <div className="ld-err">{err}</div>}
    </div>
  );
}
