import { NextRequest, NextResponse } from "next/server";

const ALPHA_VANTAGE_BASE = "https://www.alphavantage.co/query";

export async function GET(request: NextRequest) {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Alpha Vantage API key not configured" }, { status: 503 });
  }

  const topics = request.nextUrl.searchParams.get("topics");
  const tickers = request.nextUrl.searchParams.get("tickers");

  if (!topics && !tickers) {
    return NextResponse.json({ error: "topics or tickers parameter is required" }, { status: 400 });
  }

  const params = new URLSearchParams({
    function: "NEWS_SENTIMENT",
    apikey: apiKey,
    limit: "50",
  });

  if (topics) params.set("topics", topics);
  if (tickers) params.set("tickers", tickers);

  try {
    const response = await fetch(`${ALPHA_VANTAGE_BASE}?${params}`);

    if (!response.ok) {
      return NextResponse.json({ error: "Alpha Vantage API error" }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch sentiment data" }, { status: 502 });
  }
}
