import { deleteFromFirebase } from './firebase'

// * HELPER - TIME
export const time = ( () => {
  let start = Math.floor(Date.now() / 1000)
  return () => {
    return Math.floor(Date.now() / 1000) - start
  }
})()

  // * HELPER - INITIALIZE
  export const initialize = async () => {
    await deleteFromFirebase('viewer', 'answer')
    await deleteFromFirebase('viewer', 'ice')
    await deleteFromFirebase('streamer', 'offer')
    await deleteFromFirebase('streamer', 'ice')
    console.log('initialize')
  }
