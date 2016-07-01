import {describe, before, it} from 'mocha'
import {expect} from 'chai'

import lewis from '../../src/index'

describe('Example in README.md', () => {
  let code

  before(() => {
    const {define, buildSpec} = lewis()

    define('Program', [
      {
        name: 'body',
        type: 'Expression',
        isArray: true
      }
    ])

    define('Expression')

    define('StringLiteral', [
      {
        name: 'content',
        type: 'string',
        visitable: false
      }
    ], {
      alias: 'Expression'
    })

    define('Identifier', [
      {
        name: 'name',
        type: 'string',
        visitable: false
      }
    ], {
      alias: 'Expression'
    })

    define('FunctionCall', [
      {
        name: 'callee',
        type: 'Expression'
      },
      {
        name: 'arguments',
        type: 'Expression',
        isArray: true
      }
    ], {
      alias: 'Expression'
    })

    const {types: t, loadAst} = buildSpec()

    const data = t.Program([
      t.FunctionCall(t.Identifier('println'), [
        t.StringLiteral('hello, world!')
      ]),
      t.FunctionCall(t.Identifier('printf'), [
        t.StringLiteral('my name is {}'),
        t.Identifier('name')
      ])
    ])

    function isCapitalized (str) {
      const first = str[0]
      return first.toUpperCase() === first
    }

    const rootNode = loadAst(data)

    const capitalized = rootNode.traverse({
      StringLiteral (node) {
        const content = node.get('content').unwrap()

        if (!isCapitalized(content)) {
          return t.StringLiteral(content[0].toUpperCase() + content.slice(1))
        }
      },
      Identifier (node) {
        const name = node.get('name').unwrap()

        if (!isCapitalized(name)) {
          return t.Identifier(name[0].toUpperCase() + name.slice(1))
        }
      }
    })

    code = capitalized.convert({
      Program (node) {
        return node.get('body').join('\n')
      },
      StringLiteral (node) {
        return `"${node.get('content')}"`
      },
      Identifier (node) {
        return node.get('name')
      },
      FunctionCall (node) {
        return `${node.get('callee')}(${node.get('arguments').join(', ')})`
      }
    })
  })

  it('should convert code as expected', () => {
    expect(code.trim()).to.equal(`
Println("Hello, world!")
Printf("My name is {}", Name)
      `.trim())
  })
})
