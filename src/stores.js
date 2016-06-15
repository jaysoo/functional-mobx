import { action, observable, toJS } from 'mobx'
import api from './api'

export const makeUsers = (users) => {
  const store = observable(users)
  // Defining store actions as non-enumerable methods.
  // This define process can be extracted as an helper.
  Object.defineProperties(store, {
    add: {
      enumerable: false,
      value: action((x) => {
        store.push(x)
      })
    },
    updateTalk: {
      enumerable: false,
      value: action((talk) => {
        Object.assign(store.find(p => talk.id === p.id), talk)
      })
    }
  })
  return store
}

export const makeTalks = (talks) => {
  const store = observable(talks)
  store.load = action((xs) => {
    store.replace(xs)
  })
  Object.defineProperties(store, {
    add: {
      enumerable: false,
      value: action((x) => {
        store.push(x)
      })
    },
    updateTalk: {
      enumerable: false,
      value: action((talk) => {
        Object.assign(store.find(p => talk.id === p.id), talk)
      })
    }
  })
  return store
}

export const makeFeed = (talks, feed) => {
  const store = observable(feed)
  Object.defineProperties(store, {
    // Request talks first loads the talks to the talks store,
    // then loads the talks on itself.
    requestTalks: {
      enumerable: false,
      value: action(() => {
        api.fetchTalks().then(action((xs) => {
          talks.load(xs)
          store.talks.replace(xs)
        }))
      })
    },
    updateSpotlight: {
      enumerable: false,
      value: action(({ id }) => {
        store.spotlight.id = id
      })
    }
  })
  return store
}

export const makeStores = (json) => {
  const store = {}
  store.users = makeUsers(json.users)
  store.talks = makeTalks(json.talks)
  store.feed = makeFeed(store.talks, json.feed)
  return store
}
