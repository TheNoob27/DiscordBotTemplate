const Client = require("./classes/Client.js").initialiseProcess()

const client = new Client()

client.init().catch(err => {
  console.error(err)
  // optionally end the process:
  process.exit()
})
