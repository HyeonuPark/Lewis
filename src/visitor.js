import {Map as IMap} from 'immutable'
import {resolve as iterable} from 'iterator-util'

import {flattenTypes} from './util'
import {MapX} from './mapx'

function normalizeHandler (rawHandler) {
  if (!rawHandler) {
    return {}
  }
  if (typeof rawHandler === 'function') {
    return {enter: rawHandler}
  }

  let {enter, exit} = rawHandler
  if (typeof enter !== 'function') {
    enter = null
  }
  if (typeof exit !== 'function') {
    exit = null
  }

  return {enter, exit}
}

export function Visitor (visitors, subtypeMap) {
  const enterMap = new MapX(() => [])
  const exitMap = new MapX(() => [])
  let stateKey = 0

  for (let eachVisitor of iterable(visitors)) {
    stateKey += 1
    
    for (let [typeName, rawHandler] of Object.entries(eachVisitor)) {
      const {enter, exit} = normalizeHandler(rawHandler)
      const typeSet = flattenTypes(typeName.split('|'), subtypeMap)
      const enterObj = {key: stateKey, handler: enter}
      const exitObj = {key: stateKey, handler: exit}

      for (let type of typeSet) {
        if (enter) {
          enterMap.get(type).push(enterObj)
        }
        if (exit) {
          exitMap.get(type).push(exitObj)
        }
      }
    }
  }

  return {enter: enterMap, exit: exitMap}
}
