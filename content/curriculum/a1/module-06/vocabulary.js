// Module 6 vocabulary. Original entries (lemma, gender, plural, English meaning, our own
// example sentences). Topic scope follows the Module 6 mapping in docs/REFERENCE-ANALYSIS.md
// (Netzwerk neu A1 Kap. 6: dates, birthdays, invitations, ordering and paying, events);
// no word lists, translations or examples were copied from the reference books.
// Example sentences write dates as words so the audio reads them correctly.
// Bangla meanings are intentionally absent until a reviewer adds them.
// Pure data: no imports, so tests and tooling can load it directly.

const n = (slug, article, lemma, plural, en, example, extra = {}) => ({
  slug,
  lemma,
  article,
  plural,
  pos: "noun",
  meanings: { en },
  ...(example ? { example } : {}),
  topics: extra.topics ?? [],
  ...(extra.notes ? { notes: extra.notes } : {}),
});

const w = (slug, lemma, pos, en, example, extra = {}) => ({
  slug,
  lemma,
  article: extra.article ?? null,
  plural: null,
  pos,
  meanings: { en },
  ...(example ? { example } : {}),
  topics: extra.topics ?? [],
  ...(extra.notes ? { notes: extra.notes } : {}),
});

const ord = (value, lemma, en, example, notes) =>
  w(`ordinal-${value}`, lemma, "numeral", en, example, { topics: ["datum"], ...(notes ? { notes: { en: notes } } : {}) });

// --- Lesson 1: dates and ordinal numbers --------------------------------------------
export const DATES = [
  n("datum", "das", "Datum", "die Daten", "date (in the calendar)", { de: "Schreiben Sie bitte das Datum.", en: "Please write the date." }, {
    topics: ["datum"],
  }),
  w("der-wievielte", "Der Wievielte ist heute?", "phrase", "What's the date today?", {
    de: "Der Wievielte ist heute? – Heute ist der erste Juni.",
    en: "What's the date today? – Today is the first of June.",
  }, { topics: ["datum"] }),
  ord(1, "erste", "first (1st)", { de: "Heute ist der erste Mai.", en: "Today is the first of May." }, "Irregular: eins → erste. am ersten Mai"),
  ord(2, "zweite", "second (2nd)", { de: "Ich habe am zweiten Juni Geburtstag.", en: "My birthday is on the second of June." }),
  ord(3, "dritte", "third (3rd)", { de: "Heute ist der dritte Oktober.", en: "Today is the third of October." }, "Irregular: drei → dritte."),
  ord(7, "siebte", "seventh (7th)", { de: "Die Party ist am siebten Juli.", en: "The party is on the seventh of July." }, "siebte, not “siebente” (that form exists but is rare)."),
  ord(20, "zwanzigste", "twentieth (20th)", { de: "Heute ist der zwanzigste April.", en: "Today is the twentieth of April." }, "From 20 on, add -ste: einundzwanzigste, dreißigste."),
  w("geboren", "geboren", "adjective", "born", { de: "Ich bin am fünften März geboren.", en: "I was born on the fifth of March." }, {
    topics: ["datum"],
    notes: { en: "Fixed phrase: Ich bin am … geboren." },
  }),
];

// --- Lesson 1: birthdays and parties ----------------------------------------------
export const BIRTHDAYS = [
  n("geburtstag", "der", "Geburtstag", "die Geburtstage", "birthday", { de: "Wann hast du Geburtstag?", en: "When is your birthday?" }, {
    topics: ["feste"],
    notes: { en: "Ich habe am … Geburtstag. = My birthday is on …" },
  }),
  w("herzlichen-glueckwunsch", "Herzlichen Glückwunsch!", "phrase", "Congratulations! Happy birthday!", {
    de: "Herzlichen Glückwunsch, Lena!",
    en: "Happy birthday, Lena!",
  }, { topics: ["feste"] }),
  w("alles-gute", "Alles Gute zum Geburtstag!", "phrase", "Happy birthday! (All the best on your birthday!)", {
    de: "Alles Gute zum Geburtstag, Tim!",
    en: "Happy birthday, Tim!",
  }, { topics: ["feste"], notes: { en: "In Germany, people don't say it before the birthday – it brings bad luck." } }),
  w("feiern", "feiern", "verb", "to celebrate, to party", { de: "Wir feiern am Samstag.", en: "We're celebrating on Saturday." }, { topics: ["feste"] }),
  n("party", "die", "Party", "die Partys", "party", { de: "Die Party ist am Freitag.", en: "The party is on Friday." }, { topics: ["feste"] }),
  n("geschenk", "das", "Geschenk", "die Geschenke", "present, gift", { de: "Das Geschenk ist sehr schön.", en: "The present is very nice." }, {
    topics: ["feste"],
  }),
  w("schenken", "schenken", "verb", "to give (as a present)", { de: "Ich schenke Lara ein Buch.", en: "I'm giving Lara a book." }, {
    topics: ["feste"],
  }),
  n("gast", "der", "Gast", "die Gäste", "guest", { de: "Wir haben zehn Gäste.", en: "We have ten guests." }, { topics: ["feste"] }),
];

