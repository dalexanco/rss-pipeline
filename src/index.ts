import { mkdir, writeFile } from "node:fs/promises";
import config from "../config/feeds.config";
import { fetchSource } from "./fetch";
import { generateFeed } from "./generate";

const PAGES_URL =
  process.env.PAGES_URL ??
  `https://${process.env.GITHUB_REPOSITORY_OWNER ?? "dalexanco"}.github.io/${
    process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "rss-pipeline"
  }/feeds`;

async function main() {
  console.log("🚀 RSS Pipeline starting…");

  // 1. Fetch all sources in parallel
  const results = await Promise.allSettled(
    config.sources.map((s) => fetchSource(config.rsshub.baseUrl, s))
  );

  const allItems = results.flatMap((r) =>
    r.status === "fulfilled" ? r.value : []
  );

  console.log(`\n📦 Total : ${allItems.length} items récupérés`);

  // 2. Generate XML files
  await mkdir("./dist/feeds", { recursive: true });

  for (const output of config.outputs) {
    const xml = generateFeed(allItems, output, PAGES_URL);
    await writeFile(`./dist/feeds/${output.filename}`, xml, "utf-8");
    console.log(`✓ dist/feeds/${output.filename} généré`);
  }

  // 3. Generate minimal HTML index
  const index = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>RSS Feeds — dalexanco</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 2rem auto; padding: 0 1rem; }
    h1 { font-size: 1.5rem; }
    ul { list-style: none; padding: 0; }
    li { margin: 0.5rem 0; }
    a { color: #0070f3; text-decoration: none; font-size: 1.1rem; }
    a:hover { text-decoration: underline; }
    small { color: #666; }
  </style>
</head>
<body>
  <h1>📡 RSS Feeds</h1>
  <ul>
    ${config.outputs
      .map(
        (o) =>
          `<li>
      <a href="feeds/${o.filename}">📄 ${o.title}</a>
      <br><small>${o.description}</small>
    </li>`
      )
      .join("\n    ")}
  </ul>
  <p><small>Généré le ${new Date().toLocaleString("fr-FR")}</small></p>
</body>
</html>`;

  await writeFile("./dist/index.html", index, "utf-8");
  console.log("✓ dist/index.html généré");
  console.log("\n✅ Pipeline terminé");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
