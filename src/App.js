import React, { Component } from 'react';
import {BrowserRouter, Route, Switch} from 'react-router-dom';
import NotFound from './NotFound';
import Home from './Home'
import './App.css';

const routes = () => {
  return (
    <Switch>
      <Route exact path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  )
};

class App extends Component {
  render() {
    return (
      <BrowserRouter>
          <div>
            {routes()}
          </div>
      </BrowserRouter>
    );
  }
}

export default App;
