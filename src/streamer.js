import React, { Component } from 'react';
import db from './firebase';
import { ICE, OFFER, ONLINE, ANSWER, SERVERS } from './constants'
import {
  areThereIceCandidates,
  isPropertyAnIceCandidate,
  writeToFirebase,
  deleteFromFirebase
} from './utilities'

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
    this.linkToViewerSnapshot = this.linkToViewerSnapshot.bind(this)
    this.createLocalPeerConnectionWithIceCandidates = this.createLocalPeerConnectionWithIceCandidates.bind(this)
  }

  // * LINK TO FIREBASE SNAPSHOT
  async linkToViewerSnapshot(id) {
    await db.collection('users')
      .doc(id).onSnapshot( async document => {
        let data = document.data()
        if ( data ) {
          if ( data.online ) {
            // CREATE OFFER, SET LOCALLY AND SEND TO VIEWER
            const offer = await this.state.pc.createOffer()
            await this.state.pc.setLocalDescription(offer)
            await writeToFirebase( this.state.streamerId, OFFER,
              JSON.stringify({ sdp: this.state.pc.localDescription })
            );
            await deleteFromFirebase(this.state.viewerId, ONLINE )
          }
          // GET AND ADD VIEWER'S ANSWER
          if ( data.answer ) { //&& this.state.pc.localDescription === 'stable'
            data.answer = JSON.parse(data.answer)
            this.state.pc.setRemoteDescription(new RTCSessionDescription(data.answer.sdp))
            await deleteFromFirebase(this.state.viewerId, ANSWER)
          }
          // PROCESS ICE CANDIDATES
          if ( areThereIceCandidates(data) ) {
            for(let prop in data) {
              if ( isPropertyAnIceCandidate(prop) ) {
                let candidate = JSON.parse(data[prop])
                this.state.pc.addIceCandidate(new RTCIceCandidate(candidate))
                await deleteFromFirebase(this.state.viewerId, prop)
              }
            }
          }
        }
      })
  }

  // CREATE CONNECTION & ICE CANDIDATES, & DISPLAY VIDEO STREAMS
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
        writeToFirebase(this.state.streamerId, ICE,
          JSON.stringify(event.candidate));
      } else {
        // console.log('All ice candidates have been received', time());
      }
    };

    // CONNECT VIDEO STREAMS TO PAGE ELEMENTS
    const myVideo = document.getElementById('myVideo');
    const friendsVideo = document.getElementById('friendsVideo');

    // SET LISTENER TO ADD VIEWER'S STREAM
    this.state.pc.onaddstream = event => {
      friendsVideo.srcObject = event.stream
    }

    // ADD STREAM TO VIEW ELEMENT AND ALSO THE WRTC_STREAM
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then(stream => (myVideo.srcObject = stream))
      .then(stream => this.state.pc.addStream(stream));

  }

  // ######## CDM #########
  componentDidMount() {
    this.createLocalPeerConnectionWithIceCandidates()
    if (this.state.viewerId) {
      this.linkToViewerSnapshot(this.state.viewerId)
    }
  }

  // ######## RENDER #######
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

export default Streamer;
