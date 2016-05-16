export class State extends Map {
  get (key) {
    const content = super.get(key)
    if (!content) {
      return content
    }

    return content.value
  }
  set (key, value) {
    const content = super.get(key)
    if (!content) {
      return super.set(key, {value})
    }

    content.value = value
    return this
  }
  override (key, value) {
    const prev = super.get(key)
    if (!prev) {
      return super.set(key, {value})
    }

    return super.set(key, {prev, value})
  }
  recover (key) {
    const content = super.get(key)
    if (!content) {
      return this
    }

    const {prev} = content
    if (!prev) {
      this.delete(key)
      return this
    }

    return super.set(key, prev)
  }
}
