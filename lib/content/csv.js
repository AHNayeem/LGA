// Delimited text (CSV / TSV) parsing and formatting, RFC 4180. Pure code without
// dependencies, used in the browser (bulk import preview, template and error export) and
// on the server.
//
// Parsing rules:
//   - fields are separated by the delimiter; records by LF, CRLF or CR
//   - a field that starts with a double quote is quoted: it ends at the next lone quote,
//     `""` inside it is one quote, and delimiters and line breaks inside it are text
//   - a quote inside an unquoted field is kept as text (spreadsheets paste `5" Rohr` so)
//   - text between a closing quote and the next delimiter, and a quote left open at the
//     end of the input, are errors (the record is reported, not guessed)
//   - a UTF-8 byte order mark at the start is removed
//   - records whose cells are all empty are skipped, but still counted, so `row` stays
//     the row number a spreadsheet shows

export const DELIMITERS = Object.freeze({ comma: ",", semicolon: ";", tab: "\t" });

// Tab when the first record has one (a paste from Excel or Google Sheets), otherwise
// semicolon or comma, whichever the first record uses more (German Excel saves CSV with
// semicolons). Quoted text is not counted.
export function detectDelimiter(text) {
  const counts = { ",": 0, ";": 0, "\t": 0 };
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') quoted = !quoted;
    else if (!quoted && (c === "\n" || c === "\r")) break;
    else if (!quoted && c in counts) counts[c]++;
  }
  if (counts["\t"] > 0) return "\t";
  return counts[";"] > counts[","] ? ";" : ",";
}

// Returns { delimiter, records: [{ row, cells }], errors: [{ row, message }] }.
// `row` is the 1-based record number (a multi-line quoted cell stays one row).
export function parseDelimited(input, { delimiter } = {}) {
  const text = String(input ?? "").replace(/^﻿/, "");
  const sep = delimiter ?? detectDelimiter(text);
  const records = [];
  const errors = [];
  let cells = [];
  let field = "";
  let row = 1;
  let i = 0;
  let recordError = null;

  const endField = () => {
    cells.push(field);
    field = "";
  };
  const endRecord = () => {
    endField();
    if (recordError) errors.push({ row, message: recordError });
    else if (cells.some((c) => c !== "")) records.push({ row, cells });
    cells = [];
    recordError = null;
    row++;
  };

  while (i < text.length) {
    const c = text[i];
    if (c === '"' && field === "") {
      // Quoted field.
      let j = i + 1;
      let closed = false;
      while (j < text.length) {
        if (text[j] === '"') {
          if (text[j + 1] === '"') {
            field += '"';
            j += 2;
            continue;
          }
          closed = true;
          j++;
          break;
        }
        field += text[j];
        j++;
      }
      if (!closed) {
        errors.push({ row, message: "A quoted value is not closed (a double quote is missing)." });
        return { delimiter: sep, records, errors };
      }
      // Only a delimiter or a line break may follow the closing quote.
      let k = j;
      while (k < text.length && text[k] !== sep && text[k] !== "\n" && text[k] !== "\r") k++;
      if (k > j) {
        recordError ??= "Unexpected text after a closing double quote. Put the whole value in quotes and write quotes inside it as \"\".";
      }
      i = k;
      continue;
    }
    if (c === sep) {
      endField();
      i++;
    } else if (c === "\n" || c === "\r") {
      endRecord();
      i += c === "\r" && text[i + 1] === "\n" ? 2 : 1;
    } else {
      field += c;
      i++;
    }
  }
  // Last record without a trailing line break.
  if (field !== "" || cells.length > 0 || recordError) endRecord();
  return { delimiter: sep, records, errors };
}

// One CSV field: quoted when it contains the delimiter, a quote or a line break, or
// starts/ends with a space.
export function formatField(value, delimiter = ",") {
  const s = value == null ? "" : String(value);
  return s.includes(delimiter) || /["\r\n]/.test(s) || /^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// rows: arrays of cells. CRLF line ends and a byte order mark, so Excel opens the file as
// UTF-8 (umlauts and ß intact).
export function formatDelimited(rows, { delimiter = ",", bom = true } = {}) {
  const body = rows.map((r) => r.map((v) => formatField(v, delimiter)).join(delimiter)).join("\r\n");
  return `${bom ? "﻿" : ""}${body}\r\n`;
}
