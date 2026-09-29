// Module 9 grammar topics. Explanations and examples are original. Topic selection is
// mapped (metadata only) to Netzwerk neu A1 Kap. 9 and Grammatik aktiv chapters 34 and 35.

const KAP9 = { ref: "netzwerk-neu-a1-9", note: "Topic alignment only" };

export const GRAMMAR = [
  {
    slug: "m9-sein-adjektiv-farben",
    title: { de: "Die Küche ist klein: sein + Adjektiv", en: "Describing things: sein + adjective, and colours" },
    summary: { en: "To describe a room or a thing, use sein + adjective. After sein the adjective never changes." },
    sections: [
      {
        heading: { en: "sein + adjective" },
        body: {
          en: "Put the adjective after sein. It has no ending here – it is the same for der, die, das and the plural.",
        },
        examples: [
          { de: "Die Küche ist klein und hell.", en: "The kitchen is small and bright." },
          { de: "Der Balkon ist groß.", en: "The balcony is big." },
          { de: "Die Zimmer sind sehr gemütlich.", en: "The rooms are very cosy." },
        ],
      },
      {
        heading: { en: "er, sie, es for things" },
        body: {
          en: "When you talk about a thing again, use er for der-words, sie for die-words, es for das-words and sie for the plural.",
        },
        table: {
          headers: ["Frage", "Antwort"],
          rows: [
            ["Wie ist der Balkon?", "Er ist klein."],
            ["Wie ist die Küche?", "Sie ist hell."],
            ["Wie ist das Bad?", "Es ist modern."],
            ["Wie sind die Zimmer?", "Sie sind groß."],
          ],
        },
      },
      {
        heading: { en: "Opposites" },
        table: {
          headers: ["", ""],
          rows: [
            ["groß", "klein"],
            ["hell", "dunkel"],
            ["ruhig", "laut"],
            ["neu / modern", "alt"],
            ["teuer", "billig"],
          ],
        },
      },
      {
        heading: { en: "sehr, nicht so, zu" },
        body: {
          en: "sehr = very, nicht so = not so, zu = too (a problem!). Use zu when you don't like something.",
        },
        examples: [
          { de: "Das Wohnzimmer ist sehr schön.", en: "The living room is very nice." },
          { de: "Die Küche ist leider zu klein.", en: "Unfortunately the kitchen is too small." },
        ],
      },
      {
        heading: { en: "Colours" },
        body: {
          en: "rot, blau, grün, gelb, weiß, schwarz – colours work like other adjectives: Das Sofa ist rot. Ask with: Welche Farbe hat …?",
        },
        examples: [
          { de: "Welche Farbe hat das Sofa? – Es ist grün.", en: "What colour is the sofa? – It's green." },
          { de: "Die Wände sind weiß.", en: "The walls are white." },
        ],
      },
    ],
    refs: [KAP9],
  },
  {
    slug: "m9-in-akkusativ-richtung",
    title: { de: "Wohin? in + Akkusativ", en: "Where to? in + accusative" },
    summary: { en: "For a direction (Wohin?), in takes the accusative: Ich gehe in die Küche." },
    sections: [
      {
        heading: { en: "Wohin? – movement to a place" },
        body: {
          en: "Use Wohin? (where to?) when someone or something moves to a place. With verbs like gehen, kommen, fahren and bringen, in is followed by the accusative.",
        },
        table: {
          headers: ["", "Akkusativ", "Beispiel"],
          rows: [
            ["der Keller", "in den Keller", "Ich gehe in den Keller."],
            ["die Küche", "in die Küche", "Wir gehen in die Küche."],
            ["das Bad", "ins Bad (= in das)", "Lisa geht ins Bad."],
            ["die Zimmer (Pl.)", "in die Zimmer", "Die Kinder gehen in die Zimmer."],
          ],
        },
      },
      {
        heading: { en: "ins = in das" },
        body: { en: "in + das is almost always shortened to ins: ins Wohnzimmer, ins Schlafzimmer, ins Haus." },
        examples: [
          { de: "Wohin gehst du? – Ins Wohnzimmer.", en: "Where are you going? – Into the living room." },
          { de: "Bring bitte die Stühle in den Garten!", en: "Please take the chairs into the garden!" },
        ],
      },
      {
        heading: { en: "Wo? or Wohin?" },
        body: {
          en: "Wo? asks where something is (no movement). Wohin? asks where something goes. Only the article changes: Ich bin in der Küche. – Ich gehe in die Küche. You learn the Wo? forms in the next lesson.",
        },
      },
    ],
    refs: [KAP9, { ref: "grammatik-aktiv-34", note: "Topic alignment only" }],
  },
  {
    slug: "m9-wechselpraepositionen-dativ",
    title: { de: "Wo? Präpositionen mit Dativ", en: "Where? Prepositions of place with the dative" },
    summary: { en: "For a position (Wo?), these nine prepositions take the dative: im Wohnzimmer, an der Wand, neben dem Regal." },
    sections: [
      {
        heading: { en: "Nine prepositions of place" },
        table: {
          headers: ["Präposition", "Bedeutung", "Beispiel"],
          rows: [
            ["in", "in", "Das Bett ist im Schlafzimmer."],
            ["an", "on (a wall), at", "Das Bild ist an der Wand."],
            ["auf", "on (top of)", "Das Buch ist auf dem Tisch."],
            ["unter", "under", "Der Teppich ist unter dem Tisch."],
            ["über", "above", "Die Lampe ist über dem Tisch."],
            ["neben", "next to", "Das Regal ist neben dem Schrank."],
            ["vor", "in front of", "Der Sessel ist vor dem Fenster."],
            ["hinter", "behind", "Der Stuhl ist hinter der Tür."],
            ["zwischen", "between", "Der Tisch ist zwischen dem Sofa und dem Sessel."],
          ],
        },
      },
      {
        heading: { en: "Dative articles" },
        body: { en: "You know these from mit: der → dem, die → der, das → dem, plural die → den (+ -n)." },
        table: {
          headers: ["", "Nominativ", "Dativ"],
          rows: [
            ["maskulin", "der Schrank", "neben dem Schrank"],
            ["feminin", "die Wand", "an der Wand"],
            ["neutral", "das Sofa", "auf dem Sofa"],
            ["Plural", "die Fenster", "vor den Fenstern"],
          ],
        },
      },
      {
        heading: { en: "im and am" },
        body: { en: "in + dem = im, an + dem = am. These short forms are normal in everyday German." },
        examples: [
          { de: "Das Sofa steht im Wohnzimmer.", en: "The sofa is in the living room." },
          { de: "Der Tisch steht am Fenster.", en: "The table is by the window." },
          { de: "Wo ist die Lampe? – Neben dem Bett.", en: "Where is the lamp? – Next to the bed." },
        ],
      },
      {
        heading: { en: "Wo? + dative, Wohin? + accusative" },
        body: {
          en: "Ich bin in der Küche (Wo? – dative). Ich gehe in die Küche (Wohin? – accusative). At A1 you use the dative for position and in + accusative for direction.",
        },
      },
    ],
    refs: [KAP9, { ref: "grammatik-aktiv-35", note: "Topic alignment only" }],
  },
  {
    slug: "m9-stehen-liegen-haengen",
    title: { de: "stehen, liegen, hängen", en: "stehen, liegen, hängen: saying where things are" },
    summary: { en: "German often says how a thing is positioned: it stands, lies or hangs. All three answer Wo? and take the dative." },
    sections: [
      {
        heading: { en: "Which verb?" },
        body: {
          en: "stehen – upright things (a cupboard, a table, a sofa, books on a shelf). liegen – flat things (a rug, a phone, a book on the table). hängen – things on the wall or from the ceiling (a picture, a lamp above the table).",
        },
        examples: [
          { de: "Der Schrank steht im Schlafzimmer.", en: "The wardrobe is in the bedroom." },
          { de: "Der Teppich liegt vor dem Sofa.", en: "The rug is in front of the sofa." },
          { de: "Das Bild hängt über dem Bett.", en: "The picture hangs above the bed." },
        ],
      },
      {
        heading: { en: "Present tense" },
        body: { en: "All three are regular in the present tense. In a room description you mostly need the forms for er/sie/es and sie (plural)." },
        table: {
          headers: ["", "stehen", "liegen", "hängen"],
          rows: [
            ["ich", "stehe", "liege", "hänge"],
            ["du", "stehst", "liegst", "hängst"],
            ["er / sie / es", "steht", "liegt", "hängt"],
            ["wir", "stehen", "liegen", "hängen"],
            ["ihr", "steht", "liegt", "hängt"],
            ["sie / Sie", "stehen", "liegen", "hängen"],
          ],
        },
      },
      {
        heading: { en: "Questions" },
        examples: [
          { de: "Wo steht das Sofa? – Im Wohnzimmer, an der Wand.", en: "Where is the sofa? – In the living room, against the wall." },
          { de: "Wo liegt mein Handy? – Auf dem Tisch.", en: "Where is my phone? – On the table." },
          { de: "Die Bücher stehen im Regal.", en: "The books are on the shelf." },
        ],
      },
    ],
    refs: [KAP9, { ref: "grammatik-aktiv-35", note: "Topic alignment only" }],
  },
];
