// Module 10 exercises. All texts, dialogues and questions are original. Task *formats*
// follow the Goethe A1 structure documented in docs/REFERENCE-ANALYSIS.md (3-option MC,
// richtig/falsch, form filling, audio played twice, Sprechen Teil 2 question cards); no
// exam content is reproduced. Situation prompts are in English so beginners know what to
// do; the language being tested is always German.
// The Perfekt is receptive at A1: exercises only ask learners to recognise it, choose the
// right participle or auxiliary, or fill short gaps with the ten high-frequency verbs.

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
const KAP10 = { ref: "netzwerk-neu-a1-10", note: "Topic alignment only" };
const GA25 = { ref: "grammatik-aktiv-25", note: "Topic alignment only" };
const GA26 = { ref: "grammatik-aktiv-26", note: "Topic alignment only" };

const SPEAK_INSTRUCTIONS = en("Say your answer out loud. Then compare it with the model answer and rate yourself.");

// --- Lesson 1: Was hast du am Wochenende gemacht? ---------------------------------------------

const L1 = [
  {
    slug: "m10-partizip-erkennen",
    skill: "vocabulary",
    title: { de: "Infinitiv und Partizip II", en: "Infinitive and Partizip II" },
    instructions: en("Match each verb with its Partizip II."),
    items: [
      pairs("q1", [
        [de("machen"), de("gemacht")],
        [de("kaufen"), de("gekauft")],
        [de("essen"), de("gegessen")],
        [de("trinken"), de("getrunken")],
        [de("sehen"), de("gesehen")],
      ]),
      pairs("q2", [
        [de("lernen"), de("gelernt")],
        [de("lesen"), de("gelesen")],
        [de("schreiben"), de("geschrieben")],
        [de("arbeiten"), de("gearbeitet")],
        [de("telefonieren"), de("telefoniert")],
      ]),
    ],
    refs: [KAP10, GA26],
  },
  {
    slug: "m10-perfekt-haben-waehlen",
    skill: "grammar",
    title: { de: "Welches Wort passt?", en: "Which word fits?" },
    instructions: en("Choose the word that completes the sentence."),
    items: [
      mcq("q1", de("Ich habe gestern eine Pizza …"), [opt("a", "gegessen"), opt("b", "getrunken"), opt("c", "gelesen")], "a"),
      mcq("q2", de("Hast du den Film im Kino …?"), [opt("a", "gekauft"), opt("b", "gesehen"), opt("c", "getrunken")], "b"),
      mcq("q3", de("Wir haben am Samstag im Supermarkt Brot …"), [opt("a", "gelesen"), opt("b", "gearbeitet"), opt("c", "gekauft")], "c"),
      mcq("q4", de("Lena hat am Abend ein Buch …"), [opt("a", "gelesen"), opt("b", "gegessen"), opt("c", "telefoniert")], "a"),
      mcq("q5", de("Tom hat gestern eine lange E-Mail …"), [opt("a", "geschrieben"), opt("b", "getrunken"), opt("c", "gegessen")], "a"),
      mcq("q6", de("Hast du am Morgen einen Kaffee …?"), [opt("a", "gelernt"), opt("b", "getrunken"), opt("c", "gearbeitet")], "b"),
      mcq("q7", de("Frau Kaya hat gestern zehn Stunden im Büro …"), [opt("a", "gearbeitet"), opt("b", "gekauft"), opt("c", "gegessen")], "a"),
      mcq("q8", de("Wir haben im Kurs viele Wörter …"), [opt("a", "gelernt"), opt("b", "getrunken"), opt("c", "gearbeitet")], "a"),
      mcq("q9", de("Ich … gestern Pizza gegessen."), [opt("a", "habe"), opt("b", "hat"), opt("c", "haben")], "a", {
        explanation: en("haben is conjugated like in the present tense: ich habe, du hast, er hat."),
      }),
      mcq("q10", de("… du den Film gesehen?"), [opt("a", "Hast"), opt("b", "Habt"), opt("c", "Hat")], "a"),
    ],
    refs: [KAP10, GA26],
  },
  {
    slug: "m10-wochenende-hoeren",
    skill: "listening",
    title: { de: "Wie war dein Wochenende?", en: "Listening: How was your weekend?" },
    instructions: en("Listen to the conversation. You can play it twice. Then answer the questions."),
    stimulus: {
      textKind: "dialogue",
      audio: {
        lines: [
          { speaker: "Mia", text: "Hallo, Jan! Wie war dein Wochenende?", voice: "female", rate: "normal" },
          { speaker: "Jan", text: "Hallo, Mia! Super, danke. Am Samstag war ich mit meinem Bruder im Kino. Wir haben einen Film aus Spanien gesehen.", voice: "male", rate: "normal" },
          { speaker: "Mia", text: "Toll! Und am Sonntag?", voice: "female", rate: "normal" },
          { speaker: "Jan", text: "Am Sonntag habe ich nicht viel gemacht. Ich habe ein Buch gelesen und mit meiner Mutter telefoniert. Und du?", voice: "male", rate: "normal" },
          { speaker: "Mia", text: "Ich habe am Samstag gearbeitet, leider. Aber am Sonntag war ich in Hamburg. Dort habe ich mit Freunden Fisch gegessen.", voice: "female", rate: "normal" },
          { speaker: "Jan", text: "Oh, das klingt gut!", voice: "male", rate: "normal" },
        ],
      },
      maxPlays: 2,
      transcriptPolicy: "after_submit",
    },
    items: [
      mcq("q1", en("Where was Jan on Saturday?"), [opt("a", "im Kino"), opt("b", "in Hamburg"), opt("c", "im Büro")], "a"),
      tf("q2", "Jan hat am Sonntag ein Buch gelesen.", true),
      mcq("q3", en("What did Mia do on Saturday?"), [opt("a", "Sie hat gearbeitet."), opt("b", "Sie hat einen Film gesehen."), opt("c", "Sie hat telefoniert.")], "a"),
      mcq("q4", en("Where was Mia on Sunday?"), [opt("a", "im Kino"), opt("b", "in Hamburg"), opt("c", "zu Hause")], "b"),
      tf("q5", "Mia hat in Hamburg Pizza gegessen.", false, { explanation: en("She says „Fisch gegessen“ – she ate fish.") }),
    ],
    refs: [KAP10, GOETHE_HOEREN],
  },
  {
    slug: "m10-wochenende-sprechen",
    skill: "speaking",
    title: { de: "Fragen zum Wochenende", en: "Asking about the weekend" },
    instructions: SPEAK_INSTRUCTIONS,
    items: [
      speak("q1", "Ask a friend what they did at the weekend.", "Was hast du am Wochenende gemacht?"),
      speak("q2", "Answer: on Saturday you worked, on Sunday you read a book.", "Am Samstag habe ich gearbeitet. Am Sonntag habe ich ein Buch gelesen."),
      speak("q3", "You get a card with the topic and a word. Ask your partner a question with the word.", "Was hast du am Wochenende gegessen?", {
        cue: de("Thema: Wochenende – Essen"),
      }),
      speak("q4", "Answer the question „Was hast du gestern Abend gemacht?“.", "Gestern Abend habe ich einen Film gesehen."),
    ],
    refs: [KAP10, GOETHE_SPRECHEN],
  },
];

