import React, {Component} from 'react'
import * as firebase from 'firebase';
import 'firebase/firestore';
import db from './firebase'


class FriendStreamTest extends Component {
  componentDidMount() {
    const myVideo = document.getElementById("myVideo");
    const friendsVideo = document.getElementById("friendsVideo");
    const myId = Math.floor(Math.random()*1000000000);
    const servers = {'iceServers': [{'urls': 'stun:stun.services.mozilla.com'}, {'urls': 'stun:stun.l.google.com:19302'}, {'urls': 'turn:numb.viagenie.ca','credential': 'webrtc','username': 'websitebeaver@mail.com'}]};
    const pc = new RTCPeerConnection(servers);
    pc.onicecandidate = (event => event.candidate?sendMessage(myId, JSON.stringify({'ice': event.candidate})):console.log("Sent All Ice") );
    pc.onaddstream = (event => friendsVideo.srcObject = event.stream);
    function sendMessage(senderId, data) {
      const msg = db.push({ sender: senderId, message: data });
      msg.remove();
    }

    function readMessage(data) {
      const msg = JSON.parse(data.val().message);
      const sender = data.val().sender;
      if(sender != myId) {
      if(msg.ice != undefined)
        pc.addIceCandidate(new RTCIceCandidate(msg.ice));
        else if(msg.sdp.type == "offer")
        pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
        .then(() => pc.createAnswer())
        .then(answer => pc.setLocalDescription(answer))
        .then(() => sendMessage(myId, JSON.stringify({'sdp': pc.localDescription})));
        else if(msg.sdp.type == "answer")
        pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
      }
    };

  // db.on('child_added', readMessage);

    function showMyFace() {
     navigator.mediaDevices.getUserMedia({audio:true, video:true})
     .then(stream => myVideo.srcObject = stream)
     .then(stream => pc.addStream(stream));
    }

    function showFriendsFace() {
     pc.createOffer()
     .then(offer => pc.setLocalDescription(offer))
     .then(() => sendMessage(myId, JSON.stringify({'sdp': pc.localDescription})) );
    }
}

  render() {
    return (
      <div>Test</div>
    )    
  }
}

export default FriendStreamTest