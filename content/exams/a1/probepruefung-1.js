// A1 practice exam 1 ("Probeprüfung A1 – Nr. 1"). Pure data.
//
// All texts, dialogues, announcements, messages, ads, signs and questions are original
// and were drafted with AI assistance (sourceType "ai_generated"), so everything is
// seeded as draft/unpublished and must be reviewed by a person. Only the task *formats*
// follow Goethe-Zertifikat A1: Start Deutsch 1 as documented in docs/REFERENCE-ANALYSIS.md
// §1 (Hören Teil 1–3, Lesen Teil 1–3, Schreiben Teil 1). No exam content is reproduced.
// Sprechen and Schreiben Teil 2 are left out because they cannot be scored automatically.
//
// Situation prompts and instructions are in English; the tested language is German.

const de = (s) => ({ de: s });
const en = (s) => ({ en: s });
const opt = (id, text) => ({ id, text: de(text) });
const withExtra = (item, extra) => ({ ...item, ...Object.fromEntries(Object.entries(extra).filter(([, v]) => v !== undefined)) });

const mcq = (id, prompt, options, answer, extra = {}) => withExtra({ id, type: "mcq", prompt, options, answer }, extra);
const tf = (id, statement, answer, extra = {}) => withExtra({ id, type: "true_false", statement: de(statement), answer }, extra);
const typed = (id, accepted, extra = {}) => withExtra({ id, type: "text_input", accepted }, extra);

const GOETHE_HOEREN = { ref: "goethe-start-deutsch-1-hoeren", note: "Task format only" };
const GOETHE_LESEN = { ref: "goethe-start-deutsch-1-lesen", note: "Task format only" };
const GOETHE_SCHREIBEN = { ref: "goethe-start-deutsch-1-schreiben", note: "Task format only" };

const line = (speaker, text, voice) => ({ speaker, text, voice, rate: "normal" });
const say = (text, voice) => ({ text, voice, rate: "normal" });

// --- Hören Teil 1: six short dialogues, 3-option MC, played twice --------------------------

const dialogue = (n, title, lines, question) => ({
  slug: `a1-pp1-hoeren-1-${n}`,
  skill: "listening",
  title,
  instructions: en("Listen to the short conversation. You will hear it twice. Choose the right answer: a, b or c."),
  stimulus: { textKind: "dialogue", audio: { lines }, maxPlays: 2, transcriptPolicy: "after_submit" },
  items: [question],
  refs: [GOETHE_HOEREN],
});

