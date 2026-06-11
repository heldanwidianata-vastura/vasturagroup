# Real Estate Web

Website properti premium dibangun dengan **React + Vite + Firebase**.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Buka [http://localhost:5173](http://localhost:5173)

## 📦 Build Production

```bash
npm run build
npm run preview
```

## ☁️ Deploy ke Vercel

### Cara 1 — Via GitHub (Autodeploy)

1. Push repo ke GitHub
2. Buka [vercel.com](https://vercel.com) → **Add New Project**
3. Import repo GitHub kamu
4. Framework preset: **Vite** (auto-detected)
5. Klik **Deploy** — selesai ✅
6. Setiap `git push` ke `main` → Vercel rebuild otomatis

### Cara 2 — Via Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

## 🔧 Konfigurasi Firebase

Edit variabel Firebase di `src/RealEstateWeb.jsx` bagian `FIREBASE_CONFIG`:

```js
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## 📁 Struktur Folder

```
realestate-web/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx          ← Entry React
│   ├── App.jsx           ← Root component
│   ├── index.css         ← Global reset
│   └── RealEstateWeb.jsx ← Main SPA (12k+ lines)
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
└── .gitignore
```

## 🛠️ Tech Stack

| Tech | Versi |
|------|-------|
| React | 18.x |
| Vite  | 5.x  |
| Firebase | 10.x |
| Hosting | Vercel |

---

Built by [Mahfud Febry Styanto](https://wa.me/6282234651413) · mahfudfebrys@gmail.com
