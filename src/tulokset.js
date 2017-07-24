import React, { Component } from 'react';
import './tulokset.css';

function getWeekNumber(d) {
    // Copy date so don't modify original
    d = new Date(+d);
    d.setHours(0,0,0,0);
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setDate(d.getDate() + 4 - (d.getDay()||7));
    // Get first day of year
    var yearStart = new Date(d.getFullYear(),0,1);
    // Calculate full weeks to nearest Thursday
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    // Return array of year and week number
    return [d.getFullYear(), weekNo];
}


class Tulokset extends Component {

  state = {
    playerNumbers: [],
    lottoNumbers: [],
    mostnumbers: {}, //new Object(40),
    startDate: this.props.startDate,
    endDate: this.props.endDate,
    showResults: false
  }

  componentDidMount() {
    const startDate = new Date(this.props.start);
    const endDate = new Date(this.props.end);
    const data = {
      numbers: this.props.numbers,
      date1: startDate,
      date2: endDate
    }
    var errors = new Error();
    var err = this.validate(data, errors);
  }  
  
  componentWillReceiveProps(nextProps) {
    //console.log("Tulokset:componentWillReceiveProps");
    // get id and compare current, clear all data if necessary
    if (nextProps.id !== this.props.id)
      this.setState({lottoNumbers:[], mostnumbers: {}, showResults:false});
  }
  
  componentWillUpdate() {
    //console.log("Tulokset:componentWillUpdate");
  }

  componentDidUpdate() {
    //console.log("Tulokset:componentDidUpdate");
    if (this.state.lottoNumbers.length === 0) {
      const startDate = new Date(this.props.start);
      const endDate = new Date(this.props.end);
      const data = {
        numbers: this.props.numbers,
        date1: startDate,
        date2: endDate
      }
      var errors = new Error();
      var err = this.validate(data, errors);
    }
  }

  
  componentWillUnmount() {
  }

  getLotto = (startDate_ms, endDate_ms) => {
    // tuntien tarkkuudella, max-viikko
    const url = `https://www.veikkaus.fi/api/v1/draw-games/draws?game-names=LOTTO&status=RESULTS_AVAILABLE&date-from=${startDate_ms}&date-to=${endDate_ms}`;
    //console.log(url);
    const options = {
      method: 'GET',
      headers: {
        'X-ESA-API-Key': 'ROBOT',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      gzip: true
    };
    fetch(url, options)
        .then(function(res) {
            //console.log(res.statusText);
            if (res.ok) {
              return res.json();
            }
            throw new Error('Network response was not ok.');
        }).then((json) => {
            //console.log("Lotto json",json);
            this.checkLotto(json);
            this.setState({showResults:true});
        });

  }

  checkLotto = (json) => {
    const lotto = {}; //new Object();
    // Save Lotto numbers to lotto-object
    if (json.draws.length > 0) {
      lotto["numbers"] = json.draws[0].results[0].primary; 
      lotto["extras"] = json.draws[0].results[0].secondary;
      var date = new Date();
      date.setTime(json.draws[0].drawTime);
      lotto["date"] = date;
    } 
    else {
      return;
    }
    
    // Check primary numbers
    var prim = 0;
    this.state.playerNumbers.forEach(function(number) {
      if (lotto.numbers.includes(number)) {
        prim++;
      }
    });
    // Check secondary numbers
    var ext = 0;
    this.state.playerNumbers.forEach(function(number) {
      if (lotto.extras.includes(number)) {
        ext++;
      }
    });
    const results = {}; //new Object();
    // Save win numbers to results-object
    results["numbers"] = prim;
    results["extras"] = ext;
    lotto["results"] = results;
    
    this.state.lottoNumbers.push(lotto);

    // Save lotto-numbers to array
    lotto.numbers.forEach((number) => {
      if (this.state.mostnumbers[`${number}`] === undefined) {
        this.state.mostnumbers[`${number}`] = 0;
      }
      this.state.mostnumbers[`${number}`]++;
    });

    this.setState(this.state);
  }
  
  validate = (formData, errors) => {

    //console.log("Validate:",formData.date1,formData.date2);
    const numbers = formData.numbers.split(",");

    if (numbers.length > 7) {
      errors.title.addError("Too many numbers ! (Max. 7)");
      return errors;
    }
    numbers.forEach(function(number) {
      if (number > 40) {
        errors.title.addError("Too big numbers occur ! (Max. 40)");
        return errors;
      }
    });
    
    //this.setState({playerNumbers:numbers});
    this.state.playerNumbers = numbers;

    const startDate = new Date(formData.date1);
    const start_ms = startDate.valueOf();

    if (formData.date2 === undefined) {
      var today = new Date();
      var zone = today.getTimezoneOffset();
      today.setHours(0 - (zone/60));
      today.setMinutes(0);
      today.setSeconds(0);
      formData.date2 = today;
    }
    const endDate = new Date(formData.date2);
    const end_ms = endDate.valueOf()

    var week_start = startDate;
    var week_start_ms = start_ms;
    var week_end_ms = 0;
    var day = week_start.getDay();

    //this.setState({startDate, endDate});

    const dates = [];

    while(end_ms > week_end_ms){
      var diff_ms = (7 - day + 1) * 3600 * 24 * 1000; // to the beginning of the next week
      week_end_ms = week_start_ms + diff_ms;

      dates.push({week_start_ms,week_end_ms});

      week_start_ms = week_end_ms;


      day = 1; // monday, for next loop round
    }
    dates.forEach((element) => {
      this.getLotto(element.week_start_ms, element.week_end_ms); // Get one week results
    });
    return errors;
  }


  render() {

    var sortable = [];
    for (var item in this.state.mostnumbers) {
        sortable.push([item, this.state.mostnumbers[item]]);
    }
    sortable.sort(function(a, b) {
        return b[1] - a[1];
    });

    const mostTable = sortable.map((item, i) => {
      var columns = item.map((number, j) => {
        return (<td key={j}>{number}</td>);
      });
      return (<tr key={i}>{columns}</tr>);
    });

    const lottoNumberTable = this.state.lottoNumbers.map((object, i) => {
      var result = getWeekNumber(object.date);
      var week = (<td className="week">{result[1]}/{result[0]}</td>);
      var numbers = object.numbers.map((number, j) => {
        return (<td className="numerot" key={j}>{number}</td>);
      });
      var extranumber = object.extras.map((number, j) => {
        return (<td className="lisanumero" key={j}>{number}</td>);
      });
      var wins = (<td className="pelaajalla">{object.results.numbers} + {object.results.extras}</td>);
      return (<tr key={i}>{week}{numbers}{extranumber}{wins}</tr>);
    });

    const startDate = new Date(this.props.start);
    const endDate = new Date(this.props.end);
    const colspan = "8"; // 7+1

    return (
      <div>
        {this.state.showResults && <div>Haku: {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
          <p>
            Pelaajan rivi: {this.props.numbers}
          </p> 
          <table>
            <thead>
              <tr>
                <th>Viikko</th>
                <th colSpan={colspan}>Oikea rivi + lisänumero</th>
                <th>Pelaajan tulos</th>
              </tr>
            </thead>
            <tbody>
              {lottoNumberTable}
            </tbody>
          </table>
          <br />
          <p>
          Aikavälin tilasto:
          </p>
          <table className="tilasto">
            <thead>
              <tr>
                <th>Numero:</th>
                <th>Osumia:</th>
              </tr>
            </thead>
            <tbody>
              {mostTable}
            </tbody>
          </table>
        </div>}
      </div>
    )
  }
}

export default Tulokset;
