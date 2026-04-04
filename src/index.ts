import { mkdir, writeFile } from "node:fs/promises";
import config from "../config/feeds.config";
import { fetchSource } from "./fetch";
import { generateFeed, generateSourceFeed } from "./generate";

const PAGES_BASE =
  process.env.PAGES_URL ??
  `https://${process.env.GITHUB_REPOSITORY_OWNER ?? "dalexanco"}.github.io/${
    process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "rss-pipeline"
  }/feeds`;

async function main() {
  console.log("🚀 RSS Pipeline starting…");
  console.log(`   Base URL: ${PAGES_BASE}\n`);

  await mkdir("./dist/feeds", { recursive: true });

  // 1. Fetch all sources in parallel
  const results = await Promise.allSettled(
    config.sources.map((s) => fetchSource(config.rsshub.baseUrl, s))
  );

  // 2. Map results back to sources
  const sourceItems = config.sources.map((source, i) => ({
    source,
    items: results[i].status === "fulfilled" ? results[i].value : [],
  }));

  const allItems = sourceItems.flatMap((s) => s.items);
  console.log(`\n📦 Total: ${allItems.length} items fetched\n`);

  // 3. Generate per-source feeds
  console.log("📄 Generating per-source feeds…");
  for (const { source, items } of sourceItems) {
    const feedUrl = `${PAGES_BASE}/${source.slug}.xml`;
    const xml = generateSourceFeed(source, items, feedUrl);
    await writeFile(`./dist/feeds/${source.slug}.xml`, xml, "utf-8");
    console.log(`  ✓ dist/feeds/${source.slug}.xml (${items.length} items)`);
  }

  // 4. Generate aggregated feeds
  console.log("\n📄 Generating aggregated feeds…");
  for (const output of config.outputs) {
    const feedUrl = `${PAGES_BASE}/${output.filename}`;
    const xml = generateFeed(allItems, output, feedUrl);
    await writeFile(`./dist/feeds/${output.filename}`, xml, "utf-8");
    console.log(`  ✓ dist/feeds/${output.filename}`);
  }

  // 5. Generate index HTML
  const allOutputs = [
    ...config.sources.map((s) => ({
      filename: `${s.slug}.xml`,
      title: s.label,
      description: s.label,
      badge: s.category ?? "",
    })),
    ...config.outputs.map((o) => ({
      filename: o.filename,
      title: o.title,
      description: o.description,
      badge: "agregé",
    })),
  ];

  const index = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>RSS Pipeline — dalexanco</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 700px; margin: 2rem auto; padding: 0 1rem; color: #1a1a1a; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .subtitle { color: #666; margin-bottom: 2rem; font-size: 0.9rem; }
    .section { margin-bottom: 2rem; }
    h2 { font-size: 1rem; text-transform: uppercase; letter-spacing: 0.05em; color: #888; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
    ul { list-style: none; padding: 0; margin: 0; }
    li { padding: 0.6rem 0; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; gap: 0.75rem; }
    li:last-child { border-bottom: none; }
    img.favicon { width: 20px; height: 20px; border-radius: 4px; }
    a { color: #0066cc; text-decoration: none; font-weight: 500; }
    a:hover { text-decoration: underline; }
    .badge { font-size: 0.7rem; background: #f0f0f0; padding: 2px 6px; border-radius: 10px; color: #666; }
    .url { font-size: 0.8rem; color: #999; font-family: monospace; }
    small { color: #999; font-size: 0.8rem; }
  </style>
</head>
<body>
  <h1>📡 RSS Pipeline</h1>
  <p class="subtitle">Généré le ${new Date().toLocaleString("fr-FR")} · <a href="https://github.com/dalexanco/rss-pipeline">GitHub</a></p>

  <div class="section">
    <h2>Sources individuelles</h2>
    <ul>
      ${config.sources.map((s) => `
      <li>
        <img class="favicon" src="https://www.google.com/s2/favicons?domain=${new URL(s.siteUrl).hostname}&sz=32" alt="">
        <div>
          <a href="feeds/${s.slug}.xml">${s.label}</a>
          <span class="badge">${s.category ?? ""}</span><br>
          <span class="url">${PAGES_BASE}/${s.slug}.xml</span>
        </div>
      </li>`).join("")}
    </ul>
  </div>

  <div class="section">
    <h2>Flux agrégés</h2>
    <ul>
      ${config.outputs.map((o) => `
      <li>
        <div>
          <a href="feeds/${o.filename}">${o.title}</a>
          <span class="badge">agrégé</span><br>
          <small>${o.description}</small><br>
          <span class="url">${PAGES_BASE}/${o.filename}</span>
        </div>
      </li>`).join("")}
    </ul>
  </div>
</body>
</html>`;

  await writeFile("./dist/index.html", index, "utf-8");
  console.log("\n✓ dist/index.html");
  console.log("\n✅ Pipeline done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
