const { Collection } = require("discord.js")
const { readdirSync: readdir } = require("fs")

class CommandHandler extends Collection {
  constructor(client) {
    this.client = client
  }

  get aliases() {
    const aliases = new Collection()
    for (const command of this.values()) {
      for (const alias of command.aliases) aliases.set(alias, command.help.name)
    }
    return aliases
  }

  load(filter, reload) {
    const cmdFiles = filter instanceof Array ? filter.map(f => f + ".js") : readdir("./src/commands/");

    console.log(`[CLIENT] Loading a total of ${cmdFiles.length} commands.`);
    cmdFiles.forEach(f => {
      try {
        if (reload) delete require.cache[require.resolve(`../commands/${f}`)]
        const cmd = new (require(`../commands/${f}`))(this.client)
        this.set(cmd.help.name, cmd)
      } catch {
        console.error(`Couldn't load command: ${f}`)
      }
    })

    console.log(`[CLIENT] Loaded ${filter instanceof Array ? filter.length : this.size} commands and ${this.aliases.size} aliases`);

    return this
  }

  reload(cmd) {
    if (cmd == null) {
      this.clear()
      return this.load(null, true)
    }

    if (Array.isArray(cmd)) return cmd.filter(c => c).map(this.reload.bind(this))[0]

    let c = this.resolve(cmd)
    if (c) c.reload()
    else if (typeof cmd === "string") {
      try {
        this.load([cmd])
      } catch {}
    }

    return this
  }

  resolve(cmd) {
    return this.get(cmd) || this.get(this.aliases.get(cmd))
  }
}

module.exports = CommandHandler