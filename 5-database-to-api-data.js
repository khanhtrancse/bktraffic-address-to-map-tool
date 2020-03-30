const fs = require("fs");
const destPath = "./workspace/api-data";
const databasePath = "./workspace/500-diem.json";

const data = require(databasePath);

const apiData = data.data
  .filter(item => item.status === "completed" && item.segments.length > 0)
  .map(item => {
    const segments = [];
    const segmentHash = {};
    item.segments.forEach(element => {
      if (!segmentHash[element.segment_id]) {
        segmentHash[element.segment_id] = true;
        segments.push(element.segment_id);
      }
    });
    return {
      segments,
      address_id: item.address.id
    };
  });

fs.writeFileSync(destPath + "-1.json", JSON.stringify(apiData.slice(0, 100)));
fs.writeFileSync(destPath + "-2.json", JSON.stringify(apiData.slice(100, 200)));
fs.writeFileSync(destPath + "-3.json", JSON.stringify(apiData.slice(200, 300)));
fs.writeFileSync(destPath + "-4.json", JSON.stringify(apiData.slice(300, 400)));
fs.writeFileSync(destPath + "-5.json", JSON.stringify(apiData.slice(400, 500)));
