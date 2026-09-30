// Module 5 exercises. All texts, dialogues, phone messages and questions are original.
// Task *formats* follow the Goethe A1 structure documented in docs/REFERENCE-ANALYSIS.md
// (3-option MC, richtig/falsch, form filling, answering-machine messages played twice,
// Sprechen Teil 2 word cards); no exam content is reproduced.
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
  withExtra({ id, type: "speak_prompt", prompt: en(prompt), modelAnswer: de(modelAnswer), modelAudio: { text: modelAnswer, voice: "female", rate: "slow" } }, extra);
const abc = (a, b, c) => [opt("a", a), opt("b", b), opt("c", c)];

const GOETHE_HOEREN = { ref: "goethe-start-deutsch-1-hoeren", note: "Task format only" };
const GOETHE_LESEN = { ref: "goethe-start-deutsch-1-lesen", note: "Task format only" };
const GOETHE_SCHREIBEN = { ref: "goethe-start-deutsch-1-schreiben", note: "Task format only" };
const GOETHE_SPRECHEN = { ref: "goethe-start-deutsch-1-sprechen", note: "Task format only" };
const KAP5 = { ref: "netzwerk-neu-a1-5", note: "Topic alignment only" };
const GA32 = { ref: "grammatik-aktiv-32", note: "Topic alignment only" };
const GA19 = { ref: "grammatik-aktiv-19", note: "Topic alignment only" };
const GA5 = { ref: "grammatik-aktiv-5", note: "Topic alignment only" };

// --- Lesson 1: Wie spät ist es? ----------------------------------------------------------

const L1 = [
  {
    slug: "m5-uhrzeit-zuordnen",
    skill: "vocabulary",
    title: { de: "Uhrzeiten zuordnen", en: "Match the times" },
    instructions: en("Match each item on the left with the right one."),
    items: [
      pairs(
        "q1",
        [
          [de("8:15"), de("Viertel nach acht")],
          [de("8:30"), de("halb neun")],
          [de("8:45"), de("Viertel vor neun")],
          [de("8:10"), de("zehn nach acht")],
          [de("8:50"), de("zehn vor neun")],
          [de("9:00"), de("neun Uhr")],
        ],
        { prompt: en("Clock time and informal time") },
      ),
      pairs(
        "q2",
        [
          [de("die Stunde"), en("hour")],
          [de("die Minute"), en("minute")],
          [de("die Uhr"), en("clock, watch")],
          [de("früh"), en("early")],
          [de("spät"), en("late")],
        ],
        { prompt: en("Word and meaning") },
      ),
    ],
    refs: [KAP5],
  },
  {
    slug: "m5-uhrzeit-sagen",
    skill: "grammar",
    title: { de: "Wie spät ist es?", en: "What time is it?" },
    instructions: en("Choose the right way to say the time."),
    items: [
      mcq("q1", en("It is 7:30. Say it the informal way."), abc("Es ist halb sieben.", "Es ist halb acht.", "Es ist Viertel nach sieben."), "b", {
        explanation: en("halb points to the next hour: 7:30 = halb acht."),
      }),
      mcq("q2", en("It is 10:45. Say it the informal way."), abc("Es ist Viertel nach zehn.", "Es ist Viertel vor zehn.", "Es ist Viertel vor elf."), "c"),
      mcq("q3", en("It is 3:20. Say it the informal way."), abc("Es ist zwanzig nach drei.", "Es ist zwanzig vor drei.", "Es ist zehn nach drei."), "a"),
      mcq("q4", en("It is 18:15. How does the radio say it (official time)?"), abc("achtzehn Uhr fünfzehn", "fünfzehn Uhr achtzehn", "acht Uhr fünfzehn"), "a"),
      mcq("q5", en("It is 11:55. Say it the informal way."), abc("Es ist fünf nach elf.", "Es ist fünf vor zwölf.", "Es ist fünf vor elf."), "b"),
      mcq("q6", en("It is 1:00."), abc("Es ist ein Uhr.", "Es ist eins Uhr.", "Es ist einer Uhr."), "a", {
        explanation: en("With Uhr you say ein Uhr. Without Uhr: Es ist eins."),
      }),
    ],
    refs: [KAP5],
  },
  {
    slug: "m5-uhrzeit-hoeren",
    skill: "listening",
    title: { de: "Uhrzeiten hören", en: "Listening: times" },
    instructions: en("Listen and choose the time you hear. You can play each recording twice."),
    itemAudioMaxPlays: 2,
    items: [
      ["q1", "Es ist Viertel nach zwei.", "female", ["2:15", "1:45", "2:45"], "a"],
      ["q2", "Es ist halb sieben.", "male", ["7:30", "6:30", "7:00"], "b"],
      ["q3", "Es ist zehn vor acht.", "female2", ["8:10", "7:50", "8:50"], "b"],
      ["q4", "Es ist Viertel vor fünf.", "male2", ["5:15", "5:45", "4:45"], "c"],
      ["q5", "Der Film beginnt um zwanzig Uhr fünfzehn.", "female", ["20:15", "15:20", "20:50"], "a"],
      ["q6", "Es ist fünf nach halb zehn.", "male", ["9:25", "9:35", "10:35"], "b"],
    ].map(([id, text, voice, [a, b, c], answer]) =>
      mcq(id, en("What time is it?"), abc(a, b, c), answer, { audio: { text, voice, rate: "slow" } }),
    ),
    refs: [KAP5, GOETHE_HOEREN],
  },
];

