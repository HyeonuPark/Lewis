import {primitiveTypes, assertType, panic, noop} from './util'

export class Grammar extends Map {
  constructor () {
    super()

    for (let ptype of primitiveTypes) {
      this.set(ptype, {
        scope: 'skip',
        validate: noop
      })
    }
  }
  define (nodeType, children, {alias, scope = 'basic', validate = noop} = {}) {
    assertType(nodeType, 'string', 'Node type')
    assertType(children, ['array', 'null'], 'Children')
    assertType(alias, ['string', 'null'], 'Type alias')
    assertType(scope, 'string', 'Scope role')
    assertType(validate, 'function', 'Validator')

    if (this.has(nodeType)) {
      panic('Duplicated definition of node type')
    }

    if (children) {
      for (let child of children) {
        const {name, type, isArray = false, visitable = true} = child

        assertType(name, 'string', 'Child name')
        assertType(isArray, 'boolean', 'isArray flag')
        assertType(visitable, 'boolean', 'visitable flag')

        if (name === 'type') {
          panic('Property name "type" is reserved in Lewis')
        }

        const childType = Array.isArray(type) ? type : [type]

        for (let eachType of childType) {
          assertType(eachType, 'string', 'Child type')
        }

        child.type = childType
        child.isArray = isArray
        child.visitable = visitable
      }
    }

    this.set(nodeType, {children, alias, scope, validate})
  }
}
