import { autorun, extendObservable, observable, createTransformer, toJS } from 'mobx'
import test from 'tape'
import { curry, find, map, propEq } from 'ramda'

// findById<T> :: number -> T[] -> Nullable T
const findById = curry((id, xs) => find(propEq('id', id), xs))

// Factory functions for to build observables from stores.

const makeCollections = createTransformer(({ domain: { collections }}) => collections)

const makeUsers = createTransformer(({ domain: { users }}) => users)

const makePosts = createTransformer(({ domain: { collections, users, posts } }) =>
  map(x => ({
    ...x,
    collection: findById(x.collection.id, collections),
    user: findById(x.user.id, users) }
  ), posts)
)

const makeHubs = createTransformer(({ domain: { users, hubs } }) =>
  map(x => ({
    ...x,
    account: findById(x.account.id, users) }
  ), hubs)
)

const makeFeed = createTransformer((store) => {
  const { ui: { feed, hubs$, posts$, collections$ } } = store

  return {
    hub: findById(feed.hub.id, hubs$),
    spotlight: findById(feed.spotlight.id, posts$),
    collections: map(c => findById(c.id, collections$), feed.collections),
    posts: map(p => findById(p.id, posts$), feed.posts)
  }
})

const makeApp = createTransformer((store) => {
  // `$` denotes a read-only observable as opposed to a subject (i.e. no onNext/writes).
  // Note: Ordering does not matter here.
  store.ui.hubs$ = makeHubs(store)
  store.ui.posts$ = makePosts(store)
  store.ui.users$ = makeUsers(store)
  store.ui.collections$ = makeCollections(store)

  return {
    feed$: makeFeed(store)
  }
})

// Rehydrating from JS object is just calling `observable`
// fromJS :: JSON -> Store
const fromJS = observable

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

  // Make state an observable / reactive
  const store = fromJS(json)

  let app$

  // Wrap in an autorun so updates to store are observed
  autorun(() => app$ = makeApp(store))

  // Ensure initial state is correct
  t.deepEqual(app$.feed$.posts, [{
    id: 1, title: 'Boundaries',
    collection: { id: 1001, name: 'Programming' },
    user: { id: 10, name: 'Gary Bernhardt' }
  }], 'posts are set')
  t.equal(app$.feed$.spotlight.title, 'Boundaries', 'spotlight is set')
  t.equal(app$.feed$.spotlight.collection.name, 'Programming', 'spotlight collection is set')
  t.equal(app$.feed$.spotlight.user.name, 'Gary Bernhardt', 'spotlight user is set')
  t.equal(app$.feed$.hub.name, 'Software Engineering Talks', 'current hub is set')
  t.equal(app$.feed$.hub.account.name, 'Uncle Bob', 'current hub\'s account is set')

  // Push new values into state
  store.domain.users.push({ id: 11, name: 'Rich Hickey' })
  store.domain.posts.push({ id: 2, title: 'Value of Values', collection: { id: 1000 }, user: { id: 11 } })
  store.domain.posts.push({ id: 3, title: 'Simple Made Easy', collection: { id: 1000 }, user: { id: 11 } })

  // Update spotlight to newly added post
  store.ui.feed.posts.replace([{ id: 1 }, { id: 2 }, { id: 3 }])
  store.ui.feed.spotlight.id = 2

  t.deepEqual(map(p => p.title, app$.feed$.posts), [
    'Boundaries',
    'Value of Values',
    'Simple Made Easy'
  ], 'posts are updated')

  t.equal(app$.feed$.spotlight.title, 'Value of Values', 'spotlight is updated')
  t.equal(app$.feed$.spotlight.collection.name, 'FP', 'spotlight collection is updated')
  t.equal(app$.feed$.spotlight.user.name, 'Rich Hickey', 'spotlight user is updated')

  store.ui.feed.spotlight.id = 3
  t.equal(app$.feed$.spotlight.title, 'Simple Made Easy', 'spotlight is updated')

  t.end()
})
