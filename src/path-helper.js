import {Queue} from 'iterable-queue'

import {Path} from './path'
import {ScopeContainer} from './scope'

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

  const {parent, _validateFunc, _scopeType} = path

  const parentContainer = parent && parent._scopeContainer
  path._scopeContainer = new ScopeContainer(parentContainer, _scopeType)

  if (_validateFunc) {
    const result = _validateFunc(path)
    if (typeof result === 'string') {
      throw new Error(`ValidateError - ${result}`)
    }
  }
}

export function validatePath (path) {
  const queue = Queue(path)
  for (let descendant of queue) {
    _validatePath(descendant, queue)
  }
  return path
}

export function childPath (parentPath, childNode) {
  const {_structMap, _subtypeMap} = parentPath
  const newPath = new Path(_structMap, _subtypeMap, childNode, parentPath)
  validatePath(newPath)
  return newPath
}

export function clonePath (originPath, newNode) {
  const {_structMap, _subtypeMap, parent} = originPath
  const newPath = new Path(_structMap, _subtypeMap, newNode, parent)
  validatePath(newPath)
  return newPath
}

export function createPath (structMap, subtypeMap, node, parent) {
  const path = new Path(structMap, subtypeMap, node, parent)
  validatePath(path)
  return path
}

export function deletePath (path) {
  path._scopeContainer.delete()
}
