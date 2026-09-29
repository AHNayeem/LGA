// Module 7 exercises. All texts, dialogues and questions are original. Task *formats*
// follow the Goethe A1 structure documented in docs/REFERENCE-ANALYSIS.md (3-option MC,
// richtig/falsch, Lesen Teil 1 e-mails, Lesen Teil 2 "a or b?", audio played twice); no
// exam content is reproduced. Situation prompts are in English so beginners know what to
// do; the language being tested is always German. People, companies and numbers are fictional.

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
const KAP7 = { ref: "netzwerk-neu-a1-7", note: "Topic alignment only" };
const GA = (n) => ({ ref: `grammatik-aktiv-${n}`, note: "Topic alignment only" });

const connectors = [opt("a", "und"), opt("b", "oder"), opt("c", "aber")];

// --- Lesson 1: Im Büro ---------------------------------------------------------------------

const L1 = [
  {
    slug: "m7-buero-woerter",
    skill: "vocabulary",
    title: { de: "Im Büro", en: "In the office" },
    instructions: en("Match the words, then choose the right answer."),
    items: [
      pairs(
        "q1",
        [
          [de("der Drucker"), en("printer")],
          [de("der Schreibtisch"), en("desk")],
          [de("die Besprechung"), en("meeting")],
          [de("der Chef"), en("boss")],
          [de("die Kollegin"), en("colleague (female)")],
          [de("das Telefon"), en("telephone")],
        ],
        { prompt: en("Word and meaning") },
      ),
      mcq("q2", de("Der Drucker druckt nicht. Er ist …"), [opt("a", "kaputt"), opt("b", "dringend"), opt("c", "neu")], "a"),
      mcq("q3", en("Your computer doesn't work. What do you say?"), [opt("a", "Mein Computer ist neu."), opt("b", "Mein Computer funktioniert nicht."), opt("c", "Mein Computer druckt.")], "b"),
      mcq("q4", en("Ten colleagues meet at 10 a.m. and talk about work. This is a …"), [opt("a", "Kantine"), opt("b", "Feierabend"), opt("c", "Besprechung")], "c"),
      mcq("q5", en("Ms Klein is your boss. She is your …"), [opt("a", "Chefin"), opt("b", "Kollegin"), opt("c", "Kundin")], "a"),
    ],
    refs: [KAP7],
  },
  {
    slug: "m7-und-oder-aber",
    skill: "grammar",
    title: { de: "und, oder oder aber?", en: "und, oder or aber?" },
    instructions: en("Choose the word that fits: und (and), oder (or) or aber (but)."),
    items: [
      ["q1", "Das ist Jan … das ist Nina. Sie sind meine Kollegen.", "a"],
      ["q2", "Möchten Sie Tee … Kaffee?", "b"],
      ["q3", "Der Computer ist alt, … er funktioniert gut.", "c"],
      ["q4", "Ist die Besprechung um zehn Uhr … um elf Uhr?", "b"],
      ["q5", "Ich möchte drucken, … der Drucker ist kaputt.", "c"],
      ["q6", "Am Morgen trinke ich einen Kaffee … dann lese ich meine E-Mails.", "a"],
    ].map(([id, sentence, answer]) => mcq(id, de(sentence), connectors, answer)),
    refs: [KAP7, GA(44)],
  },
  {
    slug: "m7-saetze-verbinden",
    skill: "grammar",
    title: { de: "Sätze verbinden", en: "Connect the sentences" },
    instructions: en("Put the words in the right order. Remember: und, oder and aber are in position 0."),
    items: [
      order("q1", ["Der", "Computer", "ist", "alt", ",", "aber", "er", "funktioniert", "."]),
      order("q2", ["Ich", "trinke", "Kaffee", "und", "Nina", "trinkt", "Tee", "."], { alternatives: ["Nina trinkt Tee und ich trinke Kaffee."] }),
      order("q3", ["Ich", "möchte", "drucken", ",", "aber", "der", "Drucker", "ist", "kaputt", "."]),
      order("q4", ["Schreibst", "du", "eine", "E-Mail", "oder", "rufst", "du", "an", "?"], { alternatives: ["Rufst du an oder schreibst du eine E-Mail?"] }),
    ],
    refs: [KAP7, GA(44)],
  },
  {
    slug: "m7-arbeitstag-hoeren",
    skill: "listening",
    title: { de: "Ein Morgen im Büro", en: "Listening: a morning at the office" },
    instructions: en("Listen to the conversation. You can play it twice. Then answer the questions."),
    stimulus: {
      textKind: "dialogue",
      audio: {
        lines: [
          { speaker: "Nina", text: "Guten Morgen, Jan! Wie geht's?", voice: "female", rate: "normal" },
          { speaker: "Jan", text: "Morgen, Nina! Na ja, es geht. Mein Computer ist langsam und das Internet funktioniert nicht.", voice: "male", rate: "normal" },
          { speaker: "Nina", text: "Oje! Du kannst Tom anrufen. Tom ist Techniker.", voice: "female", rate: "normal" },
          { speaker: "Jan", text: "Gute Idee. Und um zehn Uhr haben wir eine Besprechung, oder?", voice: "male", rate: "normal" },
          { speaker: "Nina", text: "Nein, die Besprechung ist heute um elf Uhr. Der Chef kommt später.", voice: "female", rate: "normal" },
          { speaker: "Jan", text: "Ah, gut! Dann habe ich noch Zeit.", voice: "male", rate: "normal" },
        ],
      },
      maxPlays: 2,
      transcriptPolicy: "after_submit",
    },
    items: [
      mcq("q1", en("What is Jan's problem?"), [
        opt("a", "Der Drucker ist kaputt."),
        opt("b", "Der Computer ist langsam und das Internet funktioniert nicht."),
        opt("c", "Das Telefon funktioniert nicht."),
      ], "b"),
      tf("q2", "Tom ist Techniker.", true),
      mcq("q3", en("When is the meeting today?"), [opt("a", "um zehn Uhr"), opt("b", "um elf Uhr"), opt("c", "um zwölf Uhr")], "b"),
      tf("q4", "Der Chef kommt heute nicht.", false, { explanation: en("Nina says „Der Chef kommt später“ – he comes later.") }),
    ],
    refs: [KAP7, GOETHE_HOEREN],
  },
];

