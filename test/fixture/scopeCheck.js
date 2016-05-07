import {expect} from 'chai'
import lewis from '../../src/index'

describe('#fixture# Check scope to validate namespace', () => {
  const {define, buildSpec} = lewis()

  define('Node')

  define('Block', [
    {
      name: 'body',
      type: 'Node',
      isArray: true
    }
  ], {
    alias: 'Node',
    validate (path) {
      path.childScope()
    }
  })

  define('Identifier', [
    {
      name: 'id',
      type: 'string'
    },
    {
      name: 'declare',
      type: 'boolean'
    }
  ], {
    alias: 'Node',
    validate (path) {
      const idScope = path.scope('id')
      const id = path.get('id').node

      if (path.get('declare').node) {
        if (idScope.hasOwn(id)) {
          return `duplicated declaration within same scope: ${id}`
        }
        idScope.set(id, true)
        return
      }

      if (!idScope.has(id)) {
        return `identifier not declared: ${id}`
      }
    }
  })

  const {types: t, loadAst} = buildSpec()

  it('should success to build when scope is valid', () => {
    const ast = t.Block([
      t.Identifier('a', true),
      t.Identifier('a', false),
      t.Block([
        t.Identifier('a', false),
        t.Identifier('b', true)
      ]),
      t.Identifier('b', true)
    ])

    expect(loadAst(ast)).to.has.property('_validateFunc').with.a('function')
    expect(loadAst(ast)).to.be.an('object')
  })

  it('should fail to build when scope is invalid', () => {
    const ast1 = t.Block([
      t.Identifier('a', false)
    ])
    const ast2 = t.Block([
      t.Identifier('a', true),
      t.Identifier('b', true),
      t.Identifier('a', true)
    ])

    expect(() => loadAst(ast1))
      .to.throw('identifier not declared: a')
    expect(() => loadAst(ast2))
      .to.throw('duplicated declaration within same scope: a')
  })
})
