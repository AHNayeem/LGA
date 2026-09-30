// Module 6 exercises. All texts, dialogues and questions are original. Task *formats*
// follow the Goethe A1 structure documented in docs/REFERENCE-ANALYSIS.md (3-option MC,
// richtig/falsch e-mails for Lesen Teil 1, short messages for Schreiben Teil 2 – made
// auto-gradable as gap-fill and "which sentence fits"); no exam content is reproduced.
// Situation prompts are in English so beginners know what to do; the language being
// tested is always German. Audio texts write dates and prices as words.

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
  withExtra({ id, type: "speak_prompt", prompt: en(prompt), modelAnswer: de(modelAnswer), modelAudio: { text: modelAnswer, voice: "female", rate: "slow" } }, extra);

const GOETHE_HOEREN = { ref: "goethe-start-deutsch-1-hoeren", note: "Task format only" };
const GOETHE_LESEN = { ref: "goethe-start-deutsch-1-lesen", note: "Task format only" };
const GOETHE_SCHREIBEN = { ref: "goethe-start-deutsch-1-schreiben", note: "Task format only" };
const GOETHE_SPRECHEN = { ref: "goethe-start-deutsch-1-sprechen", note: "Task format only" };
const KAP4 = { ref: "netzwerk-neu-a1-4", note: "Topic alignment only" };
const KAP5 = { ref: "netzwerk-neu-a1-5", note: "Topic alignment only" };
const KAP6 = { ref: "netzwerk-neu-a1-6", note: "Topic alignment only" };
const P2 = { ref: "netzwerk-neu-a1-p2", note: "Topic alignment only" };
const ga = (n) => ({ ref: `grammatik-aktiv-${n}`, note: "Topic alignment only" });

// --- Lesson 1: Wann hast du Geburtstag? ------------------------------------------------

const L1 = [
  {
    slug: "m6-ordinalzahlen-geburtstag",
    skill: "vocabulary",
    title: { de: "Zahlen, Daten, Geburtstage", en: "Numbers, dates, birthdays" },
    instructions: en("Match the pairs and choose the right answer."),
    items: [
      pairs(
        "q1",
        [
          [de("1."), de("erste")],
          [de("2."), de("zweite")],
          [de("3."), de("dritte")],
          [de("7."), de("siebte")],
          [de("20."), de("zwanzigste")],
        ],
        { prompt: en("Number and ordinal") },
      ),
      pairs(
        "q2",
        [
          [de("der Geburtstag"), en("birthday")],
          [de("das Geschenk"), en("present")],
          [de("der Gast"), en("guest")],
          [de("feiern"), en("to celebrate")],
          [de("schenken"), en("to give as a present")],
        ],
        { prompt: en("Word and meaning") },
      ),
      mcq("q3", en("Today is your friend's birthday. What do you say?"), [opt("a", "Gute Nacht!"), opt("b", "Herzlichen Glückwunsch!"), opt("c", "Wie bitte?")], "b"),
      mcq("q4", de("Der Wievielte ist heute?"), [opt("a", "Heute ist der dritte Mai."), opt("b", "Es ist drei Uhr."), opt("c", "Ich bin zwanzig.")], "a"),
      mcq("q5", en("Which word means “born”?"), [opt("a", "der Gast"), opt("b", "geboren"), opt("c", "das Geschenk")], "b"),
    ],
    refs: [KAP6],
  },
  {
    slug: "m6-datum-ordinal",
    skill: "grammar",
    title: { de: "Der dritte oder am dritten?", en: "der dritte or am dritten?" },
    instructions: en("Write the number in brackets as a word, with the right ending (for example: dritte or dritten)."),
    items: [
      gap("q1", "Heute ist der", "Mai. (3.)", ["dritte"]),
      gap("q2", "Ich habe am", "Juni Geburtstag. (1.)", ["ersten"], { explanation: en("After am the ending is -en: am ersten Juni.") }),
      gap("q3", "Die Party ist am", "Juli. (7.)", ["siebten"]),
      gap("q4", "Heute ist der", "Oktober. (20.)", ["zwanzigste"], { explanation: en("From 20 on, add -ste: zwanzigste.") }),
      gap("q5", "Mein Geburtstag ist am", "August. (2.)", ["zweiten"]),
      gap("q6", "Morgen ist der", "Dezember. (31.)", ["einunddreißigste"]),
      typed("q7", ["am ersten Januar", "am 1. Januar", "am 1 Januar", "am 1.1.", "am 01.01.", "am ersten Ersten", "ersten Januar", "1. Januar", "1 Januar", "am 1.Januar"], {
        prompt: en("When is New Year's Day? Answer in German with „am …“."),
      }),
      mcq("q8", de("Wann hast du Geburtstag?"), [opt("a", "Der vierte April."), opt("b", "Am vierten April."), opt("c", "Am vierte April.")], "b", {
        explanation: en("Wann? is answered with am + -en: Am vierten April."),
      }),
    ],
    refs: [KAP6],
  },
  {
    slug: "m6-geburtstag-hoeren",
    skill: "listening",
    title: { de: "Wann hast du Geburtstag?", en: "Listening: birthdays" },
    instructions: en("Listen to the conversation. You can play it twice. Then answer the questions."),
    stimulus: {
      textKind: "dialogue",
      audio: {
        lines: [
          { speaker: "Mia", text: "Jonas, wann hast du Geburtstag?", voice: "female" },
          { speaker: "Jonas", text: "Am zwölften Juni. Und du?", voice: "male" },
          { speaker: "Mia", text: "Ich habe am dritten März Geburtstag.", voice: "female" },
          { speaker: "Jonas", text: "Am dritten März? Das ist heute! Herzlichen Glückwunsch, Mia!", voice: "male" },
          { speaker: "Mia", text: "Danke! Am Samstag mache ich eine Party. Kommst du?", voice: "female" },
          { speaker: "Jonas", text: "Ja, gern!", voice: "male" },
        ],
      },
      maxPlays: 2,
      transcriptPolicy: "after_submit",
    },
    items: [
      mcq("q1", en("When is Jonas's birthday?"), [opt("a", "am 2. Juni"), opt("b", "am 12. Juni"), opt("c", "am 20. Juni")], "b"),
      mcq("q2", en("When is Mia's birthday?"), [opt("a", "am 3. März"), opt("b", "am 13. März"), opt("c", "am 3. Mai")], "a"),
      tf("q3", "Heute ist der dritte März.", true, { explanation: en("Jonas says „Das ist heute!“ – today is Mia's birthday.") }),
      mcq("q4", en("When is the party?"), [opt("a", "heute"), opt("b", "am Sonntag"), opt("c", "am Samstag")], "c"),
      tf("q5", "Jonas kommt am Samstag nicht.", false),
    ],
    refs: [KAP6, GOETHE_HOEREN],
  },
];

