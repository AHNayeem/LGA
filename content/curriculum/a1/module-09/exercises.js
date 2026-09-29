// Module 9 exercises ("Wohnen"). All texts, ads, notices, dialogues and questions are
// original. Task *formats* follow the Goethe A1 structure documented in
// docs/REFERENCE-ANALYSIS.md (Lesen Teil 2: choose ad a or b; Lesen Teil 3: notices,
// richtig/falsch; audio played twice); no exam content is reproduced.
// Situation prompts are in English so beginners know what to do; the language being
// tested is always German.

const de = (s) => ({ de: s });
const en = (s) => ({ en: s });
const opt = (id, text) => ({ id, text: de(text) });
const optEn = (id, text) => ({ id, text: en(text) });
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
  withExtra({ id, type: "speak_prompt", prompt: en(prompt), modelAnswer: de(modelAnswer), modelAudio: { text: modelAnswer, voice: "female", rate: "normal" } }, extra);

const GOETHE_HOEREN = { ref: "goethe-start-deutsch-1-hoeren", note: "Task format only" };
const GOETHE_LESEN = { ref: "goethe-start-deutsch-1-lesen", note: "Task format only" };
const GOETHE_SCHREIBEN = { ref: "goethe-start-deutsch-1-schreiben", note: "Task format only" };
const GOETHE_SPRECHEN = { ref: "goethe-start-deutsch-1-sprechen", note: "Task format only" };
const KAP9 = { ref: "netzwerk-neu-a1-9", note: "Topic alignment only" };
const P3 = { ref: "netzwerk-neu-a1-p3", note: "Topic alignment only" };
const GA34 = { ref: "grammatik-aktiv-34", note: "Topic alignment only" };
const GA35 = { ref: "grammatik-aktiv-35", note: "Topic alignment only" };

const erSieEs = [opt("a", "Er"), opt("b", "Sie"), opt("c", "Es")];
const position = [opt("a", "steht"), opt("b", "liegt"), opt("c", "hängt")];
const adAB = [opt("a", "Anzeige a"), opt("b", "Anzeige b")];
const flatAB = [opt("a", "Wohnung A"), opt("b", "Wohnung B")];

// --- Lesson 1: Meine Wohnung ------------------------------------------------------------

const L1 = [
  {
    slug: "m9-zimmer-und-farben",
    skill: "vocabulary",
    title: { de: "Zimmer und Farben", en: "Rooms and colours" },
    instructions: en("Match the German words with their meanings. Then choose the opposite."),
    items: [
      pairs(
        "q1",
        [
          [de("die Küche"), en("kitchen")],
          [de("das Bad"), en("bathroom")],
          [de("das Schlafzimmer"), en("bedroom")],
          [de("das Wohnzimmer"), en("living room")],
          [de("das Kinderzimmer"), en("children's room")],
          [de("der Balkon"), en("balcony")],
        ],
        { prompt: en("Rooms") },
      ),
      pairs(
        "q2",
        [
          [de("rot"), en("red")],
          [de("blau"), en("blue")],
          [de("grün"), en("green")],
          [de("gelb"), en("yellow")],
          [de("weiß"), en("white")],
          [de("schwarz"), en("black")],
        ],
        { prompt: en("Colours") },
      ),
      mcq("q3", de("Das Zimmer ist nicht hell. Es ist …"), [opt("a", "dunkel"), opt("b", "gemütlich"), opt("c", "modern")], "a"),
      mcq("q4", de("Das Bad ist nicht alt. Es ist …"), [opt("a", "dunkel"), opt("b", "modern"), opt("c", "gelb")], "b"),
    ],
    refs: [KAP9],
  },
  {
    slug: "m9-wie-ist-die-wohnung",
    skill: "grammar",
    title: { de: "Wie ist die Wohnung?", en: "What is the flat like?" },
    instructions: en("Write the correct form of sein, then choose the right word."),
    items: [
      gap("q1", "Die Küche", "klein und hell. (sein)", ["ist"]),
      gap("q2", "Die Zimmer", "sehr gemütlich. (sein)", ["sind"]),
      gap("q3", "Wie", "deine Wohnung? (sein)", ["ist"]),
      gap("q4", "Wir", "jetzt im Wohnzimmer. (sein)", ["sind"]),
      mcq("q5", de("Wie ist der Balkon? – … ist klein."), erSieEs, "a", { explanation: en("der Balkon → er") }),
      mcq("q6", de("Wie ist die Küche? – … ist sehr hell."), erSieEs, "b", { explanation: en("die Küche → sie") }),
      mcq("q7", de("Wie ist das Bad? – … ist modern."), erSieEs, "c", { explanation: en("das Bad → es") }),
      mcq("q8", de("Der Balkon ist …"), [opt("a", "grün"), opt("b", "grüne"), opt("c", "grüner")], "a", {
        explanation: en("After sein the adjective has no ending."),
      }),
    ],
    refs: [KAP9],
  },
  {
    slug: "m9-mias-wohnung-hoeren",
    skill: "listening",
    title: { de: "Mias neue Wohnung", en: "Listening: Mia's new flat" },
    instructions: en("Listen to the conversation. You can play it twice. Then answer the questions."),
    stimulus: {
      textKind: "dialogue",
      audio: {
        lines: [
          { speaker: "Jan", text: "Hallo, Mia! Du hast eine neue Wohnung? Wie ist sie?", voice: "male", rate: "normal" },
          { speaker: "Mia", text: "Sie ist super! Sie hat zwei Zimmer, eine Küche, ein Bad und einen Balkon.", voice: "female", rate: "normal" },
          { speaker: "Jan", text: "Und wie ist das Wohnzimmer?", voice: "male", rate: "normal" },
          { speaker: "Mia", text: "Das Wohnzimmer ist groß und sehr hell. Das Schlafzimmer ist klein, aber gemütlich.", voice: "female", rate: "normal" },
          { speaker: "Jan", text: "Und die Küche?", voice: "male", rate: "normal" },
          { speaker: "Mia", text: "Die Küche ist leider sehr klein. Aber sie ist gelb – das ist meine Farbe!", voice: "female", rate: "normal" },
        ],
      },
      maxPlays: 2,
      transcriptPolicy: "after_submit",
    },
    items: [
      mcq("q1", en("How many rooms does the flat have?"), [opt("a", "ein Zimmer"), opt("b", "zwei Zimmer"), opt("c", "drei Zimmer")], "b"),
      tf("q2", "Das Wohnzimmer ist dunkel.", false),
      tf("q3", "Das Schlafzimmer ist gemütlich.", true),
      mcq("q4", en("What colour is the kitchen?"), [opt("a", "weiß"), opt("b", "grün"), opt("c", "gelb")], "c"),
      tf("q5", "Die Wohnung hat einen Balkon.", true),
    ],
    refs: [KAP9, GOETHE_HOEREN],
  },
];

