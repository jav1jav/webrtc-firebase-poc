import React, { Component } from 'react';
import db from './firebase';

const OFFER = 'offer'
const ICE = 'ice'


class StreamTest extends Component {
  constructor() {
    super()
    this.state = {
      streamId: '',
      pc: {},
      ice: {}
    }
    this.sendMessage = this.sendMessage.bind(this);
    this.readMessage = this.readMessage.bind(this);
    // this.showMyFace = this.showMyFace.bind(this)
    this.showFriendsFace = this.showFriendsFace.bind(this);
  }

  // ********************************************
  // * Helper Funcs: read from/ write to firebase
  // ********************************************

  writeToFirebase(streamId, field, value) {
    let msg;
    switch (field) {
      case 'string1':{
        return db.collection('users').doc(streamId).set({string1: value});
      }
      default: {
        console.log('default switch for writeToFirebase')
      }
    }
    // msg.remove();
  }
  readFromFirebase(streamId, field) {
    const document = db.collection('users').doc(streamId)
    let msg;
    switch (field) {
      case 'string1':{
        return JSON.parse(document.data().string1);
      }
      default: {
        console.log('default switch for writeToFirebase')
      }
    }
  }


  // ********************************************
  // 3. Create a PeerConnection on your computer
  // 9. Generate Ice Candidates on your computer
  // ********************************************
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

  createLocalOfferAddToPeerConnection () {
    // ********************************************
    // 5. Create an Offer on your computer
    // ********************************************
    this.pc.createOffer()
    // ********************************************
    // 6. Add that Offer to the PeerConnection on your computer
    // ********************************************
      .then(offer => this.pc.setLocalDescription(offer))
  }

  // ********************************************
  // 7. Send that Offer to your friend’s computer
  // ********************************************
  sendOffer() {
    this.writeToFirebase(this.sessionId, OFFER, JSON.stringify({'sdp': this.pc.localDescription}))
  }



  //{/* 8. friend needs to add offer to their peer connection */}

  // ********************************************
  // 9. Add friend's ICE Candidates on your computer
  // ********************************************
  addFriendsIceCandidates(msg) {
    this.pc.addIceCandidate(new RTCIceCandidate(msg.ice))
  }



  // ********************************************
  // 10. Send those ICE Candidates to your friend’s computer
  // ********************************************
  // sendIceCandidatesToFriend() {
  //   this.pc.onicecandidate = event =>
  //   event.candidate
  //     ? this.writeToFirebase(sessionId, ICE, JSON.stringify({ ice: event.candidate }))
  //     : console.log('Sent All Ice');
  // }

  // ********************************************
  // 10. Send those ICE Candidates to your friend’s computer
  // ********************************************
  // this.writeToFirebase(this.streamId, ICE, JSON.stringify( this.state.ice))



  setOffer(msg, sender) {
    if (sender !== myId) {
      if (msg.sdp.type == 'offer') {
        pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
      } else {
        console.log('error: setOffer: spd.type is not an offer')
      }
    } else {
      console.log('error: setOffer: read own message')
    }
  }








  setIceCandidate(msg, sender) {
    if (sender !== myId) {
      if (msg.ice !== undefined) {
        pc.addIceCandidate(new RTCIceCandidate(msg.ice));
      } else {
        console.log('error: setIceCandidate: ice candidate already set')
      }
    } else {
      console.log('error: setIceCandidate: read own message')
    }
  }


  createAnswer(msg, sender) {
    if (sender !== myId) {
      if (msg.sdp.type == 'offer') {
        pc.createAnswer().then(answer => pc.setLocalDescription(answer))
      } else {
        console.log('error: createAnswer: spd.type is not an offer')
      }
    } else {
      console.log('error: createAnswer: read own message')
    }
  }

  sendAnswer() {
    sendMessage(
      myId.toString(),
      JSON.stringify({ sdp: pc.localDescription })
    )
  }


  // readMessage(docId, info) {
  //   const msg = JSON.parse(info.data().message);
  //   const sender = info.data().sender;

  //   if (sender != myId) {
  //     if (msg.ice != undefined)
  //       pc.addIceCandidate(new RTCIceCandidate(msg.ice));

  //     else if (msg.sdp.type == 'offer')

  //         .then(() => )
  //         .then(answer => pc.setLocalDescription(answer))
  //         .then(() =>
  //           this.
  //           )
  //         );
  //     else if (msg.sdp.type == 'answer')
  //       pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
  //   }
  // }

  // console.log('read:  ', read)

  // showMyFace() {
  // console.log('running showmyface')
  // navigator.mediaDevices.getUserMedia({audio:true, video:true})
  // .then(stream => myVideo.srcObject = stream)
  // .then(stream => pc.addStream(stream));
  // }


  componentDidMount() {



    const friendsVideo = document.getElementById('friendsVideo');

    this.pc.onicecandidate = event => {
      if (event.candidate) {
        this.setState({ice: event.candidate})
      } else {
        console.log('Sent All Ice');
      }
    }

    this.pc.onaddstream = event => (friendsVideo.srcObject = event.stream);

    db.collection('users')
      .doc('dan')
      .onSnapshot(doc => {
        console.log('Current data: ', doc.data().message);
        this.readMessage(doc);
      });
  }

  render() {
    return (
      <div>
        <video id="myVideo" autoPlay muted />
        <video id="friendsVideo" autoPlay />
        <br />
        <button onClick={this.createLocalPeerConnection} type="button" className="btn btn-primary btn-lg">3. createLocalPeerConnection</button>
        {/* 4. friend needs to create their own peer connection */}
        <button onClick={this.createLocalOfferAddToPeerConnection} type="button" className="btn btn-primary btn-lg">5.  6.  createLocalOfferAddToPeerConnection</button>
        <button onClick={this.sendOfferToFriend} type="button" className="btn btn-primary btn-lg">7. sendOfferToFriend</button>
        {/* 8. friend needs to add offer to their peer connection */}
        <button onClick={this.generateIceCandidates} type="button" className="btn btn-primary btn-lg">9. generateIceCandidates</button>
        <button onClick={this.sendIceCandidatesToFriend} type="button" className="btn btn-primary btn-lg">10. sendIceCandidatesToFriend</button>
        {/* 11. friend needs to add ice candidates to their peer connection*/}
        {/* 12. 13. friend creates answer on their computer and adds to peer connection*/}
        {/* 14. friend sends answer to me local here*/}
        <button onClick={this.addAnswerToPeerConnection} type="button" className="btn btn-primary btn-lg">15. addAnswerToPeerConnection</button>
        {/* 16. 17. friend generates ice candidates and sends them to me local here */}
        <button onClick={this.addIceCandidates} type="button" className="btn btn-primary btn-lg">18. addIceCandidates</button>
        {/* <button onClick={this.displayMediaStream} type="button" className="btn btn-primary btn-lg">xxx</button> */}
      </div>
    );
  }
}

export default StreamTest;
