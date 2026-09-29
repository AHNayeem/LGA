// Module 5 grammar topics. Explanations and examples are original. Topic selection is
// mapped (metadata only) to Netzwerk neu A1 Kap. 5 and Grammatik aktiv chapters 32, 19, 5.

const KAP5 = { ref: "netzwerk-neu-a1-5", note: "Topic alignment only" };

export const GRAMMAR = [
  {
    slug: "m5-uhrzeit",
    title: { de: "Die Uhrzeit: offiziell und informell", en: "Telling the time: official and informal" },
    summary: { en: "German has two ways to tell the time: the official 24-hour way and the informal way people use in everyday conversation." },
    sections: [
      {
        heading: { en: "Asking for the time" },
        body: { en: "Wie spät ist es? and Wie viel Uhr ist es? both mean “What time is it?”. The answer starts with Es ist …" },
        examples: [
          { de: "Wie spät ist es? – Es ist neun Uhr.", en: "What time is it? – It's nine o'clock." },
          { de: "Wie viel Uhr ist es? – Es ist zehn nach neun.", en: "What time is it? – It's ten past nine." },
        ],
      },
      {
        heading: { en: "Official time (24 hours)" },
        body: {
          en: "On the radio, at the station, in offices and in the exam you hear the official time: first the hour, then Uhr, then the minutes. It uses the 24-hour clock.",
        },
        table: {
          headers: ["Uhrzeit", "offiziell"],
          rows: [
            ["8:15", "acht Uhr fünfzehn"],
            ["14:30", "vierzehn Uhr dreißig"],
            ["18:45", "achtzehn Uhr fünfundvierzig"],
            ["20:05", "zwanzig Uhr fünf"],
          ],
        },
      },
      {
        heading: { en: "Informal time (12 hours)" },
        body: {
          en: "In conversation people use the 12-hour clock with nach (past), vor (to), Viertel (quarter) and halb (half). Without Uhr: Es ist zehn nach acht.",
        },
        table: {
          headers: ["Uhrzeit", "informell"],
          rows: [
            ["8:00", "acht (Uhr)"],
            ["8:05", "fünf nach acht"],
            ["8:10", "zehn nach acht"],
            ["8:15", "Viertel nach acht"],
            ["8:20", "zwanzig nach acht"],
            ["8:25", "fünf vor halb neun"],
            ["8:30", "halb neun"],
            ["8:35", "fünf nach halb neun"],
            ["8:40", "zwanzig vor neun"],
            ["8:45", "Viertel vor neun"],
            ["8:50", "zehn vor neun"],
            ["8:55", "fünf vor neun"],
          ],
        },
      },
      {
        heading: { en: "Careful with halb!" },
        body: {
          en: "halb always points to the NEXT hour: halb neun = 8:30 (half way to nine). Careful: in British English “half eight” means 8:30, but German halb acht means 7:30.",
        },
        examples: [
          { de: "Es ist halb acht.", en: "It's 7:30." },
          { de: "Es ist halb zwölf.", en: "It's 11:30." },
        ],
      },
      {
        heading: { en: "ein Uhr – eins" },
        body: { en: "1:00 is ein Uhr (not “eins Uhr”). Without Uhr you say eins: Es ist eins." },
        examples: [{ de: "Es ist ein Uhr. = Es ist eins.", en: "It's one o'clock." }],
      },
    ],
    refs: [KAP5],
  },
  {
    slug: "m5-temporale-praepositionen",
    title: { de: "Zeitangaben mit am, um, von … bis", en: "Time expressions with am, um, von … bis" },
    summary: { en: "am for days and parts of the day, um for clock times, von … bis for a period of time." },
    sections: [
      {
        heading: { en: "Which preposition?" },
        table: {
          headers: ["", "wofür?", "Beispiel"],
          rows: [
            ["am", "days, parts of the day", "am Montag, am Morgen, am Abend"],
            ["um", "clock times", "um acht Uhr, um halb neun"],
            ["von … bis", "from … to", "von neun bis fünf Uhr, von Montag bis Freitag"],
            ["in der", "night", "in der Nacht"],
          ],
        },
        body: { en: "Exception: at night is in der Nacht, not “am Nacht”." },
      },
      {
        heading: { en: "Questions" },
        body: { en: "Ask Wann? (When?) for any time. Ask Um wie viel Uhr? (At what time?) for a clock time." },
        examples: [
          { de: "Wann frühstückst du? – Am Morgen, um sieben.", en: "When do you have breakfast? – In the morning, at seven." },
          { de: "Um wie viel Uhr beginnt der Kurs? – Um neun Uhr.", en: "At what time does the course start? – At nine." },
          { de: "Wann arbeitest du? – Von Montag bis Freitag.", en: "When do you work? – From Monday to Friday." },
        ],
      },
      {
        heading: { en: "Time in position 1" },
        body: {
          en: "A time expression often comes first. The verb stays in position 2, so the subject moves behind the verb.",
        },
        table: {
          headers: ["Position 1", "Position 2 (Verb)", ""],
          rows: [
            ["Ich", "dusche", "um sieben Uhr."],
            ["Um sieben Uhr", "dusche", "ich."],
            ["Am Abend", "koche", "ich."],
          ],
        },
      },
      {
        heading: { en: "No preposition" },
        body: { en: "morgens, abends, heute and morgen need no preposition: Morgens trinke ich Tee." },
      },
    ],
    refs: [KAP5, { ref: "grammatik-aktiv-32", note: "Topic alignment only" }],
  },
  {
    slug: "m5-possessivartikel",
    title: { de: "Possessivartikel: mein, dein, sein …", en: "Possessive articles: my, your, his …" },
    summary: { en: "Possessive articles say who something belongs to. Their endings work like ein / eine." },
    sections: [
      {
        heading: { en: "Who does it belong to?" },
        table: {
          headers: ["Person", "Possessivartikel", "Englisch"],
          rows: [
            ["ich", "mein", "my"],
            ["du", "dein", "your (informal)"],
            ["er / es", "sein", "his / its"],
            ["sie", "ihr", "her"],
            ["wir", "unser", "our"],
            ["ihr", "euer", "your (informal plural)"],
            ["sie", "ihr", "their"],
            ["Sie", "Ihr", "your (formal)"],
          ],
        },
      },
      {
        heading: { en: "Nominative: endings like ein / eine" },
        body: { en: "Masculine and neuter: no ending. Feminine and plural: -e." },
        table: {
          headers: ["", "der (m)", "das (n)", "die (f)", "die (Plural)"],
          rows: [
            ["ein", "ein Vater", "ein Kind", "eine Mutter", "– Kinder"],
            ["mein", "mein Vater", "mein Kind", "meine Mutter", "meine Kinder"],
            ["unser", "unser Vater", "unser Kind", "unsere Mutter", "unsere Kinder"],
            ["euer", "euer Vater", "euer Kind", "eure Mutter", "eure Kinder"],
          ],
        },
        examples: [
          { de: "Das ist mein Bruder und das ist meine Schwester.", en: "This is my brother and this is my sister." },
          { de: "Wie heißt deine Tochter?", en: "What's your daughter's name?" },
        ],
      },
      {
        heading: { en: "Accusative: only masculine changes" },
        body: { en: "As with einen, only the masculine form changes in the accusative: -en. Feminine, neuter and plural stay the same." },
        table: {
          headers: ["", "der (m)", "das (n)", "die (f)", "die (Plural)"],
          rows: [
            ["Nominativ", "mein Bruder", "mein Kind", "meine Oma", "meine Eltern"],
            ["Akkusativ", "meinen Bruder", "mein Kind", "meine Oma", "meine Eltern"],
          ],
        },
        examples: [
          { de: "Ich besuche meinen Opa.", en: "I visit my grandpa." },
          { de: "Kennst du ihren Mann?", en: "Do you know her husband?" },
        ],
      },
      {
        heading: { en: "sein or ihr? euer or eure?" },
        body: {
          en: "The possessive depends on the owner: Tom → sein Sohn, Lisa → ihr Sohn. euer loses its e when it has an ending: eure Mutter, euren Vater. Ihr (formal your) is always written with a capital I.",
        },
        examples: [
          { de: "Tom und seine Schwester", en: "Tom and his sister" },
          { de: "Lisa und ihre Schwester", en: "Lisa and her sister" },
          { de: "Frau Berger, ist das Ihr Sohn?", en: "Ms Berger, is this your son?" },
        ],
      },
    ],
    refs: [KAP5, { ref: "grammatik-aktiv-19", note: "Topic alignment only" }],
  },
  {
    slug: "m5-modalverben",
    title: { de: "Modalverben: müssen, können, wollen", en: "Modal verbs: müssen, können, wollen" },
    summary: { en: "Modal verbs are in position 2; the second verb goes to the end of the sentence in the infinitive." },
    sections: [
      {
        heading: { en: "Meaning" },
        body: { en: "müssen = must, to have to · können = can, to be able to · wollen = to want (to). Careful: ich will means “I want”, not “I will”." },
      },
      {
        heading: { en: "Conjugation" },
        body: { en: "ich and er/sie/es have the same form and no ending. In the singular (ich, du, er/sie/es) the vowel changes: müssen → ich muss, können → ich kann, wollen → ich will." },
        table: {
          headers: ["", "müssen", "können", "wollen"],
          rows: [
            ["ich", "muss", "kann", "will"],
            ["du", "musst", "kannst", "willst"],
            ["er / sie / es", "muss", "kann", "will"],
            ["wir", "müssen", "können", "wollen"],
            ["ihr", "müsst", "könnt", "wollt"],
            ["sie / Sie", "müssen", "können", "wollen"],
          ],
        },
      },
      {
        heading: { en: "The sentence bracket" },
        body: {
          en: "The modal verb is in position 2 and is conjugated. The second verb is at the very end, in the infinitive. Together they form a bracket around the rest of the sentence.",
        },
        table: {
          headers: ["Position 1", "Modalverb", "…", "Infinitiv (Ende)"],
          rows: [
            ["Ich", "muss", "heute", "arbeiten."],
            ["Heute", "muss", "ich", "arbeiten."],
            ["Wir", "wollen", "am Sonntag", "frühstücken."],
            ["Wann", "kannst", "du", "kommen?"],
          ],
        },
      },
      {
        heading: { en: "Yes/no questions and nicht" },
        body: { en: "In yes/no questions the modal verb comes first. nicht usually stands directly before the infinitive." },
        examples: [
          { de: "Kannst du um acht Uhr kommen?", en: "Can you come at eight?" },
          { de: "Ich kann heute leider nicht kommen.", en: "Unfortunately I can't come today." },
          { de: "Musst du am Samstag arbeiten?", en: "Do you have to work on Saturday?" },
        ],
      },
    ],
    refs: [KAP5, { ref: "grammatik-aktiv-5", note: "Topic alignment only" }],
  },
];
