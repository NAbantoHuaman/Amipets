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
  IconTile,
  PetAvatar,
  PressableScale,
  PrimaryButton,
  SectionHeader,
} from '../components';
import { useAuth } from '../context/AuthContext';
import { useRequests } from '../context/RequestsContext';
import { useToast } from '../context/ToastContext';
import { Species } from '../models/request';
import { colors, common, fonts, radius, shadows, spacing, typography } from '../theme';
import { SPECIES_META } from '../utils/requestMeta';

interface ServicePriceItem {
  id: string;
  name: string;
  price: number;
  icon: any;
  color: string;
  bg: string;
}

const DEFAULT_PRICES: ServicePriceItem[] = [
  { id: '1', name: 'Consulta Médica General', price: 50.0, icon: 'medkit-outline', color: colors.sage, bg: colors.sageSoft },
  { id: '2', name: 'Vacunación & Desparasitación', price: 45.0, icon: 'eyedrop-outline', color: colors.sky, bg: colors.skySoft },
  { id: '3', name: 'Atención de Emergencias 24/7', price: 90.0, icon: 'pulse-outline', color: colors.danger, bg: colors.dangerSoft },
  { id: '4', name: 'Baño & Grooming Medicado', price: 40.0, icon: 'cut-outline', color: colors.lavender, bg: colors.lavenderSoft },
];

export function SettingsScreen() {
  const { session, signOut } = useAuth();
  const { requests, clearAll } = useRequests();
  const { showToast } = useToast();

  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Tarifario editable por el Doctor / Administrador
  const [servicesList, setServicesList] = useState<ServicePriceItem[]>(DEFAULT_PRICES);
  const [editingService, setEditingService] = useState<ServicePriceItem | null>(null);
  const [newPriceText, setNewPriceText] = useState('');

  // Preferencias de alertas de la aplicación local
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
    setServicesList((prev) =>
      prev.map((s) => (s.id === editingService.id ? { ...s, price: parsed } : s))
    );
    showToast(
      'success',
      'Tarifa actualizada',
      `${editingService.name} ahora cuesta S/. ${parsed.toFixed(2)}.`
    );
    setEditingService(null);
  };

  // Pacientes reales registrados a partir de las solicitudes creadas
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
        <Text style={styles.screenTitle} accessibilityRole="header">
          Ajustes de Clínica
        </Text>

        {/* Tarjeta de perfil del Doctor Director y Dueño */}
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
              <View style={styles.onlineDot} />
              <Text style={styles.roleText}>{session?.role ?? 'Director Médico & Fundador'}</Text>
            </View>
          </View>
        </View>

        {/* Pacientes Registrados Reales */}
        <View style={styles.section}>
          <SectionHeader title="Pacientes registrados" />
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
                Aún no hay pacientes registrados. Aparecerán aquí conforme se creen solicitudes de atención.
              </Text>
            </View>
          )}
        </View>

        {/* Tarifario de Servicios Médicos Editable */}
        <View style={styles.section}>
          <SectionHeader
            title="Tarifario de servicios médicos"
            actionLabel="Editar precios"
          />
          <View style={styles.card}>
            {servicesList.map((srv, idx) => (
              <React.Fragment key={srv.id}>
                {idx > 0 && <View style={styles.cardDivider} />}
                <PressableScale
                  onPress={() => handleOpenEditPrice(srv)}
                  style={styles.serviceRowItem}
                  accessibilityRole="button"
                  accessibilityLabel={`Editar precio de ${srv.name}`}
                >
                  <IconTile icon={srv.icon} color={srv.color} background={srv.bg} size={36} />
                  <View style={{ flex: 1, paddingRight: spacing.xs }}>
                    <Text style={styles.serviceRowName}>{srv.name}</Text>
                    <Text style={styles.serviceEditHint}>Toca para modificar precio</Text>
                  </View>
                  <View style={styles.pricePill}>
                    <Text style={styles.serviceRowPrice}>S/. {srv.price.toFixed(2)}</Text>
                    <Ionicons name="pencil" size={12} color={colors.primaryDark} style={{ marginLeft: 4 }} />
                  </View>
                </PressableScale>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Información de la Sede y Consultorio */}
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

        {/* Preferencias de Alertas y Notificaciones locales */}
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

        {/* Acciones de cuenta y sistema */}
        <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
          <PressableScale
            onPress={() => setConfirmClear(true)}
            style={styles.clearButton}
            accessibilityRole="button"
            accessibilityLabel="Vaciar registros de solicitudes"
          >
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
            <Text style={styles.clearButtonText}>Vaciar todas las solicitudes</Text>
          </PressableScale>

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
      </ScrollView>

      {/* Modal para Editar Tarifa de Servicio */}
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
                placeholderTextColor={colors.textMuted}
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

      {/* Confirmación para Vaciar Registros */}
      <ConfirmDialog
        visible={confirmClear}
        title="¿Vaciar todas las solicitudes?"
        message="Se eliminarán todas las solicitudes registradas en la memoria de la aplicación. Esta acción no se puede deshacer."
        confirmLabel="Sí, vaciar todo"
        cancelLabel="Cancelar"
        destructive
        icon="trash"
        onCancel={() => setConfirmClear(false)}
        onConfirm={handleClearAll}
      />

      {/* Confirmación de Logout */}
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
    ...common.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  doctorName: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
  },
  clinicName: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cmpvText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.done,
  },
  roleText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.done,
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

  // Modal de edición de precio
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
