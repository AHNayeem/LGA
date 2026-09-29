// Module 8 vocabulary. Original entries (lemma, gender, plural, English meaning, our own
// example sentences). Topic scope follows the Module 8 mapping in docs/REFERENCE-ANALYSIS.md
// (Netzwerk neu A1 Kap. 8: body, illness, doctor, instructions); no word lists,
// translations or examples were copied from the reference books.
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

// --- Lesson 1: the body --------------------------------------------------------------
export const BODY = [
  n("koerper", "der", "Körper", "die Körper", "body", { de: "Kopf, Arme, Beine: Das ist der Körper.", en: "Head, arms, legs: that is the body." }, {
    topics: ["koerper"],
  }),
  n("kopf", "der", "Kopf", "die Köpfe", "head", { de: "Mein Kopf tut weh.", en: "My head hurts." }, { topics: ["koerper"] }),
  n("auge", "das", "Auge", "die Augen", "eye", { de: "Machen Sie bitte die Augen zu.", en: "Please close your eyes." }, { topics: ["koerper"] }),
  n("ohr", "das", "Ohr", "die Ohren", "ear", { de: "Ich höre mit den Ohren.", en: "I hear with my ears." }, { topics: ["koerper"] }),
  n("nase", "die", "Nase", "die Nasen", "nose", { de: "Ich habe Schnupfen, meine Nase läuft.", en: "I have a cold, my nose is running." }, {
    topics: ["koerper"],
  }),
  n("mund", "der", "Mund", "die Münder", "mouth", { de: "Machen Sie bitte den Mund auf.", en: "Please open your mouth." }, { topics: ["koerper"] }),
  n("zahn", "der", "Zahn", "die Zähne", "tooth", { de: "Der Zahn tut sehr weh.", en: "The tooth hurts a lot." }, { topics: ["koerper"] }),
  n("hals", "der", "Hals", "die Hälse", "neck; throat", { de: "Mein Hals tut weh.", en: "My throat hurts." }, { topics: ["koerper"] }),
  n("bauch", "der", "Bauch", "die Bäuche", "stomach, belly", { de: "Das Kind hat Hunger, der Bauch ist leer.", en: "The child is hungry, its stomach is empty." }, {
    topics: ["koerper"],
  }),
  n("ruecken", "der", "Rücken", "die Rücken", "back", { de: "Ich sitze viel, mein Rücken tut weh.", en: "I sit a lot, my back hurts." }, {
    topics: ["koerper"],
  }),
  n("arm", "der", "Arm", "die Arme", "arm", { de: "Ich habe zwei Arme und zwei Beine.", en: "I have two arms and two legs." }, { topics: ["koerper"] }),
  n("hand", "die", "Hand", "die Hände", "hand", { de: "Ich schreibe mit der Hand.", en: "I write by hand." }, { topics: ["koerper"] }),
  n("bein", "das", "Bein", "die Beine", "leg", { de: "Stehen Sie bitte auf einem Bein.", en: "Please stand on one leg." }, { topics: ["koerper"] }),
  n("fuss", "der", "Fuß", "die Füße", "foot", { de: "Meine Füße tun weh.", en: "My feet hurt." }, { topics: ["koerper"] }),
];

