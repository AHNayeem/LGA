// Module 3 vocabulary. Original entries (lemma, gender, plural, English meaning, our own
// example sentences). Topic scope follows the Module 3 mapping in docs/REFERENCE-ANALYSIS.md
// (places in a city, transport, directions, months and seasons, public signs); no word
// lists, translations or examples were copied from the reference books.
// Words already defined in other modules (e.g. Stadt, fahren, gern, haben) are not repeated.
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

const month = (slug, lemma, en, example, notes) =>
  n(slug, "der", lemma, null, en, example, { topics: ["monate"], ...(notes ? { notes: { en: notes } } : {}) });

// --- Lesson 1: places in the city ----------------------------------------------------
export const PLACES = [
  n("bahnhof", "der", "Bahnhof", "die Bahnhöfe", "(railway) station", { de: "Wo ist der Bahnhof?", en: "Where is the station?" }, {
    topics: ["stadt"],
  }),
  n("hotel", "das", "Hotel", "die Hotels", "hotel", { de: "Das Hotel heißt „Seeblick“.", en: "The hotel is called “Seeblick”." }, {
    topics: ["stadt"],
  }),
  n("museum", "das", "Museum", "die Museen", "museum", { de: "In Kiel gibt es ein Museum.", en: "There is a museum in Kiel." }, {
    topics: ["stadt"],
    notes: { en: "Irregular plural: die Museen." },
  }),
  n("kirche", "die", "Kirche", "die Kirchen", "church", { de: "Das ist eine Kirche.", en: "That is a church." }, { topics: ["stadt"] }),
  n("park", "der", "Park", "die Parks", "park", { de: "Der Park heißt Stadtpark.", en: "The park is called Stadtpark." }, { topics: ["stadt"] }),
  n("kino", "das", "Kino", "die Kinos", "cinema", { de: "Gibt es hier ein Kino?", en: "Is there a cinema here?" }, { topics: ["stadt"] }),
  n("platz", "der", "Platz", "die Plätze", "square (in a town)", { de: "Der Platz heißt Marktplatz.", en: "The square is called Marktplatz." }, {
    topics: ["stadt"],
    notes: { en: "Also: place, seat, space." },
  }),
  w("es-gibt", "es gibt", "phrase", "there is, there are", { de: "Hier gibt es ein Kino und eine Kirche.", en: "There is a cinema and a church here." }, {
    topics: ["stadt"],
    notes: { en: "With der-words, ein becomes einen after es gibt: Es gibt einen Park. You learn why in Module 4 (accusative)." },
  }),
];

// --- Lesson 2: transport ---------------------------------------------------------------
export const TRANSPORT = [
  n("bus", "der", "Bus", "die Busse", "bus", { de: "Der Bus kommt.", en: "The bus is coming." }, { topics: ["verkehr"] }),
  n("u-bahn", "die", "U-Bahn", "die U-Bahnen", "underground, subway, metro", { de: "Gibt es hier eine U-Bahn?", en: "Is there an underground here?" }, {
    topics: ["verkehr"],
  }),
  n("zug", "der", "Zug", "die Züge", "train", { de: "Der Zug fährt nach Hamburg.", en: "The train goes to Hamburg." }, {
    topics: ["verkehr"],
    notes: { en: "To a city: nach Hamburg, nach Berlin." },
  }),
  n("auto", "das", "Auto", "die Autos", "car", { de: "Ich habe kein Auto.", en: "I don't have a car." }, { topics: ["verkehr"] }),
  n("flughafen", "der", "Flughafen", "die Flughäfen", "airport", { de: "Der Bus fährt zum Flughafen.", en: "The bus goes to the airport." }, {
    topics: ["verkehr"],
  }),
  n("haltestelle", "die", "Haltestelle", "die Haltestellen", "(bus or tram) stop", { de: "Wo ist die Haltestelle?", en: "Where is the stop?" }, {
    topics: ["verkehr"],
  }),
  n("gleis", "das", "Gleis", "die Gleise", "platform, track (at a station)", { de: "Der Zug fährt von Gleis 4.", en: "The train leaves from platform 4." }, {
    topics: ["verkehr"],
  }),
  w("zu-fuss", "zu Fuß", "phrase", "on foot", { de: "Ich gehe zu Fuß.", en: "I walk. / I go on foot." }, { topics: ["verkehr"] }),
  w("weit", "weit", "adjective", "far", { de: "Ist der Bahnhof weit?", en: "Is the station far?" }, { topics: ["wege"] }),
  w("kein", "kein, keine", "other", "no, not a (negative article)", { de: "Das ist kein Hotel.", en: "That is not a hotel." }, {
    topics: ["negation"],
    notes: { en: "kein for der- and das-words, keine for die-words and plurals." },
  }),
  w("nicht", "nicht", "adverb", "not", { de: "Ich wohne nicht in Berlin.", en: "I don't live in Berlin." }, { topics: ["negation"] }),
];

