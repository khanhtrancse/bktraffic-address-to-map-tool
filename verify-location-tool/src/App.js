import React from "react";
import "./App.css";
import { Map, TileLayer, Marker, Polyline } from "react-leaflet";
import { Api } from "./modules/api";
import { ToastContainer, toast } from "react-toastify";

const segmentColors = ["red", "blue", "green", "yellow"];
class App extends React.Component {
  state = {
    index: 0,
    data: [],
    segments: [
      /*{
      "slat": 10.875529,
      "slng": 106.799825,
      "elat": 10.875436,
      "elng": 106.7997647,
      "segment_id": 45855,
      }*/
    ],
    distance: 20,
    limit: 4
  };

  componentDidMount() {
    Api.getAddresses().then(response => {
      if (response.status === 200) {
        this.setState({
          data: response.data
        });
        Api.getProgress().then(response => {
          if (response.status === 200) {
            console.log("Response", response);
            this.setState({
              index: response.data.index
            });
          }
        });
        this.showAddress(0);
      } else {
        toast("Get data error, make sure the server is running...");
      }
    });
  }

  goToNext = () => {
    if (this.state.index < this.state.data.length - 1) {
      this.showAddress(this.state.index + 1);
    }
  };

  goToPrevious = () => {
    if (this.state.index > 0) {
      this.showAddress(this.state.index - 1);
    }
  };

  showAddress = async index => {
    const currentAddress = this.state.data[index];
    const node1 = currentAddress.coords[0];
    const node2 = currentAddress.coords[1];
    console.log(currentAddress);
    this.setState({
      index,
      distance: currentAddress.distance || this.state.distance,
      limit: currentAddress.limit || this.state.distance
    });
    this.getSegments(
      node1,
      node2,
      currentAddress.limit,
      currentAddress.distance
    );
  };

  getSegments = async (node1, node2, limit, distance) => {
    this.setState({
      segments: []
    });
    console.log("Get segment state", this.state);
    if (!limit) {
      limit = parseInt(this.state.limit) || 4;
    }
    if (!distance) {
      distance = parseInt(this.state.distance) || 20;
    }

    if (!node2) {
      const response = await Api.findNearSegment(
        node1.lat,
        node1.lng,
        distance || 20,
        limit || 4
      );
      console.log(response);
      if (response.data.code == 200) {
        this.setState({
          segments: response.data.data.map(segment => {
            const startNode = segment.polyline.coordinates[0]; //[lng,lat]
            const endNode = segment.polyline.coordinates[1]; //[lng,lat]
            return {
              slat: startNode[1],
              slng: startNode[0],
              elat: endNode[1],
              elng: endNode[0],
              segment_id: segment._id
            };
          })
        });
      }
    } else {
    }
  };

  confirm = () => {
    const currentAddress = this.state.data[this.state.index];
    currentAddress.segments = this.state.segments;
    currentAddress.status = "completed";
    currentAddress.distance = parseInt(this.state.distance);
    currentAddress.limit = parseInt(this.state.limit);
    Api.updateAddress(this.state.index, currentAddress)
      .then(response => {
        this.setState({
          data: this.state.data.map(item => {
            if (item.id === currentAddress) {
              return currentAddress;
            }
            return item;
          })
        });
        this.goToNext();
      })
      .catch(err => {
        console.log("Update progress error", err);
      });
  };

