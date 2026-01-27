const { db } = require("../firebaseAdmin");

const slugify = (s = "") =>
  s
    .toString()
    .trim()
    .toLowerCase()
    .replace(/ă/g, "a")
    .replace(/â/g, "a")
    .replace(/î/g, "i")
    .replace(/ș/g, "s")
    .replace(/ț/g, "t")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

// Fixează:
// - slug lipsă / gol
// - metadata lipsă (createdAt/createdBy/updatedAt)
// - createdBy lipsă
async function fixSlugs() {
  const snap = await db.collection("products").get();
  console.log(`🔎 Found ${snap.size} products`);

  let updated = 0;
  let skipped = 0;

  let batch = db.batch();
  let ops = 0;

  for (const doc of snap.docs) {
    const data = doc.data() || {};
    const id = doc.id;

    const name = String(data.name || "").trim();
    if (!name) {
      console.log(`⚠️ Skip ${id}: missing name`);
      skipped++;
      continue;
    }

    const currentSlug = (data.slug ?? "").toString().trim();
    const shouldSetSlug = !currentSlug;

    const now = new Date().toISOString();

    const needsMetadata =
      !data.metadata ||
      typeof data.metadata !== "object" ||
      !data.metadata.createdAt ||
      !data.metadata.updatedAt ||
      !data.metadata.createdBy;

    const needsCreatedBy = !data.createdBy;


    if (!shouldSetSlug && !needsMetadata && !needsCreatedBy) {
      skipped++;
      continue;
    }

    const patch = {};

    if (shouldSetSlug) patch.slug = slugify(name);

    if (needsCreatedBy) patch.createdBy = "fix-script";


    const createdAt = data.createdAt || data.metadata?.createdAt || now;
    const createdBy = data.createdBy || data.metadata?.createdBy || "fix-script";

    if (needsMetadata) {
      patch.metadata = {
        createdAt,
        createdBy,
        updatedAt: now,
      };
    } else {

      patch["metadata.updatedAt"] = now;
    }

    patch.updatedAt = now;

    batch.update(doc.ref, patch);
    ops++;
    updated++;


    if (ops === 450) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }

    console.log(`✅ Update ${id}:`, patch);
  }

  if (ops > 0) await batch.commit();

  console.log(`\nDone ✅ Updated: ${updated} | Skipped: ${skipped}`);
  process.exit(0);
}

fixSlugs().catch((err) => {
  console.error("❌ fixSlugs failed:", err);
  process.exit(1);
});
