import {expect} from 'chai'
import lewis from '../../src/index'

describe('Lazy scope check fixture', () => {
  const {define, buildSpec} = lewis()

  define('Node')

  define('Lazy', [
    {
      name: 'body',
      type: 'Node',
      isArray: true
    }
  ], {
    alias: 'Node',
    childScope: true,
    lazy: true
  })

  define('Eager', [
    {
      name: 'body',
      type: 'Node',
      isArray: true
    }
  ], {
    alias: 'Node',
    childScope: true
  })

  define('Get', [
    {
      name: 'name',
      type: 'string'
    }
  ], {
    alias: 'Node',
    validate (path) {
      const name = path.get('name').node
      const scope = path.scope('id')

      if (!scope.has(name)) {
        return `Missing identifier ${name}`
      }
    }
  })

  define('Set', [
    {
      name: 'name',
      type: 'string'
    }
  ], {
    alias: 'Node',
    validate (path) {
      const name = path.get('name').node
      const scope = path.scope('id')

      if (!scope.add(name)) {
        return `Duplicated identifier ${name}`
      }
    }
  })

  const {types: t, loadAst} = buildSpec()

  it('should success when use before declare in lazy node', () => {
    const ast = t.Eager([
      t.Lazy([
        t.Get('a')
      ]),
      t.Set('a')
    ])

    expect(loadAst(ast)).to.be.an('object')
  })

  it('should fail when use before declare in eager node', () => {
    const ast = t.Eager([
      t.Eager([
        t.Get('a')
      ]),
      t.Set('a')
    ])

    expect(() => loadAst(ast)).to.throw('Missing identifier a')
  })
})
