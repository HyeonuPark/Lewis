import {Map as IMap, Set as ISet, List as IList} from 'immutable'
import {map, indexed} from 'iterator-util'
import {Queue} from 'iterable-queue'

import {unwrapPath, createPath} from './path-helper'
import {
  assertType, assertNodeType,
  nodeTypeOf, flattenTypes
} from './util'

function checkNull (node) {
  if (nodeTypeOf(node) === 'null') {
    return null
  }
  return node
}

const makeFactoryFunc = (nodeType, children) => (...args) => {
  const node = {type: nodeType}

  for (let {index, value: {name, type, isArray}} of indexed(children)) {
    const given = unwrapPath(args[index])

    if (isArray) {
      assertType(given, 'array', `${nodeType} -> ${name}`)

      node[name] = given.map(givenElem => {
        assertNodeType(givenElem, type, `${nodeType} -> each ${name}`)
        return checkNull(givenElem)
      })
    } else {
      assertNodeType(given, type, `${nodeType} -> ${name}`)

      node[name] = checkNull(given)
    }
  }

  return node
}

function buildFactory (structMap) {
  const container = {}

  for (let [typeName, {children}] of structMap) {
    container[typeName] = makeFactoryFunc(typeName, children)
  }

  return container
}

export function Spec (typePool, _structMap, _subtypeMap) {
  const subtypeMap = IMap().withMutations(imap => {
    for (let eachType of typePool) {
      imap.set(eachType, ISet().withMutations(iset => {
        const queue = Queue(eachType)
        for (let subtype of queue) {
          if (iset.has(subtype)) {
            continue
          }
          iset.add(subtype)
          for (let subtypeOfSubtype of _subtypeMap.get(subtype)) {
            queue.add(subtypeOfSubtype)
          }
        }
      }))
    }
  })

  const structMap = IMap().withMutations(imap => {
    for (let [nodeType, {children, validate, childScope}] of _structMap) {
      const listChildren = IList(map(children,
        ({name, type, isArray, visitable}) => ({
          name,
          type: flattenTypes(type, subtypeMap),
          isArray,
          visitable
        })
      ))
      imap.set(nodeType, {validate, childScope, children: listChildren})
    }
  })

  return {
    types: buildFactory(structMap),
    loadAst (ast) {
      if (typeof ast !== 'string') {
        ast = JSON.stringify(ast)
      }

      const treeObj = JSON.parse(ast)
      return createPath(structMap, subtypeMap, treeObj)
    }
  }
}
