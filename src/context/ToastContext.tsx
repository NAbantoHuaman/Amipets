import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadows, spacing } from '../theme';

type ToastKind = 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  onPress: () => void;
}

interface ToastMessage {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
  action?: ToastAction;
}

interface ToastContextValue {
  showToast: (kind: ToastKind, title: string, message?: string, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const KIND_META: Record<ToastKind, { icon: 'checkmark-circle' | 'alert-circle' | 'information-circle'; color: string; bg: string }> = {
  success: { icon: 'checkmark-circle', color: colors.done, bg: colors.doneSoft },
  error: { icon: 'alert-circle', color: colors.danger, bg: colors.dangerSoft },
  info: { icon: 'information-circle', color: colors.primary, bg: colors.primarySoft },
};

const VISIBLE_MS = 2600;
/** Con acción (p. ej. Deshacer) se deja más tiempo para poder pulsarla. */
const VISIBLE_WITH_ACTION_MS = 5000;

/** Alertas de éxito y error no bloqueantes, animadas desde arriba. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const hide = useCallback(() => {
    Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setToast(null));
  }, [anim]);

  const showToast = useCallback((kind: ToastKind, title: string, message?: string, action?: ToastAction) => {
    setToast({ id: Date.now(), kind, title, message, action });
  }, []);

  useEffect(() => {
    if (!toast) return;
    anim.setValue(0);
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 8, tension: 70 }).start();
    const timer = setTimeout(hide, toast.action ? VISIBLE_WITH_ACTION_MS : VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast, anim, hide]);

  const value = useMemo(() => ({ showToast }), [showToast]);
  const meta = toast ? KIND_META[toast.kind] : null;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && meta && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.wrapper,
            {
              top: insets.top + spacing.xs,
              opacity: anim,
              transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }],
            },
          ]}
        >
          <Pressable
            onPress={hide}
            accessibilityRole="alert"
            accessibilityLabel={`${toast.title}. ${toast.message ?? ''}`}
            style={styles.toast}
          >
            <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
              <Ionicons name={meta.icon} size={20} color={meta.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{toast.title}</Text>
              {!!toast.message && <Text style={styles.message}>{toast.message}</Text>}
            </View>
            {toast.action && (
              <Pressable
                onPress={() => {
                  toast.action?.onPress();
                  hide();
                }}
                style={styles.actionButton}
                accessibilityRole="button"
                accessibilityLabel={toast.action.label}
                hitSlop={8}
              >
                <Text style={styles.actionText}>{toast.action.label}</Text>
              </Pressable>
            )}
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>.');
  return ctx;
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', left: spacing.md, right: spacing.md, zIndex: 100, alignItems: 'center' },
  toast: {
    width: '100%',
    maxWidth: 480,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.raised,
  },
  iconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  message: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  actionButton: {
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
  },
  actionText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primaryDark },
});
