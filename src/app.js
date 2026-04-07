import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Header from './components/Header';
import IndexPage from './pages/index';
import BillsEntry from './pages/billsEntry';

const App = () => {
  return (
    <Router>
      <Header />
      <Switch>
        <Route path="/" exact component={IndexPage} />
        <Route path="/billsEntry" component={BillsEntry} />
      </Switch>
    </Router>
  );
};

export default App;