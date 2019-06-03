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
    // this.streamerWriteOffer = this.streamerWriteOffer.bind(this) // 7
    // this.sendIceCandidatesToFriend = this.sendIceCandidatesToFriend.bind(this)
    // this.addAnswerToPeerConnection = this.addAnswerToPeerConnection.bind(this)

  }

  // * Helper Funcs: read from/ write to firebase

  writeToFirebase(id, field, value) {
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

  // * Helper Funcs: button to console log this.state
  consoleLogThisState() {
    console.log('current this.state', this.state)
  }


  // 3. Create a PeerConnection on STREAMER computer
  // 9. Generate Ice Candidates on STREAMER computer
  async createLocalPeerConnectionWithIceCandidates() {
    console.log( 'streamer.js | createLocalPeerConnectionWithIceCandidates | hello' )
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

    this.state.pc.onicecandidate = event => {
      if (event.candidate) {
        this.setState({ ice: [...this.state.ice, event.candidate] });
        console.log('onicecandidate fired')
        if ( this.state.ice.length > 7 ) {
          this.writeToFirebase(this.state.streamerId, ICE, JSON.stringify(this.state.ice));
        }
      } else {
        this.writeToFirebase(this.state.streamerId, ICE, JSON.stringify(this.state.ice));
        console.log('end of step 10 (write ice / sendIceCandidatesToFriend) | this.state', this.state)
        console.log('Sent All Ice (aka all ice candidates have been received?)');
      }
    };

    const myVideo = document.getElementById('myVideo');
    const friendsVideo = document.getElementById('friendsVideo');

    this.state.pc.onaddstream = event => (friendsVideo.srcObject = event.stream);

    //Show my face
    window.navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then(stream => (myVideo.srcObject = stream))
      .then(stream => this.state.pc.addStream(stream));

    console.log('end of step 3 (create PC) | this.state', this.state)
  }

  //{/* 4. friend needs to create their own peer connection */}

  async streamerCreateLocalOfferAddToPeerConnection() {

    // 5. Create an Offer on your computer
    const offer = await this.state.pc.createOffer()
    console.log('streamer.js | streamerCreateLocalOfferAddToPeerConnection | offer =', offer)

    // 6. Add that Offer to the PeerConnection on your computer
    await this.state.pc.setLocalDescription(offer)
    console.log('end of step 5, 6 (offer) | this.state', this.state)


    // 7. Send that Offer to your friend’s computer
    this.writeToFirebase( this.state.streamerId, OFFER,
      JSON.stringify({ sdp: this.state.pc.localDescription })
    );
    console.log('end of step 7 (write offer) | this.state', this.state)

    //{/* 8. friend needs to add offer to their peer connection */}

    // 9. Generate ICE Candidates on STREAMER computer - see step 3 and
    // comment in componentDidMount
    // 10. Send those ICE Candidates to your friend’s computer
    // this is the else in ice-candidate event declaration, takes place when
    // event listener is triggered

  }


  //{/* 11. Add STREMERs ICE Candidates on VIEWER computer */}
  //{/* 12. Create an Answer on your friend’s VIEWER computer */}
  //{/* 13. Add that Answer to the PeerConnection on your friend’s computer */}
  //{/* 14. Send that Answer to STREAMER computer */}

  // 15. Add that Answer to the PeerConnection on your computer
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

  // 18. Add friend's ICE Candidates on your computer
  async addFriendsIceCandidates() {
    const msg = await this.readFromFirebase(this.state.viewerId, ICE);
    this.state.pc.addIceCandidate(new RTCIceCandidate(msg));
    console.log('end of step 18 (add viewer ice) | this.state', this.state)
  }

  componentDidMount() {
    this.createLocalPeerConnectionWithIceCandidates()
    console.log( 'streamer.js | CDM | createLocalPeerConnectionWithIceCandidates has run')
  }

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


        <button onClick={this.addAnswerToPeerConnection} type="button" className="btn btn-primary btn-lg">
            15. addAnswerToPeerConnection
        </button>

      </div>
    );
  }
}

export default Streamer;



    // 9. Generate / Store received Ice candidates

    // in STREAMER step 3. we create peerConnection and specify STUN servers.
    // Those servers send ICE Candidates, and add them to the PeerConnection
    // automatically. This statement sets the event listener for that event.
    // The trick is we need to access these ICE candidates and send them to our
    // VIEWER to add to his PC.
    // We use this event listener to save ICE Candidates to this.state and then
    // in 10. we write to firebase, and 11. the VIEWER reads those values
    // and adds to his peerConnection


    //write --->
    // beavercode -->
    //JSON.stringify({'ice': event.candidate})

    // our current result --->
    // ice: {"candidate":"candidate:453802058 1 udp 41885439 158.69.221.198 60391 typ relay raddr 24.6.150.102 rport 64620 generation 0 ufrag woSi network-id 1 network-cost 10","sdpMid":"video","sdpMLineIndex":1}

    //read --->
    // beavercode -->
    //const msg = JSON.parse(info.data().message);
    //pc.addIceCandidate(new RTCIceCandidate(msg.ice));