// --- Lesson 2: E-Mails im Büro ----------------------------------------------------------------

const L2 = [
  {
    slug: "m7-dativ-artikel",
    skill: "grammar",
    title: { de: "dem, der oder den?", en: "dem, der or den?" },
    instructions: en("Write the article in the dative. The word in brackets helps you."),
    items: [
      gap("q1", "Ich schicke", "Chefin die Datei. (die Chefin)", ["der"]),
      gap("q2", "Nina schreibt", "Chef eine E-Mail. (der Chef)", ["dem"]),
      gap("q3", "Frau Klein zeigt", "Kundin das Büro. (die Kundin)", ["der"]),
      gap("q4", "Ich schreibe", "Kolleginnen eine E-Mail. (die Kolleginnen)", ["den"], {
        explanation: en("Dative plural: den – and the noun ends in -n."),
      }),
      gap("q5", "Jan schickt", "Kollegin die Liste. (eine Kollegin)", ["einer"]),
      gap("q6", "Ich schreibe", "Chef eine E-Mail. (mein Chef)", ["meinem"]),
      gap("q7", "Wir schicken", "Büro in Hamburg die Datei. (das Büro)", ["dem"]),
    ],
    refs: [KAP7, GA(18)],
  },
  {
    slug: "m7-email-lesen",
    skill: "reading",
    title: { de: "Eine E-Mail von Herrn Wagner", en: "An e-mail from Mr Wagner" },
    instructions: en("Read the e-mail. Are the sentences true (richtig) or false (falsch)?"),
    stimulus: {
      textKind: "email",
      text: de(
        "Sehr geehrte Frau Berger,\n\nvielen Dank für Ihre E-Mail. Die Besprechung ist am Donnerstag um 14 Uhr, nicht am Mittwoch. Wir sind in Raum 305. Bitte bringen Sie Ihren Laptop mit. Der Computer in Raum 305 ist leider kaputt.\n\nDie Liste für die Besprechung ist im Anhang. Bitte antworten Sie bis Dienstag.\n\nMit freundlichen Grüßen\nMarkus Wagner",
      ),
    },
    items: [
      tf("q1", "Die Besprechung ist am Mittwoch.", false),
      tf("q2", "Die Besprechung ist in Raum 305.", true),
      tf("q3", "Frau Berger bringt ihren Laptop mit.", true),
      tf("q4", "Der Computer in Raum 305 funktioniert gut.", false),
      tf("q5", "Frau Berger muss bis Dienstag antworten.", true),
      tf("q6", "Frau Berger schreibt die E-Mail.", false, { explanation: en("Markus Wagner writes to Frau Berger: „Sehr geehrte Frau Berger, …“.") }),
    ],
    refs: [KAP7, GOETHE_LESEN],
  },
  {
    slug: "m7-email-woerter",
    skill: "vocabulary",
    title: { de: "Wörter für E-Mails", en: "Words for e-mails" },
    instructions: en("Choose the right answer, then match the words."),
    items: [
      mcq("q1", en("You write a formal e-mail to Mr Wagner. How do you start?"), [
        opt("a", "Hallo Wagner,"),
        opt("b", "Sehr geehrte Herr Wagner,"),
        opt("c", "Sehr geehrter Herr Wagner,"),
      ], "c", { explanation: en("Herr → Sehr geehrter, Frau → Sehr geehrte.") }),
      mcq("q2", en("How do you end a formal e-mail?"), [opt("a", "Mit freundlichen Grüßen"), opt("b", "Tschüs"), opt("c", "Bis bald")], "a"),
      mcq("q3", en("The file comes with the e-mail. It is in the …"), [opt("a", "Drucker"), opt("b", "Anhang"), opt("c", "Schalter")], "b"),
      mcq("q4", en("You must answer the e-mail today. It is …"), [opt("a", "dringend"), opt("b", "kaputt"), opt("c", "langsam")], "a"),
      pairs("q5", [
        [de("schicken"), en("to send")],
        [de("antworten"), en("to reply")],
        [de("drucken"), en("to print")],
        [de("die Datei"), en("file")],
        [de("der Kunde"), en("customer")],
      ]),
    ],
    refs: [KAP7],
  },
  {
    slug: "m7-email-schreiben",
    skill: "writing",
    title: { de: "Eine Antwort schreiben", en: "Write a reply" },
    instructions: en("You are Ms Berger. Read Mr Wagner's e-mail and complete your reply."),
    stimulus: {
      textKind: "email",
      text: de(
        "Sehr geehrte Frau Berger,\n\nhaben Sie am Donnerstag um 14 Uhr Zeit? Bitte schicken Sie auch die Liste für die Besprechung.\n\nMit freundlichen Grüßen\nMarkus Wagner",
      ),
    },
    items: [
      gap("q1", "", "Herr Wagner,", ["Sehr geehrter"], { prompt: en("Formal greeting") }),
      gap("q2", "vielen Dank für Ihre", ". Am Donnerstag um 14 Uhr habe ich Zeit.", ["E-Mail", "Mail", "Email", "Nachricht"], {
        prompt: en("the message you got"),
      }),
      gap("q3", "Die Liste ist im", ".", ["Anhang"], { prompt: en("The list is attached.") }),
      gap("q4", "Mit freundlichen", "", ["Grüßen"], { prompt: en("Formal closing") }),
      typed(
        "q5",
        [
          "Der Drucker ist kaputt, aber der Computer funktioniert.",
          "Der Drucker ist kaputt aber der Computer funktioniert.",
          "Der Drucker ist kaputt, der Computer funktioniert aber.",
          "Der Drucker ist kaputt, aber der Computer funktioniert noch.",
        ],
        { prompt: en("Write in German: The printer is broken, but the computer works.") },
      ),
      typed(
        "q6",
        [
          "Ich schicke dem Chef die Datei.",
          "Ich schicke die Datei dem Chef.",
          "Ich schicke die Datei an den Chef.",
          "Ich sende dem Chef die Datei.",
          "Ich sende die Datei an den Chef.",
        ],
        { prompt: en("Write in German: I send the file to the boss (der Chef).") },
      ),
    ],
    refs: [KAP7, GOETHE_SCHREIBEN],
  },
];

