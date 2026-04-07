"use client";

import type { FormEvent, SVGProps } from "react";
import { useEffect, useState } from "react";
import {
  DEFAULT_LOCATION,
  formatTimestampLabel,
  getWeatherLabel,
  type ForecastSnapshot,
  type LocationOption,
} from "@/lib/weather";

function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <circle cx="32" cy="32" r="12" className="fill-amber-300" />
      <path
        d="M32 6v8M32 50v8M6 32h8M50 32h8M13.6 13.6l5.7 5.7M44.7 44.7l5.7 5.7M50.4 13.6l-5.7 5.7M19.3 44.7l-5.7 5.7"
        className="stroke-amber-200"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloudIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <path
        d="M22 48h22c7.7 0 14-5.8 14-13s-6.3-13-14-13c-1.1 0-2.2.1-3.2.4C38.4 15.6 32.8 12 26.5 12c-8.4 0-15.3 6.2-16.3 14.3C5.5 28.1 2 32.3 2 37c0 6.1 4.9 11 11 11h9Z"
        className="fill-slate-200"
      />
    </svg>
  );
}

function RainIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <path
        d="M22 38h22c7.7 0 14-5.8 14-13s-6.3-13-14-13c-1.1 0-2.2.1-3.2.4C38.4 5.6 32.8 2 26.5 2c-8.4 0-15.3 6.2-16.3 14.3C5.5 18.1 2 22.3 2 27c0 6.1 4.9 11 11 11h9Z"
        className="fill-slate-200"
      />
      <path
        d="M22 45l-3 8M34 45l-3 8M46 45l-3 8"
        className="stroke-sky-300"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StormIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <path
        d="M22 38h22c7.7 0 14-5.8 14-13s-6.3-13-14-13c-1.1 0-2.2.1-3.2.4C38.4 5.6 32.8 2 26.5 2c-8.4 0-15.3 6.2-16.3 14.3C5.5 18.1 2 22.3 2 27c0 6.1 4.9 11 11 11h9Z"
        className="fill-slate-200"
      />
      <path
        d="M34 41 26 54h8l-4 10 12-16h-8l4-7Z"
        className="fill-amber-300"
      />
    </svg>
  );
}

function SnowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <path
        d="M22 38h22c7.7 0 14-5.8 14-13s-6.3-13-14-13c-1.1 0-2.2.1-3.2.4C38.4 5.6 32.8 2 26.5 2c-8.4 0-15.3 6.2-16.3 14.3C5.5 18.1 2 22.3 2 27c0 6.1 4.9 11 11 11h9Z"
        className="fill-slate-200"
      />
      <path
        d="M24 46v12M18 52h12M19.8 47.8l8.4 8.4M28.2 47.8l-8.4 8.4M44 46v12M38 52h12M39.8 47.8l8.4 8.4M48.2 47.8l-8.4 8.4"
        className="stroke-cyan-200"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FogIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <path
        d="M16 24h32M10 34h44M16 44h32"
        className="stroke-slate-200"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WeatherIcon({ code }: { code: number }) {
  const className = "h-28 w-28 drop-shadow-[0_12px_30px_rgba(15,23,42,0.35)]";

  if (code === 0 || code === 1) {
    return <SunIcon className={className} />;
  }

  if (code === 45 || code === 48) {
    return <FogIcon className={className} />;
  }

  if (code >= 95) {
    return <StormIcon className={className} />;
  }

  if (code >= 71 && code <= 86) {
    return <SnowIcon className={className} />;
  }

  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return <RainIcon className={className} />;
  }

  return <CloudIcon className={className} />;
}

function InfoPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-300">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

async function searchLocations(query: string) {
  const params = new URLSearchParams({ query });
  const response = await fetch(`/api/weather/search?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Location lookup failed");
  }

  return (await response.json()) as LocationOption[];
}

async function getForecast(location: LocationOption) {
  const params = new URLSearchParams({
    name: location.name,
    label: location.label,
    latitude: String(location.latitude),
    longitude: String(location.longitude),
  });

  if (location.country) {
    params.set("country", location.country);
  }

  if (location.admin1) {
    params.set("admin1", location.admin1);
  }

  if (location.timezone) {
    params.set("timezone", location.timezone);
  }

  const response = await fetch(`/api/weather/forecast?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Forecast lookup failed");
  }

  return (await response.json()) as ForecastSnapshot;
}

