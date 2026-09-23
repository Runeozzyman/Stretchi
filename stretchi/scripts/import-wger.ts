import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const ENGLISH = 2;
const WGER_PAGE = "https://wger.de/api/v2/exerciseinfo/?format=json&limit=50";
const BATCH = 100;

type Translation = {
  language: number;
  name: string;
  description: string;
};

type Muscle = {
  id: number;
  name: string;
  name_en: string;
};

type EquipmentItem = {
  id: number;
  name: string;
};

type ExerciseInfo = {
  id: number;
  uuid: string;
  category: { name: string } | null;
  muscles: Muscle[];
  muscles_secondary: Muscle[];
  equipment: EquipmentItem[];
  license: { short_name: string } | null;
  license_author: string | null;
  translations: Translation[];
};

type Page = {
  next: string | null;
  results: ExerciseInfo[];
};

type EnglishExercise = {
  exercise: ExerciseInfo;
  english: Translation;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Add it to .env.local before importing.`);
  }
  return value;
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "item";
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function muscleName(muscle: Muscle): string {
  return muscle.name_en?.trim() || muscle.name.trim();
}

function uniqueSlug(base: string, id: number, used: Map<string, number>): string {
  const slug = slugify(base);
  const owner = used.get(slug);
  if (owner === undefined || owner === id) {
    used.set(slug, id);
    return slug;
  }
  const withId = `${slug}-${id}`;
  used.set(withId, id);
  return withId;
}

async function fetchExercises(): Promise<ExerciseInfo[]> {
  const all: ExerciseInfo[] = [];
  let url: string | null = WGER_PAGE;

  while (url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`wger request failed (${response.status}) for ${url}`);
    }
    const page = (await response.json()) as Page;
    all.push(...page.results);
    url = page.next;
  }

  return all;
}

function englishExercises(exercises: ExerciseInfo[]): EnglishExercise[] {
  const rows: EnglishExercise[] = [];
  for (const exercise of exercises) {
    const english = exercise.translations.find((translation) => translation.language === ENGLISH);
    if (!english?.name.trim()) continue;
    rows.push({ exercise, english });
  }
  return rows;
}

async function upsertChunked(
  supabase: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string,
): Promise<Record<string, unknown>[]> {
  const saved: Record<string, unknown>[] = [];
  for (let index = 0; index < rows.length; index += BATCH) {
    const chunk = rows.slice(index, index + BATCH);
    const { data, error } = await supabase.from(table).upsert(chunk, { onConflict }).select();
    if (error) throw new Error(`${table} upsert failed: ${error.message}`);
    saved.push(...(data ?? []));
  }
  return saved;
}

async function deleteLinks(
  supabase: SupabaseClient,
  table: "exercise_areas" | "exercise_equipment",
  exerciseIds: string[],
): Promise<void> {
  for (let index = 0; index < exerciseIds.length; index += BATCH) {
    const chunk = exerciseIds.slice(index, index + BATCH);
    const { error } = await supabase.from(table).delete().in("exercise_id", chunk);
    if (error) throw new Error(`${table} delete failed: ${error.message}`);
  }
}

async function main(): Promise<void> {
  const supabase = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });

  const exercises = englishExercises(await fetchExercises());
  const areas = new Map<number, { slug: string; name: string; wger_muscle_id: number }>();
  const equipment = new Map<number, { slug: string; name: string; wger_equipment_id: number }>();
  const areaSlugs = new Map<string, number>();
  const equipmentSlugs = new Map<string, number>();

  for (const { exercise } of exercises) {
    for (const muscle of [...exercise.muscles, ...exercise.muscles_secondary]) {
      const name = muscleName(muscle);
      if (!name) continue;
      areas.set(muscle.id, {
        slug: uniqueSlug(name, muscle.id, areaSlugs),
        name,
        wger_muscle_id: muscle.id,
      });
    }
    for (const item of exercise.equipment) {
      const name = item.name.trim();
      if (!name) continue;
      const isBodyweight = name.toLowerCase() === "none (bodyweight exercise)";
      equipment.set(item.id, {
        slug: uniqueSlug(isBodyweight ? "bodyweight" : name, item.id, equipmentSlugs),
        name: isBodyweight ? "Bodyweight" : name,
        wger_equipment_id: item.id,
      });
    }
  }

  const areaRows = await upsertChunked(supabase, "body_areas", [...areas.values()], "wger_muscle_id");
  const equipmentRows = await upsertChunked(supabase, "equipment", [...equipment.values()], "wger_equipment_id");
  const areaIds = new Map(areaRows.map((row) => [Number(row.wger_muscle_id), String(row.id)]));
  const equipmentIds = new Map(equipmentRows.map((row) => [Number(row.wger_equipment_id), String(row.id)]));

  const exerciseRows = exercises.map(({ exercise, english }) => ({
    wger_id: exercise.id,
    wger_uuid: exercise.uuid,
    slug: `${slugify(english.name)}-${exercise.id}`,
    name: english.name.trim(),
    category: exercise.category?.name ?? null,
    steps: stripHtml(english.description ?? "") || null,
    license_name: exercise.license?.short_name ?? null,
    license_author: exercise.license_author,
  }));

  const savedExercises = await upsertChunked(supabase, "exercises", exerciseRows, "wger_uuid");
  const exerciseIds = new Map(savedExercises.map((row) => [String(row.wger_uuid), String(row.id)]));
  const ids = [...exerciseIds.values()];

  await deleteLinks(supabase, "exercise_areas", ids);
  await deleteLinks(supabase, "exercise_equipment", ids);

  const areaLinks: { exercise_id: string; area_id: string; is_primary: boolean }[] = [];
  const equipmentLinks: { exercise_id: string; equipment_id: string }[] = [];

  for (const { exercise } of exercises) {
    const exerciseId = exerciseIds.get(exercise.uuid);
    if (!exerciseId) continue;

    const linkedAreas = new Set<string>();
    for (const muscle of exercise.muscles) {
      const areaId = areaIds.get(muscle.id);
      if (!areaId || linkedAreas.has(areaId)) continue;
      linkedAreas.add(areaId);
      areaLinks.push({ exercise_id: exerciseId, area_id: areaId, is_primary: true });
    }
    for (const muscle of exercise.muscles_secondary) {
      const areaId = areaIds.get(muscle.id);
      if (!areaId || linkedAreas.has(areaId)) continue;
      linkedAreas.add(areaId);
      areaLinks.push({ exercise_id: exerciseId, area_id: areaId, is_primary: false });
    }

    const linkedEquipment = new Set<string>();
    for (const item of exercise.equipment) {
      const equipmentId = equipmentIds.get(item.id);
      if (!equipmentId || linkedEquipment.has(equipmentId)) continue;
      linkedEquipment.add(equipmentId);
      equipmentLinks.push({ exercise_id: exerciseId, equipment_id: equipmentId });
    }
  }

  await upsertChunked(supabase, "exercise_areas", areaLinks, "exercise_id,area_id");
  await upsertChunked(supabase, "exercise_equipment", equipmentLinks, "exercise_id,equipment_id");

  console.log(
    `Imported ${exerciseRows.length} English exercises, ${areas.size} areas, and ${equipment.size} equipment rows.`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
