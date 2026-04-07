import { NextResponse } from "next/server";
import { getForecastRemote, type LocationOption } from "@/lib/weather";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latitude = Number(searchParams.get("latitude"));
  const longitude = Number(searchParams.get("longitude"));
  const name = searchParams.get("name")?.trim();

  if (!name || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return NextResponse.json(
      { message: "Missing location parameters." },
      { status: 400 },
    );
  }

  const location: LocationOption = {
    name,
    label: searchParams.get("label")?.trim() || name,
    latitude,
    longitude,
    country: searchParams.get("country")?.trim() || undefined,
    admin1: searchParams.get("admin1")?.trim() || undefined,
    timezone: searchParams.get("timezone")?.trim() || undefined,
  };

  try {
    const forecast = await getForecastRemote(location);
    return NextResponse.json(forecast);
  } catch {
    return NextResponse.json(
      { message: "Unable to load forecast." },
      { status: 502 },
    );
  }
}
