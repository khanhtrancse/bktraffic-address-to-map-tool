require("dotnet").config();
const axios = require("axios").default;
const fs = require("fs");

function getLink(address) {
  address = encodeURI(address);
  //using khanhtran api. Added billing
  return `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.GOOGLE_API_KEY}`;
}

function addStreetToText(text) {
  return text;
  //   const part = text.split("-");
  //   let address = "";
  //   if (part.length > 1) {
  //     for (let i = 0; i < part.length; i++) {
  //       address += "đường " + part[i].trim();
  //       if (i < part.length - 1) {
  //         address += " - ";
  //       }
  //     }
  //   } else {
  //     return text;
  //   }
  //   return address;
}

async function analyzeTextToAddresses() {
  const data = require("./workspace/source.json");
  const dest = [];

  console.log("Start mapping");
  for (let i = 0; i < data.length; i++) {
    try {
      const item = data[i];
      console.log("Start getting location for", item.address.name);

      const regex = /^([^:]+:)?([^,\+]+)((,|\+)([^,\+]+))?$/i;
      const result = item.address.name.match(regex);
      item.addresses = [];

      if (!result) {
        console.log("Analyze text error");
      } else {
        const district = result[1];
        let part1 = result[2];
        let part2 = result[5];

        if (part1) {
          part1 = addStreetToText(part1);
          item.addresses.push(part1.trim());
        }
        if (part2) {
          part2 = addStreetToText(part2);
          item.addresses.push(part2.trim());
        }
      }
      dest.push(item);
    } catch (err) {
      console.log("Map address index ", i, "error");
      console.log(err);
    }
  }
  fs.writeFileSync("./workspace/addresses.json", JSON.stringify(dest));
}

analyzeTextToAddresses();

// const regex = /^([^:]+:)?([^,\+]+)((,|\+)([^,\+]+))?$/i;
// const result = "tân phú: tây thạnh - d9 + d9- chế lan viên".match(regex);
// console.log(result);
// if (!result) {
//   console.log("Analyze text error");
// } else {
//   const district = result[1];
//   const part1 = result[2];
//   const part2 = result[5];

//   if (part1 && part2) {
//     console.log("Two point:", part1, "<==>", part2);
//   } else if (part1) {
//     console.log("Single point: ", part1);
//   } else {
//     console.log("Analyze text error", result);
//   }
// }
