# RSS Static Pipeline

RSS aggregator built with Bun + RSSHub + GitHub Pages.

Generates static XML feeds hourly via GitHub Actions, deployed to GitHub Pages.

## Live feeds

- [All feeds](https://dalexanco.github.io/rss-pipeline/feeds/all.xml)
- [Tech](https://dalexanco.github.io/rss-pipeline/feeds/tech.xml)
- [Design](https://dalexanco.github.io/rss-pipeline/feeds/design.xml)

## Sources

| Source | Category |
|--------|----------|
| Hacker News (Best) | tech |
| GitHub Trending JS | tech |
| Stripe Engineering Blog | tech |
| Spotify Engineering Blog | tech |
| CSS Tricks | design |
| Smashing Magazine | design |

## Add a source

1. Find the RSSHub route at [docs.rsshub.app](https://docs.rsshub.app) — or use `directUrl` for native RSS feeds
2. Add to `config/feeds.config.ts` → `sources` array
3. Push to `main` — workflow triggers automatically

## Local dev

```bash
docker compose up -d   # Start RSSHub on :1200
bun install
bun run src/index.ts   # Generates ./dist/feeds/*.xml
```
