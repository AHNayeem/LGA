// Module 2 exercises. All texts, dialogues and questions are original. Task *formats*
// follow the Goethe A1 structure documented in docs/REFERENCE-ANALYSIS.md (3-option MC,
// richtig/falsch, form filling, audio played twice); no exam content is reproduced.
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

const GOETHE_HOEREN = { ref: "goethe-start-deutsch-1-hoeren", note: "Task format only" };
const GOETHE_LESEN = { ref: "goethe-start-deutsch-1-lesen", note: "Task format only" };
const GOETHE_SCHREIBEN = { ref: "goethe-start-deutsch-1-schreiben", note: "Task format only" };
const GOETHE_SPRECHEN = { ref: "goethe-start-deutsch-1-sprechen", note: "Task format only" };
const KAP2 = { ref: "netzwerk-neu-a1-2", note: "Topic alignment only" };
const ga = (n) => ({ ref: `grammatik-aktiv-${n}`, note: "Topic alignment only" });

const articles = [opt("a", "der"), opt("b", "die"), opt("c", "das")];

// --- Lesson 1: Hobbys ------------------------------------------------------------------

const L1 = [
  {
    slug: "m2-hobbys-zuordnen",
    skill: "vocabulary",
    title: { de: "Hobbys", en: "Hobbies" },
    instructions: en("Match the words. Then choose the right sentence."),
    items: [
      pairs(
        "q1",
        [
          [de("lesen"), en("to read")],
          [de("schwimmen"), en("to swim")],
          [de("tanzen"), en("to dance")],
          [de("sehen"), en("to see, to watch")],
          [de("hören"), en("to hear, to listen")],
          [de("spielen"), en("to play")],
        ],
        { prompt: en("Verb and meaning") },
      ),
      pairs(
        "q2",
        [
          [de("Fußball"), de("spielen")],
          [de("Musik"), de("hören")],
          [de("Bücher"), de("lesen")],
          [de("Filme"), de("sehen")],
          [de("Fahrrad"), de("fahren")],
        ],
        { prompt: en("What goes together?") },
      ),
      mcq("q3", en("You like swimming. What do you say?"), [opt("a", "Ich schwimme gern."), opt("b", "Ich spiele gern schwimmen."), opt("c", "Ich gern schwimme.")], "a"),
      mcq("q4", en("You want to know what a friend likes doing."), [opt("a", "Was ist das?"), opt("b", "Was machst du gern?"), opt("c", "Wie heißt du?")], "b"),
    ],
    refs: [KAP2],
  },
  {
    slug: "m2-vokalwechsel",
    skill: "grammar",
    title: { de: "fahren, lesen, sehen …", en: "Verbs with a vowel change" },
    instructions: en("Write the correct form of the verb in brackets."),
    items: [
      gap("q1", "Du", "gern Fahrrad. (fahren)", ["fährst"], { explanation: en("fahren changes a → ä: du fährst, er fährt.") }),
      gap("q2", "Tim", "gern Bücher. (lesen)", ["liest"], { explanation: en("lesen changes e → ie: du liest, er liest.") }),
      gap("q3", "Ich", "gern Filme. (sehen)", ["sehe"], { explanation: en("With ich there is no vowel change.") }),
      gap("q4", "Anna", "Deutsch und Englisch. (sprechen)", ["spricht"]),
      gap("q5", "Wir", "gern Fahrrad. (fahren)", ["fahren"]),
      gap("q6", "Mia", "gern Fußball. (sehen)", ["sieht"]),
      gap("q7", "Er", "gern Pizza. (essen)", ["isst"], { explanation: en("essen changes e → i, and the stem ends in -s: du isst, er isst.") }),
      gap("q8", "Ihr", "gern Musik. (hören)", ["hört"], { explanation: en("hören is a regular verb: ihr hört.") }),
    ],
    refs: [KAP2, ga(4)],
  },
  {
    slug: "m2-hobbys-hoeren",
    skill: "listening",
    title: { de: "Was machst du gern?", en: "Listening: hobbies" },
    instructions: en("Listen to the conversation. You can play it twice. Then answer the questions."),
    stimulus: {
      textKind: "dialogue",
      audio: {
        lines: [
          { speaker: "Nina", text: "Hallo, Ben! Was machst du gern?", voice: "female", rate: "slow" },
          { speaker: "Ben", text: "Ich spiele gern Fußball. Und ich höre gern Musik. Und du?", voice: "male", rate: "slow" },
          { speaker: "Nina", text: "Ich lese sehr gern. Und ich schwimme gern.", voice: "female", rate: "slow" },
          { speaker: "Ben", text: "Schwimmen? Das mache ich auch gern!", voice: "male", rate: "slow" },
          { speaker: "Nina", text: "Super! Fährst du auch gern Fahrrad?", voice: "female", rate: "slow" },
          { speaker: "Ben", text: "Nein, nicht so gern.", voice: "male", rate: "slow" },
        ],
      },
      maxPlays: 2,
      transcriptPolicy: "after_submit",
    },
    items: [
      mcq("q1", en("What does Ben like doing?"), [opt("a", "Bücher lesen"), opt("b", "Fußball spielen"), opt("c", "tanzen")], "b"),
      mcq("q2", en("What does Nina like doing?"), [opt("a", "Fußball spielen und schwimmen"), opt("b", "lesen und tanzen"), opt("c", "lesen und schwimmen")], "c"),
      tf("q3", "Ben schwimmt auch gern.", true),
      tf("q4", "Ben fährt gern Fahrrad.", false, { explanation: en("Ben says „Nein, nicht so gern.“") }),
    ],
    refs: [KAP2, GOETHE_HOEREN],
  },
];

