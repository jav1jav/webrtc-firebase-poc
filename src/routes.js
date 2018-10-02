import React, { Component } from 'react';
import { withRouter, Route, Switch } from 'react-router-dom';
import Viewer from './viewer';
import Streamer from './streamer';

// class Routes extends Component {
//   render() {
//     return (
//     <Switch>
//       <Route exact path='/viewer' component={Viewer} />
//       <Route exact path='/streamer' component={Streamer} />
//     </Switch>
//     )
//   }
// }

const Routes = () => (
  <Switch>
    <Route exact path="/viewer" component={Viewer} />
    <Route exact path="/streamer" component={Streamer} />
  </Switch>
);

export default withRouter(Routes);
