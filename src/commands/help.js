const { Command, Embed } = require("../classes")

module.exports = class extends Command {
  constructor(client) {
    super(client, {
      name: "help",
      aliases: ["h", "cmds", "commands"],
      description: "Shows a list of commands.",
      usage: `${client.config.prefix} help (command)`,
      category: "Info",
      cooldown: 1000,
      botPerms: ["EMBED_LINKS"]
    })
  }

  async run(message, args) {
    const command = this.client.commands.resolve(args[0])
    if (command) return message.channel.send(command.getHelp())

    return message.channel.send(
      new Embed()
      .setTitle("Help")
      .setDescription(`Here are all ${this.client.commands.size} of my commands: \n${this.client.commands.map(c => c.help.usage).join("\n")}`)
      .setColor(this.client.colors.color)
    )
  }
}
