import React, { Component } from 'react';
import db from './firebase';

const ICE = 'ice';
const OFFER = 'offer';
const ANSWER = 'answer';

class Initializer extends Component {
  constructor() {
    super()
    this.initialize = this.initialize.bind(this)
  }


  // * HELPER - WRITE
  writeToFirebase(id, field, value) {
    switch (field) {
      case OFFER: {
        return db
          .collection('users')
          .doc(id)
          .set({ offer: value });
      }
      case ANSWER: {
        return db
          .collection('users')
          .doc(id)
          .set({ answer: value }, {merge: true});
      }
      case ICE: {
        return db
          .collection('users')
          .doc(id)
          .set({ ice: value }, { merge: true });
      }
      default: {
        console.log('default value in switch for writeToFirebase');
      }
    }
  }

  // * HELPER - READ
  async readFromFirebase(id, field) {
    const document = await db.collection('users').doc(id).get();
    console.log('readFromFirebase', document.data())
    switch (field) {
      case ANSWER: {
        return JSON.parse(document.data().answer);
      }
      case ICE: {
        return JSON.parse(document.data().ice);
      }
      default: {
        console.log('default switch for writeToFirebase');
      }
    }
  }

  // * HELPER - INITIALIZE
  async initialize() {
    await this.writeToFirebase('viewer', ANSWER, "")
    await this.writeToFirebase('viewer', ICE, "")
    await this.writeToFirebase('streamer', OFFER, "")
    await this.writeToFirebase('streamer', ICE, "")
    console.log('initialize')
  }

  componentDidMount() {

  }
  render() {
    return (
      <div>
        <h1>What's UP!!!</h1>
        <br />
          <button onClick={this.initialize}
        type="button" className="btn btn-primary btn-lg">
          Initialize
        </button>

      </div>
    );
  }


}

export default Initializer;
