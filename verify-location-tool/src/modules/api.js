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

function updateProgress(index) {
  const api = Setting.host + "/progress";
  const body = {
    verifiedIndex: index
  };
  return axios.post(api, body);
}

function findNearSegment(lat, long) {
  const api = `https://api.bktraffic.com/api/segment/find-near?lat=${lat}&lng=${long}`;
  return axios.get(api);
}

export const Api = {
  getAddresses,
  getProgress,
  updateProgress,
  findNearSegment
};
