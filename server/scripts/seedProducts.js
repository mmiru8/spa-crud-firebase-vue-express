// server/scripts/seedProducts.js
const { faker } = require("@faker-js/faker");
const { db } = require("../firebaseAdmin");

// liste specifice Nail Shop
const NAIL_PRODUCTS = [
  "Gel UV Builder Pink",
  "Gel UV Milky White",
  "Gel UV Clear",
  "Rubber Base Clear",
  "Rubber Base Nude",
  "Top Coat No Wipe",
  "Top Coat Matte",
  "Primer Acid Free",
  "Dehydrator",
  "Ulei cuticule Cocos",
  "Ulei cuticule Vanilie",
  "Cleaner",
  "Acetonă",
  "Pilă 180/240",
  "Buffer block",
  "Pensulă gel #6",
  "Pensulă liner",
  "Forme construcție",
  "Tipsuri transparente",
  "Lampa UV/LED 48W",
];

const CATEGORIES = [
  { id: "gel", name: "Geluri UV" },
  { id: "topcoat", name: "Top coat" },
  { id: "prep", name: "Pregătire" },
  { id: "ulei", name: "Ulei cuticule" },
  { id: "accesorii", name: "Accesorii" },
  { id: "lampa", name: "Lămpi" },
];

const FEATURES = [
  "autonivelant",
  "rezistent",
  "luciu",
  "mat",
  "ușor de aplicat",
  "pentru construcție",
  "pentru întreținere",
  "fără strat lipicios",
  "aderență excelentă",
];

const DESCRIPTIONS = [
  "Rezistență ridicată, aplicare ușoară, potrivit pentru manichiură profesională.",
  "Luciu intens și protecție, ideal pentru finisare.",
  "Aderență excelentă, recomandat înainte de bază/gel.",
  "Textură autonivelantă, potrivit pentru construcție și întreținere.",
  "Accesoriu esențial pentru pregătire și finisare.",
  "Produs selectat pentru durabilitate și aspect premium.",
];

function buildProduct() {
  const cat = faker.helpers.arrayElement(CATEGORIES);

  return {
    name: faker.helpers.arrayElement(NAIL_PRODUCTS),
    price: Number(faker.number.float({ min: 9.99, max: 189.99, fractionDigits: 2 })),
    description: faker.helpers.arrayElement(DESCRIPTIONS),
    category: {
      id: cat.id,
      name: cat.name,
      features: faker.helpers.arrayElements(FEATURES, { min: 2, max: 4 }),
    },
    inventory: {
      total: faker.number.int({ min: 0, max: 120 }),
      locations: [
        { warehouse: "Central", quantity: faker.number.int({ min: 0, max: 80 }) },
        { warehouse: "North", quantity: faker.number.int({ min: 0, max: 40 }) },
      ],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "seed-script",
  };
}

async function seed(count = 50) {
  const n = Number(count);
  if (!Number.isFinite(n) || n < 1 || n > 500) {
    throw new Error("Count invalid (1..500). Ex: npm run seed:products -- 50");
  }

  const batch = db.batch();
  const col = db.collection("products");

  for (let i = 0; i < n; i++) {
    const ref = col.doc();
    batch.set(ref, buildProduct());
  }

  await batch.commit();
  console.log(`✅ Seed done: ${n} produse (Nail Shop) în /products`);
  process.exit(0);
}

const countArg = process.argv[2] ?? "50";
seed(countArg).catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
