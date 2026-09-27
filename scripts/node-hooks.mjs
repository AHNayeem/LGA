// Node ESM resolve hooks for CLI scripts: maps the `@/` alias (jsconfig.json) to the
// project root, adds the `.js` extension Next/Vitest let us omit, and treats project
// `.js` files as ES modules.
import { existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = new URL("../", import.meta.url);

function withExtension(url) {
  const path = fileURLToPath(url);
  if (existsSync(path) && statSync(path).isFile()) return url;
  for (const candidate of [`${path}.js`, `${path}.mjs`, `${path}/index.js`]) {
    if (existsSync(candidate)) return pathToFileURL(candidate).href;
  }
  return url;
}

export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    return { url: withExtension(new URL(specifier.slice(2), ROOT).href), shortCircuit: true, format: "module" };
  }
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith(ROOT.href)) {
    const url = new URL(specifier, context.parentURL);
    if (!url.pathname.includes("/node_modules/")) {
      return { url: withExtension(url.href), shortCircuit: true, format: "module" };
    }
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (url.startsWith(ROOT.href) && !url.includes("/node_modules/") && url.endsWith(".js")) {
    return next(url, { ...context, format: "module" });
  }
  return next(url, context);
}
