import {MapX} from './mapx'

export class Scope {
  constructor (parent) {
    this.type = 'basic'
    this.parent = parent
    this.children = new Set()
    this.data = new Map()

    parent && parent.addChild(this)
  }
  set (key, value) {
    this.data.set(key, value)
    return this
  }
  add (key) {
    return this.set(key, null)
  }
  get (key) {
    const {data, parent} = this

    if (data.has(key)) {
      return data.get(key)
    }
    if (parent) {
      return parent.get(key)
    }
  }
  has (key) {
    const {parent, data} = this

    if (data.has(key)) {
      return true
    }
    if (parent && parent.has(key)) {
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
  hasChild (child) {
    return this.children.has(child)
  }
  addChild (child) {
    child.parent = this
    this.children.add(child)
    return this
  }
  removeChild (child) {
    this.children.delete(child)
    return this
  }
  _printScopeStack () {
    console.log(`Scope: ${this.data.size} ${[...this.data.keys()].join(', ')}`)
    for (let child of this.children) {
      child._printScopeStack()
    }
  }
}

function* iterateBlockChildren (blockScope) {
  let current = blockScope.lastChild

  while (current && current !== blockScope) {
    yield current
    current = current.parent
  }
}

export class BlockScope extends Scope {
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

    super(parent)
    this.type = 'block'
    this.lastChild = this
  }
  get (key) {
    const {lastChild} = this

    if (lastChild === this) {
      return super.get(key)
    }
    return lastChild.get(key)
  }
  has (key) {
    const {lastChild} = this

    if (lastChild === this) {
      return super.has(key)
    }
    return lastChild.has(key)
  }
  hasOwn (key) {
    const {lastChild} = this

    if (lastChild === this) {
      return super.hasOwn(key)
    }
    return lastChild.hasOwn(key)
  }
  hasChild (givenChild) {
    for (let child of iterateBlockChildren(this)) {
      if (child === givenChild) {
        return true
      }
    }
    return false
  }
  addChild (child) {
    const {lastChild} = this

    if (lastChild === this) {
      super.addChild(child)
      return this
    }

    child.parent = lastChild
    lastChild.addChild(child)
    return this
  }
  _removeChild (child) {
    return super._removeChild(child)
  }
  removeChild (givenChild) {
    for (let child of iterateBlockChildren(this)) {
      if (child === givenChild) {
        const {parent} = child

        if (parent) {
          if (parent.type === 'block') {
            parent._removeChild(child)
          }
          parent.removeChild(child)

          for (let grandChild of child.children) {
            parent.addChild(grandChild)
          }
        }
        return true
      }
    }
    return false
  }
}

const scopeMap = new Map([
  ['basic', Scope],
  ['block', BlockScope]
])

export class ScopeContainer {
  constructor (parent, scopeType = 'basic') {
    this.parent = parent
    this.type = scopeType

    const ScopeClass = scopeMap.get(scopeType)

    this.data = new MapX(key => {
      const parent = this.parent
      const parentData = parent && parent.data
      const parentScope = parentData && parentData.get(key)
      return new ScopeClass(parentScope)
    })
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
}
