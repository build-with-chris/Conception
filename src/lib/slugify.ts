/**
 * Erzeugt einen URL-freundlichen Slug aus einem Titel.
 */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[ää]/g, "ae")
    .replace(/[öö]/g, "oe")
    .replace(/[üü]/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "projekt";
}
