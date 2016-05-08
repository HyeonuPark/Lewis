import {reservedTypes, nodeTypeOf} from './util'
import {MapX} from './mapx'

export function Convert (path, visitor) {
  const {type, children, _structMap} = path

  if (reservedTypes.has(type)) {
    return path.node
  }

  const handlerList = visitor.enter.get(type)
  const handlersLength = handlerList.length
  if (handlersLength !== 1) {
    const msg = `Visitor have ${handlersLength} handlers for ${type}, expect 1`
    throw new Error(msg)
  }
  const {handler} = handlerList[0]

  const tmpChildren = new Map()

  for (let {name, isArray} of _structMap.get(type).children) {
    const childPath = children.get(name)

    if (isArray) {
      const newChildArray = childPath.map(path => Convert(path, visitor))
      tmpChildren.set(name, newChildArray)

    } else {
      const newChild = Convert(childPath, visitor)
      tmpChildren.set(name, newChild)
    }
  }

  path.children = tmpChildren
  const result = handler(path)
  path.children = children

  return result
}
