import {expect} from 'chai'
import lewis from '../../src/index'

describe('Check state while tree traverse fixture', () => {
  const {define, buildSpec} = lewis()

  define('Node', [
    {
      name: 'name',
      type: 'string'
    },
    {
      name: 'body',
      type: ['string', 'Node'],
      isArray: true
    }
  ])

  const {types: t, loadAst} = buildSpec()

  it('should convert tree based on current state', () => {
    const ast = t.Node('a', [
      'b',
      t.Node('c', ['a', 'b', 'd']),
      t.Node('d', [
        t.Node('e', ['f']),
        'g'
      ])
    ])

    const result = loadAst(ast).transform({
      Node (path, state) {
        const name = path.get('name').node
        const body = path.get('body')

        let firstName = state.get('firstName')

        if (!firstName) {
          firstName = name
          state.set('firstName', name)
        }

        if (body[0].node === firstName) {
          return
        }

        return t.Node(name, [firstName, ...body])
      }
    })

    expect(result.node).to.deep.equal(t.Node('a', [
      'a',
      'b',
      t.Node('c', ['a', 'b', 'd']),
      t.Node('d', [
        'a',
        t.Node('e', ['a', 'f']),
        'g'
      ])
    ]))
  })
})
