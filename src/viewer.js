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
    this.createLocalPeerConnectionWithIceCandidates = this.createLocalPeerConnectionWithIceCandidates.bind(this) // 4
    this.viewerGetStreamersOfferAddToPeerConnection = this.viewerGetStreamersOfferAddToPeerConnection.bind(this) // 8
  }

  // * HELPER - WRITE
  writeToFirebase(id, field, value) {
    switch (field) {
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
    console.log('readFromFirebase', document.data())
    switch (field) {
      case OFFER: {
        return JSON.parse(document.data().offer);
      }
      case ICE: {
        return JSON.parse(document.data().ice);
      }
      default: {
        console.log('default switch for writeToFirebase');
      }
    }
  }

  // * HELPER - SNAPSHOT
  async linkToViewerSnapshot(id) {
    await db.collection('users')
      .doc(id).onSnapshot( document => {
        console.log('snapshot | document.data()', document.data())
        let data = document.data()
        console.log( 'truth | data ', data ? true : false )

        console.log( 'truth | data.ice=', data.ice, 'truth=', data.ice ? true : false )

        if ( data.ice  ) {
          data.ice = JSON.parse(data.ice)
          data.ice.forEach(el => {
            console.log('inside forEach for ice | el:', JSON.parse(el))
            this.state.pc.addIceCandidate(new RTCIceCandidate(JSON.parse(el)))
          })
          this.setState({ ...this.state, ice: data.ice })
          this.writeToFirebase(this.state.viewerId, ICE, "")
          console.log('within ice | state: ', this.state)
        }

      })
  }

  // CDM - CREATE CONNECTION & ICE CANDIDATES, & DISPLAY VIDEO STREAMS
  async createLocalPeerConnectionWithIceCandidates() {
    const servers = { iceServers: SERVERS };
    await this.setState({ pc: new RTCPeerConnection(servers) });

    // GENERATE ICE CANDIDATES
    // event listener that is triggered as the RTC object receives it's ice
    // candidates and writes them to state
    this.state.pc.onicecandidate = event => {
      if (event.candidate) {
        this.setState({ ice: event.candidate });
        console.log('onicecandidate fired')
      } else {
        console.log('Sent All Ice (aka all ice candidates have been received?)', this.state);
      }
    };

    // CONNECT VIDEO STREAMS TO PAGE ELEMENTS
    const myVideo = document.getElementById('myVideo');
    const friendsVideo = document.getElementById('friendsVideo');

    // SET LISTENER TO ADD VIEWER'S STREAM
    this.state.pc.onaddstream = event => (friendsVideo.srcObject = event.stream);

    // ADD STREAM TO VIEW ELEMENT AND ALSO THE WRTC_STREAM
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then(stream => (myVideo.srcObject = stream))
      .then(stream => this.state.pc.addStream(stream));

      console.log('Connection created, ice candidates being generated | this.state', this.state)
  }

  async viewerGetStreamersOfferAddToPeerConnection() {

    // GET STREAMER OFFER, ADD TO RTC OBJECT
    const msg = await this.readFromFirebase(this.state.streamerId, OFFER);
    if (msg.sdp.type === 'offer') {
      this.state.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
    } else {
      console.log('error: viewerGetOffer: spd.type is not an offer');
    }

    // CREATE ANSWER, ADD TO RTC OBJECT
    const answer = await this.state.pc.createAnswer()
    await this.state.pc.setLocalDescription(answer);

    // WRITE ANSWER TO FIREBASE FOR STREAMER TO READ
    this.writeToFirebase(this.state.viewerId, ANSWER, JSON.stringify({ 'sdp': this.state.pc.localDescription }));

    this.writeToFirebase(this.state.viewerId, ICE, JSON.stringify(this.state.ice));

  }

  componentDidMount() {
    this.createLocalPeerConnectionWithIceCandidates()
    if (this.state.streamerId) {
      this.linkToViewerSnapshot(this.state.streamerId)
    }
    this.viewerGetStreamersOfferAddToPeerConnection()
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
