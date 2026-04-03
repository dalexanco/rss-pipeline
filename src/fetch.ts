import { XMLParser } from "fast-xml-parser";
import type { FeedSource } from "../config/feeds.config";
import type { FeedItem } from "./types";

const parser = new XMLParser({ ignoreAttributes: false });

export async function fetchSource(
  baseUrl: string,
  source: FeedSource
): Promise<FeedItem[]> {
  // Support direct URLs (native RSS) and RSSHub routes
  const url = source.directUrl ?? `${baseUrl}${source.route ?? ""}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const xml = await res.text();
    const parsed = parser.parse(xml);

    // Support RSS 2.0 and Atom
    const items =
      parsed?.rss?.channel?.item ??
      parsed?.feed?.entry ??
      [];

    const normalized = (Array.isArray(items) ? items : [items]).map(
      (item: any): FeedItem => ({
        title: item.title?.["#text"] ?? item.title ?? "No title",
        link: item.link?.["@_href"] ?? item.link ?? "",
        pubDate: new Date(item.pubDate ?? item.published ?? Date.now()),
        description: item.description ?? item.summary?.["#text"] ?? item.summary ?? "",
        source: source.label,
        category: source.category,
      })
    );

    console.log(`✓ ${source.label} — ${normalized.length} items`);
    return normalized;
  } catch (err) {
    console.error(`✗ ${source.label} — ${err}`);
    return [];
  }
}