// --- Lesson 2: Mein Alltag ------------------------------------------------------------------

const L2 = [
  {
    slug: "m5-tageszeiten",
    skill: "vocabulary",
    title: { de: "Tageszeiten und Alltag", en: "Times of day and daily routine" },
    instructions: en("Choose the right answer."),
    items: [
      mcq("q1", en("You have breakfast at 7 a.m. When is that?"), abc("am Morgen", "am Nachmittag", "in der Nacht"), "a"),
      mcq("q2", en("It is 3 p.m. Which part of the day is it?"), abc("am Vormittag", "am Nachmittag", "am Abend"), "b"),
      mcq("q3", en("It is 10 a.m. Which part of the day is it?"), abc("am Vormittag", "am Abend", "in der Nacht"), "a"),
      mcq("q4", en("It is 2 a.m. and you are asleep. Which part of the day is it?"), abc("am Morgen", "am Abend", "in der Nacht"), "c"),
      mcq("q5", de("frühstücken"), [optEn("a", "to have breakfast"), optEn("b", "to take a shower"), optEn("c", "to sleep")], "a"),
      mcq("q6", en("Which verb means “to take a shower”?"), abc("schlafen", "duschen", "frühstücken"), "b"),
      mcq("q7", de("abends"), [optEn("a", "in the mornings"), optEn("b", "in the afternoons"), optEn("c", "in the evenings")], "c"),
    ],
    refs: [KAP5],
  },
  {
    slug: "m5-am-um-von-bis",
    skill: "grammar",
    title: { de: "am, um, von … bis", en: "am, um, von … bis" },
    instructions: en("Write the missing word: am, um, von or bis."),
    items: [
      gap("q1", "Der Deutschkurs beginnt", "neun Uhr.", ["um"]),
      gap("q2", "", "Montag arbeite ich nicht.", ["Am"]),
      gap("q3", "Ich arbeite", "acht bis vier Uhr.", ["von"]),
      gap("q4", "Ich arbeite von acht", "vier Uhr.", ["bis"]),
      gap("q5", "Am Samstag und", "Sonntag schlafe ich lange.", ["am"]),
      gap("q6", "Tom duscht", "Viertel nach sieben.", ["um"], { explanation: en("Clock times always take um.") }),
      gap("q7", "Frau Kaya arbeitet von Montag", "Freitag.", ["bis"]),
      gap("q8", "", "Abend koche ich.", ["Am"], { explanation: en("Parts of the day take am: am Morgen, am Abend – but in der Nacht.") }),
    ],
    refs: [KAP5, GA32],
  },
  {
    slug: "m5-tagesablauf-lesen",
    skill: "reading",
    title: { de: "Der Tag von Nadia", en: "Nadia's day" },
    instructions: en("Read the text. Are the sentences true (richtig) or false (falsch)?"),
    stimulus: {
      textKind: "profile",
      text: de(
        "Hallo, ich bin Nadia Rahman und wohne in Köln. Von Montag bis Freitag ist mein Tag sehr voll. Um sechs Uhr dusche ich, und um halb sieben frühstücke ich. Von acht bis vier Uhr arbeite ich. Am Nachmittag lerne ich Deutsch. Der Kurs ist von fünf bis sieben Uhr. Am Abend koche ich, und um elf Uhr schlafe ich.\nAm Samstag und am Sonntag arbeite ich nicht. Dann schlafe ich lange und frühstücke um zehn Uhr.",
      ),
    },
    items: [
      tf("q1", "Nadia duscht um sechs Uhr.", true),
      tf("q2", "Nadia frühstückt von Montag bis Freitag um sieben Uhr.", false, { explanation: en("She has breakfast um halb sieben – at 6:30.") }),
      tf("q3", "Nadia arbeitet von acht bis vier Uhr.", true),
      tf("q4", "Der Deutschkurs ist am Vormittag.", false),
      tf("q5", "Am Sonntag arbeitet Nadia nicht.", true),
      tf("q6", "Am Wochenende frühstückt Nadia um halb sieben.", false),
    ],
    refs: [KAP5, GOETHE_LESEN],
  },
  {
    slug: "m5-tagesablauf-sprechen",
    skill: "speaking",
    title: { de: "Fragen zum Alltag", en: "Questions about your day" },
    instructions: en(
      "Practise with word cards, like in part 2 of the A1 speaking exam: ask a question with the word on the card, or answer your partner's question. Say it out loud, then compare with the model answer.",
    ),
    items: [
      speak("q1", "Ask your partner a question with the word card.", "Wann frühstückst du?", { cue: de("Thema: Alltag – Frühstück?") }),
      speak("q2", "Your partner asks you this question. Answer it.", "Ich frühstücke um sieben Uhr.", { cue: de("Wann frühstückst du?") }),
      speak("q3", "Ask your partner a question with the word card.", "Was machst du am Abend?", { cue: de("Thema: Alltag – Abend?") }),
      speak("q4", "Your partner asks you this question. Answer it.", "Am Abend koche ich.", { cue: de("Was machst du am Abend?") }),
    ],
    refs: [KAP5, GOETHE_SPRECHEN],
  },
];

