import { action, createTransformer, toJS } from 'mobx'
import { identity, map } from 'ramda'
import api from './api'
import { findById, trace } from './utils'

export const makeCollections = createTransformer(({ domain: { collections }}) =>
  Object.assign(
    map(identity, collections), {
      // Mutation API.
      @action load(xs) { collections.replace(xs) },
      @action add(x) { collections.push(x) }
    }))

export const makeUsers = createTransformer(({ domain: { users }}) =>
  Object.assign(
    map(identity, users), {
      // Mutation API.
      @action load(xs) { users.replace(xs) },
      @action add(x) { users.push(x) }
    }))

export const makeHubs = createTransformer(({ domain: { users, hubs } }) =>
  Object.assign(
    map(x => ({
      ...x,
      account: findById(x.account.id, users) }
    ), hubs), {
      // Mutation API.
      @action load(xs) { hubs.replace(xs) },
      @action add(x) { hubs.push(x) }
    }))

export const makePosts = createTransformer(({ domain: { collections, users, posts } }) =>
  Object.assign(
    map(x => ({
      ...x,
      collection: findById(x.collection.id, collections),
      user: findById(x.user.id, users) }
    ), posts), {
      // Mutation API.
      @action load(xs) {
        // Replace the posts within an action.
        posts.replace(xs)
      },
      @action add(x) { posts.push(x) }
    }))

export const makeFeed = createTransformer(({ ui: { feed, hubs, posts, collections }}) =>
  Object.assign({
    hub: findById(feed.hub.id, hubs),
    spotlight: findById(feed.spotlight.id, posts),
    collections: map(c => findById(c.id, collections), feed.collections),

    // Mapping the subset of posts with the real post objects.
    posts: map(p => findById(p.id, posts), feed.posts)
  }, {
    // Mutation API.
    @action requestPosts(hubId) {
      api.fetchPosts(hubId).then(action((xs) => {
        posts.load(xs)
        // Can't replace `feed.posts` without set timeout since posts
        // isn't changed synchronously.
        setTimeout(action(() => feed.posts.replace(xs)))
      }))
    },
    @action addPost(x) {
      api.addPost(x).then(action((post) => {
        posts.add(post)
        feed.posts.push(post)
      }))
    },
    @action updateSpotlight(x) {
      feed.spotlight.id = x.id
    }
  }))

export const makeApp = createTransformer((store) => {
  // Note: Ordering does not matter here.
  store.ui.hubs = makeHubs(store)
  store.ui.posts = makePosts(store)
  store.ui.users = makeUsers(store)
  store.ui.collections = makeCollections(store)

  // No mutation API exposed.
  return {
    ...store.ui,
    feed: makeFeed(store)
  }
})
