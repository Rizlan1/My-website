# Nocturne Barbers — Fitzroy, Melbourne

A 3D, scroll-animated landing page for a late-night Melbourne barbershop.

- **3D hero**: real-time Three.js scene (glass barber pole with an animated shader stripe, chrome and brass caps, a straight razor that opens as you scroll, snipping scissors, ember particles, bloom)
- **Haircut menu**: pinned horizontal gallery of 6 signature cuts plus extras, with AUD prices
- **Before / After**: three draggable comparison sliders (mouse, touch, keyboard)
- **The Kit**: barber tools and products, researched and explained
- **Visit**: hours, address and booking CTA

Static site, no build step: `index.html`, `styles.css`, `main.js`, `scene.js`, `assets/img/`.
Libraries load from CDNs (Three.js 0.160, GSAP 3.12.5 + ScrollTrigger, Lenis 1.1.13).

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000

## Deploy (Vercel, free tier)

1. Push this repo to GitHub.
2. Go to https://vercel.com/new, sign in with GitHub, import the repo.
3. Framework preset: **Other**. No build command, output directory `.`
4. Deploy. Every push to `main` redeploys automatically.

## Before going live

- Replace the placeholder booking email `hello@example.com`, the phone number and the "Ember Lane" address with real details.
- All photography is AI-generated (Canva). Swap in real client before/afters when you have them.
