import React, { Component } from 'react';
import db from './firebase';

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

let streamerIceCounter = 0

let time = ( function () {
  let start = Math.floor(Date.now() / 1000)
  return function() {
    return Math.floor(Date.now() / 1000) - start
  }
})()

class Viewer extends Component {
  constructor() {
    super();
    this.state = {
      viewerId: 'viewer',
      streamerId: 'streamer',
      pc: {},
      ice: {}
    };
    this.writeToFirebase = this.writeToFirebase.bind(this)
    this.readFromFirebase = this.readFromFirebase.bind(this)
    this.areThereIceCandidates = this.areThereIceCandidates.bind(this)
    this.isPropertyAnIceCandidate = this.isPropertyAnIceCandidate.bind(this)
    this.createLocalPeerConnectionWithIceCandidates = this.createLocalPeerConnectionWithIceCandidates.bind(this) // 4
    // this.viewerGetStreamersOfferAddToPeerConnection = this.viewerGetStreamersOfferAddToPeerConnection.bind(this) // 8
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
          .set({ answer: value });
      }
      case ICE: {
        return db
          .collection('users')
          .doc(id)
          .set({ ice: value }, { merge: true });
      }
      default: {
        console.log('default switch for writeToFirebase');
      }
    }
  }

  // * HELPER - READ
  async readFromFirebase(id, field) {
    const document = await db.collection('users').doc(id).get();
    switch (field) {
      case OFFER: {
        return JSON.parse(document.data().offer);
      }
      case ICE: {
        return JSON.parse(document.data()['ice' + ++streamerIceCounter]);
      }
      default: {
        console.log('default switch for writeToFirebase');
      }
    }
  }

  // * HELPER - SNAPSHOT
  async linkToViewerSnapshot(id) {
    await db.collection('users')
      .doc(id).onSnapshot( async document => {
        let data = document.data()
        if (data) {
          console.log('data', data)
          // ADD STREAMER OFFER
          if (data.offer) {
            console.log('get offer, add to rtc obj', time())
             data.offer = JSON.parse(data.offer)
             this.state.pc.setRemoteDescription(new RTCSessionDescription(data.offer.sdp))
             await this.writeToFirebase(this.state.streamerId, OFFER, "")
            // GENERATE ANSWER AND ADD TO RTC OBJ
            const answer = await this.state.pc.createAnswer();
            await this.state.pc.setLocalDescription(answer);
            // WRITE ANSWER TO FIREBASE
            console.log('write answer to firebase', time())
            this.writeToFirebase(this.state.viewerId, ANSWER, JSON.stringify({ 'sdp': this.state.pc.localDescription }));
          }
          // GET STREAMER'S ICE CANDIDATES
          if ( this.areThereIceCandidates(data) ) {
            for(let prop in data) {
              if ( this.isPropertyAnIceCandidate(prop) ) {
                let candidate = JSON.parse(data[prop])
                console.log('get streamer ice | key name:', prop, 'candidate:', candidate, time())
                this.state.pc.addIceCandidate(new RTCIceCandidate(candidate))
                // await this.writeToFirebase(this.state.streamerId, OFFER, "")
              }
            }
          }
        }


      })
  }

  isPropertyAnIceCandidate (str) {
    return (str.indexOf('ice') >= 0)
  }

  areThereIceCandidates (obj) {
    let keys = Object.keys(obj)
    for(let k of keys) {
      if (this.isPropertyAnIceCandidate(k)) return true
    }
    return false
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
        this.setState({ ice: [...this.state.ice,  event.candidate]  });
        console.log('onicecandidate fired',  time())
        // if ( this.state.ice.length >= 3 ) {
          this.writeToFirebase(this.state.viewerId, ICE, JSON.stringify(event.candidate));
        // }
      } else {
        console.log('All ice candidates have been received',  time());
        // this.writeToFirebase(this.state.viewerId, ICE, JSON.stringify(this.state.ice));
      }
    };

    // CONNECT VIDEO STREAMS TO PAGE ELEMENTS
    const myVideo = document.getElementById('myVideo');
    const friendsVideo = document.getElementById('friendsVideo');

    // SET LISTENER TO ADD VIEWER'S STREAM
    this.state.pc.onaddstream = event => {
      console.log('streamer stream added to viewer page',  time())
      friendsVideo.srcObject = event.stream
    };

    // ADD STREAM TO VIEW ELEMENT AND ALSO THE WRTC_STREAM
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then(stream => (myVideo.srcObject = stream))
      .then(stream => this.state.pc.addStream(stream));

      console.log('Connection created, ice candidates listerner set',  time())
  }

  // async viewerGetStreamersOfferAddToPeerConnection() {

  //   // GET STREAMER OFFER, ADD TO RTC OBJECT
  //   const msg = await this.readFromFirebase(this.state.streamerId, OFFER);
  //   if (msg.sdp.type === 'offer') {
  //     this.state.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
  //   } else {
  //     console.log('error: viewerGetOffer: spd.type is not an offer');
  //   }

  //   // CREATE ANSWER, ADD TO RTC OBJECT
  //   const answer = await this.state.pc.createAnswer()
  //   await this.state.pc.setLocalDescription(answer);

  //   // WRITE ANSWER TO FIREBASE FOR STREAMER TO READ
  //   this.writeToFirebase(this.state.viewerId, ANSWER, JSON.stringify({ 'sdp': this.state.pc.localDescription }));

  // }

  async componentDidMount() {
    await this.createLocalPeerConnectionWithIceCandidates()
    // await this.viewerGetStreamersOfferAddToPeerConnection()
    if (this.state.streamerId) {
      await this.linkToViewerSnapshot(this.state.streamerId)
    }

  }

  render() {
    return (
      <div>
        <video id="myVideo" autoPlay muted />
        <video id="friendsVideo" autoPlay />
        <br />
      </div>
    );
  }
}

export default Viewer;
