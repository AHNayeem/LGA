// Module 11 exercises. All texts, dialogues, announcements, signs and questions are
// original. Task *formats* follow the Goethe A1 structure documented in
// docs/REFERENCE-ANALYSIS.md (Hören Teil 2: announcements heard once, richtig/falsch;
// Lesen Teil 3: signs, richtig/falsch; form filling); no exam content is reproduced.
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
const announce = (text, voice = "female") => ({ text, voice, rate: "normal" });

const GOETHE_HOEREN = { ref: "goethe-start-deutsch-1-hoeren", note: "Task format only" };
const GOETHE_LESEN = { ref: "goethe-start-deutsch-1-lesen", note: "Task format only" };
const GOETHE_SCHREIBEN = { ref: "goethe-start-deutsch-1-schreiben", note: "Task format only" };
const GOETHE_SPRECHEN = { ref: "goethe-start-deutsch-1-sprechen", note: "Task format only" };
const KAP11 = { ref: "netzwerk-neu-a1-11", note: "Topic alignment only" };
const GA20 = { ref: "grammatik-aktiv-20", note: "Topic alignment only" };
const GA21 = { ref: "grammatik-aktiv-21", note: "Topic alignment only" };

// --- Lesson 1: Was trägst du? --------------------------------------------------------------

const L1 = [
  {
    slug: "m11-kleidung-zuordnen",
    skill: "vocabulary",
    title: { de: "Kleidung", en: "Clothes" },
    instructions: en("Match the clothes with their English meaning. Then answer the questions."),
    items: [
      pairs("q1", [
        [de("die Hose"), en("trousers")],
        [de("das Hemd"), en("shirt")],
        [de("die Bluse"), en("blouse")],
        [de("der Rock"), en("skirt")],
        [de("das Kleid"), en("dress")],
        [de("der Mantel"), en("coat")],
      ]),
      pairs("q2", [
        [de("der Schuh"), en("shoe")],
        [de("die Socke"), en("sock")],
        [de("die Mütze"), en("woolly hat")],
        [de("der Schal"), en("scarf")],
        [de("der Pullover"), en("jumper")],
        [de("die Jacke"), en("jacket")],
      ]),
      mcq("q3", en("What do you wear on your feet?"), [opt("a", "Schuhe und Socken"), opt("b", "eine Mütze und einen Schal"), opt("c", "ein Hemd und eine Bluse")], "a"),
      mcq("q4", en("It is very cold. What do you wear on your head?"), [opt("a", "einen Rock"), opt("b", "eine Mütze"), opt("c", "eine Socke")], "b"),
    ],
    refs: [KAP11],
  },
  {
    slug: "m11-welcher-dieser-ueben",
    skill: "grammar",
    title: { de: "Welche Jacke? – Diese hier.", en: "Which jacket? – This one." },
    instructions: en("Write or choose the correct form of welcher or dieser."),
    items: [
      gap("q1", "", "Jacke kaufst du? – Diese hier. (welcher)", ["Welche"]),
      gap("q2", "", "Mantel ist neu? – Dieser hier. (welcher)", ["Welcher"]),
      gap("q3", "", "Kleid trägst du heute? – Dieses hier. (welcher)", ["Welches"]),
      gap("q4", "", "Schuhe nimmst du? – Diese. (welcher)", ["Welche"], { explanation: en("Plural: welche, like die Schuhe.") }),
      gap("q5", "Ich nehme", "Rock hier. (dieser)", ["diesen"], { explanation: en("nehmen + accusative: den Rock → diesen Rock.") }),
      gap("q6", "", "Hemd ist schick. (dieser)", ["Dieses"]),
      mcq("q7", de("… Pullover möchtest du? – Diesen hier."), [opt("a", "Welcher"), opt("b", "Welchen"), opt("c", "Welches")], "b", {
        explanation: en("Der Pullover is the object (accusative): welchen Pullover."),
      }),
      mcq("q8", de("Welche Hose trägst du? – … hier."), [opt("a", "Dieser"), opt("b", "Diese"), opt("c", "Dieses")], "b"),
    ],
    refs: [KAP11, GA20],
  },
  {
    slug: "m11-party-hoeren",
    skill: "listening",
    title: { de: "Was trägst du heute Abend?", en: "Listening: what to wear tonight" },
    instructions: en("Listen to the conversation. You can play it twice. Then answer the questions."),
    stimulus: {
      textKind: "dialogue",
      audio: {
        lines: [
          { speaker: "Nele", text: "Ben, heute Abend ist die Party bei Tom. Was trägst du?", voice: "female", rate: "normal" },
          { speaker: "Ben", text: "Eine Jeans und ein Hemd. Und du?", voice: "male", rate: "normal" },
          { speaker: "Nele", text: "Ich weiß es noch nicht. Ich habe zwei Kleider. Dieses Kleid ist rot, und dieses hier ist grün.", voice: "female", rate: "normal" },
          { speaker: "Ben", text: "Welches Kleid ist neu?", voice: "male", rate: "normal" },
          { speaker: "Nele", text: "Das Kleid in Grün.", voice: "female", rate: "normal" },
          { speaker: "Ben", text: "Dann trag doch das Kleid in Grün! Und welche Schuhe trägst du?", voice: "male", rate: "normal" },
          { speaker: "Nele", text: "Diese hier. Sie sind schwarz. Und ich nehme eine Jacke mit, es ist kalt.", voice: "female", rate: "normal" },
          { speaker: "Ben", text: "Gute Idee. Ich trage auch einen Pullover.", voice: "male", rate: "normal" },
        ],
      },
      maxPlays: 2,
      transcriptPolicy: "after_submit",
    },
    items: [
      mcq("q1", en("What does Ben wear?"), [opt("a", "eine Jeans und ein Hemd"), opt("b", "eine Jeans und ein T-Shirt"), opt("c", "eine Hose und einen Mantel")], "a"),
      mcq("q2", en("Which dress is new?"), [opt("a", "das Kleid in Rot"), opt("b", "das Kleid in Grün"), opt("c", "das Kleid in Schwarz")], "b"),
      tf("q3", "Neles Schuhe sind schwarz.", true),
      tf("q4", "Nele nimmt einen Mantel mit.", false, { explanation: en("She says „Ich nehme eine Jacke mit“.") }),
    ],
    refs: [KAP11, GOETHE_HOEREN],
  },
];

