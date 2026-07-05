// /api/delete-cloudinary.js
// Serverless Function (Vercel) — hapus foto di Cloudinary secara PERMANEN.
// Sengaja ditaruh di /api (bukan di kode React) karena proses hapus butuh
// CLOUDINARY_API_SECRET, yang TIDAK BOLEH pernah dikirim ke browser.
//
// Env var yang harus di-set di Vercel Dashboard (Project → Settings → Environment Variables),
// JANGAN pakai prefix VITE_ untuk 3 variabel ini (supaya tidak ikut ke-bundle ke client):
//   CLOUDINARY_CLOUD_NAME
//   CLOUDINARY_API_KEY
//   CLOUDINARY_API_SECRET

import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url, public_id: publicIdFromClient } = req.body || {};

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({ error: "Cloudinary server env vars belum di-set di Vercel." });
  }

  // Public ID bisa dikirim langsung dari client (lebih aman/akurat),
  // atau kita coba tebak dari URL Cloudinary-nya sebagai fallback.
  let publicId = publicIdFromClient || extractPublicId(url, cloudName);

  if (!publicId) {
    return res.status(400).json({ error: "Public ID tidak ditemukan / bukan URL Cloudinary yang valid." });
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    // Signature Cloudinary: sha1("public_id=...&timestamp=..." + API_SECRET)
    const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

    const form = new URLSearchParams();
    form.append("public_id", publicId);
    form.append("timestamp", String(timestamp));
    form.append("api_key", apiKey);
    form.append("signature", signature);

    const cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form }
    );
    const data = await cloudRes.json();

    // Cloudinary balikin { result: "ok" } kalau sukses, atau { result: "not found" }
    // kalau public_id tidak ada (mis. sudah kehapus sebelumnya) — dua-duanya kita anggap "beres".
    if (data.result === "ok" || data.result === "not found") {
      return res.status(200).json({ success: true, result: data.result, public_id: publicId });
    }
    return res.status(400).json({ error: "Cloudinary menolak hapus.", detail: data });
  } catch (err) {
    return res.status(500).json({ error: "Gagal menghubungi Cloudinary.", detail: String(err) });
  }
}

// Ekstrak public_id dari URL Cloudinary standar, contoh:
//   https://res.cloudinary.com/<cloud>/image/upload/v1234567890/folder/nama-file.jpg
//   → public_id = "folder/nama-file"
// Kalau URL bukan dari Cloudinary cloud yang sama, return null (biar tidak salah hapus punya orang lain).
function extractPublicId(url, cloudName) {
  if (!url || typeof url !== "string") return null;
  const marker = `res.cloudinary.com/${cloudName}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;

  const afterCloud = url.slice(idx + marker.length); // e.g. "image/upload/v169.../folder/file.jpg"
  const uploadIdx = afterCloud.indexOf("/upload/");
  if (uploadIdx === -1) return null;

  let rest = afterCloud.slice(uploadIdx + "/upload/".length); // "v169.../folder/file.jpg" atau langsung "folder/file.jpg"

  // Buang segmen transformasi (kalau ada, jarang dipakai di sini) & versi "v1234567890"
  const segments = rest.split("/");
  if (segments[0] && /^v\d+$/.test(segments[0])) segments.shift();
  rest = segments.join("/");

  // Buang extension file (.jpg, .png, .webp, dst) — public_id tidak menyertakan extension
  rest = rest.replace(/\.[a-zA-Z0-9]+$/, "");

  return rest || null;
}
