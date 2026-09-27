import { ObjectId } from "mongodb";

// Converts Mongo documents into plain JSON-safe objects for the UI layer:
// `_id` becomes `id`, ObjectIds become strings, Dates become ISO strings.
export function serialize(value) {
  if (value == null) return value;
  if (value instanceof ObjectId) return value.toHexString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === "_id") out.id = serialize(v);
      else out[k] = serialize(v);
    }
    return out;
  }
  return value;
}
