# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.3.0] - 2026-08-31

### Added

- Top banner link to the image.sc Community Forum (colocalization tag), with forum logo icon (#20)
- Reviewer 3 Handbook download card, visible throughout the whole game (not just before session creation) (#20)
- Acquisition Planning: red "Choose 1 card" / green check indicator on each mandatory card row for Research Teams (#16)
- Reviewer 3 dashboard: per-team mandatory acquisition category status (red "Not chosen yet" until picked, then shows the chosen card) (#16)

### Changed

- "Simultaneous acquisition" and "Camera" detector are no longer marked incompatible, allowing dual-camera spinning disk setups (#19)

### Fixed

- coLoc logo failing to load due to a filename case mismatch (`coloc_logo.png` vs `coLoc_logo.png`)

## [1.0.0] - YYYY-MM-DD

### Added

- Reviewer 3 (Game Master) and Research Team roles
- Session creation and join flow (session code, Reviewer 3 code)
- Acquisition planning: microscope hardware, image settings
- Analysis planning: ROI, pre-processing, segmentation, metrics
- Review phase: issue cards, details cards, dice rolls
- PDF game report with share links
- Real-time sync via Socket.IO (in-memory state, no database)
- Deploy docs for GitHub Pages + Railway/Render

### Changed

- (none for initial release)

### Fixed

- (none for initial release)

---

**Instructions for future releases:** When cutting a new version, add a new `## [x.y.z]` section above, update the date, and list changes under Added/Changed/Fixed.
