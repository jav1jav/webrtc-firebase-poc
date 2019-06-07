import React from 'react';
import logo from './logo.svg';
import { Link } from 'react-router-dom';

const HomePage = () => (
  <div>
    <h3>Testing WebRTC Connections</h3>
    <header className="HomePage-header">
        <Link to="/"><img src={logo} className="App-logo" alt="logo" /></Link>
      </header>
    <nav>
      <Link to="/streamer">Streamer</Link> <br></br>
      <Link to="/viewer">Viewer</Link><br></br>
      <Link to="/Initializer">Initializer</Link><br></br>
    </nav>
  </div>
);

export default HomePage
