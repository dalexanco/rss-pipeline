import type { FeedItem } from "./types";
import type { FeedOutput, FeedSource } from "../config/feeds.config";

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function faviconUrl(siteUrl: string): string {
  try {
    const domain = new URL(siteUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return "";
  }
}

function renderItem(item: FeedItem): string {
  const content = item.contentHtml
    ? `<content:encoded><![CDATA[${item.contentHtml}]]></content:encoded>`
    : "";
  const description = item.description
    ? `<description><![CDATA[${item.description}]]></description>`
    : "";
  const author = item.author
    ? `<dc:creator>${esc(item.author)}</dc:creator>`
    : "";
  const enclosure = item.imageUrl
    ? `<enclosure url="${esc(item.imageUrl)}" type="image/jpeg" length="0"/>`
    : "";
  const category = item.category
    ? `<category>${esc(item.category)}</category>`
    : "";

  return `    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${esc(item.link)}</link>
      <guid isPermaLink="true">${esc(item.link)}</guid>
      <pubDate>${item.pubDate.toUTCString()}</pubDate>
      ${description}
      ${content}
      ${author}
      ${enclosure}
      ${category}
      <source>${esc(item.source)}</source>
    </item>`;
}

export function generateFeed(
  items: FeedItem[],
  output: FeedOutput,
  feedUrl: string,
  imageUrl?: string,
): string {
  const filtered = output.filter
    ? items.filter((i) => output.filter!.includes(i.category ?? ""))
    : items;

  const sorted = filtered
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
    .slice(0, output.maxItems ?? 100);

  const imageBlock = imageUrl
    ? `<image>
      <url>${imageUrl}</url>
      <title>${esc(output.title)}</title>
      <link>${feedUrl}</link>
    </image>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${esc(output.title)}</title>
    <link>${feedUrl}</link>
    <description>${esc(output.description)}</description>
    <language>fr</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <generator>rss-pipeline/bun</generator>
    ${imageBlock}
${sorted.map(renderItem).join("\n")}
  </channel>
</rss>`;
}

// Generate a per-source feed from a single FeedSource + its items
export function generateSourceFeed(
  source: FeedSource,
  items: FeedItem[],
  feedUrl: string,
): string {
  const output: FeedOutput = {
    filename: `${source.slug}.xml`,
    title: source.label,
    description: `Feed RSS — ${source.label}`,
    maxItems: source.maxItems ?? 50,
  };
  return generateFeed(items, output, feedUrl, faviconUrl(source.siteUrl));
}
