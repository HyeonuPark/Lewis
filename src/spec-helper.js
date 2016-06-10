import {map, toArray} from 'iterlib'

import {Spec} from './spec'
import {reservedTypes, panic, assertType, assertOneOf} from './util'

export function SpecBuilder () {
  const rules = new Map(reservedTypes::map(t => [t, {role: 'basic'}]))

  return {
    define (nodeType, _children, {alias = 'Node', role = 'basic'} = {}) {
      if (rules.has(nodeType)) {
        panic(`Duplicated node definition of ${nodeType}`)
      }

      assertType(nodeType, 'string', 'Node type')
      assertType(_children, ['array', 'null'], 'Children')
      assertType(alias, ['string', 'null'], 'Type alias')
      assertOneOf(role, ['basic', 'child', 'lazy'], 'Role')

      const children = (_children || [])
        .map(({name, type, isArray = false, hidden = false}) => {
          assertType(name, 'string', 'Child name')
          assertType(type, ['array', 'string'], 'Child type')
          assertType(isArray, 'boolean', 'Child isArray flag')
          assertType(hidden, 'boolean', 'Child hidden flag')

          return {name, type: type::toArray(), isArray, hidden}
        })

      rules.set(nodeType, {children, alias, role})
    },
    getSpec () {
      return new Spec(rules)
    }
  }
}