const HOEREN_1 = [
  dialogue(
    1,
    { de: "Hören Teil 1 – Beispiel 1: In der Bäckerei", en: "Listening part 1 – 1: at the bakery" },
    [
      line("Kundin", "Guten Morgen! Ich hätte gern vier Brötchen und ein Brot, bitte.", "female"),
      line("Verkäufer", "Gern. Die vier Brötchen kosten zwei Euro und das Brot kostet drei Euro zwanzig.", "male"),
      line("Kundin", "Dann bezahle ich fünf Euro zwanzig, richtig?", "female"),
      line("Verkäufer", "Ja, genau. Vielen Dank und einen schönen Tag!", "male"),
    ],
    mcq("q1", en("How much does the woman pay?"), [opt("a", "3,20 €"), opt("b", "5,20 €"), opt("c", "2,00 €")], "b"),
  ),
  dialogue(
    2,
    { de: "Hören Teil 1 – Beispiel 2: Ein Termin beim Arzt", en: "Listening part 1 – 2: a doctor's appointment" },
    [
      line("Praxis", "Praxis Dr. Albers, guten Tag.", "female2"),
      line("Herr Petersen", "Guten Tag, hier ist Jan Petersen. Ich habe Halsschmerzen und brauche einen Termin.", "male"),
      line("Praxis", "Können Sie heute um halb elf kommen?", "female2"),
      line("Herr Petersen", "Um halb elf? Ja, das geht. Vielen Dank!", "male"),
    ],
    mcq("q1", en("When is the appointment?"), [opt("a", "um 10:30 Uhr"), opt("b", "um 11:30 Uhr"), opt("c", "um 11:00 Uhr")], "a", {
      explanation: en("„halb elf“ means half an hour before eleven: 10:30."),
    }),
  ),
  dialogue(
    3,
    { de: "Hören Teil 1 – Beispiel 3: Wo ist die Post?", en: "Listening part 1 – 3: where is the post office?" },
    [
      line("Frau", "Entschuldigung, ist die Post hier neben der Bank?", "female"),
      line("Mann", "Nein, die Bank ist am Bahnhof. Die Post ist in der zweiten Straße links, neben dem Supermarkt.", "male2"),
      line("Frau", "Neben dem Supermarkt. Danke schön!", "female"),
    ],
    mcq("q1", en("Where is the post office?"), [opt("a", "neben der Bank"), opt("b", "am Bahnhof"), opt("c", "neben dem Supermarkt")], "c"),
  ),
  dialogue(
    4,
    { de: "Hören Teil 1 – Beispiel 4: Ins Kino", en: "Listening part 1 – 4: going to the cinema" },
    [
      line("Timo", "Hallo Sara! Hast du am Freitag Zeit? Wir gehen ins Kino.", "male"),
      line("Sara", "Freitag geht leider nicht, da arbeite ich bis zehn Uhr. Aber am Samstag habe ich Zeit.", "female2"),
      line("Timo", "Okay, dann gehen wir am Samstag. Sonntag ist ja auch schlecht für mich.", "male"),
    ],
    mcq("q1", en("When do they go to the cinema?"), [opt("a", "am Freitag"), opt("b", "am Samstag"), opt("c", "am Sonntag")], "b"),
  ),
  dialogue(
    5,
    { de: "Hören Teil 1 – Beispiel 5: Eine neue Jacke", en: "Listening part 1 – 5: a new jacket" },
    [
      line("Verkäuferin", "Guten Tag! Kann ich Ihnen helfen?", "female"),
      line("Kunde", "Ja, ich suche eine Jacke. Die blaue hier ist schön, aber zu klein. Haben Sie die auch in Größe 52?", "male2"),
      line("Verkäuferin", "In Blau leider nicht. In Größe 52 habe ich sie nur in Schwarz.", "female"),
      line("Kunde", "Schwarz ist auch gut. Dann nehme ich die schwarze Jacke.", "male2"),
    ],
    mcq("q1", en("Which jacket does the man buy?"), [opt("a", "eine blaue Jacke"), opt("b", "eine schwarze Jacke"), opt("c", "eine graue Jacke")], "b"),
  ),
  dialogue(
    6,
    { de: "Hören Teil 1 – Beispiel 6: Die neue Wohnung", en: "Listening part 1 – 6: the new flat" },
    [
      line("Anja", "Und, Tobias, wie ist deine neue Wohnung?", "female2"),
      line("Tobias", "Super! Sie hat zwei Zimmer, eine Küche, ein Bad und einen kleinen Balkon.", "male"),
      line("Anja", "Nur zwei Zimmer?", "female2"),
      line("Tobias", "Ja, aber die Zimmer sind sehr groß.", "male"),
    ],
    mcq("q1", en("How many rooms does Tobias's flat have (without kitchen and bathroom)?"), [opt("a", "zwei Zimmer"), opt("b", "drei Zimmer"), opt("c", "vier Zimmer")], "a"),
  ),
];

// --- Hören Teil 2: four public announcements, richtig/falsch, played once ----------------

const HOEREN_2 = {
  slug: "a1-pp1-hoeren-2-durchsagen",
  skill: "listening",
  title: { de: "Hören Teil 2: Durchsagen", en: "Listening part 2: announcements" },
  instructions: en("Listen to the announcements. You will hear each one only once. Are the sentences true (richtig) or false (falsch)?"),
  itemAudioMaxPlays: 1,
  items: [
    tf("q1", "Der Zug nach Kassel fährt pünktlich ab.", false, {
      prompt: en("At the station"),
      audio: say(
        "Achtung an Gleis vier. Der Regionalexpress nach Kassel, Abfahrt vierzehn Uhr zwölf, hat heute zwanzig Minuten Verspätung. Wir bitten um Entschuldigung.",
        "female",
      ),
    }),
    tf("q2", "Der Flug nach Wien startet von Ausgang A 5.", false, {
      prompt: en("At the airport"),
      audio: say(
        "Liebe Fluggäste, eine Information zum Flug nach Wien: Der Flug startet heute nicht von Ausgang A fünf, sondern von Ausgang B zwölf. Bitte gehen Sie jetzt zu Ausgang B zwölf.",
        "male",
      ),
    }),
    tf("q3", "Ein Kilo Tomaten kostet heute 1,99 €.", true, {
      prompt: en("In the supermarket"),
      audio: say(
        "Liebe Kundinnen und Kunden, heute im Angebot: ein Kilo Tomaten für nur einen Euro neunundneunzig. Sie finden die Tomaten am Eingang bei Obst und Gemüse.",
        "female2",
      ),
    }),
    tf("q4", "Die Kinderschuhe sind heute billiger.", true, {
      prompt: en("In the department store"),
      audio: say(
        "Liebe Kundinnen und Kunden, heute ist Kinderschuh-Tag! Alle Kinderschuhe sind heute zwanzig Prozent billiger. Sie finden die Kinderschuhe im zweiten Stock.",
        "male2",
      ),
    }),
  ],
  refs: [GOETHE_HOEREN],
};

