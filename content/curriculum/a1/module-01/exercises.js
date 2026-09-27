// Module 1 exercises. All texts, dialogues and questions are original. Task *formats*
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
const KAP1 = { ref: "netzwerk-neu-a1-1", note: "Topic alignment only" };

const timeOfDay = [optEn("a", "in the morning"), optEn("b", "in the evening"), optEn("c", "before going to bed")];

// --- Lesson 1: Hallo und Tschüs ----------------------------------------------------------

const L1 = [
  {
    slug: "m1-gruessen-situationen",
    skill: "vocabulary",
    title: { de: "Was sagen Sie?", en: "What do you say?" },
    instructions: en("Choose the right greeting for each situation."),
    items: [
      mcq("q1", en("It is 8 a.m. You meet your neighbour."), [opt("a", "Guten Morgen!"), opt("b", "Gute Nacht!"), opt("c", "Guten Abend!")], "a"),
      mcq("q2", en("It is 7 p.m. You arrive at a friend's party."), [opt("a", "Guten Morgen!"), opt("b", "Guten Abend!"), opt("c", "Gute Nacht!")], "b", {
        explanation: en("Gute Nacht is only for going to bed. In the evening you say Guten Abend."),
      }),
      mcq("q3", en("You say goodbye to your new boss, Ms Keller."), [opt("a", "Tschüs, Mia!"), opt("b", "Guten Morgen, Frau Keller!"), opt("c", "Auf Wiedersehen, Frau Keller!")], "c", {
        explanation: en("With Sie and a surname, the goodbye is Auf Wiedersehen."),
      }),
      mcq("q4", en("You are going to bed. What do you say to your family?"), [opt("a", "Guten Tag!"), opt("b", "Gute Nacht!"), opt("c", "Auf Wiedersehen!")], "b"),
      mcq("q5", en("You meet your friend Tim in the afternoon."), [opt("a", "Hallo, Tim!"), opt("b", "Gute Nacht, Tim!"), opt("c", "Auf Wiedersehen, Herr Tim!")], "a"),
      mcq("q6", en("Someone asks you „Wie geht's?“. You are fine."), [opt("a", "Ich heiße Tim."), opt("b", "Auf Wiedersehen!"), opt("c", "Danke, gut!")], "c"),
    ],
    refs: [KAP1],
  },
  {
    slug: "m1-formell-informell",
    skill: "grammar",
    title: { de: "Formell oder informell?", en: "Formal or informal?" },
    instructions: en("Is the sentence formal (Sie) or informal (du)?"),
    items: [
      ["q1", "Wie geht es Ihnen?", "a"],
      ["q2", "Hallo, Lena! Wie geht's?", "b"],
      ["q3", "Guten Tag, Herr Brandt!", "a"],
      ["q4", "Wie heißt du?", "b"],
      ["q5", "Tschüs, bis bald!", "b"],
      ["q6", "Wie heißen Sie?", "a"],
    ].map(([id, sentence, answer]) => mcq(id, de(sentence), [optEn("a", "formal (Sie)"), optEn("b", "informal (du)")], answer)),
    refs: [KAP1],
  },
  {
    slug: "m1-begruessung-hoeren",
    skill: "listening",
    title: { de: "Guten Morgen, Frau Weber!", en: "Listening: a morning greeting" },
    instructions: en("Listen to the conversation. You can play it twice. Then answer the questions."),
    stimulus: {
      textKind: "dialogue",
      audio: {
        lines: [
          { speaker: "Frau Weber", text: "Guten Morgen, Herr Brandt!", voice: "female" },
          { speaker: "Herr Brandt", text: "Guten Morgen, Frau Weber! Wie geht es Ihnen?", voice: "male" },
          { speaker: "Frau Weber", text: "Danke, sehr gut. Und Ihnen?", voice: "female" },
          { speaker: "Herr Brandt", text: "Auch gut, danke.", voice: "male" },
        ],
      },
      maxPlays: 2,
      transcriptPolicy: "after_submit",
    },
    items: [
      mcq("q1", en("When does the conversation take place?"), timeOfDay, "a"),
      tf("q2", "Frau Weber und Herr Brandt sagen „Sie“.", true, { explanation: en("They say „Wie geht es Ihnen?“ – that is the formal Sie.") }),
      mcq("q3", en("How is Ms Weber?"), [opt("a", "sehr gut"), opt("b", "nicht so gut"), opt("c", "schlecht")], "a"),
      tf("q4", "Herr Brandt sagt „Tschüs“.", false),
    ],
    refs: [KAP1, GOETHE_HOEREN],
  },
];

