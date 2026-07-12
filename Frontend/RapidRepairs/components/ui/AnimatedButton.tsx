import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';
import { Theme } from '../../constants/theme';

interface AnimatedButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export default function AnimatedButton({
  title,
  onPress,
  variant = 'primary',
  style,
  textStyle,
  isLoading = false,
  disabled = false,
  icon,
  ...props
}: AnimatedButtonProps) {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? Theme.colors.border : Theme.colors.primary,
          borderWidth: 0,
        };
      case 'secondary':
        return {
          backgroundColor: disabled ? Theme.colors.border : Theme.colors.secondary,
          borderWidth: 0,
        };
      case 'danger':
        return {
          backgroundColor: disabled ? Theme.colors.border : Theme.colors.danger,
          borderWidth: 0,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: disabled ? Theme.colors.border : Theme.colors.primary,
        };
      default:
        return { backgroundColor: Theme.colors.primary };
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'outline':
        return { color: disabled ? Theme.colors.textMuted : Theme.colors.primary };
      default:
        return { color: Theme.colors.surface };
    }
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleValue }] }, style]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled || isLoading}
        style={[
          styles.button,
          getContainerStyle(),
        ]}
        {...props}
      >
        {isLoading ? (
          <ActivityIndicator color={variant === 'outline' ? Theme.colors.primary : '#fff'} />
        ) : (
          <>
            {icon && <React.Fragment>{icon}</React.Fragment>}
            <Text style={[styles.text, getTextStyle(), textStyle, icon ? { marginLeft: 8 } : {}]}>
              {title}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: Theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: Theme.spacing.lg, // Reduced from xl to lg to prevent wrapping in tight spaces
    ...Theme.shadows.sm,
  },
  text: {
    ...Theme.typography.button,
    textAlign: 'center',
  },
});
