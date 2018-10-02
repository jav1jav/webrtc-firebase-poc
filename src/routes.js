import React, { Component } from 'react';
//withRouter only necessary if you want access to history
import { withRouter, Route, Switch } from 'react-router-dom';
import Viewer from './viewer';
import Streamer from './streamer';

// class Routes extends Component {
//   render() {
//     return (
//     <Switch> // Switch only necessary to handle if routes should match exactly or
//       <Route exact path='/viewer' component={Viewer} />
//       <Route exact path='/streamer' component={Streamer} />
//     </Switch>
//     )
//   }
// }

const Routes = () => (
  <Switch> // Switch only necessary to handle if routes should match exactly or
    <Route exact path="/viewer" component={Viewer} />
    <Route exact path="/streamer" component={Streamer} />
  </Switch>
);

//withRouter only necessary if you want access to history
export default withRouter(Routes);
