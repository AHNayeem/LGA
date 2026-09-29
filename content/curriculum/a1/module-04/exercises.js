// Module 4 exercises. All texts, dialogues and questions are original. Task *formats*
// follow the Goethe A1 structure documented in docs/REFERENCE-ANALYSIS.md (3-option MC,
// richtig/falsch, form filling, audio played twice); no exam content is reproduced.
// Situation prompts are in English so beginners know what to do; the language being
// tested is always German.

const de = (s) => ({ de: s });
const en = (s) => ({ en: s });
const opt = (id, text) => ({ id, text: de(text) });
const withExtra = (item, extra) => ({ ...item, ...Object.fromEntries(Object.entries(extra).filter(([, v]) => v !== undefined)) });

const mcq = (id, prompt, options, answer, extra = {}) => withExtra({ id, type: "mcq", prompt, options, answer }, extra);
const tf = (id, statement, answer, extra = {}) => withExtra({ id, type: "true_false", statement: de(statement), answer }, extra);
const gap = (id, before, after, accepted, extra = {}) =>
  withExtra({ id, type: "text_input", accepted }, { before: before || undefined, after: after || undefined, ...extra });
const typed = (id, accepted, extra = {}) => withExtra({ id, type: "text_input", accepted }, extra);
const order = (id, tokens, extra = {}) => withExtra({ id, type: "order", tokens }, extra);
const pairs = (id, list, extra = {}) =>
  withExtra({ id, type: "match", pairs: list.map(([l, r], i) => ({ id: `p${i + 1}`, left: l, right: r })) }, extra);
const speak = (id, prompt, modelAnswer, extra = {}) =>
  withExtra({ id, type: "speak_prompt", prompt: en(prompt), modelAnswer: de(modelAnswer), modelAudio: { text: modelAnswer, voice: "female", rate: "slow" } }, extra);
const abc = (a, b, c) => [opt("a", a), opt("b", b), opt("c", c)];

const GOETHE_HOEREN = { ref: "goethe-start-deutsch-1-hoeren", note: "Task format only" };
const GOETHE_LESEN = { ref: "goethe-start-deutsch-1-lesen", note: "Task format only" };
const GOETHE_SCHREIBEN = { ref: "goethe-start-deutsch-1-schreiben", note: "Task format only" };
const GOETHE_SPRECHEN = { ref: "goethe-start-deutsch-1-sprechen", note: "Task format only" };
const KAP4 = { ref: "netzwerk-neu-a1-4", note: "Topic alignment only" };
const ga = (n) => ({ ref: `grammatik-aktiv-${n}`, note: "Topic alignment only" });

// --- Lesson 1: Essen und Trinken -----------------------------------------------------------

const L1 = [
  {
    slug: "m4-lebensmittel-zuordnen",
    skill: "vocabulary",
    title: { de: "Essen und Getränke", en: "Food and drinks" },
    instructions: en("Match each German word with its meaning."),
    items: [
      pairs(
        "q1",
        [
          [de("der Apfel"), en("apple")],
          [de("das Brot"), en("bread")],
          [de("der Käse"), en("cheese")],
          [de("das Ei"), en("egg")],
          [de("die Milch"), en("milk")],
          [de("der Fisch"), en("fish")],
        ],
        { prompt: en("Word and meaning") },
      ),
      pairs(
        "q2",
        [
          [de("der Saft"), en("juice")],
          [de("das Wasser"), en("water")],
          [de("die Kartoffel"), en("potato")],
          [de("das Gemüse"), en("vegetables")],
          [de("das Obst"), en("fruit")],
          [de("das Fleisch"), en("meat")],
        ],
        { prompt: en("Word and meaning") },
      ),
    ],
    refs: [KAP4],
  },
  {
    slug: "m4-akkusativ-artikel",
    skill: "grammar",
    title: { de: "einen, ein oder eine?", en: "einen, ein or eine?" },
    instructions: en("Choose the correct article in the accusative."),
    items: [
      ["q1", "Ich esse … Apfel.", "a", "der Apfel → einen Apfel. Masculine nouns change in the accusative."],
      ["q2", "Tim kauft … Banane.", "c"],
      ["q3", "Wir brauchen … Ei.", "b"],
      ["q4", "Ich trinke … Saft.", "a", "der Saft → einen Saft."],
      ["q5", "Lena isst … Tomate.", "c"],
      ["q6", "Kaufst du … Brötchen?", "b", "das Brötchen → ein Brötchen. Neuter nouns don't change."],
    ].map(([id, prompt, answer, why]) => mcq(id, de(prompt), abc("einen", "ein", "eine"), answer, { explanation: why ? en(why) : undefined })),
    refs: [KAP4, ga(17)],
  },
  {
    slug: "m4-kein-akkusativ",
    skill: "grammar",
    title: { de: "Nein, kein …", en: "No, not any …" },
    instructions: en("Answer with the correct form of kein (keinen, kein or keine)."),
    items: [
      gap("q1", "Trinkst du Kaffee? – Nein, ich trinke", "Kaffee.", ["keinen"], { explanation: en("der Kaffee → keinen Kaffee.") }),
      gap("q2", "Isst du Fleisch? – Nein, ich esse", "Fleisch.", ["kein"]),
      gap("q3", "Brauchst du Milch? – Nein, ich brauche", "Milch.", ["keine"]),
      gap("q4", "Hast du einen Apfel? – Nein, ich habe", "Apfel.", ["keinen"]),
      gap("q5", "Kaufst du Tomaten? – Nein, ich kaufe", "Tomaten.", ["keine"], { explanation: en("Plural: keine Tomaten.") }),
      gap("q6", "Isst du ein Ei? – Nein, ich esse", "Ei.", ["kein"]),
    ],
    refs: [KAP4, ga(17)],
  },
];

