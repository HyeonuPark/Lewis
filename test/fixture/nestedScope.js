import {describe, before, it} from 'mocha'
import {expect} from 'chai'

import lewis from '../../src/index'

describe('Building ast via nested scope check', () => {
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
      alias: 'Node',
      scope: 'child'
    })

    define('Function', [
      {
        name: 'body',
        type: 'Node',
        isArray: true
      }
    ], {
      alias: 'Node',
      scope: 'lazy'
    })

    define('Comment', [
      {
        name: 'body',
        type: ['Node', 'string'],
        isArray: true
      }
    ], {
      alias: 'Node',
      scope: 'skip'
    })

    define('Declaration', [
      {
        name: 'id',
        type: 'string'
      }
    ], {
      alias: 'Node',
      init (node) {
        const scope = node.scope('id')
        const id = node.get('id').unwrap()

        if (scope.hasOwn(id)) {
          throw new Error(`Duplicated declaration of ${id}`)
        }

        scope.set(id)
      }
    })

    define('Identifier', [
      {
        name: 'id',
        type: 'string'
      }
    ], {
      alias: 'Node',
      init (node) {
        const scope = node.scope('id')
        const id = node.get('id').unwrap()

        if (!scope.has(id)) {
          throw new Error(`Identifier ${id} not defined`)
        }
      }
    })

    const spec = buildSpec()

    t = spec.types
    loadAst = spec.loadAst
  })

  it('should success to build with proper scope', () => {
    const data = t.Block([
      t.Declaration('a'),
      t.Block([
        t.Identifier('a')
      ]),
      t.Function([
        t.Declaration('a'),
        t.Identifier('b'),
        t.Comment([
          'foo',
          t.Identifier('z')
        ])
      ]),
      t.Declaration('b')
    ])

    loadAst(data)
  })

  it('should not allow to access from parent to child scope', () => {
    const data1 = t.Block([
      t.Block([
        t.Declaration('a')
      ]),
      t.Identifier('a')
    ])

    const data2 = t.Block([
      t.Function([
        t.Declaration('a')
      ]),
      t.Identifier('a')
    ])

    expect(() => loadAst(data1)).to.throw('Identifier a not defined')
    expect(() => loadAst(data2)).to.throw('Identifier a not defined')
  })

  it('should not allow to access from child to not-yet-defined id', () => {
    const data = t.Block([
      t.Block([
        t.Identifier('a')
      ]),
      t.Declaration('a')
    ])

    expect(() => loadAst(data)).to.throw('Identifier a not defined')
  })
})
