import { action } from 'mobx'
import { makeStores } from './stores'

// Rehydrating from JS object, which just calls makeStores.
// Could have more logic in here in the future.
// fromJS :: JSON -> Store
const fromJS = action((json) => {
  return makeStores(json)
})

export default fromJS
