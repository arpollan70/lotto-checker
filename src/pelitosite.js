import React, { Component } from 'react';
import { Alert, Button } from 'react-bootstrap';

class Pelitosite extends Component {

  render() {
    const f_startDate = new Date(this.props.startDate);
    const f_endDate = new Date(this.props.endDate);

    return (
        <Alert onDismiss = {() => fetch(`/lottokupongit/${this.props.id}`, {
            method: 'DELETE'
            })
        } key={this.props.id}>
            <p>
            {this.props.name}
            </p>
            <p>
            {this.props.numbers}
            </p>
            <p>
            {f_startDate.toLocaleDateString()} - {f_endDate.toLocaleDateString()}
            </p>
            <Button onClick= {() => this.props.cb(this.props.id)}>Tarkista</Button>
        </Alert>
    );
  }
}

export default Pelitosite;
