// Generates a full Tailwind-style 50–950 shade ramp from a single hex color,
// so an organization can pick one brand color and every existing `brand-*`
// utility class (buttons, links, active nav, headers) picks it up via CSS
// variables — see tailwind.config.ts and the `:root` override rendered in
// the org layout.

export const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export const BRAND_SHADE_KEYS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type BrandShade = (typeof BRAND_SHADE_KEYS)[number];

// Target lightness (%) and a saturation multiplier per shade, tuned to
// resemble a typical Tailwind blue ramp while deriving hue/saturation from
// whatever color the organization picks.
const RAMP: Record<BrandShade, { l: number; sMul: number }> = {
  50: { l: 97, sMul: 0.55 },
  100: { l: 94, sMul: 0.65 },
  200: { l: 87, sMul: 0.75 },
  300: { l: 76, sMul: 0.85 },
  400: { l: 63, sMul: 0.95 },
  500: { l: 52, sMul: 1 },
  600: { l: 44, sMul: 1 },
  700: { l: 37, sMul: 1 },
  800: { l: 30, sMul: 0.95 },
  900: { l: 25, sMul: 0.9 },
  950: { l: 15, sMul: 0.85 },
};

function hexToHsl(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;

  if (d === 0) return { h: 0, s: 0, l: l * 100 };

  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / d) % 6;
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
  }
  h *= 60;
  if (h < 0) h += 360;

  return { h, s: s * 100, l: l * 100 };
}

function hslToRgb(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/** Returns a "R G B" triplet per shade, suitable for `rgb(var(--brand-600) / <alpha-value>)`. */
export function generateBrandShades(hex: string): Record<BrandShade, string> {
  const { h, s } = hexToHsl(hex);
  const result = {} as Record<BrandShade, string>;
  for (const shade of BRAND_SHADE_KEYS) {
    const { l, sMul } = RAMP[shade];
    const { r, g, b } = hslToRgb(h, Math.min(s * sMul, 95), l);
    result[shade] = `${r} ${g} ${b}`;
  }
  return result;
}