// --- Lesson 2: Kommst du mit? ------------------------------------------------------------

const L2 = [
  {
    slug: "m6-trennbare-verben-ueben",
    skill: "grammar",
    title: { de: "Trennbare Verben", en: "Separable verbs" },
    instructions: en("Write the missing word, then put the words in the right order."),
    items: [
      gap("q1", "Ich", "dich ein. (einladen)", ["lade"]),
      gap("q2", "Paul", "am Samstag nicht mit. (mitkommen)", ["kommt"]),
      gap("q3", "Wann", "du morgen auf? (aufstehen)", ["stehst"]),
      gap("q4", "Ich rufe dich morgen", ". (anrufen)", ["an"], { explanation: en("The prefix goes to the end: Ich rufe dich morgen an.") }),
      gap("q5", "Lisa", "Getränke mit. (mitbringen)", ["bringt"]),
      gap("q6", "Ich kann leider nicht", ". (mitkommen)", ["mitkommen"], { explanation: en("With a modal verb, the infinitive stays together at the end.") }),
      gap("q7", "Du", "Tom ein, oder? (einladen)", ["lädst", "laedst"], { explanation: en("einladen changes a → ä: du lädst ein, er lädt ein.") }),
      order("q8", ["Ich", "rufe", "dich", "morgen", "an", "."], { alternatives: ["Morgen rufe ich dich an."] }),
      order("q9", ["Kommst", "du", "am", "Samstag", "mit", "?"]),
      order("q10", ["Wir", "laden", "Anna", "und", "Tom", "ein", "."], { alternatives: ["Anna und Tom laden wir ein."] }),
    ],
    refs: [KAP6, ga(8)],
  },
  {
    slug: "m6-pronomen-akkusativ",
    skill: "grammar",
    title: { de: "mich, dich, ihn …", en: "mich, dich, ihn …" },
    instructions: en("Choose the right pronoun."),
    items: [
      mcq("q1", de("Hallo, Paul! Ich lade … ein. Kommst du?"), [opt("a", "du"), opt("b", "dich"), opt("c", "mich")], "b"),
      mcq("q2", de("Wo ist Lisa? Ich sehe … nicht."), [opt("a", "sie"), opt("b", "ihn"), opt("c", "es")], "a"),
      mcq("q3", de("Der Kuchen ist super! Ich mag …."), [opt("a", "es"), opt("b", "sie"), opt("c", "ihn")], "c", {
        explanation: en("der Kuchen is masculine: der → ihn."),
      }),
      mcq("q4", de("Das Geschenk ist schön. Ich finde … toll."), [opt("a", "es"), opt("b", "ihn"), opt("c", "sie")], "a"),
      mcq("q5", de("Wir kommen um acht. Holst du … ab?"), [opt("a", "wir"), opt("b", "euch"), opt("c", "uns")], "c"),
      mcq("q6", de("Tom und Sara, ich rufe … morgen an."), [opt("a", "euch"), opt("b", "ihr"), opt("c", "uns")], "a"),
      mcq("q7", de("Kannst du … anrufen? Meine Nummer ist 0171 23 45 67."), [opt("a", "ich"), opt("b", "mich"), opt("c", "dich")], "b"),
      mcq("q8", de("Frau Keller, ich rufe … morgen an."), [opt("a", "Sie"), opt("b", "Ihnen"), opt("c", "ihn")], "a"),
    ],
    refs: [KAP6, ga(21)],
  },
  {
    slug: "m6-einladung-lesen",
    skill: "reading",
    title: { de: "Eine Einladung von Lukas", en: "An invitation from Lukas" },
    instructions: en("Read the e-mail. Are the sentences true (richtig) or false (falsch)?"),
    stimulus: {
      textKind: "email",
      text: de(
        "Liebe Freunde,\n\nam 15. Juni habe ich Geburtstag, und ich möchte feiern. Ich lade euch ein! Die Party ist am Samstag, 17. Juni, um 19 Uhr. Meine Adresse ist Lindenstraße 8.\n\nIch mache das Essen. Könnt ihr bitte Getränke mitbringen?\n\nAnna, kannst du mich am Freitag anrufen? Ich habe eine Frage.\n\nKönnt ihr bis Mittwoch zusagen oder absagen?\n\nViele Grüße\nLukas",
      ),
    },
    items: [
      tf("q1", "Lukas hat am 17. Juni Geburtstag.", false, { explanation: en("His birthday is on 15 June; the party is on 17 June.") }),
      tf("q2", "Die Party ist am Samstag.", true),
      tf("q3", "Lukas macht das Essen.", true),
      tf("q4", "Lukas bringt die Getränke mit.", false),
      tf("q5", "Lukas ruft Anna am Freitag an.", false, { explanation: en("Lukas asks Anna: „Kannst du mich am Freitag anrufen?“ – Anna calls Lukas.") }),
      tf("q6", "Lukas fragt die Gäste: Sagt ihr bis Mittwoch zu oder ab?", true),
    ],
    refs: [KAP6, GOETHE_LESEN],
  },
  {
    slug: "m6-einladung-antworten",
    skill: "writing",
    title: { de: "Auf eine Einladung antworten", en: "Reply to an invitation" },
    instructions: en("Your friend Lukas invites you to his party (see the e-mail in the last exercise). Choose the sentences that fit, then complete your reply."),
    stimulus: {
      textKind: "message",
      text: de("Hallo! Am Samstag, 17. Juni, um 19 Uhr mache ich eine Party. Kommst du? Viele Grüße, Lukas"),
    },
    items: [
      mcq("q1", en("You want to accept the invitation."), [opt("a", "Danke für die Einladung! Ich komme gern."), opt("b", "Leider kann ich nicht kommen."), opt("c", "Wann hast du Geburtstag?")], "a"),
      mcq("q2", en("You want to decline politely."), [opt("a", "Ich komme gern!"), opt("b", "Herzlichen Glückwunsch!"), opt("c", "Tut mir leid, ich kann leider nicht kommen.")], "c"),
      mcq("q3", en("You want to ask what you can bring."), [opt("a", "Wo wohnst du?"), opt("b", "Was kann ich mitbringen?"), opt("c", "Zusammen oder getrennt?")], "b"),
      mcq("q4", en("Which is a good ending for your message?"), [opt("a", "Liebe Grüße und bis Samstag!"), opt("b", "Liebe Freunde,"), opt("c", "Zahlen, bitte!")], "a"),
      gap("q5", "Lieber Lukas, danke für die", "!", ["Einladung"], { prompt: en("invitation") }),
      gap("q6", "Ich komme gern", ".", ["mit"], { prompt: en("I'd love to come along.") }),
      gap("q7", "Kannst du mich um halb sieben", "?", ["abholen"], { prompt: en("to pick up") }),
      gap("q8", "Ich", "einen Kuchen mit.", ["bringe"], { prompt: en("to bring along (mitbringen)") }),
    ],
    refs: [KAP6, GOETHE_SCHREIBEN],
  },
];