// --- Lesson 2: Ich gehe in die Küche ---------------------------------------------------

const L2 = [
  {
    slug: "m9-in-den-in-die-ins",
    skill: "grammar",
    title: { de: "in den, in die oder ins?", en: "in den, in die or ins?" },
    instructions: en("Where are they going? Write in den, in die or ins."),
    items: [
      gap("q1", "Ich gehe", "Küche.", ["in die"]),
      gap("q2", "Wir gehen", "Garten.", ["in den"]),
      gap("q3", "Lisa geht", "Bad.", ["ins", "in das"], { explanation: en("das Bad → in das Bad → ins Bad") }),
      gap("q4", "Die Kinder gehen", "Kinderzimmer.", ["ins", "in das"]),
      gap("q5", "Bring bitte das Fahrrad", "Keller!", ["in den"]),
      gap("q6", "Herr Kaya geht", "Haus.", ["ins", "in das"]),
      gap("q7", "Kommst du", "Küche?", ["in die"]),
      mcq("q8", de("Wohin gehst du? – …"), [opt("a", "Ins Wohnzimmer."), opt("b", "Im Wohnzimmer."), opt("c", "In der Küche.")], "a", {
        explanation: en("Wohin? needs the accusative: ins Wohnzimmer."),
      }),
    ],
    refs: [KAP9, GA34],
  },
  {
    slug: "m9-wohin-saetze",
    skill: "grammar",
    title: { de: "Wohin?", en: "Build the sentence" },
    instructions: en("Put the words in the right order."),
    items: [
      order("q1", ["Ich", "gehe", "in", "die", "Küche", "."], { alternatives: ["In die Küche gehe ich."] }),
      order("q2", ["Wohin", "geht", "Paul", "?"]),
      order("q3", ["Wir", "gehen", "in", "den", "Garten", "."], { alternatives: ["In den Garten gehen wir."] }),
      order("q4", ["Geht", "ihr", "ins", "Wohnzimmer", "?"]),
    ],
    refs: [KAP9, GA34],
  },
  {
    slug: "m9-umzug-lesen",
    skill: "reading",
    title: { de: "Eine Nachricht von Lena", en: "A message from Lena" },
    instructions: en(
      "Lena is moving house (der Umzug = the move, die Kiste = box, der Aufzug = lift). Read her message. Are the sentences true (richtig) or false (falsch)?",
    ),
    stimulus: {
      textKind: "message",
      text: de(
        "Hallo Tom,\nmorgen ist mein Umzug! Kannst du um neun Uhr kommen?\nHier ist mein Plan: Die Bücher kommen ins Wohnzimmer. Das Fahrrad und die Kisten kommen in den Keller. Der Tisch und die Stühle kommen in die Küche. Und bring bitte deine Lampe mit. Sie kommt in mein Schlafzimmer.\nDie Wohnung ist im dritten Stock, und es gibt keinen Aufzug. Sorry!\nBis morgen!\nLena",
      ),
    },
    items: [
      tf("q1", "Der Umzug ist morgen.", true),
      tf("q2", "Die Bücher kommen in die Küche.", false),
      tf("q3", "Das Fahrrad kommt in den Keller.", true),
      tf("q4", "Tom soll seine Lampe mitbringen.", true),
      tf("q5", "Das Haus hat einen Aufzug.", false),
    ],
    refs: [KAP9, GOETHE_LESEN],
  },
];

