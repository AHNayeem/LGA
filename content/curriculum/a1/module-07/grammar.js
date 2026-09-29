// Module 7 grammar topics. Explanations and examples are original. Topic selection is
// mapped (metadata only) to Netzwerk neu A1 Kap. 7 and Grammatik aktiv chapters 44, 18, 33, 35.

const KAP7 = { ref: "netzwerk-neu-a1-7", note: "Topic alignment only" };

export const GRAMMAR = [
  {
    slug: "m7-und-oder-aber",
    title: { de: "Hauptsätze verbinden: und, oder, aber", en: "Connecting sentences: und, oder, aber" },
    summary: { en: "und (and), oder (or) and aber (but) join two main clauses. They stand in position 0, so the word order does not change." },
    sections: [
      {
        heading: { en: "Position 0" },
        body: {
          en: "und, oder and aber do not count as a position. After them, the second sentence starts normally: position 1, then the verb in position 2.",
        },
        table: {
          headers: ["Satz 1", "Position 0", "Position 1", "Position 2 (Verb)", ""],
          rows: [
            ["Ich schreibe E-Mails,", "aber", "der Drucker", "ist", "kaputt."],
            ["Jan trinkt Kaffee", "und", "Nina", "trinkt", "Tee."],
            ["Wir essen in der Kantine", "oder", "wir", "bestellen", "Pizza."],
          ],
        },
      },
      {
        heading: { en: "Meaning" },
        body: {
          en: "und adds information. oder gives a choice. aber shows a contrast or a surprise.",
        },
        examples: [
          { de: "Das ist Jan und das ist Nina.", en: "This is Jan and this is Nina." },
          { de: "Möchten Sie Tee oder Kaffee?", en: "Would you like tea or coffee?" },
          { de: "Der Computer ist alt, aber er funktioniert gut.", en: "The computer is old, but it works well." },
        ],
      },
      {
        heading: { en: "Comma" },
        body: { en: "Always put a comma before aber. Before und and oder you usually don't need one." },
      },
      {
        heading: { en: "Same subject" },
        body: { en: "If both sentences have the same subject, you can leave it out after und and oder." },
        examples: [{ de: "Ich lese die E-Mail und antworte sofort.", en: "I read the e-mail and reply straight away." }],
      },
    ],
    refs: [KAP7, { ref: "grammatik-aktiv-44", note: "Topic alignment only" }],
  },
  {
    slug: "m7-dativ-artikel",
    title: { de: "Der Dativ: dem, der, dem, den", en: "The dative case: articles" },
    summary: { en: "The dative is the third case. You use it for the person who receives something, and after some prepositions (mit, in, an, auf, neben, bei)." },
    sections: [
      {
        heading: { en: "Who receives something?" },
        body: {
          en: "With verbs like schicken, schreiben and geben, the person who gets something is in the dative. The thing is in the accusative. The dative person usually comes first.",
        },
        examples: [
          { de: "Ich schicke der Chefin die Datei.", en: "I send the file to the boss." },
          { de: "Nina schreibt dem Kunden eine E-Mail.", en: "Nina writes an e-mail to the customer." },
          { de: "Wir geben den Kolleginnen die Liste.", en: "We give the list to the colleagues." },
        ],
      },
      {
        heading: { en: "The articles" },
        table: {
          headers: ["", "maskulin", "feminin", "neutral", "Plural"],
          rows: [
            ["Nominativ", "der / ein", "die / eine", "das / ein", "die / –"],
            ["Akkusativ", "den / einen", "die / eine", "das / ein", "die / –"],
            ["Dativ", "dem / einem", "der / einer", "dem / einem", "den / –"],
            ["kein", "keinem", "keiner", "keinem", "keinen"],
            ["mein", "meinem", "meiner", "meinem", "meinen"],
          ],
        },
        body: { en: "Tip: masculine and neuter look the same in the dative (dem, einem, meinem). Feminine dative is der – just like the masculine nominative!" },
      },
      {
        heading: { en: "Plural: -n" },
        body: { en: "In the dative plural the noun also ends in -n: die Computer → den Computern. Nouns that already end in -n or -s don't change: den Kolleginnen, den Büros." },
      },
      {
        heading: { en: "Some masculine nouns add -n" },
        body: { en: "A few masculine nouns get -n or -en in every case except the nominative: der Kollege → dem Kollegen, der Kunde → dem Kunden, der Herr → dem Herrn. Learn them as you meet them." },
      },
    ],
    refs: [KAP7, { ref: "grammatik-aktiv-18", note: "Topic alignment only" }],
  },
  {
    slug: "m7-mit-dativ",
    title: { de: "mit + Dativ", en: "mit + dative" },
    summary: { en: "After mit (with; by) you always use the dative." },
    sections: [
      {
        heading: { en: "With whom? With what?" },
        body: { en: "mit tells you who you do something with, what you use, or how you travel." },
        table: {
          headers: ["", "mit + Dativ"],
          rows: [
            ["der Chef", "mit dem Chef"],
            ["die Kollegin", "mit der Kollegin / mit meiner Kollegin"],
            ["das Team", "mit dem Team / mit einem Team"],
            ["die Kollegen (Plural)", "mit den Kollegen / mit meinen Kollegen"],
          ],
        },
        examples: [
          { de: "Ich esse mit meiner Kollegin in der Kantine.", en: "I eat with my colleague in the canteen." },
          { de: "Nina spricht mit dem Chef.", en: "Nina is talking to the boss." },
          { de: "Ich arbeite mit einem Laptop.", en: "I work on a laptop." },
        ],
      },
      {
        heading: { en: "Transport: mit dem Bus" },
        body: { en: "For transport, German uses mit + dative, where English says “by”." },
        examples: [
          { de: "Jan kommt mit dem Fahrrad.", en: "Jan comes by bike." },
          { de: "Ich fahre mit der U-Bahn.", en: "I go by underground." },
          { de: "Wir fahren mit dem Bus.", en: "We go by bus." },
        ],
      },
      {
        heading: { en: "Paying" },
        examples: [{ de: "Zahlen Sie bar oder mit der Karte?", en: "Are you paying cash or by card?" }],
      },
    ],
    refs: [KAP7, { ref: "grammatik-aktiv-33", note: "Topic alignment only" }],
  },
  {
    slug: "m7-wo-praepositionen-dativ",
    title: { de: "Wo? in, an, auf, neben, bei + Dativ", en: "Where? Prepositions of place + dative" },
    summary: { en: "To say where someone or something is (Wo?), use a preposition + dative." },
    sections: [
      {
        heading: { en: "Which preposition?" },
        table: {
          headers: ["Präposition", "Meaning", "Beispiel"],
          rows: [
            ["in", "inside", "Frau Klein ist in der Kantine."],
            ["an", "at, on the side of", "Jan sitzt am Computer."],
            ["auf", "on top of", "Der Laptop ist auf dem Schreibtisch."],
            ["neben", "next to", "Der Drucker steht neben dem Schreibtisch."],
            ["bei", "at a person's place / at a company", "Ich bin bei Frau Klein. Ich arbeite bei einer Bank."],
          ],
        },
      },
      {
        heading: { en: "Short forms" },
        body: { en: "With dem, German usually uses a short form: in dem → im, an dem → am, bei dem → beim." },
        examples: [
          { de: "Ich bin im Büro.", en: "I'm in the office." },
          { de: "Der Kunde wartet am Empfang.", en: "The customer is waiting at reception." },
          { de: "Jan ist beim Chef.", en: "Jan is with the boss (in the boss's office)." },
        ],
      },
      {
        heading: { en: "Wo ist …?" },
        body: { en: "Ask with Wo? and answer with preposition + dative. You can often answer with the short phrase only." },
        examples: [
          { de: "Wo ist Nina? – In der Besprechung.", en: "Where is Nina? – In the meeting." },
          { de: "Wo ist der Drucker? – Im Flur, neben dem Eingang.", en: "Where is the printer? – In the corridor, next to the entrance." },
          { de: "Wo ist der Geldautomat? – In der Bank, neben dem Schalter.", en: "Where is the cash machine? – In the bank, next to the counter." },
        ],
      },
      {
        heading: { en: "in der Bank or bei der Bank?" },
        body: { en: "in der Bank = inside the building. bei der Bank = at the bank as a company or place of business (Ich arbeite bei der Bank)." },
      },
    ],
    refs: [
      KAP7,
      { ref: "grammatik-aktiv-33", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-35", note: "Topic alignment only" },
    ],
  },
];
