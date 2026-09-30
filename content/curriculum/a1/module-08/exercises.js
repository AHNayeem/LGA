// Module 8 exercises. All texts, dialogues, messages and questions are original. Task
// *formats* follow the Goethe A1 structure documented in docs/REFERENCE-ANALYSIS.md (Hören
// Teil 3 phone messages with 3-option MC played twice, richtig/falsch, form filling,
// Sprechen Teil 3 requests); no exam content is reproduced. The health content is kept
// generic (rest, water, see a doctor) and is not medical advice.
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
const KAP8 = { ref: "netzwerk-neu-a1-8", note: "Topic alignment only" };
const GA9 = { ref: "grammatik-aktiv-9", note: "Topic alignment only" };
const GA7 = { ref: "grammatik-aktiv-7", note: "Topic alignment only" };

const articles = [opt("a", "der"), opt("b", "die"), opt("c", "das")];

// --- Lesson 1: Der Körper -------------------------------------------------------------

const L1 = [
  {
    slug: "m8-koerper-zuordnen",
    skill: "vocabulary",
    title: { de: "Der Körper", en: "The body" },
    instructions: en("Match the German word with its meaning."),
    items: [
      pairs("q1", [
        [de("der Kopf"), en("head")],
        [de("das Auge"), en("eye")],
        [de("das Ohr"), en("ear")],
        [de("die Nase"), en("nose")],
        [de("der Mund"), en("mouth")],
        [de("der Zahn"), en("tooth")],
        [de("der Hals"), en("neck, throat")],
      ]),
      pairs("q2", [
        [de("der Bauch"), en("stomach")],
        [de("der Rücken"), en("back")],
        [de("der Arm"), en("arm")],
        [de("die Hand"), en("hand")],
        [de("das Bein"), en("leg")],
        [de("der Fuß"), en("foot")],
        [de("der Körper"), en("body")],
      ]),
    ],
    refs: [KAP8],
  },
  {
    slug: "m8-koerper-artikel",
    skill: "vocabulary",
    title: { de: "der, die oder das?", en: "der, die or das?" },
    instructions: en("Choose the right article."),
    items: [
      ["q1", "… Kopf", "a"],
      ["q2", "… Nase", "b"],
      ["q3", "… Auge", "c"],
      ["q4", "… Hand", "b"],
      ["q5", "… Bein", "c"],
      ["q6", "… Rücken", "a"],
      ["q7", "… Ohr", "c"],
      ["q8", "… Fuß", "a"],
    ].map(([id, word, answer]) => mcq(id, de(word), articles, answer)),
    refs: [KAP8],
  },
  {
    slug: "m8-koerper-plural",
    skill: "vocabulary",
    title: { de: "Ein Fuß, zwei Füße", en: "One foot, two feet" },
    instructions: en("Write the plural form (without the article)."),
    items: [
      gap("q1", "ein Fuß – zwei", "", ["Füße"], { explanation: en("der Fuß – die Füße: the plural adds an umlaut and -e.") }),
      gap("q2", "eine Hand – zwei", "", ["Hände"]),
      gap("q3", "ein Auge – zwei", "", ["Augen"]),
      gap("q4", "ein Ohr – zwei", "", ["Ohren"]),
      gap("q5", "ein Arm – zwei", "", ["Arme"]),
      gap("q6", "ein Bein – zwei", "", ["Beine"]),
      gap("q7", "ein Zahn – zwei", "", ["Zähne"]),
    ],
    refs: [KAP8],
  },
  {
    slug: "m8-koerper-hoeren",
    skill: "listening",
    title: { de: "Welcher Körperteil?", en: "Listening: which part of the body?" },
    instructions: en("Listen to each sentence. You can play it twice. Which part of the body do you hear?"),
    itemAudioMaxPlays: 2,
    items: [
      mcq("q1", en("Which part of the body?"), [opt("a", "der Mund"), opt("b", "die Nase"), opt("c", "das Ohr")], "a", {
        audio: { text: "Machen Sie bitte den Mund auf!", voice: "female", rate: "slow" },
      }),
      mcq("q2", en("Which part of the body?"), [opt("a", "der Arm"), opt("b", "die Hand"), opt("c", "der Fuß")], "b", {
        audio: { text: "Ich schreibe mit der Hand.", voice: "male", rate: "slow" },
      }),
      mcq("q3", en("Which part of the body?"), [opt("a", "die Beine"), opt("b", "der Kopf"), opt("c", "die Augen")], "c", {
        audio: { text: "Machen Sie bitte die Augen zu!", voice: "female2", rate: "slow" },
      }),
      mcq("q4", en("Which part of the body?"), [opt("a", "die Füße"), opt("b", "die Hände"), opt("c", "die Ohren")], "a", {
        audio: { text: "Meine Füße sind sehr kalt.", voice: "male2", rate: "slow" },
      }),
      mcq("q5", en("Which part of the body?"), [opt("a", "der Bauch"), opt("b", "das Bein"), opt("c", "der Hals")], "b", {
        audio: { text: "Stehen Sie bitte auf einem Bein!", voice: "female", rate: "slow" },
      }),
      mcq("q6", en("Which part of the body?"), [opt("a", "der Rücken"), opt("b", "das Auge"), opt("c", "der Kopf")], "c", {
        audio: { text: "Drehen Sie bitte den Kopf nach links!", voice: "male", rate: "slow" },
      }),
    ],
    refs: [KAP8, GOETHE_HOEREN],
  },
];

