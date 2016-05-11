import {Queue} from 'iterable-queue'

import {Path} from './path'
import {ScopeContainer} from './scope'
import {primitiveTypes} from './util'

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

function execValidator (path, {validate, childScope}, deferred) {
  const parentContainer = path.parent && path.parent._scopeContainer
  path._scopeContainer = new ScopeContainer(parentContainer, childScope)

  if (typeof validate === 'function') {
    const result = validate(path)

    if (typeof result === 'string') {
      const stack = path._scopeContainer.getScopeStackReport()
      throw new Error(`ValidateError - ${result}\n${stack}`)
    }
  }

  for (let child of path.children.values()) {
    if (Array.isArray(child)) {
      for (let elem of child) {
        prepareValidation(elem, deferred)
      }
    } else {
      prepareValidation(child, deferred)
    }
  }
}

function prepareValidation (path, deferred) {
  const {type, parent, _structMap} = path

  if (primitiveTypes.has(type)) {
    return
  }

  const struct = _structMap.get(type)
  const {lazy} = struct

  if (lazy) {
    deferred.push(path)
  } else {
    execValidator(path, struct, deferred)
  }
}

function validateScopedPath (path) {
  const {_structMap, type} = path

  const struct = _structMap.get(type)

  const deferred = []
  execValidator(path, struct, deferred)

  for (let deferredPath of deferred) {
    validateScopedPath(deferredPath)
  }
}

function getPseudoRoot (originPath) {
  return {
    type: 'root',
    _structMap: {
      get: () => ({childScope: true, lazy: true})
    },
    children: {
      values: () => [originPath]
    }
  }
}

export function validatePath (path) {
  const {_structMap, type} = path

  if (primitiveTypes.has(type)) {
    return
  }

  const {lazy} = _structMap.get(type)

  if (lazy) {
    validateScopedPath(path)
  } else {
    validateScopedPath(getPseudoRoot(path))
  }
}

function getPseudoRoot (originPath) {
  return {
    type: 'root',
    _structMap: {
      get: () => ({childScope: true, lazy: true})
    },
    children: {
      values: () => [originPath]
    }
  }
}

export function childPath (parentPath, childNode, skipValidation) {
  const {_structMap, _subtypeMap} = parentPath
  const newPath = new Path(_structMap, _subtypeMap, childNode, parentPath)

  if (!skipValidation) {
    validatePath(newPath)
  }
  return newPath
}

export function clonePath (originPath, newNode, skipValidation) {
  const {_structMap, _subtypeMap, parent} = originPath
  const newPath = new Path(_structMap, _subtypeMap, newNode, parent)

  if (!skipValidation) {
    validatePath(newPath)
  }
  return newPath
}

export function createPath (structMap, subtypeMap, node, parent) {
  const path = new Path(structMap, subtypeMap, node, parent)
  validatePath(path)
  return path
}

export function unmountPath (path) {
  path._scopeContainer.unmount()
}
