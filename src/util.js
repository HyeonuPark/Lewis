import {Set as ISet} from 'immutable'
import detectType from 'type-detect'
import {resolve as iterable} from 'iterator-util'

export function noop () {}

export function panic (msg, meta) {
  const err = new Error(msg)
  if (meta) {
    Object.assign(err, meta)
  }
  throw err
}

export const primitiveTypes = ISet([
  'null', 'number', 'boolean',
  'string', 'object', 'root'
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
  throw new Error(`Expected ${valueName} to ${types}, but got ${actualType}`)
}

export function unwrapNode (maybeNode) {
  if (Array.isArray(maybeNode)) {
    return maybeNode.map(unwrapNode)
  }
  if (typeof maybeNode.unwrap === 'function') {
    return maybeNode.unwrap()
  }
  return maybeNode
}
