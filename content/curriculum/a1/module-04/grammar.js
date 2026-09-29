// Module 4 grammar topics. Explanations and examples are original. Topic selection is
// mapped (metadata only) to Netzwerk neu A1 Kap. 4 and Grammatik aktiv chapters 17, 6, 12.

const KAP4 = { ref: "netzwerk-neu-a1-4", note: "Topic alignment only" };
const ga = (n) => ({ ref: `grammatik-aktiv-${n}`, note: "Topic alignment only" });

export const GRAMMAR = [
  {
    slug: "m4-akkusativ",
    title: { de: "Der Akkusativ: einen, ein, eine, keinen", en: "The accusative: einen, ein, eine, keinen" },
    summary: {
      en: "What you eat, drink, buy or need is the object of the sentence. In German the object is in the accusative – and only masculine nouns change.",
    },
    sections: [
      {
        heading: { en: "Subject and object" },
        body: {
          en: "In Ich esse einen Apfel, ich is the subject (nominative) and einen Apfel is the object (accusative). You find the object with the question Was …? – Was esse ich? – Einen Apfel.",
        },
        examples: [
          { de: "Das ist ein Apfel. Ich esse einen Apfel.", en: "This is an apple. I'm eating an apple." },
          { de: "Der Kaffee ist gut. Ich trinke den Kaffee.", en: "The coffee is good. I'm drinking the coffee." },
        ],
      },
      {
        heading: { en: "Only masculine nouns change" },
        body: { en: "der → den, ein → einen, kein → keinen. Neuter (das), feminine (die) and plural stay the same." },
        table: {
          headers: ["", "Nominativ", "Akkusativ"],
          rows: [
            ["maskulin", "der / ein / kein Apfel", "den / einen / keinen Apfel"],
            ["neutral", "das / ein / kein Ei", "das / ein / kein Ei"],
            ["feminin", "die / eine / keine Banane", "die / eine / keine Banane"],
            ["Plural", "die / – / keine Äpfel", "die / – / keine Äpfel"],
          ],
        },
      },
      {
        heading: { en: "kein in the accusative" },
        body: { en: "Use kein- to say “no / not any” with a noun: keinen (masculine), kein (neuter), keine (feminine and plural)." },
        examples: [
          { de: "Ich trinke keinen Kaffee.", en: "I don't drink coffee." },
          { de: "Ich esse kein Fleisch.", en: "I don't eat meat." },
          { de: "Wir brauchen keine Milch.", en: "We don't need any milk." },
          { de: "Ich kaufe keine Tomaten.", en: "I'm not buying any tomatoes." },
        ],
      },
      {
        heading: { en: "Food without an article" },
        body: {
          en: "When you mean an amount you don't count, you often use no article: Ich trinke Milch. Ich esse Brot. After a quantity word the food has no article either: ein Kilo Äpfel, eine Flasche Wasser, 200 Gramm Käse. The quantity word itself is the object: Ich kaufe einen Liter Milch.",
        },
        examples: [
          { de: "Ich kaufe einen Liter Milch und ein Kilo Äpfel.", en: "I'm buying a litre of milk and a kilo of apples." },
        ],
      },
    ],
    refs: [KAP4, ga(17)],
  },
  {
    slug: "m4-verben-mit-akkusativ",
    title: { de: "Verben mit Akkusativ", en: "Verbs with an accusative object" },
    summary: { en: "Many everyday verbs need an object in the accusative: essen, trinken, kaufen, brauchen, haben, mögen, möchten." },
    sections: [
      {
        heading: { en: "Common verbs" },
        body: { en: "essen (to eat), trinken (to drink), kaufen (to buy), brauchen (to need) and haben (to have) all take an accusative object." },
        examples: [
          { de: "Ich kaufe ein Brot.", en: "I'm buying a loaf of bread." },
          { de: "Brauchst du einen Liter Milch?", en: "Do you need a litre of milk?" },
          { de: "Wir haben keinen Käse.", en: "We have no cheese." },
        ],
      },
      {
        heading: { en: "essen: e → i" },
        body: { en: "essen changes e → i with du and er/sie/es. Because the stem ends in -ss, du only adds -t: du isst." },
        table: {
          headers: ["", "essen", "trinken", "kaufen"],
          rows: [
            ["ich", "esse", "trinke", "kaufe"],
            ["du", "isst", "trinkst", "kaufst"],
            ["er / sie / es", "isst", "trinkt", "kauft"],
            ["wir", "essen", "trinken", "kaufen"],
            ["ihr", "esst", "trinkt", "kauft"],
            ["sie / Sie", "essen", "trinken", "kaufen"],
          ],
        },
      },
      {
        heading: { en: "Asking for the object: Was …?" },
        body: { en: "Ask Was …? to find out what someone eats, drinks, buys or needs." },
        examples: [
          { de: "Was isst du? – Einen Apfel.", en: "What are you eating? – An apple." },
          { de: "Was brauchen wir? – Milch und Eier.", en: "What do we need? – Milk and eggs." },
        ],
      },
      {
        heading: { en: "Haben Sie …? in a shop" },
        body: { en: "Haben Sie …? is the polite way to ask whether a shop has a product." },
        examples: [
          { de: "Haben Sie Tomaten?", en: "Do you have tomatoes?" },
          { de: "Haben Sie Orangensaft?", en: "Do you have orange juice?" },
        ],
      },
    ],
    refs: [KAP4, ga(17)],
  },
  {
    slug: "m4-moegen-moechten",
    title: { de: "mögen und möchten", en: "mögen (to like) and möchten (would like)" },
    summary: { en: "Ich mag Käse. = I like cheese (in general). Ich möchte Käse, bitte. = I would like some cheese, please (now)." },
    sections: [
      {
        heading: { en: "mögen – to like" },
        body: {
          en: "Use mögen for things you like in general. It is irregular: the vowel changes to a in the singular, and ich and er/sie/es have no ending.",
        },
        examples: [
          { de: "Ich mag Schokolade.", en: "I like chocolate." },
          { de: "Magst du Fisch?", en: "Do you like fish?" },
          { de: "Omar mag keinen Kaffee.", en: "Omar doesn't like coffee." },
        ],
      },
      {
        heading: { en: "möchten – would like" },
        body: {
          en: "Use möchten to say politely what you want – in a shop, at a market stall or at the table. Careful: er/sie/es möchte has no -t.",
        },
        examples: [
          { de: "Ich möchte ein Kilo Tomaten, bitte.", en: "I'd like a kilo of tomatoes, please." },
          { de: "Möchten Sie einen Kaffee?", en: "Would you like a coffee?" },
          { de: "Lena möchte zwei Brötchen.", en: "Lena would like two bread rolls." },
        ],
      },
      {
        heading: { en: "The forms" },
        table: {
          headers: ["", "mögen", "möchten"],
          rows: [
            ["ich", "mag", "möchte"],
            ["du", "magst", "möchtest"],
            ["er / sie / es", "mag", "möchte"],
            ["wir", "mögen", "möchten"],
            ["ihr", "mögt", "möchtet"],
            ["sie / Sie", "mögen", "möchten"],
          ],
        },
        body: { en: "Both verbs take an accusative object: Ich mag den Kuchen. Ich möchte einen Apfel." },
      },
      {
        heading: { en: "Requests in a shop" },
        body: { en: "These phrases help you in the Goethe A1 speaking exam, part 3 (making requests)." },
        examples: [
          { de: "Ich möchte eine Flasche Wasser, bitte.", en: "I'd like a bottle of water, please." },
          { de: "Haben Sie Brötchen?", en: "Do you have bread rolls?" },
          { de: "Was kostet der Käse?", en: "How much is the cheese?" },
          { de: "Sonst noch etwas? – Nein, danke. Das ist alles.", en: "Anything else? – No, thank you. That's all." },
        ],
      },
    ],
    refs: [KAP4, ga(6)],
  },
  {
    slug: "m4-position-1",
    title: { de: "Was steht auf Position 1?", en: "What goes in position 1?" },
    summary: {
      en: "The verb is always in position 2. Position 1 can be the subject, a time word or another part of the sentence. If it isn't the subject, the subject comes right after the verb.",
    },
    sections: [
      {
        heading: { en: "The verb stays in position 2" },
        table: {
          headers: ["Position 1", "Position 2 (Verb)", "…"],
          rows: [
            ["Ich", "kaufe", "heute Brot."],
            ["Heute", "kaufe", "ich Brot."],
            ["Brot", "kaufe", "ich heute."],
            ["Morgen", "essen", "wir Fisch."],
            ["Zum Frühstück", "trinkt", "Lina Tee."],
          ],
        },
        body: { en: "When something other than the subject is in position 1, the subject moves behind the verb: Heute kaufe ich … (not “Heute ich kaufe …”)." },
      },
      {
        heading: { en: "Time words" },
        body: { en: "Time words like heute (today), morgen (tomorrow), jetzt (now) and morgens (in the mornings) are often in position 1." },
        examples: [
          { de: "Jetzt möchte ich einen Kaffee.", en: "Now I'd like a coffee." },
          { de: "Morgens esse ich zwei Brötchen.", en: "In the mornings I eat two bread rolls." },
        ],
      },
      {
        heading: { en: "A common mistake" },
        body: { en: "English says “Today I buy bread.” German puts the verb before ich: Heute kaufe ich Brot." },
        examples: [{ de: "Heute kaufe ich Brot.", en: "Today I'm buying bread." }],
      },
    ],
    refs: [KAP4, ga(12)],
  },
  {
    slug: "m4-gern",
    title: { de: "gern und nicht gern", en: "gern and nicht gern: what you like doing" },
    summary: { en: "Put gern after the verb to say that you like doing something: Ich esse gern Fisch." },
    sections: [
      {
        heading: { en: "verb + gern" },
        body: { en: "gern comes after the conjugated verb – and after the subject when the subject comes after the verb." },
        examples: [
          { de: "Ich esse gern Obst.", en: "I like eating fruit." },
          { de: "Trinkst du gern Tee?", en: "Do you like drinking tea?" },
          { de: "Morgens trinkt Omar gern Kaffee.", en: "In the mornings Omar likes to drink coffee." },
        ],
      },
      {
        heading: { en: "From “very much” to “not at all”" },
        table: {
          headers: ["", "Beispiel"],
          rows: [
            ["sehr gern", "Ich esse sehr gern Schokolade."],
            ["gern", "Ich esse gern Fisch."],
            ["nicht so gern", "Ich esse nicht so gern Käse."],
            ["nicht gern", "Ich esse nicht gern Fleisch."],
          ],
        },
      },
      {
        heading: { en: "gern or mögen?" },
        body: { en: "With a verb you use gern; with only a noun you use mögen. Ich esse gern Fisch. = Ich mag Fisch." },
        examples: [
          { de: "Was isst du gern? – Ich esse gern Kartoffeln.", en: "What do you like to eat? – I like eating potatoes." },
          { de: "Magst du Kuchen? – Ja, sehr gern!", en: "Do you like cake? – Yes, very much!" },
        ],
      },
    ],
    refs: [KAP4, ga(16)],
  },
];
