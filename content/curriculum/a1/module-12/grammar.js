// Module 12 grammar topics. Explanations and examples are original. Topic selection is
// mapped (metadata only) to Netzwerk neu A1 Kap. 12 and Grammatik aktiv chapters 10, 32, 44.

const KAP12 = { ref: "netzwerk-neu-a1-12", note: "Topic alignment only" };

export const GRAMMAR = [
  {
    slug: "m12-man",
    title: { de: "Das Pronomen man", en: "The pronoun man" },
    summary: { en: "man means “people in general” – in English often “you”, “one” or “people”. The verb is always in the er/sie/es form." },
    sections: [
      {
        heading: { en: "What does man mean?" },
        body: {
          en: "man does not mean one particular person. It means people in general. English often says “you” or “people” here.\n\nCareful: man (one n, small letter) is not der Mann (the man).",
        },
        examples: [
          { de: "Hier kann man gut essen.", en: "You can eat well here." },
          { de: "In Österreich spricht man Deutsch.", en: "People speak German in Austria." },
          { de: "Im Museum darf man nicht fotografieren.", en: "You're not allowed to take photos in the museum." },
        ],
      },
      {
        heading: { en: "The verb form" },
        body: { en: "The verb after man has the same ending as after er, sie or es." },
        table: {
          headers: ["", "Verb", "Beispiel"],
          rows: [
            ["man", "fährt", "Zum Schloss fährt man mit dem Bus."],
            ["man", "sieht", "Vom Turm sieht man die ganze Stadt."],
            ["man", "kann", "Hier kann man gut schwimmen."],
            ["man", "muss", "Am Flughafen muss man den Reisepass zeigen."],
          ],
        },
      },
      {
        heading: { en: "man with modal verbs" },
        body: {
          en: "man is very common with können, dürfen and müssen. The modal verb is in position 2, the infinitive goes to the end.",
        },
        examples: [
          { de: "Im Winter kann man hier Ski fahren.", en: "In winter you can go skiing here." },
          { de: "Im Bus darf man nicht essen.", en: "You're not allowed to eat on the bus." },
        ],
      },
      {
        heading: { en: "Questions with man" },
        body: { en: "Tourists often ask questions with man." },
        examples: [
          { de: "Wo kann man hier gut essen?", en: "Where can you eat well around here?" },
          { de: "Darf man hier fotografieren?", en: "Are you allowed to take photos here?" },
          { de: "Wo bekommt man einen Stadtplan?", en: "Where can you get a city map?" },
        ],
      },
    ],
    refs: [KAP12],
  },
  {
    slug: "m12-denn",
    title: { de: "Sätze verbinden mit denn", en: "Connecting sentences with denn" },
    summary: { en: "denn means “because”. It joins two main clauses and does not change the word order." },
    sections: [
      {
        heading: { en: "denn gives a reason" },
        body: {
          en: "The second sentence gives the reason for the first one. denn stands at position 0: it does not count. After denn the sentence is normal – the verb is in position 2. Put a comma before denn.",
        },
        table: {
          headers: ["Satz 1", "Position 0", "Position 1", "Verb", ""],
          rows: [
            ["Wir gehen nicht an den Strand,", "denn", "es", "ist", "zu kalt."],
            ["Ich trage eine Jacke,", "denn", "der Wind", "ist", "sehr kalt."],
            ["Tom fährt ans Meer,", "denn", "er", "möchte", "schwimmen."],
          ],
        },
      },
      {
        heading: { en: "Like und, aber, oder" },
        body: { en: "denn works like und, aber and oder: all of them stand at position 0 and the word order stays the same." },
        examples: [
          { de: "Es ist sonnig, aber es ist kalt.", en: "It's sunny, but it's cold." },
          { de: "Wir fahren ans Meer oder wir fahren in die Berge.", en: "We'll go to the sea or we'll go to the mountains." },
          { de: "Ich bleibe im Hotel, denn ich bin müde.", en: "I'm staying in the hotel because I'm tired." },
        ],
      },
      {
        heading: { en: "Answering Warum?" },
        body: {
          en: "When someone asks Warum? (why?), you can answer with a full sentence and denn. Another word for “because”, weil, comes later (A2) and changes the word order.",
        },
        examples: [{ de: "Warum bleibst du zu Hause? – Ich bleibe zu Hause, denn ich bin krank.", en: "Why are you staying at home? – I'm staying at home because I'm ill." }],
      },
    ],
    refs: [KAP12, { ref: "grammatik-aktiv-44", note: "Topic alignment only" }],
  },
  {
    slug: "m12-wer-wen-wem",
    title: { de: "Wer? Wen? Wem?", en: "Who? – in the nominative, accusative and dative" },
    summary: { en: "The question word wer changes like the article der: wer – wen – wem." },
    sections: [
      {
        heading: { en: "Three forms" },
        table: {
          headers: ["Kasus", "Frage", "Artikel (maskulin)", "Beispiel"],
          rows: [
            ["Nominativ", "Wer?", "der", "Wer macht die Stadtrundfahrt? – Der Tourist aus Spanien."],
            ["Akkusativ", "Wen?", "den", "Wen besuchst du in Wien? – Meinen Bruder."],
            ["Dativ", "Wem?", "dem", "Wem schreibst du eine Postkarte? – Meinem Opa."],
          ],
        },
      },
      {
        heading: { en: "Which form?" },
        body: {
          en: "Look at the verb and at the answer.\n• The person does the action (subject) → Wer?\n• The person is the accusative object (besuchen, fragen, sehen, fotografieren …) → Wen?\n• The person is the dative object (helfen, gefallen, passen, stehen, or the person you give, write or show something to) → Wem?",
        },
        examples: [
          { de: "Wer fährt mit zum Flughafen? – Ich!", en: "Who is coming along to the airport? – Me!" },
          { de: "Wen fragst du nach dem Weg? – Den Mann dort.", en: "Who are you asking for directions? – The man over there." },
          { de: "Wem hilfst du? – Einer Touristin.", en: "Who are you helping? – A tourist." },
          { de: "Wem gefällt die Stadt? – Mir!", en: "Who likes the city? – I do!" },
        ],
      },
      {
        heading: { en: "Things: was" },
        body: { en: "For things you ask with was – in the nominative and in the accusative." },
        examples: [{ de: "Was besichtigt ihr morgen? – Das Schloss.", en: "What are you visiting tomorrow? – The castle." }],
      },
    ],
    refs: [KAP12, { ref: "grammatik-aktiv-10", note: "Topic alignment only" }],
  },
  {
    slug: "m12-temporale-praepositionen",
    title: { de: "Zeitangaben mit in, vor, nach, seit", en: "Time expressions with in, vor, nach and seit" },
    summary: { en: "After the time prepositions in, vor, nach and seit comes the dative." },
    sections: [
      {
        heading: { en: "Meaning" },
        table: {
          headers: ["Präposition", "Bedeutung", "Beispiel"],
          rows: [
            ["in", "seasons, months, parts of the day; with a time span: in (the future)", "im Sommer, im Juli, in der Nacht, in einer Woche"],
            ["vor", "before; with a time span: ago", "vor dem Frühstück, vor zwei Tagen"],
            ["nach", "after", "nach der Arbeit, nach dem Urlaub"],
            ["seit", "since, for (it started in the past and is still true)", "seit Montag, seit einem Jahr"],
          ],
        },
      },
      {
        heading: { en: "The dative forms" },
        body: { en: "in + dem becomes im: im Sommer, im August. In the dative plural the noun gets -n: zwei Tage → vor zwei Tagen." },
        table: {
          headers: ["", "maskulin", "neutral", "feminin", "Plural"],
          rows: [
            ["bestimmt", "nach dem Urlaub", "vor dem Frühstück", "nach der Arbeit", "in den Ferien"],
            ["unbestimmt", "seit einem Monat", "seit einem Jahr", "in einer Woche", "vor zwei Tagen"],
          ],
        },
      },
      {
        heading: { en: "seit + present tense" },
        body: { en: "With seit, German uses the present tense where English says “have been / have lived …”." },
        examples: [
          { de: "Ich wohne seit einem Jahr in Köln.", en: "I have lived in Cologne for a year." },
          { de: "Wir sind seit Samstag in Wien.", en: "We have been in Vienna since Saturday." },
        ],
      },
      {
        heading: { en: "vor: before or ago" },
        body: { en: "vor + an event = before. vor + a time span = ago (usually with a past form)." },
        examples: [
          { de: "Vor dem Frühstück gehe ich schwimmen.", en: "Before breakfast I go swimming." },
          { de: "Vor drei Tagen war ich in Rom.", en: "Three days ago I was in Rome." },
          { de: "Nach dem Urlaub muss ich wieder arbeiten.", en: "After the holiday I have to work again." },
        ],
      },
    ],
    refs: [KAP12, { ref: "grammatik-aktiv-32", note: "Topic alignment only" }],
  },
];
