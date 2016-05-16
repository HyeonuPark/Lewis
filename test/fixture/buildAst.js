import {expect} from 'chai'
import lewis from '../../src/index'

describe('node factory', () => {
  let t
  before (() => {
    const {define, buildSpec} = lewis()

    define('Block', [
      {
        name: 'body',
        type: 'Node',
        isArray: true
      }
    ], {
      alias: 'Node'
    })

    define('Identifier', [
      {
        name: 'name',
        type: 'string'
      }
    ], {
      alias: 'Node'
    })

    define('Number', [
      {
        name: 'content',
        type: 'number'
      }
    ], {
      alias: 'Node'
    })

    define('Call', [
      {
        name: 'callee',
        type: 'Node'
      },
      {
        name: 'arguments',
        type: 'Node',
        isArray: true
      }
    ], {
      alias: 'Node'
    })

    const {types} = buildSpec()
    t = types
  })

  it('should build proper JSON-able ast', () => {
    const ast = t.Block([
      t.Number(42),
      t.Identifier('foo'),
      t.Block([
        t.Call(t.Identifier('bar'), [
          t.Number(99)
        ])
      ])
    ])

    expect(ast).to.deep.equal({
      type: 'Block',
      body: [
        {
          type: 'Number',
          content: 42
        },
        {
          type: 'Identifier',
          name: 'foo'
        },
        {
          type: 'Block',
          body: [
            {
              type: 'Call',
              callee: {
                type: 'Identifier',
                name: 'bar'
              },
              arguments: [
                {
                  type: 'Number',
                  content: 99
                }
              ]
            }
          ]
        }
      ]
    })
  })
})