// --- Lesson 3: Mittagspause mit Kollegen ---------------------------------------------------------

const L3 = [
  {
    slug: "m7-mit-dativ",
    skill: "grammar",
    title: { de: "mit dem, mit der …", en: "mit + dative" },
    instructions: en("Write the missing word in the dative."),
    items: [
      gap("q1", "Ich esse mit", "Kollegin in der Kantine. (mein-)", ["meiner"]),
      gap("q2", "Nina spricht mit", "Chef. (der)", ["dem"]),
      gap("q3", "Jan kommt mit", "Fahrrad. (das)", ["dem"]),
      gap("q4", "Frau Klein arbeitet mit", "Laptop. (ein)", ["einem"]),
      gap("q5", "Ich spreche oft mit", "Kolleginnen. (die, Plural)", ["den"]),
      gap("q6", "Zahlen Sie mit", "Karte? (die)", ["der"]),
    ],
    refs: [KAP7, GA(33)],
  },
  {
    slug: "m7-kantine-hoeren",
    skill: "listening",
    title: { de: "In der Kantine", en: "Listening: in the canteen" },
    instructions: en("Listen to the conversation. You can play it twice. Then answer the questions."),
    stimulus: {
      textKind: "dialogue",
      audio: {
        lines: [
          { speaker: "Ali", text: "Mahlzeit!", voice: "male", rate: "normal" },
          { speaker: "Nina", text: "Mahlzeit! Bist du neu hier?", voice: "female", rate: "normal" },
          { speaker: "Ali", text: "Ja, ich bin Ali. Ich bin neu im Team von Frau Klein.", voice: "male", rate: "normal" },
          { speaker: "Nina", text: "Ich bin Nina. Und, wie ist die Arbeit?", voice: "female", rate: "normal" },
          { speaker: "Ali", text: "Gut, aber sehr stressig. Ich habe viel zu tun.", voice: "male", rate: "normal" },
          { speaker: "Nina", text: "Das kenne ich! Isst du oft hier in der Kantine?", voice: "female", rate: "normal" },
          { speaker: "Ali", text: "Ja, meistens mit meinem Kollegen Tom. Aber heute ist Tom nicht da.", voice: "male", rate: "normal" },
          { speaker: "Nina", text: "Und wann hast du Feierabend?", voice: "female", rate: "normal" },
          { speaker: "Ali", text: "Um halb fünf. Dann fahre ich mit dem Fahrrad nach Hause.", voice: "male", rate: "normal" },
        ],
      },
      maxPlays: 2,
      transcriptPolicy: "after_submit",
    },
    items: [
      tf("q1", "Ali ist neu im Team.", true),
      mcq("q2", en("How is Ali's work?"), [opt("a", "langweilig"), opt("b", "gut, aber stressig"), opt("c", "sehr leicht")], "b"),
      mcq("q3", en("Who does Ali usually eat with?"), [opt("a", "mit Nina"), opt("b", "mit Frau Klein"), opt("c", "mit Tom")], "c"),
      mcq("q4", en("When does Ali finish work?"), [opt("a", "um 16:30 Uhr"), opt("b", "um 17:30 Uhr"), opt("c", "um 15:30 Uhr")], "a", {
        explanation: en("halb fünf = 4:30, in the afternoon 16:30."),
      }),
      tf("q5", "Ali fährt mit dem Bus nach Hause.", false),
    ],
    refs: [KAP7, GOETHE_HOEREN],
  },
  {
    slug: "m7-smalltalk-sprechen",
    skill: "speaking",
    title: { de: "Small Talk mit Kollegen", en: "Small talk with colleagues" },
    instructions: en("Say your answer out loud. Then compare it with the model answer and rate yourself."),
    items: [
      speak("q1", "It is lunchtime. Greet a colleague in the corridor and ask how she is (du).", "Mahlzeit! Wie geht's?"),
      speak("q2", "Say that you are very busy today, but the work is interesting.", "Ich habe heute viel zu tun, aber die Arbeit ist interessant."),
      speak("q3", "Ask a colleague (du) if she eats in the canteen or at her desk.", "Isst du in der Kantine oder am Schreibtisch?"),
      speak("q4", "Say that you finish work at five and then go home by bus.", "Ich habe um fünf Uhr Feierabend. Dann fahre ich mit dem Bus nach Hause."),
    ],
    refs: [KAP7, GOETHE_SPRECHEN],
  },
];