// --- Lesson 3: Wo steht das Sofa? --------------------------------------------------------

const L3 = [
  {
    slug: "m9-moebel-zuordnen",
    skill: "vocabulary",
    title: { de: "Möbel", en: "Furniture" },
    instructions: en("Match the furniture with its meaning. Then answer the questions."),
    items: [
      pairs("q1", [
        [de("der Sessel"), en("armchair")],
        [de("der Schrank"), en("wardrobe")],
        [de("das Regal"), en("shelf")],
        [de("der Teppich"), en("rug")],
        [de("das Bild"), en("picture")],
        [de("der Stuhl"), en("chair")],
      ]),
      mcq("q2", en("Which one is NOT a piece of furniture?"), [opt("a", "der Schrank"), opt("b", "das Fenster"), opt("c", "das Regal")], "b"),
      mcq("q3", en("Where do you sleep?"), [opt("a", "im Bett"), opt("b", "im Regal"), opt("c", "im Schrank")], "a"),
      mcq("q4", de("… Lampe"), [opt("a", "der"), opt("b", "die"), opt("c", "das")], "b"),
      mcq("q5", de("… Sofa"), [opt("a", "der"), opt("b", "die"), opt("c", "das")], "c"),
      mcq("q6", de("… Tisch"), [opt("a", "der"), opt("b", "die"), opt("c", "das")], "a"),
    ],
    refs: [KAP9],
  },
  {
    slug: "m9-wo-ist-was",
    skill: "grammar",
    title: { de: "Wo ist was?", en: "Where is everything?" },
    instructions: en("Write the article in the dative: dem or der. In q7 and q8, write the preposition and the article (or the short form)."),
    items: [
      gap("q1", "Die Lampe ist über", "Tisch.", ["dem"]),
      gap("q2", "Das Bild ist an", "Wand.", ["der"]),
      gap("q3", "Der Teppich ist unter", "Sofa.", ["dem"]),
      gap("q4", "Das Regal ist neben", "Schrank.", ["dem"]),
      gap("q5", "Der Stuhl ist hinter", "Tür.", ["der"]),
      gap("q6", "Der Sessel ist zwischen", "Sofa und dem Regal.", ["dem"]),
      gap("q7", "Der Tisch ist", "Küche. (in + die Küche)", ["in der"]),
      gap("q8", "Das Bett ist", "Schlafzimmer. (in + das Schlafzimmer)", ["im", "in dem"], { explanation: en("in + dem = im") }),
    ],
    refs: [KAP9, GA35],
  },
  {
    slug: "m9-wohnzimmer-hoeren",
    skill: "listening",
    title: { de: "Aylins Wohnzimmer", en: "Listening: Aylin's living room" },
    instructions: en("Listen to the phone call. You can play it twice. Then answer the questions."),
    stimulus: {
      textKind: "dialogue",
      audio: {
        lines: [
          { speaker: "Ben", text: "Aylin, wie ist dein Wohnzimmer jetzt? Ist das Sofa schon da?", voice: "male2", rate: "normal" },
          { speaker: "Aylin", text: "Ja! Das Sofa ist blau. Es steht an der Wand, unter dem Fenster.", voice: "female2", rate: "normal" },
          { speaker: "Ben", text: "Und wo ist das Regal?", voice: "male2", rate: "normal" },
          { speaker: "Aylin", text: "Das Regal ist neben dem Sofa. Und vor dem Sofa ist ein Tisch. Er ist klein und schwarz.", voice: "female2", rate: "normal" },
          { speaker: "Ben", text: "Hast du auch einen Teppich?", voice: "male2", rate: "normal" },
          { speaker: "Aylin", text: "Ja, er ist rot. Er liegt unter dem Tisch.", voice: "female2", rate: "normal" },
          { speaker: "Ben", text: "Das klingt gemütlich!", voice: "male2", rate: "normal" },
        ],
      },
      maxPlays: 2,
      transcriptPolicy: "after_submit",
    },
    items: [
      mcq("q1", en("What colour is the sofa?"), [opt("a", "rot"), opt("b", "blau"), opt("c", "schwarz")], "b"),
      mcq("q2", en("Where is the shelf?"), [opt("a", "unter dem Fenster"), opt("b", "vor dem Sofa"), opt("c", "neben dem Sofa")], "c"),
      mcq("q3", en("Where is the table?"), [opt("a", "vor dem Sofa"), opt("b", "neben dem Regal"), opt("c", "an der Wand")], "a"),
      tf("q4", "Der Teppich ist rot.", true),
      tf("q5", "Der Tisch ist groß.", false),
    ],
    refs: [KAP9, GOETHE_HOEREN],
  },
  {
    slug: "m9-wo-oder-wohin",
    skill: "grammar",
    title: { de: "Wo? oder Wohin?", en: "Where? or Where to?" },
    instructions: en("Position (Wo? + dative) or direction (Wohin? + accusative)? Choose the right form."),
    items: [
      ["q1", "Ich gehe … Küche.", "in die", "in der", "a"],
      ["q2", "Mama ist … Küche.", "in die", "in der", "b"],
      ["q3", "Die Bücher stehen … Regal.", "ins", "im", "b"],
      ["q4", "Geh bitte … Bad!", "ins", "im", "a"],
      ["q5", "Wo ist Papa? – … Garten.", "In den", "Im", "b"],
      ["q6", "Wohin geht Maria? – … Keller.", "In den", "Im", "a"],
    ].map(([id, sentence, a, b, answer]) => mcq(id, de(sentence), [opt("a", a), opt("b", b)], answer)),
    refs: [KAP9, GA34, GA35],
  },
];

