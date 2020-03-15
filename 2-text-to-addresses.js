/**
 * Analyze text to address
 * Example:
 * Text: tân bình - 12 : tây thạnh - trường chinh , trường chinh - phan huy ích
 * Addresses: ["tây thạnh - trường chinh", "trường chinh - phan huy ích"]
 */

const fs = require("fs");

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
