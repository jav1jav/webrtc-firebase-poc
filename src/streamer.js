import React, { Component } from 'react';
import db from './firebase';
import { time, writeToFirebase } from './utilities'

const ICE = 'ice';
const OFFER = 'offer';
const ANSWER = 'answer';
const SERVERS = [
  //THESE ARE SERVERS THE CONNECTION WILL USE TO CREATE THE ICE SERVERS
  { urls: 'stun:stun.services.mozilla.com' },
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: 'turn:numb.viagenie.ca',
    credential: 'webrtc',
    username: 'javier3@gmail.com'
  }
]

// let time = ( function () {
//   let start = Math.floor(Date.now() / 1000)
//   return function() {
//     return Math.floor(Date.now() / 1000) - start
//   }
// })()

// let streamerIceCounter = 0

class Streamer extends Component {
  constructor() {
    super();
    this.state = {
      viewerId: 'viewer',
      streamerId: 'streamer',
      pc: {},
      ice: [],
      ans: {},
    };
    // this.writeToFirebase = this.writeToFirebase.bind(this)
    // this.readFromFirebase = this.readFromFirebase.bind(this)
    this.initialize = this.initialize.bind(this)
    // this.iceWriter = this.iceWriter.bind(this)
    this.linkToViewerSnapshot = this.linkToViewerSnapshot.bind(this)
    this.createLocalPeerConnectionWithIceCandidates = this.createLocalPeerConnectionWithIceCandidates.bind(this)
    this.streamerCreateLocalOfferAddToPeerConnection = this.streamerCreateLocalOfferAddToPeerConnection.bind(this)

  }

  // iceWriter(count, candidate) {
  //   let obj = {}
  //   obj['ice'+count] = candidate
  //   return obj
  // }

  // // * HELPER - WRITE
  // writeToFirebase(id, field, value) {
  //   switch (field) {
  //     case OFFER: {
  //       return db
  //         .collection('users')
  //         .doc(id)
  //         .set({ offer: value });
  //     }
  //     case ANSWER: {
  //       return db
  //         .collection('users')
  //         .doc(id)
  //         .set({ answer: value }, {merge: true});
  //     }
  //     case ICE: {
  //       return db
  //         .collection('users')
  //         .doc(id)
  //         .set(this.iceWriter(++streamerIceCounter, value), { merge: true });
  //     }
  //     default: {
  //       console.log('default value in switch for writeToFirebase');
  //     }
  //   }
  // }

  // // * HELPER - READ
  // async readFromFirebase(id, field) {
  //   const document = await db.collection('users').doc(id).get();
  //   switch (field) {
  //     case ANSWER: {
  //       return JSON.parse(document.data().answer);
  //     }
  //     case ICE: {
  //       return JSON.parse(document.data().ice);
  //     }
  //     default: {
  //       console.log('default switch for writeToFirebase');
  //     }
  //   }
  // }

  // // * HELPER - TIME


  // * HELPER - INITIALIZE
  async initialize() {
    await writeToFirebase(this.state.viewerId, ANSWER, "")
    await writeToFirebase(this.state.viewerId, ICE, "")
    await writeToFirebase(this.state.streamerId, OFFER, "")
    await writeToFirebase(this.state.streamerId, ICE, "")
    console.log('initialize')
  }

  // * HELPER - SNAPSHOT
  async linkToViewerSnapshot(id) {
    await db.collection('users')
      .doc(id).onSnapshot( async document => {
        let data = document.data()
        if ( data ) {
          // GET VIEWER'S ANSWER
          if ( data.answer ) { //&& this.state.pc.localDescription === 'stable'
            console.log('write answer from firebase', time())
            data.answer = JSON.parse(data.answer)
            this.state.pc.setRemoteDescription(new RTCSessionDescription(data.answer.sdp))
            await writeToFirebase(this.state.viewerId, ANSWER, "")
          }
          // GET VIEWER'S ICE CANDIDATES
          if ( data.ice  ) {
            data.ice = JSON.parse(data.ice)
            console.log('get viewer ice', data.ice, time())
            this.state.pc.addIceCandidate(new RTCIceCandidate(data.ice))
          }
        }
      })
  }

  // CDM - CREATE CONNECTION & ICE CANDIDATES, & DISPLAY VIDEO STREAMS
  async createLocalPeerConnectionWithIceCandidates() {

    // CREATE CONNECTION
    const servers = { iceServers: SERVERS };
    await this.setState({ pc: new RTCPeerConnection(servers) });

    // EVENT TO GENERATE ICE CANDIDATES
    // event listener that is triggered as the RTC object receives it's ice
    // candidates and writes them to state
    this.state.pc.onicecandidate = event => {
      if (event.candidate) {
        this.setState({ ice: [...this.state.ice,  event.candidate] });
        console.log('Onicecandidate fired, written to firebase', time())
        // if ( this.state.ice.length > 7 ) {
          writeToFirebase(this.state.streamerId, ICE, JSON.stringify(event.candidate));
        // }
      } else {
        // this.writeToFirebase(this.state.streamerId, ICE, JSON.stringify(this.state.ice));
        console.log('All ice candidates have been received', time());
      }
    };

    // CONNECT VIDEO STREAMS TO PAGE ELEMENTS
    const myVideo = document.getElementById('myVideo');
    const friendsVideo = document.getElementById('friendsVideo');

    // SET LISTENER TO ADD VIEWER'S STREAM
    this.state.pc.onaddstream = event => {
      console.log('viewers stream added to streamer page',  time())
      friendsVideo.srcObject = event.stream
    }

    // ADD STREAM TO VIEW ELEMENT AND ALSO THE WRTC_STREAM
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then(stream => (myVideo.srcObject = stream))
      .then(stream => this.state.pc.addStream(stream));

    console.log('Connection created, ice candidates listener set', time())
  }

  async streamerCreateLocalOfferAddToPeerConnection() {
    // 5. Create an Offer on your computer
    const offer = await this.state.pc.createOffer()

    // 6. Add that Offer to the PeerConnection on your computer
    await this.state.pc.setLocalDescription(offer)

    // 7. Send that Offer to your friend’s computer
    writeToFirebase( this.state.streamerId, OFFER,
      JSON.stringify({ sdp: this.state.pc.localDescription })
    );
    console.log('Offer generated and written to firebase | this.state', time())
  }

  // ######## CDM #########
  // ######## CDM #########
  componentDidMount() {
    this.createLocalPeerConnectionWithIceCandidates()
    if (this.state.viewerId) {
      this.linkToViewerSnapshot(this.state.viewerId)
    }
  }

  // ######## RENDER #######
  // ######## RENDER #######
  render() {

    return (
      <div>
        <video id="myVideo" autoPlay muted />
        <video id="friendsVideo" autoPlay />
        <br />

        <button onClick={this.streamerCreateLocalOfferAddToPeerConnection}
        type="button" className="btn btn-primary btn-lg">
          <span className="glyphicon glyphicon-facetime-video" aria-hidden="true"/>{' '} CreateOfferAndWrite
        </button>

      </div>
    );
  }
}

export default Streamer;