// --- Lesson 2: how you feel -----------------------------------------------------------
export const FEELING = [
  w("krank", "krank", "adjective", "ill, sick", { de: "Ich bin krank und bleibe heute zu Hause.", en: "I'm ill and I'm staying at home today." }, {
    topics: ["krankheit"],
  }),
  w("gesund", "gesund", "adjective", "healthy; well", { de: "Obst und Gemüse sind gesund.", en: "Fruit and vegetables are healthy." }, {
    topics: ["krankheit"],
  }),
  n("schmerzen", "die", "Schmerzen", null, "pain", { de: "Haben Sie Schmerzen?", en: "Are you in pain?" }, {
    topics: ["krankheit"],
    notes: { en: "Usually used in the plural. Singular: der Schmerz." },
  }),
  n("kopfschmerzen", "die", "Kopfschmerzen", null, "headache", { de: "Ich habe Kopfschmerzen.", en: "I have a headache." }, {
    topics: ["krankheit"],
    notes: { en: "Plural in German: Ich habe Kopfschmerzen (no article)." },
  }),
  n("bauchschmerzen", "die", "Bauchschmerzen", null, "stomach ache", { de: "Das Kind hat Bauchschmerzen.", en: "The child has a stomach ache." }, {
    topics: ["krankheit"],
    notes: { en: "Plural in German, like Kopfschmerzen." },
  }),
  n("halsschmerzen", "die", "Halsschmerzen", null, "sore throat", { de: "Ich habe Halsschmerzen und Husten.", en: "I have a sore throat and a cough." }, {
    topics: ["krankheit"],
    notes: { en: "Plural in German, like Kopfschmerzen." },
  }),
  n("fieber", "das", "Fieber", null, "fever, temperature", { de: "Hast du Fieber?", en: "Do you have a temperature?" }, {
    topics: ["krankheit"],
    notes: { en: "No article: Ich habe Fieber." },
  }),
  n("husten", "der", "Husten", null, "cough", { de: "Er hat Husten.", en: "He has a cough." }, {
    topics: ["krankheit"],
    notes: { en: "No article: Ich habe Husten." },
  }),
  n("schnupfen", "der", "Schnupfen", null, "runny nose, head cold", { de: "Im Winter habe ich oft Schnupfen.", en: "In winter I often have a runny nose." }, {
    topics: ["krankheit"],
    notes: { en: "No article: Ich habe Schnupfen." },
  }),
  n("erkaeltung", "die", "Erkältung", "die Erkältungen", "a cold", { de: "Ich habe eine Erkältung.", en: "I have a cold." }, {
    topics: ["krankheit"],
    notes: { en: "With the article: Ich habe eine Erkältung." },
  }),
  n("grippe", "die", "Grippe", null, "flu", { de: "Frau Kurz hat Grippe und ist zu Hause.", en: "Ms Kurz has the flu and is at home." }, {
    topics: ["krankheit"],
  }),
  w("wehtun", "wehtun", "verb", "to hurt", { de: "Der Bauch tut weh.", en: "My stomach hurts." }, {
    topics: ["krankheit"],
    notes: { en: "Separable: es tut weh (one thing), sie tun weh (more than one): Die Füße tun weh." },
  }),
  w("mir-geht-es-nicht-gut", "Mir geht es nicht gut.", "phrase", "I don't feel well.", { de: "Mir geht es heute nicht gut.", en: "I don't feel well today." }, {
    topics: ["krankheit"],
    notes: { en: "A fixed expression. It also works as: Es geht mir nicht gut." },
  }),
  w("was-fehlt-ihnen", "Was fehlt Ihnen?", "phrase", "What's the matter (with you)? (formal)", {
    de: "Guten Tag, Herr Lang. Was fehlt Ihnen?",
    en: "Hello, Mr Lang. What's the matter?",
  }, {
    topics: ["arztpraxis"],
    notes: { en: "The doctor's typical question. Informal: Was fehlt dir?" },
  }),
];

// --- Lesson 3: at the doctor's practice -------------------------------------------------
export const PRACTICE = [
  n("praxis", "die", "Praxis", "die Praxen", "(doctor's) practice, surgery", { de: "Die Praxis ist in der Bahnhofstraße.", en: "The practice is on Bahnhofstraße." }, {
    topics: ["arztpraxis"],
  }),
  n("sprechstunde", "die", "Sprechstunde", "die Sprechstunden", "surgery hours, consultation hours", {
    de: "Die Sprechstunde ist von 8 bis 12 Uhr.",
    en: "Surgery hours are from 8 to 12.",
  }, { topics: ["arztpraxis"] }),
  n("wartezimmer", "das", "Wartezimmer", "die Wartezimmer", "waiting room", { de: "Bitte warten Sie im Wartezimmer.", en: "Please wait in the waiting room." }, {
    topics: ["arztpraxis"],
  }),
  n("gesundheitskarte", "die", "Gesundheitskarte", "die Gesundheitskarten", "health insurance card", {
    de: "Ihre Gesundheitskarte, bitte!",
    en: "Your health insurance card, please!",
  }, { topics: ["arztpraxis"], notes: { en: "You show this card at the reception of a German practice." } }),
  n("patient", "der", "Patient", "die Patienten", "patient (male)", { de: "Der Patient wartet im Wartezimmer.", en: "The patient is waiting in the waiting room." }, {
    topics: ["arztpraxis"],
  }),
  n("patientin", "die", "Patientin", "die Patientinnen", "patient (female)", { de: "Die Patientin heißt Frau Aydin.", en: "The patient's name is Ms Aydin." }, {
    topics: ["arztpraxis"],
  }),
  w("untersuchen", "untersuchen", "verb", "to examine", { de: "Der Arzt untersucht das Kind.", en: "The doctor examines the child." }, {
    topics: ["arztpraxis"],
    notes: { en: "Not separable: ich untersuche, du untersuchst." },
  }),
  w("platz-nehmen", "Platz nehmen", "phrase", "to take a seat", { de: "Nehmen Sie bitte Platz!", en: "Please take a seat!" }, {
    topics: ["arztpraxis"],
  }),
];

