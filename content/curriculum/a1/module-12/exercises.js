// Module 12 exercises. All texts, dialogues, announcements and questions are original.
// Task *formats* follow the Goethe A1 structure documented in docs/REFERENCE-ANALYSIS.md
// (Hören Teil 2: announcements, richtig/falsch, heard once; Schreiben Teil 2 as an
// auto-gradable postcard gap-fill); no exam content is reproduced. Situation prompts are in
// English so beginners know what to do; the language being tested is always German.

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
const KAP12 = { ref: "netzwerk-neu-a1-12", note: "Topic alignment only" };
const P4 = { ref: "netzwerk-neu-a1-p4", note: "Topic alignment only" };
const GA10 = { ref: "grammatik-aktiv-10", note: "Topic alignment only" };
const GA32 = { ref: "grammatik-aktiv-32", note: "Topic alignment only" };
const GA44 = { ref: "grammatik-aktiv-44", note: "Topic alignment only" };

const werWenWem = [opt("a", "Wer"), opt("b", "Wen"), opt("c", "Wem")];

// --- Lesson 1: Urlaub machen --------------------------------------------------------------

const L1 = [
  {
    slug: "m12-urlaub-woerter",
    skill: "vocabulary",
    title: { de: "Urlaubswörter", en: "Holiday words" },
    instructions: en("Match the words and answer the questions."),
    items: [
      pairs(
        "q1",
        [
          [de("der Koffer"), en("suitcase")],
          [de("das Flugzeug"), en("plane")],
          [de("der Strand"), en("beach")],
          [de("das Meer"), en("sea")],
          [de("der Berg"), en("mountain")],
          [de("die Reise"), en("trip")],
        ],
        { prompt: en("Word and meaning") },
      ),
      mcq("q2", en("You want to swim in the sea. Where do you go?"), [opt("a", "ans Meer"), opt("b", "in die Berge"), opt("c", "zum Flughafen")], "a"),
      gap("q3", "Im August machen wir zwei Wochen", "in Italien. (holiday)", ["Urlaub", "Ferien"]),
      mcq("q4", de("Ich … nach Spanien. Das Flugzeug startet um neun Uhr."), [opt("a", "fliege"), opt("b", "schwimme"), opt("c", "wohne")], "a"),
      mcq("q5", en("Where do you put your clothes for the trip?"), [opt("a", "in den Koffer"), opt("b", "in das Flugzeug"), opt("c", "an den Strand")], "a"),
      mcq("q6", en("Which word is only used in the plural?"), [opt("a", "Ferien"), opt("b", "Urlaub"), opt("c", "Reise")], "a"),
    ],
    refs: [KAP12],
  },
  {
    slug: "m12-man-saetze",
    skill: "grammar",
    title: { de: "Was kann man hier machen?", en: "What can you do here?" },
    instructions: en("Write the correct form of the verb in brackets."),
    items: [
      gap("q1", "Hier", "man gut essen. (können)", ["kann"]),
      gap("q2", "Im Museum", "man nicht fotografieren. (dürfen)", ["darf"]),
      gap("q3", "In Österreich", "man Deutsch. (sprechen)", ["spricht"]),
      gap("q4", "Vom Turm", "man die ganze Stadt. (sehen)", ["sieht"], { explanation: en("man takes the er/sie/es form: er sieht → man sieht.") }),
      gap("q5", "Am Flughafen", "man den Reisepass zeigen. (müssen)", ["muss"]),
      gap("q6", "Zum Schloss", "man mit dem Bus. (fahren)", ["fährt"]),
      mcq(
        "q7",
        en("„In der Schweiz spricht man Deutsch.“ Who speaks German?"),
        [optEn("a", "people in Switzerland in general"), optEn("b", "one man in Switzerland"), optEn("c", "only the tourists")],
        "a",
        { explanation: en("man (one n) = people in general. der Mann = a man.") },
      ),
    ],
    refs: [KAP12],
  },
  {
    slug: "m12-urlaubsorte-lesen",
    skill: "reading",
    title: { de: "Wohin in den Urlaub?", en: "Where to go on holiday?" },
    instructions: en("Read the three ads. Answer the questions."),
    stimulus: {
      textKind: "ad",
      text: de(
        "A) Hotel Möwenblick, Insel Rügen\nUnser Hotel liegt direkt am Strand. Hier kann man im Meer schwimmen und am Abend gut essen. Zimmer ab 89 Euro.\n\nB) Pension Bergwiese, Garmisch-Partenkirchen\nIm Sommer kann man hier wandern, im Winter Ski fahren. Vom Haus sieht man die Berge.\n\nC) Stadthotel Am Lindenplatz, Dresden\nDas Hotel ist im Zentrum. Zum Bahnhof geht man nur fünf Minuten. Hier kann man gut einkaufen und ins Museum gehen.",
      ),
    },
    items: [
      tf("q1", "Im Hotel Möwenblick kann man im Meer schwimmen.", true),
      tf("q2", "In der Pension Bergwiese kann man nur im Sommer Urlaub machen.", false, { explanation: en("In summer you can go hiking, in winter skiing.") }),
      tf("q3", "Das Stadthotel ist im Zentrum.", true),
      mcq("q4", en("Anna wants to go skiing. Which place is right for her?"), [opt("a", "Hotel Möwenblick"), opt("b", "Pension Bergwiese"), opt("c", "Stadthotel Am Lindenplatz")], "b"),
      mcq("q5", en("Tim likes museums and shopping. Which place is right for him?"), [opt("a", "Hotel Möwenblick"), opt("b", "Pension Bergwiese"), opt("c", "Stadthotel Am Lindenplatz")], "c"),
    ],
    refs: [KAP12, GOETHE_LESEN],
  },
];

