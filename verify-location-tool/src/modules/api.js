import axios from "axios";
import { Setting } from "../config/setting";

function getAddresses() {
  const api = Setting.host + "/data";
  return axios.get(api);
}

function getProgress() {
  const api = Setting.host + "/progress";
  return axios.get(api);
}

async function updateAddress(index, address) {
  let api = Setting.host + "/progress";
  const body = {
    index: index
  };
  await axios.put(api, body);

  api = Setting.host + `/data/${index}`;
  return await axios.put(api, address);
}

function findNearSegment(lat, long, distance, limit) {
  const api = `http://localhost:3123/api/segment/find-near?lat=${lat}&lng=${long}&max_distance=${distance}&limit=${limit}`;
  console.log("Call api", api);
  return axios.get(api);
}

function findPath(slat, slng, elat, elng) {
  const api = `http://localhost:3123/api/segment/direct?slat=${slat}&slng=${slng}&type=distance&elat=${elat}&elng=${elng}`;
  return axios.get(api);
}

export const Api = {
  getAddresses,
  getProgress,
  findNearSegment,
  findPath,
  updateAddress
};
