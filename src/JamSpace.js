import React, { Component } from 'react';
import db from 'firebase'

console.log('database', db)
class JamSpace extends Component {

  async addData () {

    const val = await db.collection('javier_test').get()

    // val.get().then((x) => console.log('gotten data (snapshot)', x))
    //ref('/javier_test/tvGimtHhnKNxtyv0r7uK').once('value')
    console.log('value of collection.get()', val)
    console.log('isarray? value of collection.get()', Array.isArray(val))


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
