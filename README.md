Lewis
======

Syntax agnostic compiler framework

[![Build Status](https://travis-ci.org/HyeonuPark/Lewis.svg?branch=master)](https://travis-ci.org/HyeonuPark/Lewis)

Heavily W.I.P. yet!

## Usage

1. Define your AST spec

```js
// spec.js

import lewis from 'lewis'

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

export const {types, loadAst} = buildSpec()
```

1. Build your AST

```js
// ast.js

import {types as t} from './spec'

//
// println("hello, world!")
// printf("my name is {}", name)
//

export const ast = t.Program([
  t.FunctionCall(t.Identifier('println'), [
    t.StringLiteral('hello, world!')
  ]),
  t.FunctionCall(t.Identifier('printf'), [
    t.StringLiteral('my name is {}'),
    t.Identifier('name')
  ])
])

// ast from the Lewis are plain JSON-able object
console.log(JSON.stringify(ast, null, 2))
```

1. Load path object from ast, and transform it

```js
// transform.js

import {ast} from './ast'
import {types as t, loadAst} from './spec'

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

console.log(code)
// result:
//
// Println("Hello, world!")
// Printf("My name is {}", Name)
```
