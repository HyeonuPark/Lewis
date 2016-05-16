import {noop} from './util'

export class FMap extends Map {
  constructor (iterable, fallback) {
    if (typeof iterable === 'function') {
      fallback = iterable
      iterable = null
    }

    super(iterable)
    this.fallback = typeof fallback === 'function' ? fallback : noop
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
