require("dotenv").config();
const axios = require("axios").default;
const fs = require("fs");

function getLink(address) {
  address = encodeURI(address);
  //using khanhtran api. Added billing
  return `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.GOOGLE_API_KEY}`;
}

async function getLocations() {
  let data;
  try {
    data = require("./workspace/addresses.json");
  } catch (err) {
    console.log(
      "Read data error. Please run the command 2-text-to-addresses.js before running this command"
    );
    return;
  }
  const hadLocationText = {};
  try {
    const hadLocationData = require("./workspace/locations.json");
    for (let i = 0; i < hadLocationData.length; i++) {
      if (hadLocationData[i].status === "completed") {
        hadLocationText[hadLocationData[i].address.id] = hadLocationData[i];
      }
    }
  } catch (err) {}

  const dest = [];

  console.log("Start get location");
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    console.log(
      `${i}/${data.length}: Start getting location for  ${item.address.name}`
    );

    try {
      if (hadLocationText[item.address.id]) {
        console.log(`Text had location. Skip it!! ${item.address.name}`);
        dest.push(hadLocationText[item.address.id]);
        continue;
      }

      item.googleResponse = [];
      for (let j = 0; item.addresses && item.addresses.length > j; j++) {
        console.log("Address ", j, ": ", item.addresses[j]);
        const api = getLink(item.addresses[j]);
        const response = await axios(api);
        if (response && response.data && response.data.status === "OK") {
          item.googleResponse.push(response.data);
        } else {
          console.log(response.data);
          throw new Error("Google response error");
        }
      }
      item.status = "completed";
    } catch (err) {
      console.log("Get location for", item.address.name, "error");
      console.log(err);
      item.status = "failure";
    }
    dest.push(item);
  }
  fs.writeFileSync("./workspace/locations.json", JSON.stringify(dest));
}

getLocations();
