import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  ConfirmDialog,
  FadeInView,
  IconTile,
  PetAvatar,
  PressableScale,
  PrimaryButton,
  PulseView,
  SectionHeader,
} from '../components';
import { useAuth } from '../context/AuthContext';
import { useRequests } from '../context/RequestsContext';
import { useToast } from '../context/ToastContext';
import { ServiceType, Species } from '../models/request';
import { colors, common, fonts, radius, shadows, spacing, typography } from '../theme';
import { SERVICE_META, SPECIES_META } from '../utils/requestMeta';

interface ServicePriceItem {
  id: string;
  service: ServiceType;
  name: string;
  price: number;
  icon: any;
  color: string;
  bg: string;
}

const SERVICE_PRICE_METADATA: Omit<ServicePriceItem, 'price'>[] = [
  { id: '1', service: 'CONSULTA', name: 'Consulta Médica General', icon: SERVICE_META.CONSULTA.icon, color: colors.sage, bg: colors.sageSoft },
  { id: '2', service: 'VACUNACION', name: 'Vacunación & Desparasitación', icon: SERVICE_META.VACUNACION.icon, color: colors.sky, bg: colors.skySoft },
  { id: '3', service: 'EMERGENCIA', name: 'Atención de Emergencias 24/7', icon: SERVICE_META.EMERGENCIA.icon, color: colors.danger, bg: colors.dangerSoft },
  { id: '4', service: 'GROOMING', name: 'Baño & Grooming Medicado', icon: SERVICE_META.GROOMING.icon, color: colors.lavender, bg: colors.lavenderSoft },
];

