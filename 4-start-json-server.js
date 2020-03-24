const fs = require("fs");
const { exec } = require("child_process");
const version = 5;

const sourcePath = "./workspace/locations.json";
const databasePath = "./workspace/database.json";

function checkRequiredFiles() {
  let isValidDatabase = true;
  if (!fs.existsSync(databasePath)) {
    isValidDatabase = false;
    console.log(
      "Database file does not exist. It will be created automatically."
    );
  } else {
    const data = require(databasePath);
    if (!data || !data.info || data.info.version != version) {
      isValidDatabase = false;
      console.log(
        "The version of database is not same. It will be created automatically."
      );
    }
  }
  if (!isValidDatabase) {
    const sourceExisted = fs.existsSync(sourcePath);
    if (!sourceExisted) {
      console.log("Source not exist");
      exit(100);
    }

    const source = require(sourcePath);

    fs.writeFileSync(
      databasePath,
      JSON.stringify({
        data: source.map((item, index) => {
          const node = {
            id: index,
            address: item.address,
            adddresses: item.adddresses,
            coords: (item.googleResponse || []).map(address => {
              return address.results[0].geometry.location;
            }),
            segments: [],
            status: "pending",
            distance: 20,
            limit: 4
          };
          return node;
        }),
        progress: {
          index: -1
        },
        info: {
          version
        }
      })
    );
  }
  console.log("Check file finished");
}

checkRequiredFiles();
exec("npm run start-server", (error, stdout, stderr) => {
  console.log("Start server result", error, stdout, stderr);
});
