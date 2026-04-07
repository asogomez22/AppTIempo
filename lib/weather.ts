export type LocationOption = {
  name: string;
  label: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  timezone?: string;
};

export type ForecastSnapshot = {
  location: LocationOption;
  current: {
    time: string;
    temperature: number;
    humidity: number;
    apparentTemperature: number;
    windSpeed: number;
    weatherCode: number;
  };
  hourly: Array<{
    time: string;
    temperature: number;
    weatherCode: number;
  }>;
  daily: Array<{
    date: string;
    weatherCode: number;
    maxTemperature: number;
    minTemperature: number;
  }>;
};

type GeocodingResult = {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
};

type GeocodingResponse = {
  results?: GeocodingResult[];
};

type ForecastResponse = {
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
};

export const DEFAULT_LOCATION: LocationOption = {
  name: "Madrid",
  label: "Madrid, Espana",
  latitude: 40.4168,
  longitude: -3.7038,
  country: "Espana",
  timezone: "Europe/Madrid",
};

const WEATHER_LABELS: Record<number, string> = {
  0: "Cielo despejado",
  1: "Mayormente despejado",
  2: "Intervalos nubosos",
  3: "Cubierto",
  45: "Niebla",
  48: "Niebla con escarcha",
  51: "Llovizna ligera",
  53: "Llovizna moderada",
  55: "Llovizna intensa",
  56: "Llovizna helada ligera",
  57: "Llovizna helada intensa",
  61: "Lluvia ligera",
  63: "Lluvia moderada",
  65: "Lluvia intensa",
  66: "Lluvia helada ligera",
  67: "Lluvia helada intensa",
  71: "Nieve ligera",
  73: "Nieve moderada",
  75: "Nieve intensa",
  77: "Granizo fino",
  80: "Chubascos ligeros",
  81: "Chubascos moderados",
  82: "Chubascos intensos",
  85: "Nevadas ligeras",
  86: "Nevadas intensas",
  95: "Tormenta",
  96: "Tormenta con granizo ligero",
  99: "Tormenta con granizo fuerte",
};

function buildLocationLabel(result: GeocodingResult) {
  return [result.name, result.admin1, result.country]
    .filter(Boolean)
    .join(", ");
}

export function getWeatherLabel(code: number) {
  return WEATHER_LABELS[code] ?? "Tiempo variable";
}

export function formatHourLabel(timestamp: string) {
  const [, hour = "--:--"] = timestamp.split("T");
  return hour.slice(0, 5);
}

export function formatTimestampLabel(timestamp: string) {
  const [day = "", hour = "--:--"] = timestamp.split("T");
  const safeDate = new Date(`${day}T12:00:00`);

  return `${new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(safeDate)} - ${hour.slice(0, 5)}`;
}

export function formatDayLabel(day: string) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${day}T12:00:00`));
}

export async function searchLocations(query: string, signal?: AbortSignal) {
  const params = new URLSearchParams({
    name: query,
    count: "6",
    language: "es",
    format: "json",
  });

  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`,
    {
      signal,
    },
  );

  if (!response.ok) {
    throw new Error("Location lookup failed");
  }

  const data = (await response.json()) as GeocodingResponse;

  return (data.results ?? []).map((result) => ({
    name: result.name,
    label: buildLocationLabel(result),
    latitude: result.latitude,
    longitude: result.longitude,
    country: result.country,
    admin1: result.admin1,
    timezone: result.timezone,
  }));
}

export async function getForecast(
  location: LocationOption,
): Promise<ForecastSnapshot> {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code",
    hourly: "temperature_2m,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    forecast_days: "3",
    timezone: "auto",
  });

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Forecast lookup failed");
  }

  const data = (await response.json()) as ForecastResponse;
  const currentHourIndex = data.hourly.time.findIndex(
    (entry) => entry >= data.current.time,
  );
  const hourlyStartIndex = currentHourIndex >= 0 ? currentHourIndex : 0;

  return {
    location: {
      ...location,
      timezone: data.timezone,
      label: location.label || location.name,
    },
    current: {
      time: data.current.time,
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      apparentTemperature: data.current.apparent_temperature,
      windSpeed: data.current.wind_speed_10m,
      weatherCode: data.current.weather_code,
    },
    hourly: data.hourly.time
      .slice(hourlyStartIndex, hourlyStartIndex + 6)
      .map((time, index) => ({
        time,
        temperature: data.hourly.temperature_2m[hourlyStartIndex + index],
        weatherCode: data.hourly.weather_code[hourlyStartIndex + index],
      })),
    daily: data.daily.time.slice(0, 3).map((date, index) => ({
      date,
      weatherCode: data.daily.weather_code[index],
      maxTemperature: data.daily.temperature_2m_max[index],
      minTemperature: data.daily.temperature_2m_min[index],
    })),
  };
}
