import React, {Component} from 'react'
import * as firebase from 'firebase';
import 'firebase/firestore';
import db from './firebase'


const myId = Math.floor(Math.random()*1000000000);
// const myId = 'dan';
const servers = {'iceServers': [{'urls': 'stun:stun.services.mozilla.com'}, {'urls': 'stun:stun.l.google.com:19302'}, {'urls': 'turn:numb.viagenie.ca','credential': 'webrtc','username': 'javier3@gmail.com'}]};
const pc = new RTCPeerConnection(servers);// console.log('database: ', db)
console.log('PC HERE: ', pc)

class StreamTest extends Component {
  constructor() {
    super()
    this.sendMessage = this.sendMessage.bind(this)
    this.readMessage = this.readMessage.bind(this)
    // this.showMyFace = this.showMyFace.bind(this)
    this.showFriendsFace = this.showFriendsFace.bind(this)
  }
  componentDidMount() {
    const myVideo = document.getElementById("myVideo");
    const friendsVideo = document.getElementById("friendsVideo");

    pc.onicecandidate = (event => event.candidate?this.sendMessage(myId, JSON.stringify({'ice': event.candidate})):console.log("Sent All Ice") );
    pc.onaddstream = (event => friendsVideo.srcObject = event.stream);

    //Show my face
    navigator.mediaDevices.getUserMedia({audio:true, video:true})
    .then(stream => myVideo.srcObject = stream)
    .then(stream => pc.addStream(stream));


    db.collection('users').doc('dan').onSnapshot( (doc) => {
      console.log("Current data: ", doc.data().message);
      this.readMessage(doc);
    });
  }

  sendMessage(senderId, data) {
    const msg = db.collection('users').doc('dan').set({
      message: data,
      sender: senderId
    })
    // msg.remove();
  }

  readMessage(info) {
    console.log('in readMessage')
    const msg = JSON.parse(info.data().message);
    const sender = info.data().sender;
    // const sender = 'dan';
    if(sender != myId) {
    if(msg.ice != undefined)
      pc.addIceCandidate(new RTCIceCandidate(msg.ice));
      else if(msg.sdp.type == "offer")
      pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
      .then(() => pc.createAnswer())
      .then(answer => pc.setLocalDescription(answer))
      .then(() => this.sendMessage(myId.toString(), JSON.stringify({'sdp': pc.localDescription})));
      else if(msg.sdp.type == "answer")
      pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
    }
  };


// console.log('read:  ', read)

// showMyFace() {
  // console.log('running showmyface')
  // navigator.mediaDevices.getUserMedia({audio:true, video:true})
  // .then(stream => myVideo.srcObject = stream)
  // .then(stream => pc.addStream(stream));
// }

  showFriendsFace() {
    console.log('running showfriendsface')
    pc.createOffer()
    .then(offer => pc.setLocalDescription(offer))
    .then(() => this.sendMessage(myId, JSON.stringify({'sdp': pc.localDescription})));
  }


  render() {
    return (
      <div>
      <video id='myVideo' autoPlay muted></video>
      <video id='friendsVideo' autoPlay></video>
      <br />
      <button onClick={this.showFriendsFace} type="button" className="btn btn-primary btn-lg"><span className="glyphicon glyphicon-facetime-video" aria-hidden="true"></span> Call</button>
      </div>
    )
  }
}

export default StreamTest