// --- Lesson 4: Wo ist …? Im Gebäude und in der Bank --------------------------------------------

const L4 = [
  {
    slug: "m7-wo-ist",
    skill: "grammar",
    title: { de: "Wo ist …?", en: "Where is …?" },
    instructions: en("Choose the right words."),
    items: [
      mcq("q1", de("Der Laptop ist … Schreibtisch."), [opt("a", "auf dem"), opt("b", "auf der"), opt("c", "auf den")], "a"),
      mcq("q2", de("Frau Klein ist … Kantine."), [opt("a", "im"), opt("b", "in der"), opt("c", "in den")], "b"),
      mcq("q3", de("Der Drucker steht … Computer."), [opt("a", "neben der"), opt("b", "neben die"), opt("c", "neben dem")], "c"),
      mcq("q4", de("Ich arbeite … Firma Brenner."), [opt("a", "bei der"), opt("b", "beim"), opt("c", "bei dem")], "a"),
      mcq("q5", de("Der Kunde wartet … Empfang."), [opt("a", "an der"), opt("b", "am"), opt("c", "an die")], "b", {
        explanation: en("der Empfang → an dem → am Empfang."),
      }),
      mcq("q6", de("Wo ist Jan? – Er ist … Chef."), [opt("a", "bei der"), opt("b", "neben der"), opt("c", "beim")], "c"),
      mcq("q7", de("Das Telefon ist … Büro von Frau Klein."), [opt("a", "im"), opt("b", "in der"), opt("c", "auf der")], "a"),
    ],
    refs: [KAP7, GA(33), GA(35)],
  },
  {
    slug: "m7-wo-finden-sie-das",
    skill: "reading",
    title: { de: "Wo finden Sie die Information?", en: "Where do you find the information?" },
    instructions: en("Read the situation and the two texts. Where do you find the information: a or b?"),
    items: [
      mcq("q1", en("You want to withdraw money on Saturday."), [
        opt("a", "Stadtbank Lindenau – Geldautomat am Eingang: jeden Tag 0–24 Uhr."),
        opt("b", "Stadtbank Lindenau – Schalter: Montag bis Freitag 9–16 Uhr."),
      ], "a"),
      mcq("q2", en("Your computer at work is broken. You need help."), [
        opt("a", "Computerkurs für Anfänger: jeden Montag um 18 Uhr in Raum 210."),
        opt("b", "IT-Service: Raum 012, neben dem Empfang. Telefon: 0341 55 20 18 (Mo–Fr 8–17 Uhr)."),
      ], "b"),
      mcq("q3", en("You want to eat lunch at work after 2 p.m."), [
        opt("a", "Kantine: Montag bis Freitag 11:30–14:00 Uhr."),
        opt("b", "Café Hansen im Gebäude A: Montag bis Freitag 8–18 Uhr. Suppen, Salate und Pizza."),
      ], "b"),
      mcq("q4", en("You need to print 200 pages today."), [
        opt("a", "Druck-Service am Eingang: Sie möchten viel drucken? Wir drucken bis 500 Seiten. Mo–Fr bis 19 Uhr."),
        opt("b", "Drucker im Flur: bitte maximal 20 Seiten."),
      ], "a"),
      mcq("q5", en("You want to open a bank account. You can only come in the evening after work."), [
        opt("a", "Stadtbank Lindenau – Konto eröffnen: Montag bis Freitag 9–13 Uhr."),
        opt("b", "Stadtbank Lindenau – Konto eröffnen: Montag bis Freitag 9–13 Uhr, Donnerstag auch 16–19 Uhr."),
      ], "b"),
    ],
    refs: [KAP7, GOETHE_LESEN],
  },
  {
    slug: "m7-bank-hoeren",
    skill: "listening",
    title: { de: "In der Bank", en: "Listening: at the bank" },
    instructions: en("Listen to the conversation. You can play it twice. Then answer the questions."),
    stimulus: {
      textKind: "dialogue",
      audio: {
        lines: [
          { speaker: "Bankangestellte", text: "Guten Tag! Was kann ich für Sie tun?", voice: "female2", rate: "normal" },
          { speaker: "Herr Novak", text: "Guten Tag! Ich möchte ein Konto eröffnen. Ich arbeite jetzt bei einer Firma hier in Leipzig.", voice: "male2", rate: "normal" },
          { speaker: "Bankangestellte", text: "Gern. Haben Sie Ihren Ausweis?", voice: "female2", rate: "normal" },
          { speaker: "Herr Novak", text: "Ja, hier ist mein Pass.", voice: "male2", rate: "normal" },
          { speaker: "Bankangestellte", text: "Danke. Bitte füllen Sie das Formular aus und unterschreiben Sie hier.", voice: "female2", rate: "normal" },
          { speaker: "Herr Novak", text: "Gut. Und wo ist hier ein Geldautomat?", voice: "male2", rate: "normal" },
          { speaker: "Bankangestellte", text: "Der Geldautomat ist neben dem Eingang.", voice: "female2", rate: "normal" },
          { speaker: "Herr Novak", text: "Vielen Dank! Auf Wiedersehen!", voice: "male2", rate: "normal" },
        ],
      },
      maxPlays: 2,
      transcriptPolicy: "after_submit",
    },
    items: [
      mcq("q1", en("What does Mr Novak want?"), [opt("a", "Geld abheben"), opt("b", "ein Konto eröffnen"), opt("c", "eine Karte bezahlen")], "b"),
      tf("q2", "Herr Novak arbeitet bei einer Firma in Leipzig.", true),
      tf("q3", "Herr Novak hat keinen Ausweis.", false, { explanation: en("He has his passport: „Ja, hier ist mein Pass.“") }),
      mcq("q4", en("Where is the cash machine?"), [opt("a", "am Schalter"), opt("b", "im Flur, neben dem Aufzug"), opt("c", "neben dem Eingang")], "c"),
    ],
    refs: [KAP7, GOETHE_HOEREN],
  },
  {
    slug: "m7-gebaeude-bank-woerter",
    skill: "vocabulary",
    title: { de: "Im Gebäude und in der Bank", en: "In the building and at the bank" },
    instructions: en("Match the words, then choose the right answer."),
    items: [
      pairs("q1", [
        [de("das Konto"), en("account")],
        [de("der Geldautomat"), en("cash machine")],
        [de("der Schalter"), en("counter")],
        [de("unterschreiben"), en("to sign")],
        [de("das Gebäude"), en("building")],
        [de("der Ordner"), en("folder")],
      ]),
      mcq("q2", en("You need cash. What do you say?"), [
        opt("a", "Ich möchte ein Konto unterschreiben."),
        opt("b", "Ich möchte Geld abheben."),
        opt("c", "Ich möchte den Schalter drucken."),
      ], "b"),
      mcq("q3", en("Visitors arrive at a company. Where do they ask for Ms Klein?"), [opt("a", "am Empfang"), opt("b", "in der Kantine"), opt("c", "am Geldautomaten")], "a"),
      mcq("q4", en("The long way between the rooms in an office building is the …"), [opt("a", "Raum"), opt("b", "Flur"), opt("c", "Schalter")], "b"),
    ],
    refs: [KAP7],
  },
];

