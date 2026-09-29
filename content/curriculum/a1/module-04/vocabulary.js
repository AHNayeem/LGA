// Module 4 vocabulary. Original entries (lemma, gender, plural, English meaning, our own
// example sentences). Topic scope follows the Module 4 mapping in docs/REFERENCE-ANALYSIS.md
// (food and drinks, shopping for food, prices, meals); no word lists, translations or
// examples were copied from the reference books.
// Bangla meanings are intentionally absent until a reviewer adds them.
// Pure data: no imports, so tests and tooling can load it directly.

const n = (slug, article, lemma, plural, en, example, extra = {}) => ({
  slug,
  lemma,
  article,
  plural,
  pos: "noun",
  meanings: { en },
  ...(example ? { example } : {}),
  topics: extra.topics ?? [],
  ...(extra.notes ? { notes: extra.notes } : {}),
});

const w = (slug, lemma, pos, en, example, extra = {}) => ({
  slug,
  lemma,
  article: extra.article ?? null,
  plural: null,
  pos,
  meanings: { en },
  ...(example ? { example } : {}),
  topics: extra.topics ?? [],
  ...(extra.notes ? { notes: extra.notes } : {}),
});

// --- Lesson 1: food and drinks ---------------------------------------------------------
export const FOOD = [
  n("brot", "das", "Brot", "die Brote", "bread; a loaf of bread", { de: "Ich esse Brot mit Käse.", en: "I eat bread with cheese." }, {
    topics: ["lebensmittel"],
  }),
  n("broetchen", "das", "Brötchen", "die Brötchen", "bread roll", { de: "Ich kaufe vier Brötchen.", en: "I'm buying four bread rolls." }, {
    topics: ["lebensmittel"],
  }),
  n("kaese", "der", "Käse", null, "cheese", { de: "Der Käse ist sehr gut.", en: "The cheese is very good." }, { topics: ["lebensmittel"] }),
  n("butter", "die", "Butter", null, "butter", { de: "Wir haben keine Butter.", en: "We have no butter." }, { topics: ["lebensmittel"] }),
  n("ei", "das", "Ei", "die Eier", "egg", { de: "Isst du ein Ei?", en: "Are you having an egg?" }, { topics: ["lebensmittel"] }),
  n("apfel", "der", "Apfel", "die Äpfel", "apple", { de: "Ich esse einen Apfel.", en: "I'm eating an apple." }, { topics: ["lebensmittel"] }),
  n("banane", "die", "Banane", "die Bananen", "banana", { de: "Die Banane ist gelb.", en: "The banana is yellow." }, { topics: ["lebensmittel"] }),
  n("tomate", "die", "Tomate", "die Tomaten", "tomato", { de: "Die Tomaten kommen aus Spanien.", en: "The tomatoes come from Spain." }, {
    topics: ["lebensmittel"],
  }),
  n("kartoffel", "die", "Kartoffel", "die Kartoffeln", "potato", { de: "Wir essen Fisch mit Kartoffeln.", en: "We're having fish with potatoes." }, {
    topics: ["lebensmittel"],
  }),
  n("fleisch", "das", "Fleisch", null, "meat", { de: "Ich esse kein Fleisch.", en: "I don't eat meat." }, { topics: ["lebensmittel"] }),
  n("fisch", "der", "Fisch", "die Fische", "fish", { de: "Der Fisch ist frisch.", en: "The fish is fresh." }, { topics: ["lebensmittel"] }),
  n("obst", "das", "Obst", null, "fruit", { de: "Obst ist gesund.", en: "Fruit is healthy." }, {
    topics: ["lebensmittel"],
    notes: { en: "Always singular: das Obst means fruit in general (apples, bananas …)." },
  }),
  n("gemuese", "das", "Gemüse", null, "vegetables", { de: "Lina kauft Gemüse.", en: "Lina is buying vegetables." }, {
    topics: ["lebensmittel"],
    notes: { en: "Singular in German, plural in English: das Gemüse = vegetables." },
  }),
  w("essen", "essen", "verb", "to eat", { de: "Was isst du?", en: "What are you eating?" }, {
    topics: ["lebensmittel"],
    notes: { en: "Vowel change: du isst, er/sie isst" },
  }),
];

