import { CityOption, PetWeatherAdvice, WeatherData } from '../../domain/models/weather';

export const PERU_CITIES: CityOption[] = [
  { id: 'lima', name: 'Lima', latitude: -12.0464, longitude: -77.0428 },
  { id: 'arequipa', name: 'Arequipa', latitude: -16.409, longitude: -71.5375 },
  { id: 'trujillo', name: 'Trujillo', latitude: -8.1116, longitude: -79.0287 },
  { id: 'cusco', name: 'Cusco', latitude: -13.5319, longitude: -71.9675 },
  { id: 'piura', name: 'Piura', latitude: -5.1945, longitude: -80.6328 },
  { id: 'chiclayo', name: 'Chiclayo', latitude: -6.7714, longitude: -79.8409 },
];

export interface WeatherConditionMeta {
  label: string;
  icon: string;
  isRainy: boolean;
  isStorm: boolean;
}

export function getWeatherConditionMeta(weatherCode: number, isDay: boolean): WeatherConditionMeta {
  if (weatherCode === 0) {
    return {
      label: 'Despejado',
      icon: isDay ? 'sunny-outline' : 'moon-outline',
      isRainy: false,
      isStorm: false,
    };
  }
  if (weatherCode >= 1 && weatherCode <= 3) {
    return {
      label: weatherCode === 3 ? 'Nublado' : 'Parcialmente nublado',
      icon: weatherCode === 3 ? 'cloudy-outline' : isDay ? 'partly-sunny-outline' : 'cloudy-night-outline',
      isRainy: false,
      isStorm: false,
    };
  }
  if (weatherCode === 45 || weatherCode === 48) {
    return {
      label: 'Neblina',
      icon: 'cloud-outline',
      isRainy: false,
      isStorm: false,
    };
  }
  if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) {
    return {
      label: weatherCode <= 55 ? 'Llovizna' : 'Lluvia',
      icon: 'rainy-outline',
      isRainy: true,
      isStorm: false,
    };
  }
  if (weatherCode >= 71 && weatherCode <= 77) {
    return {
      label: 'Nieve o granizo',
      icon: 'snow-outline',
      isRainy: true,
      isStorm: false,
    };
  }
  if (weatherCode >= 95 && weatherCode <= 99) {
    return {
      label: 'Tormenta eléctrica',
      icon: 'thunderstorm-outline',
      isRainy: true,
      isStorm: true,
    };
  }
  return {
    label: 'Variable',
    icon: isDay ? 'partly-sunny-outline' : 'cloudy-night-outline',
    isRainy: false,
    isStorm: false,
  };
}

export function getPetWeatherAdvice(weather: WeatherData): PetWeatherAdvice {
  const meta = getWeatherConditionMeta(weather.weatherCode, weather.isDay);
  const { temperatureC, uvIndexMax, isDay, humidityPercent } = weather;

  if (meta.isStorm || temperatureC >= 30 || (isDay && uvIndexMax >= 9 && temperatureC >= 26)) {
    return {
      level: 'ALERTA',
      conditionLabel: meta.label,
      icon: meta.icon,
      badgeLabel: 'Precaución alta',
      walkAdvice: meta.isStorm
        ? 'Evita paseos al aire libre durante la tormenta y mantén a la mascota en un espacio tranquilo y seguro.'
        : 'Evita pasear entre 10:00 y 16:00 por asfalto caliente y radiación UV alta. Lleva agua fresca y revisa sus almohadillas.',
      groomingAdvice: meta.isStorm
        ? 'Si acude a baño, programa traslado protegido y mantén ambiente cálido durante el secado.'
        : 'Ideal baño refrescante con agua templada y cepillado ligero para aliviar el calor; evita esquilar al ras si estará al sol.',
    };
  }

  if (meta.isRainy || temperatureC >= 26 || temperatureC <= 13 || (isDay && uvIndexMax >= 7)) {
    const walkAdvice = meta.isRainy
      ? 'Usa impermeable y seca bien patas, orejas y abdomen al regresar para prevenir hongos o resfriados.'
      : temperatureC <= 13
        ? 'Abriga a razas pequeñas, cachorros o seniors en paseos cortos y evita corrientes frías.'
        : 'Prefiere horarios frescos por la mañana o al atardecer con hidratación constante durante el recorrido.';

    const groomingAdvice =
      meta.isRainy || temperatureC <= 13 || humidityPercent >= 80
        ? 'Asegura secado completo con aire tibio tras el baño, especialmente en pliegues y pelaje denso.'
        : 'Buen momento para baño hidratante y limpieza de almohadillas antes de salir.';

    return {
      level: 'PRECAUCION',
      conditionLabel: meta.label,
      icon: meta.icon,
      badgeLabel: 'Cuidado moderado',
      walkAdvice,
      groomingAdvice,
    };
  }

  return {
    level: 'OPTIMO',
    conditionLabel: meta.label,
    icon: meta.icon,
    badgeLabel: 'Ideal para paseo',
    walkAdvice:
      'Temperatura agradable para paseos activos y juegos al aire libre con pausas normales de agua.',
    groomingAdvice:
      'Condiciones favorables para baño, peluquería y corte de uñas sin estrés térmico al salir.',
  };
}
