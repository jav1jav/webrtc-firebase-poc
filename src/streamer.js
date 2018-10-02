import React, { Component } from 'react';
import db from './firebase';

const ICE = 'ice';
const OFFER = 'offer';
const ANSWER = 'answer';

class Streamer extends Component {
  constructor() {
    super();
    this.state = {
      viewerId: 'viewer',
      streamerId: 'streamer',
      pc: {},
      ice: {}
    };
  }

  // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
  // * Helper Funcs: read from/ write to firebase
  // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS

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

  // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
  // 3. Create a PeerConnection on STREAMER computer
  // 9. Generate Ice Candidates on STREAMER computer
  // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
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

  //{/* 4. friend needs to create their own peer connection */}

  streamerCreateLocalOfferAddToPeerConnection() {
    // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
    // 5. Create an Offer on your computer
    // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
    this.pc
      .createOffer()
      // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
      // 6. Add that Offer to the PeerConnection on your computer
      // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
      .then(offer => this.pc.setLocalDescription(offer));
  }

  // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
  // 7. Send that Offer to your friend’s computer
  // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
  streamerWriteOffer() {
    this.writeToFirebase(
      this.streamerId,
      OFFER,
      JSON.stringify({ sdp: this.pc.localDescription })
    );
  }

  //{/* 8. friend needs to add offer to their peer connection */}

  // 9. Generate ICE Candidates on STREMER computer - see step 3 and
  // comment in componentDidMount

  // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
  // 10. Send those ICE Candidates to your friend’s computer
  // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
  sendIceCandidatesToFriend() {
    this.writeToFirebase(this.streamerId, ICE, JSON.stringify(this.state.ice));
  }

  //{/* 11. Add STREMERs ICE Candidates on VIEWER computer */}
  //{/* 12. Create an Answer on your friend’s VIEWER computer */}
  //{/* 13. Add that Answer to the PeerConnection on your friend’s computer */}
  //{/* 14. Send that Answer to STREAMER computer */}

  // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
  // 15. Add that Answer to the PeerConnection on your computer
  // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
  addAnswerToPeerConnection() {
    const ans = this.readFromFirebase(this.viewerId, ANSWER);
    //if (msg.sdp.type == 'answer')
    this.pc.setRemoteDescription(new RTCSessionDescription(ans));
  }

  //{/* 16. Generate Ice Candidates on VIEWER computer */}
  //{/* 17. Send VIEWER ICE Candidates to your STREMERS computer */}

  // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
  // 18. Add friend's ICE Candidates on your computer
  // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
  addFriendsIceCandidates() {
    const msg = this.readFromFirebase(this.viewerId, ICE);
    this.pc.addIceCandidate(new RTCIceCandidate(msg.ice));
  }

  componentDidMount() {
    const myVideo = document.getElementById('myVideo');
    const friendsVideo = document.getElementById('friendsVideo');

    // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
    // 9. Generate / Store received Ice candidates
    // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
    // in STREAMER step 3. we create peerConnection and specify STUN servers.
    // Those servers send ICE Candidates, and add them to the PeerConnection
    // automatically. This statement sets the event listener for that event.
    // The trick is we need to access these ICE candidates and send them to our
    // VIEWER to add to his PC.
    // We use this event listener to save ICE Candidates to this.state and then
    // in 10. we write to firebase, and 11. the VIEWER reads those values
    // and adds to his peerConnection
    // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
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
        <br />
        <button
          onClick={this.createLocalPeerConnectionWithIceCandidates}
          type="button"
          className="btn btn-primary btn-lg"
        >
          3. createLocalPeerConnectionWithIceCandidates
        </button>
        {/* 4. friend needs to create their own peer connection */}
        <button
          onClick={this.streamerCreateLocalOfferAddToPeerConnection}
          type="button"
          className="btn btn-primary btn-lg"
        >
          5. 6. streamerCreateLocalOfferAddToPeerConnection
        </button>
        <button
          onClick={this.streamerWriteOffer}
          type="button"
          className="btn btn-primary btn-lg"
        >
          7. streamerWriteOffer
        </button>
        {/* 8. friend needs to add offer to their peer connection */}
        {/* 9. ice candidates rendered in 3 and in CDM */}
        <button
          onClick={this.sendIceCandidatesToFriend}
          type="button"
          className="btn btn-primary btn-lg"
        >
          10. sendIceCandidatesToFriend
        </button>
        {/* 11. friend needs to add ice candidates to their peer connection*/}
        {/* 12. 13. friend creates answer on their computer and adds to peer connection*/}
        {/* 14. friend sends answer to me local here*/}
        <button
          onClick={this.addAnswerToPeerConnection}
          type="button"
          className="btn btn-primary btn-lg"
        >
          15. addAnswerToPeerConnection
        </button>
        {/* 16. 17. friend generates ice candidates and sends them to me local here */}
        <button
          onClick={this.addFriendsIceCandidates}
          type="button"
          className="btn btn-primary btn-lg"
        >
          18. addFriendsIceCandidates
        </button>
        {/* <button onClick={this.displayMediaStream} type="button" className="btn btn-primary btn-lg">xxx</button> */}
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

export default Streamer;
