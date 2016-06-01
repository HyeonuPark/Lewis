import {Map as IMap, Set as ISet} from 'immutable'
import {map, toArray, resolve as iterable} from 'iterlib'

import {buildFactory} from './factory'
import {FMap} from './fmap'
import {primitiveTypes, unwrapNode, panic} from './util'

const primitiveMap = primitiveTypes::map(el => [el, [el]])::toArray()

export class Spec {
  constructor (rules) {
    const _subtypeMap = new FMap(() => [], primitiveMap)
    const factory = this.factory = Object.create(null)

    this.metadata = IMap().withMutations(_metadata => {
      for (let [type, {children, alias, scope, init}] of rules) {
        _subtypeMap.get(type).push(type)

        let ancestor = alias

        while (ancestor) {
          _subtypeMap.get(ancestor).push(type)
          const nextAncestor = rules.get(ancestor)
          ancestor = nextAncestor && nextAncestor.alias
        }

        _metadata.set(type, Object.freeze({children, scope, init}))

        if (children) {
          factory[type] = buildFactory(this, type, children)
        }
      }
    })

    this.subtypeMap = IMap().withMutations(map => {
      for (let [type, subtypeList] of _subtypeMap) {
        map.set(type, ISet(subtypeList))
      }
    })
  }
  has (type) {
    return this.metadata.has(type)
  }
  isAliasOf (maybeAlias, maybeSubtype) {
    const subtypeSet = this.subtypeMap.get(maybeAlias)
    return subtypeSet && subtypeSet.has(maybeSubtype)
  }
  getSubtypes (type) {
    return this.subtypeMap.get(type)
  }
  childrenOf (type) {
    const data = this.metadata.get(type)
    return iterable(data && data.children)
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
      return 'null'
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
