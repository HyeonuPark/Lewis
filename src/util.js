import {Set as ISet} from 'immutable'
import detectType from 'type-detect'
import {resolve as iterable} from 'iterlib'

export function noop () {}
export function getSelf () { return this }
export function getFalse () { return false }

export function panic (msg, meta) {
  const err = new Error(msg)
  if (meta) {
    Object.assign(err, meta)
  }
  throw err
}

export const primitiveTypes = ISet([
  'null', 'number', 'boolean',
  'string', 'root'
])

export function isTypeOf (value, type) {
  const valueType = typeof value
  const detectedType = detectType(value)

  if (type === detectedType) {
    return true
  }

  if (value == null) {
    return type === 'null'
  }

  return type === valueType
}

export function assertType (value, types, valueName) {
  for (let eachType of iterable(types)) {
    if (isTypeOf(value, eachType)) {
      return
    }
  }

  const actualType = detectType(value)
  panic(`Expected ${valueName} to ${types}, but got ${actualType}`)
}

export function assertOneOf (value, possibles, valueName) {
  for (let each of iterable(possibles)) {
    if (each === value) {
      return
    }
  }

  panic(`Expected ${valueName} to ${possibles}, but got ${value}`)
}

export function unwrapNode (maybeNode) {
  if (Array.isArray(maybeNode)) {
    return maybeNode.map(unwrapNode)
  }

  if (maybeNode && typeof maybeNode.unwrap === 'function') {
    return maybeNode.unwrap()
  }

  const typeofNode = typeof maybeNode

  if (
    typeofNode === 'number' ||
    typeofNode === 'boolean' ||
    typeofNode === 'string'
  ) {
    return maybeNode
  }

  if (
    maybeNode ||
    typeofNode === 'object' ||
    maybeNode.type ||
    typeof maybeNode.type === 'string'
  ) {
    return maybeNode
  }

  return null
}
