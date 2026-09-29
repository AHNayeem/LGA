// Module 10 grammar topics. Explanations and examples are original. Topic selection is
// mapped (metadata only) to Netzwerk neu A1 Kap. 10 and Grammatik aktiv chapters 25 and 26.
// Following docs/REFERENCE-ANALYSIS.md §3, the Perfekt is taught receptively and with
// high-frequency verbs only; Perfekt with sein is limited to three chunks (full rules in A2).

const KAP10 = { ref: "netzwerk-neu-a1-10", note: "Topic alignment only" };

export const GRAMMAR = [
  {
    slug: "m10-perfekt-mit-haben",
    title: { de: "Das Perfekt mit haben", en: "Talking about the past: the Perfekt with haben" },
    summary: {
      en: "In spoken German you usually talk about the past with the Perfekt: a form of haben in position 2 and the Partizip II at the end.",
    },
    sections: [
      {
        heading: { en: "What is the Perfekt?" },
        body: {
          en: "When Germans talk about yesterday or the weekend, they mostly use the Perfekt. It has two parts: haben (in the present tense) and a Partizip II such as gemacht or gegessen. At A1 you mainly need to understand it and use about ten common verbs.",
        },
        examples: [
          { de: "Was hast du am Wochenende gemacht?", en: "What did you do at the weekend?" },
          { de: "Ich habe einen Film gesehen.", en: "I watched a film." },
        ],
      },
      {
        heading: { en: "The sentence bracket" },
        body: {
          en: "haben is the conjugated verb, so it stands in position 2. The Partizip II goes to the very end. You know this pattern from modal verbs: Ich möchte Pizza essen. → Ich habe Pizza gegessen.",
        },
        table: {
          headers: ["Position 1", "haben (Position 2)", "…", "Partizip II (Ende)"],
          rows: [
            ["Ich", "habe", "gestern Pizza", "gegessen."],
            ["Du", "hast", "am Wochenende viel", "gelernt."],
            ["Lena", "hat", "einen Film", "gesehen."],
            ["Wir", "haben", "Tee", "getrunken."],
            ["Ihr", "habt", "lange", "gearbeitet."],
            ["Sie", "haben", "eine E-Mail", "geschrieben."],
            ["Gestern", "habe", "ich ein Buch", "gelesen."],
          ],
        },
      },
      {
        heading: { en: "Questions" },
        body: { en: "In W-questions haben is in position 2; in yes/no questions it comes first. The Partizip II stays at the end." },
        examples: [
          { de: "Was hast du gestern gekauft?", en: "What did you buy yesterday?" },
          { de: "Hast du mit Oma telefoniert?", en: "Did you phone Grandma?" },
        ],
      },
      {
        heading: { en: "Ten verbs to learn" },
        table: {
          headers: ["Infinitiv", "Perfekt"],
          rows: [
            ["machen", "hat gemacht"],
            ["kaufen", "hat gekauft"],
            ["arbeiten", "hat gearbeitet"],
            ["lernen", "hat gelernt"],
            ["telefonieren", "hat telefoniert"],
            ["essen", "hat gegessen"],
            ["trinken", "hat getrunken"],
            ["sehen", "hat gesehen"],
            ["lesen", "hat gelesen"],
            ["schreiben", "hat geschrieben"],
          ],
        },
        body: { en: "Learn each verb together with its Partizip II. In lesson 2 you see how the forms are built." },
      },
    ],
    refs: [KAP10, { ref: "grammatik-aktiv-26", note: "Topic alignment only" }],
  },
  {
    slug: "m10-partizip-ii",
    title: { de: "Das Partizip II", en: "Forming the Partizip II" },
    summary: { en: "Regular verbs: ge- + stem + -t. Many common verbs are irregular: ge- + … + -en. Learn those as pairs." },
    sections: [
      {
        heading: { en: "Regular verbs: ge- … -t" },
        body: { en: "Take the stem and put ge- in front and -t at the end." },
        table: {
          headers: ["Infinitiv", "Stamm", "Partizip II"],
          rows: [
            ["machen", "mach-", "ge-mach-t"],
            ["kaufen", "kauf-", "ge-kauf-t"],
            ["lernen", "lern-", "ge-lern-t"],
            ["suchen", "such-", "ge-such-t"],
          ],
        },
      },
      {
        heading: { en: "Stem ending in -t or -d: -et" },
        body: { en: "When the stem ends in -t or -d, add -et so you can pronounce it: arbeiten → gearbeitet." },
        examples: [{ de: "Sie hat drei Jahre in Köln gearbeitet.", en: "She worked in Cologne for three years." }],
      },
      {
        heading: { en: "Verbs in -ieren: no ge-" },
        body: { en: "Verbs ending in -ieren get -t but no ge-: telefonieren → telefoniert, studieren → studiert." },
        examples: [
          { de: "Ich habe mit Mama telefoniert.", en: "I phoned Mum." },
          { de: "Paul hat in Bonn studiert.", en: "Paul studied in Bonn." },
        ],
      },
      {
        heading: { en: "Irregular verbs: ge- … -en" },
        body: {
          en: "Many everyday verbs end in -en, and some change their vowel. There is no simple rule at A1: learn them as pairs. The last three use sein (see lesson 3).",
        },
        table: {
          headers: ["Infinitiv", "Partizip II"],
          rows: [
            ["essen", "gegessen"],
            ["trinken", "getrunken"],
            ["sehen", "gesehen"],
            ["lesen", "gelesen"],
            ["schreiben", "geschrieben"],
            ["fahren", "gefahren"],
            ["gehen", "gegangen"],
            ["kommen", "gekommen"],
          ],
        },
      },
    ],
    refs: [KAP10, { ref: "grammatik-aktiv-26", note: "Topic alignment only" }],
  },
  {
    slug: "m10-perfekt-mit-sein-chunks",
    title: { de: "Ich bin gefahren: das Perfekt mit sein", en: "Perfekt with sein – learn three chunks" },
    summary: {
      en: "A few verbs of movement form the Perfekt with sein. At A1, learn ich bin gefahren, ich bin gegangen and ich bin gekommen as fixed chunks. The full rules follow in A2.",
    },
    sections: [
      {
        heading: { en: "Three chunks" },
        body: {
          en: "When you move from one place to another with fahren, gehen or kommen, the Perfekt uses sein, not haben. Don't worry about the rule yet: just learn these three as chunks.",
        },
        table: {
          headers: ["", "fahren", "gehen", "kommen"],
          rows: [
            ["ich", "bin gefahren", "bin gegangen", "bin gekommen"],
            ["du", "bist gefahren", "bist gegangen", "bist gekommen"],
            ["er / sie / es", "ist gefahren", "ist gegangen", "ist gekommen"],
            ["wir", "sind gefahren", "sind gegangen", "sind gekommen"],
            ["ihr", "seid gefahren", "seid gegangen", "seid gekommen"],
            ["sie / Sie", "sind gefahren", "sind gegangen", "sind gekommen"],
          ],
        },
      },
      {
        heading: { en: "Same sentence bracket" },
        body: { en: "sein is in position 2, the Partizip II at the end – exactly like haben." },
        examples: [
          { de: "Ich bin mit dem Zug nach Hamburg gefahren.", en: "I went to Hamburg by train." },
          { de: "Am Samstag sind wir ins Kino gegangen.", en: "On Saturday we went to the cinema." },
          { de: "Wann bist du nach Hause gekommen?", en: "When did you get home?" },
        ],
      },
      {
        heading: { en: "haben or sein?" },
        body: {
          en: "In this module: fahren, gehen and kommen → sein. All the other verbs you have learned (machen, kaufen, arbeiten, lernen, telefonieren, essen, trinken, sehen, lesen, schreiben) → haben.",
        },
      },
    ],
    refs: [KAP10],
  },
  {
    slug: "m10-praeteritum-war-hatte",
    title: { de: "war und hatte (Wiederholung)", en: "war and hatte revisited" },
    summary: { en: "For sein and haben, Germans mostly use the simple past: ich war, ich hatte – also when they speak." },
    sections: [
      {
        heading: { en: "Why war and hatte?" },
        body: {
          en: "With most verbs you use the Perfekt to talk about the past. But sein and haben are different: people usually say ich war and ich hatte. You met these forms in Module 6.",
        },
        table: {
          headers: ["", "sein", "haben"],
          rows: [
            ["ich", "war", "hatte"],
            ["du", "warst", "hattest"],
            ["er / sie / es", "war", "hatte"],
            ["wir", "waren", "hatten"],
            ["ihr", "wart", "hattet"],
            ["sie / Sie", "waren", "hatten"],
          ],
        },
      },
      {
        heading: { en: "Perfekt and war/hatte together" },
        body: { en: "In a story about your weekend you mix both: war and hatte for being and having, the Perfekt for everything you did." },
        examples: [
          { de: "Am Wochenende war ich in Hamburg. Ich habe viel gesehen.", en: "At the weekend I was in Hamburg. I saw a lot." },
          { de: "Gestern hatte ich eine Prüfung. Ich habe viel gelernt.", en: "Yesterday I had an exam. I studied a lot." },
          { de: "Wie war dein Wochenende?", en: "How was your weekend?" },
        ],
      },
      {
        heading: { en: "On the phone" },
        body: { en: "You often need war when you call someone back: you tried to call, but the person wasn't there." },
        examples: [{ de: "Frau Lorenz war gestern nicht da.", en: "Ms Lorenz wasn't in yesterday." }],
      },
    ],
    refs: [KAP10, { ref: "grammatik-aktiv-25", note: "Topic alignment only" }],
  },
];
