import WeatherDashboard from "@/components/weather-dashboard";
import {
  DEFAULT_LOCATION,
  getForecastRemote,
  type ForecastSnapshot,
} from "@/lib/weather";

export const dynamic = "force-dynamic";

export default async function Home() {
  let initialForecast: ForecastSnapshot | null = null;

  try {
    initialForecast = await getForecastRemote(DEFAULT_LOCATION);
  } catch {
    initialForecast = null;
  }

  return <WeatherDashboard initialForecast={initialForecast} />;
}
