// Module 1 grammar topics. Explanations and examples are original. Topic selection is
// mapped (metadata only) to Netzwerk neu A1 Kap. 1 and Grammatik aktiv chapters 1, 2, 10, 12.

export const GRAMMAR = [
  {
    slug: "du-und-sie",
    title: { de: "du oder Sie?", en: "Informal “du” or formal “Sie”?" },
    summary: { en: "German has two ways to say “you” to one person. Choosing the right one is part of being polite." },
    sections: [
      {
        heading: { en: "du – informal" },
        body: {
          en: "Use du with friends, family, children, classmates and often with young people of your age. Greetings that go with du: Hallo!, Tschüs!, Wie geht's?",
        },
        examples: [
          { de: "Hallo, Tim! Wie geht's?", en: "Hi, Tim! How are you?" },
          { de: "Wie heißt du?", en: "What's your name?" },
        ],
      },
      {
        heading: { en: "Sie – formal" },
        body: {
          en: "Use Sie with adults you don't know, at work, in shops and offices, and in the exam with the examiners. With Sie people use the surname: Herr Brandt, Frau Weber. Sie is always written with a capital S.",
        },
        examples: [
          { de: "Guten Tag, Frau Weber! Wie geht es Ihnen?", en: "Hello, Ms Weber! How are you?" },
          { de: "Wie heißen Sie?", en: "What is your name?" },
        ],
      },
      {
        heading: { en: "Greetings at a glance" },
        table: {
          headers: ["", "informell (du)", "formell (Sie)"],
          rows: [
            ["Hallo", "Hallo!", "Guten Tag!"],
            ["Tschüs", "Tschüs! / Bis bald!", "Auf Wiedersehen!"],
            ["Wie geht's?", "Wie geht's? / Wie geht es dir?", "Wie geht es Ihnen?"],
          ],
        },
        body: { en: "Guten Morgen!, Guten Abend! and Gute Nacht! work in both situations." },
      },
    ],
    refs: [{ ref: "netzwerk-neu-a1-1", note: "Topic alignment only" }],
  },
  {
    slug: "verben-praesens-modul-1",
    title: { de: "Personalpronomen und Verben im Präsens", en: "Personal pronouns and present-tense verbs" },
    summary: { en: "The verb ending changes with the person: ich komme, du kommst, er kommt." },
    sections: [
      {
        heading: { en: "Personal pronouns" },
        body: {
          en: "ich (I), du (you, informal), er / sie / es (he / she / it), wir (we), ihr (you, informal plural), sie (they), Sie (you, formal – one or more people).",
        },
      },
      {
        heading: { en: "Regular verbs" },
        body: { en: "Take the stem (komm-en → komm-) and add the ending. Most verbs work like this." },
        table: {
          headers: ["", "kommen", "wohnen", "heißen"],
          rows: [
            ["ich", "komme", "wohne", "heiße"],
            ["du", "kommst", "wohnst", "heißt"],
            ["er / sie / es", "kommt", "wohnt", "heißt"],
            ["wir", "kommen", "wohnen", "heißen"],
            ["ihr", "kommt", "wohnt", "heißt"],
            ["sie / Sie", "kommen", "wohnen", "heißen"],
          ],
        },
        examples: [
          { de: "Ich komme aus Indien.", en: "I come from India." },
          { de: "Wohnst du in Hamburg?", en: "Do you live in Hamburg?" },
        ],
      },
      {
        heading: { en: "heißen: du heißt" },
        body: { en: "When the stem ends in -ß or -s, du only adds -t: du heißt (not “heißst”)." },
      },
      {
        heading: { en: "sprechen: e → i" },
        body: { en: "Some verbs change the vowel with du and er/sie/es: ich spreche, du sprichst, er spricht. The endings stay regular." },
        examples: [{ de: "Paul spricht Spanisch.", en: "Paul speaks Spanish." }],
      },
      {
        heading: { en: "sein – irregular" },
        body: { en: "sein (to be) is irregular. Learn it by heart; you need it every day." },
        table: {
          headers: ["", "sein"],
          rows: [
            ["ich", "bin"],
            ["du", "bist"],
            ["er / sie / es", "ist"],
            ["wir", "sind"],
            ["ihr", "seid"],
            ["sie / Sie", "sind"],
          ],
        },
        examples: [
          { de: "Ich bin Lena. Wer bist du?", en: "I'm Lena. Who are you?" },
          { de: "Das ist Herr Brandt.", en: "This is Mr Brandt." },
        ],
      },
    ],
    refs: [
      { ref: "netzwerk-neu-a1-1", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-1", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-2", note: "Topic alignment only" },
    ],
  },
  {
    slug: "satzbau-position-2",
    title: { de: "Aussage und W-Frage: das Verb auf Position 2", en: "Statements and W-questions: the verb in position 2" },
    summary: { en: "In German statements and W-questions, the conjugated verb is always the second element." },
    sections: [
      {
        heading: { en: "Statements" },
        body: {
          en: "Position 1 can be the subject or another element. The verb stays in position 2, and the subject moves behind it if something else comes first.",
        },
        table: {
          headers: ["Position 1", "Position 2 (Verb)", ""],
          rows: [
            ["Ich", "komme", "aus Bangladesch."],
            ["Aus Bangladesch", "komme", "ich."],
            ["Wir", "sprechen", "Deutsch."],
          ],
        },
      },
      {
        heading: { en: "W-questions" },
        body: {
          en: "The question word is in position 1 and the verb in position 2. Your voice usually goes down at the end.",
        },
        table: {
          headers: ["W-Wort", "Verb", ""],
          rows: [
            ["Wie", "heißt", "du?"],
            ["Woher", "kommen", "Sie?"],
            ["Wo", "wohnst", "du?"],
            ["Wer", "ist", "das?"],
            ["Was", "ist", "das?"],
          ],
        },
      },
      {
        heading: { en: "Which question word?" },
        body: {
          en: "wer = who (a person) · wie = how / what (name) · was = what (a thing) · woher = where from · wo = where",
        },
        examples: [
          { de: "Woher kommst du? – Aus Spanien.", en: "Where are you from? – From Spain." },
          { de: "Wo wohnst du? – In Leipzig.", en: "Where do you live? – In Leipzig." },
        ],
      },
    ],
    refs: [
      { ref: "netzwerk-neu-a1-1", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-10", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-12", note: "Topic alignment only" },
    ],
  },
  {
    slug: "das-alphabet",
    title: { de: "Das Alphabet", en: "The German alphabet" },
    summary: { en: "26 letters plus ä, ö, ü and ß. Spelling your name is part of the A1 speaking exam." },
    sections: [
      {
        heading: { en: "Letter names" },
        table: {
          headers: ["Buchstabe", "Name", "Buchstabe", "Name"],
          rows: [
            ["A", "a", "N", "en"],
            ["B", "be", "O", "o"],
            ["C", "ce", "P", "pe"],
            ["D", "de", "Q", "ku"],
            ["E", "e", "R", "er"],
            ["F", "ef", "S", "es"],
            ["G", "ge", "T", "te"],
            ["H", "ha", "U", "u"],
            ["I", "i", "V", "fau"],
            ["J", "jot", "W", "we"],
            ["K", "ka", "X", "ix"],
            ["L", "el", "Y", "ypsilon"],
            ["M", "em", "Z", "zett"],
            ["Ä", "ä", "Ö", "ö"],
            ["Ü", "ü", "ß", "eszett"],
          ],
        },
      },
      {
        heading: { en: "Letters that sound different from English" },
        body: {
          en: "E sounds like the “ay” in “say”, I like “ee”, J is “jot” (like “yot”), V is “fau”, W is “we” (like “vay”) and Z is “zett” (like “tset”). Listen to the audio and repeat.",
        },
      },
      {
        heading: { en: "E-mail addresses" },
        body: { en: "Say @ as “ät”, the dot as “Punkt” and a hyphen (-) as “Bindestrich”." },
        examples: [{ de: "lena.brandt@beispiel.de – lena Punkt brandt ät beispiel Punkt de", en: "how to say an e-mail address" }],
      },
    ],
    refs: [{ ref: "netzwerk-neu-a1-1", note: "Topic alignment only" }],
  },
];