// --- Lesson 2: Berufe ------------------------------------------------------------------

const L2 = [
  {
    slug: "m2-berufe-zuordnen",
    skill: "vocabulary",
    title: { de: "Berufe", en: "Jobs" },
    instructions: en("Match the words. Then answer the question."),
    items: [
      pairs(
        "q1",
        [
          [de("der Lehrer"), de("die Lehrerin")],
          [de("der Koch"), de("die Köchin")],
          [de("der Student"), de("die Studentin")],
          [de("der Ingenieur"), de("die Ingenieurin")],
          [de("der Krankenpfleger"), de("die Krankenpflegerin")],
        ],
        { prompt: en("Man and woman") },
      ),
      pairs(
        "q2",
        [
          [de("der Informatiker"), en("IT specialist")],
          [de("der Koch"), en("cook")],
          [de("der Lehrer"), en("teacher")],
          [de("der Krankenpfleger"), en("nurse")],
          [de("der Ingenieur"), en("engineer")],
        ],
        { prompt: en("Job and meaning") },
      ),
      mcq(
        "q3",
        en("Someone asks you: „Was sind Sie von Beruf?“ What do they want to know?"),
        [optEn("a", "your name"), optEn("b", "your age"), optEn("c", "your job")],
        "c",
      ),
    ],
    refs: [KAP2],
  },
  {
    slug: "m2-sein-haben",
    skill: "grammar",
    title: { de: "sein und haben", en: "sein and haben" },
    instructions: en("Write the correct form of the verb in brackets."),
    items: [
      gap("q1", "Ich", "Krankenpfleger. (sein)", ["bin"]),
      gap("q2", "", "du Studentin? (sein)", ["Bist"]),
      gap("q3", "Herr Brandt", "Lehrer. (sein)", ["ist"]),
      gap("q4", "Wir", "zwei Hobbys: Lesen und Tanzen. (haben)", ["haben"]),
      gap("q5", "", "du Hobbys? (haben)", ["Hast"], { explanation: en("du hast – no b.") }),
      gap("q6", "Frau Klein", "drei Hobbys. (haben)", ["hat"]),
      gap("q7", "Ihr", "Studenten, richtig? (sein)", ["seid"]),
      gap("q8", "", "ihr heute Zeit? (haben)", ["Habt"]),
      gap("q9", "Sara und Tom", "Informatiker. (sein)", ["sind"]),
      gap("q10", "Wie alt", "Sie? (sein)", ["sind"], { explanation: en("Age uses sein: Ich bin 30. Wie alt sind Sie?") }),
    ],
    refs: [KAP2, ga(3)],
  },
  {
    slug: "m2-berufe-lesen",
    skill: "reading",
    title: { de: "Deniz und Laura", en: "Deniz and Laura" },
    instructions: en("Read the text. Answer the questions."),
    stimulus: {
      textKind: "profile",
      text: de(
        "Hallo, ich bin Deniz Aksoy. Ich bin 29 Jahre alt und wohne in Stuttgart. Ich arbeite als Informatiker. Meine Hobbys sind Fußball und Musik: Ich spiele gern Fußball und ich höre gern Musik.\nDas ist Laura. Laura ist Köchin. Sie ist 34 Jahre alt. Sie liest sehr gern und sie tanzt gern. Laura spricht Deutsch, Italienisch und Englisch.",
      ),
    },
    items: [
      tf("q1", "Deniz ist 29 Jahre alt.", true),
      tf("q2", "Deniz arbeitet als Lehrer.", false),
      tf("q3", "Deniz spielt gern Fußball.", true),
      tf("q4", "Laura ist Köchin.", true),
      tf("q5", "Laura fährt gern Fahrrad.", false, { explanation: en("Laura likes reading and dancing.") }),
      mcq("q6", en("How old is Laura?"), [opt("a", "29"), opt("b", "43"), opt("c", "34")], "c"),
    ],
    refs: [KAP2, GOETHE_LESEN],
  },
  {
    slug: "m2-beruf-sprechen",
    skill: "speaking",
    title: { de: "Beruf und Hobbys", en: "Job and hobbies" },
    instructions: en("Say your answer out loud. Then compare it with the model answer and rate yourself."),
    items: [
      speak("q1", "Say what your job is and where you work (city).", "Ich bin Ingenieurin. Ich arbeite in Hamburg."),
      speak("q2", "Ask a new colleague (formal) what they do for a living.", "Was sind Sie von Beruf?", {
        modelAudio: { text: "Was sind Sie von Beruf?", voice: "male", rate: "slow" },
      }),
      speak("q3", "Say two things you like doing.", "Ich lese gern und ich spiele gern Fußball."),
      speak(
        "q4",
        "Exam part 2: your card says „Hobby“. Ask your partner a question, then answer it for yourself.",
        "Was machst du gern? – Ich schwimme gern.",
        { cue: de("Thema: Freizeit – Hobby?") },
      ),
    ],
    refs: [KAP2, GOETHE_SPRECHEN],
  },
];

