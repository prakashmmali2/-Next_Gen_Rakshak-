import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, shadows, fontSize } from '../utils/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, style, onPress }) => {
  if (onPress) {
    return (
      <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.card, style]}>{children}</View>;
};

interface CardTitleProps {
  children: string;
  style?: ViewStyle;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, style }) => (
  <Text style={[styles.title, style]}>{children}</Text>
);

interface CardSubtitleProps {
  children: string;
  style?: ViewStyle;
}

export const CardSubtitle: React.FC<CardSubtitleProps> = ({ children, style }) => (
  <Text style={[styles.subtitle, style]}>{children}</Text>
);

interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const CardContent: React.FC<CardContentProps> = ({ children, style }) => (
  <View style={[styles.content, style]}>{children}</View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  content: {
    marginTop: spacing.sm,
  },
});
