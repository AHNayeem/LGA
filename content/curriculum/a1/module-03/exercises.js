// Module 3 exercises. All texts, dialogues, announcements, signs and questions are original.
// Task *formats* follow the Goethe A1 structure documented in docs/REFERENCE-ANALYSIS.md
// (3-option MC, richtig/falsch, form filling, dialogues played twice, announcements played
// once, signs); no exam content is reproduced. Situation prompts are in English so beginners
// know what to do; the language being tested is always German.

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
// A Goethe-style announcement, heard once.
const say = (text, voice = "female") => ({ audio: { text, voice, rate: "slow" } });

const GOETHE_HOEREN = { ref: "goethe-start-deutsch-1-hoeren", note: "Task format only" };
const GOETHE_LESEN = { ref: "goethe-start-deutsch-1-lesen", note: "Task format only" };
const GOETHE_SCHREIBEN = { ref: "goethe-start-deutsch-1-schreiben", note: "Task format only" };
const GOETHE_SPRECHEN = { ref: "goethe-start-deutsch-1-sprechen", note: "Task format only" };
const KAP3 = { ref: "netzwerk-neu-a1-3", note: "Topic alignment only" };
const P1 = { ref: "netzwerk-neu-a1-p1", note: "Topic alignment only" };
const GA15 = { ref: "grammatik-aktiv-15", note: "Topic alignment only" };
const GA16 = { ref: "grammatik-aktiv-16", note: "Topic alignment only" };
const GA9 = { ref: "grammatik-aktiv-9", note: "Topic alignment only" };

const keinNicht = [opt("a", "kein"), opt("b", "keine"), opt("c", "nicht")];
const timeOfDay = [optEn("a", "in the morning"), optEn("b", "in the evening"), optEn("c", "before going to bed")];

// --- Lesson 1: Was gibt es in der Stadt? ----------------------------------------------------

const L1 = [
  {
    slug: "m3-orte-zuordnen",
    skill: "vocabulary",
    title: { de: "Orte in der Stadt", en: "Places in the city" },
    instructions: en("Match each item on the left with the right one."),
    items: [
      pairs(
        "q1",
        [
          [de("der Bahnhof"), en("station")],
          [de("die Kirche"), en("church")],
          [de("das Kino"), en("cinema")],
          [de("der Platz"), en("square")],
          [de("es gibt"), en("there is / there are")],
        ],
        { prompt: en("Word and meaning") },
      ),
      pairs(
        "q2",
        [
          [de("der Bahnhof"), de("die Bahnhöfe")],
          [de("das Museum"), de("die Museen")],
          [de("der Platz"), de("die Plätze")],
          [de("die Kirche"), de("die Kirchen")],
          [de("das Hotel"), de("die Hotels")],
        ],
        { prompt: en("Singular and plural") },
      ),
    ],
    refs: [KAP3],
  },
  {
    slug: "m3-ein-oder-eine",
    skill: "grammar",
    title: { de: "ein oder eine?", en: "ein or eine?" },
    instructions: en("Write ein or eine. In the last two questions, choose the right answer."),
    items: [
      gap("q1", "Das ist", "Bahnhof.", ["ein"]),
      gap("q2", "Das ist", "Kirche.", ["eine"]),
      gap("q3", "Das ist", "Museum.", ["ein"]),
      gap("q4", "Ist das", "Park? – Ja, das ist ein Park.", ["ein"]),
      gap("q5", "In Kiel gibt es", "Kino und eine Kirche.", ["ein"]),
      gap("q6", "Da ist", "Haltestelle.", ["eine"]),
      mcq("q7", de("Das sind … Hotels."), [opt("a", "ein"), opt("b", "eine"), optEn("c", "no article")], "c", {
        explanation: en("There is no plural of ein: Das sind Hotels."),
      }),
      mcq("q8", de("Das ist ein Platz. … Platz heißt Marktplatz."), [opt("a", "Der"), opt("b", "Ein"), opt("c", "Eine")], "a", {
        explanation: en("The square is already known, so you use der."),
      }),
    ],
    refs: [KAP3, GA15],
  },
  {
    slug: "m3-stadt-lesen",
    skill: "reading",
    title: { de: "Noras Nachricht aus Kiel", en: "Nora's message from Kiel" },
    instructions: en("Read the message. Are the sentences true (richtig) or false (falsch)?"),
    stimulus: {
      textKind: "message",
      text: de(
        "Hallo Tim,\nwie geht's? Ich wohne jetzt in Kiel. Kiel ist eine Stadt in Deutschland. Hier gibt es ein Museum, ein Kino und zwei Parks.\nDas Foto: Das ist eine Kirche. Die Kirche heißt Nikolaikirche. Und das ist ein Platz. Der Platz heißt Alter Markt.\nTschüs!\nNora",
      ),
    },
    items: [
      tf("q1", "Nora wohnt in Kiel.", true),
      tf("q2", "In Kiel gibt es ein Kino.", true),
      tf("q3", "In Kiel gibt es zwei Kinos.", false, { explanation: en("There is one cinema (ein Kino) and two parks (zwei Parks).") }),
      tf("q4", "Die Kirche heißt Alter Markt.", false),
      tf("q5", "Der Platz heißt Alter Markt.", true),
    ],
    refs: [KAP3, GOETHE_LESEN],
  },
];