// --- Lesson 2: Die Jacke gefällt mir! ------------------------------------------------------

const L2 = [
  {
    slug: "m11-dativpronomen-ueben",
    skill: "grammar",
    title: { de: "mir, dir, ihm …", en: "mir, dir, ihm …" },
    instructions: en("Write the pronoun in the dative. The pronoun in brackets tells you the person."),
    items: [
      gap("q1", "Das Kleid gefällt", "sehr gut. (ich)", ["mir"]),
      gap("q2", "Gefällt", "der Rock, Anna? (du)", ["dir"]),
      gap("q3", "Die Schuhe passen", "nicht. (er)", ["ihm"]),
      gap("q4", "Ist das Lisas Mütze? – Ja, sie gehört", ". (sie)", ["ihr"]),
      gap("q5", "Frau Keller, gefällt", "die Bluse? (Sie)", ["Ihnen"], { explanation: en("Formal Sie → Ihnen, with a capital I.") }),
      gap("q6", "Kinder, passen", "die Jacken? (ihr)", ["euch"]),
      gap("q7", "Die Pullover gefallen", "nicht. (wir)", ["uns"]),
      gap("q8", "Paul und Eva kaufen die Schuhe. Die Schuhe gefallen", ". (sie)", ["ihnen"]),
    ],
    refs: [KAP11, GA21],
  },
  {
    slug: "m11-gefaellt-mir-saetze",
    skill: "grammar",
    title: { de: "Sätze bauen", en: "Build the sentence" },
    instructions: en("Put the words in the right order."),
    items: [
      order("q1", ["Die", "Jacke", "gefällt", "mir", "."], { alternatives: ["Mir gefällt die Jacke."] }),
      order("q2", ["Passt", "dir", "die", "Hose", "?"], { alternatives: ["Passt die Hose dir?"] }),
      order("q3", ["Das", "Kleid", "steht", "Ihnen", "gut", "."], { alternatives: ["Ihnen steht das Kleid gut."] }),
      order("q4", ["Gehört", "dir", "die", "Mütze", "?"], { alternatives: ["Gehört die Mütze dir?"] }),
    ],
    refs: [KAP11, GA21],
  },
  {
    slug: "m11-nachricht-lesen",
    skill: "reading",
    title: { de: "Eine Nachricht von Lisa", en: "A message from Lisa" },
    instructions: en("Read the message. Are the sentences true (richtig) or false (falsch)?"),
    stimulus: {
      textKind: "message",
      text: de(
        "Hallo Sara,\nich bin gerade im Kaufhaus Brandner. Hier gibt es viele Jacken und Mäntel. Eine Jacke in Blau gefällt mir sehr. Sie ist schick und passt mir gut. Aber sie kostet 120 Euro – das ist zu teuer für mich. Ein Mantel ist billig, aber er ist ein bisschen altmodisch.\nDein Bruder Tom braucht doch einen Pullover, oder? Die Pullover hier sind toll. Sie gefallen ihm bestimmt!\nBis später\nLisa",
      ),
    },
    items: [
      tf("q1", "Lisa ist im Kaufhaus.", true),
      tf("q2", "Die Jacke in Blau passt Lisa nicht.", false),
      tf("q3", "Die Jacke kostet 120 Euro.", true),
      tf("q4", "Lisa findet den Mantel ein bisschen altmodisch.", true),
      tf("q5", "Tom braucht einen Mantel.", false, { explanation: en("Tom needs a jumper: „Dein Bruder Tom braucht doch einen Pullover“.") }),
    ],
    refs: [KAP11, GOETHE_LESEN],
  },
  {
    slug: "m11-meinung-sprechen",
    skill: "speaking",
    title: { de: "Das steht dir gut!", en: "That suits you!" },
    instructions: en("Say your answer out loud. Then compare it with the model answer and rate yourself."),
    items: [
      speak("q1", "Your friend tries on a jacket. Say that it suits her and that you like it.", "Die Jacke steht dir gut! Sie gefällt mir."),
      speak("q2", "Say that the trousers don't fit you because they are too tight.", "Die Hose passt mir nicht. Sie ist zu eng."),
      speak("q3", "Ask your friend if he likes the shoes.", "Gefallen dir die Schuhe?"),
    ],
    refs: [KAP11, GOETHE_SPRECHEN],
  },
];

