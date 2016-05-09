import {unwrapPath, clonePath, deletePath} from './path-helper'
import {primitiveTypes} from './util'
import {MapX} from './mapx'

const NOT_MODIFIED = 0
const DELETED = 1
const REPLACED = 2
const REPLACED_MULTIPLE = 3

function applyHandler (path, {handler, key}, stateMap) {
  const result = handler(path, stateMap.get(key))

  if (result === void 0) {
    return {
      flag: NOT_MODIFIED,
      path
    }
  }

  if (result === null) {
    const newPath = clonePath(path, null)
    deletePath(path)

    return {
      flag: DELETED,
      path: newPath
    }
  }

  const resultNode = unwrapPath(result)

  if (Array.isArray(resultNode)) {
    const newPath = resultNode.map(elem => clonePath(path, elem))
    deletePath(path)

    return {
      flag: REPLACED_MULTIPLE,
      path: newPath
    }
  }

  const newPath = clonePath(path, resultNode)
  deletePath(path)

  return {
    flag: REPLACED,
    path: newPath
  }
}

function applyHandlerList (path, listHandler, stateMap) {
  // primitive values will not be changed
  if (primitiveTypes.has(path.type)) {
    return {
      flag: NOT_MODIFIED,
      path
    }
  }

  for (let handler of listHandler) {
    const result = applyHandler(path, handler, stateMap)
    const {flag} = result

    if (flag !== NOT_MODIFIED) {
      return result
    }
  }
  return {
    flag: NOT_MODIFIED,
    path
  }
}

function transformPathList (listPath, callback, allowMultiple) {
  let curIndex = 0
  let modified = false

  while (curIndex < listPath.length) {
    const {flag, path} = callback(listPath[curIndex])

    if (flag === NOT_MODIFIED) {
      curIndex += 1

    } else if (flag === DELETED) {
      listPath.splice(curIndex, 1)
      if (!modified) {
        modified = true
      }
    } else if (flag === REPLACED_MULTIPLE) {
      if (!allowMultiple) {
        throw new Error('Multiple replacement is not allowed here')
      }
      listPath.splice(curIndex, 1, ...path)
      if (!modified) {
        modified = true
      }
    } else if (flag === REPLACED) {
      listPath.splice(curIndex, 1, path)
      if (!modified) {
        modified = true
      }
    }
  }

  if (modified) {
    return {flag: REPLACED_MULTIPLE, path: listPath}
  }
  return {flag: NOT_MODIFIED, path: listPath}
}

function applyPhase (path, visitor, phase, stateMap) {
  const handlerMap = visitor[phase]
  const {flag, path: [result]} = transformPathList([path],
    eachPath => applyHandlerList(
      eachPath,
      handlerMap.get(eachPath.type),
      stateMap
    )
  )

  if (flag === NOT_MODIFIED) {
    return {flag, path: result}
  }
  if (result == null) {
    return {flag: DELETED, path: clonePath(path, null)}
  }

  return {flag: REPLACED, path: result}
}

function transformPath (path, visitor, stateMap) {
  // enter phase
  const result = applyPhase(path, visitor, 'enter', stateMap)
  const {flag: enterFlag, path: newPath} = result

  if (enterFlag === DELETED) {
    return result
  }
  if (enterFlag === REPLACED) {
    const recurResult = transformPath(newPath, visitor, stateMap)
    const {flag: newFlag, path: newRecurPath} = recurResult

    if (newFlag === DELETED) {
      return recurResult
    }
    return {flag: REPLACED, path: newRecurPath}
  }

  // children phase
  const {type, children, _structMap} = path
  let modified = false

  // primitive types doesn't have children
  if (!primitiveTypes.has(type)) {
    for (let {name, isArray} of _structMap.get(type).children) {
      const child = children.get(name)

      if (isArray) {
        const {flag, path: newChildArray} = transformPathList(
          child,
          childPath => transformPath(childPath, visitor, stateMap),
          true
        )

        if (flag !== NOT_MODIFIED) {
          children.set(name, newChildArray)
          path.node[name] = newChildArray.map(_path => _path.node)
          if (!modified) {
            modified = true
          }
        }
      } else {
        const {flag, path: newPath} = transformPath(child, visitor, stateMap)

        if (flag !== NOT_MODIFIED) {
          children.set(name, newPath)
          path.node[name] = newPath.node
          if (!modified) {
            modified = true
          }
        }
      }
    }
  }

  // exit phase
  const exitResult = applyPhase(path, visitor, 'exit', stateMap)
  const {flag: exitFlag, path: exitPath} = exitResult

  if (exitFlag === DELETED || (!modified && exitFlag === NOT_MODIFIED)) {
    return exitResult
  }
  return {flag: REPLACED, path: exitPath}
}

export function Transform (path, visitor) {
  const stateMap = new MapX(() => new Map())
  return transformPath(path, visitor, stateMap).path
}