// --- Lesson 2: Wie ist das Wetter? ----------------------------------------------------------

const L2 = [
  {
    slug: "m12-wetter-woerter",
    skill: "vocabulary",
    title: { de: "Wie ist das Wetter?", en: "What's the weather like?" },
    instructions: en("Match the sentences and answer the questions."),
    items: [
      pairs(
        "q1",
        [
          [de("Es regnet."), en("It's raining.")],
          [de("Es schneit."), en("It's snowing.")],
          [de("Die Sonne scheint."), en("The sun is shining.")],
          [de("Es ist bewölkt."), en("It's cloudy.")],
          [de("Es ist windig."), en("It's windy.")],
        ],
        { prompt: en("Weather and meaning") },
      ),
      mcq("q2", en("It is 34 degrees. What do you say?"), [opt("a", "Es ist heiß."), opt("b", "Es ist kalt."), opt("c", "Es schneit.")], "a"),
      mcq("q3", en("It is minus 5 degrees. What is the weather like?"), [opt("a", "Es ist warm."), opt("b", "Es ist heiß."), opt("c", "Es ist kalt.")], "c"),
      gap("q4", "Im Winter liegt in den Bergen viel", ". (snow)", ["Schnee"]),
      gap("q5", "Heute", "es den ganzen Tag. Wir bleiben im Hotel. (regnen)", ["regnet"]),
      mcq("q6", de("Es sind 22 … und es ist sonnig."), [opt("a", "Grad"), opt("b", "Uhr"), opt("c", "Euro")], "a"),
    ],
    refs: [KAP12],
  },
  {
    slug: "m12-denn-saetze",
    skill: "grammar",
    title: { de: "…, denn …", en: "Giving reasons with denn" },
    instructions: en("Build the sentences and choose the right answer."),
    items: [
      order("q1", ["Wir", "gehen", "nicht", "schwimmen", ",", "denn", "es", "ist", "kalt", "."], {
        alternatives: ["Schwimmen gehen wir nicht, denn es ist kalt."],
      }),
      order("q2", ["Lena", "fährt", "ans", "Meer", ",", "denn", "sie", "möchte", "schwimmen", "."], {
        alternatives: ["Ans Meer fährt Lena, denn sie möchte schwimmen."],
      }),
      mcq("q3", de("Ich nehme eine Jacke mit, denn …"), [opt("a", "es ist windig."), opt("b", "es ist heiß."), opt("c", "die Sonne scheint und es sind 30 Grad.")], "a"),
      mcq("q4", de("Wir fahren in die Berge, denn …"), [opt("a", "wir möchten Ski fahren."), opt("b", "wir möchten im Meer schwimmen."), opt("c", "wir möchten am Strand liegen.")], "a"),
      mcq(
        "q5",
        en("Which sentence has the correct word order?"),
        [opt("a", "Tom bleibt im Hotel, denn er ist müde."), opt("b", "Tom bleibt im Hotel, denn ist er müde."), opt("c", "Tom bleibt im Hotel, denn er müde ist.")],
        "a",
        { explanation: en("denn is at position 0. After it the word order is normal: subject, then the verb.") },
      ),
      gap("q6", "Ich fliege nach Rom,", "ich möchte das Kolosseum sehen. (because)", ["denn"]),
    ],
    refs: [KAP12, GA44],
  },
  {
    slug: "m12-wetterbericht-hoeren",
    skill: "listening",
    title: { de: "Das Wetter für morgen", en: "Listening: the weather forecast" },
    instructions: en("Listen to the weather forecast on the radio. You can play it twice. Then answer the questions."),
    stimulus: {
      audio: {
        lines: [
          { speaker: "Radio", text: "Und jetzt das Wetter für morgen, Samstag.", voice: "male", rate: "normal" },
          { speaker: "Radio", text: "Im Norden ist es bewölkt und windig, am Nachmittag regnet es. Es sind nur 14 Grad.", voice: "male", rate: "normal" },
          { speaker: "Radio", text: "Im Süden scheint den ganzen Tag die Sonne. Es ist warm, 26 Grad.", voice: "male", rate: "normal" },
          { speaker: "Radio", text: "In den Bergen ist es kalt. In der Nacht schneit es dort, bei minus 2 Grad.", voice: "male", rate: "normal" },
          { speaker: "Radio", text: "Und am Sonntag? Dann scheint auch im Norden die Sonne.", voice: "male", rate: "normal" },
        ],
      },
      maxPlays: 2,
    },
    items: [
      mcq("q1", en("What is the weather like in the north tomorrow?"), [opt("a", "bewölkt und windig"), opt("b", "sonnig und warm"), opt("c", "kalt, es schneit")], "a"),
      mcq("q2", en("How warm is it in the south?"), [opt("a", "14 Grad"), opt("b", "26 Grad"), opt("c", "minus 2 Grad")], "b"),
      tf("q3", "In den Bergen schneit es in der Nacht.", true),
      tf("q4", "Am Sonntag regnet es im Norden.", false, { explanation: en("On Sunday the sun shines in the north too.") }),
    ],
    refs: [KAP12, GOETHE_HOEREN],
  },
  {
    slug: "m12-wetter-sprechen",
    skill: "speaking",
    title: { de: "Wie ist das Wetter bei dir?", en: "What's the weather like where you are?" },
    instructions: en("Say your answer out loud. Then compare it with the model answer and rate yourself."),
    items: [
      speak("q1", "Your friend on the phone asks: „Wie ist das Wetter bei dir?“ It is sunny and 25 degrees.", "Hier scheint die Sonne. Es sind 25 Grad."),
      speak("q2", "Say that you are staying at home today because it is raining.", "Ich bleibe heute zu Hause, denn es regnet."),
      speak("q3", "Say what the weather is like in your country in summer.", "In Bangladesch ist es im Sommer sehr heiß."),
    ],
    refs: [KAP12, GOETHE_SPRECHEN],
  },
];

