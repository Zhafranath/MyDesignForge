# StickerForge ✨

> AI Redbubble Prompt Generator — untuk seller print-on-demand Indonesia

Generate konsep original + 9 prompt desain siap pakai untuk **Sticker**, **Phone Case**, dan **Desain Baju**. Prompt sudah disesuaikan untuk Midjourney, DALL·E, Stable Diffusion, Kling, dan Runway.

## Yang baru di versi optimized

- Pilihan target produk Redbubble: sticker, phone case, atau desain baju.
- Prompt builder lebih aman untuk jualan: menghindari brand, logo, karakter terkenal, public figure likeness, fan art, watermark, mockup, dan QR code.
- Output AI lebih variatif: hewan lucu, object-creature, stickman, kartun, karakter original, pose, prop, mini-story, pattern, dan quote singkat.
- Random idea engine tidak lagi terasa seperti daftar template statis.
- Export `.txt` berisi product fit, tags, prompt, dan checklist upload.
- Build lebih tahan offline karena tidak bergantung pada fetch Google Fonts saat build.

## 🚀 Quick Start (< 5 menit)

```bash
npm install
cp .env.example .env.local
# Edit .env.local, isi GROQ_API_KEY dari Groq Console
npm run dev
# Buka http://localhost:3000
```

## 🔑 Setup GROQ_API_KEY

```bash
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx
GROQ_MODEL=llama-3.3-70b-versatile
```

## Alur pakai

1. Tulis ide karakter/desain: contoh `axolotl pink gamer, hoodie oversized, deadpan, kawaii vector, outline tebal`.
2. Pilih target produk: `Sticker`, `Phone Case`, atau `Desain Baju`.
3. Pilih AI image tool: Midjourney, DALL·E, Stable Diffusion, Kling, atau Runway.
4. Generate, lalu copy prompt satuan atau export semua ke `.txt`.

## 🧪 Validasi

```bash
npm run type-check
npm run test
npm run build
```

Jika file binary di `node_modules/.bin` tidak executable setelah unzip dari Windows, jalankan `npm install` ulang.

## 🎨 Target produk

| Produk | Fokus prompt |
|--------|--------------|
| Sticker | 1:1, transparent PNG, die-cut outline, thick white border, no stray pixels |
| Phone Case | 9:16 vertical artwork, full-bleed/pattern, safe margin, no phone mockup |
| Desain Baju | 4:5 centered chest graphic, transparent background, no shirt mockup |

## 🔒 Security & seller safety

- API key Groq tidak pernah terekspos ke client; request AI lewat API Route.
- Rate limiting sederhana: 10 request/menit per IP.
- Input validation server-side: min 5, max 700 karakter.
- Prompt sistem menghindari IP berisiko: brand, logo, karakter terkenal, public figure likeness, dan fan art mashup.

## 📝 License

MIT
