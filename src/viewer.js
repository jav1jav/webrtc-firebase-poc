import React, { Component } from 'react';
import db from './firebase';

const ICE = 'ice';
const OFFER = 'offer';
const ANSWER = 'answer';

class Viewer extends Component {
  constructor() {
    super();
    this.state = {
      viewerId: 'viewer',
      streamerId: 'streamer',
      pc: {},
      ice: {}
    };
    this.consoleLogThisState = this.consoleLogThisState.bind(this)
    this.writeToFirebase = this.writeToFirebase.bind(this)
    this.readFromFirebase = this.readFromFirebase.bind(this)
    this.createLocalPeerConnectionWithIceCandidates = this.createLocalPeerConnectionWithIceCandidates.bind(this) // 4
    this.viewerGetStreamersOfferAddToPeerConnection = this.viewerGetStreamersOfferAddToPeerConnection.bind(this) // 8
    // this.addFriendsIceCandidates = this.addFriendsIceCandidates.bind(this)
    // this.createAnswer = this.createAnswer.bind(this)
    // this.sendAnswer = this.sendAnswer.bind(this)
    // this.sendIceCandidatesToFriend = this.sendIceCandidatesToFriend.bind(this)
  }

  // * Helper Funcs: read from/ write to firebase

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

  // * Helper Funcs: button to console log this.state
  consoleLogThisState() {
    console.log('current this.state', this.state)
  }

  //{/* 4. friend needs to create their own VIEWER peer connection */}
  async createLocalPeerConnectionWithIceCandidates() {
    const servers = {
      iceServers: [
        { urls: 'stun:stun.services.mozilla.com' },
        { urls: 'stun:stun.l.google.com:19302' },
        {
          urls: 'turn:numb.viagenie.ca',
          credential: 'webrtc',
          username: 'javier3@gmail.com'
        }
      ]
    };
    await this.setState({
      pc: new RTCPeerConnection(servers)
    });

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

    const myVideo = document.getElementById('myVideo');
    const friendsVideo = document.getElementById('friendsVideo');

    this.state.pc.onaddstream = event => (friendsVideo.srcObject = event.stream);

    //Show my face
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then(stream => (myVideo.srcObject = stream))
      .then(stream => this.state.pc.addStream(stream));

    console.log('end of step 4 (create PC) | this.state', this.state)
  }

  //{/* 8. viewer needs to add streamer offer to their peer connection */}
  async viewerGetStreamersOfferAddToPeerConnection() {
    const msg = await this.readFromFirebase(this.state.streamerId, OFFER);
    console.log('spd offer', msg)
    if (msg.sdp.type === 'offer') {
      this.state.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
    } else {
      console.log('error: viewerGetOffer: spd.type is not an offer');
    }
    console.log('end of step 8 (read streamer offer) | this.state', this.state)


    // 11. Add friend's ICE Candidates on your computer
    const msg2 = await this.readFromFirebase(this.state.streamerId, ICE);
    console.log('step 11. add viewer ice, msg', msg2)
    msg2.forEach(el =>
     this.state.pc.addIceCandidate(new RTCIceCandidate(el))
    )
    console.log('end of step 11 (add stremer ice) | this.state', this.state)

    // 12. Create an Answer on your friend’s VIEWER computer
    // 13. Add that Answer to the PeerConnection on your friend’s computer
    // 14. Send that Answer to STREAMER computer
    const answer = await this.state.pc.createAnswer()
    await this.state.pc.setLocalDescription(answer);
    console.log('end of step 12, 13 (create answer) | this.state', this.state, 'localDescription', this.state.pc  )
    this.writeToFirebase(this.state.viewerId, ANSWER, JSON.stringify({ 'sdp': this.state.pc.localDescription }));
    console.log('end of step 14 (write answer) | this.state', this.state)

    // 16. Generate Ice Candidates on VIEWER computer - SEE STEP 4
    // 17. Send your ICE Candidates to your friend’s computer
    this.writeToFirebase(this.state.viewerId, ICE, JSON.stringify(this.state.ice));
    console.log('end of step 17 (write ice) | this.state', this.state)

  }

  componentDidMount() {
    this.createLocalPeerConnectionWithIceCandidates()
    console.log( 'streamer.js | CDM | createLocalPeerConnectionWithIceCandidates has run')
    this.viewerGetStreamersOfferAddToPeerConnection()
    console.log( 'streamer.js | CDM | createLocalPeerConnectionWithIceCandidates has run')
  }

  render() {
    return (
      <div>
        <video id="myVideo" autoPlay muted />
        <video id="friendsVideo" autoPlay />
        <br />

        {/*<button
          onClick={this.sendIceCandidatesToFriend}
          type="button"
          className="btn btn-primary btn-lg"
        >
          17. sendIceCandidatesToFriend
        </button> */}


        {/* <button onClick={this.viewerGetStreamersOfferAddToPeerConnection}
        type="button" className="btn btn-primary btn-lg">
          <span className="glyphicon glyphicon-facetime-video" aria-hidden="true"/>{' '} CreateAnswer and Write
        </button> */}

      </div>
    );
  }
}

export default Viewer;
