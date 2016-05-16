
export class Node {
  constructor () {

  }
  unwrap () {

  }
  get (name, index) {

  }
  is (alias) {
    
  }
  scope (type) {

  }
  transform (rawVisitor) {

  }
  convert (rawVisitor) {

  }
}

class LeafNode {
  constructor (value, spec) {
    this.value = value
    this.spec = spec

    Object.freeze(this)
  }
  unwrap () {
    return this.value
  }
  get () {
    return
  }
  is (nodeType) {

  }
  scope (type) {

  }
  transform (rawVisitor) {

  }
  convert () {

  }
}
