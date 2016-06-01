import {SpecBuilder} from './spec-helper'
import {createNode} from './node-helper'

export default function start () {
  const {define, getSpec} = SpecBuilder()

  return {
    define,
    buildSpec () {
      const spec = getSpec()

      return {
        spec,
        types: spec.factory,
        loadAst (ast) {
          return createNode(spec, ast)
        }
      }
    }
  }
}
