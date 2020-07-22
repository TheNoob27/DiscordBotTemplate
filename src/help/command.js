const { Commmand, Embed } = require("../classes")

module.exports = class extends Commmand {
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
}