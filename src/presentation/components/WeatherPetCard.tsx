import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPetWeatherAdvice, PERU_CITIES } from '../../application/services/weatherAdviceService';
import { WeatherAdviceLevel, WeatherData } from '../../domain/models/weather';
import {
  fetchCityWeather,
  getCachedWeather,
  loadSavedCityId,
  saveSelectedCityId,
} from '../../infrastructure/services/weatherApiService';
import { colors, common, fonts, radius, spacing } from '../theme';
import { PressableScale } from './PressableScale';

const LEVEL_STYLES: Record<WeatherAdviceLevel, { color: string; background: string }> = {
  OPTIMO: { color: colors.done, background: colors.doneSoft },
  PRECAUCION: { color: colors.pending, background: colors.pendingSoft },
  ALERTA: { color: colors.danger, background: colors.dangerSoft },
};

export function WeatherPetCard() {
  const [cityId, setCityId] = useState<string>('lima');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const activeCityRef = useRef<string>('lima');

  const loadWeather = useCallback(async (targetCityId: string, isManualRefresh = false) => {
    const city = PERU_CITIES.find((c) => c.id === targetCityId) ?? PERU_CITIES[0];
    activeCityRef.current = city.id;

    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const fresh = await fetchCityWeather(city);
      if (activeCityRef.current === city.id) {
        setWeather(fresh);
      }
    } catch (err) {
      const cached = await getCachedWeather(city.id);
      if (activeCityRef.current !== city.id) return;

      if (cached) {
        setWeather(cached);
      } else {
        setWeather(null);
        setError(err instanceof Error ? err.message : 'No se pudo obtener el clima actual.');
      }
    } finally {
      if (activeCityRef.current === city.id) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    loadSavedCityId().then((savedId) => {
      if (!mounted) return;
      const validId = PERU_CITIES.some((c) => c.id === savedId) ? savedId : 'lima';
      setCityId(validId);
      void loadWeather(validId);
    });
    return () => {
      mounted = false;
    };
  }, [loadWeather]);

  const handleSelectCity = (nextCityId: string) => {
    if (nextCityId === cityId && weather && !error) return;
    setCityId(nextCityId);
    void saveSelectedCityId(nextCityId);
    void loadWeather(nextCityId);
  };

  const advice = useMemo(() => (weather ? getPetWeatherAdvice(weather) : null), [weather]);
  const levelStyle = advice ? LEVEL_STYLES[advice.level] : LEVEL_STYLES.OPTIMO;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <View style={styles.headerIconBox}>
            <Ionicons name="partly-sunny-outline" size={18} color={colors.primaryDark} />
          </View>
          <View>
            <Text style={styles.title}>Clima para paseos</Text>
            <Text style={styles.subtitle}>Recomendación clínica en tiempo real</Text>
          </View>
        </View>

        <PressableScale
          onPress={() => void loadWeather(cityId, true)}
          disabled={loading || refreshing}
          style={styles.refreshBtn}
          accessibilityRole="button"
          accessibilityLabel="Actualizar clima"
          testID="weather-refresh"
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="refresh-outline" size={17} color={colors.primaryDark} />
          )}
        </PressableScale>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.citiesRow}
      >
        {PERU_CITIES.map((city) => {
          const selected = city.id === cityId;
          return (
            <PressableScale
              key={city.id}
              onPress={() => handleSelectCity(city.id)}
              style={[styles.cityChip, selected && styles.cityChipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Consultar clima de ${city.name}`}
              testID={`weather-city-${city.id}`}
            >
              <Text style={[styles.cityChipText, selected && styles.cityChipTextActive]}>
                {city.name}
              </Text>
            </PressableScale>
          );
        })}
      </ScrollView>

      {loading && !weather ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.stateText}>Consultando clima actual...</Text>
        </View>
      ) : error && !weather ? (
        <View style={styles.errorBox}>
          <Ionicons name="cloud-offline-outline" size={22} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <PressableScale
            onPress={() => void loadWeather(cityId)}
            style={styles.retryBtn}
            accessibilityRole="button"
            accessibilityLabel="Reintentar consulta de clima"
            testID="weather-retry"
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </PressableScale>
        </View>
      ) : weather && advice ? (
        <View style={styles.content}>
          <View style={styles.topMetricsRow}>
            <View style={styles.tempWrap}>
              <View style={[styles.conditionIconWrap, { backgroundColor: levelStyle.background }]}>
                <Ionicons
                  name={advice.icon as React.ComponentProps<typeof Ionicons>['name']}
                  size={24}
                  color={levelStyle.color}
                />
              </View>
              <View>
                <View style={styles.tempLine}>
                  <Text style={styles.tempValue}>{weather.temperatureC}°C</Text>
                  <Text style={styles.conditionLabel}>{advice.conditionLabel}</Text>
                </View>
                <Text style={styles.subMetric}>
                  Sensación {weather.apparentTemperatureC}°C · {weather.cityName}
                </Text>
              </View>
            </View>

            <View style={[styles.levelBadge, { backgroundColor: levelStyle.background }]}>
              <Text style={[styles.levelBadgeText, { color: levelStyle.color }]}>
                {advice.badgeLabel}
              </Text>
            </View>
          </View>

          <View style={styles.statsStrip}>
            <View style={styles.statPill}>
              <Ionicons name="water-outline" size={13} color={colors.inProgress} />
              <Text style={styles.statText}>Humedad {weather.humidityPercent}%</Text>
            </View>
            <View style={styles.statPill}>
              <Ionicons name="speedometer-outline" size={13} color={colors.primaryDark} />
              <Text style={styles.statText}>Viento {weather.windSpeedKmh} km/h</Text>
            </View>
            <View style={styles.statPill}>
              <Ionicons name="sunny-outline" size={13} color={colors.accent} />
              <Text style={styles.statText}>UV máx. {weather.uvIndexMax}</Text>
            </View>
          </View>

          <View style={styles.adviceBox}>
            <View style={styles.adviceRow}>
              <Ionicons name="paw-outline" size={15} color={colors.primaryDark} style={{ marginTop: 2 }} />
              <Text style={styles.adviceText}>
                <Text style={styles.adviceLead}>Paseo: </Text>
                {advice.walkAdvice}
              </Text>
            </View>
            <View style={styles.adviceRow}>
              <Ionicons name="cut-outline" size={15} color={colors.accent} style={{ marginTop: 2 }} />
              <Text style={styles.adviceText}>
                <Text style={styles.adviceLead}>Baño y grooming: </Text>
                {advice.groomingAdvice}
              </Text>
            </View>
          </View>

          {weather.fromCache && (
            <Text style={styles.offlineHint}>Sin conexión · Últimos datos guardados</Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...common.card,
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.textMuted,
  },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  citiesRow: {
    gap: spacing.xs,
    paddingVertical: 2,
  },
  cityChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cityChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  cityChipText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.textSecondary,
  },
  cityChipTextActive: {
    fontFamily: fonts.semibold,
    color: colors.primaryDark,
  },
  stateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  stateText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.textSecondary,
  },
  errorBox: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  retryText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.primaryDark,
  },
  content: {
    gap: spacing.sm,
  },
  topMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  tempWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  conditionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tempLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  tempValue: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 28,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  conditionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.textSecondary,
  },
  subMetric: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.textMuted,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  levelBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  statsStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  adviceBox: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  adviceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  adviceLead: {
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  adviceText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  offlineHint: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textMuted,
  },
});