// --- Lesson 2: Im Supermarkt ---------------------------------------------------------------

const L2 = [
  {
    slug: "m4-mengen-verpackungen",
    skill: "vocabulary",
    title: { de: "Eine Flasche, ein Kilo …", en: "A bottle, a kilo …" },
    instructions: en("Which word fits? Look at the article too."),
    items: [
      mcq("q1", de("eine … Wasser"), abc("Flasche", "Kilo", "Liter"), "a"),
      mcq("q2", de("ein … Kartoffeln"), abc("Flasche", "Kilo", "Dose"), "b"),
      mcq("q3", de("eine … Tomaten"), abc("Liter", "Stück", "Dose"), "c"),
      mcq("q4", de("200 … Käse"), abc("Gramm", "Liter", "Flaschen"), "a"),
      mcq("q5", de("ein … Kuchen"), abc("Flasche", "Stück", "Packung"), "b"),
      mcq("q6", de("eine … Butter"), abc("Liter", "Kilo", "Packung"), "c"),
      mcq("q7", de("ein … Milch"), abc("Liter", "Dose", "Flasche"), "a"),
    ],
    refs: [KAP4],
  },
  {
    slug: "m4-verben-akkusativ",
    skill: "grammar",
    title: { de: "essen, trinken, kaufen, brauchen", en: "essen, trinken, kaufen, brauchen" },
    instructions: en("Write the correct form of the verb in brackets."),
    items: [
      gap("q1", "Du", "einen Apfel. (essen)", ["isst"], { explanation: en("essen changes e → i: du isst, er/sie isst.") }),
      gap("q2", "Wir", "zwei Kilo Kartoffeln. (kaufen)", ["kaufen"]),
      gap("q3", "", "du Milch? (brauchen)", ["Brauchst"]),
      gap("q4", "Frau Klein", "einen Tee. (trinken)", ["trinkt"]),
      gap("q5", "Ihr", "ein Brötchen. (essen)", ["esst"]),
      gap("q6", "Jonas", "keinen Fisch. (essen)", ["isst"]),
      gap("q7", "Ich", "eine Flasche Wasser. (brauchen)", ["brauche"]),
      gap("q8", "", "Sie Brot? (haben)", ["Haben"]),
    ],
    refs: [KAP4, ga(17)],
  },
  {
    slug: "m4-einkaufszettel-lesen",
    skill: "reading",
    title: { de: "Eine Nachricht von Maria", en: "A message from Maria" },
    instructions: en("Read the message. Are the sentences true (richtig) or false (falsch)?"),
    stimulus: {
      textKind: "message",
      text: de(
        "Hallo Jonas,\nhier ist der Einkaufszettel: ein Brot, sechs Eier, zwei Liter Milch und ein Kilo Äpfel. Käse haben wir noch – wir brauchen keinen Käse. Tim trinkt morgens Orangensaft. Wir haben keinen Saft mehr. Wir brauchen eine Flasche Orangensaft.\nDanke!\nMaria",
      ),
    },
    items: [
      tf("q1", "Die Nachricht ist von Jonas.", false, { explanation: en("Maria writes the message to Jonas.") }),
      tf("q2", "Sie brauchen sechs Eier.", true),
      tf("q3", "Sie brauchen einen Liter Milch.", false),
      tf("q4", "Sie brauchen Käse.", false),
      tf("q5", "Tim trinkt morgens Orangensaft.", true),
      tf("q6", "Sie haben noch Saft.", false),
    ],
    refs: [KAP4, GOETHE_LESEN],
  },
  {
    slug: "m4-einkaufszettel-schreiben",
    skill: "writing",
    title: { de: "Der Einkaufszettel", en: "The shopping list" },
    instructions: en("Read Ali's message. Complete the shopping list: write the quantity for each product (for example: 2 Kilo)."),
    stimulus: {
      textKind: "message",
      text: de(
        "Hallo Sara,\nheute Abend kochen wir für vier Personen. Wir brauchen ein Kilo Kartoffeln, 500 Gramm Käse, drei Flaschen Wasser, eine Packung Butter und sechs Tomaten.\nBis später!\nAli",
      ),
    },
    items: [
      typed("q1", ["1 Kilo", "ein Kilo", "1 kg", "ein kg", "1 Kilogramm", "ein Kilogramm"], { label: "Kartoffeln", ignoreSpaces: true }),
      typed("q2", ["500 Gramm", "500 g", "fünfhundert Gramm", "ein halbes Kilo", "0,5 kg"], { label: "Käse", ignoreSpaces: true }),
      typed("q3", ["3 Flaschen", "drei Flaschen"], { label: "Wasser", ignoreSpaces: true }),
      typed("q4", ["1 Packung", "eine Packung"], { label: "Butter", ignoreSpaces: true }),
      typed("q5", ["6", "sechs", "6 Stück", "sechs Stück", "6 Tomaten", "sechs Tomaten"], { label: "Tomaten", ignoreSpaces: true }),
    ],
    refs: [KAP4, GOETHE_SCHREIBEN],
  },
];