// --- Lesson 3: Im Geschäft -----------------------------------------------------------------

const L3 = [
  {
    slug: "m11-verben-dativ-ueben",
    skill: "grammar",
    title: { de: "gefallen, passen, stehen, gehören, helfen", en: "Verbs with the dative" },
    instructions: en("Write the correct form of the verb in brackets."),
    items: [
      gap("q1", "Die Schuhe", "mir gut. (passen)", ["passen"], { explanation: en("Die Schuhe is plural, so the verb is plural: passen.") }),
      gap("q2", "Der Pullover", "dir sehr gut! (stehen)", ["steht"]),
      gap("q3", "Kann ich Ihnen", "? (helfen)", ["helfen"]),
      gap("q4", "Gehört das T-Shirt dir? – Nein, es", "Jonas. (gehören)", ["gehört"]),
      gap("q5", "Wie", "dir die Bluse? (gefallen)", ["gefällt"], { explanation: en("gefallen changes its vowel: es gefällt.") }),
      gap("q6", "Die Socken", "mir nicht. (gefallen)", ["gefallen"]),
      gap("q7", "Die Verkäuferin", "mir. (helfen)", ["hilft"], { explanation: en("helfen changes e → i: du hilfst, sie hilft.") }),
      mcq("q8", de("Der Rock ist zu klein. Er … mir nicht."), [opt("a", "passt"), opt("b", "hilft"), opt("c", "gehört")], "a"),
    ],
    refs: [KAP11, GA21],
  },
  {
    slug: "m11-im-geschaeft-woerter",
    skill: "vocabulary",
    title: { de: "Im Geschäft", en: "In the shop" },
    instructions: en("Choose the right answer. Then match the words."),
    items: [
      mcq("q1", en("You want to try on a skirt. Where do you go?"), [opt("a", "in die Umkleidekabine"), opt("b", "an die Kasse"), opt("c", "in den Supermarkt")], "a"),
      mcq("q2", en("You want to pay. Where do you go?"), [opt("a", "in die Umkleidekabine"), opt("b", "an die Kasse"), opt("c", "nach Hause")], "b"),
      mcq("q3", en("The shop assistant asks: „Bar oder mit Karte?“ What do you answer?"), [opt("a", "Mit Karte, bitte."), opt("b", "Größe 38, bitte."), opt("c", "Das steht dir gut!")], "a"),
      mcq("q4", en("You bought jeans yesterday. They are too small. What do you say in the shop?"), [
        opt("a", "Ich möchte die Jeans umtauschen."),
        opt("b", "Die Jeans gefällt mir sehr."),
        opt("c", "Bar oder mit Karte?"),
      ], "a"),
      pairs("q5", [
        [de("anprobieren"), en("to try on")],
        [de("umtauschen"), en("to exchange")],
        [de("die Kasse"), en("checkout")],
        [de("der Kassenbon"), en("receipt")],
        [de("reduziert"), en("reduced in price")],
      ]),
    ],
    refs: [KAP11],
  },
  {
    slug: "m11-hose-kaufen-hoeren",
    skill: "listening",
    title: { de: "Eine Hose kaufen", en: "Listening: buying trousers" },
    instructions: en("Listen to the conversation in a clothes shop. You can play it twice. Then answer the questions."),
    stimulus: {
      textKind: "dialogue",
      audio: {
        lines: [
          { speaker: "Verkäuferin", text: "Guten Tag! Kann ich Ihnen helfen?", voice: "female", rate: "normal" },
          { speaker: "Kunde", text: "Ja, bitte. Ich suche eine Hose. Diese hier gefällt mir. Haben Sie die auch in Größe 50?", voice: "male", rate: "normal" },
          { speaker: "Verkäuferin", text: "Einen Moment … Ja, hier ist Größe 50. Möchten Sie die Hose anprobieren?", voice: "female", rate: "normal" },
          { speaker: "Kunde", text: "Ja, gern. Wo ist die Umkleidekabine?", voice: "male", rate: "normal" },
          { speaker: "Verkäuferin", text: "Dort hinten links.", voice: "female", rate: "normal" },
          { speaker: "Kunde", text: "Die Hose passt mir gut. Aber die Farbe gefällt mir nicht so. Haben Sie die Hose auch in Blau?", voice: "male", rate: "normal" },
          { speaker: "Verkäuferin", text: "Ja, in Blau haben wir sie auch. Blau steht Ihnen sicher gut.", voice: "female", rate: "normal" },
          { speaker: "Kunde", text: "Gut, dann nehme ich die Hose in Blau. Was kostet sie?", voice: "male", rate: "normal" },
          { speaker: "Verkäuferin", text: "Sie ist reduziert. Sie kostet jetzt 39 Euro. Zahlen Sie bitte an der Kasse.", voice: "female", rate: "normal" },
          { speaker: "Kunde", text: "Kann ich mit Karte zahlen?", voice: "male", rate: "normal" },
          { speaker: "Verkäuferin", text: "Ja, natürlich.", voice: "female", rate: "normal" },
        ],
      },
      maxPlays: 2,
      transcriptPolicy: "after_submit",
    },
    items: [
      mcq("q1", en("What is the man looking for?"), [opt("a", "eine Hose"), opt("b", "eine Jacke"), opt("c", "ein Hemd")], "a"),
      mcq("q2", en("Which size does he need?"), [opt("a", "40"), opt("b", "48"), opt("c", "50")], "c"),
      mcq("q3", en("Where is the changing room?"), [opt("a", "dort hinten links"), opt("b", "dort hinten rechts"), opt("c", "an der Kasse")], "a"),
      mcq("q4", en("Which colour does he take?"), [opt("a", "Grau"), opt("b", "Blau"), opt("c", "Schwarz")], "b"),
      mcq("q5", en("How much are the trousers now?"), [opt("a", "19 Euro"), opt("b", "39 Euro"), opt("c", "93 Euro")], "b"),
      tf("q6", "Der Mann zahlt bar.", false, { explanation: en("He asks „Kann ich mit Karte zahlen?“ – he pays by card.") }),
    ],
    refs: [KAP11, GOETHE_HOEREN],
  },
  {
    slug: "m11-umtausch-formular",
    skill: "writing",
    title: { de: "Ein Umtausch-Formular", en: "An exchange form" },
    instructions: en("Read about Ana Moreno. Fill in the exchange form for her."),
    stimulus: {
      textKind: "form",
      text: de(
        "Ana Moreno hat am Samstag im Kaufhaus Brandner einen Mantel gekauft. Der Mantel hat 89 Euro gekostet. Aber er ist zu groß: Der Mantel ist Größe 40, und Ana trägt Größe 36. Sie hat den Kassenbon noch. Sie möchte den Mantel umtauschen.",
      ),
    },
    items: [
      typed("q1", ["Moreno"], { label: "Familienname" }),
      typed("q2", ["Mantel", "der Mantel", "ein Mantel", "einen Mantel"], { label: "Artikel (Was?)" }),
      typed("q3", ["89", "89 Euro", "89 €", "89,00", "89,00 Euro", "89,00 €", "89 EUR", "89,- Euro", "€ 89"], { label: "Preis", ignoreSpaces: true }),
      typed("q4", ["40", "Größe 40"], { label: "Größe (jetzt)", ignoreSpaces: true }),
      typed("q5", ["36", "Größe 36"], { label: "Neue Größe", ignoreSpaces: true }),
      typed("q6", ["zu groß", "Der Mantel ist zu groß", "Er ist zu groß", "Mantel zu groß", "Der Mantel ist zu groß für sie", "Er ist zu groß für sie", "zu groß für sie"], {
        label: "Grund für den Umtausch",
      }),
    ],
    refs: [KAP11, GOETHE_SCHREIBEN],
  },
];

