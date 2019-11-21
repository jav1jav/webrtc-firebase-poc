import React, { Component } from 'react';
import db from './firebase';
import { ICE, OFFER, ONLINE, ANSWER, STUN_SERVERS } from './constants'
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
    // this.connectVideoStreamsToPageElements = this.connectVideoStreamsToPageElements.bind(this)
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
    const servers = { iceServers: STUN_SERVERS };
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
    }
  }

  async connectVideoStreamsToPageElements() {
    // CONNECT VIDEO STREAMS TO PAGE ELEMENTS
    const myVideo = document.getElementById('myVideo');
    const friendsVideo = document.getElementById('friendsVideo');

    // SET LISTENER TO ADD VIEWER'S STREAM
    let inboundStream = null
    this.state.pc.ontrack = event => {
      if (event.streams && event.streams[0]) {
        friendsVideo.srcObject = event.streams[0]
      } else {
        if (!inboundStream) {
          inboundStream = new MediaStream()
          friendsVideo.srcObject = inboundStream
        }
        inboundStream.addTrack(event.track)
      }
    }
    // ADD STREAM TO VIEW ELEMENT AND ALSO THE WRTC_STREAM
    const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    // console.log(mediaStream)
    myVideo.srcObject = mediaStream
    mediaStream.getTracks().forEach(track => this.state.pc.addTrack(track, mediaStream))
  }



  async componentDidMount() {
    await this.createLocalPeerConnectionWithIceCandidates()
    this.connectVideoStreamsToPageElements()
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
