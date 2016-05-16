import {noop} from './util'
import {FMap} from './fmap'

const rootNamespace = {
  get: noop,
  has: () => false
}

const rootScope = {
  children: {
    add: noop,
    delete: noop,
    [Symbol.iterator]: () => ({
      next: () => ({done: true})
    })
  },
  get: () => rootNamespace
}

class Namespace {
  constructor (scope, type) {
    this.scope = scope
    this.type = type
    this.data = new Map()
  }
  get (key) {
    const {type, data, scope: {parent}} = this

    const getOwn = data.get(key)

    if (getOwn === void 0) {
      if (data.has(key)) {
        return getOwn
      }

      return parent.get(type).get(key)
    }

    return getOwn
  }
  set (key, value) {
    this.data.set(key, value)
    return this
  }
  hasOwn (key) {
    return this.data.has(key)
  }
  has (key) {
    const {type, data, scope: {parent}} = this

    if (data.has(key)) {
      return true
    }

    return parent.get(type).has(key)
  }
  _hasDeep (key) {
    const {type, data, scope: {children}} = this

    if (data.has(key)) {
      return true
    }

    for (let childScope of children) {
      if (childScope.get(type)._hasDeep(key)) {
        return true
      }
    }

    return false
  }
  hasDeep (key) {
    return this.has(key) || this._hasDeep(key)
  }
}

export class Scope {
  constructor (parent = rootScope) {
    this.parent = parent
    this.children = new Set()
    this.data = new FMap(type => new Namespace(this, type))
    parent.children.add(this)
  }
  get (type) {
    return this.data.get(type)
  }
  free () {
    this.parent.children.delete(this)
  }
}
