export type SportDisciplineOption = {
  value: string;
  label: string;
  family: string;
  tags: string[];
  featuredRank: number | undefined;
  isBase: boolean;
  sortRank: number;
};

type SportDisciplineFamily = {
  key: string;
  baseLabel: string;
  tags: string[];
  variants: string[];
  featuredRank?: number;
};

const INITIAL_VISIBLE_DISCIPLINES = 10;
const DISCIPLINE_BATCH_SIZE = 10;

const SPORT_DISCIPLINE_FAMILIES: SportDisciplineFamily[] = [
  {
    key: "musculacion",
    baseLabel: "Musculación",
    tags: ["strength", "gym"],
    featuredRank: 1,
    variants: ["", "Competición", "Classic Physique", "Men's Physique"],
  },
  {
    key: "hyrox",
    baseLabel: "Hyrox",
    tags: ["hybrid", "endurance", "competition"],
    featuredRank: 2,
    variants: ["", "Doubles", "Pro", "Relay"],
  },
  {
    key: "crossfit",
    baseLabel: "CrossFit",
    tags: ["hybrid", "strength", "skill"],
    featuredRank: 3,
    variants: ["", "Endurance", "Gymnastics", "Competition"],
  },
  {
    key: "powerlifting",
    baseLabel: "Powerlifting",
    tags: ["strength", "barbell"],
    featuredRank: 4,
    variants: ["", "Raw", "Equipado", "Bench Press"],
  },
  {
    key: "halterofilia",
    baseLabel: "Halterofilia",
    tags: ["strength", "barbell", "olympic"],
    featuredRank: 5,
    variants: ["", "Técnica", "Competición", "Fuerza olímpica"],
  },
  {
    key: "calistenia",
    baseLabel: "Calistenia",
    tags: ["strength", "skill", "bodyweight"],
    featuredRank: 6,
    variants: ["", "Street Lifting", "Freestyle", "Skills"],
  },
  {
    key: "running",
    baseLabel: "Running",
    tags: ["endurance", "outdoor"],
    featuredRank: 7,
    variants: ["", "Trail", "Pista", "Maratón"],
  },
  {
    key: "ciclismo",
    baseLabel: "Ciclismo",
    tags: ["endurance", "outdoor", "wheels"],
    featuredRank: 8,
    variants: ["", "Ruta", "MTB", "Gravel"],
  },
  {
    key: "natacion",
    baseLabel: "Natación",
    tags: ["endurance", "water"],
    featuredRank: 9,
    variants: ["", "Aguas abiertas", "Velocidad", "Fondo"],
  },
  {
    key: "triatlon",
    baseLabel: "Triatlón",
    tags: ["endurance", "hybrid", "water", "outdoor"],
    featuredRank: 10,
    variants: ["", "Sprint", "Olímpico", "Media distancia"],
  },
  {
    key: "remo",
    baseLabel: "Remo",
    tags: ["endurance", "water", "power"],
    variants: ["", "Olímpico", "Indoor", "Coastal"],
  },
  {
    key: "escalada",
    baseLabel: "Escalada",
    tags: ["skill", "outdoor", "grip"],
    variants: ["", "Búlder", "Deportiva", "Velocidad"],
  },
  {
    key: "boxeo",
    baseLabel: "Boxeo",
    tags: ["combat", "conditioning"],
    variants: ["", "Amateur", "Olímpico", "Técnico"],
  },
  {
    key: "kickboxing",
    baseLabel: "Kickboxing",
    tags: ["combat", "conditioning"],
    variants: ["", "K1", "Light Contact", "Full Contact"],
  },
  {
    key: "judo",
    baseLabel: "Judo",
    tags: ["combat", "grip", "skill"],
    variants: ["", "Competición", "Ne Waza", "Técnica"],
  },
  {
    key: "jiu-jitsu",
    baseLabel: "Jiu-Jitsu",
    tags: ["combat", "grip", "skill"],
    variants: ["", "Gi", "No Gi", "Submission"],
  },
  {
    key: "tenis",
    baseLabel: "Tenis",
    tags: ["racket", "outdoor", "coordination"],
    variants: ["", "Individual", "Dobles", "Competición"],
  },
  {
    key: "padel",
    baseLabel: "Pádel",
    tags: ["racket", "coordination"],
    variants: ["", "Indoor", "Outdoor", "Competición"],
  },
  {
    key: "futbol",
    baseLabel: "Fútbol",
    tags: ["team", "field", "conditioning"],
    variants: ["", "11", "Sala", "Playa"],
  },
  {
    key: "baloncesto",
    baseLabel: "Baloncesto",
    tags: ["team", "court", "coordination"],
    variants: ["", "5x5", "3x3", "Skills"],
  },
  {
    key: "voleibol",
    baseLabel: "Voleibol",
    tags: ["team", "court", "coordination"],
    variants: ["", "Pista", "Playa", "Competición"],
  },
  {
    key: "rugby",
    baseLabel: "Rugby",
    tags: ["team", "field", "contact"],
    variants: ["", "XV", "Sevens", "Preparación física"],
  },
  {
    key: "hockey",
    baseLabel: "Hockey",
    tags: ["team", "field", "coordination"],
    variants: ["", "Hierba", "Hielo", "Sala"],
  },
  {
    key: "gimnasia",
    baseLabel: "Gimnasia",
    tags: ["skill", "mobility", "bodyweight"],
    variants: ["", "Artística", "Rítmica", "Acrobática"],
  },
  {
    key: "surf",
    baseLabel: "Surf",
    tags: ["water", "skill", "outdoor"],
    variants: ["", "Shortboard", "Longboard", "Competición"],
  },
  {
    key: "esqui",
    baseLabel: "Esquí",
    tags: ["winter", "outdoor", "skill"],
    variants: ["", "Alpino", "Fondo", "Travesía"],
  },
  {
    key: "snowboard",
    baseLabel: "Snowboard",
    tags: ["winter", "outdoor", "skill"],
    variants: ["", "Freestyle", "Boardercross", "Halfpipe"],
  },
] as const;

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildSportDisciplineOptions() {
  return SPORT_DISCIPLINE_FAMILIES.flatMap((family, familyIndex) =>
    family.variants.map((variant, variantIndex) => {
      const isBase = !variant;
      const value = isBase ? family.key : `${family.key}-${slugify(variant)}`;
      const label = isBase ? family.baseLabel : `${family.baseLabel} ${variant}`;

      return {
        value,
        label,
        family: family.key,
        tags: [...family.tags, family.key],
        featuredRank: family.featuredRank,
        isBase,
        sortRank: familyIndex * 10 + variantIndex,
      } satisfies SportDisciplineOption;
    })
  );
}

