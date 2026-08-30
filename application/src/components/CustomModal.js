import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tokens from '../theme/tokens';
import GlassButton from './GlassButton';

/**
 * CustomModal
 * A premium, unified modal for alerts, success messages, errors, and confirmations.
 */
export default function CustomModal({
  visible,
  title,
  message,
  type = 'info', // 'info' | 'success' | 'error' | 'confirm'
  onClose,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) {
  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return { name: 'checkmark-circle', color: tokens.colors.successLight, bg: tokens.colors.successGlass };
      case 'error':
        return { name: 'close-circle', color: tokens.colors.dangerLight, bg: tokens.colors.dangerGlass };
      case 'confirm':
        return { name: 'help-circle', color: tokens.colors.primaryLight, bg: 'rgba(59, 130, 246, 0.15)' };
      case 'info':
      default:
        return { name: 'information-circle', color: tokens.colors.primaryLight, bg: 'rgba(59, 130, 246, 0.15)' };
    }
  };

  const iconConfig = getIconConfig();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <View style={[styles.iconContainer, { backgroundColor: iconConfig.bg }]}>
                <Ionicons name={iconConfig.name} size={36} color={iconConfig.color} />
              </View>
              
              <Text style={styles.title}>{title}</Text>
              {message ? <Text style={styles.message}>{message}</Text> : null}
              
              <View style={styles.buttonContainer}>
                {type === 'confirm' ? (
                  <>
                    <GlassButton
                      title={cancelText}
                      onPress={onClose}
                      variant="secondary"
                      style={styles.flexBtn}
                    />
                    <GlassButton
                      title={confirmText}
                      onPress={onConfirm}
                      variant="primary"
                      style={styles.flexBtn}
                    />
                  </>
                ) : (
                  <GlassButton
                    title="OK"
                    onPress={onClose}
                    variant={type === 'error' ? 'danger' : 'primary'}
                    style={styles.fullBtn}
                  />
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.xl,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: tokens.colors.glassCard,
    borderRadius: tokens.borderRadius.xl,
    padding: tokens.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.glassBorderHighlight,
    ...tokens.shadows.card,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  title: {
    ...tokens.typography.h2,
    color: tokens.colors.text,
    textAlign: 'center',
    marginBottom: tokens.spacing.sm,
  },
  message: {
    ...tokens.typography.body,
    color: tokens.colors.textMuted,
    textAlign: 'center',
    marginBottom: tokens.spacing.xl,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    width: '100%',
  },
  flexBtn: {
    flex: 1,
  },
  fullBtn: {
    width: '100%',
  },
});
