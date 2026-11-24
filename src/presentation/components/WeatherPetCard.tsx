import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPetWeatherAdvice, PERU_CITIES } from '../../application/services/weatherAdviceService';
import { WeatherAdviceLevel, WeatherData } from '../../domain/models/weather';
import {
  fetchCityWeather,
  getCachedWeather,
  loadSavedCityId,
  saveSelectedCityId,
} from '../../infrastructure/services/weatherApiService';
import { colors, fonts, radius, shadows, spacing } from '../theme';
import { PressableScale } from './PressableScale';

const LEVEL_STYLES: Record<WeatherAdviceLevel, { color: string; background: string; border: string }> = {
  OPTIMO: { color: colors.done, background: colors.doneSoft, border: colors.primaryBorder },
  PRECAUCION: { color: colors.pending, background: colors.pendingSoft, border: '#EED69B' },
  ALERTA: { color: colors.danger, background: colors.dangerSoft, border: colors.dangerBorder },
};

export function WeatherPetCard() {
  const [cityId, setCityId] = useState<string>('lima');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const activeCityRef = useRef<string>('lima');

  const selectedCity = useMemo(
    () => PERU_CITIES.find((c) => c.id === cityId) ?? PERU_CITIES[0],
    [cityId],
  );

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
    <>
      <PressableScale
        onPress={() => setModalVisible(true)}
        style={styles.heroWeatherPill}
        accessibilityRole="button"
        accessibilityLabel={
          weather && advice
            ? `Clima en ${weather.cityName}: ${weather.temperatureC} grados, ${advice.badgeLabel}. Toca para ver detalles`
            : 'Consultar clima para paseos'
        }
        testID="weather-hero-pill"
      >
        {loading && !weather ? (
          <>
            <ActivityIndicator size="small" color={colors.primary} style={styles.pillLoader} />
            <Text style={styles.heroPillText}>Clima...</Text>
          </>
        ) : weather && advice ? (
          <>
            <View style={[styles.levelDot, { backgroundColor: levelStyle.color }]} />
            <Ionicons
              name={advice.icon as React.ComponentProps<typeof Ionicons>['name']}
              size={13}
              color={colors.primaryDark}
            />
            <Text style={styles.heroPillText} numberOfLines={1}>
              {weather.temperatureC}°C · {weather.cityName}
            </Text>
            <Ionicons name="chevron-down" size={11} color={colors.textSecondary} />
          </>
        ) : (
          <>
            <Ionicons name="cloud-offline-outline" size={13} color={colors.danger} />
            <Text style={styles.heroPillText}>Clima</Text>
            <Ionicons name="chevron-down" size={11} color={colors.textSecondary} />
          </>
        )}
      </PressableScale>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={styles.modalIconBox}>
                  <Ionicons name="partly-sunny-outline" size={19} color={colors.primaryDark} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Clima para paseos</Text>
                  <Text style={styles.modalSubtitle}>Recomendación clínica en tiempo real</Text>
                </View>
              </View>

              <View style={styles.modalActions}>
                <PressableScale
                  onPress={() => void loadWeather(cityId, true)}
                  disabled={loading || refreshing}
                  style={styles.iconCircleBtn}
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
                <PressableScale
                  onPress={() => setModalVisible(false)}
                  style={styles.iconCircleBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar panel de clima"
                >
                  <Ionicons name="close" size={19} color={colors.textSecondary} />
                </PressableScale>
              </View>
            </View>

            <View style={styles.cityGrid}>
              {PERU_CITIES.map((city) => {
                const active = city.id === cityId;
                return (
                  <PressableScale
                    key={city.id}
                    onPress={() => handleSelectCity(city.id)}
                    style={[styles.cityChip, active && styles.cityChipActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    testID={`weather-city-${city.id}`}
                  >
                    <Text style={[styles.cityChipText, active && styles.cityChipTextActive]}>
                      {city.name}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>

            {loading && !weather ? (
              <View style={styles.stateBox}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={styles.stateText}>Consultando clima en {selectedCity.name}...</Text>
              </View>
            ) : error && !weather ? (
              <View style={styles.errorBox}>
                <Ionicons name="cloud-offline-outline" size={28} color={colors.danger} />
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
              <View style={styles.weatherBody}>
                <View style={styles.heroMetricsRow}>
                  <View style={styles.heroLeft}>
                    <View style={[styles.conditionIconWrap, { backgroundColor: levelStyle.background }]}>
                      <Ionicons
                        name={advice.icon as React.ComponentProps<typeof Ionicons>['name']}
                        size={24}
                        color={levelStyle.color}
                      />
                    </View>
                    <View style={styles.tempColumn}>
                      <Text style={styles.tempValue}>{weather.temperatureC}°C</Text>
                      <Text style={styles.conditionMeta} numberOfLines={1} ellipsizeMode="tail">
                        {advice.conditionLabel} · Sensación {weather.apparentTemperatureC}°C
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.levelBadge,
                      { backgroundColor: levelStyle.background, borderColor: levelStyle.border },
                    ]}
                  >
                    <Text style={[styles.levelBadgeText, { color: levelStyle.color }]}>
                      {advice.badgeLabel}
                    </Text>
                  </View>
                </View>

                <View style={styles.metricsRail}>
                  <View style={styles.metricCell}>
                    <Text style={styles.metricLabel}>Humedad</Text>
                    <Text style={styles.metricValue}>{weather.humidityPercent}%</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricCell}>
                    <Text style={styles.metricLabel}>Viento</Text>
                    <Text style={styles.metricValue}>{weather.windSpeedKmh} km/h</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricCell}>
                    <Text style={styles.metricLabel}>UV máx.</Text>
                    <Text style={styles.metricValue}>{weather.uvIndexMax}</Text>
                  </View>
                </View>

                <View style={styles.adviceBox}>
                  <View style={styles.adviceDetailRow}>
                    <Ionicons name="paw-outline" size={16} color={colors.primaryDark} style={{ marginTop: 2 }} />
                    <Text style={styles.adviceDetailText}>
                      <Text style={styles.adviceLead}>Paseo: </Text>
                      {advice.walkAdvice}
                    </Text>
                  </View>
                  <View style={styles.adviceDetailRow}>
                    <Ionicons name="cut-outline" size={16} color={colors.accent} style={{ marginTop: 2 }} />
                    <Text style={styles.adviceDetailText}>
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
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  heroWeatherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  pillLoader: {
    transform: [{ scale: 0.65 }],
    marginHorizontal: -3,
  },
  levelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  heroPillText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
    ...shadows.raised,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  modalIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 16.5,
    color: colors.text,
  },
  modalSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.textMuted,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  cityChip: {
    flexBasis: '31%',
    flexGrow: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cityChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  cityChipText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  cityChipTextActive: {
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },
  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  stateText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  errorBox: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  retryText: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: colors.primaryDark,
  },
  weatherBody: {
    gap: spacing.sm,
  },
  heroMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  conditionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tempColumn: {
    flex: 1,
    minWidth: 0,
  },
  tempValue: {
    fontFamily: fonts.bold,
    fontSize: 25,
    lineHeight: 29,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  conditionMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  levelBadge: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexShrink: 0,
  },
  levelBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  metricsRail: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingVertical: 10,
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  metricValue: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  metricDivider: {
    width: 1,
    height: 26,
    backgroundColor: colors.divider,
  },
  adviceBox: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  adviceDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  adviceLead: {
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  adviceDetailText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  offlineHint: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
