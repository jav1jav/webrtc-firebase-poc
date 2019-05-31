import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import HomePage from './HomePage';
import Routes from './routes';

class App extends Component {
  render() {
    return (
      <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
      </header>
        <HomePage />
        <Routes />
      </div>
    );
  }
}

export default App;
