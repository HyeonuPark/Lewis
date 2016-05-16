import {Map as IMap, Set as ISet} from 'immutable'
import {indexed, resolve as iterable} from 'iterator-util'

import {buildFactory} from './factory'
import {FMap} from './fmap'
import {unwrapNode, panic} from './util'

export class Spec {
  constructor (grammar) {
    const _subtypeMap = new FMap(() => [])
    const _metadata = new Map()
    const factory = this.factory = Object.create(null)

    for (let [type, {children, alias, scope, validate}] of grammar) {
      _subtypeMap.get(type).push(type)
      let ancestor = alias

      while (ancestor) {
        _subtypeMap.get(ancestor).push(type)
        const nextAncestor = grammar.get(ancestor)
        ancestor = nextAncestor && nextAncestor.alias
      }

      _metadata.set(type, {scope, validate})

      if (children) {
        factory[type] = buildFactory(this, type, children)
      }
    }

    this.subtypeMap = IMap().withMutations(map => {
      for (let [type, subtypeList] of _subtypeMap) {
        map.set(type, ISet(subtypeList))
      }
    })

    this.metadata = IMap(_metadata)
  }
  isAliasOf (maybeAlias, maybeSubtype) {
    return this.subtypeMap.get(maybeAlias).has(maybeSubtype)
  }
  getSubtypes (type) {
    return this.subtypeMap.get(type)
  }
  typeOf (valueOrNode) {
    const value = unwrapNode(valueOrNode)
    const {subtypeMap} = this
    const typeOfValue = typeof value

    if (
      typeOfValue === 'number' ||
      typeOfValue === 'boolean' ||
      typeOfValue === 'string'
    ) {
      return typeOfValue
    }

    if (!value || typeOfValue !== 'object') {
      return 'null'
    }

    const valueType = value.type

    if (typeof valueType !== 'string' || !subtypeMap.has(valueType)) {
      return 'object'
    }

    return valueType
  }
  assertType (value, types, valueName) {
    const valueType = this.typeOf(value)

    for (let eachType of iterable(types)) {
      if (this.isAliasOf(eachType, valueType)) {
        return
      }
    }

    panic(`Expected ${valueName} to ${types}, but got ${valueType}`)
  }
}