// --- Lesson 2: Mit Bus und Bahn -----------------------------------------------------------

const L2 = [
  {
    slug: "m3-verkehr-woerter",
    skill: "vocabulary",
    title: { de: "Bus, Zug oder U-Bahn?", en: "Bus, train or underground?" },
    instructions: en("Choose the right word."),
    items: [
      mcq("q1", en("It runs on rails from city to city."), [opt("a", "der Zug"), opt("b", "der Bus"), opt("c", "das Auto")], "a"),
      mcq("q2", en("Here you wait for the bus."), [opt("a", "das Gleis"), opt("b", "die Haltestelle"), opt("c", "der Flughafen")], "b"),
      mcq("q3", en("Here you take a plane."), [opt("a", "der Bahnhof"), opt("b", "die U-Bahn"), opt("c", "der Flughafen")], "c"),
      mcq("q4", en("At the station: „Der Zug fährt von … 3.“"), [opt("a", "Gleis"), opt("b", "Haltestelle"), opt("c", "Bus")], "a"),
      mcq("q5", en("No bus, no car – you walk."), [opt("a", "mit dem Auto"), opt("b", "zu Fuß"), opt("c", "mit dem Bus")], "b"),
      mcq("q6", en("In big cities it often runs under the ground."), [opt("a", "das Auto"), opt("b", "der Bus"), opt("c", "die U-Bahn")], "c"),
    ],
    refs: [KAP3],
  },
  {
    slug: "m3-kein-oder-nicht",
    skill: "grammar",
    title: { de: "kein, keine oder nicht?", en: "kein, keine or nicht?" },
    instructions: en("Choose kein, keine or nicht."),
    items: [
      mcq("q1", de("Das ist … Bahnhof. Das ist ein Hotel."), keinNicht, "a"),
      mcq("q2", de("Das ist … Haltestelle."), keinNicht, "b"),
      mcq("q3", de("Der Flughafen ist … weit."), keinNicht, "c", { explanation: en("weit is an adjective, so you use nicht.") }),
      mcq("q4", de("Hier gibt es … U-Bahn."), keinNicht, "b"),
      mcq("q5", de("Ich wohne … in Berlin."), keinNicht, "c"),
      mcq("q6", de("Ich habe … Auto."), keinNicht, "a"),
      mcq("q7", de("Das ist … der Bus 5. Das ist der Bus 7."), keinNicht, "c", {
        explanation: en("With der / die / das you use nicht."),
      }),
      mcq("q8", de("Hier gibt es … Hotels."), keinNicht, "b", { explanation: en("Plural: keine.") }),
    ],
    refs: [KAP3, GA16],
  },
  {
    slug: "m3-nein-antworten",
    skill: "grammar",
    title: { de: "Nein, das ist kein …", en: "No, that isn't a …" },
    instructions: en("Answer with no. Write kein, keine or nicht."),
    items: [
      gap("q1", "Ist das ein Zug? – Nein, das ist", "Zug. Das ist eine U-Bahn.", ["kein"]),
      gap("q2", "Ist das eine Kirche? – Nein, das ist", "Kirche. Das ist ein Museum.", ["keine"]),
      gap("q3", "Wohnen Sie in Kiel? – Nein, ich wohne", "in Kiel.", ["nicht"]),
      gap("q4", "Ist der Bahnhof weit? – Nein, der Bahnhof ist", "weit.", ["nicht"]),
      gap("q5", "Hast du ein Auto? – Nein, ich habe", "Auto.", ["kein"]),
      gap("q6", "Gibt es hier eine Haltestelle? – Nein, hier gibt es", "Haltestelle.", ["keine"]),
    ],
    refs: [KAP3, GA16],
  },
  {
    slug: "m3-haltestelle-hoeren",
    skill: "listening",
    title: { de: "An der Haltestelle", en: "Listening: at the bus stop" },
    instructions: en("Listen to the conversation. You can play it twice. Then answer the questions."),
    stimulus: {
      textKind: "dialogue",
      audio: {
        lines: [
          { speaker: "Frau", text: "Entschuldigung, fährt der Bus 12 zum Bahnhof?", voice: "female", rate: "slow" },
          { speaker: "Mann", text: "Nein, der Bus 12 fährt zum Flughafen.", voice: "male", rate: "slow" },
          { speaker: "Frau", text: "Oh. Und der Bus 5?", voice: "female", rate: "slow" },
          { speaker: "Mann", text: "Der Bus 5 fährt heute nicht. Zum Bahnhof fährt die U-Bahn, die Linie 3.", voice: "male", rate: "slow" },
          { speaker: "Frau", text: "Ist das weit?", voice: "female", rate: "slow" },
          { speaker: "Mann", text: "Nein, das ist nicht weit. Sie gehen fünf Minuten zu Fuß.", voice: "male", rate: "slow" },
          { speaker: "Frau", text: "Super, danke!", voice: "female", rate: "slow" },
        ],
      },
      maxPlays: 2,
      transcriptPolicy: "after_submit",
    },
    items: [
      mcq("q1", en("Where does bus 12 go?"), [opt("a", "zum Bahnhof"), opt("b", "zum Flughafen"), opt("c", "zum Museum")], "b"),
      tf("q2", "Der Bus 5 fährt heute nicht.", true),
      mcq("q3", en("How does the woman get to the station?"), [opt("a", "mit dem Bus 12"), opt("b", "mit dem Bus 5"), opt("c", "mit der U-Bahn")], "c"),
      tf("q4", "Die Frau geht fünf Minuten zu Fuß.", true),
      tf("q5", "Die Frau fährt mit dem Auto.", false),
    ],
    refs: [KAP3, GOETHE_HOEREN],
  },
];

