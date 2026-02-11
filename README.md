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

## Stack

- React 18 + Vite + TypeScript
- Zustand (in-memory state)
- TailwindCSS

Game state is in-memory only; multiple browser tabs/windows share state only if they use the same tab (e.g. GM and team in different tabs on one machine). For real multi-device play you’d add a backend (e.g. Firebase, Socket.io).

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
