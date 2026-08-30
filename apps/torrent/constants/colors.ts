/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#EBEBE8', // Classic Linen
    tint: '#E11D48', // Crimson Red
    background: '#000000', // Jet Black
    foreground: '#EBEBE8',
    card: '#0D1117',
    cardForeground: '#EBEBE8',
    primary: '#E11D48', // Crimson Red
    primaryForeground: '#FFFFFF',
    secondary: '#161B22',
    secondaryForeground: '#EBEBE8',
    muted: '#1F242C',
    mutedForeground: '#8B949E',
    accent: '#E11D48',
    accentForeground: '#FFFFFF',
    destructive: '#E11D48',
    destructiveForeground: '#FFFFFF',
    border: '#21262D',
    input: '#161B22',
    warning: '#E3B341',
    info: '#58A6FF',
    shadow: '#000000',
  },
  radius: 8,
};

export default colors;
