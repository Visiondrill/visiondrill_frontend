import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize user-authored HTML before passing it to dangerouslySetInnerHTML.
 *
 * Course descriptions, lesson content bodies, and instructor bios are CKEditor
 * rich-text fields. Without sanitization, a malicious instructor could inject
 * <script> tags that execute in every viewer's browser.
 *
 * Keeps the formatting tags rich-text editors emit (headings, lists, links,
 * inline emphasis) and strips event handlers and script-bearing constructs.
 */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return '';
  return DOMPurify.sanitize(input, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'style'],
  });
}
