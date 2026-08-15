/** Lightweight JSON preferences in localStorage under a kn: prefix. */
const PREFIX = 'kn:'

export function getPref<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function setPref<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Preferences are best-effort; storage may be unavailable.
  }
}
