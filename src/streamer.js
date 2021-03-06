import React, { Component } from 'react';
import db from './firebase';
import { ICE, OFFER, ONLINE, ANSWER, STUN_SERVERS } from './constants'
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
      tracks: []
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
    const servers = { iceServers: STUN_SERVERS };
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
    mediaStream.getTracks().forEach(track => {
      let foo = this.state.pc.addTrack(track, mediaStream)
      this.setState({tracks: [...this.state.tracks, foo]})
    } )
  }


  componentWillUnmount () {
    this.state.tracks.forEach(track => this.state.pc.removeTrack(track))
    this.state.pc.close()
  }

  // ######## CDM #########
  async componentDidMount() {
    await this.createLocalPeerConnectionWithIceCandidates()
    this.connectVideoStreamsToPageElements()
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
