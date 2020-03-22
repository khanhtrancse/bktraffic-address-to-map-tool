import React from "react";
import "./App.css";
import { Map, TileLayer, Marker, Polyline } from "react-leaflet";
import { Api } from "./modules/api";
import { ToastContainer, toast } from "react-toastify";

class App extends React.Component {
  state = {
    index: 0,
    data: [],
    segments: []
  };
  componentDidMount() {
    Api.getAddresses().then(response => {
      if (response.status === 200) {
        this.setState({
          data: response.data
        });
        this.showNode(0);
      } else {
        toast("Get data error, make sure the server is running...");
      }
    });
  }

  goToNext = () => {
    if (this.state.index < this.state.data.length - 1) {
      this.showNode(this.state.index + 1);
    }
  };

  goToPrevious = () => {
    if (this.state.index > 0) {
      this.showNode(this.state.index - 1);
    }
  };

  showNode = async index => {
    const currentNode = this.state.data[index];

    const segments = [];
    try {
      for (let i = 0; i < currentNode.coords.length; i++) {
        const response = await Api.findNearSegment(
          currentNode.coords[i].lat,
          currentNode.coords[i].lng
        );
        console.log(response);
        segments.push(...response.data.data);
      }
      console.log("Segment", segments);
    } catch (err) {
      console.log("Error", err);
    }

    this.setState({
      index,
      segments
    });
  };

  render() {
    const apikey = "21685a1c42db424ba802d1aada6b23ae";
    const tile_url = "http://mt3.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
    if (this.state.data.length < 1) {
      return <h6>Loading</h6>;
    }
    const currentNode = this.state.data[this.state.index];
    const coords = currentNode.coords;
    const markers = [];
    coords.forEach(item => {
      markers.push(<Marker position={[item.lat, item.lng]} />);
    });
    const segments = [];
    this.state.segments.map(segment => {
      const startNode = segment.polyline.coordinates[0]; //[lng,lat]
      const endNode = segment.polyline.coordinates[1]; //[lng,lat]
      const position = [
        [startNode[1], startNode[0]],
        [endNode[1], endNode[0]]
      ];
      console.log("Position", position);
      segments.push(<Polyline positions={position} />);
    });
    return (
      <div className="App">
        <div
          className="col-12 row mx-0 py-3 justify-content-between align-items-center
          bg-info"
          style={{
            minHeight: "50px",
            zIndex: 10000,
            top: 0
          }}
        >
          <div
            className="btn btn-outline-secondary ml-4 text-white"
            onClick={this.goToPrevious}
          >
            <span>Previous</span>
          </div>
          <div style={{ maxWidth: "70%" }}>
            <h4>
              Address {this.state.index + ": " + currentNode.address.name}
            </h4>
            <h4>District: {currentNode.address.district}</h4>
          </div>
          <div
            className="btn btn-outline-secondary mr-4 text-white"
            onClick={this.goToNext}
          >
            <span>Next</span>
          </div>
        </div>
        <div>
          <Map
            center={
              coords.length > 0
                ? [coords[0].lat, coords[0].lng]
                : [51.505, -0.09]
            }
            zoom={20}
            style={{ height: "100vh" }}
          >
            <TileLayer url={tile_url} detectRetina={true} />
            {markers}
            {/* <Polyline positions={this.state.segments} /> */}
            {segments}
          </Map>
        </div>
        <ToastContainer />
      </div>
    );
  }
}

export default App;
