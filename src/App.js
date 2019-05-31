import React, { Component } from 'react';
import './App.css';
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
