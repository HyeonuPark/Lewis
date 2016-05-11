import {Map as IMap, Set as ISet} from 'immutable'
import {map, concat} from 'iterator-util'
import detectType from 'type-detect'

import {unwrapPath} from './path-helper'

export const primitiveTypes = new Set([
  'null', 'string', 'boolean',
  'number', 'object', 'root'
])

export function noop () {}

export function isValidType (value, type) {
  if (Array.isArray(type)) {
    return type.some(elem => isValidType(value, elem))
  }

  const detectedRaw = detectType(value)
  const detected = detectedRaw === 'undefined'
    ? 'null'
    : detectedRaw

  if (type === detected) {
    return true
  }

  if (detectedRaw === 'null') {
    return false
  }

  return typeof value === type
}

export function assertType (value, type, typeName = 'Type', msg) {
  if (!isValidType(value, type)) {
    let errMsg = `${typeName} should be ${type} but got ${detectType(value)}`
    if (msg) {
      errMsg += ` - ${msg}`
    }
    throw new Error(errMsg)
  }
}

export function nodeTypeOf (_maybeNode) {
  const maybeNode = unwrapPath(_maybeNode)
  const typeofNode = typeof maybeNode
  if (
    maybeNode == null ||
    typeofNode === 'function' ||
    typeofNode === 'symbol'
  ) {
    return 'null'
  }
  if (typeofNode !== 'object' && primitiveTypes.has(typeofNode)) {
    return typeofNode
  }
  const nodeType = maybeNode.type
  if (typeof nodeType !== 'string' || primitiveTypes.has(nodeType)) {
    return 'object'
  }
  return nodeType
}

export function assertNodeType (node, typeSet, typeName) {
  const nodeType = nodeTypeOf(node)
  if (!typeSet.has(nodeType)) {
    throw new Error(`${typeName}'s type shouldn't be ${nodeType}`)
  }
}

export function flattenTypes (typeSet, subtypeMap) {
  return ISet(concat(...map(typeSet, eachType => subtypeMap.get(eachType))))
}
