const { Command, Embed } = require("../classes")

module.exports = class extends Command {
  constructor(client) {
    super(client, {
      name: "",
      aliases: [],
      description: "",
      usage: "",
      category: "",
      cooldown: 1000,
      botPerms: []
    })
  }
  
  async run(message, args) {
  
  }
}