// --- Lesson 4: advice and the pharmacy ---------------------------------------------------
export const ADVICE = [
  w("sollen", "sollen", "verb", "should, to be supposed to", { de: "Ich soll viel Wasser trinken, sagt die Ärztin.", en: "I should drink a lot of water, the doctor says." }, {
    topics: ["ratschlaege"],
    notes: { en: "Modal verb: ich soll, du sollst, er/sie soll, wir sollen, ihr sollt, sie/Sie sollen" },
  }),
  w("duerfen", "dürfen", "verb", "may, to be allowed to", { de: "Darf ich morgen wieder Sport machen?", en: "May I do sport again tomorrow?" }, {
    topics: ["ratschlaege"],
    notes: { en: "Modal verb: ich darf, du darfst, er/sie darf, wir dürfen, ihr dürft, sie/Sie dürfen" },
  }),
  w("im-bett-bleiben", "im Bett bleiben", "phrase", "to stay in bed", { de: "Bleib heute im Bett!", en: "Stay in bed today!" }, {
    topics: ["ratschlaege"],
  }),
  w("rauchen", "rauchen", "verb", "to smoke", { de: "Sie dürfen hier nicht rauchen.", en: "You're not allowed to smoke here." }, {
    topics: ["ratschlaege"],
  }),
  n("gesundheit", "die", "Gesundheit", null, "health", { de: "Sport ist gut für die Gesundheit.", en: "Sport is good for your health." }, {
    topics: ["ratschlaege"],
    notes: { en: "Gesundheit! is also what you say when someone sneezes." },
  }),
  w("gute-besserung", "Gute Besserung!", "phrase", "Get well soon!", { de: "Gute Besserung, Lisa!", en: "Get well soon, Lisa!" }, {
    topics: ["ratschlaege"],
  }),
  n("apotheke", "die", "Apotheke", "die Apotheken", "pharmacy, chemist's", { de: "Die Apotheke ist neben der Praxis.", en: "The pharmacy is next to the practice." }, {
    topics: ["apotheke"],
  }),
  n("medikament", "das", "Medikament", "die Medikamente", "medicine, medication", {
    de: "Das Medikament bekommen Sie in der Apotheke.",
    en: "You get the medicine at the pharmacy.",
  }, { topics: ["apotheke"] }),
  n("tablette", "die", "Tablette", "die Tabletten", "tablet, pill", { de: "Ich möchte keine Tabletten nehmen.", en: "I don't want to take any tablets." }, {
    topics: ["apotheke"],
  }),
  n("salbe", "die", "Salbe", "die Salben", "ointment, cream", { de: "Die Salbe ist für den Rücken.", en: "The ointment is for the back." }, {
    topics: ["apotheke"],
  }),
  n("rezept", "das", "Rezept", "die Rezepte", "prescription", { de: "Hier ist Ihr Rezept für die Apotheke.", en: "Here is your prescription for the pharmacy." }, {
    topics: ["apotheke"],
    notes: { en: "Here: a doctor's prescription. In the kitchen, das Rezept means “recipe”." },
  }),
];

export const VOCABULARY = [...BODY, ...FEELING, ...PRACTICE, ...ADVICE];

export const slugs = (list) => list.map((v) => v.slug);
