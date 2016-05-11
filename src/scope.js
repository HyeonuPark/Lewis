import {MapX} from './mapx'
import {noop} from './util'

function getSelf () {
  return this
}

function getFalse () {
  return false
}

const rootScope = {
  parent: getSelf,
  set: getSelf,
  add: getSelf,
  has: getFalse,
  hasOwn: getFalse,
  _hasDeep: getFalse,
  hasDeep: getFalse,
  get: noop,
  addElement: noop,
  removeElement: noop,
  addChild: noop,
  removeChild: noop,
  unmount: noop,
  iterateScopeElement: () => []
}

export class Scope {
  constructor (parent, type) {
    this.parent = parent || rootScope
    this.type = type
    this.elements = new Set()
    this.children = new Set()

    this.parent.addChild(this)
  }
  query (key) {
    for (let elem of this.elements) {
      if (elem.has(key)) {
        return elem
      }
    }
  }
  get (key) {
    const elem = this.query(key)
    if (elem) {
      return elem.get(key)
    }

    return this.parent.get(key)
  }
  has (key) {
    return this.hasOwn(key) || this.parent.has(key)
  }
  hasOwn (key) {
    const elem = this.query(key)
    if (elem) {
      return true
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
  addElement (elem) {
    this.elements.add(elem)
    return this
  }
  removeElement (elem) {
    this.elements.delete(elem)
    return this
  }
  addChild (child) {
    this.children.add(child)
    return this
  }
  removeChild (child) {
    this.children.delete(child)
    return this
  }
  unmount () {
    this.parent.removeChild(this)
    this.parent = null
  }
  *iterateScopeElement () {
    for (let elem of this.elements) {
      for (let key of elem.keys()) {
        yield key
      }
    }
    yield '|'
    yield* this.parent.iterateScopeElement()
  }
}

export class ScopeNode {
  constructor (scope) {
    this.scope = scope
    this.data = new Map()
    scope.addElement(this.data)
  }
  set (key, value) {
    if (this.scope.hasOwn(key)) {
      return false
    }
    this.data.set(key, value)
    return true
  }
  add (key) {
    return this.set(key, null)
  }
  get (key) {
    this.scope.get(key)
    return this
  }
  has (key) {
    return this.scope.has(key)
  }
  hasOwn (key) {
    return this.scope.hasOwn(key)
  }
  hasDeep (key) {
    return this.scope.hasDeep(key)
  }
  uid (base) {
    return this.scope.uid(base)
  }
  unmount () {
    this.scope.removeElement(this.data)
    this.scope = null
    this.data = null
  }
  printScopeStack (msg) {
    if (msg) {
      console.log(`- Print scope stack: ${msg}`)
    }
    const itr = this.scope.iterateScopeElement()
    console.log(`- Scope: ${[...itr].join(' ')}`)
  }
}

export class ScopeContainer {
  constructor (parent, spawnChild) {
    const parentScopeMap = parent && parent.scopeMap
    this.spawnChild = spawnChild

    if (!parentScopeMap) {
      this.scopeMap = new MapX(scopeType => (
        new Scope(null, scopeType)
      ))
    } else if (spawnChild) {
      this.scopeMap = new MapX(scopeType => (
        new Scope(parentScopeMap.get(scopeType), scopeType)
      ))
    } else {
      this.scopeMap = parentScopeMap
    }

    this.nodeMap = new MapX(scopeType => (
      new ScopeNode(this.scopeMap.get(scopeType))
    ))
  }
  get (scopeType) {
    return this.nodeMap.get(scopeType)
  }
  unmount () {
    for (let node of this.nodeMap.values()) {
      node.unmount()
    }

    if (this.spawnChild) {
      for (let scope of this.scopeMap.values()) {
        scope.unmount()
      }
    }
  }
  getScopeStackReport () {
    const result = []
    for (let [scopeType, scope] of this.scopeMap) {
      const itr = scope.iterateScopeElement()
      result.push(`- ${scopeType}: ${[...itr].join(' ')}`)
    }
    return result.join('\n')
  }
}
