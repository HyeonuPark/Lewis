import {expect} from 'chai'
import lewis from '../../src/index'

describe('Dynamic scope check fixture', () => {
  const {define, buildSpec} = lewis()

  define('Node', [
    {
      name: 'name',
      type: 'string'
    },
    {
      name: 'body',
      type: ['Node', 'string'],
      isArray: true
    }
  ], {
    validate (path) {
      path.childScope()
      const scope = path.scope('id')

      for (let elem of path.get('body')) {
        if (elem.is('string')) {
          scope.add(elem.node)
        } else {
          scope.add(elem.get('name').node)
        }
      }
    }
  })

  const {types: t, loadAst} = buildSpec()

  it('should reflect current scope even after transformed', () => {
    const visitor = {
      Node (path) {
        if (path.get('name').node === 'yes') {
          return t.Node('no', path.get('body'))
        }
      }
    }

    const ast = t.Node('root', [
      t.Node('a', []),
      'b',
      t.Node('yes', [
        t.Node('c', [])
      ])
    ])

    const result = loadAst(ast).transform(visitor)

    expect(result.node).to.deep.equal(t.Node('root', [
      t.Node('a', []),
      'b',
      t.Node('no', [
        t.Node('c', [])
      ])
    ]))
    expect(result.scope('id').hasOwn('yes')).to.be.false
    expect(result.scope('id').hasOwn('no')).to.be.true
  })
})
