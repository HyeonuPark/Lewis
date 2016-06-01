import {describe, before, it} from 'mocha'
import {expect} from 'chai'

import lewis from '../../src/index'

describe('Converting ast to another form', () => {
  let t, loadAst

  before(() => {
    const {define, buildSpec} = lewis()

    define('Sexpr', [
      {
        name: 'body',
        type: ['string', 'Sexpr'],
        isArray: true
      }
    ])

    const spec = buildSpec()

    t = spec.types
    loadAst = spec.loadAst
  })

  it('should properly convert ast to another spec', () => {
    const data = t.Sexpr([
      'a',
      'b',
      t.Sexpr([
        t.Sexpr([
          'c',
          'd'
        ]),
        'e',
        t.Sexpr([])
      ])
    ])

    // another spec for c-like function call
    const {define, buildSpec} = lewis()

    define('Call', [
      {
        name: 'callee',
        type: ['string', 'Call']
      },
      {
        name: 'args',
        type: ['string', 'Call'],
        isArray: true
      }
    ])

    const {types} = buildSpec()

    const result = loadAst(data).convert({
      Sexpr (node) {
        const body = node.get('body')

        if (body.length === 0) {
          return null
        }

        return types.Call(body[0], body.slice(1))
      }
    })

    expect(result).to.deep.equal(types.Call('a', [
      'b',
      types.Call(
        types.Call('c', ['d']),
        ['e']
      )
    ]))
  })

  it('should properly convert ast to string', () => {
    const data = t.Sexpr([
      'add',
      t.Sexpr([
        'mul',
        '2',
        '4'
      ]),
      t.Sexpr([
        t.Sexpr([
          'def',
          t.Sexpr([
            'a',
            'b'
          ]),
          t.Sexpr([
            'sub',
            'a',
            'b'
          ])
        ]),
        '7',
        '1'
      ])
    ])

    const result = loadAst(data).convert({
      Sexpr (node) {
        return `(${node.get('body').join(' ')})`
      }
    })

    expect(result).to.equal('(add (mul 2 4) ((def (a b) (sub a b)) 7 1))')
  })
})
