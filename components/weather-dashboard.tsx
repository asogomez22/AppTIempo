"use client";

import type { FormEvent } from "react";
import { useDeferredValue, useEffect, useState, useTransition } from "react";
import {
  DEFAULT_LOCATION,
  formatDayLabel,
  formatHourLabel,
  formatTimestampLabel,
  getForecast,
  getWeatherLabel,
  searchLocations,
  type ForecastSnapshot,
  type LocationOption,
} from "@/lib/weather";

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-[28px] border border-white/12 bg-slate-950/55 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.2)] backdrop-blur">
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-200/70">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </article>
  );
}

export default function WeatherDashboard() {
  const [query, setQuery] = useState(DEFAULT_LOCATION.name);
  const [forecast, setForecast] = useState<ForecastSnapshot | null>(null);
  const [suggestions, setSuggestions] = useState<LocationOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const deferredQuery = useDeferredValue(query.trim());
  const busy = isLoading || isPending;

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      setIsLoading(true);
      setError(null);

      try {
        const initialForecast = await getForecast(DEFAULT_LOCATION);

        if (!active) {
          return;
        }

        startTransition(() => {
          setForecast(initialForecast);
          setSuggestions([]);
        });
      } catch {
        if (active) {
          setError("No he podido cargar la prevision inicial.");
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
  }, [startTransition]);

  useEffect(() => {
    if (deferredQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    if (
      forecast &&
      deferredQuery.toLowerCase() === forecast.location.name.toLowerCase()
    ) {
      setSuggestions([]);
      return;
    }

    let active = true;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const nextSuggestions = await searchLocations(
          deferredQuery,
          controller.signal,
        );

        if (active) {
          setSuggestions(nextSuggestions);
        }
      } catch (lookupError) {
        if (
          active &&
          !(
            lookupError instanceof DOMException &&
            lookupError.name === "AbortError"
          )
        ) {
          setSuggestions([]);
        }
      }
    }, 250);

    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [deferredQuery, forecast]);

  async function loadLocation(location: LocationOption) {
    setIsLoading(true);
    setError(null);

    try {
      const nextForecast = await getForecast(location);

      startTransition(() => {
        setForecast(nextForecast);
        setQuery(nextForecast.location.name);
        setSuggestions([]);
      });
    } catch {
      setError("No he podido consultar el tiempo para esa ubicacion.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanQuery = query.trim();

    if (!cleanQuery) {
      setError("Escribe una ciudad para lanzar la busqueda.");
      return;
    }

    const directMatch =
      suggestions.find(
        (option) => option.name.toLowerCase() === cleanQuery.toLowerCase(),
      ) ?? suggestions[0];

    if (directMatch) {
      await loadLocation(directMatch);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await searchLocations(cleanQuery);

      if (!results.length) {
        setError("No he encontrado ninguna ciudad con ese nombre.");
        return;
      }

      await loadLocation(results[0]);
    } catch {
      setError("La busqueda ha fallado. Vuelve a intentarlo.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Tu navegador no permite geolocalizacion.");
      return;
    }

    setError(null);
    setIsLoading(true);

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
        setError("No he podido leer tu ubicacion actual.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  }

  const headline = forecast
    ? getWeatherLabel(forecast.current.weatherCode)
    : "Cargando";

  return (
    <main className="relative isolate overflow-hidden px-5 py-8 text-slate-100 sm:px-8 lg:px-10 lg:py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-cyan-400/18 blur-[120px]" />
        <div className="absolute -left-24 top-40 h-72 w-72 rounded-full bg-blue-500/16 blur-[120px]" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-emerald-400/12 blur-[140px]" />
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
          <article className="rounded-[36px] border border-white/12 bg-slate-950/55 p-6 shadow-[0_25px_90px_rgba(2,132,199,0.18)] backdrop-blur md:p-8">
            <div className="flex flex-wrap gap-2">
              {["Next.js 16", "Docker", "GitHub Actions", "Puerto 1234"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full border border-sky-300/25 bg-sky-400/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.24em] text-sky-100/90"
                  >
                    {item}
                  </span>
                ),
              )}
            </div>

            <div className="mt-8 max-w-3xl">
              <p className="font-mono text-sm uppercase tracking-[0.35em] text-sky-200/70">
                Proyecto para CI/CD real
              </p>
              <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                AppTiempo lista para desplegarse sola en tu VPS.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Busqueda de ciudades, uso de tu ubicacion, prevision por horas y
                despliegue preparado con Docker + GitHub Actions para publicar
                la app por el puerto 1234.
              </p>
            </div>

            <form className="mt-8 flex flex-col gap-3" onSubmit={handleSearch}>
              <label
                htmlFor="city-search"
                className="font-mono text-xs uppercase tracking-[0.3em] text-slate-300"
              >
                Buscar ciudad
              </label>
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  id="city-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ejemplo: Madrid, Valencia, Berlin..."
                  className="min-h-14 flex-1 rounded-full border border-white/12 bg-white/8 px-5 text-base text-white outline-none transition focus:border-sky-300/60 focus:bg-white/12"
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={busy}
                    className="min-h-14 rounded-full bg-cyan-300 px-6 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-cyan-100"
                  >
                    {busy ? "Buscando..." : "Buscar"}
                  </button>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={busy}
                    className="min-h-14 rounded-full border border-white/16 bg-white/6 px-6 font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Mi ubicacion
                  </button>
                </div>
              </div>
            </form>

            {suggestions.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {suggestions.map((option) => (
                  <button
                    key={`${option.latitude}-${option.longitude}-${option.label}`}
                    type="button"
                    onClick={() => {
                      setQuery(option.name);
                      void loadLocation(option);
                    }}
                    className="rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm text-slate-100 transition hover:border-sky-300/40 hover:bg-sky-300/10"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <MetricCard label="Estado" value={headline} />
              <MetricCard
                label="Actualizado"
                value={
                  forecast ? formatTimestampLabel(forecast.current.time) : "--:--"
                }
              />
              <MetricCard label="Pipeline" value="CI -> GHCR -> VPS" />
            </div>
          </article>

          <article className="rounded-[36px] border border-white/12 bg-gradient-to-br from-slate-950/75 via-sky-950/55 to-cyan-500/18 p-6 shadow-[0_25px_90px_rgba(14,165,233,0.18)] backdrop-blur md:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-sky-100/70">
              Resumen actual
            </p>
            <div className="mt-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                  {forecast?.location.label ?? "Cargando ciudad"}
                </h2>
                <p className="mt-2 text-sm uppercase tracking-[0.3em] text-slate-300/80">
                  {forecast ? headline : "Consultando datos"}
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/8 px-4 py-2 font-mono text-xs uppercase tracking-[0.24em] text-sky-100">
                Online
              </div>
            </div>

            <div className="mt-10 flex items-end gap-4">
              <p className="text-7xl font-semibold tracking-tight text-white">
                {forecast ? `${Math.round(forecast.current.temperature)}C` : "--"}
              </p>
              <div className="pb-2 text-slate-200">
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-300/70">
                  Sensacion termica
                </p>
                <p className="mt-2 text-xl font-medium">
                  {forecast
                    ? `${Math.round(forecast.current.apparentTemperature)}C`
                    : "--"}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <MetricCard
                label="Humedad"
                value={
                  forecast ? `${Math.round(forecast.current.humidity)}%` : "--"
                }
              />
              <MetricCard
                label="Viento"
                value={
                  forecast
                    ? `${Math.round(forecast.current.windSpeed)} km/h`
                    : "--"
                }
              />
              <MetricCard
                label="Coords"
                value={
                  forecast
                    ? `${forecast.location.latitude.toFixed(1)}, ${forecast.location.longitude.toFixed(1)}`
                    : "--"
                }
              />
            </div>

            <div className="mt-8 rounded-[28px] border border-white/12 bg-white/6 p-5">
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-100/70">
                Despliegue preparado
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                El workflow construye imagen Docker, la publica en GHCR y por
                SSH actualiza el contenedor del VPS con `docker run -p
                1234:1234`.
              </p>
            </div>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
          <article className="rounded-[36px] border border-white/12 bg-slate-950/55 p-6 shadow-[0_25px_90px_rgba(15,23,42,0.2)] backdrop-blur md:p-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-slate-300/75">
                  Proximas horas
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-white">
                  Evolucion del dia
                </h3>
              </div>
              {error ? (
                <p className="rounded-full border border-rose-300/20 bg-rose-500/12 px-4 py-2 text-sm text-rose-100">
                  {error}
                </p>
              ) : (
                <p className="rounded-full border border-emerald-300/20 bg-emerald-500/12 px-4 py-2 text-sm text-emerald-100">
                  {busy ? "Actualizando datos" : "Datos listos"}
                </p>
              )}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {forecast?.hourly.map((entry) => (
                <article
                  key={entry.time}
                  className="rounded-[28px] border border-white/12 bg-white/6 p-5"
                >
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-300/70">
                    {formatHourLabel(entry.time)}
                  </p>
                  <p className="mt-4 text-4xl font-semibold text-white">
                    {Math.round(entry.temperature)}C
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {getWeatherLabel(entry.weatherCode)}
                  </p>
                </article>
              )) ?? (
                <article className="rounded-[28px] border border-dashed border-white/16 bg-white/4 p-5 text-slate-300">
                  Esperando datos horarios...
                </article>
              )}
            </div>
          </article>

          <article className="rounded-[36px] border border-white/12 bg-slate-950/55 p-6 shadow-[0_25px_90px_rgba(15,23,42,0.2)] backdrop-blur md:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-slate-300/75">
              Proximos dias
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-white">
              Mini prevision
            </h3>

            <div className="mt-8 space-y-3">
              {forecast?.daily.map((entry) => (
                <article
                  key={entry.date}
                  className="rounded-[28px] border border-white/12 bg-white/6 p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-300/70">
                        {formatDayLabel(entry.date)}
                      </p>
                      <p className="mt-2 text-base text-white">
                        {getWeatherLabel(entry.weatherCode)}
                      </p>
                    </div>
                    <div className="text-right text-white">
                      <p className="text-xl font-semibold">
                        {Math.round(entry.maxTemperature)}C
                      </p>
                      <p className="text-sm text-slate-300">
                        min {Math.round(entry.minTemperature)}C
                      </p>
                    </div>
                  </div>
                </article>
              )) ?? (
                <article className="rounded-[28px] border border-dashed border-white/16 bg-white/4 p-5 text-slate-300">
                  Esperando prevision diaria...
                </article>
              )}
            </div>

            <div className="mt-8 rounded-[28px] border border-white/12 bg-gradient-to-br from-cyan-400/14 to-emerald-400/10 p-5">
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-100/80">
                Checklist para la defensa
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-100">
                <li>1. Ensena la app funcionando en http://tu-ip:1234</li>
                <li>2. Abre los workflows de CI y deploy</li>
                <li>3. Haz un commit, push y espera el redeploy automatico</li>
                <li>4. Verifica el contenedor con docker ps y docker logs</li>
              </ul>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
