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
      ice: []
    };
    this.consoleLogThisState = this.consoleLogThisState.bind(this)
    this.writeToFirebase = this.writeToFirebase.bind(this)
    this.readFromFirebase = this.readFromFirebase.bind(this)
    this.createLocalPeerConnectionWithIceCandidates = this.createLocalPeerConnectionWithIceCandidates.bind(this) // 3
    this.streamerCreateLocalOfferAddToPeerConnection = this.streamerCreateLocalOfferAddToPeerConnection.bind(this) // 5, 6
    this.streamerWriteOffer = this.streamerWriteOffer.bind(this) // 7
    this.sendIceCandidatesToFriend = this.sendIceCandidatesToFriend.bind(this)
    this.addAnswerToPeerConnection = this.addAnswerToPeerConnection.bind(this)
    this.addFriendsIceCandidates = this.addFriendsIceCandidates.bind(this)
  }

  // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
  // * Helper Funcs: read from/ write to firebase
  // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS

  writeToFirebase(id, field, value) {
    let msg;
    switch (field) {
      case OFFER: {
        return db
          .collection('users')
          .doc(id)
          .set({ offer: value });
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
    let msg;
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

  // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
  // * Helper Funcs: button to console log this.state
  // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
  consoleLogThisState() {
    console.log('current this.state', this.state)
  }


  // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
  // 3. Create a PeerConnection on STREAMER computer
  // 9. Generate Ice Candidates on STREAMER computer
  // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
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

    //write --->
    // beavercode -->
    //JSON.stringify({'ice': event.candidate})

    // our current result --->
    // ice: {"candidate":"candidate:453802058 1 udp 41885439 158.69.221.198 60391 typ relay raddr 24.6.150.102 rport 64620 generation 0 ufrag woSi network-id 1 network-cost 10","sdpMid":"video","sdpMLineIndex":1}

    //read --->
    // beavercode -->
    //const msg = JSON.parse(info.data().message);
    //pc.addIceCandidate(new RTCIceCandidate(msg.ice));

    this.state.pc.onicecandidate = event => {
      if (event.candidate) {
        this.setState({ ice: [...this.state.ice, event.candidate] });
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

    console.log('end of step 3 (create PC) | this.state', this.state)
  }

  //{/* 4. friend needs to create their own peer connection */}

  streamerCreateLocalOfferAddToPeerConnection() {
    // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
    // 5. Create an Offer on your computer
    // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
    this.state.pc
      .createOffer()
      // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
      // 6. Add that Offer to the PeerConnection on your computer
      // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
      .then(offer => this.state.pc.setLocalDescription(offer));
    console.log('end of step 5 (offer) | this.state', this.state)
  }

  // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
  // 7. Send that Offer to your friend’s computer
  // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
  streamerWriteOffer() {
    this.writeToFirebase(
      this.state.streamerId,
      OFFER,
      JSON.stringify({ sdp: this.state.pc.localDescription })
    );
    console.log('end of step 7 (write offer) | this.state', this.state)
  }

  //{/* 8. friend needs to add offer to their peer connection */}

  // 9. Generate ICE Candidates on STREMER computer - see step 3 and
  // comment in componentDidMount

  // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
  // 10. Send those ICE Candidates to your friend’s computer
  // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
  sendIceCandidatesToFriend() {
    this.writeToFirebase(this.state.streamerId, ICE, JSON.stringify(this.state.ice));
    console.log('end of step 10 (write ice) | this.state', this.state)
  }

  //{/* 11. Add STREMERs ICE Candidates on VIEWER computer */}
  //{/* 12. Create an Answer on your friend’s VIEWER computer */}
  //{/* 13. Add that Answer to the PeerConnection on your friend’s computer */}
  //{/* 14. Send that Answer to STREAMER computer */}

  // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
  // 15. Add that Answer to the PeerConnection on your computer
  // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
  async addAnswerToPeerConnection() {
    const ans = await this.readFromFirebase(this.state.viewerId, ANSWER);
    if (ans.sdp.type === 'answer') console.log('bingo')
    console.log('answer from viewer', ans)
    console.log('ans.spd', ans.sdp)
    this.state.pc.setRemoteDescription(new RTCSessionDescription(ans.sdp));
    console.log('end of step 15 (read and add answer) | this.state', this.state)
  }

  //{/* 16. Generate Ice Candidates on VIEWER computer */}
  //{/* 17. Send VIEWER ICE Candidates to your STREMERS computer */}

  // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
  // 18. Add friend's ICE Candidates on your computer
  // SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
  async addFriendsIceCandidates() {
    const msg = await this.readFromFirebase(this.state.viewerId, ICE);
    this.state.pc.addIceCandidate(new RTCIceCandidate(msg));
    console.log('end of step 18 (add viewer ice) | this.state', this.state)
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
