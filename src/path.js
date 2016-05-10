import {map} from 'iterator-util'

import {unwrapPath, childPath} from './path-helper'
import {Visitor} from './visitor'
import {Transform} from './transform'
import {Convert} from './convert'
import {
  primitiveTypes, assertType,
  nodeTypeOf, assertNodeType, flattenTypes
} from './util'

export class Path {
  constructor (structMap, subtypeMap, node, parent) {
    const type = this.type = nodeTypeOf(node)
    this.node = unwrapPath(node)
    this.parent = parent
    this._structMap = structMap
    this._subtypeMap = subtypeMap
    this._scopeContainer = null

    const childrenPath = this.children = new Map()

    // argument 'node' is just a value, not a valid node
    if (primitiveTypes.has(type)) {
      this._isValid = true
      return
    }

    // node's type is not properly registered
    const struct = structMap.get(type)
    if (!struct) {
      throw new Error(`Type ${type} is only for alias check`)
    }

    this._validateFunc = struct.validate
    this._scopeType = struct.scope

    // build child paths
    for (let {name, type: childType, isArray, visitable} of struct.children) {
      const childNode = node[name]

      // validate child nodes
      if (isArray) {
        assertType(childNode, 'array', 'Child node')

        const childList = childNode.map(eachNode => {
          assertNodeType(eachNode, childType, `Each ${type}->${name}`)

          return childPath(this, eachNode)
        })
        childrenPath.set(name, childList)
      } else {
        assertNodeType(childNode, childType, `${type}->${name}`)

        const child = childPath(this, childNode)
        childrenPath.set(name, child)
      }
    }

    Object.seal && Object.seal(this)
  }
  get (fieldName, index) {
    const {children} = this
    const result = children.get(fieldName)
    if (Array.isArray(result) && typeof index === 'number') {
      return result[index]
    }
    return result
  }
  is (alias) {
    return this._subtypeMap.get(alias).has(this.type)
  }
  scope (scopeType) {
    return this._scopeContainer.get(scopeType)
  }
  transform (rawVisitor) {
    return Transform(this, Visitor(rawVisitor, this._subtypeMap))
  }
  convert (rawVisitor) {
    return Convert(this, Visitor(rawVisitor, this._subtypeMap))
  }
}
