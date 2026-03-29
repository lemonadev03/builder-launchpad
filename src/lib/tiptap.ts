// Tiptap JSON content type and utilities

export type TiptapContent = {
  type: string;
  content?: TiptapContent[];
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
};

const MAX_IMAGES = 10;
const MAX_CONTENT_SIZE = 50 * 1024; // 50KB
const MAX_COMMENT_SIZE = 8 * 1024; // 8KB (~2000 chars with formatting)

export function countImages(node: TiptapContent): number {
  let count = 0;
  if (node.type === "image") count++;
  if (node.content) {
    for (const child of node.content) {
      count += countImages(child);
    }
  }
  return count;
}

export function extractPlainText(
  node: TiptapContent,
  maxLength = 200,
): string {
  const parts: string[] = [];

  function walk(n: TiptapContent) {
    if (parts.join("").length >= maxLength) return;
    if (n.text) parts.push(n.text);
    if (n.content) {
      for (const child of n.content) {
        walk(child);
      }
    }
  }

  walk(node);
  const text = parts.join(" ").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

export function validatePostContent(
  content: TiptapContent,
): { valid: true } | { valid: false; error: string } {
  const size = JSON.stringify(content).length;
  if (size > MAX_CONTENT_SIZE) {
    return { valid: false, error: `Post content is too large (max ${MAX_CONTENT_SIZE / 1024}KB)` };
  }

  const imageCount = countImages(content);
  if (imageCount > MAX_IMAGES) {
    return { valid: false, error: `Too many images (max ${MAX_IMAGES})` };
  }

  return { valid: true };
}

export function validateCommentContent(
  content: TiptapContent,
): { valid: true } | { valid: false; error: string } {
  const size = JSON.stringify(content).length;
  if (size > MAX_COMMENT_SIZE) {
    return { valid: false, error: "Comment is too long (max ~2000 characters)" };
  }

  const plainText = extractPlainText(content, 2100);
  if (plainText.length > 2000) {
    return { valid: false, error: "Comment must be 2000 characters or less" };
  }

  if (plainText.trim().length === 0) {
    return { valid: false, error: "Comment cannot be empty" };
  }

  if (countImages(content) > 0) {
    return { valid: false, error: "Images are not allowed in comments" };
  }

  return { valid: true };
}
