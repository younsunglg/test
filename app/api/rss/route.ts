import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";
import { nanoid } from "nanoid";
import type { NewsItem } from "@/lib/types";

const parser = new Parser({
  timeout: 10000,
  headers: { "User-Agent": "RssDashboard/1.0" },
});

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "url parameter is required" }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }

  try {
    const feed = await parser.parseURL(url);

    const items: NewsItem[] = feed.items.map((item) => ({
      id: item.guid ?? item.link ?? nanoid(),
      sourceId: "",
      sourceName: feed.title ?? "",
      title: item.title ?? "(no title)",
      link: item.link ?? "",
      publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
    }));

    return NextResponse.json({ title: feed.title, items });
  } catch {
    return NextResponse.json({ error: "Failed to fetch or parse RSS feed" }, { status: 502 });
  }
}
