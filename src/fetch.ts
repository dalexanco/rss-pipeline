import { XMLParser } from "fast-xml-parser";
import type { FeedSource } from "../config/feeds.config";
import type { FeedItem } from "./types";
import { scrapeAnthropic } from "./scrapers/anthropic";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  cdataPropName: "__cdata",
  parseTagValue: true,
  trimValues: true,
});

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function extractText(field: any): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (field.__cdata) return field.__cdata;
  if (field["#text"]) return field["#text"];
  return String(field);
}

function extractLink(field: any): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  // Atom <link href="...">
  if (field["@_href"]) return field["@_href"];
  // Array of links — pick rel="alternate" or first
  if (Array.isArray(field)) {
    const alt = field.find((l: any) => l["@_rel"] === "alternate");
    return alt?.["@_href"] ?? field[0]?.["@_href"] ?? "";
  }
  return extractText(field);
}

function extractImage(item: any): string | undefined {
  // media:thumbnail or media:content
  const media =
    item["media:thumbnail"] ??
    item["media:content"] ??
    item["media:group"]?.["media:thumbnail"];
  if (media) {
    if (typeof media === "string") return media;
    if (media["@_url"]) return media["@_url"];
  }
  // enclosure
  if (item.enclosure?.["@_url"]) return item.enclosure["@_url"];
  // og:image in content
  const content = extractText(item["content:encoded"] ?? item.content ?? "");
  const match = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1];
}

function normalizeItem(item: any, source: FeedSource): FeedItem {
  const title = extractText(item.title) || "No title";
  const link = extractLink(item.link ?? item.url);
  const rawDate = item.pubDate ?? item.published ?? item.updated ?? item["dc:date"];
  const pubDate = rawDate ? new Date(extractText(rawDate)) : new Date();

  // Rich content: prefer content:encoded > content > description
  const contentRaw =
    extractText(item["content:encoded"]) ||
    extractText(item.content) ||
    extractText(item.summary) ||
    extractText(item.description) ||
    "";

  // Short plain-text description (first 300 chars)
  const plainText = stripHtml(contentRaw);
  const description = plainText.slice(0, 300) + (plainText.length > 300 ? "…" : "");

  const author =
    extractText(item.author?.name ?? item["dc:creator"] ?? item.author) || undefined;

  return {
    title,
    link,
    pubDate: isNaN(pubDate.getTime()) ? new Date() : pubDate,
    description,
    contentHtml: contentRaw || undefined,
    author,
    imageUrl: extractImage(item),
    source: source.label,
    sourceSlug: source.slug,
    category: source.category,
  };
}

export async function fetchSource(
  baseUrl: string,
  source: FeedSource
): Promise<FeedItem[]> {
  // Custom scrapers for sites without native RSS
  if (source.scraper === "anthropic") {
    try {
      const items = await scrapeAnthropic(source);
      console.log(`  ✓ ${source.label} — ${items.length} items (scraper)`);
      return items;
    } catch (err) {
      console.error(`  ✗ ${source.label} — ${err}`);
      return [];
    }
  }

  const url = source.directUrl ?? `${baseUrl}${source.route}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(20_000),
      headers: { "User-Agent": "rss-pipeline/1.0 (github.com/dalexanco/rss-pipeline)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);

    const xml = await res.text();
    const parsed = parser.parse(xml);

    // Support RSS 2.0, RSS 1.0, Atom
    const rawItems: any[] =
      parsed?.rss?.channel?.item ??
      parsed?.feed?.entry ??
      parsed?.["rdf:RDF"]?.item ??
      [];

    const items = (Array.isArray(rawItems) ? rawItems : [rawItems])
      .map((item) => normalizeItem(item, source))
      .slice(0, source.maxItems ?? 50);

    console.log(`  ✓ ${source.label} — ${items.length} items`);
    return items;
  } catch (err) {
    console.error(`  ✗ ${source.label} — ${err}`);
    return [];
  }
}
