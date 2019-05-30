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

export default db;
