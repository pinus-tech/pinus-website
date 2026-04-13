import { NextResponse } from "next/server";

/**
 * Indicative SGD → IDR using a public rates API (server-side to avoid CORS).
 * Data is provided by ExchangeRate-API via open.er-api.com — not an OCBC/Google endpoint.
 */
export async function GET() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/SGD", {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Could not load exchange rates" },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      result?: string;
      base_code?: string;
      rates?: Record<string, number>;
      time_last_update_utc?: string;
      time_next_update_utc?: string;
      provider?: string;
      documentation?: string;
      terms_of_use?: string;
    };

    if (data.result !== "success") {
      return NextResponse.json(
        { error: "Unexpected rate response" },
        { status: 502 }
      );
    }

    const idrPerSgd = data.rates?.IDR;
    if (typeof idrPerSgd !== "number" || !Number.isFinite(idrPerSgd)) {
      return NextResponse.json(
        { error: "IDR rate unavailable" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      idrPerSgd,
      base: data.base_code ?? "SGD",
      quote: "IDR",
      updatedAt: data.time_last_update_utc ?? null,
      nextUpdateAt: data.time_next_update_utc ?? null,
      providerUrl: data.provider ?? "https://www.exchangerate-api.com",
      documentationUrl: data.documentation ?? null,
      termsUrl: data.terms_of_use ?? null,
      sourceLabel:
        "ExchangeRate-API (open.er-api.com) — indicative mid-market style rates",
    });
  } catch (e) {
    console.error("fx/sgd-idr:", e);
    return NextResponse.json(
      { error: "Failed to load exchange rates" },
      { status: 500 }
    );
  }
}
