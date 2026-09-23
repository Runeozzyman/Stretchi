import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { supabase } from "./supabase/client.ts";

type AreaLink = {
  slug: string;
  is_primary: boolean;
};

type ExerciseRecord = {
  slug: string;
  name: string;
  category: string;
  setup: string;
  steps: string;
  dosage: string;
  frequency: string;
  stop_if: string;
  purpose: string;
  areas: AreaLink[];
  equipment: string[];
};

type Catalog = {
  body_areas: { slug: string; name: string }[];
  equipment: { slug: string; name: string }[];
  exercises: ExerciseRecord[];
};

const catalogPath = join(dirname(fileURLToPath(import.meta.url)), "excercises.json");

function loadCatalog(): Catalog {
  return JSON.parse(readFileSync(catalogPath, "utf8")) as Catalog;
}

function assertCatalog(catalog: Catalog): void {
  const areaSlugs = new Set(catalog.body_areas.map((area) => area.slug));
  const equipmentSlugs = new Set(catalog.equipment.map((item) => item.slug));
  const exerciseSlugs = new Set<string>();

  for (const exercise of catalog.exercises) {
    if (exerciseSlugs.has(exercise.slug)) {
      throw new Error(`Duplicate exercise slug: ${exercise.slug}`);
    }
    exerciseSlugs.add(exercise.slug);

    const primary = exercise.areas.filter((area) => area.is_primary);
    if (primary.length !== 1) {
      throw new Error(`${exercise.slug} must have exactly one primary area`);
    }

    for (const area of exercise.areas) {
      if (!areaSlugs.has(area.slug)) {
        throw new Error(`${exercise.slug} references unknown area ${area.slug}`);
      }
    }

    for (const slug of exercise.equipment) {
      if (!equipmentSlugs.has(slug)) {
        throw new Error(`${exercise.slug} references unknown equipment ${slug}`);
      }
    }
  }
}

async function upsert(
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string,
): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase.from(table).upsert(rows, { onConflict }).select();
  if (error) throw new Error(`${table} upsert failed: ${error.message}`);
  return data ?? [];
}

async function main(): Promise<void> {
  const catalog = loadCatalog();
  assertCatalog(catalog);

  const areaRows = await upsert("body_areas", catalog.body_areas, "slug");
  const equipmentRows = await upsert("equipment", catalog.equipment, "slug");
  const areaIds = new Map(areaRows.map((row) => [String(row.slug), String(row.id)]));
  const equipmentIds = new Map(equipmentRows.map((row) => [String(row.slug), String(row.id)]));

  const exerciseRows = catalog.exercises.map((exercise) => ({
    slug: exercise.slug,
    name: exercise.name,
    category: exercise.category,
    setup: exercise.setup,
    steps: exercise.steps,
    dosage: exercise.dosage,
    frequency: exercise.frequency,
    stop_if: exercise.stop_if,
    purpose: exercise.purpose,
  }));

  const savedExercises = await upsert("exercises", exerciseRows, "slug");
  const exerciseIds = new Map(savedExercises.map((row) => [String(row.slug), String(row.id)]));
  const ids = [...exerciseIds.values()];

  const { error: areaDeleteError } = await supabase.from("exercise_areas").delete().in("exercise_id", ids);
  if (areaDeleteError) throw new Error(`exercise_areas delete failed: ${areaDeleteError.message}`);

  const { error: equipmentDeleteError } = await supabase
    .from("exercise_equipment")
    .delete()
    .in("exercise_id", ids);
  if (equipmentDeleteError) {
    throw new Error(`exercise_equipment delete failed: ${equipmentDeleteError.message}`);
  }

  const areaLinks: Record<string, unknown>[] = [];
  const equipmentLinks: Record<string, unknown>[] = [];

  for (const exercise of catalog.exercises) {
    const exerciseId = exerciseIds.get(exercise.slug);
    if (!exerciseId) throw new Error(`Missing id for ${exercise.slug}`);

    for (const area of exercise.areas) {
      const areaId = areaIds.get(area.slug);
      if (!areaId) throw new Error(`Missing id for area ${area.slug}`);
      areaLinks.push({ exercise_id: exerciseId, area_id: areaId, is_primary: area.is_primary });
    }

    for (const slug of exercise.equipment) {
      const equipmentId = equipmentIds.get(slug);
      if (!equipmentId) throw new Error(`Missing id for equipment ${slug}`);
      equipmentLinks.push({ exercise_id: exerciseId, equipment_id: equipmentId });
    }
  }

  await upsert("exercise_areas", areaLinks, "exercise_id,area_id");
  await upsert("exercise_equipment", equipmentLinks, "exercise_id,equipment_id");

  console.log(
    `Uploaded ${exerciseRows.length} exercises, ${catalog.body_areas.length} areas, and ${catalog.equipment.length} equipment rows.`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
