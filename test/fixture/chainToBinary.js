import {expect} from 'chai'
import lewis from '../../src/index'

describe('#fixture# Chain to binary expression', () => {
  const {define, buildSpec} = lewis()

  define('Node')

  define('Chain', [
    {
      name: 'body',
      type: ['string', 'Node', 'null'],
      isArray: true
    }
  ], {
    alias: 'Node'
  })

  define('Binary', [
    {
      name: 'left',
      type: ['string', 'Node', 'null']
    },
    {
      name: 'right',
      type: ['string', 'Node', 'null']
    }
  ], {
    alias: 'Node'
  })

  const {types: t, loadAst} = buildSpec()

  it('should build proper syntax tree', () => {
    const ast = t.Binary(
      t.Binary('a', 'b'),
      t.Binary(
        'c',
        t.Binary('d', 'e')
      )
    )

    expect(ast).to.deep.equal({
      type: 'Binary',
      left: {
        type: 'Binary',
        left: 'a',
        right: 'b'
      },
      right: {
        type: 'Binary',
        left: 'c',
        right: {
          type: 'Binary',
          left: 'd',
          right: 'e'
        }
      }
    })
  })

  const visitor = {
    Chain (path) {
      const body = path.get('body')

      switch (body.length) {
        case 0:
          return null
        case 1:
          return body[0]
        default:
          return t.Binary(
            body[0],
            t.Chain(body.slice(1))
          )
      }
    }
  }

  it('should transform chain-based ast to binary tree', () => {
    const ast = t.Chain(['a', 'b', 'c', 'd', 'e'])
    const tree = loadAst(ast)

    expect(tree.transform(visitor).node).to.deep.equal(t.Binary(
      'a',
      t.Binary(
        'b',
        t.Binary(
          'c',
          t.Binary('d', 'e')
        )
      )
    ))
  })

  it('should properly transform deeply nested chains', () => {
    const ast = t.Chain([
      'a',
      t.Chain([
        'b',
        t.Chain([
          'c',
          t.Chain([
            'd',
            t.Chain([
              'e'
            ]),
            'f'
          ]),
          'g'
        ]),
        'h'
      ]),
      'i'
    ])
    const result = loadAst(ast).transform(visitor)

    expect(result.node).to.deep.equal(t.Binary(
      'a',
      t.Binary(
        t.Binary(
          'b',
          t.Binary(
            t.Binary(
              'c',
              t.Binary(
                t.Binary(
                  'd',
                  t.Binary('e', 'f')
                ),
                'g'
              )
            ),
            'h'
          )
        ),
        'i'
      )
    ))
  })

  it('should properly transform chains under binary', () => {
    const ast = t.Binary(
      t.Chain(['a', 'b']),
      t.Chain(['c', 'd', 'e'])
    )
    const result = loadAst(ast).transform(visitor)

    expect(result.node).to.deep.equal(t.Binary(
      t.Binary('a', 'b'),
      t.Binary('c', t.Binary('d', 'e'))
    ))
  })

  it('should properly transform binaries under chain', () => {
    const ast = t.Chain([
      t.Binary('a', 'b'),
      t.Binary('c', 'd'),
      t.Binary('e', 'f')
    ])
    const result = loadAst(ast).transform(visitor)

    expect(result.node).to.deep.equal(t.Binary(
      t.Binary('a', 'b'),
      t.Binary(
        t.Binary('c', 'd'),
        t.Binary('e', 'f')
      )
    ))
  })

  it('should properly transform nested structure of mixed types', () => {
    const ast = t.Chain(['f', t.Binary(t.Chain(['g']), t.Chain(['h', 'i']))])
    const result = loadAst(ast).transform(visitor)

    expect(result.node).to.deep.equal(t.Binary(
      'f',
      t.Binary(
        'g',
        t.Binary('h', 'i')
      )
    ))
  })

  it('should handle another nesting', () => {
    const ast = t.Binary(
      t.Chain([
        t.Binary('a', t.Chain(['b', 'c']))
      ]),
      t.Chain(['d'])
    )
    const result = loadAst(ast).transform(visitor)

    expect(result.node).to.deep.equal(t.Binary(
      t.Binary(
        'a',
        t.Binary('b', 'c')
      ),
      'd'
    ))
  })

  it('should properly transform child paths', () => {
    const ast = t.Chain([
      'f',
      t.Binary(
        t.Chain(['g']),
        t.Chain(['h', 'i'])
      )
    ])
    const result = loadAst(ast).get('body', 1).transform(visitor)

    expect(result.node).to.deep.equal(t.Binary(
      'g',
      t.Binary('h', 'i')
    ))
  })
})