// --- Lesson 3: Arbeitsplätze und Wochentage --------------------------------------------------

const L3 = [
  {
    slug: "m2-ja-nein-fragen",
    skill: "grammar",
    title: { de: "Ja-/Nein-Fragen bauen", en: "Build yes/no questions" },
    instructions: en("Put the words in the right order."),
    items: [
      order("q1", ["Arbeitest", "du", "am", "Montag", "?"]),
      order("q2", ["Sind", "Sie", "Lehrerin", "?"]),
      order("q3", ["Hast", "du", "am", "Freitag", "frei", "?"]),
      order("q4", ["Spielt", "Tom", "gern", "Fußball", "?"]),
      order("q5", ["Ich", "arbeite", "am", "Sonntag", "."], { alternatives: ["Am Sonntag arbeite ich."] }),
    ],
    refs: [KAP2, ga(11)],
  },
  {
    slug: "m2-ja-nein-doch",
    skill: "grammar",
    title: { de: "Ja, nein oder doch?", en: "Yes, no or doch?" },
    instructions: en("Choose the right answer or question."),
    items: [
      mcq("q1", de("Arbeitest du am Montag?"), [opt("a", "Ja, ich arbeite am Montag."), opt("b", "Doch, ich arbeite am Montag."), opt("c", "Ja, ich bin Montag.")], "a", {
        explanation: en("doch only answers a question with nicht."),
      }),
      mcq("q2", en("You are a cook. Answer the question „Sind Sie Lehrer?“"), [opt("a", "Ja, ich bin Koch."), opt("b", "Nein, ich bin Koch."), opt("c", "Doch, ich bin Koch.")], "b"),
      mcq(
        "q3",
        en("Your friend asks „Hast du am Sonntag nicht frei?“. You DO have Sunday off."),
        [opt("a", "Nein, ich habe am Sonntag frei."), opt("b", "Nein, ich arbeite am Sonntag."), opt("c", "Doch, ich habe am Sonntag frei.")],
        "c",
        { explanation: en("To say “yes” to a question with nicht, use doch.") },
      ),
      mcq("q4", en("Which one is a yes/no question?"), [opt("a", "Wo arbeitest du?"), opt("b", "Arbeitest du in Köln?"), opt("c", "Du arbeitest in Köln.")], "b"),
      mcq(
        "q5",
        en("Answer „Spielst du gern Fußball?“ – you don't like football."),
        [opt("a", "Nein, nicht so gern."), opt("b", "Doch, sehr gern."), opt("c", "Ja, sehr gern.")],
        "a",
      ),
      mcq(
        "q6",
        en("You don't know Mr Brandt's job. What do you ask?"),
        [opt("a", "Ist Herr Brandt von Beruf?"), opt("b", "Herr Brandt ist Lehrer."), opt("c", "Was ist Herr Brandt von Beruf?")],
        "c",
      ),
    ],
    refs: [KAP2, ga(11)],
  },
  {
    slug: "m2-artikel",
    skill: "grammar",
    title: { de: "der, die oder das?", en: "der, die or das?" },
    instructions: en("Choose the right article."),
    items: [
      ["q1", "Beruf", "a"],
      ["q2", "Schule", "b"],
      ["q3", "Krankenhaus", "c", "Compound noun: das Haus → das Krankenhaus."],
      ["q4", "Hobby", "c"],
      ["q5", "Montag", "a", "All days of the week are masculine."],
      ["q6", "Firma", "b"],
      ["q7", "Wochenende", "c", "Compound noun: das Ende → das Wochenende."],
      ["q8", "Lehrerin", "b", "Women with -in: always die."],
      ["q9", "Buch", "c"],
      ["q10", "Fußball", "a"],
    ].map(([id, noun, answer, why]) => mcq(id, de(`… ${noun}`), articles, answer, { explanation: why ? en(why) : undefined })),
    refs: [KAP2, ga(15)],
  },
  {
    slug: "m2-arbeitstage-hoeren",
    skill: "listening",
    title: { de: "Hast du am Sonntag frei?", en: "Listening: working days" },
    instructions: en("Listen to the conversation. You can play it twice. Then answer the questions."),
    stimulus: {
      textKind: "dialogue",
      audio: {
        lines: [
          { speaker: "Jana", text: "Hallo, Lukas! Arbeitest du am Montag?", voice: "female", rate: "slow" },
          { speaker: "Lukas", text: "Ja. Ich arbeite am Montag, am Dienstag und am Mittwoch. Und du?", voice: "male", rate: "slow" },
          { speaker: "Jana", text: "Ich bin Krankenpflegerin. Ich arbeite im Krankenhaus, auch am Samstag.", voice: "female", rate: "slow" },
          { speaker: "Lukas", text: "Am Samstag? Hast du am Sonntag frei?", voice: "male", rate: "slow" },
          { speaker: "Jana", text: "Ja, am Sonntag habe ich frei. Und am Donnerstag auch.", voice: "female", rate: "slow" },
          { speaker: "Lukas", text: "Am Donnerstag habe ich auch frei. Wir schwimmen am Donnerstag, okay?", voice: "male", rate: "slow" },
          { speaker: "Jana", text: "Ja, gern!", voice: "female", rate: "slow" },
        ],
      },
      maxPlays: 2,
      transcriptPolicy: "after_submit",
    },
    items: [
      mcq("q1", en("Where does Jana work?"), [opt("a", "in der Schule"), opt("b", "im Krankenhaus"), opt("c", "in der Firma")], "b"),
      tf("q2", "Jana arbeitet am Samstag.", true),
      mcq("q3", en("When is Jana off?"), [opt("a", "am Sonntag und am Donnerstag"), opt("b", "am Samstag und am Sonntag"), opt("c", "am Montag und am Donnerstag")], "a"),
      tf("q4", "Lukas arbeitet am Donnerstag.", false),
      mcq("q5", en("What do they do on Thursday?"), [opt("a", "Fußball spielen"), opt("b", "tanzen"), opt("c", "schwimmen")], "c"),
    ],
    refs: [KAP2, GOETHE_HOEREN],
  },
];

