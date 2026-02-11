# coLoc Game (Web)

A collaborative web app for playing the **coLoc** board game—teaching co-localization analysis in microscopy. Game Master runs sessions; teams join with a code, get assigned experiments, and plan acquisition and analysis cards. Review phase uses issue and details cards with a dice roll for experimental details.

## Requirements

- **Node.js** 18 or newer (includes npm)
- If you don’t have Node: install from [nodejs.org](https://nodejs.org/) (LTS) or with `brew install node` on macOS.

## Running the app (on your machine or after someone sends you the project)

1. **Open the project folder**  
   Use the `coloc-game` folder (the one that contains `package.json` and `src/`).

2. **Install dependencies** (first time only):
   ```bash
   npm install
   ```

3. **Start the dev server**:
   ```bash
   npm run dev
   ```

4. **Open in a browser**  
   Use the URL printed in the terminal (e.g. `http://localhost:5173`).

No build step or backend is required for local play. All assets (logo, card images, experiment images) live inside the project under `public/`.

## How to run the backend and play remotely

To have the **Game Master** on one device and **teams** on other devices (e.g. different computers or phones), everyone must use the same game server. Follow these steps.

### Step 1: Start the backend server

In a terminal, from the **project root**:

```bash
cd server
npm install
npm start
```

You should see: `coloc-game server on http://localhost:3001`. Leave this terminal open; the server must keep running while you play.

- Default port is **3001**. To use another port: `PORT=3002 npm start` (from inside `server/`).

### Step 2: Point the frontend at the server

In the **project root** (the folder that contains `src/` and `package.json`), create a file named `.env` with:

```
VITE_SOCKET_URL=http://localhost:3001
```

- If you changed the server port in Step 1, use that port in the URL.
- For **remote** play (server and players on different machines), use the server’s real URL instead of `localhost` (e.g. `https://your-server.railway.app`). See [Deploying so others can join remotely](#deploying-so-others-can-join-remotely) for hosting the server.

### Step 3: Start the frontend

In a **new** terminal, from the **project root**:

```bash
npm install
npm run dev
```

Open the URL shown (e.g. `http://localhost:5173`) in your browser. In the app header you should see **Online** (green) when the frontend is connected to the backend.

### Step 4: Play remotely

1. **Game Master:** On the device running the app, choose **Game Master**, create a session (set times and click Create). Share the **session code** (e.g. `ABC123`) with the teams.
2. **Teams:** On **other** devices (or other browsers), open the **same** app URL (everyone must use a frontend that has `VITE_SOCKET_URL` set to the **same** server). Choose **Team**, enter the session code and team details, then click Join.
3. State (phases, experiments, cards, etc.) stays in sync for everyone. GM advances phases; teams see updates and pick cards in real time.

**Summary:** Backend running → `.env` with `VITE_SOCKET_URL` → frontend running → GM creates session and shares code → teams join from other devices with that code.

## Sending the project to someone else

- **Option A – Full folder (easiest)**  
  Zip or copy the entire `coloc-game` folder **including** the `public/` folder (logo and card/experiment images).  
  Tell them to run `npm install` then `npm run dev` (see above).  
  They can omit the `node_modules/` folder when sending; the other person will run `npm install` themselves.

- **Option B – Without node_modules**  
  Zip the project **without** the `node_modules/` folder (and without `dist/` if it exists).  
  The recipient must have Node.js installed and run:
  ```bash
  npm install
  npm run dev
  ```

Everything needed to run the app is inside this repo: no external file paths or servers. The `public/` folder must be included so the coLoc logo and all card/experiment images load.

## Scripts

| Command         | Description                |
|----------------|----------------------------|
| `npm run dev`  | Start dev server (hot reload) |
| `npm run build`| Production build to `dist/` |
| `npm run preview` | Preview production build |

**Backend (remote play):** From the `server/` folder: `npm install` then `npm start` (listens on port 3001). Set `VITE_SOCKET_URL` in the frontend to the server URL so the app syncs state across devices.

## Stack

- React 18 + Vite + TypeScript
- Zustand (state; syncs with server when `VITE_SOCKET_URL` is set)
- Socket.io (client + server for remote play)
- TailwindCSS

Game state is in-memory by default; multiple browser tabs share state only on the same machine. For multi-device play, use the [backend and remote-play steps](#how-to-run-the-backend-and-play-remotely) above.

## Deploying so others can join remotely

You can put the app on the internet so everyone uses the same URL. There are two parts: **hosting the app** and **sharing game state across devices**.

### 1. Host the app online (same URL for everyone)

Build the app and deploy the output to a free static host. Then you can share one link (e.g. `https://your-app.vercel.app`) with all participants.

**Build once:**
```bash
npm run build
```
This creates a `dist/` folder with the production app.

**Deploy to a host** (pick one):

| Host | Best for | How |
|------|----------|-----|
| **Vercel** | Easiest, great with GitHub | Sign up at [vercel.com](https://vercel.com), import your GitHub repo, deploy. Or install Vercel CLI and run `npx vercel` in the project folder. |
| **Netlify** | Simple, drag-and-drop or Git | Sign up at [netlify.com](https://netlify.com), connect the repo or drag the `dist/` folder into the Netlify dashboard. Set build command: `npm run build`, publish directory: `dist`. |
| **GitHub Pages** | Free, good if repo is on GitHub | After `npm run build`, push the contents of `dist/` to a `gh-pages` branch or use the `gh-pages` npm package. See [Vite docs: GitHub Pages](https://vitejs.dev/guide/static-deploy.html#github-pages). |

After deployment, everyone can open the same URL. If you do **not** run the backend (below), see the limitation in the next section.

### 2. Backend and remote play (included server)

The repo includes a **Node.js + Socket.io server** so GM and teams on different devices share the same game state. For **step-by-step instructions** to run the backend and play remotely, see [How to run the backend and play remotely](#how-to-run-the-backend-and-play-remotely) above.

**Deploying the server for internet play:** Host the `server/` app on a Node-friendly host (e.g. [Railway](https://railway.app), [Render](https://render.com), [Fly.io](https://fly.io)). Set the `PORT` env var if required. Then set `VITE_SOCKET_URL` in your **frontend** build to the server’s public URL (e.g. `https://coloc-game.railway.app`). Deploy the frontend (Vercel, Netlify, etc.) with that env var set so all players connect to the same backend.

**Without the backend:** If you don’t set `VITE_SOCKET_URL`, the app runs in **local-only** mode: state stays in the browser. GM and team can share one session only by using different tabs on the **same** computer.

## Publish to GitHub

To turn this folder into a Git repo and push it to GitHub:

1. **In Terminal, go to the project folder:**
   ```bash
   cd path/to/coloc-game
   ```
   (Use the real path, e.g. `~/Documents/Coloc_game_app/coloc-game`.)

2. **Initialize Git and make the first commit** (either run the script or the commands):
   ```bash
   bash setup-github.sh
   ```
   Or by hand:
   ```bash
   git init
   git add -A
   git status
   git commit -m "Initial commit: coLoc Game web app"
   ```

3. **Create a new repository on GitHub**
   - Go to [github.com/new](https://github.com/new).
   - Name it e.g. `coloc-game` (or any name you like).
   - Do **not** add a README, .gitignore, or license (this project already has them).
   - Click **Create repository**.

4. **Connect this folder to GitHub and push:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/coloc-game.git
   git branch -M main
   git push -u origin main
   ```
   Replace `YOUR_USERNAME` with your GitHub username (and `coloc-game` if you used a different repo name).

After that, the code is on GitHub and you can share the repo link or clone it on another machine.

## Reference

- Physical game & resources: [biop.github.io/coLoc](https://biop.github.io/coLoc/)
- GitHub: [github.com/BIOP/coLoc](https://github.com/BIOP/coLoc)
