interface MergeData {
  name?: string;
  email: string;
  unsubscribeUrl: string;
}

export function renderMergeTags(content: string, data: MergeData): string {
  if (!content) return content;
  return content
    .replace(/\{\{\s*name\s*\}\}/gi, data.name && data.name.trim() ? data.name : "there")
    .replace(/\{\{\s*email\s*\}\}/gi, data.email)
    .replace(/\{\{\s*unsubscribe_url\s*\}\}/gi, data.unsubscribeUrl);
}

export function wrapPlainTextAsHtml(text: string): string {
  const escaped = (text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #1e293b; white-space: pre-wrap; line-height:1.6;">${escaped}</div>`;
}
