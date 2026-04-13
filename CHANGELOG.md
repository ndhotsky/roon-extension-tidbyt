# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [1.0.0] — 2026-04-12

### Added
- Roon extension with native zone picker in the Roon settings UI (`type: "zone"`)
- Real-time Now Playing push to Tidbyt via Pixlet CLI
- Album art fetched from Roon's image service and passed to the Starlark renderer
- Configuration priority: env vars > `local-settings.json` > Roon persisted config
- PM2 process management via `ecosystem.config.cjs`
- `npm run doctor` health-check script
- Modular `src/` code structure with clear domain/service/integration boundaries
- `runtime/` directory isolation — Roon pairing config and render cache stay out of the source tree
- Apache-2.0 license
