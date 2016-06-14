import test from 'tape'
import { useStrict, autorun, observable } from 'mobx'
import { map } from 'ramda'
import { makeApp } from './src/factories'
import fromJS from './src/fromJS'

// Only allow mutations inside actions
useStrict(true)

test('functional example', (t) => {
  // Serialized JSON state to simulate SSR.
  const json = {
    domain: {
      collections: [{ id: 1000, name: 'FP' }, { id: 1001, name: 'Programming' }],
      posts: [{ id: 1, title: 'Boundaries', collection: { id: 1001 }, user: { id: 10 } }],
      users: [{ id: 10, name: 'Gary Bernhardt' }, { id: 9, name: 'Uncle Bob' }],
      hubs: [{ id: 100, name: 'Software Engineering Talks', account: { type: 'user', id: 9 } }]
    },
    ui: {
      feed: {
        collections: [{ id: 1000 }, { id: 1001 }],
        hub: { id: 100 },
        posts: [{ id: 1 }],
        spotlight: { id: 1 }
      }
    }
  }

  // Hydrate store from serialized JSON.
  const store = fromJS(json)

  // Wrap app in an autorun so updates to store are observed
  let app
  autorun(() => app = makeApp(store))

  // 1. Ensure initial state is correct
  t.deepEqual(app.feed.posts, [{
    id: 1, title: 'Boundaries',
    collection: { id: 1001, name: 'Programming' },
    user: { id: 10, name: 'Gary Bernhardt' }
  }], 'posts are set')
  t.equal(app.feed.spotlight.title, 'Boundaries', 'spotlight is set')
  t.equal(app.feed.spotlight.collection.name, 'Programming', 'spotlight collection is set')
  t.equal(app.feed.spotlight.user.name, 'Gary Bernhardt', 'spotlight user is set')
  t.equal(app.feed.hub.name, 'Software Engineering Talks', 'current hub is set')
  t.equal(app.feed.hub.account.name, 'Uncle Bob', 'current hub\'s account is set')

  // Push new values into state
  app.users.add({ id: 11, name: 'Rich Hickey' })

  // Update spotlight to newly added post
  // app.feed.updateSpotlight({ id: 2 })

  // Replace existing posts
  app.feed.requestPosts(100)

  // Push to next tick due to async request.
  // Note: Promises in current tick will resolve at end of the current tick.
  setTimeout(() => {
    t.deepEqual(map(p => p.title, app.feed.posts), [
      'Boundaries',
      'Value of Values',
      'Simple Made Easy'
    ], 'posts are updated')

    // t.equal(app.feed.spotlight.title, 'Value of Values', 'spotlight is updated')
    // t.equal(app.feed.spotlight.collection.name, 'FP', 'spotlight collection is updated')
    // t.equal(app.feed.spotlight.user.name, 'Rich Hickey', 'spotlight user is updated')

    // app.feed.updateSpotlight({ id: 3 })
    // t.equal(app.feed.spotlight.title, 'Simple Made Easy', 'spotlight is updated')

    t.end()
  }, 100)
})
