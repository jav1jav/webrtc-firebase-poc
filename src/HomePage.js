import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => (
  <div>
    <h3>Testing WebRTC Connections</h3>
    <nav>
      <Link to="/streamer">Streamer</Link> <br></br>
      <Link to="/viewer">Viewer</Link><br></br>
      <Link to="/peerstreamer">PeerStreamer</Link><br></br>
      <Link to="/peerviewer">PeerViewer</Link><br></br>
    </nav>
  </div>
);

export default HomePage
