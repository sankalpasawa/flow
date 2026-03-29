// DayFlow Design System — Warm Minimal
// Based on Sankalp's design spec

export const colors = {
  bg: '#FAF7F2',
  surface: '#FFFFFF',
  surface2: '#F4F0EA',
  text: '#1A1A1A',
  text2: '#5A5550',
  muted: '#9A9490',
  border: '#F0EAE0',
  shadow: 'rgba(45,74,62,0.10)',

  // Primary (Deep Work green)
  primary: '#2D4A3E',
  primaryLight: '#3D6454',
  primaryBg: '#EBF2EE',

  // Category palette
  terra: '#C4795B',
  terraLight: '#F0DDD5',
  sage: '#7B9E87',
  sageLight: '#DFF0E6',
  slate: '#4A6B8A',
  slateLight: '#D5E5F5',
  mauve: '#8B6B8A',
  mauveLight: '#EDE0ED',
  amber: '#B8860B',
  amberLight: '#F5EAC8',

  // Status
  done: '#2D4A3E',
  active: '#C4795B',
  planned: '#EDE8E1',

  // Semantic
  danger: '#E53E3E',
  dangerLight: '#FFE4E1',
} as const;

// Map category IDs to color pairs
export const categoryColors: Record<string, { solid: string; light: string }> = {
  'sys-deep-work': { solid: colors.primary, light: colors.primaryBg },
  'sys-meetings': { solid: colors.slate, light: colors.slateLight },
  'sys-admin': { solid: colors.muted, light: colors.surface2 },
  'sys-health': { solid: colors.terra, light: colors.terraLight },
  'sys-learning': { solid: colors.mauve, light: colors.mauveLight },
  'sys-personal': { solid: colors.sage, light: colors.sageLight },
  'sys-creative': { solid: colors.amber, light: colors.amberLight },
  'sys-rest': { solid: colors.sage, light: colors.sageLight },
  'cust-social': { solid: colors.amber, light: colors.amberLight },
  'cust-family': { solid: colors.terra, light: colors.terraLight },
  'cust-finance': { solid: colors.primary, light: colors.primaryBg },
  'cust-wedding': { solid: colors.mauve, light: colors.mauveLight },
  'cust-chores': { solid: colors.muted, light: colors.surface2 },
  'cust-explore': { solid: colors.slate, light: colors.slateLight },
  'cust-mumbai': { solid: colors.terra, light: colors.terraLight },
  'cust-fashion': { solid: colors.mauve, light: colors.mauveLight },
  'cust-duniyadari': { solid: colors.slate, light: colors.slateLight },
  'cust-professional': { solid: colors.primary, light: colors.primaryBg },
};

export function getCategoryColor(categoryId: string) {
  return categoryColors[categoryId] ?? { solid: colors.primary, light: colors.primaryBg };
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  screen: 24, // horizontal page padding
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 16,
  xl: 20,
  pill: 20,
  button: 16,
  card: 16,
  sheet: 24,
} as const;

export const shadows = {
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  card: {
    shadowColor: '#2D4A3E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  fab: {
    shadowColor: '#2D4A3E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 20,
  },
} as const;

export const typography = {
  displayLarge: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
  headline: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
  title: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.4 },
  caption: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.3 },
} as const;