// --- Lesson 3: Was kostet das? --------------------------------------------------------------

const L3 = [
  {
    slug: "m4-preise-hoeren",
    skill: "listening",
    title: { de: "Preise hören", en: "Listening: prices" },
    instructions: en("Listen to each price. You can play each one twice. Choose the price you hear."),
    itemAudioMaxPlays: 2,
    items: [
      ["q1", "Das Brot kostet zwei Euro vierzig.", abc("2,40 €", "2,14 €", "4,20 €"), "a", "female"],
      ["q2", "Ein Kilo Äpfel kostet drei Euro fünfzig.", abc("3,15 €", "3,50 €", "5,30 €"), "b", "male"],
      ["q3", "Die Tomaten kosten zwei Euro neunzig.", abc("2,19 €", "9,20 €", "2,90 €"), "c", "female2"],
      ["q4", "Ein Stück Kuchen kostet einen Euro achtzig.", abc("1,80 €", "1,18 €", "8,10 €"), "a", "male2"],
      ["q5", "Das macht zusammen zwölf Euro sechzig.", abc("12,16 €", "20,60 €", "12,60 €"), "c", "female"],
      ["q6", "Die Flasche Wasser kostet neunundsechzig Cent.", abc("0,96 €", "0,69 €", "6,90 €"), "b", "male"],
    ].map(([id, text, options, answer, voice]) => mcq(id, en("How much is it?"), options, answer, { audio: { text, voice, rate: "slow" } })),
    refs: [KAP4, GOETHE_HOEREN],
  },
  {
    slug: "m4-markt-hoeren",
    skill: "listening",
    title: { de: "Auf dem Markt", en: "Listening: at the market" },
    instructions: en("Listen to the conversation at a market stall. You can play it twice. Then answer the questions."),
    stimulus: {
      textKind: "dialogue",
      audio: {
        lines: [
          { speaker: "Verkäuferin", text: "Guten Tag! Was möchten Sie?", voice: "female" },
          { speaker: "Herr Aydin", text: "Guten Tag! Ich möchte ein Kilo Tomaten, bitte.", voice: "male" },
          { speaker: "Verkäuferin", text: "Gern. Sonst noch etwas?", voice: "female" },
          { speaker: "Herr Aydin", text: "Haben Sie auch Bananen?", voice: "male" },
          { speaker: "Verkäuferin", text: "Nein, heute haben wir leider keine Bananen. Aber die Äpfel sind sehr gut.", voice: "female" },
          { speaker: "Herr Aydin", text: "Gut, dann zwei Kilo Äpfel, bitte. Das ist alles. Was kostet das?", voice: "male" },
          { speaker: "Verkäuferin", text: "Das macht zusammen sieben Euro zwanzig.", voice: "female" },
          { speaker: "Herr Aydin", text: "Hier, bitte. Auf Wiedersehen!", voice: "male" },
        ],
      },
      maxPlays: 2,
      transcriptPolicy: "after_submit",
    },
    items: [
      mcq("q1", en("What does Mr Aydin ask for first?"), abc("ein Kilo Tomaten", "zwei Kilo Tomaten", "ein Kilo Äpfel"), "a"),
      tf("q2", "Die Verkäuferin hat heute keine Bananen.", true),
      tf("q3", "Herr Aydin kauft ein Kilo Äpfel.", false, { explanation: en("He says „zwei Kilo Äpfel, bitte“.") }),
      mcq("q4", en("How much does he pay?"), abc("7,02 €", "7,20 €", "2,70 €"), "b"),
    ],
    refs: [KAP4, GOETHE_HOEREN],
  },
  {
    slug: "m4-moegen-moechten-ueben",
    skill: "grammar",
    title: { de: "mögen oder möchten?", en: "mögen or möchten?" },
    instructions: en("Write the correct form of the verb in brackets, or choose the right sentence."),
    items: [
      gap("q1", "Ich", "einen Kaffee, bitte. (möchten)", ["möchte"]),
      gap("q2", "", "du Käse? (mögen)", ["Magst"]),
      gap("q3", "Frau Berger", "zwei Brötchen. (möchten)", ["möchte"], { explanation: en("er/sie/es möchte – no -t at the end.") }),
      gap("q4", "Wir", "keinen Fisch. (mögen)", ["mögen"]),
      gap("q5", "Was", "ihr? (möchten)", ["möchtet"]),
      gap("q6", "Paul", "Schokolade. (mögen)", ["mag"]),
      mcq("q7", en("You are in a bakery and want a loaf of bread. What do you say?"), abc("Ich möchte ein Brot, bitte.", "Ich mag ein Brot.", "Ich möchte einen Brot, bitte."), "a", {
        explanation: en("For a polite request use möchten. das Brot → ein Brot."),
      }),
      mcq("q8", en("You want to say that you like cheese in general."), abc("Ich möchte Käse, bitte.", "Ich mag Käse.", "Ich mag einen Käse."), "b"),
    ],
    refs: [KAP4, ga(6)],
  },
  {
    slug: "m4-einkaufen-sprechen",
    skill: "speaking",
    title: { de: "Im Geschäft bitten", en: "Making requests in a shop" },
    instructions: en("Say your answer out loud. Then compare it with the model answer and rate yourself."),
    items: [
      speak("q1", "At the bakery: ask for two bread rolls.", "Ich möchte zwei Brötchen, bitte.", { cue: de("Brötchen") }),
      speak("q2", "Ask the shop assistant whether they have milk.", "Entschuldigung, haben Sie Milch?", { cue: de("Milch?") }),
      speak("q3", "Ask how much the cheese costs.", "Was kostet der Käse?", { cue: de("Käse – €?") }),
      speak("q4", "The assistant asks „Sonst noch etwas?“. Say that is everything and thank them.", "Nein, danke. Das ist alles."),
    ],
    refs: [KAP4, GOETHE_SPRECHEN],
  },
];

