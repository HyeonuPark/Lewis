import {resolve as iterable} from 'iterlib'

import {FMap} from './fmap'

export function Visitor (spec, rawVisitor) {
  const enterMap = new FMap(() => [])
  const exitMap = new FMap(() => [])

  for (let eachVisitor of iterable(rawVisitor)) {
    for (let target of Object.keys(eachVisitor)) {
      const handler = eachVisitor[target]

      if (!spec.has(target) || !handler) {
        continue
      }

      if (typeof handler === 'function') {
        enterMap.get(target).push(handler)
        exitMap.get(target).push(handler)
      }

      const {enter, exit} = handler

      if (typeof enter === 'function') {
        enterMap.get(target).push(enter)
      }

      if (typeof exit === 'function') {
        exitMap.get(target).push(enter)
      }
    }
  }

  return {
    enter (type) {
      return enterMap.get(type)
    },
    exit (type) {
      return exitMap.get(type)
    }
  }
}
