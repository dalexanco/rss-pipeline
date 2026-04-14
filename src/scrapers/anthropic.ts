/**
 * Custom scraper for Anthropic news (no native RSS feed)
 * Fetches the news index, extracts slugs, then fetches OG metadata per article.
 */
import type { FeedSource } from "../../config/feeds.config";
import type { FeedItem } from "../types";

const UA = "rss-pipeline/1.0 (github.com/dalexanco/rss-pipeline)";

function extractOg(html: string, prop: string): string {
  const m = html.match(
    new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']+)["']`, "i")
  ) ?? html.match(
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${prop}["']`, "i")
  );
  return m ? m[1].replace(/&amp;/g, "&").replace(/&#x27;/g, "'") : "";
}

function extractPublishedDate(html: string): Date {
  // Try article:published_time meta
  const m = html.match(/article:published_time[^>]+content=["']([^"']+)["']/i)
    ?? html.match(/<time[^>]+datetime=["']([^"']+)["']/i);
  if (m) {
    const d = new Date(m[1]);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

async function fetchArticleMeta(slug: string): Promise<{
  title: string;
  description: string;
  image: string;
  pubDate: Date;
} | null> {
  try {
    const res = await fetch(`https://www.anthropic.com/news/${slug}`, {
      signal: AbortSignal.timeout(15_000),
      headers: { "User-Agent": UA },
    });
    if (!res.ok) return null;
    const html = await res.text();
    return {
      title: extractOg(html, "title"),
      description: extractOg(html, "description"),
      image: extractOg(html, "image"),
      pubDate: extractPublishedDate(html),
    };
  } catch {
    return null;
  }
}

export async function scrapeAnthropic(source: FeedSource): Promise<FeedItem[]> {
  // 1. Fetch news index
  const res = await fetch("https://www.anthropic.com/news", {
    signal: AbortSignal.timeout(20_000),
    headers: { "User-Agent": UA },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching Anthropic news index`);
  const html = await res.text();

  // 2. Extract unique article slugs (preserve order)
  const slugRegex = /href="(\/news\/[a-z0-9][a-z0-9\-]+)"/g;
  const slugs: string[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = slugRegex.exec(html)) !== null) {
    const slug = m[1].replace("/news/", "");
    if (!seen.has(slug)) {
      seen.add(slug);
      slugs.push(slug);
    }
  }

  // 3. Fetch metadata for each article (parallel, capped at maxItems)
  const limit = source.maxItems ?? 15;
  const top = slugs.slice(0, limit);
  const metas = await Promise.all(top.map(fetchArticleMeta));

  // 4. Build FeedItems
  const items: FeedItem[] = [];
  for (let i = 0; i < top.length; i++) {
    const meta = metas[i];
    if (!meta || !meta.title) continue;
    items.push({
      title: meta.title,
      link: `https://www.anthropic.com/news/${top[i]}`,
      pubDate: meta.pubDate,
      description: meta.description,
      contentHtml: meta.description
        ? `<p>${meta.description}</p>`
        : undefined,
      imageUrl: meta.image || undefined,
      source: source.label,
      sourceSlug: source.slug,
      category: source.category,
    });
  }

  return items;
}