// --- Lesson 3: Meine Familie ------------------------------------------------------------------

const L3 = [
  {
    slug: "m5-familie-woerter",
    skill: "vocabulary",
    title: { de: "Die Familie", en: "The family" },
    instructions: en("Match the pairs and answer the questions."),
    items: [
      pairs(
        "q1",
        [
          [de("die Mutter"), en("mother")],
          [de("der Vater"), en("father")],
          [de("die Schwester"), en("sister")],
          [de("der Bruder"), en("brother")],
          [de("die Tochter"), en("daughter")],
          [de("der Sohn"), en("son")],
        ],
        { prompt: en("Word and meaning") },
      ),
      pairs(
        "q2",
        [
          [de("der Vater"), de("die Mutter")],
          [de("der Bruder"), de("die Schwester")],
          [de("der Sohn"), de("die Tochter")],
          [de("der Opa"), de("die Oma")],
          [de("der Mann"), de("die Frau")],
        ],
        { prompt: en("Man and woman: find the pairs") },
      ),
      mcq("q3", en("Your mother and your father are your …"), abc("Eltern", "Geschwister", "Kinder"), "a"),
      mcq("q4", en("Your brothers and sisters are your …"), abc("Eltern", "Geschwister", "Kinder"), "b"),
      mcq("q5", en("Tom has a wife. Tom is …"), abc("verheiratet", "spät", "früh"), "a"),
    ],
    refs: [KAP5],
  },
  {
    slug: "m5-possessiv-nominativ",
    skill: "grammar",
    title: { de: "mein, dein, sein …", en: "my, your, his …" },
    instructions: en("Write the possessive article. The person is in brackets."),
    items: [
      gap("q1", "Das ist", "Mutter. (ich)", ["meine"]),
      gap("q2", "Ist das", "Bruder, Tim? (du)", ["dein"]),
      gap("q3", "Das ist Herr Kaya, und das ist", "Frau. (er)", ["seine"]),
      gap("q4", "Das ist Lisa, und das ist", "Vater. (sie)", ["ihr"], { explanation: en("Lisa is the owner, so: ihr Vater (her father).") }),
      gap("q5", "", "Kinder sind acht und zehn Jahre alt. (wir)", ["Unsere"]),
      gap("q6", "Wie heißt", "Tochter, Frau Berger? (Sie)", ["Ihre"]),
      gap("q7", "Ist das", "Oma, Paul und Mia? (ihr)", ["eure"], { explanation: en("euer loses its e before an ending: eure Oma.") }),
      gap("q8", "Wie alt ist", "Sohn, Anna? (du)", ["dein"]),
    ],
    refs: [KAP5, GA19],
  },
  {
    slug: "m5-possessiv-akkusativ",
    skill: "grammar",
    title: { de: "meinen, deinen, seinen …", en: "Possessive articles in the accusative" },
    instructions: en("Choose the correct possessive article. The person is in brackets."),
    items: [
      mcq("q1", de("Ich besuche … Vater. (ich)"), abc("mein", "meine", "meinen"), "c", {
        explanation: en("der Vater is masculine, so the accusative is meinen Vater."),
      }),
      mcq("q2", de("Hast du … Handynummer? (ich)"), abc("mein", "meine", "meinen"), "b"),
      mcq("q3", de("Wir lieben … Kinder. (wir)"), abc("unser", "unsere", "unseren"), "b"),
      mcq("q4", de("Lisa hat einen Bruder. Kennst du … Bruder?"), abc("ihren", "ihre", "seinen"), "a"),
      mcq("q5", de("Besucht ihr … Oma am Sonntag? (ihr)"), abc("euer", "eure", "euren"), "b"),
      mcq("q6", de("Herr Kaya, ich kenne … Sohn. (Sie)"), abc("Ihr", "Ihre", "Ihren"), "c"),
      mcq("q7", de("Paul hat eine Schwester. Er besucht … Schwester am Wochenende."), abc("sein", "seine", "seinen"), "b"),
    ],
    refs: [KAP5, GA19],
  },
  {
    slug: "m5-familie-lesen",
    skill: "reading",
    title: { de: "Eine E-Mail von Jana", en: "An e-mail from Jana" },
    instructions: en("Read the e-mail. Are the sentences true (richtig) or false (falsch)?"),
    stimulus: {
      textKind: "email",
      text: de(
        "Hallo Selin,\n\ndanke für deine E-Mail! Hier ist ein Foto. Das sind meine Eltern. Mein Vater heißt Jörg und meine Mutter heißt Anke. Sie wohnen in Rostock.\nDas ist mein Bruder Felix. Er ist 25 Jahre alt und verheiratet. Seine Frau heißt Mira. Ihr Sohn Leo ist zwei.\nIch habe auch eine Schwester. Meine Schwester Paula ist 17 und wohnt auch in Rostock.\nUnd du? Hast du Geschwister?\n\nViele Grüße\nJana",
      ),
    },
    items: [
      tf("q1", "Janas Eltern wohnen in Rostock.", true),
      tf("q2", "Jana hat zwei Geschwister.", true, { explanation: en("Her brother Felix and her sister Paula.") }),
      tf("q3", "Felix hat keine Frau.", false),
      tf("q4", "Mira ist die Schwester von Felix.", false, { explanation: en("„Seine Frau heißt Mira.“ – Mira is his wife.") }),
      tf("q5", "Leo ist der Sohn von Felix und Mira.", true),
      tf("q6", "Paula ist 25 Jahre alt.", false),
    ],
    refs: [KAP5, GOETHE_LESEN],
  },
];

