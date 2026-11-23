import AsyncStorage from '@react-native-async-storage/async-storage';
import { CityOption, WeatherData } from '../../domain/models/weather';

const WEATHER_CACHE_KEY = 'amipets_weather_cache_v1';
const WEATHER_CITY_KEY = 'amipets_weather_city_v1';
const REQUEST_TIMEOUT_MS = 10_000;

interface OpenMeteoResponse {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    is_day?: number;
  };
  daily?: {
    uv_index_max?: number[];
  };
}

export async function loadSavedCityId(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(WEATHER_CITY_KEY);
    return saved || 'lima';
  } catch {
    return 'lima';
  }
}

export async function saveSelectedCityId(cityId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(WEATHER_CITY_KEY, cityId);
  } catch {
    // Ignore AsyncStorage write errors
  }
}

async function readWeatherCacheMap(): Promise<Record<string, WeatherData>> {
  try {
    const raw = await AsyncStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, WeatherData>) : {};
  } catch {
    return {};
  }
}

export async function getCachedWeather(cityId: string): Promise<WeatherData | null> {
  const map = await readWeatherCacheMap();
  const cached = map[cityId];
  return cached ? { ...cached, fromCache: true } : null;
}

export async function fetchCityWeather(city: CityOption): Promise<WeatherData> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}` +
    '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day' +
    '&daily=uv_index_max&timezone=America%2FLima&forecast_days=1';

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`No se pudo consultar el clima (código ${response.status}).`);
    }

    const payload = (await response.json()) as OpenMeteoResponse;
    const current = payload.current;
    if (!current || typeof current.temperature_2m !== 'number') {
      throw new Error('La respuesta del clima llegó incompleta.');
    }

    const weather: WeatherData = {
      cityId: city.id,
      cityName: city.name,
      temperatureC: Math.round(current.temperature_2m),
      apparentTemperatureC: Math.round(current.apparent_temperature ?? current.temperature_2m),
      humidityPercent: Math.round(current.relative_humidity_2m ?? 0),
      windSpeedKmh: Math.round(current.wind_speed_10m ?? 0),
      weatherCode: current.weather_code ?? 0,
      isDay: current.is_day !== 0,
      uvIndexMax: Math.round((payload.daily?.uv_index_max?.[0] ?? 0) * 10) / 10,
      fetchedAt: new Date().toISOString(),
      fromCache: false,
    };

    try {
      const cacheMap = await readWeatherCacheMap();
      cacheMap[city.id] = weather;
      await AsyncStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cacheMap));
    } catch {
      // Ignore AsyncStorage write errors
    }

    return weather;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado al consultar el clima.');
    }
    throw error instanceof Error ? error : new Error('No se pudo obtener el clima actual.');
  } finally {
    clearTimeout(timeout);
  }
}