// --- Lesson 4: Guten Appetit! ----------------------------------------------------------------

const L4 = [
  {
    slug: "m4-mahlzeiten",
    skill: "vocabulary",
    title: { de: "Mahlzeiten und am Tisch", en: "Meals and at the table" },
    instructions: en("Choose the right answer."),
    items: [
      mcq("q1", en("The meal in the morning:"), abc("das Frühstück", "das Mittagessen", "das Abendessen"), "a"),
      mcq("q2", en("The meal in the evening:"), abc("das Frühstück", "das Mittagessen", "das Abendessen"), "c"),
      mcq("q3", en("The meal at midday:"), abc("das Frühstück", "das Mittagessen", "das Abendessen"), "b"),
      mcq("q4", en("What do you say before everyone starts eating?"), abc("Gute Nacht!", "Guten Appetit!", "Das ist alles."), "b"),
      mcq("q5", en("The cake tastes very good. You say: Der Kuchen ist sehr …"), abc("teuer", "billig", "lecker"), "c"),
      mcq("q6", en("Which one is sweet?"), abc("die Schokolade", "der Käse", "die Kartoffel"), "a"),
    ],
    refs: [KAP4],
  },
  {
    slug: "m4-position-1-ueben",
    skill: "grammar",
    title: { de: "Heute kaufe ich …", en: "Today I'm buying …" },
    instructions: en("Put the words in the right order. Start with the word that has a capital letter."),
    items: [
      order("q1", ["Heute", "kaufe", "ich", "Brot", "."], { alternatives: ["Ich kaufe heute Brot.", "Brot kaufe ich heute."] }),
      order("q2", ["Morgen", "essen", "wir", "Fisch", "."], { alternatives: ["Wir essen morgen Fisch.", "Fisch essen wir morgen."] }),
      order("q3", ["Zum", "Frühstück", "trinke", "ich", "Tee", "."], {
        alternatives: ["Ich trinke zum Frühstück Tee.", "Ich trinke Tee zum Frühstück.", "Tee trinke ich zum Frühstück."],
      }),
      order("q4", ["Jetzt", "möchte", "ich", "einen", "Kaffee", "."], { alternatives: ["Ich möchte jetzt einen Kaffee.", "Einen Kaffee möchte ich jetzt."] }),
      order("q5", ["Morgens", "isst", "Lina", "Obst", "."], { alternatives: ["Lina isst morgens Obst.", "Obst isst Lina morgens."] }),
    ],
    refs: [KAP4, ga(12)],
  },
  {
    slug: "m4-gern-ueben",
    skill: "grammar",
    title: { de: "gern oder nicht gern?", en: "gern or nicht gern?" },
    instructions: en("Complete the sentence with gern, sehr gern or nicht gern."),
    items: [
      gap("q1", "Ich esse", "Fisch.", ["gern"], { prompt: en("You like fish.") }),
      gap("q2", "Ich trinke", "Kaffee.", ["nicht gern"], { prompt: en("You don't like coffee.") }),
      gap("q3", "Trinkst du", "Tee?", ["gern"], { prompt: en("Ask a friend if they like drinking tea.") }),
      gap("q4", "Omar isst", "Schokolade.", ["sehr gern"], { prompt: en("Omar likes chocolate very much.") }),
      gap("q5", "Lina isst", "Fleisch.", ["nicht gern"], { prompt: en("Lina doesn't like meat.") }),
      mcq("q6", en("Which sentence means the same as „Ich mag Käse.“?"), abc("Ich esse keinen Käse.", "Ich möchte einen Käse.", "Ich esse gern Käse."), "c"),
    ],
    refs: [KAP4, ga(16)],
  },
  {
    slug: "m4-gern-lesen",
    skill: "reading",
    title: { de: "Lina und Omar", en: "Lina and Omar" },
    instructions: en("Read the text. Are the sentences true (richtig) or false (falsch)?"),
    stimulus: {
      textKind: "profile",
      text: de(
        "Das sind Lina und Omar. Sie wohnen in Hannover.\nLina isst gern Obst und Gemüse. Sie mag Tomaten und Bananen. Fleisch isst sie nicht gern. Morgens trinkt sie Tee – Kaffee mag sie nicht.\nOmar isst sehr gern Fisch mit Kartoffeln. Zum Frühstück isst er zwei Brötchen mit Käse und trinkt einen Kaffee. Schokolade mag er auch. Sie ist so lecker!",
      ),
    },
    items: [
      tf("q1", "Lina isst gern Gemüse.", true),
      tf("q2", "Lina isst gern Fleisch.", false),
      tf("q3", "Lina trinkt morgens Kaffee.", false),
      tf("q4", "Omar isst gern Fisch.", true),
      tf("q5", "Omar isst zum Frühstück Brötchen mit Käse.", true),
      tf("q6", "Omar mag keine Schokolade.", false),
    ],
    refs: [KAP4, GOETHE_LESEN],
  },
];