// --- Lesson 2: Schule und Studium ---------------------------------------------------------------

const L2 = [
  {
    slug: "m10-partizip-bilden",
    skill: "grammar",
    title: { de: "Das Partizip II schreiben", en: "Write the Partizip II" },
    instructions: en("Write the Partizip II of the verb in brackets."),
    items: [
      gap("q1", "Ich habe am Wochenende viel Deutsch", ". (lernen)", ["gelernt"]),
      gap("q2", "Was hast du gestern", "? (machen)", ["gemacht"]),
      gap("q3", "Paul hat drei Jahre in Wien", ". (arbeiten)", ["gearbeitet"], {
        explanation: en("The stem arbeit- ends in -t, so the ending is -et: gearbeitet."),
      }),
      gap("q4", "Wir haben gestern eine Stunde", ". (telefonieren)", ["telefoniert"], {
        explanation: en("Verbs in -ieren have no ge-: telefoniert."),
      }),
      gap("q5", "Hast du die E-Mail von Frau Lang", "? (lesen)", ["gelesen"]),
      gap("q6", "Ich habe im Sprachkurs einen Test", ". (schreiben)", ["geschrieben"]),
      gap("q7", "Ich habe in der Pause ein Brötchen", ". (essen)", ["gegessen"]),
      gap("q8", "Für die Party haben wir Getränke", ". (kaufen)", ["gekauft"]),
    ],
    refs: [KAP10, GA26],
  },
  {
    slug: "m10-schule-woerter",
    skill: "vocabulary",
    title: { de: "Schule und Studium", en: "School and studies" },
    instructions: en("Answer the questions about school and studies."),
    items: [
      pairs("q1", [
        [de("die Schulzeit"), en("school days")],
        [de("die Universität"), en("university")],
        [de("die Prüfung"), en("exam")],
        [de("das Fach"), en("subject")],
        [de("das Zeugnis"), en("school report")],
        [de("das Praktikum"), en("internship")],
      ]),
      mcq("q2", en("In Germany, which exam do you usually need to study at a university?"), [opt("a", "das Abitur"), opt("b", "das Praktikum"), opt("c", "der Sprachkurs")], "a"),
      mcq(
        "q3",
        en("You learn a job for three years – in a company and at a vocational school. What is that?"),
        [opt("a", "die Ausbildung"), opt("b", "das Studium"), opt("c", "die Prüfung")],
        "a",
      ),
      mcq("q4", de("Mein Bruder ist Student. Er … Medizin in Leipzig."), [opt("a", "studiert"), opt("b", "geht"), opt("c", "trinkt")], "a"),
      mcq("q5", en("What is „der Sprachkurs“ in English?"), [optEn("a", "language course"), optEn("b", "subject"), optEn("c", "university")], "a"),
    ],
    refs: [KAP10],
  },
  {
    slug: "m10-lebenslauf-lesen",
    skill: "reading",
    title: { de: "Nadia erzählt", en: "Nadia's story" },
    instructions: en("Read the text. Are the sentences true (richtig) or false (falsch)? Then answer the last question."),
    stimulus: {
      textKind: "profile",
      text: de(
        "Hallo, ich heiße Nadia Rahman und ich komme aus Bangladesch. In Dhaka war ich zwölf Jahre in der Schule. Mein Lieblingsfach war Mathe. Danach habe ich an der Universität Dhaka Informatik studiert. Das Studium war schwer, aber sehr interessant. Ich habe auch ein Praktikum in einer Firma gemacht.\nVor einem Jahr war ich noch in Dhaka. Jetzt wohne ich in Köln und mache einen Sprachkurs. Letzte Woche habe ich eine Prüfung geschrieben. Ich habe schon das Zeugnis: „gut“! Jetzt suche ich eine Stelle als Informatikerin.",
      ),
    },
    items: [
      tf("q1", "Nadia war zwölf Jahre in der Schule.", true),
      tf("q2", "Nadia hat in Köln studiert.", false, { explanation: en("She studied at the University of Dhaka.") }),
      tf("q3", "Nadia hat ein Praktikum gemacht.", true),
      tf("q4", "Vor einem Jahr war Nadia schon in Köln.", false),
      tf("q5", "Nadia hat letzte Woche eine Prüfung geschrieben.", true),
      mcq("q6", en("What is Nadia looking for now?"), [opt("a", "eine Stelle"), opt("b", "einen Sprachkurs"), opt("c", "eine Universität")], "a"),
    ],
    refs: [KAP10, GOETHE_LESEN],
  },
];

