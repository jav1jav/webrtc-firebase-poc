import React, {Component} from 'react'
import * as firebase from 'firebase';
import 'firebase/firestore';
import db from './firebase'

const myVideo = document.getElementById("myVideo");
const friendsVideo = document.getElementById("friendsVideo");
const myId = Math.floor(Math.random()*1000000000);
const servers = {'iceServers': [{'urls': 'stun:stun.services.mozilla.com'}, {'urls': 'stun:stun.l.google.com:19302'}, {'urls': 'turn:numb.viagenie.ca','credential': 'webrtc','username': 'websitebeaver@mail.com'}]};
const pc = new RTCPeerConnection(servers);// console.log('database:  ', db)

class StreamTest extends Component {
constructor() {
  super()
  this.sendMessage = this.sendMessage.bind(this)
  this.readMessage = this.readMessage.bind(this)
  this.showMyFace = this.showMyFace.bind(this)
  this.showFriendsFace = this.showFriendsFace.bind(this)
}
componentDidMount() {
  pc.onicecandidate = (event => event.candidate?this.sendMessage(myId, JSON.stringify({'ice': event.candidate})):console.log("Sent All Ice") );
  pc.onaddstream = (event => friendsVideo.srcObject = event.stream);
}

sendMessage(senderId, data) {
  const msg = db.collection('users').doc(senderId.toString()).set({message: data})
  msg.remove();
}

readMessage(data) {
  const msg = JSON.parse(data.val().message);
  const sender = data.val().sender;
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

// const read = db.collection('users').doc(myId.toString()).onSnapshot(function(doc) => {
//     console.log("Current data: ", doc.data());
// });
// console.log('read:  ', read)

showMyFace() {
  navigator.mediaDevices.getUserMedia({audio:true, video:true})
  .then(stream => myVideo.srcObject = stream)
  .then(stream => pc.addStream(stream));
}

showFriendsFace() {
 pc.createOffer()
  .then(offer => pc.setLocalDescription(offer))
  .then(() => this.sendMessage(myId, JSON.stringify({'sdp': pc.localDescription})));
}


  render() {
    return (
      <div onLoad={this.showMyFace}>
      <video id='myVideo' autoPlay muted></video>
      <video id='friendsVideo' autoPlay></video>
      <br />
      <button onClick={this.showFriendsFace} type="button" className="btn btn-primary btn-lg"><span className="glyphicon glyphicon-facetime-video" aria-hidden="true"></span> Call</button>
      </div>
    )    
  }
}

export default StreamTest