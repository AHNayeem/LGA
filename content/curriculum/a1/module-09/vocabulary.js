// Module 9 vocabulary ("Wohnen"). Original entries (lemma, gender, plural, English meaning,
// our own example sentences). Topic scope follows the Module 9 mapping in
// docs/CURRICULUM-A1.md (flat ads, rooms, furniture, colours, describing a home);
// no word lists, translations or examples were copied from the reference books.
// Words that earlier modules already define (groß, klein, schön, neu, teuer, billig,
// der Flur, auf/an/neben, der Stock …) are used but not redefined here.
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

// --- Lesson 1: rooms ----------------------------------------------------------------
export const ROOMS = [
  n("wohnung", "die", "Wohnung", "die Wohnungen", "flat, apartment", { de: "Meine Wohnung ist klein, aber hell.", en: "My flat is small but bright." }, {
    topics: ["wohnen"],
  }),
  n("zimmer", "das", "Zimmer", "die Zimmer", "room", { de: "Die Wohnung hat drei Zimmer.", en: "The flat has three rooms." }, { topics: ["wohnen"] }),
  n("kueche", "die", "Küche", "die Küchen", "kitchen", { de: "Die Küche ist sehr klein.", en: "The kitchen is very small." }, { topics: ["wohnen"] }),
  n("bad", "das", "Bad", "die Bäder", "bathroom", { de: "Das Bad hat kein Fenster.", en: "The bathroom has no window." }, {
    topics: ["wohnen"],
    notes: { en: "Also: das Badezimmer." },
  }),
  n("wohnzimmer", "das", "Wohnzimmer", "die Wohnzimmer", "living room", { de: "Das Wohnzimmer ist groß und gemütlich.", en: "The living room is big and cosy." }, {
    topics: ["wohnen"],
  }),
  n("schlafzimmer", "das", "Schlafzimmer", "die Schlafzimmer", "bedroom", { de: "Das Schlafzimmer ist ein bisschen dunkel.", en: "The bedroom is a bit dark." }, {
    topics: ["wohnen"],
  }),
  n("kinderzimmer", "das", "Kinderzimmer", "die Kinderzimmer", "children's room", { de: "Das Kinderzimmer ist bunt.", en: "The children's room is colourful." }, {
    topics: ["wohnen"],
  }),
  n("balkon", "der", "Balkon", "die Balkone", "balcony", { de: "Die Wohnung hat einen Balkon.", en: "The flat has a balcony." }, {
    topics: ["wohnen"],
    notes: { en: "Plural also: die Balkons." },
  }),
];

// --- Lesson 1: describing and colours -----------------------------------------------
export const DESCRIBING = [
  w("hell", "hell", "adjective", "bright, light", { de: "Die Küche ist schön hell.", en: "The kitchen is nice and bright." }, { topics: ["wohnen"] }),
  w("dunkel", "dunkel", "adjective", "dark", { de: "Das Bad ist sehr dunkel.", en: "The bathroom is very dark." }, { topics: ["wohnen"] }),
  w("gemuetlich", "gemütlich", "adjective", "cosy, comfortable", { de: "Mein Zimmer ist klein, aber gemütlich.", en: "My room is small but cosy." }, {
    topics: ["wohnen"],
  }),
  w("modern", "modern", "adjective", "modern", { de: "Das Bad ist neu und modern.", en: "The bathroom is new and modern." }, { topics: ["wohnen"] }),
  n("farbe", "die", "Farbe", "die Farben", "colour", { de: "Welche Farbe hat die Küche? – Gelb.", en: "What colour is the kitchen? – Yellow." }, {
    topics: ["farben"],
  }),
  w("rot", "rot", "adjective", "red", { de: "Die Tür ist rot.", en: "The door is red." }, { topics: ["farben"] }),
  w("blau", "blau", "adjective", "blue", { de: "Das Bad ist blau und weiß.", en: "The bathroom is blue and white." }, { topics: ["farben"] }),
  w("gruen", "grün", "adjective", "green", { de: "Der Balkon ist ganz grün.", en: "The balcony is all green." }, { topics: ["farben"] }),
  w("gelb", "gelb", "adjective", "yellow", { de: "Meine Küche ist gelb.", en: "My kitchen is yellow." }, { topics: ["farben"] }),
  w("weiss", "weiß", "adjective", "white", { de: "Alle Zimmer sind weiß.", en: "All the rooms are white." }, { topics: ["farben"] }),
  w("schwarz", "schwarz", "adjective", "black", { de: "Der Tisch ist schwarz.", en: "The table is black." }, { topics: ["farben"] }),
];