// --- Hören Teil 3: five phone messages, 3-option MC, played twice ------------------------

const HOEREN_3 = {
  slug: "a1-pp1-hoeren-3-telefon",
  skill: "listening",
  title: { de: "Hören Teil 3: Nachrichten am Telefon", en: "Listening part 3: phone messages" },
  instructions: en("Listen to the messages on the answering machine. You will hear each message twice. Choose the right answer: a, b or c."),
  itemAudioMaxPlays: 2,
  items: [
    mcq("q1", en("When does Clara now want to go swimming?"), [opt("a", "am Mittwoch"), opt("b", "am Donnerstag"), opt("c", "am Dienstag")], "b", {
      audio: say(
        "Hallo Mia, hier ist Clara. Wir wollen doch morgen, am Mittwoch, zusammen schwimmen gehen. Aber das Schwimmbad ist am Mittwoch geschlossen. Können wir am Donnerstag gehen, um vier Uhr? Ruf mich bitte zurück. Tschüs!",
        "female",
      ),
    }),
    mcq("q2", en("When should Mr Okafor come on Monday?"), [opt("a", "um 8 Uhr"), opt("b", "um 9 Uhr"), opt("c", "um 10 Uhr")], "a", {
      audio: say(
        "Guten Tag, Herr Okafor, hier ist Sabine Lenz vom Hotel Seeblick. Ihr erster Arbeitstag ist am Montag. Bitte kommen Sie nicht um neun Uhr, sondern schon um acht Uhr zur Rezeption. Auf Wiederhören!",
        "female2",
      ),
    }),
    mcq("q3", en("Why can't Ms Novak come to her appointment tomorrow?"), [opt("a", "Die Ärztin ist krank."), opt("b", "Die Praxis hat Urlaub."), opt("c", "Frau Novak ist krank.")], "a", {
      audio: say(
        "Guten Tag, Frau Novak, hier ist die Praxis Dr. Winter. Ihr Termin morgen um zehn Uhr geht leider nicht, die Ärztin ist krank. Können Sie am Freitag um halb drei kommen? Bitte rufen Sie uns kurz an. Danke!",
        "female",
      ),
    }),
    mcq("q4", en("How much does the milk cost today?"), [opt("a", "0,79 €"), opt("b", "0,97 €"), opt("c", "1,79 €")], "a", {
      audio: say(
        "Hallo Schatz, ich bin gerade im Supermarkt. Die Milch ist heute im Angebot, der Liter kostet nur neunundsiebzig Cent. Ich kaufe sechs Liter. Brauchen wir auch Eier? Schreib mir bitte schnell. Bis gleich!",
        "male",
      ),
    }),
    mcq("q5", en("What is the travel agency's phone number?"), [opt("a", "0711 38 52 90"), opt("b", "0711 83 52 90"), opt("c", "0711 38 25 90")], "a", {
      audio: say(
        "Guten Tag, Frau Brunner, hier ist Tim Albrecht vom Reisebüro Sonnenweg. Ihre Tickets nach Rom sind da. Sie können sie ab Dienstag bei uns abholen. Unsere Telefonnummer ist null sieben eins eins, achtunddreißig, zweiundfünfzig, neunzig. Auf Wiederhören!",
        "male2",
      ),
    }),
  ],
  refs: [GOETHE_HOEREN],
};

// --- Lesen Teil 1: two short texts, richtig/falsch -----------------------------------------