// --- Lesson 3: Ich suche eine Stelle ------------------------------------------------------------

const L3 = [
  {
    slug: "m10-jobsuche-woerter",
    skill: "vocabulary",
    title: { de: "Wörter für die Jobsuche", en: "Job-search words" },
    instructions: en("Match the words and answer the questions."),
    items: [
      pairs("q1", [
        [de("die Stellenanzeige"), en("job ad")],
        [de("die Bewerbung"), en("application")],
        [de("der Lebenslauf"), en("CV")],
        [de("die Erfahrung"), en("experience")],
        [de("die Teilzeit"), en("part-time")],
        [de("die Vollzeit"), en("full-time")],
      ]),
      mcq(
        "q2",
        en("You read „Kellner gesucht!“ in a café window. What does it mean?"),
        [optEn("a", "The café is looking for a waiter."), optEn("b", "A waiter is looking for a job."), optEn("c", "The café is closed.")],
        "a",
      ),
      mcq("q3", de("Die Arbeitszeiten sind nicht jede Woche gleich. Sie sind …"), [opt("a", "flexibel"), opt("b", "besetzt"), opt("c", "gesucht")], "a"),
    ],
    refs: [KAP10],
  },
  {
    slug: "m10-haben-oder-sein",
    skill: "grammar",
    title: { de: "haben oder sein?", en: "haben or sein?" },
    instructions: en("Choose haben or sein. Remember: fahren, gehen and kommen go with sein."),
    items: [
      mcq("q1", de("Ich … gestern nach Berlin gefahren."), [opt("a", "habe"), opt("b", "bin")], "b"),
      mcq("q2", de("Wir … im Restaurant Fisch gegessen."), [opt("a", "haben"), opt("b", "sind")], "a"),
      mcq("q3", de("… du am Samstag ins Kino gegangen?"), [opt("a", "Hast"), opt("b", "Bist")], "b"),
      mcq("q4", de("Frau Lang … eine Bewerbung geschrieben."), [opt("a", "hat"), opt("b", "ist")], "a"),
      mcq("q5", de("Wann … Tom nach Hause gekommen?"), [opt("a", "hat"), opt("b", "ist")], "b"),
      mcq("q6", de("Ich … die Stellenanzeige im Internet gelesen."), [opt("a", "habe"), opt("b", "bin")], "a"),
      mcq("q7", de("Ihr … mit dem Bus gefahren."), [opt("a", "habt"), opt("b", "seid")], "b"),
      mcq("q8", de("Sie … drei Jahre als Kellnerin gearbeitet."), [opt("a", "hat"), opt("b", "ist")], "a"),
    ],
    refs: [KAP10],
  },
  {
    slug: "m10-stellenanzeige-lesen",
    skill: "reading",
    title: { de: "Eine Stellenanzeige", en: "A job ad" },
    instructions: en("Read the job ad. Answer the questions."),
    stimulus: {
      textKind: "ad",
      text: de(
        "Café Sonnenblick, Freiburg\nKellner/Kellnerin gesucht!\n\nWir suchen ab 1. Juni eine Kellnerin oder einen Kellner.\nTeilzeit: 20 Stunden pro Woche. Die Arbeitszeiten sind flexibel, auch am Wochenende.\nSie haben Erfahrung im Café oder Restaurant und sprechen gut Deutsch.\n\nBitte schicken Sie Ihre Bewerbung mit Lebenslauf per E-Mail an: jobs.sonnenblick@beispiel.de\nFragen? Rufen Sie Frau Albers an: 0761 55 83 20.",
      ),
    },
    items: [
      tf("q1", "Das Café sucht eine Person für Vollzeit.", false, { explanation: en("The ad says Teilzeit: 20 hours a week.") }),
      tf("q2", "Die Arbeitszeiten sind flexibel.", true),
      mcq("q3", en("What do applicants need?"), [opt("a", "Erfahrung im Café oder Restaurant"), opt("b", "ein Studium"), opt("c", "ein Auto")], "a"),
      mcq("q4", en("How do you send your application?"), [opt("a", "per E-Mail"), opt("b", "am Telefon"), opt("c", "im Café")], "a"),
      tf("q5", "Bei Fragen kann man Frau Albers anrufen.", true),
      mcq("q6", en("When does the job start?"), [opt("a", "am 1. Juni"), opt("b", "am 1. Juli"), opt("c", "am Wochenende")], "a"),
    ],
    refs: [KAP10, GOETHE_LESEN],
  },
  {
    slug: "m10-bewerbung-schreiben",
    skill: "writing",
    title: { de: "Eine kurze Bewerbung", en: "A short application" },
    instructions: en("Ahmed answers the ad from Café Sonnenblick. Complete his e-mail with the words from the box."),
    stimulus: {
      textKind: "email",
      text: de("Wörter: Stellenanzeige – gearbeitet – Erfahrung – Teilzeit – Lebenslauf"),
    },
    items: [
      gap("q1", "Sehr geehrte Frau Albers, ich habe Ihre", "im Internet gelesen.", ["Stellenanzeige", "Anzeige"]),
      gap("q2", "Ich habe zwei Jahre in einem Restaurant in Kairo", ".", ["gearbeitet"]),
      gap("q3", "Ich habe also", "als Kellner.", ["Erfahrung"]),
      gap("q4", "Ich möchte gern in", "arbeiten, 20 Stunden pro Woche.", ["Teilzeit"]),
      gap("q5", "Meinen", "schicke ich auch mit.", ["Lebenslauf"]),
    ],
    refs: [KAP10, GOETHE_SCHREIBEN],
  },
];

