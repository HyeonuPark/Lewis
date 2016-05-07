import {MapX} from './mapx'

export class Scope extends Map {
  constructor (parent) {
    super()
    this.parent = parent
    this.children = new Set()

    if (parent) {
      parent.children.add(this)
    }
  }
  child () {
    const childScope = new Scope(this)
    return childScope
  }
  removeChild (child) {
    this.childScope.delete(child)
    return this
  }
  get (key) {
    const {parent} = this
    const result = super.get(key)
    if (result == null && parent) {
      return parent.get(key)
    }
    return result
  }
  hasOwn (key) {
    return super.has(key)
  }
  has (key) {
    if (super.has(key)) {
      return true
    }

    const {parent} = this
    if (parent) {
      return parent.has(key)
    }

    return false
  }
  _hasDeep (key) {
    if (super.has(key)) {
      return true
    }

    const {children} = this
    for (let child of children) {
      if (child._hasDeep(key)) {
        return true
      }
    }

    return false
  }
  hasDeep (key) {
    return this.has(key) || this._hasDeep(key)
  }
  uid (base) {
    const refined = /_*([A-Za-z0-9_]*[A-Za-z])[0-9]*/.exec(base)
    const baseStr = (refined && refined[1]) || 'tmp'

    let count = 0
    while (this.hasDeep(`__${baseStr}${count || ''}`)) {
      count += 1
    }

    return `__${baseStr}${count || ''}`
  }
}

export function ScopeContainer (parentContainer) {
  return new MapX(scopeType => {
    if (parentContainer) {
      return parentContainer.get(scopeType).child()
    }
    return new Scope()
  })
}
