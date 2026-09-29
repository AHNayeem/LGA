// Module 11 vocabulary. Original entries (lemma, gender, plural, English meaning, our own
// example sentences). Topic scope follows the Module 11 mapping in docs/REFERENCE-ANALYSIS.md
// (Netzwerk neu A1 Kap. 11, metadata only); no word lists, translations or examples were
// copied from the reference books. Colour words, prices and food shopping belong to other
// modules and are only used here, not defined.
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

// --- Lesson 1: clothes -----------------------------------------------------------------
export const CLOTHES_1 = [
  n("kleidung", "die", "Kleidung", null, "clothes, clothing", { de: "Im Kaufhaus gibt es Kleidung und Schuhe.", en: "The department store has clothes and shoes." }, {
    topics: ["kleidung"],
    notes: { en: "Singular only: die Kleidung means “clothes” in general." },
  }),
  n("hose", "die", "Hose", "die Hosen", "trousers, pants", { de: "Die Hose ist zu lang.", en: "The trousers are too long." }, {
    topics: ["kleidung"],
    notes: { en: "Singular in German: eine Hose = one pair of trousers." },
  }),
  n("hemd", "das", "Hemd", "die Hemden", "shirt", { de: "Das Hemd ist weiß.", en: "The shirt is white." }, { topics: ["kleidung"] }),
  n("bluse", "die", "Bluse", "die Blusen", "blouse", { de: "Heute trage ich eine Bluse.", en: "Today I'm wearing a blouse." }, { topics: ["kleidung"] }),
  n("t-shirt", "das", "T-Shirt", "die T-Shirts", "T-shirt", { de: "Im Sommer trage ich oft T-Shirts.", en: "In summer I often wear T-shirts." }, {
    topics: ["kleidung"],
  }),
  n("pullover", "der", "Pullover", "die Pullover", "jumper, sweater", { de: "Der Pullover ist schön warm.", en: "The jumper is nice and warm." }, {
    topics: ["kleidung"],
    notes: { en: "Short form: der Pulli." },
  }),
  n("jacke", "die", "Jacke", "die Jacken", "jacket", { de: "Die Jacke ist sehr warm.", en: "The jacket is very warm." }, { topics: ["kleidung"] }),
  n("mantel", "der", "Mantel", "die Mäntel", "coat", { de: "Im Winter brauche ich einen Mantel.", en: "In winter I need a coat." }, { topics: ["kleidung"] }),
  n("kleid", "das", "Kleid", "die Kleider", "dress", { de: "Das Kleid ist blau.", en: "The dress is blue." }, {
    topics: ["kleidung"],
    notes: { en: "die Kleider = dresses; clothes in general = die Kleidung." },
  }),
  n("rock", "der", "Rock", "die Röcke", "skirt", { de: "Der Rock ist zu kurz.", en: "The skirt is too short." }, { topics: ["kleidung"] }),
];

export const CLOTHES_2 = [
  n("schuh", "der", "Schuh", "die Schuhe", "shoe", { de: "Die Schuhe sind neu.", en: "The shoes are new." }, { topics: ["kleidung"] }),
  n("socke", "die", "Socke", "die Socken", "sock", { de: "Ich brauche Socken.", en: "I need socks." }, { topics: ["kleidung"] }),
  n("muetze", "die", "Mütze", "die Mützen", "woolly hat, cap", { de: "Im Winter trage ich eine Mütze.", en: "In winter I wear a woolly hat." }, {
    topics: ["kleidung"],
  }),
  n("schal", "der", "Schal", "die Schals", "scarf", { de: "Der Schal ist lang.", en: "The scarf is long." }, { topics: ["kleidung"] }),
  n("jeans", "die", "Jeans", "die Jeans", "jeans", { de: "Ich trage gern Jeans.", en: "I like wearing jeans." }, {
    topics: ["kleidung"],
    notes: { en: "One pair of jeans: eine Jeans." },
  }),
  w("tragen", "tragen", "verb", "to wear; to carry", { de: "Was trägst du heute? – Eine Jeans und ein T-Shirt.", en: "What are you wearing today? – Jeans and a T-shirt." }, {
    topics: ["kleidung"],
    notes: { en: "Vowel change: du trägst, er/sie trägt." },
  }),
  w("welcher", "welcher, welche, welches", "question_word", "which", { de: "Welche Hose kaufst du?", en: "Which trousers are you buying?" }, {
    topics: ["fragen"],
    notes: { en: "Endings like der, die, das: welcher Rock, welche Jacke, welches Kleid." },
  }),
  w("dieser", "dieser, diese, dieses", "pronoun", "this, this one", { de: "Diese Jacke ist schön.", en: "This jacket is nice." }, {
    topics: ["kleidung"],
    notes: { en: "Answer to welcher?: Welche Jacke? – Diese hier." },
  }),
];

