import Peer from 'peerjs';
import React, { Component } from 'react';

export default class PeerViewer extends Component {
  componentDidMount() {
    let viewerPeerId =
      'viewerJavierLilahJackie' + Math.floor(Math.random() * 1000);

    const peer = new Peer(viewerPeerId);
    console.log('peer created', peer);

    peer.on('open', id => {
      console.log('my id is ', id);
    });

    let conn = peer.connect('streamerJavierLilahJackie');

    peer.on('call', function(call) {
      // Answer the call, providing our mediaStream
      call.answer();
      console.log('call answered');
      call.on('stream', function(stream) {
        myVideo.srcObject = stream;
        console.log('stream added to video object');
      });
    });

    const myVideo = document.getElementById('myVideo');
  }

  render() {
    return (
      <div>
        <p>hi viewer</p>
        <video id="myVideo" autoPlay muted />
      </div>
    );
  }
}