// --- Lesson 2: invitations -----------------------------------------------------------
export const INVITATIONS = [
  w("einladen", "einladen", "verb", "to invite", { de: "Ich lade dich ein.", en: "I'm inviting you." }, {
    topics: ["einladung"],
    notes: { en: "Separable: ich lade … ein. Vowel change: du lädst … ein, er/sie lädt … ein." },
  }),
  n("einladung", "die", "Einladung", "die Einladungen", "invitation", { de: "Danke für die Einladung!", en: "Thanks for the invitation!" }, {
    topics: ["einladung"],
  }),
  w("mitkommen", "mitkommen", "verb", "to come along", { de: "Kommst du mit?", en: "Are you coming along?" }, {
    topics: ["einladung"],
    notes: { en: "Separable: ich komme mit." },
  }),
  w("mitbringen", "mitbringen", "verb", "to bring (along)", { de: "Ich bringe einen Kuchen mit.", en: "I'll bring a cake." }, {
    topics: ["einladung"],
    notes: { en: "Separable: ich bringe … mit." },
  }),
  w("abholen", "abholen", "verb", "to pick up, to collect", { de: "Ich hole dich um acht Uhr ab.", en: "I'll pick you up at eight o'clock." }, {
    topics: ["einladung"],
    notes: { en: "Separable: ich hole … ab." },
  }),
  w("zusagen", "zusagen", "verb", "to accept (an invitation)", { de: "Lisa sagt zu. Sie kommt.", en: "Lisa accepts. She's coming." }, {
    topics: ["einladung"],
    notes: { en: "Separable: ich sage zu." },
  }),
  w("absagen", "absagen", "verb", "to decline, to cancel", { de: "Tom sagt ab. Er hat keine Zeit.", en: "Tom declines. He has no time." }, {
    topics: ["einladung"],
    notes: { en: "Separable: ich sage ab." },
  }),
  w("lust-haben", "Lust haben", "phrase", "to feel like (doing something)", { de: "Hast du Lust? – Ja, gern!", en: "Do you feel like it? – Yes, I'd love to!" }, {
    topics: ["einladung"],
  }),
  w("leider", "leider", "adverb", "unfortunately", { de: "Ich kann leider nicht kommen.", en: "Unfortunately I can't come." }, {
    topics: ["einladung"],
  }),
  w("schade", "schade", "adjective", "a pity, too bad", { de: "Du kannst nicht kommen? Das ist schade!", en: "You can't come? That's a pity!" }, {
    topics: ["einladung"],
    notes: { en: "Used with sein: Das ist schade! / Schade!" },
  }),
  n("feier", "die", "Feier", "die Feiern", "celebration, party", { de: "Die Feier ist am Sonntag.", en: "The celebration is on Sunday." }, {
    topics: ["feste"],
  }),
  n("fest", "das", "Fest", "die Feste", "festival, celebration", { de: "Das Fest ist im Juli.", en: "The festival is in July." }, {
    topics: ["feste"],
  }),
];

// --- Lesson 3: in the café: ordering ----------------------------------------------
export const ORDERING = [
  n("speisekarte", "die", "Speisekarte", "die Speisekarten", "menu", { de: "Die Speisekarte, bitte!", en: "The menu, please!" }, {
    topics: ["cafe"],
  }),
  w("bestellen", "bestellen", "verb", "to order", { de: "Wir möchten bestellen, bitte.", en: "We'd like to order, please." }, {
    topics: ["cafe"],
  }),
  n("kellner", "der", "Kellner", "die Kellner", "waiter", { de: "Der Kellner bringt die Speisekarte.", en: "The waiter brings the menu." }, {
    topics: ["cafe"],
  }),
  n("kellnerin", "die", "Kellnerin", "die Kellnerinnen", "waitress", { de: "Die Kellnerin ist sehr nett.", en: "The waitress is very nice." }, {
    topics: ["cafe"],
  }),
  w("reservieren", "reservieren", "verb", "to reserve, to book", {
    de: "Ich möchte einen Tisch für vier Personen reservieren.",
    en: "I'd like to book a table for four people.",
  }, { topics: ["cafe"] }),
  w("ist-hier-noch-frei", "Ist hier noch frei?", "phrase", "Is this seat free?", {
    de: "Entschuldigung, ist hier noch frei? – Ja, bitte.",
    en: "Excuse me, is this seat free? – Yes, please sit down.",
  }, { topics: ["cafe"] }),
];