// --- Lesson 2: Ich heiße … -------------------------------------------------------------

const L2 = [
  {
    slug: "m1-heissen-sein",
    skill: "grammar",
    title: { de: "heißen und sein", en: "heißen and sein" },
    instructions: en("Write the correct form of the verb in brackets."),
    items: [
      gap("q1", "Ich", "Lena. (heißen)", ["heiße", "heisse"]),
      gap("q2", "Wie", "du? (heißen)", ["heißt", "heisst"], { explanation: en("du heißt – the stem already ends in ß, so only -t is added.") }),
      gap("q3", "Wie", "Sie? (heißen)", ["heißen", "heissen"]),
      gap("q4", "Ich", "Jonas. (sein)", ["bin"]),
      gap("q5", "", "du Paul? (sein)", ["Bist"]),
      gap("q6", "Wer", "das? – Das ist Frau Klein. (sein)", ["ist"]),
    ],
    refs: [KAP1, { ref: "grammatik-aktiv-2", note: "Topic alignment only" }],
  },
  {
    slug: "m1-fragen-bauen",
    skill: "grammar",
    title: { de: "Sätze bauen", en: "Build the sentence" },
    instructions: en("Put the words in the right order."),
    items: [
      order("q1", ["Wie", "heißt", "du", "?"]),
      order("q2", ["Wie", "heißen", "Sie", "?"]),
      order("q3", ["Wer", "ist", "das", "?"]),
      order("q4", ["Ich", "heiße", "Emma", "."]),
    ],
    refs: [KAP1, { ref: "grammatik-aktiv-10", note: "Topic alignment only" }],
  },
  {
    slug: "m1-vorstellung-lesen",
    skill: "reading",
    title: { de: "Eine Nachricht von Jonas", en: "A message from Jonas" },
    instructions: en("Read the message. Are the sentences true (richtig) or false (falsch)?"),
    stimulus: {
      textKind: "message",
      text: de(
        "Hallo! Ich heiße Jonas Richter. Jonas ist mein Vorname, Richter ist mein Nachname.\nDas ist Frau Yilmaz. Frau Yilmaz und ich sagen „Sie“.\nUnd das ist Emma. Emma und ich sagen „du“.\nTschüs!\nJonas",
      ),
    },
    items: [
      tf("q1", "Der Vorname ist Richter.", false),
      tf("q2", "Der Nachname ist Richter.", true),
      tf("q3", "Jonas und Frau Yilmaz sagen „du“.", false),
      tf("q4", "Jonas und Emma sagen „du“.", true),
      tf("q5", "Jonas sagt „Tschüs“.", true),
    ],
    refs: [KAP1, GOETHE_LESEN],
  },
  {
    slug: "m1-vorstellen-sprechen",
    skill: "speaking",
    title: { de: "Sich vorstellen", en: "Introduce yourself" },
    instructions: en("Say your answer out loud. Then compare it with the model answer and rate yourself."),
    items: [
      speak("q1", "Greet the examiner formally and say your full name.", "Guten Tag! Ich heiße Lena Brandt."),
      speak("q2", "Ask a classmate for their name (informal).", "Hallo! Wie heißt du?"),
      speak("q3", "Politely ask an older person you don't know for their name.", "Entschuldigung, wie heißen Sie?"),
    ],
    refs: [KAP1, GOETHE_SPRECHEN],
  },
];

// --- Lesson 3: Woher kommst du? --------------------------------------------------------

