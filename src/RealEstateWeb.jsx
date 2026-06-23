import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense, lazy } from "react";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

/* ─────────────── DASHBOARD TABS SUB-COMPONENT ─────────────── */
function DashTabs({ user, allPosts, publishedCount, draftCount, data, canEdit, canCS, isAdmin, setAdminTab, setCmsEditPost, SECTION_LABELS, SECTIONS, formatDate }) {
  // setAdminTab is navigateAdminTab from parent; alias it so inline references resolve
  const navigateAdminTab = setAdminTab;
  const [dashTab, setDashTab] = useState("notifications");
  const tabs = [
    { id: "notifications", label: "Notifikasi" },
    ...(canEdit ? [{ id: "articles", label: "Kelola Artikel" }] : []),
    { id: "stats", label: "Statistik" },
    { id: "guide", label: "Panduan & FAQ" },
  ];
  return (
    <div className="dash-grid">
      {/* Left column */}
      <div>
        <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,.06)", marginBottom: 16 }}>
          <div style={{ display: "flex", borderBottom: "2px solid #FAF7F0" }} className="dash-tab-row">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setDashTab(t.id)}
                style={{ flex: 1, padding: "14px 8px", fontSize: "0.8125rem", fontWeight: dashTab === t.id ? 700 : 500,
                  color: dashTab === t.id ? "#2E3D3F" : "#5A6A6C", background: dashTab === t.id ? "#fff" : "#FDFAF4",
                  border: "none", borderBottom: dashTab === t.id ? "2px solid #2E3D3F" : "2px solid transparent",
                  marginBottom: -2, cursor: "pointer", transition: "all .15s" }}>
                {t.label}
              </button>
            ))}
          </div>

          {dashTab === "notifications" && (
            <div style={{ padding: "8px 0" }}>
              {data.messages.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", color: "#5A6A6C", fontSize: "0.875rem" }}>🔔 Belum ada notifikasi.</div>
              ) : data.messages.slice().reverse().slice(0, 5).map(m => (
                <div key={m.id} style={{ display: "flex", gap: 14, padding: "16px 20px", borderBottom: "1px solid #FAF7F0", alignItems: "flex-start" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: "#FAF7F0", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✉️</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.875rem", color: "#2E3D3F", lineHeight: 1.6, marginBottom: 4 }}>
                      Pesan baru dari <strong>{m.name}</strong> ({m.email}): <em style={{ color: "#3D5254" }}>{m.message?.slice(0, 80)}{m.message?.length > 80 ? "…" : ""}</em>
                    </p>
                    <span style={{ fontSize: "0.75rem", color: "#5A6A6C" }}>{m.date}</span>
                    {!m.read && <span style={{ marginLeft: 8, fontSize: "0.625rem", background: "#e74c3c", color: "#fff", borderRadius: 8, padding: "1px 7px", fontWeight: 700 }}>BARU</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {dashTab === "articles" && canEdit && (
            <div style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#2E3D3F" }}>Artikel Terbaru</span>
                <button onClick={() => { navigateAdminTab("cms"); setCmsEditPost("new"); }}
                  style={{ fontSize: "0.75rem", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", color: "#fff", border: "none", borderRadius: 16, padding: "5px 14px", fontWeight: 600, cursor: "pointer" }}>+ Baru</button>
              </div>
              {allPosts.length === 0 ? (
                <p style={{ fontSize: "0.875rem", color: "#5A6A6C" }}>Belum ada artikel.</p>
              ) : allPosts.slice(-5).reverse().map(p => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #FAF7F0" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: "#FAF7F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                    {(() => { const img = (p.content||[]).find(b=>b.type==="image")?.value; return img ? <img loading="lazy" src={img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>e.target.style.display="none"} /> : "📄"; })()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#2E3D3F", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</p>
                    <span style={{ fontSize: "0.75rem", color: "#5A6A6C" }}>{p.section} · {formatDate(p.date)}</span>
                  </div>
                  <span style={{ fontSize: "0.6875rem", padding: "2px 10px", borderRadius: 10, fontWeight: 600, background: p.status === "published" ? "#e8f8ef" : "#fff8e1", color: p.status === "published" ? "#27ae60" : "#f39c12" }}>
                    {p.status === "published" ? "Tayang" : "Draft"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {dashTab === "stats" && (
            <div style={{ padding: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Total Artikel", value: allPosts.length, icon: "📄", color: "#8B6914" },
                  { label: "Tayang", value: publishedCount, icon: "✅", color: "#27ae60" },
                  { label: "Draft", value: draftCount, icon: "📋", color: "#f39c12" },
                  { label: "Pesan Masuk", value: data.messages.length, icon: "✉️", color: "#8e44ad" },
                ].map(s => (
                  <div key={s.label} style={{ background: "rgba(255,255,255,.1)", borderRadius: 10, padding: "16px 18px", backdropFilter: "blur(6px)", borderLeft: `3px solid ${s.color}` }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: 900, color: s.color, fontFamily: "'Playfair Display',serif" }}>{s.value}</div>
                    <div style={{ fontSize: "0.8125rem", color: "#5A6A6C", marginTop: 2 }}>{s.icon} {s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#FAF7F0", borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#5A6A6C", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10 }}>Distribusi per Seksi</div>
                {["news","shop","destinations"].map(s => {
                  const total = allPosts.length || 1;
                  const count = (data.posts?.[s] || []).length;
                  const pct = Math.round(count / total * 100);
                  return (
                    <div key={s} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: "0.8125rem", color: "#2E3D3F", fontWeight: 600 }}>{SECTION_LABELS[s]}</span>
                        <span style={{ fontSize: "0.8125rem", color: "#5A6A6C" }}>{count}</span>
                      </div>
                      <div style={{ height: 6, background: "#E8DCC8", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "#8B6914", borderRadius: 3, transition: "width .5s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {dashTab === "guide" && (
            <div style={{ padding: "20px" }}>
              {[
                { q: "Bagaimana cara membuat artikel baru?", a: "Klik tombol '✏ Buat Artikel' di dashboard atau masuk ke menu Posts / CMS lalu klik '+ New Post'." },
                { q: "Bagaimana cara mengubah gambar hero?", a: "Masuk ke menu 'Images' di sidebar, lalu klik gambar yang ingin diganti dan masukkan URL baru." },
                { q: "Cara membalas pesan dari pengunjung?", a: "Masuk ke menu 'Messages', buka pesan, lalu klik tombol Reply untuk membalas." },
                { q: "Bagaimana cara mengganti teks di website?", a: "Masuk ke menu 'Site Content' (khusus admin) untuk mengedit semua teks halaman." },
                { q: "Apa perbedaan Draft dan Published?", a: "Draft hanya terlihat di admin panel. Published akan tampil di website untuk pengunjung umum." },
              ].map((faq, i) => (
                <div key={i} style={{ marginBottom: 14, padding: "14px 16px", background: "#FAF7F0", borderRadius: 8, borderLeft: "3px solid #8B6914" }}>
                  <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#2E3D3F", marginBottom: 6 }}>❓ {faq.q}</p>
                  <p style={{ fontSize: "0.8125rem", color: "#3D5254", lineHeight: 1.65 }}>{faq.a}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right column */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Top Kontributor */}
        <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #FAF7F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.125rem", fontWeight: 800, color: "#2E3D3F" }}>Top Kontributor</span>
            <span style={{ fontSize: "0.6875rem", color: "#5A6A6C" }}>Artikel tayang</span>
          </div>
          <div style={{ padding: "8px 0" }}>
            {(() => {
              const authorMap = {};
              allPosts.filter(p => p.status === "published").forEach(p => { authorMap[p.author] = (authorMap[p.author] || 0) + 1; });
              const sorted = Object.entries(authorMap).sort((a,b) => b[1]-a[1]).slice(0, 3);
              const medals = ["🥇","🥈","🥉"];
              if (!sorted.length) return <p style={{ padding: "16px 20px", fontSize: "0.8125rem", color: "#5A6A6C" }}>Belum ada artikel tayang.</p>;
              return sorted.map(([author, count], i) => (
                <div key={author} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", borderBottom: "1px solid #FAF7F0" }}>
                  <span style={{ fontSize: "1.25rem", flexShrink: 0, minWidth: 28 }}>{medals[i]}</span>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 50%,#8B6914 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.875rem", flexShrink: 0 }}>
                    {author.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#2E3D3F" }}>{author}</div>
                    <div style={{ fontSize: "0.75rem", color: "#5A6A6C" }}>Artikel: {count}</div>
                  </div>
                  {author === user.username && <span style={{ fontSize: "0.625rem", background: "#e8f8ef", color: "#27ae60", borderRadius: 8, padding: "2px 7px", fontWeight: 700 }}>YOU</span>}
                </div>
              ));
            })()}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", background: "#FAF7F0" }}>
              <span style={{ fontSize: "1.25rem", minWidth: 28 }}>—</span>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#3D5254,#C9AA71)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.875rem", flexShrink: 0 }}>
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#2E3D3F" }}>You ({user.username})</div>
                <div style={{ fontSize: "0.75rem", color: "#5A6A6C" }}>Artikel: {allPosts.filter(p => p.author === user.username && p.status === "published").length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Akses Cepat */}
        <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #FAF7F0" }}>
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.125rem", fontWeight: 800, color: "#2E3D3F" }}>Akses Cepat</span>
          </div>
          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              ...(canEdit ? [{ label: "✏ Buat Artikel Baru", action: () => { navigateAdminTab("cms"); setCmsEditPost("new"); } }] : []),
              ...(canCS ? [{ label: `✉ Pesan (${data.messages.length})`, action: () => setAdminTab("messages") }] : []),
              ...(isAdmin ? [{ label: "🖼 Kelola Gambar", action: () => setAdminTab("images") }] : []),
              ...(isAdmin ? [{ label: "🔤 Konten Website", action: () => setAdminTab("content") }] : []),
              ...(isAdmin ? [{ label: "⚙ Pengaturan", action: () => setAdminTab("settings") }] : []),
            ].map(item => (
              <button key={item.label} onClick={item.action}
                style={{ textAlign: "left", padding: "9px 12px", background: "#FAF7F0", border: "none", borderRadius: 7, fontSize: "0.8125rem", color: "#2E3D3F", fontWeight: 500, cursor: "pointer", transition: "background .15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#E8DCC8"}
                onMouseLeave={e => e.currentTarget.style.background = "#FAF7F0"}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── CONSTANTS ─────────────── */
const ROLES = {
  admin: { label: "Administrator", color: "#e74c3c" },
  content_writer: { label: "Content Writer", color: "#3498db" },
  customer_services: { label: "Customer Services", color: "#27ae60" },
};

const HARDCODED_USERS = [
  { username: "administrator", password: import.meta.env.VITE_ADMIN_PASSWORD     || "admin123",  role: "admin",             name: "Administrator", phone: "", email: "", desc: "", photo: "" },
  { username: "writer1",       password: import.meta.env.VITE_WRITER_PASSWORD    || "writer123", role: "content_writer",    name: "Writer 1",      phone: "", email: "", desc: "", photo: "" },
  { username: "cs1",           password: import.meta.env.VITE_CS_PASSWORD        || "cs123",     role: "customer_services", name: "CS 1",          phone: "", email: "", desc: "", photo: "" },
];

/* ─── Firebase Config ─── */

const firebaseConfig = {
  apiKey:            "AIzaSyCfBcu5pQbrt5NPex6d2PhNyQIta5tE21M",
  authDomain:        "vasturagroup-9ed0e.firebaseapp.com",
  projectId:         "vasturagroup-9ed0e",
  storageBucket:     "vasturagroup-9ed0e.firebasestorage.app",
  messagingSenderId: "973491258131",
  appId:             "1:973491258131:web:8f05c0732a5c44947050e6",
  measurementId:     "G-E63BYG2GGJ",
};

const _fbApp    = initializeApp(firebaseConfig);
const _analytics = getAnalytics(_fbApp);
const _db       = getFirestore(_fbApp);

const FS_COLLECTION = import.meta.env.VITE_FS_COLLECTION || "vasturagroup";

/* ── Firestore helpers ── */
async function fsGet(docId) {
  try {
    const snap = await getDoc(doc(_db, FS_COLLECTION, docId));
    return snap.exists() ? snap.data() : null;
  } catch { return null; }
}
async function fsSet(docId, payload) {
  try { await setDoc(doc(_db, FS_COLLECTION, docId), payload); } catch {}
}

/* ─── Cloudinary Config ─── */
const CLOUDINARY = {
  cloudName:    "dum9j7yn1",
  uploadPreset: "vastura_clouds",
};

async function uploadToCloudinary(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY.uploadPreset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`, {
    method: "POST", body: fd,
  });
  if (!res.ok) throw new Error("Upload gagal");
  const data = await res.json();
  return data.secure_url;
}

/* ─────────────── FORMAT RUPIAH GLOBAL ─────────────── */
/**
 * Format angka menjadi string Rupiah: 500000 → "Rp 500.000"
 * Jika sudah mengandung "Rp" atau "Hubungi", kembalikan apa adanya.
 */
function formatRp(val) {
  if (!val && val !== 0) return "";
  const str = String(val);
  if (str.toLowerCase().includes("hubungi") || str.toLowerCase().includes("nego")) return str;
  if (str.startsWith("Rp") || str.startsWith("rp")) return str; // sudah diformat
  const num = Number(str.replace(/[^0-9]/g, ""));
  if (isNaN(num) || num === 0) return str;
  return "Rp " + num.toLocaleString("id-ID");
}

/* ─────────────── SHARED UPLOAD HELPERS ─────────────── */
/**
 * Upload satu file ke Cloudinary dengan progress nyata via XHR.
 * @param {File} file
 * @param {(pct: number) => void} onProgress  — dipanggil 0–100
 * @returns {Promise<string>} secure_url
 */
function uploadWithProgress(file, onProgress) {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", CLOUDINARY.uploadPreset);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`);
    xhr.upload.addEventListener("progress", e => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText).secure_url); }
        catch { reject(new Error("Parse error")); }
      } else { reject(new Error("Upload gagal")); }
    });
    xhr.addEventListener("error", () => reject(new Error("Network error")));
    xhr.send(fd);
  });
}

/**
 * GalleryImageTile — thumbnail gambar galeri dengan tombol URL & Upload + progress bar inline.
 */
function GalleryImageTile({ src, onUrlEdit, onUploaded, onError }) {
  const [item, setItem] = useState(null); // {name, pct, done, error} | null
  const inputRef = useRef();

  const handleChange = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setItem({ name: file.name, pct: 0, done: false, error: false });
    try {
      const url = await uploadWithProgress(file, pct => setItem(p => ({ ...p, pct })));
      setItem({ name: file.name, pct: 100, done: true, error: false });
      if (onUploaded) onUploaded(url);
      setTimeout(() => { setItem(null); if (inputRef.current) inputRef.current.value = ""; }, 2200);
    } catch {
      setItem(p => ({ ...p, error: true }));
      if (onError) onError();
      setTimeout(() => { setItem(null); if (inputRef.current) inputRef.current.value = ""; }, 2200);
    }
  };

  const isUploading = item && !item.done && !item.error;

  return (
    <div style={{ width: 140 }}>
      <div style={{ position: "relative" }}>
        <img loading="lazy" src={src} alt="" style={{ width: 140, height: 95, objectFit: "cover", borderRadius: 6, display: "block",
          opacity: isUploading ? 0.5 : 1, transition: "opacity .2s" }} />
        {isUploading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(139,105,20,.12)", borderRadius: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#8B6914" }}>{item.pct}%</span>
          </div>
        )}
      </div>
      {/* Progress bar — muncul saat upload */}
      {item && (
        <div style={{ marginTop: 4 }}>
          <div style={{ height: 5, background: "#E8DCC8", borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 3, transition: "width .2s ease",
              width: `${item.pct}%`,
              background: item.error ? "#e74c3c" : item.done ? "#27ae60" : "linear-gradient(90deg,#8B6914,#E8C96A)"
            }} />
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: item.error ? "#e74c3c" : item.done ? "#27ae60" : "#8B6914",
            textAlign: "right", marginTop: 2 }}>
            {item.error ? "❌ Gagal" : item.done ? "✅ Selesai" : `📤 ${item.pct}%`}
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 3, marginTop: 5 }}>
        <button onClick={onUrlEdit} style={{
          flex: 1, background: "#FAF7F0", color: "#C9AA71",
          border: "1px solid #D4C4A0", borderRadius: 4, padding: "4px 0", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>🔗 URL</button>
        <label style={{
          flex: 1, background: isUploading ? "#e0f7ff" : "#eeffee",
          color: isUploading ? "#5A6A6C" : "#27ae60",
          border: "1px solid #D4C4A0", borderRadius: 4, padding: "4px 0", fontSize: 10, fontWeight: 600,
          cursor: isUploading ? "not-allowed" : "pointer", textAlign: "center", display: "block",
          pointerEvents: isUploading ? "none" : "auto" }}>
          {isUploading ? "⏳..." : "⬆ Upload"}
          <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleChange} disabled={isUploading} />
        </label>
      </div>
    </div>
  );
}

/**
 * UploadButton — tombol upload foto dengan progress bar inline.
 * Props:
 *   accept        string   (default "image/*")
 *   multiple      bool
 *   label         string   (teks tombol)
 *   onDone        (urls: string[]) => void
 *   onError       (msg: string) => void
 *   style         object   (override style tombol/label)
 *   dropZone      bool     (tampilkan sebagai drop zone besar)
 */
function UploadButton({ accept = "image/*", multiple = false, label = "📁 Upload Gambar", onDone, onError, style: styleProp = {}, dropZone = false }) {
  const [items, setItems] = useState([]); // [{name, pct, done, error}]
  const inputRef = useRef();
  const isUploading = items.some(it => !it.done && !it.error);

  const handleFiles = async (files) => {
    if (!files.length) return;
    const init = files.map(f => ({ name: f.name, pct: 0, done: false, error: false }));
    setItems(init);
    const results = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const url = await uploadWithProgress(files[i], pct => {
          setItems(prev => prev.map((it, idx) => idx === i ? { ...it, pct } : it));
        });
        setItems(prev => prev.map((it, idx) => idx === i ? { ...it, pct: 100, done: true } : it));
        results.push({ url, error: false });
      } catch {
        setItems(prev => prev.map((it, idx) => idx === i ? { ...it, error: true } : it));
        results.push({ url: null, error: true });
      }
    }
    const urls = results.filter(r => r.url).map(r => r.url);
    const errCount = results.filter(r => r.error).length;
    if (urls.length && onDone) onDone(urls);
    if (errCount && onError) onError(`${errCount} file gagal diupload.`);
    setTimeout(() => { setItems([]); if (inputRef.current) inputRef.current.value = ""; }, 2500);
  };

  const onChange = (e) => handleFiles(Array.from(e.target.files || []));

  const progressArea = items.length > 0 && (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((it, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: it.error ? "#e74c3c" : "#2E3D3F", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {it.error ? "❌ " : it.done ? "✅ " : "📤 "}{it.name}
            </span>
            <span style={{ fontSize: 11, fontWeight: 800, color: it.error ? "#e74c3c" : it.done ? "#27ae60" : "#8B6914" }}>
              {it.error ? "Gagal" : it.done ? "Selesai" : `${it.pct}%`}
            </span>
          </div>
          <div style={{ height: 6, background: "#E8DCC8", borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 3,
              width: `${it.pct}%`,
              background: it.error ? "#e74c3c" : it.done ? "#27ae60" : "linear-gradient(90deg,#8B6914,#E8C96A)",
              transition: "width .2s ease"
            }} />
          </div>
        </div>
      ))}
    </div>
  );

  if (dropZone) return (
    <div>
      <label style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 8, padding: "22px 16px", border: "2px dashed #C9AA71", borderRadius: 10,
        background: isUploading ? "#e0f7ff" : "#f0fafe", cursor: isUploading ? "not-allowed" : "pointer",
        transition: "background .15s", pointerEvents: isUploading ? "none" : "auto",
        ...styleProp
      }}
        onMouseEnter={e => { if (!isUploading) e.currentTarget.style.background = "#daf4fb"; }}
        onMouseLeave={e => { if (!isUploading) e.currentTarget.style.background = "#f0fafe"; }}>
        <span style={{ fontSize: 28 }}>{isUploading ? "⏳" : "🖼️"}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#8B6914" }}>{isUploading ? "Sedang mengupload..." : label}</span>
        <span style={{ fontSize: 11, color: "#5A6A6C" }}>JPG, PNG, WEBP</span>
        <input ref={inputRef} type="file" accept={accept} multiple={multiple} onChange={onChange} style={{ display: "none" }} disabled={isUploading} />
      </label>
      {progressArea}
    </div>
  );

  return (
    <div>
      <label style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        padding: "9px 14px", border: "1.5px dashed #C9AA71", borderRadius: 8,
        background: isUploading ? "#e0f7ff" : "#FAF7F0", cursor: isUploading ? "not-allowed" : "pointer",
        fontSize: 12, fontWeight: 600, color: isUploading ? "#5A6A6C" : "#C9AA71",
        pointerEvents: isUploading ? "none" : "auto",
        ...styleProp
      }}>
        {isUploading ? "⏳ Mengupload..." : label}
        <input ref={inputRef} type="file" accept={accept} multiple={multiple} onChange={onChange} style={{ display: "none" }} disabled={isUploading} />
      </label>
      {progressArea}
    </div>
  );
}

/* ─── EmailJS Config ─── */
const EJS = {
  publicKey:  "GepGzvwHLN7YwXXpF",
  serviceId:  "service_vastura",
  templateId: "template_otp_vastura",
};

/* Generate 6-digit OTP */
const genOTP = () => String(Math.floor(100000 + Math.random() * 900000));

/* Send OTP via EmailJS REST (no SDK needed) */
async function sendOTPEmail(toEmail, passcode) {
  const expireTime = new Date(Date.now() + 15 * 60 * 1000)
    .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id:  EJS.serviceId,
      template_id: EJS.templateId,
      user_id:     EJS.publicKey,
      template_params: {
        email:    toEmail,
        passcode,
        time:     expireTime,
      },
    }),
  });
  if (!res.ok) throw new Error(await res.text());
}

const SECTIONS = ["news", "shop", "destinations"];

const SECTION_LABELS = {
  news: "Program Affiliate",
  shop: "Gedung & Rumah",
  destinations: "Interior",
};

const DEFAULT_POSTS = {
  news: [
    {
      id: 1, section: "news", status: "published",
      title: "Spa & Wellness di Ubud: Surga Tersembunyi Bali",
      date: "2026-04-03", author: "writer1", category: "Lifestyle",
      coverImage: "",
      excerpt: "Rasakan ketenangan sejati di resort spa premium Ubud yang menyatu dengan alam Bali.",
      content: [
        { type: "paragraph", value: "Ubud, jantung seni dan budaya Bali, telah lama menjadi surga bagi mereka yang mencari kedamaian jiwa dan raga. Dikelilingi hamparan sawah terasering hijau dan hutan tropis yang rindang, Ubud menawarkan pengalaman spa yang benar-benar menyatu dengan alam." },
        { type: "paragraph", value: "Dari pijat batu vulkanik khas Bali hingga ritual penyembuhan tradisional Melukat, setiap treatment dirancang untuk memulihkan tubuh dan menenangkan pikiran setelah perjalanan panjang." },
        { type: "image", value: "", caption: "Ritual penyembuhan tradisional Bali di Ubud" },
        { type: "paragraph", value: "Nikmati sesi yoga di tepi sawah saat fajar, atau manjakan diri dengan lulur beras Bali yang legendaris. Ubud adalah pengalaman yang tidak akan terlupakan." },
      ],
      tags: ["spa", "bali", "wellness", "ubud"],
    },
    {
      id: 2, section: "news", status: "published",
      title: "Pantai Tersembunyi di Raja Ampat yang Memukau",
      date: "2026-04-10", author: "writer1", category: "Beach",
      coverImage: "",
      excerpt: "Jelajahi pantai-pantai tersembunyi Raja Ampat dengan air sejernih kristal dan terumbu karang yang menakjubkan.",
      content: [
        { type: "paragraph", value: "Raja Ampat, permata tersembunyi di ujung timur Indonesia, menyimpan ribuan pulau kecil dengan pantai berpasir putih yang belum banyak terjamah. Perjalanan menuju pantai-pantai ini memang membutuhkan usaha ekstra, namun hasilnya sebanding dengan setiap tetes keringat." },
        { type: "paragraph", value: "Di bawah permukaan laut Raja Ampat, dunia yang sama mengagumkannya menanti. Keanekaragaman hayati laut di sini adalah yang tertinggi di dunia — ribuan spesies ikan, pari manta, dan terumbu karang warna-warni." },
        { type: "image", value: "", caption: "Gugusan pulau Raja Ampat dari ketinggian" },
      ],
      tags: ["raja ampat", "pantai", "diving", "papua"],
    },
    {
      id: 3, section: "news", status: "published",
      title: "Kenangan Tak Terlupakan Bersama VASTURA GROUP",
      date: "2026-04-15", author: "writer1", category: "Experience",
      coverImage: "",
      excerpt: "Setiap perjalanan bersama VASTURA adalah cerita yang akan selalu dikenang.",
      content: [
        { type: "paragraph", value: "Perjalanan bukan sekadar soal destinasi — melainkan tentang momen yang membuat hati terasa penuh. Saat matahari terbenam di Pura Tanah Lot, saat pertama kali menginjakkan kaki di hamparan sawah Tegalalang, atau saat tawa riang di tengah petualangan bersama orang-orang tersayang." },
        { type: "paragraph", value: "Bersama VASTURA GROUP, setiap detail perjalanan Anda direncanakan dengan penuh perhatian. Kami percaya bahwa kenangan terbaik lahir dari pengalaman yang dirancang dengan hati." },
      ],
      tags: ["kenangan", "vastura", "wisata", "bali"],
    },
  ],
  shop: [
    {
      id: 10, section: "shop", status: "published",
      title: "Paket Perlengkapan Wisata Nusantara — Seri Explorer",
      date: "2026-03-20", author: "writer1", category: "Perlengkapan",
      coverImage: "",
      excerpt: "Perlengkapan wisata terbaik untuk menjelajahi keindahan nusantara dari Bromo hingga Raja Ampat.",
      badge: "Terlaris",
      content: [
        { type: "paragraph", value: "Dirancang khusus untuk petualang nusantara, paket perlengkapan Seri Explorer menghadirkan kenyamanan dan ketahanan dalam satu bundel praktis. Cocok untuk perjalanan ke pegunungan Bromo, pantai Raja Ampat, maupun hutan Kalimantan." },
        { type: "paragraph", value: "Isi paket: tas ransel 40L waterproof, poncho hujan, sandal gunung, serta peta destinasi unggulan Indonesia. Semua dikemas dalam satu tas yang ringkas dan stylish." },
      ],
      tags: ["perlengkapan", "wisata", "nusantara", "hiking"],
    },
    {
      id: 11, section: "shop", status: "published",
      title: "Kamera Dokumentasi Perjalanan — Edisi Nusantara",
      date: "2026-03-25", author: "writer1", category: "Fotografi",
      coverImage: "",
      excerpt: "Abadikan setiap momen perjalanan Anda dengan sempurna, dari puncak Rinjani hingga kedalaman laut Bunaken.",
      content: [
        { type: "paragraph", value: "Setiap sudut Indonesia layak diabadikan — dari kemegahan Candi Borobudur yang misterius hingga kecantikan bawah laut Bunaken yang tiada duanya. Dengan kamera yang tepat, setiap momen menjadi karya yang bisa dinikmati selamanya." },
      ],
      tags: ["fotografi", "kamera", "wisata", "nusantara"],
    },
  ],
  destinations: [
    {
      id: 20, section: "destinations", status: "published",
      title: "Taman Nasional Komodo — Warisan Dunia Indonesia",
      date: "2026-02-10", author: "writer1", category: "Alam",
      coverImage: "",
      excerpt: "Rumah bagi komodo legendaris dan surga diving kelas dunia di jantung Nusa Tenggara Timur.",
      content: [
        { type: "paragraph", value: "Taman Nasional Komodo adalah salah satu destinasi paling dramatis di Indonesia. Lanskap vulkanik yang kasar menjadi rumah bagi kadal terbesar di dunia — Komodo (Varanus komodoensis) — yang hanya bisa ditemukan di sini." },
        { type: "paragraph", value: "Di bawah permukaannya, perairan Komodo tak kalah spektakuler. Para penyelam akan bertemu manta raya raksasa, hiu, dan taman karang warna-warni yang menjadi salah satu terbaik di dunia." },
        { type: "image", value: "", caption: "Pink Beach Komodo yang ikonik" },
        { type: "paragraph", value: "Waktu terbaik berkunjung: April–Desember saat laut tenang. Paket liveaboard diving sangat direkomendasikan untuk pengalaman penuh." },
      ],
      tags: ["komodo", "ntt", "diving", "alam"],
    },
    {
      id: 21, section: "destinations", status: "published",
      title: "Gunung Bromo — Negeri di Atas Awan Jawa Timur",
      date: "2026-02-20", author: "writer1", category: "Alam",
      coverImage: "",
      excerpt: "Saksikan keajaiban matahari terbit di Gunung Bromo — pengalaman paling ikonik di Jawa Timur.",
      content: [
        { type: "paragraph", value: "Tidak ada banyak pemandangan yang bisa menandingi keindahan matahari terbit di Gunung Bromo. Lautan pasir seluas 5.250 hektare, kepulan asap kawah, dan siluet Semeru di kejauhan menciptakan panorama yang terasa seperti dari planet lain." },
        { type: "paragraph", value: "Taman Nasional Bromo Tengger Semeru menawarkan berbagai aktivitas: jeep tour melintasi lautan pasir, trekking ke bibir kawah, hingga menyaksikan upacara Yadnya Kasada yang sakral dari suku Tengger." },
      ],
      tags: ["bromo", "jawa timur", "gunung", "alam"],
    },
  ],
};

const DEFAULT_DATA = {
  images: {
    hero: [
      "",
      "",
      "",
      "",
    ],
    adv: [
      "",
      "",
    ],
    gal: [
      "",
      "",
      "",
      "",
      "",
      "",
    ],
  },
  content: {
    heroTitle: "Developer Perumahan & Jasa Desain",
    heroSub: "Kami hadir sebagai mitra terpercaya untuk mewujudkan hunian impian Anda — desain, RAB, interior, hingga landscape. Profesional, berkualitas, dan tepat waktu.",
    advTitle: "Wujudkan Hunian Impian Anda",
    advSub: "DEVELOPER & JASA PERUMAHAN",
    advQuote: '"We live in a wonderful world that is full of beauty, charm and adventure. There is no end to the adventures that we can have if only we seek them with our eyes open." — Jawaharlal Nehru',
    newAdvTitle: "Proyek Terbaru Kami",
    newAdvSub: "Temukan portofolio terkini — hunian berkualitas yang telah kami bangun dan rancang bersama klien.",
    bookTitle: "Konsultasikan Proyek Anda",
    bookSub: "Tim ahli kami siap membantu dari perencanaan hingga serah terima kunci — gratis konsultasi pertama.",
    newsletterTitle: "Dapatkan Update Proyek & Promo Terbaru",
    foundingYear: "2026",
    aboutText: "VASTURA GROUP adalah developer perumahan dan penyedia jasa desain terpercaya sejak 2026. Kami membangun hunian impian dengan standar kualitas tinggi dan harga transparan.",
    contactText: "Hubungi kami untuk konsultasi gratis. Tim VASTURA GROUP siap membantu mewujudkan hunian impian Anda — dari desain, RAB, interior, pagar, kanopi, hingga landscape.",
    aboutHeroLabel: "About Us",
    aboutHeroTitle: "Membangun Hunian, Mewujudkan Impian",
    aboutHeroSub: "VASTURA GROUP adalah developer perumahan dan jasa desain terpercaya. Kami berkomitmen menghadirkan hunian berkualitas dengan layanan lengkap dari desain hingga finishing.",
    aboutWhyTitle: "Why Choose Us",
    aboutV1Icon: "🏠", aboutV1Title: "Desain Profesional", aboutV1Desc: "Tim arsitek & desainer interior berpengalaman untuk setiap proyek.",
    aboutV2Icon: "🛡",  aboutV2Title: "Terpercaya & Legal", aboutV2Desc: "Semua proyek dilaksanakan sesuai perizinan dan standar konstruksi yang berlaku.",
    aboutV3Icon: "⚡", aboutV3Title: "Tepat Waktu",        aboutV3Desc: "Komitmen penyelesaian proyek sesuai timeline yang disepakati.",
    aboutV4Icon: "⭐", aboutV4Title: "Harga Transparan",   aboutV4Desc: "RAB detail dan transparan — tidak ada biaya tersembunyi dalam setiap proyek.",
    aboutContactTitle: "Get in Touch",
    aboutContactSub: "We'd love to help plan your next event.",
    email:   "heldanwidianata@gmail.com",
    phone:   "+62 812-3327-5485",
    address: "Perumahan Puri Mangundikaran, Blok B5 No.21, Kel. Mangundikaran, Kec. Nganjuk, Kab. Nganjuk",
    hours: "Senin – Sabtu: 08.00 – 20.00 WIB",
    waAdmins: [
      { id: 1, name: "Heldan Widiananta", jabatan: "Chief Executive Officer", wa: "https://wa.me/6282140294820", primary: true },
      { id: 2, name: "Fredy", jabatan: "Admin", wa: "https://wa.me/6281233275485", primary: false },
    ],
    waLink: "https://wa.me/6282140294820",
    igLink: "https://instagram.com/vastura_group",
    fbLink: "https://facebook.com/vastura_group",
    logoText: "VASTURA\nGROUP",
    logoImage: "",
    footerLogoImage: "",
    logoSingleLine: false,
    logoFont: "Playfair Display",
    logoColor: "#111111",
    logoShadow: "0 1px 6px rgba(0,0,0,.35), 0 2px 14px rgba(0,0,0,.18)",
    loginBtnText: "LOGIN",
    nav1: "Home", nav2: "About", nav3: "Program Affiliate", nav4: "Rumah Subsidi", nav5: "Interior", nav6: "Layanan Kami",
    nav7: "Jasa Desain & RAB", nav8: "Tema Rumah",
    nav9: "Interior", nav10: "Pagar Rumah", nav11: "Kanopi", nav12: "Aluminium", nav13: "Landscape & Taman",
    servicesPageTitle: "Paket Layanan Kami",
    servicesPageSub: "Pilih paket yang sesuai dengan kebutuhan Anda. Setiap paket dirancang untuk memberikan pengalaman terbaik bersama VASTURA GROUP.",
    waTemplates: {
      umum:       "Halo VASTURA GROUP! 👋\n\nSaya ingin mengetahui lebih lanjut tentang layanan Anda.\n\nTerima kasih!",
      paket:      "Halo VASTURA GROUP! 👋\n\nSaya tertarik dengan paket:\n*{judul_paket}*\n\nBisakah saya mendapatkan informasi lebih lanjut?\n\nTerima kasih!",
      konsultasi: "Halo VASTURA GROUP! 👋\n\nSaya ingin konsultasi mengenai proyek properti saya.\n\nMohon bantuannya. Terima kasih!",
      desainrab:  "Halo VASTURA GROUP! 👋\n\nSaya tertarik dengan jasa *Desain & RAB*:\n*{judul_paket}*\n\nBoleh saya konsultasi lebih lanjut?\n\nTerima kasih!",
      layanan:    "Halo VASTURA GROUP! 👋\n\nSaya ingin bertanya tentang layanan:\n*{judul_layanan}*\n\nMohon informasinya. Terima kasih!",
    },
  },
  posts: DEFAULT_POSTS,
  cats: ["Experience Thailand", "Best Adventures", "Sea & Beach", "Hiking Tours", "Kayaking Tours", "Winter Destinations"],
  messages: [],
  reviews: [],
  reviewTokens: [],
  services: [
    /* ── EVENT PLAN (3 paket) ── */
    {
      id: 1,
      category: "event",
      title: "Paket Event Starter",
      badge: "Terjangkau",
      badgeColor: "#27ae60",
      price: "Rp 3.500.000",
      priceNote: "/ event",
      images: [],
      image: "",
      description: "Paket event entry-level ideal untuk seminar, gathering kecil, atau peluncuran produk dengan kapasitas hingga 100 tamu. Semua kebutuhan dasar sudah tercakup.",
      features: [
        "Konsultasi event 1x pertemuan",
        "Dekorasi standar",
        "Dokumentasi foto (3 jam)",
        "Koordinasi 3 vendor",
        "Rundown & timeline acara",
        "MC profesional",
        "Kapasitas hingga 100 tamu",
      ],
      highlight: false,
    },
    {
      id: 2,
      category: "event",
      title: "Paket Event Profesional",
      badge: "Populer",
      badgeColor: "#8B6914",
      price: "Rp 12.500.000",
      priceNote: "/ event",
      images: [],
      image: "",
      description: "Paket lengkap untuk corporate event, seminar nasional, team building, dan peluncuran brand. Cocok untuk 100–300 tamu dengan layanan penuh hari H.",
      features: [
        "Konsultasi event tak terbatas",
        "Dekorasi tematik custom",
        "Dokumentasi foto & video (full day)",
        "Koordinasi 8 vendor",
        "Sound system & lighting profesional",
        "MC bilingual",
        "Coffee break & makan siang",
        "Kapasitas 100–300 tamu",
      ],
      highlight: true,
    },
    {
      id: 3,
      category: "event",
      title: "Paket Gala Dinner & Award Night",
      badge: "Premium",
      badgeColor: "#c0392b",
      price: "Rp 35.000.000",
      priceNote: "/ event",
      images: [],
      image: "",
      description: "Malam penghargaan perusahaan dengan nuansa ballroom mewah, red carpet, dan entertainment eksklusif. Dirancang untuk kesan tak terlupakan bagi 200–500 tamu undangan.",
      features: [
        "Dekorasi ballroom premium",
        "Sound & lighting sinematik",
        "MC bilingual & berpengalaman",
        "Catering fine dining 300 pax",
        "Live music & entertainment",
        "Dokumentasi foto & video sinematik",
        "Red carpet & photo booth",
        "Event manager penuh hari H",
      ],
      highlight: false,
    },

    /* ── TRAVELING (4 paket — Bali, Jogja, Solo, Custom) ── */
    {
      id: 4,
      category: "traveling",
      pkgId: "bali",
      title: "Paket Bali",
      tagline: "Surga Budaya & Alam Nusantara",
      badge: "PALING POPULER",
      badgeColor: "#e8a020",
      accent: "#e8a020",
      accentLight: "#fff8e6",
      duration: "4 Hari 3 Malam",
      minPeserta: "30",
      price: "520000",
      priceNote: "/ orang (mulai)",
      images: [],
      image: "",
      description: "Paket karyawisata ke Bali — Tanah Lot, Ubud, GWK, Uluwatu & Bedugul. Hotel bintang 3–4, konsumsi 3x sehari, tour leader & dokumentasi profesional.",
      features: ["Hotel Bintang 3–4", "Konsumsi 3x Sehari", "Dokumentasi Foto", "Tour Leader", "Tiket Masuk Destinasi", "Asuransi Jiwa", "ID Card & Buku Panduan"],
      highlight: true,
      facilities: [
        { icon: "🏨", label: "Hotel Bintang 3–4", detail: "Kamar twin sharing ber-AC" },
        { icon: "🍽", label: "Konsumsi 3x Sehari", detail: "Sarapan, makan siang, makan malam" },
        { icon: "📸", label: "Dokumentasi Foto", detail: "Fotografer profesional sepanjang tour" },
        { icon: "👨‍💼", label: "Tour Leader", detail: "Pendamping berpengalaman" },
        { icon: "🎫", label: "Tiket Masuk", detail: "Semua destinasi dalam itinerary" },
        { icon: "💊", label: "P3K Lengkap", detail: "Kotak P3K di setiap kendaraan" },
        { icon: "🛡", label: "Asuransi Jiwa", detail: "Seluruh peserta tercover" },
        { icon: "💧", label: "Air Mineral", detail: "Gratis sepanjang perjalanan" },
      ],
      services: [
        "Koordinasi langsung dengan pihak sekolah",
        "Itinerary custom sesuai kurikulum sekolah",
        "Pemandu lokal bersertifikat di tiap destinasi",
        "ID card & buku panduan peserta",
        "Laporan perjalanan & absensi harian",
        "Snack 2x selama di kendaraan",
        "Free program tambahan (opsional)",
      ],
      destinations: [
        { no: "01", name: "Tanah Lot", sub: "Tabanan, Bali", tag: "Pura Hindu · Keindahan Alam", title: "Pura Megah di Atas Batu Karang Laut", desc: "Tanah Lot adalah ikon Bali yang paling terkenal. Pura Hindu ini berdiri kokoh di atas batu karang di tengah laut. Saat sunset, pemandangannya luar biasa indah dan menjadi momen yang tidak terlupakan.", points: ["Pura ikonik di atas batu karang", "Sunset paling populer di Bali", "Pertunjukan Tari Kecak (opsional)", "Pasar seni & kerajinan khas Bali"], duration: "2–3 jam", img: "" },
        { no: "02", name: "Ubud & Tegalalang", sub: "Gianyar, Bali", tag: "Alam & Seni · Pusat Budaya Bali", title: "Jantung Seni dan Alam Bali", desc: "Ubud adalah jantung seni Bali — dari sawah terasering Tegalalang yang memukau hingga Monkey Forest yang seru. Siswa bisa belajar tentang ekosistem pertanian tradisional Bali.", points: ["Tegalalang Rice Terrace ikonik", "Sacred Monkey Forest Sanctuary", "Museum Puri Lukisan", "Belanja di Pasar Ubud & workshop ukiran"], duration: "3–4 jam", img: "" },
        { no: "03", name: "GWK & Pantai Kuta", sub: "Badung, Bali", tag: "Budaya Hindu · Pantai Ikonik", title: "Garuda Wisnu Kencana & Pasir Putih Kuta", desc: "Garuda Wisnu Kencana (GWK) adalah taman budaya megah dengan patung setinggi 121 meter. Dilanjutkan ke Pantai Kuta yang legendaris untuk kegiatan bebas dan foto bersama.", points: ["Patung GWK tertinggi di Indonesia", "Pertunjukan tari budaya Bali", "Pantai Kuta pasir putih ikonik", "Free time foto & bermain di tepi pantai"], duration: "3–4 jam", img: "" },
        { no: "04", name: "Uluwatu", sub: "Badung, Bali", tag: "Spiritual · Tebing & Samudra", title: "Pura Tebing Karang Selatan Bali", desc: "Pura Luhur Uluwatu berdiri megah di tepi tebing karang setinggi 70 meter di atas Samudra Hindia. Salah satu pura sad kahyangan di Bali yang wajib dikunjungi.", points: ["Pura di tepi tebing 70 meter", "Pemandangan Samudra Hindia", "Kecak Fire Dance saat sunset", "Konservasi monyet ekor panjang"], duration: "2–3 jam", img: "" },
        { no: "05", name: "Bedugul & Danau Beratan", sub: "Tabanan, Bali", tag: "Alam Pegunungan · Danau Vulkanik", title: "Pura Ulun Danu di Tengah Danau", desc: "Bedugul menawarkan udara sejuk pegunungan dengan pemandangan Danau Beratan yang menakjubkan. Pura Ulun Danu Beratan yang mengapung di atas danau adalah ikon paling ikonik Bali.", points: ["Pura Ulun Danu Beratan ikonik", "Kebun Raya Bedugul 157 ha", "Strawberry farm & pasar buah lokal", "Udara sejuk 18–22°C, 1.239 mdpl"], duration: "2–3 jam", img: "" },
      ],
      paketTypes: [
        { id: "pt-a", name: "Paket A", price: "520.000", priceNote: "/ orang (mulai)", points: ["Full AC Double Blower","Sleeper / Reclining seat","TV LCD + Audio System","Toilet dalam bus","USB charging per kursi","Snack 2x perjalanan"] },
        { id: "pt-b", name: "Paket B", price: "590.000", priceNote: "/ orang (mulai)", points: ["Full AC Split","Monitor + Speaker","Kursi empuk & nyaman","Power inverter 12V","Air mineral gratis","Bagasi atas & bawah"] },
        { id: "pt-c", name: "Paket C", price: "720.000", priceNote: "/ orang (mulai)", points: ["AC Dual Zone","Captain seat","Bluetooth Audio","USB-A & USB-C","Air mineral gratis","GPS navigasi"] },
        { id: "pt-d", name: "Paket D", price: "290.000", priceNote: "/ orang (mulai)", points: ["Terbuka / angin alami","Bangku kayu + pegangan","Terpal pelindung","Air mineral gratis","Rute lokal / pendek","Paling ekonomis"] }
      ],
      utamaTipeId: "pt-a",
    },
    {
      id: 5,
      category: "traveling",
      pkgId: "jogja",
      title: "Paket Yogyakarta",
      tagline: "Kota Budaya, Sejarah & Pendidikan",
      badge: "",
      badgeColor: "#0d9e8a",
      accent: "#0d9e8a",
      accentLight: "#e0f7f4",
      duration: "3 Hari 2 Malam",
      minPeserta: "25",
      price: "Rp 285.000",
      priceNote: "/ orang (mulai)",
      images: [],
      image: "",
      description: "Paket karyawisata edukatif ke Yogyakarta — Borobudur, Prambanan, Malioboro & Keraton. Hotel bintang 2–3, konsumsi 3x, pemandu lokal bersertifikat.",
      features: ["Hotel Bintang 2–3", "Konsumsi 3x Sehari (incl. Gudeg)", "Dokumentasi Foto", "Tour Leader", "Tiket Masuk Destinasi", "Asuransi Jiwa", "Workshop Batik Opsional"],
      highlight: false,
      facilities: [
        { icon: "🏨", label: "Hotel Bintang 2–3", detail: "Kamar twin sharing ber-AC" },
        { icon: "🍽", label: "Konsumsi 3x Sehari", detail: "Termasuk gudeg khas Jogja" },
        { icon: "📸", label: "Dokumentasi Foto", detail: "Fotografer profesional" },
        { icon: "👨‍💼", label: "Tour Leader", detail: "Pendamping berpengalaman" },
        { icon: "🎫", label: "Tiket Masuk", detail: "Semua destinasi dalam itinerary" },
        { icon: "💊", label: "P3K Lengkap", detail: "Kotak P3K di kendaraan" },
        { icon: "🛡", label: "Asuransi Jiwa", detail: "Seluruh peserta tercover" },
        { icon: "💧", label: "Air Mineral", detail: "Gratis sepanjang perjalanan" },
      ],
      services: [
        "Koordinasi langsung dengan pihak sekolah",
        "Itinerary edukatif sesuai kurikulum",
        "Pemandu lokal bersertifikat",
        "ID card & buku panduan peserta",
        "Laporan perjalanan & absensi harian",
        "Snack 1x di kendaraan",
        "Workshop batik opsional",
      ],
      destinations: [
        { no: "01", name: "Candi Borobudur", sub: "Magelang, Jawa Tengah", tag: "Warisan Dunia UNESCO · Sejarah & Budaya", title: "Candi Buddha Terbesar di Dunia", desc: "Candi Borobudur merupakan monumen Buddha terbesar yang diakui UNESCO sebagai warisan dunia. Siswa dapat mempelajari arsitektur kuno, relief cerita Buddha, dan filosofi hidup dari ukiran batu yang menakjubkan.", points: ["Relief 2.672 panel bercerita Buddha", "Pemandangan matahari terbit spektakuler", "Museum interaktif di kompleks candi", "Sarung batik gratis untuk kunjungan"], duration: "2–3 jam", img: "" },
        { no: "02", name: "Candi Prambanan", sub: "Sleman, Yogyakarta", tag: "Warisan Dunia UNESCO · Hindu Kuno", title: "Kompleks Candi Hindu Termegah", desc: "Prambanan adalah kompleks candi Hindu terbesar di Indonesia. Arsitekturnya yang menjulang mencerminkan kejayaan Kerajaan Mataram Kuno. Cerita Ramayana terukir indah di setiap dindingnya.", points: ["Tiga candi utama: Siwa, Brahma & Wisnu", "Sendratari Ramayana (opsional malam)", "Area taman luas untuk diskusi", "Pemandu khusus pelajar bersertifikat"], duration: "2–3 jam", img: "" },
        { no: "03", name: "Malioboro & Keraton", sub: "Kota Yogyakarta", tag: "Budaya Lokal · Pusat Kota Jogja", title: "Jantung Budaya Yogyakarta", desc: "Jalan Malioboro adalah ikon paling terkenal Yogyakarta. Di sini siswa belajar tentang kerajinan batik, kuliner khas Jogja, dan sistem pemerintahan Kesultanan Ngayogyakarta Hadiningrat.", points: ["Kunjungan Keraton Ngayogyakarta", "Belanja oleh-oleh khas Jogja", "Naik andong & becak tradisional", "Workshop membatik bersama pengrajin"], duration: "3–4 jam", img: "" },
      ],
      paketTypes: [
        { id: "pt-a", name: "Paket A", price: "285.000", priceNote: "/ orang (mulai)", points: ["Full AC Double Blower","TV LCD + Audio System","Toilet dalam bus","Snack 1x perjalanan","USB charging per kursi","Reclining seat"] },
        { id: "pt-b", name: "Paket B", price: "320.000", priceNote: "/ orang (mulai)", points: ["Full AC Split","Monitor + Speaker","Kursi empuk","Air mineral gratis","Power inverter 12V","Bagasi atas & bawah"] },
        { id: "pt-c", name: "Paket C", price: "380.000", priceNote: "/ orang (mulai)", points: ["AC Dual Zone","Captain seat","Bluetooth Audio","USB-A & USB-C","Air mineral gratis","GPS navigasi"] },
        { id: "pt-d", name: "Paket D", price: "145.000", priceNote: "/ orang (mulai)", points: ["Terbuka / angin alami","Bangku kayu + pegangan","Terpal pelindung","Air mineral gratis","Rute lokal / pendek","Paling ekonomis"] }
      ],
      utamaTipeId: "pt-a",
    },
    {
      id: 6,
      category: "traveling",
      pkgId: "solo",
      title: "Paket Solo",
      tagline: "Kota Batik, Tradisi & Kuliner Otentik",
      badge: "PAKET HEMAT",
      badgeColor: "#c0392b",
      accent: "#c0392b",
      accentLight: "#fdf0ef",
      duration: "2 Hari 1 Malam",
      minPeserta: "20",
      price: "Rp 195.000",
      priceNote: "/ orang (mulai)",
      images: [],
      image: "",
      description: "Paket karyawisata ke Solo — Keraton Surakarta, Kampung Batik Laweyan, dan Pasar Gede. Paket paling terjangkau dengan nuansa seni & budaya Jawa.",
      features: ["Hotel Bintang 2", "Konsumsi 2x Sehari", "Dokumentasi Foto", "Tour Leader", "Tiket Masuk Destinasi", "Asuransi Jiwa", "Workshop Membatik"],
      highlight: false,
      facilities: [
        { icon: "🏨", label: "Hotel Bintang 2", detail: "Kamar twin sharing ber-AC" },
        { icon: "🍽", label: "Konsumsi 2x Sehari", detail: "Sarapan & makan siang" },
        { icon: "📸", label: "Dokumentasi Foto", detail: "Tim fotografer" },
        { icon: "👨‍💼", label: "Tour Leader", detail: "Pendamping berpengalaman" },
        { icon: "🎫", label: "Tiket Masuk", detail: "Semua destinasi paket" },
        { icon: "💊", label: "P3K Lengkap", detail: "Kotak P3K di kendaraan" },
        { icon: "🛡", label: "Asuransi Jiwa", detail: "Seluruh peserta" },
        { icon: "💧", label: "Air Mineral", detail: "Gratis di kendaraan" },
      ],
      services: [
        "Koordinasi langsung dengan guru pendamping",
        "Itinerary berbasis seni dan budaya Jawa",
        "Pemandu lokal berpengalaman",
        "ID card peserta",
        "Laporan perjalanan harian",
        "Snack 1x di kendaraan",
      ],
      destinations: [
        { no: "01", name: "Keraton Surakarta", sub: "Surakarta, Jawa Tengah", tag: "Sejarah & Budaya · Istana Kerajaan", title: "Pusat Kebudayaan Jawa di Solo", desc: "Keraton Surakarta Hadiningrat adalah istana resmi Kasunanan Surakarta. Siswa bisa melihat langsung koleksi pusaka, busana adat kerajaan, dan mempelajari sejarah Kerajaan Mataram yang kaya.", points: ["Koleksi pusaka benda bersejarah kerajaan", "Pemandu khusus sejarah Mataram", "Pertunjukan wayang dan gamelan", "Galeri batik keraton asli"], duration: "2–3 jam", img: "" },
        { no: "02", name: "Kampung Batik Laweyan", sub: "Laweyan, Surakarta", tag: "Industri Kreatif · Warisan Budaya", title: "Sentra Batik Tertua di Indonesia", desc: "Laweyan adalah kampung batik tertua di Indonesia yang sudah ada sejak abad ke-16. Siswa bisa belajar langsung proses membatik dari pengrajin berpengalaman dan membawa pulang karya mereka sendiri.", points: ["Workshop membatik langsung dengan pengrajin", "Galeri batik tulis asli", "Sejarah batik warisan UNESCO", "Oleh-oleh langsung dari pengrajin"], duration: "2–3 jam", img: "" },
        { no: "03", name: "Pasar Gede & Kuliner Solo", sub: "Pusat Kota Solo", tag: "Kuliner & Budaya Lokal", title: "Surga Kuliner Otentik Kota Solo", desc: "Pasar Gede adalah pasar tradisional terbesar dan tertua di Solo. Siswa bisa mencicipi kuliner khas Solo seperti nasi liwet, serabi, timlo, dan brambang asem.", points: ["Arsitektur pasar kolonial Belanda bersejarah", "Kuliner: nasi liwet, serabi, timlo", "Interaksi langsung dengan pedagang lokal", "Sistem jual-beli tradisional Jawa"], duration: "1–2 jam", img: "" },
      ],
      paketTypes: [
        { id: "pt-a", name: "Paket A", price: "195.000", priceNote: "/ orang (mulai)", points: ["Full AC Double Blower","TV LCD + Audio System","Reclining seat","Snack 1x perjalanan","USB charging per kursi","Toilet dalam bus"] },
        { id: "pt-b", name: "Paket B", price: "235.000", priceNote: "/ orang (mulai)", points: ["Full AC Split","Monitor + Speaker","Kursi empuk","Air mineral gratis","Power inverter 12V","Bagasi atas & bawah"] },
        { id: "pt-c", name: "Paket C", price: "295.000", priceNote: "/ orang (mulai)", points: ["AC Dual Zone","Captain seat","Bluetooth Audio","USB-A & USB-C","Air mineral gratis","GPS navigasi"] },
        { id: "pt-d", name: "Paket D", price: "105.000", priceNote: "/ orang (mulai)", points: ["Terbuka / angin alami","Bangku kayu + pegangan","Terpal pelindung","Air mineral gratis","Rute lokal / pendek","Paling ekonomis"] }
      ],
      utamaTipeId: "pt-a",
    },
    {
      id: 7,
      category: "traveling",
      pkgId: "custom",
      title: "Paket Custom",
      tagline: "Desain Perjalanan Sesuai Impian Sekolah Anda",
      badge: "BISA CUSTOM",
      badgeColor: "#7c3aed",
      accent: "#7c3aed",
      accentLight: "#f0ebff",
      duration: "Fleksibel",
      minPeserta: "10",
      price: "Hubungi Kami",
      priceNote: "harga transparan",
      images: [],
      image: "",
      description: "Paket wisata sepenuhnya dikustomisasi — tujuan bebas, durasi fleksibel, anggaran transparan. Jogja, Bali, Solo, Lombok, Bromo, dan lainnya.",
      features: ["Tujuan Bebas Seluruh Indonesia", "Durasi 1 Hari – 2 Minggu", "Konsultasi Gratis", "Survey Lokasi", "Itinerary Custom bersama Tim Sekolah", "Support 24 Jam Selama Perjalanan"],
      highlight: false,
      facilities: [
        { icon: "🗺", label: "Tujuan Bebas", detail: "Seluruh Indonesia tersedia" },
        { icon: "📅", label: "Durasi Fleksibel", detail: "1 hari hingga 2 minggu" },
        { icon: "💬", label: "Konsultasi Gratis", detail: "Diskusi bersama tim kami" },
        { icon: "🔍", label: "Survey Lokasi", detail: "Tim survei terlebih dahulu" },
        { icon: "📋", label: "Itinerary Custom", detail: "Bersama tim sekolah" },
        { icon: "📞", label: "Support 24 Jam", detail: "Selama perjalanan berlangsung" },
        { icon: "🛡", label: "Asuransi Jiwa", detail: "Seluruh peserta tercover" },
        { icon: "💧", label: "Air Mineral", detail: "Gratis sepanjang perjalanan" },
      ],
      services: [
        "Tujuan bebas seluruh Indonesia",
        "Durasi 1 hari – 2 minggu fleksibel",
        "Konsultasi gratis bersama tim kami",
        "Survey lokasi sebelum keberangkatan",
        "Itinerary custom bersama tim sekolah",
        "Support 24 jam selama perjalanan",
        "Harga transparan tanpa biaya tersembunyi",
      ],
      destinations: [
        { no: "✈", name: "Bebas Pilih Destinasi", sub: "Seluruh Indonesia", tag: "Custom · Fleksibel", title: "Pilih Destinasi Sesuai Keinginan", desc: "Tidak ada batasan! Pilih dari ratusan destinasi wisata di seluruh Indonesia. Tim kami siap merancang perjalanan terbaik untuk sekolah Anda — dari Sabang sampai Merauke.", points: ["Bali, Jogja, Solo, Lombok, Bromo", "Labuan Bajo, Raja Ampat, Belitung", "Destinasi lokal & regional Jawa Timur", "Rute kombinasi multi-kota tersedia"], duration: "Fleksibel", img: "" },
      ],
      paketTypes: [
        { id: "pt-a", name: "Paket A", price: "Hubungi kami", priceNote: "/ orang (mulai)", points: ["Armada premium besar","Full AC & fasilitas lengkap","Kapasitas grup besar","Harga terbaik grup besar"] },
        { id: "pt-b", name: "Paket B", price: "Hubungi kami", priceNote: "/ orang (mulai)", points: ["Fleksibel grup kecil","AC nyaman","Kapasitas grup menengah","Mudah akses lokasi kecil"] },
        { id: "pt-c", name: "Paket C", price: "Hubungi kami", priceNote: "/ orang (mulai)", points: ["Untuk keluarga / grup kecil","AC & audio modern","Privat & nyaman","Bebas atur jadwal"] },
        { id: "pt-d", name: "Paket D", price: "Hubungi kami", priceNote: "/ orang (mulai)", points: ["Pilihan paling ekonomis","Cocok wisata alam terbuka","Terpal pelindung tersedia","Rute lokal & pendek"] }
      ],
      utamaTipeId: "pt-a",
    },

    /* ── TRAVELING TAMBAHAN: MALANG & BANDUNG ── */
    {
      id: 11,
      category: "traveling",
      pkgId: "malang",
      title: "Paket Kota Malang",
      tagline: "Kota Apel, Alam & Wisata Edukatif Jawa Timur",
      badge: "REKOMENDASI",
      badgeColor: "#16a34a",
      accent: "#16a34a",
      accentLight: "#f0fdf4",
      duration: "3 Hari 2 Malam",
      minPeserta: "20",
      price: "Rp 245.000",
      priceNote: "/ orang (mulai)",
      images: [],
      image: "",
      description: "Paket wisata Kota Malang & sekitarnya — Coban Rondo, Batu Secret Zoo, Museum Angkut, Pantai Balekambang & Jatim Park. Hotel bintang 2–3, konsumsi 3x sehari, tour leader berpengalaman.",
      features: ["Hotel Bintang 2–3", "Konsumsi 3x Sehari", "Dokumentasi Foto", "Tour Leader", "Tiket Masuk Destinasi", "Asuransi Jiwa", "ID Card & Buku Panduan"],
      highlight: true,
      facilities: [
        { icon: "🏨", label: "Hotel Bintang 2–3", detail: "Kamar twin sharing ber-AC" },
        { icon: "🍽", label: "Konsumsi 3x Sehari", detail: "Sarapan, makan siang, makan malam" },
        { icon: "📸", label: "Dokumentasi Foto", detail: "Fotografer profesional sepanjang tour" },
        { icon: "👨‍💼", label: "Tour Leader", detail: "Pendamping berpengalaman" },
        { icon: "🎫", label: "Tiket Masuk", detail: "Semua destinasi dalam itinerary" },
        { icon: "💊", label: "P3K Lengkap", detail: "Kotak P3K di setiap kendaraan" },
        { icon: "🛡", label: "Asuransi Jiwa", detail: "Seluruh peserta tercover" },
        { icon: "💧", label: "Air Mineral", detail: "Gratis sepanjang perjalanan" },
      ],
      services: [
        "Koordinasi langsung dengan pihak sekolah / instansi",
        "Itinerary edukatif khas Malang Raya",
        "Pemandu lokal bersertifikat di tiap destinasi",
        "ID card & buku panduan peserta",
        "Laporan perjalanan & absensi harian",
        "Snack 2x selama di kendaraan",
        "Free program tambahan (opsional)",
      ],
      destinations: [
        {
          no: "01", name: "Jatim Park 1 & 2", sub: "Batu, Malang", tag: "Edukasi & Sains · Wisata Keluarga",
          title: "Taman Edukasi Terlengkap Jawa Timur",
          desc: "Jatim Park adalah kompleks wisata edukatif terbesar di Jawa Timur. Jatim Park 1 berfokus pada sains dan teknologi, sedangkan Jatim Park 2 menghadirkan Museum Satwa & Batu Secret Zoo bertaraf internasional.",
          points: ["Batu Secret Zoo (kebun binatang bertaraf internasional)", "Museum Satwa interaktif", "Wahana sains dan teknologi", "Area bermain outdoor seluas 22 hektare"],
          duration: "3–4 jam", img: ""
        },
        {
          no: "02", name: "Museum Angkut", sub: "Batu, Malang", tag: "Transportasi & Sejarah · Unik & Instagramable",
          title: "Museum Transportasi Terbesar di Asia Tenggara",
          desc: "Museum Angkut menyimpan koleksi kendaraan bersejarah dari seluruh penjuru dunia mulai dari dokar hingga pesawat terbang. Setiap zona memiliki tema berbeda: Batavia, Hollywood, Broadway, dan masih banyak lagi.",
          points: ["Koleksi 300+ kendaraan bersejarah", "Zona tematik Batavia, Eropa & Amerika", "Wahana Flying Fox & Broadway Avenue", "Spot foto instagramable terbaik Malang"],
          duration: "2–3 jam", img: ""
        },
        {
          no: "03", name: "Coban Rondo", sub: "Pujon, Malang", tag: "Alam & Air Terjun · Ekowisata",
          title: "Air Terjun Legendaris Malang",
          desc: "Coban Rondo adalah air terjun paling terkenal di Malang dengan ketinggian 84 meter. Dikelilingi hutan pinus yang sejuk, destinasi ini menawarkan pengalaman ekowisata yang menyegarkan dan penuh cerita rakyat lokal.",
          points: ["Air terjun setinggi 84 meter", "Hutan pinus sejuk & fotogenik", "Camping ground tersedia", "Jalur trekking ringan cocok semua usia"],
          duration: "2–3 jam", img: ""
        },
        {
          no: "04", name: "Pantai Balekambang", sub: "Bantur, Malang Selatan", tag: "Pantai & Pura · Keindahan Alam",
          title: "Bali-nya Malang Selatan",
          desc: "Pantai Balekambang dijuluki 'Tanah Lot-nya Jawa' karena keindahan pura Hindu yang berdiri di atas batu karang di tengah laut. Ombak selatan yang megah dan sunset dramatis menjadikannya destinasi favorit.",
          points: ["Pura Amerta Jati di atas batu karang", "Pantai pasir coklat ombak selatan", "Sunset spektakuler di pesisir selatan", "Taman wisata pantai bersih & terawat"],
          duration: "2–3 jam", img: ""
        },
        {
          no: "05", name: "Alun-alun Batu & Kota Wisata Batu", sub: "Batu, Malang", tag: "Kuliner & Belanja · Pusat Kota",
          title: "Jantung Kota Batu yang Meriah",
          desc: "Kota Batu adalah surganya wisata kuliner dan belanja oleh-oleh khas Malang. Alun-alun Kota Batu yang ramai menjadi tempat bersantai, menikmati jajanan khas, dan berbelanja buah apel langsung dari petani.",
          points: ["Taman alun-alun dengan bianglala ikonik", "Pasar apel dan agrowisata kebun apel", "Kuliner khas Malang (bakso, cimol, tempe)", "Toko oleh-oleh terbesar di Malang Raya"],
          duration: "2–3 jam", img: ""
        },
      ],
      paketTypes: [
        { id: "pt-a", name: "Paket A", price: "245.000", priceNote: "/ orang (mulai)", points: ["Full AC Double Blower","TV LCD + Audio System","Toilet dalam bus","Snack 2x perjalanan","USB charging per kursi","Reclining seat"] },
        { id: "pt-b", name: "Paket B", price: "285.000", priceNote: "/ orang (mulai)", points: ["Full AC Split","Monitor + Speaker","Kursi empuk","Air mineral gratis","Power inverter 12V","Bagasi atas & bawah"] },
        { id: "pt-c", name: "Paket C", price: "360.000", priceNote: "/ orang (mulai)", points: ["AC Dual Zone","Captain seat","Bluetooth Audio","USB-A & USB-C","Air mineral gratis","GPS navigasi"] },
        { id: "pt-d", name: "Paket D", price: "125.000", priceNote: "/ orang (mulai)", points: ["Terbuka / angin alami","Bangku kayu + pegangan","Terpal pelindung","Air mineral gratis","Rute lokal / pendek","Paling ekonomis"] }
      ],
      utamaTipeId: "pt-a",
    },
    {
      id: 12,
      category: "traveling",
      pkgId: "bandung",
      title: "Paket Kota Bandung",
      tagline: "Paris van Java — Mode, Alam & Kuliner",
      badge: "TERBARU",
      badgeColor: "#7c3aed",
      accent: "#7c3aed",
      accentLight: "#f5f3ff",
      duration: "3 Hari 2 Malam",
      minPeserta: "25",
      price: "Rp 310.000",
      priceNote: "/ orang (mulai)",
      images: [],
      image: "",
      description: "Paket wisata Kota Bandung — Kawah Putih, Tangkuban Perahu, Dusun Bambu, Farm House, Saung Angklung Udjo & Factory Outlet. Hotel bintang 3, konsumsi 3x sehari, dan pemandu lokal profesional.",
      features: ["Hotel Bintang 3", "Konsumsi 3x Sehari", "Dokumentasi Foto", "Tour Leader", "Tiket Masuk Destinasi", "Asuransi Jiwa", "Workshop Angklung Opsional"],
      highlight: false,
      facilities: [
        { icon: "🏨", label: "Hotel Bintang 3", detail: "Kamar twin sharing ber-AC" },
        { icon: "🍽", label: "Konsumsi 3x Sehari", detail: "Sarapan, makan siang, makan malam" },
        { icon: "📸", label: "Dokumentasi Foto", detail: "Fotografer profesional" },
        { icon: "👨‍💼", label: "Tour Leader", detail: "Pendamping berpengalaman" },
        { icon: "🎫", label: "Tiket Masuk", detail: "Semua destinasi dalam itinerary" },
        { icon: "💊", label: "P3K Lengkap", detail: "Kotak P3K di setiap kendaraan" },
        { icon: "🛡", label: "Asuransi Jiwa", detail: "Seluruh peserta tercover" },
        { icon: "💧", label: "Air Mineral", detail: "Gratis sepanjang perjalanan" },
      ],
      services: [
        "Koordinasi langsung dengan pihak sekolah / instansi",
        "Itinerary seni-budaya & alam Jawa Barat",
        "Pemandu lokal bersertifikat di tiap destinasi",
        "ID card & buku panduan peserta",
        "Laporan perjalanan & absensi harian",
        "Snack 2x selama di kendaraan",
        "Workshop Angklung di Saung Udjo (opsional)",
      ],
      destinations: [
        {
          no: "01", name: "Kawah Putih", sub: "Ciwidey, Bandung Selatan", tag: "Geologi & Alam · Danau Vulkanik",
          title: "Danau Vulkanik Paling Ikonik di Jawa Barat",
          desc: "Kawah Putih adalah danau vulkanik berwarna toska kebiruan di ketinggian 2.430 mdpl. Bau belerang yang khas dan hamparan putih mineral membuat suasananya terasa mistis namun memukau — destinasi wajib di Bandung.",
          points: ["Danau vulkanik toska di 2.430 mdpl", "Hamparan pasir & mineral putih belerang", "Udara dingin 8–22°C sepanjang tahun", "Spot foto terbaik Jawa Barat"],
          duration: "2–3 jam", img: ""
        },
        {
          no: "02", name: "Tangkuban Perahu", sub: "Lembang, Bandung Barat", tag: "Gunung & Geologi · Legenda Sunda",
          title: "Gunung Berapi Aktif dengan Legenda Sangkuriang",
          desc: "Tangkuban Perahu adalah gunung berapi aktif berbentuk perahu terbalik yang menyimpan legenda Sangkuriang paling terkenal di tanah Sunda. Wisatawan bisa melihat kawah aktif dari jarak dekat dengan aman.",
          points: ["Kawah Ratu, Kawah Upas & Kawah Domas", "Legenda Sangkuriang yang terkenal", "Uap belerang & aktivitas vulkanik aman", "Pasar oleh-oleh khas di puncak gunung"],
          duration: "2–3 jam", img: ""
        },
        {
          no: "03", name: "Saung Angklung Udjo", sub: "Padasuka, Kota Bandung", tag: "Seni Budaya · Warisan UNESCO",
          title: "Pusat Angklung & Pertunjukan Budaya Sunda",
          desc: "Saung Angklung Udjo adalah pusat kebudayaan Sunda yang terkenal di seluruh dunia. Di sini peserta dapat belajar memainkan angklung — alat musik bambu warisan UNESCO — langsung dari para seniman Sunda berpengalaman.",
          points: ["Pertunjukan wayang golek & tari jaipong", "Workshop memainkan angklung bersama", "Angklung diakui UNESCO 2010", "Toko souvenir angklung asli Bandung"],
          duration: "2 jam", img: ""
        },
        {
          no: "04", name: "Dusun Bambu & Farm House", sub: "Lembang, Bandung Barat", tag: "Agrowisata · Alam & Keluarga",
          title: "Wisata Agro Paling Instagramable di Bandung",
          desc: "Dusun Bambu menawarkan konsep ekowisata dengan rumah makan di atas kolam dan hutan bambu yang asri. Sementara Farm House Lembang menghadirkan suasana Eropa dengan kebun bunga berwarna-warni dan hewan ternak.",
          points: ["Rumah makan apung di tengah kolam", "Hutan bambu & taman bunga tropis", "Farm House bertema Eropa ala Swiss", "Interaksi langsung dengan hewan ternak"],
          duration: "3 jam", img: ""
        },
        {
          no: "05", name: "Factory Outlet & Cihampelas Walk", sub: "Kota Bandung", tag: "Belanja & Mode · Kuliner",
          title: "Surga Belanja & Kuliner Khas Bandung",
          desc: "Bandung adalah kota mode terbesar di Indonesia. Factory Outlet Jalan Riau dan Cihampelas menawarkan produk fashion berkualitas dengan harga terjangkau. Lengkapi perjalanan dengan kuliner khas Bandung seperti batagor, siomay, dan surabi.",
          points: ["Factory outlet harga grosir terbaik", "Cihampelas Walk mal outdoor ikonik", "Kuliner khas: batagor, siomay, surabi", "Oleh-oleh khas Bandung terlengkap"],
          duration: "3 jam", img: ""
        },
      ],
      paketTypes: [
        { id: "pt-a", name: "Paket A", price: "310.000", priceNote: "/ orang (mulai)", points: ["Full AC Double Blower","TV LCD + Audio System","Toilet dalam bus","Snack 2x perjalanan","USB charging per kursi","Reclining seat"] },
        { id: "pt-b", name: "Paket B", price: "360.000", priceNote: "/ orang (mulai)", points: ["Full AC Split","Monitor + Speaker","Kursi empuk","Air mineral gratis","Power inverter 12V","Bagasi atas & bawah"] },
        { id: "pt-c", name: "Paket C", price: "440.000", priceNote: "/ orang (mulai)", points: ["AC Dual Zone","Captain seat","Bluetooth Audio","USB-A & USB-C","Air mineral gratis","GPS navigasi"] },
        { id: "pt-d", name: "Paket D", price: "165.000", priceNote: "/ orang (mulai)", points: ["Terbuka / angin alami","Bangku kayu + pegangan","Terpal pelindung","Air mineral gratis","Rute lokal / pendek","Paling ekonomis"] }
      ],
      utamaTipeId: "pt-a",
    },

    /* ── TRAVELING TAMBAHAN: OUTBOUND, STUDY BANDING, KUNJUNGAN INDUSTRI, KUNJUNGAN KAMPUS ── */
    {
      id: 30,
      category: "traveling",
      pkgId: "outbound",
      title: "Paket Outbound",
      tagline: "Team Building & Petualangan Alam Terbuka",
      badge: "SERU & MENANTANG",
      badgeColor: "#16a34a",
      accent: "#16a34a",
      accentLight: "#f0fdf4",
      duration: "1–2 Hari",
      minPeserta: "20",
      price: "Rp 175.000",
      priceNote: "/ orang (mulai)",
      images: [],
      image: "",
      description: "Paket outbound seru untuk membangun kekompakan tim, jiwa kepemimpinan, dan semangat kerjasama. Cocok untuk pelajar, mahasiswa, karyawan, dan komunitas. Tersedia area hijau & wahana petualangan.",
      features: ["Fasilitator Outbound Berpengalaman", "Games & Simulasi Team Building", "Flying Fox & High Rope Course", "Konsumsi & Snack", "Dokumentasi Foto & Video", "Sertifikat Peserta", "P3K & Asuransi Kegiatan"],
      highlight: false,
      facilities: [
        { icon: "🎯", label: "Fasilitator Profesional", detail: "Tim fasilitator bersertifikat" },
        { icon: "🏕", label: "Area Outdoor Luas", detail: "Lapangan & alam terbuka" },
        { icon: "🍽", label: "Konsumsi & Snack", detail: "Makan siang + snack 2x" },
        { icon: "📸", label: "Dokumentasi", detail: "Foto & video kegiatan" },
        { icon: "🛡", label: "Asuransi Kegiatan", detail: "Seluruh peserta tercover" },
        { icon: "📋", label: "Sertifikat", detail: "Sertifikat peserta outbound" },
        { icon: "💊", label: "P3K Lengkap", detail: "Tim medis & kotak P3K" },
        { icon: "💧", label: "Air Mineral", detail: "Gratis sepanjang kegiatan" },
      ],
      services: [
        "Konsultasi & perancangan program outbound custom",
        "Pemilihan lokasi sesuai kebutuhan & anggaran",
        "Fasilitator & instruktur berpengalaman",
        "Perlengkapan outbound lengkap & safety",
        "Rundown kegiatan & ice breaking",
        "Laporan kegiatan & dokumentasi digital",
        "Free program tambahan (opsional)",
      ],
      destinations: [
        { no: "01", name: "Ice Breaking & Warming Up", sub: "Area Utama", tag: "Pembukaan · Energizer", title: "Sesi Pembuka & Penghangatan Tim", desc: "Dimulai dengan ice breaking kreatif untuk memecah kekakuan dan membangun suasana ceria. Berbagai permainan energizer dirancang agar seluruh peserta langsung aktif dan bersemangat sejak awal.", points: ["Permainan energizer kreatif", "Pembagian tim & yel-yel", "Orientasi area & safety briefing", "Foto bersama pembukaan"], duration: "60 menit", img: "" },
        { no: "02", name: "Low Rope & Ground Games", sub: "Area Permainan", tag: "Team Building · Strategi", title: "Permainan Strategi & Kerjasama Tim", desc: "Sesi ini menguji kemampuan komunikasi, strategi, dan koordinasi tim melalui serangkaian permainan low rope dan ground games yang dirancang untuk meningkatkan sinergi antar anggota.", points: ["Spider Web & Trust Fall", "Tongkat Pipa & Bola Koordinasi", "Jembatan Bambu", "Blindfold Challenge"], duration: "90 menit", img: "" },
        { no: "03", name: "High Rope & Flying Fox", sub: "Area Petualangan", tag: "Adrenalin · Keberanian", title: "Tantangan Ketinggian & Flying Fox", desc: "Puncak adrenalin di wahana high rope dan flying fox yang memacu keberanian peserta. Semua wahana dilengkapi harness dan safety equipment standar internasional, didampingi instruktur bersertifikat.", points: ["Flying fox 50–200 meter", "Jembatan gantung & panjat dinding", "Safety harness & helmet lengkap", "Instruktur bersertifikat"], duration: "90 menit", img: "" },
        { no: "04", name: "Refleksi & Penutupan", sub: "Area Aula / Terbuka", tag: "Evaluasi · Closing Ceremony", title: "Sesi Refleksi & Pemberian Award", desc: "Sesi penutup yang bermakna — setiap tim berbagi pembelajaran, dilanjutkan pemberian penghargaan untuk tim terbaik, foto bersama, dan penyerahan sertifikat peserta.", points: ["Sharing & refleksi kelompok", "Pemberian penghargaan tim terbaik", "Penyerahan sertifikat peserta", "Foto bersama penutupan"], duration: "60 menit", img: "" },
      ],
      paketTypes: [
        { id: "pt-a", name: "Paket A", price: "175.000", priceNote: "/ orang (mulai)", points: ["Full AC Double Blower","TV LCD + Audio System","Toilet dalam bus","Snack 2x perjalanan","USB charging per kursi","Reclining seat"] },
        { id: "pt-b", name: "Paket B", price: "210.000", priceNote: "/ orang (mulai)", points: ["Full AC Split","Monitor + Speaker","Kursi empuk","Air mineral gratis","Power inverter 12V","Bagasi atas & bawah"] },
        { id: "pt-c", name: "Paket C", price: "280.000", priceNote: "/ orang (mulai)", points: ["AC Dual Zone","Captain seat","Bluetooth Audio","USB-A & USB-C","Air mineral gratis","GPS navigasi"] },
        { id: "pt-d", name: "Paket D", price: "120.000", priceNote: "/ orang (mulai)", points: ["Terbuka / angin alami","Bangku kayu + pegangan","Terpal pelindung","Air mineral gratis","Rute lokal / pendek","Paling ekonomis"] }
      ],
      utamaTipeId: "pt-a",
    },
    {
      id: 31,
      category: "traveling",
      pkgId: "study-banding",
      title: "Paket Study Banding",
      tagline: "Belajar Langsung dari Instansi Terbaik",
      badge: "EDUKATIF",
      badgeColor: "#0369a1",
      accent: "#0369a1",
      accentLight: "#e0f2fe",
      duration: "1–3 Hari",
      minPeserta: "20",
      price: "Rp 220.000",
      priceNote: "/ orang (mulai)",
      images: [],
      image: "",
      description: "Paket study banding ke instansi, lembaga pemerintah, BUMN, perusahaan unggulan, atau sekolah/universitas terbaik. Dirancang untuk memperluas wawasan, benchmarking, dan adopsi praktik terbaik secara langsung.",
      features: ["Koordinasi dengan Instansi Tujuan", "Konsumsi 3x Sehari", "Dokumentasi Foto & Video", "Tour Leader Berpengalaman", "Laporan Kunjungan Resmi", "Sertifikat Peserta", "Asuransi Perjalanan"],
      highlight: false,
      facilities: [
        { icon: "🏛", label: "Koordinasi Instansi", detail: "Pengurusan izin & jadwal kunjungan" },
        { icon: "🍽", label: "Konsumsi 3x Sehari", detail: "Sarapan, makan siang, makan malam" },
        { icon: "📸", label: "Dokumentasi", detail: "Foto & video kunjungan resmi" },
        { icon: "👨‍💼", label: "Tour Leader", detail: "Pendamping & koordinator berpengalaman" },
        { icon: "📄", label: "Laporan Resmi", detail: "Laporan kunjungan tertulis lengkap" },
        { icon: "📋", label: "Sertifikat Peserta", detail: "Sertifikat study banding resmi" },
        { icon: "🛡", label: "Asuransi Perjalanan", detail: "Seluruh peserta tercover" },
        { icon: "💧", label: "Air Mineral", detail: "Gratis sepanjang perjalanan" },
      ],
      services: [
        "Koordinasi & pengurusan izin kunjungan ke instansi tujuan",
        "Pembuatan surat permohonan & administrasi resmi",
        "Penyusunan agenda & rundown kunjungan",
        "Fasilitasi sesi diskusi & tanya jawab",
        "Dokumentasi foto & video profesional",
        "Penyusunan laporan kunjungan lengkap",
        "Konsultasi pra-keberangkatan gratis",
      ],
      destinations: [
        { no: "01", name: "Briefing & Persiapan", sub: "Titik Kumpul", tag: "Pra-Keberangkatan · Administrasi", title: "Briefing Pra-Kunjungan & Pembagian Kelompok", desc: "Sebelum berangkat, seluruh peserta mendapat briefing lengkap — tujuan kunjungan, agenda, tata tertib, dan pembagian kelompok diskusi. Surat pengantar resmi dan ID card kunjungan dibagikan.", points: ["Pembagian ID card & name tag", "Briefing agenda & tata tertib", "Pembagian kelompok diskusi", "Penyiapan bahan pertanyaan"], duration: "30 menit", img: "" },
        { no: "02", name: "Kunjungan Instansi Utama", sub: "Instansi / Lembaga Tujuan", tag: "Inti Kunjungan · Observasi", title: "Kunjungan & Observasi Langsung ke Instansi", desc: "Peserta berkunjung langsung ke instansi tujuan, mengikuti sesi presentasi dari tuan rumah, observasi lapangan/operasional, dan sesi diskusi interaktif. Semua sesi didokumentasikan secara profesional.", points: ["Sesi presentasi dari instansi tujuan", "Tour & observasi area kerja/produksi", "Sesi diskusi & tanya jawab", "Foto bersama dengan tim tuan rumah"], duration: "3–4 jam", img: "" },
        { no: "03", name: "FGD & Evaluasi", sub: "Ruang Diskusi", tag: "Analisis · Focus Group Discussion", title: "Focus Group Discussion & Analisis Hasil", desc: "Setelah kunjungan, setiap kelompok melakukan FGD untuk menganalisis temuan, membandingkan dengan kondisi di instansi asal, dan merumuskan rekomendasi yang dapat diterapkan.", points: ["Diskusi antar kelompok", "Analisis perbandingan (benchmarking)", "Perumusan rekomendasi", "Presentasi hasil tiap kelompok"], duration: "90 menit", img: "" },
        { no: "04", name: "Penyusunan Laporan & Penutupan", sub: "Area Akomodasi / Hotel", tag: "Dokumentasi · Closing", title: "Penyusunan Laporan Kunjungan Resmi", desc: "Tim kami membantu penyusunan laporan kunjungan resmi yang komprehensif, siap digunakan untuk keperluan administrasi, pelaporan ke pimpinan, atau publikasi internal organisasi.", points: ["Draft laporan kunjungan tertulis", "Kompilasi dokumentasi foto & video", "Sertifikat peserta study banding", "Serah terima laporan digital & cetak"], duration: "60 menit", img: "" },
      ],
      paketTypes: [
        { id: "pt-a", name: "Paket A", price: "220.000", priceNote: "/ orang (mulai)", points: ["Full AC Double Blower","TV LCD + Audio System","Toilet dalam bus","Snack 2x perjalanan","USB charging per kursi","Reclining seat"] },
        { id: "pt-b", name: "Paket B", price: "265.000", priceNote: "/ orang (mulai)", points: ["Full AC Split","Monitor + Speaker","Kursi empuk","Air mineral gratis","Power inverter 12V","Bagasi atas & bawah"] },
        { id: "pt-c", name: "Paket C", price: "340.000", priceNote: "/ orang (mulai)", points: ["AC Dual Zone","Captain seat","Bluetooth Audio","USB-A & USB-C","Air mineral gratis","GPS navigasi"] },
        { id: "pt-d", name: "Paket D", price: "140.000", priceNote: "/ orang (mulai)", points: ["Terbuka / angin alami","Bangku kayu + pegangan","Terpal pelindung","Air mineral gratis","Rute lokal / pendek","Paling ekonomis"] }
      ],
      utamaTipeId: "pt-a",
    },
    {
      id: 32,
      category: "traveling",
      pkgId: "kunjungan-industri",
      title: "Paket Kunjungan Industri",
      tagline: "Mengenal Dunia Industri Secara Nyata",
      badge: "VOKASI & SMK",
      badgeColor: "#b45309",
      accent: "#b45309",
      accentLight: "#fffbeb",
      duration: "1–2 Hari",
      minPeserta: "20",
      price: "Rp 195.000",
      priceNote: "/ orang (mulai)",
      images: [],
      image: "",
      description: "Paket kunjungan industri untuk siswa SMK, mahasiswa vokasi, dan instansi yang ingin mengenal proses produksi, manajemen operasional, dan dunia kerja nyata secara langsung di pabrik atau perusahaan terkemuka.",
      features: ["Koordinasi dengan Perusahaan Tujuan", "Konsumsi 2–3x Sehari", "Dokumentasi Foto & Video", "Tour Leader & Pemandu Industri", "Sertifikat Kunjungan Industri", "Laporan Kunjungan Resmi", "Asuransi Perjalanan"],
      highlight: false,
      facilities: [
        { icon: "🏭", label: "Koordinasi Pabrik/Industri", detail: "Pengurusan izin & jadwal kunjungan" },
        { icon: "🍽", label: "Konsumsi 2–3x Sehari", detail: "Makan siang wajib, sarapan & malam opsional" },
        { icon: "📸", label: "Dokumentasi", detail: "Foto & video area produksi (area yg diizinkan)" },
        { icon: "👨‍🏭", label: "Pemandu Industri", detail: "Staf ahli perusahaan sebagai pemandu" },
        { icon: "📋", label: "Sertifikat Kunjungan", detail: "Sertifikat kunjungan industri resmi" },
        { icon: "📄", label: "Laporan Resmi", detail: "Laporan kunjungan industri lengkap" },
        { icon: "🛡", label: "Asuransi Perjalanan", detail: "Seluruh peserta tercover" },
        { icon: "⛑", label: "APD Kunjungan", detail: "Helm & safety vest tersedia" },
      ],
      services: [
        "Koordinasi & pengurusan izin kunjungan ke perusahaan/pabrik",
        "Pembuatan surat permohonan resmi & administrasi",
        "Penyusunan rundown kunjungan bersama pihak industri",
        "Pemandu dari staf ahli perusahaan",
        "Sesi tanya jawab langsung dengan praktisi industri",
        "Dokumentasi foto & video (area yang diizinkan)",
        "Penyusunan laporan kunjungan industri lengkap",
      ],
      destinations: [
        { no: "01", name: "Penerimaan & Pengarahan", sub: "Aula / Ruang Meeting Perusahaan", tag: "Opening · Company Profile", title: "Sambutan & Presentasi Profil Perusahaan", desc: "Peserta diterima oleh tim perusahaan dan mendapatkan presentasi company profile — sejarah, visi misi, produk/layanan, skala bisnis, dan posisi perusahaan di industri nasional.", points: ["Sambutan resmi dari manajemen", "Presentasi company profile", "Sesi pengenalan produk & layanan", "Pembagian helm & APD kunjungan"], duration: "45 menit", img: "" },
        { no: "02", name: "Tour Area Produksi", sub: "Lantai Produksi / Workshop", tag: "Observasi · Proses Industri", title: "Observasi Langsung Proses Produksi", desc: "Dipandu oleh staf ahli, peserta berkeliling area produksi dan menyaksikan langsung proses manufacturing, quality control, pergudangan, hingga distribusi. Pengalaman yang tidak bisa didapat dari buku.", points: ["Tour area produksi & gudang", "Penjelasan proses manufaktur langsung", "Melihat mesin & teknologi industri", "Observasi quality control"], duration: "90 menit", img: "" },
        { no: "03", name: "Sesi Tanya Jawab Praktisi", sub: "Aula / Ruang Meeting", tag: "Interaktif · Career Talk", title: "Dialog Interaktif dengan Praktisi Industri", desc: "Sesi diskusi langsung dengan praktisi — manajer produksi, HRD, atau direktur operasional. Peserta bisa bertanya soal karier, tantangan industri, kebutuhan kompetensi, hingga peluang magang/kerja.", points: ["Sesi QnA dengan praktisi senior", "Career talk & tips memasuki dunia kerja", "Informasi peluang magang & rekrutmen", "Motivasi dari profesional industri"], duration: "60 menit", img: "" },
        { no: "04", name: "Penutupan & Sertifikasi", sub: "Aula Perusahaan", tag: "Closing · Sertifikat Resmi", title: "Penyerahan Sertifikat & Foto Bersama", desc: "Sesi penutupan diakhiri dengan penyerahan sertifikat kunjungan industri resmi yang dapat digunakan untuk portofolio, laporan sekolah, atau persyaratan program studi.", points: ["Penyerahan sertifikat kunjungan industri", "Foto bersama dengan tim perusahaan", "Souvenir dari perusahaan (jika ada)", "Evaluasi & kesan-pesan peserta"], duration: "30 menit", img: "" },
      ],
      paketTypes: [
        { id: "pt-a", name: "Paket A", price: "195.000", priceNote: "/ orang (mulai)", points: ["Full AC Double Blower","TV LCD + Audio System","Toilet dalam bus","Snack 2x perjalanan","USB charging per kursi","Reclining seat"] },
        { id: "pt-b", name: "Paket B", price: "240.000", priceNote: "/ orang (mulai)", points: ["Full AC Split","Monitor + Speaker","Kursi empuk","Air mineral gratis","Power inverter 12V","Bagasi atas & bawah"] },
        { id: "pt-c", name: "Paket C", price: "310.000", priceNote: "/ orang (mulai)", points: ["AC Dual Zone","Captain seat","Bluetooth Audio","USB-A & USB-C","Air mineral gratis","GPS navigasi"] },
        { id: "pt-d", name: "Paket D", price: "130.000", priceNote: "/ orang (mulai)", points: ["Terbuka / angin alami","Bangku kayu + pegangan","Terpal pelindung","Air mineral gratis","Rute lokal / pendek","Paling ekonomis"] }
      ],
      utamaTipeId: "pt-a",
    },
    {
      id: 33,
      category: "traveling",
      pkgId: "kunjungan-kampus",
      title: "Paket Kunjungan Kampus",
      tagline: "Inspirasi Masa Depan Dimulai di Sini",
      badge: "SMA / SMK",
      badgeColor: "#7c3aed",
      accent: "#7c3aed",
      accentLight: "#f5f3ff",
      duration: "1–2 Hari",
      minPeserta: "20",
      price: "Rp 185.000",
      priceNote: "/ orang (mulai)",
      images: [],
      image: "",
      description: "Paket kunjungan kampus untuk siswa SMA/SMK yang ingin mengenal dunia perguruan tinggi secara langsung — fasilitas, jurusan, beasiswa, kehidupan mahasiswa, hingga prospek karir. Kunjungi universitas negeri & swasta terkemuka.",
      features: ["Koordinasi dengan Pihak Kampus", "Konsumsi 2–3x Sehari", "Dokumentasi Foto & Video", "Tour Leader Berpengalaman", "Campus Tour Terpandu", "Sertifikat Kunjungan", "Asuransi Perjalanan"],
      highlight: false,
      facilities: [
        { icon: "🎓", label: "Campus Tour Terpandu", detail: "Mahasiswa guide dari kampus tujuan" },
        { icon: "🍽", label: "Konsumsi 2–3x Sehari", detail: "Makan di kantin kampus / restoran" },
        { icon: "📸", label: "Dokumentasi", detail: "Foto & video selama kunjungan" },
        { icon: "👨‍💼", label: "Tour Leader", detail: "Pendamping & koordinator berpengalaman" },
        { icon: "📋", label: "Sertifikat Kunjungan", detail: "Sertifikat kunjungan kampus resmi" },
        { icon: "📚", label: "Brosur & Informasi", detail: "Materi jurusan & beasiswa kampus" },
        { icon: "🛡", label: "Asuransi Perjalanan", detail: "Seluruh peserta tercover" },
        { icon: "💧", label: "Air Mineral", detail: "Gratis sepanjang perjalanan" },
      ],
      services: [
        "Koordinasi dengan humas / biro penerimaan mahasiswa kampus tujuan",
        "Penyusunan agenda campus tour & jadwal sesi informasi",
        "Pemandu mahasiswa aktif dari kampus tujuan",
        "Sesi informasi jurusan, beasiswa & jalur masuk",
        "Campus tour: laboratorium, perpustakaan, fasilitas olahraga",
        "Sesi diskusi & tanya jawab dengan mahasiswa aktif",
        "Dokumentasi lengkap & sertifikat kunjungan resmi",
      ],
      destinations: [
        { no: "01", name: "Sambutan & Info Kampus", sub: "Aula / Auditorium Kampus", tag: "Opening · Informasi Umum", title: "Presentasi Kampus & Pengenalan Jurusan", desc: "Tim humas atau perwakilan rektorat menyambut rombongan dan mempresentasikan profil kampus secara menyeluruh — akreditasi, jurusan unggulan, prestasi, fasilitas, jalur masuk, dan program beasiswa.", points: ["Presentasi profil & akreditasi kampus", "Informasi jurusan & program studi", "Jalur masuk: SNBP, SNBT, Mandiri", "Program beasiswa tersedia"], duration: "60 menit", img: "" },
        { no: "02", name: "Campus Tour Fasilitas", sub: "Seluruh Area Kampus", tag: "Observasi · Fasilitas Kampus", title: "Tur Fasilitas Kampus Bersama Mahasiswa Guide", desc: "Dipandu mahasiswa aktif, peserta berkeliling kampus — laboratorium, studio, perpustakaan, pusat olahraga, kantin, asrama, dan UKM. Melihat langsung suasana kehidupan kampus yang sesungguhnya.", points: ["Laboratorium & studio praktikum", "Perpustakaan & pusat riset", "Fasilitas olahraga & kesehatan", "Area UKM & organisasi mahasiswa"], duration: "90 menit", img: "" },
        { no: "03", name: "Diskusi dengan Mahasiswa", sub: "Ruang Diskusi / Taman Kampus", tag: "Interaktif · Sharing Session", title: "Sesi Sharing & Tanya Jawab Mahasiswa Aktif", desc: "Peserta berdiskusi langsung dengan mahasiswa aktif berbagai jurusan. Sharing kehidupan kampus, tips lolos seleksi, cara adaptasi, manajemen waktu kuliah, hingga pengalaman magang dan organisasi.", points: ["Sharing pengalaman kuliah", "Tips lolos seleksi & adaptasi kampus", "Diskusi minat jurusan", "Motivasi dari kakak tingkat"], duration: "60 menit", img: "" },
        { no: "04", name: "Penutupan & Sertifikasi", sub: "Aula / Area Terbuka Kampus", tag: "Closing · Sertifikat", title: "Sertifikat & Foto Bersama di Kampus", desc: "Kunjungan ditutup dengan penyerahan sertifikat resmi, pembagian brosur jurusan & beasiswa, foto bersama di landmark kampus, dan sesi motivasi singkat dari dosen atau alumni berprestasi.", points: ["Penyerahan sertifikat kunjungan kampus", "Pembagian brosur jurusan & beasiswa", "Foto bersama di landmark kampus", "Motivasi dari dosen / alumni"], duration: "30 menit", img: "" },
      ],
      paketTypes: [
        { id: "pt-a", name: "Paket A", price: "185.000", priceNote: "/ orang (mulai)", points: ["Full AC Double Blower","TV LCD + Audio System","Toilet dalam bus","Snack 2x perjalanan","USB charging per kursi","Reclining seat"] },
        { id: "pt-b", name: "Paket B", price: "230.000", priceNote: "/ orang (mulai)", points: ["Full AC Split","Monitor + Speaker","Kursi empuk","Air mineral gratis","Power inverter 12V","Bagasi atas & bawah"] },
        { id: "pt-c", name: "Paket C", price: "295.000", priceNote: "/ orang (mulai)", points: ["AC Dual Zone","Captain seat","Bluetooth Audio","USB-A & USB-C","Air mineral gratis","GPS navigasi"] },
        { id: "pt-d", name: "Paket D", price: "125.000", priceNote: "/ orang (mulai)", points: ["Terbuka / angin alami","Bangku kayu + pegangan","Terpal pelindung","Air mineral gratis","Rute lokal / pendek","Paling ekonomis"] }
      ],
      utamaTipeId: "pt-a",
    },

    /* ── EVENT PLAN TAMBAHAN: TEDAK SINTEN, ANNIVERSARY, DIES NATALIS, UPACARA ADAT, REUNIAN ── */
    {
      id: 13,
      category: "event",
      title: "Paket Tedak Sinten",
      badge: "Tradisi Jawa",
      badgeColor: "#b45309",
      price: "Rp 4.500.000",
      priceNote: "/ acara",
      images: [],
      image: "",
      description: "Paket upacara Tedak Sinten (turun tanah) yang autentik dan penuh makna. Kami mengurus seluruh perlengkapan tradisi Jawa mulai dari jadah 7 warna, kurungan, tangga tebu, hingga dokumentasi profesional untuk kenangan tak ternilai.",
      features: [
        "Konsultasi prosesi adat Tedak Sinten",
        "Pengadaan perlengkapan tradisi lengkap (jadah 7 warna, kurungan, tangga tebu, pasir, dll.)",
        "Dekorasi tematik Jawa klasik",
        "MC / Pranata Acara berbahasa Jawa",
        "Dokumentasi foto & video (4 jam)",
        "Catering snack & minuman tamu (50 pax)",
        "Koordinasi sesepuh / dukun bayi (opsional)",
        "Souvenir kenangan (opsional)",
      ],
      highlight: false,
    },
    {
      id: 14,
      category: "event",
      title: "Paket Anniversary",
      badge: "Populer",
      badgeColor: "#db2777",
      price: "Rp 6.500.000",
      priceNote: "/ acara",
      images: [],
      image: "",
      description: "Rayakan momen ulang tahun pernikahan, ulang tahun perusahaan, atau anniversary spesial dengan nuansa romantis dan elegan. Dekorasi premium, hiburan live, dan dokumentasi sinematik untuk kenangan abadi.",
      features: [
        "Konsultasi tema & konsep acara",
        "Dekorasi tematik romantis / elegan / custom",
        "Backdrop & floral arrangement premium",
        "MC profesional & entertainment (live music / band akustik)",
        "Dokumentasi foto & video sinematik (full day)",
        "Kue ulang tahun / anniversary custom",
        "Catering prasmanan (100 pax)",
        "Kapasitas 50–150 tamu",
      ],
      highlight: true,
    },
    {
      id: 15,
      category: "event",
      title: "Paket Dies Natalis",
      badge: "Instansi & Kampus",
      badgeColor: "#1d4ed8",
      price: "Rp 15.000.000",
      priceNote: "/ event",
      images: [],
      image: "",
      description: "Paket perayaan Dies Natalis kampus, sekolah, atau organisasi yang profesional dan berkesan. Kami menangani seluruh rangkaian acara dari malam puncak, seminar, pentas seni, hingga penghargaan alumni.",
      features: [
        "Konsultasi & perencanaan rangkaian acara Dies Natalis",
        "Dekorasi pentas & panggung instansi / kampus",
        "Sound system & lighting profesional",
        "MC bilingual (Indonesia / Jawa)",
        "Pentas seni & hiburan (modern & tradisional)",
        "Dokumentasi foto & video full event",
        "Koordinasi 10+ vendor",
        "Catering prasmanan 200 pax",
        "Kapasitas 200–500 tamu undangan",
      ],
      highlight: false,
    },
    {
      id: 16,
      category: "event",
      title: "Paket Upacara Adat",
      badge: "Budaya Nusantara",
      badgeColor: "#92400e",
      price: "Rp 8.000.000",
      priceNote: "/ acara",
      images: [],
      image: "",
      description: "Paket penyelenggaraan upacara adat Nusantara secara autentik dan khidmat. Meliputi berbagai adat Jawa, Sunda, Madura, Bali, dan adat daerah lainnya — ditangani oleh tim yang paham tradisi dan tata cara adat setempat.",
      features: [
        "Konsultasi prosesi & tata cara upacara adat",
        "Pengadaan perlengkapan & sesaji adat lengkap",
        "Dekorasi tradisional khas adat yang dipilih",
        "Pranata Acara / MC berbahasa daerah",
        "Koordinasi sesepuh / pemangku adat",
        "Dokumentasi foto & video (6 jam)",
        "Catering tradisional khas daerah (100 pax)",
        "Pendampingan hari H penuh",
      ],
      highlight: false,
    },
    {
      id: 17,
      category: "event",
      title: "Paket Reunian",
      badge: "Hangat & Berkesan",
      badgeColor: "#8B6914",
      price: "Rp 5.500.000",
      priceNote: "/ acara",
      images: [],
      image: "",
      description: "Wujudkan momen reuni alumni, keluarga besar, atau komunitas yang hangat dan tak terlupakan. Kami siap mengurus venue, hiburan nostalgia, games seru, konsumsi, hingga souvenir kenangan untuk seluruh peserta.",
      features: [
        "Konsultasi tema & konsep reuni",
        "Dekorasi venue hangat & nostalgik",
        "MC interaktif & games seru peserta",
        "Slide show / video perjalanan kenangan",
        "Dokumentasi foto & video (full event)",
        "Catering prasmanan / buffet (100 pax)",
        "Souvenir kenangan peserta",
        "Kapasitas 50–200 orang",
      ],
      highlight: false,
    },

    /* ── WEDDING ORGANIZER (3 paket) ── */
    {
      id: 8,
      category: "wedding",
      title: "Paket Wedding Intimate Garden",
      badge: "Terlaris",
      badgeColor: "#e67e22",
      price: "Rp 18.000.000",
      priceNote: "/ wedding",
      images: [],
      image: "",
      description: "Pernikahan intim nan hangat di taman dengan dekorasi bohemian elegan. Ideal untuk 50–100 tamu dengan nuansa natural yang tetap mewah dan berkesan.",
      features: [
        "Dekorasi garden bohemian",
        "Wedding planner dedicated",
        "Dokumentasi foto & video",
        "Catering 100 pax",
        "Pelaminan custom",
        "Bunga segar premium",
        "MC profesional",
        "Koordinasi vendor",
      ],
      highlight: false,
    },
    {
      id: 9,
      category: "wedding",
      title: "Paket Wedding Syar'i Premium",
      badge: "Best Seller",
      badgeColor: "#1abc9c",
      price: "Rp 25.000.000",
      priceNote: "/ wedding",
      images: [],
      image: "",
      description: "Wujudkan pernikahan Islami yang penuh berkah dan elegan. Setiap detail prosesi dirancang sesuai nilai-nilai Islam dengan tampilan modern yang tetap menawan untuk 150–250 tamu.",
      features: [
        "Dekorasi Islami modern",
        "Pembatas tamu putra & putri",
        "Qori & sambutan religi",
        "Catering halal 200 pax",
        "Pelaminan syar'i custom",
        "Dokumentasi foto & video",
        "Wedding planner dedicated",
        "Buku tamu & souvenir",
      ],
      highlight: true,
    },
    {
      id: 10,
      category: "wedding",
      title: "Paket Wedding Glamour Ballroom",
      badge: "Mewah",
      badgeColor: "#8e44ad",
      price: "Rp 55.000.000",
      priceNote: "/ wedding",
      images: [],
      image: "",
      description: "Pernikahan megah berkelas di ballroom hotel bintang 5 dengan dekorasi chandelier dan bunga segar premium. All-inclusive terbaik untuk 300–600 tamu undangan.",
      features: [
        "Ballroom hotel bintang 5",
        "Dekorasi full flowers premium",
        "Bridal suite 2 malam",
        "Catering fine dining 400 pax",
        "Entertainment & live band",
        "Foto & video sinematik",
        "Wedding planner senior",
        "Makeup artist profesional",
        "Souvenir premium tamu",
        "Pagar ayu & pager bagus",
      ],
      highlight: false,
    },

    /* ── EVENT PLAN TAMBAHAN: KONSER MUSIK & PEMERINTAH ── */
    {
      id: 20,
      category: "event",
      title: "Paket Konser Musik",
      badge: "Hiburan",
      badgeColor: "#dc2626",
      price: "Rp 25.000.000",
      priceNote: "/ event (mulai)",
      images: [],
      image: "",
      description: "Paket penyelenggaraan konser musik profesional dari skala intimate hingga open-air besar. Kami menangani seluruh produksi — panggung, sound system, lighting, artist management, keamanan, tiket, hingga dokumentasi — agar konser berjalan lancar dan berkesan.",
      features: [
        "Konsultasi konsep & rundown konser",
        "Desain & pemasangan panggung profesional",
        "Sound system line array & FOH engineer",
        "Lighting show full rig (moving head, laser, LED)",
        "Artist management & rider teknis",
        "Manajemen tiket & registrasi tamu",
        "Keamanan & crowd management",
        "Dokumentasi foto & video sinematik",
        "Publikasi & promosi event (media sosial, poster)",
        "Kapasitas 500 – 10.000 penonton",
      ],
      highlight: true,
    },
    {
      id: 21,
      category: "event",
      title: "Paket Pemerintah Kota / Kabupaten",
      badge: "Resmi & Protokol",
      badgeColor: "#1d4ed8",
      price: "Rp 20.000.000",
      priceNote: "/ event (mulai)",
      images: [],
      image: "",
      description: "Paket penyelenggaraan event resmi instansi pemerintah daerah — Kota maupun Kabupaten — yang memenuhi standar protokoler kenegaraan. Meliputi hari jadi kota, upacara kenegaraan, festival daerah, musrenbang, pelantikan pejabat, hingga expo potensi daerah.",
      features: [
        "Konsultasi konsep & protokol acara pemerintah",
        "Dekorasi resmi bernuansa merah-putih & lambang daerah",
        "Panggung, podium, & backdrop resmi instansi",
        "Sound system & tata suara gedung / outdoor",
        "MC protokoler berbahasa Indonesia formal",
        "Koordinasi paspampres / keamanan setempat",
        "Dokumentasi foto & video resmi berita",
        "Perlengkapan administrasi & atribut acara",
        "Live streaming & siaran pers (opsional)",
        "Kapasitas 200 – 5.000 tamu undangan",
      ],
      highlight: false,
    },

    /* ── EVENT PLAN CUSTOM ── */
    {
      id: 18,
      category: "event",
      pkgId: "custom",
      title: "Paket Event Custom",
      tagline: "Rancang Event Sesuai Visi & Kebutuhan Anda",
      badge: "BISA CUSTOM",
      badgeColor: "#7c3aed",
      price: "Hubungi Kami",
      priceNote: "harga transparan & negosiasi",
      images: [],
      image: "",
      description: "Tidak menemukan paket yang cocok? Kami merancang event 100% sesuai kebutuhan Anda — dari konsep, tema, vendor, hingga hari H. Seminar, gathering, launching produk, pameran, konser mini, atau apapun yang Anda bayangkan, kami wujudkan.",
      features: [
        "Konsultasi tema & konsep event gratis",
        "Skala acara bebas: 20 – 5.000 tamu",
        "Pilihan venue indoor & outdoor",
        "Koordinasi vendor sesuai budget",
        "Rundown & timeline custom",
        "Dekorasi & branding event penuh",
        "Dokumentasi foto & video profesional",
        "Support penuh hari H on-site",
      ],
      highlight: false,
    },

    /* ── WEDDING ORGANIZER CUSTOM ── */
    {
      id: 19,
      category: "wedding",
      pkgId: "custom",
      title: "Paket Wedding Custom",
      tagline: "Wujudkan Pernikahan Impian Tanpa Batas",
      badge: "BISA CUSTOM",
      badgeColor: "#7c3aed",
      price: "Hubungi Kami",
      priceNote: "konsultasi gratis, harga transparan",
      images: [],
      image: "",
      description: "Pernikahan adalah momen seumur hidup. Kami merancang setiap detailnya bersama Anda — dari akad hingga resepsi, dari dekorasi hingga catering, dari dokumentasi hingga hiburan. Tidak ada paket yang terlalu besar atau terlalu kecil bagi kami.",
      features: [
        "Konsultasi pernikahan gratis & tanpa batas",
        "Pilihan tema bebas: modern, tradisional, outdoor, ballroom, garden, dll.",
        "Wedding planner dedicated full-time",
        "Koordinasi semua vendor (foto, video, katering, dekorasi, make-up, dll.)",
        "Pelaminan & dekorasi 100% custom",
        "Gladi resik & pendampingan hari H penuh",
        "Kapasitas fleksibel: 30 – 1.000+ tamu",
        "Harga transparan, cicilan tersedia",
      ],
      highlight: false,
    },
  ],
  teamMembers: [
    { id: 1, name: "Budi Santoso", role: "CEO & Founder", quotes: "Setiap momen spesial layak dirayakan dengan sempurna.", photo: "https://ui-avatars.com/api/?name=Budi+Santoso&size=300&background=2d2d2d&color=fff&bold=true" },
    { id: 2, name: "Sari Dewi", role: "Wedding Coordinator", quotes: "Kami hadir untuk mewujudkan impian pernikahan Anda.", photo: "https://ui-avatars.com/api/?name=Sari+Dewi&size=300&background=2b7a9a&color=fff&bold=true" },
    { id: 3, name: "Raka Pratama", role: "Travel Manager", quotes: "Perjalanan terbaik dimulai dari perencanaan yang matang.", photo: "https://ui-avatars.com/api/?name=Raka+Pratama&size=300&background=c9aa71&color=fff&bold=true" },
    { id: 4, name: "Dini Rahayu", role: "Event Organizer", quotes: "Kreativitas adalah kunci event yang tak terlupakan.", photo: "https://ui-avatars.com/api/?name=Dini+Rahayu&size=300&background=27ae60&color=fff&bold=true" },
  ],
  users: HARDCODED_USERS.map((u, i) => ({ id: i + 1, ...u, email: `${u.username}@vastura.com`, active: true })),
};

/* ─────────────── GLOBAL STYLES ─────────────── */
const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Cinzel:wght@700;900&family=Montserrat:wght@700;800;900&family=Raleway:wght@700;800;900&family=Oswald:wght@600;700&family=Bebas+Neue&family=Lora:wght@700&family=Josefin+Sans:wght@700&family=Inter:wght@700;800;900&display=swap');

    /* ── FORCE LIGHT MODE — kebal dark mode OS/browser (semua platform) ── */
    :root {
      color-scheme: only light !important;
      forced-color-adjust: none !important;
      -webkit-forced-color-adjust: none !important;
    }
    html {
      color-scheme: only light !important;
      forced-color-adjust: none !important;
      -webkit-forced-color-adjust: none !important;
      background-color: #2E3D3F !important;
      filter: none !important;
    }
    body {
      color-scheme: only light !important;
      forced-color-adjust: none !important;
      -webkit-forced-color-adjust: none !important;
      background-color: #2E3D3F !important;
      color: #111111 !important;
      filter: none !important;
    }
    /* Semua elemen tidak boleh dibalik warnanya oleh browser/OS */
    *, *::before, *::after {
      forced-color-adjust: none !important;
      -webkit-forced-color-adjust: none !important;
    }
    /* Override media query dark mode — paksa tetap light */
    @media (prefers-color-scheme: dark) {
      :root {
        color-scheme: only light !important;
        forced-color-adjust: none !important;
        -webkit-forced-color-adjust: none !important;
      }
      html {
        color-scheme: only light !important;
        background-color: #2E3D3F !important;
        filter: none !important;
        -webkit-filter: none !important;
      }
      body {
        color-scheme: only light !important;
        background-color: #2E3D3F !important;
        color: #2E3D3F !important;
        filter: none !important;
        -webkit-filter: none !important;
      }
      *, *::before, *::after {
        color-scheme: light !important;
        forced-color-adjust: none !important;
        -webkit-forced-color-adjust: none !important;
        /* Tidak pakai filter invert — biarkan inline style yang mengatur warna */
      }
    }

    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
    body{font-family:'DM Sans',sans-serif;background:#FAF7F0;color:#111111;line-height:1.6;font-size:16px}
    ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:rgba(201,170,113,.5);border-radius:10px}
    a{text-decoration:none;color:inherit}
    a:focus-visible,button:focus-visible{outline:2px solid #C9AA71;outline-offset:3px;border-radius:3px}
    img{max-width:100%;display:block;object-fit:cover}
    input,textarea,select,button{font-family:'DM Sans',sans-serif}
    button{cursor:pointer;border:none;background:none}
    .serif{font-family:'Cormorant Garamond',serif}
    .display{font-family:'Playfair Display',serif}
    .fade-in{animation:fadeIn .4s ease}
    @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
    @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
    @keyframes galScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
    @keyframes navNamePulse{0%,100%{color:#fff}33%{color:#E8C96A}66%{color:#2E3D3F}}
    @keyframes navPulse{0%{color:#fff}30%{color:#fff}33%{color:#E8C96A}63%{color:#E8C96A}66%{color:#2E3D3F}96%{color:#2E3D3F}100%{color:#fff}}

    /* Gallery ticker — desktop only */
    .gal-ticker{overflow:hidden;margin-bottom:40px;mask-image:linear-gradient(to right,transparent 0%,#000 6%,#000 94%,transparent 100%);-webkit-mask-image:linear-gradient(to right,transparent 0%,#000 6%,#000 94%,transparent 100%)}
    .gal-ticker-track{display:flex;gap:10px;width:max-content;animation:galScroll 22s linear infinite}
    .gal-ticker-track:hover{animation-play-state:paused}
    .gal-ticker-item{width:220px;height:148px;border-radius:6px;overflow:hidden;flex-shrink:0}
    .gal-ticker-item img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s ease}
    .gal-ticker-item:hover img{transform:scale(1.06)}
    @media(max-width:900px){
      .gal-ticker{mask-image:none;-webkit-mask-image:none}
      .gal-ticker-track{animation:none;flex-wrap:wrap;justify-content:center;width:100%}
      .gal-ticker-item{width:calc(50% - 6px);height:120px}
    }

    h1,h2,h3,h4,h5{font-family:'Playfair Display',serif;color:#fff;line-height:1.15;font-weight:800;letter-spacing:-.01em}
    h1{font-size:clamp(2rem,5vw,3.5rem)}
    h2{font-size:clamp(1.6rem,3.5vw,2.6rem)}
    h3{font-size:clamp(1.2rem,2.5vw,1.6rem)}
    p{font-size:1rem;line-height:1.75;color:rgba(255,255,255,.8)}
    small{font-size:.875rem;line-height:1.5}

    .nav-link{position:relative;padding-bottom:3px;font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;font-weight:600;color:var(--re-grey-dk);transition:color .2s;font-family:'Jost',sans-serif}
    .nav-dropdown-panel{animation:fadeIn .18s ease}
    .nav-link::after{content:'';position:absolute;bottom:0;left:0;width:0;height:1.5px;background:#C9AA71;transition:width .3s;border-radius:2px}
    .nav-link:hover{color:var(--re-black)}
    .nav-link:hover::after,.nav-link.active::after{width:100%}
    .nav-link.active{color:#C9AA71!important;font-weight:700}

    .hover-lift{transition:transform .3s,box-shadow .3s}
    .hover-lift:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(46,61,63,.12)}
    .img-zoom{overflow:hidden}
    .img-zoom img{transition:transform .6s cubic-bezier(.25,.46,.45,.94)}
    .img-zoom:hover img{transform:scale(1.07)}
    .cms-toolbar button:hover{background:rgba(139,105,20,.12)!important}
    .post-card:hover .post-card-title{color:#C9AA71}

    /* DESKTOP-ONLY ANIMATIONS */
    @media(min-width:901px){
      .anim-fade-up{opacity:0;transform:translateY(32px);transition:opacity .7s cubic-bezier(.22,1,.36,1),transform .7s cubic-bezier(.22,1,.36,1)}
      .anim-fade-up.visible{opacity:1;transform:translateY(0)}
      .anim-fade-up.exit{opacity:0;transform:translateY(-24px);transition:opacity .45s ease,transform .45s ease}
      .anim-zoom{opacity:0;transform:scale(.94);transition:opacity .65s ease,transform .65s ease}
      .anim-zoom.visible{opacity:1;transform:scale(1)}
      .anim-zoom.exit{opacity:0;transform:scale(.96);transition:opacity .45s ease,transform .45s ease}
      .btn-magnetic{transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s}
      .btn-magnetic:hover{transform:scale(1.045) translateY(-2px);box-shadow:0 12px 32px rgba(46,61,63,.18)}
      .post-card{transition:transform .35s cubic-bezier(.22,1,.36,1),box-shadow .35s;transform-style:preserve-3d}
      .post-card:hover{transform:translateY(-6px) rotate3d(1,1,0,.8deg);box-shadow:0 20px 48px rgba(46,61,63,.14)}
      @keyframes heroReveal{from{opacity:0;letter-spacing:-.05em;filter:blur(6px)}to{opacity:1;letter-spacing:-.01em;filter:blur(0)}}
      @keyframes flareShift{0%,100%{transform:scale(1) translate(0,0);opacity:.7}50%{transform:scale(1.15) translate(5px,-5px);opacity:1}}
      .hero-title-anim{animation:heroReveal .9s cubic-bezier(.22,1,.36,1) .15s both}
      @keyframes floatA{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
      @keyframes floatB{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
      .hero-img-grid>div:nth-child(1){animation:floatA 5s ease-in-out infinite}
      .hero-img-grid>div:nth-child(2){animation:floatB 6s ease-in-out infinite .5s}
      .hero-img-grid>div:nth-child(3){animation:floatA 7s ease-in-out infinite 1s}
      .hero-img-grid>div:nth-child(4){animation:floatB 5.5s ease-in-out infinite .8s}
      *{cursor:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.54.35-.85L6.35 2.85a.5.5 0 0 0-.85.36z' fill='%230891b2' stroke='%23fff' stroke-width='1'/%3E%3C/svg%3E") 5 3, auto}
    }

    .logo-brand{font-family:'Playfair Display',serif;font-weight:900;font-size:1.3rem;line-height:1.1;letter-spacing:.06em;text-transform:uppercase;color:#111;text-shadow:0 1px 6px rgba(0,0,0,.35),0 2px 14px rgba(0,0,0,.18)}
    .logo-brand-footer{font-family:'Playfair Display',serif;font-weight:900;font-size:1.15rem;line-height:1.15;letter-spacing:.06em;text-transform:uppercase;color:#111;text-shadow:0 1px 3px rgba(0,0,0,.12)}
    .logo-brand-admin{font-family:'Playfair Display',serif;font-weight:800;font-size:.9rem;line-height:1.1;letter-spacing:.06em;text-transform:uppercase;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.3)}
    .label-xs{font-size:.6875rem;letter-spacing:.1em;text-transform:uppercase;font-weight:600;color:rgba(255,255,255,.65)}
    .card-title{font-family:'Playfair Display',serif;font-weight:700;font-size:1.15rem;line-height:1.3;color:#2E3D3F}

    /* ── Visibility helpers ── */
    @media(max-width:900px){.hide-md{display:none!important}}
    @media(max-width:900px){.hide-sm{display:none!important}.show-sm{display:flex!important}}
    @media(min-width:901px){.show-sm{display:none!important}}

    /* ══════════════════════════════════════
       RESPONSIVE LAYOUT UTILITIES
    ══════════════════════════════════════ */

    /* Two-column grid → single column on mobile */
    .grid-2{display:grid;grid-template-columns:1.618fr 1fr;gap:64px;align-items:center}
    @media(max-width:768px){.grid-2{grid-template-columns:1fr!important;gap:32px!important}}

    /* Hero section */
    .hero-section{padding:70px 5% 80px}
    @media(max-width:768px){.hero-section{padding:48px 5% 52px}}

    /* Section padding */
    .section-lg{padding:90px 0;position:relative;overflow:hidden}
    .section-lg .section-inner{max-width:1340px;margin:0 auto;padding:0 72px}
    .section-md{padding:80px 5%}
    @media(max-width:768px){.section-lg{padding:52px 0}.section-lg .section-inner{padding:0 20px}.section-md{padding:44px 5%}}

    /* Hero images grid: hide on mobile to prioritize text */
    .hero-img-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    @media(max-width:768px){.hero-img-grid{display:none}}

    /* Adventure images: stack on mobile */
    .adv-img-row{display:flex;gap:14px;align-items:flex-end}
    @media(max-width:768px){.adv-img-row{display:none}}

    /* Magazine grid kanan */
    .mag-grid{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto auto;gap:10px;position:relative}
    .mag-img-main{grid-column:1;grid-row:1/3;border-radius:6px;overflow:hidden;position:relative}
    .mag-img-main img{width:100%;height:100%;min-height:320px;object-fit:cover;display:block;transition:transform .6s ease}
    .mag-img-main:hover img{transform:scale(1.04)}
    .mag-img-main .foto-label{position:absolute;bottom:12px;left:12px;background:rgba(46,61,63,.82);color:#fff;font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;padding:5px 10px;border-radius:3px;font-weight:600}
    .mag-img-sm1{grid-column:2;grid-row:1;border-radius:6px;overflow:hidden}
    .mag-img-sm1 img{width:100%;height:155px;object-fit:cover;display:block;transition:transform .6s ease}
    .mag-img-sm1:hover img{transform:scale(1.04)}
    .mag-card-text{grid-column:2;grid-row:2;background:linear-gradient(135deg,#2E3D3F,#3D5254);border-radius:6px;padding:16px 18px;display:flex;flex-direction:column;justify-content:space-between;min-height:155px}
    .adv-stats-row{display:flex;gap:32px;margin-bottom:28px;padding-bottom:28px;border-bottom:1px solid #eef3f7}
    .adv-stat .num{font-family:'Playfair Display',serif;font-size:1.75rem;font-weight:900;color:#C9AA71;line-height:1;margin-bottom:3px}
    .adv-stat .lbl{font-size:.6875rem;letter-spacing:.1em;text-transform:uppercase;color:#9A8A5A;font-weight:600}
    .adv-eyebrow{display:flex;align-items:center;gap:14px;margin-bottom:22px}
    .adv-eyebrow .ey-line{width:36px;height:1.5px;background:#C9AA71;flex-shrink:0}
    .adv-quote{font-size:.9375rem;color:#2E3D3F;line-height:1.9;font-style:italic;max-width:400px;margin-bottom:28px;padding-left:18px;border-left:2px solid #C9AA71;white-space:pre-line}

    /* Margin dekorasi kiri-kanan */
    .adv-margin-deco{position:absolute;top:0;bottom:0;width:52px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:20px 0}
    .adv-margin-deco.left{left:0;border-right:1px solid #F0E8D8}
    .adv-margin-deco.right{right:0;border-left:1px solid #F0E8D8}
    .adv-margin-deco .issue-text{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#C9AA71;writing-mode:vertical-rl;transform:rotate(180deg);font-weight:600}
    .adv-margin-deco .dot-col{display:flex;flex-direction:column;gap:6px;align-items:center}
    .adv-margin-deco .dot{width:4px;height:4px;border-radius:50%;background:#E8DCC8}
    .adv-margin-deco .dot.on{background:#2E3D3F}
    .deco-corner-tr{position:absolute;top:20px;right:60px;width:70px;height:70px;border-top:1.5px solid #F0E8D8;border-right:1.5px solid #F0E8D8;pointer-events:none}
    .deco-corner-bl{position:absolute;bottom:20px;left:60px;width:50px;height:50px;border-bottom:1.5px solid #F0E8D8;border-left:1.5px solid #F0E8D8;pointer-events:none}
    @media(max-width:900px){.adv-margin-deco{display:none}.deco-corner-tr,.deco-corner-bl{display:none}.section-inner{padding:0 24px!important}}
    @media(max-width:768px){.mag-grid{display:none}.adv-stats-row{gap:20px}}

    /* ── Hero Intro Section (Title + Subtitle after slideshow) ── */
    .hero-intro{background:#ffffff;padding:56px 5% 48px;overflow:hidden;position:relative;border-bottom:1px solid #e8f5f8}
    .hero-intro-inner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
    .hero-intro-img{position:relative;border-radius:16px;overflow:hidden;box-shadow:0 24px 64px rgba(46,61,63,.14)}
    .hero-intro-img img{width:100%;height:380px;object-fit:cover;display:block;transition:transform .8s cubic-bezier(.25,.46,.45,.94)}
    .hero-intro-img:hover img{transform:scale(1.04)}
    /* Ornamen shape */
    .hero-intro-img::before{content:"";position:absolute;top:-18px;left:-18px;width:90px;height:90px;border-radius:50%;background:rgba(56,197,216,.18);z-index:0;pointer-events:none}
    .hero-intro-img::after{content:"";position:absolute;bottom:-14px;right:-14px;width:60px;height:60px;border:3px solid rgba(8,145,178,.25);border-radius:50%;z-index:0;pointer-events:none}
    .hero-intro-txt{position:relative;z-index:1}
    .hero-intro-eyebrow{display:flex;align-items:center;gap:12px;margin-bottom:18px}
    .hero-intro-eyebrow .line{width:36px;height:2px;background:linear-gradient(90deg,#8B6914,rgba(8,145,178,0));border-radius:1px}
    .hero-intro-h1{font-family:"Playfair Display",serif;font-size:clamp(1.9rem,4.5vw,3.2rem);font-weight:900;color:#2E3D3F;line-height:1.08;margin-bottom:20px;letter-spacing:-.02em}
    .hero-intro-p{font-size:1rem;color:#5A6A6C;line-height:1.85;margin-bottom:32px;max-width:400px}
    /* Deco blobs background */
    .hero-intro-blob1{position:absolute;top:-60px;right:-80px;width:280px;height:280px;border-radius:50%;background:radial-gradient(circle,rgba(139,105,20,.1) 0%,rgba(8,145,178,0) 70%);pointer-events:none}
    .hero-intro-blob2{position:absolute;bottom:-40px;left:40%;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(56,197,216,.09) 0%,rgba(56,197,216,0) 70%);pointer-events:none}
    /* Ornamen dekoratif teks */
    .hero-intro-deco-line{position:absolute;top:0;right:0;width:1px;height:100%;background:linear-gradient(to bottom,rgba(13,59,102,0),rgba(13,59,102,.08),rgba(13,59,102,0));pointer-events:none}
    /* Animasi reveal */
    @keyframes introImgReveal{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:none}}
    @keyframes introTxtReveal{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}
    @keyframes shapeFloat{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-8px) rotate(4deg)}}
    @keyframes blobPulse{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.08);opacity:1}}
    .hero-intro-img{animation:introImgReveal .8s cubic-bezier(.22,1,.36,1) .1s both}
    .hero-intro-txt{animation:introTxtReveal .8s cubic-bezier(.22,1,.36,1) .25s both}
    .hero-intro-blob1{animation:blobPulse 6s ease-in-out infinite}
    .hero-intro-blob2{animation:blobPulse 8s ease-in-out infinite 2s}
    /* Mobile */
    @media(max-width:768px){
      .hero-intro{padding:36px 4% 32px}
      .hero-intro-inner{grid-template-columns:1fr;gap:28px}
      .hero-intro-img{order:1}
      .hero-intro-txt{order:2}
      .hero-intro-img img{height:220px;border-radius:12px}
      .hero-intro-h1{font-size:clamp(1.6rem,7vw,2.4rem)}
      .hero-intro-p{max-width:100%;font-size:.9375rem;margin-bottom:22px}
      .hero-intro-img::before,.hero-intro-img::after{display:none}
      .hero-intro-blob1,.hero-intro-blob2{display:none}
    }
    @media(max-width:480px){
      .hero-intro{padding:28px 4% 24px}
      .hero-intro-inner{gap:20px}
      .hero-intro-img img{height:190px}
    }

    /* ── Adventure Section — TEKS KIRI clean + PUZZLE IMG KANAN ── */
    .adv2-grid{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;max-width:1100px;margin:0 auto}
    /* Teks kiri */
    .adv2-eyebrow{display:flex;align-items:center;gap:12px;margin-bottom:18px}
    .adv2-eyebrow .line{width:36px;height:1.5px;background:#C9AA71;flex-shrink:0}
    .adv2-eyebrow span{font-size:.65rem;letter-spacing:.2em;text-transform:uppercase;color:#C9AA71;font-weight:700}
    .adv2-title{font-family:"Playfair Display",serif;font-size:clamp(1.8rem,3.8vw,2.8rem);font-weight:900;color:#fff;line-height:1.08;margin-bottom:14px}
    /* Quote slideshow */
    .adv2-quote-wrap{position:relative;min-height:56px;margin-bottom:28px;padding-left:16px;border-left:2px solid #C9AA71}
    .adv2-quote-item{position:absolute;top:0;left:16px;right:0;font-size:.9375rem;color:rgba(255,255,255,.75);line-height:1.85;font-style:italic;opacity:0;transition:opacity .6s ease;pointer-events:none}
    .adv2-quote-item.active{opacity:1;position:relative;left:0}
    .adv2-quote-dots{display:flex;gap:6px;margin-bottom:28px}
    .adv2-qdot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.25);border:none;cursor:pointer;transition:background .3s,width .3s}
    .adv2-qdot.on{width:18px;border-radius:3px;background:#C9AA71}
    .adv2-stats{display:flex;gap:28px;margin-bottom:28px;padding-bottom:24px;border-bottom:1px solid rgba(255,255,255,.12)}
    .adv2-stat .num{font-family:"Playfair Display",serif;font-size:1.75rem;font-weight:900;color:#C9AA71;line-height:1;margin-bottom:3px}
    .adv2-stat .lbl{font-size:.625rem;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.72);font-weight:600}
    .adv2-btns{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:20px}
    .adv2-btn-pill{padding:8px 16px;background:rgba(255,255,255,.08);color:rgba(255,255,255,.85);border:1px solid rgba(255,255,255,.15);border-radius:20px;font-size:.75rem;font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap}
    .adv2-btn-pill:hover{background:rgba(255,255,255,.16);color:#fff}
    .adv2-cta{display:inline-flex;align-items:center;gap:10px;padding:12px 24px;background:linear-gradient(135deg,#C9AA71,#E8C96A);color:#2E3D3F;border:none;border-radius:6px;font-size:.8125rem;font-weight:800;cursor:pointer;letter-spacing:.06em;text-transform:uppercase;transition:opacity .2s,transform .2s;font-family:"Playfair Display",serif}
    .adv2-cta:hover{opacity:.9;transform:translateY(-1px)}
    /* Puzzle grid kanan */
    .adv2-puzzle{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:8px;height:480px}
    .adv2-puzzle-a{grid-column:1;grid-row:1/3;border-radius:12px;overflow:hidden}
    .adv2-puzzle-b{grid-column:2;grid-row:1;border-radius:12px;overflow:hidden}
    .adv2-puzzle-c{grid-column:2;grid-row:2;border-radius:12px;overflow:hidden;display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .adv2-puzzle-c-sm{border-radius:8px;overflow:hidden}
    .adv2-puzzle a,.adv2-puzzle-a,.adv2-puzzle-b,.adv2-puzzle-c-sm{transition:transform .35s;cursor:default}
    .adv2-puzzle-a:hover,.adv2-puzzle-b:hover,.adv2-puzzle-c-sm:hover{transform:scale(1.02)}
    .adv2-puzzle img{width:100%;height:100%;object-fit:cover;display:block}
    @media(max-width:900px){
      .adv2-grid{grid-template-columns:1fr;gap:36px}
      .adv2-puzzle{height:320px;order:-1}
      .adv2-puzzle-c{display:grid}
    }
    @media(max-width:480px){.adv2-puzzle{height:220px;gap:5px}}

    /* Book section images: hide on small screens */
    /* Book section images: hide on small screens */
    .book-img-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    @media(max-width:768px){.book-img-grid{display:none}}

    /* Contact grid */
    .contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:60px}
    @media(max-width:768px){.contact-grid{grid-template-columns:1fr!important;gap:32px!important}}

    /* Globe section */
    .globe-inner{display:flex;align-items:center;gap:60px;flex-wrap:nowrap}
    .globe-visual{flex:0 0 auto;display:flex;align-items:center;justify-content:center}
    @media(max-width:768px){.globe-visual{display:none}}

    /* Footer grid */
    .footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:48px}
    @media(max-width:900px){.footer-grid{grid-template-columns:1fr 1fr;gap:32px}}
    @media(max-width:640px){.footer-grid{grid-template-columns:1fr;gap:28px}}

    /* About page */
    .about-hero-grid{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
    .about-why-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}
    @media(max-width:768px){.about-hero-grid{grid-template-columns:1fr;gap:32px}.about-why-grid{grid-template-columns:1fr;gap:16px}}

    /* Dashboard DashTabs grid */
    .dash-grid{display:grid;grid-template-columns:1fr 320px;gap:20px;align-items:start}
    @media(max-width:1024px){.dash-grid{grid-template-columns:1fr;gap:16px}}

    /* Admin panel: sidebar + main */
    .admin-body{display:flex;flex:1;overflow:hidden}
    .admin-sidebar{width:240px;background:linear-gradient(160deg,#1A2425 0%,#2E3D3F 40%,#3D5254 100%);flex-shrink:0;overflow-y:auto;display:flex;flex-direction:column;transition:transform .25s;box-shadow:4px 0 24px rgba(0,0,0,.25)}
    .admin-main{flex:1;overflow-y:auto;padding:32px}
    @media(max-width:768px){
      .admin-sidebar{position:fixed;top:58px;left:0;bottom:0;z-index:200;transform:translateX(-100%)}
      .admin-sidebar.open{transform:translateX(0)}
      .admin-main{padding:20px 16px}
    }
    /* Sidebar nav items */
    .snav-btn{width:100%;padding:11px 20px;text-align:left;background:none;color:rgba(255,255,255,.6);font-size:13px;font-weight:700;letter-spacing:.2px;border:none;border-left:3px solid transparent;border-radius:0 10px 10px 0;cursor:pointer;display:flex;align-items:center;gap:11px;transition:all .18s cubic-bezier(.4,0,.2,1);margin-bottom:2px;position:relative;overflow:hidden}
    .snav-btn::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(201,170,113,.15),transparent);opacity:0;transition:opacity .18s}
    .snav-btn:hover{color:#fff;background:rgba(255,255,255,.08);border-left-color:rgba(201,170,113,.5);transform:translateX(4px) scale(1.01);box-shadow:0 2px 12px rgba(0,0,0,.18)}
    .snav-btn:hover::before{opacity:1}
    .snav-btn.active{color:#C9AA71;background:rgba(201,170,113,.12);border-left-color:#E8C96A;font-weight:800;box-shadow:inset 0 0 0 1px rgba(201,170,113,.12),0 2px 12px rgba(0,0,0,.15)}
    .snav-icon{font-size:16px;width:22px;text-align:center;flex-shrink:0}

    /* Admin hamburger toggle — shown only on mobile */
    .admin-hamburger{display:none;background:none;border:none;color:rgba(255,255,255,.8);font-size:20px;padding:4px 8px;cursor:pointer;line-height:1}
    @media(max-width:768px){.admin-hamburger{display:flex;align-items:center}}

    /* Admin sidebar overlay on mobile */
    .sidebar-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:199}
    @media(max-width:768px){.sidebar-overlay.open{display:block}}

    /* CMS Editor: editor + sidebar */
    .cms-editor-grid{display:grid;grid-template-columns:1fr 300px;min-height:700px}
    @media(max-width:900px){.cms-editor-grid{grid-template-columns:1fr}}
    .cms-editor-left{padding:32px 40px;border-right:1px solid #F5EDD8;overflow-y:auto}
    .cms-editor-right{padding:16px 16px;background:#FDFAF4;display:flex;flex-direction:column;gap:12px;overflow-y:auto;max-height:calc(100vh - 60px);position:sticky;top:0;scrollbar-width:thin}
    @media(max-width:900px){
      .cms-editor-left{padding:20px 16px;border-right:none;border-bottom:1px solid #F5EDD8}
      .cms-editor-right{padding:16px;max-height:none;position:static}
    }

    /* Dashboard profile header */
    .dash-profile-header{display:flex;align-items:flex-start;gap:24px;flex-wrap:wrap}
    .dash-action-btns{display:flex;flex-direction:column;gap:10px;flex-shrink:0}
    @media(max-width:640px){
      .dash-profile-header{flex-direction:column;gap:16px}
      .dash-action-btns{flex-direction:row;flex-wrap:wrap;width:100%}
      .dash-action-btns button{flex:1;min-width:140px;justify-content:center}
    }

    /* Settings grid */
    .settings-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
    @media(max-width:640px){.settings-grid{grid-template-columns:1fr}}

    /* Profile grid */
    .profile-grid{display:grid;grid-template-columns:280px 1fr;gap:28px;align-items:start}
    @media(max-width:768px){.profile-grid{grid-template-columns:1fr}}

    /* Users table — horizontal scroll on mobile */
    .table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
    .table-wrap table{min-width:560px}

    /* Post section page */
    .section-header-row{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
    .section-filter-row{display:flex;gap:8px;flex-wrap:wrap}

    /* CMS top bar */
    .cms-topbar{background:#2E3D3F;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}
    @media(max-width:640px){.cms-topbar{padding:12px 14px}.cms-topbar-btns{gap:6px}}

    /* Login modal */
    .login-modal{background:#fff;border-radius:8px;padding:48px 44px;width:90%;max-width:400px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.2)}
    @media(max-width:480px){.login-modal{padding:32px 22px}}

    /* Touch-friendly tap targets */
    @media(max-width:768px){
      button,a,[role=button]{min-height:40px}
      input,textarea,select{font-size:16px!important} /* prevent iOS zoom */
    }

    /* Reduced motion */
    @media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}

    /* ══════════════════════════════════════════════
       MOBILE OPTIMISATION — COMPREHENSIVE OVERHAUL
    ══════════════════════════════════════════════ */

    /* 0. Base: box-sizing, no horizontal overflow */
    *,*::before,*::after{box-sizing:border-box}
    html,body{overflow-x:hidden;width:100%;-webkit-text-size-adjust:100%}
    img,video,iframe{max-width:100%;height:auto;display:block}

    /* 1. Navbar — compact on mobile, fully opaque */
    @media(max-width:640px){
      nav{background:linear-gradient(105deg,#ffffff 0%,#e8f9fb 30%,#a8dde8 62%,#B8962A 100%)!important;backdrop-filter:none!important;padding:0 4%!important;overflow:visible!important}
      nav>div:not(.mobile-dropdown){height:60px!important;gap:10px!important}
      /* Fix 10: logo mobile — diperbesar */
      nav img{height:52px!important;max-width:160px!important;width:auto!important}
    }
    /* Fix logo wrap — tablet & smartphone (semua layar ≤900px) */
    @media(max-width:900px){
      .navbar-logo-wrap > div { gap: 8px !important; }
      .navbar-logo-wrap > div > div:first-child { width: 40px !important; height: 40px !important; border-radius: 8px !important; }
      .navbar-logo-wrap > div > div:first-child svg { width: 18px !important; height: 18px !important; }
      .navbar-logo-wrap > div > span.logo-brand { font-size: 0.82rem !important; line-height: 1.15 !important; }
      .navbar-logo-wrap img { height: 52px !important; max-width: 160px !important; }
    }

    /* 2. Hero Slideshow — readable height, no side gradients overflow */
    @media(max-width:640px){
      /* Side gradients: lebih tipis di mobile */
      .hero-side-grad{width:8%!important}
    }
    @media(max-width:380px){
      .hero-side-grad{display:none!important}
    }

    /* Map section mobile */
    @media(max-width:900px){
      .map-section-hide-mobile{display:none!important}
      .map-text-width{width:100%!important;padding:44px 5%!important}
    }

    /* 3. Adventure section — teks + stats selalu tampil, image grid tersembunyi */
    @media(max-width:768px){
      .mag-grid{display:none!important}
      .adv-quote{max-width:100%!important;white-space:normal!important}
      .adv-stats-row{flex-wrap:wrap!important;gap:16px!important}
      .adv-stat{min-width:80px}
      /* Tombol layanan wrap */
      div[style*="flexWrap: wrap"][style*="gap: 10"]{gap:8px!important}
    }
    @media(max-width:480px){
      .adv-stats-row{gap:12px!important}
      .adv-stat .num{font-size:1.4rem!important}
    }

    /* 4. Gallery grid — 2 kolom di mobile */
    @media(max-width:640px){
      .gal-grid{grid-template-columns:repeat(2,1fr)!important;gap:6px!important}
    }

    /* 5. Book section — full width satu kolom */
    @media(max-width:768px){
      .book-img-grid{display:none!important}
      /* Book section: single column */
      section[style*="#E8DCC8"] > div.grid-2{display:block!important}
      section[style*="#E8DCC8"] > div > div:last-child{padding-top:0!important}
    }

    /* 6. Contact / Globe section */
    @media(max-width:768px){
      .globe-visual{display:none!important}
      .globe-inner{flex-direction:column!important;gap:28px!important}
      /* Map search bar: wrap pada mobile */
      div[style*="rgba(255,255,255,.06)"]{font-size:14px!important}
    }
    @media(max-width:480px){
      /* Contact: stack input full width */
      .contact-grid input,.contact-grid textarea{font-size:16px!important}
    }

    /* 7. Section page (news/shop/destinations) */
    @media(max-width:768px){
      .section-page-grid{grid-template-columns:1fr!important;gap:24px!important}
      .section-page-grid aside{display:none!important}
    }

    /* 8. PostCard */
    @media(max-width:480px){
      .post-card-list{flex-direction:column!important}
      .post-card-list .post-thumb{width:100%!important;height:160px!important;border-radius:8px 8px 0 0!important}
    }

    /* 9. Services page */
    @media(max-width:640px){
      /* Category tabs: scrollable horizontal */
      div[style*="border-radius: 999px"][style*="overflow"]{overflow-x:auto!important;flex-wrap:nowrap!important;-webkit-overflow-scrolling:touch!important;padding-bottom:4px!important}
      /* Service cards: single column */
      div[style*="minmax(280px"]{grid-template-columns:1fr!important}
    }

    /* 10. About page */
    @media(max-width:768px){
      .about-hero-grid{grid-template-columns:1fr!important;gap:24px!important}
      .about-why-grid{grid-template-columns:1fr!important;gap:14px!important}
    }
    @media(max-width:640px){
      .about-hero-section{padding:36px 4%!important}
    }

    /* 11. Footer */
    @media(max-width:900px){.footer-grid{grid-template-columns:1fr 1fr!important;gap:28px!important}}
    @media(max-width:640px){.footer-grid{grid-template-columns:1fr!important;gap:22px!important}}
    @media(max-width:480px){
      .footer-grid{gap:18px!important}
      /* Footer bottom bar: stack */
      div[style*="borderTop: \"1px solid #E8DCC8\""] > div{flex-direction:column!important;gap:10px!important;align-items:flex-start!important}
    }

    /* 12. Navbar mobile menu — tidak tumpang tindih konten */
    @media(max-width:640px){
      /* Mobile menu dropdown: posisi absolute ikut bawah nav, scroll kalau banyak item */
      nav .mobile-dropdown{position:absolute!important;top:100%!important;left:0!important;right:0!important;max-height:calc(100vh - 64px)!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;display:flex!important;flex-direction:column!important}
    }

    /* 13. WhatsApp button — jangan tutupi konten penting */
    @media(max-width:480px){
      a[title*="WhatsApp"]{bottom:16px!important;right:14px!important;width:50px!important;height:50px!important}
    }

    /* 14. Article detail — handled in main layout block above */

    /* 15. Buttons: solid color, NO transparent background on mobile */
    @media(max-width:640px){
      /* About Us ghost button di hero → solid gelap */
      button.hero-cta-btn[style*="transparent"]{background:#2E3D3F!important;border-color:#2E3D3F!important;color:#fff!important}
      /* Explore All & Book Now ghost buttons → solid */
      button[style*='"transparent"']{background:#2E3D3F!important;color:#fff!important}
    }

    /* Explore dropdown: di mobile tidak absolute agar tidak overlap konten */
    @media(max-width:768px){
      .explore-dropdown{position:static!important;top:auto!important;left:auto!important;margin-top:6px!important;width:100%!important;box-shadow:none!important;border-radius:4px!important}
      .explore-wrap{display:block!important;width:100%!important}
      .explore-wrap button.btn-outline-solid{width:100%!important}
    }

    /* 16. Input: prevent iOS zoom, full width */
    @media(max-width:768px){
      input,textarea,select{font-size:16px!important;max-width:100%!important}
    }

    /* 17. Images: fluid & no overflow */
    img{max-width:100%;height:auto;object-fit:cover}

    /* 18. Pre-line text: wrap normal pada mobile (cegah overflow) */
    @media(max-width:640px){
      [style*="whiteSpace: \"pre-line\""]{white-space:normal!important;word-break:break-word!important}
    }

    /* 19. Grid-2 (golden ratio) → single col on mobile */
    @media(max-width:768px){
      .grid-2{grid-template-columns:1fr!important;gap:28px!important}
    }

    /* 20. Section spacing: tighter on mobile */
    @media(max-width:640px){
      .section-lg{padding:40px 0!important}
      .section-lg .section-inner{padding:0 16px!important}
      .section-md{padding:36px 4%!important}
      .hero-section{padding:32px 4% 36px!important}
    }

    /* 21. Dash-tab-row: scrollable horizontal */
    @media(max-width:480px){
      .dash-tab-row{overflow-x:auto!important;flex-wrap:nowrap!important;-webkit-overflow-scrolling:touch!important}
      .dash-tab-row button{flex-shrink:0!important;min-width:75px!important;font-size:.75rem!important;padding:11px 8px!important}
    }

    /* 22. Admin panel */
    @media(max-width:768px){
      .admin-main{padding:16px 14px!important}
    }
    @media(max-width:480px){
      .admin-main{padding:12px 10px!important}
    }

    /* 23. Table horizontal scroll */
    .table-wrap{overflow-x:auto!important;-webkit-overflow-scrolling:touch!important}
    .table-wrap table{min-width:520px!important}

    /* 24. Login modal */
    @media(max-width:480px){.login-modal{padding:28px 18px!important;width:94%!important}}
    @media(max-width:360px){.login-modal{padding:22px 14px!important}}

    /* 25. Reduced-motion already set above */

    /* 26. Tap target minimum */
    @media(max-width:768px){
      button,a[href],[role=button]{min-height:42px;min-width:42px}
    }

    /* 27. Stats page/dash grid: single col on tablet */
    @media(max-width:1024px){.dash-grid{grid-template-columns:1fr!important;gap:16px!important}}

    /* 28. Hero slideshow CTA buttons — flex wrap, tidak tumpang tindih */
    @media(max-width:480px){
      .hero-cta-btn{flex:1!important;min-width:120px!important;text-align:center!important;padding:11px 16px!important;font-size:.75rem!important}
    }

    /* 29. Prevent any element from exceeding viewport */
    @media(max-width:640px){
      .page-wrap,main,[class*="section"]{max-width:100vw!important}
    }

    /* ══════════════════════════════════════
       MOBILE FIRST — GLOBAL FIXES
    ══════════════════════════════════════ */
    *{box-sizing:border-box}
    html{overflow-x:hidden}
    body{overflow-x:hidden;width:100%}

    /* Safe area for notch phones */
    @supports(padding:max(0px)){
      nav{padding-left:max(5%,env(safe-area-inset-left));padding-right:max(5%,env(safe-area-inset-right))}
    }

    /* Viewport meta helper — prevent horizontal overflow */
    .page-wrap{width:100%;max-width:100vw}

    /* ── Navbar mobile ── */
    @media(max-width:640px){
      nav{padding:0 4%!important}
      nav>div:not(.mobile-dropdown){height:64px!important}
      /* Mobile menu items: bigger tap targets */
      nav .mobile-nav-item{padding:12px 0;font-size:.9375rem}
    }

    /* ── Notification toast ── */
    @media(max-width:640px){
      .toast-notif{top:12px!important;right:12px!important;left:12px!important;max-width:none!important;font-size:13px}
    }

    /* ── Hero section mobile ── */
    @media(max-width:640px){
      .hero-section{padding:36px 4% 40px!important}
      .hero-section h1{font-size:clamp(1.75rem,8vw,2.5rem)!important;margin-bottom:14px!important}
      .hero-section p{font-size:.9375rem!important;margin-bottom:24px!important}
    }

    /* ── Section pages ── */
    @media(max-width:768px){
      /* Stack sidebar below posts on section pages */
      .section-page-grid{grid-template-columns:1fr!important;gap:28px!important}
      .section-page-grid aside{display:none} /* hide sidebar on mobile for clean view */
    }

    /* ── PostCard list view mobile ── */
    @media(max-width:480px){
      .post-card-list{flex-direction:column!important}
      .post-card-list .post-thumb{width:100%!important;height:160px!important}
    }

    /* ── Article Detail — Kompas-style 2-column ── */
    .art-page{ background:#f2f2f2; min-height:100vh; }
    .art-share-bar{ background:#fff; border-bottom:1px solid #e8e8e8; padding:10px 5%; display:flex; align-items:center; gap:14px; position:sticky; top:96px; z-index:88; }
    .art-share-bar .art-share-title{ flex:1; font-size:12px; color:#333; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .art-body-wrap{ max-width:1320px; margin:0 auto; padding:24px 3% 60px; display:grid; grid-template-columns:1fr 260px; gap:24px; align-items:start; }
    .art-main{ min-width:0; }
    .art-sidebar{ position:sticky; top:168px; }
    .art-cover-wrap{ position:relative; border-radius:6px; overflow:hidden; margin-bottom:0; }
    .art-cover-wrap img{ width:100%; display:block; max-height:500px; object-fit:cover; }
    .art-lihat-foto{ position:absolute; top:14px; right:14px; background:rgba(0,0,0,.55); color:#fff; font-size:11px; padding:5px 12px; border-radius:4px; display:flex; align-items:center; gap:5px; font-weight:500; }
    .art-content-card{ background:#fff; border-radius:6px; overflow:hidden; }
    .art-content-inner{ padding:24px 28px 32px; }
    .art-breadcrumb{ font-size:11px; color:#888; margin-bottom:10px; }
    .art-breadcrumb span{ color:#8B6914; }
    .art-h1{ font-size:clamp(1.25rem,2vw,1.6rem); font-weight:700; color:#111; line-height:1.35; margin-bottom:16px; font-family:'Playfair Display',serif; }
    .art-meta-row{ display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; padding-bottom:16px; border-bottom:1px solid #eee; flex-wrap:wrap; gap:10px; }
    .art-author{ display:flex; align-items:center; gap:10px; }
    .art-avatar{ width:38px; height:38px; border-radius:50%; background:linear-gradient(135deg,#3D5254,#E8C96A); display:flex; align-items:center; justify-content:center; color:#fff; font-size:13px; font-weight:700; flex-shrink:0; }
    .art-actions{ display:flex; gap:6px; }
    .art-action-btn{ width:32px; height:32px; border-radius:50%; border:1px solid #ddd; background:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:14px; transition:background .15s; }
    .art-action-btn:hover{ background:#f0f0f0; }
    .art-excerpt{ font-size:1.0625rem; color:#333; line-height:1.85; margin-bottom:24px; font-style:italic; font-family:'Cormorant Garamond',serif; padding:14px 18px; background:#f8fafc; border-left:3px solid #8B6914; border-radius:0 6px 6px 0; }
    .art-divider{ border:none; border-top:1px solid #eee; margin:28px 0; }

    /* Artikel Terkait */
    .art-terkait-scroll{ display:flex; gap:14px; overflow-x:auto; padding-bottom:8px; -webkit-overflow-scrolling:touch; scrollbar-width:thin; }
    .art-terkait-scroll::-webkit-scrollbar{ height:4px; }
    .art-terkait-scroll::-webkit-scrollbar-thumb{ background:#E8DCC8; border-radius:2px; }
    .art-terkait-card{ flex-shrink:0; width:220px; cursor:pointer; border-radius:6px; overflow:hidden; background:#fff; border:1px solid #eee; transition:box-shadow .15s; }
    .art-terkait-card:hover{ box-shadow:0 4px 14px rgba(0,0,0,.1); }

    /* Pilihan Untukmu */
    .art-pilihan-grid{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .art-pilihan-card{ cursor:pointer; border-radius:6px; overflow:hidden; background:#fff; border:1px solid #eee; transition:box-shadow .15s; }
    .art-pilihan-card:hover{ box-shadow:0 4px 14px rgba(0,0,0,.1); }

    /* Sidebar article cards */
    .art-sb-card{ display:flex; gap:10px; padding:12px 0; border-bottom:1px solid #eee; cursor:pointer; }
    .art-sb-card:last-child{ border-bottom:none; }
    .art-sb-thumb{ width:80px; height:60px; border-radius:4px; overflow:hidden; flex-shrink:0; }
    .art-sb-thumb img{ width:100%; height:100%; object-fit:cover; }

    /* Tags */
    .art-tags{ display:flex; gap:7px; flex-wrap:wrap; margin-top:24px; padding-top:20px; border-top:1px solid #eee; }

    /* Share bar share btns */
    .art-share-icon{ width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:13px; cursor:pointer; flex-shrink:0; }

    @media(max-width:900px){
      .art-body-wrap{ grid-template-columns:1fr!important; }
      .art-sidebar{ position:static!important; }
      .art-pilihan-grid{ grid-template-columns:1fr 1fr; }
    }
    @media(max-width:640px){
      .art-share-bar{ top:58px!important; }
      .art-body-wrap{ padding:12px 3% 40px!important; gap:16px!important; }
      .art-content-inner{ padding:16px 16px 24px!important; }
      .art-h1{ font-size:clamp(1.1rem,5vw,1.35rem)!important; }
      .art-pilihan-grid{ grid-template-columns:1fr!important; }
    }

    /* ── Contact grid mobile ── */
    @media(max-width:480px){
      .contact-grid{gap:24px!important}
    }

    /* ── Footer ── */
    @media(max-width:480px){
      .footer-grid{gap:20px!important}
    }

    /* ── About page ── */
    @media(max-width:640px){
      .about-hero-section{padding:40px 4%!important}
    }

    /* ── CMS Editor on mobile ── */
    @media(max-width:640px){
      .cms-editor-left{padding:16px 12px!important}
      .cms-editor-right{padding:12px!important}
    }

    /* ── Admin main padding on small phones ── */
    @media(max-width:480px){
      .admin-main{padding:14px 12px!important}
    }

    /* ── DashTabs: scrollable tab row on small screens ── */
    @media(max-width:480px){
      .dash-tab-row{overflow-x:auto!important;-webkit-overflow-scrolling:touch!important;flex-wrap:nowrap!important}
      .dash-tab-row button{flex-shrink:0!important;min-width:80px!important;font-size:.75rem!important;padding:12px 10px!important}
    }

    /* ── Profile grid on phone ── */
    @media(max-width:480px){
      .profile-grid{gap:20px!important}
    }

    /* ── Fluid images ── */
    img{max-width:100%;height:auto}

    /* ── Gallery grid on mobile ── */
    @media(max-width:480px){
      .gal-grid{grid-template-columns:repeat(2,1fr)!important;gap:6px!important}
    }

    /* ── Tablet breakpoint 768-1024 ── */
    @media(min-width:641px) and (max-width:1024px){
      .hero-section{padding:52px 5% 60px}
      .section-lg{padding:60px 5%}
      .section-md{padding:52px 5%}
      /* Section page: narrower sidebar */
      .section-page-grid{grid-template-columns:1fr 260px!important;gap:28px!important}
    }

    /* ── Login modal ── */
    @media(max-width:360px){.login-modal{padding:24px 16px!important}}

    /* ── Globe section on tablet ── */
    @media(max-width:900px) and (min-width:641px){
      .globe-visual{width:200px!important}
    }

    /* ── General spacing utility on small phones ── */
    @media(max-width:360px){
      body{font-size:15px}
      h1{font-size:clamp(1.6rem,9vw,2.2rem)!important}
    }

    /* ═══════════════════════════════════════════
       VASTURA GROUP — HOME PAGE STYLES
       Palette: White dominant, Grey/Black accents
       Ornaments: selendang, flare, smoke
    ════════════════════════════════════════════ */
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Upright:wght@300;400;500;600;700&family=Jost:wght@300;400;500;600;700&display=swap');

    :root {
      --re-white: #ffffff;
      --re-off: #FAF7F0;
      --re-grey-lt: #E8DCC8;
      --re-grey-md: #8B8070;
      --re-grey-dk: #3D5254;
      --re-black: #111111;
      --re-smoke: rgba(20,18,16,.55);
    }

    /* ── Scroll Reveal animations ── */
    @keyframes re-fadeUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
    @keyframes re-fadeIn  { from{opacity:0} to{opacity:1} }
    @keyframes re-slideLeft  { from{opacity:0;transform:translateX(-70px) scaleX(.96)} to{opacity:1;transform:translateX(0) scaleX(1)} }
    @keyframes re-slideLeftOut { from{opacity:1;transform:translateX(0) scaleX(1)} to{opacity:0;transform:translateX(-50px) scaleX(.96)} }
    @keyframes re-slideRight { from{opacity:0;transform:translateX(70px) scaleX(.96)} to{opacity:1;transform:translateX(0) scaleX(1)} }
    @keyframes re-slideRightOut { from{opacity:1;transform:translateX(0) scaleX(1)} to{opacity:0;transform:translateX(50px) scaleX(.96)} }
    @keyframes re-scaleIn { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
    @keyframes re-scaleOut { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(.94)} }
    @keyframes re-smokeFloat { 0%,100%{transform:translateY(0) rotate(-3deg);opacity:.4} 50%{transform:translateY(-18px) rotate(3deg);opacity:.18} }
    @keyframes re-flareGlow  { 0%,100%{opacity:.55;transform:scale(1)} 50%{opacity:.85;transform:scale(1.08)} }
    @keyframes re-sash { 0%{transform:translateX(-120%) skewX(-8deg)} 100%{transform:translateX(220%) skewX(-8deg)} }
    /* Tirai/Curtain — gambar membuka seperti tirai pertunjukan */
    @keyframes re-curtainLeft  { 0%{opacity:0;clip-path:inset(0 100% 0 0);transform:translateX(-28px)} 60%{opacity:1} 100%{opacity:1;clip-path:inset(0 0% 0 0);transform:translateX(0)} }
    @keyframes re-curtainRight { 0%{opacity:0;clip-path:inset(0 0 0 100%);transform:translateX(28px)} 60%{opacity:1} 100%{opacity:1;clip-path:inset(0 0 0 0%);transform:translateX(0)} }
    @keyframes re-curtainLeftOut  { from{opacity:1;clip-path:inset(0 0% 0 0);transform:translateX(0)} to{opacity:0;clip-path:inset(0 100% 0 0);transform:translateX(-20px)} }
    @keyframes re-curtainRightOut { from{opacity:1;clip-path:inset(0 0 0 0%);transform:translateX(0)} to{opacity:0;clip-path:inset(0 0 0 100%);transform:translateX(20px)} }
    /* Dissolve/melebur — untuk teks */
    @keyframes re-dissolveIn  { 0%{opacity:0;filter:blur(8px);transform:translateY(18px) scale(.98)} 70%{filter:blur(0)} 100%{opacity:1;filter:blur(0);transform:translateY(0) scale(1)} }
    @keyframes re-dissolveOut { 0%{opacity:1;filter:blur(0);transform:translateY(0)} 100%{opacity:0;filter:blur(6px);transform:translateY(-14px)} }

    /* BASE STATE — semua elemen reveal tersembunyi */
    .re-reveal, .re-slide-left, .re-slide-right, .re-scale-in { opacity:0; will-change:transform,opacity; }

    /* ENTER animations */
    .re-reveal.visible                    { animation: re-dissolveIn .85s cubic-bezier(.22,1,.36,1) both; }
    .re-slide-left.visible                { animation: re-curtainLeft .9s cubic-bezier(.22,1,.36,1) both; }
    .re-slide-right.visible               { animation: re-curtainRight .9s cubic-bezier(.22,1,.36,1) both; }
    .re-scale-in.visible                  { animation: re-scaleIn .8s cubic-bezier(.22,1,.36,1) both; }

    /* EXIT animations — keluar viewport */
    .re-reveal.exit                       { animation: re-dissolveOut .5s cubic-bezier(.4,0,1,1) both !important; }
    .re-slide-left.exit                   { animation: re-curtainLeftOut .5s cubic-bezier(.4,0,1,1) both !important; }
    .re-slide-right.exit                  { animation: re-curtainRightOut .5s cubic-bezier(.4,0,1,1) both !important; }
    .re-scale-in.exit                     { animation: re-scaleOut .5s cubic-bezier(.4,0,1,1) both !important; }

    /* Stagger delays */
    .delay-1 { animation-delay:.08s !important; }
    .delay-2 { animation-delay:.18s !important; }
    .delay-3 { animation-delay:.28s !important; }
    .delay-4 { animation-delay:.40s !important; }
    .delay-5 { animation-delay:.52s !important; }

    /* ── Hover float for all buttons ── */
    .re-btn {
      display:inline-flex; align-items:center; justify-content:center;
      padding:13px 32px; font-family:'Jost',sans-serif; font-size:.8rem;
      letter-spacing:.2em; text-transform:uppercase; font-weight:600;
      border:none; cursor:pointer;
      transition:transform .25s cubic-bezier(.34,1.56,.64,1), box-shadow .25s ease, background .2s;
    }
    .re-btn:hover { transform:translateY(-4px); box-shadow:0 12px 28px rgba(0,0,0,.18); }
    .re-btn-dark {
      background:var(--re-black); color:var(--re-white);
      box-shadow:0 4px 14px rgba(0,0,0,.22);
    }
    .re-btn-dark:hover { background:#2a2826; }
    .re-btn-outline {
      background:transparent; color:var(--re-black);
      border:1.5px solid var(--re-black);
      box-shadow:0 2px 8px rgba(0,0,0,.08);
    }
    .re-btn-outline:hover { background:var(--re-black); color:#fff; }
    .re-btn-ghost {
      background:rgba(255,255,255,.15); color:#fff;
      border:1.5px solid rgba(255,255,255,.5);
      backdrop-filter:blur(8px);
    }
    .re-btn-ghost:hover { background:rgba(255,255,255,.28); }
    /* Tombol hero desktop */
    .re-hero-content .re-btn-ghost {
      padding:8px 22px; font-size:.68rem; letter-spacing:.18em;
    }
    /* Tombol hero mobile & tablet — lebih kecil */
    @media(max-width:900px) {
      .re-hero-content .re-btn-ghost {
        padding:6px 16px !important; font-size:.6rem !important;
        letter-spacing:.14em !important; border-width:1px !important;
      }
      .re-hero-h1 {
        font-size: clamp(1.9rem, 7.5vw, 3rem) !important;
        margin-bottom: 18px !important;
        line-height: 1.1 !important;
      }
    }
    @media(max-width:600px) {
      .re-hero-content .re-btn-ghost {
        padding:5px 14px !important; font-size:.56rem !important;
        letter-spacing:.12em !important;
      }
      .re-hero-h1 {
        font-size: clamp(1.6rem, 8vw, 2.4rem) !important;
        margin-bottom: 14px !important;
      }
    }

    /* ── Ornament layers ── */
    .re-smoke-orb {
      position:absolute; border-radius:50%;
      background:radial-gradient(circle, rgba(158,155,150,.22) 0%, transparent 65%);
      filter:blur(32px); pointer-events:none;
      animation:re-smokeFloat 9s ease-in-out infinite;
    }
    .re-flare {
      position:absolute; border-radius:50%;
      background:radial-gradient(circle, rgba(235,232,226,.7) 0%, rgba(235,232,226,.2) 45%, transparent 70%);
      filter:blur(12px); pointer-events:none;
      animation:re-flareGlow 6s ease-in-out infinite;
    }
    .re-sash {
      position:absolute; height:1px; width:60%;
      background:linear-gradient(90deg,transparent,rgba(158,155,150,.35),transparent);
      pointer-events:none;
    }

    /* ── Hero Home ── */
    .re-hero {
      position:relative; width:100%; height:75vh;
      min-height:300px; max-height:900px;
      overflow:hidden; display:flex; align-items:flex-end;
    }
    .re-hero-img {
      position:absolute; inset:0; width:100%; height:100%;
      object-fit:cover; object-position:center center;
      display:block;
    }
    /* video tag support */
    .re-hero video.re-hero-img, section.re-hero > video {
      position:absolute; inset:0; width:100%; height:100%;
      object-fit:cover; object-position:center center;
      display:block;
    }
    .re-hero-overlay {
      position:absolute; inset:0;
      background:linear-gradient(to top, rgba(14,12,10,.72) 0%, rgba(14,12,10,.35) 45%, rgba(14,12,10,.1) 75%, transparent 100%);
    }
    .re-hero-content {
      position:relative; z-index:2; padding:0 6% 80px; max-width:760px;
      animation:re-fadeUp .9s cubic-bezier(.22,1,.36,1) .15s both;
    }
    .re-hero-eyebrow {
      font-family:'Jost',sans-serif; font-size:.65rem; letter-spacing:.28em;
      text-transform:uppercase; color:rgba(255,255,255,.7); margin-bottom:18px;
      display:flex; align-items:center; gap:14px;
    }
    .re-hero-eyebrow::before {
      content:''; width:40px; height:1px;
      background:linear-gradient(90deg,rgba(255,255,255,.6),transparent);
    }
    .re-hero-h1 {
      font-family:'Cormorant Upright',serif; font-size:clamp(2.8rem,6.5vw,5rem);
      font-weight:300; color:#fff; line-height:1.08; letter-spacing:-.01em;
      margin-bottom:28px;
    }

    /* ── About Section ── */
    .re-about { background:var(--re-white); padding:100px 6%; text-align:center; position:relative; overflow:hidden; }
    .re-about-label {
      font-family:'Jost',sans-serif; font-size:.65rem; letter-spacing:.28em;
      text-transform:uppercase; color:var(--re-grey-md); margin-bottom:24px;
    }
    .re-about-h2 {
      font-family:'Cormorant Upright',serif; font-size:clamp(1.5rem,3.5vw,2.5rem);
      font-weight:500; color:var(--re-black); line-height:1.35; max-width:680px;
      margin:0 auto 20px;
    }

    /* ── Quote/Image parallax ── */
    .re-quote-img {
      position:relative; height:520px; overflow:hidden;
    }
    .re-quote-img img { width:100%; height:100%; object-fit:cover; }
    .re-quote-img-overlay {
      position:absolute; inset:0;
      background:linear-gradient(160deg, rgba(20,18,16,.45) 0%, rgba(20,18,16,.62) 100%);
    }
    .re-quote-content {
      position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
      text-align:center; padding:0 8%;
    }
    .re-quote-text {
      font-family:'Cormorant Upright',serif; font-size:clamp(1.4rem,3.2vw,2.2rem);
      font-weight:300; color:#fff; line-height:1.55; max-width:680px;
    }

    /* ── Listings ── */
    .re-listings { background:var(--re-off); padding:80px 6%; }
    .re-listing-item {
      display:grid; grid-template-columns:1fr 1fr; gap:0;
      border-bottom:1px solid var(--re-grey-lt); padding:60px 0;
    }
    .re-listing-item:first-child { padding-top:0; }
    .re-listing-item:last-child  { border-bottom:none; }
    .re-listing-img-wrap { overflow:hidden; height:340px; }
    .re-listing-img-wrap img { width:100%; height:100%; object-fit:cover; transition:transform .6s cubic-bezier(.25,.46,.45,.94); }
    .re-listing-img-wrap:hover img { transform:scale(1.05); }
    .re-listing-info {
      padding:40px 48px; display:flex; flex-direction:column; justify-content:center;
      background:var(--re-white);
    }
    .re-listing-title {
      font-family:'Cormorant Upright',serif; font-size:clamp(1.2rem,2.5vw,1.9rem);
      font-weight:600; color:var(--re-black); line-height:1.25; margin-bottom:14px;
    }
    .re-listing-desc { font-family:'Jost',sans-serif; font-size:.875rem; color:var(--re-grey-md); line-height:1.8; margin-bottom:28px; }

    /* ── Services ── */
    .re-services { background:var(--re-white); padding:80px 6%; }
    .re-services-h2 {
      font-family:'Cormorant Upright',serif; font-size:clamp(1.5rem,3vw,2.25rem);
      font-weight:600; text-align:center; color:var(--re-black); margin-bottom:56px;
    }
    .re-services-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
    .re-service-card { position:relative; overflow:hidden; cursor:pointer; }
    .re-service-card-img { height:280px; overflow:hidden; }
    .re-service-card-img img { width:100%; height:100%; object-fit:cover; transition:transform .5s cubic-bezier(.25,.46,.45,.94); }
    .re-service-card:hover .re-service-card-img img { transform:scale(1.06); }
    .re-service-card-body {
      background:var(--re-white); padding:20px 22px;
      border:1px solid var(--re-grey-lt); border-top:none;
    }
    .re-service-num { font-family:'Jost',sans-serif; font-size:.65rem; letter-spacing:.18em; color:var(--re-grey-md); margin-bottom:6px; }
    .re-service-title { font-family:'Jost',sans-serif; font-size:.875rem; font-weight:700; color:var(--re-black); text-transform:uppercase; letter-spacing:.1em; margin-bottom:8px; }
    .re-service-desc { font-family:'Jost',sans-serif; font-size:.8rem; color:var(--re-grey-md); line-height:1.7; }

    /* ── Contact/Footer ── */
    .re-contact { background:var(--re-white); padding:80px 6%; }
    .re-contact-grid { max-width:1100px; margin:0 auto; display:grid; grid-template-columns:1fr 1.2fr; gap:80px; align-items:start; }
    .re-contact-logo { font-family:'Cormorant Upright',serif; font-size:clamp(2rem,4vw,3rem); font-weight:300; color:var(--re-black); line-height:1.1; margin-bottom:28px; }
    .re-contact-label { font-family:'Jost',sans-serif; font-size:.6rem; letter-spacing:.22em; text-transform:uppercase; color:var(--re-grey-md); margin-bottom:8px; }
    .re-contact-val { font-family:'Jost',sans-serif; font-size:.9rem; color:var(--re-grey-dk); line-height:1.8; margin-bottom:18px; }
    .re-contact-note { font-family:'Jost',sans-serif; font-size:.8rem; color:var(--re-grey-md); font-style:italic; }
    .re-closing-hero { position:relative; height:460px; overflow:hidden; }
    .re-closing-hero img { width:100%; height:100%; object-fit:cover; }
    .re-closing-hero-overlay { position:absolute; inset:0; background:rgba(14,12,10,.5); }
    .re-closing-content { position:absolute; inset:0; display:flex; flex-direction:column; justify-content:flex-end; padding:48px 6%; }
    .re-closing-label { font-family:'Jost',sans-serif; font-size:.65rem; letter-spacing:.22em; text-transform:uppercase; color:rgba(255,255,255,.6); margin-bottom:12px; }
    .re-closing-h2 { font-family:'Cormorant Upright',serif; font-size:clamp(2rem,5vw,3.5rem); font-weight:300; color:#fff; line-height:1.1; }
    .re-footer-bar { background:var(--re-black); padding:20px 6%; display:flex; justify-content:space-between; align-items:center; font-family:'Jost',sans-serif; font-size:.75rem; color:rgba(255,255,255,.45); letter-spacing:.05em; }

    /* ── Responsive ── */
    @media(max-width:900px) {
      .re-listing-item { grid-template-columns:1fr; }
      .re-listing-img-wrap { height:240px; }
      .re-listing-info { padding:28px 24px; }
      .re-services-grid { grid-template-columns:1fr 1fr; }
      .re-contact-grid { grid-template-columns:1fr; gap:40px; }
    }
    @media(max-width:600px) {
      /* Hero mobile — 75vh konsisten, video tidak terpotong aneh, fokus tengah */
      .re-hero {
        height: 75vw !important;
        min-height: 280px !important;
        max-height: 520px !important;
      }
      .re-hero-img {
        object-position: center center !important;
      }
      .re-hero-h1 {
        font-size: clamp(1.2rem, 5.5vw, 1.75rem) !important;
        margin-bottom: 10px !important;
      }
      .re-hero-content { padding:0 5% 22px !important; }
      .re-hero-eyebrow { margin-bottom:7px; font-size:.56rem; }
      .re-about { padding:64px 5%; }
      .re-quote-img { height:360px; }
      .re-listings { padding:60px 5%; }
      .re-services { padding:60px 5%; }
      .re-services-grid { grid-template-columns:1fr; }
      .re-contact { padding:60px 5%; }
      .re-closing-hero { height:320px; }
    }
  `}</style>
);

/* ═══════════════════════════════════════════════════════════════════════════
   PERFORMANCE UTILITIES (dari refactor)
   ═══════════════════════════════════════════════════════════════════════════ */

/** withMemo: HOC untuk membungkus komponen dengan React.memo + custom comparator */
function withMemo(Component, propsAreEqual) {
  return React.memo(Component, propsAreEqual);
}

/** useStableCallback: useCallback tanpa dependencies — aman untuk event handler */
function useStableCallback(fn) {
  const fnRef = useRef(fn);
  useEffect(() => { fnRef.current = fn; });
  return useCallback((...args) => fnRef.current(...args), []);
}

/** useDebounce: Debounce nilai untuk menghindari frequent re-renders */
function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

/** useIntersection: Deteksi elemen masuk viewport — fire sekali */
function useIntersection(ref, options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, ...options }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]); // eslint-disable-line react-hooks/exhaustive-deps
  return isIntersecting;
}

/** LazySection: Render children hanya saat terlihat di viewport */
const LazySection = React.memo(function LazySection({ children, fallback = null, style = {} }) {
  const ref = useRef(null);
  const isVisible = useIntersection(ref);
  return (
    <div ref={ref} style={style}>
      {isVisible ? children : fallback}
    </div>
  );
});

/** VirtualList: Render hanya item yang terlihat — untuk daftar panjang */
const VirtualList = React.memo(function VirtualList({
  items, itemHeight, renderItem, containerHeight = 600, overscan = 3,
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIdx = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIdx   = Math.min(items.length - 1, startIdx + visibleCount + overscan * 2);
  const visibleItems = items.slice(startIdx, endIdx + 1);
  const totalHeight  = items.length * itemHeight;
  const offsetY      = startIdx * itemHeight;
  return (
    <div ref={containerRef}
      style={{ height: containerHeight, overflow: "auto", position: "relative" }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}>
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ position: "absolute", top: offsetY, width: "100%" }}>
          {visibleItems.map((item, i) => renderItem(item, startIdx + i))}
        </div>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════════════════
   LAZY IMAGE — Native lazy loading + skeleton placeholder (dari refactor)
   ═══════════════════════════════════════════════════════════════════════════ */
const LazyImage = React.memo(function LazyImage({
  src, alt = "", style = {}, className = "",
  placeholderColor = "#FAF7F0", onError,
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError]   = useState(false);
  const handleError = useCallback((e) => {
    setError(true);
    if (onError) onError(e);
  }, [onError]);
  if (!src || error) {
    return (
      <div style={{
        background: placeholderColor,
        display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 28,
        ...style,
      }} className={className}>🖼</div>
    );
  }
  return (
    <div style={{ position: "relative", ...style }} className={className}>
      {!loaded && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg,#F5EDD8 25%,#FAF7F0 50%,#F5EDD8 75%)",
          backgroundSize: "800px 100%",
          animation: "shimmer 1.5s infinite",
        }} />
      )}
      <img
        loading="lazy"
        decoding="async"
        src={src}
        alt={alt}
        style={{
          width: "100%", height: "100%",
          objectFit: "cover", display: "block",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.3s ease",
          ...style,
        }}
        onLoad={() => setLoaded(true)}
        onError={handleError}
      />
    </div>
  );
});

/* ─────────────── CEF: Content Edit Field (outside main to prevent remount) ─────────────── */
function CEF({ val, multiline, onChange, onSave }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", width: "100%" }}>
      {multiline
        ? <textarea value={val} onChange={onChange}
            style={{ flex: 1, padding: "8px 10px", border: "1px solid #A89070", borderRadius: 6, fontSize: 14, resize: "vertical", minHeight: 80 }} />
        : <input value={val} onChange={onChange}
            style={{ flex: 1, padding: "8px 10px", border: "1px solid #A89070", borderRadius: 6, fontSize: 14 }} />
      }
      <button onClick={onSave}
        style={{ padding: "8px 14px", background: "#C9AA71", color: "#fff", borderRadius: 6, fontSize: 12, border: "none" }}>Save</button>
    </div>
  );
}

/* ─────────────── LOGO DISPLAY ─────────────── */
const VASTURA_LOGO_URL = "https://res.cloudinary.com/dum9j7yn1/image/upload/v1782103987/Vastura_Origina_No-BG2_g59oud.png";

function LogoDisplay({ content, size = "nav" }) {
  const isMobileNav = size === "mobile-nav";
  const isFooter    = size === "footer";
  const isAdmin     = size === "admin";
  const h    = isMobileNav ? 52 : isAdmin ? 32 : isFooter ? 56 : 62;
  const maxW = isMobileNav ? 160 : isAdmin ? 90 : isFooter ? 160 : 190;
  return (
    <img
      src={VASTURA_LOGO_URL}
      alt="Vastura Group"
      style={{ height: h, maxWidth: maxW, width: "auto", objectFit: "contain", display: "block" }}
    />
  );
}


const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const formatDate = (d) => {
  try { return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }); }
  catch { return d; }
};

/* ─────────────── RICH TEXT RENDERER ─────────────── */
function RichRenderer({ blocks }) {
  if (!blocks || !blocks.length) return <p style={{ color: "#5A6A6C", fontStyle: "italic" }}>No content yet.</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {blocks.map((b, i) => {
        if (b.type === "paragraph") return (
          <div key={i} style={{ fontSize: "1rem", lineHeight: 1.85, color: "#2E3D3F" }}
            dangerouslySetInnerHTML={{ __html: b.value }} />
        );
        if (b.type === "heading") return (
          <h2 key={i} className="display" style={{ fontSize: "1.625rem", fontWeight: 800, color: "#2E3D3F", marginTop: 12 }}>{b.value}</h2>
        );
        if (b.type === "image") return (
          <figure key={i} style={{ margin: "10px 0" }}>
            <img loading="lazy" src={b.value} alt={b.caption || ""} style={{ width: "100%", maxHeight: 460, objectFit: "cover", borderRadius: 8 }} />
            {b.caption && <figcaption style={{ fontSize: "0.8125rem", color: "#3D5254", textAlign: "center", marginTop: 10, fontStyle: "italic", lineHeight: 1.5 }}>{b.caption}</figcaption>}
          </figure>
        );
        if (b.type === "quote") return (
          <blockquote key={i} style={{ borderLeft: "3px solid #8B6914", paddingLeft: 22, margin: "10px 0" }}>
            <p style={{ fontSize: "1.125rem", fontStyle: "italic", color: "#2E3D3F", lineHeight: 1.75, fontFamily: "'Cormorant Garamond',serif" }}>{b.value}</p>
          </blockquote>
        );
        if (b.type === "embed_instagram") return (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ background: "#FAF7F0", border: "1px solid #E8DCC8", borderRadius: 8, padding: 16, fontSize: "0.8125rem", color: "#3D5254" }}>
              📸 <strong>Instagram Embed:</strong> <a href={b.value} target="_blank" rel="noopener noreferrer" style={{ color: "#8B6914" }}>{b.value}</a>
              <blockquote className="instagram-media" data-instgrm-permalink={b.value} data-instgrm-version="14" style={{ border: "1px solid #D4C4A0", borderRadius: 6, padding: 10, marginTop: 8, background: "#fff" }}>
                <a href={b.value} target="_blank" rel="noopener noreferrer" style={{ color: "#8B6914", display: "block", marginTop: 6 }}>View on Instagram</a>
              </blockquote>
            </div>
          </div>
        );
        if (b.type === "embed_tiktok") return (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ background: "#FAF7F0", border: "1px solid #E8DCC8", borderRadius: 8, padding: 16, fontSize: "0.8125rem", color: "#3D5254" }}>
              🎵 <strong>TikTok Embed:</strong> <a href={b.value} target="_blank" rel="noopener noreferrer" style={{ color: "#8B6914" }}>{b.value}</a>
              <div style={{ background: "#fff", borderRadius: 6, border: "1px solid #D4C4A0", padding: "12px 14px", marginTop: 8 }}>
                <blockquote className="tiktok-embed" cite={b.value} data-video-id={b.value.split("/video/")[1]?.split("?")[0] || ""}>
                  <section><a href={b.value} target="_blank" rel="noopener noreferrer" style={{ color: "#8B6914" }}>View on TikTok</a></section>
                </blockquote>
              </div>
            </div>
          </div>
        );
        if (b.type === "divider") return <hr key={i} style={{ border: "none", borderTop: "1px solid #E8DCC8" }} />;
        if (b.type === "baca_juga") return (
          <div key={i} style={{ borderLeft: "4px solid #8B6914", background: "linear-gradient(90deg,#FAF7F0 0%,#f8fdff 100%)", borderRadius: "0 10px 10px 0", padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 18 }}>📖</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#8B6914", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 4 }}>Baca Juga</div>
              <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#2E3D3F", lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.title}</div>
            </div>
            {b.coverImage && <img loading="lazy" src={b.coverImage} alt="" style={{ width: 64, height: 48, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} onError={e => e.target.style.display = "none"} />}
          </div>
        );
        return null;
      })}
    </div>
  );
}

/* ─────────────── RICH PARAGRAPH EDITOR ─────────────── */
function RichParagraphEditor({ value, onChange, placeholder = "Write your content here..." }) {
  const editorRef = useRef();
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [highlightMenuOpen, setHighlightMenuOpen] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!value);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
      setIsEmpty(!value);
    }
  }, []); // only on mount

  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand("styleWithCSS", false, true);
    document.execCommand(cmd, false, val);
    if (editorRef.current) { onChange(editorRef.current.innerHTML); setIsEmpty(!editorRef.current.textContent.trim()); }
  };

  const handleInput = () => {
    if (editorRef.current) { onChange(editorRef.current.innerHTML); setIsEmpty(!editorRef.current.textContent.trim()); }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      // Insert non-breaking spaces as indent (2em = ~4 chars)
      document.execCommand("insertHTML", false, "\u00a0\u00a0\u00a0\u00a0");
      if (editorRef.current) { onChange(editorRef.current.innerHTML); }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    // Ambil plain text saja — buang semua HTML/formatting dari Word/browser lain
    const plain = e.clipboardData.getData("text/plain");
    if (!plain) return;
    // Preserve line breaks sebagai <br>, escape karakter HTML
    const safe = plain
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\r\n|\r|\n/g, "<br>");
    document.execCommand("insertHTML", false, safe);
    if (editorRef.current) { onChange(editorRef.current.innerHTML); setIsEmpty(false); }
  };


  useEffect(() => {
    const close = (e) => { if (!e.target.closest?.("[data-richpicker]")) { setColorMenuOpen(false); setHighlightMenuOpen(false); } };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const TB = ({ cmd, val = null, title, children, extraStyle = {} }) => (
    <button title={title} onMouseDown={e => { e.preventDefault(); exec(cmd, val); }}
      style={{ padding: "3px 7px", fontSize: 13, border: "1px solid #D4C4A0", borderRadius: 4, background: "#fff", color: "#3D5254", cursor: "pointer", lineHeight: 1.4, display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 26, ...extraStyle }}>
      {children}
    </button>
  );
  const SEP = () => <span style={{ width: 1, height: 20, background: "#D4C4A0", display: "inline-block", margin: "0 3px", verticalAlign: "middle" }} />;

  const textColors = ["#000000","#2E3D3F","#8B6914","#e74c3c","#27ae60","#f39c12","#8e44ad","#e67e22","#7f8c8d","#ffffff"];
  const hlColors  = ["#ffff00","#00ff7f","#ff9900","#ffcccc","#cce5ff","#e2ccff","transparent"];
  const fontSizeMap = {"8":1,"10":2,"12":3,"14":4,"18":5,"24":6,"36":7};

  return (
    <div style={{ border: "1.5px solid #D4C4A0", borderRadius: 8, overflow: "visible", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
      {/* ── Toolbar Row 1: Font, Size, Basic Formatting ── */}
      <div style={{ background: "#FAF7F0", borderBottom: "1px solid #E8DCC8", padding: "6px 10px", display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
        <select onChange={e => exec("fontName", e.target.value)}
          style={{ height: 26, fontSize: 12, padding: "1px 4px", border: "1px solid #D4C4A0", borderRadius: 4, background: "#fff", color: "#2E3D3F", maxWidth: 130, cursor: "pointer" }}>
          {["Calibri (Body)","Arial","Times New Roman","Georgia","Verdana","Courier New","Trebuchet MS"].map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select onChange={e => exec("fontSize", fontSizeMap[e.target.value] || 3)}
          style={{ height: 26, fontSize: 12, padding: "1px 4px", border: "1px solid #D4C4A0", borderRadius: 4, background: "#fff", color: "#2E3D3F", width: 52, cursor: "pointer" }}>
          {["8","10","11","12","14","16","18","20","24","28","32","36"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <SEP />
        <TB cmd="bold" title="Bold (Ctrl+B)"><strong style={{fontSize:13,fontWeight:900}}>B</strong></TB>
        <TB cmd="italic" title="Italic (Ctrl+I)"><em style={{fontSize:13}}>I</em></TB>
        <TB cmd="underline" title="Underline (Ctrl+U)"><span style={{textDecoration:"underline",fontSize:13}}>U</span></TB>
        <TB cmd="strikeThrough" title="Strikethrough"><span style={{textDecoration:"line-through",fontSize:13}}>S</span></TB>
        <SEP />
        {/* Text Color */}
        <div style={{position:"relative"}} data-richpicker="1">
          <button title="Font Color" onMouseDown={e=>{e.preventDefault();setColorMenuOpen(p=>!p);setHighlightMenuOpen(false);}}
            style={{padding:"2px 7px",border:"1px solid #D4C4A0",borderRadius:4,background:"#fff",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,minHeight:26,lineHeight:1}}>
            <span style={{fontSize:13,fontWeight:900,color:"#2E3D3F",lineHeight:1}}>A</span>
            <span style={{width:14,height:3,background:"#e74c3c",borderRadius:1}}/>
          </button>
          {colorMenuOpen && (
            <div style={{position:"absolute",top:32,left:0,background:"#fff",border:"1px solid #D4C4A0",borderRadius:8,padding:8,zIndex:9999,display:"flex",gap:4,flexWrap:"wrap",width:132,boxShadow:"0 6px 20px rgba(0,0,0,.15)"}}>
              <div style={{width:"100%",fontSize:10,color:"#5A6A6C",fontWeight:600,letterSpacing:".5px",textTransform:"uppercase",marginBottom:2}}>Warna Teks</div>
              {textColors.map(c=>(
                <button key={c} onMouseDown={e=>{e.preventDefault();exec("foreColor",c);setColorMenuOpen(false);}}
                  style={{width:22,height:22,borderRadius:4,background:c,border:"1.5px solid #D4C4A0",cursor:"pointer",outline:"none"}}/>
              ))}
            </div>
          )}
        </div>
        {/* Highlight */}
        <div style={{position:"relative"}} data-richpicker="1">
          <button title="Sorot Teks" onMouseDown={e=>{e.preventDefault();setHighlightMenuOpen(p=>!p);setColorMenuOpen(false);}}
            style={{padding:"2px 7px",border:"1px solid #D4C4A0",borderRadius:4,background:"#fff",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,minHeight:26,lineHeight:1}}>
            <span style={{fontSize:11,color:"#333",lineHeight:1,fontWeight:600}}>ab</span>
            <span style={{width:14,height:3,background:"#ffff00",border:"1px solid #ccc",borderRadius:1}}/>
          </button>
          {highlightMenuOpen && (
            <div style={{position:"absolute",top:32,left:0,background:"#fff",border:"1px solid #D4C4A0",borderRadius:8,padding:8,zIndex:9999,display:"flex",gap:4,flexWrap:"wrap",width:110,boxShadow:"0 6px 20px rgba(0,0,0,.15)"}}>
              <div style={{width:"100%",fontSize:10,color:"#5A6A6C",fontWeight:600,letterSpacing:".5px",textTransform:"uppercase",marginBottom:2}}>Sorotan</div>
              {hlColors.map(c=>(
                <button key={c} onMouseDown={e=>{e.preventDefault();exec("hiliteColor",c);setHighlightMenuOpen(false);}}
                  style={{width:22,height:22,borderRadius:4,background:c,border:"1.5px solid #D4C4A0",cursor:"pointer",outline:"none"}} title={c === "transparent" ? "Hapus Sorotan" : c}/>
              ))}
            </div>
          )}
        </div>
        <SEP />
        <TB cmd="undo" title="Undo (Ctrl+Z)">↶</TB>
        <TB cmd="redo" title="Redo (Ctrl+Y)">↷</TB>
      </div>

      {/* ── Toolbar Row 2: Lists, Indent, Paragraph, Alignment ── */}
      <div style={{ background: "#FAF7F0", borderBottom: "1px solid #E8DCC8", padding: "5px 10px", display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
        <TB cmd="insertUnorderedList" title="Daftar Bullet">
          <span style={{display:"flex",flexDirection:"column",gap:2,alignItems:"flex-start"}}>
            <span style={{display:"flex",alignItems:"center",gap:3}}><span style={{width:4,height:4,borderRadius:"50%",background:"currentColor"}}/>
            <span style={{width:12,height:1.5,background:"currentColor"}}/></span>
            <span style={{display:"flex",alignItems:"center",gap:3}}><span style={{width:4,height:4,borderRadius:"50%",background:"currentColor"}}/>
            <span style={{width:9,height:1.5,background:"currentColor"}}/></span>
          </span>
        </TB>
        <TB cmd="insertOrderedList" title="Daftar Bernomor">
          <span style={{fontSize:11,fontWeight:600,lineHeight:1,letterSpacing:-1}}>1.≡</span>
        </TB>
        <SEP />
        <TB cmd="outdent" title="Kurangi Indent">
          <svg width="14" height="12" viewBox="0 0 14 12" fill="currentColor"><rect x="4" y="0" width="10" height="1.5" rx=".75"/><rect x="4" y="5" width="10" height="1.5" rx=".75"/><rect x="4" y="10" width="10" height="1.5" rx=".75"/><polygon points="3,6 0,4 0,8"/></svg>
        </TB>
        <TB cmd="indent" title="Tambah Indent">
          <svg width="14" height="12" viewBox="0 0 14 12" fill="currentColor"><rect x="4" y="0" width="10" height="1.5" rx=".75"/><rect x="4" y="5" width="10" height="1.5" rx=".75"/><rect x="4" y="10" width="10" height="1.5" rx=".75"/><polygon points="0,6 3,4 3,8"/></svg>
        </TB>
        <SEP />
        {/* Alignment */}
        <TB cmd="justifyLeft" title="Rata Kiri">
          <svg width="14" height="12" viewBox="0 0 14 12" stroke="currentColor" strokeWidth="1.5" fill="none"><line x1="0" y1="1" x2="14" y2="1"/><line x1="0" y1="5" x2="9" y2="5"/><line x1="0" y1="9" x2="14" y2="9"/><line x1="0" y1="11.5" x2="7" y2="11.5"/></svg>
        </TB>
        <TB cmd="justifyCenter" title="Tengah">
          <svg width="14" height="12" viewBox="0 0 14 12" stroke="currentColor" strokeWidth="1.5" fill="none"><line x1="0" y1="1" x2="14" y2="1"/><line x1="2.5" y1="5" x2="11.5" y2="5"/><line x1="0" y1="9" x2="14" y2="9"/><line x1="3.5" y1="11.5" x2="10.5" y2="11.5"/></svg>
        </TB>
        <TB cmd="justifyRight" title="Rata Kanan">
          <svg width="14" height="12" viewBox="0 0 14 12" stroke="currentColor" strokeWidth="1.5" fill="none"><line x1="0" y1="1" x2="14" y2="1"/><line x1="5" y1="5" x2="14" y2="5"/><line x1="0" y1="9" x2="14" y2="9"/><line x1="7" y1="11.5" x2="14" y2="11.5"/></svg>
        </TB>
        <TB cmd="justifyFull" title="Rata Kanan-Kiri (Justify)">
          <svg width="14" height="12" viewBox="0 0 14 12" stroke="currentColor" strokeWidth="1.5" fill="none"><line x1="0" y1="1" x2="14" y2="1"/><line x1="0" y1="5" x2="14" y2="5"/><line x1="0" y1="9" x2="14" y2="9"/><line x1="0" y1="11.5" x2="14" y2="11.5"/></svg>
        </TB>
        <SEP />
        {/* Line spacing quick insert */}
        <TB cmd="formatBlock" val="blockquote" title="Blockquote" extraStyle={{fontSize:11}}>❝</TB>
        <TB cmd="removeFormat" title="Hapus Format" extraStyle={{fontSize:11,color:"#e74c3c"}}>✕</TB>
      </div>

      {/* ── Editor Area ── */}
      <div style={{ position: "relative" }}>
        {isEmpty && (
          <div style={{ position:"absolute", top:16, left:18, color:"#b0c4d4", fontSize:14, fontStyle:"italic", pointerEvents:"none", userSelect:"none" }}>
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => setIsEmpty(false)}
          onBlur={() => setIsEmpty(!editorRef.current?.textContent?.trim())}
          style={{
            minHeight: 220, padding: "16px 18px", fontSize: 14, color: "#2E3D3F",
            lineHeight: 1.85, outline: "none", background: "#fff",
            fontFamily: "'Calibri', Arial, sans-serif",
            borderRadius: "0 0 6px 6px",
          }}
        />
      </div>
    </div>
  );
}

/* ─────────────── CMS EDITOR ─────────────── */
function CMSEditor({ post, onSave, onCancel, section, onSectionChange, user, notify: notifyFn, allPosts = [] }) {
  const notify = typeof notifyFn === "function" ? notifyFn : (msg) => alert(msg);
  const authorDefault = post?.author || user?.name || user?.username || "";
  const [form, setForm] = useState(post || {
    title: "", date: new Date().toISOString().slice(0, 10), author: authorDefault, category: "",
    coverImage: "", excerpt: "", content: [], tags: "", status: "draft", section,
  });
  const [blocks, setBlocks] = useState(post?.content || []);
  const [addType, setAddType] = useState("paragraph");
  const [addVal, setAddVal] = useState("");
  const [addCaption, setAddCaption] = useState("");
  const [editBlockIdx, setEditBlockIdx] = useState(null);
  const [editBlockVal, setEditBlockVal] = useState("");
  const [imgUploadMode, setImgUploadMode] = useState("url");
  const [coverUploadMode, setCoverUploadMode] = useState("url");
  const [coverUploading, setCoverUploading] = useState(false);
  const [publishModal, setPublishModal] = useState(false);
  const [bacaJugaSearch, setBacaJugaSearch] = useState("");
  const [bacaJugaSelected, setBacaJugaSelected] = useState(null); // { id, title, coverImage, section }
  const coverFileRef = useRef();
  const [autoSaveStatus, setAutoSaveStatus] = useState(""); // "", "saving…", "tersimpan ✓"
  const fileRef = useRef();
  const autoSaveTimer = useRef();
  const draftKey = `cms-draft-${post?.id || "new"}`;

  /* ── Restore draft dari storage saat pertama kali buka (hanya post baru) ── */
  useEffect(() => {
    if (post?.id) return; // jangan timpa post yang sedang diedit
    (async () => {
      try {
        const r = await window.storage?.get(draftKey);
        if (r?.value) {
          const saved = JSON.parse(r.value);
          if (saved.title || (saved.content && saved.content.length > 0)) {
            setForm(f => ({ ...f, ...saved, author: saved.author || authorDefault }));
            setBlocks(saved.content || []);
            setAutoSaveStatus("↩ Draft dipulihkan");
            setTimeout(() => setAutoSaveStatus(""), 3000);
          }
        }
      } catch {}
    })();
  }, []);

  /* ── Auto-Save persisten: simpan ke window.storage agar bertahan meski halaman ditutup ── */
  useEffect(() => {
    if (!form.title && blocks.length === 0) return; // skip form kosong
    setAutoSaveStatus("Mengetik…");
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      setAutoSaveStatus("Menyimpan…");
      const p = {
        ...form, content: blocks, status: "draft",
        id: form.id || Date.now(), section: form.section || section,
        tags: typeof form.tags === "string" ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : form.tags,
        slug: form.slug || slugify(form.title || "artikel"),
        _autoSaved: true,
      };
      // Simpan ke storage persisten (bertahan saat tab ditutup / perangkat mati)
      try { await window.storage?.set(draftKey, JSON.stringify({ ...form, content: blocks })); } catch {}
      onSave(p, true); // silent=true → tetap di editor, tidak keluar
      setAutoSaveStatus("✓ Tersimpan otomatis");
      setTimeout(() => setAutoSaveStatus(""), 3000);
    }, 3000);
    return () => clearTimeout(autoSaveTimer.current);
  }, [form.title, form.excerpt, form.author, form.category, form.date, form.coverImage, form.tags, blocks]);

  const addBlock = () => {
    if (addType === "baca_juga") {
      if (!bacaJugaSelected) return;
      setBlocks(p => [...p, { type: "baca_juga", postId: bacaJugaSelected.id, title: bacaJugaSelected.title, coverImage: bacaJugaSelected.coverImage || "", section: bacaJugaSelected.section || "" }]);
      setBacaJugaSelected(null); setBacaJugaSearch("");
      return;
    }
    const val = (addType === "paragraph" ? addVal : addVal).trim?.() ?? addVal;
    if (addType !== "divider" && !val) return;
    const block = { type: addType, value: val };
    if (addCaption) block.caption = addCaption;
    setBlocks(p => [...p, block]);
    setAddVal(""); setAddCaption("");
  };

  const removeBlock = (i) => setBlocks(p => p.filter((_, idx) => idx !== i));
  const moveBlock = (i, dir) => {
    const b = [...blocks];
    const j = i + dir;
    if (j < 0 || j >= b.length) return;
    [b[i], b[j]] = [b[j], b[i]];
    setBlocks(b);
  };

  const saveEditBlock = (i) => {
    const stripped = editBlockVal.replace(/<[^>]*>/g, "").trim();
    if (!stripped && editBlockVal.trim() === "") return;
    setBlocks(p => p.map((b, idx) => idx === i ? { ...b, value: editBlockVal } : b));
    setEditBlockIdx(null); setEditBlockVal("");
  };

  const [imgUploadItems, setImgUploadItems] = useState([]);
  const [coverUploadItems, setCoverUploadItems] = useState([]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgUploadItems([{ name: file.name, pct: 0, done: false, error: false }]);
    try {
      const url = await uploadWithProgress(file, pct => setImgUploadItems([{ name: file.name, pct, done: false, error: false }]));
      setImgUploadItems([{ name: file.name, pct: 100, done: true, error: false }]);
      setAddVal(url);
      notify("✅ Gambar berhasil diupload!");
    } catch {
      setImgUploadItems([{ name: file.name, pct: 0, done: false, error: true }]);
      notify("❌ Gagal upload gambar. Periksa koneksi & Cloudinary preset.", "error");
    }
    setTimeout(() => { setImgUploadItems([]); if (fileRef.current) fileRef.current.value = ""; }, 2500);
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    setCoverUploadItems([{ name: file.name, pct: 0, done: false, error: false }]);
    try {
      const url = await uploadWithProgress(file, pct => setCoverUploadItems([{ name: file.name, pct, done: false, error: false }]));
      setCoverUploadItems([{ name: file.name, pct: 100, done: true, error: false }]);
      setForm(p => ({ ...p, coverImage: url }));
      notify("✅ Cover image berhasil diupload!");
    } catch {
      setCoverUploadItems([{ name: file.name, pct: 0, done: false, error: true }]);
      notify("❌ Gagal upload cover. Periksa koneksi & Cloudinary preset.", "error");
    } finally {
      setCoverUploading(false);
      setTimeout(() => { setCoverUploadItems([]); if (coverFileRef.current) coverFileRef.current.value = ""; }, 2500);
    }
  };

  const handleSave = async (status, targetSection = section) => {
    clearTimeout(autoSaveTimer.current);
    const postId = form.id || Date.now();
    const p = {
      ...form,
      content: blocks,
      status,
      id: postId,
      section: targetSection,
      tags: typeof form.tags === "string" ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : form.tags,
      slug: form.slug || slugify(form.title || "artikel"),
    };
    // Sync form.section agar autosave berikutnya pakai seksi yang benar
    setForm(f => ({ ...f, section: targetSection }));
    // Hapus draft persisten setelah publish / save manual
    try { await window.storage?.delete(draftKey); } catch {}
    onSave(p);
  };

  const blockLabels = {
    paragraph: "📝 Paragraph", heading: "📌 Heading", image: "🖼 Image",
    quote: "💬 Quote", embed_instagram: "📸 Instagram Embed", embed_tiktok: "🎵 TikTok Embed", divider: "⸻ Divider",
    baca_juga: "🔗 Baca Juga",
  };

  const needsValue = addType !== "divider" && addType !== "baca_juga";

  return (
    <div className="fade-in" style={{ background: "#fff", borderRadius: 12, overflow: "visible", boxShadow: "0 4px 24px rgba(0,0,0,.1)" }}>
      {/* ── Publish Destination Modal ── */}
      {publishModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(20,35,55,.55)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div className="fade-in" style={{ background: "#fff", borderRadius: 14, padding: "28px 32px", maxWidth: 440, width: "90%",
            boxShadow: "0 24px 60px rgba(0,0,0,.22)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 32 }}>🚀</span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#2E3D3F", textAlign: "center", marginBottom: 6, fontFamily: "'Playfair Display',serif" }}>
              Pilih Tujuan Publish
            </h2>
            <p style={{ fontSize: 13, color: "#5A6A6C", textAlign: "center", marginBottom: 24, lineHeight: 1.6 }}>
              Artikel akan ditayangkan di seksi yang kamu pilih di bawah ini.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { key: "shop", icon: "🏠", label: "Gedung & Rumah", desc: "Proyek rumah, gedung & properti" },
                { key: "news", icon: "🔧", label: "Exterior", desc: "Pagar, kanopi, landscape & eksterior" },
                { key: "destinations", icon: "🛋️", label: "Interior", desc: "Desain & dekorasi interior rumah" },
              ].map(opt => (
                <button key={opt.key} onClick={() => {
                  if (onSectionChange) onSectionChange(opt.key);
                  setPublishModal(false);
                  handleSave("published", opt.key);
                }} style={{
                  display: "flex", alignItems: "center", gap: 16, padding: "14px 18px",
                  border: section === opt.key ? "2px solid #2E3D3F" : "1.5px solid #E8DCC8",
                  borderRadius: 10, background: section === opt.key ? "#f0f5fa" : "#fff",
                  cursor: "pointer", textAlign: "left", transition: "all .15s"
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#8B6914"; e.currentTarget.style.background = "#FAF7F0"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = section === opt.key ? "#2E3D3F" : "#E8DCC8"; e.currentTarget.style.background = section === opt.key ? "#f0f5fa" : "#fff"; }}>
                  <span style={{ fontSize: 28, flexShrink: 0 }}>{opt.icon}</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#2E3D3F" }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: "#5A6A6C", marginTop: 2 }}>{opt.desc}</div>
                  </div>
                  {section === opt.key && <span style={{ marginLeft: "auto", fontSize: 16, color: "#27ae60" }}>✓</span>}
                </button>
              ))}
            </div>
            <button onClick={() => setPublishModal(false)} style={{
              width: "100%", marginTop: 16, padding: "10px", border: "1px solid #D4C4A0",
              borderRadius: 8, fontSize: 13, color: "#5A6A6C", background: "#FDFAF4", cursor: "pointer"
            }}>Batal</button>
          </div>
        </div>
      )}

      {/* CMS Top Bar */}
      <div style={{ background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>
            {post?.id ? "Edit Post" : "Add New Post"} — <span style={{ color: "#C9AA71" }}>{SECTION_LABELS[section] || section}</span>
          </span>
          {autoSaveStatus && (
            <span style={{ fontSize: 11, color: autoSaveStatus.startsWith("✓") ? "#C9AA71" : "rgba(255,255,255,.5)", letterSpacing: ".3px" }}>
              {autoSaveStatus}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => handleSave("draft")} style={{
            padding: "7px 18px", border: "1px solid rgba(255,255,255,.3)", borderRadius: 6,
            color: "rgba(255,255,255,.85)", fontSize: 12, background: "none", letterSpacing: ".5px"
          }}>Save Draft</button>
          <button onClick={() => setPublishModal(true)} style={{
            padding: "7px 18px", background: "#27ae60", borderRadius: 6,
            color: "#fff", fontSize: 12, border: "none", fontWeight: 500, letterSpacing: ".5px"
          }}>🚀 Publish…</button>
          <button onClick={onCancel} style={{
            padding: "7px 14px", border: "none", borderRadius: 6,
            color: "rgba(255,255,255,.6)", fontSize: 12, background: "rgba(255,255,255,.08)"
          }}>✕</button>
        </div>
      </div>

      <div className="cms-editor-grid">
        {/* Left: Editor */}
        <div className="cms-editor-left">
          {/* Title */}
          <textarea value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="Masukkan judul artikel di sini..."
            rows={2}
            style={{ width: "100%", fontSize: 28, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600,
              color: "#2E3D3F", border: "none", outline: "none", borderBottom: "2px solid #F5EDD8",
              paddingBottom: 14, marginBottom: 24, background: "transparent",
              resize: "none", overflow: "hidden", lineHeight: 1.3, boxSizing: "border-box",
              fontStyle: "normal" }}
            onInput={e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} />

          {/* Excerpt */}
          <textarea value={form.excerpt} onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))}
            placeholder="Ringkasan singkat artikel..."
            rows={3}
            style={{ width: "100%", fontSize: 14, color: "#5A6A6C", border: "1px solid #F5EDD8",
              borderRadius: 6, padding: "12px 14px", outline: "none", resize: "vertical",
              marginBottom: 28, lineHeight: 1.65, background: "#FDFAF4" }} />

          {/* Blocks */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>Content Blocks</div>
            {blocks.length === 0 && (
              <div style={{ background: "#FDFAF4", border: "2px dashed #D4C4A0", borderRadius: 8, padding: "32px", textAlign: "center", color: "#5A6A6C", fontSize: 13 }}>
                No content yet. Add your first block below.
              </div>
            )}
            {blocks.map((b, i) => (
              <div key={i} style={{ background: "#FDFAF4", border: `1px solid ${editBlockIdx === i ? "#C9AA71" : "#F5EDD8"}`, borderRadius: 8, padding: "14px 16px", marginBottom: 10, position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, background: "#F5EDD8", color: "#C9AA71", padding: "2px 8px", borderRadius: 10, fontWeight: 500 }}>{blockLabels[b.type] || b.type}</span>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                    <button onClick={() => moveBlock(i, -1)} title="Naik" style={{ padding: "3px 8px", fontSize: 11, border: "1px solid #D4C4A0", borderRadius: 4, color: "#5A6A6C", background: "#fff" }}>↑</button>
                    <button onClick={() => moveBlock(i, 1)} title="Turun" style={{ padding: "3px 8px", fontSize: 11, border: "1px solid #D4C4A0", borderRadius: 4, color: "#5A6A6C", background: "#fff" }}>↓</button>
                    {b.type !== "divider" && b.type !== "image" && b.type !== "baca_juga" && (
                      <button onClick={() => { setEditBlockIdx(i); setEditBlockVal(b.value || ""); }} title="Edit" style={{ padding: "3px 8px", fontSize: 11, border: "1px solid #C9AA71", background: "#FAF7F0", color: "#C9AA71", borderRadius: 4 }}>✏</button>
                    )}
                    <button onClick={() => { if (editBlockIdx === i) { setEditBlockIdx(null); setEditBlockVal(""); } removeBlock(i); }} title="Hapus" style={{ padding: "3px 8px", fontSize: 11, border: "none", background: "#fee", color: "#e74c3c", borderRadius: 4 }}>✕</button>
                  </div>
                </div>
                {/* Inline edit mode */}
                {editBlockIdx === i ? (
                  <div>
                    {b.type === "paragraph" ? (
                      <RichParagraphEditor
                        value={editBlockVal}
                        onChange={setEditBlockVal}
                        placeholder="Tulis konten paragraf di sini..."
                      />
                    ) : (
                      <input value={editBlockVal} onChange={e => setEditBlockVal(e.target.value)}
                        autoFocus
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid #C9AA71", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                    )}
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button onClick={() => saveEditBlock(i)} style={{ padding: "6px 16px", background: "#27ae60", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✓ Simpan</button>
                      <button onClick={() => { setEditBlockIdx(null); setEditBlockVal(""); }} style={{ padding: "6px 12px", background: "#eee", color: "#5A6A6C", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Batal</button>
                    </div>
                  </div>
                ) : b.type === "image" ? (
                  <div>
                    <img loading="lazy" src={b.value} alt="" style={{ width: "100%", maxHeight: 480, objectFit: "contain", borderRadius: 6, background: "#FDFAF4" }} onError={e => { e.target.style.display = "none"; }} />
                    {b.caption && <p style={{ fontSize: 11, color: "#5A6A6C", marginTop: 4, fontStyle: "italic" }}>{b.caption}</p>}
                  </div>
                ) : b.type === "divider" ? (
                  <hr style={{ border: "none", borderTop: "2px solid #D4C4A0" }} />
                ) : b.type === "baca_juga" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#FAF7F0", borderLeft: "3px solid #8B6914", borderRadius: "0 6px 6px 0", padding: "8px 12px" }}>
                    <span style={{ fontSize: 15 }}>📖</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#8B6914", textTransform: "uppercase", letterSpacing: ".06em" }}>Baca Juga</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#2E3D3F", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.title}</div>
                    </div>
                    {b.coverImage && <img loading="lazy" src={b.coverImage} alt="" style={{ width: 40, height: 30, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} onError={e => e.target.style.display = "none"} />}
                  </div>
                ) : b.type === "paragraph" ? (
                  <div style={{ fontSize: 13, color: "#3D5254", lineHeight: 1.6, wordBreak: "break-word" }}
                    dangerouslySetInnerHTML={{ __html: b.value }} />
                ) : (
                  <p style={{ fontSize: 13, color: "#3D5254", lineHeight: 1.6, wordBreak: "break-word" }}>
                    {b.value}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Add Block Toolbar */}
          <div style={{ background: "#FAF7F0", border: "1px solid #E8DCC8", borderRadius: 10, padding: "18px 20px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 14 }}>Add Block</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {Object.entries(blockLabels).map(([k, label]) => (
                <button key={k} onClick={() => setAddType(k)} style={{
                  padding: "5px 12px", fontSize: 12, borderRadius: 20,
                  border: addType === k ? "none" : "1px solid #D4C4A0",
                  background: addType === k ? "#C9AA71" : "#fff",
                  color: addType === k ? "#fff" : "#3D5254", fontWeight: addType === k ? 600 : 400,
                  transition: "all .15s"
                }}>{label}</button>
              ))}
            </div>

            {needsValue && (
              <>
                {addType === "image" && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    {["url", "upload"].map(m => (
                      <button key={m} onClick={() => setImgUploadMode(m)} style={{
                        padding: "4px 12px", fontSize: 11, borderRadius: 4,
                        border: imgUploadMode === m ? "none" : "1px solid #D4C4A0",
                        background: imgUploadMode === m ? "#2E3D3F" : "#fff",
                        color: imgUploadMode === m ? "#fff" : "#5A6A6C"
                      }}>{m === "url" ? "URL" : "Upload File"}</button>
                    ))}
                  </div>
                )}

                {addType === "image" && imgUploadMode === "upload" ? (
                  <div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                    <button onClick={() => fileRef.current?.click()} disabled={imgUploadItems.some(it => !it.done && !it.error)}
                      style={{
                        padding: "10px 20px", border: "1.5px dashed #C9AA71", borderRadius: 8,
                        color: imgUploadItems.some(it => !it.done && !it.error) ? "#5A6A6C" : "#C9AA71",
                        fontSize: 13, background: "#FAF7F0", width: "100%", marginBottom: 8,
                        cursor: imgUploadItems.some(it => !it.done && !it.error) ? "not-allowed" : "pointer"
                      }}>{imgUploadItems.some(it => !it.done && !it.error) ? "⏳ Mengupload..." : "📁 Click to Upload Image"}</button>
                    {imgUploadItems.length > 0 && imgUploadItems.map((it, i) => (
                      <div key={i} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: it.error ? "#e74c3c" : "#2E3D3F", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {it.error ? "❌ " : it.done ? "✅ " : "📤 "}{it.name}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 800, color: it.error ? "#e74c3c" : it.done ? "#27ae60" : "#8B6914" }}>
                            {it.error ? "Gagal" : it.done ? "Selesai" : `${it.pct}%`}
                          </span>
                        </div>
                        <div style={{ height: 6, background: "#E8DCC8", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 3, width: `${it.pct}%`,
                            background: it.error ? "#e74c3c" : it.done ? "#27ae60" : "linear-gradient(90deg,#8B6914,#E8C96A)",
                            transition: "width .2s ease" }} />
                        </div>
                      </div>
                    ))}
                    {addVal && <img loading="lazy" src={addVal} alt="" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 6, marginBottom: 8 }} />}
                  </div>
                ) : addType === "paragraph" ? (
                  <div style={{ marginBottom: 8 }}>
                    <RichParagraphEditor
                      value={addVal}
                      onChange={setAddVal}
                      placeholder="Tulis konten paragraf di sini. Gunakan toolbar di atas untuk format teks..."
                    />
                  </div>
                ) : addType === "quote" ? (
                  <textarea value={addVal} onChange={e => setAddVal(e.target.value)}
                    placeholder="Teks kutipan..."
                    rows={4}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #D4C4A0",
                      borderRadius: 6, fontSize: 13, outline: "none", resize: "vertical", marginBottom: 8, lineHeight: 1.6 }} />
                ) : (
                  <input value={addVal} onChange={e => setAddVal(e.target.value)}
                    placeholder={
                      addType === "heading" ? "Section heading..." :
                      addType === "image" ? "https://example.com/image.jpg" :
                      addType === "embed_instagram" ? "https://www.instagram.com/p/..." :
                      addType === "embed_tiktok" ? "https://www.tiktok.com/@user/video/..." : ""
                    }
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #D4C4A0",
                      borderRadius: 6, fontSize: 13, outline: "none", marginBottom: 8 }} />
                )}

                {addType === "image" && (
                  <input value={addCaption} onChange={e => setAddCaption(e.target.value)}
                    placeholder="Image caption (optional)"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #D4C4A0",
                      borderRadius: 6, fontSize: 12, outline: "none", marginBottom: 8 }} />
                )}
              </>
            )}

            {addType === "baca_juga" && (() => {
              const otherPosts = allPosts.filter(p => p.id !== post?.id && p.status === "published");
              const filtered = bacaJugaSearch.trim()
                ? otherPosts.filter(p => p.title?.toLowerCase().includes(bacaJugaSearch.toLowerCase()))
                : otherPosts;
              return (
                <div style={{ marginBottom: 8 }}>
                  <input
                    value={bacaJugaSearch}
                    onChange={e => { setBacaJugaSearch(e.target.value); setBacaJugaSelected(null); }}
                    placeholder="🔍 Cari judul artikel..."
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 13, outline: "none", marginBottom: 8, boxSizing: "border-box" }}
                  />
                  {bacaJugaSelected ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#FAF7F0", borderRadius: 8, border: "1.5px solid #C9AA71" }}>
                      {bacaJugaSelected.coverImage && <img loading="lazy" src={bacaJugaSelected.coverImage} alt="" style={{ width: 48, height: 36, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} onError={e => e.target.style.display = "none"} />}
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#2E3D3F", flex: 1 }}>{bacaJugaSelected.title}</span>
                      <button onClick={() => setBacaJugaSelected(null)} style={{ fontSize: 11, color: "#e74c3c", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>✕</button>
                    </div>
                  ) : (
                    <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #E8DCC8", borderRadius: 8, background: "#fff" }}>
                      {filtered.length === 0 ? (
                        <div style={{ padding: "14px 12px", fontSize: 12, color: "#5A6A6C", textAlign: "center" }}>
                          {otherPosts.length === 0 ? "Belum ada artikel published lain." : "Artikel tidak ditemukan."}
                        </div>
                      ) : filtered.map(p => (
                        <div key={p.id} onClick={() => { setBacaJugaSelected(p); setBacaJugaSearch(""); }}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", cursor: "pointer", borderBottom: "1px solid #FAF7F0", transition: "background .12s" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#FAF7F0"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          {p.coverImage && <img loading="lazy" src={p.coverImage} alt="" style={{ width: 40, height: 30, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} onError={e => e.target.style.display = "none"} />}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#2E3D3F", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</div>
                            <div style={{ fontSize: 11, color: "#5A6A6C" }}>{p.section}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            <button onClick={addBlock} style={{
              padding: "9px 22px", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", color: "#fff",
              borderRadius: 6, fontSize: 13, border: "none", fontWeight: 500
            }}>+ Add Block</button>
          </div>
        </div>

        {/* Right: Meta / Publish */}
        <div className="cms-editor-right">
          {/* Section Selector */}
          <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #F5EDD8", overflow: "hidden" }}>
            <div style={{ background: "#FAF7F0", padding: "8px 14px", borderBottom: "1px solid #F5EDD8" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#2E3D3F", letterSpacing: ".5px" }}>PUBLISH TO</span>
            </div>
            <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
              {Object.entries(SECTION_LABELS).map(([key, label]) => (
                <button key={key} onClick={() => onSectionChange && onSectionChange(key)} style={{
                  padding: "6px 10px", borderRadius: 6, fontSize: 12, fontWeight: section === key ? 600 : 400,
                  border: section === key ? "none" : "1px solid #D4C4A0",
                  background: section === key ? "#2E3D3F" : "#fff",
                  color: section === key ? "#fff" : "#3D5254",
                  textAlign: "left", transition: "all .15s", cursor: "pointer"
                }}>{section === key ? "✓ " : ""}{label}</button>
              ))}
            </div>
          </div>

          {/* Publish Box */}
          <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #F5EDD8", overflow: "hidden" }}>
            <div style={{ background: "#FAF7F0", padding: "8px 14px", borderBottom: "1px solid #F5EDD8" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#2E3D3F", letterSpacing: ".5px" }}>PUBLISH</span>
            </div>
            <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#5A6A6C" }}>Status:</span>
                <span style={{ fontSize: 11, fontWeight: 500, color: form.status === "published" ? "#27ae60" : "#f39c12",
                  background: form.status === "published" ? "#eeffee" : "#fff9ee", padding: "2px 9px", borderRadius: 10 }}>
                  {form.status === "published" ? "Published" : "Draft"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#5A6A6C" }}>Visibility:</span>
                <span style={{ fontSize: 12, color: "#3D5254", fontWeight: 500 }}>Public</span>
              </div>
              <div style={{ borderTop: "1px solid #F5EDD8", paddingTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                <button onClick={() => handleSave("draft")} style={{
                  padding: "7px 0", border: "1px solid #D4C4A0", borderRadius: 6,
                  fontSize: 12, color: "#3D5254", background: "#fff", fontWeight: 500, cursor: "pointer"
                }}>Save Draft</button>
                <button onClick={() => setPublishModal(true)} style={{
                  padding: "8px 0", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", border: "none",
                  borderRadius: 6, fontSize: 12, color: "#fff", fontWeight: 600, letterSpacing: ".5px", cursor: "pointer"
                }}>🚀 Publish…</button>
              </div>
            </div>
          </div>

          {/* Meta Fields */}
          {[
            { label: "Date", key: "date", type: "date" },
            { label: "Category", key: "category", placeholder: "e.g. Beach, Gear, Asia" },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 4 }}>{f.label}</label>
              <input type={f.type || "text"} value={form[f.key] || ""} placeholder={f.placeholder || ""}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: "100%", padding: "7px 10px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}

          {/* Author — auto dari akun yang login */}
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 4 }}>
              Author <span style={{ fontSize: 10, color: "#27ae60", fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>· otomatis</span>
            </label>
            <div style={{ position: "relative" }}>
              <input value={form.author || ""} readOnly
                style={{ width: "100%", padding: "7px 28px 7px 10px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 12, outline: "none", background: "#FAF7F0", color: "#2E3D3F", fontWeight: 600, cursor: "default", boxSizing: "border-box" }} />
              <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11 }}>🔒</span>
            </div>
            <p style={{ fontSize: 10, color: "#5A6A6C", marginTop: 3 }}>Diisi otomatis dari akun yang login</p>
          </div>

          {/* Tags */}
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 4 }}>Tags</label>
            <input value={typeof form.tags === "string" ? form.tags : (form.tags || []).join(", ")}
              onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
              placeholder="beach, travel, gear"
              style={{ width: "100%", padding: "7px 10px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
            <p style={{ fontSize: 10, color: "#5A6A6C", marginTop: 3 }}>Separate with commas</p>
          </div>

          {/* Section badge */}
          <div style={{ fontSize: 11, color: "#5A6A6C", fontStyle: "italic", textAlign: "center", paddingBottom: 8 }}>
            Posting to: <strong style={{ color: "#C9AA71" }}>{SECTION_LABELS[section] || section}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── POST CARD ─────────────── */
function PostCard({ post, onClick, view = "grid" }) {
  const firstImg = (post.content || []).find(b => b.type === "image")?.value;

  if (view === "list") return (
    <article className="post-card hover-lift post-card-list" onClick={onClick}
      style={{ display: "flex", gap: 20, background: "#fff", borderRadius: 8, overflow: "hidden",
        cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,.06)", marginBottom: 16 }}>
      {firstImg && (
        <div className="post-thumb" style={{ flexShrink: 0, width: 180, height: 130, overflow: "hidden" }}>
          <img loading="lazy" src={firstImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .5s" }}
            onError={e => e.target.style.display = "none"} />
        </div>
      )}
      <div style={{ padding: "14px 16px 14px 0", flex: 1 }}>
        {post.category && <span className="label-xs" style={{ color: "#8B6914" }}>{post.category}</span>}
        <h3 className="post-card-title" style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700,
          fontSize: "1.1rem", color: "#2E3D3F", margin: "6px 0 8px", lineHeight: 1.35, transition: "color .2s",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.title}</h3>
        <p style={{ fontSize: "0.875rem", color: "#3D5254", lineHeight: 1.65, marginBottom: 10 }}>
          {post.excerpt?.length > 100 ? post.excerpt.slice(0, 100) + "…" : post.excerpt}
        </p>
        <span style={{ fontSize: "0.75rem", color: "#5A6A6C" }}>{formatDate(post.date)}</span>
      </div>
    </article>
  );

  return (
    <article className="post-card hover-lift" onClick={onClick}
      style={{ background: "#fff", borderRadius: 8, overflow: "hidden", cursor: "pointer",
        boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}>
      {firstImg && (
        <div className="img-zoom" style={{ height: 200, overflow: "hidden" }}>
          <img loading="lazy" src={firstImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => e.target.style.display = "none"} />
        </div>
      )}
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          {post.category && <span className="label-xs" style={{ color: "#8B6914" }}>{post.category}</span>}
          {post.badge && <span style={{ fontSize: "0.6875rem", background: "#fff3cd", color: "#7a5c00", padding: "2px 9px", borderRadius: 10, fontWeight: 600, letterSpacing: ".03em" }}>{post.badge}</span>}
          <span style={{ fontSize: "0.75rem", color: "#5A6A6C" }}>{formatDate(post.date)}</span>
        </div>
        <h3 className="post-card-title" style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700,
          fontSize: "1.15rem", color: "#2E3D3F", marginBottom: 10, lineHeight: 1.35, transition: "color .2s",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.title}</h3>
        <p style={{ fontSize: "0.875rem", color: "#3D5254", lineHeight: 1.7 }}>
          {post.excerpt?.length > 110 ? post.excerpt.slice(0, 110) + "…" : post.excerpt}
        </p>

        {post.tags?.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
            {post.tags.slice(0, 3).map(t => (
              <span key={t} style={{ fontSize: "0.6875rem", padding: "3px 9px", background: "#FAF7F0", border: "1px solid #E8DCC8", borderRadius: 10, color: "#3D5254", fontWeight: 500 }}>#{t}</span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

/* ─────────────── ARTICLE DETAIL VIEW ─────────────── */
function ArticleDetail({ post, onBack, allPosts = [], onReadPost }) {
  const [copied, setCopied] = useState(false);

  /* Related: same category/section */
  const related = allPosts
    .filter(p => p.status === "published" && p.id !== post.id &&
      (p.category === post.category || p.section === post.section))
    .slice(0, 8);

  /* All other published posts excluding current */
  const others = allPosts
    .filter(p => p.status === "published" && p.id !== post.id)
    .slice(-16).reverse();

  /* "Artikel Terkait" — prefer related, fallback to others */
  const artikelTerkait = related.length >= 2 ? related : others.slice(0, 6);

  /* "Pilihan Untukmu" — grid below article */
  const pilihanUntukmu = others
    .filter(p => !artikelTerkait.find(r => r.id === p.id))
    .slice(0, 6);

  /* Sidebar right — stacked cards */
  const sidebarCards = others
    .filter(p => !artikelTerkait.find(r => r.id === p.id) && !pilihanUntukmu.find(r => r.id === p.id))
    .slice(0, 6);

  const handlePost = (p) => {
    if (onReadPost) { onReadPost(p); window.scrollTo(0, 0); }
  };

  // Gunakan URL canonical artikel, bukan window.location.href yang bisa berubah
  const shareUrl = typeof window !== "undefined"
    ? window.location.origin + articleUrl(post)
    : "";

  const copyLink = () => {
    navigator.clipboard?.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const sectionLabel = { news: "Exterior", shop: "Gedung & Rumah", destinations: "Interior" };
  const breadSection = sectionLabel[post.section] || post.section || "Artikel";

  return (
    <div className="fade-in art-page">

      {/* ══ SHARE BAR (sticky) ══ */}
      <div className="art-share-bar">
        <button onClick={onBack} style={{ fontSize: 12, color: "#8B6914", fontWeight: 600, background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
          ← Kembali
        </button>
        <span style={{ color: "#ddd" }}>|</span>
        <span style={{ fontSize: 11, color: "#666", fontWeight: 600, letterSpacing: ".5px" }}>BAGIKAN:</span>
        {[
          { bg: "#1877f2", label: "f", url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
          { bg: "#1da1f2", label: "𝕏", url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}` },
          { bg: "#25d366", label: "💬", url: `https://wa.me/?text=${encodeURIComponent(post.title + " " + shareUrl)}` },
          { bg: "#0088cc", label: "✈", url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}` },
        ].map(s => (
          <div key={s.label} className="art-share-icon" style={{ background: s.bg }}
            onClick={() => window.open(s.url, "_blank")}>{s.label}</div>
        ))}
        <span className="art-share-title">{post.title}</span>
        <span style={{ fontSize: 11, color: "#666", fontWeight: 600, letterSpacing: ".5px", whiteSpace: "nowrap" }}>KOMENTAR: 💬</span>
      </div>

      {/* ══ BODY WRAPPER: main + right sidebar ══ */}
      <div className="art-body-wrap">

        {/* ════ MAIN COLUMN ════ */}
        <main className="art-main">

          {/* ── Article Card ── */}
          <div className="art-content-card" style={{ marginBottom: 20 }}>

            <div className="art-content-inner">
              {/* Breadcrumb */}
              <div className="art-breadcrumb">
                VASTURA GROUP / <span>{breadSection}</span>
              </div>

              {/* Title */}
              <h1 className="art-h1">{post.title}</h1>

              {/* Meta Row */}
              <div className="art-meta-row">
                <div className="art-author">
                  <div className="art-avatar">
                    {(post.author || "A")[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#222" }}>{post.author || "Penulis"}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>Penulis · {formatDate(post.date)}</div>
                  </div>
                </div>
                <div className="art-actions">
                  {[
                    { icon: "👍", title: "Suka" },
                    { icon: "G", title: "Google", style: { fontSize: 11, fontWeight: 700, color: "#4285f4" } },
                    { icon: "🔖", title: "Simpan" },
                    { icon: "↗", title: "Bagikan" },
                    { icon: "💬", title: "Komentar" },
                    { icon: "🔔", title: "Ikuti" },
                  ].map(a => (
                    <button key={a.title} className="art-action-btn" title={a.title}>
                      <span style={a.style}>{a.icon}</span>
                    </button>
                  ))}
                </div>
              </div>


              {/* Excerpt */}
              {post.excerpt && (
                <p className="art-excerpt">{post.excerpt}</p>
              )}

              {/* Article Body */}
              <RichRenderer blocks={post.content} />

              {/* Tags */}
              {post.tags?.length > 0 && (
                <div className="art-tags">
                  <span style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Tags:</span>
                  {post.tags.map(t => (
                    <span key={t} style={{ fontSize: 12, padding: "3px 12px", background: "#FAF7F0", border: "1px solid #E8DCC8", borderRadius: 20, color: "#3D5254", fontWeight: 500 }}>#{t}</span>
                  ))}
                </div>
              )}

              {/* Share Bottom */}
              <div style={{ marginTop: 28, padding: "18px 0 0", borderTop: "2px solid #f0f0f0", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#555", letterSpacing: ".5px" }}>Bagikan:</span>
                {[
                  { label: "Facebook", bg: "#1877f2", icon: "f", url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
                  { label: "Twitter/X", bg: "#000", icon: "𝕏", url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}` },
                  { label: "WhatsApp", bg: "#25d366", icon: "💬", url: `https://wa.me/?text=${encodeURIComponent(post.title + " " + shareUrl)}` },
                  { label: "Telegram", bg: "#0088cc", icon: "✈", url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}` },
                ].map(s => (
                  <button key={s.label} onClick={() => window.open(s.url, "_blank")}
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 16px", borderRadius: 4, background: s.bg,
                      border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    <span>{s.icon}</span> {s.label}
                  </button>
                ))}
                <button onClick={copyLink}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 16px", borderRadius: 4,
                    background: copied ? "#27ae60" : "#f0f0f0", border: "1px solid #ddd",
                    color: copied ? "#fff" : "#555", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  🔗 {copied ? "Tersalin!" : "Salin Link"}
                </button>
              </div>
            </div>
          </div>

          {/* ── Artikel Terkait (horizontal scroll) ── */}
          {artikelTerkait.length > 0 && (
            <div className="art-content-card" style={{ marginBottom: 20, padding: "20px 24px" }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 16, paddingBottom: 10, borderBottom: "2px solid #8B6914", display: "inline-block" }}>
                Artikel Terkait
              </h3>
              <div className="art-terkait-scroll">
                {artikelTerkait.map(p => (
                  <div key={p.id} className="art-terkait-card" onClick={() => handlePost(p)}>
                    {(() => { const img = (p.content||[]).find(b=>b.type==="image")?.value; return img
                      ? <div style={{ height: 120, overflow: "hidden" }}><img loading="lazy" src={img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform .3s" }} onMouseEnter={e=>e.target.style.transform="scale(1.05)"} onMouseLeave={e=>e.target.style.transform="scale(1)"} onError={e=>e.target.style.display="none"} /></div>
                      : <div style={{ height: 120, background: "linear-gradient(135deg,#FAF7F0,#E8DCC8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📄</div>;
                    })()}
                    <div style={{ padding: "10px 12px 14px" }}>
                      {p.category && <div style={{ fontSize: 10, color: "#8B6914", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 5 }}>{p.category}</div>}
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: "#222", lineHeight: 1.45,
                        display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {p.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Pilihan Untukmu (grid) ── */}
          {pilihanUntukmu.length > 0 && (
            <div className="art-content-card" style={{ padding: "20px 24px" }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 16, paddingBottom: 10, borderBottom: "2px solid #f39c12", display: "inline-block" }}>
                Pilihan Untukmu
              </h3>
              <div className="art-pilihan-grid">
                {pilihanUntukmu.map(p => (
                  <div key={p.id} className="art-pilihan-card" onClick={() => handlePost(p)}>
                    {(() => { const img = (p.content||[]).find(b=>b.type==="image")?.value; return img
                      ? <div style={{ height: 140, overflow: "hidden" }}><img loading="lazy" src={img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform .3s" }} onMouseEnter={e=>e.target.style.transform="scale(1.05)"} onMouseLeave={e=>e.target.style.transform="scale(1)"} onError={e=>e.target.style.display="none"} /></div>
                      : <div style={{ height: 140, background: "linear-gradient(135deg,#FDFAF4,#FAF7F0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🌟</div>;
                    })()}
                    <div style={{ padding: "12px 14px 16px" }}>
                      {p.category && <div style={{ fontSize: 10, color: "#8B6914", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 5 }}>{p.category}</div>}
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#222", lineHeight: 1.45,
                        display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {p.title}
                      </p>
                      <div style={{ fontSize: 11, color: "#aaa", marginTop: 8 }}>
                        {breadSection} · · ·
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>

        {/* ════ RIGHT SIDEBAR ════ */}
        <aside className="art-sidebar">

          {/* ── Ad Placeholder ── */}
          <div style={{ background: "#fff", borderRadius: 6, border: "1px dashed #ddd", marginBottom: 20, height: 240, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#bbb", gap: 8 }}>
            <div style={{ fontSize: 28 }}>🏔</div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>VASTURA GROUP</div>
            <div style={{ fontSize: 11, color: "#ccc", textAlign: "center", padding: "0 20px", lineHeight: 1.6 }}>
              Wujudkan perjalanan impian & momen spesialmu bersama kami
            </div>
            <a href="#" style={{ marginTop: 6, fontSize: 11, padding: "6px 16px", background: "#8B6914", color: "#fff", borderRadius: 4, fontWeight: 600, textDecoration: "none" }}>
              Hubungi Kami
            </a>
          </div>

          {/* ── Berita Populer sidebar cards ── */}
          {sidebarCards.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 6, overflow: "hidden", marginBottom: 20 }}>
              <div style={{ padding: "12px 16px", borderBottom: "2px solid #8B6914" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>Berita Terpopuler</span>
              </div>
              <div style={{ padding: "8px 16px" }}>
                {sidebarCards.map(p => (
                  <div key={p.id} className="art-sb-card" onClick={() => handlePost(p)}>
                    <div className="art-sb-thumb">
                      {(() => { const img = (p.content||[]).find(b=>b.type==="image")?.value; return img
                        ? <img loading="lazy" src={img} alt="" onError={e=>e.target.style.display="none"} />
                        : <div style={{ width:"100%", height:"100%", background:"#FAF7F0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>📄</div>;
                      })()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#222", lineHeight: 1.45,
                        display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {p.title}
                      </p>
                      {p.category && <div style={{ fontSize: 10, color: "#8B6914", marginTop: 5, fontWeight: 600 }}>{p.category}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Layanan Unggulan sidebar ── */}
          <div style={{ background: "linear-gradient(135deg,#2E3D3F 0%,#3D5254 55%,#E8C96A 100%)", borderRadius: 6, padding: "20px 18px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.7)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>🌟 Layanan Kami</div>
            {[
              { icon: "🏠", txt: "Gedung & Rumah" },
              { icon: "🛋️", txt: "Interior" },
              { icon: "🔧", txt: "Exterior" },
              { icon: "🏨", txt: "Hotel & Villa" },
            ].map(s => (
              <div key={s.txt} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,.9)", fontWeight: 500 }}>{s.txt}</span>
              </div>
            ))}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,.2)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[{ v: "200+", l: "Destinasi" }, { v: "5★", l: "Rating" }, { v: "1000+", l: "Klien" }, { v: "10+", l: "Tahun" }].map(s => (
                  <div key={s.l} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", fontFamily: "'Playfair Display',serif" }}>{s.v}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,.65)" }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Saran Postingan ── */}
          {sidebarCards.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", marginTop: 20, boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}>
              <div style={{ background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 60%,#E8C96A 100%)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 14 }}>✨</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "1px" }}>Saran Postingan</span>
              </div>
              <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                {sidebarCards.slice(0, 3).map(p => (
                  <div key={p.id} onClick={() => handlePost(p)}
                    style={{ display: "flex", gap: 10, cursor: "pointer", padding: "6px 0", borderBottom: "1px solid #f0f9fb" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#FDFAF4"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    {(() => { const img = (p.content||[]).find(b=>b.type==="image")?.value; return img
                      ? <div style={{ width:36, height:36, borderRadius:6, overflow:"hidden", flexShrink:0 }}><img loading="lazy" src={img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>e.target.style.display="none"} /></div>
                      : <div style={{ width:36, height:36, borderRadius:6, background:"#FAF7F0", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>📄</div>;
                    })()}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#1a2e3b", lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: 4 }}>{p.title}</p>
                      <span style={{ fontSize: 10, color: "#8B6914", fontWeight: 600 }}>{p.category || (p.section === "news" ? "Exterior" : p.section === "shop" ? "Gedung & Rumah" : "Interior")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Topik ── */}
          {(() => {
            const allTags = [];
            others.forEach(p => (p.tags || []).forEach(t => { if (!allTags.includes(t)) allTags.push(t); }));
            if (allTags.length === 0) return null;
            return (
              <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", marginTop: 16, boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #FAF7F0", display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 13 }}>🗂</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#2E3D3F", textTransform: "uppercase", letterSpacing: "1px" }}>Topik</span>
                </div>
                <div style={{ padding: "12px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                  {allTags.slice(0, 14).map(tag => (
                    <span key={tag} style={{ fontSize: 11, padding: "4px 11px", background: "#FAF7F0", border: "1px solid #b6dff0", borderRadius: 20, color: "#3D5254", fontWeight: 500 }}>#{tag}</span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── Tips Perjalanan ── */}
          <div style={{ background: "linear-gradient(135deg,#0a3d55 0%,#0d5a7a 100%)", borderRadius: 8, overflow: "hidden", marginTop: 16, marginBottom: 4, boxShadow: "0 2px 10px rgba(0,0,0,.1)" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,.12)", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#D4AF37", display: "inline-block", boxShadow: "0 0 6px #D4AF37" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "1px" }}>Tips Perjalanan</span>
            </div>
            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { icon: "🌤", tip: "Periksa cuaca setempat sebelum berangkat." },
                { icon: "🛡", tip: "Bawa asuransi perjalanan untuk ketenangan pikiran." },
                { icon: "📷", tip: "Simpan foto offline sebagai kenang-kenangan." },
                { icon: "🌏", tip: "Hormati budaya & adat istiadat lokal setempat." },
                { icon: "💳", tip: "Siapkan uang tunai & kartu cadangan untuk keadaan darurat." },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                  <span style={{ fontSize: 11.5, color: "rgba(255,255,255,.88)", lineHeight: 1.55 }}>{item.tip}</span>
                </div>
              ))}
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}

/* ─────────────── SECTION PAGE ─────────────── */
function SectionPage({ section, posts, onReadPost }) {
  const [filter, setFilter] = useState("All");
  const [viewMode, setViewMode] = useState("grid");
  const published = (posts[section] || []).filter(p => p.status === "published");
  const cats = ["All", ...new Set(published.map(p => p.category).filter(Boolean))];
  const filtered = filter === "All" ? published : published.filter(p => p.category === filter);
  const popular = [...published].sort((a, b) => b.id - a.id).slice(0, 8);

  const sectionMeta = {
    news: { title: "Exterior", sub: "Pagar, kanopi, landscape, aluminium & semua layanan eksterior hunian Anda.", icon: "🔧" },
    shop: { title: "Gedung & Rumah", sub: "Proyek pembangunan, renovasi, dan pengembangan properti hunian berkualitas.", icon: "🏠" },
    destinations: { title: "Interior", sub: "Desain dan dekorasi interior profesional untuk setiap ruangan — dari konsep hingga finishing.", icon: "🛋️" },
  };
  const meta = sectionMeta[section] || { title: section, sub: "", icon: "◈" };

  return (
    <div className="fade-in" style={{ minHeight: "100vh", background: "#FAF7F0" }}>
      {/* Hero Banner */}
      <div style={{ background: "linear-gradient(135deg, #2E3D3F 0%, #3D5254 100%)", padding: "60px 5%", color: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontSize: "0.6875rem", letterSpacing: "2px", color: "#C9AA71", textTransform: "uppercase", marginBottom: 12, fontWeight: 600 }}>
            {meta.icon} VASTURA GROUP
          </div>
          <h1 className="display" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, lineHeight: 1.08, marginBottom: 16, color: "#fff" }}>
            {meta.title}
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,.75)", maxWidth: 460, lineHeight: 1.85 }}>{meta.sub}</p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 5%" }}>
        <div className="section-page-grid" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 40, alignItems: "start" }}>
          {/* Main */}
          <div>
            {/* Filter + View Controls */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {cats.map(c => (
                  <button key={c} onClick={() => setFilter(c)} style={{
                    padding: "6px 16px", fontSize: 12, borderRadius: 20,
                    border: filter === c ? "none" : "1px solid #D4C4A0",
                    background: filter === c ? "#8B6914" : "#fff",
                    color: filter === c ? "#fff" : "#3D5254", fontWeight: filter === c ? 500 : 400,
                    transition: "all .2s"
                  }}>{c}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[["grid", "▦"], ["list", "☰"]].map(([mode, icon]) => (
                  <button key={mode} onClick={() => setViewMode(mode)} style={{
                    padding: "7px 12px", fontSize: 14,
                    border: `1px solid ${viewMode === mode ? "#C9AA71" : "#D4C4A0"}`,
                    borderRadius: 6, background: viewMode === mode ? "#F5EDD8" : "#fff",
                    color: viewMode === mode ? "#C9AA71" : "#5A6A6C"
                  }}>{icon}</button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#5A6A6C" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
                <p style={{ fontSize: 15 }}>No posts published yet.</p>
              </div>
            ) : viewMode === "grid" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
                {filtered.map(p => <PostCard key={p.id} post={p} onClick={() => onReadPost(p)} view="grid" />)}
              </div>
            ) : (
              <div>{filtered.map(p => <PostCard key={p.id} post={p} onClick={() => onReadPost(p)} view="list" />)}</div>
            )}
          </div>

          {/* Sidebar */}
          <aside>
            {/* Popular / Recent */}
            <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,.06)", marginBottom: 24 }}>
              <div style={{ background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", padding: "14px 20px" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", letterSpacing: "1px", textTransform: "uppercase" }}>Most Popular</span>
              </div>
              <div style={{ padding: "8px 0" }}>
                {popular.map((p, i) => (
                  <div key={p.id} onClick={() => onReadPost(p)}
                    style={{ display: "flex", gap: 12, padding: "10px 20px", cursor: "pointer", borderBottom: "1px solid #FAF7F0", transition: "background .15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#FAF7F0"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: i < 3 ? "#e74c3c" : "#A89070", fontFamily: "'Cormorant Garamond',serif", lineHeight: 1, minWidth: 24 }}>{i + 1}</span>
                    <span style={{ fontSize: 13, color: "#2E3D3F", lineHeight: 1.5, fontWeight: 400 }}>{p.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
              <div style={{ background: "#FAF7F0", padding: "14px 20px", borderBottom: "1px solid #F5EDD8" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#2E3D3F", letterSpacing: "1px", textTransform: "uppercase" }}>Categories</span>
              </div>
              <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                {cats.filter(c => c !== "All").map(c => {
                  const count = published.filter(p => p.category === c).length;
                  return (
                    <button key={c} onClick={() => setFilter(c)}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "6px 0", borderBottom: "1px solid #FAF7F0", background: "none",
                        border: "none", cursor: "pointer", textAlign: "left" }}>
                      <span style={{ fontSize: 13, color: "#C9AA71" }}>→ {c}</span>
                      <span style={{ fontSize: 11, background: "#FAF7F0", color: "#5A6A6C", padding: "2px 8px", borderRadius: 10 }}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── TRAVEL PACKAGE CARD (accordion price) ─────────────── */

/* Shared hook: returns true when viewport width ≤ 640px */
function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return mobile;
}

/* ── WIDE CARD for Custom Event / Wedding Package — full width horizontal layout ── */
function EventWeddingCustomCardWide({ svc, onDetail, onWaOpen }) {
  const [hovered, setHovered] = useState(false);
  const isMobile = useIsMobile();
  const ac = svc.badgeColor || "#7c3aed";
  const isWedding = svc.category === "wedding";
  const gradientBg = isWedding
    ? `linear-gradient(135deg, #2d1b4e 0%, #5b2d8e 50%, ${ac} 100%)`
    : `linear-gradient(135deg, #0a2e52 0%, #3D5254 50%, ${ac} 100%)`;
  const icon = isWedding ? "💍" : "🎉";
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 18,
        boxShadow: hovered ? "0 24px 64px rgba(13,59,102,.22)" : "0 6px 28px rgba(13,59,102,.13)",
        border: `2px solid ${hovered ? ac : ac + "60"}`,
        transition: "all .3s cubic-bezier(.22,1,.36,1)",
        transform: hovered ? "translateY(-4px)" : "none",
        background: gradientBg,
        display: "flex", flexDirection: isMobile ? "column" : "row",
        minHeight: isMobile ? "auto" : 280,
        fontFamily: "'DM Sans',sans-serif", position: "relative", overflow: "visible",
      }}>
      <div style={{ position: "absolute", right: -60, top: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,.06)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", right: 100, bottom: -80, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,.04)", pointerEvents: "none" }} />
      {/* Image */}
      <div style={{ position: "relative", width: isMobile ? "100%" : 320, height: isMobile ? 200 : "auto", flexShrink: 0, overflow: "hidden", borderRadius: isMobile ? "16px 16px 0 0" : "16px 0 0 16px" }}>
        <img loading="lazy" src={svc.images?.[0] || svc.image} alt={svc.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .5s", transform: hovered ? "scale(1.07)" : "scale(1)", opacity: 0.75 }}
          onError={e => { e.target.src = ""; }} />
        <div style={{ position: "absolute", inset: 0, background: isMobile ? "linear-gradient(180deg,transparent 40%,rgba(0,0,0,.5) 100%)" : "linear-gradient(90deg,transparent 50%, rgba(0,0,0,.4) 100%)" }} />
        <div style={{ position: "absolute", top: 16, left: 16, background: ac, color: "#fff", borderRadius: 20, padding: "4px 14px", fontSize: "0.625rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase" }}>{svc.badge}</div>
      </div>
      {/* Content */}
      <div style={{ flex: 1, padding: isMobile ? "22px 20px 24px" : "32px 40px", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: "2rem", marginBottom: 8 }}>{icon}</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? "1.4rem" : "clamp(1.4rem,2.5vw,2rem)", fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 6 }}>{svc.title}</h2>
        {svc.tagline && <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,.65)", fontWeight: 600, letterSpacing: ".04em", marginBottom: 14, fontStyle: "italic" }}>{svc.tagline}</div>}
        <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,.80)", lineHeight: 1.75, marginBottom: 20 }}>{svc.description}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {(svc.features || []).map((feat, i) => (
            <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "5px 12px", backdropFilter: "blur(4px)" }}>
              <span style={{ color: "#4ade80", fontWeight: 700, fontSize: "0.875rem" }}>&#10003;</span>
              <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,.9)", fontWeight: 500, whiteSpace: "pre-wrap" }}>{feat}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: isMobile ? "stretch" : "center", gap: 12, flexDirection: isMobile ? "column" : "row", flexWrap: "wrap" }}>
          <div style={{ marginBottom: isMobile ? 4 : 0 }}>
            <div style={{ fontSize: "0.625rem", color: "rgba(255,255,255,.55)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 2 }}>Harga</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.5rem", fontWeight: 900, color: "#fff" }}>{(()=>{ const uPt=(svc.paketTypes||[]).find(pt=>pt.id===(svc.utamaTipeId||svc.paketTypes?.[0]?.id)); const rp=uPt?.price||svc.price; return formatRp(rp)||rp; })()}</div>
            <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,.6)", fontStyle: "italic" }}>{svc.priceNote}</div>
          </div>
          <button onClick={onDetail}
            style={{ padding: "12px 28px", background: "#fff", color: ac, border: "none", borderRadius: 10, fontSize: "0.9375rem", fontWeight: 800, cursor: "pointer", letterSpacing: ".02em", transition: "all .2s", boxShadow: "0 4px 16px rgba(0,0,0,.25)", width: isMobile ? "100%" : "auto" }}
            onMouseEnter={e => { e.currentTarget.style.opacity = ".9"; e.currentTarget.style.transform = "scale(1.04)"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}>
            Lihat Detail &amp; Konsultasi
          </button>
          <button onClick={() => onWaOpen && onWaOpen({ key: "paket", vars: { judul_paket: svc.title } })}
            style={{ padding: "12px 24px", background: "#25d366", color: "#fff", borderRadius: 10, fontSize: "0.9375rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "none", transition: "opacity .2s", width: isMobile ? "100%" : "auto" }}
            onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            &#128172; WhatsApp Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── WIDE CARD for Custom Package — full width horizontal layout ── */
/* ─────────────── EVENT / WEDDING PACKAGE CARD (Traveling-style) ─────────────── */
function EventWeddingPackageCard({ svc, onDetail, onWaOpen, isWide, categoryPackages = [] }) {
  const [hovered, setHovered] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [openPkgIdx, setOpenPkgIdx] = useState(null);
  const isMobile = useIsMobile();
  const ac = svc.accent || (svc.category === "wedding" ? "#db2777" : "#8B6914");
  const al = svc.accentLight || (svc.category === "wedding" ? "#fff0f7" : "#FAF7F0");
  const fmt = n => {
    if (!n) return n;
    const str = String(n);
    if (str.toLowerCase().includes("hubungi")) return str;
    const num = Number(str.replace(/[^0-9]/g, ""));
    return isNaN(num) || num === 0 ? str : num.toLocaleString("id-ID");
  };
  // Semua paket dalam kategori untuk dropdown (exclude custom, termasuk diri sendiri)
  const allCatPkgs = categoryPackages.filter(s => s.pkgId !== "custom");

  /* image gallery — pakai images[] jika ada, fallback image */
  const imgs = (svc.images && svc.images.length > 0) ? svc.images : [svc.image].filter(Boolean);
  const [imgIdx, setImgIdx] = useState(0);

  if (isWide) {
    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: "#fff", borderRadius: 16, overflow: "visible",
          boxShadow: hovered ? "0 20px 56px rgba(13,59,102,.2)" : "0 4px 24px rgba(13,59,102,.1)",
          border: `2px solid ${hovered ? ac : svc.highlight ? ac + "80" : "#e8f4f8"}`,
          fontFamily: "'DM Sans',sans-serif", transition: "all .3s cubic-bezier(.22,1,.36,1)",
          transform: hovered ? "translateY(-4px)" : "none",
          display: "flex", flexDirection: isMobile ? "column" : "row",
          minHeight: isMobile ? "auto" : 260,
        }}>
        {/* Gambar kiri full height */}
        <div onClick={onDetail} style={{ position: "relative", width: isMobile ? "100%" : "40%", height: isMobile ? 210 : "auto", flexShrink: 0, overflow: "hidden", cursor: "pointer", borderRadius: isMobile ? "14px 14px 0 0" : "0" }}>
          <img loading="lazy" src={imgs[imgIdx] || imgs[0]} alt={svc.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block",
              transition: "transform .5s", transform: hovered ? "scale(1.06)" : "scale(1)" }}
            onError={e => { e.target.src = ""; }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 60%, rgba(255,255,255,.1) 100%)" }} />
          {svc.badge && (
            <div style={{ position: "absolute", top: 14, left: 14, background: svc.badgeColor || ac, color: "#fff", borderRadius: 20, padding: "4px 14px", fontSize: "0.625rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>{svc.badge}</div>
          )}
          {svc.highlight && (
            <div style={{ position: "absolute", top: 14, right: 0, background: "linear-gradient(130deg,#2E3D3F,#8B6914)", color: "#fff", borderRadius: "20px 0 0 20px", padding: "4px 12px 4px 14px", fontSize: "0.625rem", fontWeight: 700 }}>⭐ Pilihan Utama</div>
          )}
          {/* Dots navigasi gambar */}
          {imgs.length > 1 && (
            <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
              {imgs.map((_, i) => (
                <button key={i} onClick={e => { e.stopPropagation(); setImgIdx(i); }}
                  style={{ width: i === imgIdx ? 18 : 6, height: 6, borderRadius: 3, border: "none", background: i === imgIdx ? "#fff" : "rgba(255,255,255,.5)", cursor: "pointer", padding: 0, transition: "all .2s" }} />
              ))}
            </div>
          )}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "28px 16px 14px", background: "linear-gradient(to top, rgba(0,0,0,.7) 0%, transparent 100%)" }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", fontWeight: 700, color: "#fff", lineHeight: 1.2, textShadow: "0 2px 12px rgba(0,0,0,.8)" }}>{svc.title}</h3>
          </div>
        </div>
        {/* Konten kanan */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ padding: "16px 20px 8px", display: "flex", gap: 14, flexWrap: "wrap" }}>
            {imgs.length > 1 && <span style={{ fontSize: "0.8125rem", color: "#5A6A6C" }}>🖼 {imgs.length} Foto Kegiatan</span>}
            <span style={{ fontSize: "0.8125rem", color: "#5A6A6C" }}>{svc.category === "wedding" ? "🛋️ Interior" : "🔧 Exterior"}</span>
          </div>
          <p style={{ fontSize: "0.875rem", color: "#5A6A6C", lineHeight: 1.65, padding: "0 20px 12px" }}>{svc.description}</p>
          {(svc.features || []).length > 0 && (
            <div style={{ padding: "0 20px 14px", display: "flex", flexWrap: "wrap", gap: "5px 18px" }}>
              {(svc.features || []).slice(0, 4).map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  <span style={{ color: "#27ae60", fontWeight: 700, fontSize: "0.875rem" }}>✓</span>
                  <span style={{ fontSize: "0.8125rem", color: "#3D5254", fontWeight: 500, whiteSpace: "pre-wrap" }}>{f}</span>
                </div>
              ))}
              {(svc.features || []).length > 4 && <span style={{ fontSize: "0.75rem", color: "#8B6914", fontWeight: 600 }}>+{svc.features.length - 4} lainnya</span>}
            </div>
          )}
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "stretch", borderTop: "1px solid #edf5f8", flexDirection: "column" }}>
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 20px", background: `linear-gradient(135deg,#2E3D3F 0%,#3D5254 55%,${ac} 100%)`,
                position: "relative",
              }}>
              <div style={{ position: "absolute", right: -12, top: -12, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />
              <div>
                <p style={{ color: "rgba(255,255,255,.65)", fontSize: "0.5625rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 3 }}>Harga Mulai Dari</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.75rem", fontWeight: 900, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,.3)" }}>{(()=>{ const uPt=(svc.paketTypes||[]).find(pt=>pt.id===(svc.utamaTipeId||svc.paketTypes?.[0]?.id)); const rp=uPt?.price||svc.price; return formatRp(rp)||rp; })()}</span>
                  <span style={{ color: "rgba(255,255,255,.65)", fontSize: "0.75rem" }}>{svc.priceNote}</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", flexShrink: 0, gap: 0 }}>
                <button onClick={e => { e.stopPropagation(); onWaOpen && onWaOpen({ key: "paket", vars: { judul_paket: svc.title } }); }}
                  style={{ padding: "8px 20px", background: "#25D366", color: "#fff", border: "none", fontSize: "0.8125rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, borderBottom: "1px solid rgba(255,255,255,.2)" }}>
                  💬 WA
                </button>
                <button onClick={e => { e.stopPropagation(); onDetail(); }}
                  style={{ padding: "8px 20px", background: `linear-gradient(135deg,#2E3D3F,${ac})`, color: "#fff", border: "none", fontSize: "0.8125rem", fontWeight: 700, cursor: "pointer", transition: "opacity .2s" }}
                  onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                  Lihat Detail →
                </button>
              </div>
            </div>
            {/* Paket Pills — selalu tampil */}
            {(svc.paketTypes||[]).length > 0 && (
              <div style={{ background: al, padding: "10px 20px 12px", borderTop: `1px solid ${ac}25` }}>
                <p style={{ fontSize: "0.5625rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: ac, marginBottom: 6 }}>Pilihan Paket</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {(svc.paketTypes||[]).map((pt) => {
                    const isUtama = pt.id === (svc.utamaTipeId || svc.paketTypes?.[0]?.id);
                    const isContact = String(pt.price || "").toLowerCase().includes("hubungi");
                    return (
                      <span key={pt.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 9px", borderRadius: 20, boxSizing: "border-box", border: `1.5px solid ${isUtama ? ac : ac + "40"}`, background: isUtama ? `${ac}12` : "#fff", fontSize: "0.6875rem", fontWeight: 600, color: "#2E3D3F", minWidth: 0, maxWidth: "100%", flexShrink: 1 }}>
                        {isUtama && <span style={{ fontSize: "0.4rem", fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", padding: "1px 5px", borderRadius: 8, background: "#E8C96A", color: "#2E3D3F", flexShrink: 0 }}>UTAMA</span>}
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pt.name}</span>
                        {pt.price && <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "0.625rem", fontWeight: 700, color: ac, flexShrink: 0 }}>{isContact ? "Konsultasi" : formatRp(pt.price) || pt.price}</span>}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: "#fff", borderRadius: 16, overflow: "visible",
        boxShadow: hovered ? "0 16px 48px rgba(46,61,63,.18)" : "0 4px 20px rgba(13,59,102,.09)",
        border: `2px solid ${hovered ? ac : svc.highlight ? ac + "80" : "transparent"}`,
        fontFamily: "'DM Sans',sans-serif", transition: "all .3s cubic-bezier(.22,1,.36,1)",
        transform: hovered ? "translateY(-5px)" : "none", position: "relative" }}>

      {/* Hero image with overlay title */}
      <div onClick={onDetail} style={{ position: "relative", height: 190, overflow: "hidden", borderRadius: "14px 14px 0 0", cursor: "pointer" }}>
        <img loading="lazy" src={imgs[imgIdx] || imgs[0]} alt={svc.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .5s", transform: hovered ? "scale(1.06)" : "scale(1)" }}
          onError={e => { e.target.src = ""; }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 35%,rgba(0,0,0,.65) 100%)" }} />
        {svc.badge && (
          <div style={{ position: "absolute", top: 12, left: 12, background: svc.badgeColor || ac, color: "#fff", borderRadius: 20, padding: "3px 12px", fontSize: "0.625rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>
            {svc.badge}
          </div>
        )}
        {svc.highlight && (
          <div style={{ position: "absolute", top: 12, right: 12, background: "linear-gradient(130deg,#2E3D3F,#8B6914)", color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: "0.625rem", fontWeight: 700 }}>⭐ Pilihan Utama</div>
        )}
        {/* Image thumbnails nav (if multiple) */}
        {imgs.length > 1 && (
          <div style={{ position: "absolute", bottom: 42, right: 10, display: "flex", gap: 4 }}>
            {imgs.map((_, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); setImgIdx(i); }}
                style={{ width: i === imgIdx ? 18 : 6, height: 6, borderRadius: 3, border: "none", background: i === imgIdx ? "#fff" : "rgba(255,255,255,.5)", cursor: "pointer", padding: 0, transition: "all .2s" }} />
            ))}
          </div>
        )}
        <div style={{ position: "absolute", bottom: 12, left: 14, right: 14 }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.0625rem", fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: 2, textShadow: "0 2px 12px rgba(0,0,0,.8), 0 1px 4px rgba(0,0,0,.6)" }}>{svc.title}</h3>
        </div>
      </div>

      {/* Info row: foto kegiatan count + category label */}
      <div style={{ padding: "10px 14px 0", display: "flex", gap: 14, flexWrap: "wrap" }}>
        {imgs.length > 1 && <span style={{ fontSize: "0.75rem", color: "#5A6A6C" }}>🖼 {imgs.length} Foto Kegiatan</span>}
        <span style={{ fontSize: "0.75rem", color: "#5A6A6C", textTransform: "capitalize" }}>
          {svc.category === "wedding" ? "🛋️ Interior" : "🔧 Exterior"}
        </span>
      </div>

      {/* Description */}
      <p style={{ fontSize: "0.8125rem", color: "#5A6A6C", lineHeight: 1.6, padding: "8px 14px 10px" }}>{svc.description}</p>

      {/* Top features */}
      {(svc.features || []).length > 0 && (
        <div style={{ padding: "0 14px 12px" }}>
          {(svc.features || []).slice(0, 3).map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start", marginBottom: 5 }}>
              <span style={{ color: "#27ae60", fontWeight: 700, fontSize: "0.875rem", flexShrink: 0, marginTop: 1 }}>✓</span>
              <span style={{ fontSize: "0.75rem", color: "#3D5254", fontWeight: 500, lineHeight: 1.45, whiteSpace: "pre-wrap" }}>{f}</span>
            </div>
          ))}
          {(svc.features || []).length > 3 && (
            <div style={{ fontSize: "0.6875rem", color: "#8B6914", fontWeight: 600, marginTop: 2 }}>+{svc.features.length - 3} fitur lainnya</div>
          )}
        </div>
      )}

      {/* Price block */}
      <div style={{
          background: `linear-gradient(135deg,#2E3D3F 0%,#3D5254 55%,${ac} 100%)`,
          padding: "14px 14px 16px", position: "relative",
          borderTop: "3px solid rgba(255,255,255,.15)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.18)",
          userSelect: "none",
        }}>
        <div style={{ position: "absolute", right: -16, top: -16, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />
        <div>
          <p style={{ color: "rgba(255,255,255,.65)", fontSize: "0.5625rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 3 }}>Harga Mulai Dari</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            {(() => {
              const utamaPt = (svc.paketTypes||[]).find(pt => pt.id === (svc.utamaTipeId || svc.paketTypes?.[0]?.id)); const rawPrice = utamaPt?.price || svc.price;
              const isContact = String(rawPrice || "").toLowerCase().includes("hubungi");
              return isContact ? (
                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>Hubungi Kami</span>
              ) : (
                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.1rem,4vw,1.5rem)", fontWeight: 900, color: "#fff", lineHeight: 1, textShadow: "0 2px 8px rgba(0,0,0,.3)" }}>{formatRp(rawPrice) || rawPrice}</span>
              );
            })()}
            <span style={{ color: "rgba(255,255,255,.65)", fontSize: "0.75rem" }}>{svc.priceNote}</span>
          </div>
        </div>
        <p style={{ color: "rgba(255,255,255,.45)", fontSize: "0.6rem", marginTop: 4, letterSpacing: ".04em" }}>Nego / Konsultasi dulu</p>
      </div>

      {/* Paket Pills — tampil jika ada paketTypes */}
      {(svc.paketTypes||[]).length > 0 && (
        <div style={{ background: al, padding: "10px 14px 12px", borderLeft: `1px solid ${ac}25`, borderRight: `1px solid ${ac}25`, borderTop: `1px solid ${ac}20` }}>
          <p style={{ fontSize: "0.5625rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: ac, marginBottom: 6 }}>Pilihan Paket</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {(svc.paketTypes||[]).map((pt) => {
              const isUtama = pt.id === (svc.utamaTipeId || svc.paketTypes?.[0]?.id);
              const isContact = String(pt.price || "").toLowerCase().includes("hubungi");
              return (
                <span key={pt.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 9px", borderRadius: 20, boxSizing: "border-box", border: `1.5px solid ${isUtama ? ac : ac + "40"}`, background: isUtama ? `${ac}12` : "#fff", fontSize: "0.6875rem", fontWeight: 600, color: "#2E3D3F", minWidth: 0, maxWidth: "100%", flexShrink: 1 }}>
                  {isUtama && <span style={{ fontSize: "0.4rem", fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", padding: "1px 5px", borderRadius: 8, background: "#E8C96A", color: "#2E3D3F", flexShrink: 0 }}>UTAMA</span>}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pt.name}</span>
                  {pt.price && <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "0.625rem", fontWeight: 700, color: ac, flexShrink: 0 }}>{isContact ? "Konsultasi" : formatRp(pt.price) || pt.price}</span>}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <div style={{ padding: "10px 12px 12px", background: al, borderLeft: `1px solid ${ac}25`, borderRight: `1px solid ${ac}25`, borderBottom: `1px solid ${ac}25`, borderRadius: "0 0 14px 14px", display: "flex", gap: 8 }}>
        <button
          onClick={() => onWaOpen && onWaOpen({ key: "paket", vars: { judul_paket: svc.title } })}
          style={{ flex: 1, padding: "10px 0", background: "#25D366", color: "#fff", border: "none", borderRadius: 8, fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          💬 WA
        </button>
        <button onClick={onDetail}
          style={{ flex: 3, padding: "10px 0", background: `linear-gradient(135deg,#2E3D3F,${ac})`, color: "#fff", border: "none", borderRadius: 8, fontSize: "0.8125rem", fontWeight: 700, cursor: "pointer", transition: "opacity .2s" }}
          onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
          Lihat Detail →
        </button>
      </div>
    </div>
  );
}

function TravelPackageCardWide({ svc, onDetail, onWaOpen }) {
  const [hovered, setHovered] = useState(false);
  const isMobile = useIsMobile();
  const ac = svc.accent || "#7c3aed";
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff", borderRadius: 18,
        overflow: "visible",
        boxShadow: hovered ? "0 20px 60px rgba(46,61,63,.18)" : "0 4px 24px rgba(46,61,63,.10)",
        border: `2px solid ${hovered ? ac : ac + "50"}`,
        transition: "all .3s cubic-bezier(.22,1,.36,1)",
        transform: hovered ? "translateY(-4px)" : "none",
        display: "flex", flexDirection: isMobile ? "column" : "row",
        minHeight: isMobile ? "auto" : 260,
        fontFamily: "'DM Sans',sans-serif",
      }}>
      {/* Image */}
      <div onClick={onDetail} style={{ position: "relative", width: isMobile ? "100%" : 340, height: isMobile ? 210 : "auto", flexShrink: 0, overflow: "hidden", cursor: "pointer" }}>
        <img loading="lazy" src={svc.images?.[0] || svc.image} alt={svc.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .5s", transform: hovered ? "scale(1.07)" : "scale(1)" }}
          onError={e => { e.target.src = ""; }} />
        <div style={{ position: "absolute", inset: 0, background: isMobile ? "linear-gradient(180deg,transparent 40%,rgba(0,0,0,.4) 100%)" : "linear-gradient(90deg,transparent 60%,rgba(0,0,0,.35) 100%)" }} />
        {svc.badge && (
          <div style={{ position: "absolute", top: 14, left: 14, background: svc.badgeColor || ac, color: "#fff", borderRadius: 20, padding: "4px 14px", fontSize: "0.625rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>
            {svc.badge}
          </div>
        )}
      </div>
      {/* Content */}
      <div style={{ flex: 1, padding: isMobile ? "20px 18px 24px" : "28px 36px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 0 }}>
        <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 6 : 14, marginBottom: 10 }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? "1.4rem" : "1.75rem", fontWeight: 900, color: "#2E3D3F", lineHeight: 1.1, margin: 0 }}>{svc.title}</h2>
          <span style={{ fontSize: "0.75rem", background: ac + "18", color: ac, borderRadius: 20, padding: "4px 14px", fontWeight: 700, letterSpacing: ".05em" }}>{svc.tagline}</span>
        </div>
        <p style={{ fontSize: "0.9375rem", color: "#5A6A6C", lineHeight: 1.75, marginBottom: 18 }}>{svc.description}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
          {(svc.features || []).map((feat, i) => (
            <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", background: "#f0f7fb", borderRadius: 8, padding: "5px 12px" }}>
              <span style={{ color: "#27ae60", fontWeight: 700, fontSize: "0.875rem" }}>✓</span>
              <span style={{ fontSize: "0.8125rem", color: "#3D5254", fontWeight: 500, whiteSpace: "pre-wrap" }}>{feat}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: isMobile ? "stretch" : "center", flexDirection: isMobile ? "column" : "row", gap: 12, flexWrap: "wrap" }}>
          <div style={{ marginBottom: isMobile ? 4 : 0 }}>
            <div style={{ fontSize: "0.625rem", color: "#5A6A6C", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 2 }}>Harga</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.5rem", fontWeight: 900, color: "#2E3D3F" }}>{(()=>{ const uPt=(svc.paketTypes||[]).find(pt=>pt.id===(svc.utamaTipeId||svc.paketTypes?.[0]?.id)); const rp=uPt?.price||svc.price; return formatRp(rp)||rp; })()}</div>
            <div style={{ fontSize: "0.6875rem", color: "#5A6A6C", fontStyle: "italic" }}>{svc.priceNote}</div>
          </div>
          <button onClick={onDetail}
            style={{ padding: "12px 28px", background: `linear-gradient(135deg,${ac},#8B6914)`, color: "#fff", border: "none", borderRadius: 10, fontSize: "0.9375rem", fontWeight: 700, cursor: "pointer", letterSpacing: ".03em", transition: "opacity .2s", width: isMobile ? "100%" : "auto" }}
            onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            Lihat Detail &amp; Konsultasi
          </button>
          <button onClick={() => onWaOpen && onWaOpen({ key: "paket", vars: { judul_paket: svc.title } })}
            style={{ padding: "12px 24px", background: "#25d366", color: "#fff", borderRadius: 10, fontSize: "0.9375rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "none", transition: "opacity .2s", width: isMobile ? "100%" : "auto" }}
            onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            💬 WhatsApp Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}

function TravelPackageCard({ svc, onDetail, onWaOpen, isWide }) {
  const [openIdx, setOpenIdx] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const isMobile = useIsMobile();
  const ac = svc.accent || "#e8a020";
  const al = svc.accentLight || "#fff8e6";
  const fmt = n => {
    if (!n || isNaN(String(n).replace(/\./g, ""))) return n;
    return Number(String(n).replace(/\./g, "")).toLocaleString("id-ID");
  };

  // ── MODE WIDE (1 kolom): layout landscape — gambar kiri full, konten kanan ──
  if (isWide) {
    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: "#fff", borderRadius: 16, overflow: "visible",
          boxShadow: hovered ? "0 20px 56px rgba(13,59,102,.2)" : "0 4px 24px rgba(13,59,102,.1)",
          border: `2px solid ${hovered ? ac : svc.highlight ? ac + "80" : "#e8f4f8"}`,
          fontFamily: "'DM Sans',sans-serif", transition: "all .3s cubic-bezier(.22,1,.36,1)",
          transform: hovered ? "translateY(-4px)" : "none",
          display: "flex", flexDirection: isMobile ? "column" : "row",
          minHeight: isMobile ? "auto" : 280,
        }}>

        {/* Gambar kiri — full height */}
        <div onClick={onDetail} style={{ position: "relative", width: isMobile ? "100%" : "42%", height: isMobile ? 210 : "auto", flexShrink: 0, overflow: "hidden", cursor: "pointer", borderRadius: isMobile ? "14px 14px 0 0" : "0" }}>
          <img loading="lazy" src={svc.images?.[0] || svc.image} alt={svc.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block",
              transition: "transform .5s", transform: hovered ? "scale(1.06)" : "scale(1)" }}
            onError={e => { e.target.src = ""; }} />
          {/* Gradient overlay kanan */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 60%, rgba(255,255,255,.12) 100%)" }} />
          {/* Badge kiri atas */}
          {svc.badge && (
            <div style={{ position: "absolute", top: 14, left: 14, background: svc.badgeColor || ac, color: "#fff", borderRadius: 20, padding: "4px 14px", fontSize: "0.625rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>
              {svc.badge}
            </div>
          )}
          {svc.highlight && (
            <div style={{ position: "absolute", top: 14, right: 0, background: "linear-gradient(130deg,#2E3D3F,#8B6914)", color: "#fff", borderRadius: "20px 0 0 20px", padding: "4px 12px 4px 14px", fontSize: "0.625rem", fontWeight: 700 }}>⭐ Pilihan Utama</div>
          )}
          {/* Judul di atas gambar bawah kiri */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "32px 16px 16px", background: "linear-gradient(to top, rgba(0,0,0,.72) 0%, transparent 100%)" }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.25rem", fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: 3, textShadow: "0 2px 12px rgba(0,0,0,.8)" }}>{svc.title}</h3>
            {svc.tagline && <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,.85)", lineHeight: 1.4, textShadow: "0 1px 8px rgba(0,0,0,.7)" }}>{svc.tagline}</p>}
          </div>
        </div>

        {/* Konten kanan */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Info row */}
          <div style={{ padding: "18px 20px 8px", display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[`⏱ ${svc.duration}`, `👥 Min. ${svc.minPeserta} peserta`, ...(svc.destinations?.length ? [`🗺 ${svc.destinations.length} Destinasi`] : [])].map(m => (
              <span key={m} style={{ fontSize: "0.8125rem", color: "#5A6A6C" }}>{m}</span>
            ))}
          </div>
          {/* Description */}
          <p style={{ fontSize: "0.875rem", color: "#5A6A6C", lineHeight: 1.65, padding: "0 20px 12px" }}>{svc.description}</p>
          {/* Facilities */}
          {(svc.facilities || []).length > 0 && (
            <div style={{ padding: "0 20px 14px", display: "flex", flexWrap: "wrap", gap: "6px 20px" }}>
              {(svc.facilities || []).slice(0, 4).map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 14 }}>{f.icon}</span>
                  <span style={{ fontSize: "0.8125rem", color: "#3D5254", fontWeight: 500 }}>{f.label}</span>
                </div>
              ))}
              {(svc.facilities || []).length > 4 && (
                <span style={{ fontSize: "0.75rem", color: "#8B6914", fontWeight: 600 }}>+{svc.facilities.length - 4} lainnya</span>
              )}
            </div>
          )}
          {/* Spacer */}
          <div style={{ flex: 1 }} />
          {/* Price + CTA bar di bawah */}
          <div style={{ display: "flex", alignItems: "stretch", borderTop: "1px solid #edf5f8" }}>
            {/* Price block */}
            <div style={{
                flex: 1, padding: "14px 20px",
                background: `linear-gradient(135deg,#2E3D3F 0%,#3D5254 55%,${ac} 100%)`,
                position: "relative",
              }}>
              <div style={{ position: "absolute", right: -12, top: -12, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
              <p style={{ color: "rgba(255,255,255,.65)", fontSize: "0.5625rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 3 }}>Harga Mulai Dari</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, flexWrap: "wrap" }}>
                {(() => {
                  const utamaPt = (svc.paketTypes||[]).find(pt => pt.id === (svc.utamaTipeId || svc.paketTypes?.[0]?.id)); const rawPrice = utamaPt?.price || svc.price;
                  const isContact = String(rawPrice || "").toLowerCase().includes("hubungi");
                  const numericPrice = !isContact && rawPrice ? Number(String(rawPrice).replace(/[^0-9]/g, "")) : 0;
                  return isContact ? (
                    <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>Hubungi Kami</span>
                  ) : numericPrice > 0 ? (
                    <>
                      <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "0.8125rem", color: "rgba(255,255,255,.7)" }}>Rp</span>
                      <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.75rem", fontWeight: 700, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,.3)" }}>{fmt(rawPrice)}</span>
                      <span style={{ color: "rgba(255,255,255,.65)", fontSize: "0.75rem" }}>{svc.priceNote}</span>
                    </>
                  ) : (
                    <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", fontWeight: 700, color: "rgba(255,255,255,.6)" }}>Hubungi Kami</span>
                  );
                })()}
              </div>
            </div>
            {/* CTA buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0, flexShrink: 0 }}>
              <button onClick={() => onWaOpen && onWaOpen({ key: "paket", vars: { judul_paket: svc.title } })}
                style={{ flex: 1, padding: "0 24px", background: "#25D366", color: "#fff", border: "none", fontSize: "0.8125rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, borderBottom: "1px solid rgba(255,255,255,.2)" }}>
                💬 WA
              </button>
              <button onClick={onDetail}
                style={{ flex: 1, padding: "0 24px", background: `linear-gradient(135deg,#2E3D3F,${ac})`, color: "#fff", border: "none", fontSize: "0.8125rem", fontWeight: 700, cursor: "pointer", transition: "opacity .2s" }}
                onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                Lihat Detail →
              </button>
            </div>
          </div>
          {/* Paket pills — tampil jika ada paketTypes */}
          {(svc.paketTypes || []).length > 0 && (
            <div style={{ background: al, padding: "10px 20px 12px", borderTop: `1px solid ${ac}25` }}>
              <p style={{ fontSize: "0.5625rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: ac, marginBottom: 6 }}>Pilihan Paket</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {(svc.paketTypes || []).map((pt, i) => {
                  const isUtama = pt.id === (svc.utamaTipeId || svc.paketTypes?.[0]?.id);
                  const isContact = String(pt.price || "").toLowerCase().includes("hubungi");
                  return (
                    <span key={pt.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 9px", borderRadius: 20, boxSizing: "border-box", border: `1.5px solid ${isUtama ? ac : ac + "40"}`, background: isUtama ? `${ac}12` : "#fff", fontSize: "0.6875rem", fontWeight: 600, color: "#2E3D3F", minWidth: 0, maxWidth: "100%", flexShrink: 1 }}>
                      {isUtama && <span style={{ fontSize: "0.4rem", fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", padding: "1px 5px", borderRadius: 8, background: "#E8C96A", color: "#2E3D3F", flexShrink: 0 }}>UTAMA</span>}
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pt.name}</span>
                      {pt.price && <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "0.625rem", fontWeight: 700, color: ac, flexShrink: 0 }}>{isContact ? "Konsultasi" : formatRp(pt.price) || pt.price}</span>}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── MODE NORMAL (2 / 3 kolom): layout vertikal default ──
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: "#fff", borderRadius: 16, overflow: "visible", boxShadow: hovered ? "0 16px 48px rgba(46,61,63,.18)" : "0 4px 20px rgba(13,59,102,.09)", border: `2px solid ${hovered ? ac : svc.highlight ? ac + "80" : "transparent"}`, fontFamily: "'DM Sans',sans-serif", transition: "all .3s cubic-bezier(.22,1,.36,1)", transform: hovered ? "translateY(-5px)" : "none", position: "relative" }}>

      {/* Hero image */}
      <div onClick={onDetail} style={{ position: "relative", height: 180, overflow: "hidden", borderRadius: "14px 14px 0 0", cursor: "pointer" }}>
        <img loading="lazy" src={svc.images?.[0] || svc.image} alt={svc.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .5s", transform: hovered ? "scale(1.06)" : "scale(1)" }}
          onError={e => { e.target.src = ""; }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 40%,rgba(0,0,0,.55) 100%)" }} />
        {svc.badge && (
          <div style={{ position: "absolute", top: 12, left: 12, background: svc.badgeColor || ac, color: "#fff", borderRadius: 20, padding: "3px 12px", fontSize: "0.625rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>
            {svc.badge}
          </div>
        )}
        {svc.highlight && (
          <div style={{ position: "absolute", top: 12, right: 12, background: "linear-gradient(130deg,#2E3D3F,#8B6914)", color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: "0.625rem", fontWeight: 700 }}>⭐ Pilihan Utama</div>
        )}
        <div style={{ position: "absolute", bottom: 12, left: 14, right: 14 }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.125rem", fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: 2, textShadow: "0 2px 12px rgba(0,0,0,.8), 0 1px 4px rgba(0,0,0,.6)" }}>{svc.title}</h3>
          {svc.tagline && <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,.9)", lineHeight: 1.4, textShadow: "0 1px 8px rgba(0,0,0,.75)" }}>{svc.tagline}</p>}
        </div>
      </div>

      {/* Info row */}
      <div style={{ padding: "12px 16px 0", display: "flex", gap: 14, flexWrap: "wrap" }}>
        {[`⏱ ${svc.duration}`, `👥 Min. ${svc.minPeserta} peserta`, ...(svc.destinations?.length ? [`🗺 ${svc.destinations.length} Destinasi`] : [])].map(m => (
          <span key={m} style={{ fontSize: "0.75rem", color: "#5A6A6C" }}>{m}</span>
        ))}
      </div>

      {/* Description */}
      <p style={{ fontSize: "0.8125rem", color: "#5A6A6C", lineHeight: 1.6, padding: "8px 16px 10px" }}>{svc.description}</p>

      {/* Top facilities with icons */}
      {(svc.facilities || []).length > 0 && (
        <div style={{ padding: "0 16px 12px" }}>
          {(svc.facilities || []).slice(0, 3).map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 5 }}>
              <span style={{ fontSize: 13 }}>{f.icon}</span>
              <span style={{ fontSize: "0.75rem", color: "#3D5254", fontWeight: 500 }}>{f.label}</span>
            </div>
          ))}
          {(svc.facilities || []).length > 3 && (
            <div style={{ fontSize: "0.6875rem", color: "#8B6914", fontWeight: 600, marginTop: 2 }}>+{svc.facilities.length - 3} fasilitas lainnya</div>
          )}
        </div>
      )}

      {/* Price block */}
      <div style={{
          position: "relative",
          background: `linear-gradient(135deg,#2E3D3F 0%,#3D5254 50%,${ac} 100%)`,
          padding: "16px 16px 18px",
          borderTop: "3px solid rgba(255,255,255,.18)",
        }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent)" }} />
        <p style={{ color: "rgba(255,255,255,.65)", fontSize: "0.5625rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 3 }}>Harga Mulai Dari</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          {(() => {
            const utamaPt = (svc.paketTypes||[]).find(pt => pt.id === (svc.utamaTipeId || svc.paketTypes?.[0]?.id)); const rawPrice = utamaPt?.price || svc.price;
            const isContact = String(rawPrice || "").toLowerCase().includes("hubungi");
            const numericPrice = !isContact && rawPrice ? Number(String(rawPrice).replace(/[^0-9]/g, "")) : 0;
            return isContact ? (
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.35rem", fontWeight: 700, color: "#fff", lineHeight: 1 }}>Hubungi Kami</span>
            ) : numericPrice > 0 ? (
              <>
                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "0.8125rem", color: "rgba(255,255,255,.7)" }}>Rp</span>
                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.75rem", fontWeight: 700, color: "#fff", lineHeight: 1, textShadow: "0 2px 8px rgba(0,0,0,.3)" }}>{fmt(rawPrice)}</span>
                <span style={{ color: "rgba(255,255,255,.65)", fontSize: "0.75rem" }}>{svc.priceNote}</span>
              </>
            ) : (
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.35rem", fontWeight: 700, color: "rgba(255,255,255,.6)", lineHeight: 1 }}>Hubungi Kami</span>
            );
          })()}
        </div>
        <p style={{ color: "rgba(255,255,255,.45)", fontSize: "0.6rem", marginTop: 4, letterSpacing: ".04em" }}>Nego / Konsultasi dulu</p>
      </div>

      {/* Paket Pills — tampil jika ada paketTypes */}
      {(svc.paketTypes || []).length > 0 && (
        <div style={{ background: al, padding: "10px 14px 12px", borderLeft: `1px solid ${ac}25`, borderRight: `1px solid ${ac}25` }}>
          <p style={{ fontSize: "0.5625rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: ac, marginBottom: 6 }}>Pilihan Paket</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {(svc.paketTypes || []).map((pt) => {
              const isUtama = pt.id === (svc.utamaTipeId || svc.paketTypes?.[0]?.id);
              const isContact = String(pt.price || "").toLowerCase().includes("hubungi");
              return (
                <span key={pt.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 9px", borderRadius: 20, boxSizing: "border-box", border: `1.5px solid ${isUtama ? ac : ac + "40"}`, background: isUtama ? `${ac}12` : "#fff", fontSize: "0.6875rem", fontWeight: 600, color: "#2E3D3F", minWidth: 0, maxWidth: "100%", flexShrink: 1 }}>
                  {isUtama && <span style={{ fontSize: "0.4rem", fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", padding: "1px 5px", borderRadius: 8, background: "#E8C96A", color: "#2E3D3F", flexShrink: 0 }}>UTAMA</span>}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pt.name}</span>
                  {pt.price && <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "0.625rem", fontWeight: 700, color: ac, flexShrink: 0 }}>{isContact ? "Konsultasi" : formatRp(pt.price) || pt.price}</span>}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <div style={{ padding: "12px 14px 14px", background: al, borderLeft: `1px solid ${ac}25`, borderRight: `1px solid ${ac}25`, borderBottom: `1px solid ${ac}25`, borderRadius: "0 0 14px 14px", display: "flex", gap: 8 }}>
        <button
          onClick={() => onWaOpen && onWaOpen({ key: "paket", vars: { judul_paket: svc.title } })}
          style={{ flex: 1, padding: "9px 0", background: "#25D366", color: "#fff", border: "none", borderRadius: 8, fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          💬 WA
        </button>
        <button onClick={onDetail}
          style={{ flex: 3, padding: "9px 0", background: `linear-gradient(135deg,#2E3D3F,${ac})`, color: "#fff", border: "none", borderRadius: 8, fontSize: "0.8125rem", fontWeight: 700, cursor: "pointer", transition: "opacity .2s" }}
          onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
          Lihat Detail →
        </button>
      </div>
    </div>
  );
}

/* ─────────────── TRAVEL DETAIL PRICE BLOCK (for service detail page) ─────────────── */
/* ─────────────── TRAVEL PACKAGE DETAIL MODAL ─────────────── */
function TravelPackageDetailModal({ svc, onClose, onWaOpen }) {
  const [destIdx, setDestIdx] = useState(0);
  const ac = svc.accent || "#e8a020";
  const al = svc.accentLight || "#fff8e6";
  const dest = (svc.destinations || [])[destIdx];

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", handleKey); };
  }, [onClose]);

  const SectionHead = ({ label, title }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <div style={{ width: 4, height: 26, background: `linear-gradient(to bottom,${ac},transparent)`, borderRadius: 2, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: "0.5625rem", letterSpacing: "3px", color: ac, fontWeight: 700, textTransform: "uppercase", marginBottom: 1 }}>{label}</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.0625rem", fontWeight: 800, color: "#2E3D3F" }}>{title}</div>
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9500, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      {/* Backdrop */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(6,20,40,.72)", backdropFilter: "blur(5px)", animation: "tdFadeIn .2s ease" }} onClick={onClose} />

      {/* Modal Sheet */}
      <div style={{
        position: "relative", width: "100%", maxWidth: 900, maxHeight: "93vh",
        background: "#f4fbfd", borderRadius: "20px 20px 0 0",
        boxShadow: "0 -16px 80px rgba(6,20,40,.35)",
        display: "flex", flexDirection: "column",
        animation: "tdSlideUp .35s cubic-bezier(.22,1,.36,1)",
        overflow: "hidden",
      }}>

        {/* ── Header with hero image ── */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{ height: 200, position: "relative", overflow: "hidden" }}>
            <img loading="lazy" src={svc.images?.[0] || svc.image} alt={svc.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: .5 }}
              onError={e => { e.target.style.opacity = 0; }} />
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg,#2E3D3Fee,${ac}bb)` }} />

            {/* Close */}
            <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.3)", color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", zIndex: 2 }}>✕</button>

            {svc.badge && <div style={{ position: "absolute", top: 14, left: 14, background: svc.badgeColor || ac, color: "#fff", borderRadius: 20, padding: "4px 14px", fontSize: "0.5625rem", fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase" }}>★ {svc.badge}</div>}

            {/* Thumb strip */}
            {(svc.images?.length > 1) && (
              <div style={{ position: "absolute", bottom: 12, left: 20, display: "flex", gap: 6 }}>
                {svc.images.slice(0, 4).map((img, i) => (
                  <div key={i} style={{ width: 44, height: 32, borderRadius: 5, overflow: "hidden", border: `2px solid rgba(255,255,255,.4)`, flexShrink: 0, opacity: .85 }}>
                    <img loading="lazy" src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} />
                  </div>
                ))}
              </div>
            )}

            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 24px 18px" }}>
              {svc.tagline && <div style={{ fontSize: "0.5625rem", color: "rgba(255,255,255,.72)", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 4 }}>{svc.tagline}</div>}
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.3rem,3vw,1.875rem)", fontWeight: 900, color: "#fff", marginBottom: 8, lineHeight: 1.1 }}>{svc.title}</h2>
              <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                {[`⏱ ${svc.duration}`, `👥 Min. ${svc.minPeserta} peserta`, svc.destinations?.length && `🗺 ${svc.destinations.length} Destinasi`, `💰 Mulai ${svc.price}`].filter(Boolean).map(m => (
                  <span key={m} style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,.85)", fontWeight: 500 }}>{m}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "26px 24px 40px" }}>
          <p style={{ fontSize: "0.875rem", color: "#2a4a5e", lineHeight: 1.75, marginBottom: 28 }}>{svc.description}</p>

          {/* ─ Destinations ─ */}
          {(svc.destinations || []).length > 0 && (
            <section style={{ marginBottom: 30 }}>
              <SectionHead label="Destinasi Wisata" title="Itinerary Perjalanan" />

              {svc.destinations.length > 1 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                  {svc.destinations.map((d, i) => (
                    <button key={i} onClick={() => setDestIdx(i)}
                      style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${i === destIdx ? ac : ac + "30"}`, background: i === destIdx ? ac : "#fff", color: i === destIdx ? "#fff" : ac, fontSize: "0.6875rem", fontWeight: 600, cursor: "pointer", transition: "all .2s", fontFamily: "'DM Sans',sans-serif" }}>
                      {d.no}. {d.name}
                    </button>
                  ))}
                </div>
              )}

              {dest && (
                <div style={{ background: "#fff", borderRadius: 13, overflow: "hidden", border: `1px solid ${ac}22`, boxShadow: `0 3px 16px ${ac}12` }}>
                  <div style={{ display: "flex", flexWrap: "wrap", minHeight: 200 }}>
                    <div style={{ width: "clamp(130px,34%,220px)", flexShrink: 0, position: "relative", overflow: "hidden", background: `linear-gradient(135deg,${ac}55,#c5e8f0)`, alignSelf: "stretch", minHeight: 200 }}>
                      <img loading="lazy" src={dest.img} alt={dest.name}
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        onLoad={e => { e.target.style.opacity = "1"; }}
                        onError={e => { e.target.style.opacity = "0"; }} />
                      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg,${ac}44,transparent)`, pointerEvents: "none" }} />
                      <div style={{ position: "absolute", top: 10, left: 10, background: ac, color: "#fff", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.5625rem", fontWeight: 800, zIndex: 2 }}>{dest.no}</div>
                    </div>
                    <div style={{ flex: 1, padding: "16px 18px", minWidth: 180 }}>
                      <div style={{ fontSize: "0.5625rem", color: ac, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 3 }}>{dest.tag}</div>
                      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "0.9375rem", fontWeight: 800, color: "#2E3D3F", marginBottom: 4, lineHeight: 1.3 }}>{dest.title}</h3>
                      <div style={{ fontSize: "0.6875rem", color: "#5A6A6C", marginBottom: 7 }}>📍 {dest.sub} &nbsp;·&nbsp; ⏱ {dest.duration}</div>
                      <p style={{ fontSize: "0.78125rem", color: "#3a5266", lineHeight: 1.65, marginBottom: 9 }}>{dest.desc}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
                        {(dest.points || []).map((pt, pi) => (
                          <div key={pi} style={{ display: "flex", gap: 5, alignItems: "center", fontSize: "0.6875rem", color: "#2a4a5e" }}>
                            <span style={{ width: 4, height: 4, borderRadius: "50%", background: ac, flexShrink: 0, display: "inline-block" }} />
                            {pt}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ─ Facilities ─ */}
          {(svc.facilities || []).length > 0 && (
            <section style={{ marginBottom: 30 }}>
              <SectionHead label="Yang Sudah Termasuk" title="Fasilitas Paket" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))", gap: 9 }}>
                {(svc.facilities || []).map((f, i) => (
                  <div key={i} style={{ background: "#fff", borderRadius: 10, padding: "13px 15px", border: `1px solid ${ac}18`, display: "flex", gap: 9, alignItems: "flex-start", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: ac, borderRadius: "10px 0 0 10px" }} />
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{f.icon}</span>
                    <div>
                      <div style={{ fontSize: "0.78125rem", fontWeight: 700, color: "#2E3D3F", marginBottom: 1 }}>{f.label}</div>
                      <div style={{ fontSize: "0.625rem", color: "#5A6A6C", lineHeight: 1.4 }}>{f.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ─ Services ─ */}
          {(svc.services || []).length > 0 && (
            <section style={{ marginBottom: 30 }}>
              <SectionHead label="Sudah Termasuk" title="Layanan Kami" />
              <div style={{ background: al, borderRadius: 12, padding: "16px 18px", border: `1px solid ${ac}18` }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "7px 18px" }}>
                  {(svc.services || []).map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start", fontSize: "0.78125rem", color: "#1a3a50" }}>
                      <span style={{ color: "#27ae60", fontWeight: 800, fontSize: "0.875rem", flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span style={{ lineHeight: 1.5 }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ─ CTA ─ */}
          <div style={{ background: `linear-gradient(135deg,#2E3D3F,#3D5254 40%,${ac})`, borderRadius: 14, padding: "22px 24px", textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,.8)", fontSize: "0.875rem", marginBottom: 16, lineHeight: 1.65 }}>Tertarik dengan paket ini? Hubungi kami untuk konsultasi gratis dan penawaran terbaik!</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => onWaOpen && onWaOpen({ key: "paket", vars: { judul_paket: `${svc.title} — ${svc.price} ${svc.priceNote}` } })}
                style={{ padding: "11px 28px", background: "#25D366", color: "#fff", border: "none", borderRadius: 8, fontSize: "0.875rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                💬 WhatsApp Sekarang
              </button>
              <button onClick={onClose}
                style={{ padding: "11px 22px", background: "rgba(255,255,255,.14)", color: "#fff", border: "1.5px solid rgba(255,255,255,.3)", borderRadius: 8, fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tdFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes tdSlideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </div>
  );
}

/* ─────────────── DESTINATIONS SECTION (full-page detail) ─────────────── */
function DestinationsSection({ svc, catInfo, activePt }) {
  const [destIdx, setDestIdx] = useState(0);
  const ac = svc.accent || catInfo?.color || "#e8a020";
  const allDests = svc.destinations || [];
  // Filter berdasarkan destinationChecks tipe paket aktif
  const dChecks = activePt?.destinationChecks || [];
  const dests = dChecks.length > 0 ? allDests.filter((_, i) => dChecks[i] !== false) : allDests;
  const safeIdx = destIdx < dests.length ? destIdx : 0;
  const dest = dests[safeIdx];

  return (
    <div className="mg-fade-3" style={{ marginBottom: 48 }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div style={{ width: 4, height: 30, background: `linear-gradient(to bottom, ${ac}, transparent)`, borderRadius: 2, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: "0.5625rem", letterSpacing: "3px", color: ac, fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Itinerary</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", fontWeight: 800, color: "#2E3D3F", lineHeight: 1.1 }}>Pilihan Destinasi yang tersedia</div>
          <div style={{ fontSize: "0.75rem", color: "#5A6A6C", fontWeight: 400, marginTop: 3 }}>pilih sesuai kesepakatan harga</div>
        </div>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, #E8DCC8, transparent)" }} />
      </div>

      {/* Tab selector */}
      {dests.length > 1 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {dests.map((d, i) => {
            const isActive = i === destIdx;
            return (
              <button key={i} onClick={() => setDestIdx(i)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: `2px solid ${isActive ? ac : ac + "40"}`,
                  background: isActive
                    ? `linear-gradient(130deg, ${ac}, ${ac}cc)`
                    : "#fff",
                  color: isActive ? "#fff" : ac,
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "all .2s",
                  fontFamily: "'DM Sans',sans-serif",
                  letterSpacing: ".01em",
                  boxShadow: isActive
                    ? `0 4px 16px ${ac}50`
                    : `0 2px 6px ${ac}18`,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 22, height: 22, borderRadius: 5,
                  background: isActive ? "rgba(255,255,255,.22)" : ac + "18",
                  fontSize: "0.625rem", fontWeight: 900, flexShrink: 0,
                  color: isActive ? "#fff" : ac,
                }}>{d.no}</span>
                <span>{d.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Destination card */}
      {dest ? (
        <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: `1px solid ${ac}22`, boxShadow: `0 4px 20px ${ac}12` }}>
          <div style={{ width: "100%", position: "relative", height: "min(320px, 52vw)", minHeight: 180, overflow: "hidden" }}>
            {dest.img ? (
              <img loading="lazy" src={dest.img} alt={dest.name}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block", transition: "transform .4s ease" }}
                onMouseEnter={e => e.target.style.transform = "scale(1.05)"}
                onMouseLeave={e => e.target.style.transform = "scale(1)"}
                onError={e => { e.target.style.display = "none"; }} />
            ) : (
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg,${ac}22,#e8f4f8)`, display: "flex", alignItems: "center", justifyContent: "center", color: ac, opacity: .4, fontSize: "3rem" }}>🏔</div>
            )}
            <div style={{ position: "absolute", top: 12, left: 12, background: ac, color: "#fff", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6875rem", fontWeight: 800, zIndex: 2, boxShadow: "0 2px 8px rgba(0,0,0,.2)" }}>{dest.no}</div>
          </div>
          <div style={{ padding: "20px 24px 24px" }}>
            <div style={{ fontSize: "0.5625rem", color: ac, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>{dest.tag}</div>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.125rem", fontWeight: 800, color: "#2E3D3F", marginBottom: 6, lineHeight: 1.3 }}>{dest.title}</h3>
            <div style={{ fontSize: "0.75rem", color: "#5A6A6C", marginBottom: 12 }}>📍 {dest.sub} &nbsp;·&nbsp; ⏱ {dest.duration}</div>
            <p style={{ fontSize: "0.875rem", color: "#3a5266", lineHeight: 1.75, marginBottom: 14 }}>{dest.desc}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px" }}>
              {(dest.points || []).map((pt, pi) => (
                <div key={pi} style={{ display: "flex", gap: 6, alignItems: "center", fontSize: "0.8125rem", color: "#3D5254" }}>
                  <span style={{ color: ac, fontWeight: 700 }}>✓</span> {pt}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "40px 20px", background: "#f8fbfd", borderRadius: 14, border: `2px dashed ${ac}40`, color: "#5A6A6C" }}>
          <div style={{ fontSize: "2rem", marginBottom: 8 }}>🗺</div>
          <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>Belum ada destinasi ditambahkan</div>
        </div>
      )}
    </div>
  );
}

/* ─────────────── FACILITIES SECTION (read-only) ─────────────── */
function FacilitiesSection({ svc, catInfo, activePt }) {
  const ac = svc.accent || catInfo?.color || "#e8a020";
  const allFacilities = svc.facilities || [];
  // Filter berdasarkan facilityChecks tipe paket aktif
  const fChecks = activePt?.facilityChecks || [];
  const facilities = fChecks.length > 0 ? allFacilities.filter((_, i) => fChecks[i] !== false) : allFacilities;
  return (
    <div className="mg-fade-3" style={{ marginBottom: 48 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div style={{ width: 4, height: 30, background: `linear-gradient(to bottom, ${ac}, transparent)`, borderRadius: 2, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: "0.5625rem", letterSpacing: "3px", color: ac, fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Yang Sudah Termasuk</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", fontWeight: 800, color: "#2E3D3F", lineHeight: 1.1 }}>Fasilitas Perjalanan</div>
        </div>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, #E8DCC8, transparent)" }} />
      </div>
      {facilities.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))", gap: 10 }}>
          {facilities.map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "#fff", borderRadius: 10, padding: "13px 15px", border: "1px solid #c8eaf2", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: ac, borderRadius: "10px 0 0 10px" }} />
              <span style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#2E3D3F", marginBottom: 2 }}>{f.label}</div>
                {f.detail && <div style={{ fontSize: "0.75rem", color: "#5A6A6C", lineHeight: 1.5 }}>{f.detail}</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "32px 20px", background: "#f8fbfd", borderRadius: 10, border: `2px dashed ${ac}40`, color: "#5A6A6C" }}>
          <div style={{ fontSize: "2rem", marginBottom: 6 }}>🎒</div>
          <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>Belum ada fasilitas ditambahkan</div>
        </div>
      )}
    </div>
  );
}

/* ─────────────── SERVICE HERO SLIDESHOW (panel kanan di atas) ─────────────── */
function ServiceHeroSlideshow({ slides, catColor }) {
  const [cur, setCur] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);
  const pausedRef = useRef(false);
  pausedRef.current = paused;

  const next = useCallback(() => setCur(c => (c + 1) % slides.length), [slides.length]);
  const back = useCallback(() => setCur(c => (c - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      if (!pausedRef.current) setCur(c => (c + 1) % slides.length);
    }, 3500);
    return () => clearInterval(timerRef.current);
  }, [slides.length]);

  if (!slides.length) return null;
  const slide = slides[cur];

  return (
    <div style={{ position: "relative", overflow: "hidden", display: "flex", alignItems: "stretch" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}>
      <style>{`
        @keyframes heroFadeIn { from { opacity:0; transform:scale(1.04); } to { opacity:1; transform:scale(1); } }
      `}</style>
      {/* Deco corner frames */}
      <div className="mg-deco-shape" style={{ position: "absolute", top: 20, right: 20, width: 70, height: 70, border: `1.5px solid ${catColor}`, borderRadius: 6, zIndex: 3, opacity: .55, pointerEvents: "none" }} />
      <div className="mg-deco-shape" style={{ position: "absolute", top: 30, right: 30, width: 70, height: 70, border: "1.5px solid rgba(255,255,255,.12)", borderRadius: 6, zIndex: 3, pointerEvents: "none" }} />
      <div className="mg-deco-shape" style={{ position: "absolute", bottom: 20, left: -8, width: 50, height: 50, border: "1.5px solid rgba(255,255,255,.15)", borderRadius: 4, zIndex: 3, pointerEvents: "none" }} />

      <div style={{ flex: 1, position: "relative", minHeight: 400 }}>
        {/* Slide image */}
        <img key={cur} loading="lazy" src={slide.img} alt={slide.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", position: "absolute", inset: 0, animation: "heroFadeIn .6s ease both" }}
          onError={e => { e.target.src = ""; }} />

        {/* Bottom gradient */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 130, background: "linear-gradient(to top, rgba(5,20,45,.85), transparent)", pointerEvents: "none", zIndex: 2 }} />

        {/* Info overlay */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 3, padding: "14px 18px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "0.5rem", color: "rgba(255,255,255,.5)", letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 3 }}>
                {slide.no} / {String(slides.length).padStart(2,"0")}
              </div>
              <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,.6)", lineHeight: 1.25 }}>{slide.title || slide.name}</div>
            </div>
            {/* Prev / Next */}
            {slides.length > 1 && (
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={e => { e.stopPropagation(); back(); }}
                  style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,.15)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,.25)", color: "#fff", fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
                <button onClick={e => { e.stopPropagation(); next(); }}
                  style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,.15)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,.25)", color: "#fff", fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
              </div>
            )}
          </div>
          {/* Dot indicator */}
          {slides.length > 1 && (
            <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
              {slides.map((_, i) => (
                <div key={i} onClick={() => setCur(i)}
                  style={{ height: 3, borderRadius: 2, background: i === cur ? catColor : "rgba(255,255,255,.3)", width: i === cur ? 20 : 6, transition: "all .3s ease", cursor: "pointer" }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────── DESTINATION GALLERY SLIDESHOW ─────────────── */
function DestGallerySlideshow({ slides, catColor, svcTitle }) {
  const [cur, setCur] = useState(0);
  const [prev, setPrev] = useState(null);
  const [dir, setDir] = useState(1); // 1=next, -1=prev
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const pausedRef = useRef(false);
  pausedRef.current = paused;

  const goTo = useCallback((idx, direction) => {
    setPrev(cur);
    setDir(direction);
    setCur(idx);
  }, [cur]);

  const next = useCallback(() => goTo((cur + 1) % slides.length, 1), [cur, slides.length, goTo]);
  const back = useCallback(() => goTo((cur - 1 + slides.length) % slides.length, -1), [cur, slides.length, goTo]);

  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      if (!pausedRef.current) setCur(c => {
        const n = (c + 1) % slides.length;
        setPrev(c); setDir(1);
        return n;
      });
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, [slides.length]);

  const slide = slides[cur];

  return (
    <div className="mg-fade-2" style={{ marginBottom: 52 }}>
      {/* Heading */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div style={{ width: 4, height: 30, background: `linear-gradient(to bottom, ${catColor}, transparent)`, borderRadius: 2, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: "0.5625rem", letterSpacing: "3px", color: "#7ab5cc", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Dokumentasi</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", fontWeight: 800, color: "#2E3D3F", lineHeight: 1.1 }}>Fasilitas &amp; Suasana</div>
        </div>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, #E8DCC8, transparent)" }} />
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {slides.map((_, i) => (
            <div key={i} onClick={() => goTo(i, i > cur ? 1 : -1)}
              style={{ width: i === cur ? 18 : 6, height: 6, borderRadius: 3, background: i === cur ? catColor : "#E8DCC8", cursor: "pointer", transition: "all .35s ease" }} />
          ))}
        </div>
      </div>

      {/* Slideshow frame */}
      <div
        style={{ position: "relative", borderRadius: 14, overflow: "hidden", boxShadow: "0 8px 36px rgba(13,59,102,.16)", height: "min(420px, 56vw)", minHeight: 220, background: "#2E3D3F", cursor: "pointer" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Current slide */}
        <img key={`cur-${cur}`} loading="lazy" src={slide.img} alt={slide.name}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block",
            animation: `slideIn${dir > 0 ? "R" : "L"} .55s cubic-bezier(.22,1,.36,1) both` }}
          onError={e => { e.target.src = ""; }} />

        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,30,60,.72) 0%, rgba(10,30,60,.15) 55%, transparent 100%)", pointerEvents: "none" }} />

        {/* Bottom info */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "18px 22px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "0.5625rem", color: "rgba(255,255,255,.55)", letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 4 }}>
                Destinasi {slide.no} / {String(slides.length).padStart(2,"0")}
              </div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", fontWeight: 800, color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,.5)", lineHeight: 1.2 }}>{slide.title || slide.name}</div>
              {slide.name && slide.title && slide.name !== slide.title && (
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,.6)", marginTop: 3 }}>📍 {slide.name}</div>
              )}
            </div>
            {/* Nav buttons */}
            {slides.length > 1 && (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={e => { e.stopPropagation(); back(); }}
                  style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,.15)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(255,255,255,.25)", color: "#fff", fontSize: "0.875rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background .2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.3)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.15)"}>‹</button>
                <button onClick={e => { e.stopPropagation(); next(); }}
                  style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,.15)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(255,255,255,.25)", color: "#fff", fontSize: "0.875rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background .2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.3)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.15)"}>›</button>
              </div>
            )}
          </div>
        </div>

        {/* Pause indicator */}
        {paused && slides.length > 1 && (
          <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,.4)", backdropFilter: "blur(6px)", borderRadius: 20, padding: "3px 10px", fontSize: "0.625rem", color: "rgba(255,255,255,.7)", fontWeight: 600, letterSpacing: ".08em" }}>⏸ PAUSE</div>
        )}

        {/* Slide animation keyframes */}
        <style>{`
          @keyframes slideInR { from { opacity:0; transform:translateX(60px); } to { opacity:1; transform:none; } }
          @keyframes slideInL { from { opacity:0; transform:translateX(-60px); } to { opacity:1; transform:none; } }
        `}</style>
      </div>

      {/* Thumbnail strip */}
      {slides.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 10, overflowX: "auto", paddingBottom: 2 }}>
          {slides.map((s, i) => (
            <div key={i} onClick={() => goTo(i, i > cur ? 1 : -1)}
              style={{ flexShrink: 0, width: 72, height: 50, borderRadius: 7, overflow: "hidden", cursor: "pointer",
                border: i === cur ? `2.5px solid ${catColor}` : "2.5px solid transparent",
                opacity: i === cur ? 1 : 0.55, transition: "all .25s", boxShadow: i === cur ? `0 0 0 1px ${catColor}55` : "none" }}>
              <img loading="lazy" src={s.img} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={e => e.target.src = ""} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── PaketBackBar — Back + Salin Link di halaman detail paket ── */
function PaketBackBar({ svc, onClose }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    const url = window.location.origin + paketUrl(svc);
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div style={{ background: "linear-gradient(90deg,#2E3D3F,#8B6914)", padding: "0 5%", position: "sticky", top: 96, zIndex: 90, borderBottom: "1px solid #E8DCC8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <button onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#7ab8d0", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer", padding: "13px 0", letterSpacing: ".04em", textTransform: "uppercase" }}>
        <span style={{ fontSize: 18, lineHeight: 1 }}>←</span> Kembali ke Layanan
      </button>
      <button onClick={copy} style={{ display: "flex", alignItems: "center", gap: 6, background: copied ? "rgba(16,208,224,.25)" : "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.20)", borderRadius: 20, color: copied ? "#E8C96A" : "#b8dde8", fontSize: "0.75rem", fontWeight: 600, padding: "6px 14px", cursor: "pointer", transition: "all .2s", letterSpacing: ".04em" }}>
        🔗 {copied ? "Tersalin!" : "Salin Link Paket"}
      </button>
    </div>
  );
}

/* ─────────────── SERVICES PAGE ─────────────── */
const LAYANAN_LIST = [
  { key: "interior", icon: "🛋️", label: "Interior", desc: "Desain interior modern, nyaman dan fungsional sesuai kebutuhan Anda.", color: "#8B6914", category: "wedding", img: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80" },
  { key: "eksterior", icon: "🏠", label: "Eksterior", desc: "Desain eksterior menarik, kokoh dan estetis.", color: "#3D5254", category: "traveling", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80" },
  { key: "rab", icon: "📐", label: "Desain & RAB", desc: "Desain arsitektur lengkap dengan RAB yang akurat.", color: "#8B6914", category: "traveling", img: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80" },
  { key: "landscape", icon: "🌿", label: "Landscape", desc: "Taman indah dan asri yang menyatu dengan hunian Anda.", color: "#2E7D32", category: "traveling", img: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=80" },
  { key: "aluminium", icon: "🪟", label: "Aluminium", desc: "Kusen, pintu & jendela aluminium berkualitas tinggi.", color: "#3D5254", category: "event", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80" },
  { key: "kanopi", icon: "🏗️", label: "Kanopi", desc: "Kanopi kuat, modern dan tahan segala cuaca.", color: "#8B6914", category: "event", img: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80" },
];

function ServicesPage({ content, services, navigateTo, activePaket, onOpenPaket, onClosePaket, onWaOpen }) {
  const [selectedService, setSelectedService] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [activeImg, setActiveImg] = useState(0);

  /* ── Static layanan list — defined at module scope as LAYANAN_LIST ── */

  const KEUNGGULAN = [
    { icon: "👷", label: "Tim Profesional", desc: "Tenaga ahli berpengalaman di bidangnya" },
    { icon: "⏱️", label: "Proses Cepat", desc: "Pengerjaan tepat waktu dan terukur" },
    { icon: "📋", label: "Budget Transparan", desc: "RAB jelas dan tanpa biaya tersembunyi" },
    { icon: "🛡️", label: "Material Berkualitas", desc: "Menggunakan bahan terbaik dan tahan lama" },
    { icon: "✅", label: "Garansi Pekerjaan", desc: "Garansi hingga 1 tahun setelah proyek selesai" },
    { icon: "💬", label: "Konsultasi Gratis", desc: "Konsultasi gratis sebelum proyek dimulai" },
  ];

  /* ── Old category-based state (kept for detail page backward compat) ── */
  const [activeCategory, setActiveCategory] = useState("traveling");
  const [colLayout, setColLayout] = useState(2); // 1 | 2 | 3
  const [activePaketTypeId, setActivePaketTypeId] = useState(null);

  const CATEGORIES = [
    { key: "traveling", label: "🏠 Gedung & Rumah", color: "#8B6914" },
    { key: "event",     label: "🔧 Exterior", color: "#3D5254" },
    { key: "wedding",   label: "🛋️ Interior", color: "#C9AA71" },
  ];

  const openDetail = (svc) => {
    if (onOpenPaket) onOpenPaket(svc);
    setSelectedService(svc); setActiveImg(0); window.scrollTo(0, 0);
    // Set default ke tipe utama
    const utamaId = svc.utamaTipeId || (svc.paketTypes && svc.paketTypes[0]?.id) || null;
    setActivePaketTypeId(utamaId);
    setSelectedPkgId(svc.id);
    setPkgDropOpen(false);
  };
  const closeDetail = () => {
    if (onClosePaket) onClosePaket();   // restore URL di parent
    setSelectedService(null);
  };

  // Restore selectedService dari activePaket prop (saat mount via URL /paket/...)
  useEffect(() => {
    if (activePaket && services.length) {
      const svc = services.find(s => s.id === activePaket.id || String(s.id) === String(activePaket.id));
      if (svc && !selectedService) { setSelectedService(svc); setActiveImg(0); }
    }
    if (!activePaket) { setSelectedService(null); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePaket, services.length]);

  const handleBook = (svc) => {
    if (onWaOpen) onWaOpen({ key: "paket", vars: { judul_paket: `${svc.title} — ${svc.price} ${svc.priceNote}${svc._extraMsg || ""}` } });
  };

  // ── State untuk selector paket di sidebar
  const [selectedPkgId, setSelectedPkgId] = useState(null); // id paket aktif di sidebar
  const [pkgDropOpen, setPkgDropOpen] = useState(false); // dropdown pilih paket di sidebar

  /* ── Service Detail Page — Magazine Aesthetic ── */
  if (selectedService) {
    const svc = selectedService;
    const imgs = (svc.images?.length ? svc.images : [svc.image]).filter(Boolean);
    const catInfo = CATEGORIES.find(c => c.key === svc.category) || {};
    const relatedSvcs = services.filter(s => s.id !== svc.id && s.category === svc.category);

    // Semua paket dalam kategori yang sama (termasuk paket ini sendiri, exclude custom)
    const allCatPackages = services.filter(s => s.category === svc.category && s.pkgId !== "custom");

    // Paket terpilih di sidebar (default = paket yang sedang dibuka)
    const activeSidebarPkg = allCatPackages.find(s => s.id === selectedPkgId) || svc;

    // Harga aktif: dari tipe paket yang dipilih, fallback ke harga global
    const paketTypes = svc.paketTypes || [];
    const utamaId = svc.utamaTipeId || (paketTypes[0]?.id) || null;
    const resolvedActiveId = activePaketTypeId || utamaId;
    const activePt = paketTypes.find(pt => pt.id === resolvedActiveId) || paketTypes[0] || null;

    // Harga aktif: dari tipe paket yang dipilih, fallback ke harga global (semua kategori)
    // sidebarPrices removed — prices migrated to paketTypes

    const activePrice = activePt?.price || activeSidebarPkg.price || svc.price;
    const activePriceNote = activePt?.priceNote || activeSidebarPkg.priceNote || svc.priceNote;
    const activeMinPeserta = activePt?.minPeserta || svc.minPeserta;

    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#e8f7fc 0%,#f0fbfd 100%)", fontFamily: "'DM Sans', sans-serif" }}>
        <style>{`
          @keyframes mgFadeUp { from { opacity:0; transform:translateY(28px);} to { opacity:1; transform:none;} }
          .mg-fade { animation: mgFadeUp .55s cubic-bezier(.22,1,.36,1) both; }
          .mg-fade-2 { animation: mgFadeUp .55s .12s cubic-bezier(.22,1,.36,1) both; }
          .mg-fade-3 { animation: mgFadeUp .55s .22s cubic-bezier(.22,1,.36,1) both; }
          .mg-feat-row:hover { background: #d6f1f6 !important; }
          .mg-related { transition: transform .2s, box-shadow .2s; }
          .mg-related:hover { transform: translateX(5px); }
          .mg-cta-wa:hover { background: #ffffff !important; }
          .mg-cta-tel:hover { background: #d6f1f6 !important; }
          .mg-thumb { transition: all .2s; }
          .mg-thumb:hover { opacity: 1 !important; transform: scale(1.06); }
          @media(max-width:768px){
            .mg-hero-grid { grid-template-columns: 1fr !important; min-height: auto !important; }
            .mg-body-grid { grid-template-columns: 1fr !important; }
            .mg-deco-shape { display: none !important; }
            .mg-feat-grid { grid-template-columns: 1fr !important; }
            .mg-pkg-sidebar { position: static !important; top: auto !important; width: 100% !important; box-sizing: border-box !important; overflow: visible !important; }
            .svc-cat-scroll::-webkit-scrollbar { display: none; }
            .mg-hero-right { display: none !important; }
          }
          @media(max-width:480px){
            .mg-hero-grid { min-height: auto !important; }
          }
        `}</style>

        {/* ── Back Bar ── */}
        <PaketBackBar svc={svc} onClose={closeDetail} />

        {/* ── MAGAZINE HERO ── */}
        <div className="mg-fade" style={{ position: "relative", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 50%,#8B6914 100%)", overflow: "hidden" }}>
          {/* Deco grid lines */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,.025) 0, rgba(255,255,255,.025) 1px, transparent 1px, transparent 80px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 32, left: "5%", width: 1, height: "calc(100% - 32px)", background: "rgba(255,255,255,.08)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 32, right: "5%", width: 1, height: "calc(100% - 32px)", background: "rgba(255,255,255,.08)", pointerEvents: "none" }} />

          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 5%" }}>
            <div className="mg-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 460px", gap: 0, minHeight: 480 }}>

              {/* Left: Title & Info */}
              <div style={{ padding: "clamp(32px,5vw,56px) clamp(0px,3vw,40px) clamp(32px,5vw,48px) 0", display: "flex", flexDirection: "column", justifyContent: "center", borderRight: "1px solid rgba(255,255,255,.09)" }}>
                {/* Category tag */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
                  <div style={{ width: 28, height: 2, background: catInfo.color || "#8B6914" }} />
                  <span style={{ fontSize: "0.625rem", letterSpacing: "3px", color: catInfo.color || "#D4AF37", fontWeight: 700, textTransform: "uppercase" }}>
                    {(catInfo.label || svc.category).replace(/[^\w\s]/g, "").trim()}
                  </span>
                </div>
                {/* Badge */}
                {svc.badge && (
                  <div style={{ display: "inline-flex", alignItems: "center", background: svc.badgeColor || "#8B6914", color: "#fff", borderRadius: 4, padding: "4px 14px", fontSize: "0.625rem", fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 18, alignSelf: "flex-start", boxShadow: `0 4px 18px ${svc.badgeColor || "#8B6914"}55` }}>
                    ★ {svc.badge}
                  </div>
                )}
                {/* Title */}
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 22, letterSpacing: "-.01em" }}>{svc.title}</h1>
                {/* Ornamental divider */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
                  <div style={{ height: 1, width: 40, background: catInfo.color || "#D4AF37", opacity: .8 }} />
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: catInfo.color || "#D4AF37" }} />
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,.3)" }} />
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,.15)" }} />
                  <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,.12)" }} />
                </div>
                {/* Description */}
                <p style={{ fontSize: "1rem", color: "rgba(255,255,255,.68)", lineHeight: 1.85, whiteSpace: "pre-wrap", marginBottom: 36 }}>{svc.description}</p>
                {/* Price inline */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: "0.5625rem", letterSpacing: "2.5px", color: "rgba(255,255,255,.65)", fontWeight: 700, textTransform: "uppercase", marginBottom: 5 }}>Harga Mulai</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.6rem,5vw,2.4rem)", fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                        {(() => { const raw = activePrice; const isC = String(raw||"").toLowerCase().includes("hubungi"); return isC ? "Hubungi Kami" : (formatRp(raw)||raw); })()}
                      </span>
                      <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,.68)", fontWeight: 500 }}>{activePriceNote}</span>
                    </div>
                  </div>
                  <div style={{ padding: "6px 14px", background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 20, fontSize: "0.75rem", color: "rgba(255,255,255,.72)", fontStyle: "italic", marginBottom: 4 }}>Nego &amp; Konsultasi</div>
                </div>
                {svc.minPeserta && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, padding: "5px 14px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.13)", borderRadius: 20 }}>
                    <span style={{ fontSize: "0.875rem" }}>👥</span>
                    <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,.72)", fontWeight: 600 }}>Min. <strong style={{ color: "#fff" }}>{svc.minPeserta} peserta</strong></span>
                  </div>
                )}
              </div>

              {/* Right: Hero Slideshow dari destinasi */}
              <div className="mg-hero-right">
              {(() => {
                const heroSlides = (svc.destinations || []).filter(d => d.img);
                const fallbackSlides = imgs.filter(Boolean);
                const allSlides = heroSlides.length > 0
                  ? heroSlides
                  : fallbackSlides.map((img, i) => ({ img, name: svc.title, no: String(i+1).padStart(2,"0"), title: svc.title }));
                return <ServiceHeroSlideshow key={svc.id} slides={allSlides} catColor={catInfo.color || "#D4AF37"} />;
              })()}
              </div>
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(28px,5vw,52px) clamp(16px,5%,60px) clamp(48px,6vw,80px)" }}>
          <div className="mg-body-grid" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 48, alignItems: "start" }}>

            {/* ── LEFT COLUMN ── */}
            <div>

              {/* FACILITY GALLERY — slideshow dari galeri upload paket + destinasi */}
              {(() => {
                // 1. Gambar dari galeri upload Control Panel (svc.images)
                const uploadedSlides = (svc.images || []).filter(Boolean).map((img, i) => ({
                  img,
                  name: `Foto ${i + 1}`,
                  no: String(i + 1).padStart(2, "0"),
                  title: `${svc.title} — Foto ${i + 1}`,
                }));

                // 2. Gambar dari destinations (jika ada, tambahkan setelah galeri upload)
                const destSlides = (svc.destinations || [])
                  .filter(d => d.img)
                  .map(d => ({ img: d.img, name: d.name, no: d.no, title: d.title }));

                // Gabungkan: galeri upload dulu, lalu destinasi — hapus duplikat URL
                const seenUrls = new Set();
                const slideImgs = [...uploadedSlides, ...destSlides].filter(s => {
                  if (!s.img || seenUrls.has(s.img)) return false;
                  seenUrls.add(s.img);
                  return true;
                });

                // Fallback ke svc.image tunggal jika tidak ada galeri sama sekali
                if (slideImgs.length === 0 && svc.image) {
                  slideImgs.push({ img: svc.image, name: svc.title, no: "01", title: svc.title });
                }

                if (slideImgs.length === 0) return null;
                return (
                  <DestGallerySlideshow
                    key={svc.id}
                    slides={slideImgs}
                    catColor={catInfo.color || "#8B6914"}
                    svcTitle={svc.title}
                  />
                );
              })()}

              {/* FACILITIES — semua kategori, difilter oleh activePt.facilityChecks */}
              {(svc.facilities || []).length > 0 && (
                <FacilitiesSection svc={svc} catInfo={catInfo} activePt={activePt} />
              )}

              {/* DESTINATIONS — semua kategori, difilter oleh activePt.destinationChecks */}
              {(svc.destinations || []).length > 0 && (
                <DestinationsSection svc={svc} catInfo={catInfo} activePt={activePt} />
              )}

              {/* FEATURES — 2-col magazine checklist, difilter oleh activePt.featureChecks */}
              {(() => {
                const allFeats = svc.features || [];
                const fChecks = activePt?.featureChecks || [];
                const filteredFeats = fChecks.length > 0
                  ? allFeats.filter((_, i) => fChecks[i] !== false)
                  : allFeats;
                if (!filteredFeats.length) return null;
                return (
                  <div className="mg-fade-3" style={{ marginBottom: 48 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 26 }}>
                      <div style={{ width: 4, height: 30, background: `linear-gradient(to bottom, ${catInfo.color || "#8B6914"}, transparent)`, borderRadius: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: "0.5625rem", letterSpacing: "3px", color: "#7ab5cc", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Sudah Termasuk</div>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", fontWeight: 800, color: "#2E3D3F", lineHeight: 1.1 }}>Yang Anda Dapatkan</div>
                      </div>
                      <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, #E8DCC8, transparent)" }} />
                    </div>
                    <div className="mg-feat-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {filteredFeats.map((feat, i) => (
                        <div key={i} className="mg-feat-row" style={{ display: "flex", gap: 11, alignItems: "flex-start", background: "#fff", borderRadius: 10, padding: "13px 15px 13px 18px", border: "1px solid #c8eaf2", transition: "background .18s", position: "relative", overflow: "hidden" }}>
                          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: catInfo.color || "#8B6914", borderRadius: "10px 0 0 10px" }} />
                          <div style={{ width: 20, height: 20, borderRadius: "50%", background: catInfo.color ? `${catInfo.color}15` : "#e4f2f8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                            <span style={{ color: catInfo.color || "#8B6914", fontSize: "0.6875rem", fontWeight: 900 }}>✓</span>
                          </div>
                          <span style={{ fontSize: "0.85rem", color: "#C9AA71", lineHeight: 1.5, fontWeight: 500, whiteSpace: "pre-wrap" }}>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* ── RIGHT SIDEBAR ── */}
            <div className="mg-pkg-sidebar" style={{ position: "sticky", top: 128 }}>

              {/* Price Card */}
              <div className="mg-fade-2" style={{ background: "linear-gradient(145deg,#0d1f35 0%,#2E3D3F 55%,#3D5254 100%)", borderRadius: 16, overflow: "visible", boxShadow: "0 24px 64px rgba(12,26,40,.5)", marginBottom: 18 }}>
                {/* Top gradient bar */}
                <div style={{ height: 4, background: `linear-gradient(to right, ${catInfo.color || "#8B6914"}, ${svc.badgeColor || catInfo.color || "#E8C96A"})`, borderRadius: "16px 16px 0 0" }} />

                <div style={{ padding: "20px 18px 0" }}>
                  {/* Header label */}
                  <div style={{ fontSize: "0.5625rem", letterSpacing: "3px", color: "rgba(255,255,255,.35)", textTransform: "uppercase", fontWeight: 700, textAlign: "center", marginBottom: 14 }}>— Penawaran Spesial —</div>

                  {/* ── SELECTOR PAKET (paketTypes A/B/C/D) ── */}
                  {paketTypes.length > 0 && (() => {
                    const activePt2 = paketTypes.find(pt => pt.id === resolvedActiveId) || paketTypes[0];
                    const isUtamaActive = activePt2?.id === (svc.utamaTipeId || paketTypes[0]?.id);
                    return (
                      <div style={{ marginBottom: 16, position: "relative" }}>
                        <div style={{ fontSize: "0.5625rem", letterSpacing: "2px", color: "rgba(255,255,255,.45)", textTransform: "uppercase", fontWeight: 700, marginBottom: 8, textAlign: "center" }}>Pilih Paket</div>

                        {/* Trigger Button */}
                        <button
                          onClick={() => setPkgDropOpen(o => !o)}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "9px 13px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,.18)",
                            background: "rgba(255,255,255,.08)", cursor: "pointer", transition: "all .18s",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.14)"}
                          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.08)"}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                            {isUtamaActive && (
                              <span style={{ fontSize: "0.4375rem", fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 20, background: "#E8C96A", color: "#2E3D3F", flexShrink: 0 }}>UTAMA</span>
                            )}
                            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activePt2?.name}</span>
                            </div>
                            {activePt2?.price && (
                              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,.75)", fontFamily: "'Playfair Display',serif", flexShrink: 0 }}>{formatRp(activePt2.price) || activePt2.price}</span>
                            )}
                          </div>
                          <span style={{ color: "rgba(255,255,255,.55)", fontSize: "0.75rem", flexShrink: 0, marginLeft: 6, display: "inline-block", transform: pkgDropOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>▾</span>
                        </button>

                        {/* Dropdown List */}
                        {pkgDropOpen && (
                          <div style={{
                            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 99,
                            background: "linear-gradient(145deg,#0d1f35,#2E3D3F)",
                            borderRadius: 12, overflow: "hidden",
                            boxShadow: "0 12px 40px rgba(0,0,0,.55)",
                            border: "1px solid rgba(255,255,255,.1)",
                            animation: "mgFadeUp .18s cubic-bezier(.22,1,.36,1) both",
                          }}>
                            {paketTypes.map((pt, idx) => {
                              const isActive = pt.id === resolvedActiveId;
                              const isUtama = pt.id === (svc.utamaTipeId || paketTypes[0]?.id);
                              const ptRawPrice = pt.price;
                              const isContact = String(ptRawPrice || "").toLowerCase().includes("hubungi");
                              return (
                                <button key={pt.id}
                                  onClick={() => { setActivePaketTypeId(pt.id); setPkgDropOpen(false); }}
                                  style={{
                                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                                    padding: "10px 14px", border: "none", cursor: "pointer",
                                    borderBottom: idx < paketTypes.length - 1 ? "1px solid rgba(255,255,255,.06)" : "none",
                                    background: isActive
                                      ? `linear-gradient(135deg,${catInfo.color || "#8B6914"}cc,${catInfo.color || "#8B6914"}66)`
                                      : "transparent",
                                    transition: "background .15s",
                                  }}
                                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,.08)"; }}
                                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                                    {isUtama && (
                                      <span style={{ fontSize: "0.4375rem", fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 20, background: isActive ? "rgba(255,255,255,.25)" : "#E8C96A", color: isActive ? "#fff" : "#2E3D3F", flexShrink: 0 }}>UTAMA</span>
                                    )}
                                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                                      <span style={{ fontSize: "0.8rem", fontWeight: isActive ? 700 : 500, color: isActive ? "#fff" : "rgba(255,255,255,.75)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130 }}>{pt.name}</span>
                                    </div>
                                  </div>
                                  <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "0.875rem", fontWeight: 800, color: isActive ? "#fff" : "rgba(255,255,255,.55)", flexShrink: 0, marginLeft: 8 }}>
                                    {isContact ? "Konsultasi" : (formatRp(ptRawPrice) || ptRawPrice || "")}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div style={{ height: 1, background: "rgba(255,255,255,.08)", margin: "6px 0 16px" }} />

                  {/* Harga aktif — besar di tengah */}
                  <div style={{ textAlign: "center", marginBottom: 14 }}>
                    <div style={{ fontSize: "0.5625rem", letterSpacing: "2.5px", color: "rgba(255,255,255,.38)", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Harga Mulai</div>
                    <div key={resolvedActiveId} style={{
                      fontFamily: "'Playfair Display',serif",
                      fontSize: "clamp(1.8rem,5vw,2.6rem)", fontWeight: 900, color: "#fff",
                      lineHeight: 1, marginBottom: 4,
                      animation: "mgFadeUp .3s cubic-bezier(.22,1,.36,1) both",
                    }}>
                      {(() => {
                        const raw = activePrice;
                        const isContact = String(raw || "").toLowerCase().includes("hubungi");
                        return isContact ? "Hubungi Kami" : (formatRp(raw) || raw || "—");
                      })()}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "rgba(255,255,255,.45)", fontWeight: 500 }}>{activePriceNote}</div>
                    {activeMinPeserta && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, padding: "4px 12px", background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 20 }}>
                        <span style={{ fontSize: "0.8rem" }}>👥</span>
                        <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,.65)", fontWeight: 600 }}>Min. <strong style={{ color: "#fff" }}>{activeMinPeserta} peserta</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Nego info */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "rgba(255,255,255,.06)", borderRadius: 8, padding: "10px 12px", marginBottom: 4, border: "1px solid rgba(255,255,255,.07)" }}>
                    <span style={{ fontSize: "1rem", flexShrink: 0, marginTop: 1 }}>💬</span>
                    <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,.55)", fontStyle: "italic", lineHeight: 1.45 }}>Harga dapat disesuaikan dengan kebutuhan dan budget Anda</span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div style={{ padding: "16px", borderRadius: "0 0 16px 16px", overflow: "hidden" }}>
                  <button className="mg-cta-wa" onClick={() => {
                    const pkgTitle = activeSidebarPkg.title;
                    const priceStr = (() => { const raw = activePrice; const isC = String(raw||"").toLowerCase().includes("hubungi"); return isC ? "Hubungi Kami" : (formatRp(raw)||raw); })();
                    handleBook({ ...activeSidebarPkg, price: priceStr });
                  }}
                    style={{ width: "100%", padding: "15px 20px", background: "linear-gradient(135deg,#8B6914,#C9AA71)", color: "#fff", border: "none", borderRadius: 10, fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10, transition: "all .2s", letterSpacing: ".01em" }}>
                    <span style={{ fontSize: "1.1rem" }}>💬</span> Pesan via WhatsApp
                  </button>
                  <button onClick={() => onWaOpen && onWaOpen()} className="mg-cta-tel"
                    style={{ width: "100%", padding: "13px 20px", background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.9)", border: "1.5px solid rgba(255,255,255,.15)", borderRadius: 10, fontSize: "0.875rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all .2s", cursor: "pointer" }}>
                    <span style={{ fontSize: "1rem" }}>📞</span> Hubungi Langsung
                  </button>
                </div>
              </div>

              {/* Why Us — dark card with deco border */}
              <div className="mg-fade-3" style={{ background: "linear-gradient(135deg,#2E3D3F,#3D5254)", borderRadius: 14, padding: "2px", overflow: "hidden", position: "relative" }}>
                {/* Gradient border effect */}
                <div style={{ position: "absolute", inset: 0, background: `linear-gradient(145deg, ${catInfo.color || "#8B6914"}44, transparent, rgba(255,255,255,.06))`, borderRadius: 14, pointerEvents: "none" }} />
                <div style={{ background: "linear-gradient(135deg,#2E3D3F,#3D5254)", borderRadius: 12, padding: "22px 20px", position: "relative" }}>
                  {/* Inner deco frame */}
                  <div style={{ position: "absolute", top: 10, left: 10, right: 10, bottom: 10, border: "1px solid rgba(255,255,255,.05)", borderRadius: 8, pointerEvents: "none" }} />
                  {/* BG shapes */}
                  <div style={{ position: "absolute", bottom: -25, right: -25, width: 90, height: 90, borderRadius: "50%", background: `${catInfo.color || "#8B6914"}18`, pointerEvents: "none" }} />
                  <div style={{ position: "relative" }}>
                    <div style={{ fontSize: "0.5625rem", letterSpacing: "3px", color: catInfo.color || "#D4AF37", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Keunggulan Kami</div>
                    <div style={{ width: 28, height: 2, background: catInfo.color || "#D4AF37", borderRadius: 1, marginBottom: 18 }} />
                    {[
                      { icon: "🏆", label: "Tim Profesional", desc: "Berpengalaman di bidangnya" },
                      { icon: "🤝", label: "Konsultasi Gratis", desc: "Diskusi tanpa biaya apapun" },
                      { icon: "⭐", label: "Kepuasan Terjamin", desc: "Rating tinggi dari klien kami" },
                      { icon: "📋", label: "Paket Fleksibel", desc: "Disesuaikan kebutuhan Anda" },
                    ].map((item, i, arr) => (
                      <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: i < arr.length - 1 ? 14 : 0, paddingBottom: i < arr.length - 1 ? 14 : 0, borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,.06)" : "none" }}>
                        <span style={{ fontSize: "1.1rem", flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                        <div>
                          <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "rgba(255,255,255,.85)", marginBottom: 1 }}>{item.label}</div>
                          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,.45)", lineHeight: 1.4 }}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* RELATED PACKAGES — selalu di bawah, mobile friendly */}
          {relatedSvcs.length > 0 && (
            <div className="mg-fade-3" style={{ marginTop: 48 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                <div style={{ width: 4, height: 30, background: "linear-gradient(to bottom, #7ab5cc, transparent)", borderRadius: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: "0.5625rem", letterSpacing: "3px", color: "#7ab5cc", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Lihat Juga</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", fontWeight: 800, color: "#2E3D3F", lineHeight: 1.1 }}>Paket Serupa</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                {relatedSvcs.map(s => (
                  <div key={s.id} className="mg-related" onClick={() => openDetail(s)}
                    style={{ display: "flex", gap: 0, alignItems: "stretch", background: "#fff", borderRadius: 12, overflow: "hidden", cursor: "pointer", boxShadow: "0 2px 10px rgba(13,59,102,.07)", border: "1px solid #c8eaf2" }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 28px rgba(46,61,63,.14)"}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 10px rgba(13,59,102,.07)"}>
                    <div style={{ width: 90, flexShrink: 0, overflow: "hidden" }}>
                      <img loading="lazy" src={s.images?.[0] || s.image} alt={s.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .3s" }}
                        onError={e => e.target.src = ""} />
                    </div>
                    <div style={{ width: 3, flexShrink: 0, background: `linear-gradient(to bottom, ${s.badgeColor || "#8B6914"}, transparent)` }} />
                    <div style={{ padding: "12px 14px", flex: 1, minWidth: 0 }}>
                      {s.badge && <div style={{ fontSize: "0.5625rem", color: s.badgeColor || "#8B6914", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 3 }}>{s.badge}</div>}
                      <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#2E3D3F", marginBottom: 4, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.title}</div>
                      <div style={{ fontSize: "0.8125rem", color: s.badgeColor || "#8B6914", fontWeight: 800 }}>{s.price} <span style={{ color: "#7ab5cc", fontWeight: 400, fontSize: "0.75rem" }}>{s.priceNote}</span></div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", paddingRight: 14, color: "#C9AA71", fontSize: "1.125rem", flexShrink: 0 }}>›</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Services List — Vastura Full Page (pixel-perfect dari desain) ── */
  const filteredServices = activeCategory ? services.filter(s => s.category === activeCategory) : [];

  /* ── Galeri Proyek Data ── */
  const GALERI_LIST = [
    { label: "RUMAH MINIMALIS", img: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=80" },
    { label: "INTERIOR MODERN", img: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80" },
    { label: "PAGAR LASER CUTTING", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80" },
    { label: "KANOPI ALDERON", img: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80" },
    { label: "KOLAM & TAMAN", img: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=80" },
    { label: "PINTU ALUMINIUM", img: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80" },
  ];

  /* ── Testimonial Data ── */
  const TESTIMONI = [
    { text: "Hasil desain sesuai ekspektasi, tim sangat profesional dan komunikatif. Proyek selesai tepat waktu dan rapi.", stars: 5, name: "Budi Santoso", role: "Pemilik Rumah" },
    { text: "Sangat puas dengan hasil interior rumah kami. Desainnya elegan dan fungsional, pengerjaan juga rapi.", stars: 5, name: "Dewi Lestari", role: "Ibu Rumah Tangga" },
    { text: "Pembuatan kanopi dan pagar sangat berkualitas. Harganya juga kompetitif. Recommended!", stars: 5, name: "Andi Setiawan", role: "Wiraswasta" },
  ];
  const [testiIdx, setTestiIdx] = useState(0);

  return (
    <div className="fade-in" style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Sora', 'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes svFadeUp { from { opacity:0; transform:translateY(24px);} to { opacity:1; transform:none;} }
        .sv-card { transition: transform .25s ease, box-shadow .25s ease; cursor: pointer; }
        .sv-card:hover { transform: translateY(-6px); box-shadow: 0 20px 50px rgba(0,0,0,.16) !important; }
        .sv-card:hover .sv-card-img { transform: scale(1.07); }
        .sv-card-img { transition: transform .4s ease; }
        .sv-card-link { transition: color .2s; }
        .sv-card-link:hover { color: #C9AA71 !important; }
        .sv-keung-item { transition: background .2s; }
        .sv-keung-item:hover { background: #FAF7F0 !important; }
        .sv-galeri-item { position: relative; overflow: hidden; cursor: pointer; }
        .sv-galeri-item img { transition: transform .4s ease; display:block; width:100%; height:100%; object-fit:cover; }
        .sv-galeri-item:hover img { transform: scale(1.07); }
        .sv-galeri-overlay { position:absolute; inset:0; background:linear-gradient(to top, rgba(0,0,0,.72) 0%, transparent 55%); display:flex; align-items:flex-end; padding:14px 16px; }
        .sv-testi-btn { transition: background .2s, border-color .2s; }
        .sv-testi-btn:hover { background: #C9AA71 !important; border-color: #C9AA71 !important; }
        .sv-wa-btn { transition: background .2s; }
        .sv-wa-btn:hover { background: #1da851 !important; }
        .sv-lihat-btn { transition: background .2s, color .2s; }
        .sv-lihat-btn:hover { background: #2E3D3F !important; color: #fff !important; }
        @media(max-width:900px){ .sv-layanan-grid { grid-template-columns: repeat(3,1fr) !important; } .sv-galeri-grid { grid-template-columns: repeat(3,1fr) !important; } }
        @media(max-width:640px){ .sv-layanan-grid { grid-template-columns: repeat(2,1fr) !important; } .sv-galeri-grid { grid-template-columns: repeat(2,1fr) !important; } .sv-keung-grid { grid-template-columns: repeat(2,1fr) !important; } .sv-testi-grid { grid-template-columns: 1fr !important; } }
        @media(max-width:400px){ .sv-layanan-grid { grid-template-columns: 1fr !important; } .sv-galeri-grid { grid-template-columns: 1fr !important; } }
        @media(max-width:700px){ .sv-keung-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media(max-width:400px){ .sv-keung-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* ══════════════════════════════════════
          HERO SECTION — dengan background foto rumah
      ══════════════════════════════════════ */}
      <div style={{ position:"relative", height:"clamp(420px,65vw,640px)", overflow:"hidden", background:"#1a2526" }}>
        {/* Hero BG image */}
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&q=85"
          alt="Vastura Hero"
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"center", opacity:.72 }}
        />
        {/* dark overlay gradient */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right, rgba(0,0,0,.78) 35%, rgba(0,0,0,.28) 100%)" }} />

        {/* Content */}
        <div style={{ position:"relative", zIndex:2, height:"100%", display:"flex", alignItems:"center", padding:"0 clamp(24px,6%,120px)" }}>
          <div style={{ maxWidth:560, animation:"svFadeUp .6s ease both" }}>
            <h1 style={{ fontSize:"clamp(2rem,5.5vw,3.4rem)", fontWeight:900, color:"#fff", lineHeight:1.08, marginBottom:14, letterSpacing:"-0.01em" }}>
              <span style={{ display:"block" }}>SOLUSI LENGKAP</span>
              <span style={{ color:"#C9AA71" }}>DESAIN &amp; KONSTRUKSI</span>
            </h1>
            <p style={{ fontSize:"clamp(0.9rem,2vw,1.0625rem)", color:"rgba(255,255,255,.82)", lineHeight:1.75, marginBottom:28, maxWidth:420 }}>
              Melayani desain, renovasi, interior, eksterior hingga penataan taman dengan standar profesional.
            </p>
            <div style={{ display:"flex", gap:14, flexWrap:"wrap", alignItems:"center" }}>
              <button className="sv-wa-btn" onClick={() => onWaOpen && onWaOpen()}
                style={{ padding:"13px 26px", background:"#25D366", color:"#fff", border:"none", borderRadius:8, fontSize:"0.9375rem", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:"1.1rem" }}>💬</span> KONSULTASI GRATIS
              </button>
              <button style={{ padding:"13px 22px", background:"transparent", color:"#fff", border:"none", borderRadius:8, fontSize:"0.9rem", fontWeight:500, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ width:34, height:34, borderRadius:"50%", border:"2px solid rgba(255,255,255,.7)", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:"0.75rem" }}>▶</span>
                LIHAT VIDEO PROFIL PERUSAHAAN
              </button>
            </div>
          </div>
        </div>

        {/* Slide dots */}
        <div style={{ position:"absolute", bottom:20, left:"50%", transform:"translateX(-50%)", display:"flex", gap:8, zIndex:3 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: i===0 ? 24 : 8, height:8, borderRadius:4, background: i===0 ? "#C9AA71" : "rgba(255,255,255,.45)", transition:"all .3s" }} />
          ))}
        </div>

        {/* Arrow prev */}
        <button style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", width:38, height:38, borderRadius:"50%", background:"rgba(255,255,255,.18)", border:"none", color:"#fff", fontSize:"1.1rem", cursor:"pointer", zIndex:3, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
        {/* Arrow next */}
        <button style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", width:38, height:38, borderRadius:"50%", background:"rgba(255,255,255,.18)", border:"none", color:"#fff", fontSize:"1.1rem", cursor:"pointer", zIndex:3, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
      </div>

      {/* ══════════════════════════════════════
          KEUNGGULAN STRIP (6 kolom ikon)
      ══════════════════════════════════════ */}
      <div style={{ background:"#fff", borderBottom:"1px solid #F0EAE0", padding:"clamp(24px,3.5vw,40px) 5%" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div className="sv-keung-grid" style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8 }}>
            {KEUNGGULAN.map((k,i) => (
              <div key={i} className="sv-keung-item" style={{ textAlign:"center", padding:"22px 10px", borderRadius:10 }}>
                <div style={{ fontSize:"2rem", marginBottom:10, lineHeight:1 }}>{k.icon}</div>
                <div style={{ fontSize:"0.8125rem", fontWeight:700, color:"#1a2526", marginBottom:5 }}>{k.label}</div>
                <div style={{ fontSize:"0.73rem", color:"#5A6A6C", lineHeight:1.5 }}>{k.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          LAYANAN SECTION (6 cards)
      ══════════════════════════════════════ */}
      <section style={{ background:"#fff", padding:"clamp(44px,6vw,80px) 5%" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          {/* Section header */}
          <div style={{ textAlign:"center", marginBottom:"clamp(28px,4.5vw,52px)" }}>
            <div style={{ fontSize:"0.6875rem", letterSpacing:"4px", color:"#C9AA71", textTransform:"uppercase", fontWeight:700, marginBottom:12 }}>LAYANAN KAMI</div>
            <h2 style={{ fontSize:"clamp(1.6rem,3.8vw,2.5rem)", fontWeight:800, color:"#1a2526", lineHeight:1.12, letterSpacing:"-0.01em", margin:0 }}>
              Layanan Terbaik Untuk Anda
            </h2>
          </div>

          {/* 6-col card grid */}
          <div className="sv-layanan-grid" style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:18 }}>
            {LAYANAN_LIST.map((lay) => {
              const matchedSvc = services.find(s => s.category === lay.category) || null;
              return (
                <div key={lay.key} className="sv-card"
                  onClick={() => {
                    if (matchedSvc) { openDetail(matchedSvc); }
                    else { onWaOpen && onWaOpen({ key: "layanan", vars: { judul_layanan: lay.label } }); }
                  }}
                  style={{ borderRadius:14, overflow:"hidden", background:"#fff", boxShadow:"0 4px 18px rgba(0,0,0,.07)", border:"1px solid #F0EAE0" }}>
                  {/* Image */}
                  <div style={{ position:"relative", height:150, overflow:"hidden", background:"#e8e0d0" }}>
                    <img
                      src={lay.img}
                      alt={lay.label}
                      className="sv-card-img"
                      style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
                      onError={e => { e.target.style.display="none"; }}
                    />
                    {/* icon badge */}
                    <div style={{ position:"absolute", bottom:10, left:10, width:36, height:36, borderRadius:"50%", background:lay.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.05rem", boxShadow:"0 4px 12px rgba(0,0,0,.22)" }}>
                      {lay.icon}
                    </div>
                  </div>
                  {/* Body */}
                  <div style={{ padding:"14px 14px 18px" }}>
                    <h3 style={{ fontSize:"0.9375rem", fontWeight:800, color:"#1a2526", marginBottom:7, lineHeight:1.3 }}>{lay.label}</h3>
                    <p style={{ fontSize:"0.78rem", color:"#5A6A6C", lineHeight:1.6, marginBottom:12 }}>{lay.desc}</p>
                    <span className="sv-card-link" style={{ fontSize:"0.78rem", fontWeight:700, color:lay.color, display:"flex", alignItems:"center", gap:3 }}>
                      Selengkapnya <span style={{ fontSize:"0.9rem" }}>→</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          GALERI PROYEK
      ══════════════════════════════════════ */}
      <section style={{ background:"#fff", padding:"0 5% clamp(52px,7vw,88px)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          {/* Section header */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:10 }}>
            <div>
              <div style={{ width:44, height:3, background:"#C9AA71", borderRadius:2, marginBottom:10 }} />
              <h2 style={{ fontSize:"clamp(1.4rem,3vw,2rem)", fontWeight:800, color:"#1a2526", margin:0, lineHeight:1.15 }}>Galeri Proyek</h2>
            </div>
            <button className="sv-lihat-btn"
              style={{ padding:"10px 22px", background:"#fff", color:"#1a2526", border:"1.5px solid #1a2526", borderRadius:8, fontSize:"0.85rem", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8, whiteSpace:"nowrap" }}>
              LIHAT SEMUA PROYEK →
            </button>
          </div>

          {/* 6-col gallery grid */}
          <div className="sv-galeri-grid" style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:0 }}>
            {GALERI_LIST.map((g,i) => (
              <div key={i} className="sv-galeri-item" style={{ height:200 }}>
                <img src={g.img} alt={g.label} onError={e=>{e.target.style.display="none";}} />
                <div className="sv-galeri-overlay">
                  <span style={{ fontSize:"0.65rem", fontWeight:800, letterSpacing:"1.5px", color:"#fff", textTransform:"uppercase", textShadow:"0 1px 4px rgba(0,0,0,.6)", lineHeight:1.3 }}>{g.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          TESTIMONIAL
      ══════════════════════════════════════ */}
      <section style={{ background:"#1a2526", padding:"clamp(52px,7vw,88px) 5%", position:"relative", overflow:"hidden" }}>
        {/* deco dots */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle, rgba(255,255,255,.04) 1px, transparent 1px)", backgroundSize:"28px 28px", pointerEvents:"none" }} />
        <div style={{ position:"relative", zIndex:1, maxWidth:1200, margin:"0 auto" }}>
          {/* heading */}
          <div style={{ textAlign:"center", marginBottom:40 }}>
            <h2 style={{ fontSize:"clamp(1.5rem,3.5vw,2.2rem)", fontWeight:800, color:"#fff", margin:"0 0 10px", lineHeight:1.15 }}>Apa Kata Klien Kami</h2>
            <div style={{ width:48, height:3, background:"#C9AA71", borderRadius:2, margin:"0 auto" }} />
          </div>

          {/* 3 cards */}
          <div style={{ position:"relative" }}>
            <div className="sv-testi-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
              {TESTIMONI.map((t,i) => (
                <div key={i} style={{ background:"rgba(255,255,255,.06)", borderRadius:14, padding:"26px 24px", border:"1px solid rgba(255,255,255,.1)" }}>
                  <div style={{ fontSize:"2.2rem", color:"#C9AA71", lineHeight:1, marginBottom:14, fontFamily:"Georgia,serif" }}>"</div>
                  <p style={{ fontSize:"0.875rem", color:"rgba(255,255,255,.82)", lineHeight:1.75, marginBottom:20 }}>{t.text}</p>
                  {/* Stars */}
                  <div style={{ display:"flex", gap:3, marginBottom:16 }}>
                    {Array.from({length:t.stars}).map((_,si) => (
                      <span key={si} style={{ color:"#C9AA71", fontSize:"0.95rem" }}>★</span>
                    ))}
                  </div>
                  {/* Author */}
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:42, height:42, borderRadius:"50%", background:"linear-gradient(135deg,#C9AA71,#8B6914)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:"1rem", flexShrink:0 }}>
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight:700, color:"#fff", fontSize:"0.9rem" }}>{t.name}</div>
                      <div style={{ fontSize:"0.75rem", color:"rgba(255,255,255,.55)" }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Arrow nav */}
            <button className="sv-testi-btn" onClick={() => setTestiIdx(p => Math.max(0,p-1))}
              style={{ position:"absolute", top:"50%", left:-20, transform:"translateY(-50%)", width:38, height:38, borderRadius:"50%", background:"rgba(255,255,255,.1)", border:"1.5px solid rgba(255,255,255,.25)", color:"#fff", fontSize:"1.1rem", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
            <button className="sv-testi-btn" onClick={() => setTestiIdx(p => Math.min(TESTIMONI.length-1,p+1))}
              style={{ position:"absolute", top:"50%", right:-20, transform:"translateY(-50%)", width:38, height:38, borderRadius:"50%", background:"rgba(255,255,255,.1)", border:"1.5px solid rgba(255,255,255,.25)", color:"#fff", fontSize:"1.1rem", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA BANNER — Hunian Impian
      ══════════════════════════════════════ */}
      <section style={{ position:"relative", overflow:"hidden" }}>
        {/* BG foto */}
        <img
          src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1400&q=80"
          alt="CTA BG"
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }}
        />
        <div style={{ position:"absolute", inset:0, background:"rgba(26,37,38,.82)" }} />
        <div style={{ position:"relative", zIndex:1, padding:"clamp(52px,7vw,88px) 5%", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:24, maxWidth:1200, margin:"0 auto" }}>
          <div>
            <h2 style={{ fontSize:"clamp(1.5rem,3.5vw,2.2rem)", fontWeight:800, color:"#fff", margin:"0 0 8px", lineHeight:1.2 }}>
              Siap Mewujudkan Hunian Impian Anda?
            </h2>
            <p style={{ fontSize:"1rem", color:"rgba(255,255,255,.75)", margin:0 }}>
              Konsultasikan kebutuhan Anda sekarang juga secara gratis!
            </p>
          </div>
          <button className="sv-wa-btn" onClick={() => onWaOpen && onWaOpen()}
            style={{ padding:"15px 32px", background:"#25D366", color:"#fff", border:"none", borderRadius:8, fontSize:"1rem", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:10, whiteSpace:"nowrap", flexShrink:0, boxShadow:"0 4px 20px rgba(37,211,102,.4)" }}>
            <span style={{ fontSize:"1.2rem" }}>💬</span> KONSULTASI SEKARANG
          </button>
        </div>
      </section>

    </div>
  );
}


/* ─────────────── ABOUT PAGE ─────────────── */
function AboutPage({ content, images, teamMembers, onWaOpen }) {
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [contactSent, setContactSent] = useState(false);

  const handleContactSubmit = () => {
    if (!contactForm.name || !contactForm.message) return;
    const lines = [
      "Halo VASTURA GROUP! 👋",
      "",
      "Nama: " + contactForm.name,
      "Email: " + (contactForm.email || "-"),
      "No. HP: " + (contactForm.phone || "-"),
      "Keperluan: " + (contactForm.subject || "-"),
      "",
      "Pesan:",
      contactForm.message,
    ].join("\n");
    // Form kontak: kirim langsung sebagai string (data dari user, bukan template admin)
    if (onWaOpen) onWaOpen(lines);
    setContactSent(true);
    setTimeout(() => { setContactSent(false); setContactForm({ name: "", email: "", phone: "", subject: "", message: "" }); }, 4000);
  };

  const values = [
    { icon: "✈️", title: "Expert Travel Planning", desc: "Kami merencanakan setiap detail perjalanan Anda — dari tiket, akomodasi, hingga tur lokal — agar Anda bisa menikmati tanpa khawatir." },
    { icon: "🛋️", title: "Interior", desc: "Transformasi ruang hidup Anda dengan desain interior profesional — dari konsep, pemilihan material, hingga pemasangan." },
    { icon: "🔧", title: "Exterior", desc: "Pagar, kanopi, aluminium, dan landscape yang mempercantik fasad dan halaman rumah Anda secara menyeluruh." },
    { icon: "🛡️", title: "Terpercaya & Aman", desc: "Kepercayaan klien adalah prioritas kami. Setiap layanan dirancang dengan standar keamanan dan profesionalisme tinggi." },
    { icon: "🌟", title: "Pengalaman Bertahun-tahun", desc: "Didukung tim berpengalaman yang telah melayani ratusan klien puas di seluruh Indonesia." },
    { icon: "💬", title: "Layanan 24/7", desc: "Tim customer service kami siap membantu kapan saja, memastikan setiap pertanyaan dan kebutuhan Anda terpenuhi." },
  ];

  const timeline = [
    { year: "2018", title: "VASTURA GROUP Berdiri", desc: "Didirikan dengan visi memberikan layanan travel & event berkualitas di Malang." },
    { year: "2019", title: "Ekspansi Interior & Exterior", desc: "Membuka divisi Interior dan Exterior yang langsung mendapat respons positif dari pasar." },
    { year: "2021", title: "100+ Klien", desc: "Mencapai 100+ klien puas meskipun pandemi, dengan inovasi layanan virtual event." },
    { year: "2023", title: "Platform Digital", desc: "Meluncurkan platform digital untuk memudahkan pemesanan dan komunikasi dengan klien." },
    { year: "2025", title: "Berkembang Pesat", desc: "Hadir di berbagai kota besar Indonesia dengan jaringan mitra lokal yang kuat." },
  ];

  const team = [
    { name: "Tim Kreatif", role: "Event & Dekorasi", icon: "🎨" },
    { name: "Tim Konstruksi", role: "Gedung & Rumah", icon: "🏗️" },
    { name: "Tim Wedding", role: "Koordinator Pernikahan", icon: "💐" },
    { name: "Tim CS", role: "Layanan Pelanggan", icon: "🤝" },
  ];

  return (
    <div className="fade-in" style={{ minHeight: "100vh", background: "#fff" }}>

      {/* ── HERO ── */}
      <div style={{ background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", padding: "80px 5% 90px", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,.12)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, left: "20%", width: 300, height: 300, borderRadius: "50%", background: "rgba(139,105,20,.1)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1200, margin: "0 auto" }} className="about-hero-grid">
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(8,145,178,.15)", border: "1px solid rgba(8,145,178,.3)", borderRadius: 20, padding: "5px 16px", marginBottom: 24 }}>
              <span style={{ fontSize: 10, letterSpacing: "2px", color: "rgba(255,255,255,.80)", textTransform: "uppercase", fontWeight: 700 }}>Tentang Kami</span>
            </div>
            <h1 className="display" style={{ fontSize: "clamp(2.25rem,5vw,3.75rem)", fontWeight: 900, lineHeight: 1.06, color: "#fff", marginBottom: 24 }}>
              {content.aboutHeroTitle || "VASTURA GROUP"}
            </h1>
            <p style={{ fontSize: "1.0625rem", color: "rgba(255,255,255,.85)", lineHeight: 1.9, maxWidth: 420, marginBottom: 32, whiteSpace: "pre-line" }}>
              {content.aboutHeroSub || content.aboutText || "Mitra terpercaya Anda untuk perjalanan wisata, pernikahan impian, dan event berkesan. Kami hadir untuk mewujudkan setiap momen menjadi kenangan tak terlupakan."}
            </p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <button onClick={() => onWaOpen && onWaOpen()}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", color: "#fff", borderRadius: 4, fontSize: "0.8125rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", border: "none", cursor: "pointer", transition: "background .2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#8B6914"}
                onMouseLeave={e => e.currentTarget.style.background = "#2E3D3F"}>
                💬 Hubungi Kami
              </button>
              {content.phone && (
                <a href={`https://wa.me/${content.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", background: "rgba(255,255,255,.15)", color: "#fff", borderRadius: 4, fontSize: "0.8125rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", border: "1px solid rgba(255,255,255,.3)", cursor: "pointer", textDecoration: "none", transition: "background .2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.25)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.15)"}>
                  📱 Hubungi via WhatsApp
                </a>
              )}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {images.hero.slice(0, 4).map((src, i) => (
              <div key={i} className="img-zoom" style={{ borderRadius: 8, overflow: "hidden", aspectRatio: "4/3", boxShadow: "0 8px 24px rgba(13,59,102,.15)" }}>
                <img loading="lazy" src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATS STRIP ── */}
      <div style={{ background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", padding: "36px 5%" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 24, textAlign: "center" }}>
          {[
            { num: "500+", label: "Klien Puas" },
            { num: "7+", label: "Tahun Pengalaman" },
            { num: "100+", label: "Event Sukses" },
            { num: "24/7", label: "Layanan Support" },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: "clamp(1.75rem,4vw,2.5rem)", fontWeight: 900, color: "#D4AF37", fontFamily: "'Playfair Display',serif", lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,.65)", marginTop: 6, fontWeight: 500, letterSpacing: ".04em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── VISI MISI ── */}
      <div style={{ padding: "80px 5%", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }} className="grid-2">
          <div style={{ background: "linear-gradient(135deg, #2E3D3F 0%, #3D5254 100%)", borderRadius: 12, padding: "40px 36px", color: "#fff" }}>
            <div style={{ fontSize: 36, marginBottom: 20 }}>🎯</div>
            <h3 style={{ fontSize: "1.5rem", fontFamily: "'Playfair Display',serif", fontWeight: 800, marginBottom: 16, color: "#fff" }}>Visi Kami</h3>
            <p style={{ fontSize: "0.9375rem", lineHeight: 1.85, color: "rgba(255,255,255,.8)" }}>
              Menjadi perusahaan travel dan organizer terkemuka di Indonesia yang dikenal atas pelayanan profesional, kreativitas, dan kemampuan mewujudkan momen-momen tak terlupakan bagi setiap klien.
            </p>
          </div>
          <div style={{ background: "#FAF7F0", borderRadius: 12, padding: "40px 36px", borderLeft: "4px solid #8B6914" }}>
            <div style={{ fontSize: 36, marginBottom: 20 }}>🚀</div>
            <h3 style={{ fontSize: "1.5rem", fontFamily: "'Playfair Display',serif", fontWeight: 800, marginBottom: 16, color: "#2E3D3F" }}>Misi Kami</h3>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
              {["Memberikan layanan terbaik dengan standar profesional tinggi", "Memastikan kepuasan klien di setiap momen yang kami tangani", "Berinovasi dalam layanan travel & event secara berkelanjutan", "Membangun kepercayaan jangka panjang bersama klien dan mitra"].map(m => (
                <li key={m} style={{ display: "flex", gap: 10, fontSize: "0.9rem", color: "#3D5254", lineHeight: 1.6 }}>
                  <span style={{ color: "#8B6914", fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── WHY CHOOSE US ── */}
      <div style={{ background: "linear-gradient(130deg,#084060 0%,#0a6ea0 50%,#0cb5cc 100%)", padding: "80px 5%" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ fontSize: "0.6875rem", letterSpacing: "2px", color: "rgba(255,255,255,.75)", textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>Keunggulan Kami</div>
            <h2 className="display" style={{ fontSize: "clamp(1.75rem,4vw,2.75rem)", fontWeight: 900, color: "#fff" }}>{content.aboutWhyTitle || "Mengapa Memilih VASTURA GROUP?"}</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {values.map((v, i) => (
              <div key={v.title} className="hover-lift" style={{ background: "#fff", borderRadius: 12, padding: "32px 28px", boxShadow: "0 2px 12px rgba(46,61,63,.06)", borderTop: "3px solid #8B6914", transition: "all .3s" }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{v.icon}</div>
                <h3 style={{ fontSize: "1.05rem", fontFamily: "'Playfair Display',serif", fontWeight: 700, color: "#2E3D3F", marginBottom: 10 }}>{v.title}</h3>
                <p style={{ fontSize: "0.9rem", color: "#3D5254", lineHeight: 1.75, whiteSpace: "pre-line" }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SUSUNAN TIM ── */}
      <div style={{ padding: "80px 5%" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ fontSize: "0.6875rem", letterSpacing: "2px", color: "#8B6914", textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>Orang-Orang di Balik Layanan</div>
            <h2 className="display" style={{ fontSize: "clamp(1.75rem,4vw,2.75rem)", fontWeight: 900, color: "#2E3D3F" }}>Susunan Tim Kami</h2>
          </div>
          {(!teamMembers || teamMembers.length === 0) ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#5A6A6C" }}>Susunan tim belum diisi. Hubungi administrator.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 28 }}>
              {teamMembers.map((member, i) => (
                <div key={member.id || i} className="hover-lift" style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 4px 16px rgba(13,59,102,.08)", textAlign: "center", transition: "all .3s" }}>
                  {/* Photo */}
                  <div style={{ height: 220, overflow: "hidden", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 50%,#8B6914 100%)", position: "relative" }}>
                    {member.photo ? (
                      <img loading="lazy" src={member.photo} alt={member.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block", transition: "transform .4s ease" }}
                        onMouseEnter={e => e.target.style.transform = "scale(1.05)"}
                        onMouseLeave={e => e.target.style.transform = "scale(1)"}
                        onError={e => { e.target.style.display = "none"; e.target.parentNode.querySelector(".team-fallback").style.display = "flex"; }} />
                    ) : null}
                    <div className="team-fallback" style={{ position: "absolute", inset: 0, display: member.photo ? "none" : "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
                      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>👤</div>
                      <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,.5)", letterSpacing: "1px", textTransform: "uppercase" }}>No Photo</span>
                    </div>
                    {/* Name overlay at bottom */}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: "linear-gradient(to top, rgba(13,59,102,.75), transparent)", pointerEvents: "none" }} />
                  </div>
                  <div style={{ padding: "20px 20px 24px" }}>
                    <h3 style={{ fontSize: "1rem", fontFamily: "'Playfair Display',serif", fontWeight: 800, color: "#2E3D3F", marginBottom: 4 }}>{member.name}</h3>
                    <div style={{ fontSize: "0.8125rem", color: "#8B6914", fontWeight: 600, marginBottom: 12 }}>{member.role}</div>
                    {member.quotes && (
                      <p style={{ fontSize: "0.8125rem", color: "#5A6A6C", fontStyle: "italic", lineHeight: 1.65, whiteSpace: "pre-line" }}>"{member.quotes}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── LAYANAN KAMI ── */}
      <div style={{ padding: "80px 5%", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: "0.6875rem", letterSpacing: "3px", color: "#C9AA71", textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>LAYANAN KAMI</div>
            <h2 className="display" style={{ fontSize: "clamp(1.6rem,3.5vw,2.5rem)", fontWeight: 900, color: "#1a1a1a" }}>Layanan Terbaik Untuk Anda</h2>
          </div>

          {/* Cards Grid — 6 kolom sesuai referensi */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 20 }} className="layanan-grid">
            {[
              {
                icon: "🛋️",
                title: "Interior",
                desc: "Desain interior modern, nyaman dan fungsional sesuai kebutuhan Anda.",
                img: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80",
                slug: "interior"
              },
              {
                icon: "🏠",
                title: "Eksterior",
                desc: "Desain eksterior menarik, kokoh dan estetis.",
                img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
                slug: "eksterior"
              },
              {
                icon: "📐",
                title: "Desain & RAB",
                desc: "Desain arsitektur lengkap dengan RAB yang akurat.",
                img: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80",
                slug: "desain-rab"
              },
              {
                icon: "🌿",
                title: "Landscape",
                desc: "Taman indah dan asri yang menyatu dengan hunian Anda.",
                img: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=80",
                slug: "landscape"
              },
              {
                icon: "🪟",
                title: "Aluminium",
                desc: "Kusen, pintu & jendela aluminium berkualitas tinggi.",
                img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
                slug: "aluminium"
              },
              {
                icon: "🏗️",
                title: "Kanopi",
                desc: "Kanopi kuat, modern dan tahan segala cuaca.",
                img: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&q=80",
                slug: "kanopi"
              },
            ].map(s => (
              <div key={s.title}
                style={{ borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 18px rgba(0,0,0,.10)", background: "#fff", display: "flex", flexDirection: "column", transition: "transform .22s, box-shadow .22s", cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(0,0,0,.16)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,0,0,.10)"; }}>

                {/* Image area */}
                <div style={{ position: "relative", height: 170, overflow: "hidden", flexShrink: 0 }}>
                  <img
                    src={s.img}
                    alt={s.title}
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .4s" }}
                    onMouseEnter={e => e.target.style.transform = "scale(1.06)"}
                    onMouseLeave={e => e.target.style.transform = "scale(1)"}
                    onError={e => { e.target.parentElement.style.background = "#E8DCC8"; e.target.style.display = "none"; }}
                  />
                  {/* Icon circle overlapping bottom of image */}
                  <div style={{
                    position: "absolute", bottom: -22, left: "50%", transform: "translateX(-50%)",
                    width: 48, height: 48, borderRadius: "50%",
                    background: "linear-gradient(135deg,#2E3D3F 0%,#8B6914 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, boxShadow: "0 4px 14px rgba(0,0,0,.22)", border: "3px solid #fff"
                  }}>
                    {s.icon}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: "36px 18px 22px", textAlign: "center", display: "flex", flexDirection: "column", flex: 1 }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#1a1a1a", marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ fontSize: "0.82rem", color: "#5A6A6C", lineHeight: 1.6, marginBottom: 16, flex: 1 }}>{s.desc}</p>
                  <button
                    onClick={() => navigateTo("services")}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: "0.8125rem", fontWeight: 700, color: "#C9AA71",
                      display: "inline-flex", alignItems: "center", gap: 4,
                      transition: "gap .2s, color .2s", padding: 0, alignSelf: "center"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.gap = "8px"; e.currentTarget.style.color = "#8B6914"; }}
                    onMouseLeave={e => { e.currentTarget.style.gap = "4px"; e.currentTarget.style.color = "#C9AA71"; }}>
                    Selengkapnya <span>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Responsive style untuk layanan-grid */}
      <style>{`
        @media (max-width: 1100px) { .layanan-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (max-width: 720px)  { .layanan-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 480px)  { .layanan-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* ── CONTACT US ── */}
      <div style={{ background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", padding: "80px 5%" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ fontSize: "0.6875rem", letterSpacing: "2px", color: "rgba(255,255,255,.75)", textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>Hubungi Kami</div>
            <h2 className="display" style={{ fontSize: "clamp(1.75rem,4vw,2.75rem)", fontWeight: 900, color: "#fff" }}>Contact Us</h2>
            <p style={{ fontSize: "1rem", color: "rgba(255,255,255,.85)", marginTop: 12, maxWidth: 480, margin: "12px auto 0" }}>Siap membantu Anda merencanakan momen terbaik. Hubungi kami sekarang!</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 48 }} className="contact-grid">
            {/* Info kontak */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {[
                { icon: "📞", label: "Telepon / WhatsApp", value: content.phone, href: "#wa-picker", type: "link", onClick: (e) => { e.preventDefault(); if (onWaOpen) onWaOpen(); } },
                { icon: "✉️", label: "Email", value: content.email, href: `mailto:${content.email}`, type: "link" },
                { icon: "📍", label: "Alamat", value: content.address || "Malang, Jawa Timur, Indonesia", type: "text" },
                { icon: "🕐", label: "Jam Operasional", value: content.hours || "Senin – Sabtu: 08.00 – 20.00 WIB", type: "text" },
              ].map(info => (
                <div key={info.label} style={{ display: "flex", gap: 16, alignItems: "flex-start", background: "rgba(255,255,255,.7)", borderRadius: 10, padding: "18px 20px", backdropFilter: "blur(8px)" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{info.icon}</div>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "#5A6A6C", fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 4 }}>{info.label}</div>
                    {info.type === "link"
                      ? <a href={info.href} onClick={info.onClick} target={info.href.startsWith("https") ? "_blank" : "_self"} rel="noopener noreferrer" style={{ fontSize: "0.9375rem", color: "#8B6914", fontWeight: 600, textDecoration: "none" }}>{info.value}</a>
                      : <div style={{ fontSize: "0.9375rem", color: "#2E3D3F", fontWeight: 500 }}>{info.value}</div>
                    }
                  </div>
                </div>
              ))}

              {/* Social Media */}
              <div style={{ background: "rgba(255,255,255,.7)", borderRadius: 10, padding: "18px 20px", backdropFilter: "blur(8px)" }}>
                <div style={{ fontSize: "0.75rem", color: "#5A6A6C", fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 14 }}>Media Sosial</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {[
                    { label: "Instagram", icon: "📷", href: content.igLink || "https://instagram.com", color: "#e1306c" },
                    { label: "Facebook", icon: "📘", href: content.fbLink || "https://facebook.com", color: "#1877f2" },
                  ].map(s => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: s.color, color: "#fff", borderRadius: 20, fontSize: "0.8125rem", fontWeight: 600, textDecoration: "none", transition: "opacity .2s" }}
                      onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                      {s.icon} {s.label}
                    </a>
                  ))}
                  <button onClick={() => onWaOpen && onWaOpen()}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#25d366", color: "#fff", borderRadius: 20, fontSize: "0.8125rem", fontWeight: 600, border: "none", cursor: "pointer", transition: "opacity .2s" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                    💬 WhatsApp
                  </button>
                </div>
              </div>
            </div>

            {/* Form */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "36px 32px", boxShadow: "0 8px 40px rgba(46,61,63,.12)" }}>
              <h3 style={{ fontSize: "1.25rem", fontFamily: "'Playfair Display',serif", fontWeight: 800, color: "#2E3D3F", marginBottom: 24 }}>Kirim Pesan</h3>
              {contactSent ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
                  <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.25rem", color: "#27ae60", marginBottom: 8 }}>Pesan Terkirim!</h4>
                  <p style={{ color: "#3D5254", fontSize: "0.9rem" }}>Kami akan segera menghubungi Anda melalui WhatsApp.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#5A6A6C", textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: 6 }}>Nama *</label>
                      <input value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="Nama lengkap"
                        style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #D4C4A0", borderRadius: 8, fontSize: "0.9rem", outline: "none", transition: "border .2s" }}
                        onFocus={e => e.target.style.borderColor = "#8B6914"}
                        onBlur={e => e.target.style.borderColor = "#D4C4A0"} />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#5A6A6C", textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: 6 }}>No. HP</label>
                      <input value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="08xx-xxxx-xxxx"
                        style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #D4C4A0", borderRadius: 8, fontSize: "0.9rem", outline: "none", transition: "border .2s" }}
                        onFocus={e => e.target.style.borderColor = "#8B6914"}
                        onBlur={e => e.target.style.borderColor = "#D4C4A0"} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#5A6A6C", textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: 6 }}>Email</label>
                    <input value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="email@domain.com"
                      style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #D4C4A0", borderRadius: 8, fontSize: "0.9rem", outline: "none", transition: "border .2s" }}
                      onFocus={e => e.target.style.borderColor = "#8B6914"}
                      onBlur={e => e.target.style.borderColor = "#D4C4A0"} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#5A6A6C", textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: 6 }}>Keperluan</label>
                    <select value={contactForm.subject} onChange={e => setContactForm(p => ({ ...p, subject: e.target.value }))}
                      style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #D4C4A0", borderRadius: 8, fontSize: "0.9rem", outline: "none", background: "#fff", color: contactForm.subject ? "#2E3D3F" : "#7ab5cc" }}>
                      <option value="">-- Pilih keperluan --</option>
                      <option value="Gedung & Rumah">🏠 Gedung & Rumah</option>
                      <option value="Interior">🛋️ Interior</option>
                      <option value="Exterior">🔧 Exterior</option>
                      <option value="Konsultasi">💬 Konsultasi Umum</option>
                      <option value="Lainnya">📋 Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#5A6A6C", textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: 6 }}>Pesan *</label>
                    <textarea value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                      placeholder="Ceritakan kebutuhan Anda..."
                      rows={4}
                      style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #D4C4A0", borderRadius: 8, fontSize: "0.9rem", outline: "none", resize: "vertical", lineHeight: 1.65, transition: "border .2s" }}
                      onFocus={e => e.target.style.borderColor = "#8B6914"}
                      onBlur={e => e.target.style.borderColor = "#D4C4A0"} />
                  </div>
                  <button onClick={handleContactSubmit}
                    style={{ padding: "13px 28px", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", color: "#fff", border: "none", borderRadius: 8, fontSize: "0.875rem", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", cursor: "pointer", transition: "background .2s", display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#8B6914"}
                    onMouseLeave={e => e.currentTarget.style.background = "#2E3D3F"}>
                    💬 Kirim via WhatsApp
                  </button>
                  <p style={{ fontSize: "0.8rem", color: "#7ab5cc", textAlign: "center" }}>Pesan akan diteruskan ke WhatsApp kami untuk respons lebih cepat.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MAP LOKASI ── */}
      <div style={{ padding: "0" }}>
        <iframe
          title="Lokasi VASTURA GROUP"
          src="https://www.google.com/maps?q=Malang,Jawa+Timur,Indonesia&output=embed&z=12"
          width="100%" height="300"
          style={{ border: 0, display: "block" }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
/* ─────────────── TEAM ADMIN ─────────────── */
function TeamAdmin({ data, save, notify, uploadToCloudinary }) {
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const members = data.teamMembers || [];

  const openNew = () => { setForm({ id: Date.now(), name: "", role: "", quotes: "", photo: "" }); setEditId("new"); };
  const openEdit = (m) => { setForm({ ...m }); setEditId(m.id); };
  const cancelEdit = () => { setEditId(null); setForm({}); };

  const saveMember = () => {
    if (!form.name?.trim()) return notify("Nama anggota tim wajib diisi.", "error");
    const idx = members.findIndex(x => x.id === form.id);
    const updated = idx >= 0 ? members.map((x, i) => i === idx ? form : x) : [...members, form];
    save({ ...data, teamMembers: updated });
    cancelEdit();
    notify("Data tim berhasil disimpan!");
  };

  const deleteMember = (id) => {
    if (!window.confirm("Hapus anggota tim ini?")) return;
    save({ ...data, teamMembers: members.filter(x => x.id !== id) });
    notify("Anggota tim dihapus.");
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 500, color: "#2E3D3F" }}>👥 Susunan Tim</h1>
        {!editId && <button onClick={openNew} style={{ padding: "10px 20px", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Tambah Anggota</button>}
      </div>

      {/* Form Edit */}
      {editId && (
        <div style={{ background: "#fff", borderRadius: 12, padding: "28px", boxShadow: "0 4px 20px rgba(0,0,0,.08)", marginBottom: 28, borderTop: "4px solid #C9AA71" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#2E3D3F", marginBottom: 20 }}>{editId === "new" ? "➕ Tambah Anggota Tim" : "✏ Edit Anggota Tim"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            {[
              { label: "Nama *", key: "name", placeholder: "Budi Santoso" },
              { label: "Jabatan", key: "role", placeholder: "Wedding Coordinator" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>{f.label}</label>
                <input value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder} style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #D4C4A0", borderRadius: 6, fontSize: 13, outline: "none" }} />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>Quotes / Motto</label>
            <input value={form.quotes || ""} onChange={e => setForm(p => ({ ...p, quotes: e.target.value }))}
              placeholder="Setiap momen spesial layak dirayakan dengan sempurna."
              style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #D4C4A0", borderRadius: 6, fontSize: 13, outline: "none" }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>Foto</label>
            {form.photo && <img loading="lazy" src={form.photo} alt="preview" style={{ height: 80, width: 80, objectFit: "cover", borderRadius: "50%", marginBottom: 10, border: "2px solid #E8DCC8" }} />}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <UploadButton label="📁 Upload Foto Tim"
                onDone={urls => { setForm(p => ({ ...p, photo: urls[0] })); notify("Foto berhasil diupload!"); }}
                onError={msg => notify(msg, "error")} />
              <div style={{ fontSize: 11, color: "#7ab5cc", textAlign: "center" }}>— atau paste URL foto —</div>
              <input type="url" value={form.photo || ""} onChange={e => setForm(p => ({ ...p, photo: e.target.value }))}
                placeholder="https://..." style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #D4C4A0", borderRadius: 6, fontSize: 12, outline: "none" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={saveMember} style={{ padding: "10px 22px", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>💾 Simpan</button>
            <button onClick={cancelEdit} style={{ padding: "10px 18px", background: "#FAF7F0", color: "#5A6A6C", border: "1px solid #D4C4A0", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>Batal</button>
          </div>
        </div>
      )}

      {/* List */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
        {members.map(m => (
          <div key={m.id} style={{ background: "#fff", borderRadius: 12, padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,.06)", display: "flex", flexDirection: "column", gap: 12, alignItems: "center", textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", background: "#FAF7F0", border: "2px solid #E8DCC8", flexShrink: 0 }}>
              {m.photo ? <img loading="lazy" src={m.photo} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>👤</div>}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#2E3D3F", fontSize: 14 }}>{m.name}</div>
              <div style={{ fontSize: 12, color: "#8B6914", fontWeight: 600 }}>{m.role}</div>
              {m.quotes && <div style={{ fontSize: 11, color: "#5A6A6C", fontStyle: "italic", marginTop: 6, lineHeight: 1.5, whiteSpace: "pre-line" }}>"{m.quotes}"</div>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => openEdit(m)} style={{ padding: "6px 14px", background: "#FAF7F0", color: "#C9AA71", border: "1px solid #E8DCC8", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✏ Edit</button>
              <button onClick={() => deleteMember(m.id)} style={{ padding: "6px 14px", background: "#fee", color: "#e74c3c", border: "1px solid #fecaca", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🗑 Hapus</button>
            </div>
          </div>
        ))}
        {members.length === 0 && !editId && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0", color: "#5A6A6C" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <p>Belum ada anggota tim. Klik "+ Tambah Anggota" untuk mulai.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────── ADV SECTION (puzzle + quote slideshow) ─────────────── */
function AdvSection({ data, navigateTo }) {
  const [advQ, setAdvQ] = useState(0);
  const quotes = (data.content.advQuote || "").split(/\n+/).filter(Boolean);
  const safeQuotes = quotes.length ? quotes : [data.content.advQuote || ""];
  useEffect(() => {
    if (safeQuotes.length < 2) return;
    const t = setInterval(() => setAdvQ(q => (q + 1) % safeQuotes.length), 4000);
    return () => clearInterval(t);
  }, [safeQuotes.length]);
  const puzzleImgs = [
    data.images.gal[0] || data.images.hero[0],
    data.images.gal[1] || data.images.hero[1],
    data.images.gal[2] || data.images.hero[2],
    data.images.gal[3] || data.images.hero[3],
  ];
  return (
    <section className="section-md" style={{ background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", position: "relative", overflow: "hidden" }}>
      {/* Flare effects */}
      <div style={{ position: "absolute", top: "30%", right: "15%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(30,216,232,.32) 0%, transparent 70%)", pointerEvents: "none", filter: "blur(16px)" }} />
      <div style={{ position: "absolute", bottom: "10%", left: "5%", width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(14,165,197,.25) 0%, transparent 70%)", pointerEvents: "none", filter: "blur(20px)" }} />
      <div className="adv2-grid">
        {/* KIRI: Teks clean */}
        <div>
          <div className="adv2-eyebrow">
            <div className="line" />
            <span>{data.content.advSub || "TRAVEL & OUTDOOR RECREATION"}</span>
          </div>
          <h2 className="adv2-title">{data.content.advTitle}</h2>

          {/* Quote slideshow */}
          <div className="adv2-quote-wrap">
            <span className="adv2-quote-item active">{safeQuotes[advQ]}</span>
          </div>
          {safeQuotes.length > 1 && (
            <div className="adv2-quote-dots">
              {safeQuotes.map((_, i) => (
                <button key={i} className={`adv2-qdot${advQ === i ? " on" : ""}`} onClick={() => setAdvQ(i)} />
              ))}
            </div>
          )}

          <div className="adv2-stats">
            {[
              { num: "500+", lbl: "Event Sukses" },
              { num: "1200+", lbl: "Klien Puas" },
              { num: `${new Date().getFullYear() - parseInt(data.content.foundingYear || "2026") || 0}+`, lbl: "Tahun" },
            ].map(s => (
              <div key={s.lbl} className="adv2-stat">
                <div className="num">{s.num}</div>
                <div className="lbl">{s.lbl}</div>
              </div>
            ))}
          </div>

          <div className="adv2-btns">
            {[
              { label: "🏠 Desain Rumah", key: "desainrab" },
              { label: "🛋️ Interior", key: "interior" },
              { label: "🌳 Taman & Landscape", key: "landscape" },
            ].map(item => (
              <button key={item.key} className="adv2-btn-pill" onClick={() => navigateTo(item.key)}>
                {item.label}
              </button>
            ))}
          </div>

          <button className="adv2-cta" onClick={() => navigateTo("services")}>
            Layanan Kami
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>

        {/* KANAN: Puzzle grid gambar */}
        <div className="adv2-puzzle">
          <div className="adv2-puzzle-a">
            <img loading="lazy" src={puzzleImgs[0]} alt="Destinasi" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
          </div>
          <div className="adv2-puzzle-b">
            <img loading="lazy" src={puzzleImgs[1]} alt="Destinasi" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
          </div>
          <div className="adv2-puzzle-c">
            <div className="adv2-puzzle-c-sm">
              <img loading="lazy" src={puzzleImgs[2]} alt="Destinasi" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
            </div>
            <div className="adv2-puzzle-c-sm">
              <img loading="lazy" src={puzzleImgs[3]} alt="Destinasi" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── HOME INTRO SLIDESHOW (panel kiri beranda) ─────────────── */
function HomeIntroSlideshow({ data }) {
  // Hanya dari Foto Postingan Artikel (news + shop + destinations)
  const seen = new Set();
  const allImgs = [];
  const add = (src, label = "") => {
    if (src && typeof src === "string" && src.startsWith("http") && !seen.has(src)) {
      seen.add(src);
      allImgs.push({ src, label });
    }
  };

  // Foto Postingan Artikel — semua seksi
  ["news", "shop", "destinations"].forEach(sec => {
    (data.posts?.[sec] || []).forEach(p => {
      const firstImg = (p.content || []).find(b => b.type === "image" && b.value);
      add(firstImg?.value || p.coverImage, p.title);
    });
  });

  // Fallback ke hero images jika belum ada foto sama sekali
  if (allImgs.length === 0) {
    (data.images?.hero || []).forEach(src => add(src, "Hero"));
  }

  const [cur, setCur] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (allImgs.length <= 1) return;
    timerRef.current = setInterval(() => setCur(c => (c + 1) % allImgs.length), 3500);
    return () => clearInterval(timerRef.current);
  }, [allImgs.length]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 380, overflow: "hidden", background: "#2E3D3F" }}>
      <style>{`@keyframes introImgSlide { from { opacity:0; transform:scale(1.05); } to { opacity:1; transform:scale(1); } }`}</style>
      {allImgs.map((img, i) => (
        i === cur ? (
          <img key={i} src={img.src} alt={img.label}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", animation: "introImgSlide .7s cubic-bezier(.22,1,.36,1) both", zIndex: 1 }}
            onError={e => { e.target.style.opacity = "0"; }} />
        ) : null
      ))}
      {/* Counter */}
      <div style={{ position: "absolute", top: 12, right: 16, zIndex: 4, background: "rgba(0,0,0,.38)", backdropFilter: "blur(6px)", borderRadius: 20, padding: "3px 10px", fontSize: "0.625rem", color: "rgba(255,255,255,.8)", fontWeight: 600, letterSpacing: ".06em" }}>
        {String(cur + 1).padStart(2,"0")} / {String(allImgs.length).padStart(2,"0")}
      </div>
      {/* Dot indicators */}
      {allImgs.length > 1 && (
        <div style={{ position: "absolute", bottom: 48, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5, zIndex: 3, flexWrap: "wrap", justifyContent: "center", maxWidth: "80%" }}>
          {allImgs.slice(0, 12).map((_, i) => (
            <div key={i} onClick={() => setCur(i)}
              style={{ width: i === cur ? 16 : 5, height: 5, borderRadius: 3, background: i === cur ? "#E8C96A" : "rgba(255,255,255,.4)", cursor: "pointer", transition: "all .3s ease" }} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────── HERO SLIDESHOW ─────────────── */
/* ════════════════════════════════════════════════════════
   LENS FLARE EFFECT — interaktif mengikuti mouse
════════════════════════════════════════════════════════ */
function LensFlareEffect() {
  const canvasRef = useRef(null);
  const mouseRef  = useRef({ x: 0.5, y: 0.35 });
  const targetRef = useRef({ x: 0.5, y: 0.35 });
  const rafRef    = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      const cx = (e.clientX ?? e.touches?.[0]?.clientX) - r.left;
      const cy = (e.clientY ?? e.touches?.[0]?.clientY) - r.top;
      targetRef.current = { x: cx / r.width, y: cy / r.height };
    };
    canvas.parentElement.addEventListener("mousemove", onMove);
    canvas.parentElement.addEventListener("touchmove", onMove, { passive: true });

    const FLARES = [
      { offset: 0.0,  radius: 0.22, alpha: 0.55, color: [255,230,160] },
      { offset: 0.18, radius: 0.06, alpha: 0.35, color: [255,220,120] },
      { offset: 0.32, radius: 0.09, alpha: 0.22, color: [200,180,255] },
      { offset: 0.50, radius: 0.14, alpha: 0.18, color: [255,255,220] },
      { offset: 0.65, radius: 0.04, alpha: 0.45, color: [255,200,100] },
      { offset: 0.80, radius: 0.07, alpha: 0.20, color: [180,220,255] },
      { offset: 1.00, radius: 0.10, alpha: 0.15, color: [255,240,200] },
    ];

    const drawFlare = (cx, cy, r, alpha, color) => {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0,   `rgba(${color.join(",")},${alpha})`);
      g.addColorStop(0.4, `rgba(${color.join(",")},${alpha * 0.4})`);
      g.addColorStop(1,   `rgba(${color.join(",")},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawStreak = (sx, sy, ex, ey, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      const g = ctx.createLinearGradient(sx, sy, ex, ey);
      g.addColorStop(0,   "rgba(255,240,180,0)");
      g.addColorStop(0.5, "rgba(255,240,180,0.6)");
      g.addColorStop(1,   "rgba(255,240,180,0)");
      ctx.strokeStyle = g;
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.restore();
    };

    const loop = () => {
      const m = mouseRef.current;
      const t = targetRef.current;
      // ease lerp
      m.x += (t.x - m.x) * 0.06;
      m.y += (t.y - m.y) * 0.06;

      const w = canvas.width;
      const h = canvas.height;
      const ox = m.x * w;
      const oy = m.y * h;
      const cx2 = w / 2;
      const cy2 = h / 2;
      const dx  = cx2 - ox;
      const dy  = cy2 - oy;

      ctx.clearRect(0, 0, w, h);

      // streak line
      drawStreak(ox - dx * 1.8, oy - dy * 1.8, ox + dx * 1.8, oy + dy * 1.8, 0.18);

      FLARES.forEach(f => {
        const fx = ox + dx * f.offset * 2;
        const fy = oy + dy * f.offset * 2;
        const fr = f.radius * Math.min(w, h);
        drawFlare(fx, fy, fr, f.alpha, f.color);
      });

      // bright core
      drawFlare(ox, oy, Math.min(w, h) * 0.05, 0.9, [255, 255, 240]);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      canvas.parentElement?.removeEventListener("mousemove", onMove);
      canvas.parentElement?.removeEventListener("touchmove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        pointerEvents: "none",
        zIndex: 16,
        mixBlendMode: "screen",
      }}
    />
  );
}

/* ════════════════════════════════════════════════════════
   WATER DROPS EFFECT — tetesan air interaktif
════════════════════════════════════════════════════════ */
function WaterDropsEffect() {
  const canvasRef = useRef(null);
  const dropsRef  = useRef([]);
  const rafRef    = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    /* Spawn click/tap drop */
    const spawnDrop = (cx, cy) => {
      dropsRef.current.push({
        x: cx, y: cy,
        r: 0, maxR: 80 + Math.random() * 80,
        alpha: 0.7,
        speed: 1.4 + Math.random() * 1.2,
        ripples: [],
      });
    };

    const onClick = (e) => {
      const r = canvas.getBoundingClientRect();
      spawnDrop(
        (e.clientX ?? e.touches?.[0]?.clientX) - r.left,
        (e.clientY ?? e.touches?.[0]?.clientY) - r.top,
      );
    };
    canvas.parentElement.addEventListener("click",     onClick);
    canvas.parentElement.addEventListener("touchstart", onClick, { passive: true });

    /* Auto-spawn random drops */
    const autoSpawn = () => {
      if (dropsRef.current.length < 12) {
        const w = canvas.width;
        const h = canvas.height;
        spawnDrop(
          Math.random() * w,
          Math.random() * h * 0.7,
        );
      }
    };
    const autoTimer = setInterval(autoSpawn, 1200);

    const drawDrop = (d) => {
      if (d.alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = d.alpha;

      // outer ring
      ctx.strokeStyle = `rgba(180,220,255,${d.alpha})`;
      ctx.lineWidth   = 1.8;
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, d.r, d.r * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();

      // inner shimmer
      if (d.r > 10) {
        ctx.strokeStyle = `rgba(255,255,255,${d.alpha * 0.5})`;
        ctx.lineWidth   = 0.8;
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, d.r * 0.55, d.r * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // highlight dot at top
      const hg = ctx.createRadialGradient(d.x, d.y - d.r * 0.3, 0, d.x, d.y - d.r * 0.3, d.r * 0.18);
      hg.addColorStop(0, `rgba(255,255,255,${d.alpha * 0.9})`);
      hg.addColorStop(1, `rgba(255,255,255,0)`);
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.arc(d.x, d.y - d.r * 0.3, d.r * 0.18, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const loop = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      dropsRef.current = dropsRef.current.filter(d => d.alpha > 0.02);

      dropsRef.current.forEach(d => {
        d.r     += d.speed;
        d.alpha -= d.speed / d.maxR * 0.85;
        if (d.alpha < 0) d.alpha = 0;
        drawDrop(d);
      });

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(autoTimer);
      window.removeEventListener("resize", resize);
      canvas.parentElement?.removeEventListener("click",     onClick);
      canvas.parentElement?.removeEventListener("touchstart", onClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        pointerEvents: "none",
        zIndex: 17,
        mixBlendMode: "screen",
      }}
    />
  );
}

function HeroSlideshow({ data, navigateTo }) {
  const heroMode = data.content?.heroMode || "slideshow";

  // ── Compute slides — hanya dari Foto Postingan Artikel ──
  const slides = [];
  const seenSrc = new Set();
  const addSlide = (src, title, section, excerpt) => {
    if (!src || seenSrc.has(src)) return;
    seenSrc.add(src);
    slides.push({ src, title, section, excerpt: excerpt || "" });
  };

  // Foto Postingan Artikel — semua seksi
  ["news", "shop", "destinations"].forEach(sec => {
    (data.posts?.[sec] || []).filter(p => p.status === "published").forEach(p => {
      const firstImageBlock = (p.content || []).find(b => b.type === "image" && b.value);
      const src = firstImageBlock?.value || p.coverImage;
      addSlide(src, p.title, sec, p.excerpt || "");
    });
  });

  if (slides.length === 0) {
    (data.images?.hero || []).forEach(src => {
      addSlide(src, data.content.heroTitle, "home", data.content.heroSub);
    });
  }

  // ── ALL HOOKS must come before any conditional return (Rules of Hooks) ──
  const TRANSITIONS = ["fade", "slideLeft", "slideUp", "zoomIn", "zoomOut", "flipX"];
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(null);
  const [anim, setAnim] = useState("fade");
  const animatingRef = useRef(false);
  const timerRef = useRef(null);
  const currentRef = useRef(0);
  const slidesLenRef = useRef(slides.length);
  slidesLenRef.current = slides.length;

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    if (slidesLenRef.current < 2) return;
    timerRef.current = setInterval(() => {
      if (animatingRef.current) return;
      const randomAnim = TRANSITIONS[Math.floor(Math.random() * TRANSITIONS.length)];
      const nextIdx = (currentRef.current + 1) % slidesLenRef.current;
      setAnim(randomAnim);
      setPrev(currentRef.current);
      animatingRef.current = true;
      setTimeout(() => {
        setCurrent(nextIdx);
        currentRef.current = nextIdx;
        setPrev(null);
        animatingRef.current = false;
      }, 700);
    }, 4500);
  }, []);

  const goTo = useCallback((idx) => {
    if (animatingRef.current || slidesLenRef.current < 2) return;
    const randomAnim = TRANSITIONS[Math.floor(Math.random() * TRANSITIONS.length)];
    setAnim(randomAnim);
    setPrev(currentRef.current);
    animatingRef.current = true;
    setTimeout(() => {
      setCurrent(idx);
      currentRef.current = idx;
      setPrev(null);
      animatingRef.current = false;
      startTimer();
    }, 700);
  }, [startTimer]);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [startTimer, slides.length]);

  // ── Conditional renders AFTER all hooks ──

  // MODE STATIC: tampilkan satu gambar diam
  if (heroMode === "static") {
    const staticSrc = data.content?.heroStaticImage || (data.images?.hero?.[0] || "");
    return (
      <section style={{ position: "relative", width: "100%", height: "clamp(560px,88vh,800px)", overflow: "hidden", background: "#04080f" }}>
        {staticSrc && (
          <img src={staticSrc} alt="Hero" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,20,35,.35) 0%, rgba(10,20,35,.78) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6%", textAlign: "center" }}>
          <div style={{ maxWidth: 780 }}>
            <div style={{ display: "inline-block", background: "#e8a020", color: "#fff", fontSize: "0.6875rem", fontWeight: 800, letterSpacing: ".18em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 2, marginBottom: 18 }}>
              VASTURA GROUP
            </div>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.75rem,4.2vw,2.8rem)", fontWeight: 900, color: "#fff", lineHeight: 1.18, marginBottom: 18, textShadow: "0 2px 16px rgba(0,0,0,.5)" }}>
              {data.content?.heroTitle || "Travel & Relax"}
            </h1>
            {data.content?.heroSub && (
              <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,.82)", lineHeight: 1.8, marginBottom: 32 }}>
                {data.content.heroSub.length > 120 ? data.content.heroSub.slice(0, 120) + "…" : data.content.heroSub}
              </p>
            )}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              <button onClick={() => navigateTo("services")} style={{ padding: "13px 30px", background: "#e8a020", color: "#fff", border: "none", borderRadius: 3, fontSize: "0.8125rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer" }}>Read More →</button>
              <button onClick={() => navigateTo("about")} style={{ padding: "13px 30px", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", color: "#fff", border: "2px solid rgba(255,255,255,.55)", borderRadius: 3, fontSize: "0.8125rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer" }}>About Us →</button>
            </div>
          </div>
        </div>
        {/* Side gradients */}
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "18%", background: "linear-gradient(to right, rgba(4,8,15,.82) 0%, rgba(4,8,15,0) 100%)", zIndex: 15, pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "18%", background: "linear-gradient(to left, rgba(4,8,15,.82) 0%, rgba(4,8,15,0) 100%)", zIndex: 15, pointerEvents: "none" }} />
        <LensFlareEffect />
        <WaterDropsEffect />
      </section>
    );
  }

  // MODE SLIDESHOW
  if (slides.length === 0) return null;

  const SECTION_LABEL = { news: "Exterior", shop: "Gedung & Rumah", destinations: "Interior", home: "Gedung & Properti" };

  const getEnterStyle = (a) => {
    const base = { position: "absolute", inset: 0, transition: "all 0.7s cubic-bezier(.77,0,.18,1)", zIndex: 2 };
    if (!animating) return { ...base, opacity: 1, transform: "none" };
    const map = {
      fade:      { opacity: 0, transform: "none" },
      slideLeft: { opacity: 0, transform: "translateX(80px)" },
      slideUp:   { opacity: 0, transform: "translateY(60px)" },
      zoomIn:    { opacity: 0, transform: "scale(1.12)" },
      zoomOut:   { opacity: 0, transform: "scale(0.88)" },
      flipX:     { opacity: 0, transform: "perspective(900px) rotateY(25deg)" },
    };
    return { ...base, ...(map[a] || map.fade) };
  };

  const getExitStyle = (a) => {
    const base = { position: "absolute", inset: 0, transition: "all 0.7s cubic-bezier(.77,0,.18,1)", zIndex: 1 };
    const map = {
      fade:      { opacity: 0 },
      slideLeft: { opacity: 0, transform: "translateX(-80px)" },
      slideUp:   { opacity: 0, transform: "translateY(-60px)" },
      zoomIn:    { opacity: 0, transform: "scale(0.88)" },
      zoomOut:   { opacity: 0, transform: "scale(1.12)" },
      flipX:     { opacity: 0, transform: "perspective(900px) rotateY(-25deg)" },
    };
    return { ...base, ...(map[a] || { opacity: 0 }) };
  };

  const sl = slides[current];
  const prevSl = prev !== null ? slides[prev] : null;
  const animating = prev !== null; // derived — true selama transisi berlangsung

  return (
    <section style={{ position: "relative", width: "100%", height: "clamp(560px,88vh,800px)", overflow: "hidden", background: "#04080f" }}>
      <style>{`
        @keyframes heroTxtIn { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:none; } }
        @keyframes heroDotPulse { 0%,100%{transform:scale(1);opacity:.8;} 50%{transform:scale(1.3);opacity:1;} }
        @keyframes vertigoZoom { 0%{transform:scale(1.0);} 100%{transform:scale(1.08);} }
        @keyframes vertigoZoomOut { 0%{transform:scale(1.08);} 100%{transform:scale(1.0);} }
        .hero-slide-img-idle { animation: vertigoZoom 5s ease-in-out infinite alternate; transform-origin: center center; }
        .hero-slide-img-exit { animation: vertigoZoomOut 0.7s cubic-bezier(.77,0,.18,1) forwards; }
        .hero-slide-img-enter { animation: vertigoZoom 5s ease-in-out infinite alternate; }
        .hero-cta-btn { transition: all .22s !important; }
        .hero-cta-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 24px rgba(0,0,0,.35) !important; }
        .hero-dot { transition: all .3s; cursor: pointer; }
        .hero-dot:hover { transform: scale(1.3); }
        .hero-arrow { transition: all .2s; cursor: pointer; background: rgba(255,255,255,.12); border: 1.5px solid rgba(255,255,255,.25); color: #fff; border-radius: 50%; width: 44px; height: 44px; display:flex; align-items:center; justify-content:center; font-size:18px; }
        .hero-arrow:hover { background: rgba(255,255,255,.28); }
      `}</style>

      {/* SLIDES */}
      <div style={{ position: "absolute", inset: 0 }}>
        {/* Prev slide (exit) */}
        {animating && prevSl && (
          <div style={getExitStyle(anim)}>
            <img loading="lazy" src={prevSl.src} alt="" className="hero-slide-img-exit" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,20,35,.5) 0%, rgba(10,20,35,.75) 100%)" }} />
          </div>
        )}
        {/* Current slide (enter) */}
        <div style={getEnterStyle(anim)}>
          <img loading="lazy" src={sl.src} alt={sl.title} className="hero-slide-img-idle" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,20,35,.35) 0%, rgba(10,20,35,.78) 100%)" }} />
        </div>
      </div>

      {/* CONTENT OVERLAY — rata tengah */}
      <div style={{ position: "relative", zIndex: 10, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6%", textAlign: "center" }}>
        <div style={{ maxWidth: 780, animation: animating ? "none" : "heroTxtIn .6s ease both" }} key={current}>
          {/* Label */}
          <div style={{ display: "inline-block", background: "#e8a020", color: "#fff", fontSize: "0.6875rem", fontWeight: 800, letterSpacing: ".18em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 2, marginBottom: 18 }}>
            {SECTION_LABEL[sl.section] || "VASTURA GROUP"}
          </div>
          {/* Title — max 2 baris, potong sisanya */}
          <h1 style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: "clamp(1.75rem,4.2vw,2.8rem)",
            fontWeight: 900,
            color: "#fff",
            lineHeight: 1.18,
            marginBottom: 18,
            textShadow: "0 2px 16px rgba(0,0,0,.5)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {sl.title}
          </h1>
          {/* Excerpt */}
          {sl.excerpt && (
            <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,.82)", lineHeight: 1.8, marginBottom: 32, whiteSpace: "pre-line" }}>
              {sl.excerpt.length > 120 ? sl.excerpt.slice(0, 120) + "…" : sl.excerpt}
            </p>
          )}
          {/* CTA Buttons — centered */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <button className="hero-cta-btn" onClick={() => navigateTo("services")}
              style={{ padding: "13px 30px", background: "#e8a020", color: "#fff", border: "none", borderRadius: 3, fontSize: "0.8125rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer" }}>
              Read More →
            </button>
            <button className="hero-cta-btn" onClick={() => navigateTo("about")}
              style={{ padding: "13px 30px", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", color: "#fff", border: "2px solid rgba(255,255,255,.55)", borderRadius: 3, fontSize: "0.8125rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer" }}>
              About Us →
            </button>
          </div>
        </div>
      </div>

      {/* ══ LENS FLARE EFFECT ══ */}
      <LensFlareEffect />

      {/* ══ WATER DROPS EFFECT ══ */}
      <WaterDropsEffect />

      {/* Side gradient overlays — solid edge, fade to center */}
      <div className="hero-side-grad" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "18%", background: "linear-gradient(to right, rgba(4,8,15,.82) 0%, rgba(4,8,15,.45) 50%, rgba(4,8,15,0) 100%)", zIndex: 15, pointerEvents: "none" }} />
      <div className="hero-side-grad" style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "18%", background: "linear-gradient(to left, rgba(4,8,15,.82) 0%, rgba(4,8,15,.45) 50%, rgba(4,8,15,0) 100%)", zIndex: 15, pointerEvents: "none" }} />

      {/* ARROWS */}
      <button className="hero-arrow" onClick={() => goTo((current - 1 + slides.length) % slides.length)}
        style={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", zIndex: 20, background: "rgba(255,255,255,.12)", border: "1.5px solid rgba(255,255,255,.25)", color: "#fff", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer", transition: "all .2s" }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.28)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.12)"}>‹</button>
      <button className="hero-arrow" onClick={() => goTo((current + 1) % slides.length)}
        style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", zIndex: 20, background: "rgba(255,255,255,.12)", border: "1.5px solid rgba(255,255,255,.25)", color: "#fff", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer", transition: "all .2s" }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.28)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.12)"}>›</button>

      {/* DOTS */}
      <div style={{ position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)", zIndex: 20, display: "flex", gap: 8, alignItems: "center" }}>
        {slides.map((_, i) => (
          <div key={i} className="hero-dot" onClick={() => goTo(i)}
            style={{ width: i === current ? 28 : 10, height: 10, borderRadius: 5, background: i === current ? "#e8a020" : "rgba(255,255,255,.45)", transition: "all .3s" }} />
        ))}
      </div>

      {/* Slide counter */}
      <div style={{ position: "absolute", bottom: 22, right: "5%", zIndex: 20, fontSize: "0.75rem", color: "rgba(255,255,255,.5)", fontWeight: 600, letterSpacing: ".06em" }}>
        {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
      </div>
    </section>
  );
}

/* ─────────────── REVIEW FORM (Public, One-Time Token) ─────────────── */
function ReviewForm({ token, onSubmitDone, data, save, notify, isLoading }) {
  const [step, setStep] = useState("form"); // form | done | invalid
  const [form, setForm] = useState({ name: "", email: "", stars: 5, content: "", photo: "" });
  const [photoUploading, setPhotoUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  // ⚠ Must be declared here (before any early return) to obey Rules of Hooks
  const [photoUploadItem, setPhotoUploadItem] = useState(null); // {name, pct, done, error}

  // Tunggu data selesai load dari Firestore sebelum validasi token
  if (isLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#FAF7F0,#F5EDD8)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 56, height: 56, border: "4px solid #E8DCC8", borderTopColor: "#8B6914", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 20px" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "#5A6A6C", fontSize: "0.9375rem", fontWeight: 500 }}>Memuat form ulasan…</p>
      </div>
    </div>
  );

  const tokenObj = (data.reviewTokens || []).find(t => t.token === token);

  if (!tokenObj) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF7F0" }}>
      <div style={{ textAlign: "center", background: "#fff", borderRadius: 16, padding: "48px 40px", maxWidth: 400, boxShadow: "0 8px 40px rgba(0,0,0,.1)" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.5rem", color: "#2E3D3F", marginBottom: 12 }}>Link Tidak Valid</h2>
        <p style={{ color: "#5A6A6C", fontSize: "0.9375rem", lineHeight: 1.7 }}>Link form ulasan ini tidak ditemukan atau sudah tidak berlaku.</p>
      </div>
    </div>
  );

  if (tokenObj.used) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF7F0" }}>
      <div style={{ textAlign: "center", background: "#fff", borderRadius: 16, padding: "48px 40px", maxWidth: 400, boxShadow: "0 8px 40px rgba(0,0,0,.1)" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>⏰</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.5rem", color: "#2E3D3F", marginBottom: 12 }}>Link Sudah Digunakan</h2>
        <p style={{ color: "#5A6A6C", fontSize: "0.9375rem", lineHeight: 1.7 }}>Form ulasan ini sudah pernah diisi. Setiap link hanya bisa digunakan satu kali.</p>
      </div>
    </div>
  );

  if (step === "done") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#FAF7F0,#F5EDD8)" }}>
      <div style={{ textAlign: "center", background: "#fff", borderRadius: 20, padding: "56px 48px", maxWidth: 440, boxShadow: "0 16px 56px rgba(46,61,63,.12)" }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.875rem", fontWeight: 900, color: "#2E3D3F", marginBottom: 14 }}>Terima Kasih!</h2>
        <p style={{ color: "#3D5254", fontSize: "1rem", lineHeight: 1.8 }}>Ulasan Anda telah berhasil dikirim. Kami sangat menghargai kepercayaan Anda kepada VASTURA GROUP.</p>
        <div style={{ width: 48, height: 3, background: "#8B6914", borderRadius: 2, margin: "28px auto 0" }} />
      </div>
    </div>
  );

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setPhotoUploading(true);
    setPhotoUploadItem({ name: file.name, pct: 0, done: false, error: false });
    try {
      const url = await uploadWithProgress(file, pct => setPhotoUploadItem(p => ({ ...p, pct })));
      setPhotoUploadItem({ name: file.name, pct: 100, done: true, error: false });
      setForm(p => ({ ...p, photo: url }));
      setTimeout(() => setPhotoUploadItem(null), 2000);
    } catch {
      setPhotoUploadItem(p => ({ ...p, error: true }));
      setErr("Gagal upload foto. Coba lagi.");
      setTimeout(() => setPhotoUploadItem(null), 2000);
    }
    finally { setPhotoUploading(false); }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return setErr("Nama wajib diisi.");
    if (!form.email.trim() || !form.email.includes("@")) return setErr("Email tidak valid.");
    if (!form.content.trim()) return setErr("Isi ulasan wajib diisi.");
    setSubmitting(true);
    setErr("");
    try {
      const newReview = {
        id: Date.now().toString(),
        name: form.name.trim(),
        email: form.email.trim(),
        photo: form.photo,
        stars: form.stars,
        content: form.content.trim(),
        date: new Date().toISOString().slice(0, 10),
        tokenLabel: tokenObj.label || "",
        approved: false,
      };
      const updatedTokens = (data.reviewTokens || []).map(t =>
        t.token === token ? { ...t, used: true } : t
      );
      await save({ ...data, reviews: [...(data.reviews || []), newReview], reviewTokens: updatedTokens });
      setStep("done");
    } catch { setErr("Gagal menyimpan ulasan. Coba lagi."); }
    finally { setSubmitting(false); }
  };

  const content_data = data.content;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#FAF7F0 0%,#e8f0f8 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 5%" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "48px 44px", maxWidth: 520, width: "100%", boxShadow: "0 16px 56px rgba(46,61,63,.12)" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 50%,#8B6914 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>⭐</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.75rem", fontWeight: 900, color: "#2E3D3F", marginBottom: 8 }}>Berikan Ulasan Anda</h1>
          <p style={{ color: "#5A6A6C", fontSize: "0.9375rem", lineHeight: 1.6 }}>Bagikan pengalaman Anda bersama {content_data.logoText?.replace("\n"," ") || "VASTURA GROUP"}</p>
          {tokenObj.label && <div style={{ marginTop: 10, display: "inline-block", background: "#FAF7F0", border: "1px solid #A89070", color: "#8B6914", fontSize: "0.75rem", fontWeight: 600, padding: "4px 14px", borderRadius: 20 }}>{tokenObj.label}</div>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Photo Upload */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#5A6A6C", letterSpacing: ".08em", textTransform: "uppercase" }}>Foto Profil (Opsional)</label>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: form.photo ? "transparent" : "linear-gradient(135deg,#E8DCC8,#E8DCC8)", border: "2px solid #E8DCC8", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {form.photo ? <img loading="lazy" src={form.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 24 }}>👤</span>}
              </div>
              <div style={{ flex: 1 }}>
                <input type="file" accept="image/*" onChange={e => handlePhotoUpload(e.target.files?.[0])}
                  disabled={photoUploading}
                  style={{ fontSize: "0.8125rem", color: "#3D5254", width: "100%", cursor: photoUploading ? "not-allowed" : "pointer" }} />
                {photoUploadItem && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: photoUploadItem.error ? "#e74c3c" : "#2E3D3F", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {photoUploadItem.error ? "❌ " : photoUploadItem.done ? "✅ " : "📤 "}{photoUploadItem.name}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: photoUploadItem.error ? "#e74c3c" : photoUploadItem.done ? "#27ae60" : "#8B6914" }}>
                        {photoUploadItem.error ? "Gagal" : photoUploadItem.done ? "Selesai" : `${photoUploadItem.pct}%`}
                      </span>
                    </div>
                    <div style={{ height: 5, background: "#E8DCC8", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 3, width: `${photoUploadItem.pct}%`,
                        background: photoUploadItem.error ? "#e74c3c" : photoUploadItem.done ? "#27ae60" : "linear-gradient(90deg,#8B6914,#E8C96A)",
                        transition: "width .2s ease" }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#5A6A6C", letterSpacing: ".08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Nama Lengkap *</label>
            <input value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErr(""); }}
              placeholder="Masukkan nama Anda"
              style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #D4C4A0", borderRadius: 8, fontSize: "0.9375rem", outline: "none", transition: "border-color .2s" }}
              onFocus={e => e.target.style.borderColor = "#8B6914"} onBlur={e => e.target.style.borderColor = "#D4C4A0"} />
          </div>

          {/* Email */}
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#5A6A6C", letterSpacing: ".08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Email *</label>
            <input type="email" value={form.email} onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setErr(""); }}
              placeholder="email@contoh.com"
              style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #D4C4A0", borderRadius: 8, fontSize: "0.9375rem", outline: "none", transition: "border-color .2s" }}
              onFocus={e => e.target.style.borderColor = "#8B6914"} onBlur={e => e.target.style.borderColor = "#D4C4A0"} />
          </div>

          {/* Stars */}
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#5A6A6C", letterSpacing: ".08em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>Rating *</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setForm(p => ({ ...p, stars: s }))}
                  style={{ fontSize: 32, background: "none", border: "none", cursor: "pointer", transition: "transform .15s", filter: s <= form.stars ? "none" : "grayscale(1) opacity(.3)" }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.2)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>⭐</button>
              ))}
              <span style={{ fontSize: "0.875rem", color: "#5A6A6C", alignSelf: "center", marginLeft: 6 }}>
                {["","Sangat Buruk","Buruk","Cukup","Bagus","Sangat Bagus"][form.stars]}
              </span>
            </div>
          </div>

          {/* Review Content */}
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#5A6A6C", letterSpacing: ".08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Isi Ulasan *</label>
            <textarea value={form.content} onChange={e => { setForm(p => ({ ...p, content: e.target.value })); setErr(""); }}
              placeholder="Ceritakan pengalaman Anda bersama kami..."
              rows={5}
              style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #D4C4A0", borderRadius: 8, fontSize: "0.9375rem", outline: "none", resize: "vertical", lineHeight: 1.7, transition: "border-color .2s" }}
              onFocus={e => e.target.style.borderColor = "#8B6914"} onBlur={e => e.target.style.borderColor = "#D4C4A0"} />
          </div>

          {err && <div style={{ background: "#fef0f0", border: "1px solid #f5c6c6", borderRadius: 8, padding: "10px 14px", color: "#c0392b", fontSize: "0.875rem" }}>{err}</div>}

          <button onClick={handleSubmit} disabled={submitting || photoUploading}
            style={{ padding: "14px", background: submitting ? "#5A6A6C" : "linear-gradient(135deg,#2E3D3F,#8B6914)", color: "#fff", border: "none", borderRadius: 10, fontSize: "0.9375rem", fontWeight: 700, letterSpacing: ".05em", cursor: submitting ? "not-allowed" : "pointer", transition: "opacity .2s" }}>
            {submitting ? "⏳ Mengirim..." : "✨ Kirim Ulasan"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── REVIEW SLIDESHOW (Home Page) ─────────────── */
function ReviewSlideshow({ reviews }) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  const total = reviews.length;

  useEffect(() => {
    if (total < 2 || isPaused) return;
    intervalRef.current = setInterval(() => {
      setCurrent(p => (p + 1) % total);
    }, 4000);
    return () => clearInterval(intervalRef.current);
  }, [total, isPaused]);

  if (total === 0) return null;

  // Build visible indices: 6 cards centered around current
  // [-2, -1, 0, 1, 2, 3] offsets from current — we show 6 cards
  // Cards at positions -2 and 3 are faded (gradient edges)
  const getOffset = (offset) => ((current + offset % total + total * 4) % total);

  const cardData = total === 1
    ? [{ review: reviews[0], pos: 0, opacity: 1, scale: 1, blur: 0, fade: false }]
    : total <= 3
    ? reviews.map((r, i) => {
        const dist = Math.min(Math.abs(i - current), total - Math.abs(i - current));
        return { review: r, pos: i - current, opacity: dist === 0 ? 1 : 0.6, scale: dist === 0 ? 1 : 0.93, blur: 0, fade: dist > 1 };
      }).filter(x => !x.fade)
    : (() => {
        // 6 positions: offsets -2,-1,0,1,2,3 but visual slots 0..5
        const slots = [-2, -1, 0, 1, 2, 3];
        return slots.map((offset, slotIdx) => {
          const ridx = getOffset(offset);
          const isFade = slotIdx === 0 || slotIdx === 5;
          const isEdge = slotIdx === 1 || slotIdx === 4;
          return {
            review: reviews[ridx],
            slotIdx,
            opacity: isFade ? 0.15 : isEdge ? 0.65 : 1,
            scale: isFade ? 0.88 : isEdge ? 0.94 : 1,
            fade: isFade,
          };
        });
      })();

  return (
    <section style={{ padding: "80px 0 72px", background: "linear-gradient(130deg,#084060 0%,#0a6ea0 50%,#0cb5cc 100%)", overflow: "hidden" }}>
      <style>{`
        @keyframes reviewIn { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:none; } }
        .rev-card { transition: transform .5s cubic-bezier(.22,1,.36,1), opacity .5s ease, box-shadow .3s; }
        .rev-card:hover { transform: translateY(-6px) !important; box-shadow: 0 20px 48px rgba(46,61,63,.14) !important; }
      `}</style>

      {/* Section Header */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "20%", right: "8%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(30,216,232,.28) 0%, transparent 65%)", filter: "blur(22px)" }} />
        <div style={{ position: "absolute", top: "50%", left: "3%", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(14,165,197,.2) 0%, transparent 65%)", filter: "blur(26px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,.04) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      </div>
      <div style={{ textAlign: "center", marginBottom: 52, padding: "0 5%", position: "relative", zIndex: 1 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 32, height: 1.5, background: "#C9AA71" }} />
          <span style={{ fontSize: "0.6875rem", letterSpacing: "3px", color: "rgba(255,255,255,.7)", textTransform: "uppercase", fontWeight: 700 }}>Testimoni Klien</span>
          <div style={{ width: 32, height: 1.5, background: "#C9AA71" }} />
        </div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.75rem,4vw,2.75rem)", fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>
          Apa Kata Mereka?
        </h2>
        <p style={{ fontSize: "1rem", color: "rgba(255,255,255,.72)", marginTop: 12, maxWidth: 440, margin: "12px auto 0", lineHeight: 1.7 }}>
          Kepuasan klien adalah prioritas utama kami di setiap layanan.
        </p>
      </div>

      {/* Stars rating summary */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        {(() => {
          const avg = reviews.reduce((s, r) => s + (r.stars || 5), 0) / reviews.length;
          return (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 40, padding: "10px 24px", backdropFilter: "blur(8px)", boxShadow: "0 4px 16px rgba(0,0,0,.2)" }}>
              <span style={{ fontSize: "1.5rem", fontWeight: 900, fontFamily: "'Playfair Display',serif", color: "#fff" }}>{avg.toFixed(1)}</span>
              <div style={{ display: "flex", gap: 2 }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 16, filter: s <= Math.round(avg) ? "none" : "grayscale(1) opacity(.3)" }}>⭐</span>)}
              </div>
              <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,.7)", fontWeight: 500 }}>{reviews.length} ulasan</span>
            </div>
          );
        })()}
      </div>

      {/* Cards Container */}
      <div style={{ position: "relative", width: "100%", overflow: "visible" }}
        onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>

        {/* 6-card row */}
        {total >= 4 ? (
          <div style={{ display: "flex", justifyContent: "center", gap: 16, padding: "20px 0", position: "relative" }}>
            {cardData.map(({ review, slotIdx, opacity, scale, fade }) => (
              <div key={`${slotIdx}-${review.id}`} className="rev-card"
                style={{
                  width: "calc(14% + 20px)", minWidth: 180, maxWidth: 240,
                  flexShrink: 0, opacity, transform: `scale(${scale})`,
                  pointerEvents: fade ? "none" : "auto",
                  position: "relative",
                }}>
                {/* Gradient mask for edge cards */}
                {fade && (
                  <div style={{ position: "absolute", inset: 0, zIndex: 2, borderRadius: 16,
                    background: slotIdx === 0
                      ? "linear-gradient(to right, rgba(244,249,251,1) 0%, rgba(244,249,251,0) 100%)"
                      : "linear-gradient(to left, rgba(244,249,251,1) 0%, rgba(244,249,251,0) 100%)",
                    pointerEvents: "none" }} />
                )}
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        ) : (
          /* Fewer cards: centered layout */
          <div style={{ display: "flex", justifyContent: "center", gap: 20, padding: "20px 5%", flexWrap: "wrap" }}>
            {reviews.map((review, i) => (
              <div key={review.id} className="rev-card"
                style={{ width: 280, flexShrink: 0, opacity: i === current ? 1 : 0.6, transform: i === current ? "scale(1)" : "scale(0.95)" }}>
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        )}

        {/* Navigation Arrows */}
        {total > 1 && (
          <>
            <button onClick={() => { setCurrent(p => (p - 1 + total) % total); }}
              style={{ position: "absolute", left: "2%", top: "50%", transform: "translateY(-50%)", zIndex: 10, width: 44, height: 44, borderRadius: "50%", background: "#fff", border: "1.5px solid #E8DCC8", boxShadow: "0 4px 16px rgba(13,59,102,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#2E3D3F", cursor: "pointer", transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#2E3D3F"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#2E3D3F"; }}>‹</button>
            <button onClick={() => { setCurrent(p => (p + 1) % total); }}
              style={{ position: "absolute", right: "2%", top: "50%", transform: "translateY(-50%)", zIndex: 10, width: 44, height: 44, borderRadius: "50%", background: "#fff", border: "1.5px solid #E8DCC8", boxShadow: "0 4px 16px rgba(13,59,102,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#2E3D3F", cursor: "pointer", transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#2E3D3F"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#2E3D3F"; }}>›</button>
          </>
        )}
      </div>

      {/* Dots */}
      {total > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 28 }}>
          {reviews.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              style={{ width: i === current ? 24 : 8, height: 8, borderRadius: 4, background: i === current ? "#C9AA71" : "rgba(255,255,255,.3)", border: "none", cursor: "pointer", transition: "all .3s", padding: 0 }} />
          ))}
        </div>
      )}
    </section>
  );
}

function ReviewCard({ review }) {
  const stars = review.stars || 5;
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "28px 24px", boxShadow: "0 4px 24px rgba(13,59,102,.08)", border: "1px solid #F5EDD8", height: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Stars */}
      <div style={{ display: "flex", gap: 3 }}>
        {[1,2,3,4,5].map(s => (
          <span key={s} style={{ fontSize: 14, filter: s <= stars ? "none" : "grayscale(1) opacity(.25)" }}>⭐</span>
        ))}
      </div>
      {/* Quote */}
      <p style={{ fontSize: "0.9rem", color: "#2E3D3F", lineHeight: 1.75, fontStyle: "italic", fontFamily: "'Cormorant Garamond',serif", flex: 1, whiteSpace: "pre-line" }}>
        "{review.content?.length > 180 ? review.content.slice(0, 180) + "…" : review.content}"
      </p>
      {/* Author */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 12, borderTop: "1px solid #f0f4f8" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 50%,#8B6914 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          {review.photo
            ? <img loading="lazy" src={review.photo} alt={review.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>{review.name?.charAt(0)?.toUpperCase() || "?"}</span>
          }
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#2E3D3F", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{review.name}</div>
          <div style={{ fontSize: "0.75rem", color: "#5A6A6C" }}>{review.date}</div>
        </div>
        {review.tokenLabel && (
          <div style={{ marginLeft: "auto", fontSize: "0.625rem", background: "#FAF7F0", color: "#8B6914", padding: "2px 8px", borderRadius: 10, fontWeight: 600, flexShrink: 0, maxWidth: 80, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{review.tokenLabel}</div>
        )}
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════
   SUB LAYANAN ADMIN — Universal CRUD + Gambar + Teks Setting
   Dipakai oleh: Home, LayananKami, DesainRab, TemaRumah,
                 Interior, Pagar, Kanopi, Aluminium, Landscape
   ══════════════════════════════════════════════════════════ */
function SubLayananAdmin({
  title, icon, accentColor = "#8B6914",
  storeKey, data, save, notify, uploadToCloudinary,
  pageDesc,
  sections = [],          // [{key,label,type}]
  imageGroups = [],       // [{key,label,count,desc}]
  crudKey,                // key di data untuk array items
  crudLabel,              // judul tabel CRUD
  crudFields = [],        // [{key,label,type,placeholder}]
  crudHasImage = false,
  defaultItems = null,    // data hardcoded untuk seed ke Firestore
}) {
  /* ── state teks / konten ── */
  const initContent = {};
  sections.forEach(s => { initContent[s.key] = (data.content?.[s.key] || ""); });
  const [contentForm, setContentForm] = useState(initContent);
  const [savingContent, setSavingContent] = useState(false);

  /* ── state gambar ── */
  const [imgUploading, setImgUploading] = useState({});
  const [imgUrls, setImgUrls] = useState(() => {
    const o = {};
    imageGroups.forEach(g => {
      for (let i = 0; i < g.count; i++) {
        const k = `${g.key}_${i}`;
        o[k] = data.content?.[k] || "";
      }
    });
    return o;
  });

  /* ── state CRUD items ── */
  const items = data[crudKey] || [];
  const emptyItem = () => {
    const o = {};
    crudFields.forEach(f => { o[f.key] = ""; });
    if (crudHasImage) o._img = "";
    return o;
  };
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(emptyItem());
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(emptyItem());
  const [crudImgUploading, setCrudImgUploading] = useState(false);
  const [addImgUploading, setAddImgUploading] = useState(false);
  const [delConfirm, setDelConfirm] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [seedConfirm, setSeedConfirm] = useState(false);

  /* ── seed dari data hardcoded ── */
  const handleSeedDefault = async () => {
    if (!defaultItems || defaultItems.length === 0) return;
    setSeeding(true);
    try {
      // Generic: ambil semua key dari item defaultItems, pastikan ada id
      const seeded = defaultItems.map((item, i) => ({
        ...item,
        id: item.id ? item.id.toString() : (Date.now() + i).toString(),
      }));
      await save({ ...data, [crudKey]: seeded });
      notify("✅ Data hardcoded berhasil dimuat ke Firestore!");
      setSeedConfirm(false);
    } catch { notify("❌ Gagal memuat data default."); }
    setSeeding(false);
  };

  /* ── helpers ── */
  const accent = accentColor;
  const btnBase = { border: "none", borderRadius: 6, padding: "9px 18px", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" };

  /* ── save konten teks ── */
  const handleSaveContent = async () => {
    setSavingContent(true);
    try {
      await save({ ...data, content: { ...(data.content || {}), ...contentForm, ...imgUrls } });
      notify("✅ Konten teks berhasil disimpan!");
    } catch { notify("❌ Gagal menyimpan konten."); }
    setSavingContent(false);
  };

  /* ── upload gambar section ── */
  const handleImgUpload = async (groupKey, idx, file) => {
    if (!file) return;
    const k = `${groupKey}_${idx}`;
    setImgUploading(p => ({ ...p, [k]: true }));
    try {
      const url = await uploadToCloudinary(file);
      const newImgUrls = { ...imgUrls, [k]: url };
      setImgUrls(newImgUrls);
      await save({ ...data, content: { ...(data.content || {}), ...contentForm, ...newImgUrls } });
      notify("✅ Gambar berhasil diupload!");
    } catch { notify("❌ Gagal upload gambar."); }
    setImgUploading(p => ({ ...p, [k]: false }));
  };

  const handleImgUrlChange = (groupKey, idx, val) => {
    const k = `${groupKey}_${idx}`;
    setImgUrls(p => ({ ...p, [k]: val }));
  };

  /* ── CRUD helpers ── */
  const handleSaveEdit = async () => {
    const updated = items.map(it => it.id === editId ? { ...it, ...editForm } : it);
    try {
      await save({ ...data, [crudKey]: updated });
      notify("✅ Item berhasil diperbarui!");
      setEditId(null);
    } catch { notify("❌ Gagal menyimpan."); }
  };

  const handleAdd = async () => {
    const newItem = { ...addForm, id: Date.now().toString() };
    try {
      await save({ ...data, [crudKey]: [...items, newItem] });
      notify("✅ Item berhasil ditambahkan!");
      setAddForm(emptyItem());
      setShowAdd(false);
    } catch { notify("❌ Gagal menambahkan item."); }
  };

  const handleDelete = async (id) => {
    try {
      await save({ ...data, [crudKey]: items.filter(it => it.id !== id) });
      notify("✅ Item dihapus.");
      setDelConfirm(null);
    } catch { notify("❌ Gagal menghapus."); }
  };

  const handleCrudImgUpload = async (file, isAdd = false) => {
    if (!file) return;
    if (isAdd) setAddImgUploading(true); else setCrudImgUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      if (isAdd) setAddForm(p => ({ ...p, _img: url }));
      else setEditForm(p => ({ ...p, _img: url }));
      notify("✅ Gambar item diupload!");
    } catch { notify("❌ Gagal upload gambar item."); }
    if (isAdd) setAddImgUploading(false); else setCrudImgUploading(false);
  };

  /* ── render field helper ── */
  const renderField = (f, form, setForm, prefix = "") => (
    <div key={prefix + f.key} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#5A6A6C", textTransform: "uppercase", letterSpacing: ".06em" }}>{f.label}</label>
      {f.type === "textarea"
        ? <textarea value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
            placeholder={f.placeholder || ""}
            rows={3} style={{ padding: "9px 12px", border: "1.5px solid #D5C9B0", borderRadius: 6, fontSize: "0.875rem", color: "#2E3D3F", resize: "vertical", fontFamily: "inherit" }} />
        : <input type="text" value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
            placeholder={f.placeholder || ""}
            style={{ padding: "9px 12px", border: "1.5px solid #D5C9B0", borderRadius: 6, fontSize: "0.875rem", color: "#2E3D3F" }} />
      }
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, padding: "4px 0" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(120deg, ${accent}18 0%, #ffffff 100%)`, border: `1.5px solid ${accent}30`, borderRadius: 14, padding: "22px 28px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, background: accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>{icon}</div>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.35rem", fontWeight: 900, color: "#2E3D3F", margin: 0 }}>{title}</h2>
          {pageDesc && <p style={{ color: "#5A6A6C", fontSize: "0.85rem", margin: "4px 0 0", lineHeight: 1.5 }}>{pageDesc}</p>}
        </div>
      </div>

      {/* ── SEKSI 1: Konten Teks ── */}
      {sections.length > 0 && (
        <div style={{ background: "#fff", border: "1.5px solid #E8DCC8", borderRadius: 14, padding: "24px 28px" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 800, color: accent, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 20, paddingBottom: 12, borderBottom: `2px solid ${accent}25` }}>
            📝 Konten Teks
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {sections.map(s => renderField(s, contentForm, setContentForm, "ct_"))}
          </div>
          <button onClick={handleSaveContent} disabled={savingContent}
            style={{ ...btnBase, marginTop: 20, background: accent, color: "#fff", opacity: savingContent ? 0.6 : 1 }}>
            {savingContent ? "Menyimpan…" : "💾 Simpan Konten Teks"}
          </button>
        </div>
      )}

      {/* ── SEKSI 2: Upload Gambar ── */}
      {imageGroups.length > 0 && (
        <div style={{ background: "#fff", border: "1.5px solid #E8DCC8", borderRadius: 14, padding: "24px 28px" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 800, color: accent, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 20, paddingBottom: 12, borderBottom: `2px solid ${accent}25` }}>
            🖼 Upload Gambar
          </h3>
          {imageGroups.map(g => (
            <div key={g.key} style={{ marginBottom: 28 }}>
              <div style={{ marginBottom: 10 }}>
                <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#2E3D3F" }}>{g.label}</span>
                {g.desc && <span style={{ color: "#5A6A6C", fontSize: "0.8rem", marginLeft: 10 }}>{g.desc}</span>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14 }}>
                {Array.from({ length: g.count }).map((_, i) => {
                  const k = `${g.key}_${i}`;
                  const isLoading = imgUploading[k];
                  const url = imgUrls[k];
                  return (
                    <div key={k} style={{ border: "1.5px dashed #C9AA71", borderRadius: 10, padding: 10, background: "#FAF7F0", display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                      {url
                        ? <img src={url} alt="" style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 7, border: "1px solid #E8DCC8" }} />
                        : <div style={{ width: "100%", height: 100, background: "#E8DCC8", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", color: "#A89070", fontSize: "0.8rem" }}>Belum ada gambar</div>
                      }
                      <span style={{ fontSize: "0.7rem", color: "#A89070", fontWeight: 600 }}>Foto {i + 1}</span>
                      <label style={{ cursor: "pointer", width: "100%" }}>
                        <div style={{ background: isLoading ? "#ccc" : accent, color: "#fff", borderRadius: 6, padding: "6px 10px", textAlign: "center", fontSize: "0.75rem", fontWeight: 700, pointerEvents: isLoading ? "none" : "auto" }}>
                          {isLoading ? "⏳ Uploading…" : "📁 Upload"}
                        </div>
                        <input type="file" accept="image/*" style={{ display: "none" }} disabled={isLoading}
                          onChange={e => handleImgUpload(g.key, i, e.target.files?.[0])} />
                      </label>
                      <input type="text" placeholder="atau tempel URL…" value={url}
                        onChange={e => handleImgUrlChange(g.key, i, e.target.value)}
                        style={{ width: "100%", padding: "5px 8px", border: "1px solid #D5C9B0", borderRadius: 5, fontSize: "0.72rem", color: "#3D5254", boxSizing: "border-box" }} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <button onClick={handleSaveContent} disabled={savingContent}
            style={{ ...btnBase, background: accent, color: "#fff", opacity: savingContent ? 0.6 : 1 }}>
            {savingContent ? "Menyimpan…" : "💾 Simpan Semua Gambar"}
          </button>
        </div>
      )}

      {/* ── SEKSI 3: CRUD Items (jika ada crudKey) ── */}
      {crudKey && (
        <div style={{ background: "#fff", border: "1.5px solid #E8DCC8", borderRadius: 14, padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingBottom: 12, borderBottom: `2px solid ${accent}25`, flexWrap: "wrap", gap: 10 }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 800, color: accent, textTransform: "uppercase", letterSpacing: ".1em", margin: 0 }}>
              📋 {crudLabel || "Daftar Item"}
            </h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {defaultItems && defaultItems.length > 0 && items.length === 0 && !seedConfirm && (
                <button onClick={() => setSeedConfirm(true)}
                  style={{ ...btnBase, background: "#f39c12", color: "#fff", padding: "8px 16px", fontSize: "0.8rem" }}>
                  📥 Muat Data Hardcoded
                </button>
              )}
              {defaultItems && defaultItems.length > 0 && items.length > 0 && !seedConfirm && (
                <button onClick={() => setSeedConfirm(true)}
                  style={{ ...btnBase, background: "#e67e22", color: "#fff", padding: "8px 14px", fontSize: "0.75rem", opacity: 0.85 }}>
                  🔄 Reset ke Default
                </button>
              )}
              <button onClick={() => { setShowAdd(true); setAddForm(emptyItem()); }}
                style={{ ...btnBase, background: accent, color: "#fff", padding: "8px 16px", fontSize: "0.8rem" }}>
                + Tambah Item
              </button>
            </div>
          </div>

          {/* Konfirmasi seed */}
          {seedConfirm && (
            <div style={{ background: "#fff8e1", border: "1.5px solid #f39c12", borderRadius: 10, padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.85rem", color: "#8B6914", fontWeight: 600 }}>
                {items.length > 0
                  ? "⚠️ Ini akan mengganti semua item saat ini dengan data hardcoded. Lanjutkan?"
                  : "📥 Muat data hardcoded ke Firestore? Data akan tersimpan dan bisa diedit."}
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleSeedDefault} disabled={seeding}
                  style={{ ...btnBase, background: "#f39c12", color: "#fff", padding: "6px 16px", fontSize: "0.8rem", opacity: seeding ? 0.6 : 1 }}>
                  {seeding ? "⏳ Memuat…" : "Ya, Muat"}
                </button>
                <button onClick={() => setSeedConfirm(false)}
                  style={{ ...btnBase, background: "#E8DCC8", color: "#5A6A6C", padding: "6px 14px", fontSize: "0.8rem" }}>
                  Batal
                </button>
              </div>
            </div>
          )}

          {/* Form Tambah */}
          {showAdd && (
            <div style={{ background: `${accent}10`, border: `1.5px solid ${accent}40`, borderRadius: 10, padding: "18px 20px", marginBottom: 20 }}>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 800, color: accent, marginBottom: 14 }}>➕ Tambah Item Baru</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {crudFields.map(f => renderField(f, addForm, setAddForm, "add_"))}
                {crudHasImage && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#5A6A6C", textTransform: "uppercase", letterSpacing: ".06em" }}>Gambar Item</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {addForm._img && <img src={addForm._img} alt="" style={{ width: 72, height: 56, objectFit: "cover", borderRadius: 7, border: "1px solid #E8DCC8" }} />}
                      <label style={{ cursor: "pointer" }}>
                        <div style={{ background: addImgUploading ? "#ccc" : accent, color: "#fff", borderRadius: 6, padding: "7px 14px", fontSize: "0.78rem", fontWeight: 700 }}>
                          {addImgUploading ? "⏳ Uploading…" : "📁 Upload Gambar"}
                        </div>
                        <input type="file" accept="image/*" style={{ display: "none" }} disabled={addImgUploading}
                          onChange={e => handleCrudImgUpload(e.target.files?.[0], true)} />
                      </label>
                      <input type="text" placeholder="atau URL gambar…" value={addForm._img || ""}
                        onChange={e => setAddForm(p => ({ ...p, _img: e.target.value }))}
                        style={{ flex: 1, padding: "7px 10px", border: "1px solid #D5C9B0", borderRadius: 6, fontSize: "0.8rem" }} />
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button onClick={handleAdd} style={{ ...btnBase, background: "#27ae60", color: "#fff" }}>✅ Simpan</button>
                <button onClick={() => setShowAdd(false)} style={{ ...btnBase, background: "#E8DCC8", color: "#5A6A6C" }}>Batal</button>
              </div>
            </div>
          )}

          {/* Tabel Items */}
          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#A89070", fontSize: "0.875rem" }}>
              {defaultItems && defaultItems.length > 0
                ? <>Belum ada item. Klik <strong>&#34;📥 Muat Data Hardcoded&#34;</strong> untuk mengimpor data yang sudah ada di halaman, atau klik &#34;+ Tambah Item&#34; untuk menambahkan manual.</>
                : <>Belum ada item. Klik &#34;+ Tambah Item&#34; untuk menambahkan.</>}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {items.map((item, idx) => (
                <div key={item.id || idx} style={{ border: "1.5px solid #E8DCC8", borderRadius: 10, overflow: "hidden" }}>
                  {/* Item header row */}
                  <div style={{ background: "#FAF7F0", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    {item._img && <img src={item._img} alt="" style={{ width: 52, height: 42, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, color: "#2E3D3F", fontSize: "0.875rem" }}>{item.nama || item[crudFields[0]?.key] || `Item ${idx + 1}`}</div>
                      {item.harga && <div style={{ fontSize: "0.78rem", color: "#8B6914", fontWeight: 600 }}>{item.harga}</div>}
                      {item.tagline && <div style={{ fontSize: "0.78rem", color: "#5A6A6C" }}>{item.tagline}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button onClick={() => { setEditId(item.id); setEditForm({ ...item }); }}
                        style={{ ...btnBase, background: accent, color: "#fff", padding: "6px 14px", fontSize: "0.78rem" }}>✏️ Edit</button>
                      <button onClick={() => setDelConfirm(item.id)}
                        style={{ ...btnBase, background: "#e74c3c", color: "#fff", padding: "6px 14px", fontSize: "0.78rem" }}>🗑 Hapus</button>
                    </div>
                  </div>

                  {/* Konfirmasi hapus */}
                  {delConfirm === item.id && (
                    <div style={{ background: "#fff5f5", padding: "10px 16px", borderTop: "1px solid #fcc", display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: "0.83rem", color: "#c0392b", fontWeight: 600 }}>Yakin hapus item ini?</span>
                      <button onClick={() => handleDelete(item.id)} style={{ ...btnBase, background: "#e74c3c", color: "#fff", padding: "5px 14px", fontSize: "0.78rem" }}>Ya, Hapus</button>
                      <button onClick={() => setDelConfirm(null)} style={{ ...btnBase, background: "#E8DCC8", color: "#5A6A6C", padding: "5px 14px", fontSize: "0.78rem" }}>Batal</button>
                    </div>
                  )}

                  {/* Form Edit inline */}
                  {editId === item.id && (
                    <div style={{ padding: "16px 18px", borderTop: "1.5px solid #E8DCC8", background: "#fff" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {crudFields.map(f => renderField(f, editForm, setEditForm, "ed_"))}
                        {crudHasImage && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#5A6A6C", textTransform: "uppercase", letterSpacing: ".06em" }}>Gambar Item</label>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              {editForm._img && <img src={editForm._img} alt="" style={{ width: 72, height: 56, objectFit: "cover", borderRadius: 7, border: "1px solid #E8DCC8" }} />}
                              <label style={{ cursor: "pointer" }}>
                                <div style={{ background: crudImgUploading ? "#ccc" : accent, color: "#fff", borderRadius: 6, padding: "7px 14px", fontSize: "0.78rem", fontWeight: 700 }}>
                                  {crudImgUploading ? "⏳ Uploading…" : "📁 Ganti Gambar"}
                                </div>
                                <input type="file" accept="image/*" style={{ display: "none" }} disabled={crudImgUploading}
                                  onChange={e => handleCrudImgUpload(e.target.files?.[0], false)} />
                              </label>
                              <input type="text" placeholder="atau URL gambar…" value={editForm._img || ""}
                                onChange={e => setEditForm(p => ({ ...p, _img: e.target.value }))}
                                style={{ flex: 1, padding: "7px 10px", border: "1px solid #D5C9B0", borderRadius: 6, fontSize: "0.8rem" }} />
                            </div>
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                        <button onClick={handleSaveEdit} style={{ ...btnBase, background: "#27ae60", color: "#fff" }}>✅ Simpan Perubahan</button>
                        <button onClick={() => setEditId(null)} style={{ ...btnBase, background: "#E8DCC8", color: "#5A6A6C" }}>Batal</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────── ADMIN REVIEWS COMPONENT ─────────────── */
function AdminReviews({ data, save, notify }) {
  const reviews = data.reviews || [];
  const tokens = data.reviewTokens || [];
  const [editReviewId, setEditReviewId] = useState(null);
  const [editReviewForm, setEditReviewForm] = useState({});
  const [newTokenLabel, setNewTokenLabel] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");

  const generateToken = () => {
    // ID berurut berdasarkan jumlah token yang sudah ada
    const nextId = (tokens.length + 1).toString().padStart(3, "0");
    const token = nextId; // token = ID singkat, e.g. "001", "002"
    const label = newTokenLabel.trim() || "Tamu";
    const newToken = { id: Date.now().toString(), token, label, used: false, createdAt: new Date().toISOString().slice(0,10) };
    save({ ...data, reviewTokens: [...tokens, newToken] });
    const link = `${window.location.origin}/UlasanPelayanan/${token}`;
    setGeneratedLink(link);
    setNewTokenLabel("");
    notify("✅ Link ulasan berhasil dibuat!");
  };

  const deleteToken = (id) => {
    save({ ...data, reviewTokens: tokens.filter(t => t.id !== id) });
    notify("Token dihapus.");
  };

  const deleteReview = (id) => {
    save({ ...data, reviews: reviews.filter(r => r.id !== id) });
    notify("Ulasan dihapus.");
  };

  const approveReview = (id) => {
    save({ ...data, reviews: reviews.map(r => r.id === id ? { ...r, approved: true } : r) });
    notify("✅ Ulasan disetujui dan ditampilkan ke publik.");
  };

  const rejectReview = (id) => {
    save({ ...data, reviews: reviews.map(r => r.id === id ? { ...r, approved: false } : r) });
    notify("Ulasan disembunyikan dari publik.");
  };

  const startEditReview = (r) => {
    setEditReviewId(r.id);
    setEditReviewForm({ name: r.name, content: r.content, stars: r.stars });
  };

  const saveEditReview = () => {
    save({ ...data, reviews: reviews.map(r => r.id === editReviewId ? { ...r, ...editReviewForm } : r) });
    setEditReviewId(null);
    notify("Ulasan diperbarui.");
  };

  return (
  <div className="fade-in">
    <h1 style={{ fontSize: 24, fontWeight: 500, color: "#2E3D3F", marginBottom: 28 }}>⭐ Kelola Ulasan</h1>

    {/* Generate Review Link */}
    <div style={{ background: "#fff", borderRadius: 8, padding: "22px 24px", marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,.06)", borderTop: "4px solid #C9AA71" }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: "#2E3D3F", marginBottom: 6 }}>🔗 Buat Link Form Ulasan</h3>
      <p style={{ fontSize: 12, color: "#5A6A6C", marginBottom: 16, lineHeight: 1.6 }}>
        Buat link sekali pakai untuk dikirimkan ke klien. Link hanya bisa digunakan satu kali — setelah diisi, link akan hangus otomatis.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <input value={newTokenLabel} onChange={e => setNewTokenLabel(e.target.value)}
          placeholder="Label (misal: Klien Wedding Budi, opsional)"
          style={{ flex: 1, minWidth: 240, padding: "9px 12px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 13, outline: "none" }} />
        <button onClick={generateToken}
          style={{ padding: "9px 18px", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", color: "#fff", borderRadius: 6, fontSize: 13, border: "none", fontWeight: 600, whiteSpace: "nowrap" }}>
          + Buat Link
        </button>
      </div>
      {generatedLink && (
        <div style={{ background: "#FAF7F0", border: "1px solid #A89070", borderRadius: 8, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#8B6914", marginBottom: 4, letterSpacing: ".05em", textTransform: "uppercase" }}>Link Form Ulasan Terbaru</div>
            <code style={{ fontSize: 12, color: "#2E3D3F", wordBreak: "break-all", display: "block" }}>{generatedLink}</code>
          </div>
          <button onClick={() => { navigator.clipboard?.writeText(generatedLink); notify("Link disalin!"); }}
            style={{ padding: "7px 14px", background: "#8B6914", color: "#fff", borderRadius: 6, fontSize: 12, border: "none", fontWeight: 600, flexShrink: 0 }}>
            📋 Salin
          </button>
        </div>
      )}
    </div>

    {/* Active Tokens */}
    <div style={{ background: "#fff", borderRadius: 8, padding: "22px 24px", marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: "#2E3D3F", marginBottom: 14 }}>🔑 Token Aktif ({tokens.filter(t => !t.used).length})</h3>
      {tokens.length === 0 ? (
        <p style={{ fontSize: 13, color: "#5A6A6C" }}>Belum ada token dibuat.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tokens.slice().reverse().map(tok => (
            <div key={tok.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: tok.used ? "#f9f9f9" : "#FAF7F0", borderRadius: 8, border: `1px solid ${tok.used ? "#e8e8e8" : "#A89070"}` }}>
              <span style={{ fontSize: 16 }}>{tok.used ? "✅" : "🔑"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#2E3D3F" }}>{tok.label || "—"}</div>
                <div style={{ fontSize: 11, color: "#5A6A6C", fontFamily: "monospace", wordBreak: "break-all" }}>/UlasanPelayanan/{tok.token}</div>
                <div style={{ fontSize: 11, color: "#5A6A6C" }}>Dibuat: {tok.createdAt} · {tok.used ? "Sudah digunakan" : "Belum digunakan"}</div>
              </div>
              {!tok.used && (
                <button onClick={() => { const l = `${window.location.origin}/UlasanPelayanan/${tok.token}`; navigator.clipboard?.writeText(l); notify("Link disalin!"); }}
                  style={{ padding: "5px 10px", background: "#C9AA71", color: "#fff", borderRadius: 5, fontSize: 11, border: "none" }}>📋</button>
              )}
              <button onClick={() => deleteToken(tok.id)}
                style={{ padding: "5px 10px", background: "#fee", color: "#e74c3c", borderRadius: 5, fontSize: 11, border: "none" }}>Hapus</button>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Reviews List */}
    <div style={{ background: "#fff", borderRadius: 8, padding: "22px 24px", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: "#2E3D3F", marginBottom: 14 }}>
        💬 Ulasan Masuk ({reviews.length})
        {reviews.filter(r => !r.approved).length > 0 && (
          <span style={{ marginLeft: 8, background: "#e74c3c", color: "#fff", borderRadius: 10, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
            {reviews.filter(r => !r.approved).length} pending
          </span>
        )}
      </h3>
      {reviews.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px", color: "#5A6A6C", fontSize: 13 }}>Belum ada ulasan masuk. Buat link dan kirimkan ke klien!</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {reviews.slice().reverse().map(r => (
            <div key={r.id} style={{ border: "1px solid #F5EDD8", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 20px" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 50%,#8B6914 100%)", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18 }}>
                  {r.photo ? <img loading="lazy" src={r.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : r.name?.charAt(0)?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#2E3D3F" }}>{r.name}</span>
                    <span style={{ fontSize: 12, color: "#5A6A6C" }}>{r.email}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8,
                      background: r.approved ? "#e8f8ef" : "#fff8e1",
                      color: r.approved ? "#27ae60" : "#f39c12",
                      border: `1px solid ${r.approved ? "#27ae60" : "#f39c12"}40`
                    }}>
                      {r.approved ? "✓ Tayang" : "⏳ Pending"}
                    </span>
                    <span style={{ marginLeft: "auto", fontSize: 12, color: "#5A6A6C" }}>{r.date}</span>
                  </div>
                  <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
                    {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 13, filter: s <= r.stars ? "none" : "grayscale(1) opacity(.3)" }}>⭐</span>)}
                  </div>
                  {editReviewId === r.id ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <input value={editReviewForm.name} onChange={e => setEditReviewForm(p => ({ ...p, name: e.target.value }))}
                        style={{ padding: "7px 10px", border: "1px solid #D4C4A0", borderRadius: 5, fontSize: 13 }} placeholder="Nama" />
                      <div style={{ display: "flex", gap: 4 }}>
                        {[1,2,3,4,5].map(s => (
                          <button key={s} onClick={() => setEditReviewForm(p => ({ ...p, stars: s }))}
                            style={{ fontSize: 18, background: "none", border: "none", cursor: "pointer", filter: s <= editReviewForm.stars ? "none" : "grayscale(1) opacity(.3)" }}>⭐</button>
                        ))}
                      </div>
                      <textarea value={editReviewForm.content} onChange={e => setEditReviewForm(p => ({ ...p, content: e.target.value }))}
                        rows={3} style={{ padding: "7px 10px", border: "1px solid #D4C4A0", borderRadius: 5, fontSize: 13, resize: "vertical" }} />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={saveEditReview} style={{ padding: "6px 16px", background: "#27ae60", color: "#fff", borderRadius: 5, fontSize: 12, border: "none" }}>Simpan</button>
                        <button onClick={() => setEditReviewId(null)} style={{ padding: "6px 14px", background: "#FAF7F0", color: "#5A6A6C", borderRadius: 5, fontSize: 12, border: "1px solid #D4C4A0" }}>Batal</button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: "#2E3D3F", lineHeight: 1.7, fontStyle: "italic", whiteSpace: "pre-line" }}>"{r.content}"</p>
                  )}
                  {r.tokenLabel && <div style={{ marginTop: 6, fontSize: 11, color: "#8B6914", fontWeight: 500 }}>🏷 {r.tokenLabel}</div>}
                </div>
              </div>
              {editReviewId !== r.id && (
                <div style={{ padding: "10px 20px", background: "#FDFAF4", borderTop: "1px solid #f0f4f8", display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {r.approved ? (
                    <button onClick={() => rejectReview(r.id)} style={{ padding: "5px 14px", background: "#fff8e1", color: "#f39c12", borderRadius: 5, fontSize: 12, border: "1px solid #f39c1240", fontWeight: 500 }}>👁 Sembunyikan</button>
                  ) : (
                    <button onClick={() => approveReview(r.id)} style={{ padding: "5px 14px", background: "#e8f8ef", color: "#27ae60", borderRadius: 5, fontSize: 12, border: "1px solid #27ae6040", fontWeight: 600 }}>✅ Setujui & Tayangkan</button>
                  )}
                  <button onClick={() => startEditReview(r)} style={{ padding: "5px 14px", background: "#F5EDD8", color: "#8B6914", borderRadius: 5, fontSize: 12, border: "none", fontWeight: 500 }}>✏ Edit</button>
                  <button onClick={() => { if (window.confirm("Hapus ulasan ini?")) deleteReview(r.id); }} style={{ padding: "5px 14px", background: "#fee", color: "#e74c3c", borderRadius: 5, fontSize: 12, border: "none" }}>🗑 Hapus</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);
}

// ─── Session persistence (sessionStorage) ──────────────────────────
// Sesi bertahan saat reload, tapi otomatis bersih saat browser ditutup
const SESSION_KEY = import.meta.env.VITE_SESSION_KEY || "re_session";
const sessionSave = (u) => {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(u)); } catch {}
};
const sessionLoad = () => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};
const sessionClear = () => {
  try { sessionStorage.removeItem(SESSION_KEY); } catch {}
};

/* ── Mapping URL pathname ↔ page key ─────────────────────────────────────── */
const PAGE_TO_PATH = {
  home: "/", about: "/about", news: "/portfolio", shop: "/renovasi-rumah-subsidi",
  destinations: "/wedding-organizer", services: "/layanan",
  desainrab: "/jasa-desain-rab",
  temarumah: "/tema-rumah",
  interior: "/interior",
  pagar: "/pagar-rumah",
  kanopi: "/kanopi",
  aluminium: "/aluminium",
  landscape: "/landscape-taman",
  /* Sub-halaman Interior */
  "interior/kamar-tidur":    "/interior/kamar-tidur",
  "interior/kamar-mandi":    "/interior/kamar-mandi",
  "interior/ruang-keluarga": "/interior/ruang-keluarga",
  "interior/ruang-tamu":     "/interior/ruang-tamu",
  "interior/kitchen-set":    "/interior/kitchen-set",
  "interior/ruang-kerja":    "/interior/ruang-kerja",
  /* Sub-halaman Eksterior */
  "eksterior/pagar":         "/eksterior/pagar",
  "eksterior/kanopi":        "/eksterior/kanopi",
  "eksterior/aluminium":     "/eksterior/aluminium",
  "eksterior/taman-landscape":"/eksterior/taman-landscape",
};
const PATH_TO_PAGE = Object.fromEntries(Object.entries(PAGE_TO_PATH).map(([k, v]) => [v, k]));

/* ── URL helper functions ─────────────────────────────────────────────────── */

/** Slug generator dari teks judul */
const makeSlug = (s) => String(s || "").toLowerCase()
  .replace(/[àáâãäå]/g, "a").replace(/[èéêë]/g, "e")
  .replace(/[ìíîï]/g, "i").replace(/[òóôõö]/g, "o")
  .replace(/[ùúûü]/g, "u")
  .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/**
 * URL canonical untuk artikel:
 * /artikel/{section}/{slug}-{id}
 */
const articleUrl = (post) => {
  const slug = post.slug || makeSlug(post.title);
  return `/artikel/${post.section || "news"}/${slug}-${post.id}`;
};

/**
 * URL canonical untuk paket layanan:
 * /services/{category}/{nama-paket}/{id}
 */
const paketUrl = (svc) => {
  const slug = makeSlug(svc.title);
  return `/services/${svc.category || "event"}/${slug}/${svc.id}`;
};

/** Parse URL /artikel/{section}/{slug}-{id} → { section, slug, id } atau null */
const parseArtikelPath = (path) => {
  const m = path.match(/^\/artikel\/([^/]+)\/(.+)-(\d+)$/);
  if (!m) return null;
  return { section: m[1], slug: m[2], id: Number(m[3]) };
};

/** Parse URL /services/{category}/{slug}/{id} → { category, slug, id } atau null */
const parsePaketPath = (path) => {
  const m = path.match(/^\/services\/([^/]+)\/([^/]+)\/(\d+)$/);
  if (!m) return null;
  return { category: m[1], slug: m[2], id: Number(m[3]) };
};

/** Baca halaman awal dari URL saat render — bukan saat module load. */
const getInitialPage = () => {
  const p = window.location.pathname;
  if (PATH_TO_PAGE[p]) return PATH_TO_PAGE[p];
  // Sub-route interior/*  dan eksterior/*
  if (p.startsWith("/interior/")) return p.replace("/","");
  if (p.startsWith("/eksterior/")) return p.replace("/","");
  // URL paket → langsung mount ServicesPage (activePaket sudah di-init dari URL)
  if (parsePaketPath(p)) return "services";
  // URL artikel → mount section yang sesuai (readPost di-resolve setelah data load)
  const art = parseArtikelPath(p);
  if (art) return { news: "news", shop: "shop", destinations: "destinations" }[art.section] || "news";
  return "home";
};

// Restore showAdmin state dari URL: /control-panel → true
const getInitialShowAdmin = () => {
  return window.location.pathname === "/control-panel";
};

/* ─────────────── REUSABLE SERVICE PAGE TEMPLATE ─────────────── */
function DevServicePage({ pageKey, title, subtitle, icon, heroColor, sections, ctaText, onWaOpen }) {
  const waText = { key: "layanan", vars: { judul_layanan: title } };
  return (
    <div style={{ paddingTop: 72, minHeight: "100vh", background: "#f8fbfd" }}>
      {/* Hero Banner */}
      <div style={{
        background: heroColor || "linear-gradient(135deg,#2E3D3F 0%,#3D5254 50%,#B8962A 100%)",
        padding: "64px 5% 56px", textAlign: "center", position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.08, backgroundImage: "radial-gradient(circle at 20% 50%, #fff 0%, transparent 50%), radial-gradient(circle at 80% 20%, #fff 0%, transparent 40%)" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 800, margin: "0 auto" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: 16 }}>{icon}</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 900, color: "#fff", marginBottom: 16, lineHeight: 1.2 }}>{title}</h1>
          <p style={{ fontSize: "clamp(0.9rem,2vw,1.1rem)", color: "rgba(255,255,255,.85)", lineHeight: 1.7, maxWidth: 600, margin: "0 auto 28px" }}>{subtitle}</p>
          <button onClick={() => onWaOpen && onWaOpen(waText)}
            style={{ padding: "13px 32px", background: "#e8a020", color: "#fff", border: "none", borderRadius: 4, fontSize: "0.875rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,.25)" }}>
            {ctaText || "Konsultasi Gratis →"}
          </button>
        </div>
      </div>

      {/* Content Sections */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 5%" }}>
        {sections.map((sec, i) => (
          <div key={i} style={{ marginBottom: 56 }}>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
              <div style={{ width: 4, height: 40, background: "linear-gradient(180deg,#8B6914,#B8962A)", borderRadius: 4, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "0.7rem", letterSpacing: ".14em", textTransform: "uppercase", color: "#8B6914", fontWeight: 700, marginBottom: 4 }}>{sec.tag || `Layanan ${String(i+1).padStart(2,"0")}`}</div>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.25rem,3vw,1.75rem)", fontWeight: 900, color: "#2E3D3F", lineHeight: 1.25 }}>{sec.title}</h2>
              </div>
            </div>

            {/* Cards grid */}
            {sec.items && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 20 }}>
                {sec.items.map((item, j) => (
                  <div key={j} style={{
                    background: "#fff", borderRadius: 12, padding: "24px 22px",
                    boxShadow: "0 2px 14px rgba(0,0,0,.07)", border: "1px solid #e8f4fb",
                    transition: "transform .2s, box-shadow .2s",
                    cursor: "default"
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 8px 28px rgba(8,145,178,.18)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 2px 14px rgba(0,0,0,.07)"; }}>
                    <div style={{ fontSize: "2rem", marginBottom: 12 }}>{item.icon}</div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#2E3D3F", marginBottom: 8 }}>{item.title}</h3>
                    <p style={{ fontSize: "0.875rem", color: "#5A6A6C", lineHeight: 1.65 }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Prose */}
            {sec.prose && (
              <p style={{ fontSize: "1rem", color: "#2a4a5e", lineHeight: 1.8, maxWidth: 780 }}>{sec.prose}</p>
            )}
          </div>
        ))}

        {/* CTA Banner */}
        <div style={{ background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 50%,#8B6914 100%)", borderRadius: 16, padding: "40px 40px", textAlign: "center", boxShadow: "0 8px 32px rgba(8,145,178,.25)" }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.6rem", fontWeight: 900, color: "#fff", marginBottom: 12 }}>Siap Wujudkan Proyek Anda?</h3>
          <p style={{ color: "rgba(255,255,255,.85)", marginBottom: 24, fontSize: "0.95rem" }}>Konsultasikan kebutuhan Anda bersama tim ahli kami — gratis & tanpa komitmen.</p>
          <button onClick={() => onWaOpen && onWaOpen(waText)}
            style={{ padding: "13px 36px", background: "#e8a020", color: "#fff", border: "none", borderRadius: 4, fontSize: "0.875rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer" }}>
            Hubungi Kami via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Page: Jasa Desain & RAB ── */
const DESAIN_RAB_PAKET = [
  {
    key:"basic", label:"PAKET BASIC", tag:null, sub:"Cocok untuk rumah kecil / minimalis",
    harga:"6.000", satuan:"/m²", color:"#1a2526", bgCard:"#fff", textColor:"#1a2526", border:"1.5px solid #d9d9d9",
    fitur:["Denah Arsitektur","Tampak Depan","3D Eksterior","RAB Estimasi","2x Revisi"],
    btnBg:"#fff", btnColor:"#1a2526", btnBorder:"1.5px solid #1a2526", btnLabel:"PILIH PAKET BASIC",
  },
  {
    key:"standard", label:"PAKET STANDARD", tag:"REKOMENDASI", sub:"Cocok untuk rumah tinggal",
    harga:"9.000", satuan:"/m²", color:"#C9AA71", bgCard:"#1a2526", textColor:"#fff", border:"2px solid #C9AA71",
    fitur:["Denah Arsitektur","Tampak & Potongan","3D Eksterior & Interior","Gambar Kerja Lengkap","RAB Detail","3x Revisi"],
    btnBg:"#C9AA71", btnColor:"#1a2526", btnBorder:"none", btnLabel:"PILIH PAKET STANDARD",
  },
  {
    key:"premium", label:"PAKET PREMIUM", tag:null, sub:"Cocok untuk rumah mewah / villa",
    harga:"12.000", satuan:"/m²", color:"#1a2526", bgCard:"#fff", textColor:"#1a2526", border:"1.5px solid #d9d9d9",
    fitur:["Semua Fitur Standard","Video Animasi 3D","Detail Struktur","Konsultasi Intensif","Revisi Unlimited"],
    btnBg:"#fff", btnColor:"#1a2526", btnBorder:"1.5px solid #1a2526", btnLabel:"PILIH PAKET PREMIUM",
  },
];

function DesainRabPage({ onWaOpen }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [activePaket, setActivePaket] = useState(null);

  const PROSES = [
    { no:"01", icon:"👥", label:"Konsultasi", desc:"Konsultasi kebutuhan, konsep desain & budget awal." },
    { no:"02", icon:"📍", label:"Survey Lokasi", desc:"Survey lokasi untuk pengambilan data dan analisa." },
    { no:"03", icon:"💡", label:"Konsep Desain", desc:"Pembuatan konsep desain sesuai kebutuhan Anda." },
    { no:"04", icon:"✏️", label:"Revisi Desain", desc:"Revisi desain hingga sesuai dengan keinginan." },
    { no:"05", icon:"📋", label:"Final Drawing", desc:"Penyelesaian gambar kerja dan dokumen lengkap." },
    { no:"06", icon:"💰", label:"RAB & Estimasi", desc:"Perhitungan RAB detail dan estimasi biaya." },
  ];

  const DAPATKAN = [
    { icon:"🏠", title:"Denah Ruangan", desc:"Denah arsitektur dengan ukuran yang presisi dan detail." },
    { icon:"📄", title:"Gambar Kerja Lengkap", desc:"Gambar kerja teknis untuk panduan pelaksanaan konstruksi." },
    { icon:"📐", title:"Tampak & Potongan", desc:"Tampak depan, samping, belakang dan potongan bangunan." },
    { icon:"📊", title:"RAB Detail", desc:"Rincian anggaran biaya material dan upah secara transparan." },
    { icon:"🖥️", title:"3D Rendering", desc:"Visualisasi 3D eksterior & interior realistis dan detail." },
    { icon:"🔄", title:"Konsultasi & Revisi", desc:"Revisi desain fleksibel sampai Anda puas dengan hasilnya." },
  ];

  const GALERI = [
    { label:"Desain Rumah Modern 2 Lantai", luas:"220 m²", img:"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80" },
    { label:"Desain Rumah Minimalis", luas:"150 m²", img:"https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=80" },
    { label:"Desain Rumah Classic Modern", luas:"300 m²", img:"https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80" },
    { label:"Desain Villa Tropis Modern", luas:"450 m²", img:"https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&q=80" },
    { label:"Desain Rumah Industrial", luas:"180 m²", img:"https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80" },
  ];

  const PAKET = DESAIN_RAB_PAKET;

  const FAQ = [
    { q:"Berapa lama waktu pengerjaan desain?", a:"Tergantung kompleksitas proyek. Rata-rata 7–14 hari kerja untuk desain rumah standar, dan 14–30 hari untuk proyek besar/villa." },
    { q:"Apakah bisa hanya desain tanpa RAB?", a:"Bisa. Kami menyediakan layanan desain saja tanpa RAB, maupun RAB saja tanpa desain sesuai kebutuhan Anda." },
    { q:"Apakah revisi desain dikenakan biaya?", a:"Revisi sudah termasuk dalam paket sesuai jumlah yang tertera. Revisi di luar batas paket dikenakan biaya tambahan." },
    { q:"Apakah melayani seluruh Indonesia?", a:"Ya, kami melayani desain untuk seluruh wilayah Indonesia secara online maupun dengan survei langsung untuk area tertentu." },
    { q:"Apakah sudah termasuk perhitungan struktur?", a:"Untuk Paket Premium sudah termasuk. Paket Basic dan Standard bisa ditambahkan dengan biaya terpisah." },
    { q:"Bagaimana cara memulai proyek?", a:"Hubungi kami via WhatsApp, lakukan konsultasi gratis, lalu kami akan menyiapkan proposal dan timeline pengerjaan." },
  ];

  const waMsg = { key: "desainrab", vars: { judul_paket: "Jasa Desain & RAB" } };

  return (
    <div style={{ minHeight:"100vh", background:"#fff", fontFamily:"'Sora','DM Sans',sans-serif" }}>
      <style>{`
        @keyframes drFadeUp { from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:none;} }
        .dr-faq-row { transition: background .2s; cursor:pointer; }
        .dr-faq-row:hover { background:#FAF7F0 !important; }
        .dr-paket-btn { transition: opacity .2s; cursor:pointer; }
        .dr-paket-btn:hover { opacity:.85; }
        .dr-galeri-item { overflow:hidden; border-radius:10px; cursor:pointer; }
        .dr-galeri-item img { transition:transform .4s; display:block; width:100%; height:100%; object-fit:cover; }
        .dr-galeri-item:hover img { transform:scale(1.06); }
        .dr-proses-item:hover .dr-proses-circle { background:#C9AA71 !important; color:#1a2526 !important; }
        .dr-proses-circle { transition:background .2s,color .2s; }
        .dr-stat { transition:transform .2s; }
        .dr-stat:hover { transform:translateY(-3px); }
        @media(max-width:900px){ .dr-paket-grid{grid-template-columns:1fr 1fr !important;} .dr-galeri-grid{grid-template-columns:repeat(3,1fr) !important;} }
        @media(max-width:640px){ .dr-paket-grid{grid-template-columns:1fr !important;} .dr-galeri-grid{grid-template-columns:repeat(2,1fr) !important;} .dr-dapatkan-grid{grid-template-columns:1fr !important;} .dr-proses-grid{grid-template-columns:repeat(2,1fr) !important;} .dr-faq-grid{grid-template-columns:1fr !important;} }
      `}</style>

      {/* ══ HERO ══ */}
      <div style={{ position:"relative", minHeight:"clamp(420px,60vw,620px)", overflow:"hidden", background:"#1a2526" }}>
        <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&q=85" alt="Hero" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:.55 }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right,rgba(20,30,30,.92) 42%,rgba(10,20,20,.35) 100%)" }} />
        <div style={{ position:"relative", zIndex:2, height:"100%", display:"flex", alignItems:"center", padding:"80px clamp(22px,6%,120px) 40px" }}>
          <div style={{ maxWidth:560, animation:"drFadeUp .55s ease both" }}>
            <h1 style={{ fontSize:"clamp(2rem,5vw,3.2rem)", fontWeight:900, color:"#fff", lineHeight:1.1, marginBottom:14 }}>
              Jasa Desain<br/>
              &amp; RAB <span style={{ color:"#C9AA71" }}>Profesional</span>
            </h1>
            <p style={{ fontSize:"clamp(.875rem,1.8vw,1rem)", color:"rgba(255,255,255,.8)", lineHeight:1.75, marginBottom:20, maxWidth:400 }}>
              Desain arsitektur yang estetik, fungsional,<br/>dan perhitungan RAB yang akurat &amp; transparan.
            </p>
            {/* Mini badges */}
            <div style={{ display:"flex", gap:18, flexWrap:"wrap", marginBottom:28 }}>
              {[{i:"🏅",t:"Desain Berkualitas"},{i:"📊",t:"RAB Akurat & Transparan"},{i:"🔄",t:"Revisi Fleksibel"},{i:"⚡",t:"Pengerjaan Cepat"}].map((b,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:5, color:"rgba(255,255,255,.78)", fontSize:"0.75rem", fontWeight:600 }}>
                  <span style={{ fontSize:"0.9rem" }}>{b.i}</span>{b.t}
                </div>
              ))}
            </div>
            {/* Buttons */}
            <div style={{ display:"flex", gap:14, flexWrap:"wrap", alignItems:"center" }}>
              <button onClick={()=>onWaOpen&&onWaOpen(waMsg)}
                style={{ padding:"12px 24px", background:"#C9AA71", color:"#1a2526", border:"none", borderRadius:7, fontSize:"0.9rem", fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
                KONSULTASI GRATIS 💬
              </button>
              <button style={{ padding:"12px 20px", background:"transparent", color:"#fff", border:"none", fontSize:"0.85rem", fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ width:32, height:32, borderRadius:"50%", border:"2px solid rgba(255,255,255,.6)", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:"0.7rem" }}>▶</span>
                LIHAT VIDEO PROSES PENGERJAAN
              </button>
            </div>
          </div>
        </div>
        {/* Stats bar */}
        <div style={{ position:"absolute", bottom:0, right:0, zIndex:3, display:"flex", gap:0 }}>
          {[{n:"250+",l:"Proyek Selesai"},{n:"98%",l:"Kepuasan Klien"},{n:"5 Tahun",l:"Pengalaman"},{n:"100%",l:"Transparan"}].map((s,i)=>(
            <div key={i} className="dr-stat" style={{ padding:"14px 22px", background:"rgba(0,0,0,.62)", borderLeft:"1px solid rgba(255,255,255,.1)", textAlign:"center", backdropFilter:"blur(8px)" }}>
              <div style={{ fontSize:"1.1rem", fontWeight:800, color:"#C9AA71" }}>{s.n}</div>
              <div style={{ fontSize:"0.65rem", color:"rgba(255,255,255,.7)", marginTop:2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ PROSES PENGERJAAN ══ */}
      <section style={{ background:"#fff", padding:"clamp(48px,7vw,80px) 5%" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:44 }}>
            <div style={{ fontSize:"0.7rem", letterSpacing:"4px", color:"#C9AA71", textTransform:"uppercase", fontWeight:700, marginBottom:10 }}>STEP BY STEP</div>
            <h2 style={{ fontSize:"clamp(1.5rem,3.5vw,2.2rem)", fontWeight:800, color:"#1a2526", margin:0 }}>PROSES PENGERJAAN</h2>
            <div style={{ width:48, height:3, background:"#C9AA71", borderRadius:2, margin:"14px auto 0" }} />
          </div>
          {/* Steps — connected line */}
          <div style={{ position:"relative" }}>
            {/* Connecting line */}
            <div style={{ position:"absolute", top:38, left:"8.33%", right:"8.33%", height:2, background:"linear-gradient(to right,#C9AA71,#E8D5A3)", borderRadius:2, zIndex:0 }} />
            <div className="dr-proses-grid" style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12, position:"relative", zIndex:1 }}>
              {PROSES.map((p,i)=>(
                <div key={i} className="dr-proses-item" style={{ textAlign:"center", cursor:"default" }}>
                  <div style={{ position:"relative", display:"inline-block", marginBottom:14 }}>
                    <div className="dr-proses-circle" style={{ width:68, height:68, borderRadius:"50%", background:"#F5F0E8", border:"2.5px solid #C9AA71", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.6rem", margin:"0 auto" }}>{p.icon}</div>
                    <div style={{ position:"absolute", top:-8, left:-8, width:22, height:22, borderRadius:"50%", background:"#C9AA71", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.6rem", fontWeight:800, color:"#1a2526" }}>{p.no}</div>
                  </div>
                  <div style={{ fontWeight:800, fontSize:"0.875rem", color:"#1a2526", marginBottom:6 }}>{p.label}</div>
                  <div style={{ fontSize:"0.72rem", color:"#5A6A6C", lineHeight:1.55 }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ YANG ANDA DAPATKAN ══ */}
      <section style={{ background:"#FAF7F0", padding:"clamp(48px,7vw,80px) 5%" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:44 }}>
            <div style={{ fontSize:"0.7rem", letterSpacing:"4px", color:"#C9AA71", textTransform:"uppercase", fontWeight:700, marginBottom:10 }}>BENEFIT</div>
            <h2 style={{ fontSize:"clamp(1.5rem,3.5vw,2.2rem)", fontWeight:800, color:"#1a2526", margin:0 }}>YANG ANDA DAPATKAN</h2>
            <div style={{ width:48, height:3, background:"#C9AA71", borderRadius:2, margin:"14px auto 0" }} />
          </div>
          <div style={{ display:"flex", gap:32, alignItems:"flex-start", flexWrap:"wrap" }}>
            {/* Left image collage */}
            <div style={{ flex:"0 0 clamp(260px,40%,440px)", display:"grid", gridTemplateColumns:"1fr 1fr", gridTemplateRows:"auto auto", gap:8, borderRadius:14, overflow:"hidden" }}>
              <img src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=500&q=80" alt="d1" style={{ gridColumn:"1/3", width:"100%", height:180, objectFit:"cover", display:"block" }} />
              <img src="https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=300&q=80" alt="d2" style={{ width:"100%", height:130, objectFit:"cover", display:"block" }} />
              <img src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=300&q=80" alt="d3" style={{ width:"100%", height:130, objectFit:"cover", display:"block" }} />
            </div>
            {/* Right 2-col features */}
            <div style={{ flex:"1 1 340px" }}>
              <div className="dr-dapatkan-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                {DAPATKAN.map((d,i)=>(
                  <div key={i} style={{ display:"flex", gap:14, alignItems:"flex-start", padding:"18px 16px", background:"#fff", borderRadius:10, boxShadow:"0 2px 10px rgba(0,0,0,.06)", border:"1px solid #F0EAE0" }}>
                    <div style={{ width:42, height:42, borderRadius:8, background:"#1a2526", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", flexShrink:0 }}>{d.icon}</div>
                    <div>
                      <div style={{ fontWeight:800, fontSize:"0.875rem", color:"#1a2526", marginBottom:5 }}>{d.title}</div>
                      <div style={{ fontSize:"0.75rem", color:"#5A6A6C", lineHeight:1.6 }}>{d.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CONTOH HASIL DESAIN ══ */}
      <section style={{ background:"#fff", padding:"clamp(48px,7vw,80px) 5%" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:36 }}>
            <div style={{ fontSize:"0.7rem", letterSpacing:"4px", color:"#C9AA71", textTransform:"uppercase", fontWeight:700, marginBottom:10 }}>PORTOFOLIO</div>
            <h2 style={{ fontSize:"clamp(1.5rem,3.5vw,2.2rem)", fontWeight:800, color:"#1a2526", margin:0 }}>CONTOH HASIL DESAIN</h2>
            <div style={{ width:48, height:3, background:"#C9AA71", borderRadius:2, margin:"14px auto 0" }} />
          </div>
          <div className="dr-galeri-grid" style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14, marginBottom:28 }}>
            {GALERI.map((g,i)=>(
              <div key={i} className="dr-galeri-item" style={{ height:200 }}>
                <img src={g.img} alt={g.label} onError={e=>{e.target.style.display="none";}} />
                <div style={{ background:"#fff", padding:"10px 12px" }}>
                  <div style={{ fontWeight:700, fontSize:"0.8rem", color:"#1a2526", lineHeight:1.35, marginBottom:3 }}>{g.label}</div>
                  <div style={{ fontSize:"0.7rem", color:"#5A6A6C" }}>Luas Bangunan {g.luas}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign:"center" }}>
            <button style={{ padding:"11px 28px", background:"#fff", color:"#1a2526", border:"1.5px solid #1a2526", borderRadius:7, fontSize:"0.85rem", fontWeight:700, cursor:"pointer" }}>
              LIHAT SEMUA PROYEK +
            </button>
          </div>
        </div>
      </section>

      {/* ══ PAKET JASA DESAIN & RAB ══ */}
      <section style={{ background:"#FAF7F0", padding:"clamp(48px,7vw,80px) 5%" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:40 }}>
            <div style={{ fontSize:"0.7rem", letterSpacing:"4px", color:"#C9AA71", textTransform:"uppercase", fontWeight:700, marginBottom:10 }}>HARGA</div>
            <h2 style={{ fontSize:"clamp(1.5rem,3.5vw,2.2rem)", fontWeight:800, color:"#1a2526", margin:0 }}>PAKET JASA DESAIN & RAB</h2>
            <div style={{ width:48, height:3, background:"#C9AA71", borderRadius:2, margin:"14px auto 0" }} />
          </div>
          <div className="dr-paket-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:18, alignItems:"stretch" }}>
            {PAKET.map(p=>(
              <div key={p.key} style={{ borderRadius:14, background:p.bgCard, border:p.border, overflow:"hidden", display:"flex", flexDirection:"column", boxShadow: p.key==="standard"?"0 12px 40px rgba(0,0,0,.2)":"0 4px 14px rgba(0,0,0,.07)", position:"relative" }}>
                {p.tag && (
                  <div style={{ background:"#C9AA71", color:"#1a2526", textAlign:"center", fontSize:"0.62rem", fontWeight:800, letterSpacing:"2px", padding:"5px 0" }}>{p.tag}</div>
                )}
                <div style={{ padding:"24px 22px", flex:1, display:"flex", flexDirection:"column" }}>
                  <div style={{ fontSize:"0.72rem", fontWeight:800, letterSpacing:"2px", color:p.key==="standard"?"#C9AA71":"#5A6A6C", marginBottom:6 }}>{p.label}</div>
                  <div style={{ fontSize:"0.78rem", color:p.key==="standard"?"rgba(255,255,255,.65)":"#5A6A6C", marginBottom:18 }}>{p.sub}</div>
                  <div style={{ marginBottom:22 }}>
                    <span style={{ fontSize:"0.75rem", fontWeight:700, color:p.key==="standard"?"#fff":"#1a2526", verticalAlign:"top", lineHeight:2 }}>Rp </span>
                    <span style={{ fontSize:"2rem", fontWeight:900, color:p.key==="standard"?"#C9AA71":"#1a2526", lineHeight:1 }}>{p.harga}</span>
                    <span style={{ fontSize:"0.8rem", color:p.key==="standard"?"rgba(255,255,255,.6)":"#5A6A6C" }}>{p.satuan}</span>
                  </div>
                  <div style={{ flex:1, marginBottom:24 }}>
                    {p.fitur.map((f,i)=>(
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:9 }}>
                        <span style={{ color:"#C9AA71", fontWeight:700, fontSize:"0.85rem" }}>✓</span>
                        <span style={{ fontSize:"0.8rem", color:p.key==="standard"?"rgba(255,255,255,.85)":"#1a2526" }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button className="dr-paket-btn" onClick={()=>onWaOpen&&onWaOpen({ key: "desainrab", vars: { judul_paket: p.label } })}
                    style={{ padding:"12px", background:p.btnBg, color:p.btnColor, border:p.btnBorder, borderRadius:8, fontSize:"0.78rem", fontWeight:800, letterSpacing:"0.5px", width:"100%", cursor:"pointer" }}>
                    {p.btnLabel}
                  </button>
                </div>
              </div>
            ))}
            {/* Custom box */}
            <div style={{ borderRadius:14, background:"#1a2526", padding:"28px 24px", display:"flex", flexDirection:"column", justifyContent:"center", boxShadow:"0 4px 14px rgba(0,0,0,.15)" }}>
              <div style={{ fontWeight:800, fontSize:"1rem", color:"#fff", marginBottom:10 }}>Butuh Paket Custom?</div>
              <p style={{ fontSize:"0.8rem", color:"rgba(255,255,255,.7)", lineHeight:1.65, marginBottom:22 }}>Kami siap menyesuaikan kebutuhan proyek Anda.</p>
              <button onClick={()=>onWaOpen&&onWaOpen({ key: "desainrab", vars: { judul_paket: "Custom" } })}
                style={{ padding:"12px 16px", background:"#C9AA71", color:"#1a2526", border:"none", borderRadius:8, fontSize:"0.8rem", fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                KONSULTASI SEKARANG 💬
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section style={{ background:"#fff", padding:"clamp(48px,7vw,80px) 5%" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:40 }}>
            <div style={{ fontSize:"0.7rem", letterSpacing:"4px", color:"#C9AA71", textTransform:"uppercase", fontWeight:700, marginBottom:10 }}>FAQ</div>
            <h2 style={{ fontSize:"clamp(1.5rem,3.5vw,2.2rem)", fontWeight:800, color:"#1a2526", margin:0 }}>PERTANYAAN YANG SERING DITANYAKAN</h2>
            <div style={{ width:48, height:3, background:"#C9AA71", borderRadius:2, margin:"14px auto 0" }} />
          </div>
          <div className="dr-faq-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0, border:"1px solid #EDE8DF", borderRadius:12, overflow:"hidden" }}>
            {FAQ.map((f,i)=>(
              <div key={i} className="dr-faq-row" style={{ borderBottom:"1px solid #EDE8DF", borderRight: i%2===0?"1px solid #EDE8DF":"none", padding:"0" }}
                onClick={()=>setOpenFaq(openFaq===i?null:i)}>
                <div style={{ padding:"18px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
                  <span style={{ fontSize:"0.845rem", fontWeight:600, color:"#1a2526", lineHeight:1.45 }}>{f.q}</span>
                  <span style={{ fontSize:"1rem", color:"#C9AA71", flexShrink:0, transition:"transform .2s", transform:openFaq===i?"rotate(180deg)":"none" }}>⌄</span>
                </div>
                {openFaq===i && (
                  <div style={{ padding:"0 20px 18px", fontSize:"0.8rem", color:"#5A6A6C", lineHeight:1.7 }}>{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER ══ */}
      <section style={{ position:"relative", overflow:"hidden" }}>
        <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1400&q=80" alt="CTA" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
        <div style={{ position:"absolute", inset:0, background:"rgba(20,30,30,.85)" }} />
        <div style={{ position:"relative", zIndex:1, padding:"clamp(48px,7vw,80px) 5%", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:24, maxWidth:1200, margin:"0 auto" }}>
          <div>
            <h2 style={{ fontSize:"clamp(1.5rem,3.5vw,2.1rem)", fontWeight:800, color:"#fff", margin:"0 0 8px", lineHeight:1.2 }}>Siap Mewujudkan Hunian Impian Anda?</h2>
            <p style={{ fontSize:"0.95rem", color:"rgba(255,255,255,.72)", margin:0 }}>Konsultasikan kebutuhan desain dan RAB Anda sekarang juga!</p>
          </div>
          <button onClick={()=>onWaOpen&&onWaOpen(waMsg)}
            style={{ padding:"14px 30px", background:"#C9AA71", color:"#1a2526", border:"none", borderRadius:8, fontSize:"0.95rem", fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", gap:10, whiteSpace:"nowrap", flexShrink:0 }}>
            💬 KONSULTASI GRATIS
          </button>
        </div>
      </section>

    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TEMA RUMAH — Full Page + Sub-pages per Tema
   Landing  : /tema-rumah   (100% mirip referensi Vastura)
   Sub-page : /tema-rumah/:slug  (Denah · Eksterior · Interior · Harga · Kalkulator)
   ═══════════════════════════════════════════════════════════════════ */

/* ── Data semua tema ── */
const TEMA_DATA = [
  {
    id: 1, slug: "modern-minimalis", no: "01", nama: "Modern Minimalis",
    tagline: "Desain simpel, elegan, dan fungsional dengan garis tegas dan warna netral yang menciptakan kesan luas, bersih, dan modern.",
    fitur: [
      { icon: "🏠", label: "Tampilan Modern" }, { icon: "📐", label: "Ruang Lebih Luas" },
      { icon: "🔧", label: "Perawatan Mudah" }, { icon: "💰", label: "Biaya Efisien" },
    ],
    img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80",
    warna: "#C9AA71",
    deskripsi: "Modern Minimalis adalah filosofi desain yang mengedepankan fungsi di atas dekorasi. Setiap elemen hadir dengan tujuan — tidak ada ornamen berlebihan, hanya garis bersih, material premium, dan cahaya alami yang memaksimalkan kenyamanan hidup.",
    detail: {
      exterior: {
        desc: "Fasad flat dengan material plester halus atau panel GRC. Warna dominan abu-abu, putih, atau krem. Jendela frameless besar memaksimalkan pandangan keluar. Roster beton atau laser-cut sebagai aksen dekoratif.",
        poin: ["Material: GRC, ACP, Kaca Tempered", "Atap: Dak beton / genteng metal flat", "Warna: Abu-abu, putih, off-white", "Kaca frameless panoramik"],
      },
      interior: {
        desc: "Palet monokromatik dengan aksen kayu natural. Furniture built-in tersembunyi (hidden storage). Plafon tinggi dengan indirect lighting. Dapur open-plan dengan island bar.",
        poin: ["Plafon: Gypsum doff dengan hidden lamp", "Lantai: Granit polished 60×60 atau 80×80", "Furnitur: Custom built-in warna putih/abu", "Pencahayaan: LED warm white tersembunyi"],
      },
      denah: {
        desc: "Layout open-plan yang memaksimalkan sirkulasi udara dan cahaya alami. Ruang tamu, ruang makan, dan dapur terhubung tanpa sekat masif.",
        ruangan: [
          { nama: "Ruang Tamu", ukuran: "5 × 6 m", ikon: "🛋️" }, { nama: "Ruang Makan", ukuran: "4 × 4 m", ikon: "🍽️" },
          { nama: "Dapur", ukuran: "3 × 4 m", ikon: "🍳" }, { nama: "Master Bedroom", ukuran: "5 × 5 m", ikon: "🛏️" },
          { nama: "Kamar 2", ukuran: "4 × 4 m", ikon: "🛏️" }, { nama: "Kamar Mandi", ukuran: "2 × 3 m", ikon: "🚿" },
          { nama: "Teras Depan", ukuran: "3 × 2 m", ikon: "🏡" }, { nama: "Carport", ukuran: "3 × 6 m", ikon: "🚗" },
        ],
      },
      harga: {
        paket: [
          { nama: "Paket Minimalis Standar", luas: "60–80 m²", harga: 350000, termasuk: ["Desain arsitektur", "RAB lengkap", "Pengawasan 1 bulan"] },
          { nama: "Paket Minimalis Premium", luas: "80–120 m²", harga: 450000, termasuk: ["Desain arsitektur + interior", "RAB + BQ", "Pengawasan penuh", "3D visualisasi"] },
          { nama: "Paket Minimalis Luxury", luas: "120 m² ke atas", harga: 600000, termasuk: ["Full desain arsitektur, interior, landscape", "RAB + BQ detail", "Pengawasan penuh + QC", "3D + animasi walkthrough"] },
        ],
      },
    },
  },
  {
    id: 2, slug: "skandinavian", no: "02", nama: "Skandinavian",
    tagline: "Kombinasi warna terang, material alami, dan pencahayaan maksimal untuk menciptakan suasana hangat, nyaman, dan menenangkan.",
    fitur: [
      { icon: "🌿", label: "Natural & Hangat" }, { icon: "💡", label: "Pencahayaan Optimal" },
      { icon: "🛋️", label: "Ruang Nyaman" }, { icon: "✨", label: "Estetika Abadi" },
    ],
    img: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=900&q=80",
    warna: "#7a9e87",
    deskripsi: "Skandinavian lahir dari kebutuhan masyarakat Eropa Utara untuk memaksimalkan cahaya di iklim yang gelap. Hasilnya: desain yang bersih, hangat, dan penuh fungsi — dipadu material alami kayu, kain lembut, dan tanaman hijau yang menyegarkan.",
    detail: {
      exterior: {
        desc: "Atap pelana tinggi dengan kemiringan besar, ciri khas arsitektur Skandinavia. Material kayu cedar atau WPC pada fasad memberikan kehangatan visual. Warna putih atau krem dengan aksen kayu coklat terang.",
        poin: ["Atap: Pelana tinggi / metal berprofil", "Material: Kayu cedar, WPC, bata putih", "Warna: Putih, krem, abu muda, coklat kayu", "Jendela: Besar, double-glass, frame putih"],
      },
      interior: {
        desc: "Palet putih bersih dengan sentuhan kayu pinus terang. Tekstil lembut: wol, linen, katun. Tanaman indoor menjadi elemen dekorasi utama. Dapur Hygge dengan island bar kayu dan bar stool tinggi.",
        poin: ["Lantai: Vinyl kayu atau parket pinus terang", "Tekstil: Karpet wol, bantal linen, tirai sheer", "Aksen: Tanaman pot, lilin, benda-benda craft", "Furnitur: Kaki kayu runcing, bentuk organik"],
      },
      denah: {
        desc: "Konsep 'Hygge' — menciptakan sudut-sudut nyaman di setiap ruang. Reading nook, cozy corner, dan dapur yang menjadi jantung rumah.",
        ruangan: [
          { nama: "Ruang Tamu", ukuran: "5 × 5 m", ikon: "🛋️" }, { nama: "Ruang Makan", ukuran: "4 × 3.5 m", ikon: "🍽️" },
          { nama: "Dapur Hygge", ukuran: "3.5 × 4 m", ikon: "🍳" }, { nama: "Master Bedroom", ukuran: "4.5 × 5 m", ikon: "🛏️" },
          { nama: "Kamar 2", ukuran: "3.5 × 4 m", ikon: "🛏️" }, { nama: "Reading Nook", ukuran: "2 × 2 m", ikon: "📚" },
          { nama: "Kamar Mandi", ukuran: "2.5 × 3 m", ikon: "🚿" }, { nama: "Teras Belakang", ukuran: "4 × 3 m", ikon: "🌿" },
        ],
      },
      harga: {
        paket: [
          { nama: "Paket Skandinavia Standar", luas: "60–80 m²", harga: 380000, termasuk: ["Desain arsitektur gaya Skandinavia", "RAB material impor lokal", "3D visualisasi 2 view"] },
          { nama: "Paket Skandinavia Premium", luas: "80–130 m²", harga: 490000, termasuk: ["Full desain + interior Hygge", "RAB + spesifikasi material", "Pengawasan penuh", "3D + mood board"] },
          { nama: "Paket Skandinavia Luxury", luas: "130 m² ke atas", harga: 650000, termasuk: ["Desain arsitektur, interior & landscape nordic", "Furniture custom Skandinavia", "Pengawasan + QC ketat", "Animasi walkthrough 3D"] },
        ],
      },
    },
  },
  {
    id: 3, slug: "industrial", no: "03", nama: "Industrial",
    tagline: "Gaya maskulin dengan material ekspos seperti beton, besi, dan kayu yang menghadirkan kesan tegas, unik, dan berkarakter.",
    fitur: [
      { icon: "⚡", label: "Kesan Maskulin" }, { icon: "🏗️", label: "Material Ekspos" },
      { icon: "🛡️", label: "Tahan Lama" }, { icon: "🔩", label: "Desain Unik" },
    ],
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80",
    warna: "#6b7c8a",
    deskripsi: "Industrial mengambil estetika pabrik dan gudang lama — beton ekspos, pipa besi terbuka, bata merah mentah — dan mentransformasinya menjadi hunian yang berkarakter kuat. Setiap 'ketidaksempurnaan' material menjadi elemen desain yang disengaja.",
    detail: {
      exterior: {
        desc: "Fasad bata ekspos atau plester kasar (exposed concrete). Material metal Corten atau besi hitam sebagai aksen. Jendela berukuran besar dengan frame besi hitam. Kesan 'raw' yang disengaja.",
        poin: ["Material: Bata ekspos, beton kasar, besi hitam", "Atap: Spandek, metal, atau dak beton", "Warna: Abu gelap, hitam, coklat tua, merah bata", "Detail: Pipa galvanis ekspos, baut terlihat"],
      },
      interior: {
        desc: "Plafon beton ekspos atau duct AC yang terlihat. Lantai polished concrete atau vinyl semen. Furnitur besi+kayu kombinasi. Pencahayaan Edison bulb dan track light.",
        poin: ["Lantai: Polished concrete atau floor hardener", "Plafon: Ekspos rangka baja dan duct", "Pencahayaan: Edison bulb, track light hitam", "Furnitur: Kombinasi besi hollow dan kayu solid"],
      },
      denah: {
        desc: "Open space besar tanpa banyak sekat — tipikal ruang industri yang dikonversi. Mezzanine sebagai ruang tidur atau kerja memberikan kedalaman visual yang dramatik.",
        ruangan: [
          { nama: "Ruang Utama (Open)", ukuran: "8 × 10 m", ikon: "🏭" }, { nama: "Dapur Industrial", ukuran: "4 × 5 m", ikon: "🍳" },
          { nama: "Master Bedroom", ukuran: "5 × 6 m", ikon: "🛏️" }, { nama: "Mezzanine / Studio", ukuran: "4 × 5 m", ikon: "🎨" },
          { nama: "Kamar Mandi", ukuran: "3 × 3 m", ikon: "🚿" }, { nama: "Workshop / Garasi", ukuran: "6 × 5 m", ikon: "🔧" },
          { nama: "Ruang Tamu", ukuran: "5 × 6 m", ikon: "🛋️" }, { nama: "Teras / Balkon", ukuran: "3 × 4 m", ikon: "🏗️" },
        ],
      },
      harga: {
        paket: [
          { nama: "Paket Industrial Standar", luas: "70–100 m²", harga: 400000, termasuk: ["Desain industrial + finishing ekspos", "RAB + spesifikasi material", "3D visualisasi"] },
          { nama: "Paket Industrial Premium", luas: "100–150 m²", harga: 520000, termasuk: ["Full desain + interior industrial", "Custom metalwork & carpentry", "Pengawasan penuh", "3D + foto render"] },
          { nama: "Paket Industrial Luxury", luas: "150 m² ke atas", harga: 700000, termasuk: ["Full package desain + eksekusi", "Material impor + custom fabrication", "QC ketat + garansi pekerjaan", "Dokumentasi foto & video"] },
        ],
      },
    },
  },
  {
    id: 4, slug: "tropical-modern", no: "04", nama: "Tropical Modern",
    tagline: "Menggabungkan elemen alam dan desain modern untuk sirkulasi udara maksimal dan suasana yang sejuk serta menyegarkan.",
    fitur: [
      { icon: "🌴", label: "Sejuk & Alami" }, { icon: "💨", label: "Sirkulasi Udara Baik" },
      { icon: "⚡", label: "Hemat Energi" }, { icon: "🌞", label: "Nyaman Setiap Saat" },
    ],
    img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900&q=80",
    warna: "#4a8c6f",
    deskripsi: "Tropical Modern adalah jawaban sempurna untuk iklim Indonesia. Menggabungkan arsitektur kontemporer dengan elemen tropis — atap lebar, cross-ventilation, material alam, dan tanaman hijau lebat — menciptakan hunian yang sejuk tanpa bergantung penuh pada AC.",
    detail: {
      exterior: {
        desc: "Atap lebar menjorok (overhang) melindungi dari hujan dan panas. Void dan balkon terbuka untuk ventilasi silang. Material kayu, batu alam, dan tanaman sebagai komponen desain utama.",
        poin: ["Atap: Genteng clay, metal, atau dak dengan taman", "Material: Batu andesit, kayu ulin, bambu laminate", "Vegetasi: Tanaman fasad, vertical garden, kolam koi", "Void: Cross-ventilation pada massa bangunan"],
      },
      interior: {
        desc: "Material alam mendominasi — kayu, rotan, batu alam. Palette hijau, coklat, krem. Ruangan mengalir ke taman atau kolam melalui bukaan besar. Indoor-outdoor living sebagai konsep utama.",
        poin: ["Lantai: Batu andesit, kayu atau terracotta", "Plafon: Kayu ekspos atau anyaman bambu", "Warna: Hijau, krem, coklat kayu, abu batu", "Furniture: Rotan, kayu jati, material alam"],
      },
      denah: {
        desc: "Zoning yang memisahkan area publik dan privat dengan buffer tanaman. Ruang tengah terbuka ke halaman (courtyard). Teras menjadi ruang sosial utama.",
        ruangan: [
          { nama: "Teras & Carport", ukuran: "5 × 6 m", ikon: "🌴" }, { nama: "Ruang Tamu", ukuran: "5 × 6 m", ikon: "🛋️" },
          { nama: "Ruang Keluarga", ukuran: "5 × 5 m", ikon: "👨‍👩‍👧" }, { nama: "Dapur + Makan", ukuran: "4 × 6 m", ikon: "🍳" },
          { nama: "Master Bedroom", ukuran: "5 × 5 m", ikon: "🛏️" }, { nama: "Kamar 2 & 3", ukuran: "3.5 × 4 m", ikon: "🛏️" },
          { nama: "Kolam & Taman", ukuran: "4 × 6 m", ikon: "🌊" }, { nama: "Musholla", ukuran: "2.5 × 3 m", ikon: "🕌" },
        ],
      },
      harga: {
        paket: [
          { nama: "Paket Tropical Standar", luas: "80–120 m²", harga: 420000, termasuk: ["Desain tropical modern", "Material lokal premium", "RAB + landscape dasar"] },
          { nama: "Paket Tropical Premium", luas: "120–180 m²", harga: 550000, termasuk: ["Full desain + interior + landscape", "Material alam pilihan", "Kolam ikan / kolam renang mini", "Pengawasan penuh"] },
          { nama: "Paket Tropical Luxury", luas: "180 m² ke atas", harga: 750000, termasuk: ["Villa-grade tropical design", "Material import + custom joinery", "Kolam renang + taman profesional", "Full management proyek"] },
        ],
      },
    },
  },
  {
    id: 5, slug: "luxury-modern", no: "05", nama: "Luxury Modern",
    tagline: "Desain eksklusif dengan detail premium, material berkualitas tinggi, dan tata ruang mewah yang memancarkan prestise.",
    fitur: [
      { icon: "👑", label: "Eksklusif" }, { icon: "💎", label: "Material Premium" },
      { icon: "🏆", label: "Detail Mewah" }, { icon: "⭐", label: "Prestise Tinggi" },
    ],
    img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&q=80",
    warna: "#8B6914",
    deskripsi: "Luxury Modern adalah puncak ekspresi arsitektur kontemporer. Setiap detail dirancang dengan presisi — material marmer impor, smart home system, kolam renang infinity edge, dan pencahayaan arsitektural yang menciptakan ambiance mewah setiap saat.",
    detail: {
      exterior: {
        desc: "Volume asimetris yang dramatik dengan material marmer eksterior, ACP metalik, dan panel GRC premium. Kolam renang dengan overflow edge sebagai focal point. Landscape impresif dengan pohon palm dan pencahayaan taman yang dramatis.",
        poin: ["Material: Marmer, ACP brushed gold, GRC custom", "Kolam: Infinity pool dengan overflow edge", "Pencahayaan: Arsitektural LED + uplighting taman", "Smart gate: Akses otomatis dengan sistem keamanan"],
      },
      interior: {
        desc: "Material marmer impor pada lantai dan dinding. Plafon double-volume di ruang tamu. Tangga floating dengan railing kaca frameless. Dapur custom kitchen set dengan appliance premium.",
        poin: ["Lantai: Marmer Statuario atau Calacatta impor", "Dinding: Feature wall marmer + backlit panel", "Tangga: Floating staircase + LED step-light", "Smart Home: Lighting, AC, security terintegrasi"],
      },
      denah: {
        desc: "Layout mewah dengan foyer grand entrance, ruang tamu double-volume, ruang makan formal terpisah, dan home theater. Kamar utama dengan walk-in closet dan ensuite bathroom spa-grade.",
        ruangan: [
          { nama: "Grand Foyer", ukuran: "4 × 5 m", ikon: "🚪" }, { nama: "Ruang Tamu (Double Vol.)", ukuran: "8 × 9 m", ikon: "🛋️" },
          { nama: "Ruang Makan Formal", ukuran: "5 × 7 m", ikon: "🍽️" }, { nama: "Dapur Premium", ukuran: "5 × 5 m", ikon: "🍳" },
          { nama: "Master Suite", ukuran: "7 × 8 m", ikon: "👑" }, { nama: "Walk-in Closet", ukuran: "4 × 4 m", ikon: "👗" },
          { nama: "Home Theater", ukuran: "5 × 6 m", ikon: "🎬" }, { nama: "Kolam Renang", ukuran: "4 × 10 m", ikon: "🏊" },
        ],
      },
      harga: {
        paket: [
          { nama: "Paket Luxury Standar", luas: "150–200 m²", harga: 750000, termasuk: ["Full desain arsitektur mewah", "Material premium lokal", "Interior semi-furnished", "RAB + BQ detail"] },
          { nama: "Paket Luxury Premium", luas: "200–300 m²", harga: 1000000, termasuk: ["Full design + interior + landscape mewah", "Material marmer impor + custom joinery", "Smart home system", "Kolam renang + taman profesional"] },
          { nama: "Paket Luxury Ultra", luas: "300 m² ke atas", harga: 0, termasuk: ["Desain custom sepenuhnya", "Material world-class tanpa batas", "Full project management", "Konsultasi eksklusif, by appointment only"] },
        ],
      },
    },
  },
];

/* ── Kalkulator Luas Lahan ── */
function KalkulatorLuas({ tema }) {
  const [luas, setLuas] = useState(100);
  const [paketIdx, setPaketIdx] = useState(1);
  const paket = tema.detail.harga.paket[paketIdx];
  const isCustom = paket.harga === 0;
  const totalHarga = isCustom ? null : luas * paket.harga;
  const fmtRp = (n) => "Rp " + n.toLocaleString("id-ID");

  return (
    <div style={{ background: "linear-gradient(135deg,#1a2a2a 0%,#2E3D3F 60%,#3D5254 100%)", borderRadius: 16, padding: "32px", color: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <span style={{ fontSize: 24 }}>🧮</span>
        <div>
          <div style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: tema.warna, fontWeight: 800 }}>ESTIMASI BIAYA</div>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "#fff" }}>Kalkulator Luas Lahan</h3>
        </div>
      </div>
      {/* Pilih Paket */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,.5)", marginBottom: 8, fontWeight: 700 }}>Pilih Paket</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tema.detail.harga.paket.map((p, i) => (
            <button key={i} onClick={() => setPaketIdx(i)} style={{
              padding: "10px 14px", borderRadius: 8, cursor: "pointer", textAlign: "left", transition: "all .2s",
              background: paketIdx === i ? tema.warna + "44" : "rgba(255,255,255,.07)",
              border: paketIdx === i ? `1.5px solid ${tema.warna}` : "1.5px solid rgba(255,255,255,.15)",
              color: paketIdx === i ? "#fff" : "rgba(255,255,255,.7)",
            }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>{p.nama}</div>
              <div style={{ fontSize: "0.7rem", marginTop: 2, opacity: 0.8 }}>{p.harga === 0 ? "Harga sesuai kebutuhan" : `${fmtRp(p.harga)} / m²`} · {p.luas}</div>
            </button>
          ))}
        </div>
      </div>
      {/* Slider */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <label style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,.5)", fontWeight: 700 }}>Luas Bangunan</label>
          <span style={{ fontSize: "0.95rem", fontWeight: 800, color: tema.warna }}>{luas} m²</span>
        </div>
        <input type="range" min={40} max={500} step={5} value={luas} onChange={e => setLuas(+e.target.value)}
          style={{ width: "100%", accentColor: tema.warna, cursor: "pointer" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: "0.62rem", color: "rgba(255,255,255,.38)" }}>
          <span>40 m²</span><span>500 m²</span>
        </div>
      </div>
      {/* Input Manual */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,.5)", marginBottom: 6, fontWeight: 700 }}>Atau Masukkan Manual</label>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="number" min={40} max={5000} value={luas} onChange={e => setLuas(Math.max(40, +e.target.value))}
            style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: "1.5px solid rgba(255,255,255,.2)", background: "rgba(255,255,255,.08)", color: "#fff", fontSize: "0.9rem", outline: "none" }} />
          <span style={{ color: "rgba(255,255,255,.6)", fontSize: "0.85rem", fontWeight: 600 }}>m²</span>
        </div>
      </div>
      {/* Hasil */}
      <div style={{ background: isCustom ? "rgba(255,255,255,.08)" : `rgba(${parseInt(tema.warna.slice(1,3),16)},${parseInt(tema.warna.slice(3,5),16)},${parseInt(tema.warna.slice(5,7),16)},.15)`, border: `1.5px solid ${tema.warna}55`, borderRadius: 12, padding: "20px 22px" }}>
        {isCustom ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>👑</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff" }}>Harga Konsultasi Eksklusif</div>
            <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,.6)", marginTop: 4 }}>Hubungi tim kami untuk penawaran ultra-luxury</div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,.5)", fontWeight: 700, marginBottom: 4 }}>Estimasi Total</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.6rem", fontWeight: 900, color: tema.warna, lineHeight: 1 }}>{fmtRp(totalHarga)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,.5)", fontWeight: 700, marginBottom: 4 }}>Rincian</div>
                <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,.68)" }}>{luas} m² × {fmtRp(paket.harga)}</div>
              </div>
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 12 }}>
              <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,.5)", fontWeight: 700, marginBottom: 6 }}>Sudah Termasuk</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {paket.termasuk.map((item, i) => (
                  <span key={i} style={{ fontSize: "0.7rem", background: "rgba(255,255,255,.1)", borderRadius: 20, padding: "3px 10px", color: "rgba(255,255,255,.8)" }}>✓ {item}</span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      <p style={{ fontSize: "0.62rem", color: "rgba(255,255,255,.32)", marginTop: 12, lineHeight: 1.5, textAlign: "center" }}>
        * Estimasi kasar. Harga final sesuai survei lapangan, spesifikasi material, dan kondisi lahan.
      </p>
    </div>
  );
}

/* ── Card Content helper (reusable di landing) ── */
function TemaCardContent({ tema, setTemaSlug }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
        <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "2.4rem", fontWeight: 900, color: "#E8DCC8", lineHeight: 1 }}>{tema.no}</span>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.4rem", fontWeight: 900, color: "#2E3D3F", margin: 0, lineHeight: 1 }}>{tema.nama.toUpperCase()}</h2>
      </div>
      <div style={{ width: 38, height: 3, background: tema.warna, borderRadius: 2, marginBottom: 14 }} />
      <p style={{ fontSize: "0.86rem", color: "#5A6A6C", lineHeight: 1.72, marginBottom: 20 }}>{tema.tagline}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 22 }}>
        {tema.fitur.map((f, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#F5EDD8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", margin: "0 auto 6px" }}>{f.icon}</div>
            <div style={{ fontSize: "0.62rem", color: "#5A6A6C", fontWeight: 600, lineHeight: 1.3 }}>{f.label}</div>
          </div>
        ))}
      </div>
      <button onClick={() => setTemaSlug(tema.slug)} style={{
        display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 20px",
        border: "1.5px solid #2E3D3F", borderRadius: 3, background: "transparent", color: "#2E3D3F",
        fontWeight: 700, fontSize: "0.76rem", cursor: "pointer", letterSpacing: ".08em", textTransform: "uppercase",
        transition: "all .2s",
      }}
        onMouseEnter={e => { e.currentTarget.style.background = "#2E3D3F"; e.currentTarget.style.color = "#fff"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#2E3D3F"; }}
      >LIHAT DETAIL <span>→</span></button>
    </>
  );
}

/* ── Detail Page per tema ── */
function TemaDetailPage({ slug, onWaOpen, onBack }) {
  const tema = TEMA_DATA.find(t => t.slug === slug);
  const [activeTab, setActiveTab] = useState("denah");

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  if (!tema) return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <div style={{ fontSize: "3rem", marginBottom: 16 }}>🏡</div>
      <h2 style={{ fontFamily: "'Playfair Display',serif", color: "#2E3D3F" }}>Tema tidak ditemukan</h2>
      <button onClick={onBack} style={{ marginTop: 16, padding: "10px 24px", background: "#2E3D3F", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>← Kembali</button>
    </div>
  );

  const tabs = [
    { id: "denah", label: "📐 Denah Ruang" },
    { id: "exterior", label: "🏠 Eksterior" },
    { id: "interior", label: "🛋️ Interior" },
    { id: "harga", label: "💰 Harga & RAB" },
    { id: "kalkulator", label: "🧮 Kalkulator" },
  ];

  const PoinItem = ({ text }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 14px", background: "#FDFAF4", borderRadius: 9, border: "1px solid #F5EDD8" }}>
      <span style={{ width: 22, height: 22, borderRadius: "50%", background: tema.warna + "22", color: tema.warna, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 900, flexShrink: 0 }}>✓</span>
      <span style={{ fontSize: "0.83rem", color: "#2E3D3F", fontWeight: 500 }}>{text}</span>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
      {/* Back Bar */}
      <div style={{ background: "linear-gradient(90deg,#1a2a2a,#2E3D3F)", padding: "0 5%", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 90, borderBottom: `3px solid ${tema.warna}` }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#C9AA71", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", padding: "13px 0", letterSpacing: ".06em", textTransform: "uppercase" }}>
          <span style={{ fontSize: 18 }}>←</span> Kembali ke Tema Rumah
        </button>
        <span style={{ fontSize: "0.74rem", color: "rgba(255,255,255,.45)", letterSpacing: ".06em", textTransform: "uppercase", fontWeight: 600 }}>{tema.no} · {tema.nama}</span>
      </div>

      {/* Hero */}
      <div style={{ position: "relative", height: 400, overflow: "hidden" }}>
        <img src={tema.img} alt={tema.nama} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={e => e.target.style.display = "none"} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right,rgba(10,20,20,.88) 38%,rgba(10,20,20,.25) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "36px 5%" }}>
          <div style={{ fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: tema.warna, fontWeight: 800, marginBottom: 7 }}>TEMA RUMAH · {tema.no}</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.8rem,4.5vw,3rem)", fontWeight: 900, color: "#fff", margin: "0 0 11px", lineHeight: 1.1, textShadow: "0 2px 18px rgba(0,0,0,.5)" }}>{tema.nama}</h1>
          <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,.78)", maxWidth: 520, lineHeight: 1.65, margin: "0 0 20px" }}>{tema.deskripsi}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {tema.fitur.map((f, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 13px", background: "rgba(255,255,255,.12)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 20, color: "#fff", fontSize: "0.76rem", fontWeight: 600 }}>{f.icon} {f.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ background: "#fff", borderBottom: "2px solid #F5EDD8", position: "sticky", top: 46, zIndex: 80, overflowX: "auto" }}>
        <div style={{ display: "flex", padding: "0 4%", minWidth: "max-content" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: "13px 18px", border: "none", borderBottom: activeTab === t.id ? `3px solid #2E3D3F` : "3px solid transparent",
              background: activeTab === t.id ? "#fff" : "#FDFAF4", color: activeTab === t.id ? "#2E3D3F" : "#5A6A6C",
              fontWeight: activeTab === t.id ? 800 : 500, fontSize: "0.78rem", cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ padding: "44px 5% 56px", maxWidth: 1060, margin: "0 auto" }}>

        {activeTab === "denah" && (
          <div>
            <div style={{ fontSize: "0.65rem", letterSpacing: ".12em", textTransform: "uppercase", color: tema.warna, fontWeight: 800, marginBottom: 7 }}>DENAH RUANG</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.7rem", fontWeight: 800, color: "#2E3D3F", margin: "0 0 12px" }}>Tata Ruang {tema.nama}</h2>
            <p style={{ color: "#5A6A6C", lineHeight: 1.7, maxWidth: 660, marginBottom: 28, fontSize: "0.88rem" }}>{tema.detail.denah.desc}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14 }}>
              {tema.detail.denah.ruangan.map((r, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "18px", boxShadow: "0 2px 10px rgba(0,0,0,.07)", border: "1px solid #F5EDD8", transition: "all .2s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,.11)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,.07)"; }}>
                  <div style={{ fontSize: "1.6rem", marginBottom: 9 }}>{r.ikon}</div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#2E3D3F", marginBottom: 5 }}>{r.nama}</div>
                  <span style={{ display: "inline-block", fontSize: "0.7rem", fontWeight: 700, color: tema.warna, background: tema.warna + "18", borderRadius: 20, padding: "2px 10px" }}>{r.ukuran}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 30, background: "#FDFAF4", borderRadius: 14, padding: "22px 26px", border: "1px solid #F5EDD8" }}>
              <div style={{ fontSize: "0.65rem", letterSpacing: ".1em", textTransform: "uppercase", color: "#5A6A6C", fontWeight: 700, marginBottom: 14 }}>Ilustrasi Denah (Skematik)</div>
              <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 4, maxWidth: 480 }}>
                {tema.detail.denah.ruangan.slice(0, 6).map((r, i) => (
                  <div key={i} style={{ background: i === 0 ? tema.warna + "20" : "#fff", border: `1.5px solid ${i === 0 ? tema.warna : "#E8DCC8"}`, borderRadius: 6, padding: "9px 12px", gridColumn: i === 0 ? "1 / -1" : undefined }}>
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#2E3D3F" }}>{r.nama}</div>
                    <div style={{ fontSize: "0.62rem", color: "#5A6A6C" }}>{r.ukuran}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: "0.62rem", color: "#aaa", marginTop: 10 }}>* Denah skematik ilustrasi. Denah aktual disesuaikan kebutuhan & lahan.</p>
            </div>
          </div>
        )}

        {activeTab === "exterior" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "start" }}>
            <div>
              <div style={{ fontSize: "0.65rem", letterSpacing: ".12em", textTransform: "uppercase", color: tema.warna, fontWeight: 800, marginBottom: 7 }}>EKSTERIOR</div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.7rem", fontWeight: 800, color: "#2E3D3F", margin: "0 0 14px" }}>Tampak Luar {tema.nama}</h2>
              <p style={{ color: "#5A6A6C", lineHeight: 1.75, marginBottom: 22, fontSize: "0.88rem" }}>{tema.detail.exterior.desc}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {tema.detail.exterior.poin.map((p, i) => <PoinItem key={i} text={p} />)}
              </div>
            </div>
            <div>
              <img src={tema.img} alt={tema.nama + " eksterior"} style={{ width: "100%", height: 320, objectFit: "cover", borderRadius: 14, boxShadow: "0 8px 28px rgba(0,0,0,.14)" }} onError={e => e.target.style.display = "none"} />
              <div style={{ marginTop: 14, background: "#FDFAF4", borderRadius: 11, padding: "14px 18px", border: `1px solid ${tema.warna}30` }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: tema.warna, marginBottom: 8 }}>Warna Dominan</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[tema.warna, "#2E3D3F", "#F5EDD8", "#FDFAF4"].map((c, i) => (
                    <div key={i} style={{ width: 34, height: 34, borderRadius: 8, background: c, border: "2px solid rgba(0,0,0,.08)" }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "interior" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "start" }}>
            <div>
              <img src={tema.img} alt={tema.nama + " interior"} style={{ width: "100%", height: 320, objectFit: "cover", borderRadius: 14, boxShadow: "0 8px 28px rgba(0,0,0,.14)", filter: "brightness(.9) saturate(1.1)" }} onError={e => e.target.style.display = "none"} />
              <div style={{ marginTop: 14, background: "#FDFAF4", borderRadius: 11, padding: "14px 18px", border: "1px solid #F5EDD8" }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#5A6A6C", marginBottom: 9 }}>Ruangan Unggulan</div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {tema.detail.denah.ruangan.slice(0, 4).map((r, i) => (
                    <span key={i} style={{ fontSize: "0.74rem", padding: "4px 12px", borderRadius: 20, background: tema.warna + "18", color: "#2E3D3F", fontWeight: 600 }}>{r.ikon} {r.nama}</span>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.65rem", letterSpacing: ".12em", textTransform: "uppercase", color: tema.warna, fontWeight: 800, marginBottom: 7 }}>INTERIOR</div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.7rem", fontWeight: 800, color: "#2E3D3F", margin: "0 0 14px" }}>Dalam Rumah {tema.nama}</h2>
              <p style={{ color: "#5A6A6C", lineHeight: 1.75, marginBottom: 22, fontSize: "0.88rem" }}>{tema.detail.interior.desc}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {tema.detail.interior.poin.map((p, i) => <PoinItem key={i} text={p} />)}
              </div>
            </div>
          </div>
        )}

        {activeTab === "harga" && (
          <div>
            <div style={{ fontSize: "0.65rem", letterSpacing: ".12em", textTransform: "uppercase", color: tema.warna, fontWeight: 800, marginBottom: 7 }}>PAKET HARGA</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.7rem", fontWeight: 800, color: "#2E3D3F", margin: "0 0 12px" }}>Harga & RAB {tema.nama}</h2>
            <p style={{ color: "#5A6A6C", lineHeight: 1.7, maxWidth: 580, marginBottom: 28, fontSize: "0.88rem" }}>Pilih paket yang sesuai kebutuhan dan budget Anda.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 18, marginBottom: 36 }}>
              {tema.detail.harga.paket.map((p, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 14, border: `2px solid ${i === 1 ? tema.warna : "#F5EDD8"}`, overflow: "hidden", boxShadow: i === 1 ? `0 8px 28px ${tema.warna}20` : "0 2px 10px rgba(0,0,0,.06)", transition: "all .25s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,.1)`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = i === 1 ? `0 8px 28px ${tema.warna}20` : "0 2px 10px rgba(0,0,0,.06)"; }}>
                  {i === 1 && <div style={{ background: tema.warna, color: "#fff", fontSize: "0.62rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", textAlign: "center", padding: "5px" }}>⭐ PALING POPULER</div>}
                  <div style={{ padding: "22px" }}>
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: tema.warna, marginBottom: 7 }}>PAKET {i === 0 ? "STANDAR" : i === 1 ? "PREMIUM" : "LUXURY"}</div>
                    <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.05rem", fontWeight: 800, color: "#2E3D3F", margin: "0 0 5px" }}>{p.nama}</h3>
                    <div style={{ fontSize: "0.78rem", color: "#5A6A6C", marginBottom: 18 }}>Luas bangunan: {p.luas}</div>
                    {p.harga === 0
                      ? <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.35rem", fontWeight: 900, color: "#2E3D3F", marginBottom: 14 }}>Hubungi Kami</div>
                      : <><div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.45rem", fontWeight: 900, color: tema.warna, lineHeight: 1 }}>Rp {p.harga.toLocaleString("id-ID")}</div>
                        <div style={{ fontSize: "0.72rem", color: "#5A6A6C", marginTop: 2, marginBottom: 14 }}>per meter persegi</div></>
                    }
                    <div style={{ borderTop: "1px solid #F5EDD8", paddingTop: 14, display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
                      {p.termasuk.map((item, j) => (
                        <div key={j} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                          <span style={{ color: tema.warna, fontWeight: 700, fontSize: "0.8rem", flexShrink: 0 }}>✓</span>
                          <span style={{ fontSize: "0.78rem", color: "#3D5254", lineHeight: 1.4 }}>{item}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={onWaOpen} style={{ width: "100%", padding: "10px", borderRadius: 7, border: "none", background: i === 1 ? tema.warna : "linear-gradient(90deg,#2E3D3F,#3D5254)", color: "#fff", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>
                      💬 Konsultasi Paket Ini
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: "#FDFAF4", borderRadius: 12, padding: "22px 26px", border: "1px solid #F5EDD8" }}>
              <div style={{ fontWeight: 800, color: "#2E3D3F", marginBottom: 12, fontSize: "0.9rem" }}>📋 Catatan RAB & Harga</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {["Harga belum termasuk biaya IMB/PBG", "Harga belum termasuk biaya utilitas (air, listrik)", "Bahan material dapat diganti sesuai budget", "Harga valid per tahun berjalan, hubungi untuk update", "Pembayaran bertahap sesuai progress pekerjaan", "Garansi pekerjaan 6–12 bulan sesuai kontrak"].map((c, i) => (
                  <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                    <span style={{ color: "#C9AA71", fontWeight: 700 }}>·</span>
                    <span style={{ fontSize: "0.78rem", color: "#5A6A6C", lineHeight: 1.5 }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "kalkulator" && (
          <div style={{ maxWidth: 540, margin: "0 auto" }}>
            <div style={{ marginBottom: 28, textAlign: "center" }}>
              <div style={{ fontSize: "0.65rem", letterSpacing: ".12em", textTransform: "uppercase", color: tema.warna, fontWeight: 800, marginBottom: 7 }}>ESTIMASI BIAYA</div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.7rem", fontWeight: 800, color: "#2E3D3F", margin: "0 0 12px" }}>Kalkulator Lahan</h2>
              <p style={{ color: "#5A6A6C", lineHeight: 1.7, fontSize: "0.88rem" }}>Masukkan luas bangunan Anda untuk estimasi biaya paket {tema.nama}.</p>
            </div>
            <KalkulatorLuas tema={tema} />
            <div style={{ marginTop: 22, textAlign: "center" }}>
              <button onClick={onWaOpen} style={{ padding: "14px 32px", background: `linear-gradient(135deg,${tema.warna},#C9AA71)`, color: "#fff", border: "none", borderRadius: 8, fontWeight: 800, fontSize: "0.88rem", cursor: "pointer", letterSpacing: ".06em" }}>
                💬 KONSULTASI GRATIS →
              </button>
              <p style={{ fontSize: "0.72rem", color: "#5A6A6C", marginTop: 10 }}>Gratis konsultasi · Respon cepat · Solusi tepat</p>
            </div>
          </div>
        )}
      </div>

      {/* CTA Footer */}
      <div style={{ background: "linear-gradient(135deg,#1a2a2a 0%,#2E3D3F 60%)", padding: "46px 5%", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div style={{ fontSize: "0.65rem", letterSpacing: ".15em", textTransform: "uppercase", color: tema.warna, fontWeight: 800, marginBottom: 8 }}>SIAP MEMULAI?</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.35rem,4vw,2.1rem)", fontWeight: 800, color: "#fff", margin: "0 0 14px", lineHeight: 1.25 }}>
          Wujudkan Rumah {tema.nama} Impian Anda
        </h2>
        <p style={{ color: "rgba(255,255,255,.6)", maxWidth: 480, lineHeight: 1.7, marginBottom: 26, fontSize: "0.88rem" }}>
          Konsultasikan kebutuhan desain rumah Anda dengan tim profesional kami. Gratis, cepat, dan tepat sasaran.
        </p>
        <button onClick={onWaOpen} style={{ padding: "15px 34px", background: tema.warna, color: "#fff", border: "none", borderRadius: 7, fontWeight: 800, fontSize: "0.9rem", cursor: "pointer", letterSpacing: ".08em", textTransform: "uppercase", boxShadow: `0 8px 22px ${tema.warna}44` }}>
          💬 KONSULTASI GRATIS
        </button>
      </div>
    </div>
  );
}

/* ── Page: Tema Rumah (Landing + Sub-page router) ── */
function TemaRumahPage({ onWaOpen, temaSlug, setTemaSlug }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  /* Jika ada slug → tampilkan detail page */
  if (temaSlug) {
    return <TemaDetailPage slug={temaSlug} onWaOpen={onWaOpen} onBack={() => setTemaSlug(null)} />;
  }

  /* Landing /tema-rumah */
  return (
    <div style={{ fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
      <style>{`
        .tema-card-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid #F5EDD8;
          transition: box-shadow .25s;
        }
        .tema-card-grid:hover { box-shadow: 0 8px 28px rgba(0,0,0,.08); }
        .tema-card-img { overflow: hidden; min-height: 300px; }
        .tema-card-img img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .4s; }
        .tema-card-content { padding: 44px 46px; display: flex; flex-direction: column; justify-content: center; }
        .tema-cta-grid {
          background: linear-gradient(135deg,#1a2a2a 0%,#2E3D3F 52%,#3D5254 100%);
          padding: 54px 6%; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center;
        }
        .tema-cta-right { display: flex; flex-direction: column; align-items: flex-end; gap: 14px; }

        @media (max-width: 768px) {
          .tema-card-grid { grid-template-columns: 1fr !important; }
          .tema-card-img { min-height: 220px; order: -1 !important; }
          .tema-card-content { padding: 26px 20px; order: 1 !important; }
          .tema-cta-grid { grid-template-columns: 1fr !important; gap: 20px !important; padding: 36px 5% !important; }
          .tema-cta-right { align-items: stretch !important; }
          .tema-cta-right button { width: 100% !important; }
        }
      `}</style>
      {/* Hero */}
      <div style={{ position: "relative", minHeight: 460, overflow: "hidden", background: "#0f1f1f" }}>
        <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=85" alt="Tema Rumah Hero"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.42 }}
          onError={e => e.target.style.display = "none"} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(10,25,20,.93) 44%,rgba(10,25,20,.18) 100%)" }} />
        <div style={{ position: "relative", zIndex: 2, padding: "58px 6% 50px", maxWidth: 620 }}>
          <div style={{ fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#C9AA71", fontWeight: 800, marginBottom: 14 }}>TEMA RUMAH</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.9rem,5vw,3.2rem)", fontWeight: 900, color: "#fff", lineHeight: 1.1, margin: "0 0 6px" }}>PILIH TEMA RUMAH</h1>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.9rem,5vw,3.2rem)", fontWeight: 900, color: "#C9AA71", lineHeight: 1.1, margin: "0 0 20px" }}>SESUAI KARAKTER ANDA</h1>
          <p style={{ fontSize: "0.92rem", color: "rgba(255,255,255,.73)", lineHeight: 1.72, marginBottom: 30, maxWidth: 460 }}>
            Berbagai pilihan tema rumah yang dirancang untuk mewujudkan hunian impian yang estetis, nyaman, dan fungsional.
          </p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={onWaOpen} style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 26px", background: "#C9AA71", color: "#fff", border: "none", borderRadius: 4, fontWeight: 800, fontSize: "0.78rem", cursor: "pointer", letterSpacing: ".1em", textTransform: "uppercase", boxShadow: "0 4px 18px rgba(201,170,113,.4)" }}>
              💬 KONSULTASI GRATIS
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 40, height: 40, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,.45)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", color: "#fff" }}>▶</span>
              <div>
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#fff", letterSpacing: ".06em" }}>LIHAT VIDEO</div>
                <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,.58)", letterSpacing: ".04em" }}>INSPIRASI TEMA RUMAH</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tema Cards — alternating layout */}
      <div style={{ background: "#fff" }}>
        {TEMA_DATA.map((tema, idx) => {
          const isEven = idx % 2 === 0;
          const imgEl = (
            <div className="tema-card-img">
              <img src={tema.img} alt={tema.nama}
                onError={e => e.target.style.display = "none"}
                onMouseEnter={e => e.target.style.transform = "scale(1.04)"}
                onMouseLeave={e => e.target.style.transform = ""} />
            </div>
          );
          const contentEl = (
            <div className="tema-card-content">
              <TemaCardContent tema={tema} setTemaSlug={setTemaSlug} />
            </div>
          );
          return (
            <div key={tema.id} className="tema-card-grid" style={{ background: idx % 2 === 1 ? "#FDFAF4" : "#fff" }}>
              {isEven ? <>{imgEl}{contentEl}</> : <>{contentEl}{imgEl}</>}
            </div>
          );
        })}
      </div>

      {/* CTA Section */}
      <div className="tema-cta-grid">
        <div>
          <div style={{ fontSize: "0.65rem", letterSpacing: ".18em", textTransform: "uppercase", color: "#C9AA71", fontWeight: 800, marginBottom: 12 }}>SIAP MEMULAI?</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.35rem,3.5vw,2rem)", fontWeight: 800, color: "#fff", margin: "0 0 14px", lineHeight: 1.25 }}>
            Wujudkan Rumah Impian Anda<br />Bersama VASTURA GROUP
          </h2>
          <p style={{ fontSize: "0.84rem", color: "rgba(255,255,255,.6)", lineHeight: 1.7 }}>Konsultasikan kebutuhan desain rumah Anda dengan tim profesional kami.</p>
        </div>
        <div className="tema-cta-right">
          <button onClick={onWaOpen} style={{ padding: "15px 34px", background: "#C9AA71", color: "#fff", border: "none", borderRadius: 4, fontWeight: 800, fontSize: "0.84rem", cursor: "pointer", letterSpacing: ".1em", textTransform: "uppercase", boxShadow: "0 8px 22px rgba(201,170,113,.32)" }}>
            💬 KONSULTASI GRATIS
          </button>
          <div style={{ display: "flex", gap: 20 }}>
            {["✅ Gratis Konsultasi", "⚡ Respon Cepat", "🎯 Solusi Tepat"].map((t, i) => (
              <span key={i} style={{ fontSize: "0.74rem", color: "rgba(255,255,255,.62)", fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Page: Interior ── */
function InteriorPage({ onWaOpen }) {
  return <DevServicePage
    pageKey="interior"
    title="Desain Interior"
    subtitle="Wujudkan interior impian Anda — dari teras hingga kamar tidur, setiap ruang dirancang indah, fungsional, dan mencerminkan kepribadian Anda."
    icon="🛋️"
    heroColor="linear-gradient(135deg,#4a1942 0%,#7b3f8a 50%,#b565c0 100%)"
    onWaOpen={onWaOpen}
    sections={[
      {
        tag: "Ruang Utama",
        title: "Layanan Desain Interior Lengkap",
        items: [
          { icon: "🏠", title: "Teras", desc: "Desain teras yang menyambut — kombinasi material, pencahayaan, dan tanaman hias yang harmonis." },
          { icon: "🛋️", title: "Ruang Tamu", desc: "Furnitur elegan, layout optimal, dan dekorasi yang menciptakan kesan pertama yang kuat." },
          { icon: "👨‍👩‍👧", title: "Ruang Keluarga", desc: "Ruang hangat dan fungsional untuk quality time keluarga dengan konsep cozy living." },
          { icon: "🛏️", title: "Kamar Tidur", desc: "Desain kamar nyaman dan personal — dari master bedroom hingga kamar anak yang kreatif." },
          { icon: "🚿", title: "Kamar Mandi", desc: "Bathroom modern dengan material premium, pencahayaan spa, dan layout yang efisien." },
          { icon: "🍳", title: "Kitchen Set", desc: "Dapur impian dengan kabinet custom, material tahan lama, dan ergonomis untuk memasak." },
          { icon: "🔲", title: "Plafon", desc: "Desain plafon kreatif — drop ceiling, gypsum, kayu, dan pencahayaan tersembunyi (hidden lamp)." },
          { icon: "📺", title: "Backdrop TV", desc: "Feature wall TV yang menjadi focal point ruangan — material batu alam, kayu, panel 3D, dll." },
        ]
      },
      {
        tag: "Proses Kerja",
        title: "Alur Proyek Interior",
        items: [
          { icon: "📝", title: "Survei & Ukur", desc: "Tim kami datang langsung ke lokasi untuk mengukur dan memahami kondisi lapangan." },
          { icon: "🎨", title: "Konsep & 3D Visual", desc: "Presentasi desain 3D lengkap sebelum eksekusi agar Anda tahu hasilnya." },
          { icon: "🔨", title: "Eksekusi & Finishing", desc: "Pengerjaan oleh tenaga ahli berpengalaman dengan quality control ketat." },
        ]
      }
    ]}
  />;
}

/* ── Page: Pagar Rumah ── */
function PagarPage({ onWaOpen }) {
  return <DevServicePage
    pageKey="pagar"
    title="Pagar Rumah"
    subtitle="Pagar bukan sekadar keamanan — ini ekspresi pertama rumah Anda. Kami menghadirkan pagar yang kokoh, estetis, dan sesuai karakter hunian Anda."
    icon="🔒"
    heroColor="linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)"
    onWaOpen={onWaOpen}
    sections={[
      {
        tag: "Jenis Pagar",
        title: "Pilihan Model & Material Pagar",
        items: [
          { icon: "🔩", title: "Pagar Besi Tempa", desc: "Klasik dan kokoh, tersedia berbagai motif ornamen — cocok untuk rumah gaya Eropa atau klasik." },
          { icon: "⬛", title: "Pagar Hollow Minimalis", desc: "Garis bersih dari besi hollow finishing cat duco — populer untuk rumah modern minimalis." },
          { icon: "🌿", title: "Pagar Panel Kayu + Besi", desc: "Kombinasi kayu solid/WPC dengan rangka besi — kesan natural namun tetap modern dan tahan lama." },
          { icon: "🧱", title: "Pagar Tembok + Ornamen", desc: "Dinding bata/batako finishing plester dengan sisipan ornamen besi atau roster kerawang." },
          { icon: "🚪", title: "Pintu Gerbang Otomatis", desc: "Gate geser/lipat dengan motor otomatis dan remote control untuk kemudahan akses." },
          { icon: "✨", title: "Pagar Stainless Steel", desc: "Tampilan premium dan anti karat — pilihan ideal untuk hunian mewah dan eksklusif." },
        ]
      },
      {
        tag: "Proses",
        title: "Cara Kerja Kami",
        items: [
          { icon: "📐", title: "Survei & Desain", desc: "Pengukuran lokasi dan presentasi desain 3D sebelum produksi dimulai." },
          { icon: "🏭", title: "Fabrikasi Custom", desc: "Diproduksi sesuai ukuran dan desain di workshop kami dengan standar kualitas tinggi." },
          { icon: "🔧", title: "Instalasi & Finishing", desc: "Pemasangan oleh tim terlatih, termasuk cat, galvanis, atau finishing sesuai spesifikasi." },
        ]
      }
    ]}
  />;
}

/* ── Page: Kanopi ── */
function KanopiPage({ onWaOpen }) {
  return <DevServicePage
    pageKey="kanopi"
    title="Kanopi"
    subtitle="Lindungi carport, teras, atau area outdoor Anda dengan kanopi yang fungsional dan estetis. Berbagai material dan model tersedia sesuai kebutuhan."
    icon="🏗️"
    heroColor="linear-gradient(135deg,#1b4332 0%,#2d6a4f 50%,#52b788 100%)"
    onWaOpen={onWaOpen}
    sections={[
      {
        tag: "Jenis Kanopi",
        title: "Model & Material Kanopi",
        items: [
          { icon: "🔵", title: "Kanopi Polycarbonate", desc: "Ringan, tembus cahaya, dan tahan UV. Pilihan paling populer untuk carport dan teras." },
          { icon: "🔩", title: "Kanopi Rangka Besi Hollow", desc: "Struktur kokoh dari besi hollow galvanis dengan penutup atap polycarbonate atau spandek." },
          { icon: "🌊", title: "Kanopi Alderon / UPVC", desc: "Material anti karat, ringan, dan estetis — tidak perlu cat ulang, perawatan minimal." },
          { icon: "🏠", title: "Kanopi Atap Kaca", desc: "Tampilan premium dan modern, memaksimalkan cahaya alami sekaligus terlindungi dari hujan." },
          { icon: "🎨", title: "Kanopi Custom Laser Cut", desc: "Ornamen plat besi dengan pola custom dipotong laser untuk sentuhan artistik yang unik." },
          { icon: "🔑", title: "Kanopi Alderon (HPL)", desc: "Panel HPL berwarna-warni untuk tampilan modern dan colorful sesuai selera." },
        ]
      },
      {
        tag: "Area Aplikasi",
        title: "Dimana Kanopi Dipasang?",
        items: [
          { icon: "🚗", title: "Carport / Garasi", desc: "Pelindung kendaraan dari panas dan hujan sekaligus mempercantik area depan rumah." },
          { icon: "☕", title: "Teras Belakang / Balkon", desc: "Jadikan teras sebagai ruang outdoor yang nyaman sepanjang hari sepanjang tahun." },
          { icon: "🏪", title: "Ruko & Komersial", desc: "Kanopi teras ruko, restoran, atau kafe yang meningkatkan daya tarik eksterior bisnis." },
        ]
      }
    ]}
  />;
}

/* ── Page: Aluminium ── */
function AluminiumPage({ onWaOpen }) {
  return <DevServicePage
    pageKey="aluminium"
    title="Aluminium"
    subtitle="Kusen, pintu, jendela, dan partisi aluminium berkualitas tinggi — ringan, anti karat, dan tersedia dalam berbagai profil dan warna finishing."
    icon="🔲"
    heroColor="linear-gradient(135deg,#2b2d42 0%,#555b6e 50%,#8d99ae 100%)"
    onWaOpen={onWaOpen}
    sections={[
      {
        tag: "Produk Aluminium",
        title: "Rangkaian Produk Aluminium Kami",
        items: [
          { icon: "🪟", title: "Kusen & Jendela Aluminium", desc: "Anti karat, tidak perlu dicat ulang, dan tersedia sistem swing, casement, maupun sliding." },
          { icon: "🚪", title: "Pintu Aluminium", desc: "Ringan namun kuat — pilihan ideal untuk pintu kamar mandi, balkon, dan eksterior." },
          { icon: "🔲", title: "Partisi Aluminium & Kaca", desc: "Pembatas ruang kantor atau rumah yang elegan dan mudah disesuaikan." },
          { icon: "🌿", title: "Fasad Aluminium Composite", desc: "ACP (Aluminium Composite Panel) untuk cladding fasad eksterior modern dan premium." },
          { icon: "🏠", title: "Canopy Aluminium", desc: "Kanopi dari profil aluminium ekstrusi — ringan, anti karat, dan estetis." },
          { icon: "📐", title: "Railing & Handrail", desc: "Pegangan tangga dan railing balkon dari aluminium finishing powder coat aneka warna." },
        ]
      },
      {
        tag: "Keunggulan",
        title: "Mengapa Memilih Aluminium?",
        items: [
          { icon: "🛡️", title: "Anti Karat & Tahan Lama", desc: "Tidak berkarat meski terpapar hujan dan panas ekstrem — perawatan minimal, usia panjang." },
          { icon: "⚡", title: "Ringan & Kuat", desc: "Ratio kekuatan-bobot tinggi sehingga tidak membebani struktur bangunan." },
          { icon: "🎨", title: "Aneka Pilihan Warna", desc: "Finishing powder coat dengan ratusan pilihan warna agar cocok dengan tema hunian Anda." },
        ]
      }
    ]}
  />;
}

/* ── Page: Landscape & Taman ── */
const LANDSCAPE_CATEGORIES = [
  {
    id: "taman-depan",
    icon: "🌿",
    title: "Contoh Desain Taman Depan",
    desc: "Kesan pertama hunian Anda dimulai dari taman depan. Kami menghadirkan desain teras dan taman depan yang memukau — dari gaya minimalis modern hingga tropis nan asri.",
    startFrom: 4500000,
    satuan: "paket",
    slides: [
      { img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80", tema: "Minimalis Modern", desc: "Taman depan bersih dengan jalur batu andesit, tanaman hias rendah, dan lampu sorot tersembunyi. Cocok untuk rumah bergaya kontemporer." },
      { img: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80", tema: "Tropis Resort", desc: "Nuansa villa tropis di depan rumah — palm mini, heliconia, dan kerikil putih menciptakan ambiance resort yang mewah." },
      { img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80", tema: "Japanese Zen", desc: "Taman gaya Jepang dengan batu stepping, lumut hijau, bambu, dan air mengalir. Tenang dan meditatif setiap hari." },
      { img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80", tema: "Teras Santai Bohemian", desc: "Area teras dengan pergola rotan, tanaman merambat, dan kursi outdoor. Tempat bersantai paling favorit di sore hari." },
      { img: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80", tema: "Klasik Eropa", desc: "Simetri elegan khas taman Eropa — pagar hidup teratur, pot bunga warna-warni, dan jalur batu bata merah yang menawan." },
      { img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=800&q=80", tema: "Modern Industrial", desc: "Konsep industrial dengan raised planter box besi cor, tanaman sukulen, dan pencahayaan warm-white di malam hari." },
    ]
  },
  {
    id: "taman-belakang",
    icon: "🏡",
    title: "Contoh Desain Taman Belakang",
    desc: "Halaman belakang adalah surga pribadi Anda. Kami mengubahnya menjadi oasis relaksasi — area bermain anak, ruang makan outdoor, hingga taman sayur organik.",
    startFrom: 7500000,
    satuan: "paket",
    slides: [
      { img: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&q=80", tema: "Outdoor Living Room", desc: "Ruang keluarga terbuka di taman belakang — sofa outdoor, pergola kayu, dan area BBQ. Sempurna untuk berkumpul keluarga." },
      { img: "https://images.unsplash.com/photo-1558905586-b022cc14d2b3?w=800&q=80", tema: "Tropical Oasis", desc: "Lebatnya tanaman tropis menciptakan privasi alami. Kolam mini, deck kayu, dan hammock — liburan tanpa pergi jauh." },
      { img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80", tema: "Minimalis Elegan", desc: "Rumput hijau terawat, border batu, dan stepping stone. Desain simpel yang tidak memerlukan perawatan intensif." },
      { img: "https://images.unsplash.com/photo-1592595896551-12b371d546d5?w=800&q=80", tema: "Taman Bermain Keluarga", desc: "Zona bermain anak yang aman dengan rumput sintetis lembut, ayunan, dan area sandbox. Dikombinasikan taman orang tua." },
      { img: "https://images.unsplash.com/photo-1523301343968-6a6ebf63c672?w=800&q=80", tema: "Mediterania", desc: "Inspiraasi taman Mediterania — lavender, rosemary, batu koral, dan pergola besi tempa. Romantis dan wangi sepanjang hari." },
      { img: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80", tema: "Taman Sayur Organik", desc: "Raised bed box kayu untuk sayur dan herba organik. Estetis sekaligus produktif — petik langsung dari taman rumah." },
    ]
  },
  {
    id: "rooftop",
    icon: "🏙️",
    title: "Contoh Desain Roof Top Garden",
    desc: "Manfaatkan atap dak Anda menjadi taman rooftop yang spektakuler. Kami merancang taman atap yang ringan, tahan angin, dan memiliki sistem drainase sempurna.",
    startFrom: 12000000,
    satuan: "paket",
    slides: [
      { img: "https://images.unsplash.com/photo-1567016432779-094069958ea5?w=800&q=80", tema: "Sky Lounge Garden", desc: "Lounge eksklusif di atap dengan sofa outdoor premium, tanaman dalam pot besar, dan pencahayaan ambiance malam hari." },
      { img: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80", tema: "Minimalis Urban", desc: "Desain bersih untuk rooftop kota — deck composite, tanaman pot rendah, dan railing kaca untuk view kota yang maksimal." },
      { img: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80", tema: "Tropical Rooftop", desc: "Suasana resort di atas gedung. Tanaman tropis tinggi sebagai windbreak alami, hammock, dan area santai yang teduh." },
      { img: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80", tema: "Rooftop Dining", desc: "Area makan outdoor di atap dengan meja kayu solid, lampu gantung vintage, dan taman herba aromatik di sekelilingnya." },
      { img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80", tema: "Green Roof Modern", desc: "Atap hijau dengan sistem tanam modular ringan. Menurunkan suhu bangunan sekaligus menciptakan estetika hijau dari bawah." },
      { img: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80", tema: "Zen Rooftop", desc: "Keheningan di atas ketinggian. Kerikil zen, tanaman bonsai, dan bangku meditasi — meditasi pagi yang mewah setiap hari." },
    ]
  },
  {
    id: "vertical-garden",
    icon: "🌺",
    title: "Contoh Desain Vertical Garden",
    desc: "Solusi taman untuk ruang terbatas. Dinding hijau vertikal kami hadir sebagai statement piece yang hidup — menyejukkan, memperindah, dan meningkatkan kualitas udara.",
    startFrom: 2800000,
    satuan: "m²",
    slides: [
      { img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80", tema: "Living Wall Interior", desc: "Dinding hidup di dalam ruangan — sistem irigasi otomatis tersembunyi, media tanam hidroponik, dan pilihan 30+ jenis tanaman hias." },
      { img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80", tema: "Facade Vertical Garden", desc: "Tampak depan rumah yang memukau dengan vertical garden fasad. Tanaman tahan UV dan cuaca, perawatan minimal." },
      { img: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80", tema: "Herb Wall Kitchen", desc: "Dinding herba aromatik di area dapur — basil, mint, rosemary, thyme. Segar, wangi, dan bisa dipetik kapan saja." },
      { img: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80", tema: "Office Green Wall", desc: "Vertical garden di area kerja atau lobby kantor. Terbukti meningkatkan produktivitas dan mengurangi stres karyawan." },
      { img: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&q=80", tema: "Tropical Statement Wall", desc: "Komposisi tanaman tropis dramatis — monstera, philodendron, dan pakis raksasa. Bold dan instagrammable." },
      { img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80", tema: "Minimalis Moss Wall", desc: "Dinding lumut hijau yang tidak membutuhkan air — ideal untuk indoor tanpa sinar langsung. Estetis dan zero maintenance." },
    ]
  },
  {
    id: "kolam-hias",
    icon: "💧",
    title: "Contoh Desain Kolam Hias & Air Mancur",
    desc: "Suara gemericik air adalah musik alami paling menenangkan. Kolam hias dan air mancur kami dirancang untuk keindahan visual sekaligus menciptakan mikroklimat yang sejuk.",
    startFrom: 8000000,
    satuan: "paket",
    slides: [
      { img: "https://images.unsplash.com/photo-1523301343968-6a6ebf63c672?w=800&q=80", tema: "Kolam Koi Jepang", desc: "Kolam koi bergaya Jepang lengkap dengan filter biologis, batu suiseki, jembatan mini kayu, dan ikan koi pilihan warna-warni." },
      { img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80", tema: "Waterfall Minimalis", desc: "Air terjun dinding batu alam yang elegan. Suara gemericik konstan menciptakan ambiance premium di halaman rumah Anda." },
      { img: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80", tema: "Fountain Klasik", desc: "Air mancur tengah taman bergaya klasik Eropa — patung lion head, mangkuk bertingkat, dan pencahayaan bawah air berwarna." },
      { img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80", tema: "Kolam Renang Natural", desc: "Natural pool dengan border batu andesit, filter tanaman, dan waterfall tepi — kolam yang menyatu sempurna dengan taman." },
      { img: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80", tema: "Air Mancur Modern", desc: "Instalasi air mancur geometris modern dari stainless steel. Jet air presisi dengan sistem kontrol otomatis dan LED underwater." },
      { img: "https://images.unsplash.com/photo-1592595896551-12b371d546d5?w=800&q=80", tema: "Kolam Teratai", desc: "Kolam dangkal dengan teratai dan eceng gondok — habitat alami yang juga berfungsi sebagai biofilter alami yang indah." },
    ]
  },
  {
    id: "lampu-taman",
    icon: "💡",
    title: "Contoh Desain Lampu Taman & Outdoor Lighting",
    desc: "Taman yang indah di siang hari harus tetap memukau di malam hari. Sistem pencahayaan outdoor kami mengubah taman menjadi panggung cahaya yang dramatis dan romantis.",
    startFrom: 1500000,
    satuan: "paket",
    slides: [
      { img: "https://images.unsplash.com/photo-1558905586-b022cc14d2b3?w=800&q=80", tema: "Fairy Light Garden", desc: "Ribuan lampu kabel tembaga menyelimuti pepohonan dan pergola — menciptakan suasana magis seperti bintang di taman Anda." },
      { img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80", tema: "Uplighting Dramatic", desc: "Lampu sorot LED dari bawah yang menyinari pohon dan dinding — efek dramatis yang menonjolkan tekstur dan bentuk tanaman." },
      { img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=800&q=80", tema: "Solar Path Lighting", desc: "Lampu jalur solar-powered di sepanjang stepping stone. Otomatis menyala saat gelap — hemat energi dan instalasi mudah." },
      { img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80", tema: "Lantern Taman Klasik", desc: "Lentera besi tempa bergaya klasik sebagai focal point taman. Tersedia dalam versi gas, listrik, dan solar." },
      { img: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80", tema: "LED Underwater Kolam", desc: "Pencahayaan dalam air berwarna RGB untuk kolam hias dan air mancur. Efek spektakuler dengan kendali remote atau smartphone." },
      { img: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80", tema: "String Light Pergola", desc: "Lampu bohlam vintage di atas pergola outdoor — ambiance bistro Eropa untuk area makan terbuka Anda." },
    ]
  },
];

const ELEMEN_PREMIUM = [
  { icon: "🪨", title: "Batu Alam & Kerikil", desc: "Batu andesit, batu candi, kerikil warna — untuk jalur taman, dinding, dan aksen dekoratif.", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
  { icon: "🌳", title: "Tanaman Pilihan Premium", desc: "Seleksi tanaman sesuai iklim lokal — tahan panas, mudah dirawat, dan bernilai estetis tinggi.", img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80" },
  { icon: "🏗️", title: "Pergola & Gazebo", desc: "Struktur atap taman dari kayu ulin atau besi untuk area duduk yang nyaman di luar ruangan.", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80" },
  { icon: "🌺", title: "Tanaman Hias Eksotis", desc: "Koleksi tanaman hias langka dan eksotis — heliconia, bromelia, monstera deliciosa, agave.", img: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&q=80" },
  { icon: "🪵", title: "Deck & Paving Custom", desc: "Decking kayu ulin, composite, atau batu paving motif custom untuk area duduk dan jalur taman.", img: "https://images.unsplash.com/photo-1558905586-b022cc14d2b3?w=400&q=80" },
  { icon: "🦋", title: "Dekorasi & Aksesoris", desc: "Patung taman, pot artisanal, windchime, dan elemen dekorasi outdoor untuk sentuhan personal.", img: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400&q=80" },
];

function LandscapeSlideshow({ slides }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);

  const goTo = useCallback((i) => {
    setIdx(i);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setIdx(p => (p + 1) % slides.length), 4000);
  }, [slides.length]);

  useEffect(() => {
    timerRef.current = setInterval(() => setIdx(p => (p + 1) % slides.length), 4000);
    return () => clearInterval(timerRef.current);
  }, [slides.length]);

  const slide = slides[idx];
  return (
    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,.18)" }}>
      {/* Image */}
      <div style={{ position: "relative", height: 340, overflow: "hidden", background: "#1a472a" }}>
        <img key={idx} src={slide.img} alt={slide.tema}
          style={{ width: "100%", height: "100%", objectFit: "cover", animation: "lsFade .5s ease" }}
          onError={e => { e.target.style.display = "none"; }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.72) 0%, rgba(0,0,0,.1) 60%, transparent 100%)" }} />
        {/* Tema badge */}
        <div style={{ position: "absolute", top: 16, left: 16, background: "rgba(46,61,63,.85)", backdropFilter: "blur(8px)", color: "#C9AA71", fontSize: "0.68rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 20 }}>
          {slide.tema}
        </div>
        {/* Counter */}
        <div style={{ position: "absolute", top: 16, right: 16, background: "rgba(0,0,0,.5)", color: "#fff", fontSize: "0.7rem", fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}>
          {idx + 1} / {slides.length}
        </div>
        {/* Desc */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 20px 18px" }}>
          <p style={{ color: "#fff", fontSize: "0.88rem", lineHeight: 1.65, margin: 0, textShadow: "0 1px 4px rgba(0,0,0,.5)" }}>{slide.desc}</p>
        </div>
        {/* Nav arrows */}
        {["◀", "▶"].map((ch, d) => (
          <button key={d} onClick={() => goTo((idx + (d === 0 ? -1 : 1) + slides.length) % slides.length)}
            style={{ position: "absolute", top: "50%", [d === 0 ? "left" : "right"]: 12, transform: "translateY(-50%)", background: "rgba(255,255,255,.18)", backdropFilter: "blur(6px)", border: "none", color: "#fff", fontSize: 16, width: 36, height: 36, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background .2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.36)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.18)"}>
            {ch}
          </button>
        ))}
      </div>
      {/* Dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 7, padding: "14px 0", background: "#fff" }}>
        {slides.map((_, i) => (
          <button key={i} onClick={() => goTo(i)}
            style={{ width: i === idx ? 22 : 8, height: 8, borderRadius: 4, background: i === idx ? "#2d6a4f" : "#C9AA71", border: "none", cursor: "pointer", transition: "all .3s", padding: 0 }} />
        ))}
      </div>
    </div>
  );
}

function LandscapePage({ onWaOpen }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const fmt = (n) => "Rp " + n.toLocaleString("id-ID") + ",-";

  return (
    <div style={{ background: "#FAF7F0", minHeight: "100vh" }}>
      <style>{`@keyframes lsFade{from{opacity:0;transform:scale(1.03)}to{opacity:1;transform:scale(1)}}`}</style>

      {/* ── HERO ── */}
      <div style={{ background: "linear-gradient(135deg,#1a472a 0%,#2d6a4f 50%,#40916c 100%)", padding: "72px 5% 64px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: "radial-gradient(circle at 30% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 70% 80%, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.12)", borderRadius: 20, padding: "6px 18px", marginBottom: 20 }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#A8D5B5" }}>VASTURA GROUP</span>
          </div>
          <div style={{ fontSize: "clamp(2.5rem,8vw,4rem)", marginBottom: 12 }}>🌳</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.75rem,5vw,2.75rem)", fontWeight: 900, color: "#fff", margin: "0 0 16px", lineHeight: 1.2 }}>Landscape & Taman</h1>
          <p style={{ fontSize: "clamp(0.875rem,2vw,1rem)", color: "rgba(255,255,255,.8)", lineHeight: 1.8, margin: "0 0 28px" }}>
            Ciptakan taman impian yang asri, hijau, dan menenangkan. Kami menghadirkan desain landscape profesional untuk hunian, perumahan, maupun area komersial.
          </p>
          <button onClick={() => onWaOpen && onWaOpen({ key: "konsultasi", vars: {} })}
            style={{ background: "#C9AA71", color: "#2E3D3F", border: "none", borderRadius: 10, padding: "14px 32px", fontSize: "0.9rem", fontWeight: 800, cursor: "pointer", letterSpacing: ".05em" }}>
            💬 Konsultasi Gratis
          </button>
        </div>
      </div>

      {/* ── KATEGORI SLIDESHOW ── */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "64px 5% 40px" }}>
        {LANDSCAPE_CATEGORIES.map((cat, ci) => (
          <div key={cat.id} style={{ marginBottom: 80 }}>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 32 }}>
              <div style={{ width: 52, height: 52, background: "linear-gradient(135deg,#1a472a,#40916c)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                {cat.icon}
              </div>
              <div>
                <div style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "#40916c", marginBottom: 6 }}>Kategori {String(ci + 1).padStart(2, "0")}</div>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.25rem,3vw,1.75rem)", fontWeight: 900, color: "#2E3D3F", margin: "0 0 8px", lineHeight: 1.2 }}>{cat.title}</h2>
                <p style={{ fontSize: "0.875rem", color: "#5A6A6C", lineHeight: 1.7, margin: 0, maxWidth: 600 }}>{cat.desc}</p>
              </div>
            </div>

            {/* Grid: slideshow + harga */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28, alignItems: "start" }}>
              <LandscapeSlideshow slides={cat.slides} />

              {/* Harga card */}
              <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,.08)", border: "1px solid #E8DCC8", position: "sticky", top: 80 }}>
                <div style={{ background: "linear-gradient(135deg,#1a472a,#2d6a4f)", padding: "20px 22px 18px" }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "#A8D5B5", marginBottom: 6 }}>Harga Mulai Dari</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.6rem", fontWeight: 900, color: "#C9AA71", lineHeight: 1 }}>{fmt(cat.startFrom)}</div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,.6)", marginTop: 4 }}>/{cat.satuan} · harga dapat bervariasi</div>
                </div>
                <div style={{ padding: "20px 22px" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#2E3D3F", marginBottom: 12 }}>Yang kami tawarkan:</div>
                  {["Konsultasi & survei lokasi gratis", "Desain 3D visualisasi taman", "Material premium pilihan", "Pengerjaan oleh tim profesional", "Garansi pengerjaan & tanaman"].map((p, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
                      <span style={{ color: "#40916c", fontWeight: 800, flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span style={{ fontSize: "0.8rem", color: "#5A6A6C", lineHeight: 1.5 }}>{p}</span>
                    </div>
                  ))}
                  <button onClick={() => onWaOpen && onWaOpen({ key: "layanan", vars: { judul_layanan: cat.title } })}
                    style={{ width: "100%", background: "linear-gradient(135deg,#1a472a,#40916c)", color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: "0.85rem", fontWeight: 800, cursor: "pointer", marginTop: 16, letterSpacing: ".04em" }}>
                    🌿 Tanya Harga & Detail
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── ELEMEN TAMAN PREMIUM ── */}
      <div style={{ background: "#fff", padding: "64px 5%", borderTop: "1px solid #E8DCC8", borderBottom: "1px solid #E8DCC8" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "#40916c", marginBottom: 8 }}>Material & Elemen</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.5rem,4vw,2.25rem)", fontWeight: 900, color: "#2E3D3F", margin: "0 0 14px" }}>Elemen Taman Premium</h2>
            <p style={{ fontSize: "0.9375rem", color: "#5A6A6C", maxWidth: 520, margin: "0 auto", lineHeight: 1.75 }}>Kami hanya menggunakan material terpilih untuk memastikan taman Anda indah, tahan lama, dan mudah dirawat.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 24 }}>
            {ELEMEN_PREMIUM.map((el, i) => (
              <div key={i} style={{ background: "#FAF7F0", borderRadius: 14, overflow: "hidden", border: "1px solid #E8DCC8", transition: "box-shadow .2s" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,.1)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                <div style={{ height: 160, overflow: "hidden", background: "#E8DCC8" }}>
                  <img src={el.img} alt={el.title} loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .4s" }}
                    onMouseEnter={e => e.target.style.transform = "scale(1.07)"}
                    onMouseLeave={e => e.target.style.transform = "scale(1)"}
                    onError={e => { e.target.parentElement.innerHTML = `<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:2rem">${el.icon}</div>`; }} />
                </div>
                <div style={{ padding: "18px 18px 20px" }}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>{el.icon}</div>
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, color: "#2E3D3F", margin: "0 0 8px" }}>{el.title}</h3>
                  <p style={{ fontSize: "0.8125rem", color: "#5A6A6C", lineHeight: 1.65, margin: 0 }}>{el.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA BOTTOM ── */}
      <div style={{ padding: "60px 5%", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", background: "linear-gradient(135deg,#1a472a 0%,#2d6a4f 100%)", borderRadius: 20, padding: "48px 32px", color: "#fff" }}>
          <div style={{ fontSize: "0.7rem", letterSpacing: ".14em", textTransform: "uppercase", color: "#A8D5B5", fontWeight: 700, marginBottom: 12 }}>Konsultasi Gratis</div>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.25rem,3vw,1.75rem)", fontWeight: 900, margin: "0 0 12px" }}>Wujudkan Taman Impian Anda</h3>
          <p style={{ color: "rgba(255,255,255,.75)", fontSize: "0.9rem", margin: "0 0 28px", lineHeight: 1.7 }}>Tim landscape kami siap membantu dari survei, desain, hingga pemasangan dan perawatan berkala.</p>
          <button onClick={() => onWaOpen && onWaOpen({ key: "konsultasi", vars: {} })}
            style={{ background: "#C9AA71", color: "#2E3D3F", border: "none", borderRadius: 10, padding: "15px 36px", fontSize: "0.95rem", fontWeight: 800, cursor: "pointer", letterSpacing: ".05em" }}>
            🌳 Hubungi Tim Landscape Kami
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════ WA TEMPLATE HELPER ════════════════════════════════════════════ */
/**
 * buildWaMsg(templates, key, vars)
 * - templates : data.content.waTemplates
 * - key       : "umum" | "paket" | "konsultasi" | "desainrab" | "layanan"
 * - vars      : { judul_paket, harga, judul_layanan, ... }
 * Mengganti placeholder {xxx} dengan nilai vars, lalu memformat \n
 */
function buildWaMsg(templates = {}, key = "umum", vars = {}) {
  const tpl = templates[key] || templates.umum || "Halo VASTURA GROUP!";
  return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] || "");
}

/* ════════════════════════════════════════════ WA PICKER MODAL ════════════════════════════════════════════ */
function WaPickerModal({ admins = [], msgText = "", onClose }) {
  if (!admins || admins.length === 0) return null;

  // Urutkan: primary selalu di atas
  const sorted = [...admins].sort((a, b) => (b.primary ? 1 : 0) - (a.primary ? 1 : 0));

  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 9995, background: "rgba(10,20,30,.55)",
        backdropFilter: "blur(7px)", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "12px" }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 16, padding: "16px 18px 14px", maxWidth: 360, width: "100%",
          maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,.22)", position: "relative" }}>

        {/* Close */}
        <button onClick={onClose}
          style={{ position: "absolute", top: 10, right: 12, background: "none", border: "none",
            fontSize: 20, color: "#2E3D3F", cursor: "pointer", lineHeight: 1, opacity: .5 }}>✕</button>

        {/* Header — Logo + Judul */}
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 7 }}>
            <img src={VASTURA_LOGO_URL} alt="Vastura Group"
              style={{ height: 40, maxWidth: 140, width: "auto", objectFit: "contain" }} />
          </div>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#2E3D3F", margin: "0 0 2px", letterSpacing: ".02em" }}>
            Hubungi Kami via WhatsApp
          </h2>
          <p style={{ fontSize: 11, color: "#5A6A6C", margin: 0 }}>
            Pilih kontak yang ingin Anda hubungi
          </p>
        </div>

        {/* Admin cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sorted.map(admin => {
            const waUrl = admin.wa + (msgText ? `?text=${encodeURIComponent(msgText)}` : "");
            const isPrimary = !!admin.primary;
            return (
              <div key={admin.id}
                style={{
                  border: isPrimary ? "2px solid #25d366" : "1.5px solid #E8DCC8",
                  borderRadius: 10,
                  background: isPrimary ? "#f0fdf4" : "#FDFAF4",
                  overflow: "hidden",
                }}>

                {isPrimary && (
                  <div style={{ background: "#25d366", color: "#fff", fontSize: 9.5, fontWeight: 800,
                    letterSpacing: ".1em", textTransform: "uppercase", padding: "3px 12px" }}>
                    ⭐ WhatsApp Utama
                  </div>
                )}

                <div style={{ padding: "10px 14px 10px", display: "flex", alignItems: "center", gap: 12 }}>
                  {/* Info kiri: Nama + Jabatan */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 8.5, fontWeight: 700, color: "#A89070", letterSpacing: ".1em",
                      textTransform: "uppercase", marginBottom: 1 }}>Nama</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#2E3D3F", marginBottom: 4,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {admin.name || "—"}
                    </div>
                    <div style={{ fontSize: 8.5, fontWeight: 700, color: "#A89070", letterSpacing: ".1em",
                      textTransform: "uppercase", marginBottom: 1 }}>Jabatan</div>
                    <div style={{ fontSize: 11, color: "#5A6A6C" }}>
                      {admin.jabatan || "—"}
                    </div>
                  </div>

                  {/* Tombol WA kanan — kompak vertikal */}
                  <a href={waUrl} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                      padding: "9px 13px",
                      background: isPrimary ? "#25d366" : "#2E3D3F",
                      color: "#fff", textDecoration: "none",
                      borderRadius: 8, fontSize: 11, fontWeight: 700,
                      flexShrink: 0, whiteSpace: "nowrap",
                      transition: "opacity .18s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = ".85"; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.126 1.535 5.862L0 24l6.341-1.512C8.024 23.452 9.973 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.92 0-3.71-.507-5.25-1.39l-.375-.224-3.887.927.958-3.788-.245-.39C2.507 15.64 2 13.882 2 12 2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                    </svg>
                    Chat via<br/>WhatsApp
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Jam Layanan */}
        <div style={{ textAlign: "center", marginTop: 10, padding: "8px 0 6px",
          borderTop: "1px solid #F0EAD8" }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: "#A89070", letterSpacing: ".1em",
            textTransform: "uppercase", marginBottom: 2 }}>Jam Layanan</div>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: "#5A6A6C", marginBottom: 1 }}>Setiap Hari</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#2E3D3F", letterSpacing: ".04em" }}>
            — 08.00 – 17.00 —
          </div>
        </div>

        <button onClick={onClose}
          style={{ width: "100%", marginTop: 8, padding: "9px 0", border: "1.5px solid #E8DCC8",
            borderRadius: 8, background: "transparent", color: "#5A6A6C", fontSize: 12, fontWeight: 600,
            cursor: "pointer", transition: "all .2s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#2E3D3F"; e.currentTarget.style.color = "#2E3D3F"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#E8DCC8"; e.currentTarget.style.color = "#5A6A6C"; }}>
          Tutup
        </button>
      </div>
    </div>
  );
}

/* ─────────────── WA ADMIN MANAGER ─────────────── */
function WaAdminManager({ admins = [], onSave, notify }) {
  const [list, setList] = useState(() => admins.map((a, i) => ({ ...a, id: a.id ?? i + 1 })));
  const [dirty, setDirty] = useState(false);

  function update(id, field, val) {
    setList(prev => prev.map(a => a.id === id ? { ...a, [field]: val } : a));
    setDirty(true);
  }
  function setPrimary(id) {
    setList(prev => prev.map(a => ({ ...a, primary: a.id === id })));
    setDirty(true);
  }
  function addAdmin() {
    const newId = Date.now();
    setList(prev => [...prev, { id: newId, name: "", jabatan: "", wa: "https://wa.me/62", primary: false }]);
    setDirty(true);
  }
  function removeAdmin(id) {
    setList(prev => prev.filter(a => a.id !== id));
    setDirty(true);
  }
  function handleSave() {
    const invalid = list.find(a => !a.name.trim() || !a.wa.trim());
    if (invalid) { notify("⚠️ Nama dan nomor WA wajib diisi!"); return; }
    onSave(list);
    setDirty(false);
  }

  const cardStyle = { background: "#fff", borderRadius: 8, padding: "16px 18px", marginBottom: 10, boxShadow: "0 1px 4px rgba(0,0,0,.06)", border: "1px solid #eee", display: "flex", flexDirection: "column", gap: 10 };
  const inputStyle = { width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, boxSizing: "border-box" };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: "#5A6A6C", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4, display: "block" };

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: "18px 20px", marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase" }}>📱 Admin WhatsApp</label>
        <button onClick={addAdmin} style={{ fontSize: 12, padding: "5px 12px", background: "#25d366", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>+ Tambah Admin</button>
      </div>

      {list.map((admin) => (
        <div key={admin.id} style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="radio" name="wa_primary" checked={!!admin.primary} onChange={() => setPrimary(admin.id)} title="Jadikan Admin Utama" style={{ accentColor: "#25d366", width: 16, height: 16 }} />
            <span style={{ fontSize: 11, color: "#888" }}>{admin.primary ? "⭐ Admin Utama (WA default)" : "Jadikan utama"}</span>
            <button onClick={() => removeAdmin(admin.id)} style={{ marginLeft: "auto", fontSize: 11, padding: "3px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 5, cursor: "pointer" }}>Hapus</button>
          </div>
          <div>
            <label style={labelStyle}>Nama Admin</label>
            <input style={inputStyle} value={admin.name} onChange={e => update(admin.id, "name", e.target.value)} placeholder="cth: Heldan Widiananta" />
          </div>
          <div>
            <label style={labelStyle}>Jabatan</label>
            <input style={inputStyle} value={admin.jabatan || ""} onChange={e => update(admin.id, "jabatan", e.target.value)} placeholder="cth: Chief Executive Officer" />
          </div>
          <div>
            <label style={labelStyle}>Nomor WA Link (format: https://wa.me/628xxx)</label>
            <input style={inputStyle} value={admin.wa} onChange={e => update(admin.id, "wa", e.target.value)} placeholder="https://wa.me/628123456789" />
          </div>
        </div>
      ))}

      {list.length === 0 && <p style={{ fontSize: 13, color: "#aaa", textAlign: "center", padding: "12px 0" }}>Belum ada admin. Klik "+ Tambah Admin".</p>}

      {dirty && (
        <button onClick={handleSave} style={{ marginTop: 6, width: "100%", padding: "10px", background: "#2E3D3F", color: "#fff", border: "none", borderRadius: 7, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          💾 Simpan Daftar Admin WA
        </button>
      )}
    </div>
  );
}

/* ─────────────── SOSMED MANAGER ─────────────── */
function SosmedManager({ content, onSave, notify }) {
  const [ig, setIg] = useState(content.igLink || "");
  const [fb, setFb] = useState(content.fbLink || "");
  const [dirty, setDirty] = useState(false);

  function handleSave() {
    onSave({ igLink: ig, fbLink: fb });
    setDirty(false);
    notify("✅ Link sosial media disimpan!");
  }

  const inputStyle = { width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, boxSizing: "border-box" };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: "#5A6A6C", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4, display: "block" };

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: "18px 20px", marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 14 }}>🌐 Link Sosial Media</label>
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>📷 Instagram URL</label>
        <input style={inputStyle} value={ig} onChange={e => { setIg(e.target.value); setDirty(true); }} placeholder="https://instagram.com/username" />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>📘 Facebook URL</label>
        <input style={inputStyle} value={fb} onChange={e => { setFb(e.target.value); setDirty(true); }} placeholder="https://facebook.com/username" />
      </div>
      {dirty && (
        <button onClick={handleSave} style={{ width: "100%", padding: "10px", background: "#2E3D3F", color: "#fff", border: "none", borderRadius: 7, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          💾 Simpan Link Sosmed
        </button>
      )}
    </div>
  );
}

/* ─────────────── NAV DROPDOWN: LAYANAN ─────────────── */
/* ─────────────── MOBILE LAYANAN ACCORDION (3-level) ─────────────── */
function MobileLayananAccordion({ page, navigateTo, setMobileMenu, navDropdownLayanan }) {
  const [open, setOpen]       = useState(false);
  const [subOpen, setSubOpen] = useState(null); // "interior"|"eksterior"|null

  const topPages = ["services","desainrab","temarumah"];

  const mBtn = (active, depth=0) => ({
    fontSize:".8rem", letterSpacing:".12em", textTransform:"uppercase", fontFamily:"'Jost',sans-serif",
    color:active?"var(--re-black)":"var(--re-grey-dk)", fontWeight:active?700:400,
    border:"none", background:active?"rgba(139,105,20,.08)":"transparent",
    textAlign:"left", padding:`11px ${18 + depth*14}px`, borderRadius:6, width:"100%",
    borderLeft:active?"2px solid #8B6914":"2px solid transparent", transition:"all .15s", cursor:"pointer",
    display:"flex", alignItems:"center", justifyContent:"space-between",
  });

  const isLayananActive = [...topPages,
    "interior/kamar-tidur","interior/kamar-mandi","interior/ruang-keluarga","interior/ruang-tamu","interior/kitchen-set","interior/ruang-kerja","interior/plafon-modern",
    "eksterior/pagar","eksterior/kanopi","eksterior/aluminium","eksterior/taman-landscape",
  ].some(k=>k===page);

  return (
    <div style={{ width:"100%" }}>
      {/* Header Layanan Kami */}
      <button onClick={()=>{ setOpen(v=>!v); setSubOpen(null); }}
        style={{ ...mBtn(isLayananActive), padding:"13px 18px", fontWeight:700 }}>
        <span>Layanan Kami</span>
        <span style={{ fontSize:"0.65rem", opacity:0.6, transition:"transform .2s", transform:open?"rotate(180deg)":"none" }}>▼</span>
      </button>

      {open && (
        <div style={{ background:"rgba(0,0,0,.02)", borderLeft:"2px solid #E8DCC8", marginLeft:18 }}>

          {/* Layanan Umum */}
          <div style={{ padding:"6px 16px 2px", fontSize:"0.58rem", fontWeight:800, letterSpacing:".14em", textTransform:"uppercase", color:"#8B9A9C" }}>Layanan</div>
          {navDropdownLayanan.filter(i=>topPages.includes(i.key)).map(item=>(
            <button key={item.key} onClick={()=>{ navigateTo(item.key); setMobileMenu(false); setOpen(false); }}
              style={mBtn(page===item.key, 1)}>
              {item.label}
            </button>
          ))}

          <div style={{ margin:"6px 16px", borderTop:"1px solid #E8DCC8" }}/>

          {/* Interior accordion */}
          <button onClick={()=>setSubOpen(v=>v==="interior"?null:"interior")}
            style={{ ...mBtn(page.startsWith("interior"), 1), justifyContent:"space-between" }}>
            <span>🛋️ Interior</span>
            <span style={{ fontSize:"0.65rem", opacity:0.6, transition:"transform .2s", transform:subOpen==="interior"?"rotate(180deg)":"none" }}>▼</span>
          </button>
          {subOpen==="interior" && (
            <div style={{ borderLeft:"2px solid #C9AA71", marginLeft:28 }}>
              {[
                {key:"interior/kamar-tidur",    label:"🛏️ Kamar Tidur"},
                {key:"interior/kamar-mandi",    label:"🚿 Kamar Mandi"},
                {key:"interior/ruang-keluarga", label:"👨‍👩‍👧 Ruang Keluarga"},
                {key:"interior/ruang-tamu",     label:"🛋️ Ruang Tamu"},
                {key:"interior/kitchen-set",    label:"🍳 Kitchen Set"},
                {key:"interior/ruang-kerja",    label:"💼 Ruang Kerja"},
                {key:"interior/plafon-modern",  label:"🏛️ Plafon Modern"},
              ].map(sub=>(
                <button key={sub.key} onClick={()=>{ navigateTo(sub.key); setMobileMenu(false); setOpen(false); setSubOpen(null); }}
                  style={mBtn(page===sub.key, 2)}>
                  {sub.label}
                </button>
              ))}
            </div>
          )}

          {/* Eksterior accordion */}
          <button onClick={()=>setSubOpen(v=>v==="eksterior"?null:"eksterior")}
            style={{ ...mBtn(page.startsWith("eksterior"), 1), justifyContent:"space-between" }}>
            <span>🏠 Eksterior</span>
            <span style={{ fontSize:"0.65rem", opacity:0.6, transition:"transform .2s", transform:subOpen==="eksterior"?"rotate(180deg)":"none" }}>▼</span>
          </button>
          {subOpen==="eksterior" && (
            <div style={{ borderLeft:"2px solid #C9AA71", marginLeft:28 }}>
              {[
                {key:"eksterior/pagar",     label:"🔒 Pagar"},
                {key:"eksterior/kanopi",    label:"🏗️ Kanopi"},
                {key:"eksterior/aluminium", label:"🪟 Aluminium"},
              ].map(sub=>(
                <button key={sub.key} onClick={()=>{ navigateTo(sub.key); setMobileMenu(false); setOpen(false); setSubOpen(null); }}
                  style={mBtn(page===sub.key, 2)}>
                  {sub.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SUB-PAGE CATALOG COMPONENT — dipakai oleh semua halaman baru
═══════════════════════════════════════════════════════════════════ */
function SubPageCatalog({ heroColor, heroIcon, title, subtitle, breadcrumb, catalogData, onWaOpen, navigateTo, satuan }) {
  const [hoverId, setHoverId] = useState(null);

  const formatHarga = (n) => {
    if (!n || n === 0) return "Hubungi Kami";
    const suffix = satuan ? ` / ${satuan}` : "";
    return "Mulai Rp " + Number(n).toLocaleString("id-ID") + suffix;
  };

  return (
    <div style={{ minHeight:"100vh", background:"#FAFAF8" }}>
      {/* ── HERO ── */}
      <div style={{ background: heroColor || "linear-gradient(135deg,#2E3D3F 0%,#8B6914 100%)", padding:"72px 5% 56px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.18)" }}/>
        <div style={{ position:"relative", zIndex:1, maxWidth:760, margin:"0 auto" }}>
          {/* Breadcrumb */}
          {breadcrumb && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginBottom:20, flexWrap:"wrap" }}>
              {breadcrumb.map((b, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span style={{ color:"rgba(255,255,255,.5)", fontSize:"0.75rem" }}>/</span>}
                  {b.page ? (
                    <button onClick={()=>navigateTo(b.page)}
                      style={{ background:"none", border:"none", color:"rgba(255,255,255,.7)", fontSize:"0.75rem", cursor:"pointer", padding:0, letterSpacing:".06em" }}>
                      {b.label}
                    </button>
                  ) : (
                    <span style={{ color:"#C9AA71", fontSize:"0.75rem", fontWeight:700, letterSpacing:".06em" }}>{b.label}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
          <div style={{ fontSize:"clamp(2.5rem,8vw,4rem)", marginBottom:16 }}>{heroIcon}</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.75rem,5vw,2.75rem)", fontWeight:900, color:"#fff", margin:"0 0 16px", lineHeight:1.2 }}>{title}</h1>
          <p style={{ fontSize:"clamp(0.875rem,2vw,1rem)", color:"rgba(255,255,255,.8)", lineHeight:1.8, margin:0 }}>{subtitle}</p>
        </div>
      </div>

      {/* ── CATALOG GRID ── */}
      <div style={{ maxWidth:1280, margin:"0 auto", padding:"60px 5% 80px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:28 }}>
          {catalogData.map((item) => (
            <div key={item.id}
              style={{ background:"#fff", borderRadius:16, overflow:"hidden", boxShadow:hoverId===item.id?"0 16px 48px rgba(0,0,0,.14)":"0 4px 16px rgba(0,0,0,.07)", transition:"all .3s cubic-bezier(.4,0,.2,1)", transform:hoverId===item.id?"translateY(-6px)":"translateY(0)", cursor:"pointer", border:"1px solid #F0EDE8" }}
              onMouseEnter={()=>setHoverId(item.id)}
              onMouseLeave={()=>setHoverId(null)}>

              {/* Foto */}
              <div style={{ position:"relative", height:200, overflow:"hidden", background:"#E8DCC8" }}>
                {item.img ? (
                  <img src={item.img} alt={item.nama} loading="lazy"
                    style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform .5s", transform:hoverId===item.id?"scale(1.07)":"scale(1)" }}
                    onError={e=>{e.target.parentElement.style.background="#E8DCC8"; e.target.style.display="none";}} />
                ) : (
                  <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"3rem", opacity:0.4 }}>
                    {item.icon || "🏠"}
                  </div>
                )}
                {/* Badge Style */}
                {item.style && (
                  <div style={{ position:"absolute", top:12, left:12, background:"rgba(46,61,63,.85)", backdropFilter:"blur(8px)", color:"#C9AA71", fontSize:"0.65rem", fontWeight:800, letterSpacing:".1em", textTransform:"uppercase", padding:"4px 10px", borderRadius:20 }}>
                    {item.style}
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding:"20px 20px 22px" }}>
                <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1rem", fontWeight:800, color:"#2E3D3F", margin:"0 0 8px", lineHeight:1.35 }}>{item.nama}</h3>
                {item.material && (
                  <div style={{ fontSize:"0.75rem", color:"#8B9A9C", marginBottom:8, display:"flex", alignItems:"center", gap:5 }}>
                    <span style={{ color:"#C9AA71" }}>◆</span> {item.material}
                  </div>
                )}
                {item.desc && (
                  <p style={{ fontSize:"0.82rem", color:"#5A6A6C", lineHeight:1.65, margin:"0 0 14px" }}>{item.desc}</p>
                )}
                {/* Fitur list */}
                {item.fitur && item.fitur.length > 0 && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
                    {item.fitur.slice(0,3).map((f,i) => (
                      <span key={i} style={{ background:"#FAF7F0", border:"1px solid #E8DCC8", color:"#5A6A6C", fontSize:"0.68rem", padding:"3px 8px", borderRadius:20 }}>{f}</span>
                    ))}
                  </div>
                )}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:14, borderTop:"1px solid #F0EDE8" }}>
                  <div>
                    <div style={{ fontSize:"0.65rem", color:"#8B9A9C", letterSpacing:".06em", textTransform:"uppercase", marginBottom:2 }}>Harga</div>
                    <div style={{ fontSize:"0.9rem", fontWeight:800, color:"#8B6914" }}>{formatHarga(item.harga)}</div>
                  </div>
                  <button onClick={()=>onWaOpen && onWaOpen({ key: "layanan", vars: { judul_layanan: item.nama } })}
                    style={{ background:"linear-gradient(135deg,#2E3D3F,#8B6914)", color:"#fff", border:"none", borderRadius:8, padding:"9px 16px", fontSize:"0.75rem", fontWeight:700, cursor:"pointer", letterSpacing:".04em" }}>
                    Konsultasi
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Bottom */}
        <div style={{ textAlign:"center", marginTop:56, padding:"40px 24px", background:"linear-gradient(135deg,#2E3D3F 0%,#1a2526 100%)", borderRadius:20, color:"#fff" }}>
          <div style={{ fontSize:"0.75rem", letterSpacing:".14em", textTransform:"uppercase", color:"#C9AA71", fontWeight:700, marginBottom:12 }}>Konsultasi Gratis</div>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.25rem,3vw,1.75rem)", fontWeight:900, margin:"0 0 12px" }}>Tidak menemukan yang sesuai?</h3>
          <p style={{ color:"rgba(255,255,255,.7)", fontSize:"0.875rem", margin:"0 0 24px", lineHeight:1.7 }}>Kami siap membuat desain custom sesuai kebutuhan dan budget Anda.</p>
          <button onClick={()=>onWaOpen && onWaOpen({ key: "konsultasi", vars: {} })}
            style={{ background:"#C9AA71", color:"#2E3D3F", border:"none", borderRadius:10, padding:"14px 32px", fontSize:"0.9rem", fontWeight:800, cursor:"pointer", letterSpacing:".05em" }}>
            💬 Konsultasi Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   DATA CATALOG — semua sub-halaman interior & eksterior
═══════════════════════════════════════════════════ */
const CATALOG_DATA = {
  /* ────────── INTERIOR ────────── */
  "interior/kamar-tidur": {
    heroColor:"linear-gradient(135deg,#2c1654 0%,#6a2fa0 60%,#9b59b6 100%)",
    heroIcon:"🛏️", title:"Desain Kamar Tidur", subtitle:"Wujudkan kamar tidur impian — nyaman, estetis, dan mencerminkan karakter pribadi Anda.",
    breadcrumb:[{label:"Beranda",page:"home"},{label:"Interior",page:"interior"},{label:"Kamar Tidur"}],
    items:[
      {id:"kt1", nama:"Kamar Minimalis Modern", style:"Best Seller", material:"Kayu MDF + HPL", desc:"Desain bersih dengan storage tersembunyi. Warna netral abu-abu dan putih yang menenangkan.", harga:8500000, fitur:["Storage Built-in","Hidden Lamp","AC Concealed"], img:"https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80"},
      {id:"kt2", nama:"Master Bedroom Luxury", style:"Premium", material:"Marmer + Kayu Jati", desc:"Nuansa hotel bintang 5 di kamar tidur Anda. Headboard custom, plafon drop ceiling, walk-in closet.", harga:25000000, fitur:["Walk-in Closet","Drop Ceiling","Smart Lighting"], img:"https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=600&q=80"},
      {id:"kt3", nama:"Kamar Skandinavian", style:"Natural", material:"Kayu Pinus + Linen", desc:"Hangat, terang, dan nyaman. Palet putih-krem dengan sentuhan kayu alami dan tekstil lembut.", harga:7200000, fitur:["Boho Vibes","Natural Light","Cozy Corner"], img:"https://images.unsplash.com/photo-1588046130717-0eb0c9a3ba15?w=600&q=80"},
      {id:"kt4", nama:"Kamar Industrial", style:"Edgy", material:"Beton Ekspos + Besi", desc:"Maskulin dan berkarakter. Exposed brick, Edison bulb, railing besi sebagai headboard.", harga:9000000, fitur:["Exposed Brick","Edison Lamp","Metal Accents"], img:"https://images.unsplash.com/photo-1578898887932-dce23a595ad4?w=600&q=80"},
      {id:"kt5", nama:"Kamar Anak Kreatif", style:"Fun", material:"Kayu MDF Warna", desc:"Ruang tidur anak yang menyenangkan dan aman. Ranjang bertingkat, area bermain, dan storage warna-warni.", harga:6500000, fitur:["Bunk Bed","Play Area","Colorful Storage"], img:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80"},
      {id:"kt6", nama:"Kamar Japandi Style", style:"Zen", material:"Kayu Bambu + Batu", desc:"Harmoni Jepang-Skandinavia. Rendah, minimalis, dan penuh ketenangan.", harga:11000000, fitur:["Low Bed","Zen Vibes","Wabi-Sabi"], img:"https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&q=80"},
      {id:"kt7", nama:"Kamar Tropical Modern", style:"Fresh", material:"Kayu Ulin + Rotan", desc:"Nuansa resort tropis. Material alam, kipas angin dekoratif, dan tanaman hijau.", harga:8000000, fitur:["Rattan Accents","Tropical Plants","Breezy Feel"], img:"https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&q=80"},
      {id:"kt8", nama:"Kamar Klasik Mewah", style:"Classic", material:"Kayu Solid + Ukiran", desc:"Elegan abadi dengan furnitur kayu ukiran, kain velvet, dan pencahayaan kristal.", harga:32000000, fitur:["Carved Wood","Crystal Lamp","Velvet Fabric"], img:"https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80"},
    ]
  },
  "interior/kamar-mandi": {
    heroColor:"linear-gradient(135deg,#0f3460 0%,#16213e 60%,#1a4a6e 100%)",
    heroIcon:"🚿", title:"Desain Kamar Mandi", subtitle:"Transformasi kamar mandi menjadi ruang spa pribadi — bersih, modern, dan fungsional.",
    breadcrumb:[{label:"Beranda",page:"home"},{label:"Interior",page:"interior"},{label:"Kamar Mandi"}],
    items:[
      {id:"km1", nama:"Bathroom Minimalis Modern", style:"Clean", material:"Granit + Keramik", desc:"Desain kotak-kotak bersih dengan shower box kaca, cermin LED, dan sanitasi premium.", harga:12000000, fitur:["Shower Box","LED Mirror","Waterproof"], img:"https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80"},
      {id:"km2", nama:"Bathroom Mewah Spa", style:"Luxury", material:"Marmer Impor + Brass", desc:"Nuansa spa bintang 5. Bathtub freestanding, shower rainfall, dan aksen emas.", harga:45000000, fitur:["Freestanding Bathtub","Rain Shower","Gold Accent"], img:"https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600&q=80"},
      {id:"km3", nama:"Bathroom Industrial", style:"Urban", material:"Beton Ekspos + Pipa", desc:"Nuansa gudang modern. Dinding semen ekspos, pipa galvanis dekoratif, cermin bulat.", harga:9500000, fitur:["Concrete Wall","Pipe Decor","Round Mirror"], img:"https://images.unsplash.com/photo-1620626011761-996317702782?w=600&q=80"},
      {id:"km4", nama:"Bathroom Natural Spa", style:"Organic", material:"Batu Alam + Kayu", desc:"Harmonis dengan alam. Lantai pebble, dinding batu andesit, dan bathtub kayu.", harga:18000000, fitur:["Pebble Floor","Stone Wall","Wood Tub"], img:"https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80"},
      {id:"km5", nama:"Bathroom Scandinavian", style:"Light", material:"Keramik Putih + Kayu", desc:"Terang dan bersih. White subway tile, wooden vanity, dan tanaman pot kecil.", harga:8000000, fitur:["Subway Tile","Wood Vanity","Plant Decor"], img:"https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80"},
      {id:"km6", nama:"Bathroom Japandi", style:"Zen", material:"Bambu + Batu + Kayu", desc:"Ketenangan ala Jepang. Ofuro mini, tatami step, dan elemen alam yang menenangkan.", harga:22000000, fitur:["Mini Ofuro","Bamboo Decor","Zen Elements"], img:"https://images.unsplash.com/photo-1556909211-36987daf7b4d?w=600&q=80"},
    ]
  },
  "interior/ruang-keluarga": {
    heroColor:"linear-gradient(135deg,#1a3c34 0%,#2d6a4f 60%,#52b788 100%)",
    heroIcon:"👨‍👩‍👧", title:"Desain Ruang Keluarga", subtitle:"Ciptakan ruang keluarga yang hangat, nyaman, dan menjadi tempat berkumpul yang menyenangkan.",
    breadcrumb:[{label:"Beranda",page:"home"},{label:"Interior",page:"interior"},{label:"Ruang Keluarga"}],
    items:[
      {id:"rk1", nama:"Family Room Modern", style:"Cozy", material:"Sofa Fabric + Kayu", desc:"Open plan yang luas dengan sofa modular, TV wall custom, dan pencahayaan hangat.", harga:18000000, fitur:["Modular Sofa","TV Wall","Warm Lighting"], img:"https://images.unsplash.com/photo-1567016432779-094069958ea5?w=600&q=80"},
      {id:"rk2", nama:"Living Room Luxury", style:"Premium", material:"Marmer + Velvet", desc:"Ruang keluarga prestisius. Plafon coffered, sofa velvet, dan lampu gantung kristal.", harga:65000000, fitur:["Coffered Ceiling","Crystal Chandelier","Marble Floor"], img:"https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&q=80"},
      {id:"rk3", nama:"Family Room Scandinavian", style:"Hygge", material:"Kayu + Linen + Wol", desc:"Konsep hygge — nyaman di setiap sudut. Karpet wol, sofa linen, dan reading corner.", harga:14000000, fitur:["Hygge Concept","Wool Rug","Reading Nook"], img:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80"},
      {id:"rk4", nama:"Living Room Industrial", style:"Bold", material:"Beton + Besi + Kulit", desc:"Karakter kuat. Sofa kulit, kopi table besi, dinding bata ekspos, dan lampu track.", harga:20000000, fitur:["Leather Sofa","Brick Wall","Track Lights"], img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80"},
      {id:"rk5", nama:"Ruang Keluarga Tropis", style:"Breezy", material:"Rotan + Kayu + Bambu", desc:"Sejuk dan alami. Material rotan, tanaman indoor besar, dan sirkulasi udara optimal.", harga:12000000, fitur:["Rattan Furniture","Indoor Plants","Natural Ventilation"], img:"https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80"},
      {id:"rk6", nama:"Ruang Keluarga Japandi", style:"Zen", material:"Kayu Light + Linen", desc:"Minim tapi bernyawa. Furnitur rendah, palet monokrom, dan elemen Zen yang menenangkan.", harga:16000000, fitur:["Low Furniture","Monochrome","Zen Elements"], img:"https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&q=80"},
    ]
  },
  "interior/ruang-tamu": {
    heroColor:"linear-gradient(135deg,#3d1a1a 0%,#8B4513 60%,#cd853f 100%)",
    heroIcon:"🪑", title:"Desain Ruang Tamu", subtitle:"Kesan pertama yang tak terlupakan — ruang tamu elegan yang menyambut setiap tamu dengan hangat.",
    breadcrumb:[{label:"Beranda",page:"home"},{label:"Interior",page:"interior"},{label:"Ruang Tamu"}],
    items:[
      {id:"rt1", nama:"Ruang Tamu Minimalis", style:"Clean", material:"Keramik + Fabric", desc:"Bersih dan lapang. Sofa 3+1 seater, kopi table minimalis, dan artwork sederhana.", harga:10000000, fitur:["Space Efficient","Clean Lines","Art Display"], img:"https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80"},
      {id:"rt2", nama:"Ruang Tamu Klasik Modern", style:"Timeless", material:"Kayu Solid + Marmer", desc:"Perpaduan klasik dan modern. Plafon cornice, sofa chester, dan accent wall marmer.", harga:38000000, fitur:["Cornice Ceiling","Chester Sofa","Marble Accent"], img:"https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=600&q=80"},
      {id:"rt3", nama:"Ruang Tamu Bohemian", style:"Free Spirit", material:"Rotan + Tenun + Batik", desc:"Penuh warna dan karakter. Permadani tenun, bantal batik, dan tanaman gantung.", harga:8500000, fitur:["Woven Rug","Hanging Plants","Eclectic Mix"], img:"https://images.unsplash.com/photo-1615529328331-f8917597711f?w=600&q=80"},
      {id:"rt4", nama:"Ruang Tamu Formal Mewah", style:"Grand", material:"Velvet + Gold + Marmer", desc:"Kemewahan yang memukau. Sofa velvet, meja emas, dan plafon gantung double-volume.", harga:75000000, fitur:["Double Volume","Gold Details","Luxury Sofa"], img:"https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80"},
      {id:"rt5", nama:"Ruang Tamu Open Plan", style:"Spacious", material:"Granit + Kayu", desc:"Menyatu dengan ruang makan dan dapur. Konsep open plan yang modern dan fleksibel.", harga:22000000, fitur:["Open Plan","Integrated","Multi-Function"], img:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80"},
      {id:"rt6", nama:"Ruang Tamu Mid-Century", style:"Retro", material:"Kayu Walnut + Kulit", desc:"Estetika 60an yang kembali populer. Kaki furnitur lancip, warna earthy, dan sideboard vintage.", harga:19000000, fitur:["Mid-Century Legs","Walnut Wood","Retro Vibes"], img:"https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80"},
    ]
  },
  "interior/kitchen-set": {
    heroColor:"linear-gradient(135deg,#1c3144 0%,#2c5282 60%,#3182ce 100%)",
    heroIcon:"🍳", title:"Kitchen Set & Dapur", subtitle:"Dapur impian yang ergonomis, fungsional, dan cantik — tempat kreasi kuliner terbaik Anda.",
    breadcrumb:[{label:"Beranda",page:"home"},{label:"Interior",page:"interior"},{label:"Kitchen Set"}],
    items:[
      {id:"ks1", nama:"Kitchen Set Minimalis", style:"Clean", material:"HPL + Granit", desc:"Simpel dan efisien. Kabinet HPL putih, countertop granit hitam, dan backsplash subway tile.", harga:15000000, fitur:["Soft Close Hinge","Granite Top","Subway Tile"], img:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80"},
      {id:"ks2", nama:"Kitchen Set Premium", style:"Luxury", material:"Acrylic + Quartz", desc:"Dapur mewah dengan kabinet high gloss acrylic, countertop quartz, dan kitchen hood dekoratif.", harga:45000000, fitur:["High Gloss","Quartz Counter","Island Table"], img:"https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=600&q=80"},
      {id:"ks3", nama:"Kitchen Industrial", style:"Raw", material:"Beton + Stainless", desc:"Terinspirasi dapur restoran. Stainless steel, rak terbuka, dan pencahayaan track.", harga:20000000, fitur:["Stainless Steel","Open Rack","Track Light"], img:"https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=600&q=80"},
      {id:"ks4", nama:"Kitchen Scandinavian", style:"Nordic", material:"Kayu Pinus + Putih", desc:"Terang dan hangat. Kabinet kayu terang, countertop putih, dan aksesori higienis.", harga:18000000, fitur:["Wood Cabinet","White Counter","Herb Garden"], img:"https://images.unsplash.com/photo-1556909211-36987daf7b4d?w=600&q=80"},
      {id:"ks5", nama:"Kitchen Set Klasik", style:"Timeless", material:"Kayu Solid + Granit", desc:"Abadi dan elegan. Kabinet kayu solid, granit mozaik, dan detail klasik yang memikat.", harga:55000000, fitur:["Solid Wood","Mosaic Detail","Classic Handle"], img:"https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=600&q=80"},
      {id:"ks6", nama:"Dapur Terbuka Modern", style:"Open", material:"Granit + Kaca", desc:"Open kitchen menyatu dengan ruang makan. Island counter multifungsi sebagai meja makan.", harga:28000000, fitur:["Island Counter","Open Concept","Dining Integration"], img:"https://images.unsplash.com/photo-1556909172-89cf0b8d8a5b?w=600&q=80"},
    ]
  },
  "interior/ruang-kerja": {
    heroColor:"linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)",
    heroIcon:"💼", title:"Desain Ruang Kerja", subtitle:"Home office produktif dan inspiratif — desain yang mendukung fokus, kreativitas, dan kenyamanan kerja.",
    breadcrumb:[{label:"Beranda",page:"home"},{label:"Interior",page:"interior"},{label:"Ruang Kerja"}],
    items:[
      {id:"rw1", nama:"Home Office Minimalis", style:"Focus", material:"Kayu MDF + Metal", desc:"Bersih dan fokus. Meja floating, storage tersembunyi, dan pencahayaan task light optimal.", harga:7500000, fitur:["Floating Desk","Hidden Storage","Task Light"], img:"https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=80"},
      {id:"rw2", nama:"Executive Office", style:"Professional", material:"Kayu Walnut + Kulit", desc:"Kesan profesional dan berwibawa. Meja eksekutif besar, kursi kulit, dan rak buku built-in.", harga:28000000, fitur:["Executive Desk","Leather Chair","Library Wall"], img:"https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80"},
      {id:"rw3", nama:"Creative Studio", style:"Inspiring", material:"Whiteboard + Pinboard", desc:"Ruang kreatif penuh inspirasi. Dinding whiteboard, mood board, dan pencahayaan track warna-warni.", harga:12000000, fitur:["Whiteboard Wall","Mood Board","Creative Lighting"], img:"https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80"},
      {id:"rw4", nama:"Dual Workspace", style:"Collaborative", material:"Kayu + Kaca", desc:"Untuk dua orang bekerja bersama. Meja back-to-back, partisi kaca, dan storage bersama.", harga:15000000, fitur:["Dual Desk","Glass Partition","Shared Storage"], img:"https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&q=80"},
      {id:"rw5", nama:"Ruang Kerja Compact", style:"Smart", material:"Kayu MDF + Putih", desc:"Solusi cerdas untuk ruang terbatas. Murphy desk, storage vertikal, dan lipat saat tidak digunakan.", harga:5500000, fitur:["Murphy Desk","Vertical Storage","Space Saving"], img:"https://images.unsplash.com/photo-1616627547584-bf28cee262db?w=600&q=80"},
      {id:"rw6", nama:"Gaming & Work Room", style:"Dynamic", material:"RGB + Ergonomic", desc:"Tempat bekerja sekaligus gaming. Meja gaming dengan manajemen kabel rapi dan pencahayaan LED.", harga:18000000, fitur:["RGB Setup","Cable Management","Ergonomic Chair"], img:"https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=600&q=80"},
    ]
  },
  /* ────────── EKSTERIOR ────────── */
  "eksterior/pagar": {
    heroColor:"linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)",
    heroIcon:"🔒", title:"Pagar Rumah", subtitle:"Keamanan dan keindahan dalam satu desain — pagar yang kokoh, estetis, dan meningkatkan nilai properti.",
    breadcrumb:[{label:"Beranda",page:"home"},{label:"Eksterior"},{label:"Pagar"}],
    items:[
      {id:"pg1", nama:"Pagar Hollow Minimalis", style:"Modern", material:"Besi Hollow 4x4cm", desc:"Garis tegas, simpel, dan elegan. Finishing powder coat anti karat tersedia berbagai warna.", harga:850000, fitur:["Anti Karat","Custom Warna","Powder Coat"], img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80"},
      {id:"pg2", nama:"Pagar Besi Tempa Klasik", style:"Classic", material:"Besi Tempa Solid", desc:"Ornamen klasik yang tak lekang waktu. Cocok untuk rumah bergaya Eropa atau klasik.", harga:1200000, fitur:["Ornamen Custom","Besi Solid","Cat Duco"], img:"https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80"},
      {id:"pg3", nama:"Pagar Panel Kayu WPC", style:"Natural", material:"WPC + Rangka Besi", desc:"Tampilan kayu tanpa perawatan intensif. WPC anti rayap, anti UV, dan tahan air.", harga:950000, fitur:["Anti Rayap","Anti UV","Tahan Air"], img:"https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80"},
      {id:"pg4", nama:"Pagar Stainless Steel", style:"Premium", material:"Stainless 304 Mirror", desc:"Tampilan premium dan mewah. Anti karat permanen, mudah dibersihkan, dan tahan lama.", harga:1800000, fitur:["Mirror Polish","Anti Karat","Prestige Look"], img:"https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80"},
      {id:"pg5", nama:"Gate Otomatis Sliding", style:"Smart", material:"Plat Besi + Motor", desc:"Gerbang geser otomatis dengan remote control dan sensor keamanan. Praktis dan modern.", harga:5500000, fitur:["Auto Sliding","Remote Control","Safety Sensor"], img:"https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80"},
      {id:"pg6", nama:"Pagar Laser Cut Custom", style:"Artistic", material:"Plat Besi 3mm", desc:"Ornamen pola custom dipotong laser. Motif batik, geometris, atau sesuai request.", harga:1400000, fitur:["Laser Precision","Custom Pattern","Unique Design"], img:"https://images.unsplash.com/photo-1449844908441-8829872d2607?w=600&q=80"},
    ]
  },
  "eksterior/kanopi": {
    heroColor:"linear-gradient(135deg,#1b4332 0%,#2d6a4f 60%,#52b788 100%)",
    heroIcon:"🏗️", title:"Kanopi", subtitle:"Pelindung carport dan teras yang fungsional, kuat, dan mempercantik tampilan luar rumah Anda.",
    breadcrumb:[{label:"Beranda",page:"home"},{label:"Eksterior"},{label:"Kanopi"}],
    items:[
      {id:"kn1", nama:"Kanopi Polycarbonate", style:"Popular", material:"Baja Ringan + Polycarbonate", desc:"Paling populer — tembus cahaya, ringan, dan tahan UV. Tersedia berbagai warna polycarbonate.", harga:280000, fitur:["Tembus Cahaya","UV Protection","Berbagai Warna"], img:"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80"},
      {id:"kn2", nama:"Kanopi Alderon/UPVC", style:"Premium", material:"UPVC + Rangka Baja", desc:"Material UPVC berkualitas — tidak perlu cat ulang, anti karat, dan ringan tapi kuat.", harga:380000, fitur:["No Repaint","Anti Karat","Low Maintenance"], img:"https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=80"},
      {id:"kn3", nama:"Kanopi Atap Kaca Tempered", style:"Luxury", material:"Kaca 8mm + Hollow", desc:"Tampilan premium dan modern. Kaca tempered 8mm aman dan estetis untuk carport mewah.", harga:650000, fitur:["Kaca 8mm","Safety Glass","Modern Look"], img:"https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&q=80"},
      {id:"kn4", nama:"Kanopi Spandek Metal", style:"Industrial", material:"Spandek Zincalume", desc:"Kuat dan tahan lama. Material spandek zincalume tahan karat dan cuaca ekstrem.", harga:220000, fitur:["Tahan Karat","Waterproof","Durable"], img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80"},
      {id:"kn5", nama:"Kanopi Custom Laser Cut", style:"Artistic", material:"Plat Besi 2mm", desc:"Ornamen plat besi dengan pola custom dipotong laser. Unik dan bernilai seni tinggi.", harga:450000, fitur:["Custom Pattern","Laser Cut","Artistic"], img:"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80"},
      {id:"kn6", nama:"Pergola Kayu + Atap Kaca", style:"Elegant", material:"Kayu Ulin + Kaca", desc:"Pergola taman yang elegan. Kayu ulin kuat dan kaca transparan menciptakan nuansa resort.", harga:850000, fitur:["Kayu Ulin","Taman Resort","Glass Roof"], img:"https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80"},
    ]
  },
  "eksterior/aluminium": {
    heroColor:"linear-gradient(135deg,#2b2d42 0%,#555b6e 60%,#8d99ae 100%)",
    heroIcon:"🪟", title:"Aluminium", subtitle:"Kusen, pintu, dan jendela aluminium — ringan, anti karat, dan tampilan premium untuk hunian modern.",
    breadcrumb:[{label:"Beranda",page:"home"},{label:"Eksterior"},{label:"Aluminium"}],
    items:[
      {id:"al1", nama:"Kusen Jendela Casement", style:"Classic", material:"Aluminium 4\"", desc:"Jendela swing ke luar (casement). Ventilasi optimal, seal udara rapat, dan profil ramping.", harga:450000, fitur:["Rapat Udara","Easy Clean","Custom Size"], img:"https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80"},
      {id:"al2", nama:"Pintu Sliding Aluminium", style:"Space Saver", material:"Aluminium 3\" + Kaca", desc:"Pintu geser space-saving. Cocok untuk balkon, teras, atau area transisi indoor-outdoor.", harga:1200000, fitur:["Space Saving","Smooth Slide","Glass Options"], img:"https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&q=80"},
      {id:"al3", nama:"Jendela Folding Accordion", style:"Flexible", material:"Aluminium + Kaca", desc:"Jendela lipat accordion. Buka penuh untuk koneksi maksimal indoor-outdoor.", harga:1800000, fitur:["Full Opening","Accordion Fold","Indoor-Outdoor"], img:"https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&q=80"},
      {id:"al4", nama:"Fasad ACP Premium", style:"Modern", material:"ACP Alucobond", desc:"Panel ACP untuk cladding fasad eksterior. Tampilan bangunan modern dan premium.", harga:350000, fitur:["Weatherproof","Many Colors","Premium Look"], img:"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80"},
      {id:"al5", nama:"Partisi Aluminium + Kaca", style:"Office", material:"Aluminium Profil + Kaca", desc:"Partisi ruangan elegan. Frameless atau dengan profil tipis untuk tampilan clean.", harga:800000, fitur:["Frameless Option","Clear Glass","Soundproof"], img:"https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80"},
      {id:"al6", nama:"Railing & Handrail", style:"Safety", material:"Aluminium + Tempered Glass", desc:"Pegangan tangga dan pagar balkon. Kaca tempered + profil aluminium untuk keamanan.", harga:650000, fitur:["Tempered Glass","Safety","Modern"], img:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80"},
    ]
  },
  "eksterior/taman-landscape": {
    heroColor:"linear-gradient(135deg,#1a472a 0%,#2d6a4f 60%,#40916c 100%)",
    heroIcon:"🌳", title:"Taman & Landscape", subtitle:"Ciptakan taman impian yang asri, hijau, dan menenangkan — oasis pribadi di tengah hunian.",
    breadcrumb:[{label:"Beranda",page:"home"},{label:"Eksterior"},{label:"Taman Landscape"}],
    items:[
      {id:"tm1", nama:"Taman Tropis Modern", style:"Tropical", material:"Batu Andesit + Tanaman Tropis", desc:"Tanaman tropis lebat, jalur batu andesit, dan kolam hias mini. Nuansa resort di rumah.", harga:15000000, fitur:["Kolam Hias","Tanaman Tropis","Batu Andesit"], img:"https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=80"},
      {id:"tm2", nama:"Taman Minimalis Jepang", style:"Zen", material:"Kerikil + Batu Kali + Bambu", desc:"Ketenangan ala Zen Garden. Kerikil putih, batu kali, bambu, dan lampu taman.", harga:12000000, fitur:["Zen Garden","Kerikil Putih","Bamboo Accents"], img:"https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&q=80"},
      {id:"tm3", nama:"Vertical Garden", style:"Urban", material:"Frame Besi + Media Tanam", desc:"Taman dinding vertikal untuk lahan terbatas. Penyiram otomatis dan pilihan tanaman indoor.", harga:4500000, fitur:["Auto Watering","Space Saving","Indoor Plants"], img:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80"},
      {id:"tm4", nama:"Kolam Renang Mini", style:"Resort", material:"Keramik Mozaik + Pompa", desc:"Kolam renang minimalis untuk rumah pribadi. Finishing mozaik biru, sistem filter, dan lighting.", harga:85000000, fitur:["Pool Filter","LED Lighting","Mosaic Tile"], img:"https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=600&q=80"},
      {id:"tm5", nama:"Kolam Ikan Koi", style:"Peaceful", material:"Batu Kali + Pompa Air", desc:"Kolam ikan koi yang menenangkan. Sistem filter air, waterfall mini, dan batu kali alami.", harga:8000000, fitur:["Koi Filter","Waterfall","Natural Stone"], img:"https://images.unsplash.com/photo-1455586353828-0c4ba1c4b84f?w=600&q=80"},
      {id:"tm6", nama:"Gazebo & Pergola Taman", style:"Outdoor Living", material:"Kayu Ulin + Atap Polycarbonate", desc:"Ruang santai outdoor teduh. Kayu ulin kuat, atap polycarbonate, dan kursi outdoor.", harga:18000000, fitur:["Kayu Ulin","Outdoor Furniture","Shade Area"], img:"https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80"},
      {id:"tm7", nama:"Paving & Jalur Taman", style:"Pathway", material:"Paving Block + Batu Alam", desc:"Penataan jalur taman yang indah. Kombinasi paving block warna dan batu alam alam.", harga:350000, fitur:["Anti Slip","Dekoratif","Tahan Lama"], img:"https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80"},
      {id:"tm8", nama:"Lampu Taman & Outdoor", style:"Ambiance", material:"LED Waterproof IP65", desc:"Pencahayaan taman yang dramatis. Uplighting pohon, path light, dan spotlight dekoratif.", harga:2500000, fitur:["Waterproof IP65","LED Hemat","Dramatic Effect"], img:"https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&q=80"},
    ]
  },
  "interior/plafon-modern": {
    heroColor:"linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)",
    heroIcon:"🏛️", title:"Plafon Modern", subtitle:"Transformasi langit-langit ruangan menjadi karya seni arsitektur — elegan, modern, dan bernilai premium.",
    breadcrumb:[{label:"Beranda",page:"home"},{label:"Interior",page:"interior"},{label:"Plafon Modern"}],
    satuan:"m²",
    items:[
      {id:"pl1", nama:"Plafon Minimalis Rata", style:"Clean", material:"Gypsum Board 9mm", desc:"Plafon datar bersih tanpa ornamen. Cocok untuk desain minimalis dan kontemporer — cat putih atau warna netral.", harga:85000, fitur:["Tanpa Ornamen","Cat Custom","Anti Retak"], img:"https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80"},
      {id:"pl2", nama:"Drop Ceiling / Cove Ceiling", style:"Modern Luxury", material:"Gypsum Board + LED Strip", desc:"Plafon bertingkat dengan rongga tersembunyi untuk lampu LED strip. Efek cahaya ambient yang dramatis dan mewah.", harga:185000, fitur:["LED Hidden Light","Bertingkat","Dramatic Effect"], img:"https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=600&q=80"},
      {id:"pl3", nama:"Plafon Coffered / Grid Box", style:"Classic Modern", material:"Gypsum + Kayu MDF", desc:"Kotak-kotak simetris bergaya klasik yang timeless. Memberikan kedalaman visual dan kesan ruangan yang tinggi.", harga:220000, fitur:["Simetris Elegan","Timeless","Kesan Tinggi"], img:"https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&q=80"},
      {id:"pl4", nama:"Plafon Tray / Recessed", style:"Elegant", material:"Gypsum Board + Spotlight", desc:"Plafon tengah menjorok ke dalam (tray) dengan pencahayaan tersembunyi di tepinya. Fokus di tengah ruangan.", harga:165000, fitur:["Recessed Light","Focal Point","Elegant"], img:"https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80"},
      {id:"pl5", nama:"Plafon Kayu / Wood Slat", style:"Natural Warm", material:"Kayu Pinus / Jati / SPC", desc:"Bilah kayu horizontal yang hangat dan natural. Memberikan tekstur dan kehangatan pada langit-langit ruangan.", harga:275000, fitur:["Tekstur Natural","Warm Vibes","Sound Absorb"], img:"https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80"},
      {id:"pl6", nama:"Plafon PVC Motif", style:"Budget Friendly", material:"PVC Panel 30cm", desc:"Panel PVC bermotif kayu, marmer, atau polos. Tahan lembab, anti rayap, dan pemasangan cepat.", harga:65000, fitur:["Anti Lembab","Anti Rayap","Cepat Pasang"], img:"https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=600&q=80"},
      {id:"pl7", nama:"Plafon Ekspos Industrial", style:"Industrial Chic", material:"Beton Ekspos / Cat Gelap", desc:"Langit-langit tanpa penutup — pipa, rangka besi, dan beton dibiarkan terlihat. Bold dan berkarakter kuat.", harga:95000, fitur:["Bold Statement","No Gypsum","Raw Aesthetic"], img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80"},
      {id:"pl8", nama:"Plafon Stretched Ceiling", style:"Premium Futuristic", material:"PVC Membran Stretch", desc:"Membran PVC elastis yang ditarik sempurna — bisa transparan, mirror, atau dicetak gambar bintang/langit.", harga:320000, fitur:["Motif Custom","Mirror Option","Seamless"], img:"https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&q=80"},
      {id:"pl9", nama:"Plafon Gypsum Ornamental", style:"Klasik Mewah", material:"Gypsum + Ornamen Cetak", desc:"Plafon dengan ornamen bunga, roset, dan border ukiran gypsum cetak. Cocok untuk ruang tamu dan ruang makan formal.", harga:195000, fitur:["Ornamen Cetak","Klasik Elegan","Rosette Center"], img:"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80"},
    ]
  },
};

/* ═══════════════════════════════════════════════════
   HALAMAN-HALAMAN SUB-INTERIOR & SUB-EKSTERIOR
═══════════════════════════════════════════════════ */
function SubInteriorPage({ pageKey, onWaOpen, navigateTo }) {
  useEffect(()=>{ window.scrollTo(0,0); },[pageKey]);
  const config = CATALOG_DATA[pageKey];
  if (!config) return <div style={{padding:80,textAlign:"center"}}>Halaman tidak ditemukan.</div>;
  return <SubPageCatalog
    heroColor={config.heroColor} heroIcon={config.heroIcon}
    title={config.title} subtitle={config.subtitle}
    breadcrumb={config.breadcrumb}
    catalogData={config.items}
    satuan={config.satuan || null}
    onWaOpen={onWaOpen} navigateTo={navigateTo}
  />;
}

/* ── Router: Eksterior sub-pages juga pakai component yang sama ── */
const SubEksteriorPage = SubInteriorPage;

/* ─────────────── NAV DROPDOWN: LAYANAN KAMI (3-level nested) ─────────────── */
function NavDropdownLayanan({ page, navigateTo, navDropdownLayanan }) {
  const [ddOpen, setDdOpen]   = useState(false);
  const [subOpen, setSubOpen] = useState(null); // "interior"|"eksterior"|null
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) { setDdOpen(false); setSubOpen(null); } };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const subIntPages = ["interior/kamar-tidur","interior/kamar-mandi","interior/ruang-keluarga","interior/ruang-tamu","interior/kitchen-set","interior/ruang-kerja","interior/plafon-modern"];
  const subExtPages = ["eksterior/pagar","eksterior/kanopi","eksterior/aluminium","eksterior/taman-landscape"];
  const topPages    = ["services","desainrab","temarumah"];
  const isActive    = [...topPages,...subIntPages,...subExtPages,"interior","pagar","kanopi","aluminium","landscape"].some(k => k === page);

  const ddBase = { position:"absolute", background:"rgba(255,255,255,.98)", borderRadius:10, boxShadow:"0 8px 32px rgba(0,0,0,.14)", border:"1px solid rgba(158,155,150,.15)", padding:"6px 0", zIndex:300, backdropFilter:"blur(12px)", minWidth:210 };
  const btn = (active) => ({ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", textAlign:"left", padding:"9px 18px", fontSize:"0.78rem", fontWeight:active?700:500, color:active?"#2E3D3F":"#3D5254", background:active?"#FAF7F0":"transparent", border:"none", cursor:"pointer", borderLeft:active?"2px solid #8B6914":"2px solid transparent", transition:"all .15s", letterSpacing:".04em" });

  return (
    <div style={{ position:"relative" }} ref={ref}>
      <button className={`nav-link${isActive?" active":""}`}
        onClick={() => { setDdOpen(v=>!v); setSubOpen(null); }}
        style={{ border:"none", background:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:4, padding:"4px 2px" }}>
        Layanan Kami <span style={{ fontSize:"0.6rem", opacity:0.7, transition:"transform .2s", display:"inline-block", transform:ddOpen?"rotate(180deg)":"rotate(0deg)" }}>▼</span>
      </button>

      {ddOpen && (
        <div style={{ ...ddBase, top:"calc(100% + 6px)", left:0 }}>
          {/* Layanan Umum */}
          <div style={{ padding:"4px 18px 2px", fontSize:"0.63rem", fontWeight:700, color:"#8B9A9C", letterSpacing:".1em", textTransform:"uppercase" }}>Layanan Kami</div>
          {navDropdownLayanan.filter(i=>topPages.includes(i.key)).map(item=>(
            <button key={item.key} onClick={()=>{ navigateTo(item.key); setDdOpen(false); setSubOpen(null); }}
              style={btn(page===item.key)}
              onMouseEnter={e=>{e.currentTarget.style.background="#FAF7F0"; e.currentTarget.style.color="#2E3D3F";}}
              onMouseLeave={e=>{e.currentTarget.style.background=page===item.key?"#FAF7F0":"transparent"; e.currentTarget.style.color=page===item.key?"#2E3D3F":"#3D5254";}}>
              {item.label}
            </button>
          ))}

          <div style={{ margin:"4px 0 2px", borderTop:"1px solid #edf2f4" }}/>
          <div style={{ padding:"4px 18px 2px", fontSize:"0.63rem", fontWeight:700, color:"#8B9A9C", letterSpacing:".1em", textTransform:"uppercase" }}>Interior & Eksterior</div>

          {/* Interior nested */}
          <div style={{ position:"relative" }}
            onMouseEnter={()=>setSubOpen("interior")}
            onMouseLeave={()=>setSubOpen(null)}>
            <button style={btn(page.startsWith("interior"))} onMouseEnter={e=>{e.currentTarget.style.background="#FAF7F0";}} onMouseLeave={e=>{e.currentTarget.style.background=page.startsWith("interior")?"#FAF7F0":"transparent";}}>
              <span>🛋️ Interior</span><span style={{fontSize:"0.65rem",opacity:0.6}}>▶</span>
            </button>
            {subOpen==="interior" && (
              <div style={{...ddBase, top:0, left:"100%", marginLeft:4}}>
                {[
                  {key:"interior/kamar-tidur",    label:"🛏️ Kamar Tidur"},
                  {key:"interior/kamar-mandi",    label:"🚿 Kamar Mandi"},
                  {key:"interior/ruang-keluarga", label:"👨‍👩‍👧 Ruang Keluarga"},
                  {key:"interior/ruang-tamu",     label:"🛋️ Ruang Tamu"},
                  {key:"interior/kitchen-set",    label:"🍳 Kitchen Set"},
                  {key:"interior/ruang-kerja",    label:"💼 Ruang Kerja"},
                  {key:"interior/plafon-modern",  label:"🏛️ Plafon Modern"},
                ].map(sub=>(
                  <button key={sub.key} onClick={()=>{ navigateTo(sub.key); setDdOpen(false); setSubOpen(null); }}
                    style={btn(page===sub.key)}
                    onMouseEnter={e=>{e.currentTarget.style.background="#FAF7F0"; e.currentTarget.style.color="#2E3D3F";}}
                    onMouseLeave={e=>{e.currentTarget.style.background=page===sub.key?"#FAF7F0":"transparent"; e.currentTarget.style.color=page===sub.key?"#2E3D3F":"#3D5254";}}>
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Eksterior nested */}
          <div style={{ position:"relative" }}
            onMouseEnter={()=>setSubOpen("eksterior")}
            onMouseLeave={()=>setSubOpen(null)}>
            <button style={btn(page.startsWith("eksterior"))} onMouseEnter={e=>{e.currentTarget.style.background="#FAF7F0";}} onMouseLeave={e=>{e.currentTarget.style.background=page.startsWith("eksterior")?"#FAF7F0":"transparent";}}>
              <span>🏠 Eksterior</span><span style={{fontSize:"0.65rem",opacity:0.6}}>▶</span>
            </button>
            {subOpen==="eksterior" && (
              <div style={{...ddBase, top:0, left:"100%", marginLeft:4}}>
                {[
                  {key:"eksterior/pagar",           label:"🔒 Pagar"},
                  {key:"eksterior/kanopi",           label:"🏗️ Kanopi"},
                  {key:"eksterior/aluminium",        label:"🪟 Aluminium"},
                  {key:"eksterior/taman-landscape",  label:"🌳 Taman Landscape"},
                ].map(sub=>(
                  <button key={sub.key} onClick={()=>{ navigateTo(sub.key); setDdOpen(false); setSubOpen(null); }}
                    style={btn(page===sub.key)}
                    onMouseEnter={e=>{e.currentTarget.style.background="#FAF7F0"; e.currentTarget.style.color="#2E3D3F";}}
                    onMouseLeave={e=>{e.currentTarget.style.background=page===sub.key?"#FAF7F0":"transparent"; e.currentTarget.style.color=page===sub.key?"#2E3D3F":"#3D5254";}}>
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────── NAV DROPDOWN: GALERI & PROYEK ─────────────── */
function NavDropdownGaleri({ page, navigateTo, navDropdownGaleri }) {
  const [ddOpen3, setDdOpen3] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setDdOpen3(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const isActive3 = navDropdownGaleri.some(i => i.key === page);
  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button className={`nav-link${isActive3 ? " active" : ""}`}
        onClick={() => setDdOpen3(v => !v)}
        style={{ border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: "4px 2px" }}>
        Program Renovasi <span style={{ fontSize: "0.6rem", opacity: 0.7, transition: "transform .2s", display: "inline-block", transform: ddOpen3 ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
      </button>
      {ddOpen3 && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, minWidth: 200,
          background: "rgba(255,255,255,.98)", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,.14)",
          border: "1px solid rgba(158,155,150,.15)", padding: "6px 0", zIndex: 200, backdropFilter: "blur(12px)" }}>
          {navDropdownGaleri.map(item => (
            <button key={item.key} onClick={() => { navigateTo(item.key); setDdOpen3(false); }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 18px",
                fontSize: "0.78rem", fontWeight: page === item.key ? 700 : 500,
                color: page === item.key ? "#2E3D3F" : "#3D5254",
                background: page === item.key ? "#FAF7F0" : "transparent",
                border: "none", cursor: "pointer", borderLeft: page === item.key ? "2px solid #8B6914" : "2px solid transparent",
                transition: "all .15s", letterSpacing: ".04em" }}
              onMouseEnter={e => { e.currentTarget.style.background="#FAF7F0"; e.currentTarget.style.color="#2E3D3F"; }}
              onMouseLeave={e => { e.currentTarget.style.background=page===item.key?"#FAF7F0":"transparent"; e.currentTarget.style.color=page===item.key?"#2E3D3F":"#3D5254"; }}>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BricksyTravel() {
  const [data, setData] = useState(DEFAULT_DATA);
  const dataRef = useRef(DEFAULT_DATA); // selalu up-to-date, aman dipakai di closure stale (popstate)
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(() => sessionLoad()); // ← restore session saat reload
  // Fix #3: gunakan lazy initializer agar window.location dibaca saat render, bukan module load
  const [page, setPage] = useState(() => getInitialPage()); // home | about | news | shop | destinations | services
  // ── Native history tracking (tidak pakai custom stack) ──────────────────
  // spaDepth: seberapa jauh dari entry awal (disimpan di pushState state.depth)
  // spaMaxDepth: titik terjauh yang pernah dicapai → untuk canForward
  const spaDepth    = useRef(0);
  const spaMaxDepth = useRef(0);
  const [canBack, setCanBack] = useState(false);
  const [canFwd,  setCanFwd]  = useState(false);
  const [readPost, setReadPost] = useState(null);
  const [temaSlug, setTemaSlug] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [comingSoon, setComingSoon] = useState(null); // null | "google" | "apple"
  const [showAdmin, setShowAdmin] = useState(() => getInitialShowAdmin()); // restore dari URL /control-panel
  const [adminTab, setAdminTab] = useState("dashboard");
  const [adminSection, setAdminSection] = useState("news");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginErr, setLoginErr] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // Forgot password flow: null | "input_user" | "input_email" | "input_otp" | "input_newpass"
  const [forgotStep, setForgotStep] = useState(null);
  const [forgotUser, setForgotUser] = useState("");
  const [forgotSearchBy, setForgotSearchBy] = useState("username"); // "username" | "email" | "phone"
  const [forgotFoundUser, setForgotFoundUser] = useState(null); // username string found after step1
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOTP, setForgotOTP] = useState({ code: "", input: "", expiry: 0, sending: false });
  const [forgotNewPass, setForgotNewPass] = useState({ val: "", confirm: "" });
  const [forgotErr, setForgotErr] = useState("");
  const [notif, setNotif] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [editImg, setEditImg] = useState({ group: null, idx: null, url: "" });
  const [editContent, setEditContent] = useState({});
  const [contact, setContact] = useState({ name: "", email: "", message: "" });
  const [waPicker, setWaPicker] = useState(null); // null | { msgText: "" }
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [emailSub, setEmailSub] = useState("");
  const [cmsEditPost, setCmsEditPost] = useState(null); // null | "new" | post object
  const [cmsSection, setCmsSection] = useState("news");
  const [showDevProfile, setShowDevProfile] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [mapQuery, setMapQuery] = useState("");
  const [mapLocation, setMapLocation] = useState("Malang, Jawa Timur, Indonesia");
  const mapDebounceRef = useRef(null);
  const heroVideoRef = useRef(null); // force-autoplay hero background video
  // openWaPicker menerima string langsung ATAU {key, vars} untuk template
  const openWaPicker = (msgOrObj = "") => {
    if (typeof msgOrObj === "object" && msgOrObj !== null && msgOrObj.key) {
      const { key, vars = {} } = msgOrObj;
      const tpl = data.content.waTemplates || {};
      setWaPicker({ msgText: buildWaMsg(tpl, key, vars) });
    } else {
      // backward compat: string biasa → override langsung tanpa template
      // KECUALI string kosong → pakai template "umum"
      if (!msgOrObj) {
        const tpl = data.content.waTemplates || {};
        setWaPicker({ msgText: buildWaMsg(tpl, "umum", {}) });
      } else {
        setWaPicker({ msgText: String(msgOrObj) });
      }
    }
  };

  // ── Scroll Reveal for RE home ──
  // ── Force autoplay hero video (bypass browser autoplay policy) ──────────
  useEffect(() => {
    const vid = heroVideoRef.current;
    if (!vid) return;
    vid.muted = true;
    vid.volume = 0;
    const tryPlay = () => {
      vid.play().catch(() => {
        // Jika gagal, tunggu interaksi user pertama lalu play otomatis
        const onInteract = () => {
          vid.play().catch(() => {});
        };
        document.addEventListener("click", onInteract, { once: true });
        document.addEventListener("touchstart", onInteract, { once: true });
        document.addEventListener("keydown", onInteract, { once: true });
      });
    };
    // Play ulang saat tab kembali aktif
    const onVisible = () => {
      if (document.visibilityState === "visible") vid.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);
    if (vid.readyState >= 2) {
      tryPlay();
    } else {
      vid.addEventListener("canplay", tryPlay, { once: true });
    }
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    if (page !== "home") return;
    const SELECTORS = ".re-reveal,.re-slide-left,.re-slide-right,.re-scale-in";
    const els = document.querySelectorAll(SELECTORS);
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          // Masuk viewport: hapus exit, tambah visible
          e.target.classList.remove("exit");
          void e.target.offsetWidth; // reflow agar animasi restart
          e.target.classList.add("visible");
        } else {
          // Keluar viewport: hapus visible, tambah exit (hanya jika pernah visible)
          if (e.target.classList.contains("visible")) {
            e.target.classList.remove("visible");
            void e.target.offsetWidth;
            e.target.classList.add("exit");
          }
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [page]);
  // Profile editing state
  const [profileEdit, setProfileEdit] = useState({ name: "", phone: "", email: "", desc: "", photo: "", oldPass: "", newPass: "", confirmPass: "" });
  const [userMgmtForm, setUserMgmtForm] = useState({ username: "", password: "", role: "content_writer", email: "", name: "" });
  const [userMgmtOpen, setUserMgmtOpen] = useState(false);
  const [editRoleId, setEditRoleId] = useState(null);
  const [editUserId, setEditUserId] = useState(null);
  const [editUserForm, setEditUserForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reviewTokenParam, setReviewTokenParam] = useState(() => {
    try {
      const m = window.location.pathname.match(/^\/UlasanPelayanan\/(.+)$/);
      return m ? m[1] : "";
    } catch { return ""; }
  });

  /* ── Desktop cursor glow + scroll-reveal (desktop width only) ── */
  useEffect(() => {
    const isDesktop = window.innerWidth > 900;
    if (!isDesktop) return;



    // Scroll-reveal IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.remove("exit");
          void e.target.offsetWidth;
          e.target.classList.add("visible");
        } else {
          if (e.target.classList.contains("visible")) {
            e.target.classList.remove("visible");
            void e.target.offsetWidth;
            e.target.classList.add("exit");
          }
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    document.querySelectorAll(".anim-fade-up, .anim-zoom").forEach(el => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  /* ── Fix #2: popstate listener — sync React state saat user tekan Back/Forward browser ── */
  useEffect(() => {
    const onPopState = (e) => {
      const pathname = window.location.pathname;
      // /UlasanPelayanan/{token}
      const reviewMatch = pathname.match(/^\/UlasanPelayanan\/(.+)$/);
      if (reviewMatch) {
        setReviewTokenParam(reviewMatch[1]);
        setShowAdmin(false);
        return;
      }
      setReviewTokenParam("");
      // /control-panel — restore tab dari state jika ada
      if (pathname === "/control-panel" || e.state?.admin) {
        // Jika sedang dalam mode edit paket dan user tekan Back → keluar edit dulu
        if (false) {
          window.history.pushState({ admin: true, adminTab: adminTabRef.current, depth: (e.state?.depth ?? 0) }, "", "/control-panel");
          return;
        }
        setShowAdmin(true);
        if (e.state?.adminTab) {
          setAdminTab(e.state.adminTab);
          setCmsEditPost(null);
        }
        _syncDepth(e.state?.depth);
        return;
      }
      setShowAdmin(false);
      // /services/{category}/{slug}/{id} → buka detail paket
      const pkgParsed = parsePaketPath(pathname);
      if (pkgParsed) {
        setPage("services");
        setActivePaket({ id: pkgParsed.id, category: pkgParsed.category });
        setMobileMenu(false);
        window.scrollTo(0, 0);
        _syncDepth(e.state?.depth);
        return;
      }
      // /artikel/{section}/{slug}-{id} → buka detail artikel
      const artParsed = parseArtikelPath(pathname);
      if (artParsed) {
        const sectionPage = { news: "news", shop: "shop", destinations: "destinations" }[artParsed.section] || "news";
        setPage(sectionPage);
        // Restore readPost dari dataRef (selalu fresh, tidak stale)
        const allP = Object.values(dataRef.current?.posts || {}).flat();
        const found = allP.find(p => p.id === artParsed.id || String(p.id) === String(artParsed.id));
        if (found) setReadPost(found);
        setMobileMenu(false);
        window.scrollTo(0, 0);
        _syncDepth(e.state?.depth);
        return;
      }
      // Sub-route interior/* dan eksterior/*
      if (pathname.startsWith("/interior/") || pathname.startsWith("/eksterior/")) {
        const key = pathname.replace("/","");
        setPage(key); setMobileMenu(false); window.scrollTo(0,0); _syncDepth(e.state?.depth); return;
      }
      // Normal page — tutup detail paket & artikel
      setActivePaket(null);
      setReadPost(null);
      const p = e.state?.page || PATH_TO_PAGE[pathname] || "home";
      setPage(p);
      setMobileMenu(false);
      window.scrollTo(0, 0);
      _syncDepth(e.state?.depth);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Helper: sync spaDepth + canBack/canFwd dari depth yang disimpan di history state.
   *  Gunakan spaMaxDepth (ref) langsung — tidak pernah stale. */
  const _syncDepth = (depth) => {
    const d = depth ?? 0;
    spaDepth.current = d;
    setCanBack(d > 0);
    setCanFwd(d < spaMaxDepth.current);
  };

  /* ─── Deep-merge helper ──────────────────────────────────────────────────
     Menggabungkan data yang disimpan (saved) dengan DEFAULT_DATA sehingga:
     • Semua data lama (konten, gambar, post, pesan, user, dsb.) TETAP ada
     • Field BARU yang ditambahkan lewat git push (nav6, services, dsb.)
       otomatis muncul dengan nilai default — tidak perlu reset manual
     ─────────────────────────────────────────────────────────────────────── */
  const mergeWithDefaults = (saved, defaults) => {
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return saved ?? defaults;
    const result = { ...defaults };
    for (const key of Object.keys(saved)) {
      const sv = saved[key];
      const dv = defaults?.[key];
      if (sv !== null && typeof sv === "object" && !Array.isArray(sv) && dv !== null && typeof dv === "object" && !Array.isArray(dv)) {
        // Objek nested → merge rekursif
        result[key] = mergeWithDefaults(sv, dv);
      } else if (key === "services" && Array.isArray(sv) && Array.isArray(dv)) {
        // Array services: gabungkan data Firebase + item DEFAULT yang id-nya belum ada.
        // JUGA: merge field baru (facilities, destinations, services) ke tiap item lama
        // yang tersimpan di Firebase namun belum punya field tersebut.
        if (sv.length === 0) {
          result[key] = dv; // Firebase kosong → seed penuh dari DEFAULT
        } else {
          const defaultById = Object.fromEntries(dv.map(s => [s.id, s]));
          const merged = sv.map(savedItem => {
            const def = defaultById[savedItem.id];
            if (!def) return savedItem; // item custom user, tidak ada di DEFAULT → biarkan
            // Inject field baru dari DEFAULT jika belum ada di item tersimpan
            const patched = { ...savedItem };
            // Untuk paket traveling: PAKSA sync field kritis dari DEFAULT
            // (pastikan filter category==="traveling" & pkgId selalu benar)
            if (def.category === "traveling") {
              patched.category  = def.category;  // WAJIB: agar lolos filter Traveling
              patched.pkgId     = def.pkgId;      // WAJIB: agar tidak salah bucket
              // JANGAN overwrite destinations/facilities/prices jika user sudah punya data
              if (!savedItem.destinations?.length && def.destinations) patched.destinations = def.destinations;
              if (!savedItem.facilities?.length   && def.facilities)   patched.facilities   = def.facilities;
              if (!savedItem.paketTypes?.length    && def.paketTypes)   patched.paketTypes   = def.paketTypes;
              if (!savedItem.services?.length      && def.services)     patched.services     = def.services;
              // highlight hanya inject jika belum pernah di-set user
              if (savedItem.highlight === undefined) patched.highlight = def.highlight;
            }
            for (const field of ["facilities", "destinations", "services", "images", "pkgId", "tagline", "accent", "accentLight", "duration", "minPeserta", "description", "features", "highlight", "badge", "badgeColor", "priceNote", "category"]) {
              // Hanya inject dari DEFAULT jika field benar-benar belum ada (undefined/null)
              // Jangan overwrite array kosong [] karena user mungkin sengaja mengosongkan
              if (patched[field] === undefined || patched[field] === null) {
                if (def[field] !== undefined) patched[field] = def[field];
              }
            }
            return patched;
          });
          const existingIds = new Set(sv.map(s => s.id));
          const deletedIds = new Set(saved.deletedServiceIds || []);
          const missing = dv.filter(s => !existingIds.has(s.id) && !deletedIds.has(s.id));
          result[key] = [...merged, ...missing];
        }
      } else {
        // Primitif atau array lain → pakai nilai yang disimpan
        result[key] = sv;
      }
    }
    return result;
  };

  useEffect(() => {
    // Langsung selesaikan loading dengan DEFAULT_DATA agar halaman langsung tampil
    setIsLoading(false);

    // Fast path: baca localStorage synchronously sebelum async ops
    try {
      const lsCache = localStorage.getItem("realestate-cache-v2");
      if (lsCache) {
        const merged = mergeWithDefaults(JSON.parse(lsCache), DEFAULT_DATA);
        setData(merged);
        dataRef.current = merged;
      }
    } catch {}

    (async () => {
      try {
        // 1. Load dari cache lokal dulu (lebih cepat)
        try {
          const r = await window.storage?.get("bricksy-v2");
          if (r?.value) {
            const parsed = JSON.parse(r.value);
            const merged = mergeWithDefaults(parsed, DEFAULT_DATA);
            setData(merged);
            dataRef.current = merged;
          }
        } catch {}

        // 2. Load Firestore di background → update data jika lebih baru
        const fsData = await fsGet("main");
        if (fsData?.payload) {
          const parsed = JSON.parse(fsData.payload);
          const merged = mergeWithDefaults(parsed, DEFAULT_DATA);
          setData(merged);
          dataRef.current = merged;
          // Sync ke localStorage untuk fast-path berikutnya
          try { localStorage.setItem("realestate-cache-v2", fsData.payload); } catch {}
        }
      } catch (e) {
        console.warn("[RealEstate] Gagal load data, pakai default.", e);
      }
    })();
  }, []);

  // Setelah data selesai load → resolve artikel atau paket dari URL saat mount
  useEffect(() => {
    if (isLoading) return;
    const pathname = window.location.pathname;
    // /artikel/{section}/{slug}-{id}
    const artParsed = parseArtikelPath(pathname);
    if (artParsed) {
      const allP = Object.values(data.posts || {}).flat();
      const found = allP.find(p => p.id === artParsed.id || String(p.id) === String(artParsed.id));
      if (found) {
        // Set page ke section yang sesuai, tapi jangan push URL lagi
        const sectionPage = { news: "news", shop: "shop", destinations: "destinations" }[found.section] || "news";
        setPage(sectionPage);
        setReadPost(found);
      }
      return;
    }
    // /paket/{category}/{id}
    const pkgParsed = parsePaketPath(pathname);
    if (pkgParsed) {
      const found = (data.services || []).find(s => s.id === pkgParsed.id || String(s.id) === String(pkgParsed.id));
      if (found) {
        setPage("services");
        setActivePaket({ id: found.id, category: found.category });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, (data.services || []).length]);

  // Sync adminTabRef dengan adminTab state
  useEffect(() => { adminTabRef.current = adminTab; }, [adminTab]);

  // Force light mode — inject meta color-scheme ke <head> sekali saat mount
  useEffect(() => {
    // Meta color-scheme
    let meta = document.querySelector("meta[name='color-scheme']");
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "color-scheme";
      document.head.appendChild(meta);
    }
    meta.content = "only light";
    // Meta theme-color untuk address bar browser mobile
    let themeMeta = document.querySelector("meta[name='theme-color']");
    if (!themeMeta) {
      themeMeta = document.createElement("meta");
      themeMeta.name = "theme-color";
      document.head.appendChild(themeMeta);
    }
    themeMeta.content = "#2E3D3F";
    // Paksa html & body pakai color-scheme light — kebal dark mode
    document.documentElement.style.colorScheme = "only light";
    document.documentElement.style.forcedColorAdjust = "none";
    document.documentElement.style.webkitForcedColorAdjust = "none";
    document.documentElement.style.filter = "none";
    document.documentElement.setAttribute("data-color-scheme", "light");
    document.body.style.colorScheme = "only light";
    document.body.style.forcedColorAdjust = "none";
    document.body.style.filter = "none";
  }, []);

  // ── Static Glitch Pixel Cursor ───────────────────────────────────────────
  useEffect(() => {
    const S = 2; // ukuran 1 pixel art = 2px
    const size = 64;
    const c = document.createElement("canvas");
    c.width = size; c.height = size;
    const ctx = c.getContext("2d");

    // Helper
    const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x*S, y*S, S, S); };

    // Outline hitam
    const outline = [
      [0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],[0,9],[0,10],[0,11],[0,12],
      [1,0],[1,13],[2,13],[3,13],[4,13],
      [1,1],[2,2],[3,3],[4,4],[5,5],[6,6],[7,7],[8,8],[9,9],[10,10],[11,11],
      [2,12],[3,11],[4,10],[5,9],[6,8],[7,7],
      [5,13],[5,14],[6,14],[6,15],[7,14],[7,15],[4,14],
      [6,12],[7,12],[8,12],[8,11],[9,11],[9,10],
    ];
    outline.forEach(([x,y]) => px(x,y,"#111111"));

    // Fill putih
    const fill = [
      [1,2],[1,3],[1,4],[1,5],[1,6],[1,7],[1,8],[1,9],[1,10],[1,11],[1,12],
      [2,3],[2,4],[2,5],[2,6],[2,7],[2,8],[2,9],[2,10],[2,11],
      [3,4],[3,5],[3,6],[3,7],[3,8],[3,9],[3,10],
      [4,5],[4,6],[4,7],[4,8],[4,9],
      [5,6],[5,7],[5,8],
      [6,7],
      [5,10],[5,11],[5,12],[6,11],[6,12],[6,13],[7,13],
    ];
    fill.forEach(([x,y]) => px(x,y,"#ffffff"));

    // Glitch merah (chromatic aberration kiri)
    const red = [
      [-1,0],[-1,1],[-1,2],[-1,3],[0,-1],
      [-1,7],[-1,8],
      [4,13],[4,14],[5,14],[5,15],
    ];
    red.forEach(([x,y]) => { if(x*S>=0 && y*S>=0 && (x+1)*S<=size && (y+1)*S<=size) px(x,y,"#ff2020"); });

    // Glitch cyan (chromatic aberration kanan)
    const cyan = [
      [1,0],[12,10],[13,10],[14,10],
      [12,11],[13,11],[14,11],
      [8,14],[9,14],[10,13],[10,14],
    ];
    cyan.forEach(([x,y]) => { if(x*S>=0 && y*S>=0 && (x+1)*S<=size && (y+1)*S<=size) px(x,y,"#00e5ff"); });

    const dataUrl = c.toDataURL("image/png");
    const styleEl = document.createElement("style");
    styleEl.id = "glitch-cursor-style";
    // hotspot 0,0 = ujung panah di kiri atas
    styleEl.textContent = `*, *::before, *::after { cursor: url('${dataUrl}') 0 0, auto !important; }`;
    document.head.appendChild(styleEl);

    return () => { styleEl.remove(); };
  }, []);
  useEffect(() => {
    const favicon = document.querySelector("link[rel='icon']") || (() => {
      const l = document.createElement("link"); l.rel = "icon"; document.head.appendChild(l); return l;
    })();
    if (data.content.logoImage) {
      favicon.href = data.content.logoImage;
      favicon.type = "image/png";
    } else {
      favicon.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✈</text></svg>";
    }
  }, [data.content.logoImage]);

  // Sync browser tab title — selalu satu baris, ikuti logoText
  useEffect(() => {
    const raw = data.content.logoText || "VASTURA GROUP";
    const oneLiner = raw.replace(/\n/g, " ").replace(/\s+/g, " ").trim().toUpperCase();
    document.title = oneLiner;
  }); // tanpa dependency array → jalan setiap render, selalu up-to-date

  const save = async (d) => {
    // Selalu merge dengan DEFAULT_DATA sebelum simpan:
    // field baru yang ditambahkan di kode (lewat git push) tidak akan hilang
    const safeData = mergeWithDefaults(d, DEFAULT_DATA);
    setData(safeData);
    dataRef.current = safeData; // sync ref agar popstate closure selalu punya data terbaru
    const payload = JSON.stringify(safeData);
    // Simpan ke Firestore (cloud) + window.storage (lokal backup)
    await fsSet("main", { payload, updatedAt: Date.now() });
    try { await window.storage?.set("bricksy-v2", payload); } catch {}
    try { localStorage.setItem("realestate-cache-v2", payload); } catch {}
  };

  const notify = (msg, type = "success") => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 3200);
  };

  const login = async () => {
    const u = HARDCODED_USERS.find(x => x.username === loginForm.username);
    if (!u) { setLoginErr("Invalid username or password."); return; }
    // Check for password override in storage
    let savedPass = u.password;
    let profile = { name: u.name, phone: u.phone, email: u.email, desc: u.desc, photo: u.photo };
    try {
      const r = await fsGet(`profile-${u.username}`);
      if (r) {
        if (r._password) savedPass = r._password;
        profile = { name: r.name ?? profile.name, phone: r.phone ?? profile.phone, email: r.email ?? profile.email, desc: r.desc ?? profile.desc, photo: r.photo ?? profile.photo };
      }
    } catch {}
    if (loginForm.password !== savedPass) { setLoginErr("Invalid username or password."); return; }
    const sessionUser = { ...u, ...profile };
    setUser(sessionUser);
    sessionSave(sessionUser);
    setShowLogin(false); setLoginErr(""); setLoginForm({ username: "", password: "" });
    notify(`Welcome back, ${profile.name || u.username}!`);
  };

  /* ── Forgot Password: Step 1 — cari username ── */
  const forgotStep1 = async () => {
    if (!forgotUser.trim()) { setForgotErr(`Masukkan ${forgotSearchBy === "username" ? "username" : forgotSearchBy === "email" ? "email" : "nomor HP"}.`); return; }
    let found = null;
    // Search in HARDCODED_USERS first
    if (forgotSearchBy === "username") {
      found = HARDCODED_USERS.find(x => x.username === forgotUser.trim()) || null;
    } else if (forgotSearchBy === "email") {
      found = HARDCODED_USERS.find(x => x.email && x.email.toLowerCase() === forgotUser.trim().toLowerCase()) || null;
    } else {
      found = HARDCODED_USERS.find(x => x.phone && x.phone.replace(/\D/g,"") === forgotUser.trim().replace(/\D/g,"")) || null;
    }
    // If not found in hardcoded, also search Firestore profiles
    if (!found) {
      for (const u of HARDCODED_USERS) {
        try {
          const r = await fsGet(`profile-${u.username}`);
          if (!r) continue;
          if (forgotSearchBy === "email" && r.email && r.email.toLowerCase() === forgotUser.trim().toLowerCase()) { found = { ...u, email: r.email, phone: r.phone || u.phone }; break; }
          if (forgotSearchBy === "phone" && r.phone && r.phone.replace(/\D/g,"") === forgotUser.trim().replace(/\D/g,"")) { found = { ...u, email: r.email || u.email, phone: r.phone }; break; }
        } catch {}
      }
    }
    if (!found) { setForgotErr("Akun tidak ditemukan. Periksa kembali data yang dimasukkan."); return; }
    setForgotFoundUser(found.username);
    setForgotErr("");
    setForgotStep("input_email");
  };

  /* ── Forgot Password: Step 2 — verifikasi email & kirim OTP ── */
  const forgotStep2 = async () => {
    setForgotErr("");
    const targetUser = forgotFoundUser || forgotUser.trim();
    const u = HARDCODED_USERS.find(x => x.username === targetUser);
    // Ambil email dari Firestore atau hardcoded
    let storedEmail = u?.email || "";
    try {
      const r = await fsGet(`profile-${u.username}`);
      if (r?.email) storedEmail = r.email;
    } catch {}
    if (!storedEmail) { setForgotErr("Akun ini belum memiliki email terdaftar. Hubungi administrator."); return; }
    if (forgotEmail.trim().toLowerCase() !== storedEmail.toLowerCase()) {
      setForgotErr("Email tidak cocok dengan data akun ini."); return;
    }
    setForgotOTP(p => ({ ...p, sending: true }));
    try {
      const code = genOTP();
      await sendOTPEmail(storedEmail, code);
      setForgotOTP({ code, input: "", expiry: Date.now() + 15 * 60 * 1000, sending: false });
      setForgotStep("input_otp");
    } catch (e) {
      setForgotErr("Gagal mengirim OTP: " + (e.message || "Error")); 
      setForgotOTP(p => ({ ...p, sending: false }));
    }
  };

  /* ── Forgot Password: Step 3 — verifikasi OTP ── */
  const forgotStep3 = () => {
    if (Date.now() > forgotOTP.expiry) { setForgotErr("OTP sudah kadaluarsa. Kirim ulang."); return; }
    if (forgotOTP.input.trim() !== forgotOTP.code) { setForgotErr("Kode OTP salah."); return; }
    setForgotErr("");
    setForgotStep("input_newpass");
  };

  /* ── Forgot Password: Step 4 — simpan password baru ── */
  const forgotStep4 = async () => {
    if (forgotNewPass.val.length < 6) { setForgotErr("Password minimal 6 karakter."); return; }
    if (forgotNewPass.val !== forgotNewPass.confirm) { setForgotErr("Konfirmasi password tidak cocok."); return; }
    const targetUser = forgotFoundUser || forgotUser.trim();
    try {
      const prev = await fsGet(`profile-${targetUser}`) || {};
      await fsSet(`profile-${targetUser}`, { ...prev, _password: forgotNewPass.val });
    } catch {}
    // Reset state
    setForgotStep(null); setForgotUser(""); setForgotEmail("");
    setForgotFoundUser(null);
    setForgotOTP({ code: "", input: "", expiry: 0, sending: false });
    setForgotNewPass({ val: "", confirm: "" }); setForgotErr("");
    notify("Password berhasil direset! Silakan login.");
  };

  const closeForgot = () => {
    setForgotStep(null); setForgotUser(""); setForgotEmail("");
    setForgotFoundUser(null); setForgotSearchBy("username");
    setForgotOTP({ code: "", input: "", expiry: 0, sending: false });
    setForgotNewPass({ val: "", confirm: "" }); setForgotErr("");
  };

  const logout = () => {
    setUser(null);
    sessionClear();
    closeAdmin();
    notify("Logged out.");
  };

  const content  = data.content || {}; // shorthand alias (guard untuk undefined)
  const isAdmin = user?.role === "admin";
  const canEdit = user?.role === "admin" || user?.role === "content_writer";
  const canCS   = user?.role === "admin" || user?.role === "customer_services";

  const navigateTo = (p) => {
    /* Cari path dari PAGE_TO_PATH, fallback ke "/" + p untuk sub-routes */
    const navPath = PAGE_TO_PATH[p] || ("/" + p);
    const newDepth = spaDepth.current + 1;
    window.history.pushState({ page: p, depth: newDepth }, "", navPath);
    spaDepth.current = newDepth;
    spaMaxDepth.current = newDepth;
    setCanBack(true);
    setCanFwd(false);
    setPage(p); setReadPost(null); setActivePaket(null); setTemaSlug(null); setMobileMenu(false);
    window.scrollTo(0, 0);
  };

  /** Buka artikel: push URL /artikel/{section}/{slug}-{id} + set state */
  const openArticle = (post) => {
    const url = articleUrl(post);
    const newDepth = spaDepth.current + 1;
    window.history.pushState({ artikelId: post.id, section: post.section, depth: newDepth }, "", url);
    spaDepth.current = newDepth;
    spaMaxDepth.current = newDepth;
    setCanBack(true);
    setCanFwd(false);
    setReadPost(post);
    setMobileMenu(false);
    window.scrollTo(0, 0);
  };

  /** Tutup artikel: native back — biar onPopState yang atur state */
  const closeArticle = () => {
    window.history.back();
  };

  /** Buka admin panel: set state + sync URL ke /control-panel */
  const openAdmin = () => {
    const newDepth = spaDepth.current + 1;
    window.history.pushState({ admin: true, adminTab: "dashboard", depth: newDepth }, "", "/control-panel");
    spaDepth.current = newDepth;
    spaMaxDepth.current = newDepth;
    setCanBack(true);
    setCanFwd(false);
    setShowAdmin(true);
    setAdminTab("dashboard");
  };

  /** Tutup admin panel: native back */
  const closeAdmin = () => {
    window.history.pushState({}, "", "/");
    setShowAdmin(false);
    window.scrollTo(0, 0);
  };

  /** Navigasi antar tab admin — push ke browser history agar tombol ← browser bisa step-back */
  const navigateAdminTab = (tab, extra = {}) => {
    const newDepth = spaDepth.current + 1;
    window.history.pushState({ admin: true, adminTab: tab, depth: newDepth, ...extra }, "", "/control-panel");
    spaDepth.current = newDepth;
    spaMaxDepth.current = newDepth;
    setCanBack(true);
    setCanFwd(false);
    setAdminTab(tab);
    setCmsEditPost(null);
    setSidebarOpen(false);
  };

  /** openPaket / closePaket — URL sync untuk halaman detail paket */
  // State ini dioper ke ServicesPage sebagai prop
  const [activePaket, setActivePaket] = useState(() => {
    // Restore dari URL /paket/{category}/{id} saat mount
    const parsed = parsePaketPath(window.location.pathname);
    return parsed ? parsed : null; // { category, id } — ServicesPage cari svc-nya
  });

  const openPaket = (svc) => {
    const url = paketUrl(svc);
    const newDepth = spaDepth.current + 1;
    window.history.pushState({ paketId: svc.id, category: svc.category, depth: newDepth }, "", url);
    spaDepth.current = newDepth;
    spaMaxDepth.current = newDepth;
    setCanBack(true);
    setCanFwd(false);
    setActivePaket({ id: svc.id, category: svc.category });
    window.scrollTo(0, 0);
  };

  const closePaket = () => {
    window.history.back();
  };

  const adminTabRef = useRef("dashboard"); // selalu sync dengan adminTab untuk akses di popstate

  const spaBack = () => {
    window.history.back(); // onPopState yang handle state React + _syncDepth
  };

  const spaForward = () => {
    window.history.forward(); // onPopState yang handle state React + _syncDepth
  };

  // Post operations
  // silent=true → auto-save, tetap di editor, tanpa notif
  const savePost = (post, silent = false) => {
    // Validasi section — jika tidak valid, fallback ke "news"
    const validSections = ["news", "shop", "destinations"];
    const section = validSections.includes(post.section) ? post.section : "news";
    const postWithSection = { ...post, section };
    const existing = (data.posts[section] || []);
    const idx = existing.findIndex(p => p.id === postWithSection.id);
    // Jika post lama ada di seksi yang berbeda, hapus dari seksi lama dulu
    let newPosts = { ...data.posts };
    if (idx < 0) {
      validSections.forEach(sec => {
        if (sec !== section) {
          newPosts[sec] = (newPosts[sec] || []).filter(p => p.id !== postWithSection.id);
        }
      });
    }
    const updated = idx >= 0
      ? existing.map((p, i) => i === idx ? postWithSection : p)
      : [...existing, postWithSection];
    newPosts = { ...newPosts, [section]: updated };
    save({ ...data, posts: newPosts });
    if (!silent) {
      setCmsEditPost(null);
      notify(postWithSection.status === "published" ? "Post published!" : "Saved as draft.");
    }
  };

  const deletePost = (section, id) => {
    const newPosts = { ...data.posts, [section]: (data.posts[section] || []).filter(p => p.id !== id) };
    save({ ...data, posts: newPosts });
    notify("Post deleted.");
  };

  const allPosts       = Object.values(data.posts || {}).flat();
  const publishedCount = allPosts.filter(p => p.status === "published").length;
  const draftCount     = allPosts.filter(p => p.status === "draft").length;

  // Contacts
  const submitMsg = () => {
    if (!contact.name || !contact.email || !contact.message) return notify("Fill all fields.", "error");
    // Save locally
    const msg = { ...contact, id: Date.now(), date: new Date().toLocaleDateString("id-ID"), read: false, replies: [] };
    save({ ...data, messages: [...data.messages, msg] });
    // Redirect to WhatsApp
    const text = `Halo VASTURA GROUP! 👋\n\nNama: ${contact.name}\nEmail: ${contact.email}\n\nPesan:\n${contact.message}\n\nSalam,\n${contact.name}`;
    openWaPicker(text);
    setContact({ name: "", email: "", message: "" });
    notify("Mengarahkan ke WhatsApp...");
  };

  const replyMsg = (id) => {
    if (!replyText.trim()) return;
    const msgs = data.messages.map(m => m.id === id
      ? { ...m, replies: [...(m.replies || []), { text: replyText, date: new Date().toLocaleDateString("id-ID"), author: user.username }], read: true }
      : m);
    save({ ...data, messages: msgs });
    setReplyTo(null); setReplyText("");
    notify("Reply sent!");
  };

  const updateImg = () => {
    if (!editImg.url.trim()) return notify("Please enter image URL.", "error");
    const imgs = { ...data.images };
    const arr = [...imgs[editImg.group]];
    arr[editImg.idx] = editImg.url.trim();
    imgs[editImg.group] = arr;
    save({ ...data, images: imgs });
    setEditImg({ group: null, idx: null, url: "" });
    notify("Image updated!");
  };

  const saveContent = (key) => {
    if (editContent[key] !== undefined) {
      save({ ...data, content: { ...data.content, [key]: editContent[key] } });
      setEditContent(p => { const n = { ...p }; delete n[key]; return n; });
      notify("Content saved!");
    }
  };

  const getCEFVal = (cKey) => editContent[cKey] !== undefined ? editContent[cKey] : data.content[cKey];

  const navItems = [
    { key: "home",  label: data.content.nav1 || "Home" },
    { key: "about", label: data.content.nav2 || "About" },
  ];
  // Dropdown: Layanan Developer (termasuk Interior & Eksterior)
  const navDropdownLayanan = [
    { key: "services",  label: data.content.nav6  || "Layanan Kami" },
    { key: "desainrab", label: data.content.nav7  || "Jasa Desain & RAB" },
    { key: "temarumah", label: data.content.nav8  || "Tema Rumah" },
    { key: "_divider",  label: null },
    { key: "interior",  label: data.content.nav9  || "Interior" },
    { key: "pagar",     label: data.content.nav10 || "Pagar Rumah" },
    { key: "kanopi",    label: data.content.nav11 || "Kanopi" },
    { key: "aluminium", label: data.content.nav12 || "Aluminium" },
  ];
  // Interior & Eksterior sudah digabung ke navDropdownLayanan
  const navDropdownInterior = [];
  // Dropdown: Program Renovasi — Rumah Subsidi & Landscape & Taman
  const navDropdownGaleri = [
    { key: "shop",      label: data.content.nav4  || "Rumah Subsidi" },
    { key: "landscape", label: data.content.nav13 || "Landscape & Taman" },
  ];
  // All keys that are "active" as pages for highlight purposes
  const allNavKeys = [
    ...navItems.map(i=>i.key),
    ...navDropdownLayanan.map(i=>i.key),
    ...navDropdownInterior.map(i=>i.key),
    ...navDropdownGaleri.map(i=>i.key),
  ];
  // Legacy flat list for mobile menu
  const allNavItemsFlat = [
    ...navItems,
    ...navDropdownLayanan,
    ...navDropdownInterior,
    ...navDropdownGaleri,
  ];

  /* ─── RENDER ─── */
  return (
    <div className="page-wrap" style={{ position: "relative", minHeight: "100vh" }}>
      <GS />

      {/* ── LOADING SKELETON ── */}
      {isLoading && !reviewTokenParam && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9990, background: "#FDFAF4", display: "flex", flexDirection: "column" }}>
          <style>{`
            @keyframes shimmer { 0%{background-position:-800px 0} 100%{background-position:800px 0} }
            .sk { background: linear-gradient(90deg,#F5EDD8 25%,#FAF7F0 50%,#F5EDD8 75%); background-size:800px 100%; animation: shimmer 1.5s infinite; border-radius:6px; }
          `}</style>
          {/* Navbar skeleton */}
          <div style={{ height: 64, background: "#fff", borderBottom: "1px solid #E8DCC8", display: "flex", alignItems: "center", padding: "0 5%", gap: 24 }}>
            <div className="sk" style={{ width: 120, height: 32 }} />
            <div style={{ flex: 1 }} />
            {[80,70,90,70,80].map((w,i) => <div key={i} className="sk" style={{ width: w, height: 14 }} />)}
          </div>
          {/* Hero skeleton */}
          <div className="sk" style={{ height: 480, margin: "0", borderRadius: 0 }} />
          {/* Cards skeleton */}
          <div style={{ padding: "40px 5%", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 24, maxWidth: 1200, margin: "0 auto", width: "100%" }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
                <div className="sk" style={{ height: 180, borderRadius: 0 }} />
                <div style={{ padding: 16, background: "#fff", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="sk" style={{ height: 16, width: "80%" }} />
                  <div className="sk" style={{ height: 12, width: "60%" }} />
                  <div className="sk" style={{ height: 12, width: "70%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DESKTOP CURSOR GLOW + SCROLL ANIMATIONS */}
      {typeof window !== "undefined" && (() => {
        // Only on desktop width (>900px)
        const isDesktop = window.innerWidth > 900;
        if (!isDesktop) return null;
        return null; // rendered via useEffect below
      })()}

      {/* NOTIFICATION */}
      {notif && (
        <div className="toast-notif" style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, padding: "14px 22px",
          background: notif.type === "error" ? "#e74c3c" : "#27ae60", color: "#fff",
          borderRadius: 8, fontSize: 14, fontWeight: 500, boxShadow: "0 8px 24px rgba(0,0,0,.2)",
          animation: "fadeIn .3s ease", maxWidth: 320 }}>{notif.msg}</div>
      )}

      {/* DEV PROFILE POPUP */}
      {showDevProfile && (
        <div onClick={() => setShowDevProfile(false)}
          style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(10,20,30,.45)",
            backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 14, padding: "36px 40px", maxWidth: 360, width: "90%",
              boxShadow: "0 20px 60px rgba(0,0,0,.2)", textAlign: "center", position: "relative" }}>
            {/* Close */}
            <button onClick={() => setShowDevProfile(false)}
              style={{ position: "absolute", top: 14, right: 16, background: "none", border: "none",
                fontSize: 18, color: "#A89070", cursor: "pointer", lineHeight: 1 }}>✕</button>
            {/* Power Icon */}
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FAF7F0",
              border: "2px solid #E8DCC8", display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#C9AA71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
                <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64" /><line x1="12" y1="2" x2="12" y2="12" />
              </svg>
            </div>
            <div style={{ fontSize: 10, letterSpacing: "2px", color: "#5A6A6C", textTransform: "uppercase", marginBottom: 10, fontWeight: 600 }}>Developer Profile</div>
            <h2 className="serif" style={{ fontSize: 24, fontWeight: 400, color: "#2E3D3F", marginBottom: 6, lineHeight: 1.2 }}>
              Mahfud Febry Styanto
            </h2>
            <div style={{ width: 32, height: 2, background: "#C9AA71", borderRadius: 2, margin: "0 auto 20px" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <a href="https://wa.me/6282234651413" target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
                  background: "#FAF7F0", borderRadius: 8, textDecoration: "none",
                  transition: "background .2s", border: "1px solid #F5EDD8" }}
                onMouseEnter={e => e.currentTarget.style.background = "#F5EDD8"}
                onMouseLeave={e => e.currentTarget.style.background = "#FAF7F0"}>
                <span style={{ fontSize: 18 }}>💬</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 10, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 600 }}>WhatsApp</div>
                  <div style={{ fontSize: 14, color: "#2E3D3F", fontWeight: 500 }}>082234651413</div>
                </div>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#C9AA71", fontWeight: 500 }}>Hubungi →</span>
              </a>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
                background: "#FAF7F0", borderRadius: 8, border: "1px solid #F5EDD8" }}>
                <span style={{ fontSize: 18 }}>✉️</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 10, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 600 }}>Email</div>
                  <div style={{ fontSize: 13, color: "#2E3D3F" }}>mahfudfebrys@gmail.com</div>
                </div>
              </div>
            </div>
            <p style={{ fontSize: 11, color: "#A89070", marginTop: 20, fontStyle: "italic" }}>
              Website developed & designed by Mahfud Febry Styanto
            </p>
          </div>
        </div>
      )}

      {/* ══════ REVIEW FORM (token-based, public) ══════ */}
      {reviewTokenParam && (
        <ReviewForm token={reviewTokenParam} data={data} save={save} notify={notify} isLoading={isLoading} />
      )}

      {/* ══════ LOGIN MODAL ══════ */}
      {showLogin && (
        <div onClick={() => setShowLogin(false)} 
          style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(10,20,30,.50)",
            backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} className="login-modal" 
            style={{ background: "#fff", borderRadius: 12, padding: "48px 44px", width: "90%", maxWidth: 400, 
              position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <button onClick={() => setShowLogin(false)} 
              style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none",
                fontSize: 24, color: "#2E3D3F", cursor: "pointer", lineHeight: 1 }}>✕</button>
            
            {!forgotStep ? (
              <>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#2E3D3F", marginBottom: 4, textAlign: "center" }}>Login</h2>
                <p style={{ fontSize: 13, color: "#5A6A6C", textAlign: "center", marginBottom: 28 }}>Akses control panel Anda</p>
                
                {loginErr && <div style={{ background: "#fceaea", borderLeft: "3px solid #e74c3c", padding: "12px 14px", borderRadius: 6, fontSize: 12, color: "#c0392b", marginBottom: 16 }}>⚠ {loginErr}</div>}
                
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#2E3D3F", marginBottom: 6, letterSpacing: ".5px" }}>USERNAME</label>
                    <input type="text" value={loginForm.username} onChange={e => setLoginForm(p => ({ ...p, username: e.target.value }))}
                      placeholder="administrator / writer1 / cs1"
                      style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E8DCC8", borderRadius: 8, 
                        fontSize: 13, outline: "none", background: "#FDFAF4", color: "#2E3D3F",
                        transition: "border .2s" }}
                      onFocus={e => e.target.style.borderColor = "#8B6914"}
                      onBlur={e => e.target.style.borderColor = "#E8DCC8"} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#2E3D3F", marginBottom: 6, letterSpacing: ".5px" }}>PASSWORD</label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input type={showPassword ? "text" : "password"} value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                        placeholder="••••••••"
                        onKeyDown={e => e.key === "Enter" && login()}
                        style={{ width: "100%", padding: "11px 14px", paddingRight: 42, border: "1.5px solid #E8DCC8", borderRadius: 8, 
                          fontSize: 13, outline: "none", background: "#FDFAF4", color: "#2E3D3F",
                          transition: "border .2s" }}
                        onFocus={e => e.target.style.borderColor = "#8B6914"}
                        onBlur={e => e.target.style.borderColor = "#E8DCC8"} />
                      <button onClick={() => setShowPassword(!showPassword)}
                        type="button"
                        style={{ position: "absolute", right: 8, background: "none", border: "none", 
                          cursor: "pointer", padding: "6px 8px", borderRadius: "50%", 
                          display: "flex", alignItems: "center", justifyContent: "center",
                          width: 36, height: 36, transition: "all .2s",
                          color: "#8B6914", fontSize: 18 }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(139,105,20,.1)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
                        {showPassword ? (
                          // Eye open icon
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        ) : (
                          // Eye closed icon with slash
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <button onClick={login}
                  style={{ width: "100%", marginTop: 20, padding: "12px 0", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)",
                    color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer",
                    transition: "all .2s" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 20px rgba(139,105,20,.35)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                  Masuk
                </button>

                <button onClick={() => { setForgotStep("input_user"); setLoginErr(""); }}
                  style={{ width: "100%", marginTop: 10, padding: "10px 0", background: "transparent", 
                    color: "#8B6914", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    textDecoration: "underline", letterSpacing: ".3px" }}>
                  Lupa Password?
                </button>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#2E3D3F", marginBottom: 4, textAlign: "center" }}>Reset Password</h2>
                <p style={{ fontSize: 12, color: "#5A6A6C", textAlign: "center", marginBottom: 20 }}>Pulihkan akses Anda</p>
                
                {forgotErr && <div style={{ background: "#fceaea", borderLeft: "3px solid #e74c3c", padding: "10px 12px", borderRadius: 6, fontSize: 11, color: "#c0392b", marginBottom: 14 }}>⚠ {forgotErr}</div>}

                {forgotStep === "input_user" && (
                  <>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A6A6C", marginBottom: 8 }}>CARI BERDASARKAN</label>
                    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                      {[{k:"username",l:"Username"}, {k:"email",l:"Email"}, {k:"phone",l:"No. HP"}].map(o => (
                        <button key={o.k} onClick={() => setForgotSearchBy(o.k)}
                          style={{ flex: 1, padding: "7px", fontSize: 11, fontWeight: 600, border: "1px solid",
                            borderRadius: 6, background: forgotSearchBy === o.k ? "#2E3D3F" : "#FDFAF4",
                            color: forgotSearchBy === o.k ? "#fff" : "#5A6A6C",
                            borderColor: forgotSearchBy === o.k ? "#2E3D3F" : "#E8DCC8",
                            cursor: "pointer" }}>
                          {o.l}
                        </button>
                      ))}
                    </div>
                    <input type="text" value={forgotUser} onChange={e => setForgotUser(e.target.value)}
                      placeholder={forgotSearchBy === "username" ? "username" : forgotSearchBy === "email" ? "email@domain.com" : "0812..."}
                      style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E8DCC8", borderRadius: 8,
                        fontSize: 13, outline: "none", background: "#FDFAF4" }}
                      onFocus={e => e.target.style.borderColor = "#8B6914"}
                      onBlur={e => e.target.style.borderColor = "#E8DCC8"} />
                    <button onClick={forgotStep1}
                      style={{ width: "100%", marginTop: 16, padding: "10px", background: "#2E3D3F", color: "#fff",
                        border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      Lanjut
                    </button>
                  </>
                )}

                {forgotStep === "input_email" && (
                  <>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A6A6C", marginBottom: 8 }}>EMAIL TERDAFTAR</label>
                    <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                      placeholder="email@domain.com"
                      style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E8DCC8", borderRadius: 8,
                        fontSize: 13, outline: "none", background: "#FDFAF4", marginBottom: 14 }}
                      onFocus={e => e.target.style.borderColor = "#8B6914"}
                      onBlur={e => e.target.style.borderColor = "#E8DCC8"} />
                    <button onClick={forgotStep2} disabled={forgotOTP.sending}
                      style={{ width: "100%", padding: "10px", background: forgotOTP.sending ? "#ccc" : "#27ae60", 
                        color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      {forgotOTP.sending ? "Mengirim..." : "Kirim OTP"}
                    </button>
                  </>
                )}

                {forgotStep === "input_otp" && (
                  <>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A6A6C", marginBottom: 8 }}>MASUKKAN KODE OTP</label>
                    <input type="text" value={forgotOTP.input} onChange={e => setForgotOTP(p => ({ ...p, input: e.target.value }))}
                      placeholder="000000"
                      style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E8DCC8", borderRadius: 8,
                        fontSize: 13, outline: "none", background: "#FDFAF4", marginBottom: 14, letterSpacing: "3px" }}
                      onFocus={e => e.target.style.borderColor = "#8B6914"}
                      onBlur={e => e.target.style.borderColor = "#E8DCC8"} />
                    <button onClick={forgotStep3}
                      style={{ width: "100%", padding: "10px", background: "#2E3D3F", color: "#fff",
                        border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      Verifikasi OTP
                    </button>
                  </>
                )}

                {forgotStep === "input_newpass" && (
                  <>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A6A6C", marginBottom: 8 }}>PASSWORD BARU</label>
                    <input type="password" value={forgotNewPass.val} onChange={e => setForgotNewPass(p => ({ ...p, val: e.target.value }))}
                      placeholder="••••••••"
                      style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E8DCC8", borderRadius: 8,
                        fontSize: 13, outline: "none", background: "#FDFAF4", marginBottom: 10 }}
                      onFocus={e => e.target.style.borderColor = "#8B6914"}
                      onBlur={e => e.target.style.borderColor = "#E8DCC8"} />
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A6A6C", marginBottom: 8 }}>KONFIRMASI PASSWORD</label>
                    <input type="password" value={forgotNewPass.confirm} onChange={e => setForgotNewPass(p => ({ ...p, confirm: e.target.value }))}
                      placeholder="••••••••"
                      style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E8DCC8", borderRadius: 8,
                        fontSize: 13, outline: "none", background: "#FDFAF4", marginBottom: 14 }}
                      onFocus={e => e.target.style.borderColor = "#8B6914"}
                      onBlur={e => e.target.style.borderColor = "#E8DCC8"} />
                    <button onClick={forgotStep4}
                      style={{ width: "100%", padding: "10px", background: "#27ae60", color: "#fff",
                        border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      Simpan Password
                    </button>
                  </>
                )}

                <button onClick={closeForgot}
                  style={{ width: "100%", marginTop: 12, padding: "10px", background: "transparent",
                    color: "#5A6A6C", border: "1px solid #E8DCC8", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>
                  Kembali
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════ PUBLIC WEBSITE ══════ */}
      {!showAdmin && !reviewTokenParam && (
        <>
          {/* NAVBAR — Fixed floating always */}
          <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
            background: "rgba(255,255,255,.94)",
            backdropFilter: "blur(18px) saturate(1.2)",
            borderBottom: "1px solid rgba(158,155,150,.18)",
            boxShadow: "0 2px 32px rgba(20,18,16,.08), 0 1px 0 rgba(255,255,255,.9) inset",
            padding: "0 5%", overflow: "visible" }}>
            {/* ── Smoke & flare layer — white/grey ── */}
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
              {/* Smoke left */}
              <div style={{ position: "absolute", left: "15%", top: "-30%", width: 180, height: "170%",
                background: "radial-gradient(ellipse at 50% 50%, rgba(235,232,226,.55) 0%, rgba(240,238,234,.15) 55%, transparent 100%)",
                filter: "blur(22px)", transform: "rotate(-10deg)" }} />
              {/* Flare at junction */}
              <div style={{ position: "absolute", left: "calc(22% - 40px)", top: "50%", transform: "translateY(-50%)",
                width: 80, height: 80,
                background: "radial-gradient(circle, rgba(158,155,150,.38) 0%, rgba(158,155,150,.12) 45%, transparent 80%)",
                filter: "blur(10px)" }} />
              {/* Sash / selendang line */}
              <div style={{ position: "absolute", top: "50%", left: "10%", width: "80%", height: 1,
                background: "linear-gradient(90deg,transparent,rgba(158,155,150,.12),transparent)",
                transform: "translateY(-50%)" }} />
              {/* Smoke right */}
              <div style={{ position: "absolute", right: "12%", top: "-20%", width: 200, height: "140%",
                background: "radial-gradient(ellipse at 40% 60%, rgba(74,72,69,.08) 0%, transparent 100%)",
                filter: "blur(28px)", transform: "rotate(6deg)" }} />
            </div>
            <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", height: 82, maxWidth: 1200, margin: "0 auto", gap: 20 }}>

              {/* ── LOGO ── */}
              <button onClick={() => navigateTo("home")} style={{ border: "none", background: "none", padding: 0, flexShrink: 0, height: "100%", display: "flex", alignItems: "center", overflow: "visible", minWidth: 0 }}>
                <span className="hide-sm">
                  <LogoDisplay content={data.content} size="nav" />
                </span>
                <span className="show-sm">
                  <LogoDisplay content={data.content} size="mobile-nav" />
                </span>
              </button>

              {/* ── DESKTOP NAV with Dropdowns ── */}
              <div className="hide-sm" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, paddingLeft: 8, flexWrap: "wrap" }}>
                {/* Flat nav items */}
                {navItems.map(item => (
                  <button key={item.key} onClick={() => navigateTo(item.key)}
                    className={`nav-link${page === item.key ? " active" : ""}`}
                    style={{ border: "none", background: "none", cursor: "pointer", padding: "4px 2px" }}>
                    {item.label}
                  </button>
                ))}

                {/* Dropdown: Layanan */}
                <NavDropdownLayanan page={page} navigateTo={navigateTo} navDropdownLayanan={navDropdownLayanan} />

                {/* Interior & Eksterior sudah digabung ke dropdown Layanan */}

                {/* Dropdown: Galeri & Proyek */}
                <NavDropdownGaleri page={page} navigateTo={navigateTo} navDropdownGaleri={navDropdownGaleri} />
              </div>

              {/* ── LOGIN / USER (desktop) ── */}
              <div className="hide-sm" style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
                {user
                  ? <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {/* Avatar dengan organic border shape */}
                      <div style={{
                        width: 38, height: 38, flexShrink: 0,
                        background: user.photo ? "transparent" : "linear-gradient(135deg,#3D5254,#C9AA71)",
                        borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
                        border: "2.5px solid rgba(255,255,255,.75)",
                        boxShadow: "0 0 0 3px rgba(139,105,20,.4), 0 4px 14px rgba(0,0,0,.22)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        overflow: "hidden", transition: "border-radius .4s ease, box-shadow .3s"
                      }}
                        onMouseEnter={e => { e.currentTarget.style.borderRadius = "50%"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(201,170,113,.6), 0 6px 20px rgba(0,0,0,.3)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderRadius = "30% 70% 70% 30% / 30% 30% 70% 70%"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,105,20,.4), 0 4px 14px rgba(0,0,0,.22)"; }}>
                        {user.photo
                          ? <img loading="lazy" src={user.photo} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <span style={{ color: "#fff", fontWeight: 800, fontSize: "1rem" }}>{(user.name || user.username || "?")[0].toUpperCase()}</span>
                        }
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3 }}>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 700, lineHeight: 1.2, animation: "navPulse 90s ease-in-out infinite" }}>
                          {user.name || user.username}
                        </span>
                        {/* CP button dengan border shape asimetris */}
                        <button onClick={() => openAdmin()}
                          style={{
                            fontSize: "0.6rem", letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 800,
                            color: "#fff",
                            background: "linear-gradient(130deg,rgba(8,145,178,.65),rgba(10,168,191,.45))",
                            border: "1px solid rgba(255,255,255,.6)",
                            cursor: "pointer", lineHeight: 1.3,
                            padding: "2px 10px",
                            borderRadius: "14px 4px 14px 4px",
                            boxShadow: "0 2px 8px rgba(0,0,0,.18)",
                            transition: "all .25s"
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.28)"; e.currentTarget.style.borderRadius = "4px 14px 4px 14px"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,.28)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(130deg,rgba(8,145,178,.65),rgba(10,168,191,.45))"; e.currentTarget.style.borderRadius = "14px 4px 14px 4px"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.18)"; }}>
                          ⚙ Control Panel
                        </button>
                        {/* Tombol Logout */}
                        <button onClick={() => logout()}
                          style={{
                            fontSize: "0.6rem", letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 800,
                            color: "#fff",
                            background: "linear-gradient(130deg,rgba(180,40,40,.65),rgba(210,60,60,.45))",
                            border: "1px solid rgba(255,255,255,.5)",
                            cursor: "pointer", lineHeight: 1.3,
                            padding: "2px 10px",
                            borderRadius: "4px 14px 4px 14px",
                            boxShadow: "0 2px 8px rgba(0,0,0,.18)",
                            transition: "all .25s"
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,80,80,.45)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(130deg,rgba(180,40,40,.65),rgba(210,60,60,.45))"; }}>
                          ⏻ Logout
                        </button>
                      </div>
                    </div>
                  : <button onClick={() => setShowLogin(true)}
                    className="login-collapse-btn"
                    style={{
                      display: "flex", alignItems: "center", gap: 0, overflow: "hidden",
                      width: 36, border: "1.5px solid rgba(20,18,16,.35)", borderRadius: 4,
                      fontSize: "0.75rem", letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 700,
                      background: "transparent", color: "var(--re-black)", padding: "7px 9px",
                      cursor: "pointer", transition: "width .28s cubic-bezier(.4,0,.2,1), padding .28s, background .18s, color .18s", whiteSpace: "nowrap" }}
                    onMouseEnter={e => { const b = e.currentTarget; b.style.width = "90px"; b.style.paddingRight = "14px"; b.style.gap = "7px"; b.style.background = "var(--re-black)"; b.style.color = "#fff"; b.querySelector(".lcb-text").style.opacity = "1"; b.querySelector(".lcb-text").style.maxWidth = "80px"; }}
                    onMouseLeave={e => { const b = e.currentTarget; b.style.width = "36px"; b.style.paddingRight = "9px"; b.style.gap = "0"; b.style.background = "transparent"; b.style.color = "var(--re-black)"; b.querySelector(".lcb-text").style.opacity = "0"; b.querySelector(".lcb-text").style.maxWidth = "0"; }}>
                    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" style={{ flexShrink: 0 }}>
                      <rect y="0" width="16" height="2" rx="1" fill="currentColor"/>
                      <rect y="5" width="16" height="2" rx="1" fill="currentColor"/>
                      <rect y="10" width="16" height="2" rx="1" fill="currentColor"/>
                    </svg>
                    <span className="lcb-text" style={{ maxWidth: 0, opacity: 0, overflow: "hidden", transition: "max-width .28s cubic-bezier(.4,0,.2,1), opacity .2s", fontSize: "0.7rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>
                      {data.content.loginBtnText || "LOGIN"}
                    </span>
                  </button>
                }
              </div>
              <button className="show-sm" onClick={() => setMobileMenu(!mobileMenu)}
                style={{ 
                  fontSize: 22, 
                  color: "var(--re-black)", 
                  background: "transparent",
                  border: "1.5px solid rgba(20,18,16,.25)",
                  borderRadius: 6,
                  width: 38, height: 38,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  transition: "background .2s"
                }} 
                aria-label="Menu">
                {mobileMenu ? "✕" : "☰"}
              </button>
            </div>
            {mobileMenu && (
              <div className="mobile-dropdown" style={{
                position: "absolute", top: "100%", left: 0, right: 0,
                background: "rgba(255,255,255,.97)",
                borderTop: "1px solid rgba(158,155,150,.18)",
                boxShadow: "0 20px 60px rgba(20,18,16,.15)",
                backdropFilter: "blur(20px)",
                display: "flex", flexDirection: "column", gap: 2,
                padding: "16px 5% 24px", zIndex: 9999,
                animation: "fadeIn .25s ease",
                maxHeight: "calc(100vh - 72px)",
                overflowY: "auto",
                WebkitOverflowScrolling: "touch"
              }}>
                {/* ── Mobile: main nav items ── */}
                {navItems.map(item => (
                  <button key={item.key} onClick={() => { navigateTo(item.key); setMobileMenu(false); }}
                    style={{ fontSize:".8rem", letterSpacing:".14em", textTransform:"uppercase", fontFamily:"'Jost',sans-serif",
                      color:page===item.key?"var(--re-black)":"var(--re-grey-dk)", fontWeight:page===item.key?700:400,
                      border:"none", background:"transparent", textAlign:"left", padding:"13px 18px", borderRadius:6, width:"100%",
                      borderLeft:page===item.key?"2px solid var(--re-black)":"2px solid transparent", transition:"all .15s", cursor:"pointer" }}
                    onMouseEnter={e=>{e.currentTarget.style.background="var(--re-grey-lt)"; e.currentTarget.style.borderLeft="2px solid var(--re-black)";}}
                    onMouseLeave={e=>{e.currentTarget.style.background="transparent"; e.currentTarget.style.borderLeft=page===item.key?"2px solid var(--re-black)":"2px solid transparent";}}>
                    {item.label}
                  </button>
                ))}

                {/* ── Mobile: Layanan Kami (accordion) ── */}
                <MobileLayananAccordion page={page} navigateTo={navigateTo} setMobileMenu={setMobileMenu} navDropdownLayanan={navDropdownLayanan} />

                {/* ── Mobile: Program Renovasi ── */}
                <div style={{ padding:"10px 18px 4px", fontSize:"0.6rem", fontWeight:800, letterSpacing:".18em", textTransform:"uppercase", color:"#8B6914", opacity:0.8 }}>Program Renovasi</div>
                {navDropdownGaleri.map(item=>(
                  <button key={item.key} onClick={()=>{ navigateTo(item.key); setMobileMenu(false); }}
                    style={{ fontSize:".8rem", letterSpacing:".12em", textTransform:"uppercase", fontFamily:"'Jost',sans-serif",
                      color:page===item.key?"var(--re-black)":"var(--re-grey-dk)", fontWeight:page===item.key?700:400,
                      border:"none", background:"transparent", textAlign:"left", padding:"11px 28px", borderRadius:6, width:"100%",
                      borderLeft:page===item.key?"2px solid #8B6914":"2px solid transparent", transition:"all .15s", cursor:"pointer" }}
                    onMouseEnter={e=>{e.currentTarget.style.background="var(--re-grey-lt)";}}
                    onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
                    {item.label}
                  </button>
                ))}
                {user && (
                  <div style={{ padding: "12px 4px 4px", borderTop: "1px solid var(--re-grey-lt)", marginTop: 8 }}>
                    <div style={{ fontSize: ".8125rem", color: "var(--re-grey-md)", marginBottom: 10, padding: "0 12px" }}>
                      Login sebagai <strong style={{ color: "var(--re-black)" }}>{user.name || user.username}</strong>
                    </div>
                    <button onClick={() => { openAdmin(); setMobileMenu(false); }}
                      style={{ fontSize: ".875rem", color: "#fff", background: "var(--re-black)", border: "none", borderRadius: 6, padding: "11px 16px", fontWeight: 700, width: "100%", marginBottom: 8, fontFamily:"'Jost',sans-serif" }}>
                      ⚙ Admin Panel
                    </button>
                    <button onClick={() => { logout(); setMobileMenu(false); }}
                      style={{ fontSize: ".875rem", color: "rgba(160,40,40,.9)", background: "rgba(200,50,50,.08)", border: "1px solid rgba(200,50,50,.2)", borderRadius: 6, padding: "10px 16px", width: "100%", fontFamily:"'Jost',sans-serif" }}>
                      Logout
                    </button>
                  </div>
                )}
                {/* ── Gear icon tersembunyi — hanya untuk admin login, tanpa teks ── */}
                {!user && (
                  <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 4px 0", borderTop: "1px solid var(--re-grey-lt)", marginTop: 8 }}>
                    <button
                      onClick={() => { setShowLogin(true); setMobileMenu(false); }}
                      style={{
                        width: 28, height: 28,
                        border: "none", background: "transparent",
                        cursor: "pointer", opacity: 0.22,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "opacity .2s", borderRadius: 4,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = "0.55"; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = "0.22"; }}
                      aria-label="Login admin"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" style={{ color: "var(--re-black)" }}>
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Spacer to push content below fixed navbar */}
          <div style={{ height: "clamp(60px,10vw,96px)" }} />

          {/* ── NAVIGASI MAJU / MUNDUR ── */}
          {(() => {
            const isMobileNav = window.innerWidth <= 768;
            if (isMobileNav) return null; // hapus floating nav di mobile
            /* ── DESKTOP: dua tombol persegi panjang bold vertikal di kanan ── */
            return (
              <div style={{ position: "fixed", bottom: 100, right: 20, zIndex: 9989, display: "flex", flexDirection: "column", gap: 6 }}>
                <button onClick={spaForward} disabled={!canFwd} title="Maju"
                  style={{
                    width: 52, height: 44, borderRadius: 8, border: "none",
                    background: canFwd ? "linear-gradient(135deg,#2E3D3F,#8B6914)" : "rgba(200,210,220,.55)",
                    boxShadow: canFwd ? "0 4px 14px rgba(13,59,102,.40)" : "0 2px 6px rgba(0,0,0,.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: canFwd ? "pointer" : "default", opacity: canFwd ? 1 : 0.45,
                    transition: "transform .18s, box-shadow .18s, opacity .18s",
                  }}
                  onMouseEnter={e => { if (canFwd) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 22px rgba(13,59,102,.5)"; }}}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = canFwd ? "0 4px 14px rgba(13,59,102,.40)" : "0 2px 6px rgba(0,0,0,.12)"; }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                <button onClick={spaBack} disabled={!canBack} title="Mundur"
                  style={{
                    width: 52, height: 44, borderRadius: 8, border: "none",
                    background: canBack ? "linear-gradient(135deg,#2E3D3F,#8B6914)" : "rgba(200,210,220,.55)",
                    boxShadow: canBack ? "0 4px 14px rgba(13,59,102,.40)" : "0 2px 6px rgba(0,0,0,.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: canBack ? "pointer" : "default", opacity: canBack ? 1 : 0.45,
                    transition: "transform .18s, box-shadow .18s, opacity .18s",
                  }}
                  onMouseEnter={e => { if (canBack) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 22px rgba(13,59,102,.5)"; }}}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = canBack ? "0 4px 14px rgba(13,59,102,.40)" : "0 2px 6px rgba(0,0,0,.12)"; }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              </div>
            );
          })()}

          {/* ── WA PICKER MODAL ── */}
          {waPicker && (
            <WaPickerModal
              admins={content.waAdmins}
              msgText={waPicker.msgText}
              onClose={() => setWaPicker(null)}
            />
          )}

          {/* ── WHATSAPP FLOATING BUTTON ── */}
          <button onClick={() => openWaPicker()}
            title="Hubungi Kami via WhatsApp"
            style={{
              position: "fixed", bottom: 24, right: 20, zIndex: 9990,
              width: 58, height: 58, borderRadius: "50%",
              background: "#25d366",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 20px rgba(37,211,102,.5), 0 2px 8px rgba(0,0,0,.2)",
              border: "none", cursor: "pointer", transition: "transform .2s, box-shadow .2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.12)"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(37,211,102,.65), 0 4px 12px rgba(0,0,0,.25)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(37,211,102,.5), 0 2px 8px rgba(0,0,0,.2)"; }}>
            {/* WhatsApp SVG Icon */}
            <svg width="30" height="30" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 3C8.82 3 3 8.82 3 16c0 2.38.65 4.61 1.78 6.53L3 29l6.64-1.74A12.93 12.93 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3z" fill="#fff"/>
              <path d="M16 5.5c-5.79 0-10.5 4.71-10.5 10.5 0 2.03.58 3.93 1.59 5.54l.28.45-.97 3.54 3.65-.95.43.25A10.44 10.44 0 0 0 16 26.5c5.79 0 10.5-4.71 10.5-10.5S21.79 5.5 16 5.5zm5.32 14.57c-.22.62-1.28 1.18-1.76 1.23-.45.05-.87.22-2.93-.61-2.49-1-4.07-3.54-4.2-3.7-.12-.17-.99-1.32-.99-2.52 0-1.2.63-1.79.85-2.03.22-.25.49-.31.65-.31l.47.01c.15.01.36-.06.56.43.21.5.72 1.76.78 1.89.07.13.11.28.02.45-.08.17-.13.28-.25.43l-.38.44c-.12.13-.25.26-.11.51.14.25.63 1.04 1.35 1.68.93.83 1.71 1.09 1.96 1.21.25.12.39.1.54-.06.15-.16.62-.72.78-.97.16-.25.33-.21.55-.13.22.08 1.41.67 1.65.79.24.12.4.18.46.28.06.1.06.58-.16 1.2z" fill="#25d366"/>
            </svg>
            {/* Pulse ring animation */}
            <style>{`
              @keyframes waPulse {
                0% { transform: scale(1); opacity: .6; }
                100% { transform: scale(1.7); opacity: 0; }
              }
              .wa-float-ring {
                position: absolute; inset: 0; border-radius: 50%;
                border: 2px solid #25d366;
                animation: waPulse 2s ease-out infinite;
                pointer-events: none;
              }
              @media(max-width:768px){ .hero-arrow{ display:none !important; } }
            `}</style>
            <div className="wa-float-ring" />
          </button>

          {/* ── ARTICLE DETAIL ── */}
          {readPost && (
            <ArticleDetail post={readPost} onBack={closeArticle} allPosts={allPosts} onReadPost={(p) => openArticle(p)} />
          )}

          {/* ── PAGE CONTENT ── */}
          {!readPost && (
            <>
              {/* HOME */}
              {page === "home" && (
                <>
                  {/* ══ HERO ══ */}
                  <section className="re-hero">
                    {/* Background Video Hero */}
                    <video
                      ref={heroVideoRef}
                      className="re-hero-img"
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                      style={{ objectFit:"cover", objectPosition:"center center" }}
                    >
                      <source src="https://res.cloudinary.com/dum9j7yn1/video/upload/q_auto,vc_auto/v1782135360/Backgroud_Video_Hero_nfxtof.mp4" type="video/mp4" />
                      <source src="https://res.cloudinary.com/dum9j7yn1/video/upload/v1782135360/Backgroud_Video_Hero_nfxtof.mov" type="video/quicktime" />
                    </video>
                    <div className="re-hero-overlay" />
                    {/* Smoke ornaments */}
                    <div style={{ position:"absolute",inset:0,pointerEvents:"none",zIndex:1,overflow:"hidden" }}>
                      <div className="re-smoke-orb" style={{ width:420,height:420,top:"10%",left:"60%",animationDelay:"0s" }} />
                      <div className="re-smoke-orb" style={{ width:280,height:280,top:"55%",right:"8%",animationDelay:"3s" }} />
                      <div className="re-flare" style={{ width:160,height:160,top:"20%",left:"72%",animationDelay:"1.5s" }} />
                      {/* Selendang / sash decorative line */}
                      <div className="re-sash" style={{ top:"30%",left:"0",animationDelay:"0s" }} />
                      <div className="re-sash" style={{ top:"65%",right:"0",width:"45%",left:"auto",animationDelay:"2s" }} />
                    </div>
                    <div className="re-hero-content">
                      <div className="re-hero-eyebrow">VASTURA GROUP</div>
                      <h1 className="re-hero-h1">
                        Ubah Rumah Impian<br />Menjadi Kenyataan
                      </h1>
                      <button
                        className="re-btn re-btn-ghost"
                        onClick={() => document.getElementById("re-contact-section")?.scrollIntoView({ behavior:"smooth" })}
                      >
                        Ajukan Pertanyaan
                      </button>
                    </div>
                  </section>

                  {/* ══ RUNNING TEXT / MARQUEE ══ */}
                  <div style={{
                    background: "#cc0000",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    padding: "5px 0",
                    position: "relative",
                    zIndex: 10,
                    lineHeight: 1,
                    display: "flex",
                    alignItems: "center",
                  }}>
                    <style>{`
                      @keyframes marqueeScroll {
                        0%   { transform: translateX(100vw); }
                        100% { transform: translateX(-100%); }
                      }
                      .running-text-inner {
                        display: inline-block;
                        animation: marqueeScroll 55s linear infinite;
                        color: #ffffff;
                        font-weight: 700;
                        font-size: 0.78rem;
                        letter-spacing: 0.04em;
                        line-height: 1;
                        vertical-align: middle;
                      }
                      @media (max-width: 600px) {
                        .running-text-inner { font-size: 0.72rem; }
                      }
                    `}</style>
                    <span className="running-text-inner">
                      🔴&nbsp;&nbsp;PUNYA INFO PROYEK KONSTRUKSI?&nbsp;&nbsp;Referensikan kepada perusahaan kami dan dapatkan komisi hingga 3% dari nilai proyek apabila kami terpilih sebagai mitra pelaksana.&nbsp;&nbsp;Legal, transparan, dan tanpa modal.&nbsp;&nbsp;Hubungi kami sekarang!&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;🔴&nbsp;&nbsp;PUNYA INFO PROYEK KONSTRUKSI?&nbsp;&nbsp;Referensikan kepada perusahaan kami dan dapatkan komisi hingga 3% dari nilai proyek apabila kami terpilih sebagai mitra pelaksana.&nbsp;&nbsp;Legal, transparan, dan tanpa modal.&nbsp;&nbsp;Hubungi kami sekarang!
                    </span>
                  </div>

                  {/* ══ ABOUT ══ */}
                  <section className="re-about">
                    {/* Smoke background orb */}
                    <div className="re-smoke-orb" style={{ width:500,height:500,top:"-100px",right:"-80px",animationDelay:"1s" }} />
                    <div className="re-smoke-orb" style={{ width:340,height:340,bottom:"-60px",left:"-60px",animationDelay:"4s" }} />
                    <p className="re-about-label re-reveal">Tentang Kami</p>
                    <h2 className="re-about-h2 re-reveal delay-1">
                      Selama 20 tahun lebih, VASTURA GROUP telah melakukan jual-beli properti. Kami bangga menjadi salah satu perusahaan properti terkemuka di kota.
                    </h2>
                    <div className="re-sash" style={{ bottom:0,left:"20%",width:"60%",opacity:.5 }} />
                  </section>

                  {/* ══ QUOTE / PARALLAX IMAGE ══ */}
                  <section className="re-quote-img re-scale-in">
                    <img
                      src="https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1600&q=85&auto=format&fit=crop"
                      alt="Interior Modern"
                    />
                    <div className="re-quote-img-overlay" />
                    {/* Flare top-right */}
                    <div className="re-flare" style={{ width:200,height:200,top:"10%",right:"12%",animationDelay:"2s" }} />
                    <div className="re-quote-content">
                      <p className="re-quote-text">
                        Bisnis kami yang sebenarnya bukanlah menjual properti, melainkan membantu klien dalam mengambil keputusan yang paling cocok bagi mereka.
                      </p>
                    </div>
                  </section>

                  {/* ══ ACTIVE LISTINGS ══ */}
                  <section className="re-listings">
                    <div style={{ maxWidth:1200,margin:"0 auto" }}>
                      <p className="re-about-label re-reveal" style={{ marginBottom:48 }}>Listing Aktif Kami</p>

                      {[
                        {
                          title:"Properti Multifungsi 2.500 m² di Kota Mewah",
                          desc:"Properti premium dengan luas bangunan 2.500 m², cocok sebagai hunian dan tempat usaha. Dilengkapi fasilitas modern dan lokasi strategis di jantung kota.",
                          img:"https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=900&q=80&auto=format&fit=crop",
                          imgRight:false,
                        },
                        {
                          title:"Rumah Suburban Klasik 3 KT dengan Garasi dan Teras Belakang",
                          desc:"Rumah keluarga dengan tiga kamar tidur, garasi luas, dan teras belakang asri. Lingkungan tenang dengan akses mudah ke pusat kota.",
                          img:"https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&q=80&auto=format&fit=crop",
                          imgRight:true,
                        },
                        {
                          title:"Apartemen 2 KT di Pusat Kota Taman Hijau",
                          desc:"Unit apartemen modern dua kamar tidur dengan pemandangan taman kota. Interior bergaya kontemporer, fasilitas kolam renang dan gym tersedia.",
                          img:"https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900&q=80&auto=format&fit=crop",
                          imgRight:false,
                        },
                        {
                          title:"Apartemen Studio di Kompleks Modern",
                          desc:"Unit studio eksklusif di kompleks residensial terpadu. Desain minimalis fungsional dengan pencahayaan alami maksimal dan konektivitas akses transportasi.",
                          img:"https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=900&q=80&auto=format&fit=crop",
                          imgRight:true,
                        },
                      ].map((prop, i) => (
                        <div key={i} className="re-listing-item" style={{ direction: prop.imgRight ? "rtl" : "ltr" }}>
                          <div className={`re-listing-img-wrap ${prop.imgRight ? "re-slide-right" : "re-slide-left"} delay-${(i%3)+1}`} style={{ direction:"ltr" }}>
                            <img src={prop.img} alt={prop.title} />
                          </div>
                          <div className={`re-listing-info re-reveal delay-${(i%3)+2}`} style={{ direction:"ltr" }}>
                            <h3 className="re-listing-title">{prop.title}</h3>
                            <p className="re-listing-desc">{prop.desc}</p>
                            <button
                              className="re-btn re-btn-outline"
                              onClick={() => document.getElementById("re-contact-section")?.scrollIntoView({ behavior:"smooth" })}
                            >
                              Ajukan Pertanyaan
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* ══ SERVICES ══ */}
                  <section className="re-services" style={{ position:"relative", overflow:"hidden" }}>
                    {/* Smoke ornament */}
                    <div className="re-smoke-orb" style={{ width:450,height:450,top:"-80px",right:"-60px",animationDelay:"2s" }} />
                    <div style={{ maxWidth:1200,margin:"0 auto",position:"relative",zIndex:1 }}>
                      <h2 className="re-services-h2 re-reveal">Layanan VASTURA GROUP Kami</h2>
                      <div className="re-services-grid">
                        {[
                          { num:"01", title:"Beli Rumah", desc:"Sedang cari rumah? Kami bisa membantu menemukannya.", img:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80&auto=format&fit=crop" },
                          { num:"02", title:"Jual Rumah", desc:"Anda ingin jual rumah? Biarkan kami membantu Anda.", img:"https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=600&q=80&auto=format&fit=crop" },
                          { num:"03", title:"Pindah Rumah", desc:"Pindah rumah karena pekerjaan baru? Kami dapat membantu.", img:"https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80&auto=format&fit=crop" },
                          { num:"04", title:"Manajemen Properti", desc:"Kesulitan mengatur properti sewaan Anda? Kami siap bantu.", img:"https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80&auto=format&fit=crop" },
                          { num:"05", title:"Penataan & Gaya Rumah", desc:"Ingin listing Anda lebih menarik? Biarkan kami memandu Anda.", img:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80&auto=format&fit=crop" },
                          { num:"06", title:"Konsultasi Investasi", desc:"Ingin kembangkan portofolio Anda? Tim kami siap bantu.", img:"https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=600&q=80&auto=format&fit=crop" },
                        ].map((svc, i) => (
                          <div key={i} className={`re-service-card ${i%2===0 ? "re-slide-left" : "re-slide-right"} delay-${(i%5)+1}`}>
                            <div className="re-service-card-img">
                              <img src={svc.img} alt={svc.title} />
                            </div>
                            <div className="re-service-card-body">
                              <div className="re-service-num">{svc.num}</div>
                              <div className="re-service-title">{svc.title}</div>
                              <div className="re-service-desc">{svc.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* ══ CONTACT ══ */}
                  <section className="re-contact" id="re-contact-section">
                    <div className="re-contact-grid">
                      <div className="re-slide-left">
                        {(data.content.footerLogoImage || data.content.logoImage) ? (
                          <img
                            src={data.content.footerLogoImage || data.content.logoImage}
                            alt={data.content.logoText?.replace("\n"," ") || "VASTURA GROUP"}
                            style={{ height: 72, maxWidth: 200, objectFit: "contain", display: "block", marginBottom: 16 }}
                          />
                        ) : (
                          <div className="re-contact-logo">VASTURA<br />GROUP</div>
                        )}
                        <p style={{ fontFamily:"'Jost',sans-serif", fontSize:".85rem", color:"var(--re-grey-md)", lineHeight:1.8, marginBottom:14 }}>
                          {data.content.email || "halo@vastura.co.id"}
                        </p>
                      </div>
                      <div className="re-slide-right" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"32px 48px" }}>
                        <div>
                          <div className="re-contact-label">Alamat Kantor</div>
                          <div className="re-contact-val">
                            {data.content.address || "Jl. Asem Jawa 40, Cibodas,\nTangerang 15401"}
                          </div>
                          <div className="re-contact-note">Kantor kami memiliki ramp dan lift untuk kemudahan akses.</div>
                        </div>
                        <div>
                          <div className="re-contact-label">Telepon</div>
                          <div className="re-contact-val">{data.content.phone || "021 123 456 7890"}</div>
                          <div className="re-contact-label" style={{ marginTop:20 }}>Email</div>
                          <div className="re-contact-val">{data.content.email || "halo@vastura.co.id"}</div>
                        </div>
                        <div style={{ gridColumn:"1 / -1", marginTop:8 }}>
                          <button
                            className="re-btn re-btn-dark"
                            onClick={() => openWaPicker({ key: "konsultasi", vars: {} })}
                          >
                            Hubungi Kami
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* ══ CLOSING HERO ══ */}
                  <section className="re-closing-hero re-scale-in">
                    <img
                      src="https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1600&q=85&auto=format&fit=crop"
                      alt="Dream Home"
                    />
                    <div className="re-closing-hero-overlay" />
                    {/* Smoke + flare ornaments */}
                    <div className="re-smoke-orb" style={{ width:360,height:360,top:"5%",right:"15%",zIndex:1,animationDelay:"0s" }} />
                    <div className="re-flare" style={{ width:140,height:140,top:"20%",right:"30%",zIndex:1,animationDelay:"3s" }} />
                    <div className="re-closing-content" style={{ zIndex:2 }}>
                      <p className="re-closing-label">VASTURA GROUP</p>
                      <h2 className="re-closing-h2">Wujudkan rumah<br />impian Anda</h2>
                    </div>
                  </section>

                  {/* ══ FOOTER BAR ══ */}
                  <div className="re-footer-bar">
                    <span>© 2026 VASTURA GROUP. All Rights Reserved</span>
                    <button onClick={() => setShowDevProfile(true)}
                      style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,.35)",fontSize:".7rem",letterSpacing:".08em",fontFamily:"'Jost',sans-serif",transition:"color .2s" }}
                      onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,.65)"}
                      onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.35)"}>
                      Power Developer
                    </button>
                  </div>
                </>
              )}


              {/* ABOUT PAGE */}
              {page === "about" && <AboutPage content={data.content} images={data.images} teamMembers={data.teamMembers || []} onWaOpen={openWaPicker} />}

              {/* SERVICES PAGE */}
              {(page === "services" || activePaket) && <ServicesPage content={data.content} services={data.services || []} navigateTo={navigateTo} activePaket={activePaket} onOpenPaket={openPaket} onClosePaket={closePaket} onWaOpen={openWaPicker} />}

              {/* SUB-SERVICE PAGES */}
              {page === "desainrab"   && <DesainRabPage   onWaOpen={openWaPicker} />}
              {page === "temarumah"   && <TemaRumahPage   onWaOpen={openWaPicker} temaSlug={temaSlug} setTemaSlug={setTemaSlug} />}
              {page === "interior"    && <InteriorPage    onWaOpen={openWaPicker} />}
              {page === "pagar"       && <PagarPage       onWaOpen={openWaPicker} />}
              {page === "kanopi"      && <KanopiPage      onWaOpen={openWaPicker} />}
              {page === "aluminium"   && <AluminiumPage   onWaOpen={openWaPicker} />}
              {page === "landscape"   && <LandscapePage   onWaOpen={openWaPicker} />}
              {/* ── Sub-halaman Interior ── */}
              {["interior/kamar-tidur","interior/kamar-mandi","interior/ruang-keluarga","interior/ruang-tamu","interior/kitchen-set","interior/ruang-kerja","interior/plafon-modern"].includes(page) &&
                <SubInteriorPage pageKey={page} onWaOpen={openWaPicker} navigateTo={navigateTo} />}
              {/* ── Sub-halaman Eksterior ── */}
              {["eksterior/pagar","eksterior/kanopi","eksterior/aluminium","eksterior/taman-landscape"].includes(page) &&
                <SubEksteriorPage pageKey={page} onWaOpen={openWaPicker} navigateTo={navigateTo} />}

              {/* NEWS / SHOP / DESTINATIONS */}
              {["news", "shop", "destinations"].includes(page) && (
                <SectionPage
                  section={page}
                  posts={data.posts || {}}
                  onReadPost={(post) => openArticle(post)}
                />
              )}
            </>
          )}
        </>
      )}

      {/* ADMIN PANEL */}
      {showAdmin && !reviewTokenParam && (
        <div style={{ minHeight: "100vh", display: "flex", background: "#FDFAF4", paddingTop: 58 }}>
          <div className={`admin-sidebar${sidebarOpen ? " open" : ""}`}>
            {[
              { id: "dashboard", label: "Dashboard", show: true },
              { id: "content", label: "Konten Website", show: isAdmin },
              { id: "set_home", label: "⚙ Setting Home", show: isAdmin },
              { id: "set_layanankami", label: "⚙ Setting Layanan Kami", show: isAdmin },
              { id: "set_desainrab", label: "⚙ Setting Desain & RAB", show: isAdmin },
              { id: "set_temarumah", label: "⚙ Setting Tema Rumah", show: isAdmin },
              { id: "set_interior", label: "⚙ Setting Interior", show: isAdmin },
              { id: "set_pagar", label: "⚙ Setting Pagar Rumah", show: isAdmin },
              { id: "set_kanopi", label: "⚙ Setting Kanopi", show: isAdmin },
              { id: "set_aluminium", label: "⚙ Setting Aluminium", show: isAdmin },
              { id: "set_landscape", label: "⚙ Setting Landscape & Taman", show: isAdmin },
              { id: "team", label: "Susunan Tim", show: isAdmin },
              { id: "messages", label: "Pesan Masuk", show: canCS },
              { id: "users", label: "Users", show: isAdmin },
              { id: "reviews", label: "Reviews", show: isAdmin },
              { id: "settings", label: "Settings", show: isAdmin },
              { id: "profil", label: "Profil Akun", show: true },
            ].filter(item => item.show).map(item => (
              <button key={item.id} onClick={() => navigateAdminTab(item.id)}
                style={{
                  padding: "14px 20px",
                  textAlign: "left",
                  border: "none",
                  background: adminTab === item.id ? "rgba(255,255,255,.16)" : "transparent",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: adminTab === item.id ? 700 : 500,
                  letterSpacing: ".04em"
                }}>
                {item.label}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ height: 58, position: "fixed", top: 0, left: 0, right: 0, zIndex: 220, background: "#fff", borderBottom: "1px solid #d6f1f6", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", boxShadow: "0 2px 12px rgba(0,0,0,.05)" }}>
              <button className="show-sm" onClick={() => setSidebarOpen(p => !p)}
                style={{ border: "none", background: "#FAF7F0", color: "#2E3D3F", borderRadius: 6, width: 38, height: 38, cursor: "pointer", fontSize: 18 }}>
                ☰
              </button>
              <strong style={{ color: "#2E3D3F", fontSize: 15 }}>Control Panel</strong>
              <button onClick={closeAdmin} style={{ border: "none", background: "#2E3D3F", color: "#fff", borderRadius: 6, padding: "8px 14px", cursor: "pointer", fontSize: 12 }}>
                Kembali
              </button>
            </div>
            <div style={{ padding: "28px", maxWidth: 1180, margin: "0 auto" }}>
              {adminTab === "dashboard" && (
                <DashTabs
                  user={user}
                  allPosts={allPosts}
                  publishedCount={publishedCount}
                  draftCount={draftCount}
                  data={data}
                  canEdit={canEdit}
                  canCS={canCS}
                  isAdmin={isAdmin}
                  setAdminTab={navigateAdminTab}
                  setCmsEditPost={setCmsEditPost}
                  SECTION_LABELS={SECTION_LABELS}
                  SECTIONS={SECTIONS}
                  formatDate={formatDate}
                />
              )}

              {adminTab === "content" && isAdmin && (
                <div className="fade-in">
                  <h1 style={{ fontSize: 24, fontWeight: 500, color: "#2E3D3F", marginBottom: 24 }}>Konten Website</h1>
                  {[
                    { label: "Nav: Home", key: "nav1" },
                    { label: "Nav: About", key: "nav2" },
                    { label: "Nav: Program Affiliate", key: "nav3" },
                    { label: "Nav: Galeri - Traveling", key: "nav4" },
                    { label: "Nav: Galeri - Wedding Organizer", key: "nav5" },
                    { label: "Nav: Layanan Kami (Dropdown)", key: "nav6" },
                    { label: "Nav: Jasa Desain & RAB", key: "nav7" },
                    { label: "Nav: Tema Rumah", key: "nav8" },
                    { label: "Nav: Interior", key: "nav9" },
                    { label: "Nav: Pagar Rumah", key: "nav10" },
                    { label: "Nav: Kanopi", key: "nav11" },
                    { label: "Nav: Aluminium", key: "nav12" },
                    { label: "Nav: Landscape & Taman", key: "nav13" },
                    { label: "Layanan — Judul Halaman", key: "servicesPageTitle" },
                    { label: "Layanan — Subjudul Halaman", key: "servicesPageSub", multiline: true },
                  ].map(f => (
                    <div key={f.key} style={{ background: "#fff", borderRadius: 8, padding: "18px 20px", marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 8 }}>{f.label}</label>
                      <CEF
                        key={f.key}
                        val={getCEFVal(f.key)}
                        multiline={f.multiline}
                        onChange={e => setEditContent(p => ({ ...p, [f.key]: e.target.value }))}
                        onSave={() => saveContent(f.key)}
                      />
                    </div>
                  ))}

                  {/* ── WA ADMIN MANAGER ── */}
                  <WaAdminManager
                    admins={data.content.waAdmins}
                    onSave={(list) => {
                      const primaryAdmin = list.find(a => a.primary) || list[0];
                      save({ ...data, content: { ...data.content, waAdmins: list, waLink: primaryAdmin?.wa || data.content.waLink, phone: primaryAdmin?.wa?.replace("https://wa.me/", "+").replace(/^\+62(\d{3})(\d{4})(\d+)$/, "+62 $1 $2-$3") || data.content.phone } });
                      notify("✅ Daftar Admin WA disimpan!");
                    }}
                    notify={notify}
                  />
                  <SosmedManager
                    content={data.content}
                    onSave={(patch) => {
                      save({ ...data, content: { ...data.content, ...patch } });
                    }}
                    notify={notify}
                  />
                </div>
              )}

              {/* SETTING HOME */}
              {adminTab === "set_home" && isAdmin && (
                <SubLayananAdmin
                  title="Setting Home"
                  icon="🏠"
                  accentColor="#3498db"
                  storeKey="homeContent"
                  data={data}
                  save={save}
                  notify={notify}
                  uploadToCloudinary={uploadToCloudinary}
                  pageDesc="Kelola konten teks dan gambar yang tampil di halaman utama (Home) website."
                  sections={[
                    { key: "heroTitle", label: "Judul Hero / Tagline Utama", type: "text" },
                    { key: "heroSub", label: "Sub-teks Hero (deskripsi singkat)", type: "textarea" },
                    { key: "homeSectionTitle", label: "Judul Seksi Utama Home", type: "text" },
                    { key: "homeSectionDesc", label: "Deskripsi Seksi Home", type: "textarea" },
                    { key: "homeCtaLabel", label: "Label Tombol CTA Home", type: "text" },
                    { key: "homeCtaLabel2", label: "Label Tombol CTA 2 Home", type: "text" },
                  ]}
                  imageGroups={[
                    { key: "hero", label: "Hero Slideshow", count: 4, desc: "Gambar slideshow utama di bagian atas Home." },
                    { key: "adv", label: "Banner Advertorial", count: 2, desc: "Gambar banner di tengah halaman Home." },
                    { key: "gal", label: "Galeri Home", count: 6, desc: "Grid galeri di bagian bawah Home." },
                  ]}
                />
              )}

              {/* SETTING LAYANAN KAMI */}
              {adminTab === "set_layanankami" && isAdmin && (
                <SubLayananAdmin
                  title="Setting Layanan Kami"
                  icon="🛠"
                  accentColor="#8B6914"
                  storeKey="layananKami"
                  data={data}
                  save={save}
                  notify={notify}
                  uploadToCloudinary={uploadToCloudinary}
                  pageDesc="Kelola teks & gambar halaman Layanan Kami — daftar layanan utama yang ditampilkan kepada pengunjung."
                  sections={[
                    { key: "layananKamiTitle", label: "Judul Halaman Layanan Kami", type: "text" },
                    { key: "layananKamiSub", label: "Sub-judul / Deskripsi Layanan Kami", type: "textarea" },
                    { key: "layananKamiCta", label: "Label Tombol CTA", type: "text" },
                  ]}
                  imageGroups={[
                    { key: "layananKamiHero", label: "Gambar Hero Layanan Kami", count: 2, desc: "Gambar banner di halaman Layanan Kami." },
                    { key: "layananKamiGal", label: "Gambar Galeri Layanan", count: 4, desc: "Gambar pendukung tampilan layanan." },
                  ]}
                  crudKey="layananKamiItems"
                  crudLabel="Daftar Item Layanan"
                  crudFields={[
                    { key: "nama", label: "Nama Layanan", type: "text", placeholder: "contoh: Jasa Bangun Rumah" },
                    { key: "deskripsi", label: "Deskripsi Layanan", type: "textarea", placeholder: "Deskripsi singkat layanan..." },
                    { key: "icon", label: "Icon / Emoji", type: "text", placeholder: "🏠" },
                  ]}
                  crudHasImage
                  defaultItems={LAYANAN_LIST.map((l, i) => ({
                    id: l.key || String(i + 1),
                    nama: l.label,
                    deskripsi: l.desc || "",
                    icon: l.icon || "",
                    _img: l.img || "",
                  }))}
                />
              )}

              {/* SETTING DESAIN & RAB */}
              {adminTab === "set_desainrab" && isAdmin && (
                <SubLayananAdmin
                  title="Setting Desain & RAB"
                  icon="📐"
                  accentColor="#2980b9"
                  storeKey="desainRab"
                  data={data}
                  save={save}
                  notify={notify}
                  uploadToCloudinary={uploadToCloudinary}
                  pageDesc="Kelola konten halaman Jasa Desain & RAB (Rencana Anggaran Biaya)."
                  sections={[
                    { key: "desainRabTitle", label: "Judul Halaman Desain & RAB", type: "text" },
                    { key: "desainRabSub", label: "Sub-judul / Tagline", type: "textarea" },
                    { key: "desainRabDesc", label: "Deskripsi Lengkap Layanan", type: "textarea" },
                    { key: "desainRabCta", label: "Label Tombol CTA", type: "text" },
                  ]}
                  imageGroups={[
                    { key: "desainRabHero", label: "Gambar Hero", count: 2, desc: "Foto utama halaman Desain & RAB." },
                    { key: "desainRabGal", label: "Galeri Portofolio Desain", count: 6, desc: "Foto hasil desain dan RAB." },
                  ]}
                  crudKey="desainRabItems"
                  crudLabel="Paket / Layanan RAB"
                  crudFields={[
                    { key: "nama", label: "Nama Paket", type: "text", placeholder: "contoh: Paket Desain Basic" },
                    { key: "harga", label: "Harga / Keterangan Harga", type: "text", placeholder: "Rp 2.500.000" },
                    { key: "deskripsi", label: "Deskripsi Paket", type: "textarea", placeholder: "Termasuk: ..." },
                  ]}
                  crudHasImage
                  defaultItems={DESAIN_RAB_PAKET.map((p, i) => ({
                    id: p.key || String(i + 1),
                    nama: p.label,
                    harga: `Rp ${p.harga}${p.satuan || ""}`,
                    deskripsi: [p.sub || "", ...(p.fitur || [])].filter(Boolean).join(" | "),
                    _img: "",
                  }))}
                />
              )}

              {/* SETTING TEMA RUMAH */}
              {adminTab === "set_temarumah" && isAdmin && (
                <SubLayananAdmin
                  title="Setting Tema Rumah"
                  icon="🏡"
                  accentColor="#27ae60"
                  storeKey="temaRumah"
                  data={data}
                  save={save}
                  notify={notify}
                  uploadToCloudinary={uploadToCloudinary}
                  pageDesc="Kelola konten halaman Tema Rumah — tambah, edit, atau hapus tema-tema rumah yang tersedia."
                  sections={[
                    { key: "temaRumahTitle", label: "Judul Halaman Tema Rumah", type: "text" },
                    { key: "temaRumahSub", label: "Sub-judul / Deskripsi", type: "textarea" },
                    { key: "temaRumahCta", label: "Label Tombol CTA", type: "text" },
                  ]}
                  imageGroups={[
                    { key: "temaRumahHero", label: "Gambar Hero Tema Rumah", count: 2, desc: "Foto banner halaman Tema Rumah." },
                  ]}
                  crudKey="temaRumahItems"
                  crudLabel="Daftar Tema Rumah"
                  crudFields={[
                    { key: "nama", label: "Nama Tema", type: "text", placeholder: "contoh: Modern Minimalis" },
                    { key: "tagline", label: "Tagline / Keterangan Singkat", type: "text", placeholder: "Elegan, bersih, fungsional" },
                    { key: "deskripsi", label: "Deskripsi Tema", type: "textarea", placeholder: "Detail karakteristik tema..." },
                    { key: "warna", label: "Warna Aksen (HEX)", type: "text", placeholder: "#2E3D3F" },
                  ]}
                  crudHasImage
                  defaultItems={TEMA_DATA}
                />
              )}

              {/* SETTING INTERIOR */}
              {adminTab === "set_interior" && isAdmin && (
                <SubLayananAdmin
                  title="Setting Interior"
                  icon="🛋"
                  accentColor="#8e44ad"
                  storeKey="interior"
                  data={data}
                  save={save}
                  notify={notify}
                  uploadToCloudinary={uploadToCloudinary}
                  pageDesc="Kelola konten halaman Interior — portofolio, layanan, dan galeri interior."
                  sections={[
                    { key: "interiorTitle", label: "Judul Halaman Interior", type: "text" },
                    { key: "interiorSub", label: "Sub-judul / Tagline", type: "textarea" },
                    { key: "interiorDesc", label: "Deskripsi Layanan Interior", type: "textarea" },
                    { key: "interiorCta", label: "Label Tombol CTA", type: "text" },
                  ]}
                  imageGroups={[
                    { key: "interiorHero", label: "Gambar Hero Interior", count: 2, desc: "Foto utama halaman Interior." },
                    { key: "interiorGal", label: "Galeri Portofolio Interior", count: 8, desc: "Foto hasil pekerjaan interior." },
                  ]}
                  crudKey="interiorItems"
                  crudLabel="Paket / Kategori Interior"
                  crudFields={[
                    { key: "nama", label: "Nama Paket / Kategori", type: "text", placeholder: "contoh: Interior Minimalis" },
                    { key: "harga", label: "Harga / Keterangan Harga", type: "text", placeholder: "Rp 500rb/m²" },
                    { key: "deskripsi", label: "Deskripsi", type: "textarea", placeholder: "Deskripsi kategori interior..." },
                  ]}
                  crudHasImage
                  defaultItems={[
                    ...Object.entries(CATALOG_DATA)
                      .filter(([k]) => k.startsWith("interior/"))
                      .flatMap(([k, v]) => v.items.map(item => ({
                        id: item.id,
                        nama: item.nama,
                        harga: item.harga ? `Rp ${item.harga.toLocaleString("id-ID")}` : (item.style || ""),
                        deskripsi: [item.desc, item.material ? `Material: ${item.material}` : "", item.fitur ? item.fitur.join(", ") : ""].filter(Boolean).join(" | "),
                        _img: item.img || "",
                      })))
                  ]}
                />
              )}

              {/* SETTING PAGAR RUMAH */}
              {adminTab === "set_pagar" && isAdmin && (
                <SubLayananAdmin
                  title="Setting Pagar Rumah"
                  icon="🚧"
                  accentColor="#c0392b"
                  storeKey="pagarRumah"
                  data={data}
                  save={save}
                  notify={notify}
                  uploadToCloudinary={uploadToCloudinary}
                  pageDesc="Kelola konten halaman Pagar Rumah — jenis, harga, dan galeri pagar."
                  sections={[
                    { key: "pagarTitle", label: "Judul Halaman Pagar Rumah", type: "text" },
                    { key: "pagarSub", label: "Sub-judul / Tagline", type: "textarea" },
                    { key: "pagarDesc", label: "Deskripsi Layanan Pagar", type: "textarea" },
                    { key: "pagarCta", label: "Label Tombol CTA", type: "text" },
                  ]}
                  imageGroups={[
                    { key: "pagarHero", label: "Gambar Hero Pagar", count: 2, desc: "Foto banner halaman Pagar Rumah." },
                    { key: "pagarGal", label: "Galeri Pagar", count: 6, desc: "Foto contoh pagar yang tersedia." },
                  ]}
                  crudKey="pagarItems"
                  crudLabel="Jenis / Model Pagar"
                  crudFields={[
                    { key: "nama", label: "Nama Model Pagar", type: "text", placeholder: "contoh: Pagar Hollow Minimalis" },
                    { key: "material", label: "Material", type: "text", placeholder: "contoh: Besi Hollow" },
                    { key: "harga", label: "Harga / Keterangan", type: "text", placeholder: "Rp 800rb/m" },
                    { key: "deskripsi", label: "Deskripsi", type: "textarea", placeholder: "Keunggulan dan detail..." },
                  ]}
                  crudHasImage
                  defaultItems={CATALOG_DATA["eksterior/pagar"].items.map(item => ({
                    id: item.id,
                    nama: item.nama,
                    material: item.material || "",
                    harga: item.harga ? `Rp ${item.harga.toLocaleString("id-ID")}/m` : "",
                    deskripsi: [item.desc, item.fitur ? item.fitur.join(", ") : ""].filter(Boolean).join(" | "),
                    _img: item.img || "",
                  }))}
                />
              )}

              {/* SETTING KANOPI */}
              {adminTab === "set_kanopi" && isAdmin && (
                <SubLayananAdmin
                  title="Setting Kanopi"
                  icon="⛺"
                  accentColor="#e67e22"
                  storeKey="kanopi"
                  data={data}
                  save={save}
                  notify={notify}
                  uploadToCloudinary={uploadToCloudinary}
                  pageDesc="Kelola konten halaman Kanopi — jenis, spesifikasi, dan galeri kanopi."
                  sections={[
                    { key: "kanopiTitle", label: "Judul Halaman Kanopi", type: "text" },
                    { key: "kanopiSub", label: "Sub-judul / Tagline", type: "textarea" },
                    { key: "kanopiDesc", label: "Deskripsi Layanan Kanopi", type: "textarea" },
                    { key: "kanopiCta", label: "Label Tombol CTA", type: "text" },
                  ]}
                  imageGroups={[
                    { key: "kanopiHero", label: "Gambar Hero Kanopi", count: 2, desc: "Foto banner halaman Kanopi." },
                    { key: "kanopiGal", label: "Galeri Kanopi", count: 6, desc: "Foto contoh kanopi." },
                  ]}
                  crudKey="kanopiItems"
                  crudLabel="Jenis / Model Kanopi"
                  crudFields={[
                    { key: "nama", label: "Nama Model Kanopi", type: "text", placeholder: "contoh: Kanopi Polycarbonate" },
                    { key: "material", label: "Material", type: "text", placeholder: "contoh: Baja Ringan + Polycarbonate" },
                    { key: "harga", label: "Harga / Keterangan", type: "text", placeholder: "Rp 250rb/m²" },
                    { key: "deskripsi", label: "Deskripsi", type: "textarea", placeholder: "Keunggulan dan detail..." },
                  ]}
                  crudHasImage
                  defaultItems={CATALOG_DATA["eksterior/kanopi"].items.map(item => ({
                    id: item.id,
                    nama: item.nama,
                    material: item.material || "",
                    harga: item.harga ? `Rp ${item.harga.toLocaleString("id-ID")}/m²` : "",
                    deskripsi: [item.desc, item.fitur ? item.fitur.join(", ") : ""].filter(Boolean).join(" | "),
                    _img: item.img || "",
                  }))}
                />
              )}

              {/* SETTING ALUMINIUM */}
              {adminTab === "set_aluminium" && isAdmin && (
                <SubLayananAdmin
                  title="Setting Aluminium"
                  icon="🪟"
                  accentColor="#7f8c8d"
                  storeKey="aluminium"
                  data={data}
                  save={save}
                  notify={notify}
                  uploadToCloudinary={uploadToCloudinary}
                  pageDesc="Kelola konten halaman Aluminium — kusen, pintu, jendela, dan partisi aluminium."
                  sections={[
                    { key: "aluminiumTitle", label: "Judul Halaman Aluminium", type: "text" },
                    { key: "aluminiumSub", label: "Sub-judul / Tagline", type: "textarea" },
                    { key: "aluminiumDesc", label: "Deskripsi Layanan Aluminium", type: "textarea" },
                    { key: "aluminiumCta", label: "Label Tombol CTA", type: "text" },
                  ]}
                  imageGroups={[
                    { key: "aluminiumHero", label: "Gambar Hero Aluminium", count: 2, desc: "Foto banner halaman Aluminium." },
                    { key: "aluminiumGal", label: "Galeri Aluminium", count: 6, desc: "Foto produk aluminium." },
                  ]}
                  crudKey="aluminiumItems"
                  crudLabel="Produk / Jenis Aluminium"
                  crudFields={[
                    { key: "nama", label: "Nama Produk", type: "text", placeholder: "contoh: Kusen Aluminium 4\" " },
                    { key: "spek", label: "Spesifikasi", type: "text", placeholder: "contoh: Tebal 4\", profil Australia" },
                    { key: "harga", label: "Harga / Keterangan", type: "text", placeholder: "Rp 350rb/m" },
                    { key: "deskripsi", label: "Deskripsi", type: "textarea", placeholder: "Keunggulan dan detail..." },
                  ]}
                  crudHasImage
                  defaultItems={CATALOG_DATA["eksterior/aluminium"].items.map(item => ({
                    id: item.id,
                    nama: item.nama,
                    spek: item.material || "",
                    harga: item.harga ? `Rp ${item.harga.toLocaleString("id-ID")}/m` : "",
                    deskripsi: [item.desc, item.fitur ? item.fitur.join(", ") : ""].filter(Boolean).join(" | "),
                    _img: item.img || "",
                  }))}
                />
              )}

              {/* SETTING LANDSCAPE & TAMAN */}
              {adminTab === "set_landscape" && isAdmin && (
                <SubLayananAdmin
                  title="Setting Landscape & Taman"
                  icon="🌿"
                  accentColor="#16a085"
                  storeKey="landscape"
                  data={data}
                  save={save}
                  notify={notify}
                  uploadToCloudinary={uploadToCloudinary}
                  pageDesc="Kelola konten halaman Landscape & Taman — desain taman, penataan landscape, dan portofolio."
                  sections={[
                    { key: "landscapeTitle", label: "Judul Halaman Landscape & Taman", type: "text" },
                    { key: "landscapeSub", label: "Sub-judul / Tagline", type: "textarea" },
                    { key: "landscapeDesc", label: "Deskripsi Layanan Landscape", type: "textarea" },
                    { key: "landscapeCta", label: "Label Tombol CTA", type: "text" },
                  ]}
                  imageGroups={[
                    { key: "landscapeHero", label: "Gambar Hero Landscape", count: 2, desc: "Foto banner halaman Landscape." },
                    { key: "landscapeGal", label: "Galeri Portofolio Taman", count: 8, desc: "Foto hasil penataan taman." },
                  ]}
                  crudKey="landscapeItems"
                  crudLabel="Layanan / Paket Landscape"
                  crudFields={[
                    { key: "nama", label: "Nama Layanan", type: "text", placeholder: "contoh: Taman Tropis Modern" },
                    { key: "harga", label: "Harga / Keterangan", type: "text", placeholder: "Mulai Rp 3.000.000" },
                    { key: "deskripsi", label: "Deskripsi", type: "textarea", placeholder: "Detail layanan landscape..." },
                  ]}
                  crudHasImage
                  defaultItems={CATALOG_DATA["eksterior/taman-landscape"].items.map(item => ({
                    id: item.id,
                    nama: item.nama,
                    harga: item.harga ? `Rp ${item.harga.toLocaleString("id-ID")}` : "",
                    deskripsi: [item.desc, item.fitur ? item.fitur.join(", ") : ""].filter(Boolean).join(" | "),
                    _img: item.img || "",
                  }))}
                />
              )}

              {/* SUSUNAN TIM */}
              {adminTab === "team" && isAdmin && (
                <TeamAdmin data={data} save={save} notify={notify} uploadToCloudinary={uploadToCloudinary} />
              )}

              {/* MESSAGES */}
              {adminTab === "messages" && canCS && (
                <div className="fade-in">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 500, color: "#2E3D3F" }}>Pesan Masuk</h1>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#5A6A6C" }}>Total: {data.messages.length} pesan</span>
                      {data.messages.filter(m => !m.read).length > 0 && (
                        <span style={{ fontSize: 11, background: "#e74c3c", color: "#fff", borderRadius: 10, padding: "3px 10px", fontWeight: 600 }}>
                          {data.messages.filter(m => !m.read).length} belum dibaca
                        </span>
                      )}
                      {data.messages.some(m => !m.read) && (
                        <button onClick={() => {
                          const msgs = data.messages.map(m => ({ ...m, read: true }));
                          save({ ...data, messages: msgs }); notify("Semua pesan ditandai sudah dibaca.");
                        }} style={{ fontSize: 11, padding: "5px 12px", background: "#FAF7F0", border: "1px solid #D4C4A0", borderRadius: 6, color: "#3D5254", cursor: "pointer" }}>
                          Tandai Semua Dibaca
                        </button>
                      )}
                    </div>
                  </div>

                  {data.messages.length === 0
                    ? <div style={{ textAlign: "center", padding: "60px", color: "#5A6A6C", background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>✉️</div>
                        <p style={{ fontSize: 14 }}>Belum ada pesan masuk.</p>
                      </div>
                    : [...data.messages].reverse().map(m => (
                      <div key={m.id} style={{ background: "#fff", borderRadius: 10, marginBottom: 16,
                        boxShadow: "0 2px 8px rgba(0,0,0,.06)", borderLeft: m.read ? "3px solid #E8DCC8" : "3px solid #e74c3c",
                        overflow: "hidden", opacity: m.deleted ? 0.5 : 1 }}>
                        {/* Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 20px 12px", borderBottom: "1px solid #FAF7F0" }}>
                          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 50%,#8B6914 100%)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16 }}>
                              {m.name?.charAt(0).toUpperCase() || "?"}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: "#2E3D3F", lineHeight: 1.3 }}>
                                {m.name}
                                {!m.read && <span style={{ marginLeft: 8, fontSize: 9, background: "#e74c3c", color: "#fff", borderRadius: 8, padding: "2px 7px", fontWeight: 700, letterSpacing: ".5px" }}>BARU</span>}
                              </div>
                              <div style={{ fontSize: 12, color: "#5A6A6C", marginTop: 2 }}>{m.email}</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                            <span style={{ fontSize: 11, color: "#A89070" }}>{m.date}</span>
                            {/* READ button */}
                            <button onClick={() => {
                              const msgs = data.messages.map(x => x.id === m.id ? { ...x, read: !x.read } : x);
                              save({ ...data, messages: msgs });
                            }} title={m.read ? "Tandai belum dibaca" : "Tandai sudah dibaca"}
                              style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, border: "1px solid #D4C4A0",
                                background: m.read ? "#FAF7F0" : "#e8f8ef", color: m.read ? "#5A6A6C" : "#27ae60", cursor: "pointer", fontWeight: 600 }}>
                              {m.read ? "✓ Dibaca" : "Tandai Dibaca"}
                            </button>
                            {/* REPLY button */}
                            <button onClick={() => setReplyTo(replyTo === m.id ? null : m.id)}
                              style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, border: "1px solid #A89070",
                                background: replyTo === m.id ? "#F5EDD8" : "none", color: "#C9AA71", cursor: "pointer", fontWeight: 600 }}>
                              ↩ Reply
                            </button>
                            {/* DELETE button */}
                            <button onClick={() => {
                              if (window.confirm(`Hapus pesan dari ${m.name}? Pesan tidak dapat dikembalikan.`)) {
                                const msgs = data.messages.filter(x => x.id !== m.id);
                                save({ ...data, messages: msgs }); notify("Pesan dihapus.");
                              }
                            }} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, border: "1px solid #f5c6c6",
                              background: "#fff", color: "#e74c3c", cursor: "pointer", fontWeight: 600 }}>
                              🗑 Hapus
                            </button>
                          </div>
                        </div>
                        {/* Body */}
                        <div style={{ padding: "14px 20px 16px" }}>
                          <p style={{ fontSize: 14, color: "#2E3D3F", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{m.message}</p>
                          {/* Reply history */}
                          {m.replies?.length > 0 && (
                            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase" }}>Riwayat Balasan</div>
                              {m.replies.map((r, i) => (
                                <div key={i} style={{ background: "#FAF7F0", borderRadius: 6, padding: "10px 14px", fontSize: 13, color: "#3a5066", borderLeft: "2px solid #C9AA71" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                    <strong style={{ color: "#C9AA71", fontSize: 12 }}>↩ {r.author}</strong>
                                    <span style={{ fontSize: 11, color: "#A89070" }}>{r.date}</span>
                                  </div>
                                  {r.text}
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Reply input */}
                          {replyTo === m.id && (
                            <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "flex-start" }}>
                              <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                                placeholder="Tulis balasan..."
                                rows={3}
                                style={{ flex: 1, padding: "10px 12px", border: "1.5px solid #C9AA71", borderRadius: 6, fontSize: 13, outline: "none", resize: "vertical" }} />
                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                <button onClick={() => replyMsg(m.id)}
                                  style={{ padding: "9px 18px", background: "#27ae60", color: "#fff", borderRadius: 6, fontSize: 12, border: "none", fontWeight: 600, cursor: "pointer" }}>Kirim</button>
                                <button onClick={() => { setReplyTo(null); setReplyText(""); }}
                                  style={{ padding: "9px 14px", background: "#FAF7F0", borderRadius: 6, fontSize: 12, border: "1px solid #D4C4A0", cursor: "pointer" }}>Batal</button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}

              {/* USERS */}
              {adminTab === "users" && isAdmin && (
                <div className="fade-in">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 500, color: "#2E3D3F" }}>User Management</h1>
                    <button onClick={() => setUserMgmtOpen(v => !v)}
                      style={{ padding: "9px 20px", background: userMgmtOpen ? "#FAF7F0" : "#2E3D3F", color: userMgmtOpen ? "#3D5254" : "#fff",
                        border: userMgmtOpen ? "1px solid #D4C4A0" : "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      {userMgmtOpen ? "✕ Batal" : "+ Tambah User"}
                    </button>
                  </div>

                  {/* Add User Form */}
                  {userMgmtOpen && (
                    <div style={{ background: "#fff", borderRadius: 10, padding: "24px 28px", marginBottom: 24, boxShadow: "0 2px 10px rgba(0,0,0,.07)", borderTop: "4px solid #27ae60" }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: "#2E3D3F", marginBottom: 18 }}>➕ Tambah Akun Baru</h3>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        {[
                          { label: "Nama Lengkap", key: "name", placeholder: "Nama lengkap", type: "text" },
                          { label: "Username", key: "username", placeholder: "username (tanpa spasi)", type: "text" },
                          { label: "Password", key: "password", placeholder: "Min. 6 karakter", type: "password" },
                        ].map(f => (
                          <div key={f.key}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 5 }}>{f.label}</label>
                            <input type={f.type} placeholder={f.placeholder} value={userMgmtForm[f.key]}
                              onChange={e => setUserMgmtForm(p => ({ ...p, [f.key]: e.target.value }))}
                              style={{ width: "100%", padding: "9px 11px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                          </div>
                        ))}
                        <div>
                          <label style={{ fontSize: 10, fontWeight: 700, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Role</label>
                          <select value={userMgmtForm.role} onChange={e => setUserMgmtForm(p => ({ ...p, role: e.target.value }))}
                            style={{ width: "100%", padding: "9px 11px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 13, outline: "none", background: "#fff" }}>
                            {Object.entries(ROLES).map(([k, v]) => (
                              <option key={k} value={k}>{v.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                        <button onClick={() => {
                          const { username, password, role, email, name } = userMgmtForm;
                          if (!username.trim() || !password.trim()) return notify("Username dan password wajib diisi.", "error");
                          if (password.length < 6) return notify("Password minimal 6 karakter.", "error");
                          if (data.users.find(u => u.username === username.trim())) return notify("Username sudah digunakan.", "error");
                          const newUser = { id: Date.now(), username: username.trim(), password, role, email, name: name || username, active: true };
                          save({ ...data, users: [...data.users, newUser] });
                          setUserMgmtForm({ username: "", password: "", role: "content_writer", email: "", name: "" });
                          setUserMgmtOpen(false);
                          notify(`User "${username}" berhasil ditambahkan.`);
                        }} style={{ padding: "10px 24px", background: "#27ae60", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                          Simpan User
                        </button>
                        <button onClick={() => { setUserMgmtOpen(false); setUserMgmtForm({ username: "", password: "", role: "content_writer", email: "", name: "" }); }}
                          style={{ padding: "10px 18px", background: "#FAF7F0", color: "#3D5254", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>
                          Batal
                        </button>
                      </div>
                    </div>
                  )}

                  {/* User Table */}
                  <div className="table-wrap" style={{ background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                      <thead>
                        <tr style={{ background: "#FAF7F0" }}>
                          {["#", "Nama / Username", "Role", "Email", "Status", "Aksi"].map(h => (
                            <th key={h} style={{ padding: "13px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", borderBottom: "1px solid #e8f2f8" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.users.map((u, idx) => (
                          <React.Fragment key={u.id}>
                            <tr style={{ borderBottom: editUserId === u.id ? "none" : "1px solid #F5EDD8", background: idx % 2 === 0 ? "#fff" : "#FDFAF4" }}>
                              <td style={{ padding: "13px 16px", fontSize: 12, color: "#A89070" }}>{idx + 1}</td>
                              <td style={{ padding: "13px 16px" }}>
                                <div style={{ fontWeight: 600, fontSize: 13, color: "#2E3D3F" }}>{u.name || u.username}</div>
                                <div style={{ fontSize: 11, color: "#5A6A6C", marginTop: 1 }}>@{u.username}</div>
                              </td>
                              <td style={{ padding: "13px 16px" }}>
                                {editRoleId === u.id ? (
                                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                    <select defaultValue={u.role}
                                      id={`role-select-${u.id}`}
                                      style={{ padding: "5px 8px", border: "1px solid #D4C4A0", borderRadius: 5, fontSize: 12, outline: "none" }}>
                                      {Object.entries(ROLES).map(([k, v]) => (
                                        <option key={k} value={k}>{v.label}</option>
                                      ))}
                                    </select>
                                    <button onClick={() => {
                                      const sel = document.getElementById(`role-select-${u.id}`)?.value;
                                      if (sel) {
                                        const users = data.users.map(x => x.id === u.id ? { ...x, role: sel } : x);
                                        save({ ...data, users }); notify("Role diperbarui.");
                                      }
                                      setEditRoleId(null);
                                    }} style={{ fontSize: 11, padding: "4px 10px", background: "#27ae60", color: "#fff", borderRadius: 5, border: "none", cursor: "pointer" }}>✓</button>
                                    <button onClick={() => setEditRoleId(null)} style={{ fontSize: 11, padding: "4px 8px", background: "#FAF7F0", borderRadius: 5, border: "1px solid #D4C4A0", cursor: "pointer" }}>✕</button>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, fontWeight: 500,
                                    background: u.role === "admin" ? "#fef0f0" : u.role === "content_writer" ? "#F5EDD8" : "#e8f8ef",
                                    color: ROLES[u.role]?.color }}>
                                    {ROLES[u.role]?.label}
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: "13px 16px", fontSize: 12, color: "#5A6A6C" }}>{u.email || "—"}</td>
                              <td style={{ padding: "13px 16px" }}>
                                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, fontWeight: 500,
                                  background: u.active ? "#e8f8ef" : "#fef0f0", color: u.active ? "#27ae60" : "#e74c3c" }}>
                                  {u.active ? "Aktif" : "Nonaktif"}
                                </span>
                              </td>
                              <td style={{ padding: "13px 16px" }}>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                  {/* Tombol Edit */}
                                  {u.username !== "administrator" && editUserId !== u.id && (
                                    <button onClick={() => {
                                      setEditUserId(u.id);
                                      setEditUserForm({ name: u.name || "", email: u.email || "", phone: u.phone || "", password: "" });
                                      setEditRoleId(null);
                                    }}
                                      style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, background: "#fff8e1", color: "#b7600a", border: "1px solid #f5d78e", cursor: "pointer", fontWeight: 600 }}>
                                      ✏ Edit
                                    </button>
                                  )}
                                  {/* Tutup Edit */}
                                  {editUserId === u.id && (
                                    <button onClick={() => setEditUserId(null)}
                                      style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, background: "#FAF7F0", color: "#8B6914", border: "1px solid #D4C4A0", cursor: "pointer", fontWeight: 600 }}>
                                      ✕ Tutup
                                    </button>
                                  )}
                                  {/* Ganti Role */}
                                  {u.username !== "administrator" && editRoleId !== u.id && editUserId !== u.id && (
                                    <button onClick={() => setEditRoleId(u.id)}
                                      style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, background: "#F5EDD8", color: "#C9AA71", border: "none", cursor: "pointer", fontWeight: 500 }}>
                                      Ganti Role
                                    </button>
                                  )}
                                  {/* Toggle Aktif */}
                                  {u.username !== "administrator" && editUserId !== u.id && (
                                    <button onClick={() => {
                                      const users = data.users.map(x => x.id === u.id ? { ...x, active: !x.active } : x);
                                      save({ ...data, users }); notify(`User ${u.active ? "dinonaktifkan" : "diaktifkan"}.`);
                                    }} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, border: "none", cursor: "pointer", fontWeight: 500,
                                      background: u.active ? "#fff3f3" : "#e8f8ef", color: u.active ? "#e74c3c" : "#27ae60" }}>
                                      {u.active ? "Nonaktifkan" : "Aktifkan"}
                                    </button>
                                  )}
                                  {/* Hapus */}
                                  {u.username !== "administrator" && editUserId !== u.id && (
                                    <button onClick={() => {
                                      if (window.confirm(`Hapus user "${u.username}"? Tindakan ini tidak dapat dibatalkan.`)) {
                                        const users = data.users.filter(x => x.id !== u.id);
                                        save({ ...data, users }); notify(`User "${u.username}" dihapus.`);
                                      }
                                    }} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, background: "#fff", border: "1px solid #f5c6c6", color: "#e74c3c", cursor: "pointer", fontWeight: 500 }}>
                                      🗑 Hapus
                                    </button>
                                  )}
                                  {u.username === "administrator" && (
                                    <span style={{ fontSize: 11, color: "#A89070", fontStyle: "italic" }}>Protected</span>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {/* ── INLINE EDIT ROW ── */}
                            {editUserId === u.id && (
                              <tr style={{ borderBottom: "1px solid #F5EDD8", background: "#fffbea" }}>
                                <td colSpan={6} style={{ padding: "0" }}>
                                  <div style={{ padding: "18px 20px", borderTop: "2px solid #f5d78e", borderBottom: "2px solid #f5d78e", background: "linear-gradient(135deg,#fffef5 0%,#fffbea 100%)" }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#b7600a", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 14 }}>
                                      ✏ Edit Data User — @{u.username}
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 14 }}>
                                      {/* Nama */}
                                      <div>
                                        <label style={{ fontSize: 10, fontWeight: 700, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Nama Lengkap</label>
                                        <input
                                          value={editUserForm.name}
                                          onChange={e => setEditUserForm(f => ({ ...f, name: e.target.value }))}
                                          placeholder="Nama lengkap"
                                          style={{ width: "100%", padding: "7px 10px", border: "1px solid #f5d78e", borderRadius: 6, fontSize: 12, outline: "none", background: "#fff", boxSizing: "border-box" }} />
                                      </div>
                                      {/* Email */}
                                      <div>
                                        <label style={{ fontSize: 10, fontWeight: 700, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Email</label>
                                        <input
                                          type="email"
                                          value={editUserForm.email}
                                          onChange={e => setEditUserForm(f => ({ ...f, email: e.target.value }))}
                                          placeholder="email@domain.com"
                                          style={{ width: "100%", padding: "7px 10px", border: "1px solid #f5d78e", borderRadius: 6, fontSize: 12, outline: "none", background: "#fff", boxSizing: "border-box" }} />
                                      </div>
                                      {/* No. HP */}
                                      <div>
                                        <label style={{ fontSize: 10, fontWeight: 700, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 4 }}>No. HP / WhatsApp</label>
                                        <input
                                          value={editUserForm.phone}
                                          onChange={e => setEditUserForm(f => ({ ...f, phone: e.target.value }))}
                                          placeholder="08xxxxxxxxxx"
                                          style={{ width: "100%", padding: "7px 10px", border: "1px solid #f5d78e", borderRadius: 6, fontSize: 12, outline: "none", background: "#fff", boxSizing: "border-box" }} />
                                      </div>
                                      {/* Password baru */}
                                      <div>
                                        <label style={{ fontSize: 10, fontWeight: 700, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Password Baru <span style={{ color: "#b0c4cc", fontWeight: 400 }}>(kosongkan jika tidak ganti)</span></label>
                                        <input
                                          type="password"
                                          value={editUserForm.password}
                                          onChange={e => setEditUserForm(f => ({ ...f, password: e.target.value }))}
                                          placeholder="••••••••"
                                          style={{ width: "100%", padding: "7px 10px", border: "1px solid #f5d78e", borderRadius: 6, fontSize: 12, outline: "none", background: "#fff", boxSizing: "border-box" }} />
                                      </div>
                                    </div>
                                    <div style={{ display: "flex", gap: 8 }}>
                                      <button onClick={() => {
                                        const updated = {
                                          ...u,
                                          name: editUserForm.name.trim() || u.name,
                                          email: editUserForm.email.trim() || u.email,
                                          phone: editUserForm.phone.trim() || u.phone,
                                          ...(editUserForm.password.trim() ? { password: editUserForm.password.trim() } : {}),
                                        };
                                        const users = data.users.map(x => x.id === u.id ? updated : x);
                                        save({ ...data, users });
                                        notify(`✅ Data user "@${u.username}" berhasil diperbarui.`);
                                        setEditUserId(null);
                                      }} style={{ padding: "7px 20px", background: "#b7600a", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                                        💾 Simpan Perubahan
                                      </button>
                                      <button onClick={() => setEditUserId(null)}
                                        style={{ padding: "7px 14px", background: "#FAF7F0", color: "#5A6A6C", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>
                                        Batal
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                    {data.users.length === 0 && (
                      <div style={{ padding: "32px", textAlign: "center", color: "#5A6A6C", fontSize: 13 }}>Belum ada user terdaftar.</div>
                    )}
                  </div>
                </div>
              )}

              {/* PROFIL AKUN */}
              {adminTab === "profil" && (() => {
                const saveProfileFn = async () => {
                  const { name, phone, email, desc, photo, oldPass, newPass, confirmPass } = profileEdit;
                  // Ganti password
                  if (oldPass || newPass || confirmPass) {
                    const stored = await fsGet(`profile-${user.username}`);
                    const currentPass = stored?._password || user.password;
                    if (oldPass !== currentPass) { notify("Password lama salah.", "error"); return; }
                    if (newPass.length < 6) { notify("Password baru minimal 6 karakter.", "error"); return; }
                    if (newPass !== confirmPass) { notify("Konfirmasi password tidak cocok.", "error"); return; }
                  }
                  const prev = await fsGet(`profile-${user.username}`) || {};
                  const patch = { ...prev, name: name || user.name, phone: phone || user.phone, email: email || user.email, desc: desc || user.desc, photo: photo || user.photo };
                  if (profileEdit.newPass) patch._password = profileEdit.newPass;
                  await fsSet(`profile-${user.username}`, patch);
                  setUser(u => ({ ...u, name: patch.name, phone: patch.phone, email: patch.email, desc: patch.desc, photo: patch.photo }));
                  setProfileEdit(p => ({ ...p, oldPass: "", newPass: "", confirmPass: "" }));
                  setProfileEditMode(false);
                  notify("Profil berhasil disimpan!");
                };

                const inp = (label, key, type = "text", placeholder = "") => (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5A6A6C", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{label}</label>
                    <input type={type} value={profileEdit[key] ?? ""} placeholder={placeholder || label}
                      onChange={e => setProfileEdit(p => ({ ...p, [key]: e.target.value }))}
                      style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E8DCC8", borderRadius: 8, fontSize: 14, outline: "none", background: "#fff", boxSizing: "border-box" }} />
                  </div>
                );

                return (
                  <div className="fade-in">
                    <h1 style={{ fontSize: 24, fontWeight: 500, color: "#2E3D3F", marginBottom: 28 }}>Profil Akun</h1>
                    <div className="profile-grid">
                      {/* Left: Foto & Info */}
                      <div style={{ background: "#fff", borderRadius: 12, padding: "28px 24px", boxShadow: "0 2px 10px rgba(0,0,0,.06)", textAlign: "center" }}>
                        <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
                          {(profileEdit.photo || user.photo) ? (
                            <img src={profileEdit.photo || user.photo} alt="Foto Profil"
                              style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover", border: "3px solid #C9AA71" }}
                              onError={e => { e.target.style.display = "none"; }} />
                          ) : (
                            <div style={{ width: 100, height: 100, borderRadius: "50%", background: "linear-gradient(135deg,#2E3D3F,#8B6914)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, color: "#fff", fontWeight: 700, margin: "0 auto" }}>
                              {(user.name || user.username || "?")[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: "#2E3D3F", marginBottom: 4 }}>{user.name || user.username}</div>
                        <div style={{ fontSize: 12, color: "#8B6914", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>{user.role}</div>
                        <div style={{ fontSize: 13, color: "#5A6A6C", marginBottom: 16 }}>{user.email || "-"}</div>
                        {!profileEditMode && (
                          <button onClick={() => {
                            setProfileEdit({ name: user.name || "", phone: user.phone || "", email: user.email || "", desc: user.desc || "", photo: user.photo || "", oldPass: "", newPass: "", confirmPass: "" });
                            setProfileEditMode(true);
                          }} style={{ padding: "9px 22px", background: "linear-gradient(130deg,#2E3D3F,#8B6914)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                            ✏ Edit Profil
                          </button>
                        )}
                      </div>

                      {/* Right: Form */}
                      <div style={{ background: "#fff", borderRadius: 12, padding: "28px 28px", boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}>
                        {!profileEditMode ? (
                          <div>
                            {[["Nama", user.name], ["Email", user.email], ["No. HP", user.phone], ["Deskripsi", user.desc]].map(([label, val]) => (
                              <div key={label} style={{ marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid #FAF7F0" }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "#5A6A6C", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>{label}</div>
                                <div style={{ fontSize: 14, color: "#2E3D3F" }}>{val || <span style={{ color: "#bbb" }}>—</span>}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
                              <div>{inp("Nama", "name")}</div>
                              <div>{inp("Email", "email", "email")}</div>
                              <div>{inp("No. HP", "phone", "tel")}</div>
                              <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5A6A6C", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>URL Foto Profil</label>
                                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                                  <input type="text" value={profileEdit.photo ?? ""} placeholder="https://..."
                                    onChange={e => setProfileEdit(p => ({ ...p, photo: e.target.value }))}
                                    style={{ flex: 1, padding: "10px 14px", border: "1.5px solid #E8DCC8", borderRadius: 8, fontSize: 13, outline: "none" }} />
                                  {profileEdit.photo && <button onClick={() => setProfileEdit(p => ({ ...p, photo: "" }))} style={{ padding: "0 10px", background: "#fee", color: "#e74c3c", border: "none", borderRadius: 6, cursor: "pointer" }}>✕</button>}
                                </div>
                              </div>
                            </div>
                            <div style={{ marginBottom: 16 }}>
                              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5A6A6C", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Deskripsi</label>
                              <textarea value={profileEdit.desc ?? ""} rows={3} placeholder="Deskripsi singkat..."
                                onChange={e => setProfileEdit(p => ({ ...p, desc: e.target.value }))}
                                style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E8DCC8", borderRadius: 8, fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                            </div>

                            {/* Ganti Password */}
                            <div style={{ marginTop: 4, marginBottom: 20, background: "#FAF7F0", borderRadius: 10, padding: "18px 20px" }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#2E3D3F", marginBottom: 14 }}>🔒 Ganti Password</div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 16px" }}>
                                {inp("Password Lama", "oldPass", "password", "••••••••")}
                                {inp("Password Baru", "newPass", "password", "Min. 6 karakter")}
                                {inp("Konfirmasi Baru", "confirmPass", "password", "Ulangi password")}
                              </div>
                              <div style={{ fontSize: 11, color: "#5A6A6C" }}>⚠ Kosongkan jika tidak ingin mengganti password.</div>
                            </div>

                            <div style={{ display: "flex", gap: 10 }}>
                              <button onClick={saveProfileFn}
                                style={{ padding: "10px 26px", background: "linear-gradient(130deg,#2E3D3F,#8B6914)", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                                💾 Simpan Perubahan
                              </button>
                              <button onClick={() => setProfileEditMode(false)}
                                style={{ padding: "10px 20px", background: "#F5EDD8", color: "#2E3D3F", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                                Batal
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* REVIEWS ADMIN */}
              {adminTab === "reviews" && isAdmin && <AdminReviews data={data} save={save} notify={notify} />}

              {/* SETTINGS */}
              {adminTab === "settings" && isAdmin && (
                <div className="fade-in">
                  <h1 style={{ fontSize: 24, fontWeight: 500, color: "#2E3D3F", marginBottom: 28 }}>Settings</h1>

                  {/* ═══════════════════════════════════════════════════════ */}
                  {/* SECTION: LOGO */}
                  {/* ═══════════════════════════════════════════════════════ */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

                    {/* ── Logo Navbar / Header ── */}
                    <div style={{ background: "#fff", borderRadius: 8, padding: "22px 24px", boxShadow: "0 2px 8px rgba(0,0,0,.06)", borderTop: "4px solid #C9AA71" }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#2E3D3F", marginBottom: 4 }}>🔝 Logo Navbar / Header</h3>
                      <p style={{ fontSize: 12, color: "#5A6A6C", marginBottom: 14, lineHeight: 1.6 }}>
                        Tampil di navigasi atas dan admin panel. PNG transparan, rasio 3:1 atau 4:1 direkomendasikan.
                      </p>
                      {data.content.logoImage ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center", marginBottom: 12 }}>
                          <img src={data.content.logoImage} alt="Logo Navbar"
                            style={{ height: 56, maxWidth: 180, objectFit: "contain", border: "1px solid #F5EDD8", borderRadius: 6, padding: 8, background: "#FAF7F0" }} />
                          <button onClick={() => { save({ ...data, content: { ...data.content, logoImage: "" } }); notify("Logo navbar dihapus."); }}
                            style={{ fontSize: 11, padding: "4px 12px", background: "#fee", color: "#e74c3c", borderRadius: 6, border: "none", cursor: "pointer" }}>Hapus Logo</button>
                        </div>
                      ) : (
                        <div style={{ height: 56, background: "#FAF7F0", borderRadius: 6, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#5A6A6C", border: "1px dashed #D4C4A0" }}>Belum ada logo navbar</div>
                      )}
                      <UploadButton label="📁 Upload Logo Navbar"
                        onDone={urls => {
                          save({ ...data, content: { ...data.content, logoImage: urls[0] } });
                          notify("✅ Logo navbar berhasil diupload!");
                        }}
                        onError={() => notify("Gagal upload logo navbar.", "error")} />
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginTop: 10, marginBottom: 4 }}>Atau URL</label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input placeholder="https://..." defaultValue={data.content.logoImage}
                          id="logo-navbar-url-input"
                          style={{ flex: 1, padding: "8px 10px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 12, outline: "none" }} />
                        <button onClick={() => {
                          const url = document.getElementById("logo-navbar-url-input")?.value?.trim();
                          if (!url) return notify("Masukkan URL logo navbar.", "error");
                          save({ ...data, content: { ...data.content, logoImage: url } });
                          notify("✅ Logo navbar URL disimpan!");
                        }} style={{ padding: "8px 14px", background: "#C9AA71", color: "#fff", borderRadius: 6, fontSize: 12, border: "none", cursor: "pointer", fontWeight: 600 }}>Apply</button>
                      </div>
                    </div>

                    {/* ── Logo Footer ── */}
                    <div style={{ background: "#fff", borderRadius: 8, padding: "22px 24px", boxShadow: "0 2px 8px rgba(0,0,0,.06)", borderTop: "4px solid #3D5254" }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#2E3D3F", marginBottom: 4 }}>🔻 Logo Footer</h3>
                      <p style={{ fontSize: 12, color: "#5A6A6C", marginBottom: 14, lineHeight: 1.6 }}>
                        Tampil di bagian bawah halaman (section Kontak). Jika kosong, akan menggunakan Logo Navbar sebagai fallback.
                      </p>
                      {data.content.footerLogoImage ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center", marginBottom: 12 }}>
                          <img src={data.content.footerLogoImage} alt="Logo Footer"
                            style={{ height: 56, maxWidth: 180, objectFit: "contain", border: "1px solid #F5EDD8", borderRadius: 6, padding: 8, background: "#FAF7F0" }} />
                          <button onClick={() => { save({ ...data, content: { ...data.content, footerLogoImage: "" } }); notify("Logo footer dihapus."); }}
                            style={{ fontSize: 11, padding: "4px 12px", background: "#fee", color: "#e74c3c", borderRadius: 6, border: "none", cursor: "pointer" }}>Hapus Logo</button>
                        </div>
                      ) : (
                        <div style={{ height: 56, background: "#FAF7F0", borderRadius: 6, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#5A6A6C", border: "1px dashed #D4C4A0" }}>Belum ada logo footer (pakai logo navbar)</div>
                      )}
                      <UploadButton label="📁 Upload Logo Footer"
                        onDone={urls => {
                          save({ ...data, content: { ...data.content, footerLogoImage: urls[0] } });
                          notify("✅ Logo footer berhasil diupload!");
                        }}
                        onError={() => notify("Gagal upload logo footer.", "error")} />
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginTop: 10, marginBottom: 4 }}>Atau URL</label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input placeholder="https://..." defaultValue={data.content.footerLogoImage}
                          id="logo-footer-url-input"
                          style={{ flex: 1, padding: "8px 10px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 12, outline: "none" }} />
                        <button onClick={() => {
                          const url = document.getElementById("logo-footer-url-input")?.value?.trim();
                          if (!url) return notify("Masukkan URL logo footer.", "error");
                          save({ ...data, content: { ...data.content, footerLogoImage: url } });
                          notify("✅ Logo footer URL disimpan!");
                        }} style={{ padding: "8px 14px", background: "#3D5254", color: "#fff", borderRadius: 6, fontSize: 12, border: "none", cursor: "pointer", fontWeight: 600 }}>Apply</button>
                      </div>
                    </div>

                  </div>

                  {/* ═══════════════════════════════════════════════════════ */}
                  {/* SECTION: GAMBAR HALAMAN HOME */}
                  {/* ═══════════════════════════════════════════════════════ */}
                  <div style={{ background: "#fff", borderRadius: 8, padding: "22px 24px", marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,.06)", borderTop: "4px solid #3498db" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#2E3D3F", marginBottom: 4 }}>🏠 Gambar Halaman Home</h3>
                    <p style={{ fontSize: 12, color: "#5A6A6C", marginBottom: 20, lineHeight: 1.6 }}>
                      Atur semua gambar yang tampil di halaman utama website — Hero Slideshow, Banner Advertorial, dan Galeri.
                    </p>

                    {/* Hero Images */}
                    <div style={{ marginBottom: 24 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: "#2E3D3F", marginBottom: 4 }}>🖼 Hero Slideshow (4 Gambar)</h4>
                      <p style={{ fontSize: 11, color: "#5A6A6C", marginBottom: 12, lineHeight: 1.6 }}>Gambar utama di bagian paling atas halaman. Tampil bergantian saat mode slideshow aktif.</p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
                        {(data.images?.hero || ["","","",""]).map((img, idx) => (
                          <div key={idx} style={{ background: "#FAF7F0", borderRadius: 8, padding: 12, border: "1px solid #E8DCC8" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#5A6A6C", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Hero {idx + 1}</div>
                            {img ? (
                              <img src={img} alt={`Hero ${idx+1}`} style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 6, marginBottom: 8, border: "1px solid #D4C4A0" }}
                                onError={e => e.target.style.display = "none"} />
                            ) : (
                              <div style={{ width: "100%", height: 110, background: "#E8DCC8", borderRadius: 6, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#5A6A6C", fontSize: 11 }}>Belum ada gambar</div>
                            )}
                            <UploadButton label="📁 Upload"
                              style={{ fontSize: 11, padding: "6px 10px", marginBottom: 6, width: "100%", justifyContent: "center" }}
                              onDone={urls => {
                                const newHero = [...(data.images?.hero || ["","","",""])];
                                newHero[idx] = urls[0];
                                save({ ...data, images: { ...data.images, hero: newHero } });
                                notify(`✅ Hero ${idx+1} diperbarui!`);
                              }}
                              onError={() => notify("Gagal upload.", "error")} />
                            <div style={{ display: "flex", gap: 6 }}>
                              <input id={`hero-img-${idx}`} defaultValue={img} placeholder="atau URL..."
                                style={{ flex: 1, padding: "6px 8px", border: "1px solid #D4C4A0", borderRadius: 5, fontSize: 11, outline: "none" }} />
                              <button onClick={() => {
                                const url = document.getElementById(`hero-img-${idx}`)?.value?.trim();
                                if (!url) return notify("Masukkan URL.", "error");
                                const newHero = [...(data.images?.hero || ["","","",""])];
                                newHero[idx] = url;
                                save({ ...data, images: { ...data.images, hero: newHero } });
                                notify(`✅ Hero ${idx+1} disimpan!`);
                              }} style={{ padding: "6px 10px", background: "#3498db", color: "#fff", borderRadius: 5, fontSize: 11, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>OK</button>
                            </div>
                            {img && (
                              <button onClick={() => {
                                const newHero = [...(data.images?.hero || ["","","",""])];
                                newHero[idx] = "";
                                save({ ...data, images: { ...data.images, hero: newHero } });
                                notify(`Hero ${idx+1} dihapus.`);
                              }} style={{ marginTop: 6, width: "100%", padding: "5px", background: "none", color: "#e74c3c", border: "1px solid #e74c3c", borderRadius: 5, fontSize: 10, cursor: "pointer" }}>🗑 Hapus</button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Adv/Banner Images */}
                    <div style={{ marginBottom: 24, paddingTop: 20, borderTop: "1px solid #F0E8D5" }}>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: "#2E3D3F", marginBottom: 4 }}>🎯 Gambar Banner Advertorial (2 Gambar)</h4>
                      <p style={{ fontSize: 11, color: "#5A6A6C", marginBottom: 12, lineHeight: 1.6 }}>Gambar di bagian banner/advertorial di tengah halaman Home.</p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
                        {(data.images?.adv || ["",""]).map((img, idx) => (
                          <div key={idx} style={{ background: "#FAF7F0", borderRadius: 8, padding: 12, border: "1px solid #E8DCC8" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#5A6A6C", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Banner {idx + 1}</div>
                            {img ? (
                              <img src={img} alt={`Adv ${idx+1}`} style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 6, marginBottom: 8, border: "1px solid #D4C4A0" }}
                                onError={e => e.target.style.display = "none"} />
                            ) : (
                              <div style={{ width: "100%", height: 110, background: "#E8DCC8", borderRadius: 6, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#5A6A6C", fontSize: 11 }}>Belum ada gambar</div>
                            )}
                            <UploadButton label="📁 Upload"
                              style={{ fontSize: 11, padding: "6px 10px", marginBottom: 6, width: "100%", justifyContent: "center" }}
                              onDone={urls => {
                                const newAdv = [...(data.images?.adv || ["",""])];
                                newAdv[idx] = urls[0];
                                save({ ...data, images: { ...data.images, adv: newAdv } });
                                notify(`✅ Banner ${idx+1} diperbarui!`);
                              }}
                              onError={() => notify("Gagal upload.", "error")} />
                            <div style={{ display: "flex", gap: 6 }}>
                              <input id={`adv-img-${idx}`} defaultValue={img} placeholder="atau URL..."
                                style={{ flex: 1, padding: "6px 8px", border: "1px solid #D4C4A0", borderRadius: 5, fontSize: 11, outline: "none" }} />
                              <button onClick={() => {
                                const url = document.getElementById(`adv-img-${idx}`)?.value?.trim();
                                if (!url) return notify("Masukkan URL.", "error");
                                const newAdv = [...(data.images?.adv || ["",""])];
                                newAdv[idx] = url;
                                save({ ...data, images: { ...data.images, adv: newAdv } });
                                notify(`✅ Banner ${idx+1} disimpan!`);
                              }} style={{ padding: "6px 10px", background: "#3498db", color: "#fff", borderRadius: 5, fontSize: 11, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>OK</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Gallery Images */}
                    <div style={{ paddingTop: 20, borderTop: "1px solid #F0E8D5" }}>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: "#2E3D3F", marginBottom: 4 }}>🖼 Galeri Home (6 Gambar)</h4>
                      <p style={{ fontSize: 11, color: "#5A6A6C", marginBottom: 12, lineHeight: 1.6 }}>Gambar grid galeri di bagian bawah halaman Home.</p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                        {(data.images?.gal || ["","","","","",""]).map((img, idx) => (
                          <div key={idx} style={{ background: "#FAF7F0", borderRadius: 8, padding: 10, border: "1px solid #E8DCC8" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#5A6A6C", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Galeri {idx + 1}</div>
                            {img ? (
                              <img src={img} alt={`Gal ${idx+1}`} style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 5, marginBottom: 6, border: "1px solid #D4C4A0" }}
                                onError={e => e.target.style.display = "none"} />
                            ) : (
                              <div style={{ width: "100%", height: 90, background: "#E8DCC8", borderRadius: 5, marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#5A6A6C", fontSize: 11 }}>Kosong</div>
                            )}
                            <UploadButton label="📁 Upload"
                              style={{ fontSize: 10, padding: "5px 8px", marginBottom: 5, width: "100%", justifyContent: "center" }}
                              onDone={urls => {
                                const newGal = [...(data.images?.gal || ["","","","","",""])];
                                newGal[idx] = urls[0];
                                save({ ...data, images: { ...data.images, gal: newGal } });
                                notify(`✅ Galeri ${idx+1} diperbarui!`);
                              }}
                              onError={() => notify("Gagal upload.", "error")} />
                            <div style={{ display: "flex", gap: 5 }}>
                              <input id={`gal-img-${idx}`} defaultValue={img} placeholder="URL..."
                                style={{ flex: 1, padding: "5px 7px", border: "1px solid #D4C4A0", borderRadius: 5, fontSize: 10, outline: "none" }} />
                              <button onClick={() => {
                                const url = document.getElementById(`gal-img-${idx}`)?.value?.trim();
                                if (!url) return notify("Masukkan URL.", "error");
                                const newGal = [...(data.images?.gal || ["","","","","",""])];
                                newGal[idx] = url;
                                save({ ...data, images: { ...data.images, gal: newGal } });
                                notify(`✅ Galeri ${idx+1} disimpan!`);
                              }} style={{ padding: "5px 9px", background: "#3498db", color: "#fff", borderRadius: 5, fontSize: 10, border: "none", cursor: "pointer" }}>OK</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ═══════════════════════════════════════════════════════ */}
                  {/* SECTION: KONTEN TEKS HALAMAN HOME */}
                  {/* ═══════════════════════════════════════════════════════ */}
                  <div style={{ background: "#fff", borderRadius: 8, padding: "22px 24px", marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,.06)", borderTop: "4px solid #27ae60" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#2E3D3F", marginBottom: 4 }}>✏️ Konten Teks Halaman Home</h3>
                    <p style={{ fontSize: 12, color: "#5A6A6C", marginBottom: 20, lineHeight: 1.6 }}>
                      Edit semua teks yang tampil di halaman utama — judul hero, subtitle, teks banner, section konsultasi, dan lainnya.
                    </p>
                    {[
                      { label: "Hero — Judul Utama", key: "heroTitle", placeholder: "Developer Perumahan & Jasa Desain", multiline: false },
                      { label: "Hero — Subtitle / Deskripsi", key: "heroSub", placeholder: "Kami hadir sebagai mitra terpercaya...", multiline: true },
                      { label: "Banner Adv — Judul", key: "advTitle", placeholder: "Wujudkan Hunian Impian Anda", multiline: false },
                      { label: "Banner Adv — Sub Label", key: "advSub", placeholder: "DEVELOPER & JASA PERUMAHAN", multiline: false },
                      { label: "Banner Adv — Quote", key: "advQuote", placeholder: '"Kutipan inspiratif..."', multiline: true },
                      { label: "Section Proyek Baru — Judul", key: "newAdvTitle", placeholder: "Proyek Terbaru Kami", multiline: false },
                      { label: "Section Proyek Baru — Sub", key: "newAdvSub", placeholder: "Temukan portofolio terkini...", multiline: true },
                      { label: "Section Konsultasi — Judul", key: "bookTitle", placeholder: "Konsultasikan Proyek Anda", multiline: false },
                      { label: "Section Konsultasi — Sub", key: "bookSub", placeholder: "Tim ahli kami siap membantu...", multiline: true },
                      { label: "Newsletter — Judul", key: "newsletterTitle", placeholder: "Dapatkan Update Proyek & Promo Terbaru", multiline: false },
                    ].map(field => {
                      const fieldId = `home-content-${field.key}`;
                      return (
                        <div key={field.key} style={{ marginBottom: 18 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: "#5A6A6C", letterSpacing: "0.8px", textTransform: "uppercase", display: "block", marginBottom: 6 }}>{field.label}</label>
                          {field.multiline ? (
                            <textarea id={fieldId} defaultValue={data.content[field.key] || ""} placeholder={field.placeholder} rows={3}
                              style={{ width: "100%", padding: "9px 12px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }} />
                          ) : (
                            <input id={fieldId} defaultValue={data.content[field.key] || ""} placeholder={field.placeholder}
                              style={{ width: "100%", padding: "9px 12px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                          )}
                          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                            <button onClick={() => {
                              const val = document.getElementById(fieldId)?.value?.trim();
                              if (!val) return notify(`Isi dulu field ${field.label}.`, "error");
                              save({ ...data, content: { ...data.content, [field.key]: val } });
                              notify(`✅ ${field.label} disimpan!`);
                            }} style={{ padding: "7px 18px", background: "#27ae60", color: "#fff", borderRadius: 6, fontSize: 12, border: "none", fontWeight: 600, cursor: "pointer" }}>Simpan</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ═══════════════════════════════════════════════════════ */}
                  {/* SECTION: KONTEN ABOUT & CONTACT */}
                  {/* ═══════════════════════════════════════════════════════ */}
                  <div style={{ background: "#fff", borderRadius: 8, padding: "22px 24px", marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,.06)", borderTop: "4px solid #e67e22" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#2E3D3F", marginBottom: 4 }}>📋 Konten Halaman About & Kontak</h3>
                    <p style={{ fontSize: 12, color: "#5A6A6C", marginBottom: 20, lineHeight: 1.6 }}>
                      Edit teks halaman About Us, informasi kontak, jam operasional, dan link media sosial.
                    </p>
                    {[
                      { label: "About — Teks Deskripsi Perusahaan", key: "aboutText", multiline: true },
                      { label: "About — Hero Label", key: "aboutHeroLabel", multiline: false },
                      { label: "About — Hero Judul", key: "aboutHeroTitle", multiline: false },
                      { label: "About — Hero Sub", key: "aboutHeroSub", multiline: true },
                      { label: "About — Judul 'Why Us'", key: "aboutWhyTitle", multiline: false },
                      { label: "Kontak — Teks", key: "contactText", multiline: true },
                      { label: "Kontak — Email", key: "email", multiline: false },
                      { label: "Kontak — Telepon / WA", key: "phone", multiline: false },
                      { label: "Kontak — Alamat", key: "address", multiline: true },
                      { label: "Kontak — Jam Operasional", key: "hours", multiline: false },
                      { label: "Link WhatsApp Utama", key: "waLink", multiline: false },
                      { label: "Link Instagram", key: "igLink", multiline: false },
                      { label: "Link Facebook", key: "fbLink", multiline: false },
                    ].map(field => {
                      const fieldId = `about-content-${field.key}`;
                      return (
                        <div key={field.key} style={{ marginBottom: 16 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: "#5A6A6C", letterSpacing: "0.8px", textTransform: "uppercase", display: "block", marginBottom: 6 }}>{field.label}</label>
                          {field.multiline ? (
                            <textarea id={fieldId} defaultValue={data.content[field.key] || ""} rows={3}
                              style={{ width: "100%", padding: "9px 12px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }} />
                          ) : (
                            <input id={fieldId} defaultValue={data.content[field.key] || ""}
                              style={{ width: "100%", padding: "9px 12px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                          )}
                          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                            <button onClick={() => {
                              const val = document.getElementById(fieldId)?.value?.trim();
                              save({ ...data, content: { ...data.content, [field.key]: val } });
                              notify(`✅ ${field.label} disimpan!`);
                            }} style={{ padding: "7px 18px", background: "#e67e22", color: "#fff", borderRadius: 6, fontSize: 12, border: "none", fontWeight: 600, cursor: "pointer" }}>Simpan</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ═══════════════════════════════════════════════════════ */}
                  {/* SECTION: TEMPLATE WHATSAPP */}
                  {/* ═══════════════════════════════════════════════════════ */}
                  <div style={{ background: "#fff", borderRadius: 8, padding: "22px 24px", marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,.06)", borderTop: "4px solid #25d366" }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#2E3D3F", marginBottom: 4 }}>💬 Template Pesan WhatsApp</h3>
                    <p style={{ fontSize: 12, color: "#5A6A6C", marginBottom: 6, lineHeight: 1.6 }}>
                      Atur teks template yang akan muncul otomatis saat pengunjung klik tombol WhatsApp.
                      Gunakan <code style={{ background: "#f0fdf4", padding: "1px 5px", borderRadius: 4, color: "#16a34a", fontSize: 11 }}>{"{judul_paket}"}</code> atau <code style={{ background: "#f0fdf4", padding: "1px 5px", borderRadius: 4, color: "#16a34a", fontSize: 11 }}>{"{judul_layanan}"}</code> sebagai variabel dinamis yang otomatis terisi nama paket/layanan.
                    </p>
                    <p style={{ fontSize: 11, color: "#888", marginBottom: 18 }}>Gunakan <strong>*teks*</strong> untuk cetak tebal di WhatsApp. Baris baru dengan Enter.</p>

                    {[
                      { key: "umum",       icon: "🏠", label: "Template Umum",          hint: "Dipakai saat klik tombol WA tanpa konteks spesifik" },
                      { key: "paket",      icon: "📦", label: "Template Paket",          hint: 'Variabel: {judul_paket} → otomatis terisi nama paket yang diklik' },
                      { key: "konsultasi", icon: "🤝", label: "Template Konsultasi",     hint: "Dipakai tombol Hubungi Kami / Konsultasi" },
                      { key: "desainrab",  icon: "📐", label: "Template Desain & RAB",   hint: 'Variabel: {judul_paket} → otomatis terisi nama paket desain' },
                      { key: "layanan",    icon: "⚙️",  label: "Template Layanan",        hint: 'Variabel: {judul_layanan} → otomatis terisi nama layanan yang diklik' },
                    ].map(({ key, icon, label, hint }) => {
                      const tpl = data.content.waTemplates || {};
                      const val = tpl[key] || "";
                      return (
                        <div key={key} style={{ marginBottom: 20 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 16 }}>{icon}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#2E3D3F" }}>{label}</span>
                          </div>
                          <p style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>{hint}</p>
                          <textarea
                            rows={5}
                            id={`wa-tpl-${key}`}
                            defaultValue={val}
                            style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #D4C4A0", borderRadius: 8, fontSize: 12, fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.7 }}
                            onFocus={e => e.target.style.borderColor = "#25d366"}
                            onBlur={e => e.target.style.borderColor = "#D4C4A0"}
                          />
                          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                            <button onClick={() => {
                              const newVal = document.getElementById(`wa-tpl-${key}`)?.value ?? "";
                              save({ ...data, content: { ...data.content, waTemplates: { ...(data.content.waTemplates || {}), [key]: newVal } } });
                              notify(`✅ Template "${label}" disimpan!`);
                            }} style={{ padding: "6px 16px", background: "#25d366", color: "#fff", borderRadius: 6, fontSize: 12, border: "none", cursor: "pointer", fontWeight: 600 }}>
                              💾 Simpan
                            </button>
                            <button onClick={() => {
                              // Preview: buka WA picker dengan template ini
                              const newVal = document.getElementById(`wa-tpl-${key}`)?.value ?? "";
                              const preview = newVal
                                .replace(/{judul_paket}/g, "Contoh Nama Paket")
                                .replace(/{judul_layanan}/g, "Contoh Layanan")
                                .replace(/{harga}/g, "Rp 5.000.000");
                              window.open("https://wa.me/?text=" + encodeURIComponent(preview), "_blank");
                            }} style={{ padding: "6px 16px", background: "#f0fdf4", color: "#16a34a", borderRadius: 6, fontSize: 12, border: "1.5px solid #25d366", cursor: "pointer", fontWeight: 600 }}>
                              👁 Preview
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <button onClick={() => {
                      // Simpan semua template sekaligus
                      const keys = ["umum", "paket", "konsultasi", "desainrab", "layanan"];
                      const newTpl = {};
                      keys.forEach(k => { newTpl[k] = document.getElementById(`wa-tpl-${k}`)?.value ?? ""; });
                      save({ ...data, content: { ...data.content, waTemplates: newTpl } });
                      notify("✅ Semua template WhatsApp berhasil disimpan!");
                    }} style={{ width: "100%", padding: "12px 0", background: "#2E3D3F", color: "#fff", borderRadius: 8, fontSize: 13, border: "none", cursor: "pointer", fontWeight: 700, marginTop: 8 }}>
                      💾 Simpan Semua Template
                    </button>
                  </div>

                  {/* Founding Year */}
                  <div style={{ background: "#fff", borderRadius: 8, padding: "22px 24px", marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,.06)", borderTop: "4px solid #C9AA71" }}>
                    <h3 style={{ fontSize: 15, fontWeight: 500, color: "#2E3D3F", marginBottom: 6 }}>🗓 Tahun Berdiri Perusahaan</h3>
                    <p style={{ fontSize: 12, color: "#5A6A6C", marginBottom: 16, lineHeight: 1.6 }}>
                      Tahun ini digunakan untuk teks "sejak [tahun]", statistik "X Tahun Pengalaman", dan label dekorasi halaman.
                    </p>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <input
                        id="founding-year-input"
                        defaultValue={data.content.foundingYear || "2026"}
                        placeholder="cth: 2026"
                        maxLength={4}
                        style={{ width: 120, padding: "8px 12px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 14, outline: "none" }}
                      />
                      <button onClick={() => {
                        const yr = document.getElementById("founding-year-input")?.value?.trim();
                        if (!yr || !/^\d{4}$/.test(yr)) return notify("Masukkan tahun 4 digit (misal: 2026).", "error");
                        save({ ...data, content: { ...data.content, foundingYear: yr } });
                        notify(`✅ Tahun berdiri diperbarui ke ${yr}`);
                      }} style={{ padding: "8px 16px", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", color: "#fff", borderRadius: 6, fontSize: 12, border: "none", fontWeight: 500 }}>
                        Simpan
                      </button>
                      <span style={{ fontSize: 12, color: "#5A6A6C" }}>Saat ini: <strong style={{ color: "#2E3D3F" }}>{data.content.foundingYear || "2026"}</strong> · Pengalaman: <strong style={{ color: "#8B6914" }}>{new Date().getFullYear() - parseInt(data.content.foundingYear || "2026")} tahun</strong></span>
                    </div>
                  </div>

                  {/* Hero Display Mode */}
                  <div style={{ background: "#fff", borderRadius: 8, padding: "22px 24px", marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,.06)", borderTop: "4px solid #8e44ad" }}>
                    <h3 style={{ fontSize: 15, fontWeight: 500, color: "#2E3D3F", marginBottom: 6 }}>🖥 Mode Tampilan Hero Beranda</h3>
                    <p style={{ fontSize: 12, color: "#5A6A6C", marginBottom: 20, lineHeight: 1.6 }}>
                      Pilih apakah bagian hero di halaman utama ditampilkan sebagai <strong>slideshow otomatis</strong> (berganti-ganti gambar dari artikel) atau <strong>gambar statis diam</strong> dari satu URL yang ditentukan.
                    </p>
                    {/* Toggle Pill */}
                    <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                      {[
                        { val: "slideshow", icon: "▶", label: "Slideshow Otomatis", desc: "Gambar berganti dari artikel published" },
                        { val: "static",    icon: "🖼", label: "Gambar Statis",     desc: "Satu gambar diam yang bisa diatur" },
                      ].map(opt => {
                        const active = (data.content.heroMode || "slideshow") === opt.val;
                        return (
                          <div key={opt.val} onClick={() => { save({ ...data, content: { ...data.content, heroMode: opt.val } }); notify(`✅ Mode hero diubah ke: ${opt.label}`); }}
                            style={{ flex: 1, minWidth: 200, padding: "16px 20px", borderRadius: 10, cursor: "pointer",
                              border: active ? "2px solid #8e44ad" : "2px solid #F5EDD8",
                              background: active ? "#f5eeff" : "#FDFAF4",
                              transition: "all .18s" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                              <span style={{ fontSize: 22 }}>{opt.icon}</span>
                              <span style={{ fontWeight: 700, fontSize: 14, color: active ? "#8e44ad" : "#2E3D3F" }}>{opt.label}</span>
                              {active && <span style={{ marginLeft: "auto", fontSize: 10, background: "#8e44ad", color: "#fff", borderRadius: 8, padding: "2px 8px", fontWeight: 700 }}>AKTIF</span>}
                            </div>
                            <div style={{ fontSize: 12, color: "#5A6A6C", lineHeight: 1.5 }}>{opt.desc}</div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Static image setting — hanya tampil kalau mode static */}
                    {(data.content.heroMode || "slideshow") === "static" && (
                      <div style={{ background: "#f5eeff", borderRadius: 8, padding: "16px 18px", border: "1px solid #d8b4fe" }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 8 }}>URL Gambar Statis Hero</label>
                        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                          <input id="hero-static-url" defaultValue={data.content.heroStaticImage || ""}
                            placeholder="https://..."
                            style={{ flex: 1, padding: "9px 12px", border: "1px solid #d8b4fe", borderRadius: 6, fontSize: 13, outline: "none", background: "#fff" }} />
                          <button onClick={() => {
                            const url = document.getElementById("hero-static-url")?.value?.trim();
                            if (!url) return notify("Masukkan URL gambar.", "error");
                            save({ ...data, content: { ...data.content, heroStaticImage: url } });
                            notify("✅ Gambar statis hero disimpan!");
                          }} style={{ padding: "9px 16px", background: "#8e44ad", color: "#fff", borderRadius: 6, fontSize: 12, border: "none", fontWeight: 600, whiteSpace: "nowrap" }}>
                            Simpan
                          </button>
                        </div>
                        {/* Upload file */}
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Atau Upload Gambar</label>
                        <UploadButton label="📁 Pilih Gambar Hero"
                          style={{ border: "1.5px dashed #8e44ad", color: "#8e44ad", background: "#fff" }}
                          onDone={urls => {
                            save({ ...data, content: { ...data.content, heroStaticImage: urls[0] } });
                            notify("✅ Gambar hero statis diupload!");
                          }}
                          onError={() => notify("Gagal upload. Coba lagi.", "error")} />
                        {/* Preview */}
                        {data.content.heroStaticImage && (
                          <img src={data.content.heroStaticImage} alt="Hero Preview"
                            style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 8, border: "1px solid #d8b4fe" }}
                            onError={e => e.target.style.display = "none"} />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="settings-grid">
                    {[
                      { title: "Firebase Config", desc: "Connect to Firestore for real-time data sync", btn: "Configure", color: "#f39c12" },
                      { title: "Cloudinary Config", desc: "Set up image hosting and transformation pipeline", btn: "Configure", color: "#C9AA71" },
                      { title: "Vercel Deploy", desc: "Deploy updates to production via Vercel CI/CD", btn: "Deploy", color: "#2E3D3F" },
                      { title: "SEO Settings", desc: "Manage meta tags, sitemap, and schema markup", btn: "Edit SEO", color: "#27ae60" },
                      { title: "Analytics", desc: "View traffic, user behavior and conversion data", btn: "View", color: "#8e44ad" },
                      {
                        title: "Export Data", desc: "Export site data as JSON backup", btn: "Export JSON", color: "#e74c3c",
                        action: () => {
                          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                          const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
                          a.download = "bricksy-data.json"; a.click(); notify("Data exported!");
                        }
                      },
                    ].map(s => (
                      <div key={s.title} style={{ background: "#fff", borderRadius: 8, padding: "20px 24px", boxShadow: "0 2px 8px rgba(0,0,0,.06)", borderTop: `4px solid ${s.color}` }}>
                        <h3 style={{ fontSize: 15, fontWeight: 500, color: "#2E3D3F", marginBottom: 8 }}>{s.title}</h3>
                        <p style={{ fontSize: 12, color: "#5A6A6C", lineHeight: 1.6, marginBottom: 16 }}>{s.desc}</p>
                        <button onClick={s.action || (() => notify(`${s.title} — Configure in your deployment environment.`, "success"))}
                          style={{ padding: "8px 18px", background: s.color, color: "#fff", borderRadius: 6, fontSize: 12, border: "none" }}>{s.btn}</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "#fff3cd", borderRadius: 8, padding: "16px 20px", marginTop: 20, border: "1px solid #ffc107" }}>
                    <h4 style={{ fontSize: 13, color: "#856404", marginBottom: 6 }}>⚠ Reset Site Data</h4>
                    <p style={{ fontSize: 12, color: "#856404", marginBottom: 12 }}>This will reset all content, images, and posts to defaults.</p>
                    <button onClick={async () => {
                      if (window.confirm("Reset all data to defaults?")) {
                        await save(DEFAULT_DATA);
                        setEditContent({});
                        notify("Data reset to defaults.");
                      }
                    }} style={{ padding: "8px 18px", background: "#e74c3c", color: "#fff", borderRadius: 6, fontSize: 12, border: "none" }}>
                      Reset to Defaults
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