// --- Lesson 3: Im Café -------------------------------------------------------------------

const L3 = [
  {
    slug: "m6-im-cafe-woerter",
    skill: "vocabulary",
    title: { de: "Was sagen Sie im Café?", en: "What do you say in the café?" },
    instructions: en("Choose the right sentence for each situation, then match the words."),
    items: [
      mcq("q1", en("You want to pay."), [opt("a", "Zahlen, bitte!"), opt("b", "Ist hier noch frei?"), opt("c", "Herzlichen Glückwunsch!")], "a"),
      mcq("q2", en("You want to sit at a table where other people are already sitting."), [opt("a", "Stimmt so!"), opt("b", "Ist hier noch frei?"), opt("c", "Die Rechnung, bitte!")], "b"),
      mcq("q3", en("The waiter asks „Zusammen oder getrennt?“. You pay for your friend too."), [opt("a", "Getrennt, bitte."), opt("b", "Stimmt so."), opt("c", "Zusammen, bitte.")], "c"),
      mcq("q4", en("The bill is €9.50. You give €10 and don't want any change."), [opt("a", "Stimmt so!"), opt("b", "Zahlen, bitte!"), opt("c", "Zusammen oder getrennt?")], "a"),
      mcq("q5", en("You want to see what food and drinks they have."), [opt("a", "Die Rechnung, bitte."), opt("b", "Die Speisekarte, bitte."), opt("c", "Das Trinkgeld, bitte.")], "b"),
      pairs("q6", [
        [de("die Rechnung"), en("bill")],
        [de("die Speisekarte"), en("menu")],
        [de("das Trinkgeld"), en("tip")],
        [de("bestellen"), en("to order")],
        [de("bezahlen"), en("to pay")],
        [de("reservieren"), en("to book (a table)")],
      ]),
    ],
    refs: [KAP6],
  },
  {
    slug: "m6-fuer-akkusativ-ueben",
    skill: "grammar",
    title: { de: "für mich, für dich …", en: "für + accusative" },
    instructions: en("Write the right form of the word in brackets."),
    items: [
      gap("q1", "Das Geschenk ist für", ". (du)", ["dich"]),
      gap("q2", "Für", "einen Kaffee, bitte. (ich)", ["mich"]),
      gap("q3", "Ist der Tee für", "? (er)", ["ihn"]),
      gap("q4", "Der Kuchen ist für", ". (wir)", ["uns"]),
      gap("q5", "Die Party ist für", ", Tom und Lisa! (ihr)", ["euch"]),
      gap("q6", "Ich kaufe ein Geschenk für", "Mutter. (mein)", ["meine"]),
      gap("q7", "Das Buch ist für", "Bruder. (mein)", ["meinen"], { explanation: en("Masculine after für: mein → meinen.") }),
      gap("q8", "Das Trinkgeld ist für", "Kellner. (der)", ["den"]),
    ],
    refs: [KAP6, ga(34)],
  },
  {
    slug: "m6-im-cafe-hoeren",
    skill: "listening",
    title: { de: "Im Café Sonne", en: "Listening: in the café" },
    instructions: en("Listen to the conversation in a café. You can play it twice. Then answer the questions."),
    stimulus: {
      textKind: "dialogue",
      audio: {
        lines: [
          { speaker: "Kellnerin", text: "Guten Tag! Was möchten Sie trinken?", voice: "female", rate: "normal" },
          { speaker: "Herr Adler", text: "Guten Tag! Ich möchte einen Kaffee, bitte. Und für meine Frau einen Tee.", voice: "male", rate: "normal" },
          { speaker: "Kellnerin", text: "Gern. Möchten Sie auch etwas essen?", voice: "female", rate: "normal" },
          { speaker: "Frau Adler", text: "Ja, zwei Stück Apfelkuchen, bitte.", voice: "female2", rate: "normal" },
          { speaker: "Herr Adler", text: "Entschuldigung! Wir möchten bezahlen, bitte.", voice: "male", rate: "normal" },
          { speaker: "Kellnerin", text: "Zusammen oder getrennt?", voice: "female", rate: "normal" },
          { speaker: "Herr Adler", text: "Zusammen, bitte.", voice: "male", rate: "normal" },
          { speaker: "Kellnerin", text: "Das macht vierzehn Euro achtzig.", voice: "female", rate: "normal" },
          { speaker: "Herr Adler", text: "Hier sind sechzehn Euro. Stimmt so.", voice: "male", rate: "normal" },
          { speaker: "Kellnerin", text: "Vielen Dank!", voice: "female", rate: "normal" },
        ],
      },
      maxPlays: 2,
      transcriptPolicy: "after_submit",
    },
    items: [
      mcq("q1", en("What does Mrs Adler drink?"), [opt("a", "einen Kaffee"), opt("b", "einen Tee"), opt("c", "ein Wasser")], "b"),
      mcq("q2", en("What do they eat?"), [opt("a", "zwei Stück Apfelkuchen"), opt("b", "eine Suppe"), opt("c", "nichts")], "a"),
      tf("q3", "Herr und Frau Adler bezahlen getrennt.", false),
      mcq("q4", en("How much is the bill?"), [opt("a", "4,80 €"), opt("b", "14,80 €"), opt("c", "16,00 €")], "b"),
      mcq("q5", en("How much tip does Mr Adler give?"), [opt("a", "1,20 €"), opt("b", "2,00 €"), opt("c", "16,00 €")], "a", {
        explanation: en("He pays €16 for a bill of €14.80 and says „Stimmt so“: the tip is €1.20."),
      }),
    ],
    refs: [KAP6, GOETHE_HOEREN],
  },
  {
    slug: "m6-bestellen-sprechen",
    skill: "speaking",
    title: { de: "Im Café bestellen", en: "Ordering in a café" },
    instructions: en("Say your answer out loud. Then compare it with the model answer and rate yourself."),
    items: [
      speak("q1", "In a café: order a coffee for yourself.", "Ich möchte einen Kaffee, bitte."),
      speak("q2", "Call the waiter and ask for the bill.", "Entschuldigung! Zahlen, bitte!"),
      speak("q3", "It's your friend Lara's birthday. Invite her for a coffee and say the coffee is for her.", "Lara, du hast Geburtstag! Ich lade dich ein. Der Kaffee ist für dich."),
    ],
    refs: [KAP6, GOETHE_SPRECHEN],
  },
];

