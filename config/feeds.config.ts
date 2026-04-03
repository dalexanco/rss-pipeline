export interface FeedSource {
  label: string;
  route?: string;       // RSSHub route, e.g. "/hackernews/best"
  directUrl?: string;   // Direct RSS URL (for native feeds)
  category?: string;
}

export interface FeedOutput {
  filename: string;
  title: string;
  description: string;
  filter?: string[];
  maxItems?: number;
}

export interface Config {
  rsshub: {
    baseUrl: string;
  };
  sources: FeedSource[];
  outputs: FeedOutput[];
}

const config: Config = {
  rsshub: {
    baseUrl: process.env.RSSHUB_URL ?? "http://localhost:1200",
  },
  sources: [
    // Tech / Dev
    { label: "Hacker News", route: "/hackernews/best", category: "tech" },
    { label: "GitHub Trending JS", route: "/github/trending/daily/javascript", category: "tech" },

    // Stripe Engineering Blog (native RSS)
    {
      label: "Stripe Engineering",
      directUrl: "https://stripe.com/blog/feed.rss",
      category: "tech",
    },

    // Spotify Engineering Blog (native RSS)
    {
      label: "Spotify Engineering",
      directUrl: "https://engineering.atspotify.com/feed/",
      category: "tech",
    },

    // Design / Frontend
    { label: "CSS Tricks", route: "/csstricks", category: "design" },
    { label: "Smashing Magazine", route: "/smashingmagazine", category: "design" },
  ],
  outputs: [
    {
      filename: "tech.xml",
      title: "Tech Feed",
      description: "Agrégat tech, dev et ingénierie",
      filter: ["tech"],
      maxItems: 100,
    },
    {
      filename: "design.xml",
      title: "Design Feed",
      description: "Agrégat design et frontend",
      filter: ["design"],
      maxItems: 50,
    },
    {
      filename: "all.xml",
      title: "All Feeds",
      description: "Toutes les sources",
      maxItems: 150,
    },
  ],
};

export default config;
