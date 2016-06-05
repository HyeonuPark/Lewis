import {Transform} from './transform'
import {Convert} from './convert'
import {Visitor} from './visitor'
import {unwrapNode, primitiveTypes, assertType, freezeBut} from './util'

class BaseNode {
  constructor (spec, data, parent) {
    this.type = spec.typeOf(data)
    this.spec = spec
    this.parent = parent
    this._scope = null
  }
  is (alias) {
    const {spec, type} = this
    return spec.isAliasOf(alias, type)
  }
  scope (scopeType) {
    const {_scope} = this
    return _scope && _scope.get(scopeType)
  }
  transform (rawVisitor) {
    return Transform(this, Visitor(this.spec, rawVisitor))
  }
  convert (rawVisitor) {
    return Convert(this, Visitor(this.spec, rawVisitor))
  }
}

class LeafNode extends BaseNode {
  constructor (spec, data, parent) {
    super(spec, data, parent)
    this.value = data
    freezeBut(this, '_scope')
  }
  get () {}
  unwrap () {
    return this.value
  }
}

export class Node extends BaseNode {
  constructor (spec, _data, parent) {
    const data = unwrapNode(_data)
    super(spec, data, parent)

    if (!Array.isArray(data) && primitiveTypes.has(spec.typeOf(data))) {
      return new LeafNode(spec, data, parent)
    }

    this.handlers = {enter: [], exit: [], last: []}
    const nodeType = this.type
    const children = this._children = new Map()
    freezeBut(this, ['_scope', '_children'])

    for (let {name, type, isArray} of spec.childrenOf(nodeType)) {
      const childData = data[name]

      if (isArray) {
        assertType(childData, 'array', `Container of ${nodeType} -> ${name}`)

        for (let childElem of childData) {
          spec.assertType(childElem, type, `${nodeType} -> ${name}`)
        }

        children.set(name, childData.map(child => new Node(spec, child, this)))
      } else {
        spec.assertType(childData, type, `${nodeType} -> ${name}`)

        children.set(name, new Node(spec, childData, this))
      }
    }
  }
  get (childName, index) {
    const {_children} = this
    const child = _children.get(childName)

    if (Array.isArray(child) && typeof index === 'number') {
      return child[index]
    }

    return child
  }
  unwrap () {
    const {type, _children} = this
    const data = {type}

    for (let [name, child] of _children) {
      data[name] = Array.isArray(child)
        ? child.map(el => el.unwrap())
        : child.unwrap()
    }

    return data
  }
}

Object.freeze(BaseNode.prototype)
Object.freeze(LeafNode.prototype)
Object.freeze(Node.prototype)
