import React, { Component } from 'react';

// import firebase from 'firebase/app'
// import auth from "firebase/auth"
// import db from "firebase/database"
// import firestore from "firebase/firestore"
// import messaging from "firebase/messaging"
// import functions from "firebase/functions"

import firebase from 'firebase'

const config = {
  apiKey: "AIzaSyANKh5do8M5RJYszOdNub23f9xasvnpXbY",
  authDomain: "jamspace-baby.firebaseapp.com",
  databaseURL: "https://jamspace-baby.firebaseio.com",
  projectId: "jamspace-baby",
  storageBucket: "jamspace-baby.appspot.com",
  messagingSenderId: "33497992322"
};
firebase.initializeApp(config);

const db = firebase.database()

class JamSpace extends Component {

  async addData () {
    firebase.auth()
    const val = await db.ref('javier_test/tvGimtHhnKNxtyv0r7uK').once('value')
    console.log('value on database', val)
  }

  render() {

    console.log(db)
    return (
    <React-Fragment>
    <div>boo</div>
    <div><button onClick={this.addData}>read data from db</button></div>
    </React-Fragment>
    )
  }
}

export default JamSpace;
