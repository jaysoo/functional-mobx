import { curry, find, propEq } from 'ramda'
import { toJS } from 'mobx'

// findById<T> :: number -> T[] -> Nullable T
export const findById = curry((id, xs) =>
  find(propEq('id', id), xs)
)

export const trace = (msg) => (x) => {
  console.log(msg, toJS(x))
  return x
}
