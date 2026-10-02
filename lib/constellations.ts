/**
 * Real constellations for Your sky (app/your-sky.tsx): the person chooses one, and each practice
 * session lights its next star. Stars are placed from their real positions (J2000 right ascension
 * in hours, declination in degrees, rounded), projected as seen looking up (east to the left), and
 * listed in the order they light, along the figure. The number of stars is the difficulty.
 * Star names are the traditional ones; most come from Arabic, and carry it where it's well known.
 */

export interface Star {
  /** Right ascension, hours. */
  ra: number;
  /** Declination, degrees. */
  dec: number;
  /** Apparent brightness (magnitude): smaller is brighter, drawn larger. */
  mag: number;
  name?: { en: string; ar?: string };
}

export interface Constellation {
  id: string;
  name: { en: string; ar: string };
  /** Lit in this order. */
  stars: Star[];
  /** The figure: pairs of indexes into `stars`. */
  lines: [number, number][];
}

const s = (ra: number, dec: number, mag: number, en?: string, ar?: string): Star => ({
  ra,
  dec,
  mag,
  ...(en ? { name: { en, ...(ar ? { ar } : {}) } } : {}),
});

/** Easiest first: by the number of stars to light. */
export const CONSTELLATIONS: Constellation[] = [
  {
    id: 'crux',
    name: { en: 'The Southern Cross', ar: 'الصليب الجنوبي' },
    stars: [
      s(12.443, -63.1, 0.8, 'Acrux'),
      s(12.519, -57.11, 1.6, 'Gacrux'),
      s(12.795, -59.69, 1.3, 'Mimosa'),
      s(12.252, -58.75, 2.8, 'Imai'),
      s(12.356, -60.4, 3.6, 'Ginan'),
    ],
    lines: [
      [0, 1],
      [2, 3],
    ],
  },
  {
    id: 'cassiopeia',
    name: { en: 'Cassiopeia', ar: 'ذات الكرسي' },
    stars: [
      s(0.153, 59.15, 2.3, 'Caph', 'الكف'),
      s(0.675, 56.54, 2.2, 'Schedar', 'الصدر'),
      s(0.945, 60.72, 2.2, 'Navi'),
      s(1.43, 60.24, 2.7, 'Ruchbah', 'الركبة'),
      s(1.907, 63.67, 3.4, 'Segin'),
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
  },
  {
    id: 'lyra',
    name: { en: 'Lyra', ar: 'القيثارة' },
    stars: [
      s(18.615, 38.78, 0, 'Vega', 'النسر الواقع'),
      s(18.739, 39.67, 4.7),
      s(18.747, 37.61, 4.3),
      s(18.835, 33.36, 3.5, 'Sheliak', 'السلياق'),
      s(18.982, 32.69, 3.2, 'Sulafat', 'السلحفاة'),
      s(18.908, 36.9, 4.3),
    ],
    lines: [
      [0, 1],
      [0, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 2],
    ],
  },
  {
    id: 'pleiades',
    name: { en: 'The Pleiades', ar: 'الثريا' },
    stars: [
      s(3.791, 24.11, 2.9, 'Alcyone'),
      s(3.82, 24.05, 3.6, 'Atlas'),
      s(3.772, 23.95, 4.2, 'Merope'),
      s(3.748, 24.11, 3.7, 'Electra'),
      s(3.763, 24.37, 3.9, 'Maia'),
      s(3.754, 24.47, 4.3, 'Taygeta'),
      s(3.747, 24.29, 5.4, 'Celaeno'),
    ],
    lines: [
      [1, 0],
      [0, 2],
      [2, 3],
      [3, 4],
      [4, 0],
      [4, 5],
      [3, 6],
    ],
  },
  {
    id: 'ursa-major',
    name: { en: 'The Big Dipper', ar: 'بنات نعش الكبرى' },
    stars: [
      s(13.792, 49.31, 1.9, 'Alkaid', 'القائد'),
      s(13.399, 54.93, 2.2, 'Mizar', 'المئزر'),
      s(12.9, 55.96, 1.8, 'Alioth'),
      s(12.257, 57.03, 3.3, 'Megrez', 'المغرز'),
      s(11.062, 61.75, 1.8, 'Dubhe', 'الدب'),
      s(11.031, 56.38, 2.4, 'Merak', 'المراق'),
      s(11.897, 53.69, 2.4, 'Phecda', 'الفخذ'),
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 3],
    ],
  },
  {
    id: 'ursa-minor',
    name: { en: 'The Little Dipper', ar: 'بنات نعش الصغرى' },
    stars: [
      s(2.53, 89.26, 2, 'Polaris', 'الجدي'),
      s(17.537, 86.59, 4.4, 'Yildun'),
      s(16.766, 82.04, 4.2),
      s(15.734, 77.79, 4.3),
      s(14.845, 74.16, 2.1, 'Kochab', 'الكوكب'),
      s(15.346, 71.83, 3, 'Pherkad', 'الفرقد'),
      s(16.292, 75.76, 4.9),
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 3],
    ],
  },
  {
    id: 'orion',
    name: { en: 'Orion', ar: 'الجبّار' },
    stars: [
      s(5.585, 9.93, 3.4, 'Meissa', 'الهقعة'),
      s(5.919, 7.41, 0.5, 'Betelgeuse', 'يد الجوزاء'),
      s(5.419, 6.35, 1.6, 'Bellatrix', 'المرزم'),
      s(5.533, -0.3, 2.2, 'Mintaka', 'المنطقة'),
      s(5.604, -1.2, 1.7, 'Alnilam', 'النظام'),
      s(5.679, -1.94, 1.8, 'Alnitak', 'النطاق'),
      s(5.796, -9.67, 2.1, 'Saiph', 'السيف'),
      s(5.242, -8.2, 0.1, 'Rigel', 'رجل الجبّار'),
    ],
    lines: [
      [0, 1],
      [0, 2],
      [1, 5],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [3, 7],
    ],
  },
  {
    id: 'cygnus',
    name: { en: 'Cygnus, the Swan', ar: 'الدجاجة' },
    stars: [
      s(20.69, 45.28, 1.3, 'Deneb', 'ذنب الدجاجة'),
      s(20.37, 40.26, 2.2, 'Sadr', 'الصدر'),
      s(19.938, 35.08, 3.9),
      s(19.512, 27.96, 3.1, 'Albireo', 'منقار الدجاجة'),
      s(20.77, 33.97, 2.5, 'Gienah', 'الجناح'),
      s(21.216, 30.23, 3.2),
      s(19.75, 45.13, 2.9),
      s(19.495, 51.73, 3.8),
      s(19.285, 53.37, 3.8),
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [1, 4],
      [4, 5],
      [1, 6],
      [6, 7],
      [7, 8],
    ],
  },
  {
    id: 'leo',
    name: { en: 'Leo, the Lion', ar: 'الأسد' },
    stars: [
      s(10.139, 11.97, 1.4, 'Regulus', 'قلب الأسد'),
      s(10.122, 16.76, 3.5),
      s(10.333, 19.84, 2.1, 'Algieba', 'الجبهة'),
      s(10.278, 23.42, 3.4, 'Adhafera', 'الضفيرة'),
      s(9.88, 26.01, 3.9, 'Rasalas', 'رأس الأسد'),
      s(9.764, 23.77, 3),
      s(11.235, 20.52, 2.6, 'Zosma', 'الزبرة'),
      s(11.818, 14.57, 2.1, 'Denebola', 'ذنب الأسد'),
      s(11.237, 15.43, 3.3, 'Chertan', 'الخرتان'),
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [2, 6],
      [6, 7],
      [7, 8],
      [8, 0],
    ],
  },
  {
    id: 'scorpius',
    name: { en: 'Scorpius', ar: 'العقرب' },
    stars: [
      s(16.09, -19.81, 2.6, 'Acrab'),
      s(16.006, -22.62, 2.3, 'Dschubba', 'الجبهة'),
      s(15.981, -26.11, 2.9),
      s(16.353, -25.59, 2.9),
      s(16.49, -26.43, 1.1, 'Antares', 'قلب العقرب'),
      s(16.598, -28.22, 2.8),
      s(16.836, -34.29, 2.3),
      s(16.865, -38.05, 3),
      s(16.91, -42.36, 3.6),
      s(17.203, -43.24, 3.3),
      s(17.622, -43, 1.9, 'Sargas'),
      s(17.793, -40.13, 3),
      s(17.708, -39.03, 2.4),
      s(17.56, -37.1, 1.6, 'Shaula', 'الشولة'),
      s(17.513, -37.3, 2.7, 'Lesath', 'اللسعة'),
    ],
    lines: [
      [0, 1],
      [1, 2],
      [1, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 9],
      [9, 10],
      [10, 11],
      [11, 12],
      [12, 13],
      [13, 14],
    ],
  },
];

