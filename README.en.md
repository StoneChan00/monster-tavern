[简体中文](README.md) | English

# Monster Tavern 🍺⚔️

> Run a tavern at the entrance of a dungeon: recruit adventurers, send parties into the dungeon to farm monsters, and cook their drops into the dishes on your menu — an idle management RPG in the spirit of *Delicious in Dungeon*.

**🎮 Play now: https://stonechan00.github.io/monster-tavern/** (game UI is in Chinese)

## Gameplay

- ⚔️ **Six themed maps**: Mossy Caverns → Void's End, with endless wave cycles. Each wave has a 5% chance to spawn an **elite**; every map's elite pool covers all 6 classes — killing one drops that class's sigil plus the map's core, the only source of promotion materials
- 🧑‍🤝‍🧑 **D&D-style adventurers**: 6 classes × 9 races, Lv1–10. Once EXP is full you must hold a **promotion ceremony** at the tavern (class sigil + that map's elite core)
- 🍳 **Menu-driven kitchen**: dishes on the menu consume ingredients hourly to keep their buffs. Combine a starter + main + drink structure to earn stacking set bonuses
- 🍻 **Food is recruitment**: unlocking recipes raises the visit weight of the matching class
- 💀 **Failure-friendly**: the first party wipe grants emergency aid; offline earnings settle normally (8h cap)
- 📖 **Codex · achievements · stats**: 76 monsters, 24 recipes, 17 achievements
- 📱 **Idle-first**: closing the tab still counts — come back to a daily offline report

## Cloud saves (optional)

The game is fully playable without signing in; saves live in the browser (localStorage) by default.

After signing in with Google or GitHub, a copy of your save is synced to the cloud — sign in with the same account on another device and continue where you left off:

- The local save is always the primary copy, the cloud is just a replica; network errors never block play
- If both sides have new progress, a **conflict dialog** asks the player to choose — never silently overwrite
- Built on Firebase Authentication + Realtime Database; saves are isolated per account uid

Setup steps and security rules: [docs/cloud-save.md](docs/cloud-save.md) (in Chinese). Without Firebase configured the game degrades to the pure local version.

## Tech stack

React 19 · TypeScript · Vite 8 · Tailwind CSS v4 · PixiJS v8 · Zustand · Firebase (optional)

The simulation is fully decoupled from the UI: `src/engine` is a pure functional layer that can be re-run in Node, so tests need no browser.

## Local development

Requires Node 20+ and pnpm 10:

```bash
pnpm install
pnpm dev      # http://localhost:5173/monster-tavern/
pnpm test     # 106 cases: engine / scene depth / cloud sync decisions & revision guard
pnpm build    # output to dist/
pnpm preview  # preview the production build
```

Cloud saves need your own Firebase project: put the 5 public config values into `.env.local` (template: [.env.example](.env.example)). Development and play work fine without it.

## Project layout

```
src/
├── engine/    # simulation: combat, loot, offline settlement, balance & types (pure, Node-runnable)
├── data/      # content: monsters, classes, races, recipes, materials, facilities, achievements
├── save/      # saves: serialize / migration chain / storage adapter / save event bus
├── cloud/     # cloud sync: Firebase init, RTDB read/write, sync decision (pure functions)
├── store/     # Zustand: game state machine and cloud sync state machine
├── ui/        # UI: dungeon, dorm, kitchen, tavern scene, codex, inventory
├── app/       # game heartbeat (rAF-driven, handles tab switches and offline catch-up)
├── utils/     # small helpers such as formatting
└── assets/    # static assets (fonts)
tests/         # vitest suites
assets/tools/  # asset generators (procedural sprites and scenes built with pngjs)
docs/          # design docs, style guide, cloud save guide (Chinese)
```

Saves carry a `version` field plus a v1→v7 migration chain, so old saves never break.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy-pages.yml`, which builds and publishes to GitHub Pages.

Cloud save config lives in the committed `.env.production` (public values; the real authorization boundary is the database rules). Note: **do not inject empty secrets in the workflow** — an empty string overrides `.env.production` and silently disables cloud sync. See [docs/cloud-save.md](docs/cloud-save.md).

## Documentation

- [docs/cloud-save.md](docs/cloud-save.md) — cloud save setup, RTDB rules, behavior spec
- [docs/STYLE.md](docs/STYLE.md) — pixel art style guide and asset pipeline
- [docs/PROPOSAL.md](docs/PROPOSAL.md) — design proposal
- [docs/HANDOFF.md](docs/HANDOFF.md) — handoff notes

*(Docs are currently written in Chinese.)*

## Credits

- [Kenney](https://kenney.nl) (Tiny Dungeon / Tiny Town / Roguelike Indoor, CC0)
- [Tiny Creatures by Clint Bellanger](https://opengameart.org/content/tiny-creatures) (CC0, via Kenney)
- [16x16 Food](https://opengameart.org/content/16x16-food) (Hamletum palette, CC0)
- [Fusion Pixel Font](https://github.com/TakWolf/fusion-pixel-font) (OFL-1.1)
- Inspiration: *Delicious in Dungeon*, D&D

## License

[MIT](LICENSE)
