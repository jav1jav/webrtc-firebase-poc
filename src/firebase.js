import * as firebase from 'firebase';
import 'firebase/firestore';

if (process.env.NODE_ENV !== 'production') require('../secrets')

var config = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: 'jamspace-01.firebaseapp.com',
  databaseURL: 'https://jamspace-01.firebaseio.com',
  projectId: 'jamspace-01',
  storageBucket: 'jamspace-01.appspot.com',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID
};
const settings = { timestampsInSnapshots: true };
firebase.initializeApp(config);
const db = firebase.firestore();
db.settings(settings);

export default db;
