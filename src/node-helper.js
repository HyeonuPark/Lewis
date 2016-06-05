import {resolve as iterable, concat} from 'iterlib'

import {Node} from './node'
import {primitiveTypes} from './util'

export function initializeNode (node) {
  const {spec, type} = node

  if (primitiveTypes.has(type)) {
    return node
  }

  const {scope, init} = spec.metadata.get(type)

  if (scope === 'skip') {
    return node
  }

  if (scope === 'basic') {
    init(node)

    for (let {name} of spec.childrenOf(type)) {
      for (let child of iterable(node.get(name))) {
        initializeNode(child)
      }
    }
  }

  return node
}

export function spawnNode (origin, astData) {
  const {spec, parent} = origin
  const node = new Node(spec, astData, parent)
  initializeNode(node)
  return node
}

export function getHandlerList (node, visitor, phase) {
  const {type} = node
  const handlers = node.handlers[phase]

  if (phase === 'enter') {
    return handlers::concat(visitor.get(type))
  }

  return handlers
}

export function leaveNode (node, stateMap) {
  const {type} = node

  if (primitiveTypes.has(type)) {
    return
  }

  for (let {handler, key} of node.handlers.last) {
    handler(stateMap.get(key))
  }
}
