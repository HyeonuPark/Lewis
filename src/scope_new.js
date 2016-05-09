import {MapX} from './mapx'

export class Scope {
  constructor (parent) {
    this.parent = parent
    this.children = new Set()

    this.data = parent
      ? new MapX(key => this.parent.get(key))
      : new Map()

    parent && parent.addChild(this)
  }
  iterateChildren () {
    return this.children[Symbol.iterator]()
  }
  set (key, value) {
    this.data.set(key, value)
    return this
  }
  add (key) {
    return this.set(key, null)
  }
  get (key) {
    return this.data.get(key)
  }
  has (key) {
    const {parent, data} = this

    if (data.has(key)) {
      return true
    }
    if (parent.has(key)) {
      return true
    }
    return false
  }
  hasOwn (key) {
    return this.data.has(key)
  }
  _hasDeep (key) {
    if (this.hasOwn(key)) {
      return true
    }

    for (let child of this.children) {
      if (child._hasDeep(key)) {
        return true
      }
    }

    return false
  }
  hasDeep (key) {
    return this.has(key) || this._hasDeep(key)
  }
  addChild (child) {
    this.children.add(child)
    return this
  }
  removeChild (child) {
    this.children.delete(child)
    return this
  }
}

export class BlockScope {
  constructor (_parent) {
    let parent = _parent
    let parentBlock = _parent
    while (parentBlock) {
      parentBlock = parentBlock.parent
      if (parentBlock instanceof BlockScope) {
        parent = parentBlock
        break
      }
    }

    this.parent = parent
    this.last = this.head = new Scope(parent)

    parent && parent.addChild(this)
  }
  *iterateChildren () {
    const {head, last} = this
    let current = last

    while (current && current !== head) {
      yield current
      current = current.parent
    }
  }
  set (key, value) {
    this.last.set(key, value)
    return this
  }
  add (key) {
    this.set(key, null)
  }
  get (key) {
    return this.last.get(key)
  }
  has (key) {
    return this.last.has(key)
  }
  hasOwn (key) {
    for (let child of this.iterateChildren()) {
      if (child.hasOwn(key)) {
        return true
      }
    }
  }
  hasDeep (key) {
    return this.head.hasDeep(key)
  }
  addChild (child) {
    child.parent = this.last
    this.last = child
    return this
  }
  removeChild (givenChild) {
    for (let child of this.iterateChildren()) {
      if (child === givenChild) {
        const {parent} = child

        for (let grandChild of chlid.iterateChildren()) {
          grandChild.parent = parent
        }
      }
    }
  }
  delete () {
    const {parent} = this
  }
}

export class ScopeContainer {
  constructor (parent, isBlockScope) {
    const parentData = this.parent = parent && parent.data
    this.isBlockScope = isBlockScope
    const getScope = ScopeClass => key => {
      const {parent} = this

      if (parent) {
        const newScope = new ScopeClass(parent)
        parent.addChild(newScope)
        return newScope
      }

      return new ScopeClass()
    }

    if (isBlockScope) {
      this.data = new MapX(getScope(BlockScope))
    } else {
      this.data = new MapX(getScope(Scope))
    }
  }
}
