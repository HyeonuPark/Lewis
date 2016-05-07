export function Search (path, visitor) {
  const {type} = path
  const handlerList = visitor.enter.get(type)

  for (let handler of handlerList) {
    handler(path)
  }

  for (let {path: childPath} of path.iterateChildren()) {
    Search(childPath, visitor)
  }
}
