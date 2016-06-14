import { observable } from 'mobx'

// Rehydrating from JS object, which is just making it observable for now.
// Could have more logic in here in the future.
// fromJS :: JSON -> Store
const fromJS = observable

export default fromJS
