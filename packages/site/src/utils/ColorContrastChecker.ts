/**
 * Color Contrast Checker
 * Utilities for checking WCAG color contrast compliance and suggesting improvements
 */

export interface ColorHSL {
  h: number
  s: number
  l: number
}

export interface ColorRGB {
  r: number
  g: number
  b: number
}

export interface ContrastResult {
  ratio: number
  passes: {
    AA: boolean
    AAA: boolean
    AALarge: boolean
    AAALarge: boolean
  }
  recommendation?: string
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(h: number, s: number, l: number): ColorRGB {
  h = h / 360
  s = s / 100
  l = l / 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1))
  const m = l - c / 2

  let r: number, g: number, b: number

  if (h < 1/6) {
    [r, g, b] = [c, x, 0]
  } else if (h < 2/6) {
    [r, g, b] = [x, c, 0]
  } else if (h < 3/6) {
    [r, g, b] = [0, c, x]
  } else if (h < 4/6) {
    [r, g, b] = [0, x, c]
  } else if (h < 5/6) {
    [r, g, b] = [x, 0, c]
  } else {
    [r, g, b] = [c, 0, x]
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  }
}

/**
 * Calculate relative luminance of a color
 */
export function getLuminance(rgb: ColorRGB): number {
  const { r, g, b } = rgb
  
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: ColorRGB, color2: ColorRGB): number {
  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)
  
  const lightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  
  return (lightest + 0.05) / (darkest + 0.05)
}

/**
 * Check if contrast ratio meets WCAG guidelines
 */
export function checkContrast(ratio: number): ContrastResult['passes'] {
  return {
    AA: ratio >= 4.5,
    AAA: ratio >= 7,
    AALarge: ratio >= 3, // For text 18pt+ or bold 14pt+
    AAALarge: ratio >= 4.5 // For large text at AAA level
  }
}

/**
 * Analyze contrast and provide recommendations
 */
export function analyzeContrast(foreground: ColorRGB, background: ColorRGB): ContrastResult {
  const ratio = getContrastRatio(foreground, background)
  const passes = checkContrast(ratio)
  
  let recommendation: string | undefined
  
  if (!passes.AA) {
    recommendation = `Contrast ratio ${ratio.toFixed(2)} fails WCAG AA (4.5:1). Consider darkening text or lightening background.`
  } else if (!passes.AAA) {
    recommendation = `Contrast ratio ${ratio.toFixed(2)} passes WCAG AA but fails AAA (7:1). Consider improving for better accessibility.`
  }
  
  return { ratio, passes, recommendation }
}

/**
 * Suggest improved colors that meet WCAG guidelines
 */
export function suggestImprovedColors(
  foregroundHsl: ColorHSL,
  backgroundHsl: ColorHSL,
  targetRatio: number = 4.5
): { foreground?: ColorHSL; background?: ColorHSL } {
  const foregroundRgb = hslToRgb(foregroundHsl.h, foregroundHsl.s, foregroundHsl.l)
  const backgroundRgb = hslToRgb(backgroundHsl.h, backgroundHsl.s, backgroundHsl.l)
  
  const currentRatio = getContrastRatio(foregroundRgb, backgroundRgb)
  
  if (currentRatio >= targetRatio) {
    return {} // Already meets target
  }
  
  const suggestions: { foreground?: ColorHSL; background?: ColorHSL } = {}
  
  // Try darkening foreground
  for (let l = foregroundHsl.l; l >= 0; l -= 5) {
    const testForeground = hslToRgb(foregroundHsl.h, foregroundHsl.s, l)
    const ratio = getContrastRatio(testForeground, backgroundRgb)
    
    if (ratio >= targetRatio) {
      suggestions.foreground = { ...foregroundHsl, l }
      break
    }
  }
  
  // Try lightening background
  for (let l = backgroundHsl.l; l <= 100; l += 5) {
    const testBackground = hslToRgb(backgroundHsl.h, backgroundHsl.s, l)
    const ratio = getContrastRatio(foregroundRgb, testBackground)
    
    if (ratio >= targetRatio) {
      suggestions.background = { ...backgroundHsl, l }
      break
    }
  }
  
  return suggestions
}

/**
 * Color palette analysis for the site's current theme colors
 */
