import React, { Component } from 'react';
import io from 'socket.io-client';
import 'bootstrap/dist/css/bootstrap.css';
import {
  Button,
  Col,
  ControlLabel,
  FormControl,
  FormGroup,
  Grid,
  Row,
  HelpBlock
} from 'react-bootstrap';
import DatePicker from 'react-bootstrap-date-picker';

import Pelitosite from './pelitosite';
import Tulokset from './tulokset';

const socket = io();

class App extends Component {
  state = {
    kupongit: [],
    name: '',
    numbers: '',
    v_startDate: new Date().toISOString(),
    v_endDate: new Date().toISOString(),
    getResults: false,
    id: ""
  };
  async componentWillMount() {
    //console.log("componentWillMount");
    const response = await fetch('/lottokupongit/_all_docs?include_docs=true');
    const data = await response.json();
    //console.log("componentWillMount",data.rows[0].doc);

    const kupongit = data.rows.map(row => row.doc);
    //console.log("componentWillMount",kupongit);
    this.setState({ kupongit });


    socket.on('change', doc => {
      if (doc._deleted) {
        // Dokumentti on poistettu.
        this.setState({
          kupongit: this.state.kupongit.filter(
            ({ _id }) => doc._id !== _id
          )
        });
      } else {
        const index = this.state.kupongit.findIndex(
          ({ _id }) => _id === doc._id
        );
        if (index === -1) {
          // Uusi dokumentti.
          this.state.kupongit.push(doc);
        } else {
          // Dokumenttia muokattiin.
          this.state.kupongit[index] = doc;
        }
        this.setState(this.state);
      }
    });
    socket.emit('addListener', 'lottokupongit');
  }
  componentWillUnmount() {
    socket.emit('removeListener', 'lottokupongit');
  }
  onSubmit = async event => {
    event.preventDefault();
    
    const { name } = this.state;
    const { numbers } = this.state;
    const { startDate } = this.state;
    const { endDate } = this.state;
    
    // http://docs.couchdb.org/en/latest/api/database/common.html#post--db
    await fetch('/lottokupongit', {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      //body: JSON.stringify({ teksti,date })
      body: JSON.stringify({ name, numbers, startDate, endDate })
    });
    // Tyhjennetään tallennettu arvo tekstikentästä.
    this.setState({ name: '' });
    this.setState({ numbers: '' });
  };

  getValidationState() {
    var err = true;
    
    const numbers = this.state.numbers.split(",");
    const length = numbers.length;

    if (length === 7) err = false;
      else err = true;

    for (var i in numbers) {
      if (numbers[i] < 1 || numbers[i] > 40) {
         err = true; 
      }
    }
    if (err)
      return 'error';
    else return 'success';
  }

  handleStartDateChange = (value, formattedValue) => {
    var date = new Date(value);
    date.setHours(0);
    this.setState({v_startDate:value, startDate:date});
  }

  handleEndDateChange = (value, formattedValue) => {
    var date = new Date(value);
    date.setHours(0);
    this.setState({v_endDate:value, endDate:date});
  }

  handleAlertDismiss() {
    //console.log("handleAlertDismiss");
 }
 
  checkResults = (id) => {
    var index = this.state.kupongit.findIndex(object => object._id === id);
    this.setState({numbers:this.state.kupongit[index].numbers,startDate:this.state.kupongit[index].startDate,endDate:this.state.kupongit[index].endDate, getResults:true, id:id});
  }

  render() {
    return (
      <Grid fluid>
        <h1>Täytä Lottokuponki</h1>
        <Row>
          <Col xs={12} sm={7} md={8} lg={3}>
            <form onSubmit={this.onSubmit}>
              <FormGroup>
                <ControlLabel>Lotto</ControlLabel><br/>
                <ControlLabel>Pelaaja:</ControlLabel>
                <FormControl
                  type="text"
                  placeholder="Nimi"
                  value={this.state.name}
                  onChange={event =>
                    this.setState({ name: event.target.value })}
                />
              </FormGroup>
              <FormGroup controlId="numbers" validationState={this.getValidationState()}>
                <ControlLabel>Numerot:</ControlLabel>
                <FormControl
                  type="text"
                  placeholder="1,2,3,4,5,6,7"
                  value={this.state.numbers}
                  onChange={event =>
                    this.setState({ numbers: event.target.value })}
                />
                <FormControl.Feedback />
                <HelpBlock>Anna 7 numeroa (1 - 40).</HelpBlock>
              </FormGroup>
              <FormGroup>
                <ControlLabel>Alkupvm.</ControlLabel>
                <DatePicker id="start-date" dateFormat="DD.MM.YYYY" weekStartsOnMonday = {true} value={this.state.v_startDate} onChange={this.handleStartDateChange} />
                <ControlLabel>Loppupvm.</ControlLabel>
                <DatePicker id="end-date" dateFormat="DD.MM.YYYY" weekStartsOnMonday = {true} value={this.state.v_endDate} onChange={this.handleEndDateChange} />
              </FormGroup>
              <Button bsStyle="primary" type="submit" block>Tallenna</Button>
            </form>
          </Col>
          <Col xs={12} sm={5} md={4} lg={3}>
            {this.state.kupongit.map((tosite, i) => {return (<Pelitosite key={i} id={tosite._id} name={tosite.name}
            numbers={tosite.numbers} startDate={tosite.startDate} endDate={tosite.endDate} cb={this.checkResults}></Pelitosite>)})}
          </Col>
          <Col xs={12} sm={5} md={4} lg={6}>
            {this.state.getResults && <Tulokset id={this.state.id} numbers={this.state.numbers} start={this.state.startDate} end={this.state.endDate}></Tulokset>}
          </Col>
        </Row>
      </Grid>
    );
  }
}

export default App;
