import React, { Component } from 'react';
//import logo from './logo.svg';
import './App.css';
// import StreamTest from './stream-test'
// import FriendStreamTest from './friend-stream-test'
import HomePage from './HomePage';
import Routes from './routes';

class App extends Component {
  render() {
    return (
      <div className="App">
        <HomePage />
        <Routes />
      </div>
    );
  }
}

export default App;
