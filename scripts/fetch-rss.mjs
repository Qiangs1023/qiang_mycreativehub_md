import { XMLParser } from "fast-xml-parser";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, "..");

const RSS_URL = "https://ai.hubtoday.app/blog/index.xml";
const NEWS_DIR = resolve(rootDir, "src/content/news");
const OUTPUT_PATH = resolve(NEWS_DIR, "rss-data.json");

async function fetchRss() {
  console.log(`Fetching RSS feed from: ${RSS_URL}`);

  try {
    const response = await fetch(RSS_URL, {
      headers: {
        "User-Agent": "MyCreativeHub/1.0 (+https://github.com/Qiangs1023/qiang_mycreativehub_md)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.status} ${response.statusText}`);
    }

    const xml = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });

    const parsed = parser.parse(xml);
    const channel = parsed?.rss?.channel;

    if (!channel) {
      throw new Error("Invalid RSS feed: missing channel element");
    }

    const feedTitle = channel.title ?? "AI News";
    const feedDescription = channel.description ?? "Latest AI news and updates";

    let items = [];

    if (Array.isArray(channel.item)) {
      items = channel.item;
    } else if (channel.item) {
      items = [channel.item];
    }

    const newsItems = items.map((item, index) => {
      const rawDate = item.pubDate ?? item["dc:creator"] ?? "";
      const date = rawDate ? new Date(rawDate) : new Date();
      const isValidDate = !isNaN(date.getTime());

      return {
        id: `news-${index}-${Date.now()}`,
        title: item.title ?? "Untitled",
        link: item.link ?? "#",
        description: item.description ?? item["content:encoded"] ?? "",
        pubDate: isValidDate ? date.toISOString() : new Date().toISOString(),
        pubDateFormatted: isValidDate
          ? date.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })
          : "",
        author: item.author ?? item["dc:creator"] ?? "",
        categories: Array.isArray(item.category)
          ? item.category
          : item.category
            ? [item.category]
            : [],
      };
    });

    newsItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    const output = {
      title: feedTitle,
      description: feedDescription,
      feedUrl: RSS_URL,
      lastFetched: new Date().toISOString(),
      count: newsItems.length,
      items: newsItems,
    };

    mkdirSync(NEWS_DIR, { recursive: true });
    writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), "utf-8");

    console.log(`✓ Fetched ${newsItems.length} items from RSS feed`);
    console.log(`✓ Saved to: ${OUTPUT_PATH}`);
    console.log(`✓ Last updated: ${output.lastFetched}`);
  } catch (err) {
    if (existsSync(OUTPUT_PATH)) {
      console.warn(`⚠ RSS fetch failed, using existing cache at: ${OUTPUT_PATH}`);
      return;
    }
    console.warn(`⚠ RSS fetch failed and no cache exists, skipping: ${err.message}`);
  }
}

fetchRss();