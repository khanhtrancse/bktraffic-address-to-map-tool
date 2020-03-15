/**
 * Remove all auto generated files
 */

const fs = require("fs");

function removeFileIfExist(filePath) {
  fs.exists(filePath, exist => {
    if (exist) {
      fs.unlink(filePath);
    }
  });
}

removeFileIfExist("./workspace/addresses.json");
removeFileIfExist("./workspace/locations.json");
