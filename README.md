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

1. Build your AST data

```js
// ast.js

import {types as t} from './spec'

//
// println("hello, world!")
// printf("my name is {}", name)
//

export const data = t.Program([
  t.FunctionCall(t.Identifier('println'), [
    t.StringLiteral('hello, world!')
  ]),
  t.FunctionCall(t.Identifier('printf'), [
    t.StringLiteral('my name is {}'),
    t.Identifier('name')
  ])
])

// ast data made with Lewis is a plain JSON-able object
console.log(JSON.stringify(data, null, 2))
```

1. Load node object from AST data, and traverse it

```js
// traverse.js

import {data} from './ast'
import {types as t, loadAst} from './spec'

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

const code = capitalized.convert({
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

console.log(code)
// result:
//
// Println("Hello, world!")
// Printf("My name is {}", Name)
```

# Milestone

- [x] Factory
- [x] Node
- [x] Convert
- [x] Traverse
- [x] Scope
