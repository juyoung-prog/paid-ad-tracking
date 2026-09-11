// Node ESM loader: resolve extensionless relative imports (the app relies on Vite for this)
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && context.parentURL && !/\.[a-z]+$/i.test(specifier)) {
    const base = fileURLToPath(new URL(specifier, context.parentURL));
    for (const ext of ['.js', '.jsx', '/index.js']) {
      if (existsSync(base + ext)) return nextResolve(pathToFileURL(base + ext).href, context);
    }
  }
  return nextResolve(specifier, context);
}
