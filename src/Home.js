import * as React from 'react';
import { Chart } from 'react-google-charts'
import fetch from 'isomorphic-fetch'

const URL = 'https://chromium-db-app.herokuapp.com/';

class Home extends React.Component {
  constructor() {
    super();
    this.state = {
      treemapLoaded: false,
      treemap: []
    }
  };

  showFullTooltip = (row, size, value) => {
    return (
      '<div style="background:#fd9; padding:10px; border-style:solid">' +
        'Lines of Code: ' + size +
        '<br>Security Bug Severity %: ' + value +
      '</div>'
    );
  };

  getTreemap = (isPdfium, allBugs, query, callback) => {
    const platform = isPdfium ? 'pdfium/' : 'chromium/';
    const treemap = allBugs ? 'treemap/' : 'security_treemap/';
    const fullUrl = URL + platform + treemap + query;
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

  zip = (arrays) => {
    return arrays[0].map(function(_,i){
      return arrays.map(function(array){return array[i]})
    });
  };

  normaliseTreemap = (treemap) => {
    return treemap.map(node => {
      if (!isNaN(parseInt(node[3]))) {
        const normalisedValue = parseFloat(node[3]) / parseFloat(Math.sqrt(node[2]));
        return [node[0], node[1], node[2], normalisedValue]
      }
      return node
    });
  };

  onChangeTreemap = () => {
    const select = document.getElementById("select-treemap");
    const chartValue = select.options[select.selectedIndex].value;
    const normalise = document.getElementById("normalise-by-size").checked;
    let isPdfium, allBugs, ratio = false;
    switch(chartValue) {
      case 'pdfium-all':
        isPdfium = true;
        allBugs = true;
        break;
      case 'pdfium-security':
        isPdfium = true;
        allBugs = false;
        break;
      case 'pdfium-security-vs-all':
        isPdfium = true;
        allBugs = true;
        ratio = true;
        break;
      case 'chromium-all':
        isPdfium = false;
        allBugs = true;
        break;
      case 'chromium-security':
        isPdfium = false;
        allBugs = false;
        break;
    }
    if(ratio) {
      this.getTreemap(isPdfium, true, 'status:closed', (allErr, all) => {
        if(allErr) {
          alert(allErr);
        } else {
          this.getTreemap(isPdfium, false, 'status:closed', (secErr, security) => {
            if(secErr) {
              alert(secErr);
            } else {
              all.map(data => {
                if (!isNaN(parseInt(data[2]))) {
                  data[2] = parseInt(data[2]);
                  data[3] = parseInt(data[3]);
                }
                return data
              });
              security.map(data => {
                if (!isNaN(parseInt(data[2]))) {
                  data[2] = parseInt(data[2]);
                  data[3] = parseInt(data[3]);
                }
                return data
              });
              const data = [security, all];
              let zippedData = this.zip(data).map(data => {
                if (!isNaN(parseInt(data[0][3]))) {
                  const sec = data[0][3];
                  const all = data[1][3] === 0 ? 1 : data[1][3];
                  const secAll = [data[0][0], data[0][1], data[0][2], parseFloat(sec) / parseFloat(all)];
                  return secAll
                }
                return data[0];
              });
              if(normalise) {
                zippedData = this.normaliseTreemap(zippedData)
              }
              this.setState({treemapLoaded: true, treemap: zippedData});
            }
          });
        }
      });
    } else {
      this.getTreemap(isPdfium, allBugs, 'status:closed', (err, treemap) => {
        if (err) {
          alert(err);
        } else {
          treemap.map(data => {
            if (!isNaN(parseInt(data[2]))) {
              data[2] = parseInt(data[2]);
              data[3] = parseInt(data[3]);
            }
            return data
          });
          if(normalise) {
            treemap = this.normaliseTreemap(treemap)
          }
          this.setState({treemapLoaded: true, treemap: treemap});
        }
      });
    }
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
          this.setState({treemapLoaded: true, treemap: json});
        }
      });
    }

    return (
      <div>
        <h1>Chromium Bug Visualisations</h1>
        <p>
          This is a tool for viewing an overview of bugs in the Chromium and Pdfium projects as they appear in the
          source code. API calls can be made
          <a href={URL}> here.</a>

        </p>
        <p>Select which visualisation you would like to view:</p>
        <select id="select-treemap" onChange={this.onChangeTreemap}>
          <option value="pdfium-all">P: All</option>
          <option value="pdfium-security">P: Security</option>
          <option value="pdfium-security-vs-all">P: Security : All</option>
          <option value="chromium-all">C: All</option>
          <option value="chromium-security">C: Security</option>
          <option value="chromium-security-vs-all">C: Security : All</option>
        </select>
        <input id="normalise-by-size" type="checkbox" onChange={this.onChangeTreemap}/>
        <label for="normalise-by-size">Normalise by file size</label>
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
            generateTooltip: this.showFullTooltip
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