export function SettingsScreen() {
  const { session, isAdmin, staffList, signOut } = useAuth();
  const { requests, servicePrices, updateServicePrice, clearAll } = useRequests();
  const { showToast } = useToast();

  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const servicesList = useMemo<ServicePriceItem[]>(
    () =>
      SERVICE_PRICE_METADATA.map((item) => ({
        ...item,
        price: servicePrices[item.service],
      })),
    [servicePrices],
  );
  const [editingService, setEditingService] = useState<ServicePriceItem | null>(null);
  const [newPriceText, setNewPriceText] = useState('');

  const [notifyUrgent, setNotifyUrgent] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [vaccineReminders, setVaccineReminders] = useState(true);

  const handleLogout = () => {
    setConfirmLogout(false);
    signOut();
  };

  const handleClearAll = () => {
    clearAll();
    setConfirmClear(false);
    showToast('info', 'Registros vaciados', 'Se eliminaron todas las solicitudes de atención.');
  };

  const handleOpenEditPrice = (item: ServicePriceItem) => {
    if (!isAdmin) {
      showToast(
        'info',
        'Permiso exclusivo del Director Médico',
        'Solo el Administrador (admin) puede modificar el tarifario oficial.'
      );
      return;
    }
    setEditingService(item);
    setNewPriceText(item.price.toFixed(2));
  };

  const handleSavePrice = () => {
    if (!editingService) return;
    const parsed = parseFloat(newPriceText.replace(',', '.'));
    if (isNaN(parsed) || parsed < 0) {
      showToast('error', 'Precio no válido', 'Ingresa un monto numérico válido.');
      return;
    }
    updateServicePrice(editingService.service, parsed);
    showToast(
      'success',
      'Tarifa actualizada',
      `${editingService.name} ahora cuesta S/. ${parsed.toFixed(2)}.`
    );
    setEditingService(null);
  };

  const registeredPatients = useMemo(() => {
    const map = new Map<string, { name: string; species?: Species }>();
    for (const r of requests) {
      const key = r.mascotaNombre.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, { name: r.mascotaNombre, species: r.especie });
      }
    }
    return Array.from(map.values()).slice(0, 6);
  }, [requests]);

  const doctorFullName = session?.displayName
    ? `${session.title ? session.title + ' ' : ''}${session.displayName}`
    : 'Dr. Carlos Mendoza';

  return (
    <SafeAreaView style={common.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <FadeInView delay={30} distance={10}>
          <Text style={styles.screenTitle} accessibilityRole="header">
            Ajustes de Clínica
          </Text>

          <View style={styles.profileCard}>
            <View style={styles.avatarWrap}>
              <Ionicons name="medical" size={28} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.doctorName}>{doctorFullName}</Text>
              <Text style={styles.clinicName}>{session?.clinicName ?? 'Clínica Veterinaria Amipets'}</Text>
              <Text style={styles.cmpvText}>
                {session?.cmpv ?? 'C.M.V.P. 8421 · Cirugía & Traumatología'}
              </Text>
              <View style={styles.roleBadge}>
                <PulseView minScale={0.8} maxScale={1.25} duration={1200}>
                  <View style={styles.onlineDot} />
                </PulseView>
                <Text style={styles.roleText}>{session?.role ?? 'Director Médico & Fundador'}</Text>
              </View>
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={70} distance={10}>
          <View style={styles.section}>
            <SectionHeader title="Equipo clínico" />
            <View style={styles.card}>
              {staffList.map((member, idx) => {
                const isCurrent = session?.userName.toLowerCase() === member.userName.toLowerCase();
                const isMemberAdmin = member.role === 'ADMIN' || member.userName === 'admin';
                const memberCount = requests.filter(
                  (r) =>
                    (r.registradoPorUsuario && r.registradoPorUsuario.toLowerCase() === member.userName.toLowerCase()) ||
                    (!r.registradoPorUsuario && isMemberAdmin)
                ).length;

                return (
                  <React.Fragment key={member.id}>
                    {idx > 0 && <View style={styles.cardDivider} />}
                    <View style={styles.infoRowItem}>
                      <IconTile
                        icon={isMemberAdmin ? 'shield-checkmark' : 'person-outline'}
                        color={isMemberAdmin ? colors.primaryDark : colors.sage}
                        background={isMemberAdmin ? colors.primarySoft : colors.sageSoft}
                        size={38}
                      />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.infoRowTitle}>
                            {member.title ? `${member.title} ` : ''}{member.displayName}
                          </Text>
                          {isCurrent && (
                            <View style={styles.activeStaffPill}>
                              <Text style={styles.activeStaffPillText}>Activo</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.infoRowSubtitle}>
                          {member.roleLabel}
                        </Text>
                      </View>
                      <View style={styles.pricePill}>
                        <Text style={styles.serviceRowPrice}>{memberCount}</Text>
                      </View>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={110} distance={10}>
          <View style={styles.section}>
            <SectionHeader title="Pacientes recientes" />
            {registeredPatients.length > 0 ? (
              <View style={styles.petsRow}>
                {registeredPatients.map((p, idx) => (
                  <View key={idx} style={styles.petItem}>
                    <PetAvatar species={p.species} size={52} shape="circle" />
                    <Text style={styles.petItemName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.petItemBreed}>
                      {p.species ? SPECIES_META[p.species]?.label : 'Mascota'}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyPatientsCard}>
                <Ionicons name="paw-outline" size={26} color={colors.textSecondary} />
                <Text style={styles.emptyPatientsText}>
                  Sin pacientes registrados hoy.
                </Text>
              </View>
            )}
          </View>
        </FadeInView>

        <FadeInView delay={150} distance={10}>
          <View style={styles.section}>
            <SectionHeader
              title="Tarifario de servicios"
              actionLabel={isAdmin ? 'Editar' : undefined}
              onAction={isAdmin ? () => handleOpenEditPrice(servicesList[0]) : undefined}
            />
            <View style={styles.card}>
              {servicesList.map((srv, idx) => (
                <React.Fragment key={srv.id}>
                  {idx > 0 && <View style={styles.cardDivider} />}
                  <PressableScale
                    onPress={() => handleOpenEditPrice(srv)}
                    style={styles.serviceRowItem}
                    accessibilityRole="button"
                    accessibilityLabel={`Precio de ${srv.name}`}
                  >
                    <IconTile icon={srv.icon} color={srv.color} background={srv.bg} size={36} />
                    <View style={{ flex: 1, paddingRight: spacing.xs }}>
                      <Text style={styles.serviceRowName}>{srv.name}</Text>
                      <Text style={styles.serviceEditHint}>
                        {SERVICE_META[srv.service].hint}
                      </Text>
                    </View>
                    <View style={styles.pricePill}>
                      <Text style={styles.serviceRowPrice}>S/. {srv.price.toFixed(2)}</Text>
                      {isAdmin && (
                        <Ionicons name="pencil" size={12} color={colors.primaryDark} style={{ marginLeft: 4 }} />
                      )}
                    </View>
                  </PressableScale>
                </React.Fragment>
              ))}
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={190} distance={10}>
          <View style={styles.section}>
            <SectionHeader title="Sede y atención médica" />
            <View style={styles.card}>
              <View style={styles.infoRowItem}>
                <IconTile icon="location-outline" color={colors.primary} background={colors.primarySoft} size={38} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoRowTitle}>Dirección de la Clínica</Text>
                  <Text style={styles.infoRowSubtitle}>Av. Primavera 1045, San Borja, Lima</Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.infoRowItem}>
                <IconTile icon="call-outline" color={colors.primary} background={colors.primarySoft} size={38} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoRowTitle}>Línea de Urgencias 24h</Text>
                  <Text style={styles.infoRowSubtitle}>(01) 480-9000 · Anexo 102</Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.infoRowItem}>
                <IconTile icon="time-outline" color={colors.primary} background={colors.primarySoft} size={38} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoRowTitle}>Horario de Consultas</Text>
                  <Text style={styles.infoRowSubtitle}>Lunes a Sábado · 8:00 a. m. – 8:00 p. m.</Text>
                </View>
              </View>
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={230} distance={10}>
          <View style={styles.section}>
            <SectionHeader title="Preferencias de la aplicación" />
            <View style={styles.card}>
              <View style={styles.switchRow}>
                <View style={{ flex: 1, paddingRight: spacing.sm }}>
                  <Text style={styles.switchTitle}>Notificar urgencias en tiempo real</Text>
                  <Text style={styles.switchSubtitle}>Alerta visual inmediata al ingresar un paciente grave</Text>
                </View>
                <Switch
                  value={notifyUrgent}
                  onValueChange={setNotifyUrgent}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.white}
                />
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.switchRow}>
                <View style={{ flex: 1, paddingRight: spacing.sm }}>
                  <Text style={styles.switchTitle}>Sonido de alerta para emergencias</Text>
                  <Text style={styles.switchSubtitle}>Tono diferenciado para solicitudes de alta prioridad</Text>
                </View>
                <Switch
                  value={soundAlerts}
                  onValueChange={setSoundAlerts}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.white}
                />
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.switchRow}>
                <View style={{ flex: 1, paddingRight: spacing.sm }}>
                  <Text style={styles.switchTitle}>Recordatorios de vacunación</Text>
                  <Text style={styles.switchSubtitle}>Avisos de refuerzos periódicos para pacientes</Text>
                </View>
                <Switch
                  value={vaccineReminders}
                  onValueChange={setVaccineReminders}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.white}
                />
              </View>
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={270} distance={10}>
          <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
            {isAdmin && (
              <PressableScale
                onPress={() => setConfirmClear(true)}
                style={styles.clearButton}
                accessibilityRole="button"
                accessibilityLabel="Vaciar registros de solicitudes"
              >
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
                <Text style={styles.clearButtonText}>Vaciar todas las solicitudes</Text>
              </PressableScale>
            )}

            <PrimaryButton
              title="Cerrar sesión"
              onPress={() => setConfirmLogout(true)}
              variant="outline"
              icon="log-out-outline"
              trailingIcon={null}
              testID="settings-logout"
            />
          </View>

          <Text style={styles.versionFootnote}>
            Amipets · Sistema de Gestión Clínica v1.0
          </Text>
        </FadeInView>
      </ScrollView>

      <Modal
        visible={editingService !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditingService(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.priceModalOverlay}
        >
          <View style={styles.priceModalCard}>
            <View style={styles.priceModalHeader}>
              <IconTile
                icon={editingService?.icon ?? 'medkit'}
                color={editingService?.color ?? colors.primary}
                background={editingService?.bg ?? colors.primarySoft}
                size={40}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.priceModalTitle}>Editar Tarifa Médica</Text>
                <Text style={styles.priceModalSubtitle} numberOfLines={1}>
                  {editingService?.name}
                </Text>
              </View>
            </View>

            <Text style={styles.priceInputLabel}>Nuevo precio asistencial:</Text>
            <View style={styles.priceInputRow}>
              <Text style={styles.currencyPrefix}>S/.</Text>
              <TextInput
                style={styles.priceInput}
                value={newPriceText}
                onChangeText={setNewPriceText}
                keyboardType="numeric"
                autoFocus={true}
                placeholder="0.00"
                placeholderTextColor={colors.placeholder}
              />
            </View>

            <View style={styles.priceModalActions}>
              <PrimaryButton
                title="Cancelar"
                variant="outline"
                compact
                onPress={() => setEditingService(null)}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                title="Guardar Tarifa"
                compact
                onPress={handleSavePrice}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmDialog
        visible={confirmClear}
        title="¿Vaciar todas las solicitudes?"
        message="Se eliminarán todas las solicitudes registradas. Esta acción no se puede deshacer."
        confirmLabel="Sí, vaciar todo"
        cancelLabel="Cancelar"
        destructive
        icon="trash"
        onCancel={() => setConfirmClear(false)}
        onConfirm={handleClearAll}
      />

      <ConfirmDialog
        visible={confirmLogout}
        title="¿Cerrar sesión?"
        message="Regresarás a la pantalla de bienvenida del consultorio."
        confirmLabel="Cerrar sesión"
        cancelLabel="Permanecer"
        icon="log-out-outline"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
    gap: spacing.lg,
  },
  screenTitle: {
    ...typography.title,
    marginTop: spacing.xs,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#FFD5D1',
    ...shadows.soft,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  doctorName: {
    fontFamily: fonts.bold,
    fontSize: 17,
    letterSpacing: -0.2,
    color: colors.text,
  },
  clinicName: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cmpvText: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.done,
  },
  roleText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.done,
    letterSpacing: 0.2,
  },

  section: {
    gap: spacing.xs,
  },
  petsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  petItem: {
    alignItems: 'center',
    gap: 4,
    minWidth: 70,
    flexGrow: 1,
  },
  petItemName: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text,
    marginTop: 2,
  },
  petItemBreed: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
  },
  emptyPatientsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyPatientsText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },

  card: {
    ...common.card,
    padding: spacing.md,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },

  infoRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 2,
  },
  infoRowTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text,
  },
  infoRowSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  activeStaffPill: {
    backgroundColor: colors.doneSoft,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  activeStaffPillText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: colors.done,
  },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  switchTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text,
  },
  switchSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },

  serviceRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 6,
  },
  serviceRowName: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: colors.text,
  },
  serviceEditHint: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  pricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceRowPrice: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primaryDark,
  },

  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
  },
  clearButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.danger,
  },

  versionFootnote: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  priceModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  priceModalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    gap: spacing.md,
    ...shadows.raised,
  },
  priceModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  priceModalTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.text,
  },
  priceModalSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  priceInputLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text,
    marginTop: spacing.xs,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  currencyPrefix: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.primaryDark,
    marginRight: 6,
  },
  priceInput: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.text,
  },
  priceModalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