// --- Lesson 3: Wie komme ich zum Bahnhof? ----------------------------------------------------

const L3 = [
  {
    slug: "m3-imperativ-formen",
    skill: "grammar",
    title: { de: "Gehen Sie …!", en: "Polite instructions" },
    instructions: en("Write the imperative with Sie. Use the verb in brackets."),
    items: [
      gap("q1", "", "Sie geradeaus! (gehen)", ["Gehen"]),
      gap("q2", "", "Sie die U-Bahn! (nehmen)", ["Nehmen"]),
      gap("q3", "Bitte", "Sie links! (gehen)", ["gehen"]),
      gap("q4", "", "Sie mit dem Bus! (fahren)", ["Fahren"], { explanation: en("No vowel change with Sie: Fahren Sie …!") }),
      gap("q5", "", "Sie bitte! (buchstabieren)", ["Buchstabieren"]),
      gap("q6", "Bitte", "Sie Deutsch! (sprechen)", ["sprechen"], { explanation: en("No vowel change with Sie: sprechen Sie, not „sprichst“.") }),
    ],
    refs: [KAP3, GA9],
  },
  {
    slug: "m3-wege-saetze",
    skill: "grammar",
    title: { de: "Nach dem Weg fragen", en: "Build the sentence" },
    instructions: en("Put the words in the right order."),
    items: [
      order("q1", ["Gehen", "Sie", "geradeaus", "!"]),
      order("q2", ["Nehmen", "Sie", "die", "U-Bahn", "!"]),
      order("q3", ["Gehen", "Sie", "bitte", "rechts", "!"], { alternatives: ["Bitte gehen Sie rechts!"] }),
      order("q4", ["Wie", "komme", "ich", "zum", "Bahnhof", "?"]),
      order("q5", ["Ich", "bin", "nicht", "von", "hier", "."]),
    ],
    refs: [KAP3, GA9],
  },
  {
    slug: "m3-weg-hoeren",
    skill: "listening",
    title: { de: "Wie komme ich zum Museum?", en: "Listening: asking the way" },
    instructions: en("Listen to the conversation. You can play it twice. Then answer the questions."),
    stimulus: {
      textKind: "dialogue",
      audio: {
        lines: [
          { speaker: "Mann", text: "Entschuldigung, wie komme ich zum Museum?", voice: "male2", rate: "slow" },
          { speaker: "Frau", text: "Zum Museum? Das ist nicht weit. Gehen Sie hier geradeaus und dann links.", voice: "female2", rate: "slow" },
          { speaker: "Mann", text: "Geradeaus und dann links?", voice: "male2", rate: "slow" },
          { speaker: "Frau", text: "Ja, genau. Da ist ein Platz, und da ist auch das Museum.", voice: "female2", rate: "slow" },
          { speaker: "Mann", text: "Vielen Dank!", voice: "male2", rate: "slow" },
          { speaker: "Frau", text: "Bitte!", voice: "female2", rate: "slow" },
        ],
      },
      maxPlays: 2,
      transcriptPolicy: "after_submit",
    },
    items: [
      mcq("q1", en("Where does the man want to go?"), [opt("a", "zum Kino"), opt("b", "zum Museum"), opt("c", "zum Bahnhof")], "b"),
      mcq("q2", en("How does he get there?"), [opt("a", "geradeaus und dann links"), opt("b", "geradeaus und dann rechts"), opt("c", "links und dann geradeaus")], "a"),
      tf("q3", "Das Museum ist weit.", false),
      mcq("q4", en("What else is there, at the museum?"), [opt("a", "eine Kirche"), opt("b", "ein Platz"), opt("c", "ein Park")], "b"),
    ],
    refs: [KAP3, GOETHE_HOEREN],
  },
  {
    slug: "m3-weg-sprechen",
    skill: "speaking",
    title: { de: "Nach dem Weg fragen", en: "Ask for and give directions" },
    instructions: en("Say your answer out loud. Then compare it with the model answer and rate yourself."),
    items: [
      speak("q1", "Politely ask a passer-by how to get to the station.", "Entschuldigung, wie komme ich zum Bahnhof?"),
      speak("q2", "Someone asks you the way to the museum. Tell them to go straight on and then right.", "Gehen Sie geradeaus und dann rechts."),
      speak("q3", "Someone asks you the way, but you don't know the city. Apologise and say you're not from here.", "Entschuldigung, ich bin nicht von hier."),
    ],
    refs: [KAP3, GOETHE_SPRECHEN],
  },
];

