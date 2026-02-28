export const colors = {
  primary: '#2E7D32',
  primaryDark: '#1B5E20',
  primaryLight: '#4CAF50',
  secondary: '#1565C0',
  secondaryDark: '#0D47A1',
  secondaryLight: '#42A5F5',
  accent: '#FF6F00',
  accentLight: '#FFA000',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  textPrimary: '#212121',
  textSecondary: '#757575',
  textLight: '#BDBDBD',
  success: '#4CAF50',
  successLight: '#81C784',
  warning: '#FFC107',
  warningLight: '#FFD54F',
  error: '#F44336',
  errorLight: '#E57373',
  border: '#E0E0E0',
  divider: '#EEEEEE',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
};

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  title: 24,
  header: 28,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};