function scoreDiscipline(option: SportDisciplineOption, selected: SportDisciplineOption[]) {
  if (!selected.length) {
    return (option.featuredRank ? 220 - option.featuredRank * 10 : 0) + (option.isBase ? 12 : 0);
  }

  const selectedFamilies = new Set(selected.map((item) => item.family));
  const selectedTags = new Set(selected.flatMap((item) => item.tags));
  let score = 0;

  if (selectedFamilies.has(option.family)) {
    score += 90;
  }

  score += option.tags.filter((tag) => selectedTags.has(tag)).length * 16;

  if (option.isBase) {
    score += 8;
  }

  if (option.featuredRank) {
    score += Math.max(0, 18 - option.featuredRank);
  }

  return score;
}

export const SPORT_DISCIPLINE_OPTIONS = buildSportDisciplineOptions();
export const SPORT_DISCIPLINE_BATCH_SIZE = DISCIPLINE_BATCH_SIZE;
export const SPORT_DISCIPLINE_INITIAL_VISIBLE = INITIAL_VISIBLE_DISCIPLINES;

export function getSportDisciplineLabel(value: string) {
  return SPORT_DISCIPLINE_OPTIONS.find((option) => option.value === value)?.label || value;
}

export function getVisibleSportDisciplines(
  selectedValues: string[],
  visibleCount: number
): SportDisciplineOption[] {
  const optionMap = new Map(
    SPORT_DISCIPLINE_OPTIONS.map((option) => [option.value, option] as const)
  );

  const selected = selectedValues
    .map((value) => optionMap.get(value))
    .filter((option): option is SportDisciplineOption => Boolean(option));

  const selectedSet = new Set(selected.map((option) => option.value));
  const remaining = SPORT_DISCIPLINE_OPTIONS.filter((option) => !selectedSet.has(option.value));

  remaining.sort((left, right) => {
    const scoreDiff = scoreDiscipline(right, selected) - scoreDiscipline(left, selected);
    if (scoreDiff !== 0) return scoreDiff;

    const featuredDiff = (left.featuredRank ?? 999) - (right.featuredRank ?? 999);
    if (featuredDiff !== 0) return featuredDiff;

    const baseDiff = Number(right.isBase) - Number(left.isBase);
    if (baseDiff !== 0) return baseDiff;

    return left.sortRank - right.sortRank;
  });

  const ordered = [...selected, ...remaining];
  return ordered.slice(0, Math.min(Math.max(visibleCount, selected.length), ordered.length));
}
