/**
 * github-trending.ts — Scraper for GitHub Trending (JavaScript, daily)
 * GitHub has no native RSS. We fetch the trending page and parse repo cards.
 */

import type { FeedSource } from "../../config/feeds.config";
import type { FeedItem } from "../types";

export async function scrapeGithubTrending(source: FeedSource): Promise<FeedItem[]> {
  const url = "https://github.com/trending/javascript?since=daily";

  const res = await fetch(url, {
    signal: AbortSignal.timeout(20_000),
    headers: {
      "User-Agent": "rss-pipeline/1.0 (github.com/dalexanco/rss-pipeline)",
      "Accept": "text/html",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);

  const html = await res.text();

  // Each trending repo is in an <article class="Box-row"> element
  const articles = [...html.matchAll(/<article[^>]*class="Box-row"[^>]*>([\s\S]*?)<\/article>/g)];
  if (articles.length === 0) throw new Error("No trending repos found — HTML structure may have changed");

  const items: FeedItem[] = [];

  for (const [, body] of articles) {
    // Repo path: first /owner/repo href (2 segments only, no extra slashes)
    const repoMatch = body.match(/href="(\/[^/"\s]+\/[^/"\s]+)"/);
    if (!repoMatch) continue;
    const repoPath = repoMatch[1];
    const repoName = repoPath.slice(1); // "owner/repo"
    const link = `https://github.com${repoPath}`;

    // Description: <p> with col-9 class
    const descMatch = body.match(/<p\s[^>]*col-9[^>]*>([\s\S]*?)<\/p>/);
    const description = descMatch
      ? descMatch[1].replace(/<[^>]+>/g, "").trim()
      : "No description";

    // Stars today: "N stars today"
    const starsMatch = body.match(/(\d[\d,]*)\s+stars? today/i);
    const starsToday = starsMatch ? starsMatch[1] : null;

    const title = starsToday
      ? `${repoName} ⭐ ${starsToday} stars today`
      : repoName;

    items.push({
      title,
      link,
      pubDate: new Date(),
      description: description || repoName,
      author: undefined,
      imageUrl: undefined,
      source: source.label,
      sourceSlug: source.slug,
      category: source.category,
    });
  }

  return items.slice(0, source.maxItems ?? 20);
}
