import {expect} from 'chai'
import lewis from '../../src/index'

describe('Check scope to validate namespace fixture', () => {
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
    childScope: true
  })

  define('Identifier', [
    {
      name: 'name',
      type: 'string'
    },
    {
      name: 'declare',
      type: 'boolean'
    }
  ], {
    alias: 'Node',
    validate (path) {
      const scope = path.scope('id')
      const name = path.get('name').node

      if (path.get('declare').node) {
        const addSuccess = scope.add(name)
        if (!addSuccess) {
          return `duplicated declaration within same scope: ${name}`
        }
        return
      }

      if (!scope.has(name)) {
        return `identifier not declared: ${name}`
      }
    }
  })

  const {types: t, loadAst} = buildSpec()

  it('should success when scope is valid', () => {
    const ast = t.Block([
      t.Identifier('a', true),
      t.Identifier('a', false),
      t.Block([
        t.Identifier('a', false),
        t.Identifier('b', true)
      ]),
      t.Identifier('b', true)
    ])

    const result = loadAst(ast)
    expect(result).to.be.an('object')
  })

  it('should fail when use identifier before declaration', () => {
    const ast1 = t.Block([
      t.Identifier('a', false)
    ])
    const ast2 = t.Block([
      t.Identifier('a', false),
      t.Identifier('a', true)
    ])

    expect(() => loadAst(ast1))
      .to.throw('identifier not declared: a')
    expect(() => loadAst(ast2))
      .to.throw('identifier not declared: a')
  })

  it('should fail when use duplicated declaration', () => {
    const ast = t.Block([
      t.Identifier('a', true),
      t.Identifier('a', true)
    ])

    expect(() => loadAst(ast))
      .to.throw('duplicated declaration within same scope: a')
  })

  it('should fail when reference child scope', () => {
    const ast = t.Block([
      t.Block([
        t.Identifier('a', true)
      ]),
      t.Identifier('a', false)
    ])
  })
})
