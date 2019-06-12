import db from './firebase';

// * HELPER - TIME
export const time = ( () => {
  let start = Math.floor(Date.now() / 1000)
  return () => {
    return Math.floor(Date.now() / 1000) - start
  }
})()


const iceWriter = (count, candidate) => {
  let obj = {}
  obj['ice'+ count] = candidate
  return obj
}

let streamerIceCounter = 0

export const writeToFirebase = (id, field, value) => {
  switch (field) {
    case 'offer': {
      return db
        .collection('users')
        .doc(id)
        .set({ offer: value });
    }
    case 'answer': {
      return db
        .collection('users')
        .doc(id)
        .set({ answer: value }, {merge: true});
    }
    case 'ice': {
      return db
        .collection('users')
        .doc(id)
        .set(iceWriter(++streamerIceCounter, value), { merge: true });
    }
    default: {
      console.log('default value in switch for writeToFirebase');
    }
  }
}

// * HELPER - READ
export const readFromFirebase = async (id, field) => {
  const document = await db.collection('users').doc(id).get();
  switch (field) {
    case 'answer': {
      return JSON.parse(document.data().answer);
    }
    case 'ice': {
      return JSON.parse(document.data().ice);
    }
    default: {
      console.log('default switch for writeToFirebase');
    }
  }
}