// --- Lesson 2: Mir geht es nicht gut ---------------------------------------------------

const L2 = [
  {
    slug: "m8-was-tut-weh",
    skill: "grammar",
    title: { de: "Was tut weh?", en: "What hurts?" },
    instructions: en("Write tut or tun, then choose the right sentence."),
    items: [
      gap("q1", "Mein Kopf", "weh.", ["tut"]),
      gap("q2", "Meine Füße", "weh.", ["tun"], { explanation: en("Füße is plural, so the verb is tun.") }),
      gap("q3", "Was", "Ihnen weh?", ["tut"]),
      gap("q4", "Der Rücken und der Bauch", "weh.", ["tun"]),
      mcq("q5", de("Der Kopf tut weh. Ich habe …"), [opt("a", "Kopfschmerzen."), opt("b", "Bauchschmerzen."), opt("c", "Halsschmerzen.")], "a"),
      mcq("q6", en("Which sentence is correct?"), [opt("a", "Ich habe einen Erkältung."), opt("b", "Ich habe eine Erkältung."), opt("c", "Ich bin eine Erkältung.")], "b"),
      mcq("q7", en("A friend asks „Wie geht's?“. You feel ill."), [opt("a", "Ich geht es nicht gut."), opt("b", "Mir geht nicht es gut."), opt("c", "Mir geht es nicht gut.")], "c"),
      mcq("q8", en("The doctor wants to know what the matter is. What does she ask?"), [opt("a", "Was fehlt Ihnen?"), opt("b", "Was fehlen Sie?"), opt("c", "Wie fehlt Ihnen?")], "a"),
    ],
    refs: [KAP8],
  },
  {
    slug: "m8-beschwerden-zuordnen",
    skill: "vocabulary",
    title: { de: "Ich bin krank", en: "I'm ill" },
    instructions: en("Match the items that go together."),
    items: [
      pairs(
        "q1",
        [
          [de("Der Kopf tut weh."), de("Ich habe Kopfschmerzen.")],
          [de("Der Hals tut weh."), de("Ich habe Halsschmerzen.")],
          [de("Der Bauch tut weh."), de("Ich habe Bauchschmerzen.")],
          [de("Der Rücken tut weh."), de("Ich habe Rückenschmerzen.")],
          [de("Der Zahn tut weh."), de("Ich habe Zahnschmerzen.")],
        ],
        { prompt: en("Two ways to say the same thing") },
      ),
      pairs(
        "q2",
        [
          [de("das Fieber"), en("fever")],
          [de("der Husten"), en("cough")],
          [de("der Schnupfen"), en("runny nose")],
          [de("die Grippe"), en("flu")],
          [de("krank"), en("ill")],
          [de("gesund"), en("healthy")],
        ],
        { prompt: en("Word and meaning") },
      ),
    ],
    refs: [KAP8],
  },
  {
    slug: "m8-krank-lesen",
    skill: "reading",
    title: { de: "Eine E-Mail von Jana", en: "An e-mail from Jana" },
    instructions: en("Read the e-mail. Are the sentences true (richtig) or false (falsch)?"),
    stimulus: {
      textKind: "email",
      text: de(
        "Liebe Frau Brandt,\n\nleider kann ich heute nicht kommen. Mir geht es nicht gut. Ich habe Fieber und Halsschmerzen. Kopfschmerzen habe ich nicht. Ich bleibe heute zu Hause und schlafe viel.\n\nMorgen um 9 Uhr habe ich einen Termin in der Praxis Dr. Wolf. Die Hausaufgaben mache ich am Wochenende.\n\nViele Grüße\nJana Petrović",
      ),
    },
    items: [
      tf("q1", "Jana ist krank.", true),
      tf("q2", "Jana hat Kopfschmerzen.", false, { explanation: en("She writes: „Kopfschmerzen habe ich nicht.“") }),
      tf("q3", "Jana ist heute im Kurs.", false),
      tf("q4", "Jana hat morgen einen Termin in der Praxis.", true),
      tf("q5", "Der Termin ist am Nachmittag.", false, { explanation: en("The appointment is at 9 a.m. – in the morning.") }),
    ],
    refs: [KAP8, GOETHE_LESEN],
  },
];