// --- Lesson 4: Wohnungssuche ---------------------------------------------------------------

const L4 = [
  {
    slug: "m9-stehen-liegen-haengen",
    skill: "grammar",
    title: { de: "steht, liegt oder hängt?", en: "steht, liegt or hängt?" },
    instructions: en("Choose the right verb. Then write the verb form."),
    items: [
      mcq("q1", de("Das Bild … an der Wand."), position, "c"),
      mcq("q2", de("Der Teppich … im Flur."), position, "b"),
      mcq("q3", de("Der Schrank … im Schlafzimmer."), position, "a"),
      mcq("q4", de("Die Lampe … über dem Tisch."), position, "c"),
      mcq("q5", de("Das Handy … auf dem Tisch."), position, "b"),
      mcq("q6", de("Das Sofa … an der Wand."), position, "a"),
      gap("q7", "Die Bücher", "im Regal. (stehen)", ["stehen"]),
      gap("q8", "Die Bilder", "im Flur. (hängen)", ["hängen"]),
      gap("q9", "Wo", "mein Handy? (liegen)", ["liegt"]),
    ],
    refs: [KAP9, GA35],
  },
  {
    slug: "m9-anzeigen-lesen",
    skill: "reading",
    title: { de: "Wohnungsanzeigen", en: "Flat ads" },
    instructions: en("Read the situations and the ads. Which ad fits: a or b? (Zi. = Zimmer, NK = Nebenkosten, Tel. = Telefon)"),
    stimulus: {
      textKind: "ad",
      text: de(
        "1a) 2-Zi.-Wohnung in Köln, 58 m², 3. Stock, mit Balkon. Miete 690 € + 140 € NK. Tel. 0221 55 81 02\n1b) 2-Zi.-Wohnung in Köln, 62 m², Erdgeschoss, kein Balkon, kein Garten. Miete 650 € + 130 € NK. Tel. 0221 49 30 76\n\n2a) Kleines Apartment im Zentrum, 30 m², modernes Bad. Miete 490 € + 90 € NK.\n2b) 1-Zi.-Wohnung, 34 m², Küche und Bad, 15 Minuten bis zum Zentrum. Miete 390 € + 70 € NK.\n\n3a) Schöne 3-Zi.-Wohnung direkt am Bahnhof. Viele Geschäfte, Busse und Züge vor der Tür!\n3b) Helle 3-Zi.-Wohnung am Stadtpark. Sehr ruhig, kleiner Garten.\n\n4a) 1-Zi.-Wohnung, 40 m², frei ab 1. April.\n4b) 1-Zi.-Wohnung, 38 m², frei ab 1. Juni.",
      ),
    },
    items: [
      mcq("q1", en("1: You and your partner are looking for a two-room flat with a balcony."), adAB, "a"),
      mcq("q2", en("2: You can only pay 500 euros a month, together with the Nebenkosten."), adAB, "b", {
        explanation: en("2a: 490 + 90 = 580 €. 2b: 390 + 70 = 460 €."),
      }),
      mcq("q3", en("3: You work at home and need a quiet flat."), adAB, "b"),
      mcq("q4", en("4: You want to move in April."), adAB, "a"),
    ],
    refs: [KAP9, GOETHE_LESEN],
  },
  {
    slug: "m9-hausordnung-lesen",
    skill: "reading",
    title: { de: "Im Treppenhaus", en: "Notices in the building" },
    instructions: en(
      "Read the notices in the stairwell (der Mieter = tenant, die Hausverwaltung = building management). Are the sentences true (richtig) or false (falsch)?",
    ),
    stimulus: {
      textKind: "sign",
      text: de(
        "1) An alle Mieter: Der Aufzug ist von Montag bis Mittwoch kaputt. Bitte nehmen Sie die Treppe. Danke! Ihre Hausverwaltung\n\n2) Liebe Nachbarn, am Samstag ab 20 Uhr machen wir eine Party. Vielleicht ist es ein bisschen laut. Entschuldigung! Kommen Sie doch auch! Tim und Lara, Wohnung 7\n\n3) Fahrräder dürfen nicht im Flur stehen! Bitte bringen Sie Ihr Fahrrad in den Keller.\n\n4) Wohnung frei! Im Erdgeschoss ist ab Mai eine 3-Zimmer-Wohnung frei. Fragen Sie Herrn Brandt, Wohnung 1.",
      ),
    },
    items: [
      tf("q1", "Am Dienstag kann man den Aufzug nehmen.", false, { explanation: en("The lift is broken from Monday to Wednesday.") }),
      tf("q2", "Die Party ist am Samstagabend.", true),
      tf("q3", "Tim und Lara wohnen in Wohnung 7.", true),
      tf("q4", "Die Fahrräder sollen im Keller stehen.", true),
      tf("q5", "Die freie Wohnung ist im dritten Stock.", false),
    ],
    refs: [KAP9, GOETHE_LESEN],
  },
  {
    slug: "m9-meine-wohnung-sprechen",
    skill: "speaking",
    title: { de: "Meine Wohnung", en: "Talk about your home" },
    instructions: en("Say your answer out loud. Then compare it with the model answer and rate yourself."),
    items: [
      speak("q1", "Say how many rooms your flat has and what it is like.", "Meine Wohnung hat drei Zimmer. Sie ist klein, aber hell und gemütlich."),
      speak("q2", "Say where the sofa and the lamp are in your living room.", "Das Sofa steht an der Wand. Die Lampe steht neben dem Sofa."),
      speak("q3", "Say what you like and what you don't like about your flat.", "Das Wohnzimmer ist schön und hell. Aber die Küche ist zu klein, und die Straße ist sehr laut."),
    ],
    refs: [KAP9, GOETHE_SPRECHEN],
  },
];