// --- Lesson 3: Unterwegs in der Stadt -------------------------------------------------------

const L3 = [
  {
    slug: "m12-stadt-woerter",
    skill: "vocabulary",
    title: { de: "Sehenswürdigkeiten", en: "Sightseeing words" },
    instructions: en("Match the words and answer the questions."),
    items: [
      pairs(
        "q1",
        [
          [de("das Schloss"), en("castle, palace")],
          [de("der Turm"), en("tower")],
          [de("die Brücke"), en("bridge")],
          [de("der Stadtplan"), en("city map")],
          [de("die Stadtrundfahrt"), en("city tour")],
          [de("die Sehenswürdigkeit"), en("sight, place of interest")],
        ],
        { prompt: en("Word and meaning") },
      ),
      mcq(
        "q2",
        en("You need a city map and information about the city. Where do you go?"),
        [opt("a", "in die Touristeninformation"), opt("b", "an den Strand"), opt("c", "zum Flughafen")],
        "a",
      ),
      mcq(
        "q3",
        en("„Gibt es hier in der Nähe ein Café?“ What does the tourist want to know?"),
        [optEn("a", "if there is a café close by"), optEn("b", "when the café opens"), optEn("c", "how much a coffee costs")],
        "a",
      ),
      gap("q4", "Darf man hier", "? – Ja, aber bitte ohne Blitz. (to take photos)", ["fotografieren"]),
      mcq("q5", de("Morgen … wir das Schloss und den Dom."), [opt("a", "besichtigen"), opt("b", "fliegen"), opt("c", "regnen")], "a"),
    ],
    refs: [KAP12],
  },
  {
    slug: "m12-wer-wen-wem-fragen",
    skill: "grammar",
    title: { de: "Wer, wen oder wem?", en: "Who, whom or to whom?" },
    instructions: en("Choose the right question word for the answer."),
    items: [
      mcq("q1", de("… macht heute die Stadtrundfahrt? – Die Touristen aus Spanien."), werWenWem, "a"),
      mcq("q2", de("… besuchst du in Hamburg? – Meine Tante."), werWenWem, "b"),
      mcq("q3", de("… schreibst du eine Postkarte? – Meinem Opa."), werWenWem, "c"),
      mcq("q4", de("… hilfst du? – Einer Touristin. Sie sucht den Bahnhof."), werWenWem, "c", { explanation: en("helfen takes the dative, so you ask Wem?") }),
      mcq("q5", de("… fragst du nach dem Weg? – Den Mann dort."), werWenWem, "b"),
      mcq("q6", de("… fährt mit zum Flughafen? – Ich!"), werWenWem, "a"),
      mcq("q7", de("… gefällt die Stadt? – Uns! Sie ist sehr schön."), werWenWem, "c", { explanation: en("gefallen takes the dative: Die Stadt gefällt uns.") }),
      mcq("q8", de("… fotografierst du? – Dich!"), werWenWem, "b"),
    ],
    refs: [KAP12, GA10],
  },
  {
    slug: "m12-weg-fragen-hoeren",
    skill: "listening",
    title: { de: "Wie komme ich zum Schloss?", en: "Listening: asking the way" },
    instructions: en("Listen to the conversation. You can play it twice. Then answer the questions."),
    stimulus: {
      textKind: "dialogue",
      audio: {
        lines: [
          { speaker: "Touristin", text: "Entschuldigung, ich bin nicht von hier. Wie komme ich zum Schloss?", voice: "female", rate: "normal" },
          { speaker: "Mann", text: "Zum Schloss? Das ist nicht weit. Gehen Sie hier geradeaus bis zur Brücke.", voice: "male", rate: "normal" },
          { speaker: "Touristin", text: "Bis zur Brücke, gut. Und dann?", voice: "female", rate: "normal" },
          { speaker: "Mann", text: "Gehen Sie über die Brücke und dann links. Dann sehen Sie das Schloss schon.", voice: "male", rate: "normal" },
          { speaker: "Touristin", text: "Kann man das Schloss heute besichtigen?", voice: "female", rate: "normal" },
          { speaker: "Mann", text: "Ja, von 10 bis 18 Uhr. Die Touristeninformation ist auch in der Nähe, direkt am Marktplatz.", voice: "male", rate: "normal" },
          { speaker: "Touristin", text: "Vielen Dank!", voice: "female", rate: "normal" },
          { speaker: "Mann", text: "Bitte, gern.", voice: "male", rate: "normal" },
        ],
      },
      maxPlays: 2,
    },
    items: [
      mcq("q1", en("Where does the woman want to go?"), [opt("a", "zum Schloss"), opt("b", "zur Brücke"), opt("c", "zum Marktplatz")], "a"),
      mcq(
        "q2",
        en("How does she get there?"),
        [opt("a", "geradeaus, über die Brücke, dann links"), opt("b", "geradeaus, über die Brücke, dann rechts"), opt("c", "links, dann geradeaus bis zur Brücke")],
        "a",
      ),
      tf("q3", "Man kann das Schloss heute besichtigen.", true),
      tf("q4", "Die Touristeninformation ist am Bahnhof.", false, { explanation: en("It is at the market square (am Marktplatz).") }),
    ],
    refs: [KAP12, GOETHE_HOEREN],
  },
  {
    slug: "m12-stadtrundfahrt-lesen",
    skill: "reading",
    title: { de: "Stadtrundfahrt Heidelberg", en: "A city tour in Heidelberg" },
    instructions: en("Read the ad. Answer the questions."),
    stimulus: {
      textKind: "ad",
      text: de(
        "Stadtrundfahrt Heidelberg – mit dem Bus durch die Altstadt\n\nWann? Jeden Tag um 10, 13 und 16 Uhr. Im Winter (November bis März) nur um 13 Uhr.\nWo? Start am Hauptbahnhof, Bussteig 3.\nWas sehen Sie? Das Schloss, die Alte Brücke, die Universität und viele andere Sehenswürdigkeiten.\nDie Fahrt dauert 90 Minuten.\nPreis: Erwachsene 18 €, Kinder bis 12 Jahre 9 €. Tickets gibt es im Bus oder in der Touristeninformation.\nWichtig: Im Bus darf man nicht essen.",
      ),
    },
    items: [
      tf("q1", "Im Dezember gibt es nur eine Stadtrundfahrt am Tag.", true),
      tf("q2", "Die Stadtrundfahrt beginnt an der Touristeninformation.", false),
      tf("q3", "Die Fahrt dauert zwei Stunden.", false, { explanation: en("It takes 90 minutes.") }),
      mcq("q4", en("Two adults and one child (8 years old) take the tour. How much do they pay?"), [opt("a", "27 €"), opt("b", "36 €"), opt("c", "45 €")], "c", {
        explanation: en("18 € + 18 € + 9 € = 45 €."),
      }),
      tf("q5", "Im Bus kann man ein Ticket kaufen.", true),
      tf("q6", "Im Bus darf man essen.", false),
    ],
    refs: [KAP12, GOETHE_LESEN],
  },
];

