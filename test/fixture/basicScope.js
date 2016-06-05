import {describe, before, it} from 'mocha'
import {expect} from 'chai'

import lewis from '../../src/index'

describe('Transforming ast via basic scope check', () => {
  let t, loadAst

  before(() => {
    const {define, buildSpec} = lewis()

    define('Block', [
      {
        name: 'body',
        type: 'Node',
        isArray: true
      }
    ])

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
          throw new Error(`Identifier ${id} is not defined`)
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
      t.Declaration('b'),
      t.Identifier('a')
    ])

    loadAst(data)
  })

  it('should fail to build with non-proper scope', () => {
    const data1 = t.Block([
      t.Declaration('a'),
      t.Declaration('b'),
      t.Declaration('a')
    ])

    const data2 = t.Block([
      t.Declaration('a'),
      t.Identifier('b')
    ])

    expect(() => loadAst(data1)).to.throw('Duplicated declaration of a')
    expect(() => loadAst(data2)).to.throw('Identifier b is not defined')
  })
})