const LESEN_1 = [
  {
    slug: "a1-pp1-lesen-1-email",
    skill: "reading",
    title: { de: "Lesen Teil 1: Eine E-Mail von Lea", en: "Reading part 1: an e-mail from Lea" },
    instructions: en("Read the e-mail. Are the sentences true (richtig) or false (falsch)?"),
    stimulus: {
      textKind: "email",
      text: de(
        "Von: lea.schubert@beispiel.de\nAn: katrin.wolf@beispiel.de\n\nLiebe Katrin,\n\nvielen Dank für deine E-Mail! Ich bin jetzt seit zwei Wochen in Freiburg. Meine Wohnung ist klein, aber sehr schön und nicht teuer. Sie ist im vierten Stock, und leider gibt es keinen Aufzug.\n\nIch arbeite in einer Bäckerei. Ich fange jeden Tag um fünf Uhr morgens an, aber um ein Uhr habe ich schon frei. Am Wochenende arbeite ich nicht.\n\nBesuchst du mich im Mai? Du kannst bei mir schlafen, ich habe ein Sofa.\n\nLiebe Grüße\nLea",
      ),
    },
    items: [
      tf("q1", "Lea wohnt schon zwei Jahre in Freiburg.", false),
      tf("q2", "Lea arbeitet am Samstag nicht.", true),
      tf("q3", "Katrin kann bei Lea übernachten.", true),
    ],
    refs: [GOETHE_LESEN],
  },
  {
    slug: "a1-pp1-lesen-1-nachricht",
    skill: "reading",
    title: { de: "Lesen Teil 1: Eine Nachricht von Paula", en: "Reading part 1: a message from Paula" },
    instructions: en("Read the message. Are the sentences true (richtig) or false (falsch)?"),
    stimulus: {
      textKind: "message",
      text: de(
        "Hallo Jonas,\nich stehe im Stau auf der Autobahn. Ich bin erst um halb acht am Kino, nicht um sieben. Kannst du schon die Karten kaufen? Wir brauchen zwei Karten für den Film in Saal 3. Ich gebe dir das Geld später.\nBis dann!\nPaula",
      ),
    },
    items: [
      tf("q1", "Paula kommt später zum Kino.", true),
      tf("q2", "Paula hat die Kinokarten schon gekauft.", false),
    ],
    refs: [GOETHE_LESEN],
  },
];

// --- Lesen Teil 2: where do you find the information? (a/b) ------------------------------

const TEXT_AB = [opt("a", "Text a"), opt("b", "Text b")];

const choose = (n, title, situation, a, b, answer) => ({
  slug: `a1-pp1-lesen-2-${n}`,
  skill: "reading",
  title,
  instructions: en("Read the situation and the two texts. Where do you find the information: in text a or in text b?"),
  stimulus: { textKind: "ad", text: de(`a)\n${a}\n\nb)\n${b}`) },
  items: [mcq("q1", en(situation), TEXT_AB, answer)],
  refs: [GOETHE_LESEN],
});

const LESEN_2 = [
  choose(
    1,
    { de: "Lesen Teil 2 – Aufgabe 1: Ein Deutschkurs", en: "Reading part 2 – 1: a German course" },
    "You work during the day and want to learn German in the evening. Which course is right for you?",
    "Sprachschule Lingua\nDeutschkurse A1 für Anfänger\nMontag bis Freitag, 9:00 bis 12:30 Uhr\nKursbeginn: 2. September",
    "Volkshochschule Neustadt\nDeutsch A1 am Abend\nDienstag und Donnerstag, 18:30 bis 20:00 Uhr\nAnmeldung: vhs-neustadt.beispiel.de",
    "b",
  ),
  choose(
    2,
    { de: "Lesen Teil 2 – Aufgabe 2: Ein Fahrrad", en: "Reading part 2 – 2: a bicycle" },
    "You need a bicycle for yourself. You don't want to pay more than 100 euros.",
    "Verkaufe mein Herrenfahrrad, 5 Jahre alt, sehr guter Zustand, nur 85 €.\nTel. 0176 29 44 81 (ab 17 Uhr)",
    "Fahrradhaus Brenner\nNeue Damen- und Herrenräder ab 399 €\nJetzt auch E-Bikes!\nMo–Sa 9–19 Uhr",
    "a",
  ),
  choose(
    3,
    { de: "Lesen Teil 2 – Aufgabe 3: Nach Berlin", en: "Reading part 2 – 3: to Berlin" },
    "You want to travel from Köln to Berlin by train on Sunday morning.",
    "Zugverbindungen Köln – Berlin\nSonntag: 6:48 Uhr, 8:48 Uhr, 10:48 Uhr\nFahrzeit: ca. 4 Stunden 30 Minuten",
    "Fernbus Blaupfeil\nKöln – Berlin täglich um 8:00 Uhr und 22:00 Uhr\nTickets ab 19 €",
    "a",
  ),
  choose(
    4,
    { de: "Lesen Teil 2 – Aufgabe 4: Zahnschmerzen", en: "Reading part 2 – 4: toothache" },
    "It is Saturday morning and you have a bad toothache. Which dentist can you see today?",
    "Zahnarztpraxis Dr. Mohr\nSprechzeiten: Montag bis Freitag 8–18 Uhr\nTermine nur nach Anmeldung",
    "Zahnarzt Dr. Kaya\nSprechzeiten: Montag bis Freitag 9–17 Uhr, Samstag 9–13 Uhr\nAuch ohne Termin!",
    "b",
  ),
  choose(
    5,
    { de: "Lesen Teil 2 – Aufgabe 5: Eine Wohnung", en: "Reading part 2 – 5: a flat" },
    "You are looking for a flat for your family (two adults, two children). You would like a garden.",
    "4-Zimmer-Wohnung im Erdgeschoss, 95 m², Küche, Bad, Garten\nNähe Schule und Kindergarten\n1.150 € warm",
    "Schöne 2-Zimmer-Wohnung im 3. Stock, 48 m², Balkon\nIdeal für Studenten\n620 € warm",
    "a",
  ),
];