// --- Lesson 4: Grüße aus dem Urlaub -----------------------------------------------------------

const L4 = [
  {
    slug: "m12-unterwegs-woerter",
    skill: "vocabulary",
    title: { de: "Am Bahnhof und am Flughafen", en: "At the station and the airport" },
    instructions: en("Match the words and answer the questions."),
    items: [
      pairs(
        "q1",
        [
          [de("die Abfahrt"), en("departure")],
          [de("die Verspätung"), en("delay")],
          [de("das Gepäck"), en("luggage")],
          [de("der Reisepass"), en("passport")],
          [de("der Flug"), en("flight")],
          [de("die Postkarte"), en("postcard")],
        ],
        { prompt: en("Word and meaning") },
      ),
      mcq("q2", de("Der Zug kommt um 9:20 Uhr, nicht um 9:00 Uhr. Er hat 20 Minuten …"), [opt("a", "Verspätung"), opt("b", "Gepäck"), opt("c", "Abfahrt")], "a"),
      mcq("q3", en("You are at the airport. Where do you get on the plane?"), [opt("a", "am Gate"), opt("b", "am Strand"), opt("c", "im Koffer")], "a"),
      gap("q4", "Das Flugzeug", "um 14:30 Uhr in München. (to land)", ["landet"]),
      mcq("q5", en("How do you end a holiday postcard?"), [opt("a", "Schöne Grüße aus Wien!"), opt("b", "Guten Morgen!"), opt("c", "Wie bitte?")], "a"),
    ],
    refs: [KAP12],
  },
  {
    slug: "m12-zeitangaben",
    skill: "grammar",
    title: { de: "Wann? – in, vor, nach, seit", en: "When? – in, vor, nach, seit" },
    instructions: en("Write the missing word or choose the right preposition."),
    items: [
      gap("q1", "Wir fahren", "Sommer ans Meer. (in + der Sommer)", ["im"]),
      gap("q2", "Nach", "Arbeit gehe ich ins Café. (die Arbeit)", ["der"]),
      gap("q3", "Ich wohne seit", "Jahr in Berlin. (ein Jahr)", ["einem"]),
      gap("q4", "Vor", "Urlaub muss ich einen Koffer kaufen. (der Urlaub)", ["dem"]),
      gap("q5", "Lena ist seit drei", "in Wien. (Tag)", ["Tagen"], { explanation: en("Dative plural: the noun gets -n. drei Tage → seit drei Tagen.") }),
      mcq("q6", de("Wir sind … zwei Wochen in Italien. Der Urlaub ist super!"), [opt("a", "seit"), opt("b", "nach"), opt("c", "vor")], "a"),
      mcq("q7", de("… drei Tagen war ich in Rom. Jetzt bin ich wieder zu Hause."), [opt("a", "Vor"), opt("b", "Seit"), opt("c", "In")], "a"),
      mcq("q8", de("Das Flugzeug landet … einer Stunde."), [opt("a", "in"), opt("b", "seit"), opt("c", "vor")], "a", {
        explanation: en("in + a time span = in the future: in einer Stunde."),
      }),
    ],
    refs: [KAP12, GA32],
  },
  {
    slug: "m12-durchsagen-hoeren",
    skill: "listening",
    title: { de: "Durchsagen", en: "Listening: announcements" },
    instructions: en("Listen to the announcements at the station and the airport. You hear each one only ONCE. Are the sentences true (richtig) or false (falsch)?"),
    itemAudioMaxPlays: 1,
    items: [
      tf("q1", "Der Zug nach München kommt zu spät.", true, {
        audio: { text: "Achtung am Gleis 7: Der ICE nach München hat heute etwa 15 Minuten Verspätung. Wir bitten um Entschuldigung.", voice: "female2", rate: "normal" },
      }),
      tf("q2", "Der Zug nach Köln fährt von Gleis 4.", false, {
        audio: { text: "Information für die Fahrgäste nach Köln: Ihr Zug fährt heute nicht von Gleis 4, sondern von Gleis 9.", voice: "male2", rate: "normal" },
      }),
      tf("q3", "Die Passagiere nach Wien sollen sofort zum Gate gehen.", true, {
        audio: { text: "Letzter Aufruf für den Flug 2046 nach Wien. Die Passagiere gehen bitte sofort zu Gate B12.", voice: "female2", rate: "normal" },
      }),
      tf("q4", "Der Flug aus Madrid kommt später.", false, {
        audio: { text: "Liebe Fluggäste, der Flug aus Madrid landet heute nicht um 16:10 Uhr, sondern schon um 15:40 Uhr.", voice: "male2", rate: "normal" },
        explanation: en("It lands earlier: at 15:40 instead of 16:10."),
      }),
    ],
    refs: [KAP12, GOETHE_HOEREN],
  },
  {
    slug: "m12-postkarte-schreiben",
    skill: "writing",
    title: { de: "Eine Postkarte aus Hamburg", en: "A postcard from Hamburg" },
    instructions: en(
      "You are on holiday in Hamburg. Your friend Jana has sent you a message. Complete your postcard to her: choose the right sentences and write the missing words.",
    ),
    stimulus: {
      textKind: "message",
      text: de("Hallo! Du bist jetzt in Hamburg, oder? Wie ist das Wetter? Was machst du dort? Schreib mir mal eine Postkarte!\nJana"),
    },
    items: [
      mcq("q1", en("How do you start the postcard?"), [opt("a", "Liebe Jana,"), opt("b", "Sehr geehrte Frau Jana,"), opt("c", "Guten Appetit, Jana!")], "a"),
      gap("q2", "Ich bin", "Montag in Hamburg. (since)", ["seit"]),
      gap("q3", "Das Wetter ist leider nicht so gut: Es", "jeden Tag. (regnen)", ["regnet"]),
      gap("q4", "Aber ich finde die Stadt toll,", "hier gibt es viele Sehenswürdigkeiten. (because)", ["denn"]),
      gap("q5", "Vom Turm der Michaeliskirche", "man die ganze Stadt. (sehen)", ["sieht"]),
      gap("q6", "", "dem Frühstück machen wir morgen eine Hafenrundfahrt. (after)", ["Nach"]),
      mcq(
        "q7",
        en("How do you end the postcard?"),
        [opt("a", "Schöne Grüße aus Hamburg, deine Mira"), opt("b", "Mit freundlichen Grüßen, Ihre Frau Mira"), opt("c", "Guten Morgen, Mira")],
        "a",
      ),
    ],
    refs: [KAP12, GOETHE_SCHREIBEN],
  },
];

