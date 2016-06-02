import {panic} from './util'

export function Convert (node, visitor) {
  const {type, children} = node

  // for LeafNode
  if (!children) {
    return node.unwrap()
  }

  const listHandler = visitor.get(type)
  if (!listHandler) {
    panic(`Converter for type ${type} not specified`)
  } else if (listHandler.length !== 1) {
    panic(`Duplicated converter for type ${type}`)
  }

  const handler = listHandler[0]

  const fakeChildren = new Map()

  for (let [name, child] of children) {
    if (Array.isArray(child)) {
      fakeChildren.set(name, child.map(each => Convert(each, visitor)))
    } else {
      fakeChildren.set(name, Convert(child, visitor))
    }
  }

  node.children = fakeChildren
  const result = handler(node)
  node.children = children

  return result
}
