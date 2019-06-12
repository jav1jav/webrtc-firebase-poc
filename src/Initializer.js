import React, { Component } from 'react';
import { initialize } from './utilities'

class Initializer extends Component {

  componentDidMount() {

  }
  render() {
    return (
      <div>
        <h1>What's UP!!!</h1>
        <br />
          <button onClick={initialize}
        type="button" className="btn btn-primary btn-lg">
          Initialize
        </button>

      </div>
    );
  }


}

export default Initializer;