// --- Lesson 5: Wiederholung Module 7–9 -------------------------------------------------------

const L5 = [
  {
    slug: "m9-wdh-grammatik",
    skill: "grammar",
    title: { de: "Wiederholung: Grammatik", en: "Review: grammar" },
    instructions: en("Choose the right answer or write the missing word."),
    items: [
      mcq("q1", de("Kommst du am Montag … am Dienstag?"), [opt("a", "oder"), opt("b", "aber"), opt("c", "und")], "a"),
      mcq("q2", de("Die Küche ist sehr klein, … sie ist schön hell."), [opt("a", "oder"), opt("b", "aber")], "b"),
      gap("q3", "Ich fahre mit", "Bus ins Büro.", ["dem"]),
      gap("q4", "Ich spreche mit", "Kollegin.", ["der"]),
      mcq("q5", de("Herr Kaya, … bitte morgen um neun Uhr!"), [opt("a", "komm"), opt("b", "kommt"), opt("c", "kommen Sie")], "c"),
      mcq("q6", de("Lena, … viel Wasser!"), [opt("a", "trink"), opt("b", "trinkt"), opt("c", "trinken Sie")], "a"),
      gap("q7", "Der Arzt sagt, ich", "viel schlafen. (sollen)", ["soll"]),
      gap("q8", "Hier", "man nicht rauchen. (dürfen)", ["darf"]),
      mcq("q9", de("Wohin gehst du? – … Bad."), [opt("a", "Ins"), opt("b", "Im"), opt("c", "In der")], "a"),
      mcq("q10", de("Wo ist der Drucker? – Er steht … Büro."), [opt("a", "ins"), opt("b", "im"), opt("c", "in die")], "b"),
    ],
    refs: [P3],
  },
  {
    slug: "m9-wdh-wortschatz",
    skill: "vocabulary",
    title: { de: "Wiederholung: Wortschatz", en: "Review: vocabulary" },
    instructions: en("Match the words with their meanings. Then choose the right answer."),
    items: [
      pairs("q1", [
        [de("der Schreibtisch"), en("desk")],
        [de("der Drucker"), en("printer")],
        [de("der Kopf"), en("head")],
        [de("der Bauch"), en("stomach")],
        [de("das Bett"), en("bed")],
        [de("die Küche"), en("kitchen")],
      ]),
      mcq("q2", en("Your head hurts. What do you say?"), [opt("a", "Ich habe Kopfschmerzen."), opt("b", "Ich habe Bauchschmerzen."), opt("c", "Ich habe Halsschmerzen.")], "a"),
      mcq("q3", en("Where do you usually cook?"), [opt("a", "im Schlafzimmer"), opt("b", "in der Küche"), opt("c", "im Büro")], "b"),
      mcq("q4", en("Your friend is ill. What do you say?"), [opt("a", "Guten Appetit!"), opt("b", "Mahlzeit!"), opt("c", "Gute Besserung!")], "c"),
    ],
    refs: [P3],
  },
  {
    slug: "m9-wdh-lesen",
    skill: "reading",
    title: { de: "Eine E-Mail von Sara", en: "An e-mail from Sara" },
    instructions: en("Read the e-mail. Are the sentences true (richtig) or false (falsch)?"),
    stimulus: {
      textKind: "email",
      text: de(
        "Liebe Nina,\n\nwie geht es dir? Ich habe jetzt eine neue Wohnung! Sie hat zwei Zimmer, eine Küche und ein Bad. Das Wohnzimmer ist hell, aber das Schlafzimmer ist ein bisschen dunkel. Mein Schreibtisch steht im Wohnzimmer, am Fenster. Montags und freitags arbeite ich zu Hause.\n\nLeider bin ich diese Woche krank. Ich habe Fieber und Halsschmerzen. Der Arzt sagt, ich soll viel trinken und im Bett bleiben. Ich darf nicht ins Büro gehen.\n\nKommst du am Samstag zum Kaffee? Oder am Sonntag?\n\nViele Grüße\nSara",
      ),
    },
    items: [
      tf("q1", "Saras Wohnung hat zwei Zimmer.", true),
      tf("q2", "Das Schlafzimmer ist sehr hell.", false),
      tf("q3", "Der Schreibtisch steht im Schlafzimmer.", false),
      tf("q4", "Sara arbeitet am Montag zu Hause.", true),
      tf("q5", "Sara soll ins Büro gehen.", false),
      tf("q6", "Sara hat Kopfschmerzen.", false, { explanation: en("She has a fever and a sore throat (Halsschmerzen).") }),
    ],
    refs: [P3, GOETHE_LESEN],
  },
  {
    slug: "m9-wdh-hoeren",
    skill: "listening",
    title: { de: "Herr Wolf ist krank", en: "Listening: Mr Wolf is ill" },
    instructions: en("Listen to the phone call. You can play it twice. Then answer the questions."),
    stimulus: {
      textKind: "dialogue",
      audio: {
        lines: [
          { speaker: "Herr Wolf", text: "Guten Morgen, Frau Roth. Hier ist Paul Wolf. Ich bin leider krank und kann heute nicht ins Büro kommen.", voice: "male", rate: "normal" },
          { speaker: "Frau Roth", text: "Oh, gute Besserung, Herr Wolf! Was haben Sie denn?", voice: "female", rate: "normal" },
          { speaker: "Herr Wolf", text: "Ich habe Rückenschmerzen. Ich muss um zehn Uhr zum Arzt.", voice: "male", rate: "normal" },
          { speaker: "Frau Roth", text: "Kein Problem. Brauchen Sie etwas aus dem Büro?", voice: "female", rate: "normal" },
          { speaker: "Herr Wolf", text: "Ja, bitte. Der Brief für Herrn Kaya liegt auf dem Schreibtisch, neben dem Drucker. Bringen Sie den Brief bitte zu Herrn Kaya.", voice: "male", rate: "normal" },
          { speaker: "Frau Roth", text: "Mache ich. Bleiben Sie im Bett und trinken Sie viel Tee!", voice: "female", rate: "normal" },
        ],
      },
      maxPlays: 2,
      transcriptPolicy: "after_submit",
    },
    items: [
      mcq("q1", en("What is wrong with Mr Wolf?"), [opt("a", "Er hat Fieber."), opt("b", "Er hat Rückenschmerzen."), opt("c", "Er hat Kopfschmerzen.")], "b"),
      mcq("q2", en("When does he go to the doctor?"), [opt("a", "um neun Uhr"), opt("b", "um zwölf Uhr"), opt("c", "um zehn Uhr")], "c"),
      mcq("q3", en("Where is the letter?"), [opt("a", "auf dem Schreibtisch"), opt("b", "unter dem Schreibtisch"), opt("c", "im Drucker")], "a"),
      tf("q4", "Frau Roth sagt: „Bleiben Sie im Bett!“", true),
    ],
    refs: [P3, GOETHE_HOEREN],
  },
];