// --- Lesson 4: Am Telefon ---------------------------------------------------------------------

const L4 = [
  {
    slug: "m10-war-hatte",
    skill: "grammar",
    title: { de: "war oder hatte?", en: "war or hatte?" },
    instructions: en("Write the correct form of sein or haben in the simple past (war, hatte …)."),
    items: [
      gap("q1", "Gestern", "ich krank. (sein)", ["war"]),
      gap("q2", "", "du am Wochenende in Berlin? (sein)", ["Warst"]),
      gap("q3", "Letzte Woche", "wir eine Prüfung. (haben)", ["hatten"]),
      gap("q4", "Herr Kaya", "gestern keine Zeit. (haben)", ["hatte"]),
      gap("q5", "Wie", "dein Wochenende? (sein)", ["war"]),
      gap("q6", "", "ihr gestern im Büro? (sein)", ["Wart"]),
      gap("q7", "Ich", "am Montag viel Arbeit. (haben)", ["hatte"]),
      gap("q8", "Du", "gestern Geburtstag, oder? (haben)", ["hattest"]),
    ],
    refs: [KAP10, GA25],
  },
  {
    slug: "m10-telefon-phrasen",
    skill: "vocabulary",
    title: { de: "Was sagen Sie am Telefon?", en: "What do you say on the phone?" },
    instructions: en("Choose the right sentence for each situation."),
    items: [
      mcq("q1", en("You call a company. How do you start?"), [opt("a", "Guten Tag, hier spricht Ali Demir."), opt("b", "Auf Wiederhören!"), opt("c", "Ich verbinde Sie.")], "a"),
      mcq("q2", en("You want to talk to Ms Kaya."), [opt("a", "Kann ich bitte Frau Kaya sprechen?"), opt("b", "Die Nummer ist besetzt."), opt("c", "Hier spricht Frau Kaya.")], "a"),
      mcq("q3", en("The receptionist puts you through to Ms Kaya."), [opt("a", "Einen Moment, ich verbinde Sie."), opt("b", "Kann ich etwas ausrichten?"), opt("c", "Hier spricht Frau Kaya.")], "a"),
      mcq("q4", en("Ms Kaya isn't in the office. The receptionist offers to take a message."), [
        opt("a", "Kann ich etwas ausrichten?"),
        opt("b", "Können Sie mich zurückrufen?"),
        opt("c", "Die Nummer ist besetzt."),
      ], "a"),
      mcq("q5", en("You want Ms Kaya to call you back."), [opt("a", "Sie ist nicht da."), opt("b", "Kann sie mich bitte zurückrufen?"), opt("c", "Ich verbinde Sie.")], "b"),
      mcq("q6", en("You end the phone call politely."), [opt("a", "Auf Wiederhören!"), opt("b", "Guten Tag!"), opt("c", "Hier spricht …")], "a"),
      mcq("q7", en("You call, but someone else is already on the line."), [opt("a", "Die Nummer ist besetzt."), opt("b", "Die Nummer ist flexibel."), opt("c", "Die Nummer ist gesucht.")], "a"),
    ],
    refs: [KAP10],
  },
  {
    slug: "m10-telefon-saetze",
    skill: "grammar",
    title: { de: "Sätze am Telefon", en: "Phone sentences" },
    instructions: en("Put the words in the right order."),
    items: [
      order("q1", ["Kann", "ich", "bitte", "Frau", "Kaya", "sprechen", "?"], { alternatives: ["Kann ich Frau Kaya bitte sprechen?"] }),
      order("q2", ["Können", "Sie", "mich", "bitte", "zurückrufen", "?"]),
      order("q3", ["Ich", "rufe", "morgen", "zurück", "."], { alternatives: ["Morgen rufe ich zurück."] }),
      order("q4", ["Frau", "Kaya", "ist", "heute", "nicht", "da", "."], { alternatives: ["Heute ist Frau Kaya nicht da."] }),
      order("q5", ["Ich", "habe", "gestern", "lange", "telefoniert", "."], { alternatives: ["Gestern habe ich lange telefoniert."] }),
    ],
    refs: [KAP10],
  },
  {
    slug: "m10-telefon-hoeren",
    skill: "listening",
    title: { de: "Ein Anruf im Hotel", en: "Listening: a phone call to a hotel" },
    instructions: en("Listen to the phone call. You can play it twice. Then answer the questions."),
    stimulus: {
      textKind: "dialogue",
      audio: {
        lines: [
          { speaker: "Sabine Groß", text: "Hotel Seeblick, guten Tag! Sie sprechen mit Sabine Groß.", voice: "female2", rate: "normal" },
          {
            speaker: "Karim Aziz",
            text: "Guten Tag, hier spricht Karim Aziz. Ich habe gestern Ihre Stellenanzeige gelesen. Kann ich bitte Frau Lorenz sprechen?",
            voice: "male",
            rate: "normal",
          },
          { speaker: "Sabine Groß", text: "Frau Lorenz ist leider nicht da. Sie ist heute in Berlin. Kann ich etwas ausrichten?", voice: "female2", rate: "normal" },
          { speaker: "Karim Aziz", text: "Ja, gern. Kann sie mich bitte morgen zurückrufen? Meine Nummer ist null, eins, fünf, eins – zweiundvierzig – siebenundsechzig – dreiundneunzig.", voice: "male", rate: "normal" },
          { speaker: "Sabine Groß", text: "Also: null, eins, fünf, eins – zweiundvierzig – siebenundsechzig – dreiundneunzig. Richtig?", voice: "female2", rate: "normal" },
          { speaker: "Karim Aziz", text: "Ja, genau. Vielen Dank!", voice: "male", rate: "normal" },
          { speaker: "Sabine Groß", text: "Gern. Auf Wiederhören, Herr Aziz!", voice: "female2", rate: "normal" },
        ],
      },
      maxPlays: 2,
      transcriptPolicy: "after_submit",
    },
    items: [
      mcq("q1", en("Why is Karim calling?"), [opt("a", "Er hat eine Stellenanzeige gelesen."), opt("b", "Er möchte ein Zimmer."), opt("c", "Er ist krank.")], "a"),
      tf("q2", "Frau Lorenz ist heute im Hotel.", false, { explanation: en("She is in Berlin today.") }),
      mcq("q3", en("What does Karim want?"), [opt("a", "Frau Lorenz soll ihn morgen zurückrufen."), opt("b", "Er ruft morgen wieder an."), opt("c", "Er schreibt eine E-Mail.")], "a"),
      mcq("q4", en("What is Karim's number?"), [opt("a", "0151 42 67 93"), opt("b", "0151 24 76 93"), opt("c", "0151 42 76 39")], "a"),
    ],
    refs: [KAP10, GOETHE_HOEREN],
  },
];

