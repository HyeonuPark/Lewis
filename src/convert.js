import {panic} from './util'

export function Convert (node, visitor) {
  const {type, _children} = node

  // for LeafNode
  if (!_children) {
    return node.unwrap()
  }

  const handlerList = visitor.get(type)
  if (!handlerList || handlerList.length === 0) {
    panic(`Converter for type ${type} not specified`)
  } else if (handlerList.length > 1) {
    panic(`Duplicated converter for type ${type}`)
  }

  const {handler} = handlerList[0]

  const fakeChildren = new Map()

  for (let [name, child] of _children) {
    if (Array.isArray(child)) {
      fakeChildren.set(name, child.map(each => Convert(each, visitor)))
    } else {
      fakeChildren.set(name, Convert(child, visitor))
    }
  }

  node._children = fakeChildren
  const result = handler(node)
  node._children = _children

  return result
}