export const DRINKS = [
  n("kaffee", "der", "Kaffee", null, "coffee", { de: "Trinkst du Kaffee?", en: "Do you drink coffee?" }, {
    topics: ["getraenke"],
    notes: { en: "When ordering, people say zwei Kaffee (two coffees)." },
  }),
  n("tee", "der", "Tee", "die Tees", "tea", { de: "Ich trinke Tee mit Milch.", en: "I drink tea with milk." }, { topics: ["getraenke"] }),
  n("wasser", "das", "Wasser", null, "water", { de: "Das Wasser ist kalt.", en: "The water is cold." }, { topics: ["getraenke"] }),
  n("milch", "die", "Milch", null, "milk", { de: "Wir brauchen Milch.", en: "We need milk." }, { topics: ["getraenke"] }),
  n("saft", "der", "Saft", "die Säfte", "juice", { de: "Der Saft ist lecker.", en: "The juice is delicious." }, { topics: ["getraenke"] }),
  n("orangensaft", "der", "Orangensaft", "die Orangensäfte", "orange juice", { de: "Tim trinkt Orangensaft.", en: "Tim drinks orange juice." }, {
    topics: ["getraenke"],
    notes: { en: "die Orange + der Saft: the last word gives the article." },
  }),
  w("trinken", "trinken", "verb", "to drink", { de: "Wir trinken Wasser.", en: "We drink water." }, { topics: ["getraenke"] }),
];

// --- Lesson 2: shopping, quantities, packaging ----------------------------------------------
export const SHOPPING = [
  w("kaufen", "kaufen", "verb", "to buy", { de: "Ich kaufe ein Brot.", en: "I'm buying a loaf of bread." }, { topics: ["einkaufen"] }),
  w("brauchen", "brauchen", "verb", "to need", { de: "Brauchst du Eier?", en: "Do you need eggs?" }, { topics: ["einkaufen"] }),
  n("supermarkt", "der", "Supermarkt", "die Supermärkte", "supermarket", { de: "Der Supermarkt ist groß.", en: "The supermarket is big." }, {
    topics: ["einkaufen"],
  }),
  n("lebensmittel", "das", "Lebensmittel", "die Lebensmittel", "food item; (plural) food, groceries", {
    de: "Die Lebensmittel sind hier billig.",
    en: "Food is cheap here.",
  }, { topics: ["einkaufen"], notes: { en: "Mostly used in the plural: die Lebensmittel." } }),
  n("einkaufszettel", "der", "Einkaufszettel", "die Einkaufszettel", "shopping list", { de: "Hier ist der Einkaufszettel.", en: "Here is the shopping list." }, {
    topics: ["einkaufen"],
  }),
];

export const QUANTITIES = [
  n("kilo", "das", "Kilo", "die Kilos", "kilo", { de: "Ein Kilo Äpfel, bitte.", en: "A kilo of apples, please." }, {
    topics: ["mengen"],
    notes: { en: "After a number: zwei Kilo Kartoffeln (not „Kilos“). Short form: kg." },
  }),
  n("gramm", "das", "Gramm", null, "gram", { de: "Ich möchte 200 Gramm Käse.", en: "I'd like 200 grams of cheese." }, {
    topics: ["mengen"],
    notes: { en: "No plural ending: 500 Gramm. Short form: g." },
  }),
  n("liter", "der", "Liter", "die Liter", "litre", { de: "Wir brauchen zwei Liter Milch.", en: "We need two litres of milk." }, {
    topics: ["mengen"],
    notes: { en: "Short form: l." },
  }),
  n("flasche", "die", "Flasche", "die Flaschen", "bottle", { de: "Eine Flasche Wasser, bitte.", en: "A bottle of water, please." }, {
    topics: ["mengen"],
  }),
  n("packung", "die", "Packung", "die Packungen", "packet, pack", { de: "Ich kaufe eine Packung Butter.", en: "I'm buying a pack of butter." }, {
    topics: ["mengen"],
  }),
  n("dose", "die", "Dose", "die Dosen", "tin, can", { de: "Wir brauchen zwei Dosen Tomaten.", en: "We need two tins of tomatoes." }, {
    topics: ["mengen"],
  }),
  n("stueck", "das", "Stück", "die Stücke", "piece", { de: "Ein Stück Kuchen, bitte.", en: "A piece of cake, please." }, {
    topics: ["mengen"],
    notes: { en: "After a number: zwei Stück Kuchen." },
  }),
];