// --- Lesson 4: Termine am Telefon -----------------------------------------------------------

const L4 = [
  {
    slug: "m5-modalverben-formen",
    skill: "grammar",
    title: { de: "müssen, können, wollen", en: "müssen, können, wollen" },
    instructions: en("Write the correct form of the modal verb in brackets."),
    items: [
      gap("q1", "Ich", "heute bis sieben Uhr arbeiten. (müssen)", ["muss"]),
      gap("q2", "", "du am Freitag kommen? (können)", ["Kannst"]),
      gap("q3", "Lara", "am Samstag lange schlafen. (wollen)", ["will"], { explanation: en("ich will, er/sie will – no ending.") }),
      gap("q4", "Wir", "leider am Sonntag arbeiten. (müssen)", ["müssen"]),
      gap("q5", "Wann", "ihr kommen? (können)", ["könnt"]),
      gap("q6", "", "Sie am Montag um zehn Uhr kommen, Herr Weiß? (können)", ["Können"]),
      gap("q7", "Du", "jetzt frühstücken. Es ist schon acht! (müssen)", ["musst"]),
      gap("q8", "Was", "du am Wochenende machen? (wollen)", ["willst"]),
    ],
    refs: [KAP5, GA5],
  },
  {
    slug: "m5-satzklammer",
    skill: "grammar",
    title: { de: "Die Satzklammer", en: "The sentence bracket" },
    instructions: en("Put the words in the right order. The infinitive goes to the end."),
    items: [
      order("q1", ["Ich", "muss", "heute", "arbeiten", "."], { alternatives: ["Heute muss ich arbeiten."] }),
      order("q2", ["Kannst", "du", "um", "acht", "Uhr", "kommen", "?"]),
      order("q3", ["Wir", "wollen", "am", "Sonntag", "frühstücken", "."], { alternatives: ["Am Sonntag wollen wir frühstücken."] }),
      order("q4", ["Ich", "kann", "leider", "nicht", "kommen", "."], { alternatives: ["Leider kann ich nicht kommen."] }),
      order("q5", ["Wann", "müssen", "Sie", "arbeiten", "?"]),
    ],
    refs: [KAP5, GA5],
  },
  {
    slug: "m5-anrufbeantworter-hoeren",
    skill: "listening",
    title: { de: "Nachrichten auf dem Anrufbeantworter", en: "Listening: voicemail messages" },
    instructions: en("Listen to the phone messages. You can play each message twice. Choose the right answer: a, b or c."),
    itemAudioMaxPlays: 2,
    items: [
      mcq("q1", en("When is Mr Novak's new appointment?"), abc("am Dienstag um 9 Uhr", "am Mittwoch um 10:30 Uhr", "am Mittwoch um 11:30 Uhr"), "b", {
        audio: {
          text: "Guten Tag, Herr Novak, hier ist die Praxis Doktor Lindner. Sie haben am Dienstag um neun Uhr einen Termin. Leider kann Doktor Lindner am Dienstag nicht. Können Sie am Mittwoch um halb elf kommen? Unsere Telefonnummer ist null, drei, vier, eins – achtundzwanzig – sechsundsiebzig – fünfzig. Danke!",
          voice: "female",
          rate: "normal",
        },
      }),
      mcq("q2", en("When is Ben there?"), abc("um 7 Uhr", "um 7:15 Uhr", "um 7:45 Uhr"), "b", {
        audio: {
          text: "Hallo Sara, hier ist Ben. Es tut mir leid, ich komme heute zu spät. Der Bus kommt nicht. Ich bin erst um Viertel nach sieben da. Tschüs!",
          voice: "male",
          rate: "normal",
        },
      }),
      mcq("q3", en("Why is Tim calling?"), [optEn("a", "He has to work late."), optEn("b", "He is at the doctor's."), optEn("c", "He wants to eat at nine.")], "a", {
        audio: {
          text: "Hallo Mama, hier ist Tim. Ich kann heute Abend leider nicht kommen. Ich muss lange arbeiten, bis neun Uhr. Ich komme am Samstag. Ist das okay? Tschüs!",
          voice: "male2",
          rate: "normal",
        },
      }),
      mcq("q4", en("When is the German course on Thursday?"), abc("von 6 bis 8:30 Uhr", "von 6:30 bis 9 Uhr", "von 6 bis 9 Uhr"), "b", {
        audio: {
          text: "Guten Tag, Frau Özdemir, hier ist Klaus Berger, Sprachschule Lingua. Der Deutschkurs am Donnerstag beginnt nicht um sechs Uhr. Er ist von halb sieben bis neun Uhr. Bis Donnerstag!",
          voice: "male",
          rate: "normal",
        },
      }),
      mcq("q5", en("What does Grandma want?"), [
        optEn("a", "breakfast together on Sunday at 10"),
        optEn("b", "breakfast together on Saturday at 10"),
        optEn("c", "dinner together on Sunday at 7"),
      ], "a", {
        audio: {
          text: "Hallo Jonas, hier ist Oma. Hast du am Sonntag Zeit? Opa und ich wollen um zehn Uhr zusammen frühstücken. Kannst du auch kommen? Bis bald!",
          voice: "female2",
          rate: "normal",
        },
      }),
    ],
    refs: [KAP5, GOETHE_HOEREN],
  },
  {
    slug: "m5-zu-spaet-schreiben",
    skill: "writing",
    title: { de: "Ich komme zu spät!", en: "I'm late!" },
    instructions: en(
      "You are meeting your friend Mia at 3 p.m., but you still have to work. You can be there at 3:15. Complete your text message to Mia. Write one word in each gap.",
    ),
    items: [
      gap("q1", "Hallo Mia, es tut mir", "!", ["leid"]),
      gap("q2", "Ich komme zu", ".", ["spät"]),
      gap("q3", "Ich", "leider noch arbeiten. (müssen)", ["muss"]),
      gap("q4", "Ich bin", "Viertel nach drei da.", ["um"]),
      gap("q5", "", "du bitte warten? (können)", ["Kannst"]),
      gap("q6", "Bis", "!", ["gleich", "dann", "bald", "später", "nachher"]),
    ],
    refs: [KAP5, GOETHE_SCHREIBEN],
  },
];

