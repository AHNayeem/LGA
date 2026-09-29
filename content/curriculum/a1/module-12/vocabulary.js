// Module 12 vocabulary. Original entries (lemma, gender, plural, English meaning, our own
// example sentences). Topic scope follows the Module 12 mapping in docs/REFERENCE-ANALYSIS.md
// (travel, holidays, sightseeing, weather, announcements); no word lists, translations or
// examples were copied from the reference books. Words already defined in earlier modules
// (das Hotel, der Flughafen, der Bahnhof, das Gleis, die Durchsage, seasons, months …) are
// used but not redefined here.
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

// --- Lesson 1: holidays and travel -----------------------------------------------------
export const TRAVEL = [
  n("urlaub", "der", "Urlaub", "die Urlaube", "holiday, vacation (from work)", { de: "Im August mache ich zwei Wochen Urlaub.", en: "In August I'm taking two weeks' holiday." }, {
    topics: ["reisen"],
    notes: { en: "Urlaub machen = to go on holiday. im Urlaub = on holiday." },
  }),
  n("ferien", "die", "Ferien", null, "holidays (school, university)", { de: "Die Kinder haben im Sommer sechs Wochen Ferien.", en: "The children have six weeks of holidays in summer." }, {
    topics: ["reisen"],
    notes: { en: "Only used in the plural: die Ferien." },
  }),
  n("reise", "die", "Reise", "die Reisen", "trip, journey", { de: "Gute Reise!", en: "Have a good trip!" }, { topics: ["reisen"] }),
  w("reisen", "reisen", "verb", "to travel", { de: "Wir reisen gern mit dem Zug.", en: "We like travelling by train." }, { topics: ["reisen"] }),
  n("koffer", "der", "Koffer", "die Koffer", "suitcase", { de: "Mein Koffer ist zu klein.", en: "My suitcase is too small." }, { topics: ["reisen"] }),
  n("flugzeug", "das", "Flugzeug", "die Flugzeuge", "plane, aeroplane", { de: "Das Flugzeug fliegt nach Madrid.", en: "The plane flies to Madrid." }, {
    topics: ["reisen"],
  }),
  w("fliegen", "fliegen", "verb", "to fly", { de: "Im Juli fliegen wir nach Portugal.", en: "In July we're flying to Portugal." }, { topics: ["reisen"] }),
  n("strand", "der", "Strand", "die Strände", "beach", { de: "Wir liegen den ganzen Tag am Strand.", en: "We lie on the beach all day." }, { topics: ["reisen"] }),
  n("meer", "das", "Meer", "die Meere", "sea", { de: "Ich schwimme gern im Meer.", en: "I like swimming in the sea." }, {
    topics: ["reisen"],
    notes: { en: "Where to? ans Meer. Where? am Meer." },
  }),
  n("berg", "der", "Berg", "die Berge", "mountain", { de: "Im Winter fahren wir in die Berge.", en: "In winter we go to the mountains." }, { topics: ["reisen"] }),
  w("man", "man", "pronoun", "you, one, people (in general)", { de: "Hier kann man gut essen.", en: "You can eat well here." }, {
    topics: ["reisen"],
    notes: { en: "Always with the er/sie/es form of the verb. Not the same as der Mann (the man)." },
  }),
];

