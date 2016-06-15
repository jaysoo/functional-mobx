import test from 'tape'
import { useStrict, autorun, toJS } from 'mobx'
import { map } from 'ramda'
import { makeTransforms } from './src/transforms'
import fromJS from './src/fromJS'
import { trace } from './src/utils'

// Only allow mutations inside actions
useStrict(true)

test('functional example', (t) => {
  // Serialized JSON state to simulate SSR.
  const json = {
    talks: [{ id: 1, title: 'Boundaries', user: { id: 10 } }],
    users: [{ id: 10, name: 'Gary Bernhardt' }, { id: 9, name: 'Uncle Bob' }],
    feed: {
      talks: [{ id: 1 }],
      spotlight: { id: 1 }
    }
  }

  // Hydrate store from serialized JSON.
  const stores = fromJS(json)

  // Wrap UI in an autorun so updates to store are observed
  let display
  autorun(() => display = makeTransforms(stores))

  // 1. Ensure initial state is correct
  t.deepEqual(display.feed$.talks, [{
    id: 1, title: 'Boundaries',
    user: { id: 10, name: 'Gary Bernhardt' }
  }], 'talks are set')
  t.equal(display.feed$.spotlight.title, 'Boundaries', 'spotlight is set')
  t.equal(display.feed$.spotlight.user.name, 'Gary Bernhardt', 'spotlight user is set')

  stores.talks.updateTalk({ id: 1, title: 'Wat' })
  t.equal(display.feed$.spotlight.title, 'Wat', 'spotlight is updated')

  // Push new values into state
  stores.users.add({ id: 11, name: 'Rich Hickey' })

  // Update spotlight to newly added talk
  stores.feed.updateSpotlight({ id: 2 })

  // Replace existing talks
  stores.feed.requestTalks()

  // Push to next tick due to async request.
  // Note: Promises in current tick will resolve at end of the current tick.
  setTimeout(() => {
    t.deepEqual(map(p => p.title, display.feed$.talks), [
      'Boundaries',
      'Value of Values',
      'Simple Made Easy'
    ], 'talks are updated')

    t.equal(display.feed$.spotlight.title, 'Value of Values', 'spotlight is updated')
    t.equal(display.feed$.spotlight.user.name, 'Rich Hickey', 'spotlight user is updated')

    stores.feed.updateSpotlight({ id: 3 })
    t.equal(display.feed$.spotlight.title, 'Simple Made Easy', 'spotlight is updated')

    const display2 = makeTransforms(fromJS(toJS(stores)))
    t.deepEqual(toJS(display), toJS(display2), 'toJS and fromJS are isomorphic')

    t.end()
  })
})
