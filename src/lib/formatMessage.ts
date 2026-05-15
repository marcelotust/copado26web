/** Replace `{{name}}` placeholders in translated strings. */
export function formatMessage(template: string, params?: Record<string, string>): string {
  if (!params) return template
  let out = template
  for (const [key, value] of Object.entries(params)) {
    out = out.replaceAll(`{{${key}}}`, value)
  }
  return out
}
