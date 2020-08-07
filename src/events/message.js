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
    if (message.partial) await message.fetch()
    return [message]
  }

  async run(message) {
    let prefix = this.client.config.prefix
    if (message.content === `<@${this.client.user.id}>` || message.content === `<@!${this.client.user.id}>`) {
      if (!this.client.canSpeak(message.channel)) return;
      return message.channel.send(`My prefix for this server is \`${prefix}\`, but my mention also works as a prefix.`)
    }

    if ([`<@${this.client.user.id}>`, `<@!${this.client.user.id}>`].includes(message.content.split(" ")[0])) {
      prefix = message.content.split(" ")[0] + " "
      if (message.mentions.users.has(this.client.user.id)) message.mentions.users.delete(this.client.user.id)
    }
    
    if (!message.content.startsWith(prefix)) return;
    const [cmd, ...args] = message.content.slice(prefix.length).split(" ")
    const command = this.client.commands.resolve(cmd)
    
    if (command) {
      if (!this.client.canSpeak(message.channel)) return message.author.send("I cannot speak in that channel! Please get a moderator to change my permissions for that channel, or try using me in a different channel.").silence()
      if (command.settings.botPerms && !message.channel.hasPermission(command.settings.botPerms)) return message.channel.send("Sorry, but I am missing the permissions `" + command.settings.botPerms.join("`, `") + "` which I need for this command.").silence() // maybe parse the perms into strings for permission bits? (todo)
      
      if (command.settings.owner && !message.author.owner) message.channel.send("You need to be the owner to use this command.")
      if (command.settings.requiredPermissions && !message.member.hasPermission(command.settings.requiredPermissions)) return message.channel.send("You are missing the permissions `" + command.settings.requiredPermissions.join("`, `") + "` for this command.")
      
      if (command.cooldowns.has(message.author.id)) return command.sendCooldown(message.channel, message.author.id)
      if (command.disabled && !message.author.owner) {
        return message.channel.send(
          new Embed()
          .setTitle("Command Disabled")
          .setDescription("This command is currently disabled. " + (command.settings.disableMessage ? "The reason for that is: **" + command.settings.disableMessage + "**." : "It was probably disabled because something wasn't functioning properly, otherwise another reason.") + "\nPlease try again later, or **[join the support server](" + this.client.config.links.support + ")** for more info.")
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
          .setFooter("Failed to run " + this.client.config.prefix + command.help.name + ".")
          .setTimestamp()
        ).silence()
      })
    }
  }
}
