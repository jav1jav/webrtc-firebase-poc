import React from 'react';
//withRouter only necessary if you want access to history
import { withRouter, Route, Switch } from 'react-router-dom';
import Viewer from './viewer';
import Streamer from './streamer';
import Initializer from './Initializer';

const Routes = () => (
  //Switch only necessary to handle if routes should match exactly or
  <Switch>
    <Route exact path="/viewer" component={Viewer} />
    <Route exact path="/streamer" component={Streamer} />
    <Route exact path="/Initializer" component={Initializer} />
  </Switch>
);

//withRouter only necessary if you want access to history
export default withRouter(Routes);
