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
  }

  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
  // * Helper Funcs: read from/ write to firebase
  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

  writeToFirebase(id, field, value) {
    let msg;
    switch (field) {
      case 'string1': {
        return db
          .collection('users')
          .doc(id)
          .set({ string1: value });
      }
      default: {
        console.log('default switch for writeToFirebase');
      }
    }
    // msg.remove();
  }
  readFromFirebase(id, field) {
    const document = db.collection('users').doc(id);
    let msg;
    switch (field) {
      case 'string1': {
        return JSON.parse(document.data().string1);
      }
      default: {
        console.log('default switch for writeToFirebase');
      }
    }
  }

  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
  //{/* 4. friend needs to create their own VIEWER peer connection */}
  // 16. Generate Ice Candidates on VIEWER computer
  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
  createLocalPeerConnectionWithIceCandidates() {
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
    this.setState({
      pc: new RTCPeerConnection(servers)
    });
  }

  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
  //{/* 8. viewer needs to add streamer offer to their peer connection */}
  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
  viewerGetStreamersOfferAddToPeerConnection() {
    const msg = this.readFromFirebase(this.streamerId, OFFER);
    if (msg.sdp.type === 'offer') {
      this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
    } else {
      console.log('error: viewerGetOffer: spd.type is not an offer');
    }
  }

  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
  // 11. Add friend's ICE Candidates on your computer
  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
  addFriendsIceCandidates() {
    const msg = this.readFromFirebase(this.streamerId, ICE);
    this.pc.addIceCandidate(new RTCIceCandidate(msg.ice));
  }

  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
  // 12. Create an Answer on your friend’s VIEWER computer
  // 13. Add that Answer to the PeerConnection on your friend’s computer
  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
  createAnswer() {
    this.pc.createAnswer().then(answer => this.pc.setLocalDescription(answer));
  }

  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
  // 14. Send that Answer to STREAMER computer
  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
  sendAnswer() {
    this.writeToFirebase(this.streamerId, ANSWER, JSON.stringify({ sdp: this.pc.localDescription }));
  }

  // 16. Generate Ice Candidates on VIEWER computer - SEE STEP 4 and
  // componentDidMount !!!

  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
  // 17. Send your ICE Candidates to your friend’s computer
  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
  sendIceCandidatesToFriend() {
    this.writeToFirebase(this.viewerId, ICE, JSON.stringify(this.state.ice));
  }

  componentDidMount() {
    const myVideo = document.getElementById('myVideo');
    const friendsVideo = document.getElementById('friendsVideo');

    // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
    // 16. Generate / Store received Ice candidates
    // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
    // in VIEWER step 4. we create peerConnection and specify STUN servers.
    // Those servers send ICE Candidates, and add them to the PeerConnection
    // automatically. This statement sets the event listener for that event.
    // The trick is we need to access these ICE candidates and send them to our
    // STREAMER to add to his PC.
    // We use this event listener to save ICE Candidates to this.state and then
    // in 17. we write to firebase, and 18. the STREAMER reads those values
    // and adds to his peerConnection
    // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
    this.pc.onicecandidate = event => {
      if (event.candidate) {
        this.setState({ ice: event.candidate });
      } else {
        console.log('Sent All Ice');
      }
    };

    this.pc.onaddstream = event => (friendsVideo.srcObject = event.stream);

    //Show my face
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then(stream => (myVideo.srcObject = stream))
      .then(stream => this.pc.addStream(stream));

  }

  render() {
    return (
      <div>
        <video id="myVideo" autoPlay muted />
        <video id="friendsVideo" autoPlay />
        <button
          onClick={this.createLocalPeerConnectionWithIceCandidates}
          type="button"
          className="btn btn-primary btn-lg"
        >
          4. createLocalPeerConnectionWithIceCandidates
        </button>
        <button
          onClick={this.viewerGetStreamersOfferAddToPeerConnection}
          type="button"
          className="btn btn-primary btn-lg"
        >
          8. viewerGetStreamersOfferAddToPeerConnection
        </button>
        <button
          onClick={this.addFriendsIceCandidates}
          type="button"
          className="btn btn-primary btn-lg"
        >
          11. addFriendsIceCandidates
        </button>
        <button
          onClick={this.createAnswer}
          type="button"
          className="btn btn-primary btn-lg"
        >
          12. 13. createAnswer
        </button>
        <button
          onClick={this.sendAnswer}
          type="button"
          className="btn btn-primary btn-lg"
        >
          14. sendAnswer
        </button>
        <button
          onClick={this.sendIceCandidatesToFriend}
          type="button"
          className="btn btn-primary btn-lg"
        >
          17. sendIceCandidatesToFriend
        </button>
        {/* <br />
        <button
          onClick={this.showFriendsFace}
          type="button"
          className="btn btn-primary btn-lg"
        >
          <span
            className="glyphicon glyphicon-facetime-video"
            aria-hidden="true"
          />{' '}
          Call
        </button> */}
      </div>
    );
  }
}

export default Viewer;
