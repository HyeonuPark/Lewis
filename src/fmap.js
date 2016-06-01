export class FMap extends Map {
  constructor (fallback, iterable) {
    super(iterable)

    if (typeof fallback !== 'function') {
      return new Map(iterable)
    }

    this.fallback = fallback
  }
  get (key) {
    const result = super.get(key)
    if (result === void 0) {
      if (this.has(key)) {
        return result
      }

      const placeholder = this.fallback(key, this)
      this.set(key, placeholder)
      return placeholder
    }
    return result
  }
}
