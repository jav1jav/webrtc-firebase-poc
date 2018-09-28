import React, { Component } from 'react';
import db from './firebase';

/*
https://firebase.google.com/docs/firestore/manage-data/add-data?authuser=0
*/


console.log('database', db)
class JamSpace extends Component {

  async addData () {

    // Updating a user (will create if user not found)
    await db.collection('users').doc('IXoH1OWTc6gfFBGCWzWs').update({
      firstName: 'Test',
      lastName: 'User'
    })

    // Easier add
    // await db.collection('users').add({
    //   firstName: 'Jack',
    //   lastName: 'Lye'
    // });

    //delete a user
    db.collection("users").doc("userId").delete()

    console.log('value of collection.get()', val)
    console.log('isarray? value of collection.get()', Array.isArray(val))


    //Getting values (users in this case)
    const val = await db.collection('users').get()
    val.forEach(el => console.log('elements of val', el.data(), el.id))
  }

  render() {

    console.log(db)
    return (
    <React-Fragment>
    <div>foo</div>
    <div><button onClick={this.addData}>read data from db</button></div>
    </React-Fragment>
    )
  }
}

export default JamSpace;