// --- Lesson 2: opinions and sizes -------------------------------------------------------
export const OPINIONS = [
  w("gefallen", "gefallen", "verb", "to please; (to) like", { de: "Die Jacke gefällt mir.", en: "I like the jacket." }, {
    topics: ["meinung"],
    notes: { en: "The thing you like is the subject, the person is in the dative: Das Kleid gefällt mir. Vowel change: es gefällt." },
  }),
  w("passen", "passen", "verb", "to fit", { de: "Die Hose passt mir nicht.", en: "The trousers don't fit me." }, {
    topics: ["meinung"],
    notes: { en: "With the dative: Passt dir die Jacke?" },
  }),
  w("gehoeren", "gehören", "verb", "to belong (to)", { de: "Die Mütze gehört mir.", en: "The hat belongs to me." }, {
    topics: ["meinung"],
    notes: { en: "With the dative: Das Buch gehört ihm." },
  }),
  w("steht-dir-gut", "Das steht dir gut!", "phrase", "That suits you! That looks good on you!", {
    de: "Der Mantel steht dir wirklich gut!",
    en: "The coat really suits you!",
  }, { topics: ["meinung"], notes: { en: "stehen + dative = to suit. Formal: Das steht Ihnen gut!" } }),
  n("groesse", "die", "Größe", "die Größen", "size", { de: "Welche Größe haben Sie? – Größe 38.", en: "What size are you? – Size 38." }, {
    topics: ["kleidung"],
  }),
  n("schuhgroesse", "die", "Schuhgröße", "die Schuhgrößen", "shoe size", { de: "Meine Schuhgröße ist 42.", en: "My shoe size is 42." }, {
    topics: ["kleidung"],
  }),
  w("eng", "eng", "adjective", "tight", { de: "Die Jeans ist zu eng.", en: "The jeans are too tight." }, { topics: ["meinung"] }),
  w("schick", "schick", "adjective", "smart, stylish, chic", { de: "Das Kleid ist sehr schick.", en: "The dress is very stylish." }, { topics: ["meinung"] }),
  w("altmodisch", "altmodisch", "adjective", "old-fashioned", { de: "Der Pullover ist ein bisschen altmodisch.", en: "The jumper is a bit old-fashioned." }, {
    topics: ["meinung"],
  }),
  n("mode", "die", "Mode", null, "fashion", { de: "Mode ist mir nicht so wichtig.", en: "Fashion isn't that important to me." }, { topics: ["kleidung"] }),
];

// --- Lesson 3: in the shop ------------------------------------------------------------
export const SHOPPING = [
  w("kann-ich-ihnen-helfen", "Kann ich Ihnen helfen?", "phrase", "Can I help you?", {
    de: "Guten Tag! Kann ich Ihnen helfen? – Ja, ich suche eine Jacke.",
    en: "Hello! Can I help you? – Yes, I'm looking for a jacket.",
  }, { topics: ["einkaufen"], notes: { en: "helfen takes the dative: Ich helfe dir. Er hilft mir." } }),
  w("anprobieren", "anprobieren", "verb", "to try on", { de: "Kann ich den Rock anprobieren?", en: "Can I try on the skirt?" }, {
    topics: ["einkaufen"],
    notes: { en: "Separable: Ich probiere die Hose an." },
  }),
  n("umkleidekabine", "die", "Umkleidekabine", "die Umkleidekabinen", "changing room, fitting room", {
    de: "Die Umkleidekabinen sind dort hinten.",
    en: "The changing rooms are back there.",
  }, { topics: ["einkaufen"], notes: { en: "Short form: die Kabine." } }),
  w("umtauschen", "umtauschen", "verb", "to exchange (goods)", { de: "Ich möchte die Schuhe umtauschen.", en: "I'd like to exchange the shoes." }, {
    topics: ["einkaufen"],
    notes: { en: "Separable: Ich tausche die Hose um." },
  }),
  n("kassenbon", "der", "Kassenbon", "die Kassenbons", "receipt", { de: "Haben Sie den Kassenbon noch?", en: "Do you still have the receipt?" }, {
    topics: ["einkaufen"],
    notes: { en: "Also: der Bon, die Quittung." },
  }),
  n("kasse", "die", "Kasse", "die Kassen", "checkout, till", { de: "Bitte zahlen Sie an der Kasse.", en: "Please pay at the checkout." }, {
    topics: ["einkaufen"],
  }),
  w("bar-oder-mit-karte", "Bar oder mit Karte?", "phrase", "Cash or card?", { de: "Bar oder mit Karte? – Mit Karte, bitte.", en: "Cash or card? – By card, please." }, {
    topics: ["einkaufen"],
  }),
  w("reduziert", "reduziert", "adjective", "reduced (in price), on sale", { de: "Alle Mäntel sind heute reduziert.", en: "All coats are reduced today." }, {
    topics: ["einkaufen"],
  }),
];