// --- Lesen Teil 3: signs and notices, richtig/falsch ---------------------------------------

const sign = (n, title, where, text, statement, answer) => ({
  slug: `a1-pp1-lesen-3-${n}`,
  skill: "reading",
  title,
  instructions: en("Read the sign. Is the sentence true (richtig) or false (falsch)?"),
  stimulus: { textKind: "sign", text: de(text) },
  items: [tf("q1", statement, answer, { prompt: en(where) })],
  refs: [GOETHE_LESEN],
});

const LESEN_3 = [
  sign(
    1,
    { de: "Lesen Teil 3 – Schild 1: In der Arztpraxis", en: "Reading part 3 – 1: at a doctor's practice" },
    "On the door of a doctor's practice",
    "Praxis Dr. med. Lisa Hartmann\nAllgemeinmedizin\n\nSprechzeiten:\nMo, Di, Do 8–12 Uhr und 15–18 Uhr\nMi, Fr 8–12 Uhr",
    "Am Mittwochnachmittag ist die Praxis geschlossen.",
    true,
  ),
  sign(
    2,
    { de: "Lesen Teil 3 – Schild 2: In der Buchhandlung", en: "Reading part 3 – 2: at a bookshop" },
    "On the door of a bookshop",
    "Liebe Kundinnen und Kunden,\nwegen Urlaub geschlossen vom 4. bis 18. August.\nAb 19. August sind wir wieder für Sie da!\nIhre Buchhandlung Seitenweise",
    "Die Buchhandlung ist am 10. August geöffnet.",
    false,
  ),
  sign(
    3,
    { de: "Lesen Teil 3 – Schild 3: Im Rathaus", en: "Reading part 3 – 3: at the town hall" },
    "In the entrance hall of the town hall",
    "Der Aufzug ist kaputt!\nBitte benutzen Sie die Treppe.\nDas Bürgerbüro finden Sie im 1. Stock, Zimmer 104.",
    "Man kann heute mit dem Aufzug fahren.",
    false,
  ),
  sign(
    4,
    { de: "Lesen Teil 3 – Schild 4: An der Bushaltestelle", en: "Reading part 3 – 4: at a bus stop" },
    "At a bus stop",
    "Ab Montag, 3. März:\nDie Buslinie 12 hält nicht mehr hier.\nBitte gehen Sie zur Haltestelle Marktplatz (200 m).",
    "Der Bus 12 hält ab dem 3. März am Marktplatz.",
    true,
  ),
  sign(
    5,
    { de: "Lesen Teil 3 – Schild 5: Am Café", en: "Reading part 3 – 5: at a café" },
    "In the window of a café",
    "Café am Park\nHeute Live-Musik ab 20 Uhr\nEintritt frei!\nBitte reservieren Sie einen Tisch: 0351 48 27 60",
    "Man muss für die Musik bezahlen.",
    false,
  ),
];

// --- Schreiben Teil 1: fill in a form ------------------------------------------------------

