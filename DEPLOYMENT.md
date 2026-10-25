# 🚀 Knightfall 3D Chess Studio - Deployment Guide

Knightfall can be deployed for **free** in under 2 minutes. Because the app includes both a Python FastAPI backend and a 100% self-contained offline PWA engine, you can choose how to host it:

---

## Option 1: Vercel (Instant Free 1-Click PWA) — Recommended ⚡

Since Knightfall includes a full offline client engine (`chess.min.js`, `offline-ai.js`, `chess3d.js`), it runs completely standalone on Vercel's global CDN:

1. Push your code to a **GitHub** repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Knightfall 3D Chess Studio"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/knightfall-chess.git
   git push -u origin main
   ```
2. Go to **[vercel.com](https://vercel.com)** and log in with GitHub.
3. Click **"Add New Project"** and select your `knightfall-chess` repository.
4. Leave root directory as default and click **Deploy**.
5. Your chess studio is live with a custom HTTPS URL (e.g. `https://knightfall-chess.vercel.app`)!

---

## Option 2: Render.com (Free Full-Stack Python + Stockfish Server) 🐍

To deploy the full Python FastAPI server with optional Stockfish engine:

1. Push your repository to **GitHub**.
2. Go to **[render.com](https://render.com)** and click **"New +"** -> **"Web Service"**.
3. Connect your repository.
4. Set the following settings:
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** `Free`
5. Click **Create Web Service**.
6. Render will automatically build and deploy your app with a free `.onrender.com` URL.

---

## Option 3: Netlify (Free Static Hosting) 🌐

1. Go to **[netlify.com](https://netlify.com)** and log in.
2. Drag and drop the `static` folder directly onto the Netlify dashboard, or connect your GitHub repository (the included `netlify.toml` configures everything automatically).
3. Live in 10 seconds!

---

## Option 4: Docker (Self-Hosted / VPS / Railway / Fly.io) 🐳

Using the included production `Dockerfile`:

```bash
# Build the Docker image
docker build -t knightfall-chess .

# Run the container on port 8000
docker run -p 8000:8000 knightfall-chess
```

Access at `http://localhost:8000`.

---

## PWA Installation on Mobile & Desktop 📱

Once your URL is live:
- **On Chrome / Edge / Brave (Desktop):** Click the **Install** button in the header or the address bar icon to install as a native desktop app.
- **On iOS (Safari):** Tap **Share** -> **"Add to Home Screen"**.
- **On Android (Chrome):** Tap the prompt or menu -> **"Add to Home screen"**.
- Works **100% offline** on airplanes, trains, or without internet access!
