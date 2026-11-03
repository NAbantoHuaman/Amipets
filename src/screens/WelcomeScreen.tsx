import React, { useRef, useState } from 'react';
import {
  Image,
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
import { FadeInView, FormField, IconTile, PressableScale, PrimaryButton, PulseView } from '../components';
import { CLINIC_NAME, useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { RootStackParamList } from '../navigation/types';
import { colors, common, fonts, radius, shadows, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ user?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);

  const submit = () => {
    const next: typeof errors = {};
    if (user.trim().length < 3) next.user = 'Ingresa tu usuario.';
    if (password.length < 4) next.password = 'Ingresa tu contraseña.';
    setErrors(next);
    if (Object.keys(next).length) {
      showToast('error', 'Revisa tus datos', 'Completa los campos marcados.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const success = signIn(user, password);
      if (!success) {
        setErrors({ password: 'Credenciales no válidas. Verifica tu usuario o regístrate.' });
        showToast('error', 'Acceso denegado', 'Verifica tus credenciales o crea una cuenta.');
      }
    }, 350);
  };

  const handlePasswordFocus = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 200);
  };

  return (
    <SafeAreaView style={common.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          overScrollMode="never"
          alwaysBounceVertical={false}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Encabezado superior: Amipets */}
          <FadeInView delay={40} distance={10}>
            <View style={styles.topBrandHeader}>
              <View style={styles.brandLeft}>
                <IconTile icon="paw" size={40} color={colors.white} background={colors.primary} />
                <View>
                  <Text style={styles.brand}>Amipets</Text>
                  <Text style={styles.brandSub}>{CLINIC_NAME}</Text>
                </View>
              </View>
              <View style={styles.statusPill}>
                <PulseView minScale={0.8} maxScale={1.2} duration={1400}>
                  <View style={styles.statusDot} />
                </PulseView>
                <Text style={styles.statusTag}>Clínica</Text>
              </View>
            </View>
          </FadeInView>

          {/* 2. Banner central entre Amipets e Iniciar sesión */}
          <FadeInView delay={120} distance={14} scale>
            <View style={styles.hero}>
              <Image
                source={require('../../assets/images/welcome.jpg')}
                style={styles.heroImage}
                resizeMode="cover"
              />
              <View style={styles.heroOverlay}>
                <Text style={styles.script}>Mascotas felices,{'\n'}vidas más sanas</Text>
              </View>
            </View>
          </FadeInView>

          {/* 3. Tarjeta inferior: Iniciar sesión */}
          <FadeInView delay={200} distance={18}>
            <View style={styles.formCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.title}>Iniciar sesión</Text>
                <Text style={styles.subtitle}>
                  Ingresa con tu cuenta para acceder al panel de la clínica.
                </Text>
              </View>

              <FormField
                label="Usuario"
                value={user}
                onChangeText={(t) => {
                  setUser(t);
                  if (errors.user) setErrors((prev) => ({ ...prev, user: undefined }));
                }}
                placeholder="Ingresa tu usuario"
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                icon="person-outline"
                error={errors.user}
                accessibilityLabel="Campo de nombre de usuario"
                testID="login-user-input"
              />

              <FormField
                ref={passwordRef}
                label="Contraseña"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="Ingresa tu contraseña"
                secureTextEntry={!showPassword}
                returnKeyType="go"
                onSubmitEditing={submit}
                onFocus={handlePasswordFocus}
                icon="lock-closed-outline"
                rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowPassword((p) => !p)}
                rightIconLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                error={errors.password}
                accessibilityLabel="Campo de contraseña"
                testID="login-password-input"
              />

              <PrimaryButton
                title="Iniciar Sesión"
                onPress={submit}
                loading={loading}
                testID="login-submit"
                style={{ marginTop: spacing.xs }}
              />

              <View style={styles.registerBox}>
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>o</Text>
                  <View style={styles.dividerLine} />
                </View>

                <PressableScale
                  style={styles.registerButton}
                  onPress={() => navigation.navigate('Register')}
                  accessibilityRole="button"
                  accessibilityLabel="Crear cuenta"
                  testID="welcome-register-btn"
                >
                  <Ionicons name="person-add-outline" size={17} color={colors.primaryDark} style={{ marginRight: 8 }} />
                  <Text style={styles.registerButtonText}>Crear cuenta</Text>
                </PressableScale>
              </View>
            </View>
          </FadeInView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  topBrandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brand: {
    fontFamily: fonts.bold,
    fontSize: 21,
    letterSpacing: -0.4,
    lineHeight: 24,
    color: colors.text,
  },
  brandSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.primary,
  },
  statusTag: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    color: colors.primaryDark,
  },
  hero: {
    height: 235,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: '#FFDDD9',
    ...shadows.soft,
  },
  heroImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -14,
    width: '100%',
    height: '138%',
  },
  heroOverlay: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  script: {
    ...typography.script,
    fontSize: 20,
    lineHeight: 21,
    textAlign: 'right',
    color: colors.primaryDark,
  },
  cardHeader: {
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 19,
    letterSpacing: -0.3,
    lineHeight: 24,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: 2,
  },
  formCard: {
    ...common.card,
    padding: spacing.lg,
    borderRadius: radius.xl,
    ...shadows.raised,
  },
  registerBox: {
    marginTop: spacing.xs,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.textMuted,
    marginHorizontal: spacing.sm,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  registerButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.primaryDark,
  },
});
