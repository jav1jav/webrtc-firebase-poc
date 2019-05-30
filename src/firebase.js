import * as firebase from 'firebase';
import 'firebase/firestore';
// import '../secrets'

var config = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET
  // messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID
};

console.log('firebase.js | NODE_ENV = ', process.env.NODE_ENV, 'REACT_APP_FIREBASE_PROJECT_ID', process.env.REACT_APP_FIREBASE_PROJECT_ID, 'config = ', config)
const settings = { timestampsInSnapshots: true };
firebase.initializeApp(config);
const db = firebase.firestore();
db.settings(settings);

export default db;
