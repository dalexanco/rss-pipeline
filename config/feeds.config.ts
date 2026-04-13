export interface FeedSource {
  label: string;
  slug: string;           // Used for per-source filename: feeds/{slug}.xml
  route?: string;         // RSSHub route, e.g. "/hackernews/best"
  directUrl?: string;     // Direct RSS/Atom URL
  category?: string;      // Tag for aggregated feeds
  siteUrl: string;        // Homepage URL
  faviconUrl: string;     // Direct favicon URL (for webfeeds:icon)
  maxItems?: number;      // Per-source limit (default: 50)
}

export interface FeedOutput {
  filename: string;
  title: string;
  description: string;
  filter?: string[];      // Include only these categories (undefined = all)
  maxItems?: number;
}

export interface Config {
  rsshub: {
    baseUrl: string;
  };
  sources: FeedSource[];
  outputs: FeedOutput[];  // Aggregated outputs (per-source are auto-generated)
}

const config: Config = {
  rsshub: {
    baseUrl: process.env.RSSHUB_URL ?? "http://localhost:1200",
  },

  sources: [
    // ── Tech / Dev ────────────────────────────────────────────────────────────
    {
      label: "Hacker News",
      slug: "hackernews",
      route: "/hackernews/best",
      category: "tech",
      siteUrl: "https://news.ycombinator.com",
      faviconUrl: "https://news.ycombinator.com/favicon.ico",
      maxItems: 30,
    },
    {
      label: "GitHub Trending JS",
      slug: "github-trending-js",
      route: "/github/trending/daily/javascript",
      category: "tech",
      siteUrl: "https://github.com",
      faviconUrl: "https://github.com/favicon.ico",
      maxItems: 20,
    },
    {
      label: "Stripe Engineering",
      slug: "stripe-engineering",
      directUrl: "https://stripe.com/blog/feed.rss",
      category: "tech",
      siteUrl: "https://stripe.com",
      faviconUrl: "https://stripe.com/favicon.ico",
      maxItems: 20,
    },
    {
      label: "Spotify Engineering",
      slug: "spotify-engineering",
      directUrl: "https://engineering.atspotify.com/feed/",
      category: "tech",
      siteUrl: "https://engineering.atspotify.com",
      faviconUrl: "https://engineering.atspotify.com/favicon.ico",
      maxItems: 20,
    },

    // ── Design / Frontend ─────────────────────────────────────────────────────
    {
      label: "CSS Tricks",
      slug: "css-tricks",
      route: "/csstricks",
      category: "design",
      siteUrl: "https://css-tricks.com",
      faviconUrl: "https://css-tricks.com/favicon.ico",
      maxItems: 20,
    },
    {
      label: "Smashing Magazine",
      slug: "smashing-magazine",
      route: "/smashingmagazine",
      category: "design",
      siteUrl: "https://www.smashingmagazine.com",
      faviconUrl: "https://www.smashingmagazine.com/favicon.ico",
      maxItems: 20,
    },
  ],

  // Aggregated outputs (per-source feeds are generated automatically)
  outputs: [
    {
      filename: "tech.xml",
      title: "Tech & Dev",
      description: "Agrégat tech, dev et ingénierie",
      filter: ["tech"],
      maxItems: 100,
    },
    {
      filename: "design.xml",
      title: "Design & Frontend",
      description: "Agrégat design et frontend",
      filter: ["design"],
      maxItems: 50,
    },
    {
      filename: "all.xml",
      title: "All Feeds",
      description: "Toutes les sources",
      maxItems: 200,
    },
  ],
};

export default config;