// --- Lesson 3: In der Arztpraxis ---------------------------------------------------------

const L3 = [
  {
    slug: "m8-imperativ-formen",
    skill: "grammar",
    title: { de: "Trink viel Wasser!", en: "Imperative forms" },
    instructions: en("Write the imperative of the verb in brackets for the person given (du, ihr or Sie)."),
    items: [
      gap("q1", "", "viel Wasser! (trinken – du)", ["Trink", "Trinke"]),
      gap("q2", "", "Sie bitte Platz! (nehmen – Sie)", ["Nehmen"]),
      gap("q3", "", "heute im Bett! (bleiben – du)", ["Bleib", "Bleibe"]),
      gap("q4", "", "das Rezept mit! (mitnehmen – du)", ["Nimm"], { explanation: en("du nimmst → Nimm! The prefix mit goes to the end.") }),
      gap("q5", "", "viel! (schlafen – du)", ["Schlaf", "Schlafe"], { explanation: en("du schläfst → Schlaf! The umlaut disappears.") }),
      gap("q6", "Kinder,", "bitte leise! (sein – ihr)", ["seid"]),
      gap("q7", "", "viel Tee, Kinder! (trinken – ihr)", ["Trinkt"]),
      gap("q8", "", "Sie morgen wieder an! (anrufen – Sie)", ["Rufen"]),
      gap("q9", "", "den Mund auf! (aufmachen – du)", ["Mach", "Mache"]),
      gap("q10", "", "Sie bitte pünktlich! (sein – Sie)", ["Seien"]),
    ],
    refs: [KAP8, GA9],
  },
  {
    slug: "m8-imperativ-ordnen",
    skill: "grammar",
    title: { de: "Anweisungen bauen", en: "Build the instruction" },
    instructions: en("Put the words in the right order."),
    items: [
      order("q1", ["Trink", "viel", "Wasser", "!"]),
      order("q2", ["Bleiben", "Sie", "heute", "im", "Bett", "!"]),
      order("q3", ["Machen", "Sie", "bitte", "den", "Mund", "auf", "!"], {
        alternatives: ["Bitte machen Sie den Mund auf!", "Machen Sie den Mund bitte auf!"],
      }),
      order("q4", ["Ruf", "die", "Praxis", "morgen", "an", "!"], { alternatives: ["Ruf morgen die Praxis an!"] }),
      order("q5", ["Nehmt", "bitte", "Platz", "!"], { alternatives: ["Bitte nehmt Platz!"] }),
    ],
    refs: [KAP8, GA9],
  },
  {
    slug: "m8-praxis-hoeren",
    skill: "listening",
    title: { de: "An der Anmeldung", en: "Listening: at the reception" },
    instructions: en("Listen to the conversation at the doctor's reception. You can play it twice. Then answer the questions."),
    stimulus: {
      textKind: "dialogue",
      audio: {
        lines: [
          { speaker: "Frau Roth", text: "Guten Morgen! Was kann ich für Sie tun?", voice: "female", rate: "normal" },
          { speaker: "Herr Novak", text: "Guten Morgen! Mein Name ist Novak. Ich habe um halb zehn einen Termin.", voice: "male", rate: "normal" },
          { speaker: "Frau Roth", text: "Ja, richtig, Herr Novak. Haben Sie Ihre Gesundheitskarte?", voice: "female", rate: "normal" },
          { speaker: "Herr Novak", text: "Ja, hier, bitte.", voice: "male", rate: "normal" },
          { speaker: "Frau Roth", text: "Danke. Was fehlt Ihnen denn?", voice: "female", rate: "normal" },
          { speaker: "Herr Novak", text: "Ich habe Halsschmerzen und Husten. Und ich bin sehr müde.", voice: "male", rate: "normal" },
          { speaker: "Frau Roth", text: "Haben Sie auch Fieber?", voice: "female", rate: "normal" },
          { speaker: "Herr Novak", text: "Nein, Fieber habe ich nicht.", voice: "male", rate: "normal" },
          { speaker: "Frau Roth", text: "Gut. Nehmen Sie bitte im Wartezimmer Platz. Die Ärztin ruft Sie gleich.", voice: "female", rate: "normal" },
          { speaker: "Herr Novak", text: "Vielen Dank!", voice: "male", rate: "normal" },
        ],
      },
      maxPlays: 2,
      transcriptPolicy: "after_submit",
    },
    items: [
      mcq("q1", en("When is Mr Novak's appointment?"), [opt("a", "um 9:30 Uhr"), opt("b", "um 10:30 Uhr"), opt("c", "um 10:00 Uhr")], "a", {
        explanation: en("halb zehn = 9:30."),
      }),
      mcq("q2", en("What is wrong with him?"), [opt("a", "Kopfschmerzen und Fieber"), opt("b", "Halsschmerzen und Husten"), opt("c", "Bauchschmerzen und Husten")], "b"),
      tf("q3", "Herr Novak hat Fieber.", false),
      mcq("q4", en("What does the receptionist want to see?"), [opt("a", "das Rezept"), opt("b", "die Tabletten"), opt("c", "die Gesundheitskarte")], "c"),
      tf("q5", "Herr Novak wartet im Wartezimmer.", true),
    ],
    refs: [KAP8, GOETHE_HOEREN],
  },
  {
    slug: "m8-praxis-sprechen",
    skill: "speaking",
    title: { de: "Beim Arzt", en: "At the doctor's" },
    instructions: en("Say your answer out loud. Then compare it with the model answer and rate yourself."),
    items: [
      speak("q1", "You are at the reception. Politely ask if there is an appointment free today.", "Guten Tag! Haben Sie heute noch einen Termin frei?"),
      speak("q2", "Tell the doctor that your head hurts and you have a temperature.", "Mein Kopf tut weh, und ich habe Fieber.", {
        modelAudio: { text: "Mein Kopf tut weh, und ich habe Fieber.", voice: "male", rate: "slow" },
      }),
      speak("q3", "You are the doctor. Ask the patient politely to open their mouth.", "Machen Sie bitte den Mund auf!"),
      speak("q4", "Your friend is ill. Tell them (du) to drink a lot of water and stay in bed.", "Trink viel Wasser und bleib im Bett!", {
        modelAudio: { text: "Trink viel Wasser und bleib im Bett!", voice: "male", rate: "slow" },
      }),
    ],
    refs: [KAP8, GOETHE_SPRECHEN],
  },
];