// --- Lesson 2: weather -------------------------------------------------------------------
export const WEATHER = [
  n("wetter", "das", "Wetter", null, "weather", { de: "Wie ist das Wetter heute?", en: "What's the weather like today?" }, { topics: ["wetter"] }),
  n("sonne", "die", "Sonne", null, "sun", { de: "Die Sonne scheint.", en: "The sun is shining." }, { topics: ["wetter"] }),
  w("scheinen", "scheinen", "verb", "to shine", { de: "Scheint bei euch auch die Sonne?", en: "Is the sun shining where you are too?" }, { topics: ["wetter"] }),
  n("regen", "der", "Regen", null, "rain", { de: "Ich mag keinen Regen.", en: "I don't like rain." }, { topics: ["wetter"] }),
  w("regnen", "regnen", "verb", "to rain", { de: "Es regnet schon den ganzen Tag.", en: "It has been raining all day." }, {
    topics: ["wetter"],
    notes: { en: "Always with es: es regnet." },
  }),
  n("schnee", "der", "Schnee", null, "snow", { de: "In den Bergen liegt viel Schnee.", en: "There is a lot of snow in the mountains." }, { topics: ["wetter"] }),
  w("schneien", "schneien", "verb", "to snow", { de: "Es schneit! Der Winter ist da.", en: "It's snowing! Winter is here." }, {
    topics: ["wetter"],
    notes: { en: "Always with es: es schneit." },
  }),
  n("wind", "der", "Wind", "die Winde", "wind", { de: "Am Meer gibt es oft Wind.", en: "There is often wind by the sea." }, { topics: ["wetter"] }),
  w("sonnig", "sonnig", "adjective", "sunny", { de: "Morgen ist es sonnig und warm.", en: "Tomorrow it will be sunny and warm." }, { topics: ["wetter"] }),
  w("bewoelkt", "bewölkt", "adjective", "cloudy", { de: "Heute ist es bewölkt, aber es regnet nicht.", en: "Today it's cloudy, but it isn't raining." }, {
    topics: ["wetter"],
  }),
  w("windig", "windig", "adjective", "windy", { de: "Es ist kalt und windig.", en: "It's cold and windy." }, { topics: ["wetter"] }),
  w("warm", "warm", "adjective", "warm", { de: "Im Sommer ist es in Spanien sehr warm.", en: "In summer it's very warm in Spain." }, { topics: ["wetter"] }),
  w("kalt", "kalt", "adjective", "cold", { de: "Im Januar ist es oft kalt.", en: "It's often cold in January." }, { topics: ["wetter"] }),
  w("heiss", "heiß", "adjective", "hot", { de: "Heute ist es heiß: 35 Grad!", en: "It's hot today: 35 degrees!" }, { topics: ["wetter"] }),
  n("grad", "der", "Grad", "die Grade", "degree (temperature)", { de: "Es sind 20 Grad.", en: "It's 20 degrees." }, {
    topics: ["wetter"],
    notes: { en: "After a number it has no plural ending: 20 Grad. minus 5 Grad = −5 °C." },
  }),
  w("denn", "denn", "conjunction", "because, as", { de: "Wir gehen nicht an den Strand, denn es ist zu kalt.", en: "We're not going to the beach, because it's too cold." }, {
    topics: ["wetter"],
    notes: { en: "denn joins two main clauses and does not change the word order." },
  }),
];

