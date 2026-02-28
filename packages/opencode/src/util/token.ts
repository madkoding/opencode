export namespace Token {
  const CHARS_PER_TOKEN = 4
  const cache = new Map<string, number>()

  export function estimate(input: string) {
    const cached = cache.get(input)
    if (cached !== undefined) return cached
    const result = Math.max(0, Math.round((input || "").length / CHARS_PER_TOKEN))
    if (cache.size < 10000) cache.set(input, result)
    return result
  }
}
