export const Theme = {
  colors: {
    primary: '#8B5E3C', // Classic Brown
    primaryLight: '#A87B56',
    primaryDark: '#5E3A21',
    secondary: '#C8A97E', // Gold/Sand
    background: '#F9F6F0', // Soft Cream
    surface: '#FFFFFF', // White cards
    surfaceLight: '#FDFBF7',
    text: '#1C1C1E', // Dark text
    textMuted: '#8E8E93', // Muted text
    textLight: '#FFFFFF',
    danger: '#E74C3C',
    success: '#34C759',
    warning: '#F39C12',
    border: '#E5E5EA',
    inputBg: '#F2F2F7',
  },
  typography: {
    h1: { fontSize: 28, fontWeight: '700' as const, color: '#1C1C1E' },
    h2: { fontSize: 24, fontWeight: '700' as const, color: '#1C1C1E' },
    h3: { fontSize: 20, fontWeight: '600' as const, color: '#1C1C1E' },
    subtitle: { fontSize: 16, fontWeight: '500' as const, color: '#8E8E93' },
    body: { fontSize: 14, color: '#1C1C1E' },
    caption: { fontSize: 12, color: '#8E8E93' },
    button: { fontSize: 16, fontWeight: '600' as const, color: '#FFFFFF' },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};
