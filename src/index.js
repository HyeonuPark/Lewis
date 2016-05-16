import {Grammar} from './grammar'
import {Spec} from './spec'
import {createNode} from './node-helper'

export default function start () {
  const grammar = new Grammar()

  return {
    define: grammar.define.bind(grammar),
    buildSpec () {
      const spec = new Spec(grammar)

      return {
        types: spec.factory,
        loadAst (ast) {
          return createNode(spec, ast)
        }
      }
    }
  }
}