// --- Lesson 4: Im Kaufhaus ------------------------------------------------------------------

const L4 = [
  {
    slug: "m11-kaufhaus-woerter",
    skill: "vocabulary",
    title: { de: "Im Kaufhaus", en: "In the department store" },
    instructions: en("Match the words with their meaning. Then choose the right department or floor."),
    items: [
      pairs("q1", [
        [de("das Kaufhaus"), en("department store")],
        [de("die Abteilung"), en("department")],
        [de("die Rolltreppe"), en("escalator")],
        [de("der Aufzug"), en("lift, elevator")],
        [de("die Durchsage"), en("announcement")],
        [de("der Kundenservice"), en("customer service")],
      ]),
      mcq("q2", en("You need a jacket for your little son. Which department do you go to?"), [opt("a", "Kindermode"), opt("b", "Herrenmode"), opt("c", "Damenmode")], "a"),
      mcq("q3", en("You are looking for a shirt for your father. Which department do you go to?"), [opt("a", "Kindermode"), opt("b", "Herrenmode"), opt("c", "Damenmode")], "b"),
      mcq("q4", en("On a store sign, what does „EG“ mean?"), [opt("a", "das Erdgeschoss"), opt("b", "das Untergeschoss"), opt("c", "der Aufzug")], "a"),
      mcq("q5", en("On a store sign, what does „UG“ mean?"), [opt("a", "das Erdgeschoss"), opt("b", "das Untergeschoss"), opt("c", "die Umkleidekabine")], "b"),
    ],
    refs: [KAP11],
  },
  {
    slug: "m11-wegweiser-lesen",
    skill: "reading",
    title: { de: "Der Wegweiser im Kaufhaus", en: "The store directory" },
    instructions: en("Read the store directory and the signs. Are the sentences true (richtig) or false (falsch)?"),
    stimulus: {
      textKind: "sign",
      text: de(
        "KAUFHAUS BRANDNER – Wegweiser\n\n3. Stock: Sport · Spielwaren · Café\n2. Stock: Herrenmode · Kindermode\n1. Stock: Damenmode · Umkleidekabinen\nEG: Schuhe · Taschen · Kundenservice\nUG: Lebensmittel\n\nÖffnungszeiten: Montag bis Samstag 9.30–20.00 Uhr\n\n—\n\nUmtausch nur mit Kassenbon!\nBitte kommen Sie zum Kundenservice (EG).",
      ),
    },
    items: [
      tf("q1", "Die Herrenmode ist im zweiten Stock.", true),
      tf("q2", "Die Umkleidekabinen sind im Erdgeschoss.", false, { explanation: en("They are in the 1. Stock, next to the womenswear.") }),
      tf("q3", "Das Kaufhaus ist am Sonntag geöffnet.", false),
      tf("q4", "Die Lebensmittel sind im Untergeschoss.", true),
      tf("q5", "Für einen Umtausch braucht der Kunde den Kassenbon.", true),
      tf("q6", "Das Café ist im Erdgeschoss.", false),
    ],
    refs: [KAP11, GOETHE_LESEN],
  },
  {
    slug: "m11-durchsagen-hoeren",
    skill: "listening",
    title: { de: "Durchsagen im Kaufhaus", en: "Listening: store announcements" },
    instructions: en("You hear each announcement only once, as in the exam. Is the sentence true (richtig) or false (falsch)?"),
    itemAudioMaxPlays: 1,
    items: [
      tf("q1", "Die Schuhe sind im ersten Stock.", false, {
        audio: announce("Liebe Kundinnen und Kunden, heute sind alle Schuhe im Erdgeschoss reduziert."),
      }),
      tf("q2", "Max wartet im Café.", false, {
        audio: announce("Achtung, eine Durchsage: Wir suchen die Mutter von Max. Max ist fünf Jahre alt und wartet beim Kundenservice im Erdgeschoss.", "male"),
      }),
      tf("q3", "Das Kaufhaus schließt in 15 Minuten.", true, {
        audio: announce("Liebe Kundinnen und Kunden, unser Kaufhaus schließt in fünfzehn Minuten. Bitte gehen Sie jetzt zur Kasse.", "female2"),
      }),
      tf("q4", "Der Aufzug funktioniert heute.", false, {
        audio: announce("Liebe Kundinnen und Kunden, der Aufzug ist heute leider kaputt. Bitte nehmen Sie die Rolltreppe.", "male2"),
      }),
      tf("q5", "Im dritten Stock gibt es Sportkleidung.", true, {
        audio: announce("Neu im dritten Stock: Sportkleidung für Damen, Herren und Kinder. Besuchen Sie auch unser Café!"),
      }),
    ],
    refs: [KAP11, GOETHE_HOEREN],
  },
  {
    slug: "m11-partizip-erkennen",
    skill: "grammar",
    title: { de: "Was haben sie gemacht?", en: "What did they do?" },
    instructions: en("Read the sentence. Which infinitive does the participle come from?"),
    items: [
      mcq("q1", de("Ich habe gestern im Kaufhaus eingekauft."), [opt("a", "einkaufen"), opt("b", "kaufen"), opt("c", "verkaufen")], "a"),
      mcq("q2", de("Hast du die Hose anprobiert?"), [opt("a", "probieren"), opt("b", "anprobieren"), opt("c", "anrufen")], "b"),
      mcq("q3", de("Wir haben mit Karte bezahlt."), [opt("a", "zahlen"), opt("b", "bezahlen"), opt("c", "besuchen")], "b", {
        explanation: en("be- verbs have no ge-: bezahlen → bezahlt. From zahlen it would be gezahlt."),
      }),
      mcq("q4", de("Lisa hat die Schuhe umgetauscht."), [opt("a", "umtauschen"), opt("b", "tauschen"), opt("c", "umziehen")], "a"),
      mcq("q5", de("Der Verkäufer hat mir geholfen."), [opt("a", "holen"), opt("b", "helfen"), opt("c", "halten")], "b"),
      mcq("q6", de("Die Jacke hat mir gut gefallen."), [opt("a", "fallen"), opt("b", "gefallen"), opt("c", "fehlen")], "b", {
        explanation: en("gefallen already starts with ge-, so the participle is the same as the infinitive."),
      }),
    ],
    refs: [KAP11],
  },
];