// --- Lesson 4: Gute Besserung! -----------------------------------------------------------

const L4 = [
  {
    slug: "m8-modalverben-formen",
    skill: "grammar",
    title: { de: "sollen, müssen, dürfen", en: "sollen, müssen, dürfen" },
    instructions: en("Write the correct form of the modal verb in brackets."),
    items: [
      gap("q1", "Du", "viel Wasser trinken. (sollen)", ["sollst"]),
      gap("q2", "Sie", "heute keinen Sport machen. (dürfen)", ["dürfen"]),
      gap("q3", "Ich", "morgen noch einmal anrufen. (müssen)", ["muss"]),
      gap("q4", "", "ich hier rauchen? (dürfen)", ["Darf"]),
      gap("q5", "Der Arzt sagt, Anna", "im Bett bleiben. (sollen)", ["soll"]),
      gap("q6", "Ihr", "hier nicht rauchen. (dürfen)", ["dürft"]),
      gap("q7", "Wir", "das Medikament in der Apotheke holen. (müssen)", ["müssen"]),
      gap("q8", "Was", "ich jetzt machen, Frau Doktor? (sollen)", ["soll"]),
    ],
    refs: [KAP8, GA7],
  },
  {
    slug: "m8-modalverben-bedeutung",
    skill: "grammar",
    title: { de: "Was darf ich? Was soll ich?", en: "What may I do? What should I do?" },
    instructions: en("Choose the sentence that matches the situation, then build the sentences."),
    items: [
      mcq("q1", en("The doctor says sport is not allowed."), [opt("a", "Sie dürfen keinen Sport machen."), opt("b", "Sie müssen Sport machen."), opt("c", "Sie sollen Sport machen.")], "a"),
      mcq("q2", en("It isn't necessary to come back."), [opt("a", "Sie dürfen nicht wiederkommen."), opt("b", "Sie müssen nicht wiederkommen."), opt("c", "Sie sollen wiederkommen.")], "b", {
        explanation: en("nicht müssen = don't have to. nicht dürfen = mustn't."),
      }),
      mcq("q3", en("You tell a friend what the doctor told you: sleep a lot."), [opt("a", "Ich darf nicht schlafen."), opt("b", "Ich muss nicht schlafen."), opt("c", "Ich soll viel schlafen.")], "c"),
      mcq("q4", en("You want to know if smoking is allowed here."), [opt("a", "Darf ich hier rauchen?"), opt("b", "Muss ich hier rauchen?"), opt("c", "Soll ich hier rauchen?")], "a"),
      order("q5", ["Sie", "dürfen", "heute", "keinen", "Sport", "machen", "."], { alternatives: ["Heute dürfen Sie keinen Sport machen."] }),
      order("q6", ["Du", "sollst", "viel", "Wasser", "trinken", "."], { alternatives: ["Viel Wasser sollst du trinken."] }),
    ],
    refs: [KAP8, GA7],
  },
  {
    slug: "m8-tipps-lesen",
    skill: "reading",
    title: { de: "Tipps von Mia", en: "Tips from Mia" },
    instructions: en("Read Mia's message to Ben. Are the sentences true (richtig) or false (falsch)?"),
    stimulus: {
      textKind: "message",
      text: de(
        "Lieber Ben,\ndu bist krank? Das tut mir leid! Hier sind meine Tipps:\nTrink viel Tee und Wasser. Bleib im Bett und schlaf viel. Du darfst jetzt nicht joggen – auch nicht ein bisschen!\nHast du Fieber? Dann ruf bitte die Praxis an. Die Sprechstunde ist von 8 bis 12 Uhr.\nMorgen hole ich für dich Obst und Tee im Supermarkt.\nGute Besserung!\nMia",
      ),
    },
    items: [
      tf("q1", "Mia ist krank.", false),
      tf("q2", "Ben soll viel trinken.", true),
      tf("q3", "Ben darf ein bisschen joggen.", false),
      tf("q4", "Die Sprechstunde ist am Nachmittag.", false),
      tf("q5", "Mia holt morgen Obst und Tee für Ben.", true),
    ],
    refs: [KAP8, GOETHE_LESEN],
  },
  {
    slug: "m8-anrufbeantworter-hoeren",
    skill: "listening",
    title: { de: "Nachrichten auf der Mailbox", en: "Listening: phone messages" },
    instructions: en("Listen to the phone messages. You can play each one twice. Choose the right answer."),
    itemAudioMaxPlays: 2,
    items: [
      mcq("q1", en("When can Ms Kowalski come?"), [opt("a", "am Dienstag um 11 Uhr"), opt("b", "am Mittwoch um 11 Uhr"), opt("c", "am Mittwoch um 10 Uhr")], "b", {
        audio: {
          text: "Guten Tag, Frau Kowalski, hier ist die Praxis Dr. Berger. Ihr Termin am Dienstag geht leider nicht. Können Sie am Mittwoch um elf Uhr kommen? Bitte rufen Sie uns an. Danke und auf Wiederhören!",
          voice: "female",
          rate: "normal",
        },
      }),
      mcq("q2", en("What should Sven do?"), [opt("a", "Paul besuchen"), opt("b", "den Trainer anrufen"), opt("c", "Tabletten holen")], "b", {
        audio: {
          text: "Hallo Sven, hier ist Paul. Ich bin krank, ich habe Fieber. Ich kann heute leider nicht Fußball spielen. Kannst du bitte Trainer Lutz anrufen? Danke!",
          voice: "male2",
          rate: "normal",
        },
      }),
      mcq("q3", en("What must Mr Demir bring?"), [opt("a", "das Rezept"), opt("b", "die Gesundheitskarte"), opt("c", "Geld")], "a", {
        audio: {
          text: "Guten Tag, Herr Demir, hier ist die Apotheke am Markt. Ihr Medikament ist jetzt da. Sie können es heute bis achtzehn Uhr dreißig abholen. Bitte bringen Sie das Rezept mit.",
          voice: "female2",
          rate: "normal",
        },
      }),
      mcq("q4", en("When is the practice open tomorrow?"), [opt("a", "nur am Nachmittag"), opt("b", "den ganzen Tag"), opt("c", "nur am Vormittag")], "c", {
        audio: {
          text: "Guten Tag, Frau Aydin, hier ist Lara Stein von der Praxis Dr. Berger. Die Sprechstunde ist morgen nur von acht bis zwölf Uhr. Am Nachmittag ist die Praxis geschlossen.",
          voice: "female",
          rate: "normal",
        },
      }),
      mcq("q5", en("Why is Tim calling?"), [opt("a", "Er ist krank."), opt("b", "Er möchte für Oma einkaufen."), opt("c", "Er hat einen Termin.")], "b", {
        audio: {
          text: "Hallo Oma, hier ist Tim. Wie geht es dir? Mama sagt, du bist krank. Soll ich morgen für dich einkaufen? Ruf mich bitte an. Gute Besserung!",
          voice: "male",
          rate: "normal",
        },
      }),
    ],
    refs: [KAP8, GOETHE_HOEREN],
  },
];

