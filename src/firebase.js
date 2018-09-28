import * as firebase from 'firebase';
import 'firebase/firestore';

var config = {
  apiKey: 'AIzaSyBkAi8JlAuOEfCqFjBxOvVeXi83OwOvzoQ',
  authDomain: 'jamspace-01.firebaseapp.com',
  databaseURL: 'https://jamspace-01.firebaseio.com',
  projectId: 'jamspace-01',
  storageBucket: 'jamspace-01.appspot.com',
  messagingSenderId: '1073650211164'
};

const settings = { timestampsInSnapshots: true };
firebase.initializeApp(config);
const db = firebase.firestore();
db.settings(settings);

export default db;
