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
      type: 'Body'
    }
  ], {
    validate (path) {
      const name = path.get('name').node
      const scope = path.scope('id')

      scope.add(name)
    }
  })

  define('Body', [
    {
      name: 'body',
      type: 'Node',
      isArray: true
    }
  ], {
    childScope: true
  })

  const {types: t, loadAst} = buildSpec()

  it('should reflect current scope even after transformation', () => {
    const visitor = {
      Node (path) {
        if (path.get('name').node === 'yes') {
          return t.Node('no', path.get('body'))
        }
      }
    }

    const ast = t.Body([
      t.Node('a', t.Body([])),
      t.Node('b', t.Body([])),
      t.Node('yes', t.Body([
        t.Node('c', t.Body([])),
        t.Node('d', t.Body([])),
        t.Node('e', t.Body([]))
      ])),
      t.Node('f', t.Body([])),
      t.Node('g', t.Body([]))
    ])

    const loaded = loadAst(ast)
    const result = loaded.transform(visitor)

    expect(result.node).to.deep.equal(t.Body([
      t.Node('a', t.Body([])),
      t.Node('b', t.Body([])),
      t.Node('no', t.Body([
        t.Node('c', t.Body([])),
        t.Node('d', t.Body([])),
        t.Node('e', t.Body([]))
      ])),
      t.Node('f', t.Body([])),
      t.Node('g', t.Body([]))
    ]))

    expect(result.scope('id').hasOwn('yes')).to.be.false
    expect(result.scope('id').hasOwn('no')).to.be.true
  })
})