// --- Lesson 4: Wie war das Fest? ---------------------------------------------------------

const L4 = [
  {
    slug: "m6-war-hatte",
    skill: "grammar",
    title: { de: "war und hatte", en: "war and hatte" },
    instructions: en("Write the past form (Präteritum) of the verb in brackets."),
    items: [
      gap("q1", "Am Samstag", "ich in Berlin. (sein)", ["war"]),
      gap("q2", "Die Party", "super. (sein)", ["war"]),
      gap("q3", "", "du am Wochenende in Hamburg? (sein)", ["Warst"]),
      gap("q4", "Wir", "viel Spaß. (haben)", ["hatten"]),
      gap("q5", "Ich", "leider keine Zeit. (haben)", ["hatte"]),
      gap("q6", "", "ihr am Samstag Gäste? (haben)", ["Hattet"]),
      gap("q7", "Das Konzert", "langweilig. (sein)", ["war"]),
      gap("q8", "Paul und Lisa", "nicht da. (sein)", ["waren"]),
      gap("q9", "Wie", "das Stadtfest? (sein)", ["war"]),
      mcq("q10", de("Gestern … Anna Geburtstag."), [opt("a", "hat"), opt("b", "hatte"), opt("c", "war")], "b", {
        explanation: en("Geburtstag haben → gestern hatte sie Geburtstag."),
      }),
    ],
    refs: [KAP6, ga(25)],
  },
  {
    slug: "m6-wochenende-lesen",
    skill: "reading",
    title: { de: "Eine E-Mail von Clara", en: "An e-mail from Clara" },
    instructions: en("Read the e-mail. Are the sentences true (richtig) or false (falsch)?"),
    stimulus: {
      textKind: "email",
      text: de(
        "Hallo Jana,\n\nwie war dein Wochenende? Mein Wochenende war super! Am Samstag war das Stadtfest in Kassel. Ben und ich waren da. Am Nachmittag war ein Konzert. Die Musik war toll, aber der Eintritt war teuer: 25 Euro!\n\nAm Sonntag hatte ich Besuch: Meine Eltern waren da.\n\nUnd du? Hattest du Zeit für das Konzert von Mia? Es war am Freitag, oder?\n\nLiebe Grüße\nClara",
      ),
    },
    items: [
      tf("q1", "Das Stadtfest war am Samstag.", true),
      tf("q2", "Clara war allein auf dem Stadtfest.", false, { explanation: en("„Ben und ich waren da.“") }),
      tf("q3", "Der Eintritt für das Konzert war frei.", false),
      tf("q4", "Am Sonntag waren Claras Eltern da.", true),
      tf("q5", "Das Konzert von Mia war am Samstag.", false),
    ],
    refs: [KAP6, GOETHE_LESEN],
  },
  {
    slug: "m6-veranstaltungen-hoeren",
    skill: "listening",
    title: { de: "Konzert, Ausstellung, Stadtfest", en: "Listening: events" },
    instructions: en("Listen to each message. You can play each one twice. Choose the right answer."),
    itemAudioMaxPlays: 2,
    items: [
      mcq("q1", en("When is the concert?"), [opt("a", "am 4. Juli"), opt("b", "am 14. Juli"), opt("c", "am 24. Juli")], "b", {
        audio: { text: "Hallo Tom, hier ist Sara. Das Konzert findet am vierzehnten Juli statt. Kommst du mit?", voice: "female" },
      }),
      mcq("q2", en("When is the exhibition closed?"), [opt("a", "am Montag"), opt("b", "am Dienstag"), opt("c", "am Sonntag")], "a", {
        audio: { text: "Die Ausstellung ist von Dienstag bis Sonntag geöffnet. Am Montag ist sie geschlossen. Der Eintritt ist frei.", voice: "male" },
      }),
      mcq("q3", en("What does Paul say?"), [optEn("a", "He can't come to the party."), optEn("b", "The party was great."), optEn("c", "The party is tomorrow.")], "b", {
        audio: { text: "Hallo Anna, hier ist Paul. Die Party war super! Wir hatten viel Spaß. Danke für die Einladung!", voice: "male2" },
      }),
      mcq("q4", en("When is the concert at the town festival?"), [opt("a", "am Samstag um 20 Uhr"), opt("b", "am Sonntag um 20 Uhr"), opt("c", "am Samstag um 12 Uhr")], "a", {
        audio: { text: "Das Stadtfest ist am Samstag und am Sonntag. Am Samstag um zwanzig Uhr ist ein Konzert.", voice: "female2" },
      }),
      mcq("q5", en("How was the concert?"), [opt("a", "lustig"), opt("b", "super"), opt("c", "langweilig")], "c", {
        audio: { text: "Das Konzert gestern war langweilig. Die Musik war nicht gut.", voice: "female" },
      }),
    ],
    refs: [KAP6, GOETHE_HOEREN],
  },
];

