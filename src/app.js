import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Header from './components/Header';
import IndexPage from './pages/index';
import BillsEntry from './pages/billsEntry';
import ViewBills from './pages/view-bills';

const App = () => {
  return (
    <Router>
      <Header />
      <Switch>
        <Route path="/" exact component={IndexPage} />
        <Route path="/billsEntry" component={BillsEntry} />
        <Route path="/view-bills" component={ViewBills} />
      </Switch>
    </Router>
  );
};

export default App;