export default function WeatherDashboard({
  initialForecast,
}: {
  initialForecast: ForecastSnapshot | null;
}) {
  const [query, setQuery] = useState(
    initialForecast?.location.name ?? DEFAULT_LOCATION.name,
  );
  const [forecast, setForecast] = useState<ForecastSnapshot | null>(
    initialForecast,
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialForecast) {
      return;
    }

    let active = true;

    async function bootstrap() {
      setIsLoading(true);

      try {
        const nextForecast = await getForecast(DEFAULT_LOCATION);

        if (active) {
          setForecast(nextForecast);
          setError(null);
        }
      } catch {
        if (active) {
          setError("No he podido cargar el tiempo ahora mismo.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, [initialForecast]);

  async function loadLocation(location: LocationOption) {
    setIsLoading(true);
    setError(null);

    try {
      const nextForecast = await getForecast(location);
      setForecast(nextForecast);
      setQuery(nextForecast.location.name);
    } catch {
      setError("No he podido consultar esa ciudad.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanQuery = query.trim();

    if (!cleanQuery) {
      setError("Escribe una ciudad.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await searchLocations(cleanQuery);

      if (!results.length) {
        setError("No he encontrado esa ciudad.");
        return;
      }

      await loadLocation(results[0]);
    } catch {
      setError("La busqueda ha fallado.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Tu navegador no permite geolocalizacion.");
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void loadLocation({
          name: "Tu ubicacion",
          label: "Tu ubicacion",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setIsLoading(false);
        setError("No he podido leer tu ubicacion.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const weatherCode = forecast?.current.weatherCode ?? 2;
  const title = forecast?.location.label ?? "Cargando ciudad";
  const temperature = forecast
    ? `${Math.round(forecast.current.temperature)}C`
    : "--";
  const description = forecast ? getWeatherLabel(weatherCode) : "Cargando";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 text-slate-100">
      <section className="w-full max-w-md rounded-[36px] border border-white/12 bg-slate-950/70 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.45)] backdrop-blur md:p-8">
        <div className="mx-auto flex w-full max-w-xs flex-col items-center text-center">
          <WeatherIcon code={weatherCode} />

          <p className="mt-6 font-mono text-xs uppercase tracking-[0.32em] text-sky-200/75">
            Widget del tiempo
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {title}
          </h1>
          <p className="mt-2 text-sm text-slate-300">{description}</p>

          <p className="mt-6 text-7xl font-semibold tracking-tight text-white">
            {temperature}
          </p>

          <div className="mt-6 grid w-full grid-cols-2 gap-3">
            <InfoPill
              label="Humedad"
              value={
                forecast ? `${Math.round(forecast.current.humidity)}%` : "--"
              }
            />
            <InfoPill
              label="Viento"
              value={
                forecast
                  ? `${Math.round(forecast.current.windSpeed)} km/h`
                  : "--"
              }
            />
          </div>

          <p className="mt-5 text-sm text-slate-400">
            {forecast ? formatTimestampLabel(forecast.current.time) : "--:--"}
          </p>

          <form className="mt-8 flex w-full flex-col gap-3" onSubmit={handleSearch}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar ciudad"
              className="min-h-12 rounded-full border border-white/12 bg-white/8 px-4 text-white outline-none transition focus:border-sky-300/60 focus:bg-white/12"
            />
            <div className="grid grid-cols-2 gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="min-h-11 rounded-full bg-cyan-300 px-4 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-cyan-100"
              >
                {isLoading ? "Cargando..." : "Buscar"}
              </button>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLoading}
                className="min-h-11 rounded-full border border-white/12 bg-white/6 px-4 font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Mi ubicacion
              </button>
            </div>
          </form>

          {error ? (
            <p className="mt-4 text-sm text-rose-200">{error}</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
