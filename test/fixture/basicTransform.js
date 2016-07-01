import {describe, it, before} from 'mocha'
import {expect} from 'chai'

import lewis from '../../src/index'

describe('Traversing ast', () => {
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

    const spec = buildSpec()
    t = spec.types
    loadAst = spec.loadAst
  })

  it('should properly traverse syntax tree', () => {
    const data = t.Block([
      t.Identifier('aaa'),
      t.Block([
        t.Identifier('bbb')
      ]),
      t.Block([
        t.Identifier('ccc'),
        t.Block([
          t.Identifier('ddd'),
          t.Block([])
        ])
      ])
    ])

    const result = loadAst(data).traverse({
      Identifier (node) {
        const name = node.get('name').unwrap()
        const first = name[0]

        if (first.toUpperCase() !== first) {
          return t.Identifier(first.toUpperCase() + name.slice(1))
        }
      },
      Block: {
        exit (node) {
          const body = node.get('body')
          const len = body.length

          if (len === 0) {
            return null
          }
          if (len === 1) {
            return body[0]
          }
        }
      }
    })

    expect(result.unwrap()).to.deep.equal(t.Block([
      t.Identifier('Aaa'),
      t.Identifier('Bbb'),
      t.Block([
        t.Identifier('Ccc'),
        t.Identifier('Ddd')
      ])
    ]))
  })
})