// --- Lesson 5: Wiederholung Module 10–12 -------------------------------------------------------

const L5 = [
  {
    slug: "m12-wdh-urlaub-lesen",
    skill: "reading",
    title: { de: "Wieder zu Hause!", en: "Back home!" },
    instructions: en("Read Maja's e-mail about her holiday. Are the sentences true (richtig) or false (falsch)?"),
    stimulus: {
      textKind: "email",
      text: de(
        "Hallo Sven,\n\nich bin wieder zu Hause! Der Urlaub in Österreich war super. Wir waren zehn Tage in den Bergen. Zuerst hatten wir leider schlechtes Wetter: Es hat drei Tage geregnet. Dann war es sonnig und warm. Wir sind jeden Tag gewandert, und am Wochenende haben wir Salzburg besichtigt. Dort habe ich auch eine Jacke gekauft. Sie ist grün und passt mir sehr gut. Meine Schwester hatte leider keine Zeit, sie ist zu Hause geblieben.\n\nBis bald!\nMaja",
      ),
    },
    items: [
      tf("q1", "Maja war zehn Tage in Österreich.", true),
      tf("q2", "Das Wetter war die ganze Zeit schön.", false, { explanation: en("At first it rained for three days.") }),
      tf("q3", "Maja hat in Salzburg eine Jacke gekauft.", true),
      tf("q4", "Die Jacke passt Maja nicht.", false),
      tf("q5", "Majas Schwester war auch in Österreich.", false, { explanation: en("Her sister had no time and stayed at home.") }),
    ],
    refs: [P4, GOETHE_LESEN],
  },
  {
    slug: "m12-wdh-grammatik",
    skill: "grammar",
    title: { de: "Kleidung, Urlaub und Wetter", en: "Clothes, holidays and weather" },
    instructions: en("Choose the right answer or build the sentence."),
    items: [
      mcq("q1", de("… Jacke gefällt dir? – Die rote."), [opt("a", "Welche"), opt("b", "Welcher"), opt("c", "Welches")], "a"),
      mcq("q2", de("Der Pullover ist schön. Passt er … ? – Ja, er passt mir gut."), [opt("a", "dir"), opt("b", "dich"), opt("c", "du")], "a"),
      mcq("q3", de("Wie findest du den Rock? – … Rock gefällt mir nicht."), [opt("a", "Dieser"), opt("b", "Diese"), opt("c", "Dieses")], "a"),
      mcq("q4", de("Die Schuhe stehen … sehr gut, Herr Kaya!"), [opt("a", "Ihnen"), opt("b", "Sie"), opt("c", "dich")], "a"),
      mcq("q5", en("Which sentence is about the past?"), [opt("a", "Ich war im Urlaub in Spanien."), opt("b", "Ich bin im Urlaub in Spanien."), opt("c", "Ich fahre in Spanien Ski.")], "a"),
      mcq("q6", de("Gestern … ich keine Zeit. Heute habe ich Zeit."), [opt("a", "hatte"), opt("b", "habe"), opt("c", "bin")], "a"),
      mcq("q7", de("Wem gefällt das Kleid? – …"), [opt("a", "Mir."), opt("b", "Ich."), opt("c", "Mich.")], "a"),
      order("q8", ["Wir", "bleiben", "im", "Hotel", ",", "denn", "es", "regnet", "."], { alternatives: ["Im Hotel bleiben wir, denn es regnet."] }),
    ],
    refs: [P4],
  },
  {
    slug: "m12-wdh-hoeren",
    skill: "listening",
    title: { de: "Wie war dein Urlaub?", en: "Listening: how was your holiday?" },
    instructions: en("Listen to the conversation. You can play it twice. Then answer the questions."),
    stimulus: {
      textKind: "dialogue",
      audio: {
        lines: [
          { speaker: "Nils", text: "Hallo, Carla! Wie war dein Urlaub?", voice: "male", rate: "normal" },
          { speaker: "Carla", text: "Super! Ich war zwei Wochen in Italien, am Meer.", voice: "female", rate: "normal" },
          { speaker: "Nils", text: "Und wie war das Wetter?", voice: "male", rate: "normal" },
          { speaker: "Carla", text: "Sehr heiß, jeden Tag 32 Grad. Ich war jeden Tag am Strand.", voice: "female", rate: "normal" },
          { speaker: "Nils", text: "Toll! Und dein Kleid ist neu, oder?", voice: "male", rate: "normal" },
          { speaker: "Carla", text: "Ja, das habe ich in Rom gekauft. Gefällt es dir?", voice: "female", rate: "normal" },
          { speaker: "Nils", text: "Ja, es steht dir sehr gut!", voice: "male", rate: "normal" },
          { speaker: "Carla", text: "Danke! Und du? Was machst du im Sommer?", voice: "female", rate: "normal" },
          { speaker: "Nils", text: "Ich fahre im August in die Berge, denn ich wandere gern.", voice: "male", rate: "normal" },
        ],
      },
      maxPlays: 2,
    },
    items: [
      mcq("q1", en("Where was Carla on holiday?"), [opt("a", "in Italien, am Meer"), opt("b", "in Italien, in den Bergen"), opt("c", "in Spanien, am Meer")], "a"),
      mcq("q2", en("What was the weather like?"), [opt("a", "sehr heiß"), opt("b", "kalt und windig"), opt("c", "Es hat viel geregnet.")], "a"),
      tf("q3", "Carla hat das Kleid in Rom gekauft.", true),
      tf("q4", "Nils findet das Kleid nicht schön.", false, { explanation: en("He says: „Es steht dir sehr gut!“") }),
      mcq("q5", en("When is Nils going to the mountains?"), [opt("a", "im August"), opt("b", "im Juli"), opt("c", "im Winter")], "a"),
    ],
    refs: [P4, GOETHE_HOEREN],
  },
  {
    slug: "m12-wdh-wortschatz",
    skill: "vocabulary",
    title: { de: "Wörter aus Modul 10 bis 12", en: "Words from modules 10 to 12" },
    instructions: en("Match the words and answer the questions."),
    items: [
      pairs(
        "q1",
        [
          [de("die Jacke"), en("jacket")],
          [de("der Koffer"), en("suitcase")],
          [de("das Wetter"), en("weather")],
          [de("die Mütze"), en("woolly hat")],
          [de("gestern"), en("yesterday")],
          [de("die Brücke"), en("bridge")],
        ],
        { prompt: en("Word and meaning") },
      ),
      mcq("q2", en("It is cold and it is snowing. What do you wear?"), [opt("a", "einen Mantel und eine Mütze"), opt("b", "ein T-Shirt"), opt("c", "einen Rock und ein T-Shirt")], "a"),
      mcq("q3", en("Your friend has a new shirt. It looks good on him. What do you say?"), [opt("a", "Das steht dir gut!"), opt("b", "Gute Reise!"), opt("c", "Es regnet.")], "a"),
      mcq("q4", en("Which word is about the weather?"), [opt("a", "bewölkt"), opt("b", "eng"), opt("c", "besetzt")], "a"),
    ],
    refs: [P4],
  },
];