// --- Lesson 3: sightseeing -----------------------------------------------------------------
export const SIGHTSEEING = [
  n("sehenswuerdigkeit", "die", "Sehenswürdigkeit", "die Sehenswürdigkeiten", "sight, place of interest", {
    de: "Das Brandenburger Tor ist eine Sehenswürdigkeit in Berlin.",
    en: "The Brandenburg Gate is a sight in Berlin.",
  }, { topics: ["stadtbesichtigung"] }),
  n("stadtrundfahrt", "die", "Stadtrundfahrt", "die Stadtrundfahrten", "city tour (by bus)", {
    de: "Die Stadtrundfahrt beginnt um zehn Uhr am Bahnhof.",
    en: "The city tour starts at ten o'clock at the station.",
  }, { topics: ["stadtbesichtigung"] }),
  n("stadtplan", "der", "Stadtplan", "die Stadtpläne", "city map", { de: "Haben Sie einen Stadtplan für mich?", en: "Do you have a city map for me?" }, {
    topics: ["stadtbesichtigung"],
  }),
  n("touristeninformation", "die", "Touristeninformation", "die Touristeninformationen", "tourist information office", {
    de: "In der Touristeninformation bekommt man einen Stadtplan.",
    en: "You can get a city map at the tourist information office.",
  }, { topics: ["stadtbesichtigung"] }),
  n("tourist", "der", "Tourist", "die Touristen", "tourist", { de: "Im Sommer kommen viele Touristen nach Heidelberg.", en: "Many tourists come to Heidelberg in summer." }, {
    topics: ["stadtbesichtigung"],
    notes: { en: "A woman: die Touristin, die Touristinnen." },
  }),
  n("schloss", "das", "Schloss", "die Schlösser", "castle, palace", { de: "Das Schloss ist sehr alt.", en: "The castle is very old." }, {
    topics: ["stadtbesichtigung"],
  }),
  n("turm", "der", "Turm", "die Türme", "tower", { de: "Vom Turm sieht man die ganze Stadt.", en: "From the tower you can see the whole city." }, {
    topics: ["stadtbesichtigung"],
  }),
  n("bruecke", "die", "Brücke", "die Brücken", "bridge", { de: "Gehen Sie über die Brücke und dann links.", en: "Go over the bridge and then left." }, {
    topics: ["stadtbesichtigung"],
  }),
  w("besichtigen", "besichtigen", "verb", "to visit, to see (a sight)", { de: "Morgen besichtigen wir das Schloss.", en: "Tomorrow we're visiting the castle." }, {
    topics: ["stadtbesichtigung"],
  }),
  w("fotografieren", "fotografieren", "verb", "to take photos", { de: "Darf man hier fotografieren?", en: "Are you allowed to take photos here?" }, {
    topics: ["stadtbesichtigung"],
  }),
  w("in-der-naehe", "in der Nähe", "phrase", "nearby, close by", { de: "Gibt es hier in der Nähe ein Café?", en: "Is there a café near here?" }, {
    topics: ["stadtbesichtigung"],
  }),
];

// --- Lesson 4: postcards, station and airport -----------------------------------------------
export const ON_THE_WAY = [
  n("postkarte", "die", "Postkarte", "die Postkarten", "postcard", { de: "Ich schreibe meiner Oma eine Postkarte.", en: "I'm writing my grandma a postcard." }, {
    topics: ["reisen"],
  }),
  w("schoene-gruesse-aus", "Schöne Grüße aus …", "phrase", "Greetings from … (on a postcard)", { de: "Schöne Grüße aus Hamburg!", en: "Greetings from Hamburg!" }, {
    topics: ["reisen"],
  }),
  n("abfahrt", "die", "Abfahrt", "die Abfahrten", "departure (train, bus)", { de: "Die Abfahrt ist um 8:15 Uhr.", en: "The departure is at 8:15." }, {
    topics: ["reisen"],
  }),
  n("verspaetung", "die", "Verspätung", "die Verspätungen", "delay", { de: "Der Zug hat zehn Minuten Verspätung.", en: "The train is ten minutes late." }, {
    topics: ["reisen"],
  }),
  n("flug", "der", "Flug", "die Flüge", "flight", { de: "Der Flug nach Rom dauert zwei Stunden.", en: "The flight to Rome takes two hours." }, { topics: ["reisen"] }),
  n("gate", "das", "Gate", "die Gates", "gate (at the airport)", { de: "Bitte gehen Sie zu Gate B12.", en: "Please go to gate B12." }, {
    topics: ["reisen"],
    notes: { en: "Pronounced as in English." },
  }),
  n("gepaeck", "das", "Gepäck", null, "luggage, baggage", { de: "Wo ist mein Gepäck?", en: "Where is my luggage?" }, {
    topics: ["reisen"],
    notes: { en: "No plural." },
  }),
  n("reisepass", "der", "Reisepass", "die Reisepässe", "passport", { de: "Zeigen Sie bitte Ihren Reisepass.", en: "Please show your passport." }, {
    topics: ["reisen"],
  }),
  w("landen", "landen", "verb", "to land", { de: "Das Flugzeug landet um 14 Uhr in Frankfurt.", en: "The plane lands in Frankfurt at 2 p.m." }, {
    topics: ["reisen"],
  }),
];

export const VOCABULARY = [...TRAVEL, ...WEATHER, ...SIGHTSEEING, ...ON_THE_WAY];

export const slugs = (list) => list.map((v) => v.slug);
