import {MapX} from './mapx'

export class Scope {
  constructor (head, tail, children = new Set()) {
    this.head = head
    this.tail = tail
    this.children = children

    head.scope = head.scope || this
    tail.scope = this
  }
  set (key, value) {
    const {tail} = this
    const {prev} = tail

    const element = {type: 'element', key, value, prev}
    tail.prev = element
    return element
  }
  add (key) {
    return this.set(key, null)
  }
  *iterate () {
    let current = this.tail

    while (current) {
      yield current
      current = current.prev
    }
  }
  get (queryKey) {
    for (let {type, key, value} of this.iterate()) {
      if (type === 'element' && key === queryKey) {
        return value
      }
    }

    return void 0
  }
  has (queryKey) {
    for (let {type, key} of this.iterate()) {
      if (type === 'element' && key === queryKey) {
        return true
      }
    }

    return false
  }
  hasOwn (queryKey) {
    const {head} = this

    for (let elem of this.iterate()) {
      const {type, key} = elem

      if (type === 'element' && key === queryKey) {
        return true
      }

      if (elem === head) {
        return false
      }
    }

    return false
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
  anchor () {
    const {head, tail, children} = this

    const newTail = {
      type: 'tail',
      prev: tail.prev
    }

    tail.prev = newTail

    return new Scope(head, newTail, children)
  }
  child () {
    const {tail, children} = this

    const newHead = {
      type: 'head',
      scope: null,
      prev: tail
    }
    const newTail = {
      type: 'tail',
      scope: null,
      prev: newHead
    }

    const newScope = new Scope(newHead, newTail)
    children.add(newScope)
    return newScope
  }
  removeChild (child) {
    this.children.delete(child)
    return this
  }
}

export function createScope () {
  const head = {type: 'head'}
  const tail = {type: 'tail', prev: head}
  return new Scope(head, tail)
}

export class ScopeContainer {
  constructor (parent, isAnchor) {
    const parentData = this.parent = parent && parent.data
    let getScope

    if (!parentData) {
      getScope = createScope
    } else if (isAnchor) {
      getScope = scopeType => parentData.get(scopeType).anchor()
    } else {
      getScope = scopeType => parentData.get(scopeType).child()
    }

    this.data = new MapX(getScope)
  }
  get (scopeType) {
    return this.data.get(scopeType)
  }
  delete () {
    const {parent, data} = this

    if (parent) {
      for (let [type, scope] of data) {
        parent.get(type).removeChild(scope)
      }
    }
  }
  anchor () {
    return new ScopeContainer(this, true)
  }
  child () {
    return new ScopeContainer(this, false)
  }
}