// --- Lesson 4: Monate, Jahreszeiten, Schilder --------------------------------------------------

const L4 = [
  {
    slug: "m3-monate-jahreszeiten",
    skill: "vocabulary",
    title: { de: "Monate und Jahreszeiten", en: "Months and seasons" },
    instructions: en("Answer all questions."),
    items: [
      pairs(
        "q1",
        [
          [de("Januar"), de("der Winter")],
          [de("April"), de("der Frühling")],
          [de("Juli"), de("der Sommer")],
          [de("Oktober"), de("der Herbst")],
        ],
        { prompt: en("Month and season (in Germany)") },
      ),
      mcq("q2", en("Which month comes after March?"), [opt("a", "Mai"), opt("b", "April"), opt("c", "Juni")], "b"),
      mcq("q3", en("Which month comes before September?"), [opt("a", "August"), opt("b", "Oktober"), opt("c", "Juli")], "a"),
      typed("q4", ["Dezember"], { prompt: en("Write the twelfth month of the year.") }),
      typed("q5", ["Januar", "Jänner"], { prompt: en("Write the first month of the year.") }),
      mcq("q6", en("How many seasons does the year have?"), [opt("a", "zwei"), opt("b", "zwölf"), opt("c", "vier")], "c"),
    ],
    refs: [KAP3],
  },
  {
    slug: "m3-adjektive-sein",
    skill: "grammar",
    title: { de: "Die Stadt ist schön.", en: "Adjectives after sein" },
    instructions: en("Answer all questions."),
    items: [
      mcq("q1", de("Die Stadt ist …"), [opt("a", "schön"), opt("b", "schöne"), opt("c", "schönes")], "a", {
        explanation: en("After sein the adjective has no ending."),
      }),
      gap("q2", "Das Hotel ist nicht klein. Es ist", ".", ["groß", "gross"]),
      gap("q3", "Der Bahnhof ist nicht alt. Er ist", ".", ["neu"]),
      gap("q4", "Das Kino ist nicht groß. Es ist", ".", ["klein"]),
      gap("q5", "Das Museum ist nicht geöffnet. Es ist", ".", ["geschlossen", "zu"]),
      order("q6", ["Der", "Park", "ist", "sehr", "schön", "."]),
      order("q7", ["Im", "Sommer", "ist", "Kiel", "schön", "."], { alternatives: ["Kiel ist im Sommer schön.", "Schön ist Kiel im Sommer."] }),
    ],
    refs: [KAP3],
  },
  {
    slug: "m3-schilder-lesen",
    skill: "reading",
    title: { de: "Schilder in der Stadt", en: "Signs in the city" },
    instructions: en("Read each sign. Is the sentence true (richtig) or false (falsch)?"),
    items: [
      tf("q1", "Das Museum ist im Juli geöffnet.", false, { prompt: de("STADTMUSEUM\nIm Juli und im August geschlossen") }),
      tf("q2", "Der Eingang ist links.", false, { prompt: de("KINO AM PARK\nEingang rechts →") }),
      tf("q3", "Im Dezember fährt hier kein Bus.", true, {
        prompt: de("Haltestelle Rathaus\nIm Dezember: hier kein Bus! Bitte nehmen Sie die U-Bahn."),
      }),
      tf("q4", "Im Park fahren keine Autos.", true, { prompt: de("STADTPARK\nKeine Autos!") }),
      tf("q5", "Zum Ausgang Hafenstraße gehen Sie geradeaus und dann rechts.", false, {
        prompt: de("BAHNHOF\nAusgang Hafenstraße: geradeaus, dann links"),
      }),
    ],
    refs: [KAP3, GOETHE_LESEN],
  },
  {
    slug: "m3-durchsagen-hoeren",
    skill: "listening",
    title: { de: "Durchsagen", en: "Listening: announcements" },
    instructions: en("You hear each announcement only once, as in the exam. Is the sentence true (richtig) or false (falsch)?"),
    itemAudioMaxPlays: 1,
    items: [
      tf("q1", "Der Zug nach Hamburg fährt von Gleis 4.", false, {
        ...say("Achtung an Gleis 4! Der Zug nach Hamburg fährt heute von Gleis 7.", "male"),
      }),
      tf("q2", "Das Museum ist im August geschlossen.", true, {
        ...say("Liebe Besucherinnen und Besucher, das Museum ist im August geschlossen. Im September ist es wieder geöffnet.", "female"),
      }),
      tf("q3", "Die U-Bahn Linie 2 fährt heute nicht.", true, {
        ...say("Information für alle Fahrgäste: Die U-Bahn Linie 2 fährt heute nicht. Bitte fahren Sie mit dem Bus.", "male2"),
      }),
      tf("q4", "Frau Hoffmann kommt aus Bonn.", false, {
        ...say("Achtung, bitte! Frau Lisa Hoffmann aus Köln, bitte kommen Sie zur Information am Eingang A.", "female2"),
      }),
    ],
    refs: [KAP3, GOETHE_HOEREN],
  },
];

