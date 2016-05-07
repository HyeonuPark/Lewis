import {MapX} from './mapx'
import {reservedTypes, noop, assertType} from './util'
import {Spec} from './spec'

export function Grammar () {
  const typePool = new Set(reservedTypes)
  const structMap = new Map()
  const subtypeMap = new MapX(() => [])

  return {
    define (nodeType, children, {alias, validate = noop} = {}) {
      assertType(nodeType, 'string', 'Node type')

      if (reservedTypes.has(nodeType)) {
        throw new Error(`Cannot re-define reserved types: ${nodeType}`)
      }
      if (typePool.has(nodeType)) {
        throw new Error(`Duplicated type definition: ${nodeType}`)
      }
      typePool.add(nodeType)

      if (Array.isArray(children)) {
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

        structMap.set(nodeType, {children, validate})
      }

      if (typeof alias === 'string') {
        subtypeMap.get(alias).push(nodeType)
      }
    },
    buildSpec () {
      return Spec(typePool, structMap, subtypeMap)
    }
  }
}
