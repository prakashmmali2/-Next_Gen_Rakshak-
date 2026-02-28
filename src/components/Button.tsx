import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, borderRadius, fontSize } from '../utils/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    };

    const sizeStyles: Record<string, ViewStyle> = {
      small: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
      medium: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
      large: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl },
    };

    const variantStyles: Record<string, ViewStyle> = {
      primary: { backgroundColor: colors.primary },
      secondary: { backgroundColor: colors.secondary },
      outline: {
        backgroundColor: colors.transparent,
        borderWidth: 2,
        borderColor: colors.primary,
      },
      danger: { backgroundColor: colors.error },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      opacity: disabled ? 0.6 : 1,
    };
  };

  const getTextStyle = (): TextStyle => {
    const sizeStyles: Record<string, TextStyle> = {
      small: { fontSize: fontSize.sm },
      medium: { fontSize: fontSize.md },
      large: { fontSize: fontSize.lg },
    };

    const variantStyles: Record<string, TextStyle> = {
      primary: { color: colors.white },
      secondary: { color: colors.white },
      outline: { color: colors.primary },
      danger: { color: colors.white },
    };

    return {
      fontWeight: '600',
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.white} />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
