import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FadeInView, FormField, PressableScale, PrimaryButton } from '../components';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { validateRegistrationInput } from '../application/services/authService';
import { RootStackParamList } from '../navigation/types';
import { colors, common, fonts, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const SHIFT_OPTIONS: { id: string; title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  {
    id: 'Turno Mañana (08:00 - 14:00)',
    title: 'Mañana',
    subtitle: '08:00 a. m. – 02:00 p. m.',
    icon: 'sunny-outline',
  },
  {
    id: 'Turno Tarde (14:00 - 20:00)',
    title: 'Tarde',
    subtitle: '02:00 p. m. – 08:00 p. m.',
    icon: 'partly-sunny-outline',
  },
  {
    id: 'Turno Completo (08:00 - 20:00)',
    title: 'Completo',
    subtitle: '08:00 a. m. – 08:00 p. m.',
    icon: 'calendar-outline',
  },
];

export function RegisterScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [userName, setUserName] = useState('');
  const [selectedShift, setSelectedShift] = useState<string>(SHIFT_OPTIONS[0].id);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<any>(null);
  const userRef = useRef<any>(null);
  const passRef = useRef<any>(null);
  const confirmRef = useRef<any>(null);

  const handleSubmit = () => {
    const valResult = validateRegistrationInput({
      displayName,
      userName,
      password,
      role: 'RECEPTIONIST',
      shift: selectedShift,
    });

    const formErrors = { ...valResult.errors };

    if (!confirmPassword) {
      formErrors.confirmPassword = 'Confirma tu contraseña.';
    } else if (password && password !== confirmPassword) {
      formErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) {
      showToast('error', 'Formulario incompleto', 'Corrige los campos marcados en rojo.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const res = signUp({
        displayName: displayName.trim(),
        userName: userName.trim().toLowerCase(),
        password: password.trim(),
        role: 'RECEPTIONIST',
        shift: selectedShift,
      });

      if (!res.success) {
        setErrors({ userName: res.error || 'Error al registrar.' });
        showToast('error', 'Usuario no disponible', res.error || 'Verifica los datos ingresados.');
        return;
      }

      showToast(
        'success',
        'Cuenta creada',
        `Bienvenido(a), ${displayName.trim()}.`
      );
    }, 400);
  };

  return (
    <SafeAreaView style={common.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Volver al inicio de sesión"
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Crear cuenta</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          overScrollMode="never"
          alwaysBounceVertical={false}
          showsVerticalScrollIndicator={false}
        >
          <FadeInView delay={50} distance={10}>
            <View style={styles.headerBox}>
              <Text style={styles.title}>Nuevo colaborador</Text>
              <Text style={styles.subtitle}>
                Completa tus datos para ingresar al sistema.
              </Text>
            </View>
          </FadeInView>

          <FadeInView delay={130} distance={16}>
            <View style={styles.card}>
              <FormField
                label="Nombre completo"
                value={displayName}
                onChangeText={(text) => {
                  setDisplayName(text);
                  if (errors.displayName) setErrors((prev) => ({ ...prev, displayName: '' }));
                }}
                placeholder="Ej. Juan Pérez"
                icon="person-outline"
                error={errors.displayName}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => userRef.current?.focus()}
              />

              <Text style={styles.sectionLabel}>Horario</Text>
              <View style={styles.rolesGrid}>
                {SHIFT_OPTIONS.map((opt) => {
                  const isSelected = selectedShift === opt.id;
                  return (
                    <PressableScale
                      key={opt.id}
                      style={[styles.roleCard, isSelected && styles.roleCardActive]}
                      onPress={() => setSelectedShift(opt.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                    >
                      <View style={[styles.roleIconBox, isSelected && styles.roleIconBoxActive]}>
                        <Ionicons
                          name={opt.icon}
                          size={18}
                          color={isSelected ? colors.white : colors.primary}
                        />
                      </View>
                      <View style={styles.roleTextBox}>
                        <Text style={[styles.roleTitle, isSelected && styles.roleTitleActive]}>
                          {opt.title}
                        </Text>
                        <Text style={styles.roleSubtitle}>{opt.subtitle}</Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                      )}
                    </PressableScale>
                  );
                })}
              </View>

              <FormField
                ref={userRef}
                label="Usuario"
                value={userName}
                onChangeText={(text) => {
                  setUserName(text);
                  if (errors.userName) setErrors((prev) => ({ ...prev, userName: '' }));
                }}
                placeholder="Ej. jperez"
                icon="at-outline"
                error={errors.userName}
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => passRef.current?.focus()}
              />

              <FormField
                ref={passRef}
                label="Contraseña"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                }}
                placeholder="Mínimo 4 caracteres"
                icon="lock-closed-outline"
                rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowPassword((p) => !p)}
                rightIconLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                secureTextEntry={!showPassword}
                error={errors.password}
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
              />

              <FormField
                ref={confirmRef}
                label="Confirmar contraseña"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }}
                placeholder="Repite tu contraseña"
                icon="shield-checkmark-outline"
                rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowPassword((p) => !p)}
                rightIconLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                secureTextEntry={!showPassword}
                error={errors.confirmPassword}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />

              <PrimaryButton
                title="Registrarse"
                onPress={handleSubmit}
                loading={loading}
                style={{ marginTop: spacing.md }}
                testID="register-submit-btn"
              />
            </View>
          </FadeInView>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Welcome')}>
              <Text style={styles.footerLink}>Iniciar sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  topBarTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerBox: {
    marginBottom: spacing.md,
  },
  sharedInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  sharedInfoText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  iconCircle: {
    marginRight: 6,
  },
  badgeText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.primaryDark,
  },
  title: {
    ...typography.title,
    marginTop: 4,
  },
  subtitle: {
    ...typography.body,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  rolesGrid: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  roleCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  roleIconBox: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  roleIconBoxActive: {
    backgroundColor: colors.primary,
  },
  roleTextBox: {
    flex: 1,
  },
  roleTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text,
  },
  roleTitleActive: {
    color: colors.primaryDark,
  },
  roleSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  eye: {
    position: 'absolute',
    right: spacing.sm,
    top: 40,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  footerLink: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primary,
  },
});
