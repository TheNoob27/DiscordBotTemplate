const Event = require("../classes/Event.js")

module.exports = class extends Event {
  constructor(client) {
    super(client, "event")
  }

  shouldRun() {
    return this.enabled
  }

  getData() {
    return {
    }
  }

  async run() {
    
  }
}