// --- Lesson 5: Modultest --------------------------------------------------------------------

const L5 = [
  {
    slug: "m5-test-hoeren",
    skill: "listening",
    title: { de: "Test: Hören", en: "Test: listening" },
    instructions: en("Listen to each phone message. You can play each one twice. Choose the right answer or write it."),
    itemAudioMaxPlays: 2,
    passThreshold: 0.7,
    items: [
      mcq("q1", en("When does Ms Lange want to meet?"), abc("am Freitag um 10 Uhr", "am Montag um 10 Uhr", "am Montag um 12 Uhr"), "b", {
        audio: {
          text: "Guten Tag, hier ist Petra Lange. Wir haben am Freitag um zehn Uhr einen Termin. Leider habe ich am Freitag keine Zeit. Können wir am Montag um zehn Uhr sprechen? Danke!",
          voice: "female",
          rate: "normal",
        },
      }),
      mcq("q2", en("When is Dad at home?"), abc("um 7 Uhr", "um 7:30 Uhr", "um 8:30 Uhr"), "b", {
        audio: {
          text: "Hallo Lukas, hier ist Papa. Ich bin heute leider erst um halb acht zu Hause. Mama kocht. Ihr könnt um sieben Uhr essen. Tschüs!",
          voice: "male",
          rate: "normal",
        },
      }),
      mcq("q3", en("When can Selin meet Emma tomorrow?"), abc("um 2 Uhr", "um 4 Uhr", "um 5 Uhr"), "c", {
        audio: {
          text: "Hi Emma, hier ist Selin. Ich habe morgen von zwei bis vier Uhr Deutschkurs. Kannst du um fünf Uhr kommen? Tschüs!",
          voice: "female2",
          rate: "normal",
        },
      }),
      typed("q4", ["8:45", "8.45", "08:45", "08.45", "8:45 Uhr", "8.45 Uhr", "08:45 Uhr", "08.45 Uhr", "20:45", "20.45", "20:45 Uhr", "20.45 Uhr", "8 Uhr 45"], {
        prompt: en("At what time is the appointment? Write the time in digits (for example 7:30)."),
        audio: { text: "Hallo, hier ist Marko. Unser Termin ist morgen um Viertel vor neun. Bis morgen!", voice: "male2", rate: "normal" },
      }),
      typed("q5", ["Donnerstag", "am Donnerstag"], {
        prompt: en("On which day is the new appointment? Write the day in German."),
        audio: {
          text: "Guten Tag, hier ist die Praxis Doktor Yilmaz. Ihr Termin am Dienstag geht leider nicht. Sie haben jetzt am Donnerstag um elf Uhr einen Termin. Auf Wiedersehen!",
          voice: "female",
          rate: "normal",
        },
      }),
    ],
    refs: [KAP5, GOETHE_HOEREN],
  },
  {
    slug: "m5-test-lesen",
    skill: "reading",
    title: { de: "Test: Lesen", en: "Test: reading" },
    instructions: en("Read the note. Are the sentences true (richtig) or false (falsch)?"),
    passThreshold: 0.7,
    stimulus: {
      textKind: "message",
      text: de(
        "Liebe Mia, lieber Jonas,\n\nich muss heute bis sechs Uhr arbeiten. Papa kommt um fünf Uhr nach Hause. Mia, du musst um vier Uhr Hausaufgaben machen. Jonas, dein Fußballtraining ist heute von halb fünf bis sechs.\nOma hat heute Geburtstag! Wir besuchen Oma um halb acht.\n\nBis heute Abend!\nMama",
      ),
    },
    items: [
      tf("q1", "Mama arbeitet heute bis sechs Uhr.", true),
      tf("q2", "Papa ist um vier Uhr zu Hause.", false),
      tf("q3", "Jonas hat um halb fünf Fußballtraining.", true),
      tf("q4", "Mia muss um vier Uhr Hausaufgaben machen.", true),
      tf("q5", "Die Familie besucht Oma um sieben Uhr.", false, { explanation: en("They visit her um halb acht – at 7:30.") }),
      tf("q6", "Oma hat heute Geburtstag.", true),
    ],
    refs: [KAP5, GOETHE_LESEN],
  },
  {
    slug: "m5-test-formular",
    skill: "writing",
    title: { de: "Test: Ein Formular ausfüllen", en: "Test: fill in a form" },
    instructions: en("Read Anja's message to a language school. Fill in the school's appointment form for her."),
    passThreshold: 0.7,
    stimulus: {
      textKind: "message",
      text: de(
        "Hallo, ich heiße Anja Kowalski. Ich möchte einen Termin für einen Deutschkurs. Ich kann am Mittwoch von zwei bis fünf Uhr. Meine Telefonnummer ist 0221 64 93 07. Mein Sohn Adam möchte auch Deutsch lernen. Er ist zwölf Jahre alt.",
      ),
    },
    items: [
      typed("q1", ["Kowalski"], { label: "Familienname" }),
      typed("q2", ["Mittwoch", "am Mittwoch"], { label: "Tag" }),
      typed(
        "q3",
        ["14 Uhr", "14", "14:00", "14.00", "14:00 Uhr", "14.00 Uhr", "2 Uhr", "2", "2:00", "2.00", "zwei Uhr", "zwei", "vierzehn Uhr", "von 14 Uhr", "von 2 Uhr", "von zwei Uhr", "ab 14 Uhr", "von 14:00", "vierzehn"],
        { label: "Uhrzeit: von" },
      ),
      typed(
        "q4",
        ["17 Uhr", "17", "17:00", "17.00", "17:00 Uhr", "17.00 Uhr", "5 Uhr", "5", "5:00", "5.00", "fünf Uhr", "fünf", "siebzehn Uhr", "bis 17 Uhr", "bis 5 Uhr", "bis fünf Uhr", "bis 17:00", "siebzehn"],
        { label: "Uhrzeit: bis" },
      ),
      typed("q5", ["0221 64 93 07"], { label: "Telefon", ignoreSpaces: true, inputMode: "numeric" }),
      typed("q6", ["Adam"], { label: "Kind: Vorname" }),
      typed("q7", ["12", "zwölf", "12 Jahre", "zwölf Jahre", "12 Jahre alt", "zwölf Jahre alt"], { label: "Kind: Alter" }),
    ],
    refs: [KAP5, GOETHE_SCHREIBEN],
  },
  {
    slug: "m5-test-grammatik",
    skill: "grammar",
    title: { de: "Test: Grammatik", en: "Test: grammar" },
    instructions: en("Answer all questions."),
    passThreshold: 0.7,
    items: [
      gap("q1", "Der Kurs beginnt", "neun Uhr. (am / um)", ["um"]),
      gap("q2", "", "Sonntag schlafe ich lange. (am / um)", ["Am"]),
      mcq("q3", de("Ich besuche … Eltern. (ich)"), abc("mein", "meine", "meinen"), "b"),
      mcq("q4", de("Frau Roth, ist das … Tochter? (Sie)"), abc("Ihr", "Ihre", "Ihren"), "b"),
      gap("q5", "Paul", "heute bis acht Uhr arbeiten. (müssen)", ["muss"]),
      gap("q6", "Wir", "am Wochenende lange schlafen. (wollen)", ["wollen"]),
      order("q7", ["Ich", "kann", "um", "zehn", "Uhr", "kommen", "."], { alternatives: ["Um zehn Uhr kann ich kommen."] }),
      mcq("q8", de("Tom hat einen Bruder. Kennst du … Bruder?"), abc("seinen", "sein", "seine"), "a"),
      gap("q9", "Kinder, wo ist", "Oma? (ihr)", ["eure"]),
    ],
    refs: [KAP5],
  },
  {
    slug: "m5-test-wortschatz",
    skill: "vocabulary",
    title: { de: "Test: Wortschatz", en: "Test: vocabulary" },
    instructions: en("Answer all questions."),
    passThreshold: 0.7,
    items: [
      mcq("q1", en("It is 8:30. Say it the informal way."), abc("halb acht", "halb neun", "Viertel nach neun"), "b"),
      mcq("q2", en("Your father's mother is your …"), abc("Oma", "Tochter", "Schwester"), "a"),
      typed("q3", ["die Eltern", "Eltern"], { prompt: en("Write the German word for “parents”.") }),
      mcq("q4", en("You arrive late. What do you say?"), abc("Tut mir leid!", "Kein Problem!", "Gute Nacht!"), "a"),
      mcq("q5", en("It is 2 p.m. Which part of the day is it?"), abc("am Morgen", "am Nachmittag", "in der Nacht"), "b"),
      pairs("q6", [
        [de("der Termin"), en("appointment")],
        [de("pünktlich"), en("on time")],
        [de("die Stunde"), en("hour")],
        [de("frühstücken"), en("to have breakfast")],
        [de("die Geschwister"), en("siblings")],
      ]),
      mcq("q7", de("müssen"), [optEn("a", "to have to"), optEn("b", "to be able to"), optEn("c", "to want to")], "a"),
    ],
    refs: [KAP5],
  },
  {
    slug: "m5-test-sprechen",
    skill: "speaking",
    title: { de: "Test: Sprechen – Fragen und Antworten", en: "Test: speaking – questions and answers" },
    instructions: en(
      "Practise part 2 of the A1 speaking exam: ask a question with the word card or answer the question. Speak for yourself; the model answer is only an example. This practice is not scored.",
    ),
    items: [
      speak("q1", "Ask your partner a question with the word card.", "Hast du Geschwister?", { cue: de("Thema: Familie – Geschwister?") }),
      speak("q2", "Your partner asks you this question. Answer it.", "Ja, ich habe einen Bruder und eine Schwester. Mein Bruder heißt Omar.", {
        cue: de("Hast du Geschwister?"),
      }),
      speak("q3", "Ask your partner a question with the word card.", "Was machst du am Wochenende?", { cue: de("Thema: Alltag – Wochenende?") }),
      speak("q4", "Your partner asks you this question. Answer it.", "Am Wochenende schlafe ich lange und besuche meine Eltern.", {
        cue: de("Was machst du am Wochenende?"),
      }),
      speak("q5", "Make an appointment: ask your friend if they can come on Friday at 3 p.m.", "Kannst du am Freitag um drei Uhr kommen?"),
    ],
    refs: [KAP5, GOETHE_SPRECHEN],
  },
];

export const EXERCISES_BY_LESSON = { L1, L2, L3, L4, L5 };
export const EXERCISES = [...L1, ...L2, ...L3, ...L4, ...L5];
