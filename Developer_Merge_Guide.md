# Developer Merge & Deployment Guide
**Project:** IOCA NGO Website  
**Date:** June 2026

This document outlines the recent UI/UX and performance optimizations pushed to the `main` branch of the IOCA repository, and provides a safe merge and deployment checklist for the backend developer (`sultan101004`).

---

## 1. Git Merge Status: Perfectly Safe (Fast-Forward)

**Great News:** All recent UI/UX enhancements were built directly on top of your latest backend commits (specifically `14c2af0` which resolved event validations and Vercel routing). 

* **No Merge Conflicts:** Because your `main` branch is a direct ancestor of the updated `main` branch, running a `git pull` will result in a perfectly clean **Fast-Forward Merge**.
* **API Safety:** We strictly modified `frontend/src/` components and CSS. None of the server-side API logic, routing, or Axios calls were altered or overwritten.

---

## 2. Deployment Checklist & Potential Hiccups

While Git will merge cleanly, deployment servers (like Vercel or Netlify) and your local environment may experience caching issues due to structural asset changes. Please review the following checklist:

### A. The `node_modules` Cache Issue
We recently forced a re-installation of `vite` and updated the `package-lock.json` to resolve a module chunk missing error during frontend compilation.
* **Local Fix:** Before running the dev server, ensure you run `npm install --force` or `npm ci` inside the `frontend` directory.
* **Deployment Fix:** If deploying to Vercel, trigger a deployment with the **"Redeploy with cleared cache"** option to prevent the server from using old, cached Vite dependencies.

### B. Ghost Image Files (Case-Sensitivity)
We heavily optimized the repository size and loading speeds by replacing uncompressed `.png` hero images and the redundant `English Hero Section` folders with highly optimized `.webp` files.
* **Local Fix:** Delete your local `frontend/public/assets/hero-slider/` folder entirely before executing your `git pull`. This prevents your local OS from keeping the old folders as "ghost files" and avoids case-sensitivity routing bugs. The new, optimized webp files will automatically download in their place.

### C. TrustBar Marquee CSS Variables
We removed heavy JavaScript-based framer-motion animations from the Trust Section and replaced them with a lightweight native CSS marquee.
* **Local Fix:** This relies on a newly injected `--animate-marquee` variable in `index.css`. If the Trust Section isn't scrolling smoothly on your end, simply restart your Vite development server (`Ctrl + C` then `npm run dev`) so it compiles the new global CSS rules.

---

**Summary Command to pull latest changes safely:**
```bash
git checkout main
git pull https://github.com/mashood-yar/IOCA-International-Organization-For-Community-Advancement-Website.git main
npm ci --prefix frontend
```
You are now good to deploy!
