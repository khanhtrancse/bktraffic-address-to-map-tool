import React from "react";
import "./App.css";
import LeafLet, {
  Map,
  TileLayer,
  Marker,
  Polyline,
  Popup
} from "react-leaflet";
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
    distanceText: "20",
    limit: 4,
    limitText: "4",
    nodes: [
      /**
       * {
       * lat: 10, long
       * }
       */
    ],
    directs: [
      /**
       * {slat,slng, elat,elng},
       */
    ],
    mapCenter: {},
    tmpNode: null
  };

  clickMode = null;

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

    const nodes = currentAddress.nodes || [];
    const directs = currentAddress.directs || [];
    if (nodes.length == 0 && directs.length == 0 && currentAddress.coords) {
      if (currentAddress.coords.length == 1) {
        nodes.push(currentAddress.coords[0]);
      } else if (currentAddress.coords.length == 2) {
        directs.push({
          slat: currentAddress.coords[0].lat,
          slng: currentAddress.coords[0].lng,
          elat: currentAddress.coords[1].lat,
          elng: currentAddress.coords[1].lng
        });
      }
    }

    const limit = currentAddress.limit || this.state.limit;
    const distance = currentAddress.distance || this.state.distance;
    const centerPoint = {};
    if (nodes.length > 0) {
      centerPoint.lat = nodes[0].lat;
      centerPoint.lng = nodes[0].lng;
    } else if (directs.length > 0) {
      centerPoint.lat = directs[0].slat;
      centerPoint.lng = directs[0].slng;
    }
    this.setState({
      index,
      distance,
      limit,
      segments: currentAddress.segments || [],
      nodes,
      mapCenter: centerPoint,
      directs
    });

    this.getSegments(nodes, directs, limit, distance);
  };

  getSegments = async (nodes, directs, limit, distance) => {
    const segments = [];
    for (let i = 0; nodes && i < nodes.length; i++) {
      const response = await Api.findNearSegment(
        nodes[i].lat,
        nodes[i].lng,
        distance,
        limit
      );

      if (response.data.code == 200) {
        segments.push(
          ...response.data.data.map(segment => {
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
        );
      }
    }

    for (let i = 0; directs && i < directs.length; i++) {
      const response = await Api.findPath(
        directs[i].slat,
        directs[i].slng,
        directs[i].elat,
        directs[i].elng
      );
      console.log("Direct", response);
      if (response.data.code === 200 && response.data.data.length > 0) {
        segments.push(
          ...response.data.data[0].coords.map(item => ({
            slat: item.lat,
            slng: item.lng,
            elat: item.elat,
            elng: item.elng,
            segment_id: item.segment_id
          }))
        );
      }
    }

    this.setState({ segments });
  };

  reloadSegment = () => {
    console.log("State", this.state);
    this.getSegments(
      this.state.nodes,
      this.state.directs,
      this.state.limit,
      this.state.distance
    );
  };

  confirm = () => {
    const currentAddress = this.state.data[this.state.index];
    currentAddress.segments = this.state.segments;
    currentAddress.status = "completed";
    currentAddress.distance = this.state.distance;
    currentAddress.limit = this.state.limit;
    currentAddress.nodes = this.state.nodes;
    currentAddress.directs = this.state.directs;
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

  onMoveNodeMarker = (index, coords) => {
    console.log("Move", index, coords);
    const nodes = this.state.nodes;
    nodes[index].lat = coords.lat;
    nodes[index].lng = coords.lng;
    this.setState(
      {
        nodes: nodes.map(item => item)
      },
      this.reloadSegment
    );
  };

  onMoveDirectMarker = (index, type, coords) => {
    console.log("Move", index, coords);
    const directs = this.state.directs.map((item, idx) => {
      if (idx != index) {
        return item;
      }

      if (type === "start") {
        item.slat = coords.lat;
        item.slng = coords.lng;
      } else {
        item.elat = coords.lat;
        item.elng = coords.lng;
      }
      return item;
    });
    this.setState(
      {
        directs
      },
      this.reloadSegment
    );
  };

  addNode = () => {
    console.log("Add note");
    this.clickMode = "add-node";
  };

  addDirect = () => {
    console.log("Add direct");
    this.clickMode = "add-direct";
  };

  removeNode = index => {
    console.log("Remove ", index);
    this.setState({
      nodes: this.state.nodes.filter((item, i) => i !== index)
    });
  };

  removeDirect = index => {
    console.log("Remove ", index);
    this.setState({
      directs: this.state.directs.filter((item, i) => i !== index)
    });
  };

  onClickMap = event => {
    console.log("Click map", this.clickMode, event);
    if (this.clickMode == "add-node") {
      this.clickMode = null;
      this.setState(
        {
          nodes: [...this.state.nodes, event.latlng]
        },
        this.reloadSegment
      );
    } else if (this.clickMode == "add-direct") {
      if (!this.state.tmpNode) {
        this.setState({
          tmpNode: event.latlng
        });
      } else {
        this.setState(
          {
            tmpNode: null,
            directs: [
              ...this.state.directs,
              {
                slat: this.state.tmpNode.lat,
                slng: this.state.tmpNode.lng,
                elat: event.latlng.lat,
                elng: event.latlng.lng
              }
            ]
          },
          this.reloadSegment
        );
        this.clickMode = null;
      }
    }
  };

  render() {
    const tile_url = "http://mt3.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
    if (this.state.data.length < 1) {
      return <h6>Loading</h6>;
    }
    const currentAddress = this.state.data[this.state.index];
    const nodes = this.state.nodes;
    const directs = this.state.directs;
    const markers = [];
    nodes.forEach((item, index) => {
      markers.push(
        <Marker
          position={[item.lat, item.lng]}
          draggable
          ondragend={event => {
            this.onMoveNodeMarker(index, event.target._latlng);
          }}
          onclick={() => this.removeNode(index)}
        />
      );
    });
    directs.forEach((item, index) => {
      markers.push(
        <Marker
          position={[item.slat, item.slng]}
          draggable
          ondragend={event => {
            this.onMoveDirectMarker(index, "start", event.target._latlng);
          }}
          onclick={() => this.removeDirect(index)}
        />
      );
      markers.push(
        <Marker
          position={[item.elat, item.elng]}
          draggable
          ondragend={event => {
            this.onMoveDirectMarker(index, "end", event.target._latlng);
          }}
          onclick={() => this.removeDirect(index)}
        />
      );
    });
    if (this.state.tmpNode) {
      markers.push(
        <Marker position={[this.state.tmpNode.lat, this.state.tmpNode.lng]} />
      );
    }
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
          className="col-12 px-0 row mx-0 py-3 bg-info"
          style={{
            position: "absolute",
            height: "100%",
            width: "270px",
            zIndex: 10000,
            top: 0
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%"
            }}
            className="text-white"
          >
            {/**Navigation */}
            <div className="col-12 row mx-0 justify-content-between mb-3">
              <div
                className="btn btn-sm btn-outline-warning  text-white "
                onClick={() => {
                  this.showAddress(0);
                }}
              >
                <span>{"<<"}</span>
              </div>
              <div
                className="btn btn-sm btn-outline-warning text-white "
                onClick={this.goToPrevious}
              >
                <div>{"<"}</div>
              </div>
              <div>{`${this.state.index}/${this.state.data.length - 1}`}</div>
              <div
                className="btn btn-sm btn-outline-warning text-white "
                onClick={this.goToNext}
              >
                <span>{"> "}</span>
              </div>
              <div
                className="btn btn-sm btn-outline-warning text-white  "
                onClick={() => {
                  this.showAddress(this.state.data.length - 1);
                }}
              >
                <span>{">>"}</span>
              </div>
            </div>
            <div className="form-group row mx-0 pl-0 col-12">
              <label htmlFor="index" className="col-4 text-white text-left">
                Go to
              </label>
              <input
                id="index"
                value={this.state.index}
                className="col-8 form-control form-control-sm"
                onChange={event => {
                  const index = parseInt(event.target.value);
                  if (index >= 0 && index < this.state.data.length) {
                    this.setState({ index });
                  }
                }}
              />
            </div>
            <hr />

            {/** Info */}
            <div className="col-12  row mx-0 text-white">
              <div className="col-12 px-0 text-left">
                #{currentAddress.address.name}
              </div>
              <small>{currentAddress.address.district}</small>
              <div className="col-12 text-left px-0">
                <span
                  className={
                    currentAddress.status === "completed"
                      ? "bg-danger px-2 rounded"
                      : "bg-warning px-2 rounded"
                  }
                >
                  {currentAddress.status}
                </span>{" "}
              </div>

              <div style={{ maxWidth: "70%", textAlign: "left" }}></div>
              <div style={{ width: "30px" }}></div>
            </div>
            <hr />

            {/** Node && Path */}
            <div className="col-12 text-left">
              <div className="col-12 row px-0 mx-0 mb-1">
                <div className="col-8 px-0">Nodes</div>
                <div className="col-4">
                  <div
                    style={{
                      background: "green",
                      width: "24px",
                      height: "24px",
                      cursor: "pointer",
                      borderRadius: "15px"
                    }}
                    onClick={this.addNode}
                    className="text-center"
                  >
                    +
                  </div>
                </div>
              </div>
              {nodes.map((item, index) => {
                return (
                  <div className="col-12 row px-0 mx-0 mb-1">
                    <div className="col-12   px-0">
                      <small className="ml-3">+ Node {index} </small>
                    </div>
                  </div>
                );
              })}

              <div className="col-12 row px-0 mx-0 mb-1">
                <div className="col-8 px-0">Directs</div>
                <div className="col-4">
                  <div
                    style={{
                      background: "green",
                      width: "24px",
                      height: "24px",
                      cursor: "pointer",
                      borderRadius: "15px"
                    }}
                    onClick={this.addDirect}
                    className="text-center"
                  >
                    +
                  </div>
                </div>
              </div>
              {directs.map((item, index) => {
                return (
                  <div className="col-12 row px-0 mx-0 mb-1">
                    <div className="col-12   px-0">
                      <small className="ml-3">+ Direct {index} </small>
                    </div>
                  </div>
                );
              })}
            </div>
            <hr />

            {/** Adjust */}
            <div className="col-12 px-0">
              <div className="form-group row mb-1 col-12">
                <label htmlFor="distance" className="col-4 text-white">
                  Distance
                </label>
                <input
                  id="distance"
                  value={this.state.distanceText}
                  className="col-8 form-control form-control-sm"
                  onChange={event =>
                    this.setState(
                      {
                        distance: parseInt(event.target.value) || 20,
                        distanceText: event.target.value
                      },
                      this.reloadSegment
                    )
                  }
                />
              </div>
              <div className="form-group row mb-1 col-12">
                <label htmlFor="limit" className="col-4 text-white">
                  Limit
                </label>
                <input
                  id="limit"
                  value={this.state.limitText}
                  className="col-8 form-control form-control-sm"
                  onChange={event =>
                    this.setState(
                      {
                        limit: parseInt(event.target.value) || 4,
                        limitText: event.target.value
                      },
                      this.reloadSegment
                    )
                  }
                />
              </div>
              <div className="form-group row mb-1 col-12">
                <label htmlFor="latLong" className="col-4 text-white">
                  Lat,Long
                </label>
                <input
                  id="latLong"
                  value={
                    this.state.mapCenter.lat + "," + this.state.mapCenter.lng
                  }
                  className="col-8 form-control form-control-sm"
                  onChange={event => {
                    const latLong = event.target.value.split(",");
                    const lat = parseFloat(latLong[0]);
                    const lng = parseFloat(latLong[1]);
                    this.setState({
                      mapCenter: { lat, lng }
                    });
                  }}
                />
              </div>
              <div className="form-group row mb-1 col-12">
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

            {/**Action */}
            <div className="col-12 row justify-content-center align-items-center">
              <div
                className="btn btn-sm btn-primary mt-2 mx-2"
                onClick={() => this.goToNext()}
              >
                Skip
              </div>
              <div
                className="btn btn-sm btn-success mt-2 mx-2"
                onClick={() => this.confirm(this.state.index)}
              >
                Confirm
              </div>
            </div>
          </div>
        </div>
        <div>
          <Map
            center={
              this.state.mapCenter.lat > 0 && this.state.mapCenter.lng > 0
                ? [this.state.mapCenter.lat, this.state.mapCenter.lng]
                : [51.505, -0.09]
            }
            zoom={19}
            maxZoom={21}
            onclick={this.onClickMap}
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