// --- Lesson 5: Modultest ------------------------------------------------------------------------

const L5 = [
  {
    slug: "m7-test-hoeren",
    skill: "listening",
    title: { de: "Test: Hören", en: "Test: listening" },
    instructions: en("Listen to each recording. You can play each one twice. Choose the right answer or write it."),
    itemAudioMaxPlays: 2,
    passThreshold: 0.7,
    items: [
      mcq("q1", en("Where is Ms Klein?"), [opt("a", "im Büro"), opt("b", "in der Kantine"), opt("c", "in der Bank")], "b", {
        audio: { text: "Frau Klein ist nicht im Büro. Sie ist in der Kantine.", voice: "female", rate: "slow" },
      }),
      mcq("q2", en("How does Jan come to work?"), [opt("a", "mit dem Auto"), opt("b", "mit dem Bus"), opt("c", "mit dem Fahrrad")], "c", {
        audio: { text: "Ich komme jeden Tag mit dem Fahrrad, nicht mit dem Auto.", voice: "male", rate: "slow" },
      }),
      mcq("q3", en("Which room is the meeting in?"), [opt("a", "Raum 12"), opt("b", "Raum 20"), opt("c", "Raum 22")], "b", {
        audio: { text: "Die Besprechung ist heute in Raum zwanzig.", voice: "female2", rate: "slow" },
      }),
      mcq("q4", en("What is the problem?"), [opt("a", "Der Computer ist langsam."), opt("b", "Der Drucker ist kaputt."), opt("c", "Das Telefon funktioniert nicht.")], "b", {
        audio: { text: "Entschuldigung, der Drucker im Flur funktioniert nicht. Er ist kaputt.", voice: "male2", rate: "slow" },
      }),
      typed("q5", ["Lindner"], {
        prompt: en("Write the surname of the new colleague."),
        audio: { text: "Unsere neue Kollegin heißt Sara Lindner. L, I, N, D, N, E, R.", voice: "female", rate: "slow" },
      }),
      mcq("q6", en("When does she finish work today?"), [opt("a", "um 16:30 Uhr"), opt("b", "um 18:30 Uhr"), opt("c", "um 17:30 Uhr")], "c", {
        audio: { text: "Heute habe ich um halb sechs Feierabend.", voice: "female2", rate: "slow" },
      }),
    ],
    refs: [KAP7, GOETHE_HOEREN],
  },
  {
    slug: "m7-test-lesen",
    skill: "reading",
    title: { de: "Test: Lesen – eine E-Mail", en: "Test: reading – an e-mail" },
    instructions: en("Read the e-mail. Are the sentences true (richtig) or false (falsch)?"),
    passThreshold: 0.7,
    stimulus: {
      textKind: "email",
      text: de(
        "Liebe Kolleginnen und Kollegen,\n\nab Montag haben wir einen neuen Drucker. Er steht im Flur, neben dem Eingang. Der alte Drucker in Raum 8 ist kaputt. Bitte drucken Sie nicht zu viel!\n\nDie Besprechung am Freitag ist nicht in Raum 15, sie ist in der Kantine. Danach essen wir zusammen.\n\nViele Grüße\nNina Berger",
      ),
    },
    items: [
      tf("q1", "Der neue Drucker steht in Raum 8.", false),
      tf("q2", "Der neue Drucker steht neben dem Eingang.", true),
      tf("q3", "Der alte Drucker funktioniert nicht.", true),
      tf("q4", "Die Besprechung am Freitag ist in Raum 15.", false),
      tf("q5", "Nach der Besprechung essen die Kollegen zusammen.", true),
    ],
    refs: [KAP7, GOETHE_LESEN],
  },
  {
    slug: "m7-test-lesen-quellen",
    skill: "reading",
    title: { de: "Test: Lesen – a oder b?", en: "Test: reading – a or b?" },
    instructions: en("Read the situation and the two texts. Where do you find the information: a or b?"),
    passThreshold: 0.7,
    items: [
      mcq("q1", en("You need money on Sunday."), [
        opt("a", "Stadtbank Lindenau – Schalter: Montag bis Freitag 9–16 Uhr."),
        opt("b", "Geldautomat im Bahnhof: jeden Tag 0–24 Uhr."),
      ], "b"),
      mcq("q2", en("Your laptop is broken. You want help today, on Wednesday."), [
        opt("a", "Computer-Hilfe Schneider: Wir reparieren Laptops und Computer. Montag bis Freitag 9–18 Uhr."),
        opt("b", "Computer-Hilfe Schneider: Neue Laptops – billig! Nur am Samstag."),
      ], "a"),
      mcq("q3", en("You want to learn how to write good e-mails for work."), [
        opt("a", "Kurs „Excel für Anfänger“: Dienstag, 18–20 Uhr, Raum 5."),
        opt("b", "Kurs „E-Mails im Beruf“: Mittwoch, 18–20 Uhr, Raum 3."),
      ], "b"),
      mcq("q4", en("You want to print a document on Saturday."), [
        opt("a", "Copy-Shop Mayer: Drucken und Kopieren, Montag bis Samstag 8–20 Uhr."),
        opt("b", "Copy-Shop Mayer: Drucken und Kopieren, Montag bis Freitag 8–20 Uhr."),
      ], "a"),
    ],
    refs: [KAP7, GOETHE_LESEN],
  },
  {
    slug: "m7-test-schreiben",
    skill: "writing",
    title: { de: "Test: Schreiben – eine Antwort", en: "Test: writing – a reply" },
    instructions: en("You are Sara. Read Tom's message and complete your answer."),
    passThreshold: 0.7,
    stimulus: {
      textKind: "message",
      text: de("Hallo Sara,\nwir essen heute um 12 Uhr in der Kantine. Kommst du mit? Oder hast du viel zu tun?\nViele Grüße\nTom"),
    },
    items: [
      gap("q1", "Hallo Tom, ich komme gern,", "ich habe erst um 12:30 Uhr Zeit.", ["aber"], { prompt: en("but") }),
      gap("q2", "Ich esse gern mit", "Kollegen zusammen. (die, Plural)", ["den"]),
      gap("q3", "Ich bin jetzt", "Besprechung. (in + die)", ["in der"]),
      typed(
        "q4",
        [
          "Mein Computer ist auf dem Schreibtisch.",
          "Mein Computer steht auf dem Schreibtisch.",
          "Mein Computer liegt auf dem Schreibtisch.",
          "Auf dem Schreibtisch ist mein Computer.",
          "Auf dem Schreibtisch steht mein Computer.",
        ],
        { prompt: en("Write in German: My computer is on the desk.") },
      ),
      typed(
        "q5",
        ["Ich arbeite bei einer Bank.", "Ich arbeite in einer Bank.", "Ich arbeite bei der Bank.", "Ich arbeite in der Bank."],
        { prompt: en("Write in German: I work at a bank.") },
      ),
      typed("q6", ["Mit freundlichen Grüßen", "Freundliche Grüße", "Mit freundlichem Gruß"], { prompt: en("Write the formal closing of an e-mail.") }),
    ],
    refs: [KAP7, GOETHE_SCHREIBEN],
  },
  {
    slug: "m7-test-grammatik",
    skill: "grammar",
    title: { de: "Test: Grammatik", en: "Test: grammar" },
    instructions: en("Answer all questions."),
    passThreshold: 0.7,
    items: [
      mcq("q1", de("Ich komme mit … Bus."), [opt("a", "dem"), opt("b", "der"), opt("c", "den")], "a"),
      gap("q2", "Frau Klein ist", "Kantine. (in + die)", ["in der"]),
      gap("q3", "Ich schreibe", "Kollegin eine E-Mail. (meine)", ["meiner"]),
      mcq("q4", de("Mein Büro ist klein, … es ist sehr schön."), connectors, "c"),
      gap("q5", "Wir arbeiten", "Firma Brenner. (bei + die)", ["bei der"]),
      order("q6", ["Nimmst", "du", "Tee", "oder", "Kaffee", "?"], { alternatives: ["Nimmst du Kaffee oder Tee?"] }),
      mcq("q7", de("Das Telefon steht … Computer."), [opt("a", "neben der"), opt("b", "neben dem"), opt("c", "neben den")], "b"),
      gap("q8", "Der Kunde wartet", "Empfang. (an + dem)", ["am", "an dem"]),
    ],
    refs: [KAP7, GA(18), GA(33), GA(44)],
  },
  {
    slug: "m7-test-wortschatz",
    skill: "vocabulary",
    title: { de: "Test: Wortschatz", en: "Test: vocabulary" },
    instructions: en("Answer all questions."),
    passThreshold: 0.7,
    items: [
      mcq("q1", en("A greeting at lunchtime in a German office:"), [opt("a", "Gute Nacht!"), opt("b", "Mahlzeit!"), opt("c", "Feierabend!")], "b"),
      mcq("q2", en("You finish work for the day. You have …"), [opt("a", "Feierabend"), opt("b", "Besprechung"), opt("c", "Anhang")], "a"),
      typed("q3", ["der Drucker"], { prompt: en("Write the German word with its article: printer") }),
      mcq("q4", en("Where can you withdraw money?"), [opt("a", "am Empfang"), opt("b", "am Geldautomaten"), opt("c", "im Flur")], "b"),
      pairs("q5", [
        [de("das Büro"), en("office")],
        [de("die Kantine"), en("canteen")],
        [de("das Team"), en("team")],
        [de("der Raum"), en("room")],
        [de("das Internet"), en("internet")],
      ]),
      mcq("q6", en("A colleague asks „Wie geht's?“. You are very busy."), [opt("a", "Mit freundlichen Grüßen."), opt("b", "Kein Problem."), opt("c", "Gut, aber ich habe viel zu tun.")], "c"),
    ],
    refs: [KAP7],
  },
  {
    slug: "m7-test-sprechen",
    skill: "speaking",
    title: { de: "Test: Sprechen – Fragen zum Thema Arbeit", en: "Test: speaking – questions about work" },
    instructions: en(
      "Practise the second part of the A1 speaking exam: ask a question with the word on the card, then answer it. Speak for yourself; the model answer is only an example. This practice is not scored.",
    ),
    items: [
      speak("q1", "Ask a question with the card and answer it.", "Wo ist dein Büro? – Mein Büro ist in Raum 12.", { cue: de("Thema: Arbeit – Büro") }),
      speak("q2", "Ask a question with the card and answer it.", "Isst du mit deinen Kollegen in der Kantine? – Ja, ich esse oft mit meinen Kollegen in der Kantine.", {
        cue: de("Thema: Arbeit – Kollegen"),
      }),
      speak("q3", "Ask a question with the card and answer it.", "Wann hast du Feierabend? – Ich habe um fünf Uhr Feierabend.", { cue: de("Thema: Arbeit – Feierabend") }),
      speak("q4", "Say how you get to work.", "Ich fahre jeden Tag mit der U-Bahn.", { cue: de("Thema: Arbeit – mit …") }),
    ],
    refs: [KAP7, GOETHE_SPRECHEN],
  },
];

export const EXERCISES_BY_LESSON = { L1, L2, L3, L4, L5 };
export const EXERCISES = [...L1, ...L2, ...L3, ...L4, ...L5];
