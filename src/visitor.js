import {indexed} from 'iterlib'
import {Map as IMap} from 'immutable'

import {FMap} from './fmap'

export function Visitor (spec, rawVisitor) {
  const visitor = new FMap(() => [])

  for (let {index, value: eachVisitor} of rawVisitor::indexed()) {
    for (let target of Object.keys(eachVisitor)) {
      const handler = eachVisitor[target]

      if (spec.has(target) && typeof handler === 'function') {
        visitor.get(target).push({key: index, handler})
      }
    }
  }

  return IMap(visitor)
}
