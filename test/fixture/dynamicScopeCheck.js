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
    scope: 'block'
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

    const ast = t.Body([
      t.Node('a', t.Body([])),
      t.Node('b', t.Body([])),
      t.Node('yes', t.Body([
        t.Node('c', t.Body([]))
      ]))
    ])

    const result = loadAst(ast).transform(visitor)

    expect(result.node).to.deep.equal(t.Body([
      t.Node('a', t.Body([])),
      t.Node('b', t.Body([])),
      t.Node('no', t.Body([
        t.Node('c', t.Body([]))
      ]))
    ]))
    expect(result._scopeContainer.type).to.equal('block')
    expect(result.scope('id').hasOwn('yes')).to.be.false
    expect(result.scope('id').hasOwn('no')).to.be.true
  })
})
