import {map} from 'iterlib'

import {spawnNode} from './node-helper'
import {reservedTypes, panic} from './util'

const NOT_MODIFIED = 'NOT_MODIFIED'
const DELETED = 'DELETED'
const REPLACED = 'REPLACED'
const REPLACED_MULTIPLE = 'REPLACED_MULTIPLE'

function applyHandler (node, handler) {
  const result = handler(node)

  if (result === void 0) {
    return {flag: NOT_MODIFIED, result: node}
  }

  if (result === null) {
    return {flag: DELETED, result}
  }

  if (Array.isArray(result)) {
    return {
      flag: REPLACED_MULTIPLE,
      result: result::map(el => spawnNode(node, el))
    }
  }

  return {flag: REPLACED, result: spawnNode(node, result)}
}

function applyHandlerList (node, handlerList) {
  for (let handler of handlerList) {
    const {flag, result} = applyHandler(node, handler)

    if (flag === DELETED) {
      return {flag, result: null}
    }

    if (flag === REPLACED || flag === REPLACED_MULTIPLE) {
      return {flag, result}
    }
  }

  return {flag: NOT_MODIFIED, result: node}
}

function traverseNode (node, visitor, debugInfo) {
  const {type, spec} = node

  // for LeafNode
  if (reservedTypes.has(type)) {
    return {flag: NOT_MODIFIED, result: node}
  }

  // enter phase
  {
    const handlerList = visitor.enter(type)
    const {flag, result} = applyHandlerList(node, handlerList)

    if (flag !== NOT_MODIFIED) {
      return {flag, result}
    }
  }

  // children traverse phase

  const {_children} = node
  for (let {name, type: childType, hidden, isArray} of spec.childrenOf(type)) {
    if (hidden) {
      continue
    }

    const child = _children.get(name)
    const childPos = `${type} -> ${isArray ? 'Each ' : ''}${name}`

    if (isArray && Array.isArray(child)) {
      const {flag, result} = traverseMultiple(child, visitor, childPos)

      if (flag !== NOT_MODIFIED) {
        for (let eachResult of result) {
          spec.assertType(eachResult, childType, childPos)
        }
      }
    } else if (!isArray && !Array.isArray(child)) {
      const {flag, result} = traverseSingle(child, visitor, childPos)

      if (flag !== NOT_MODIFIED) {
        spec.assertType(result, childType, childPos)
        _children.set(name, result)
      }
    } else {
      const mustArray = isArray ? '' : 'not '
      panic(`${type} -> ${name} must ${mustArray}be an array`)
    }
  }

  // exit phase
  {
    const handlerList = visitor.exit(type)
    const {flag, result} = applyHandlerList(node, handlerList)

    if (flag !== NOT_MODIFIED) {
      return {flag, result}
    }
  }

  return {flag: NOT_MODIFIED, result: node}
}

function traverseSingle (node, visitor, debugInfo) {
  let {flag, result} = traverseNode(node, visitor, debugInfo)

  if (flag === NOT_MODIFIED) {
    return {flag, result}
  }

  while (flag === REPLACED) {
    ;({flag, result} = traverseNode(result, visitor, debugInfo))
  }

  if (flag === REPLACED_MULTIPLE) {
    panic(`Multiple replacement is not allowed at ${debugInfo}`)
  }

  if (flag === DELETED) {
    return {flag: REPLACED, result: spawnNode(node, null)}
  }

  return {flag: REPLACED, result}
}

function traverseMultiple (nodeList, visitor, debugInfo) {
  let curIndex = 0
  let modified = false

  while (curIndex < nodeList.length) {
    const node = nodeList[curIndex]
    const {flag, result} = traverseNode(node, visitor, debugInfo)

    if (flag !== NOT_MODIFIED && !modified) {
      modified = true
    }

    if (flag === DELETED) {
      nodeList.splice(curIndex, 1)
    } else if (flag === REPLACED) {
      nodeList.splice(curIndex, 1, result)
    } else if (flag === REPLACED_MULTIPLE) {
      nodeList.splice(curIndex, 1, ...result)
    } else {
      // flag === NOT_MODIFIED
      curIndex += 1
    }
  }

  return {
    flag: modified ? REPLACED_MULTIPLE : NOT_MODIFIED,
    result: nodeList
  }
}

export function Traverse (node, visitor) {
  const {flag, result} = traverseNode(node, visitor, 'Root node')

  if (flag === DELETED) {
    return spawnNode(node, null)
  }

  if (flag === REPLACED_MULTIPLE) {
    return [...result]
  }

  return result
}