  onMoveMarker = (id, event) => {
    console.log("Move", id, event);
    const nodes = this.state.data[this.state.index].coords;
    nodes[id].lat = event.lat;
    nodes[id].lng = event.lng;
    this.setState({
      data: this.state.data.map(item => item)
    });
    this.getSegments(nodes[0], nodes[1]);
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
    coords.forEach((item, index) => {
      markers.push(
        <Marker
          position={[item.lat, item.lng]}
          draggable
          ondragend={event => {
            this.onMoveMarker(index, event.target._latlng);
          }}
        />
      );
    });
    const segments = [];
    this.state.segments.map((segment, index) => {
      const position = [
        [segment.slat, segment.slng],
        [segment.elat, segment.elng]
      ];
      console.log("Position", position);
      segments.push(
        <Polyline
          positions={position}
          color={segmentColors[index % segmentColors.length]}
        />
      );
    });
    return (
      <div className="App">
        <div
          className="col-12 px-0 row mx-0 py-3 justify-content-between align-items-center
          bg-info"
          style={{
            minHeight: "50px",
            zIndex: 10000,
            top: 0
          }}
        >
          <div className="col-12 col-md-6 row mx-0 justify-content-between text-white">
            <div style={{ width: "30px" }}>
              <div
                className="btn btn-sm btn-outline-warning ml-2 text-white my-auto py-3"
                onClick={this.goToPrevious}
              >
                <div>{"<"}</div>
              </div>
              <div
                className="btn btn-sm btn-outline-warning mr-2 text-white  my-auto py-1 my-1"
                onClick={() => {
                  this.showAddress(0);
                }}
              >
                <span>{"<<"}</span>
              </div>
            </div>
            <div style={{ maxWidth: "70%", textAlign: "left" }}>
              <h6>
                Address {this.state.index + ": " + currentNode.address.name}
              </h6>
              <div>Mô tả: {currentNode.address.district}</div>
              <div>
                Tình trạng:{" "}
                <span
                  className={
                    currentNode.status === "completed"
                      ? "bg-danger px-2 rounded"
                      : "bg-warning px-2 rounded"
                  }
                >
                  {currentNode.status}
                </span>{" "}
              </div>
            </div>
            <div style={{ width: "30px" }}>
              <div
                className="btn btn-sm btn-outline-warning mr-2 text-white  my-auto py-2 mb-1"
                onClick={this.goToNext}
              >
                <span>{"> "}</span>
              </div>
              <div
                className="btn btn-sm btn-outline-warning mr-2 text-white  my-auto py-1 my-1"
                onClick={() => {
                  this.showAddress(this.state.data.length - 1);
                }}
              >
                <span>{">>"}</span>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6 row mx-0 px-0">
            <h6 className="col-12 text-white  ">Info</h6>
            <div className="col-8">
              <div className="form-group row mb-1 ">
                <label htmlFor="distance" className="col-4 text-white">
                  Distance
                </label>
                <input
                  id="distance"
                  value={this.state.distance}
                  className="col-8 form-control form-control-sm"
                  onChange={event =>
                    this.setState({
                      distance: parseInt(event.target.value) || ""
                    })
                  }
                />
              </div>
              <div className="form-group row mb-1 ">
                <label htmlFor="limit" className="col-4 text-white">
                  Limit
                </label>
                <input
                  id="limit"
                  value={this.state.limit}
                  className="col-8 form-control form-control-sm"
                  onChange={event =>
                    this.setState({
                      limit: parseInt(event.target.value) || ""
                    })
                  }
                />
              </div>
              <div className="form-group row mb-1 ">
                <label htmlFor="latLong" className="col-4 text-white">
                  Lat,Long
                </label>
                <input
                  id="latLong"
                  value={
                    coords.length > 0 ? coords[0].lat + "," + coords[0].lng : ""
                  }
                  className="col-8 form-control form-control-sm"
                  onChange={event => {
                    const latLong = event.target.value;
                    const coords = latLong.split(",");
                    if (coords.length == 2) {
                      currentNode.coords[0] = {
                        lat: parseFloat(coords[0]),
                        lng: parseFloat(coords[1])
                      };
                      this.setState({
                        data: this.state.data.map(item => item)
                      });
                    }
                  }}
                />
              </div>
              <div className="form-group row mb-1 ">
                <label htmlFor="segment" className="col-4 text-white">
                  Segments
                </label>
                <input
                  id="segment"
                  value={this.state.segments.length}
                  className="col-8 form-control form-control-sm"
                  disabled
                />
              </div>
            </div>
            <div className="col-4 row justify-content-center align-items-center">
              <div>
                <div
                  className="btn btn-sm btn-primary mb-2"
                  onClick={() => this.showAddress(this.state.index)}
                >
                  Reload
                </div>
                <div
                  className="btn btn-sm btn-success"
                  onClick={() => this.confirm(this.state.index)}
                >
                  Confirm
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <Map
            center={
              coords.length > 0
                ? [coords[0].lat, coords[0].lng]
                : [51.505, -0.09]
            }
            zoom={19}
            maxZoom={21}
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
