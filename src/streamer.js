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
    this.writeToFirebase = this.writeToFirebase.bind(this)
    this.readFromFirebase = this.readFromFirebase.bind(this)
    this.initialize = this.initialize.bind(this)
    this.linkToViewerSnapshot = this.linkToViewerSnapshot.bind(this)
    this.createLocalPeerConnectionWithIceCandidates = this.createLocalPeerConnectionWithIceCandidates.bind(this)
    this.streamerCreateLocalOfferAddToPeerConnection = this.streamerCreateLocalOfferAddToPeerConnection.bind(this)

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
    await this.writeToFirebase(this.state.viewerId, ANSWER, "")
    await this.writeToFirebase(this.state.viewerId, ICE, "")
    await this.writeToFirebase(this.state.streamerId, OFFER, "")
    await this.writeToFirebase(this.state.streamerId, ICE, "")
    console.log('initialize')
  }

  // * HELPER - SNAPSHOT
  async linkToViewerSnapshot(id) {
    await db.collection('users')
      .doc(id).onSnapshot( document => {
        console.log('snapshot | document.data()', document.data())
        let data = document.data()
        console.log( 'truth | data ', data ? true : false )
        if ( data ) {
          // GET VIEWER'S ANSWER

          console.log( 'truth | data.answer=', data.answer, 'truth=', data.answer  ? true : false )

          if ( data.answer ) { //&& this.state.pc.localDescription === 'stable'
            data.answer = JSON.parse(data.answer)
            this.state.pc.setRemoteDescription(new RTCSessionDescription(data.answer.sdp))
            this.setState({ ...this.state, ans: data.answer })
            this.writeToFirebase(this.state.viewerId, ANSWER, "")
            console.log('within answer | state: ', this.state)
          }
          // GET VIEWER'S ICE CANDIDATES
          // data.ice = JSON.parse(data.ice)
          console.log( 'truth | data.ice=', data.ice)
          console.log( 'truth=', data.ice ? true : false )
          if ( data.ice  ) {
            data.ice = JSON.parse(data.ice)
            data.ice.forEach(el =>{
              console.log('get viewers ice | inside forEach for ice | el:', el)
              this.state.pc.addIceCandidate(new RTCIceCandidate(el))
            }

              );
            this.setState({ ...this.state, ice: data.ice })
            // this.writeToFirebase(this.state.viewerId, ICE, "")
            console.log('within ice | state: ', this.state)
          }
        }
      })
  }

  // CDM - CREATE CONNECTION & ICE CANDIDATES, & DISPLAY VIDEO STREAMS
  async createLocalPeerConnectionWithIceCandidates() {

    // CREATE CONNECTION
    const servers = { iceServers: SERVERS };
    await this.setState({ pc: new RTCPeerConnection(servers) });

    // GENERATE ICE CANDIDATES
    // event listener that is triggered as the RTC object receives it's ice
    // candidates and writes them to state
    this.state.pc.onicecandidate = event => {
      if (event.candidate) {
        this.setState({ ice: [...this.state.ice,  event.candidate] });
        console.log('Onicecandidate fired, event=', event.candidate)
        if ( this.state.ice.length > 7 ) {
          console.log('writing to FB | state.ice=', this.state.ice)
          this.writeToFirebase(this.state.streamerId, ICE, JSON.stringify(this.state.ice));
        }
      } else {
        this.writeToFirebase(this.state.streamerId, ICE, JSON.stringify(this.state.ice));
        console.log('All ice candidates have been received');
      }
    };

    // CONNECT VIDEO STREAMS TO PAGE ELEMENTS
    const myVideo = document.getElementById('myVideo');
    const friendsVideo = document.getElementById('friendsVideo');

    // SET LISTENER TO ADD VIEWER'S STREAM
    this.state.pc.onaddstream = event => friendsVideo.srcObject = event.stream

    // ADD STREAM TO VIEW ELEMENT AND ALSO THE WRTC_STREAM
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then(stream => (myVideo.srcObject = stream))
      .then(stream => this.state.pc.addStream(stream));

    console.log('Connection created, ice candidates being generated | this.state', this.state)
  }

  async streamerCreateLocalOfferAddToPeerConnection() {
    // 5. Create an Offer on your computer
    const offer = await this.state.pc.createOffer()

    // 6. Add that Offer to the PeerConnection on your computer
    await this.state.pc.setLocalDescription(offer)

    // 7. Send that Offer to your friend’s computer
    this.writeToFirebase( this.state.streamerId, OFFER,
      JSON.stringify({ sdp: this.state.pc.localDescription })
    );
    console.log('Offer generated and written to firebase | this.state', this.state)
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
