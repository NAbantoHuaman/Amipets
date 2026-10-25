import React, { useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FormField, IconTile, PrimaryButton } from '../components';
import { ADMIN_PASS, ADMIN_USER, CLINIC_NAME, useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { colors, common, fonts, HIT_SLOP, radius, shadows, spacing, typography } from '../theme';

/** Pantalla de bienvenida y acceso con cuenta admin / admin. */
export function WelcomeScreen() {
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
    if (user.trim().length < 3) next.user = 'Ingresa tu usuario (ej. admin).';
    if (password.length < 4) next.password = 'Ingresa tu contraseña (ej. admin).';
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
        setErrors({ password: 'Credenciales no válidas. Prueba con admin / admin.' });
        showToast('error', 'Acceso denegado', 'Usa las credenciales: admin / admin');
      }
    }, 350);
  };

  const fillAdmin = () => {
    setUser(ADMIN_USER);
    setPassword(ADMIN_PASS);
    setErrors({});
  };

  const handlePasswordFocus = () => {
    // Desliza suavemente para que la contraseña y el botón no queden tapados por el teclado
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
          automaticallyAdjustKeyboardInsets={true}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Banner bien proporcionado que encaja en la pantalla */}
          <View style={styles.hero}>
            <Image source={require('../../assets/images/welcome.jpg')} style={styles.heroImage} resizeMode="cover" />
            <View style={styles.heroOverlay}>
              <Text style={styles.script}>Mascotas felices,{'\n'}vidas más sanas ♡</Text>
            </View>
          </View>

          {/* Identidad de la Clínica */}
          <View style={styles.brandRow}>
            <IconTile icon="paw" color={colors.white} background={colors.primary} size={42} shape="circle" />
            <View>
              <Text style={styles.brand}>Amipets</Text>
              <Text style={typography.caption}>{CLINIC_NAME}</Text>
            </View>
          </View>

          <Text style={styles.title} accessibilityRole="header">
            Atención clínica y control de pacientes
          </Text>
          <Text style={styles.subtitle}>
            Registro de ingresos, seguimiento de consultas y atención oportuna de urgencias.
          </Text>

          {/* Formulario de Inicio de Sesión */}
          <View style={styles.formCard}>
            <FormField
              testID="login-user"
              label="Usuario"
              icon="person-outline"
              placeholder="admin"
              value={user}
              onChangeText={(t) => {
                setUser(t);
                if (errors.user) setErrors((e) => ({ ...e, user: undefined }));
              }}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => {
                passwordRef.current?.focus();
                handlePasswordFocus();
              }}
              error={errors.user}
            />
            <View>
              <FormField
                ref={passwordRef}
                testID="login-password"
                label="Contraseña"
                icon="lock-closed-outline"
                placeholder="admin"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
                }}
                onFocus={handlePasswordFocus}
                secureTextEntry={!showPassword}
                returnKeyType="go"
                onSubmitEditing={submit}
                error={errors.password}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={HIT_SLOP}
                style={styles.eye}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <PrimaryButton
              title="Iniciar Sesión"
              onPress={submit}
              loading={loading}
              testID="login-submit"
              style={{ marginTop: spacing.xs }}
            />

            <Pressable
              onPress={fillAdmin}
              style={styles.adminPill}
              accessibilityRole="button"
              accessibilityLabel="Autocompletar con admin / admin"
              testID="login-fill-admin"
            >
              <Ionicons name="key-outline" size={15} color={colors.primary} />
              <Text style={styles.adminPillText}>
                Acceso rápido: <Text style={styles.adminPillBold}>admin</Text> / <Text style={styles.adminPillBold}>admin</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    flexGrow: 1,
  },
  hero: {
    height: 230,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceWarm,
    ...shadows.soft,
  },
  heroImage: { width: '100%', height: '100%', transform: [{ translateY: 35 }, { scale: 1.15 }] },
  heroOverlay: { position: 'absolute', top: spacing.lg, right: spacing.lg },
  script: { ...typography.script, fontSize: 24, lineHeight: 26, textAlign: 'right', color: colors.primaryDark },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  brand: { fontFamily: fonts.bold, fontSize: 20, color: colors.text },
  title: { ...typography.display, marginTop: spacing.md },
  subtitle: { ...typography.body, marginTop: spacing.xs },
  formCard: { ...common.card, padding: spacing.lg, marginTop: spacing.lg },
  eye: { position: 'absolute', right: spacing.sm, top: 40 },
  adminPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
  adminPillText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  adminPillBold: {
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },
});
