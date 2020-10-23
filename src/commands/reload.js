const Command = require("../classes/Command.js")

module.exports = class extends Command {
  constructor(client) {
    super(client, {
      name: "reload",
      aliases: ["refresh", "update", "rl"],
      description: "Reloads a command.",
      usage: `util reload <command>`,
      category: "Owner Commands",
      lowerCaseArgs: [0],
      owner: true,
    })
  }

  async run(message, args) {
    if (!args.length) return;
    const cmd = args[0]

    try {
      if (cmd === "all") {
        this.client.commands.reload()
        message.channel.send(`Reloaded all ${this.client.commands.size} commands.`)
      } else if (cmd === "file" && args[1]) {
        const file = args[1]

        delete require.cache[require.resolve(`../${file}`)] // src/...
        return message.channel.send(`The file \`${file}\` has been reloaded!`)
      } else if (cmd === "event" && args[1]) {
        if (args[1].toLowerCase() === "all") {
          this.client.events.reload()
          return message.channel.send(`Reloaded all ${this.client.events.size} events.`)
        }
        this.client.events.reload(args.slice(1), true, true)
        return message.channel.send(`The events \`${args.slice(1).join("`, `")}\` have been reloaded!`)
      } else {
        this.client.commands.reload(args, true, true)
        return message.channel.send(`The commands \`${args.map(c => this.client.commands.resolve(c)).join("`, `")}\` have been reloaded!`)
      }
    } catch (e) {
      let c = ["file", "event"].includes(args[0]) ? args[0] + "s " + args.slice(1).join("`, `") : args.join("`, `")
      if (Array.isArray(e)) [c, e] = e
      return message.channel.send(`Could not reload: \`${c}\` \nError Message: \`\`\`js\n${e}\n\`\`\``)
    }
  }
}