// --- Lesson 5: Modultest -----------------------------------------------------------------

const L5 = [
  {
    slug: "m4-test-hoeren",
    skill: "listening",
    title: { de: "Test: Hören", en: "Test: listening" },
    instructions: en("Listen to each recording. You can play each one twice. Choose the right answer or write it."),
    itemAudioMaxPlays: 2,
    passThreshold: 0.7,
    items: [
      mcq("q1", en("What does the woman want?"), abc("Kartoffeln und Milch", "Kartoffeln und Wasser", "Tomaten und Milch"), "a", {
        audio: { text: "Ich möchte bitte ein Kilo Kartoffeln und eine Flasche Milch.", voice: "female", rate: "slow" },
      }),
      mcq("q2", en("How much is the cheese?"), abc("4,13 €", "4,30 €", "3,40 €"), "b", {
        audio: { text: "Der Käse kostet heute nur vier Euro dreißig.", voice: "male", rate: "slow" },
      }),
      mcq("q3", en("What doesn't Tom like?"), abc("Fleisch", "Fisch", "Gemüse"), "c", {
        audio: { text: "Ich heiße Tom. Ich esse gern Fleisch und Fisch. Gemüse mag ich nicht.", voice: "male2", rate: "slow" },
      }),
      typed("q4", ["5,80 €", "5,80", "5,80 Euro", "5.80", "5,8", "fünf Euro achtzig"], {
        prompt: en("How much is it? Write the price (for example 2,50 €)."),
        audio: { text: "Das macht zusammen fünf Euro achtzig.", voice: "female2", rate: "slow" },
        ignoreSpaces: true,
      }),
      mcq("q5", en("What does the man drink in the morning?"), abc("Kaffee", "Tee mit Milch", "Orangensaft"), "b", {
        audio: { text: "Morgens trinke ich keinen Kaffee. Ich trinke Tee mit Milch.", voice: "male", rate: "slow" },
      }),
      mcq("q6", en("What does the bakery not have any more?"), abc("Brot", "Kuchen", "Brötchen"), "c", {
        audio: { text: "Brötchen haben wir leider keine mehr. Aber wir haben noch Brot und Kuchen.", voice: "female", rate: "slow" },
      }),
    ],
    refs: [KAP4, GOETHE_HOEREN],
  },
  {
    slug: "m4-test-lesen",
    skill: "reading",
    title: { de: "Test: Lesen", en: "Test: reading" },
    instructions: en("Read the supermarket ad. Are the sentences true (richtig) or false (falsch)?"),
    passThreshold: 0.7,
    stimulus: {
      textKind: "ad",
      text: de(
        "Supermarkt Frisch – unsere Angebote diese Woche\n\nÄpfel aus Deutschland: 1 Kilo 1,99 €\nBananen: 1 Kilo 1,49 €\nKäse aus der Schweiz: 200 Gramm 2,79 €\nOrangensaft: 1 Liter 1,29 €\nMineralwasser: 6 Flaschen 3,00 €\nBrötchen: 1 Stück 0,35 €\nNeu: Schokoladenkuchen, 1 Stück 1,80 €",
      ),
    },
    items: [
      tf("q1", "Ein Kilo Bananen kostet 1,49 €.", true),
      tf("q2", "Ein Kilo Äpfel kostet 2,79 €.", false),
      tf("q3", "Der Käse kommt aus Österreich.", false),
      tf("q4", "Sechs Flaschen Wasser kosten drei Euro.", true),
      tf("q5", "Ein Brötchen kostet 35 Cent.", true),
      tf("q6", "Ein Liter Orangensaft kostet 1,99 €.", false),
    ],
    refs: [KAP4, GOETHE_LESEN],
  },
  {
    slug: "m4-test-formular",
    skill: "writing",
    title: { de: "Test: Eine Bestellung ausfüllen", en: "Test: fill in an order form" },
    instructions: en("Read about Nina. Fill in the online order form of the supermarket for her."),
    passThreshold: 0.7,
    stimulus: {
      textKind: "form",
      text: de(
        "Das ist Nina Horvat. Sie wohnt in Kassel. Heute Abend hat Nina eine Party. Sie braucht Lebensmittel: zwei Kilo Tomaten, drei Flaschen Orangensaft und 30 Brötchen. Ihre E-Mail-Adresse ist nina.horvat@beispiel.de.",
      ),
    },
    items: [
      typed("q1", ["Horvat"], { label: "Familienname" }),
      typed("q2", ["Kassel"], { label: "Wohnort" }),
      typed("q3", ["2 Kilo", "zwei Kilo", "2 kg", "zwei kg", "2 Kilogramm", "zwei Kilogramm"], { label: "Tomaten (Menge)", ignoreSpaces: true }),
      typed("q4", ["3 Flaschen", "drei Flaschen"], { label: "Orangensaft (Menge)", ignoreSpaces: true }),
      typed("q5", ["30", "dreißig", "30 Stück", "dreißig Stück", "30 Brötchen", "dreißig Brötchen"], { label: "Brötchen (Anzahl)", ignoreSpaces: true }),
    ],
    refs: [KAP4, GOETHE_SCHREIBEN],
  },
  {
    slug: "m4-test-grammatik",
    skill: "grammar",
    title: { de: "Test: Grammatik", en: "Test: grammar" },
    instructions: en("Answer all questions."),
    passThreshold: 0.7,
    items: [
      gap("q1", "Ich kaufe", "Apfel. (ein)", ["einen"]),
      gap("q2", "Wir haben", "Milch mehr. (kein)", ["keine"]),
      gap("q3", "Du", "gern Fisch. (essen)", ["isst"]),
      gap("q4", "", "Sie noch etwas? (möchten)", ["Möchten"]),
      mcq("q5", de("Er … keinen Kaffee."), abc("magt", "mag", "mögt"), "b"),
      order("q6", ["Heute", "kaufe", "ich", "einen", "Kuchen", "."], { alternatives: ["Ich kaufe heute einen Kuchen.", "Einen Kuchen kaufe ich heute."] }),
      mcq("q7", de("Ich brauche … Käse."), abc("der", "die", "den"), "c"),
      gap("q8", "Trinkst du", "Tee? – Ja, sehr gern.", ["gern"]),
    ],
    refs: [KAP4, ga(17), ga(6), ga(12)],
  },
  {
    slug: "m4-test-wortschatz",
    skill: "vocabulary",
    title: { de: "Test: Wortschatz", en: "Test: vocabulary" },
    instructions: en("Answer all questions."),
    passThreshold: 0.7,
    items: [
      mcq("q1", en("Which one is a drink?"), abc("das Brot", "der Saft", "der Käse"), "b"),
      mcq("q2", de("eine … Wasser"), abc("Flasche", "Kilo", "Gramm"), "a"),
      mcq("q3", en("Not expensive:"), abc("teuer", "lecker", "billig"), "c"),
      typed("q4", ["das Ei"], { prompt: en("Write the German word with its article: egg") }),
      mcq("q5", en("The shop assistant asks „Sonst noch etwas?“. You don't need anything else."), abc("Nein, danke. Das ist alles.", "Guten Appetit!", "Ja, das ist teuer."), "a"),
      pairs("q6", [
        [de("das Frühstück"), en("breakfast")],
        [de("das Abendessen"), en("dinner")],
        [de("der Preis"), en("price")],
        [de("die Kartoffel"), en("potato")],
        [de("das Gemüse"), en("vegetables")],
      ]),
    ],
    refs: [KAP4],
  },
  {
    slug: "m4-test-sprechen",
    skill: "speaking",
    title: { de: "Test: Sprechen – um etwas bitten", en: "Test: speaking – making requests" },
    instructions: en(
      "Practise part 3 of the A1 speaking exam: make a request from each card. Speak for yourself; the model answer is only an example. This practice is not scored.",
    ),
    items: [
      speak("q1", "Card: apples. Ask for apples at the market.", "Ich möchte ein Kilo Äpfel, bitte.", { cue: de("Äpfel") }),
      speak("q2", "Card: water. Ask whether the shop has water.", "Entschuldigung, haben Sie Wasser?", { cue: de("Wasser?") }),
      speak("q3", "Card: coffee. Ask how much the coffee costs.", "Was kostet der Kaffee?", { cue: de("Kaffee – €?") }),
      speak("q4", "Your partner asks „Möchtest du einen Tee?“. Say no politely: you don't like tea.", "Nein, danke. Ich trinke nicht gern Tee."),
    ],
    refs: [KAP4, GOETHE_SPRECHEN],
  },
];

export const EXERCISES_BY_LESSON = { L1, L2, L3, L4, L5 };
export const EXERCISES = [...L1, ...L2, ...L3, ...L4, ...L5];