const L3 = [
  {
    slug: "m1-w-woerter",
    skill: "grammar",
    title: { de: "Welches W-Wort?", en: "Which question word?" },
    instructions: en("Choose the question word that fits the answer."),
    items: [
      ["q1", "… kommst du? – Aus Indien.", "d"],
      ["q2", "… wohnen Sie? – In Wien.", "e"],
      ["q3", "… heißt du? – Emma.", "b"],
      ["q4", "… ist das? – Das ist Herr Brandt.", "a"],
      ["q5", "… heißt „hello“ auf Deutsch? – Hallo.", "c"],
    ].map(([id, prompt, answer]) =>
      mcq(id, de(prompt), [opt("a", "Wer"), opt("b", "Wie"), opt("c", "Was"), opt("d", "Woher"), opt("e", "Wo")], answer),
    ),
    refs: [KAP1, { ref: "grammatik-aktiv-10", note: "Topic alignment only" }],
  },
  {
    slug: "m1-kommen-wohnen-sprechen",
    skill: "grammar",
    title: { de: "kommen, wohnen, sprechen", en: "kommen, wohnen, sprechen" },
    instructions: en("Write the correct verb form."),
    items: [
      gap("q1", "Ich", "aus Bangladesch. (kommen)", ["komme"]),
      gap("q2", "Woher", "du? (kommen)", ["kommst"]),
      gap("q3", "Frau Keller", "in Graz. (wohnen)", ["wohnt"]),
      gap("q4", "Wo", "ihr? (wohnen)", ["wohnt"]),
      gap("q5", "Ich", "Deutsch und Englisch. (sprechen)", ["spreche"]),
      gap("q6", "Paul", "Spanisch. (sprechen)", ["spricht"], { explanation: en("sprechen changes e → i: du sprichst, er spricht.") }),
      gap("q7", "Wir", "aus Polen. (kommen)", ["kommen"]),
    ],
    refs: [KAP1, { ref: "grammatik-aktiv-2", note: "Topic alignment only" }],
  },
  {
    slug: "m1-verb-position-2",
    skill: "grammar",
    title: { de: "Das Verb auf Position 2", en: "The verb in position 2" },
    instructions: en("Put the words in the right order."),
    items: [
      order("q1", ["Ich", "komme", "aus", "Indien", "."], { alternatives: ["Aus Indien komme ich."] }),
      order("q2", ["Woher", "kommen", "Sie", "?"]),
      order("q3", ["Wo", "wohnst", "du", "?"]),
      order("q4", ["Wir", "sprechen", "Deutsch", "."], { alternatives: ["Deutsch sprechen wir."] }),
    ],
    refs: [KAP1, { ref: "grammatik-aktiv-12", note: "Topic alignment only" }],
  },
  {
    slug: "m1-laender-verben-zuordnen",
    skill: "vocabulary",
    title: { de: "Was passt zusammen?", en: "What goes together?" },
    instructions: en("Match each item on the left with the right one."),
    items: [
      pairs(
        "q1",
        [
          [de("Deutschland"), de("Berlin")],
          [de("Österreich"), de("Wien")],
          [de("Bangladesch"), de("Dhaka")],
          [de("Spanien"), de("Madrid")],
          [de("Indien"), de("Neu-Delhi")],
        ],
        { prompt: en("Country and capital city") },
      ),
      pairs(
        "q2",
        [
          [de("sprechen"), en("to speak")],
          [de("wohnen"), en("to live")],
          [de("kommen"), en("to come")],
          [de("heißen"), en("to be called")],
        ],
        { prompt: en("Verb and meaning") },
      ),
    ],
    refs: [KAP1],
  },
  {
    slug: "m1-herkunft-lesen",
    skill: "reading",
    title: { de: "Arif und Ana", en: "Arif and Ana" },
    instructions: en("Read the text. Are the sentences true (richtig) or false (falsch)?"),
    stimulus: {
      textKind: "profile",
      text: de(
        "Hallo, ich bin Arif. Ich komme aus Bangladesch, aus Dhaka. Jetzt wohne ich in Leipzig. Ich spreche Bengali, Englisch und ein bisschen Deutsch.\nDas ist Ana. Ana kommt aus Spanien und wohnt auch in Leipzig. Sie spricht Spanisch, Englisch und Deutsch.",
      ),
    },
    items: [
      tf("q1", "Arif kommt aus Indien.", false),
      tf("q2", "Arif wohnt in Leipzig.", true),
      tf("q3", "Arif spricht sehr gut Deutsch.", false, { explanation: en("He speaks „ein bisschen Deutsch“ – a little German.") }),
      tf("q4", "Ana kommt aus Spanien.", true),
      tf("q5", "Ana wohnt in Madrid.", false),
    ],
    refs: [KAP1, GOETHE_LESEN],
  },
  {
    slug: "m1-herkunft-hoeren",
    skill: "listening",
    title: { de: "Im Deutschkurs", en: "Listening: in the German course" },
    instructions: en("Listen to the conversation. You can play it twice. Choose the right answer."),
    stimulus: {
      textKind: "dialogue",
      audio: {
        lines: [
          { speaker: "Julia", text: "Hallo! Ich bin Julia. Wie heißt du?", voice: "female" },
          { speaker: "Karim", text: "Hallo, Julia! Ich heiße Karim.", voice: "male" },
          { speaker: "Julia", text: "Woher kommst du, Karim?", voice: "female" },
          { speaker: "Karim", text: "Ich komme aus Indien, aus Mumbai. Und du?", voice: "male" },
          { speaker: "Julia", text: "Ich komme aus Österreich, aus Salzburg. Ich wohne jetzt in München.", voice: "female" },
          { speaker: "Karim", text: "Ich wohne auch in München!", voice: "male" },
        ],
      },
      maxPlays: 2,
    },
    items: [
      mcq("q1", en("Where does Karim come from?"), [opt("a", "aus Indien"), opt("b", "aus Österreich"), opt("c", "aus Deutschland")], "a"),
      mcq("q2", en("Where does Julia come from?"), [opt("a", "aus Mumbai"), opt("b", "aus Salzburg"), opt("c", "aus München")], "b"),
      mcq("q3", en("Where do they both live now?"), [opt("a", "in Salzburg"), opt("b", "in Mumbai"), opt("c", "in München")], "c"),
    ],
    refs: [KAP1, GOETHE_HOEREN],
  },
];

