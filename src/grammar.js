import {MapX} from './mapx'
import {primitiveTypes, noop, assertType} from './util'
import {Spec} from './spec'

export function Grammar () {
  const typePool = new Set(primitiveTypes)
  const structMap = new Map()
  const subtypeMap = new MapX(() => [])

  return {
    define (nodeType, children, {alias, scope, validate = noop} = {}) {
      assertType(nodeType, 'string', 'Node type')
      assertType(children, ['array', 'null'], 'Children')
      assertType(alias, ['string', 'null'], 'Type alias')
      assertType(scope, ['string', 'null'], 'Scope type')
      assertType(validate, 'function', 'Node validator')

      if (primitiveTypes.has(nodeType)) {
        throw new Error(`Cannot re-define primitive types: ${nodeType}`)
      }
      if (typePool.has(nodeType)) {
        throw new Error(`Duplicated type definition: ${nodeType}`)
      }
      typePool.add(nodeType)

      if (children) {
        for (let child of children) {
          assertType(child.name, 'string', 'Child name')

          let childType = child.type
          if (!Array.isArray(childType)) {
            childType = [childType]
          }
          for (let eachType of childType) {
            assertType(eachType, 'string', 'Each child type')
          }

          child.type = new Set(childType)
          child.isArray = !!child.isArray             // default value is false
          child.visitable = child.visitable !== false // default value is true
        }

        structMap.set(nodeType, {children, validate, scope})
      }

      if (alias) {
        subtypeMap.get(alias).push(nodeType)
      }
    },
    buildSpec () {
      return Spec(typePool, structMap, subtypeMap)
    }
  }
}
