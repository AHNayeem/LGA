// Module 3 grammar topics. Explanations and examples are original. Topic selection is
// mapped (metadata only) to Netzwerk neu A1 Kap. 3 and Grammatik aktiv chapters 15, 16 and 9.

const KAP3 = { ref: "netzwerk-neu-a1-3", note: "Topic alignment only" };

export const GRAMMAR = [
  {
    slug: "m3-unbestimmter-artikel",
    title: { de: "Der unbestimmte Artikel: ein, eine", en: "The indefinite article: ein, eine" },
    summary: { en: "ein and eine mean “a / an”. Use them when you mention something for the first time." },
    sections: [
      {
        heading: { en: "der, das → ein · die → eine" },
        body: { en: "The indefinite article depends on the gender of the noun. der-words and das-words take ein, die-words take eine." },
        table: {
          headers: ["", "bestimmt (the)", "unbestimmt (a / an)"],
          rows: [
            ["maskulin", "der Bahnhof", "ein Bahnhof"],
            ["neutral", "das Kino", "ein Kino"],
            ["feminin", "die Kirche", "eine Kirche"],
            ["Plural", "die Parks", "– Parks"],
          ],
        },
        examples: [
          { de: "Das ist ein Bahnhof.", en: "That is a station." },
          { de: "Das ist eine Kirche.", en: "That is a church." },
        ],
      },
      {
        heading: { en: "Plural: no indefinite article" },
        body: { en: "There is no plural form of ein. You simply use the plural noun, often with a number." },
        examples: [
          { de: "Das sind Hotels.", en: "Those are hotels." },
          { de: "In Kiel gibt es zwei Kinos.", en: "There are two cinemas in Kiel." },
        ],
      },
      {
        heading: { en: "First ein, then der / die / das" },
        body: {
          en: "When you mention something new, use ein / eine. When you talk about it again, it is known, so you use der / die / das.",
        },
        examples: [
          { de: "Das ist ein Platz. Der Platz heißt Marktplatz.", en: "That is a square. The square is called Marktplatz." },
          { de: "Das ist eine Kirche. Die Kirche ist sehr alt.", en: "That is a church. The church is very old." },
        ],
      },
      {
        heading: { en: "Careful with es gibt" },
        body: {
          en: "After es gibt (there is / there are), ein stays the same for das- and die-words: Es gibt ein Kino. Es gibt eine Kirche. With der-words it becomes einen (Es gibt einen Park) – you learn why in Module 4.",
        },
      },
    ],
    refs: [KAP3, { ref: "grammatik-aktiv-15", note: "Topic alignment only" }],
  },
  {
    slug: "m3-negation-kein-nicht",
    title: { de: "Negation: kein, keine und nicht", en: "Negation: kein, keine and nicht" },
    summary: { en: "kein / keine negates a noun; nicht negates almost everything else." },
    sections: [
      {
        heading: { en: "kein / keine: negating a noun" },
        body: {
          en: "Use kein / keine for nouns that would have ein / eine, or no article at all. kein works like ein: kein for der- and das-words, keine for die-words and for plurals.",
        },
        table: {
          headers: ["", "positiv", "negativ"],
          rows: [
            ["maskulin", "ein Bahnhof", "kein Bahnhof"],
            ["neutral", "ein Hotel", "kein Hotel"],
            ["feminin", "eine Haltestelle", "keine Haltestelle"],
            ["Plural", "– Hotels", "keine Hotels"],
          ],
        },
        examples: [
          { de: "Das ist kein Bus. Das ist eine U-Bahn.", en: "That is not a bus. That is an underground train." },
          { de: "Hier gibt es keine Haltestelle.", en: "There is no stop here." },
          { de: "Ich habe kein Auto.", en: "I don't have a car." },
        ],
      },
      {
        heading: { en: "nicht: everything else" },
        body: {
          en: "Use nicht with verbs, adjectives, places, names and with nouns that have der / die / das. nicht usually comes before the word it negates, or at the end of the sentence.",
        },
        examples: [
          { de: "Der Bahnhof ist nicht weit.", en: "The station isn't far." },
          { de: "Ich wohne nicht in Berlin.", en: "I don't live in Berlin." },
          { de: "Das ist nicht der Bus 5.", en: "That isn't bus number 5." },
          { de: "Der Bus kommt nicht.", en: "The bus isn't coming." },
        ],
      },
      {
        heading: { en: "Quick check" },
        body: {
          en: "Ask yourself: would the positive sentence have ein / eine or no article before a noun? Then use kein / keine. Otherwise use nicht. Careful: kein Problem, but nicht das Problem.",
        },
        table: {
          headers: ["positiv", "negativ"],
          rows: [
            ["Das ist ein Zug.", "Das ist kein Zug."],
            ["Das ist der Zug nach Hamburg.", "Das ist nicht der Zug nach Hamburg."],
            ["Das Kino ist groß.", "Das Kino ist nicht groß."],
          ],
        },
      },
    ],
    refs: [KAP3, { ref: "grammatik-aktiv-16", note: "Topic alignment only" }],
  },
  {
    slug: "m3-imperativ-sie",
    title: { de: "Der Imperativ mit Sie", en: "The imperative with Sie (polite instructions)" },
    summary: { en: "To tell someone politely what to do, put the verb first and Sie right after it: Gehen Sie geradeaus!" },
    sections: [
      {
        heading: { en: "Form: verb + Sie" },
        body: {
          en: "The Sie imperative uses the infinitive form (the same form as sie / Sie in the present). The verb goes to position 1, then Sie. Write an exclamation mark or a full stop at the end.",
        },
        table: {
          headers: ["Infinitiv", "Imperativ (Sie)", "English"],
          rows: [
            ["gehen", "Gehen Sie geradeaus!", "Go straight on!"],
            ["fahren", "Fahren Sie mit dem Bus!", "Take the bus!"],
            ["nehmen", "Nehmen Sie die U-Bahn!", "Take the underground!"],
            ["sprechen", "Sprechen Sie Deutsch!", "Speak German!"],
            ["buchstabieren", "Buchstabieren Sie bitte!", "Please spell it!"],
          ],
        },
      },
      {
        heading: { en: "No vowel change" },
        body: {
          en: "Verbs like fahren or sprechen change the vowel with du and er/sie/es (du fährst, er spricht). With Sie there is no change: Fahren Sie …! Sprechen Sie …!",
        },
      },
      {
        heading: { en: "Being polite: bitte" },
        body: { en: "Add bitte to sound friendly. It can go at the start or after Sie." },
        examples: [
          { de: "Bitte gehen Sie links.", en: "Please go left." },
          { de: "Gehen Sie bitte links.", en: "Please go left." },
        ],
      },
      {
        heading: { en: "Imperative or question?" },
        body: {
          en: "The word order is the same as in a yes/no question. The difference is the punctuation and the voice: a question goes up at the end, an instruction goes down.",
        },
        examples: [
          { de: "Gehen Sie geradeaus?", en: "Are you going straight on? (question)" },
          { de: "Gehen Sie geradeaus!", en: "Go straight on! (instruction)" },
          { de: "Gehen Sie geradeaus und dann rechts.", en: "Go straight on and then right." },
        ],
      },
    ],
    refs: [KAP3, { ref: "grammatik-aktiv-9", note: "Topic alignment only" }],
  },
  {
    slug: "m3-adjektiv-nach-sein",
    title: { de: "Adjektive nach sein", en: "Adjectives after sein" },
    summary: { en: "After sein, an adjective has no ending: Die Stadt ist schön." },
    sections: [
      {
        heading: { en: "No ending after sein" },
        body: {
          en: "When an adjective comes after sein (ist, sind …), it never changes. It is the same for der-, die- and das-words and for plurals.",
        },
        examples: [
          { de: "Der Bahnhof ist groß.", en: "The station is big." },
          { de: "Die Kirche ist alt.", en: "The church is old." },
          { de: "Das Hotel ist neu.", en: "The hotel is new." },
          { de: "Die Parks sind schön.", en: "The parks are beautiful." },
        ],
      },
      {
        heading: { en: "Opposites" },
        body: { en: "Learn adjectives in pairs." },
        table: {
          headers: ["", ""],
          rows: [
            ["groß", "klein"],
            ["alt", "neu"],
            ["geöffnet", "geschlossen"],
          ],
        },
      },
      {
        heading: { en: "sehr and nicht" },
        body: { en: "sehr (very) makes an adjective stronger. nicht comes before the adjective." },
        examples: [
          { de: "Die Stadt ist sehr schön.", en: "The city is very beautiful." },
          { de: "Das Museum ist nicht groß.", en: "The museum isn't big." },
        ],
      },
    ],
    refs: [KAP3],
  },
];
