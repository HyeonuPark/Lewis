import {describe, before, it} from 'mocha'
import {expect} from 'chai'

import lewis from '../../src/index'

describe('Building ast via basic scope check', () => {
  let t, loadAst, visitor

  before(() => {
    const {define, buildSpec} = lewis()

    define('Block', [
      {
        name: 'body',
        type: 'Node',
        isArray: true
      }
    ], {
      role: 'child'
    })

    define('Declaration', [
      {
        name: 'id',
        type: 'string'
      }
    ], {
      alias: 'Node'
    })

    define('Identifier', [
      {
        name: 'id',
        type: 'string'
      }
    ], {
      alias: 'Node'
    })

    const spec = buildSpec()

    t = spec.types
    loadAst = spec.loadAst

    visitor = {
      Declaration: {
        enter (node) {
          const scope = node.scope('id')
          const id = node.get('id').unwrap()

          if (scope.hasOwn(id)) {
            throw new Error(`Duplicated declaration of ${id}`)
          }

          scope.set(id)
        }
      },
      Identifier: {
        enter (node) {
          const scope = node.scope('id')
          const id = node.get('id').unwrap()

          if (!scope.has(id)) {
            throw new Error(`Identifier ${id} is not defined`)
          }
        }
      }
    }
  })

  it('should detect duplicated declaration', () => {
    const valid = t.Block([
      t.Declaration('a'),
      t.Declaration('b'),
      t.Identifier('a')
    ])

    const invalid = t.Block([
      t.Declaration('a'),
      t.Declaration('b'),
      t.Declaration('a')
    ])

    loadAst(valid).traverse(visitor)

    expect(() => loadAst(invalid).traverse(visitor))
      .to.throw('Duplicated declaration of a')
  })

  it('should detect undeclared identifier', () => {
    const valid = t.Block([
      t.Declaration('a'),
      t.Declaration('b'),
      t.Identifier('a')
    ])

    const invalid = t.Block([
      t.Declaration('a'),
      t.Identifier('b')
    ])

    loadAst(valid).traverse(visitor)

    expect(() => loadAst(invalid).traverse(visitor))
      .to.throw('Identifier b is not defined')
  })
})