// --- Lesson 3: in the café: paying -------------------------------------------------
export const PAYING = [
  n("rechnung", "die", "Rechnung", "die Rechnungen", "bill, check", { de: "Die Rechnung, bitte!", en: "The bill, please!" }, { topics: ["cafe"] }),
  w("bezahlen", "bezahlen", "verb", "to pay", { de: "Ich bezahle den Kaffee.", en: "I'll pay for the coffee." }, { topics: ["cafe"] }),
  w("zahlen-bitte", "Zahlen, bitte!", "phrase", "The bill, please! (I'd like to pay.)", { de: "Entschuldigung! Zahlen, bitte!", en: "Excuse me! The bill, please!" }, {
    topics: ["cafe"],
  }),
  w("zusammen-oder-getrennt", "Zusammen oder getrennt?", "phrase", "Together or separately? (paying)", {
    de: "Zusammen oder getrennt? – Getrennt, bitte.",
    en: "Together or separately? – Separately, please.",
  }, { topics: ["cafe"] }),
  w("stimmt-so", "Stimmt so!", "phrase", "Keep the change!", {
    de: "Das macht neun Euro fünfzig. – Zehn Euro. Stimmt so!",
    en: "That's nine euros fifty. – Ten euros. Keep the change!",
  }, { topics: ["cafe"], notes: { en: "In Germany a tip of about 5–10% is usual in cafés and restaurants." } }),
  n("trinkgeld", "das", "Trinkgeld", null, "tip (money)", { de: "Das Trinkgeld ist für die Kellnerin.", en: "The tip is for the waitress." }, {
    topics: ["cafe"],
  }),
];

// --- Lesson 4: events ------------------------------------------------------------------
export const EVENTS = [
  n("veranstaltung", "die", "Veranstaltung", "die Veranstaltungen", "event", {
    de: "Am Wochenende gibt es viele Veranstaltungen.",
    en: "There are lots of events at the weekend.",
  }, { topics: ["veranstaltungen"] }),
  n("konzert", "das", "Konzert", "die Konzerte", "concert", { de: "Das Konzert ist am Samstag.", en: "The concert is on Saturday." }, {
    topics: ["veranstaltungen"],
  }),
  n("ausstellung", "die", "Ausstellung", "die Ausstellungen", "exhibition", { de: "Die Ausstellung ist sehr interessant.", en: "The exhibition is very interesting." }, {
    topics: ["veranstaltungen"],
  }),
  n("stadtfest", "das", "Stadtfest", "die Stadtfeste", "town festival, street festival", { de: "Das Stadtfest ist im August.", en: "The town festival is in August." }, {
    topics: ["veranstaltungen"],
    notes: { en: "die Stadt + das Fest = das Stadtfest. A compound noun takes the article of its last part." },
  }),
  n("eintrittskarte", "die", "Eintrittskarte", "die Eintrittskarten", "(admission) ticket", {
    de: "Ich habe zwei Eintrittskarten für das Konzert.",
    en: "I have two tickets for the concert.",
  }, { topics: ["veranstaltungen"], notes: { en: "Also: die Karte, das Ticket." } }),
  n("eintritt", "der", "Eintritt", null, "admission, entrance fee", { de: "Der Eintritt ist frei.", en: "Admission is free." }, {
    topics: ["veranstaltungen"],
  }),
  w("stattfinden", "stattfinden", "verb", "to take place", { de: "Das Konzert findet am Freitag statt.", en: "The concert takes place on Friday." }, {
    topics: ["veranstaltungen"],
    notes: { en: "Separable: es findet … statt." },
  }),
  w("lustig", "lustig", "adjective", "funny, fun", { de: "Die Party war sehr lustig.", en: "The party was great fun." }, {
    topics: ["veranstaltungen"],
  }),
  w("langweilig", "langweilig", "adjective", "boring", { de: "Das Konzert war langweilig.", en: "The concert was boring." }, {
    topics: ["veranstaltungen"],
  }),
];

export const VOCABULARY = [...DATES, ...BIRTHDAYS, ...INVITATIONS, ...ORDERING, ...PAYING, ...EVENTS];

export const slugs = (list) => list.map((v) => v.slug);
