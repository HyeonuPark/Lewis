const MapProto = Map.prototype

export class MapX extends Map {
  constructor (iterable, fallback) {
    if (typeof iterable === 'function') {
      fallback = iterable
      iterable = null
    }
    super(iterable)
    this.fallback = fallback
  }
  get (key) {
    const value = super.get(key)
    if (value === void 0) {
      if (this.has(key)) {
        return value
      }

      const {fallback} = this
      if (fallback) {
        const placeholder = fallback(key, this)
        this.set(key, placeholder)
        return placeholder
      }
    }
    return value
  }
  toMap () {
    delete this.fallback
    Object.setPrototypeOf(this, MapProto)
    return this
  }
}

export const inherits = superMap => key => superMap.get(key)