// --- Lesson 3: directions ----------------------------------------------------------------
export const DIRECTIONS = [
  w("geradeaus", "geradeaus", "adverb", "straight on, straight ahead", { de: "Gehen Sie geradeaus!", en: "Go straight on!" }, { topics: ["wege"] }),
  w("links", "links", "adverb", "(on the) left", { de: "Die Kirche ist links.", en: "The church is on the left." }, { topics: ["wege"] }),
  w("rechts", "rechts", "adverb", "(on the) right", { de: "Das Hotel ist rechts.", en: "The hotel is on the right." }, { topics: ["wege"] }),
  n("strasse", "die", "Straße", "die Straßen", "street, road", { de: "Die Straße heißt Hafenstraße.", en: "The street is called Hafenstraße." }, {
    topics: ["wege"],
  }),
  w("wie-komme-ich", "Wie komme ich zum … / zur …?", "phrase", "How do I get to …?", { de: "Wie komme ich zum Bahnhof?", en: "How do I get to the station?" }, {
    topics: ["wege"],
    notes: { en: "zum for der- and das-words (zum Bahnhof, zum Museum), zur for die-words (zur Kirche). Learn them as fixed phrases for now." },
  }),
  w("ich-bin-nicht-von-hier", "Ich bin nicht von hier.", "phrase", "I'm not from here.", {
    de: "Entschuldigung, ich bin nicht von hier.",
    en: "Sorry, I'm not from here.",
  }, { topics: ["wege"] }),
];

// --- Lesson 4: months and seasons -------------------------------------------------------
export const MONTHS_SEASONS = [
  month("januar", "Januar", "January", null, "In Austria people also say Jänner."),
  month("februar", "Februar", "February"),
  month("maerz", "März", "March"),
  month("april", "April", "April"),
  month("mai", "Mai", "May", { de: "Im Mai ist der Park schön.", en: "In May the park is beautiful." }),
  month("juni", "Juni", "June"),
  month("juli", "Juli", "July", null, "On the phone people often say “Julei” so it isn't confused with Juni."),
  month("august", "August", "August"),
  month("september", "September", "September"),
  month("oktober", "Oktober", "October"),
  month("november", "November", "November"),
  month("dezember", "Dezember", "December"),
  n("jahreszeit", "die", "Jahreszeit", "die Jahreszeiten", "season", { de: "Das Jahr hat vier Jahreszeiten.", en: "The year has four seasons." }, {
    topics: ["jahreszeiten"],
  }),
  n("fruehling", "der", "Frühling", null, "spring", { de: "Im Frühling ist die Stadt schön.", en: "In spring the city is beautiful." }, {
    topics: ["jahreszeiten"],
  }),
  n("sommer", "der", "Sommer", null, "summer", { de: "Im Sommer ist das Museum geöffnet.", en: "In summer the museum is open." }, {
    topics: ["jahreszeiten"],
  }),
  n("herbst", "der", "Herbst", null, "autumn, fall", null, { topics: ["jahreszeiten"] }),
  n("winter", "der", "Winter", null, "winter", { de: "Im Winter ist das Kino geöffnet.", en: "In winter the cinema is open." }, {
    topics: ["jahreszeiten"],
  }),
];

// --- Lesson 4: describing places, public signs ---------------------------------------------
export const ADJECTIVES_SIGNS = [
  w("schoen", "schön", "adjective", "beautiful, nice", { de: "Die Stadt ist schön.", en: "The city is beautiful." }, { topics: ["stadt"] }),
  w("gross", "groß", "adjective", "big, large", { de: "Der Bahnhof ist groß.", en: "The station is big." }, { topics: ["stadt"] }),
  w("klein", "klein", "adjective", "small, little", { de: "Das Kino ist klein.", en: "The cinema is small." }, { topics: ["stadt"] }),
  w("neu", "neu", "adjective", "new", { de: "Das Hotel ist neu.", en: "The hotel is new." }, { topics: ["stadt"] }),
  // der Eingang (entrance) is defined in Module 7; it appears on signs here and is glossed in the Ausgang note.
  n("ausgang", "der", "Ausgang", "die Ausgänge", "exit", { de: "Wo ist der Ausgang?", en: "Where is the exit?" }, {
    topics: ["schilder"],
    notes: { en: "The opposite is der Eingang (entrance)." },
  }),
  w("geoeffnet", "geöffnet", "adjective", "open", { de: "Das Museum ist heute geöffnet.", en: "The museum is open today." }, {
    topics: ["schilder"],
    notes: { en: "In spoken German also: offen, auf." },
  }),
  w("geschlossen", "geschlossen", "adjective", "closed", { de: "Das Kino ist im August geschlossen.", en: "The cinema is closed in August." }, {
    topics: ["schilder"],
    notes: { en: "In spoken German also: zu." },
  }),
];

export const VOCABULARY = [...PLACES, ...TRANSPORT, ...DIRECTIONS, ...MONTHS_SEASONS, ...ADJECTIVES_SIGNS];

export const slugs = (list) => list.map((v) => v.slug);
