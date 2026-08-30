import { Platform } from 'react-native';

export const tokens = {
  colors: {
    // Canvas & Dark theme base
    canvas: '#0F172A',        // Slate 900
    canvasDark: '#020617',    // Slate 950
    canvasElevated: '#1E293B', // Slate 800
    
    // Solid UI fills (replacing glass)
    glassBase: '#1E293B',
    glassLight: '#334155',
    glassCard: '#1E293B',
    glassInput: '#0F172A',
    glassButton: '#334155',
    glassHighlight: 'rgba(255, 255, 255, 0.05)',
    
    // Solid borders
    glassBorder: '#334155',
    glassBorderHighlight: '#475569',
    glassBorderSubtle: '#1E293B',
    
    // Primary & Accent Brand Colors
    primary: '#3B82F6',         // Electric Blue 500
    primaryLight: '#60A5FA',    // Blue 400
    primaryDark: '#2563EB',     // Blue 600
    primaryGlow: 'rgba(59, 130, 246, 0.35)',
    
    accent: '#8B5CF6',          // Vibrant Violet 500
    accentLight: '#A78BFA',     // Violet 400
    accentDark: '#7C3AED',      // Violet 600
    accentGlow: 'rgba(139, 92, 246, 0.35)',

    cyan: '#06B6D4',            // Cyan 500
    cyanGlow: 'rgba(6, 182, 212, 0.30)',
    
    // Status & Semantic Colors
    success: '#10B981',         // Emerald 500
    successLight: '#34D399',
    successDark: '#059669',
    successGlass: 'rgba(16, 185, 129, 0.15)',
    successBorder: 'rgba(16, 185, 129, 0.30)',
    
    danger: '#F43F5E',          // Rose 500
    dangerLight: '#FB7185',
    dangerDark: '#E11D48',
    dangerGlass: 'rgba(244, 63, 94, 0.15)',
    dangerBorder: 'rgba(244, 63, 94, 0.30)',
    
    warning: '#F59E0B',         // Amber 500
    warningGlass: 'rgba(245, 158, 11, 0.15)',
    warningBorder: 'rgba(245, 158, 11, 0.30)',
    
    // Text Hierarchy
    text: '#FFFFFF',            // Crisp High Contrast
    textSecondary: '#E2E8F0',   // Slate 200
    textMuted: '#94A3B8',       // Slate 400
    textDim: '#64748B',         // Slate 500
    textDisabled: '#475569',    // Slate 600
    
    // Legacy support mappings
    background: '#0A0F1D',
    surface: 'rgba(23, 32, 54, 0.75)',
    surfaceLight: 'rgba(51, 65, 85, 0.50)',
    border: 'rgba(255, 255, 255, 0.10)',
  },

  gradients: {
    primary: ['#3B82F6', '#2563EB', '#1D4ED8'],
    accent: ['#8B5CF6', '#7C3AED', '#6366F1'],
    heroSpend: ['#1E1B4B', '#0F172A', '#0F2537'],
    glassCard: ['#1E293B', '#1E293B'],
    glassCardHighlight: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)'],
    emerald: ['#10B981', '#059669'],
    rose: ['#F43F5E', '#E11D48'],
    amber: ['#F59E0B', '#D97706'],
    cyan: ['#06B6D4', '#0284C7'],
    floatingNav: ['#1E293B', '#0F172A'],
  },

  typography: {
    h1: {
      fontSize: 30,
      fontWeight: '700',
      letterSpacing: -0.5,
      color: '#FFFFFF',
    },
    h2: {
      fontSize: 22,
      fontWeight: '700',
      letterSpacing: -0.3,
      color: '#FFFFFF',
    },
    h3: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    subtitle: {
      fontSize: 15,
      fontWeight: '500',
      color: '#94A3B8',
      lineHeight: 22,
    },
    body: {
      fontSize: 14,
      fontWeight: '400',
      color: '#E2E8F0',
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '500',
      color: '#94A3B8',
    },
    badge: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
  },

  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  borderRadius: {
    xs: 4,
    sm: 8,
    md: 14,
    lg: 20,
    xl: 26,
    xxl: 32,
    round: 9999,
  },

  shadows: {
    subtle: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 4,
    },
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    },
    primaryGlow: {
      shadowColor: '#3B82F6',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.45,
      shadowRadius: 16,
      elevation: 8,
    },
    accentGlow: {
      shadowColor: '#8B5CF6',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.45,
      shadowRadius: 16,
      elevation: 8,
    },
    dangerGlow: {
      shadowColor: '#F43F5E',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.40,
      shadowRadius: 14,
      elevation: 6,
    },
  },

  blurIntensity: Platform.OS === 'ios' ? 45 : 30,
};

export default tokens;
