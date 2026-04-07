import { NextResponse } from "next/server";
import { searchLocationsRemote } from "@/lib/weather";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();

  if (!query) {
    return NextResponse.json(
      { message: "Missing query parameter." },
      { status: 400 },
    );
  }

  try {
    const results = await searchLocationsRemote(query);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json(
      { message: "Unable to search locations." },
      { status: 502 },
    );
  }
}
