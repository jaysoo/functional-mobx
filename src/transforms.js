import { createTransformer, observable, toJS } from 'mobx'
import { identity, map } from 'ramda'
import { findById, trace } from './utils'

export const makeUsers = createTransformer(({ stores: { users } }) =>
  map(identity, users))

export const makeTalks = createTransformer(({ stores: { talks }, users$ }) =>
  map(t => ({
    ...t,
    user: findById(t.user.id, users$) }
  ), talks))

export const makeFeed = createTransformer(({ stores: { feed }, talks$ }) => {
  return {
    spotlight: talks$.find(p => p.id === feed.spotlight.id),

    // Mapping the subset of talks with the real talk objects.
    talks: map(t => findById(t.id, talks$), feed.talks)
  }
})

export const makeTransforms = createTransformer((stores) => {
  const presenters = {
    stores
  }

  presenters.users$ = makeUsers(presenters)
  presenters.talks$ = makeTalks(presenters)
  presenters.feed$ = makeFeed(presenters)

  return presenters
})