// --- Lesson 5: Modultest -----------------------------------------------------------------

const L5 = [
  {
    slug: "m8-test-hoeren",
    skill: "listening",
    title: { de: "Test: Hören", en: "Test: listening" },
    instructions: en("Listen to the phone messages. You can play each one twice. Choose the right answer."),
    itemAudioMaxPlays: 2,
    passThreshold: 0.7,
    items: [
      mcq("q1", en("When is the free appointment?"), [opt("a", "am Freitag um 14 Uhr"), opt("b", "am Donnerstag um 14 Uhr"), opt("c", "am Freitag um 10 Uhr")], "a", {
        audio: {
          text: "Guten Tag, Frau Lorenz, hier ist die Praxis Dr. Seidel. Sie möchten einen Termin. Am Freitag um vierzehn Uhr ist noch ein Termin frei. Bitte rufen Sie bis Donnerstag an.",
          voice: "female",
          rate: "normal",
        },
      }),
      mcq("q2", en("What is wrong with Jonas?"), [opt("a", "Er hat Fieber."), opt("b", "Er hat Kopfschmerzen."), opt("c", "Er hat Bauchschmerzen.")], "b", {
        audio: {
          text: "Hallo Nina, hier ist Jonas. Mir geht es heute nicht gut, ich habe Kopfschmerzen. Wir können heute Abend leider nicht zusammen kochen. Tschüs!",
          voice: "male",
          rate: "normal",
        },
      }),
      mcq("q3", en("What is ready for Mr Brandl?"), [opt("a", "ein Rezept"), opt("b", "Tabletten"), opt("c", "eine Salbe")], "c", {
        audio: {
          text: "Guten Tag, Herr Brandl, hier ist die Apotheke am Bahnhof. Ihre Salbe ist jetzt da. Sie können sie morgen abholen.",
          voice: "female2",
          rate: "normal",
        },
      }),
      mcq("q4", en("What must Mr Okafor bring tomorrow?"), [opt("a", "seine Gesundheitskarte"), opt("b", "sein Rezept"), opt("c", "seine Medikamente")], "a", {
        audio: {
          text: "Hallo, hier ist die Praxis Dr. Seidel. Herr Okafor, bitte bringen Sie morgen Ihre Gesundheitskarte mit. Die Karte fehlt noch. Vielen Dank!",
          voice: "female",
          rate: "normal",
        },
      }),
      mcq("q5", en("What does the doctor say about Emil?"), [opt("a", "Er darf morgen Sport machen."), opt("b", "Er soll zu Hause bleiben."), opt("c", "Er muss Tabletten holen.")], "b", {
        audio: {
          text: "Hallo Mama, hier ist Lisa. Emil hat Fieber. Der Arzt sagt, er soll drei Tage zu Hause bleiben. Kannst du morgen kommen?",
          voice: "female2",
          rate: "normal",
        },
      }),
    ],
    refs: [KAP8, GOETHE_HOEREN],
  },
  {
    slug: "m8-test-lesen",
    skill: "reading",
    title: { de: "Test: Lesen", en: "Test: reading" },
    instructions: en("Read the sign at the door of a practice. Are the sentences true (richtig) or false (falsch)?"),
    passThreshold: 0.7,
    stimulus: {
      textKind: "sign",
      text: de(
        "Praxis Dr. Anna Fuchs\n\nSprechstunde:\nMontag, Dienstag, Donnerstag: 8–12 Uhr und 15–18 Uhr\nMittwoch und Freitag: 8–12 Uhr\n\nFür einen Termin rufen Sie bitte an: 0621 44 87 30\nBitte bringen Sie Ihre Gesundheitskarte mit.\nIm Wartezimmer bitte nicht telefonieren.",
      ),
    },
    items: [
      tf("q1", "Am Mittwochnachmittag ist keine Sprechstunde.", true),
      tf("q2", "Am Freitag ist die Sprechstunde bis 18 Uhr.", false),
      tf("q3", "Die Patienten sollen die Gesundheitskarte mitbringen.", true),
      tf("q4", "Die Patienten dürfen im Wartezimmer telefonieren.", false),
      tf("q5", "Am Dienstag beginnt die Sprechstunde um 8 Uhr.", true),
    ],
    refs: [KAP8, GOETHE_LESEN],
  },
  {
    slug: "m8-test-formular",
    skill: "writing",
    title: { de: "Test: Anmeldung in der Praxis", en: "Test: the reception form" },
    instructions: en("You work at the reception of a practice. Read what the patient says and fill in the form for her."),
    passThreshold: 0.7,
    stimulus: {
      textKind: "form",
      text: de(
        "„Guten Tag! Mein Name ist Olga Petrenko. Ich wohne in Mannheim. Meine Handynummer ist 0172 58 14 63. Mir geht es heute nicht gut: Ich habe Husten und Halsschmerzen, aber kein Fieber.“",
      ),
    },
    items: [
      typed("q1", ["Olga"], { label: "Vorname" }),
      typed("q2", ["Petrenko"], { label: "Familienname" }),
      typed("q3", ["0172 58 14 63"], { label: "Telefon", ignoreSpaces: true, inputMode: "numeric" }),
      typed(
        "q4",
        [
          "Husten und Halsschmerzen",
          "Halsschmerzen und Husten",
          "Husten, Halsschmerzen",
          "Halsschmerzen, Husten",
          "Husten + Halsschmerzen",
          "Halsschmerzen + Husten",
          "Husten und Halsschmerzen, kein Fieber",
          "Halsschmerzen und Husten, kein Fieber",
          "Husten, Halsschmerzen, kein Fieber",
          "Halsschmerzen, Husten, kein Fieber",
          "Husten und Halsschmerzen, aber kein Fieber",
          "Husten, Halsschmerzen, aber kein Fieber",
          "Sie hat Husten und Halsschmerzen",
          "Sie hat Halsschmerzen und Husten",
          "Husten und Halsweh",
          "Halsweh und Husten",
        ],
        { label: "Beschwerden", explanation: en("She has a cough (Husten) and a sore throat (Halsschmerzen).") },
      ),
      typed("q5", ["nein", "kein Fieber", "nein, kein Fieber", "nein, sie hat kein Fieber", "sie hat kein Fieber"], { label: "Fieber? (ja / nein)" }),
    ],
    refs: [KAP8, GOETHE_SCHREIBEN],
  },
  {
    slug: "m8-test-grammatik",
    skill: "grammar",
    title: { de: "Test: Grammatik", en: "Test: grammar" },
    instructions: en("Answer all questions."),
    passThreshold: 0.7,
    items: [
      gap("q1", "", "viel Tee! (trinken – du)", ["Trink", "Trinke"]),
      gap("q2", "", "Sie bitte hier Platz! (nehmen – Sie)", ["Nehmen"]),
      gap("q3", "Kinder,", "bitte pünktlich! (sein – ihr)", ["seid"]),
      gap("q4", "Sie", "hier nicht rauchen. (dürfen)", ["dürfen"]),
      gap("q5", "Du", "im Bett bleiben, sagt der Arzt. (sollen)", ["sollst"]),
      gap("q6", "Meine Füße", "weh. (wehtun)", ["tun"]),
      mcq("q7", en("Ask a friend what the matter is."), [opt("a", "Was fehlt Ihnen?"), opt("b", "Was fehlt dir?"), opt("c", "Was fehlst du?")], "b"),
      order("q8", ["Ruf", "bitte", "die", "Praxis", "an", "!"], { alternatives: ["Bitte ruf die Praxis an!", "Ruf die Praxis bitte an!"] }),
      order("q9", ["Wir", "müssen", "das", "Rezept", "mitbringen", "."], { alternatives: ["Das Rezept müssen wir mitbringen."] }),
    ],
    refs: [KAP8, GA9, GA7],
  },
  {
    slug: "m8-test-wortschatz",
    skill: "vocabulary",
    title: { de: "Test: Wortschatz", en: "Test: vocabulary" },
    instructions: en("Answer all questions."),
    passThreshold: 0.7,
    items: [
      mcq("q1", en("Which one is NOT a part of the body?"), [opt("a", "der Rücken"), opt("b", "das Rezept"), opt("c", "der Hals")], "b"),
      mcq("q2", en("Where do you get medicine with a prescription?"), [opt("a", "im Wartezimmer"), opt("b", "in der Sprechstunde"), opt("c", "in der Apotheke")], "c"),
      typed("q3", ["der Fuß"], { prompt: en("Write the German word with its article: foot") }),
      mcq("q4", en("Your friend is ill. What do you say?"), [opt("a", "Gute Besserung!"), opt("b", "Guten Appetit!"), opt("c", "Gute Nacht!")], "a"),
      mcq("q5", en("At the doctor's: “Please take a seat!”"), [opt("a", "Bleiben Sie bitte im Bett!"), opt("b", "Nehmen Sie bitte Platz!"), opt("c", "Rufen Sie bitte an!")], "b"),
      pairs("q6", [
        [de("das Fieber"), en("fever")],
        [de("der Husten"), en("cough")],
        [de("die Tablette"), en("tablet")],
        [de("das Wartezimmer"), en("waiting room")],
        [de("die Nase"), en("nose")],
      ]),
    ],
    refs: [KAP8],
  },
  {
    slug: "m8-test-sprechen",
    skill: "speaking",
    title: { de: "Test: Sprechen – Bitten", en: "Test: speaking – requests" },
    instructions: en(
      "Practise the third part of the A1 speaking exam: make a request from a card. Speak for yourself; the model answer is only an example. This practice is not scored.",
    ),
    items: [
      speak("q1", "Phone the practice and ask for an appointment tomorrow.", "Guten Tag, hier ist Lena Brandt. Haben Sie morgen einen Termin frei?", {
        cue: de("Termin? – morgen"),
      }),
      speak("q2", "Ask at the pharmacy for an ointment for your back.", "Guten Tag! Haben Sie bitte eine Salbe für den Rücken?", {
        cue: de("Apotheke – Salbe"),
        modelAudio: { text: "Guten Tag! Haben Sie bitte eine Salbe für den Rücken?", voice: "male", rate: "slow" },
      }),
      speak("q3", "Ask your partner (du) to call the practice for you.", "Kannst du bitte für mich die Praxis anrufen?", { cue: de("Praxis – anrufen") }),
      speak("q4", "Your partner is ill. Give two tips (du): sleep a lot and drink tea.", "Schlaf viel und trink viel Tee!", {
        cue: de("Tipps: schlafen – Tee"),
        modelAudio: { text: "Schlaf viel und trink viel Tee!", voice: "male", rate: "slow" },
      }),
    ],
    refs: [KAP8, GOETHE_SPRECHEN],
  },
];

export const EXERCISES_BY_LESSON = { L1, L2, L3, L4, L5 };
export const EXERCISES = [...L1, ...L2, ...L3, ...L4, ...L5];
