import {expect} from 'chai'
import lewis from '../../src/index'

describe('README.md example fixture', () => {
  it('should works as specified', () => {
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
        type: 'string'
      }
    ], {
      alias: 'Expression'
    })

    define('Identifier', [
      {
        name: 'name',
        type: 'string'
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

    const ast = t.Program([
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

    const rootPath = loadAst(ast)

    const capitalized = rootPath.transform({
      StringLiteral (path) {
        const content = path.get('content').node
        if (isCapitalized(content)) {
          return
        }
        return t.StringLiteral(content[0].toUpperCase() + content.slice(1))
      },
      Identifier (path) {
        const name = path.get('name').node
        if (isCapitalized(name)) {
          return
        }
        return t.Identifier(name[0].toUpperCase() + name.slice(1))
      }
    })

    const code = capitalized.convert({
      Program (path) {
        return path.get('body').join('\n')
      },
      StringLiteral (path) {
        return `"${path.get('content')}"`
      },
      Identifier (path) {
        return path.get('name')
      },
      FunctionCall (path) {
        return `${path.get('callee')}(${path.get('arguments').join(', ')})`
      }
    })

    expect(code.trim()).to.equal(`
      Println("Hello, world!")
      Printf("My name is {}", Name)
    `.trim().replace(/\n\s+/g, '\n'))
  })
})