// --- Lesson 4: Zahlen von 0 bis 20 -------------------------------------------------------

const L4 = [
  {
    slug: "m1-zahlen-zuordnen",
    skill: "vocabulary",
    title: { de: "Zahlen und Wörter", en: "Numbers and words" },
    instructions: en("Match the number with the word."),
    items: [
      pairs("q1", [
        [de("3"), de("drei")],
        [de("7"), de("sieben")],
        [de("12"), de("zwölf")],
        [de("16"), de("sechzehn")],
        [de("20"), de("zwanzig")],
        [de("0"), de("null")],
      ]),
      pairs("q2", [
        [de("11"), de("elf")],
        [de("13"), de("dreizehn")],
        [de("17"), de("siebzehn")],
        [de("19"), de("neunzehn")],
        [de("6"), de("sechs")],
        [de("8"), de("acht")],
      ]),
    ],
    refs: [KAP1],
  },
  {
    slug: "m1-zahlen-hoeren",
    skill: "listening",
    title: { de: "Zahlen hören", en: "Listening: numbers" },
    instructions: en("Listen and write the number in digits (for example 7)."),
    itemAudioMaxPlays: 2,
    items: [
      ["q1", "sieben", "7"],
      ["q2", "zwölf", "12"],
      ["q3", "fünfzehn", "15"],
      ["q4", "Ich bin neunzehn Jahre alt.", "19"],
      ["q5", "zwanzig", "20"],
      ["q6", "drei", "3"],
    ].map(([id, audioText, answer]) =>
      typed(id, [answer], { audio: { text: audioText, voice: id === "q4" ? "male" : "female", rate: "slow" }, inputMode: "numeric", ignoreSpaces: true }),
    ),
    refs: [KAP1, GOETHE_HOEREN],
  },
  {
    slug: "m1-handynummer-hoeren",
    skill: "listening",
    title: { de: "Eine Nachricht von Anna", en: "Listening: a phone message" },
    instructions: en("Listen to the phone message. You can play it twice."),
    stimulus: {
      textKind: "message",
      audio: {
        lines: [
          {
            speaker: "Anna",
            text: "Hallo, hier ist Anna. Meine Handynummer ist: null, eins, fünf, zwei – drei, acht – sechs, vier – zwei, null. Tschüs, bis bald!",
            voice: "female",
          },
        ],
      },
      maxPlays: 2,
    },
    items: [
      mcq("q1", en("What is Anna's mobile number?"), [opt("a", "0152 38 46 20"), opt("b", "0152 38 64 20"), opt("c", "0152 83 64 20")], "b"),
      typed("q2", ["Anna"], { prompt: en("Who is calling? Write the name.") }),
    ],
    refs: [KAP1, GOETHE_HOEREN],
  },
  {
    slug: "m1-fragen-antworten",
    skill: "reading",
    title: { de: "Fragen und Antworten", en: "Questions and answers" },
    instructions: en("Match each question with the right answer."),
    items: [
      pairs("q1", [
        [de("Wie heißt du?"), de("Ich heiße Tom.")],
        [de("Woher kommst du?"), de("Aus Polen.")],
        [de("Wie alt bist du?"), de("Ich bin sechzehn.")],
        [de("Wie ist deine Handynummer?"), de("0151 27 83 40.")],
        [de("Wo wohnst du?"), de("In Hamburg.")],
      ]),
    ],
    refs: [KAP1],
  },
];

