import * as React from 'react';
import { Chart } from 'react-google-charts'
import fetch from 'isomorphic-fetch'

const URL = 'http://localhost:3000/'

class Home extends React.Component {
  constructor() {
    super();
    this.state = {
      treemapLoaded: false,
      treemap: []
    }
  };

  getTreemap = (isPdfium, allBugs, query, callback) => {
    const platform = isPdfium ? 'pdfium/' : 'chromium/';
    const treemap = allBugs ? 'treemap/' : 'security_treemap/';
    const fullUrl = URL + platform + treemap + query
    fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    }).then(response => response.json()
    ).then(json => callback(false, json)
    ).catch(err => callback(err));
  };

  render() {

    if(!this.state.treemapLoaded) {
      this.getTreemap(true, true, 'status:closed', (err, json) => {
        if(err) {
          alert(err);
        } else {
          json.map(data => {
            if(!isNaN(parseInt(data[2]))) {
              data[2] = parseInt(data[2]);
              data[3] = parseInt(data[3]);
            }
            return data
          });
          alert(JSON.stringify(json));
          this.setState({treemapLoaded: true, treemap: json});
        }
      });
    }

    return (
      <div>
        <p>Home!</p>
        <Chart
          chartType="TreeMap"
          data={this.state.treemap}
          options={{
            chartPackages: ['treemap'],
            highlightOnMouseOver: true,
            maxDepth: 2,
            maxPostDepth: 4,
            minHighlightColor: '#3cc904',
            midHighlightColor: '#2310cc',
            maxHighlightColor: '#cf02c8',
            minColor: '#38ff01',
            midColor: '#0c04ff',
            maxColor: '#ff01c0',
            headerHeight: 15,
            showScale: true,
            useWeightedAverageForAggregation: true,
          }}
          graph_id="TreeMap"
          width="100%"
          height="600px"
          legend_toggle
        />
      </div>
    );
  }
}

export default Home;

