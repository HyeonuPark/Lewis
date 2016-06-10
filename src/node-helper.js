import {concat} from 'iterlib'

import {Node} from './node'

export function spawnNode (origin, astData) {
  const {spec, parent} = origin
  return new Node(spec, astData, parent, origin)
}

export function getHandlerList (node, visitor, phase) {
  const {type} = node
  const handlers = node.handlers[phase]

  if (phase === 'enter') {
    return handlers::concat(visitor.get(type))
  }

  return handlers
}
