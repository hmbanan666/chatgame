# Chatgame

A procedurally generated world driven by Twitch chat. Viewers type commands to control pixel characters, travel with a steam wagon through biomes, chop trees, complete quests, and collect unique characters — all live on stream.

![Screen](https://raw.githubusercontent.com/hmbanan666/chatgame/main/.github/static/wagon-room-screen-2.jpg)

- [Play](https://chatgame.space) — project website
- [Watch](https://www.twitch.tv/hmbanan666) — live development and gameplay on Twitch
- [Roadmap](ROADMAP.md) — project history and future plans

## How it works

- Viewers join via Twitch chat — a character spawns on screen
- The wagon travels through procedurally generated biomes (green, blue, stone, teal, toxic, violet)
- Characters chop trees, gather resources, complete quests from NPCs
- Donations and channel point redemptions affect the game in real time (refuel, sabotage, speed boost)
- Players earn XP, level up, collect characters, and exchange coupons for coins

## Monorepo structure

```
apps/
  web-app/          Nuxt — game UI, streaming overlays, API, WebSocket server
packages/
  database/         Drizzle ORM — PostgreSQL schema and repositories
  game/             PixiJS game engine — rendering, camera, ticker
  sprites/          Indexed pixel sprite system — characters, trees, wagon, bushes
  types/            Shared TypeScript types
  locale/           i18n (Russian, English)
```

## Stack

- [PixiJS](https://pixijs.com/) — WebGL canvas rendering
- [Vue](https://vuejs.org/) + [Nuxt](https://nuxt.com/) — frontend framework
- [Drizzle](https://orm.drizzle.team/) — database toolkit for PostgreSQL
- [pnpm](https://pnpm.io/) — package manager with workspace support
- Native Twitch and Donation Alerts clients via WebSocket/fetch
- Custom indexed pixel sprite system with palette swapping (Resurrect 64)

## Development

```shell
git clone https://github.com/hmbanan666/chatgame
pnpm i
pnpm dev
```

Requires Node.js >= 24 and pnpm >= 10.33.

## License

[MIT](LICENSE)
