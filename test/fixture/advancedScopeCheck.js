import {expect} from 'chai'
import lewis from '../../src/index'

describe('Advanced scope check for validate namespace fixture', () => {
  const {define, buildSpec} = lewis()

  define('Statement')

  define('Block', [
    {
      name: 'body',
      type: 'Statement',
      isArray: true
    }
  ], {
    alias: 'Statement',
    validate (path) {
      path.childScope()
    }
  })

  define('Declaration', [
    {
      name: 'name',
      type: 'string',
      visitable: false
    },
    {
      name: 'init',
      type: ['Expression', 'null']
    }
  ], {
    alias: 'Statement',
    validate (path) {
      const name = path.get('name').node
      const initType = path.get('init').type
      const scope = path.scope('id')

      path.anchorScope()

      if (scope.has(name)) {
        return `duplicated declaration within same scope: ${name}`
      }
      scope.add(name, initType)
    }
  })

  define('ExpressionElem', [
    {
      name: 'expression',
      type: 'Expression'
    }
  ], {
    alias: 'Statement',
    validate (path) {
      path.anchorScope()
    }
  })

  define('Expression')

  define('Identifier', [
    {
      name: 'name',
      type: 'string',
      visitable: false
    }
  ], {
    alias: 'Expression',
    validate (path) {
      const name = path.get('name').node
      const scope = path.scope('id')

      if (!scope.has(name)) {
        return `identifier not declared: ${name}`
      }
    }
  })

  define('Function', [
    {
      name: 'arguments',
      type: 'string',
      isArray: true,
      visitable: false
    },
    {
      name: 'body',
      type: 'Block'
    }
  ], {
    alias: 'Expression',
    validate (path) {
      path.childScope()
      const scope = path.scope('id')

      for ({node: arg} of path.get('arguments')) {
        scope.add(arg)
      }
    }
  })

  define('Call', [
    {
      name: 'callee',
      type: 'Expression'
    },
    {
      name: 'arguments',
      type: 'Expression',
      isArray: true
    }
  ], {
    alias: 'Expression'
  })

  const {types: t, loadAst} = buildSpec()

  it('should success when ast is valid', () => {
    const ast = t.Block([
      t.Declaration('var1', null),
      t.Declaration('var2', null),
      t.Declaration('fn1',
        t.Function(['arg1'], t.Block([
          t.ExpressionElem(
            t.Call(t.Identifier('arg1'), [])
          )
        ]))
      ),
      t.ExpressionElem(
        t.Call(t.Identifier('var1'), [
          t.Identifier('fn1')
        ])
      )
    ])

    expect(loadAst(ast)).to.be.an('object')
  })

  it('should fail when use identifier before declaretion in same scope', () => {
    const ast = t.Block([
      t.Declaration('var1'),
      t.ExpressionElem(
        t.Call(t.Identifier('var1'), [t.Identifier('var2')])
      ),
      t.Declaration('var2')
    ])

    expect(loadAst(ast)).to.be.an('object')
  })
})
