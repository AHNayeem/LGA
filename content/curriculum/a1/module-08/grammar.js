// Module 8 grammar topics. Explanations and examples are original. Topic selection is
// mapped (metadata only) to Netzwerk neu A1 Kap. 8 and Grammatik aktiv chapters 9 and 7.

const KAP8 = { ref: "netzwerk-neu-a1-8", note: "Topic alignment only" };

export const GRAMMAR = [
  {
    slug: "m8-was-fehlt-ihnen",
    title: { de: "Was fehlt Ihnen? – Was tut weh?", en: "Saying what's wrong and what hurts" },
    summary: { en: "A few fixed expressions are enough to tell a doctor or a friend how you feel." },
    sections: [
      {
        heading: { en: "The questions" },
        body: {
          en: "The doctor asks: Was fehlt Ihnen? (What's the matter?) or Was tut (Ihnen) weh? (What hurts?). Friends ask: Was fehlt dir? or Wie geht's? Learn these questions as fixed chunks.",
        },
        examples: [
          { de: "Guten Tag, Frau Aydin. Was fehlt Ihnen?", en: "Hello, Ms Aydin. What's the matter?" },
          { de: "Was tut weh?", en: "What hurts?" },
        ],
      },
      {
        heading: { en: "Mir geht es nicht gut." },
        body: {
          en: "To say that you don't feel well, use the chunk Mir geht es nicht gut. (or Es geht mir nicht gut.). Mir is not ich here – just learn the whole sentence. Positive: Mir geht es gut.",
        },
        examples: [{ de: "Mir geht es heute nicht gut. Ich bleibe zu Hause.", en: "I don't feel well today. I'm staying at home." }],
      },
      {
        heading: { en: "wehtun: tut weh or tun weh?" },
        body: {
          en: "wehtun is a separable verb: weh goes to the end. One body part → tut weh. Two or more (plural) → tun weh.",
        },
        table: {
          headers: ["", "Verb", "", "weh"],
          rows: [
            ["Mein Kopf", "tut", "", "weh."],
            ["Der Rücken", "tut", "sehr", "weh."],
            ["Meine Füße", "tun", "", "weh."],
            ["Was", "tut", "Ihnen", "weh?"],
          ],
        },
      },
      {
        heading: { en: "Ich habe … : body part + Schmerzen" },
        body: {
          en: "Instead of „… tut weh“ you can say Ich habe …schmerzen. The word is plural and has no article. Fieber, Husten, Schnupfen and Grippe also have no article; eine Erkältung has one.",
        },
        table: {
          headers: ["Körperteil", "Ich habe …"],
          rows: [
            ["der Kopf", "Kopfschmerzen"],
            ["der Bauch", "Bauchschmerzen"],
            ["der Hals", "Halsschmerzen"],
            ["der Rücken", "Rückenschmerzen"],
            ["der Zahn", "Zahnschmerzen"],
          ],
        },
        examples: [
          { de: "Ich habe Fieber und Husten.", en: "I have a temperature and a cough." },
          { de: "Ich habe eine Erkältung.", en: "I have a cold." },
        ],
      },
    ],
    refs: [KAP8],
  },
  {
    slug: "m8-imperativ",
    title: { de: "Der Imperativ: du, ihr und Sie", en: "The imperative with du, ihr and Sie" },
    summary: { en: "Instructions and tips: Trink viel Wasser! Trinkt viel Wasser! Trinken Sie viel Wasser!" },
    sections: [
      {
        heading: { en: "Sie – you know it already" },
        body: { en: "The Sie form is the verb + Sie: Bleiben Sie im Bett! Doctors and receptionists use it with patients." },
        examples: [
          { de: "Nehmen Sie bitte Platz!", en: "Please take a seat!" },
          { de: "Machen Sie bitte den Mund auf!", en: "Please open your mouth!" },
        ],
      },
      {
        heading: { en: "du – the du form without -st and without du" },
        body: {
          en: "Take the du form, drop -st and drop the word du: du trinkst → Trink! Sometimes you hear an extra -e (Trinke!), which is also correct. Verbs with e → i keep the i: du nimmst → Nimm!, du isst → Iss! Verbs with a → ä lose the umlaut: du schläfst → Schlaf!",
        },
        examples: [
          { de: "Trink viel Wasser!", en: "Drink a lot of water!" },
          { de: "Nimm das Rezept mit!", en: "Take the prescription with you!" },
        ],
      },
      {
        heading: { en: "ihr – the ihr form without ihr" },
        body: { en: "Use the normal ihr form and drop ihr: ihr trinkt → Trinkt!" },
        examples: [{ de: "Kinder, bleibt heute zu Hause!", en: "Children, stay at home today!" }],
      },
      {
        heading: { en: "Overview" },
        table: {
          headers: ["Infinitiv", "du", "ihr", "Sie"],
          rows: [
            ["trinken", "Trink!", "Trinkt!", "Trinken Sie!"],
            ["bleiben", "Bleib!", "Bleibt!", "Bleiben Sie!"],
            ["nehmen", "Nimm!", "Nehmt!", "Nehmen Sie!"],
            ["schlafen", "Schlaf!", "Schlaft!", "Schlafen Sie!"],
            ["anrufen", "Ruf … an!", "Ruft … an!", "Rufen Sie … an!"],
            ["sein", "Sei!", "Seid!", "Seien Sie!"],
          ],
        },
        body: { en: "The verb comes first. Separable verbs send the prefix to the end: Ruf die Praxis an! sein is irregular." },
      },
      {
        heading: { en: "Be polite: bitte" },
        body: { en: "Add bitte to make an instruction friendly. It can go after the verb (and Sie) or at the start." },
        examples: [
          { de: "Ruf mich bitte an!", en: "Please call me!" },
          { de: "Bitte seien Sie pünktlich!", en: "Please be on time!" },
        ],
      },
    ],
    refs: [KAP8, { ref: "grammatik-aktiv-9", note: "Topic alignment only" }],
  },
  {
    slug: "m8-modalverben-sollen-muessen-duerfen",
    title: { de: "Modalverben: sollen, müssen, dürfen", en: "Modal verbs: sollen, müssen, dürfen" },
    summary: { en: "What you should do, what you must do and what you may (not) do." },
    sections: [
      {
        heading: { en: "Meaning" },
        body: {
          en: "müssen = must, have to (it is necessary). sollen = should, be supposed to (another person says so, e.g. the doctor). dürfen = may, be allowed to. nicht dürfen = must not. Careful: nicht müssen = don't have to.",
        },
        examples: [
          { de: "Ich muss heute in der Apotheke ein Medikament holen.", en: "I have to get a medicine at the pharmacy today." },
          { de: "Die Ärztin sagt, ich soll viel schlafen.", en: "The doctor says I should sleep a lot." },
          { de: "Sie dürfen hier nicht rauchen.", en: "You mustn't smoke here." },
          { de: "Sie müssen nicht wiederkommen.", en: "You don't have to come back." },
        ],
      },
      {
        heading: { en: "Forms" },
        body: { en: "ich and er/sie/es have the same form and no ending. dürfen and müssen change the vowel in the singular." },
        table: {
          headers: ["", "sollen", "müssen", "dürfen"],
          rows: [
            ["ich", "soll", "muss", "darf"],
            ["du", "sollst", "musst", "darfst"],
            ["er / sie / es", "soll", "muss", "darf"],
            ["wir", "sollen", "müssen", "dürfen"],
            ["ihr", "sollt", "müsst", "dürft"],
            ["sie / Sie", "sollen", "müssen", "dürfen"],
          ],
        },
      },
      {
        heading: { en: "Word order: the sentence bracket" },
        body: { en: "The modal verb is in position 2. The second verb goes to the end, in the infinitive." },
        table: {
          headers: ["Position 1", "Modalverb", "", "Infinitiv"],
          rows: [
            ["Sie", "dürfen", "heute keinen Sport", "machen."],
            ["Du", "sollst", "viel Wasser", "trinken."],
            ["Heute", "muss", "ich im Bett", "bleiben."],
            ["", "Darf", "ich hier", "rauchen?"],
          ],
        },
      },
    ],
    refs: [KAP8, { ref: "grammatik-aktiv-7", note: "Topic alignment only" }],
  },
];
