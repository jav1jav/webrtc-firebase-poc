import React, { Component } from 'react';
//import logo from './logo.svg';
import './App.css';
// import StreamTest from './stream-test'
// import FriendStreamTest from './friend-stream-test'
import Navbar from './navbar';
import Routes from './routes';

class App extends Component {
  render() {
    return (
      <div className="App">
        <Navbar />
        <Routes />
      </div>
    );
  }
}

export default App;
