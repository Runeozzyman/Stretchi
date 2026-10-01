export const mildBackIntake =
  "No recent injury or health change. Pain in my lower back for 2 days. No equipment. I have 10 minutes. It is mild.";

export function movementNames(output: unknown): string[] {
  if (!Array.isArray(output)) {
    return [];
  }
  return output.flatMap((exercise) => {
    if (typeof exercise !== "object" || exercise === null || !("name" in exercise)) {
      return [];
    }
    const name = exercise.name;
    return typeof name === "string" && name.length > 0 ? [name] : [];
  });
}

export function namedIn(message: string, catalog: readonly string[]): string[] {
  return catalog.filter((name) => message.includes(name));
}

export function prescribesMovement(message: string): boolean {
  return /\b(setup|dosage|frequency|stop if|reps|sets|hold for)\b/i.test(message);
}

const planWords: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
};

export function statedPlan(message: string): number | undefined {
  const match = message.match(/\b(one|two|three|four|[1-4])\s+movements?\b/i);
  const token = match?.[1]?.toLowerCase();
  if (token === undefined) {
    return undefined;
  }
  if (token in planWords) {
    return planWords[token];
  }
  const value = Number(token);
  return value >= 1 && value <= 4 ? value : undefined;
}
