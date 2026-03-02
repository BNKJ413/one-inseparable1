import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

function readJson(file: string) {
  const p = path.join(process.cwd(), "prisma", "seed_data", file);
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

/**
 * Idempotent seed script - safe to run multiple times
 * Uses upsert patterns to avoid duplicates
 */
async function main() {
  console.log("🌱 Starting database seed...");

  const scriptures = readJson("scriptures.json");
  const actions = readJson("actionIdeas.json");
  const stickers = readJson("stickers.json");

  // === Seed Scriptures ===
  console.log(`📖 Seeding ${scriptures.length} scriptures...`);
  let scripturesCreated = 0;
  let scripturesUpdated = 0;

  for (const s of scriptures) {
    // Use reference as unique identifier for upsert
    const existing = await prisma.scripture.findFirst({
      where: { reference: s.reference },
    });

    if (existing) {
      await prisma.scripture.update({
        where: { id: existing.id },
        data: {
          verseText: s.verseText ?? existing.verseText,
          category: s.category,
          tags: JSON.stringify(s.tags ?? []),
          marriageMeaning: s.marriageMeaning,
          prayerPrompt: s.prayerPrompt ?? null,
          actionPrompt: s.actionPrompt,
          battleType: s.battleType ?? null,
          intensity: s.intensity ?? "GENTLE",
          isFeatured: !!s.isFeatured,
        },
      });
      scripturesUpdated++;
    } else {
      await prisma.scripture.create({
        data: {
          reference: s.reference,
          verseText: s.verseText ?? null,
          category: s.category,
          tags: JSON.stringify(s.tags ?? []),
          marriageMeaning: s.marriageMeaning,
          prayerPrompt: s.prayerPrompt ?? null,
          actionPrompt: s.actionPrompt,
          battleType: s.battleType ?? null,
          intensity: s.intensity ?? "GENTLE",
          isFeatured: !!s.isFeatured,
        },
      });
      scripturesCreated++;
    }
  }
  console.log(`   ✅ Created: ${scripturesCreated}, Updated: ${scripturesUpdated}`);

  // === Seed Action Ideas ===
  console.log(`💡 Seeding ${actions.length} action ideas...`);
  let actionsCreated = 0;
  let actionsUpdated = 0;

  for (const a of actions) {
    // Use title as unique identifier for upsert
    const existing = await prisma.actionIdea.findFirst({
      where: { title: a.title },
    });

    const actionData = {
      title: a.title,
      mode: a.mode,
      loveLanguage: a.loveLanguage ?? "ANY",
      timeNeededMinutes: a.timeNeededMinutes,
      intimacyLevelMin: a.intimacyLevelMin ?? "PG",
      seasonTags: JSON.stringify(a.seasonTags ?? []),
      steps: JSON.stringify(a.steps ?? []),
      messageTemplate: a.messageTemplate ?? null,
      whyItHelps: a.whyItHelps,
      pointsAwarded: a.pointsAwarded ?? 5,
    };

    if (existing) {
      await prisma.actionIdea.update({
        where: { id: existing.id },
        data: actionData,
      });
      actionsUpdated++;
    } else {
      await prisma.actionIdea.create({
        data: actionData,
      });
      actionsCreated++;
    }
  }
  console.log(`   ✅ Created: ${actionsCreated}, Updated: ${actionsUpdated}`);

  // === Seed Preset Stickers ===
  console.log(`🎨 Seeding ${stickers.length} preset stickers...`);
  let stickersCreated = 0;
  let stickersSkipped = 0;

  for (const st of stickers) {
    // Check if sticker already exists by name
    const existing = await prisma.stickerDefinition.findFirst({
      where: { name: st.name, isPreset: true },
    });

    if (existing) {
      stickersSkipped++;
      continue;
    }

    // Find linked actions by title
    const linkedActions = await prisma.actionIdea.findMany({
      where: { title: { in: st.linkedActionTitles ?? [] } },
    });

    await prisma.stickerDefinition.create({
      data: {
        name: st.name,
        emoji: st.emoji,
        meaning: st.meaning ?? null,
        isPreset: true,
        linkedActions: {
          connect: linkedActions.map(a => ({ id: a.id })),
        },
      },
    });
    stickersCreated++;
  }
  console.log(`   ✅ Created: ${stickersCreated}, Skipped (existing): ${stickersSkipped}`);

  // === Summary ===
  console.log("\n📊 Seed Summary:");
  console.log(`   Scriptures: ${scripturesCreated} created, ${scripturesUpdated} updated`);
  console.log(`   Actions: ${actionsCreated} created, ${actionsUpdated} updated`);
  console.log(`   Stickers: ${stickersCreated} created, ${stickersSkipped} skipped`);

  // === Final counts ===
  const counts = {
    scriptures: await prisma.scripture.count(),
    actions: await prisma.actionIdea.count(),
    stickers: await prisma.stickerDefinition.count({ where: { isPreset: true } }),
  };
  
  console.log("\n📈 Database totals:");
  console.log(`   Total Scriptures: ${counts.scriptures}`);
  console.log(`   Total Actions: ${counts.actions}`);
  console.log(`   Total Preset Stickers: ${counts.stickers}`);
  
  console.log("\n✨ Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
