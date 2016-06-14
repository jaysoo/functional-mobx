import { curry, find, propEq } from 'ramda'

// findById<T> :: number -> T[] -> Nullable T
export const findById = curry((id, xs) => find(propEq('id', id), xs))

export const trace = (msg) => (x) => {
  console.log(msg, x)
  return x
}
