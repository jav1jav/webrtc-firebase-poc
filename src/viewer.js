import React, { Component } from 'react';
import db from './firebase';
import { ICE, OFFER, ONLINE, ANSWER, SERVERS } from './constants'
import {
  areThereIceCandidates,
  isPropertyAnIceCandidate,
  writeToFirebase,
  deleteFromFirebase
} from './utilities'

class Viewer extends Component {
  constructor() {
    super();
    this.state = {
      viewerId: 'viewer',
      streamerId: 'streamer',
      pc: {},
      ice: {}
    };
    this.createLocalPeerConnectionWithIceCandidates = this.createLocalPeerConnectionWithIceCandidates.bind(this) // 4
  }


  // * LINK TO FIREBASE SNAPSHOT
  async linkToViewerSnapshot(id) {
    await db.collection('users')
      .doc(id).onSnapshot( async document => {
        let data = document.data()
        if (data) {
          // GET AND ADD STREAMER OFFER
          if (data.offer) {
            data.offer = JSON.parse(data.offer)
            this.state.pc.setRemoteDescription(new RTCSessionDescription(data.offer.sdp))
            await deleteFromFirebase(this.state.streamerId, OFFER)
            // CREATE ANSWER, ADD LOCALLY TO RTC OBJ, SEND TO STREAMER
            const answer = await this.state.pc.createAnswer();
            await this.state.pc.setLocalDescription(answer);
            writeToFirebase(this.state.viewerId, ANSWER,
              JSON.stringify({ sdp: this.state.pc.localDescription }));
          }
          // PROCESS ICE CANDIDATES
          if ( areThereIceCandidates(data) ) {
            for(let prop in data) {
              if ( isPropertyAnIceCandidate(prop) ) {
                let candidate = JSON.parse(data[prop])
                this.state.pc.addIceCandidate(new RTCIceCandidate(candidate))
                await deleteFromFirebase(this.state.streamerId, prop)
              }
            }
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
        this.setState({ ice: [...this.state.ice,  event.candidate]  });
        writeToFirebase(this.state.viewerId, ICE,
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
    };

    // ADD STREAM TO VIEW ELEMENT AND ALSO THE WRTC_STREAM
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then(stream => (myVideo.srcObject = stream))
      .then(stream => this.state.pc.addStream(stream));
  }


  async componentDidMount() {
    await this.createLocalPeerConnectionWithIceCandidates()
    await writeToFirebase(this.state.viewerId, ONLINE, true);
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