// --- Lesson 4: the department store ----------------------------------------------------
export const STORE = [
  n("kaufhaus", "das", "Kaufhaus", "die Kaufhäuser", "department store", { de: "Im Kaufhaus gibt es fast alles.", en: "You can get almost everything in the department store." }, {
    topics: ["kaufhaus"],
  }),
  n("stock", "der", "Stock", null, "floor, storey", { de: "Die Herrenmode ist im zweiten Stock.", en: "Menswear is on the second floor." }, {
    topics: ["kaufhaus"],
    notes: {
      en: "im ersten / zweiten / dritten Stock. The German 1. Stock is the first floor above the ground floor. Plural: die Stockwerke (from das Stockwerk). Also: die Etage.",
    },
  }),
  n("erdgeschoss", "das", "Erdgeschoss", "die Erdgeschosse", "ground floor", { de: "Die Kasse ist im Erdgeschoss.", en: "The checkout is on the ground floor." }, {
    topics: ["kaufhaus"],
    notes: { en: "On signs: EG." },
  }),
  n("untergeschoss", "das", "Untergeschoss", "die Untergeschosse", "basement (level)", { de: "Im Untergeschoss gibt es Lebensmittel.", en: "There is food in the basement." }, {
    topics: ["kaufhaus"],
    notes: { en: "On signs: UG." },
  }),
  n("abteilung", "die", "Abteilung", "die Abteilungen", "department", { de: "Wo ist die Sportabteilung?", en: "Where is the sports department?" }, {
    topics: ["kaufhaus"],
  }),
  n("rolltreppe", "die", "Rolltreppe", "die Rolltreppen", "escalator", { de: "Nehmen Sie die Rolltreppe in den dritten Stock.", en: "Take the escalator to the third floor." }, {
    topics: ["kaufhaus"],
  }),
  n("aufzug", "der", "Aufzug", "die Aufzüge", "lift, elevator", { de: "Der Aufzug ist dort links.", en: "The lift is over there on the left." }, {
    topics: ["kaufhaus"],
    notes: { en: "Also: der Fahrstuhl, der Lift." },
  }),
  n("kundenservice", "der", "Kundenservice", null, "customer service", { de: "Der Kundenservice ist im Erdgeschoss.", en: "Customer service is on the ground floor." }, {
    topics: ["kaufhaus"],
  }),
  n("damenmode", "die", "Damenmode", null, "womenswear, ladies' fashion", { de: "Die Damenmode ist im ersten Stock.", en: "Womenswear is on the first floor." }, {
    topics: ["kaufhaus"],
  }),
  n("herrenmode", "die", "Herrenmode", null, "menswear", { de: "Ich suche die Herrenmode.", en: "I'm looking for the menswear department." }, {
    topics: ["kaufhaus"],
  }),
  n("kindermode", "die", "Kindermode", null, "children's clothes", { de: "Die Kindermode ist im dritten Stock.", en: "Children's clothes are on the third floor." }, {
    topics: ["kaufhaus"],
  }),
  n("durchsage", "die", "Durchsage", "die Durchsagen", "announcement (over a loudspeaker)", {
    de: "Hören Sie die Durchsage?",
    en: "Can you hear the announcement?",
  }, { topics: ["kaufhaus"] }),
  w("wo-finde-ich", "Wo finde ich …?", "phrase", "Where can I find …?", {
    de: "Entschuldigung, wo finde ich die Schuhe? – Im Erdgeschoss.",
    en: "Excuse me, where can I find the shoes? – On the ground floor.",
  }, { topics: ["kaufhaus"] }),
];

export const VOCABULARY = [...CLOTHES_1, ...CLOTHES_2, ...OPINIONS, ...SHOPPING, ...STORE];

export const slugs = (list) => list.map((v) => v.slug);
