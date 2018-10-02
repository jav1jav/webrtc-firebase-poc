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
    this.addFriendsIceCandidates = this.addFriendsIceCandidates.bind(this)
    this.createAnswer = this.createAnswer.bind(this)
    this.sendAnswer = this.sendAnswer.bind(this)
    this.sendIceCandidatesToFriend = this.sendIceCandidatesToFriend.bind(this)
  }

  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
  // * Helper Funcs: read from/ write to firebase
  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

  writeToFirebase(id, field, value) {
    let msg;
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
          .set({ ice: value });
      }
      default: {
        console.log('default switch for writeToFirebase');
      }
    }
    // msg.remove();
  }
  async readFromFirebase(id, field) {
    const document = await db.collection('users').doc(id).get();
    console.log('readFromFirebase', document.data())
    let msg;
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


  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
  // * Helper Funcs: button to console log this.state
  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
  consoleLogThisState() {
    console.log('current this.state', this.state)
  }


  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
  //{/* 4. friend needs to create their own VIEWER peer connection */}
  // 16. Generate Ice Candidates on VIEWER computer
  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
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

    // had to move this out of CDM b/c pc not created till button hit
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
    this.state.pc.onicecandidate = event => {
      if (event.candidate) {
        this.setState({ ice: event.candidate });
        console.log('onicecandidate fired')
      } else {
        console.log('Sent All Ice (aka all ice candidates have been received?)');
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

  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
  //{/* 8. viewer needs to add streamer offer to their peer connection */}
  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
  async viewerGetStreamersOfferAddToPeerConnection() {
    const msg = await this.readFromFirebase(this.state.streamerId, OFFER);
    console.log('spd offer', msg)
    if (msg.sdp.type === 'offer') {
      this.state.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
    } else {
      console.log('error: viewerGetOffer: spd.type is not an offer');
    }
    console.log('end of step 8 (read streamer offer) | this.state', this.state)
  }

  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
  // 11. Add friend's ICE Candidates on your computer
  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
  async addFriendsIceCandidates() {
    const msg = await this.readFromFirebase(this.state.streamerId, ICE);
    console.log('add stremer ice, msg', msg)
    msg.forEach(el =>
     this.state.pc.addIceCandidate(new RTCIceCandidate(el))
    )
    console.log('end of step 11 (add stremer ice) | this.state', this.state)
  }

  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
  // 12. Create an Answer on your friend’s VIEWER computer
  // 13. Add that Answer to the PeerConnection on your friend’s computer
  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
  createAnswer() {
    this.state.pc.createAnswer().then(answer => this.state.pc.setLocalDescription(answer));
    console.log('end of step 12, 13 (create answer) | this.state', this.state)
  }

  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
  // 14. Send that Answer to STREAMER computer
  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
  sendAnswer() {
    this.writeToFirebase(this.state.viewerId, ANSWER, JSON.stringify({ 'sdp': this.state.pc.localDescription }));
    console.log('end of step 14 (write answer) | this.state', this.state)
  }

  // 16. Generate Ice Candidates on VIEWER computer - SEE STEP 4 and
  // componentDidMount !!!

  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
  // 17. Send your ICE Candidates to your friend’s computer
  // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
  sendIceCandidatesToFriend() {
    this.writeToFirebase(this.state.viewerId, ICE, JSON.stringify(this.state.ice));
    console.log('end of step 17 (write ice) | this.state', this.state)
  }

  componentDidMount() {

  }

  render() {
    return (
      <div>
        <video id="myVideo" autoPlay muted />
        <video id="friendsVideo" autoPlay />
        <br />
        <button
          onClick={this.consoleLogThisState}
          type="button"
          className="btn btn-primary btn-lg"
        >
          consoleLogThisState
        </button>
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