// --- Lesson 5: Wiederholung Module 4–6 -----------------------------------------------------

const L5 = [
  {
    slug: "m6-wdh-einkaufen",
    skill: "grammar",
    title: { de: "Wiederholung: Essen und Einkaufen", en: "Review: food and shopping" },
    instructions: en("Revise Module 4: choose or write the right form."),
    items: [
      mcq("q1", de("Ich möchte … Kaffee, bitte."), [opt("a", "einen"), opt("b", "ein"), opt("c", "eine")], "a", { explanation: en("der Kaffee → einen Kaffee (accusative).") }),
      mcq("q2", de("Ich brauche … Brot."), [opt("a", "einen"), opt("b", "eine"), opt("c", "ein")], "c"),
      mcq("q3", de("Magst du Käse? – Nein, ich … keinen Käse."), [opt("a", "magst"), opt("b", "mag"), opt("c", "mögen")], "b"),
      gap("q4", "Was", "du? – Ich möchte einen Tee. (möchten)", ["möchtest", "moechtest"]),
      gap("q5", "Wie viel", "die Äpfel? (kosten)", ["kosten"]),
      mcq("q6", de("Ich kaufe … Apfel."), [opt("a", "ein"), opt("b", "einen"), opt("c", "eine")], "b"),
    ],
    refs: [P2, KAP4, ga(17)],
  },
  {
    slug: "m6-wdh-alltag",
    skill: "grammar",
    title: { de: "Wiederholung: Alltag und Familie", en: "Review: daily life and family" },
    instructions: en("Revise Module 5: choose or write the right form."),
    items: [
      mcq("q1", de("Der Kurs ist … Montag."), [opt("a", "um"), opt("b", "am"), opt("c", "von")], "b"),
      mcq("q2", de("Ich stehe … sieben Uhr auf."), [opt("a", "um"), opt("b", "am"), opt("c", "bis")], "a"),
      mcq("q3", de("Ich arbeite … neun … fünf Uhr."), [opt("a", "am … um"), opt("b", "um … am"), opt("c", "von … bis")], "c"),
      gap("q4", "Ich", "heute arbeiten. (müssen)", ["muss"]),
      gap("q5", "", "du am Samstag mitkommen? (können)", ["Kannst"]),
      gap("q6", "Das ist", "Schwester. (mein)", ["meine"]),
      gap("q7", "Wir", "am Samstag feiern. (wollen)", ["wollen"]),
      gap("q8", "Wo ist", "Vater, Lena? (dein)", ["dein"]),
    ],
    refs: [P2, KAP5, ga(5), ga(19), ga(32)],
  },
  {
    slug: "m6-wdh-satzbau",
    skill: "grammar",
    title: { de: "Wiederholung: Sätze bauen", en: "Review: word order" },
    instructions: en("Put the words in the right order."),
    items: [
      order("q1", ["Ich", "muss", "morgen", "früh", "aufstehen", "."], { alternatives: ["Morgen muss ich früh aufstehen."] }),
      order("q2", ["Kannst", "du", "mich", "anrufen", "?"]),
      order("q3", ["Am", "Samstag", "möchte", "ich", "ein", "Geschenk", "kaufen", "."], { alternatives: ["Ich möchte am Samstag ein Geschenk kaufen."] }),
      order("q4", ["Wir", "laden", "unsere", "Freunde", "ein", "."], { alternatives: ["Unsere Freunde laden wir ein."] }),
      order("q5", ["Gestern", "hatte", "ich", "keine", "Zeit", "."], { alternatives: ["Ich hatte gestern keine Zeit."] }),
    ],
    refs: [P2, ga(12), ga(8)],
  },
  {
    slug: "m6-wdh-lesen",
    skill: "reading",
    title: { de: "Wiederholung: Eine Nachricht von Omar", en: "Review: a message from Omar" },
    instructions: en("Read the message. Are the sentences true (richtig) or false (falsch)?"),
    stimulus: {
      textKind: "message",
      text: de(
        "Hallo Nina,\n\nam Freitag habe ich Geburtstag! Am Samstag um 20 Uhr mache ich eine Party. Meine Schwester und mein Bruder kommen auch. Ich muss noch viel einkaufen: Brot, Käse und Obst. Kannst du einen Kuchen mitbringen? Du kannst gern schon um 19 Uhr kommen.\n\nAm Donnerstag war ich in Köln, jetzt bin ich wieder da.\n\nViele Grüße\nOmar",
      ),
    },
    items: [
      tf("q1", "Omar hat am Samstag Geburtstag.", false, { explanation: en("His birthday is on Friday; the party is on Saturday.") }),
      tf("q2", "Die Party ist am Samstag um 20 Uhr.", true),
      tf("q3", "Omar hat keine Geschwister.", false),
      tf("q4", "Omar kauft Brot und Käse.", true),
      tf("q5", "Nina kann schon um 19 Uhr kommen.", true),
      tf("q6", "Am Donnerstag war Omar in Köln.", true),
    ],
    refs: [P2, GOETHE_LESEN],
  },
];

