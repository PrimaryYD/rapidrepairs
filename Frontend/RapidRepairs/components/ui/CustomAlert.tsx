import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import AnimatedButton from './AnimatedButton';

export interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: 'success' | 'error' | 'warning' | 'info';
}

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  options: AlertOptions | null;
  onClose: () => void;
}

export default function CustomAlert({ visible, options, onClose }: CustomAlertProps) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const scale = React.useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!options) return null;

  const getIcon = () => {
    switch (options.type) {
      case 'success':
        return <Ionicons name="checkmark-circle" size={48} color={Theme.colors.success} />;
      case 'error':
        return <Ionicons name="close-circle" size={48} color={Theme.colors.danger} />;
      case 'warning':
        return <Ionicons name="warning" size={48} color={Theme.colors.warning} />;
      case 'info':
      default:
        return <Ionicons name="information-circle" size={48} color={Theme.colors.primary} />;
    }
  };

  const handleButtonPress = (btn: AlertButton) => {
    if (btn.onPress) btn.onPress();
    onClose();
  };

  const defaultButtons: AlertButton[] = [{ text: 'OK', onPress: onClose }];
  const buttonsToRender = options.buttons && options.buttons.length > 0 ? options.buttons : defaultButtons;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity }]}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.alertBox, { transform: [{ scale }] }]}>
              <View style={styles.iconContainer}>{getIcon()}</View>
              <Text style={styles.title}>{options.title}</Text>
              {options.message && <Text style={styles.message}>{options.message}</Text>}

              <View style={styles.buttonContainer}>
                {buttonsToRender.map((btn, index) => {
                  let variant: 'primary' | 'secondary' | 'outline' | 'danger' = 'primary';
                  if (btn.style === 'cancel') variant = 'outline';
                  if (btn.style === 'destructive') variant = 'danger';

                  // If there's only one button, make it full width. If two, split.
                  const isFullWidth = buttonsToRender.length === 1;

                  return (
                    <AnimatedButton
                      key={index}
                      title={btn.text}
                      onPress={() => handleButtonPress(btn)}
                      variant={variant}
                      style={[
                        styles.button,
                        isFullWidth ? { width: '100%' } : { flex: 1, marginHorizontal: 4 },
                      ]}
                    />
                  );
                })}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  alertBox: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...Theme.shadows.lg,
  },
  iconContainer: {
    marginBottom: Theme.spacing.md,
  },
  title: {
    ...Theme.typography.h3,
    textAlign: 'center',
    marginBottom: Theme.spacing.sm,
  },
  message: {
    ...Theme.typography.body,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: Theme.spacing.xl,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  button: {
    height: 44, // Slightly smaller than default AnimatedButton
    paddingHorizontal: 8, // Very tight padding to ensure text doesn't wrap in half-width containers
  },
});