// --- Lesson 5: Das Alphabet ---------------------------------------------------------------

const L5 = [
  {
    slug: "m1-namen-buchstabieren-hoeren",
    skill: "listening",
    title: { de: "Namen buchstabieren", en: "Listening: spelled names" },
    instructions: en("Listen to the spelled surname and write it."),
    itemAudioMaxPlays: 2,
    items: [
      ["q1", "M, Ü, L, L, E, R", ["Müller", "Mueller"]],
      ["q2", "K, E, L, L, E, R", ["Keller"]],
      ["q3", "S, C, H, M, I, D, T", ["Schmidt"]],
      ["q4", "W, E, B, E, R", ["Weber"]],
      ["q5", "Y, I, L, M, A, Z", ["Yilmaz"]],
    ].map(([id, spelled, accepted]) => typed(id, accepted, { audio: { text: spelled, voice: "male", rate: "slow" } })),
    refs: [KAP1, GOETHE_HOEREN],
  },
  {
    slug: "m1-email-hoeren",
    skill: "listening",
    title: { de: "E-Mail-Adressen", en: "Listening: e-mail addresses" },
    instructions: en("Listen and choose the e-mail address you hear."),
    itemAudioMaxPlays: 2,
    items: [
      mcq("q1", en("Which address do you hear?"), [opt("a", "lena-brandt@beispiel.de"), opt("b", "lenabrandt@beispiel.de"), opt("c", "lena.brandt@beispiel.de")], "c", {
        audio: { text: "lena Punkt brandt ät beispiel Punkt de", voice: "female", rate: "slow" },
      }),
      mcq("q2", en("Which address do you hear?"), [opt("a", "tom-keller@beispiel.com"), opt("b", "tom.keller@beispiel.com"), opt("c", "tomkeller@beispiel.com")], "a", {
        audio: { text: "tom Bindestrich keller ät beispiel Punkt com", voice: "male", rate: "slow" },
      }),
      mcq("q3", en("Which address do you hear?"), [opt("a", "s.jung@beispiel.de"), opt("b", "s-jung@beispiel.de"), opt("c", "sjung@beispiel.de")], "a", {
        audio: { text: "s Punkt jung ät beispiel Punkt de", voice: "female", rate: "slow" },
      }),
    ],
    refs: [KAP1],
  },
  {
    slug: "m1-buchstabieren-sprechen",
    skill: "speaking",
    title: { de: "Buchstabieren Sie bitte!", en: "Please spell it!" },
    instructions: en("Say your answer out loud. Then compare it with the model answer and rate yourself."),
    items: [
      speak("q1", "Spell your first name.", "Mein Vorname ist Lena: L, E, N, A."),
      // Written model shows the address; the audio says it the way Germans read it aloud.
      speak("q2", "Say your e-mail address.", "Meine E-Mail-Adresse ist lena.brandt@beispiel.de.", {
        modelAudio: { text: "Meine E-Mail-Adresse ist lena Punkt brandt ät beispiel Punkt de.", voice: "female", rate: "slow" },
      }),
    ],
    refs: [KAP1, GOETHE_SPRECHEN],
  },
];