// --- Lesson 6: Modultest -----------------------------------------------------------------------

const L6 = [
  {
    slug: "m12-test-hoeren",
    skill: "listening",
    title: { de: "Test: Hören", en: "Test: listening" },
    instructions: en("Listen to the announcements. You hear each one only ONCE. Answer the questions."),
    itemAudioMaxPlays: 1,
    passThreshold: 0.7,
    items: [
      tf("q1", "Der Zug nach Rostock fährt um 11:25 Uhr ab.", true, {
        audio: { text: "Achtung an Gleis 2: Der Regionalzug nach Rostock fährt heute zehn Minuten später ab, um 11:25 Uhr.", voice: "female2", rate: "normal" },
      }),
      tf("q2", "Man kann heute mit der S-Bahn zum Flughafen fahren.", false, {
        audio: { text: "Liebe Fahrgäste, heute fährt keine S-Bahn zum Flughafen. Bitte nehmen Sie den Bus. Er fährt vor dem Bahnhof ab.", voice: "male2", rate: "normal" },
      }),
      tf("q3", "Der Flug nach Lissabon startet von Gate C4.", true, {
        audio: { text: "Letzter Aufruf für den Flug 718 nach Lissabon. Bitte kommen Sie sofort zu Gate C4.", voice: "female", rate: "normal" },
      }),
      tf("q4", "Die Passagiere aus London finden ihr Gepäck an Band 3.", false, {
        audio: { text: "Information für die Passagiere aus London: Ihr Gepäck finden Sie heute an Band 6.", voice: "male", rate: "normal" },
      }),
      mcq("q5", en("What is the weather like in the afternoon?"), [opt("a", "Die Sonne scheint."), opt("b", "Es regnet."), opt("c", "Es schneit.")], "a", {
        audio: { text: "Und das Wetter für heute: Am Vormittag ist es bewölkt, am Nachmittag scheint die Sonne. Es sind 19 Grad.", voice: "male2", rate: "normal" },
      }),
      mcq("q6", en("How late is the train?"), [opt("a", "13 Minuten"), opt("b", "30 Minuten"), opt("c", "3 Minuten")], "b", {
        audio: { text: "Der Intercity nach Hamburg hat heute leider 30 Minuten Verspätung.", voice: "female2", rate: "normal" },
      }),
    ],
    refs: [KAP12, GOETHE_HOEREN],
  },
  {
    slug: "m12-test-lesen",
    skill: "reading",
    title: { de: "Test: Lesen", en: "Test: reading" },
    instructions: en("Read Emine's postcard. Answer the questions."),
    passThreshold: 0.7,
    stimulus: {
      textKind: "message",
      text: de(
        "Hallo Paula,\n\nschöne Grüße aus Dresden! Ich bin seit Samstag hier und bleibe noch bis Freitag. Mein Hotel ist klein, aber sehr schön, und es ist direkt im Zentrum. Das Wetter ist super: Die Sonne scheint und es sind 24 Grad.\n\nGestern habe ich eine Stadtrundfahrt gemacht. Die Frauenkirche und das Schloss sind wirklich toll! Heute besichtige ich ein Museum, denn am Nachmittag regnet es. Nach dem Museum gehe ich mit Lukas essen. Lukas wohnt seit zwei Jahren in Dresden und kennt viele gute Restaurants.\n\nBis bald!\nDeine Emine",
      ),
    },
    items: [
      tf("q1", "Emine ist seit Samstag in Dresden.", true),
      tf("q2", "Das Hotel ist groß.", false),
      tf("q3", "Es sind 24 Grad.", true),
      mcq("q4", en("Why does Emine go to a museum today?"), [opt("a", "Am Nachmittag regnet es."), opt("b", "Das Museum ist neu."), opt("c", "Lukas arbeitet im Museum.")], "a"),
      tf("q5", "Lukas wohnt seit zwei Monaten in Dresden.", false),
      tf("q6", "Emine und Lukas gehen nach dem Museum essen.", true),
    ],
    refs: [KAP12, GOETHE_LESEN],
  },
  {
    slug: "m12-test-postkarte",
    skill: "writing",
    title: { de: "Test: Eine Postkarte schreiben", en: "Test: write a postcard" },
    instructions: en("You are on holiday in Vienna. Read your notes. Then write the missing words in your postcard to Sara."),
    passThreshold: 0.7,
    stimulus: {
      text: de(
        "Meine Notizen:\nWien – seit Dienstag\nHotel: klein, im Zentrum\nWetter: Sonne, 28 Grad\nMorgen: Schloss Schönbrunn besichtigen\nNach dem Frühstück: mit der U-Bahn zum Schloss",
      ),
    },
    items: [
      gap("q1", "Liebe Sara, schöne Grüße aus", "!", ["Wien"]),
      gap("q2", "Ich bin", "Dienstag hier.", ["seit"]),
      gap("q3", "Das Wetter ist toll: Die Sonne", "und es sind 28 Grad. (scheinen)", ["scheint"]),
      gap("q4", "Es ist sehr", ".", ["heiß", "warm", "sonnig", "schön"]),
      gap("q5", "Morgen", "ich Schloss Schönbrunn. (besichtigen)", ["besichtige"]),
      gap("q6", "Dort kann", "auch im Park spazieren gehen.", ["man", "ich"]),
      gap("q7", "", "dem Frühstück fahre ich mit der U-Bahn zum Schloss. (after)", ["Nach"]),
    ],
    refs: [KAP12, GOETHE_SCHREIBEN],
  },
  {
    slug: "m12-test-grammatik",
    skill: "grammar",
    title: { de: "Test: Grammatik", en: "Test: grammar" },
    instructions: en("Answer all questions."),
    passThreshold: 0.7,
    items: [
      mcq("q1", de("… besuchst du im Urlaub? – Meine Freundin in Wien."), werWenWem, "b"),
      mcq("q2", de("… gibst du die Postkarte? – Meiner Mutter."), werWenWem, "c"),
      gap("q3", "Im Hotel", "man nicht rauchen. (dürfen)", ["darf"]),
      gap("q4", "Ich wohne seit", "Monat in Leipzig. (ein Monat)", ["einem"]),
      gap("q5", "", "Winter fahren wir in die Berge. (in + der Winter)", ["Im"]),
      order("q6", ["Ich", "trage", "eine", "Jacke", ",", "denn", "es", "ist", "kalt", "."], { alternatives: ["Eine Jacke trage ich, denn es ist kalt."] }),
      mcq("q7", de("Wir fahren ans Meer, …"), [opt("a", "denn wir möchten schwimmen."), opt("b", "denn möchten wir schwimmen."), opt("c", "denn wir schwimmen möchten.")], "a"),
      mcq("q8", de("… dem Essen trinken wir einen Kaffee."), [opt("a", "Nach"), opt("b", "Im"), opt("c", "Am")], "a"),
    ],
    refs: [KAP12, GA10, GA32, GA44],
  },
  {
    slug: "m12-test-wortschatz",
    skill: "vocabulary",
    title: { de: "Test: Wortschatz", en: "Test: vocabulary" },
    instructions: en("Answer all questions."),
    passThreshold: 0.7,
    items: [
      mcq("q1", en("Where do planes take off and land?"), [opt("a", "am Flughafen"), opt("b", "am Bahnhof"), opt("c", "am Strand")], "a"),
      mcq("q2", en("It is 0 degrees and everything is white."), [opt("a", "Es ist heiß."), opt("b", "Die Sonne scheint und es ist warm."), opt("c", "Es schneit.")], "c"),
      typed("q3", ["Koffer", "der Koffer"], { prompt: en("Write the German word for “suitcase”.") }),
      mcq("q4", de("Der Zug hat 20 Minuten …"), [opt("a", "Verspätung"), opt("b", "Gepäck"), opt("c", "Grad")], "a"),
      pairs("q5", [
        [de("sonnig"), en("sunny")],
        [de("bewölkt"), en("cloudy")],
        [de("windig"), en("windy")],
        [de("kalt"), en("cold")],
      ]),
      mcq("q6", en("Which one is a sight in a city?"), [opt("a", "das Schloss"), opt("b", "der Koffer"), opt("c", "der Regen")], "a"),
      typed("q7", ["Wetter", "das Wetter"], { prompt: en("Write the German word for “weather”.") }),
    ],
    refs: [KAP12],
  },
  {
    slug: "m12-test-sprechen",
    skill: "speaking",
    title: { de: "Test: Sprechen – Reisen", en: "Test: speaking – travel" },
    instructions: en(
      "Practise for the A1 speaking exam. Speak for yourself; the model answer is only an example. This practice is not scored.",
    ),
    items: [
      speak("q1", "Topic card „Reisen“, word „Urlaub“: ask your partner a question.", "Wohin fährst du im Urlaub?", { cue: de("Thema: Reisen – Urlaub") }),
      speak("q2", "Answer the question: „Wie ist das Wetter heute?“ It is cloudy and cold, 8 degrees.", "Heute ist es bewölkt und kalt. Es sind acht Grad."),
      speak("q3", "You are a tourist. Politely ask a stranger the way to the station.", "Entschuldigung, wie komme ich zum Bahnhof?"),
      speak("q4", "Say where you like to go on holiday and why. Use denn.", "Ich fahre gern ans Meer, denn ich schwimme gern."),
    ],
    refs: [KAP12, GOETHE_SPRECHEN],
  },
];

export const EXERCISES_BY_LESSON = { L1, L2, L3, L4, L5, L6 };
export const EXERCISES = [...L1, ...L2, ...L3, ...L4, ...L5, ...L6];
