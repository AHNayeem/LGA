// Module 2 grammar topics. Explanations and examples are original. Topic selection is
// mapped (metadata only) to Netzwerk neu A1 Kap. 2 and Grammatik aktiv chapters 3, 4, 11,
// 14 and 15 (with short tips from 47 and 49).

const KAP2 = { ref: "netzwerk-neu-a1-2", note: "Topic alignment only" };
const ga = (n) => ({ ref: `grammatik-aktiv-${n}`, note: "Topic alignment only" });

export const GRAMMAR = [
  {
    slug: "m2-verben-vokalwechsel",
    title: { de: "Verben mit Vokalwechsel", en: "Verbs with a vowel change" },
    summary: { en: "Some verbs change their vowel with du and er/sie/es: ich fahre – du fährst, ich lese – du liest." },
    sections: [
      {
        heading: { en: "Only du and er / sie / es change" },
        body: {
          en: "The endings are the same as for regular verbs. Only the vowel in the stem changes, and only with du and er / sie / es. All other forms stay regular.",
        },
        table: {
          headers: ["", "fahren (a → ä)", "lesen (e → ie)", "sehen (e → ie)", "sprechen (e → i)"],
          rows: [
            ["ich", "fahre", "lese", "sehe", "spreche"],
            ["du", "fährst", "liest", "siehst", "sprichst"],
            ["er / sie / es", "fährt", "liest", "sieht", "spricht"],
            ["wir", "fahren", "lesen", "sehen", "sprechen"],
            ["ihr", "fahrt", "lest", "seht", "sprecht"],
            ["sie / Sie", "fahren", "lesen", "sehen", "sprechen"],
          ],
        },
        examples: [
          { de: "Jonas fährt gern Fahrrad.", en: "Jonas likes cycling." },
          { de: "Liest du gern?", en: "Do you like reading?" },
          { de: "Mia sieht gern Filme.", en: "Mia likes watching films." },
        ],
      },
      {
        heading: { en: "More verbs like this" },
        body: {
          en: "essen (to eat): du isst, er isst · schlafen (to sleep): du schläfst, er schläft. The dictionary shows the vowel change, so learn the du form with the verb.",
        },
        examples: [{ de: "Paul isst gern Pizza.", en: "Paul likes eating pizza." }],
      },
      {
        heading: { en: "du liest, du isst" },
        body: { en: "When the stem ends in -s, -ß or -z, du only adds -t: du liest, du isst, du tanzt – like du heißt in Module 1." },
      },
      {
        heading: { en: "Verb + gern" },
        body: {
          en: "To say what you like doing, put gern after the verb. The verb stays in position 2.",
        },
        examples: [
          { de: "Ich schwimme gern.", en: "I like swimming." },
          { de: "Anna liest gern Bücher.", en: "Anna likes reading books." },
          { de: "Was machst du gern?", en: "What do you like doing?" },
        ],
      },
    ],
    refs: [KAP2, ga(4)],
  },
  {
    slug: "m2-sein-und-haben",
    title: { de: "sein und haben", en: "sein (to be) and haben (to have)" },
    summary: { en: "sein and haben are the two most important verbs in German. Both are irregular." },
    sections: [
      {
        heading: { en: "All the forms" },
        table: {
          headers: ["", "sein", "haben"],
          rows: [
            ["ich", "bin", "habe"],
            ["du", "bist", "hast"],
            ["er / sie / es", "ist", "hat"],
            ["wir", "sind", "haben"],
            ["ihr", "seid", "habt"],
            ["sie / Sie", "sind", "haben"],
          ],
        },
        body: { en: "Careful: du hast and er hat have no b." },
      },
      {
        heading: { en: "Jobs: no article" },
        body: {
          en: "With sein and a job, German uses no article (English says “a teacher”). Women use the -in form.",
        },
        examples: [
          { de: "Ich bin Lehrer.", en: "I'm a teacher. (man)" },
          { de: "Ich bin Lehrerin.", en: "I'm a teacher. (woman)" },
          { de: "Was bist du von Beruf? – Ich bin Koch.", en: "What do you do? – I'm a cook." },
        ],
      },
      {
        heading: { en: "Age: sein, not haben" },
        body: { en: "You give your age with sein. Jahre alt is optional." },
        examples: [
          { de: "Wie alt sind Sie? – Ich bin 35 (Jahre alt).", en: "How old are you? – I'm 35 (years old)." },
          { de: "Tim ist 19.", en: "Tim is 19." },
        ],
      },
      {
        heading: { en: "haben" },
        examples: [
          { de: "Ich habe zwei Hobbys.", en: "I have two hobbies." },
          { de: "Hast du heute Zeit?", en: "Do you have time today?" },
          { de: "Frau Klein hat am Montag frei.", en: "Ms Klein is off on Monday." },
        ],
      },
    ],
    refs: [KAP2, ga(3)],
  },
  {
    slug: "m2-ja-nein-fragen",
    title: { de: "Ja-/Nein-Fragen und Antworten", en: "Yes/no questions and answers" },
    summary: { en: "In a yes/no question the verb comes first. You answer with ja, nein – or doch." },
    sections: [
      {
        heading: { en: "The verb in position 1" },
        body: {
          en: "A W-question starts with a question word, and the verb is in position 2. A yes/no question has no question word: the verb is in position 1. Your voice usually goes up at the end.",
        },
        table: {
          headers: ["", "Position 1", "Position 2", ""],
          rows: [
            ["W-Frage", "Wo", "arbeitest", "du?"],
            ["Ja-/Nein-Frage", "Arbeitest", "du", "in Köln?"],
            ["W-Frage", "Was", "machst", "du gern?"],
            ["Ja-/Nein-Frage", "Spielst", "du", "gern Fußball?"],
          ],
        },
      },
      {
        heading: { en: "Answers: ja and nein" },
        examples: [
          { de: "Bist du Student? – Ja, ich bin Student.", en: "Are you a student? – Yes, I am." },
          { de: "Sind Sie Lehrerin? – Nein, ich bin Ingenieurin.", en: "Are you a teacher? – No, I'm an engineer." },
        ],
      },
      {
        heading: { en: "doch: “yes” to a negative question" },
        body: {
          en: "If the question has nicht (not) in it and your answer is “yes”, say doch, not ja. If you agree with the negative, say nein. You learn more about nicht in Module 3.",
        },
        examples: [
          { de: "Hast du am Sonntag nicht frei? – Doch, ich habe frei.", en: "Don't you have Sunday off? – Yes, I do." },
          { de: "Hast du am Sonntag nicht frei? – Nein, ich arbeite.", en: "Don't you have Sunday off? – No, I work." },
        ],
      },
    ],
    refs: [KAP2, ga(11)],
  },
  {
    slug: "m2-bestimmter-artikel",
    title: { de: "Der bestimmte Artikel: der, die, das", en: "The definite article: der, die, das" },
    summary: { en: "German has three words for “the”. Each noun has its own article, so always learn the noun with it." },
    sections: [
      {
        heading: { en: "Three articles" },
        body: {
          en: "der is masculine, die is feminine and das is neuter. The article belongs to the word, not to what it means: das Hobby is neuter, die Firma is feminine. In the plural, the article is always die.",
        },
        table: {
          headers: ["der (maskulin)", "die (feminin)", "das (neutral)"],
          rows: [
            ["der Beruf", "die Schule", "das Hobby"],
            ["der Montag", "die Firma", "das Buch"],
            ["der Fußball", "die Musik", "das Krankenhaus"],
            ["der Lehrer", "die Lehrerin", "das Formular"],
          ],
        },
        examples: [
          { de: "Der Lehrer heißt Herr Brandt.", en: "The teacher is called Mr Brandt." },
          { de: "Die Schule ist in Bonn.", en: "The school is in Bonn." },
          { de: "Das Buch ist gut.", en: "The book is good." },
        ],
      },
      {
        heading: { en: "Tips that help" },
        body: {
          en: "Men: der (der Koch). Women with -in: die (die Köchin). Days of the week: der (der Freitag). Numbers used as nouns: die (die Eins, die Zwanzig). These tips help, but most nouns simply have to be learned with their article.",
        },
      },
      {
        heading: { en: "Compound nouns" },
        body: {
          en: "When two nouns are joined, the last part decides the article: das Kranken|haus (das Haus), das Wochen|ende (das Ende), der Fuß|ball (der Ball), die Post|leit|zahl (die Zahl).",
        },
      },
    ],
    refs: [KAP2, ga(15), ga(47), ga(49)],
  },
  {
    slug: "m2-nomen-plural",
    title: { de: "Nomen im Plural", en: "Plural of nouns" },
    summary: { en: "German nouns form the plural in several ways. The plural article is always die." },
    sections: [
      {
        heading: { en: "The main plural forms" },
        table: {
          headers: ["Ending", "Singular", "Plural"],
          rows: [
            ["-e", "der Beruf", "die Berufe"],
            ["-e (+ Umlaut)", "der Koch", "die Köche"],
            ["-(e)n", "die Schule", "die Schulen"],
            ["-nen", "die Lehrerin", "die Lehrerinnen"],
            ["-er (+ Umlaut)", "das Buch", "die Bücher"],
            ["-s", "das Hobby", "die Hobbys"],
            ["– (no ending)", "der Lehrer", "die Lehrer"],
          ],
        },
      },
      {
        heading: { en: "Learn the plural with the noun" },
        body: {
          en: "There are some patterns: many feminine nouns add -(e)n, words from English often add -s, and masculine nouns ending in -er often don't change. But the safest way is to learn every noun as a set: der Beruf, die Berufe.",
        },
        examples: [
          { de: "Ich habe zwei Hobbys.", en: "I have two hobbies." },
          { de: "Die Lehrerinnen sind in der Schule.", en: "The (female) teachers are at school." },
          { de: "Anna liest gern Bücher.", en: "Anna likes reading books." },
        ],
      },
      {
        heading: { en: "Nouns without a plural" },
        body: { en: "Some nouns are normally used only in the singular: die Musik, der Fußball (the sport), das Alter." },
      },
    ],
    refs: [KAP2, ga(14)],
  },
];