// --- Lesson 6: Modultest ---------------------------------------------------------------------

const L6 = [
  {
    slug: "m6-test-hoeren",
    skill: "listening",
    title: { de: "Test: Hören", en: "Test: listening" },
    instructions: en("Listen to each recording. You can play each one twice. Choose the right answer or write it."),
    itemAudioMaxPlays: 2,
    passThreshold: 0.7,
    items: [
      mcq("q1", en("When is her birthday?"), [opt("a", "am 3. April"), opt("b", "am 23. April"), opt("c", "am 22. April")], "b", {
        audio: { text: "Ich habe am dreiundzwanzigsten April Geburtstag.", voice: "female" },
      }),
      mcq("q2", en("What does Ben ask Lisa?"), [optEn("a", "to pick him up at seven"), optEn("b", "to call him at seven"), optEn("c", "to bring a cake")], "a", {
        audio: { text: "Hallo Lisa, hier ist Ben. Die Party ist am Samstag. Kannst du mich um sieben Uhr abholen?", voice: "male" },
      }),
      tf("q3", "Die Gäste bezahlen zusammen.", false, {
        audio: { text: "Entschuldigung, wir möchten bitte bezahlen. Getrennt, bitte.", voice: "female2" },
      }),
      mcq("q4", en("Why can't he come on Friday?"), [optEn("a", "He has to work."), optEn("b", "He has a party."), optEn("c", "He has no ticket.")], "a", {
        audio: { text: "Tut mir leid, Tom. Ich kann am Freitag leider nicht mitkommen. Ich muss arbeiten.", voice: "male2" },
      }),
      mcq("q5", en("What didn't they have time for?"), [opt("a", "das Stadtfest"), opt("b", "das Konzert"), opt("c", "die Party")], "b", {
        audio: { text: "Gestern war das Stadtfest. Es war super, aber wir hatten keine Zeit für das Konzert.", voice: "female" },
      }),
      typed("q6", ["19. Mai", "am 19. Mai", "19 Mai", "am 19 Mai", "19.5.", "19.05.", "am 19.5.", "am 19.05.", "neunzehnten Mai", "am neunzehnten Mai", "der neunzehnte Mai", "neunzehnte Mai", "19.Mai"], {
        prompt: en("When is the concert? Write the date (for example: 5. Mai)."),
        audio: { text: "Das Konzert ist am neunzehnten Mai.", voice: "male" },
      }),
    ],
    refs: [KAP6, GOETHE_HOEREN],
  },
  {
    slug: "m6-test-lesen",
    skill: "reading",
    title: { de: "Test: Lesen", en: "Test: reading" },
    instructions: en("Read the e-mail. Are the sentences true (richtig) or false (falsch)?"),
    passThreshold: 0.7,
    stimulus: {
      textKind: "email",
      text: de(
        "Liebe Frau Schulz,\n\nvielen Dank für Ihre Einladung! Das Sommerfest am 12. Juli ist eine tolle Idee. Leider kann ich am Nachmittag nicht kommen: Mein Sohn hat am 12. Juli Geburtstag, und wir feiern am Nachmittag.\n\nAber am Abend komme ich gern. Ich bringe einen Salat mit. Kommt Herr Braun auch? Ich habe ein Buch für ihn.\n\nViele Grüße\nPeter Wolf",
      ),
    },
    items: [
      tf("q1", "Frau Schulz lädt Peter Wolf ein.", true),
      tf("q2", "Das Sommerfest ist am 12. Juli.", true),
      tf("q3", "Peter Wolf kommt am Nachmittag.", false),
      tf("q4", "Der Sohn von Peter Wolf hat am 12. Juli Geburtstag.", true),
      tf("q5", "Peter Wolf bringt einen Kuchen mit.", false),
      tf("q6", "Das Buch ist für Frau Schulz.", false, { explanation: en("„Kommt Herr Braun auch? Ich habe ein Buch für ihn.“ – ihn = Herr Braun.") }),
    ],
    refs: [KAP6, GOETHE_LESEN],
  },
  {
    slug: "m6-test-schreiben",
    skill: "writing",
    title: { de: "Test: Eine Antwort schreiben", en: "Test: write a reply" },
    instructions: en("Jana invites you to her birthday party. You can come. Complete your reply."),
    passThreshold: 0.7,
    stimulus: {
      textKind: "message",
      text: de("Hallo! Am Freitag, 9. Mai, habe ich Geburtstag. Ich feiere um 20 Uhr. Kommst du? Liebe Grüße, Jana"),
    },
    items: [
      gap("q1", "Liebe Jana, vielen Dank für die", "!", ["Einladung"], { prompt: en("invitation") }),
      gap("q2", "Ich komme gern. Am Freitag habe ich", ".", ["Zeit"], { prompt: en("time") }),
      gap("q3", "Die Party ist am", "Mai, oder? (9.)", ["neunten"]),
      gap("q4", "Ich bringe einen Kuchen", ".", ["mit"], { prompt: en("I'll bring a cake.") }),
      gap("q5", "Kannst du mich", "? Ich habe kein Auto.", ["abholen"], { prompt: en("to pick up") }),
      gap("q6", "Ich", "dich am Donnerstag an. (anrufen)", ["rufe"]),
      mcq("q7", en("Which is a good ending for your reply?"), [opt("a", "Liebe Jana,"), opt("b", "Bis Freitag! Viele Grüße"), opt("c", "Zusammen oder getrennt?")], "b"),
    ],
    refs: [KAP6, GOETHE_SCHREIBEN],
  },
  {
    slug: "m6-test-grammatik",
    skill: "grammar",
    title: { de: "Test: Grammatik", en: "Test: grammar" },
    instructions: en("Answer all questions."),
    passThreshold: 0.7,
    items: [
      gap("q1", "Ich", "meine Freunde ein. (einladen)", ["lade"]),
      gap("q2", "Wir kommen am Samstag", ". (mitkommen)", ["mit"]),
      mcq("q3", de("Wo ist Tom? Ich rufe … an."), [opt("a", "er"), opt("b", "ihn"), opt("c", "sie")], "b"),
      gap("q4", "Das Geschenk ist für", ". (ihr)", ["euch"]),
      gap("q5", "Gestern", "ich keine Zeit. (haben)", ["hatte"]),
      gap("q6", "", "ihr am Wochenende in München? (sein)", ["Wart"]),
      gap("q7", "Heute ist der", "Juni. (1.)", ["erste"]),
      order("q8", ["Ich", "hole", "dich", "um", "acht", "Uhr", "ab", "."], { alternatives: ["Um acht Uhr hole ich dich ab."] }),
    ],
    refs: [KAP6, ga(8), ga(21), ga(25), ga(34)],
  },
  {
    slug: "m6-test-wortschatz",
    skill: "vocabulary",
    title: { de: "Test: Wortschatz", en: "Test: vocabulary" },
    instructions: en("Answer all questions."),
    passThreshold: 0.7,
    items: [
      mcq("q1", en("You want to pay in a café."), [opt("a", "Guten Tag!"), opt("b", "Zahlen, bitte!"), opt("c", "Ist hier noch frei?")], "b"),
      mcq("q2", en("Today is your friend's birthday."), [opt("a", "Alles Gute zum Geburtstag!"), opt("b", "Stimmt so!"), opt("c", "Schade!")], "a"),
      mcq("q3", en("Your friend can't come to your party."), [opt("a", "Herzlichen Glückwunsch!"), opt("b", "Zahlen, bitte!"), opt("c", "Das ist schade!")], "c"),
      typed("q4", ["dritte"], { prompt: en("Write „3.“ as a word: Heute ist der … Mai.") }),
      mcq("q5", de("Hast du am Samstag …? – Ja, gern!"), [opt("a", "Lust"), opt("b", "Rechnung"), opt("c", "Speisekarte")], "a"),
      pairs("q6", [
        [de("die Rechnung"), en("bill")],
        [de("die Einladung"), en("invitation")],
        [de("das Konzert"), en("concert")],
        [de("die Eintrittskarte"), en("ticket")],
        [de("der Gast"), en("guest")],
      ]),
    ],
    refs: [KAP6],
  },
  {
    slug: "m6-test-sprechen",
    skill: "speaking",
    title: { de: "Test: Sprechen – Einladungen und Feste", en: "Test: speaking – invitations and parties" },
    instructions: en("Practise for the A1 speaking exam. Speak for yourself; the model answer is only an example. This practice is not scored."),
    items: [
      speak("q1", "Word card „Geburtstag“: ask your partner a question, then answer it yourself.", "Wann hast du Geburtstag? – Ich habe am vierzehnten März Geburtstag.", {
        cue: de("Thema: Feste – Geburtstag?"),
      }),
      speak("q2", "Invite a friend to a concert on Saturday.", "Hast du am Samstag Zeit? Ich habe zwei Eintrittskarten für ein Konzert. Kommst du mit?"),
      speak("q3", "Decline an invitation politely and give a reason.", "Danke für die Einladung, aber ich kann leider nicht kommen. Ich muss arbeiten."),
    ],
    refs: [KAP6, GOETHE_SPRECHEN],
  },
];

export const EXERCISES_BY_LESSON = { L1, L2, L3, L4, L5, L6 };
export const EXERCISES = [...L1, ...L2, ...L3, ...L4, ...L5, ...L6];
