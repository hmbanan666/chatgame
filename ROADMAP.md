# Roadmap

## The story so far

### March 2024 — First stream

The first stream went live on March 18, 2024. The initial idea was a roguelike, then tower defense — but it quickly evolved into something else: a shared world where Twitch viewers control characters through chat commands. The first resource (wood) appeared, viewers started chopping trees and donating materials to the village.

### April 2024 — The wagon era

The game found its identity. A steam-powered wagon became the center of the world — it moves through procedurally generated chunks (villages, forests, lakes), and players run alongside it. The first NPCs appeared: Courier, Farmer, Mechanic. Buildings got inventories. The pixel art palette was set — Resurrect 64.

### May 2024 — Quests and trading

Quests, traders, and a dynamic command system were added. The wagon got fuel mechanics. Biome themes (green, blue, stone, teal, toxic, violet) started shaping the visual identity. The game got English localization.

### 2024–2025 — Quiet evolution

The project went through multiple technical rewrites: migrated from Prisma to Drizzle, dropped Telegram integration, removed heavy dependencies like Twurple and the Donation Alerts SDK in favor of native WebSocket/fetch clients. The codebase consolidated from scattered packages into a clean monorepo.

### Early 2026 — Indexed sprites and stream sessions

A custom sprite system was built from scratch — all game visuals are now procedurally generated from indexed pixel data (`[x, y, slotIndex]` + palette). No external assets, no CDN. Trees, characters, wagon parts — everything is defined in code and rendered at runtime.

Stream sessions got persistent state: fuel, stats, quests, and coupons are saved and can resume on reconnect. The wagon dashboard became interactive — viewers spend channel points on actions (refuel, sabotage, speed boost) that affect the game in real time.

A leveling system was added: XP from chat messages, coins on level-up, character collection with individual progression.

---

## Where we're headed

### Characters and collection

15 playable characters with unique pixel sprites. Each has its own XP and level. Players unlock new characters with coins or through donations. The goal: a collection system that makes viewers want to come back.

### Main page redesign

Two experiences:
- **Logged in** — profile dashboard with character collection, XP progress, coin shop, demo canvas
- **Logged out** — hero section with live demo, character preview, login CTA

### Economy and progression

- Deeper resource loop: gathering, crafting, trading between players
- Persistent inventory across streams
- Tier-based coin shop with meaningful rewards

### World and exploration

- More biome types with unique mechanics and NPCs
- Village building that persists between sessions
- Community goals and milestones visible on stream

### Viewer engagement and retention

Priority order:

1. **Daily rewards / streaks** — daily login bonus, streak multipliers (7 days = x3). Personal welcome messages in game world, visual effects on character spawn, stream alerts on long streaks
2. **Viewer engagement score** — composite metric in CRM (watch time + chat + donations + quest participation). Helps streamers identify their most valuable viewers
3. **Duels and mini-games** — `!duel @user 10` bet coins, random or XP-weighted outcome, winner takes pot. Visual combat later
4. **Predictions** — viewers bet coins on caravan outcomes. Requires autonomous game loop first (caravan moves on timer, events happen without player input)
5. **Donation milestones → caravan fuel** — deferred until audience grows. May pivot to in-game currency instead of real donations

### Technical

- Multi-streamer support (already in the schema)
- Performance: keep RSS under 200 MB, all assets baked locally
- Continue replacing external dependencies with lightweight native implementations
