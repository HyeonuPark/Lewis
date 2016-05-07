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

  for (let eachVisitor of iterable(visitors)) {
    for (let [key, rawHandler] of Object.entries(eachVisitor)) {
      const {enter, exit} = normalizeHandler(rawHandler)
      const typeSet = flattenTypes(key.split('|'), subtypeMap)

      for (let type of typeSet) {
        if (enter) {
          enterMap.get(type).push(enter)
        }
        if (exit) {
          exitMap.get(type).push(exit)
        }
      }
    }
  }

  return {enter: enterMap, exit: exitMap}
}

export function replacePath (path, newNode) {
  
}
