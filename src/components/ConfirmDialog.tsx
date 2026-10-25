import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, spacing, typography } from '../theme';
import { IconName } from '../utils/requestMeta';
import { PrimaryButton } from './PrimaryButton';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  icon?: IconName;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Diálogo de confirmación propio (funciona igual en Android, iOS y web). */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  destructive,
  icon,
  onConfirm,
  onCancel,
}: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 7, tension: 80 }).start();
    }
  }, [visible, anim]);

  const tint = destructive ? colors.danger : colors.primary;
  const tintSoft = destructive ? colors.dangerSoft : colors.primarySoft;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onCancel} accessibilityLabel="Cerrar diálogo">
        <Animated.View
          style={[
            styles.card,
            {
              opacity: anim,
              transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
            },
          ]}
        >
          {/* Evita que tocar la tarjeta cierre el diálogo */}
          <Pressable accessibilityRole="alert" accessibilityViewIsModal>
            <View style={[styles.iconWrap, { backgroundColor: tintSoft }]}>
              <Ionicons name={icon ?? (destructive ? 'trash-outline' : 'help-circle-outline')} size={28} color={tint} />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            <View style={styles.actions}>
              <PrimaryButton title={cancelLabel} onPress={onCancel} variant="outline" compact style={styles.btn} testID="dialog-cancel" />
              <PrimaryButton
                title={confirmLabel}
                onPress={onConfirm}
                compact
                trailingIcon={null}
                style={[styles.btn, destructive && { backgroundColor: colors.danger, borderColor: colors.danger }]}
                testID="dialog-confirm"
              />
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.xl },
  card: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.raised,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: { ...typography.title, fontSize: 19, textAlign: 'center' },
  message: { ...typography.body, textAlign: 'center', marginTop: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  btn: { flex: 1 },
});
