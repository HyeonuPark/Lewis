import {map} from 'iterlib'

import {leaveNode, spawnNode, getHandlerList} from './node-helper'
import {State} from './state'
import {FMap} from './fmap'
import {primitiveTypes, panic} from './util'

const NOT_MODIFIED = 'NOT_MODIFIED'
const DELETED = 'DELETED'
const REPLACED = 'REPLACED'
const REPLACED_MULTIPLE = 'REPLACED_MULTIPLE'

function applyHandler (node, {handler, key}, state) {
  const result = handler(node, state.get(key))

  if (result === void 0 || result === node) {
    return {flag: NOT_MODIFIED, result: node}
  }

  if (result === null) {
    return {flag: DELETED, result}
  }

  if (Array.isArray(result)) {
    return {
      result: result::map(el => spawnNode(node, el)),
      flag: REPLACED_MULTIPLE
    }
  }

  return {flag: REPLACED, result: spawnNode(node, result)}
}

function applyHandlerList (node, handlerList, state) {
  for (let handler of handlerList) {
    const {flag, result} = applyHandler(node, handler, state)

    if (flag === DELETED) {
      return {flag, result: null}
    }

    if (flag === REPLACED || flag === REPLACED_MULTIPLE) {
      return {flag, result}
    }
  }

  return {flag: NOT_MODIFIED, result: node}
}

function transformNode (node, visitor, state, debugInfo) {
  const {type, spec} = node

  // for LeafNode
  if (primitiveTypes.has(type)) {
    return {flag: NOT_MODIFIED, result: node}
  }

  // enter phase
  {
    const handlerList = getHandlerList(node, visitor, 'enter')
    const {flag, result} = applyHandlerList(node, handlerList, state)

    if (flag !== NOT_MODIFIED) {
      leaveNode(node)
      return {flag, result}
    }
  }

  // children transformation phase

  const {_children} = node
  for (let {name, type: childType, hidden, isArray} of spec.childrenOf(type)) {
    if (hidden) {
      continue
    }

    const child = _children.get(name)
    const childPos = `${type} -> ${isArray ? 'Each ' : ''}${name}`

    if (isArray && Array.isArray(child)) {
      const {flag, result} = transformMultiple(child, visitor, state, childPos)

      if (flag !== NOT_MODIFIED) {
        for (let eachResult of result) {
          spec.assertType(eachResult, childType, childPos)
        }
      }
    } else if (!isArray && !Array.isArray(child)) {
      const {flag, result} = transformSingle(child, visitor, state, childPos)

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
    const handlerList = getHandlerList(node, visitor, 'enter')
    const {flag, result} = applyHandlerList(node, handlerList, state)

    leaveNode(node)

    if (flag !== NOT_MODIFIED) {
      return {flag, result}
    }

    return {flag: NOT_MODIFIED, result: node}
  }
}

function transformSingle (node, visitor, state, debugInfo) {
  let {flag, result} = transformNode(node, visitor, state, debugInfo)

  if (flag === NOT_MODIFIED) {
    return {flag, result}
  }

  while (flag === REPLACED) {
    ;({flag, result} = transformNode(result, visitor, state, debugInfo))
  }

  if (flag === REPLACED_MULTIPLE) {
    panic(`Multiple replacement is not allowed at ${debugInfo}`)
  }

  if (flag === DELETED) {
    return {flag: REPLACED, result: spawnNode(node, null)}
  }

  return {flag: REPLACED, result}
}

function transformMultiple (nodeList, visitor, state, debugInfo) {
  let curIndex = 0
  let modified = false

  while (curIndex < nodeList.length) {
    const node = nodeList[curIndex]
    const {flag, result} = transformNode(node, visitor, state, debugInfo)

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

export function Transform (node, visitor) {
  const state = new FMap(() => new State())
  const {flag, result} = transformNode(node, visitor, state, 'Root node')

  if (flag === DELETED) {
    return spawnNode(node, null)
  }

  if (flag === REPLACED_MULTIPLE) {
    return [...result]
  }

  return result
}
