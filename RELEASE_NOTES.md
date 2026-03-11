# Release Notes

> Use the content below when creating a [GitHub Release](https://github.com/emiglietta/coloc-game/releases/new). Attach the auto-generated source code (zip/tar.gz) or use the tag’s archive links.

---

## v1.0.0

**First stable release** — coLoc Game (Web) is a collaborative web app for playing the coLoc board game, teaching co-localization analysis in microscopy.

### Features

- **Reviewer 3 (Game Master)** — Creates and controls sessions, advances phases, assigns experiments and review cards to research teams.
- **Research Teams** — Join sessions with a code, plan acquisition and analysis cards, collaborate on experiment design.
- **Phases** — Setup → Research Team Formation → Acquisition Planning → Analysis Planning → Review & Defense → Complete.
- **Acquisition cards** — Microscope hardware (objective, modality, detector, super-resolution), image settings (channel, pixel size, SNR, Z-sampling, tiling).
- **Analysis cards** — ROI (whole image, cell-by-cell), pre-processing (Deconvolution, Z projection), segmentation (type and structure), intensity-based and object-based metrics.
- **Review phase** — Reviewer 3 assigns issue cards (concerns) and details cards to teams; teams roll dice for experimental details.
- **Game report** — PDF export with thumbnails, share via GitHub Issues or email.
- **Real-time sync** — Socket.IO keeps all connected clients in sync (no database; state is in-memory on the server).

### Deployment

- **Frontend** — Static (Vite/React), deploy to GitHub Pages or any static host.
- **Backend** — Node.js + Socket.IO in `server/`, deploy to Railway, Render, or any Node host.
- See [README.md](README.md) for full deployment instructions.

### Requirements

- Node.js 18+
- No database required

---

*When creating a new release, add a new section above this one with the version and changes.*
