import {describe, before, it} from 'mocha'
import {expect} from 'chai'

import lewis from '../../src/index'

describe('Transforming ast via scope check', () => {
  let t, loadAst, data, proper

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
      role: 'child'
    })

    define('Header', [
      {
        name: 'content',
        type: 'string'
      }
    ], {
      alias: 'Node'
    })

    define('Footer', [
      {
        name: 'content',
        type: 'string'
      }
    ], {
      alias: 'Node'
    })

    define('Line', [
      {
        name: 'content',
        type: 'string'
      }
    ], {
      alias: 'Node'
    })

    const spec = buildSpec()

    t = spec.types
    loadAst = spec.loadAst

    data = t.Block([
      t.Header('a'),
      t.Footer('b'),
      t.Line('c'),
      t.Block([
        t.Line('d'),
        t.Header('e'),
        t.Line('f'),
        t.Line('g')
      ]),
      t.Line('h'),
      t.Footer('i'),
      t.Line('j')
    ])

    proper = t.Block([
      t.Line('acb'),
      t.Block([
        t.Line('adb'),
        t.Line('efb'),
        t.Line('egb')
      ]),
      t.Line('ahb'),
      t.Line('aji')
    ])
  })

  it('should transform appropriately to current scope', () => {
    const result = loadAst(data).transform({
      Line (node) {
        const content = node.get('content').unwrap()
        const scope = node.scope('meta')
        const head = scope.get('head') || '_'
        const foot = scope.get('foot') || '_'

        if (
          content.slice(0, head.length) === head &&
          content.slice(-foot.length) === foot
        ) {
          return
        }

        return t.Line(`${head}${content}${foot}`)
      },
      Header (node) {
        const content = node.get('content').unwrap()
        const scope = node.scope('meta')

        scope.set('head', content)

        return null
      },
      Footer (node) {
        const content = node.get('content').unwrap()
        const scope = node.scope('meta')

        scope.set('foot', content)

        return null
      }
    })

    expect(result.unwrap()).to.deep.equal(proper)
  })

  it('should transform appropriately with separated visitors', () => {
    const result = loadAst(data).transform([
      {
        Line (node) {
          const content = node.get('content').unwrap()
          const scope = node.scope('meta')
          const head = scope.get('head') || '_'

          if (content.slice(0, head.length) === head) {
            return
          }

          return t.Line(`${head}${content}`)
        },
        Header (node) {
          const content = node.get('content').unwrap()
          const scope = node.scope('meta')

          scope.set('head', content)

          return null
        }
      },
      {
        Line (node) {
          const content = node.get('content').unwrap()
          const scope = node.scope('meta')
          const foot = scope.get('foot') || '_'

          if (content.slice(-foot.length) === foot) {
            return
          }

          return t.Line(`${content}${foot}`)
        },
        Footer (node) {
          const content = node.get('content').unwrap()
          const scope = node.scope('meta')

          scope.set('foot', content)

          return null
        }
      }
    ])

    expect(result.unwrap()).to.deep.equal(proper)
  })
})
