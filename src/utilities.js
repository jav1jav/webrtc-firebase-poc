import db, { db_constructor } from './firebase'

// * HELPER FUNCTIONS TO PROCESS ICE CANDIDATES IN DATA
// OBJECT RETURNED FROM FB
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


// * HELPER - FIREBASE WRITE
// When writing ice candidates we want to increment the propery name
// (ie. ICE1, ICE2...)
let streamerIceCounter = 0

export const writeToFirebase = (id, field, value) => {
  // 'id' will identify the viewer or the streamer
  let document = db.collection('users').doc(id)
  let obj = {}

  switch (field) {
    case 'online': {
      obj[field] = value
      return document.set(obj)
    }
    case 'offer': {
      obj[field] = value
      return document.set(obj)
    }
    case 'answer': {
      obj[field] = value
      return document.set(obj, {'merge': true})
    }
    case 'ice': {
      obj[field + ++streamerIceCounter] = value
      return document.set(obj, {'merge': true})
    }
    default: {
      console.log('default switch for writeToFirebase');
    }
  }
}


// * HELPER - FIREBASE READ
export const readFromFirebase = async (id, field) => {
  const document = await db.collection('users').doc(id).get();
  return JSON.parse(document.data()[field])
}


// * HELPER - FIREBASE DELETE
export const deleteFromFirebase = async (id, field) => {
  let obj = {}
  obj[field] = db_constructor.FieldValue.delete()

  const document = await db.collection('users').doc(id)
  document.update(obj)
}


// * HELPER - RESET FIREBASE BY DELETING VALUES
export const initialize = async () => {
  await deleteFromFirebase('viewer', 'answer')
  await deleteFromFirebase('streamer', 'offer')
  await deleteFromFirebase('viewer', 'online')
  for(let i = 0; i < 10; i++) {
    await deleteFromFirebase('viewer', 'ice' + i)
    await deleteFromFirebase('streamer', 'ice' + i)
  }
  console.log('initialize')
}


// * HELPER - TIME - TO ADD ROUGH TIMESTAMP TO CONSOLE LOGS
export const time = ( () => {
  let start = Math.floor(Date.now() / 1000)
  return () => {
    return Math.floor(Date.now() / 1000) - start
  }
})()
