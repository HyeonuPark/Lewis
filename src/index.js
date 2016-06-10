import {SpecBuilder} from './spec-helper'
import {Node} from './node'

module.exports = function start () {
  const {define, getSpec} = SpecBuilder()

  return {
    define,
    buildSpec () {
      const spec = getSpec()

      return {
        spec,
        types: spec.factory,
        loadAst (ast) {
          return new Node(spec, ast)
        }
      }
    }
  }
}
