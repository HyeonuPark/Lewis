import {resolve as iterable} from 'iterlib'
import {Map as IMap} from 'immutable'

import {FMap} from './fmap'

export function Visitor (spec, rawVisitor) {
  const visitor = new FMap(() => [])

  for (let eachVisitor of iterable(rawVisitor)) {
    for (let key of Object.keys(eachVisitor)) {
      const handler = eachVisitor[key]

      if (spec.has(key) && typeof handler === 'function') {
        visitor.get(key).push(handler)
      }
    }
  }

  return IMap(visitor)
}