// --- Lesson 6: Modultest -----------------------------------------------------------------

const L6 = [
  {
    slug: "m9-test-hoeren",
    skill: "listening",
    title: { de: "Test: Hören", en: "Test: listening" },
    instructions: en("Listen to each recording. You can play each one twice. Choose the right answer or write it."),
    itemAudioMaxPlays: 2,
    passThreshold: 0.7,
    items: [
      mcq("q1", en("How big is the flat?"), [opt("a", "48 m²"), opt("b", "58 m²"), opt("c", "85 m²")], "b", {
        audio: { text: "Die Wohnung hat zwei Zimmer und achtundfünfzig Quadratmeter.", voice: "female", rate: "normal" },
      }),
      mcq("q2", en("How much is the rent without the Nebenkosten?"), [opt("a", "690 €"), opt("b", "120 €"), opt("c", "810 €")], "a", {
        audio: { text: "Die Miete ist sechshundertneunzig Euro, plus hundertzwanzig Euro Nebenkosten.", voice: "male", rate: "normal" },
      }),
      mcq("q3", en("Where is the lamp?"), [opt("a", "über dem Bett"), opt("b", "neben dem Bett"), opt("c", "unter dem Bett")], "b", {
        audio: { text: "Die Lampe steht neben dem Bett.", voice: "female2", rate: "normal" },
      }),
      mcq("q4", en("Where is Tim going?"), [opt("a", "in die Küche"), opt("b", "in den Garten"), opt("c", "in den Keller")], "c", {
        audio: { text: "Ich bin Tim. Ich gehe jetzt in den Keller. Bis gleich!", voice: "male2", rate: "normal" },
      }),
      mcq(
        "q5",
        en("What doesn't she like about the flat?"),
        [optEn("a", "The street is noisy."), optEn("b", "The flat is dark."), optEn("c", "The kitchen is small.")],
        "a",
        { audio: { text: "Die Wohnung ist schön und hell, und die Küche ist groß. Aber die Straße ist sehr laut.", voice: "female", rate: "normal" } },
      ),
      typed("q6", ["grün"], {
        prompt: en("What colour is the sofa? Write the colour in German."),
        audio: { text: "Unser Sofa ist grün.", voice: "male", rate: "normal" },
      }),
    ],
    refs: [KAP9, GOETHE_HOEREN],
  },
  {
    slug: "m9-test-lesen",
    skill: "reading",
    title: { de: "Test: Lesen", en: "Test: reading" },
    instructions: en("Read the two ads. Which flat fits: A or B?"),
    passThreshold: 0.7,
    stimulus: {
      textKind: "ad",
      text: de(
        "Wohnung A\nHelle 3-Zimmer-Wohnung, 75 m², Erdgeschoss, mit Garten. Große Küche, Bad mit Fenster. Ruhige Straße, 20 Minuten bis zum Zentrum. Miete: 890 € + 180 € Nebenkosten. Frei ab 1. Juli. Kontakt: Frau Lindner, Tel. 0341 55 20 81\n\nWohnung B\nModerne 2-Zimmer-Wohnung im Zentrum, 52 m², 4. Stock mit Aufzug, Balkon. Kleine Küche. Miete: 780 € + 140 € Nebenkosten. Frei ab sofort. Kontakt: wohnen.leipzig@beispiel.de",
      ),
    },
    items: [
      mcq("q1", en("Which flat has a garden?"), flatAB, "a"),
      mcq("q2", en("You want to move in now."), flatAB, "b"),
      mcq("q3", en("Which flat is cheaper (rent + Nebenkosten)?"), flatAB, "b", { explanation: en("A: 1070 €, B: 920 €.") }),
      mcq("q4", en("Which flat has more rooms?"), flatAB, "a"),
      mcq("q5", en("You like cooking and need a big kitchen."), flatAB, "a"),
      mcq("q6", en("You want to write an e-mail about the flat."), flatAB, "b"),
    ],
    refs: [KAP9, GOETHE_LESEN],
  },
  {
    slug: "m9-test-formular",
    skill: "writing",
    title: { de: "Test: Ein Formular ausfüllen", en: "Test: fill in a form" },
    instructions: en("Daniel is looking for a flat. Read about him. Fill in the search form for him."),
    passThreshold: 0.7,
    stimulus: {
      textKind: "form",
      text: de(
        "Das ist Daniel Ortiz. Er sucht eine Wohnung in Bremen. Er möchte zwei Zimmer und einen Balkon. Die Miete darf nicht mehr als 700 Euro sein. Seine E-Mail-Adresse ist d.ortiz@beispiel.de.",
      ),
    },
    items: [
      typed("q1", ["Ortiz"], { label: "Familienname" }),
      typed("q2", ["Bremen"], { label: "Stadt" }),
      typed("q3", ["2", "zwei"], { label: "Zimmer" }),
      typed("q4", ["700 €", "700", "700 Euro", "700 EUR", "700,00 €", "700,00 Euro", "700,- €"], { label: "Miete (maximal)", ignoreSpaces: true }),
      typed("q5", ["ja"], { label: "Balkon (ja / nein)" }),
      typed("q6", ["d.ortiz@beispiel.de"], { label: "E-Mail", inputMode: "email", ignoreSpaces: true }),
    ],
    refs: [KAP9, GOETHE_SCHREIBEN],
  },
  {
    slug: "m9-test-grammatik",
    skill: "grammar",
    title: { de: "Test: Grammatik", en: "Test: grammar" },
    instructions: en("Answer all questions."),
    passThreshold: 0.7,
    items: [
      gap("q1", "Ich gehe", "Küche.", ["in die"]),
      gap("q2", "Das Bild hängt an", "Wand.", ["der"]),
      gap("q3", "Der Teppich liegt vor", "Sofa.", ["dem"]),
      mcq("q4", de("Das Regal … neben dem Schrank."), position, "a"),
      mcq("q5", de("Wie ist das Schlafzimmer? – … ist klein."), erSieEs, "c"),
      gap("q6", "Die Zimmer", "sehr hell. (sein)", ["sind"]),
      order("q7", ["Das", "Sofa", "steht", "im", "Wohnzimmer", "."], { alternatives: ["Im Wohnzimmer steht das Sofa."] }),
      mcq("q8", de("Wohin gehst du? – … Bad."), [opt("a", "Im"), opt("b", "Ins")], "b"),
    ],
    refs: [KAP9, GA34, GA35],
  },
  {
    slug: "m9-test-wortschatz",
    skill: "vocabulary",
    title: { de: "Test: Wortschatz", en: "Test: vocabulary" },
    instructions: en("Answer all questions."),
    passThreshold: 0.7,
    items: [
      mcq("q1", en("Where do you cook?"), [opt("a", "in der Küche"), opt("b", "im Bad"), opt("c", "im Keller")], "a"),
      mcq("q2", de("die Miete"), [optEn("a", "rent"), optEn("b", "flat"), optEn("c", "neighbour")], "a"),
      typed("q3", ["das Bett"], { prompt: en("Write the German word for “bed” with its article.") }),
      mcq("q4", de("hell ↔ …"), [opt("a", "dunkel"), opt("b", "ruhig"), opt("c", "modern")], "a"),
      mcq("q5", de("laut ↔ …"), [opt("a", "gemütlich"), opt("b", "ruhig"), opt("c", "hell")], "b"),
      pairs("q6", [
        [de("der Schrank"), en("wardrobe")],
        [de("das Regal"), en("shelf")],
        [de("der Sessel"), en("armchair")],
        [de("der Teppich"), en("rug")],
      ]),
      mcq("q7", en("In a flat ad, what does m² mean?"), [opt("a", "Quadratmeter"), opt("b", "Miete"), opt("c", "Nebenkosten")], "a"),
    ],
    refs: [KAP9],
  },
  {
    slug: "m9-test-sprechen",
    skill: "speaking",
    title: { de: "Test: Sprechen – meine Wohnung", en: "Test: speaking – my home" },
    instructions: en("Practise speaking about your home. Speak for yourself; the model answer is only an example. This practice is not scored."),
    items: [
      speak(
        "q1",
        "Talk about your flat or room using the keywords.",
        "Ich wohne in einer Wohnung in Köln. Sie hat zwei Zimmer, eine Küche und ein Bad. Das Wohnzimmer ist groß und hell. Die Küche ist leider klein.",
        { cue: de("Wo? – Zimmer? – Wie?") },
      ),
      speak("q2", "Your friend asks: „Wo steht dein Sofa?“ Answer.", "Mein Sofa steht im Wohnzimmer, neben dem Fenster."),
      speak("q3", "Ask a question with the keyword card.", "Hat deine Wohnung einen Balkon?", { cue: de("Thema: Wohnung – Balkon?") }),
    ],
    refs: [KAP9, GOETHE_SPRECHEN],
  },
];

export const EXERCISES_BY_LESSON = { L1, L2, L3, L4, L5, L6 };
export const EXERCISES = [...L1, ...L2, ...L3, ...L4, ...L5, ...L6];
