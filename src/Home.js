import * as React from 'react';
import { Chart } from 'react-google-charts'
import fetch from 'isomorphic-fetch'

const URL = 'https://chromium-db-app.herokuapp.com/';

// Map selected field to url query string

class Home extends React.Component {
  constructor() {
    super();
    this.state = {
      maxValue: 0,
      treemap: [],
      treemapLoaded: false,
      treemapRoot: '~',
      treemapType: '',
      depth: 0,
      normalise: false
    };
    this.chartEvents = [
      {
        eventName: 'select',
        callback : Chart => {
          let row = Chart.chart.getSelection()[0].row + 1;
          let selectedNodePath = this.state.treemap[row][0];
          this.setState({treemapRoot: selectedNodePath}, () => {
            this.reloadTreemap();
          });
        }
      }
    ];

  };

  showFullTooltip = (row, size, value) => {
    return (
      '<div style="background:#fd9; padding:10px; border-style:solid">' +
        this.state.treemap[row + 1][0] +
        '<br>Lines of Code: ' + size +
        '<br>Value: ' + this.state.treemap[row + 1][3] +
      '</div>'
    );
  };

  resetTreemap = () => {
    const select = document.getElementById("select-treemap");
    const treemapType = select.options[select.selectedIndex].value;
    const normalise = document.getElementById("normalise-by-size").checked;
    let depth = parseInt(document.getElementById("tree-depth").value);
    depth = isNaN(depth) ? 0 : depth;
    this.setState({
      treemapRoot: '~',
      treemapLoaded: false,
      treemapType: treemapType,
      depth: depth,
      normalise: normalise,
      maxValue: 0
    }, () => {
      this.reloadTreemap();
    });
  };

  reloadTreemap = () => {

    let url = URL + this.state.treemapType + 'status:closed/' +
      this.state.treemapRoot.replace(/\//g, '%2F') + '/' + this.state.depth + '/' + this.state.normalise;

    fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    }).then(response => response.json()
    ).then(treemap => {
      console.log(treemap);
      let maxValue = this.state.maxValue;
      treemap.forEach(node => maxValue = node[3] > maxValue ? node[3] : maxValue);
      this.setState({treemapLoaded: true, treemap: treemap, maxValue: maxValue});
    }).catch(err => {
      alert(err);
    });
  };

  render() {

    let goUp = this.state.treemapLoaded ?
      <button
        id="goto-parent"
        type="button"
        disabled={this.state.treemapRoot === '~'}
        onClick={() => {
          let root = this.state.treemapRoot;
          this.setState({treemapRoot: root.substr(0, root.lastIndexOf('/'))}, () => {
            this.reloadTreemap();
          });
        }}
      >
        Go Up
      </button> :
      <div/>;

    let gotoRoot = this.state.treemapLoaded ?
      <button
        id="goto-root"
        type="button"
        disabled={this.state.treemapRoot === '~'}
        onClick={() => {
          this.setState({treemapRoot: "~"}, () => {
            this.reloadTreemap();
          });
        }}
      >
        To Top
      </button> :
      <div/>;

    let chart = this.state.treemapLoaded ?
      <Chart
          chartType="TreeMap"
          data={this.state.treemap}
          options={{
            chartPackages: ['treemap'],
            highlightOnMouseOver: true,
            maxDepth: 2,
            maxPostDepth: 3,
            minHighlightColor: '#3cc904',
            midHighlightColor: '#2310cc',
            maxHighlightColor: '#cf02c8',
            minColor: '#38ff01',
            midColor: '#0c04ff',
            maxColor: '#ff01c0',
            minColorValue: 0,
            maxColorValue: this.state.maxValue,
            headerHeight: 15,
            showScale: true,
            useWeightedAverageForAggregation: true,
            generateTooltip: this.showFullTooltip,
          }}
          graph_id="TreeMap"
          width="100%"
          height="600px"
          legend_toggle
          chartEvents={this.chartEvents}
          on
        /> : <div/>;

    return (
      <div>
        <h1>Chromium Bug Visualisations</h1>
        <p>
          This is a tool for viewing an overview of bugs in the Chromium and Pdfium projects as they appear in the
          source code. API calls can be made
          <a href={URL}> here.</a>

        </p>
        <p>Due to huge size of treemap for chromium, depth of treemap can be altered for better performance.</p>
        <p>Select which visualisation you would like to view:</p>
        <select id="select-treemap">
          <option value="pdfium/treemap/">P: All</option>
          <option value="pdfium/security_treemap/">P: Security</option>
          <option value="pdfium/security_ratio_treemap/">P: Security : All</option>
          <option value="chromium/treemap/">C: All</option>
          <option value="chromium/security_treemap/">C: Security</option>
          <option value="chromium/security_ratio_treemap/">C: Security : All</option>
        </select><br/>
        <input id="normalise-by-size" type="checkbox"/>
        <label for="normalise-by-size">Normalise by file size</label><br/>
        <input id="tree-depth" type="text" placeholder="Tree depth (0 => full)"/><br/>
        <button id="update-treemap" type="button" onClick={this.resetTreemap}>Render Treemap</button><br/><br/>
        {goUp}
        {chart}
      </div>
    );
  }
}

export default Home;

