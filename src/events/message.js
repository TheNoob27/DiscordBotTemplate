const { Event, Embed } = require("../classes")

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

  async run(message) {
    if (!message.content.startsWith(this.client.config.prefix)) return;
    const [cmd, ...args] = message.content.slice(this.client.config.prefix.length).split(" ")
    const command = this.client.commands.resolve(cmd)
    
    if (command) {
      if (command.cooldowns.has(message.author.id)) return command.sendCooldown(message.channel, message.author.id)
      if (command.disabled && !message.author.owner) {
        return message.channel.send(
          new Embed()
          .setTitle("Command Disabled")
          .setDescription("This command is currently disabled. " + (command.settings.disableMessage ? "The reason for that is: **" + command.settings.disableMessage + "**." : "It was probably disabled because something wasn't functioning properly, otherwise another reason.") + "\nPlease try again later, or **[join the support server](https://discord.gg/rZgxfbH)** for more info.")
          .setColor(this.client.colors.error)
          .setTimestamp()
        )
      }
      
      if (command.settings.lowerCaseArgs) { // lowerCaseArgs can be false, true or [0, 1, ...]
        if (command.settings.lowerCaseArgs instanceof Array) args = args.map((a, i) => command.settings.lowerCaseArgs.includes(i) ? a.toLowerCase() : a)
        else args = args.map(a => a.toLowerCase())
      }
      
      command.addCooldown(message.author.id)
      command.run(message, args).catch(err => {
        command.deleteCooldown(message.author.id)

        if (!message.author.owner) this.client.owner.send(
          new Embed()
          .setTitle("Error")
          .setDescription("```js\n"+ err.stack +"\n```")
          .setColor(this.client.colors.error)
          .addField("Message", `**Command**: ${command.help.name} \n**Content**: ${message.content}`)
          .addField("Guild", `**Name**: ${message.guild.name}\n**ID**: ${message.guild.id}`)
          .addField("Author", `**Name**: ${message.author.tag} \n**ID**: ${message.author.id}`)
          .setTimestamp()
        )

        return message.channel.send(
          new Embed()
          .setTitle("An Error Occurred!")
          .setColor(this.client.colors.error)
          .setDescription("Something went wrong while trying to run this command! This shouldn't happen. " + (command.settings.errorMessage ? "\nNote: **" + command.settings.errorMessage + "**" : "If this persists, please **[join the support server](" + this.client.config.links.support + ")** to get help and we will try to fix it as soon as possible.") + "\n\n**Error**: ```js\n" + err[message.author.owner ? "stack" : "message"] + "\n```")
          .setFooter("Failed to run " + prefix + command.help.name + ".")
          .setTimestamp()
        ).silence()
      })
    }
  }
}