// --- Lesson 5: Modultest -------------------------------------------------------------------------

const L5 = [
  {
    slug: "m10-test-hoeren",
    skill: "listening",
    title: { de: "Test: Hören", en: "Test: listening" },
    instructions: en("Listen to each recording. You can play each one twice. Choose the right answer."),
    itemAudioMaxPlays: 2,
    passThreshold: 0.7,
    items: [
      mcq("q1", en("How did she travel to Munich?"), [opt("a", "mit dem Auto"), opt("b", "mit dem Zug"), opt("c", "mit dem Bus")], "b", {
        audio: { text: "Hallo, Sven! Am Wochenende war ich in München. Ich bin mit dem Zug gefahren. Das war schön!", voice: "female", rate: "normal" },
      }),
      mcq("q2", en("What did he do yesterday evening?"), [opt("a", "Er hat einen Film gesehen."), opt("b", "Er hat ein Buch gekauft."), opt("c", "Er hat gearbeitet.")], "a", {
        audio: { text: "Gestern habe ich nicht viel gemacht. Am Nachmittag habe ich ein Buch gelesen und am Abend habe ich einen Film gesehen.", voice: "male", rate: "normal" },
      }),
      mcq("q3", en("When is the exam?"), [opt("a", "am Montag"), opt("b", "am Mittwoch"), opt("c", "am Freitag")], "b", {
        audio: {
          text: "Guten Tag, hier spricht Petra Lange von der Sprachschule Mondo. Ihre Prüfung ist nicht am Montag. Sie ist am Mittwoch um neun Uhr.",
          voice: "female2",
          rate: "normal",
        },
      }),
      mcq("q4", en("What is Mr Kern's number?"), [opt("a", "0176 33 18 50"), opt("b", "0176 33 80 15"), opt("c", "0167 33 18 50")], "a", {
        audio: {
          text: "Hallo, Frau Weiß, hier spricht Tobias Kern. Ich habe Ihre E-Mail gelesen. Bitte rufen Sie mich zurück: null, eins, sieben, sechs – dreiunddreißig – achtzehn – fünfzig.",
          voice: "male2",
          rate: "normal",
        },
      }),
      mcq("q5", en("What kind of job is she looking for?"), [opt("a", "eine Stelle in Teilzeit"), opt("b", "eine Stelle in Vollzeit"), opt("c", "ein Praktikum")], "a", {
        audio: { text: "Ich habe drei Jahre in einem Hotel gearbeitet. Jetzt habe ich zwei Kinder und suche eine Stelle in Teilzeit.", voice: "female", rate: "normal" },
      }),
      mcq("q6", en("What did his wife eat?"), [opt("a", "Fisch"), opt("b", "Pizza"), opt("c", "Suppe")], "b", {
        audio: { text: "Am Samstag haben wir im Restaurant gegessen. Ich habe Fisch gegessen und meine Frau hat Pizza gegessen.", voice: "male", rate: "normal" },
      }),
    ],
    refs: [KAP10, GOETHE_HOEREN],
  },
  {
    slug: "m10-test-lesen",
    skill: "reading",
    title: { de: "Test: Lesen", en: "Test: reading" },
    instructions: en("Read the e-mail. Answer the questions."),
    passThreshold: 0.7,
    stimulus: {
      textKind: "email",
      text: de(
        "Liebe Anna,\n\nwie war dein Wochenende? Mein Wochenende war sehr voll! Am Samstag hatte ich eine Prüfung im Deutschkurs. Ich habe zwei Stunden geschrieben – puh! Danach bin ich mit Lukas in die Stadt gegangen. Wir haben Kaffee getrunken und ich habe eine Jacke gekauft.\nAm Sonntag war ich zu Hause. Ich habe eine Stellenanzeige gelesen: Ein Kindergarten in Bremen sucht eine Erzieherin in Teilzeit. Ich habe gleich eine Bewerbung geschrieben!\n\nUnd was hast du gemacht? Ruf mich mal an!\n\nLiebe Grüße\nMarta",
      ),
    },
    items: [
      tf("q1", "Marta hatte am Samstag eine Prüfung.", true),
      tf("q2", "Marta ist am Samstag mit Lukas in die Stadt gegangen.", true),
      tf("q3", "Marta hat am Sonntag gearbeitet.", false, { explanation: en("On Sunday she was at home.") }),
      mcq("q4", en("What did Marta buy?"), [opt("a", "ein Buch"), opt("b", "eine Jacke"), opt("c", "ein Handy")], "b"),
      tf("q5", "Die Stelle im Kindergarten ist in Teilzeit.", true),
      tf("q6", "Marta hat noch keine Bewerbung geschrieben.", false),
      tf("q7", "Anna soll Marta anrufen.", true),
    ],
    refs: [KAP10, GOETHE_LESEN],
  },
  {
    slug: "m10-test-formular",
    skill: "writing",
    title: { de: "Test: Ein Formular ausfüllen", en: "Test: fill in a form" },
    instructions: en("Read about Tomasz. He is registering with a job agency. Fill in the form for him."),
    passThreshold: 0.7,
    stimulus: {
      textKind: "form",
      text: de(
        "Das ist Tomasz Nowak. Er kommt aus Polen und wohnt jetzt in Dresden. Er ist Koch. In Krakau hat er zwei Jahre in einem Restaurant gearbeitet. Jetzt sucht er eine Stelle in Vollzeit. Seine Handynummer ist 0152 61 34 70.",
      ),
    },
    items: [
      typed("q1", ["Tomasz"], { label: "Vorname" }),
      typed("q2", ["Nowak"], { label: "Familienname" }),
      typed("q3", ["Dresden"], { label: "Wohnort" }),
      typed("q4", ["Koch"], { label: "Beruf" }),
      typed("q5", ["2", "zwei", "2 Jahre", "zwei Jahre"], { label: "Berufserfahrung (Jahre)" }),
      typed("q6", ["Vollzeit", "in Vollzeit"], { label: "Teilzeit oder Vollzeit?" }),
      typed("q7", ["0152 61 34 70"], { label: "Telefon", ignoreSpaces: true, inputMode: "numeric" }),
    ],
    refs: [KAP10, GOETHE_SCHREIBEN],
  },
  {
    slug: "m10-test-grammatik",
    skill: "grammar",
    title: { de: "Test: Grammatik", en: "Test: grammar" },
    instructions: en("Answer all questions."),
    passThreshold: 0.7,
    items: [
      mcq("q1", de("Ich habe gestern Tee …"), [opt("a", "getrunken"), opt("b", "gelesen"), opt("c", "gefahren")], "a"),
      mcq("q2", de("Wir … am Samstag ins Kino gegangen."), [opt("a", "haben"), opt("b", "sind"), opt("c", "hat")], "b"),
      gap("q3", "Hast du die E-Mail", "? (lesen)", ["gelesen"]),
      gap("q4", "Ich habe drei Stunden", ". (arbeiten)", ["gearbeitet"]),
      gap("q5", "Gestern", "ich keine Zeit. (haben)", ["hatte"]),
      gap("q6", "Wie", "das Wochenende? (sein)", ["war"]),
      mcq("q7", de("Was … du am Wochenende gemacht?"), [opt("a", "hast"), opt("b", "bist"), opt("c", "hat")], "a"),
      mcq("q8", en("Which is the Partizip II of telefonieren?"), [opt("a", "getelefoniert"), opt("b", "telefoniert"), opt("c", "getelefonieren")], "b"),
    ],
    refs: [KAP10, GA25, GA26],
  },
  {
    slug: "m10-test-wortschatz",
    skill: "vocabulary",
    title: { de: "Test: Wortschatz", en: "Test: vocabulary" },
    instructions: en("Answer all questions."),
    passThreshold: 0.7,
    items: [
      mcq("q1", en("What does „vorgestern“ mean?"), [optEn("a", "the day before yesterday"), optEn("b", "yesterday"), optEn("c", "tomorrow")], "a"),
      mcq("q2", en("You end a phone call. What do you say?"), [opt("a", "Auf Wiederhören!"), opt("b", "Gute Nacht!"), opt("c", "Guten Tag!")], "a"),
      typed("q3", ["der Lebenslauf", "Lebenslauf"], { prompt: en("Write the German word for „CV, résumé“.") }),
      pairs("q4", [
        [de("die Prüfung"), en("exam")],
        [de("das Fach"), en("subject")],
        [de("die Stelle"), en("job, position")],
        [de("die Erfahrung"), en("experience")],
        [de("die Mailbox"), en("voicemail")],
      ]),
      mcq(
        "q5",
        en("A student works in a company for six weeks to get to know the job. That is …"),
        [opt("a", "ein Praktikum"), opt("b", "ein Abitur"), opt("c", "ein Zeugnis")],
        "a",
      ),
      mcq("q6", en("What does „Kann ich etwas ausrichten?“ mean?"), [optEn("a", "Can I take a message?"), optEn("b", "Can I call you back?"), optEn("c", "Can I speak to …?")], "a"),
    ],
    refs: [KAP10],
  },
  {
    slug: "m10-test-sprechen",
    skill: "speaking",
    title: { de: "Test: Sprechen – Fragen und Antworten", en: "Test: speaking – questions and answers" },
    instructions: en(
      "Practise the second part of the A1 speaking exam: ask a question with the card, then answer your partner's question. Speak for yourself; the model answer is only an example. This practice is not scored.",
    ),
    items: [
      speak("q1", "Ask your partner a question with the word card.", "Was hast du am Samstag gemacht?", { cue: de("Thema: Wochenende – Samstag") }),
      speak("q2", "Your partner asks: „Was hast du am Samstag gemacht?“ Answer.", "Am Samstag habe ich Deutsch gelernt und mit meiner Schwester telefoniert."),
      speak("q3", "Ask your partner a question with the word card.", "Wo hast du gearbeitet?", { cue: de("Thema: Studium und Beruf – Arbeit") }),
      speak("q4", "Answer: you worked in a hotel for two years.", "Ich habe zwei Jahre in einem Hotel gearbeitet."),
      speak("q5", "Ask your partner a question with the word card.", "Bist du am Wochenende ins Kino gegangen?", { cue: de("Thema: Wochenende – Kino") }),
    ],
    refs: [KAP10, GOETHE_SPRECHEN],
  },
];

export const EXERCISES_BY_LESSON = { L1, L2, L3, L4, L5 };
export const EXERCISES = [...L1, ...L2, ...L3, ...L4, ...L5];
