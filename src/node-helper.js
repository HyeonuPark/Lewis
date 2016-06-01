import {resolve as iterable} from 'iterlib'

import {Node} from './node'
import {primitiveTypes, panic} from './util'

function initializeNode (node) {
  const {spec, type} = node

  if (primitiveTypes.has(type)) {
    return node
  }

  const {scope, init} = spec.metadata.get(type)

  if (scope === 'skip') {
    return node
  }

  if (scope === 'basic') {
    const err = init(node)

    if (err) {
      panic(err)
    }

    for (let {name} of spec.childrenOf(type)) {
      for (let child of iterable(node.get(name))) {
        initializeNode(child)
      }
    }

    return node
  }
}

export function createNode (spec, astData) {
  return initializeNode(new Node(spec, astData))
}
