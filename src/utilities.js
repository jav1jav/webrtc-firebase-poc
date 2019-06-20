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
    await deleteFromFirebase('streamer', 'offer')
    for(let i = 0; i < 10; i++) {
      await deleteFromFirebase('viewer', 'ice' + i)
      await deleteFromFirebase('streamer', 'ice' + i)
    }
    console.log('initialize')
  }


  export const isPropertyAnIceCandidate = (str) => {
    return (str.indexOf('ice') >= 0)
  }

  export const areThereIceCandidates = (obj) => {
    let keys = Object.keys(obj)
    for(let k of keys) {
      if (isPropertyAnIceCandidate(k)) return true
    }
    return false
  }
