import {expect} from 'chai'
import lewis from '../../src/index'

describe('Check state while tree traverse fixture', () => {
  const {define, buildSpec} = lewis()

  define('Node', [
    {
      name: 'name',
      type: 'string'
    },
    {
      name: 'body',
      type: ['string', 'Node'],
      isArray: true
    }
  ])
})
