import type { FeedItem } from "./types";
import type { FeedOutput } from "../config/feeds.config";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function generateFeed(
  items: FeedItem[],
  output: FeedOutput,
  baseUrl: string
): string {
  const filtered = output.filter
    ? items.filter((i) => output.filter!.includes(i.category ?? ""))
    : items;

  const sorted = filtered
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
    .slice(0, output.maxItems ?? 100);

  const feedUrl = `${baseUrl}/${output.filename}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(output.title)}</title>
    <link>${feedUrl}</link>
    <description>${escapeXml(output.description)}</description>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>rss-pipeline/bun</generator>
${sorted
  .map(
    (item) => `    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${escapeXml(item.link)}</link>
      <pubDate>${item.pubDate.toUTCString()}</pubDate>
      <category>${escapeXml(item.source)}</category>
      ${item.description ? `<description><![CDATA[${item.description}]]></description>` : ""}
      <guid isPermaLink="true">${escapeXml(item.link)}</guid>
    </item>`
  )
  .join("\n")}
  </channel>
</rss>`;
}