// --- Lesson 5: Modultest -------------------------------------------------------------------

const L5 = [
  {
    slug: "m11-test-hoeren",
    skill: "listening",
    title: { de: "Test: Hören", en: "Test: listening" },
    instructions: en("You hear each announcement only once, as in Goethe Hören Teil 2. Choose the right answer."),
    itemAudioMaxPlays: 1,
    passThreshold: 0.7,
    items: [
      tf("q1", "Die Pullover im zweiten Stock sind heute reduziert.", true, {
        audio: announce("Liebe Kundinnen und Kunden, im zweiten Stock sind heute alle Hemden und Pullover reduziert."),
      }),
      mcq("q2", en("Where should Ms Novak go?"), [opt("a", "ins Erdgeschoss"), opt("b", "in den ersten Stock"), opt("c", "ins Untergeschoss")], "a", {
        audio: announce("Achtung, bitte! Frau Novak, bitte kommen Sie zum Kundenservice im Erdgeschoss. Ihre Tasche ist hier.", "male"),
      }),
      mcq("q3", en("Until when is the store open today?"), [opt("a", "bis 20 Uhr"), opt("b", "bis 21 Uhr"), opt("c", "bis 22 Uhr")], "c", {
        audio: announce("Liebe Kundinnen und Kunden, heute ist unser Kaufhaus bis 22 Uhr geöffnet.", "female2"),
      }),
      tf("q4", "Die Umkleidekabinen im zweiten Stock sind geschlossen.", false, {
        audio: announce("Die Umkleidekabinen im ersten Stock sind heute geschlossen. Bitte gehen Sie in den zweiten Stock.", "male2"),
        explanation: en("The changing rooms on the first floor are closed; you should go to the second floor."),
      }),
      tf("q5", "Die Kindermode ist im dritten Stock.", true, {
        audio: announce("Neu in der Kindermode im dritten Stock: Jacken und Mützen für den Winter."),
      }),
    ],
    refs: [KAP11, GOETHE_HOEREN],
  },
  {
    slug: "m11-test-lesen",
    skill: "reading",
    title: { de: "Test: Lesen", en: "Test: reading" },
    instructions: en("Read the signs in the store. Are the sentences true (richtig) or false (falsch)?"),
    passThreshold: 0.7,
    stimulus: {
      textKind: "sign",
      text: de(
        "A  Modehaus Lindner\nEG: Schuhe · Taschen · Kasse\n1. Stock: Damenmode\n2. Stock: Herrenmode\n3. Stock: Kindermode · Spielwaren\n\nB  Alle Röcke und Kleider im 1. Stock: 30 % reduziert! Nur bis Samstag.\n\nC  Umkleidekabinen: maximal 3 Teile pro Person.\n\nD  Aufzug außer Betrieb. Bitte benutzen Sie die Rolltreppe.\n\nE  Kundenservice (EG): Umtausch nur mit Kassenbon. Montag bis Freitag 10–19 Uhr.",
      ),
    },
    items: [
      tf("q1", "Die Kasse ist im Erdgeschoss.", true),
      tf("q2", "Die Kleider sind bis Samstag reduziert.", true),
      tf("q3", "In der Umkleidekabine darf eine Person fünf Teile anprobieren.", false),
      tf("q4", "Der Aufzug funktioniert nicht.", true),
      tf("q5", "Der Kundenservice ist am Samstag geöffnet.", false),
      tf("q6", "Die Herrenmode ist im ersten Stock.", false),
    ],
    refs: [KAP11, GOETHE_LESEN],
  },
  {
    slug: "m11-test-formular",
    skill: "writing",
    title: { de: "Test: Eine Kundenkarte beantragen", en: "Test: apply for a store card" },
    instructions: en("Read about Emil. Fill in the store card form for him."),
    passThreshold: 0.7,
    stimulus: {
      textKind: "form",
      text: de(
        "Das ist Emil Hartmann. Er wohnt in Kassel. Er möchte eine Kundenkarte vom Modehaus Lindner. Emil trägt Größe L, und seine Schuhgröße ist 44. Er zahlt immer mit Karte. Seine E-Mail-Adresse ist emil.hartmann@beispiel.de.",
      ),
    },
    items: [
      typed("q1", ["Hartmann"], { label: "Familienname" }),
      typed("q2", ["Kassel"], { label: "Wohnort" }),
      typed("q3", ["L", "Größe L"], { label: "Kleidergröße", ignoreSpaces: true }),
      typed("q4", ["44", "Größe 44"], { label: "Schuhgröße", ignoreSpaces: true }),
      typed("q5", ["mit Karte", "Karte", "Kartenzahlung", "mit Kreditkarte", "Kreditkarte", "mit EC-Karte", "EC-Karte"], { label: "Zahlung: bar oder mit Karte?" }),
      typed("q6", ["emil.hartmann@beispiel.de"], { label: "E-Mail", inputMode: "email", ignoreSpaces: true }),
    ],
    refs: [KAP11, GOETHE_SCHREIBEN],
  },
  {
    slug: "m11-test-grammatik",
    skill: "grammar",
    title: { de: "Test: Grammatik", en: "Test: grammar" },
    instructions: en("Answer all questions."),
    passThreshold: 0.7,
    items: [
      gap("q1", "", "Rock möchtest du? – Diesen hier. (welcher)", ["Welchen"]),
      mcq("q2", de("… Bluse gefällt dir? – Diese hier."), [opt("a", "Welcher"), opt("b", "Welche"), opt("c", "Welches")], "b"),
      gap("q3", "Die Schuhe passen", "nicht. (ich)", ["mir"]),
      gap("q4", "Frau Lang, kann ich", "helfen? (Sie)", ["Ihnen"]),
      gap("q5", "Die Mäntel", "uns gut. (gefallen)", ["gefallen"]),
      gap("q6", "Die Jacke", "Ben. (gehören)", ["gehört"]),
      order("q7", ["Das", "Hemd", "steht", "dir", "gut", "."], { alternatives: ["Dir steht das Hemd gut."] }),
      mcq("q8", en("Which verb does „umgetauscht“ come from?"), [opt("a", "umtauschen"), opt("b", "tauschen"), opt("c", "umziehen")], "a"),
    ],
    refs: [KAP11, GA20, GA21],
  },
  {
    slug: "m11-test-wortschatz",
    skill: "vocabulary",
    title: { de: "Test: Wortschatz", en: "Test: vocabulary" },
    instructions: en("Answer all questions."),
    passThreshold: 0.7,
    items: [
      mcq("q1", en("Where do you try on clothes?"), [opt("a", "in der Umkleidekabine"), opt("b", "an der Kasse"), opt("c", "auf der Rolltreppe")], "a"),
      mcq("q2", en("What does „EG“ mean on a store sign?"), [opt("a", "das Erdgeschoss"), opt("b", "das Untergeschoss"), opt("c", "der Kundenservice")], "a"),
      typed("q3", ["der Mantel"], { prompt: en("Write the German word with its article: coat") }),
      mcq("q4", en("The shop assistant asks: „Kann ich Ihnen helfen?“ What do you answer?"), [
        opt("a", "Ja, ich suche eine Jacke."),
        opt("b", "Mit Karte, bitte."),
        opt("c", "Das steht dir gut!"),
      ], "a"),
      pairs("q5", [
        [de("die Hose"), en("trousers")],
        [de("das Kleid"), en("dress")],
        [de("der Schal"), en("scarf")],
        [de("die Mütze"), en("woolly hat")],
        [de("die Socke"), en("sock")],
      ]),
      mcq("q6", en("You want to bring back shoes and get different ones. Which verb do you need?"), [opt("a", "umtauschen"), opt("b", "anprobieren"), opt("c", "tragen")], "a"),
    ],
    refs: [KAP11],
  },
  {
    slug: "m11-test-sprechen",
    skill: "speaking",
    title: { de: "Test: Sprechen – im Kaufhaus", en: "Test: speaking – in the department store" },
    instructions: en(
      "Practise parts 2 and 3 of the A1 speaking exam. Speak for yourself; the model answer is only an example. This practice is not scored.",
    ),
    items: [
      speak("q1", "Topic card „Einkaufen“, word „Größe“: ask a question and answer it.", "Welche Größe haben Sie? – Ich habe Größe 38.", {
        cue: de("Einkaufen – Größe"),
      }),
      speak("q2", "Card: a jacket. Politely ask the shop assistant if you can try it on.", "Entschuldigung, kann ich diese Jacke anprobieren?"),
      speak("q3", "Ask where the menswear department is. Then answer: on the second floor.", "Wo finde ich die Herrenmode, bitte? – Im zweiten Stock."),
      speak("q4", "Say what you are wearing today.", "Heute trage ich eine Jeans, ein T-Shirt und eine Jacke."),
    ],
    refs: [KAP11, GOETHE_SPRECHEN],
  },
];

export const EXERCISES_BY_LESSON = { L1, L2, L3, L4, L5 };
export const EXERCISES = [...L1, ...L2, ...L3, ...L4, ...L5];
