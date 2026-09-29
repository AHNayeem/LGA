// Module 11 grammar topics. Explanations and examples are original. Topic selection is
// mapped (metadata only) to Netzwerk neu A1 Kap. 11 and Grammatik aktiv chapters 20 and 21.

const KAP11 = { ref: "netzwerk-neu-a1-11", note: "Topic alignment only" };

export const GRAMMAR = [
  {
    slug: "m11-welcher-dieser",
    title: { de: "welcher? – dieser", en: "Which one? – This one" },
    summary: { en: "Ask “which?” with welcher and point to something with dieser. Both have the same endings as der, die, das." },
    sections: [
      {
        heading: { en: "Asking and pointing" },
        body: {
          en: "In a shop you often have to choose. Ask with welcher, welche, welches (which) and answer with dieser, diese, dieses (this, this one). Add hier to point: Diese hier.",
        },
        examples: [
          { de: "Welche Jacke kaufst du? – Diese hier.", en: "Which jacket are you buying? – This one." },
          { de: "Welches Kleid ist neu? – Dieses.", en: "Which dress is new? – This one." },
        ],
      },
      {
        heading: { en: "The endings follow der, die, das" },
        body: {
          en: "Look at the definite article: der → -er, die → -e, das → -es, plural die → -e. In the accusative only the masculine form changes: den → welchen / diesen.",
        },
        table: {
          headers: ["", "der (m)", "die (f)", "das (n)", "die (Plural)"],
          rows: [
            ["Nominativ", "welcher / dieser Rock", "welche / diese Jacke", "welches / dieses Kleid", "welche / diese Schuhe"],
            ["Akkusativ", "welchen / diesen Rock", "welche / diese Jacke", "welches / dieses Kleid", "welche / diese Schuhe"],
          ],
        },
        examples: [
          { de: "Welcher Mantel ist teuer? – Dieser hier.", en: "Which coat is expensive? – This one." },
          { de: "Welchen Pullover möchtest du? – Diesen.", en: "Which jumper would you like? – This one." },
        ],
      },
      {
        heading: { en: "Without a noun" },
        body: { en: "If everyone knows what you mean, you can leave out the noun. The ending stays the same." },
        examples: [
          { de: "Welche Schuhe nimmst du? – Diese.", en: "Which shoes are you taking? – These." },
          { de: "Ich nehme diesen hier.", en: "I'll take this one. (der Rock)" },
        ],
      },
    ],
    refs: [KAP11, { ref: "grammatik-aktiv-20", note: "Topic alignment only" }],
  },
  {
    slug: "m11-personalpronomen-dativ",
    title: { de: "Personalpronomen im Dativ", en: "Personal pronouns in the dative" },
    summary: { en: "mir, dir, ihm, ihr … – the pronouns you need to say what you like and what fits you." },
    sections: [
      {
        heading: { en: "Three forms of each pronoun" },
        body: {
          en: "You already know the nominative (ich) and the accusative (mich). Some verbs need the dative. Learn the dative forms in a row: mir, dir, ihm, ihr, ihm, uns, euch, ihnen, Ihnen.",
        },
        table: {
          headers: ["Nominativ", "Akkusativ", "Dativ"],
          rows: [
            ["ich", "mich", "mir"],
            ["du", "dich", "dir"],
            ["er", "ihn", "ihm"],
            ["sie", "sie", "ihr"],
            ["es", "es", "ihm"],
            ["wir", "uns", "uns"],
            ["ihr", "euch", "euch"],
            ["sie", "sie", "ihnen"],
            ["Sie", "Sie", "Ihnen"],
          ],
        },
      },
      {
        heading: { en: "In sentences" },
        body: { en: "The dative pronoun usually comes right after the verb." },
        examples: [
          { de: "Die Jacke gefällt mir.", en: "I like the jacket." },
          { de: "Gefällt dir das Kleid?", en: "Do you like the dress?" },
          { de: "Die Schuhe passen ihm nicht.", en: "The shoes don't fit him." },
          { de: "Frau Lang, gefällt Ihnen die Bluse?", en: "Ms Lang, do you like the blouse?" },
        ],
      },
      {
        heading: { en: "Careful: ihr and Ihnen" },
        body: {
          en: "ihr can be the nominative “you” (plural, informal) or the dative “(to) her”. Ihnen with a capital I is the formal “(to) you”; ihnen with a small i means “(to) them”.",
        },
        examples: [
          { de: "Das Kleid gefällt ihr.", en: "She likes the dress." },
          { de: "Die Mäntel gefallen ihnen.", en: "They like the coats." },
        ],
      },
    ],
    refs: [KAP11, { ref: "grammatik-aktiv-21", note: "Topic alignment only" }],
  },
  {
    slug: "m11-verben-mit-dativ",
    title: { de: "Verben mit Dativ", en: "Verbs with the dative" },
    summary: { en: "gefallen, passen, stehen, gehören and helfen take a person in the dative." },
    sections: [
      {
        heading: { en: "The thing is the subject" },
        body: {
          en: "With gefallen, passen, stehen and gehören, the piece of clothing is the subject. The person is in the dative. So the verb agrees with the thing: one jacket – gefällt, two shoes – gefallen.",
        },
        table: {
          headers: ["Subjekt (Sache)", "Verb", "Dativ (Person)", ""],
          rows: [
            ["Die Jacke", "gefällt", "mir.", ""],
            ["Die Schuhe", "gefallen", "mir.", ""],
            ["Die Hose", "passt", "dir", "nicht."],
            ["Das Hemd", "steht", "ihm", "gut."],
            ["Die Mütze", "gehört", "uns.", ""],
          ],
        },
      },
      {
        heading: { en: "What they mean" },
        body: {
          en: "gefallen = to like (it pleases me) · passen = to fit (size) · stehen = to suit (it looks good on you) · gehören = to belong to · helfen = to help. gefallen changes its vowel: es gefällt. helfen changes e → i: du hilfst, er hilft.",
        },
        examples: [
          { de: "Der Rock ist zu klein. Er passt mir nicht.", en: "The skirt is too small. It doesn't fit me." },
          { de: "Blau steht dir gut!", en: "Blue suits you!" },
          { de: "Die Verkäuferin hilft mir.", en: "The shop assistant helps me." },
          { de: "Kann ich Ihnen helfen?", en: "Can I help you?" },
        ],
      },
      {
        heading: { en: "With a noun" },
        body: { en: "Instead of a pronoun you can use a noun in the dative: dem Mann, der Frau, dem Kind, meiner Schwester." },
        examples: [{ de: "Der Schal gehört meiner Schwester.", en: "The scarf belongs to my sister." }],
      },
    ],
    refs: [KAP11, { ref: "grammatik-aktiv-21", note: "Topic alignment only" }],
  },
  {
    slug: "m11-partizip-ii-erkennen",
    title: { de: "Partizip II erkennen", en: "Recognising the Partizip II" },
    summary: { en: "In the Perfekt you will meet participles like eingekauft, anprobiert and bezahlt. Learn to recognise the verb behind them." },
    sections: [
      {
        heading: { en: "Separable verbs: ge- goes in the middle" },
        body: { en: "With separable verbs, ge- goes between the prefix and the verb: ein|kaufen → eingekauft, um|tauschen → umgetauscht." },
        examples: [
          { de: "Ich habe gestern im Kaufhaus eingekauft.", en: "I went shopping in the department store yesterday." },
          { de: "Sie hat die Schuhe umgetauscht.", en: "She exchanged the shoes." },
        ],
      },
      {
        heading: { en: "No ge-: be-, ver-, ge- and -ieren" },
        body: {
          en: "Verbs that start with be-, ver- or ge- and verbs that end in -ieren have no ge- in the participle: bezahlen → bezahlt, verkaufen → verkauft, gefallen → gefallen, anprobieren → anprobiert.",
        },
        table: {
          headers: ["Infinitiv", "Partizip II"],
          rows: [
            ["einkaufen", "eingekauft"],
            ["umtauschen", "umgetauscht"],
            ["anprobieren", "anprobiert"],
            ["bezahlen", "bezahlt"],
            ["verkaufen", "verkauft"],
            ["gefallen", "gefallen"],
          ],
        },
        examples: [
          { de: "Hast du die Hose anprobiert?", en: "Did you try on the trousers?" },
          { de: "Wir haben mit Karte bezahlt.", en: "We paid by card." },
          { de: "Die Jacke hat mir gut gefallen.", en: "I liked the jacket a lot." },
        ],
      },
      {
        heading: { en: "For now: just recognise them" },
        body: { en: "You don't need to build these forms yet. When you read or hear them, find the verb and understand what happened." },
      },
    ],
    refs: [KAP11],
  },
];
