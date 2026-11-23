export interface CityOption {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export type WeatherAdviceLevel = 'OPTIMO' | 'PRECAUCION' | 'ALERTA';

export interface WeatherData {
  cityId: string;
  cityName: string;
  temperatureC: number;
  apparentTemperatureC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  weatherCode: number;
  isDay: boolean;
  uvIndexMax: number;
  fetchedAt: string;
  fromCache?: boolean;
}

export interface PetWeatherAdvice {
  level: WeatherAdviceLevel;
  conditionLabel: string;
  icon: string;
  badgeLabel: string;
  walkAdvice: string;
  groomingAdvice: string;
}
