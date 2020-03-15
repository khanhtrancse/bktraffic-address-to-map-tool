const fs = require("fs");
const { exec } = require("child_process");

const sourcePath = "./workspace/locations.json";
const databasePath = "./workspace/database.json";

function checkRequiredFiles() {
  if (!fs.existsSync(databasePath)) {
    const sourceExisted = fs.existsSync(sourcePath);
    if (!sourceExisted) {
      console.log("Source not exist");
      exit(100);
    }

    const source = require(sourcePath);
    console.log(
      "Database file does not exist. It will be created automatically."
    );
    fs.writeFileSync(
      databasePath,
      JSON.stringify({
        data: source,
        progress: {
          verifiedIndex: -1
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
