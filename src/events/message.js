const Event = require("../classes/Event.js")

module.exports = class extends Event {
  constructor(client) {
    super(client, "event")
  }

  shouldRun(message) {
    return message.type === "DEFAULT" && (this.enabled || message.author.owner)
  }

  getData(message) {
    return {
      message
    }
  }
  
  async fetchPartials(message) {
    await message.fetch()
    return [message]
  }

  async run() {
    const [cmd, ...args] = message.content.slice(this.client.config.prefix.length).split(" ")
    const command = this.client.commands.resolve(cmd)
    if (command) command.run(message, args)
  }
}