// --- Lesson 5: Wiederholung Module 1–3 ----------------------------------------------------------

const L5 = [
  {
    slug: "m3-wdh-wortschatz",
    skill: "vocabulary",
    title: { de: "Wiederholung: Wortschatz", en: "Review: vocabulary" },
    instructions: en("Answer all questions."),
    items: [
      mcq("q1", en("It is 9 p.m. You meet your neighbour, Mr Brandt."), [opt("a", "Guten Morgen, Herr Brandt!"), opt("b", "Guten Abend, Herr Brandt!"), opt("c", "Gute Nacht, Herr Brandt!")], "b"),
      pairs(
        "q2",
        [
          [de("17"), de("siebzehn")],
          [de("45"), de("fünfundvierzig")],
          [de("60"), de("sechzig")],
          [de("99"), de("neunundneunzig")],
          [de("100"), de("hundert")],
        ],
        { prompt: en("Number and word") },
      ),
      mcq("q3", en("Which day comes after Tuesday?"), [opt("a", "Montag"), opt("b", "Donnerstag"), opt("c", "Mittwoch")], "c"),
      mcq("q4", en("Which one is a means of transport?"), [opt("a", "die Kirche"), opt("b", "die U-Bahn"), opt("c", "das Kino")], "b"),
      mcq("q5", en("Which one is a job?"), [opt("a", "der Lehrer"), opt("b", "die Haltestelle"), opt("c", "der Sommer")], "a"),
      pairs(
        "q6",
        [
          [de("groß"), de("klein")],
          [de("alt"), de("neu")],
          [de("links"), de("rechts")],
          [de("geöffnet"), de("geschlossen")],
        ],
        { prompt: en("Opposites") },
      ),
      mcq("q7", en("Which month is in summer (in Germany)?"), [opt("a", "November"), opt("b", "Januar"), opt("c", "Juli")], "c"),
    ],
    refs: [P1],
  },
  {
    slug: "m3-wdh-grammatik",
    skill: "grammar",
    title: { de: "Wiederholung: Grammatik", en: "Review: grammar" },
    instructions: en("Answer all questions."),
    items: [
      gap("q1", "Ich", "ein Auto. (haben)", ["habe"]),
      gap("q2", "Du", "gut Deutsch. (sprechen)", ["sprichst"]),
      gap("q3", "Er", "mit dem Bus. (fahren)", ["fährt"]),
      gap("q4", "Ihr", "neu im Kurs. (sein)", ["seid"]),
      mcq("q5", de("… Bahnhof ist groß."), [opt("a", "Der"), opt("b", "Die"), opt("c", "Das")], "a"),
      mcq("q6", de("… U-Bahn fährt heute nicht."), [opt("a", "Der"), opt("b", "Die"), opt("c", "Das")], "b"),
      mcq("q7", en("Plural: das Museum → die …"), [opt("a", "Museums"), opt("b", "Museen"), opt("c", "Museumen")], "b"),
      order("q8", ["Wohnst", "du", "in", "Kiel", "?"]),
      mcq("q9", de("Das ist … Park. Das ist ein Platz."), keinNicht, "a"),
      gap("q10", "", "Sie bitte links! (gehen)", ["Gehen"]),
    ],
    refs: [P1],
  },
  {
    slug: "m3-wdh-lesen",
    skill: "reading",
    title: { de: "Wiederholung: Eine E-Mail von Diego", en: "Review: an e-mail from Diego" },
    instructions: en("Read the e-mail. Answer the questions."),
    stimulus: {
      textKind: "email",
      text: de(
        "Liebe Frau Weber,\n\nich heiße Diego Ramos. Ich komme aus Spanien, aus Sevilla. Ich bin 28 Jahre alt und ich bin Lehrer. Jetzt wohne ich in Bremen. Ich spiele gern Fußball.\n\nIch habe kein Auto. Ich fahre mit dem Bus. Die Haltestelle ist nicht weit.\n\nMeine Handynummer ist 0160 48 23 71.\n\nViele Grüße\nDiego Ramos",
      ),
    },
    items: [
      tf("q1", "Diego kommt aus Spanien.", true),
      tf("q2", "Diego ist 38 Jahre alt.", false),
      tf("q3", "Diego ist Lehrer.", true),
      tf("q4", "Diego hat ein Auto.", false),
      tf("q5", "Die Haltestelle ist weit.", false),
      mcq("q6", en("What is Diego's mobile number?"), [opt("a", "0160 48 23 71"), opt("b", "0160 84 23 71"), opt("c", "0160 48 32 71")], "a"),
    ],
    refs: [P1, GOETHE_LESEN],
  },
  {
    slug: "m3-wdh-hoeren",
    skill: "listening",
    title: { de: "Wiederholung: Im Hotel", en: "Review: at the hotel reception" },
    instructions: en("Listen to the conversation. You can play it twice. Then answer the questions."),
    stimulus: {
      textKind: "dialogue",
      audio: {
        lines: [
          { speaker: "Rezeption", text: "Guten Abend! Wie ist Ihr Name, bitte?", voice: "female", rate: "slow" },
          { speaker: "Gast", text: "Mein Name ist Kowalski.", voice: "male", rate: "slow" },
          { speaker: "Rezeption", text: "Wie bitte? Buchstabieren Sie bitte.", voice: "female", rate: "slow" },
          { speaker: "Gast", text: "K, O, W, A, L, S, K, I.", voice: "male", rate: "slow" },
          { speaker: "Rezeption", text: "Danke, Herr Kowalski. Woher kommen Sie?", voice: "female", rate: "slow" },
          { speaker: "Gast", text: "Aus Polen, aus Danzig.", voice: "male", rate: "slow" },
          { speaker: "Rezeption", text: "Und Ihre Handynummer, bitte?", voice: "female", rate: "slow" },
          { speaker: "Gast", text: "Null, eins, sieben, zwei – sechsundvierzig – achtunddreißig – fünfzehn. Wie komme ich zum Bahnhof?", voice: "male", rate: "slow" },
          { speaker: "Rezeption", text: "Gehen Sie hier links und dann geradeaus. Der Bahnhof ist nicht weit.", voice: "female", rate: "slow" },
        ],
      },
      maxPlays: 2,
      transcriptPolicy: "after_submit",
    },
    items: [
      typed("q1", ["Kowalski"], { prompt: en("Write the guest's surname.") }),
      mcq("q2", en("When does the conversation take place?"), timeOfDay, "b"),
      mcq("q3", en("Where does the guest come from?"), [opt("a", "aus Polen"), opt("b", "aus Österreich"), opt("c", "aus Spanien")], "a"),
      mcq("q4", en("What is his mobile number?"), [opt("a", "0172 64 83 15"), opt("b", "0172 46 38 15"), opt("c", "0172 46 83 51")], "b"),
      mcq("q5", en("How does he get to the station?"), [opt("a", "rechts und dann geradeaus"), opt("b", "geradeaus und dann links"), opt("c", "links und dann geradeaus")], "c"),
      tf("q6", "Der Bahnhof ist weit.", false),
    ],
    refs: [P1, GOETHE_HOEREN],
  },
];

