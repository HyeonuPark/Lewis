import {describe, it, before} from 'mocha'
import {expect} from 'chai'

import lewis from '../../src/index'
import {Node} from '../../src/node'

describe('Building ast data', () => {
  let t, loadAst

  before(() => {
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

    ;({types: t, loadAst} = buildSpec())
  })

  it('should build proper JSON-able ast data', () => {
    const data = t.Block([
      t.Number(42),
      t.Identifier('foo'),
      t.Block([
        t.Call(t.Identifier('bar'), [
          t.Number(99)
        ])
      ])
    ])

    expect(t.Identifier('abc'))
      .to.deep.equal({type: 'Identifier', name: 'abc'})

    expect(data).to.deep.equal({
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

  it('should load syntax tree based on data and spec', () => {
    const data = t.Block([
      t.Number(42),
      t.Identifier('foo'),
      t.Block([
        t.Call(t.Identifier('bar'), [
          t.Number(99)
        ])
      ])
    ])

    const result = loadAst(data)

    expect(result).to.instanceof(Node)
    expect(result.get('body')).to.be.an('array')
    expect(result.get('body', 0)).to.instanceof(Node)
    expect(result.get('body', 0).get('content').unwrap()).to.equal(42)
  })
})