// --- Lesson 3: prices and requests --------------------------------------------------------
export const PRICES = [
  w("kosten", "kosten", "verb", "to cost", { de: "Was kostet der Käse?", en: "How much is the cheese?" }, { topics: ["preise"] }),
  n("euro", "der", "Euro", "die Euro", "euro", { de: "Das Brot kostet drei Euro.", en: "The bread costs three euros." }, {
    topics: ["preise"],
    notes: { en: "2,50 € is read „zwei Euro fünfzig“. After a number: fünf Euro (no -s)." },
  }),
  n("cent", "der", "Cent", "die Cent", "cent", { de: "Das Brötchen kostet 40 Cent.", en: "The bread roll costs 40 cents." }, {
    topics: ["preise"],
  }),
  n("preis", "der", "Preis", "die Preise", "price", { de: "Der Preis ist gut.", en: "The price is good." }, { topics: ["preise"] }),
  w("teuer", "teuer", "adjective", "expensive", { de: "Der Fisch ist heute teuer.", en: "The fish is expensive today." }, { topics: ["preise"] }),
  w("billig", "billig", "adjective", "cheap", { de: "Die Bananen sind billig.", en: "The bananas are cheap." }, { topics: ["preise"] }),
  w("sonst-noch-etwas", "Sonst noch etwas?", "phrase", "Anything else?", { de: "Zwei Brötchen. Sonst noch etwas?", en: "Two bread rolls. Anything else?" }, {
    topics: ["einkaufen"],
    notes: { en: "Shop assistants ask this after your first request." },
  }),
  w("das-ist-alles", "Das ist alles.", "phrase", "That's all.", { de: "Nein, danke. Das ist alles.", en: "No, thank you. That's all." }, {
    topics: ["einkaufen"],
  }),
  w("moechten", "möchten", "verb", "would like", { de: "Ich möchte ein Kilo Tomaten, bitte.", en: "I'd like a kilo of tomatoes, please." }, {
    topics: ["einkaufen"],
    notes: { en: "ich möchte, du möchtest, er/sie möchte (no -t)" },
  }),
  w("moegen", "mögen", "verb", "to like", { de: "Magst du Fisch?", en: "Do you like fish?" }, {
    topics: ["essen"],
    notes: { en: "Irregular: ich mag, du magst, er/sie mag, wir mögen, ihr mögt, sie/Sie mögen" },
  }),
];

// --- Lesson 4: meals and at the table ------------------------------------------------------
export const MEALS = [
  n("fruehstueck", "das", "Frühstück", "die Frühstücke", "breakfast", { de: "Mein Frühstück: ein Brötchen und ein Kaffee.", en: "My breakfast: a bread roll and a coffee." }, {
    topics: ["essen"],
  }),
  n("mittagessen", "das", "Mittagessen", "die Mittagessen", "lunch", { de: "Das Mittagessen ist sehr lecker.", en: "Lunch is very tasty." }, {
    topics: ["essen"],
  }),
  n("abendessen", "das", "Abendessen", "die Abendessen", "dinner, supper", { de: "Das Abendessen ist fertig.", en: "Dinner is ready." }, {
    topics: ["essen"],
  }),
  n("kuchen", "der", "Kuchen", "die Kuchen", "cake", { de: "Der Kuchen ist süß.", en: "The cake is sweet." }, { topics: ["lebensmittel"] }),
  n("schokolade", "die", "Schokolade", "die Schokoladen", "chocolate", { de: "Omar mag Schokolade.", en: "Omar likes chocolate." }, {
    topics: ["lebensmittel"],
  }),
  w("lecker", "lecker", "adjective", "delicious, tasty", { de: "Mmh, das ist lecker!", en: "Mmm, that's delicious!" }, { topics: ["essen"] }),
  w("guten-appetit", "Guten Appetit!", "phrase", "Enjoy your meal!", { de: "Das Essen ist da. Guten Appetit!", en: "The food is here. Enjoy your meal!" }, {
    topics: ["essen"],
    notes: { en: "Said before a meal starts. The answer is „Danke, gleichfalls!“ (Thanks, you too!)." },
  }),
];

export const VOCABULARY = [...FOOD, ...DRINKS, ...SHOPPING, ...QUANTITIES, ...PRICES, ...MEALS];

export const slugs = (list) => list.map((v) => v.slug);
