# coLoc Game (Web)

A collaborative web app for playing the **coLoc** board game—teaching co-localization analysis in microscopy. Game Master runs sessions; teams join with a code, get assigned experiments, and plan acquisition and analysis cards. Review phase uses issue and details cards with a dice roll for experimental details.

## Requirements

- **Node.js** 18 or newer (includes npm)
- If you don't have Node: install from [nodejs.org](https://nodejs.org/) (LTS) or with `brew install node` on macOS.

## Running locally

1. **Install dependencies** (first time only):
   ```bash
   npm install
   ```

2. **Start the dev server**:
   ```bash
   npm run dev
   ```

3. **Open in a browser**  
   Use the URL printed in the terminal (e.g. `http://localhost:5173`).

No build step or backend is required for local play. All assets (logo, card images, experiment images) live inside the project under `public/`.

## Local play with remote participants (same network)

1. **Start the backend** (from project root):
   ```bash
   cd server
   npm install
   npm start
   ```
   Server runs on port 3001. Leave this terminal open.

2. **Create `.env`** in the project root:
   ```
   VITE_SOCKET_URL=http://YOUR_LOCAL_IP:3001
   ```
   Replace `YOUR_LOCAL_IP` with your machine's IP (e.g. `192.168.1.5`).

3. **Start the frontend** (new terminal, from project root):
   ```bash
   npm run dev
   ```

4. **Share the URL**  
   Other players on the same network open `http://YOUR_LOCAL_IP:5173`, choose Team, enter the session code, and join.

## Deploying for remote play (GitHub Pages + Node host)

To let anyone on the internet play together, deploy the **frontend** to GitHub Pages and the **backend** to a Node host.

---

### Part 1: Deploy the backend to a Node host

The backend must run on a service that supports Node.js. Two straightforward options:

#### Option A: Railway

1. Create an account at [railway.app](https://railway.app).

2. Click **New Project** → **Deploy from GitHub repo** (or upload the `server/` folder).

3. If using GitHub: select the repo, then set the **root directory** to `server` (or only deploy the `server/` folder).

4. Railway auto-detects Node. Ensure the start command is:
   ```bash
   node index.js
   ```
   (or `npm start` if your `package.json` has it).

5. Click **Deploy**. When it finishes, open **Settings** → **Networking** → **Generate Domain**. Copy the URL (e.g. `https://coloc-game-production-xxxx.up.railway.app`).

6. **Save this URL** — you'll use it as `VITE_SOCKET_URL` when building the frontend.

#### Option B: Render

1. Create an account at [render.com](https://render.com).

2. Click **New** → **Web Service**.

3. Connect your GitHub repo (or upload the project). Set the **root directory** to `server`.

4. Configure:
   - **Build command:** `npm install`
   - **Start command:** `npm start` or `node index.js`

5. Click **Create Web Service**. Render will build and deploy.

6. Once deployed, copy the service URL (e.g. `https://coloc-game.onrender.com`).

7. **Save this URL** — you'll use it as `VITE_SOCKET_URL` when building the frontend.

---

### Part 2: Deploy the frontend to GitHub Pages

1. **Push the project to GitHub**  
   Create a repo and push the `coloc-game` project (or the folder containing it).

2. **Set the base path in Vite**  
   If the app will be at `https://username.github.io/coloc-game/` (repo name as subpath), add `base` to `vite.config.ts`:
   ```ts
   export default defineConfig({
     base: '/coloc-game/',   // Replace with your repo name
     plugins: [react()],
     // ...
   });
   ```
   If the repo is `username.github.io` (user/organization site), use `base: '/'`.

3. **Build the frontend with the backend URL**  
   Replace `https://your-backend-url.example.com` with the URL from Part 1:
   ```bash
   VITE_SOCKET_URL=https://your-backend-url.example.com npm run build
   ```
   This creates the `dist/` folder with the production app.

4. **Deploy `dist/` to GitHub Pages**

   **Method A: Using `gh-pages` (recommended)**

   ```bash
   npm install --save-dev gh-pages
   ```

   Add to `package.json` (adjust the `deploy` script and `homepage`):
   ```json
   "scripts": {
     "deploy": "gh-pages -d dist"
   },
   "homepage": "https://YOUR_USERNAME.github.io/coloc-game"
   ```
   Replace `YOUR_USERNAME` and `coloc-game` with your GitHub username and repo name.

   Build and deploy (run the build with your backend URL, then deploy):
   ```bash
   VITE_SOCKET_URL=https://your-backend-url.example.com npm run build
   npm run deploy
   ```
   The first time, `gh-pages` will prompt for your GitHub credentials. It pushes the contents of `dist/` to the `gh-pages` branch.

   **Method B: Using GitHub Actions**

   Create `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [main]

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4

         - uses: actions/setup-node@v4
           with:
             node-version: '20'
             cache: 'npm'

         - run: npm ci
         - run: npm run build
           env:
             VITE_SOCKET_URL: ${{ secrets.VITE_SOCKET_URL }}

         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

   In your repo, go to **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. Add `VITE_SOCKET_URL` with your backend URL.

   Push to `main`; the workflow will build and deploy automatically.

5. **Enable GitHub Pages**  
   In the repo: **Settings** → **Pages** → **Source**: select **Deploy from a branch** → **gh-pages** branch → **/ (root)** → Save.

6. **Share the URL**  
   After a few minutes, the app is live at `https://YOUR_USERNAME.github.io/coloc-game/` (or your custom domain). Share this URL with players.

---

### Summary

| Step | Action |
|------|--------|
| 1 | Deploy backend to Railway or Render; copy the live URL |
| 2 | Set `base` in `vite.config.ts` to match your GitHub Pages path |
| 3 | Build with `VITE_SOCKET_URL` set to the backend URL |
| 4 | Deploy `dist/` to GitHub Pages (`gh-pages` or Actions) |
| 5 | Share the GitHub Pages URL with players |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (hot reload) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |

**Backend** (from `server/`): `npm start` (listens on port 3001). Use `npm run kill-port` to free port 3001 if needed, or `npm run dev:fresh` to kill and restart.

## Stack

- React 18 + Vite + TypeScript
- Zustand (state; syncs with server when `VITE_SOCKET_URL` is set)
- Socket.io (client + server for remote play)
- TailwindCSS

## Reference

- Physical game & resources: [biop.github.io/coLoc](https://biop.github.io/coLoc/)
- GitHub: [github.com/BIOP/coLoc](https://github.com/BIOP/coLoc)