// --- Lesson 4: Zahlen ab 20 und Formulare ------------------------------------------------------

const L4 = [
  {
    slug: "m2-zahlen-zuordnen",
    skill: "vocabulary",
    title: { de: "Zahlen ab 20", en: "Numbers from 20" },
    instructions: en("Match the numbers with the words. Then answer the questions."),
    items: [
      pairs("q1", [
        [de("30"), de("dreißig")],
        [de("40"), de("vierzig")],
        [de("50"), de("fünfzig")],
        [de("60"), de("sechzig")],
        [de("70"), de("siebzig")],
        [de("80"), de("achtzig")],
        [de("90"), de("neunzig")],
        [de("100"), de("hundert")],
      ]),
      pairs("q2", [
        [de("21"), de("einundzwanzig")],
        [de("34"), de("vierunddreißig")],
        [de("43"), de("dreiundvierzig")],
        [de("57"), de("siebenundfünfzig")],
        [de("75"), de("fünfundsiebzig")],
        [de("99"), de("neunundneunzig")],
      ]),
      typed("q3", ["fünfundzwanzig"], { prompt: en("Write 25 as a word.") }),
      mcq("q4", de("sechsundsechzig"), [opt("a", "56"), opt("b", "66"), opt("c", "76")], "b"),
      mcq("q5", de("zweiundachtzig"), [opt("a", "82"), opt("b", "28"), opt("c", "72")], "a", {
        explanation: en("German says the ones first: zwei-und-achtzig = 2 + 80 = 82."),
      }),
    ],
    refs: [KAP2],
  },
  {
    slug: "m2-zahlen-hoeren",
    skill: "listening",
    title: { de: "Zahlen hören", en: "Listening: numbers from 20" },
    instructions: en("Listen and write the number in digits (for example 45)."),
    itemAudioMaxPlays: 2,
    items: [
      ["q1", "dreiundzwanzig", "23", "female"],
      ["q2", "achtundvierzig", "48", "male"],
      ["q3", "Ich bin zweiundsechzig Jahre alt.", "62", "female2"],
      ["q4", "siebenundsiebzig", "77", "male2"],
      ["q5", "einunddreißig", "31", "female"],
      ["q6", "Frau Klein ist vierundfünfzig.", "54", "male"],
      ["q7", "hundert", "100", "female2"],
      ["q8", "Die Postleitzahl ist fünf, null, sechs, sechs, sieben.", "50667", "male2"],
    ].map(([id, audioText, answer, voice]) =>
      typed(id, [answer], { audio: { text: audioText, voice, rate: "slow" }, inputMode: "numeric", ignoreSpaces: true }),
    ),
    refs: [KAP2, GOETHE_HOEREN],
  },
  {
    slug: "m2-plural",
    skill: "grammar",
    title: { de: "Singular und Plural", en: "Singular and plural" },
    instructions: en("Write the plural form. Then choose the right answer."),
    items: [
      gap("q1", "das Buch → die", "", ["Bücher", "die Bücher"]),
      gap("q2", "der Beruf → die", "", ["Berufe", "die Berufe"]),
      gap("q3", "die Schule → die", "", ["Schulen", "die Schulen"]),
      gap("q4", "das Hobby → die", "", ["Hobbys", "die Hobbys"], { explanation: en("Words from English often add -s: die Hobbys (not „Hobbies“).") }),
      gap("q5", "der Lehrer → die", "", ["Lehrer", "die Lehrer"], { explanation: en("Many masculine nouns ending in -er don't change.") }),
      gap("q6", "die Lehrerin → die", "", ["Lehrerinnen", "die Lehrerinnen"]),
      gap("q7", "der Koch → die", "", ["Köche", "die Köche"]),
      gap("q8", "das Formular → die", "", ["Formulare", "die Formulare"]),
      mcq("q9", en("Which article do all plural nouns have?"), [opt("a", "der"), opt("b", "die"), opt("c", "das")], "b"),
      mcq("q10", de("Ich habe zwei …"), [opt("a", "Hobby"), opt("b", "Hobbies"), opt("c", "Hobbys")], "c"),
    ],
    refs: [KAP2, ga(14)],
  },
  {
    slug: "m2-formular-schreiben",
    skill: "writing",
    title: { de: "Anmeldung im Sportverein", en: "Joining a sports club" },
    instructions: en("Milan wants to join a sports club (Sportverein). Read the text and fill in the form for him."),
    stimulus: {
      textKind: "form",
      text: de(
        "Das ist Milan Novak. Er ist 41 Jahre alt und kommt aus Tschechien. Milan ist Koch und arbeitet in Dresden. Seine Adresse ist Kastanienweg 12, 01069 Dresden. Am Wochenende schwimmt er gern.",
      ),
    },
    items: [
      typed("q1", ["Novak"], { label: "Familienname" }),
      typed("q2", ["Milan"], { label: "Vorname" }),
      typed("q3", ["41", "einundvierzig", "41 Jahre", "41 Jahre alt"], { label: "Alter" }),
      typed("q4", ["Koch"], { label: "Beruf" }),
      typed("q5", ["Kastanienweg 12"], { label: "Straße, Hausnummer" }),
      typed("q6", ["01069"], { label: "Postleitzahl", inputMode: "numeric", ignoreSpaces: true }),
      typed("q7", ["Dresden"], { label: "Wohnort" }),
      typed("q8", ["Schwimmen"], { label: "Hobby" }),
    ],
    refs: [KAP2, GOETHE_SCHREIBEN],
  },
];