// --- Lesson 2: the house --------------------------------------------------------------
export const HOUSE = [
  n("haus", "das", "Haus", "die Häuser", "house; building", { de: "Das Haus hat einen Garten.", en: "The house has a garden." }, {
    topics: ["wohnen"],
  }),
  n("garten", "der", "Garten", "die Gärten", "garden", { de: "Die Kinder gehen in den Garten.", en: "The children go into the garden." }, {
    topics: ["wohnen"],
  }),
  n("keller", "der", "Keller", "die Keller", "cellar, basement", { de: "Ich bringe das Fahrrad in den Keller.", en: "I'm taking the bike down to the cellar." }, {
    topics: ["wohnen"],
  }),
  n("treppe", "die", "Treppe", "die Treppen", "stairs, staircase", { de: "Die Treppe ist sehr alt.", en: "The staircase is very old." }, {
    topics: ["wohnen"],
  }),
  n("tuer", "die", "Tür", "die Türen", "door", { de: "Mach bitte die Tür zu!", en: "Please close the door!" }, { topics: ["wohnen"] }),
  n("fenster", "das", "Fenster", "die Fenster", "window", { de: "Das Zimmer hat zwei Fenster.", en: "The room has two windows." }, { topics: ["wohnen"] }),
];

// --- Lesson 3: furniture ----------------------------------------------------------------
export const FURNITURE = [
  n("moebel", "das", "Möbel", "die Möbel", "piece of furniture; (plural) furniture", { de: "Die Möbel sind neu.", en: "The furniture is new." }, {
    topics: ["moebel"],
    notes: { en: "Mostly used in the plural: die Möbel (= furniture)." },
  }),
  n("sofa", "das", "Sofa", "die Sofas", "sofa", { de: "Das Sofa ist grün.", en: "The sofa is green." }, { topics: ["moebel"] }),
  n("sessel", "der", "Sessel", "die Sessel", "armchair", { de: "Der Sessel ist alt, aber gemütlich.", en: "The armchair is old but comfortable." }, {
    topics: ["moebel"],
  }),
  n("tisch", "der", "Tisch", "die Tische", "table", { de: "Der Tisch ist in der Küche.", en: "The table is in the kitchen." }, { topics: ["moebel"] }),
  n("stuhl", "der", "Stuhl", "die Stühle", "chair", { de: "Wir haben vier Stühle.", en: "We have four chairs." }, { topics: ["moebel"] }),
  n("bett", "das", "Bett", "die Betten", "bed", { de: "Das Bett ist im Schlafzimmer.", en: "The bed is in the bedroom." }, { topics: ["moebel"] }),
  n("schrank", "der", "Schrank", "die Schränke", "cupboard, wardrobe", { de: "Der Schrank ist groß und weiß.", en: "The wardrobe is big and white." }, {
    topics: ["moebel"],
  }),
  n("regal", "das", "Regal", "die Regale", "shelf, bookcase", { de: "Das Regal ist neben dem Schrank.", en: "The shelf is next to the wardrobe." }, {
    topics: ["moebel"],
  }),
  n("lampe", "die", "Lampe", "die Lampen", "lamp", { de: "Die Lampe ist über dem Tisch.", en: "The lamp is above the table." }, { topics: ["moebel"] }),
  n("teppich", "der", "Teppich", "die Teppiche", "carpet, rug", { de: "Der Teppich ist unter dem Tisch.", en: "The rug is under the table." }, {
    topics: ["moebel"],
  }),
  n("bild", "das", "Bild", "die Bilder", "picture", { de: "Das Bild ist an der Wand.", en: "The picture is on the wall." }, { topics: ["moebel"] }),
  n("wand", "die", "Wand", "die Wände", "wall (of a room)", { de: "Die Wände sind weiß.", en: "The walls are white." }, { topics: ["wohnen"] }),
];