export const SITE_COLORS = {
  light: {
    background: { h: 0, s: 0, l: 100 }, // --background: 0 0% 100%
    foreground: { h: 224, s: 71.4, l: 4.1 }, // --foreground: 224 71.4% 4.1%
    muted: { h: 220, s: 14.3, l: 95.9 }, // --muted: 220 14.3% 95.9%
    mutedForeground: { h: 220, s: 8.9, l: 46.1 }, // --muted-foreground: 220 8.9% 46.1%
    primary: { h: 220.9, s: 39.3, l: 11 }, // --primary: 220.9 39.3% 11%
    primaryForeground: { h: 210, s: 20, l: 98 }, // --primary-foreground: 210 20% 98%
    secondary: { h: 220, s: 14.3, l: 95.9 }, // --secondary: 220 14.3% 95.9%
    secondaryForeground: { h: 220.9, s: 39.3, l: 11 }, // --secondary-foreground: 220.9 39.3% 11%
  },
  dark: {
    background: { h: 224, s: 71.4, l: 4.1 }, // --background: 224 71.4% 4.1%
    foreground: { h: 210, s: 20, l: 98 }, // --foreground: 210 20% 98%
    muted: { h: 215, s: 27.9, l: 16.9 }, // --muted: 215 27.9% 16.9%
    mutedForeground: { h: 217.9, s: 10.6, l: 64.9 }, // --muted-foreground: 217.9 10.6% 64.9%
    primary: { h: 210, s: 20, l: 98 }, // --primary: 210 20% 98%
    primaryForeground: { h: 220.9, s: 39.3, l: 11 }, // --primary-foreground: 220.9 39.3% 11%
    secondary: { h: 215, s: 27.9, l: 16.9 }, // --secondary: 215 27.9% 16.9%
    secondaryForeground: { h: 210, s: 20, l: 98 }, // --secondary-foreground: 210 20% 98%
  }
}

/**
 * Analyze all site color combinations for contrast issues
 */
export function analyzeSiteColorContrast(): {
  light: Record<string, ContrastResult>
  dark: Record<string, ContrastResult>
} {
  const results = {
    light: {} as Record<string, ContrastResult>,
    dark: {} as Record<string, ContrastResult>
  }
  
  // Analyze light theme
  const lightBg = hslToRgb(SITE_COLORS.light.background.h, SITE_COLORS.light.background.s, SITE_COLORS.light.background.l)
  
  results.light['foreground-on-background'] = analyzeContrast(
    hslToRgb(SITE_COLORS.light.foreground.h, SITE_COLORS.light.foreground.s, SITE_COLORS.light.foreground.l),
    lightBg
  )
  
  results.light['muted-foreground-on-background'] = analyzeContrast(
    hslToRgb(SITE_COLORS.light.mutedForeground.h, SITE_COLORS.light.mutedForeground.s, SITE_COLORS.light.mutedForeground.l),
    lightBg
  )
  
  const lightMuted = hslToRgb(SITE_COLORS.light.muted.h, SITE_COLORS.light.muted.s, SITE_COLORS.light.muted.l)
  
  results.light['foreground-on-muted'] = analyzeContrast(
    hslToRgb(SITE_COLORS.light.foreground.h, SITE_COLORS.light.foreground.s, SITE_COLORS.light.foreground.l),
    lightMuted
  )
  
  // Analyze dark theme
  const darkBg = hslToRgb(SITE_COLORS.dark.background.h, SITE_COLORS.dark.background.s, SITE_COLORS.dark.background.l)
  
  results.dark['foreground-on-background'] = analyzeContrast(
    hslToRgb(SITE_COLORS.dark.foreground.h, SITE_COLORS.dark.foreground.s, SITE_COLORS.dark.foreground.l),
    darkBg
  )
  
  results.dark['muted-foreground-on-background'] = analyzeContrast(
    hslToRgb(SITE_COLORS.dark.mutedForeground.h, SITE_COLORS.dark.mutedForeground.s, SITE_COLORS.dark.mutedForeground.l),
    darkBg
  )
  
  const darkMuted = hslToRgb(SITE_COLORS.dark.muted.h, SITE_COLORS.dark.muted.s, SITE_COLORS.dark.muted.l)
  
  results.dark['foreground-on-muted'] = analyzeContrast(
    hslToRgb(SITE_COLORS.dark.foreground.h, SITE_COLORS.dark.foreground.s, SITE_COLORS.dark.foreground.l),
    darkMuted
  )
  
  return results
}

/**
 * Generate improved color palette that meets WCAG AA standards
 */
export function generateImprovedColorPalette(): {
  light: typeof SITE_COLORS.light
  dark: typeof SITE_COLORS.dark
} {
  const improved = {
    light: { ...SITE_COLORS.light },
    dark: { ...SITE_COLORS.dark }
  }
  
  // Improve muted foreground contrast in light theme
  // Current muted-foreground: 220 8.9% 46.1% might not have enough contrast
  improved.light.mutedForeground = { h: 220, s: 8.9, l: 38 } // Darker for better contrast
  
  // Improve muted foreground contrast in dark theme
  // Current muted-foreground: 217.9 10.6% 64.9% might not have enough contrast
  improved.dark.mutedForeground = { h: 217.9, s: 10.6, l: 75 } // Lighter for better contrast
  
  return improved
}

/**
 * Utility to format HSL for CSS
 */
export function formatHSL(hsl: ColorHSL): string {
  return `${hsl.h} ${hsl.s}% ${hsl.l}%`
}