// --- Lesson 5: Modultest -----------------------------------------------------------------

const L5 = [
  {
    slug: "m2-test-hoeren",
    skill: "listening",
    title: { de: "Test: Hören", en: "Test: listening" },
    instructions: en("Listen to each recording. You can play each one twice. Choose the right answer or write it."),
    itemAudioMaxPlays: 2,
    passThreshold: 0.7,
    items: [
      mcq("q1", en("What is Ms Roth's job?"), [opt("a", "Lehrerin"), opt("b", "Köchin"), opt("c", "Ingenieurin")], "a", {
        audio: { text: "Guten Tag, ich heiße Petra Roth. Ich bin Lehrerin.", voice: "female", rate: "slow" },
      }),
      mcq("q2", en("How old is Jan?"), [opt("a", "63"), opt("b", "36"), opt("c", "26")], "b", {
        audio: { text: "Hallo, ich bin Jan. Ich bin sechsunddreißig Jahre alt.", voice: "male", rate: "slow" },
      }),
      mcq("q3", en("When does Emre work?"), [opt("a", "am Donnerstag und am Freitag"), opt("b", "am Dienstag und am Freitag"), opt("c", "am Dienstag und am Donnerstag")], "c", {
        audio: { text: "Ich arbeite am Dienstag und am Donnerstag. Am Freitag habe ich frei.", voice: "male2", rate: "slow" },
      }),
      mcq("q4", en("What is Lisa's hobby?"), [opt("a", "Schwimmen"), opt("b", "Tanzen"), opt("c", "Lesen")], "b", {
        audio: { text: "Ich heiße Lisa. Mein Hobby ist Tanzen. Ich tanze am Wochenende.", voice: "female2", rate: "slow" },
      }),
      typed("q5", ["70173"], {
        prompt: en("Write the postcode."),
        audio: { text: "Die Postleitzahl ist: sieben, null, eins, sieben, drei.", voice: "female", rate: "slow" },
        inputMode: "numeric",
        ignoreSpaces: true,
      }),
      mcq("q6", en("Where does Mr Wolf work?"), [opt("a", "in der Schule"), opt("b", "in der Firma"), opt("c", "im Krankenhaus")], "c", {
        audio: { text: "Mein Name ist Wolf. Ich bin Krankenpfleger und arbeite im Krankenhaus in Kiel.", voice: "male", rate: "slow" },
      }),
    ],
    refs: [KAP2, GOETHE_HOEREN],
  },
  {
    slug: "m2-test-lesen",
    skill: "reading",
    title: { de: "Test: Lesen", en: "Test: reading" },
    instructions: en("Read the e-mail. Are the sentences true (richtig) or false (falsch)?"),
    passThreshold: 0.7,
    stimulus: {
      textKind: "email",
      text: de(
        "Hallo Sven,\n\nwie geht's? Ich wohne jetzt in Freiburg. Ich bin Ingenieurin und arbeite bei Solartec. Ich arbeite am Montag, am Dienstag, am Mittwoch und am Donnerstag. Am Freitag habe ich frei!\nMeine Hobbys hier sind Schwimmen und Fahrrad fahren. Und am Wochenende lese ich viel.\nUnd du? Bist du noch Student?\n\nViele Grüße\nKatrin",
      ),
    },
    items: [
      tf("q1", "Katrin wohnt jetzt in Freiburg.", true),
      tf("q2", "Katrin ist Lehrerin.", false),
      tf("q3", "Katrin arbeitet am Freitag.", false),
      tf("q4", "Katrin schwimmt gern.", true, { explanation: en("Her hobbies are „Schwimmen und Fahrrad fahren“.") }),
      tf("q5", "Sven schreibt die E-Mail.", false, { explanation: en("Katrin writes to Sven: „Hallo Sven, …“.") }),
    ],
    refs: [KAP2, GOETHE_LESEN],
  },
  {
    slug: "m2-test-formular",
    skill: "writing",
    title: { de: "Test: Ein Formular ausfüllen", en: "Test: fill in a form" },
    instructions: en("Yuki wants to join a language café. Read about her and fill in the form for her."),
    passThreshold: 0.7,
    stimulus: {
      textKind: "form",
      text: de(
        "Das ist Yuki Tanaka. Yuki kommt aus Japan und wohnt jetzt in Bonn. Sie ist 27 Jahre alt und Studentin. Ihre Adresse ist Rosenstraße 8, 53111 Bonn. Sie spielt gern Tennis und hört gern Musik.",
      ),
    },
    items: [
      typed("q1", ["Tanaka"], { label: "Familienname" }),
      typed("q2", ["27", "siebenundzwanzig", "27 Jahre", "27 Jahre alt"], { label: "Alter" }),
      typed("q3", ["Studentin"], { label: "Beruf" }),
      typed("q4", ["53111"], { label: "Postleitzahl", inputMode: "numeric", ignoreSpaces: true }),
      typed("q5", ["Bonn"], { label: "Wohnort" }),
    ],
    refs: [KAP2, GOETHE_SCHREIBEN],
  },
  {
    slug: "m2-test-grammatik",
    skill: "grammar",
    title: { de: "Test: Grammatik", en: "Test: grammar" },
    instructions: en("Answer all questions."),
    passThreshold: 0.7,
    items: [
      gap("q1", "Du", "gern Bücher. (lesen)", ["liest"]),
      gap("q2", "Er", "gern Fahrrad. (fahren)", ["fährt"]),
      gap("q3", "", "ihr am Samstag frei? (haben)", ["Habt"]),
      gap("q4", "Frau Roth", "Lehrerin. (sein)", ["ist"]),
      gap("q5", "Ich", "30 Jahre alt. (sein)", ["bin"]),
      mcq("q6", de("… Firma"), articles, "b"),
      mcq("q7", de("… Wochenende"), articles, "c"),
      mcq("q8", en("Plural: das Buch – die …"), [opt("a", "Buchs"), opt("b", "Bücher"), opt("c", "Buchen")], "b"),
      order("q9", ["Bist", "du", "Studentin", "?"]),
      mcq(
        "q10",
        en("„Arbeitest du am Sonntag nicht?“ – You DO work on Sunday."),
        [opt("a", "Doch, ich arbeite am Sonntag."), opt("b", "Nein, ich arbeite am Sonntag."), opt("c", "Nein, am Sonntag habe ich frei.")],
        "a",
      ),
    ],
    refs: [KAP2],
  },
  {
    slug: "m2-test-wortschatz",
    skill: "vocabulary",
    title: { de: "Test: Wortschatz", en: "Test: vocabulary" },
    instructions: en("Answer all questions."),
    passThreshold: 0.7,
    items: [
      mcq("q1", en("Which day comes after Dienstag?"), [opt("a", "Montag"), opt("b", "Donnerstag"), opt("c", "Mittwoch")], "c"),
      typed("q2", ["fünfundvierzig"], { prompt: en("Write 45 as a word.") }),
      mcq("q3", de("achtundneunzig"), [opt("a", "89"), opt("b", "98"), opt("c", "88")], "b"),
      mcq("q4", en("Tom looks after patients in a hospital. He is …"), [opt("a", "Lehrer."), opt("b", "Krankenpfleger."), opt("c", "Koch.")], "b"),
      pairs("q5", [
        [de("das Formular"), en("form")],
        [de("der Beruf"), en("job")],
        [de("das Alter"), en("age")],
        [de("die Adresse"), en("address")],
        [de("das Wochenende"), en("weekend")],
      ]),
      mcq("q6", en("You like reading. What do you say?"), [opt("a", "Ich habe gern."), opt("b", "Ich lese gern."), opt("c", "Ich bin gern Buch.")], "b"),
      mcq("q7", en("On a German form, „PLZ“ means …"), [opt("a", "Postleitzahl"), opt("b", "Telefonnummer"), opt("c", "Wohnort")], "a"),
    ],
    refs: [KAP2],
  },
  {
    slug: "m2-test-sprechen",
    skill: "speaking",
    title: { de: "Test: Sprechen", en: "Test: speaking" },
    instructions: en(
      "Practise parts 1 and 2 of the A1 speaking exam. Speak for yourself; the model answer is only an example. This practice is not scored.",
    ),
    items: [
      speak(
        "q1",
        "Introduce yourself using the keywords.",
        "Ich heiße Nadia Hossain. Ich bin 31 Jahre alt. Ich komme aus Bangladesch und wohne jetzt in Leipzig. Ich spreche Bengali, Englisch und ein bisschen Deutsch. Ich bin Informatikerin. Mein Hobby ist Lesen.",
        { cue: de("Name? – Alter? – Land? – Wohnort? – Sprachen? – Beruf? – Hobby?") },
      ),
      speak("q2", "Exam part 2, topic „Arbeit“: your card says „Wochenende?“. Ask your partner a question.", "Arbeitest du am Wochenende?", {
        cue: de("Arbeit – Wochenende?"),
        modelAudio: { text: "Arbeitest du am Wochenende?", voice: "male", rate: "slow" },
      }),
      speak("q3", "Your partner asks: „Was bist du von Beruf?“ Answer.", "Ich bin Krankenpfleger. Ich arbeite im Krankenhaus.", {
        modelAudio: { text: "Ich bin Krankenpfleger. Ich arbeite im Krankenhaus.", voice: "male", rate: "slow" },
      }),
      // Written model shows digits; the audio reads the postcode digit by digit.
      speak("q4", "The examiner asks for a number: say your postcode.", "Meine Postleitzahl ist 04109.", {
        modelAudio: { text: "Meine Postleitzahl ist null, vier, eins, null, neun.", voice: "female", rate: "slow" },
      }),
    ],
    refs: [KAP2, GOETHE_SPRECHEN],
  },
];

export const EXERCISES_BY_LESSON = { L1, L2, L3, L4, L5 };
export const EXERCISES = [...L1, ...L2, ...L3, ...L4, ...L5];