const SCHREIBEN_1 = {
  slug: "a1-pp1-schreiben-1-formular",
  skill: "writing",
  title: { de: "Schreiben Teil 1: Ein Formular im Reisebüro", en: "Writing part 1: a form at the travel agency" },
  instructions: en("Read the text about Carlos Mendes. He is booking a holiday. Fill in the five missing details in the form for him."),
  stimulus: {
    textKind: "form",
    text: de(
      "Carlos Mendes möchte im Juli eine Woche Urlaub am Bodensee machen. Er fährt mit seiner Frau und seinen zwei Kindern. Seine Mutter kommt nicht mit, sie bleibt zu Hause in Köln. Die Familie fährt mit dem Zug. Carlos möchte die Reise mit Kreditkarte bezahlen. Er wohnt in der Lindenstraße 7 in 50674 Köln. Seine Handynummer ist 0172 64 39 15.",
    ),
  },
  items: [
    typed("q1", ["Mendes", "Carlos Mendes", "Mendes, Carlos"], { label: "Familienname" }),
    typed("q2", ["4", "vier", "4 Personen", "vier Personen"], { label: "Anzahl der Personen", ignoreSpaces: true }),
    typed("q3", ["Bodensee", "der Bodensee", "am Bodensee", "an den Bodensee", "zum Bodensee"], { label: "Reiseziel" }),
    typed("q4", ["Kreditkarte", "mit Kreditkarte", "per Kreditkarte", "mit der Kreditkarte"], { label: "Zahlungsweise" }),
    typed("q5", ["0172 64 39 15", "+49 172 64 39 15", "0049 172 64 39 15"], { label: "Telefonnummer (Handy)", ignoreSpaces: true, inputMode: "numeric" }),
  ],
  refs: [GOETHE_SCHREIBEN],
};

// --- The exam --------------------------------------------------------------------------------

const slugsOf = (list) => list.map((e) => e.slug);

export const A1_PROBEPRUEFUNG_1 = {
  levelCode: "A1",
  provenance: {
    sourceType: "ai_generated",
    sourceReference:
      "Original LGA practice exam drafted with AI assistance; task formats follow Goethe-Zertifikat A1: Start Deutsch 1 (structure only, no exam content).",
  },
  exam: {
    slug: "probepruefung-1",
    order: 1,
    title: { de: "Probeprüfung A1 – Nr. 1", en: "A1 practice exam 1" },
    description: en(
      "A full practice exam for the written part of A1 (listening, reading and form filling), with the task types of the Goethe-Zertifikat A1: Start Deutsch 1 and our own original texts. This is practice only: it is not an official Goethe exam, and your score is not an official result.",
    ),
    instructions: en(
      "You have 55 minutes. The exam has three sections: Listening (15 questions), Reading (15 questions) and Writing (a form with 5 details). In Listening part 1 and part 3 you hear each recording twice; in part 2 you hear each announcement only once. Please don't use a dictionary. Your answers are only checked when you submit the exam, so you can change them until then. Speaking and free writing are not part of this practice exam.",
    ),
    durationMinutes: 55,
    passThreshold: 0.6,
    reviewPolicy: "full",
    refs: [{ ref: "goethe-start-deutsch-1", note: "Task format only" }],
    sections: [
      {
        key: "hoeren",
        title: { de: "Hören", en: "Listening" },
        instructions: en(
          "About 20 minutes, 15 questions. Part 1: six short conversations, heard twice (a, b or c). Part 2: four announcements, heard only once (richtig or falsch). Part 3: five phone messages, heard twice (a, b or c).",
        ),
        exercises: [...slugsOf(HOEREN_1), HOEREN_2.slug, HOEREN_3.slug],
      },
      {
        key: "lesen",
        title: { de: "Lesen", en: "Reading" },
        instructions: en(
          "About 25 minutes, 15 questions. Part 1: two short texts (richtig or falsch). Part 2: for each situation, choose the text with the right information (a or b). Part 3: signs and notices (richtig or falsch).",
        ),
        exercises: [...slugsOf(LESEN_1), ...slugsOf(LESEN_2), ...slugsOf(LESEN_3)],
      },
      {
        key: "schreiben",
        title: { de: "Schreiben", en: "Writing" },
        instructions: en("About 10 minutes. Read the text and fill in the five missing details in the form."),
        exercises: [SCHREIBEN_1.slug],
      },
    ],
  },
  exercises: [...HOEREN_1, HOEREN_2, HOEREN_3, ...LESEN_1, ...LESEN_2, ...LESEN_3, SCHREIBEN_1],
};
