import {FMap} from './fmap'

function * searchUp (start) {
  yield start
  let link = start

  while (link && link.next) {
    link = link.next
    yield link
  }
}

function * searchDown (start) {
  yield start
  let link = start

  while (link && link.prev) {
    link = link.prev
    yield link
  }
}

function * search (start) {
  for (let {type, data} of searchUp(start)) {
    if (type === 'head') {
      yield data
    }
  }
}

function * searchDeep (start) {
  for (let {type, data, branch} of searchDown(start)) {
    if (type === 'head') {
      yield data
    } else if (type === 'child') {
      yield * searchDeep(branch)
    }
  }
}

function createPair () {
  const head = {
    type: 'head',
    prev: null,
    next: null,
    data: new FMap(() => new Map())
  }
  const tail = {
    type: 'tail',
    prev: null,
    next: null
  }

  head.prev = tail
  tail.next = head

  return {head, tail}
}

class Namespace {
  constructor (scope, type) {
    this.scope = scope
    this.type = type
  }
  set (key, value) {
    const {scope: {head: {data}}, type} = this
    data.get(type).set(key, {exists: true, value})
    return this
  }
  query (key) {
    const {scope: {tail}, type} = this

    for (let data of search(tail)) {
      const result = data.get(type).get(key)

      if (result) {
        return result
      }
    }

    return {exists: false}
  }
  get (key) {
    const {exists, value} = this.query(key)

    if (exists) {
      return value
    }
  }
  has (key) {
    return this.query(key).exists
  }
  hasOwn (key) {
    const {scope: {tail}, type: nsType} = this

    for (let link of searchUp(tail)) {
      const {type, data, next} = link

      if (type === 'head') {
        const result = data.get(nsType).get(key)

        if (result) {
          return true
        }

        if (next && next.prev !== link) {
          return false
        }
      }
    }

    return false
  }
  hasDeep (key) {
    if (this.has(key)) {
      return true
    }

    const {scope: {head}, type} = this

    for (let data of searchDeep(head)) {
      const result = data.get(type).get(key)

      if (result) {
        return true
      }
    }

    return false
  }
  uid (base = 'tmp') {
    let count = 0
    let str = `${base}_${count}_`

    while (this.has(str) || this.hasDeep(str)) {
      count += 1
      str = `${base}_${count}_`
    }

    return str
  }
}

class BaseScope {
  constructor (role, parent) {
    this.role = role
    this.namespaceMap = new FMap(type => new Namespace(this, type))
    this.parent = parent || createPair()

    const {head, tail} = createPair()
    this.head = head
    this.tail = tail
    this.anchor = null

    Object.seal(this)
  }
  get (scopeType) {
    const {namespaceMap} = this
    return namespaceMap.get(scopeType)
  }
}

class BasicScope extends BaseScope {
  constructor (_parent, prevScope) {
    super('basic', _parent)
    const {head, tail, parent} = this

    const prev = prevScope ? prevScope.prev() : parent.tail
    const next = prevScope ? prevScope.next() : parent.tail.next

    prev.next = tail
    tail.prev = prev

    next.prev = head
    head.next = next
  }
  prev () {
    return this.tail.prev
  }
  next () {
    return this.head.next
  }
}

class ChildScope extends BaseScope {
  constructor (role, _parent, prevScope) {
    super(role, _parent)
    const {parent, head} = this

    const prev = prevScope ? prevScope.prev() : parent.tail
    const next = prevScope ? prevScope.next() : parent.tail.next

    const anchor = this.anchor = {
      type: 'child',
      prev,
      next,
      branch: head
    }

    prev.next = anchor
    next.prev = anchor

    if (role === 'child') {
      head.next = anchor
    } else if (role === 'lazy') {
      let link = anchor

      while (link.prev) {
        link = link.prev
      }

      head.next = link
    }
  }
  prev () {
    return this.anchor.prev
  }
  next () {
    return this.anchor.next
  }
}

export function Scope (role, parent, prevScope) {
  if (role === 'basic') {
    return new BasicScope(parent, prevScope)
  } else {
    return new ChildScope(role, parent, prevScope)
  }
}
