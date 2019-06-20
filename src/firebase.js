// Firebase App (the core Firebase SDK) is always required and must be listed first
import * as firebase from 'firebase/app';
// Firebase products in use by the project
import 'firebase/firestore';

// Firebase config object
var config = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET
  // messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID
};

const settings = { timestampsInSnapshots: true };
firebase.initializeApp(config);
const db = firebase.firestore();
db.settings(settings);



// * HELPER - WRITE
let streamerIceCounter = 0
export const writeToFirebase = (id, field, value) => {
  // 'id' will identify the viewer or the streamer
  let document = db.collection('users').doc(id)
  let obj = {}

  switch (field) {
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
  // if( !(field === 'offer') ) { //if value changed is ice or answer, merge is true
  //   obj['merge'] = true
  // }
  // if ( field === 'ice' ) { //if value changed is ice, then increment the prop key
  //   obj[field + ++streamerIceCounter] = value
  // } else {
  //   obj[field] = value
  // }

  // return db
  //   .collection('users')
  //   .doc(id)
  //   .set(obj)
}

// * HELPER - READ
export const readFromFirebase = async (id, field) => {
  const document = await db.collection('users').doc(id).get();
  return JSON.parse(document.data()[field])

  // switch (field) {
  //   case 'answer': {
  //     return JSON.parse(document.data().answer);
  //   }
  //   case 'ice': {
  //     return JSON.parse(document.data().ice);
  //   }
  //   default: {
  //     console.log('default switch for writeToFirebase');
  //   }
  // }
}

// * HELPER - DELETE
export const deleteFromFirebase = async (id, field) => {
  let obj = {}
  obj[field] = firebase.firestore.FieldValue.delete()

  const document = await db.collection('users').doc(id)
  document.update(obj)
}



export default db;
