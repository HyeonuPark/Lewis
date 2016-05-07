import {Queue} from 'iterable-queue'

import {Path} from './path'
import {ScopeContainer} from './scope'

export function* iterateChildren (path) {
  const {children, _structMap} = path

  for (let {name, isArray} of _structMap.get(type).children) {
    const child = children.get(name)

    if (isArray) {
      for (let elem of child) {
        yield {
          name,
          path: elem,
          isArray: true
        }
      }
    } else {
      yield {
        name,
        path: child,
        isArray: false
      }
    }
  }
}

export function* iterateDeep (path) {
  yield path

  const {children, _structMap} = path

  for (let {name, isArray} of _structMap.get(type).children) {
    const child = children.get(name)

    if (isArray) {
      for (let elem of child) {
        yield* elem.iterateDeep()
      }
    } else {
      yield* child.iterateDeep()
    }
  }
}

export function isPath (maybePath) {
  return maybePath instanceof Path
}

export function unwrapPath (maybePath) {
  if (Array.isArray(maybePath)) {
    return maybePath.map(unwrapPath)
  }
  if (isPath(maybePath)) {
    return maybePath.node
  }
  return maybePath
}

function _validatePath (path, queue) {
  if (path._scopeContainer) {
    return
  }

  for (let child of path.children.values()) {
    if (Array.isArray(child)) {
      for (let elem of child) {
        queue.add(elem)
      }
    } else {
      queue.add(child)
    }
  }

  const {parent, _validateFunc} = path

  if (parent && parent._scopeContainer) {
    path._scopeContainer = parent._scopeContainer
  } else {
    path._scopeContainer = ScopeContainer()
  }

  if (validateFunc) {
    const result = validateFunc(path)
    if (typeof result === 'string') {
      throw new Error(`ValidateError - ${result}`)
    }
  }

  path._isValid = true
}

export function validatePath (path) {
  const queue = Queue(path)
  for (let descendant of queue) {
    _validatePath(descendant, queue)
  }
}

export function childPath (parentPath, childNode) {
  const {_structMap, _subtypeMap} = parentPath
  return new Path(_structMap, _subtypeMap, childNode, parentPath)
}

export function clonePath (originPath, newNode) {
  const {_structMap, _subtypeMap, parent} = originPath
  return new Path(_structMap, _subtypeMap, newNode, parent)
}

export function createPath (structMap, subtypeMap, node, parent) {
  const path = new Path(structMap, subtypeMap, node, parent)
  validatePath(path)
  return path
}
