import {indexed} from 'iterlib'

import {unwrapNode, assertType} from './util'

export const buildFactory = (spec, type, children) => (...args) => {
  const node = {type}

  for (let {
    index,
    value: {
      name,
      type: childType,
      isArray
    }
  } of children::indexed()) {
    const given = unwrapNode(args[index])

    if (isArray) {
      assertType(given, 'array', `${type} -> ${name}`)

      for (let eachGiven of given) {
        spec.assertType(eachGiven, childType, `${type} -> Each ${name}`)
      }
    } else {
      spec.assertType(given, childType, `${type} -> ${name}`)
    }

    node[name] = given
  }

  return node
}
