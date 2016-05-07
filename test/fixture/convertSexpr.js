import {expect} from 'chai'
import {Map as IMap} from 'immutable'
import lewis from '../../src/index'

describe('#fixture# Convert to sexpr', () => {
  const {define, buildSpec} = lewis()

  define('Sexpr', [
    {
      name: 'body',
      type: ['string', 'Sexpr'],
      isArray: true
    }
  ])

  const {types: t, loadAst} = buildSpec()

  const visitor = {
    Sexpr (path) {
      const code = path.get('body').join(' ')
      return `(${code})`
    }
  }

  it('should convert ast to sexpr', () => {
    const ast = t.Sexpr(['a', 'b', t.Sexpr(['c', 'd']), 'e'])
    const sexpr = loadAst(ast).convert(visitor)
    expect(sexpr).to.equal('(a b (c d) e)')
  })
})