// --- Lesson 4: position verbs ------------------------------------------------------------
export const POSITION = [
  w("stehen", "stehen", "verb", "to stand; to be (upright)", { de: "Das Sofa steht im Wohnzimmer.", en: "The sofa is in the living room." }, {
    topics: ["moebel"],
    notes: { en: "For things that stand upright: tables, chairs, cupboards, sofas, bottles." },
  }),
  w("liegen", "liegen", "verb", "to lie; to be (lying flat)", { de: "Der Teppich liegt im Flur.", en: "The rug is in the hallway." }, {
    topics: ["moebel"],
    notes: { en: "For things that lie flat: a rug, a book on the table, a phone, a person in bed." },
  }),
  w("haengen", "hängen", "verb", "to hang", { de: "Das Bild hängt an der Wand.", en: "The picture is hanging on the wall." }, {
    topics: ["moebel"],
  }),
];

// --- Lesson 4: looking for a flat ---------------------------------------------------------
export const FLAT_SEARCH = [
  n("anzeige", "die", "Anzeige", "die Anzeigen", "advertisement, ad", { de: "Ich lese die Anzeigen im Internet.", en: "I'm reading the ads on the internet." }, {
    topics: ["wohnungssuche"],
  }),
  n("miete", "die", "Miete", "die Mieten", "rent", { de: "Die Miete ist 650 Euro im Monat.", en: "The rent is 650 euros a month." }, {
    topics: ["wohnungssuche"],
  }),
  n("nebenkosten", "die", "Nebenkosten", null, "additional costs (heating, water …)", { de: "Die Nebenkosten sind 150 Euro.", en: "The additional costs are 150 euros." }, {
    topics: ["wohnungssuche"],
    notes: { en: "Only used in the plural. In ads often: NK." },
  }),
  n("quadratmeter", "der", "Quadratmeter", "die Quadratmeter", "square metre", { de: "Die Wohnung hat 60 Quadratmeter.", en: "The flat is 60 square metres." }, {
    topics: ["wohnungssuche"],
    notes: { en: "Written m² or qm in ads." },
  }),
  w("mieten", "mieten", "verb", "to rent", { de: "Wir möchten eine Wohnung mieten.", en: "We would like to rent a flat." }, { topics: ["wohnungssuche"] }),
  n("vermieter", "der", "Vermieter", "die Vermieter", "landlord", { de: "Der Vermieter heißt Herr Kaya.", en: "The landlord is called Mr Kaya." }, {
    topics: ["wohnungssuche"],
    notes: { en: "A woman: die Vermieterin." },
  }),
  n("nachbar", "der", "Nachbar", "die Nachbarn", "neighbour", { de: "Mein Nachbar ist sehr nett.", en: "My neighbour is very nice." }, {
    topics: ["wohnungssuche"],
    notes: { en: "A woman: die Nachbarin." },
  }),
  w("ruhig", "ruhig", "adjective", "quiet, calm", { de: "Die Wohnung ist sehr ruhig.", en: "The flat is very quiet." }, { topics: ["wohnungssuche"] }),
  w("laut", "laut", "adjective", "loud, noisy", { de: "Die Straße ist leider laut.", en: "Unfortunately the street is noisy." }, { topics: ["wohnungssuche"] }),
];

export const VOCABULARY = [...ROOMS, ...DESCRIBING, ...HOUSE, ...FURNITURE, ...POSITION, ...FLAT_SEARCH];

export const slugs = (list) => list.map((v) => v.slug);
