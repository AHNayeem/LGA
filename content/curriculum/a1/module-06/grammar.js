// Module 6 grammar topics. Explanations and examples are original. Topic selection is
// mapped (metadata only) to Netzwerk neu A1 Kap. 6 and Grammatik aktiv chapters 8, 21, 34, 25.

const KAP6 = { ref: "netzwerk-neu-a1-6", note: "Topic alignment only" };
const ga = (n) => ({ ref: `grammatik-aktiv-${n}`, note: "Topic alignment only" });

export const GRAMMAR = [
  {
    slug: "m6-datum-ordinalzahlen",
    title: { de: "Das Datum: Ordinalzahlen", en: "Dates with ordinal numbers" },
    summary: { en: "For dates, German uses ordinal numbers (first, second, third …): Heute ist der dritte Mai. Ich habe am dritten Mai Geburtstag." },
    sections: [
      {
        heading: { en: "1st to 19th: number + -te" },
        body: {
          en: "Add -te to the number: vier → vierte, fünf → fünfte, zehn → zehnte, neunzehn → neunzehnte. Four forms are irregular: erste (1st), dritte (3rd), siebte (7th) and achte (8th, only one t).",
        },
        table: {
          headers: ["", "Zahl", "der …", "am …"],
          rows: [
            ["1.", "eins", "der erste", "am ersten"],
            ["2.", "zwei", "der zweite", "am zweiten"],
            ["3.", "drei", "der dritte", "am dritten"],
            ["4.", "vier", "der vierte", "am vierten"],
            ["7.", "sieben", "der siebte", "am siebten"],
            ["8.", "acht", "der achte", "am achten"],
            ["12.", "zwölf", "der zwölfte", "am zwölften"],
            ["19.", "neunzehn", "der neunzehnte", "am neunzehnten"],
          ],
        },
      },
      {
        heading: { en: "From 20th: number + -ste" },
        body: { en: "From twenty on, add -ste: zwanzig → zwanzigste, einundzwanzig → einundzwanzigste, dreißig → dreißigste." },
        table: {
          headers: ["", "der …", "am …"],
          rows: [
            ["20.", "der zwanzigste", "am zwanzigsten"],
            ["21.", "der einundzwanzigste", "am einundzwanzigsten"],
            ["30.", "der dreißigste", "am dreißigsten"],
            ["31.", "der einunddreißigste", "am einunddreißigsten"],
          ],
        },
      },
      {
        heading: { en: "der …-te or am …-ten?" },
        body: {
          en: "What is the date? → der + ordinal with -e: Heute ist der dritte Mai.\nWhen? → am + ordinal with -en: Die Party ist am dritten Mai.",
        },
        examples: [
          { de: "Der Wievielte ist heute? – Heute ist der zweite Juni.", en: "What's the date today? – Today is the second of June." },
          { de: "Wann hast du Geburtstag? – Am siebten Juli.", en: "When is your birthday? – On the seventh of July." },
          { de: "Ich bin am zwanzigsten April geboren.", en: "I was born on the twentieth of April." },
        ],
      },
      {
        heading: { en: "Writing dates" },
        body: {
          en: "In writing, a full stop after the number shows that it is an ordinal: 3. Mai = der dritte Mai. The day comes first, then the month: 03.05. = der dritte Mai (3 May), not 5 March.",
        },
        examples: [
          { de: "Die Party ist am 7. Juli. (am siebten Juli)", en: "The party is on 7 July." },
          { de: "Heute ist der 01.10. (der erste Oktober)", en: "Today is 1 October." },
        ],
      },
    ],
    refs: [KAP6],
  },
  {
    slug: "m6-trennbare-verben",
    title: { de: "Trennbare Verben", en: "Separable verbs" },
    summary: { en: "Some verbs have a prefix that moves to the end of the sentence: anrufen → Ich rufe dich an." },
    sections: [
      {
        heading: { en: "What is a separable verb?" },
        body: {
          en: "A separable verb is a prefix + a verb: an|rufen (to call), ein|laden (to invite), mit|kommen (to come along), auf|stehen (to get up), ab|holen (to pick up), mit|bringen (to bring), zu|sagen (to accept), ab|sagen (to decline), statt|finden (to take place). The stress is on the prefix: ANrufen, EINladen, MITkommen.",
        },
      },
      {
        heading: { en: "The prefix goes to the end" },
        body: {
          en: "The verb is in position 2 as usual, and the prefix goes to the very end of the sentence. The two parts are like a bracket around the rest of the sentence.",
        },
        table: {
          headers: ["Position 1", "Position 2", "…", "Ende"],
          rows: [
            ["Ich", "rufe", "dich morgen", "an."],
            ["Morgen", "stehe", "ich früh", "auf."],
            ["Wir", "laden", "Anna und Tom", "ein."],
            ["Das Konzert", "findet", "am Samstag", "statt."],
          ],
        },
      },
      {
        heading: { en: "Questions" },
        body: { en: "In W-questions the verb is in position 2, in yes/no questions in position 1. The prefix is always at the end." },
        examples: [
          { de: "Wann stehst du auf?", en: "When do you get up?" },
          { de: "Kommst du am Samstag mit?", en: "Are you coming along on Saturday?" },
          { de: "Holst du mich ab?", en: "Will you pick me up?" },
        ],
      },
      {
        heading: { en: "With können, müssen, wollen" },
        body: { en: "With a modal verb, the separable verb stays together as an infinitive at the end." },
        examples: [
          { de: "Ich kann leider nicht mitkommen.", en: "Unfortunately I can't come along." },
          { de: "Kannst du mich anrufen?", en: "Can you call me?" },
          { de: "Ich muss morgen früh aufstehen.", en: "I have to get up early tomorrow." },
        ],
      },
      {
        heading: { en: "Conjugation" },
        body: { en: "Only the verb part changes. einladen has a vowel change: du lädst ein, er/sie lädt ein." },
        table: {
          headers: ["", "anrufen", "einladen", "mitkommen"],
          rows: [
            ["ich", "rufe … an", "lade … ein", "komme … mit"],
            ["du", "rufst … an", "lädst … ein", "kommst … mit"],
            ["er / sie / es", "ruft … an", "lädt … ein", "kommt … mit"],
            ["wir", "rufen … an", "laden … ein", "kommen … mit"],
            ["ihr", "ruft … an", "ladet … ein", "kommt … mit"],
            ["sie / Sie", "rufen … an", "laden … ein", "kommen … mit"],
          ],
        },
      },
    ],
    refs: [KAP6, ga(8)],
  },
  {
    slug: "m6-personalpronomen-akkusativ",
    title: { de: "Personalpronomen im Akkusativ", en: "Personal pronouns in the accusative" },
    summary: { en: "When a person or thing is the object of the verb, you use the accusative pronoun: Ich rufe dich an. Ich mag ihn." },
    sections: [
      {
        heading: { en: "The forms" },
        body: { en: "The accusative answers the question wen? (whom?) or was? (what?). Only ich, du, er, wir and ihr change." },
        table: {
          headers: ["Nominativ", "Akkusativ"],
          rows: [
            ["ich", "mich"],
            ["du", "dich"],
            ["er", "ihn"],
            ["sie", "sie"],
            ["es", "es"],
            ["wir", "uns"],
            ["ihr", "euch"],
            ["sie / Sie", "sie / Sie"],
          ],
        },
        examples: [
          { de: "Ich lade dich ein.", en: "I'm inviting you." },
          { de: "Kannst du mich abholen?", en: "Can you pick me up?" },
          { de: "Wir rufen euch morgen an.", en: "We'll call you tomorrow." },
        ],
      },
      {
        heading: { en: "Replacing nouns: der → ihn, die → sie, das → es" },
        body: {
          en: "A pronoun replaces a noun with the same gender. Masculine nouns change in the accusative (der → den → ihn); feminine, neuter and plural stay the same.",
        },
        examples: [
          { de: "Der Kuchen ist super. Ich mag ihn.", en: "The cake is great. I like it." },
          { de: "Die Party ist am Samstag. Ich finde sie toll.", en: "The party is on Saturday. I think it's great." },
          { de: "Das Geschenk? Ich kaufe es morgen.", en: "The present? I'll buy it tomorrow." },
          { de: "Wo sind Tom und Lisa? Ich sehe sie nicht.", en: "Where are Tom and Lisa? I can't see them." },
        ],
      },
      {
        heading: { en: "Careful with sie and Sie" },
        body: { en: "sie can mean “her”, “it” (die …) or “them”. Sie with a capital S is the formal “you”: Ich rufe Sie morgen an, Frau Keller." },
      },
    ],
    refs: [KAP6, ga(21)],
  },
  {
    slug: "m6-fuer-akkusativ",
    title: { de: "für + Akkusativ", en: "für + accusative" },
    summary: { en: "The preposition für (for) is always followed by the accusative: für den Kellner, für meinen Bruder, für dich." },
    sections: [
      {
        heading: { en: "Articles after für" },
        body: { en: "Only masculine words change: der → den, ein → einen, mein → meinen. Feminine, neuter and plural stay the same." },
        table: {
          headers: ["", "Nominativ", "für + Akkusativ"],
          rows: [
            ["maskulin", "der Kellner / mein Bruder", "für den Kellner / für meinen Bruder"],
            ["feminin", "die Kellnerin / meine Mutter", "für die Kellnerin / für meine Mutter"],
            ["neutral", "das Kind / mein Kind", "für das Kind / für mein Kind"],
            ["Plural", "die Gäste / meine Freunde", "für die Gäste / für meine Freunde"],
          ],
        },
      },
      {
        heading: { en: "Pronouns after für" },
        body: { en: "After für, use the accusative pronoun: für mich, für dich, für ihn, für sie, für es, für uns, für euch, für sie / Sie." },
        examples: [
          { de: "Das Geschenk ist für dich!", en: "The present is for you!" },
          { de: "Ist der Tee für ihn?", en: "Is the tea for him?" },
        ],
      },
      {
        heading: { en: "In the café and at a party" },
        body: { en: "You often hear für when people order for someone or say thank you." },
        examples: [
          { de: "Für mich einen Kaffee, bitte.", en: "A coffee for me, please." },
          { de: "Und für meine Frau einen Tee.", en: "And a tea for my wife." },
          { de: "Danke für die Einladung!", en: "Thanks for the invitation!" },
          { de: "Ich habe keine Zeit für das Konzert.", en: "I don't have time for the concert." },
        ],
      },
    ],
    refs: [KAP6, ga(34)],
  },
  {
    slug: "m6-praeteritum-haben-sein",
    title: { de: "Präteritum: war und hatte", en: "The past of sein and haben: war and hatte" },
    summary: { en: "To say what was in the past, German uses war (was) and hatte (had): Die Party war super. Ich hatte keine Zeit." },
    sections: [
      {
        heading: { en: "Two important past forms" },
        body: {
          en: "With sein and haben, Germans usually talk about the past with these forms (Präteritum). Learn them as fixed forms – the past of other verbs comes in Module 10.",
        },
        table: {
          headers: ["", "sein", "haben"],
          rows: [
            ["ich", "war", "hatte"],
            ["du", "warst", "hattest"],
            ["er / sie / es", "war", "hatte"],
            ["wir", "waren", "hatten"],
            ["ihr", "wart", "hattet"],
            ["sie / Sie", "waren", "hatten"],
          ],
        },
      },
      {
        heading: { en: "ich = er / sie / es" },
        body: { en: "The ich form and the er/sie/es form are the same and have no ending: ich war – er war, ich hatte – sie hatte." },
      },
      {
        heading: { en: "Time words for the past" },
        body: {
          en: "gestern (yesterday), am Samstag (on Saturday), am Wochenende (at the weekend). The verb stays in position 2, also when the time word comes first.",
        },
        examples: [
          { de: "Wie war die Party? – Sie war super!", en: "How was the party? – It was great!" },
          { de: "Gestern hatte ich keine Zeit.", en: "Yesterday I didn't have time." },
          { de: "Wo warst du am Samstag? – Ich war in Köln.", en: "Where were you on Saturday? – I was in Cologne." },
          { de: "Wir hatten viel Spaß.", en: "We had a lot of fun." },
        ],
      },
    ],
    refs: [KAP6, ga(25)],
  },
];