export function constellationById(id: string | null | undefined): Constellation | null {
  return CONSTELLATIONS.find((c) => c.id === id) ?? null;
}

/**
 * Each star's place in a box, as seen looking up: onto the plane touching the sky at the figure's
 * middle (so figures near the pole keep their shape), east to the left, north up, fitted inside
 * `pad` with its proportions kept and centred.
 */
export function projectStars(stars: Star[], width: number, height: number, pad = 16): { x: number; y: number }[] {
  const vec = (st: Star) => {
    const a = (st.ra * 15 * Math.PI) / 180;
    const d = (st.dec * Math.PI) / 180;
    return [Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)];
  };
  const vs = stars.map(vec);
  const sum = vs.reduce((acc, v) => [acc[0] + v[0], acc[1] + v[1], acc[2] + v[2]], [0, 0, 0]);
  const norm = (v: number[]) => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return v.map((x) => x / l);
  };
  const c = norm(sum);
  // East: the pole crossed with the middle (any direction will do exactly at a pole).
  let east = [-c[1], c[0], 0];
  if (Math.hypot(east[0], east[1]) < 1e-9) east = [0, 1, 0];
  east = norm(east);
  const north = [c[1] * east[2] - c[2] * east[1], c[2] * east[0] - c[0] * east[2], c[0] * east[1] - c[1] * east[0]];
  const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const plane = vs.map((v) => {
    const k = dot(v, c) || 1;
    // East to the left, as the sky looks from below.
    return { x: -dot(v, east) / k, y: -dot(v, north) / k };
  });
  const xs = plane.map((p) => p.x);
  const ys = plane.map((p) => p.y);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const scale = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanY);
  const offX = (width - spanX * scale) / 2;
  const offY = (height - spanY * scale) / 2;
  return plane.map((p) => ({ x: offX + (p.x - minX) * scale, y: offY + (p.y - minY) * scale }));
}

/** A star's drawn radius from its brightness: the brightest about twice the faintest. */
export function starRadius(mag: number, base: number): number {
  const t = Math.min(1, Math.max(0, (5.5 - mag) / 5.5));
  return base * (0.6 + 0.8 * t);
}