// --- Lesson 6: Modultest -----------------------------------------------------------------

const L6 = [
  {
    slug: "m1-test-hoeren",
    skill: "listening",
    title: { de: "Test: Hören", en: "Test: listening" },
    instructions: en("Listen to each recording. You can play each one twice. Choose the right answer or write it."),
    itemAudioMaxPlays: 2,
    passThreshold: 0.7,
    items: [
      mcq("q1", en("Where does Marek come from?"), [opt("a", "aus Portugal"), opt("b", "aus Polen"), opt("c", "aus Paris")], "b", {
        audio: { text: "Hallo, ich bin Marek. Ich komme aus Polen, aus Krakau.", voice: "male", rate: "slow" },
      }),
      mcq("q2", en("What is the phone number?"), [opt("a", "069 14 17 12"), opt("b", "069 40 70 12"), opt("c", "069 14 70 20")], "a", {
        audio: { text: "Meine Telefonnummer ist null, sechs, neun – vierzehn – siebzehn – zwölf.", voice: "female", rate: "slow" },
      }),
      mcq("q3", en("When do the people meet?"), timeOfDay, "b", {
        audio: { text: "Guten Abend, Herr Kaya! Wie geht es Ihnen?", voice: "female2", rate: "slow" },
      }),
      typed("q4", ["Paulsen"], {
        prompt: en("Write the surname."),
        audio: { text: "Ich heiße Paulsen. P, A, U, L, S, E, N.", voice: "male2", rate: "slow" },
      }),
      mcq("q5", en("Which languages does she speak?"), [opt("a", "Deutsch und Spanisch"), opt("b", "Englisch und Spanisch"), opt("c", "Deutsch und Englisch")], "c", {
        audio: { text: "Ich wohne in Graz, in Österreich. Ich spreche Deutsch und Englisch.", voice: "female", rate: "slow" },
      }),
    ],
    refs: [KAP1, GOETHE_HOEREN],
  },
  {
    slug: "m1-test-lesen",
    skill: "reading",
    title: { de: "Test: Lesen", en: "Test: reading" },
    instructions: en("Read the e-mail. Are the sentences true (richtig) or false (falsch)?"),
    passThreshold: 0.7,
    stimulus: {
      textKind: "email",
      text: de(
        "Liebe Frau Keller,\n\nich heiße Tarek Haddad. Ich bin neu im Deutschkurs A1. Ich komme aus Jordanien und wohne jetzt in Frankfurt. Ich spreche Arabisch und Englisch. Meine Handynummer ist 0157 32 18 90.\n\nViele Grüße\nTarek Haddad",
      ),
    },
    items: [
      tf("q1", "Tarek kommt aus Frankfurt.", false),
      tf("q2", "Tarek wohnt in Frankfurt.", true),
      tf("q3", "Tarek spricht Deutsch und Englisch.", false),
      tf("q4", "Frau Keller schreibt die E-Mail.", false, { explanation: en("Tarek writes to Frau Keller: „Liebe Frau Keller, …“.") }),
      tf("q5", "Die Handynummer ist 0157 32 18 90.", true),
    ],
    refs: [KAP1, GOETHE_LESEN],
  },
  {
    slug: "m1-test-formular",
    skill: "writing",
    title: { de: "Test: Ein Formular ausfüllen", en: "Test: fill in a form" },
    instructions: en("Read about Sofia. Fill in the form for her."),
    passThreshold: 0.7,
    stimulus: {
      textKind: "form",
      text: de(
        "Das ist Sofia Marquez. Sofia kommt aus Spanien, aus Valencia. Jetzt wohnt sie in Bremen. Sie spricht Spanisch, Englisch und ein bisschen Deutsch. Ihre Telefonnummer ist 0421 55 73 18.",
      ),
    },
    items: [
      typed("q1", ["Sofia"], { label: "Vorname" }),
      typed("q2", ["Marquez"], { label: "Familienname" }),
      typed("q3", ["Spanien"], { label: "Herkunftsland" }),
      typed("q4", ["Bremen"], { label: "Wohnort" }),
      typed("q5", ["0421 55 73 18"], { label: "Telefon", ignoreSpaces: true, inputMode: "numeric" }),
    ],
    refs: [KAP1, GOETHE_SCHREIBEN],
  },
  {
    slug: "m1-test-grammatik",
    skill: "grammar",
    title: { de: "Test: Grammatik", en: "Test: grammar" },
    instructions: en("Answer all questions."),
    passThreshold: 0.7,
    items: [
      gap("q1", "Woher", "Sie? (kommen)", ["kommen"]),
      gap("q2", "Du", "Deutsch. (sprechen)", ["sprichst"]),
      gap("q3", "Wir", "in Köln. (wohnen)", ["wohnen"]),
      gap("q4", "", "ihr Tom und Lisa? (sein)", ["Seid"]),
      mcq("q5", de("… wohnst du? – In Dresden."), [opt("a", "Woher"), opt("b", "Wo"), opt("c", "Wer")], "b"),
      order("q6", ["Wie", "heißen", "Sie", "?"]),
      order("q7", ["Ich", "wohne", "in", "Bremen", "."], { alternatives: ["In Bremen wohne ich."] }),
    ],
    refs: [KAP1],
  },
  {
    slug: "m1-test-wortschatz",
    skill: "vocabulary",
    title: { de: "Test: Wortschatz", en: "Test: vocabulary" },
    instructions: en("Answer all questions."),
    passThreshold: 0.7,
    items: [
      mcq("q1", en("What do you say in the evening?"), [opt("a", "Guten Abend!"), opt("b", "Guten Morgen!"), opt("c", "Gute Nacht!")], "a"),
      mcq("q2", en("Formal goodbye:"), [opt("a", "Tschüs!"), opt("b", "Bis bald!"), opt("c", "Auf Wiedersehen!")], "c"),
      mcq("q3", de("vierzehn"), [opt("a", "4"), opt("b", "14"), opt("c", "40")], "b"),
      typed("q4", ["siebzehn"], { prompt: en("Write 17 as a word.") }),
      mcq("q5", en("You didn't understand. What do you say?"), [opt("a", "Danke!"), opt("b", "Wie bitte?"), opt("c", "Wie geht's?")], "b"),
      pairs("q6", [
        [de("die Sprache"), en("language")],
        [de("das Land"), en("country")],
        [de("die Stadt"), en("city")],
        [de("der Nachname"), en("surname")],
      ]),
    ],
    refs: [KAP1],
  },
  {
    slug: "m1-test-sprechen",
    skill: "speaking",
    title: { de: "Test: Sprechen – sich vorstellen", en: "Test: speaking – introduce yourself" },
    instructions: en(
      "Practise the first part of the A1 speaking exam. Speak for yourself; the model answer is only an example. This practice is not scored.",
    ),
    items: [
      speak(
        "q1",
        "Introduce yourself using the keywords.",
        "Ich heiße Lena Brandt. Ich bin 24 Jahre alt. Ich komme aus Deutschland, aus Hamburg. Ich wohne in Köln. Ich spreche Deutsch, Englisch und ein bisschen Spanisch.",
        { cue: de("Name? – Alter? – Land? – Wohnort? – Sprachen?") },
      ),
      speak("q2", "The examiner asks you to spell your surname.", "Brandt: B, R, A, N, D, T."),
      speak("q3", "The examiner asks for your phone number.", "Meine Telefonnummer ist 0176 45 12 38."),
    ],
    refs: [KAP1, GOETHE_SPRECHEN],
  },
];

export const EXERCISES_BY_LESSON = { L1, L2, L3, L4, L5, L6 };
export const EXERCISES = [...L1, ...L2, ...L3, ...L4, ...L5, ...L6];
