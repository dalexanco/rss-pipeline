export interface FeedItem {
  title: string;
  link: string;
  pubDate: Date;
  description?: string;      // Short plain-text summary
  contentHtml?: string;      // Full HTML content (content:encoded)
  author?: string;
  imageUrl?: string;         // Thumbnail/enclosure
  source: string;            // Source label
  sourceSlug: string;        // Source slug for per-source feeds
  category?: string;
}