// --- Lesson 6: Modultest -----------------------------------------------------------------

const L6 = [
  {
    slug: "m3-test-hoeren",
    skill: "listening",
    title: { de: "Test: Hören", en: "Test: listening" },
    instructions: en("You hear each announcement only once, as in Goethe Hören Teil 2. Choose the right answer."),
    itemAudioMaxPlays: 1,
    passThreshold: 0.7,
    items: [
      tf("q1", "Der Zug nach München fährt von Gleis 9.", true, { ...say("Achtung, bitte! Der Zug nach München fährt heute von Gleis 9.", "male2") }),
      tf("q2", "Die Linie 1 fährt heute zum Flughafen.", false, {
        ...say("Liebe Fahrgäste, die U-Bahn Linie 1 fährt heute nicht zum Flughafen. Bitte fahren Sie mit dem Bus.", "female"),
      }),
      mcq("q3", en("When is the museum closed?"), [opt("a", "im Juni und im Juli"), opt("b", "im Januar und im Februar"), opt("c", "im Juli und im August")], "b", {
        ...say("Liebe Besucherinnen und Besucher, das Museum ist im Januar und im Februar geschlossen.", "female2"),
      }),
      tf("q4", "Eingang A ist heute geöffnet.", false, {
        ...say("Achtung, bitte! Eingang A ist heute geschlossen. Bitte gehen Sie rechts zu Eingang B.", "male"),
      }),
      mcq("q5", en("Where is Mr Nowak from?"), [opt("a", "aus Wien"), opt("b", "aus Warschau"), opt("c", "aus Weimar")], "b", {
        ...say("Achtung am Flughafen! Herr Tomasz Nowak aus Warschau, bitte kommen Sie zur Information.", "female"),
      }),
    ],
    refs: [KAP3, GOETHE_HOEREN],
  },
  {
    slug: "m3-test-lesen",
    skill: "reading",
    title: { de: "Test: Lesen", en: "Test: reading" },
    instructions: en("Read each sign. Is the sentence true (richtig) or false (falsch)?"),
    passThreshold: 0.7,
    items: [
      tf("q1", "Der Eingang zum Hotel ist links.", false, { prompt: de("HOTEL AM PARK\nEingang rechts →") }),
      tf("q2", "Das Museum ist im Dezember auch am Montag geöffnet.", true, {
        prompt: de("STADTMUSEUM\nNeu: im Dezember auch am Montag geöffnet!"),
      }),
      tf("q3", "Gleis 6 ist links.", true, { prompt: de("BAHNHOF\nGleis 1–4: geradeaus\nGleis 5–8: links") }),
      tf("q4", "Im August ist das Kino geöffnet.", false, { prompt: de("KINO CENTRAL\nIm August geschlossen") }),
      tf("q5", "Der Bus 8 fährt zum Bahnhof.", true, { prompt: de("Haltestelle Kirchplatz\nBus 3 und Bus 8 → Bahnhof") }),
    ],
    refs: [KAP3, GOETHE_LESEN],
  },
  {
    slug: "m3-test-formular",
    skill: "writing",
    title: { de: "Test: Ein Formular ausfüllen", en: "Test: fill in a form" },
    instructions: en("Read about Ravi. Fill in the form for his monthly ticket (Monatskarte)."),
    passThreshold: 0.7,
    stimulus: {
      textKind: "form",
      text: de(
        "Ravi Sharma kommt aus Indien und wohnt jetzt in Hamburg, in der Parkstraße 7. Er hat kein Auto. Er fährt mit dem Bus und mit der U-Bahn. Die Monatskarte ist für Oktober. Seine Handynummer ist 0176 58 20 43.",
      ),
    },
    items: [
      typed("q1", ["Ravi"], { label: "Vorname" }),
      typed("q2", ["Sharma"], { label: "Familienname" }),
      typed("q3", ["Hamburg"], { label: "Wohnort" }),
      typed("q4", ["Parkstraße 7", "Parkstr. 7", "Parkstr 7", "Parkstraße Nr. 7"], { label: "Straße und Hausnummer" }),
      typed("q5", ["Oktober"], { label: "Monat" }),
      typed("q6", ["0176 58 20 43"], { label: "Handynummer", ignoreSpaces: true, inputMode: "numeric" }),
    ],
    refs: [KAP3, GOETHE_SCHREIBEN],
  },
  {
    slug: "m3-test-grammatik",
    skill: "grammar",
    title: { de: "Test: Grammatik", en: "Test: grammar" },
    instructions: en("Answer all questions."),
    passThreshold: 0.7,
    items: [
      gap("q1", "Das ist", "Kirche. (ein / eine)", ["eine"]),
      gap("q2", "Ist das", "Bahnhof? (ein / eine)", ["ein"]),
      mcq("q3", de("Das ist … Hotel. Das ist ein Museum."), keinNicht, "a"),
      mcq("q4", de("Der Park ist … groß."), keinNicht, "c"),
      gap("q5", "Hier gibt es", "U-Bahn. (kein / keine)", ["keine"]),
      order("q6", ["Gehen", "Sie", "geradeaus", "und", "dann", "rechts", "!"]),
      gap("q7", "", "Sie bitte hier links! (fahren)", ["Fahren"]),
      mcq("q8", de("Das Museum ist …"), [opt("a", "neues"), opt("b", "neu"), opt("c", "neue")], "b"),
      mcq("q9", de("Das ist ein Platz. … Platz ist sehr groß."), [opt("a", "Ein"), opt("b", "Eine"), opt("c", "Der")], "c"),
    ],
    refs: [KAP3],
  },
  {
    slug: "m3-test-wortschatz",
    skill: "vocabulary",
    title: { de: "Test: Wortschatz", en: "Test: vocabulary" },
    instructions: en("Answer all questions."),
    passThreshold: 0.7,
    items: [
      mcq("q1", en("Where do trains leave from?"), [opt("a", "der Bahnhof"), opt("b", "die Kirche"), opt("c", "das Kino")], "a"),
      mcq("q2", en("The opposite of „geöffnet“:"), [opt("a", "groß"), opt("b", "geschlossen"), opt("c", "neu")], "b"),
      typed("q3", ["Juli"], { prompt: en("Write the month after June.") }),
      pairs("q4", [
        [de("links"), en("left")],
        [de("rechts"), en("right")],
        [de("geradeaus"), en("straight on")],
        [de("zu Fuß"), en("on foot")],
      ]),
      mcq("q5", en("Where do you watch a film?"), [opt("a", "das Museum"), opt("b", "die Kirche"), opt("c", "das Kino")], "c"),
      mcq("q6", en("You are new in the city and don't know the way. You say:"), [opt("a", "Gehen Sie geradeaus!"), opt("b", "Ich bin nicht von hier."), opt("c", "Ich habe kein Auto.")], "b"),
      mcq("q7", en("Which season is October in (in Germany)?"), [opt("a", "der Herbst"), opt("b", "der Frühling"), opt("c", "der Sommer")], "a"),
    ],
    refs: [KAP3],
  },
  {
    slug: "m3-test-sprechen",
    skill: "speaking",
    title: { de: "Test: Sprechen – meine Stadt", en: "Test: speaking – my city" },
    instructions: en("Speak for yourself; the model answer is only an example. This practice is not scored."),
    items: [
      speak("q1", "Politely ask a passer-by the way to the museum.", "Entschuldigung, wie komme ich zum Museum?"),
      speak(
        "q2",
        "Describe your city in two or three sentences using the keywords.",
        "Ich wohne in Kiel. Kiel ist eine Stadt in Deutschland. Hier gibt es ein Museum, ein Kino und eine Kirche. Die Stadt ist schön und nicht sehr groß.",
        { cue: de("Stadt? – Was gibt es? – Wie ist die Stadt?") },
      ),
      speak("q3", "Say how you get around in your city.", "Ich habe kein Auto. Ich fahre mit dem Bus und mit der U-Bahn."),
    ],
    refs: [KAP3, GOETHE_SPRECHEN],
  },
];

export const EXERCISES_BY_LESSON = { L1, L2, L3, L4, L5, L6 };
export const EXERCISES = [...L1, ...L2, ...L3, ...L4, ...L5, ...L6];
