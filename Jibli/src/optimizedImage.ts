import assets from "./optimizedAssets.json";

/** Original paths remain template identifiers; only the requested file changes. */
export function optimizedImage(path: string): string {
  return (assets as Record<string,string>)[path] || path;
}
