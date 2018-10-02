import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => (
  <div>
    <h3>Testing WebRTC Connections</h3>
    <nav>
      <Link to="/streamer">Streamer</Link> <br></br>
      <Link to="/viewer">Viewer</Link>
    </nav>
  </div>
);

export default Navbar
