const { Collection } = require("discord.js")
const { readdirSync: readdir } = require("fs")
const { Embed } = require("../classes")

class EventHandler extends Collection {
  constructor(client) {
    super()
    this.client = client
  }

  load(filter, reload) {
    const evFiles = filter instanceof Array ? filter.map(f => f + ".js") : readdir("./src/events/");

    evFiles.forEach(e => {
      let event;
      try {
        if (reload) delete require.cache[require.resolve(`../events/${e}`)]
        event = new (require(`../events/${e}`))(this.client)
        if (event.name === "event") console.error("You forgot to name one of your events! -", event.name = e.split(".")[0])
        this.set(event.name, event)
      } catch(err) {
        if (reload) throw err
        return console.error(`Couldn't load event: ${e}, Error:`, err);
      }

      if (this.client._events[event.name] && !(this.client._events[event.name] instanceof Array)) this.client.off(event.name, this.client._events[event.name]);

      (event.emitter || this.client).on(event.name, async (...args) => {
        args = await event.fetchPartials(...args).default(null)
        if (!args || !event.shouldRun(...args)) return;

        if (event.reloaded) {
          event = new (require(`../events/${e}`))(this.client)
          event.load()
          this.set(event.name, event)
        }

        return await event.run(...args).catch(err => {
          if (++event.errors > 25) return this.client.owner.send("Something is wrong with **" + event.name + "**, so I disabled it.").then(() => event.disable())

          let info = event.getData(...args)
          if (!info) return; // debug events, they dont have any info, AND i dont want 50 million dms smh

          this.client.owner.send(
            new Embed()
              .setTitle("Error")
              .setDescription("```js\n" + err.stack + "\n```")
              .setColor(this.client.colors.error)
              .setTimestamp()
              .addField("Event", event.name)
              .addField("User", info.user && info.user.id ? "**Name**: " + info.user.tag + "\n**ID**: " + info.user.id : "Unknown")
              .addField("Guild", info.guild && info.guild.id ? "**Name**: " + info.guild.name + "\n**ID**: " + info.guild.id : "Unknown")
              .addField("Channel", info.channel && info.channel.id ? "**Name**: " + info.channel.name + "\n**ID**: " + info.channel.id : "Unknown")
              .addField("Reaction", info.reaction && info.reaction.emoji ? "**Name**: " + info.reaction.emoji.name + "\n**ID**: " + (info.reaction.emoji.id || "None") : "None")
              .addField("Data", "**Code**: " + (err.code || "None") + "\n**Path**: " + (err.method ? err.method.toUpperCase() + " " : "") + (err.path || "None"))
          )
        })
      })
    })

    if (!reload) console.log("[EVENT] => Loaded a total of " + (filter instanceof Array ? filter.length : this.size) + " events.")

    return this
  }

  reload(ev, throws, throwev) {
    if (ev == null) {
      this.clear()
      ["Toggle", "Event"].forEach(i => delete require.cache[require.resolve(`../classes/${i}.js`)])
      return this.load(null, true)
    }

    if (Array.isArray(ev)) return ev.filter(e => e).map(e => this.reload(e, throws, throwev))[0]

    const e = this.resolve(ev)
    if (e) e.reload()
    else if (typeof ev === "string") {
      try {
        this.load([ev], true)
      } catch(e) { if (throws) throw throwev ? [ev, e] : e }
    }

    return this
  }

  resolve(e) {
    if (typeof e === "string") e = e.toLowerCase()
    return this.find(e => e.name === e)
  }

  get errors() {
    return this.reduce((prev, ev) => ev.errors + prev, 0)
  }

  clean() {
    return this.each(e => e.errors = 0)
  }
}

module.exports = EventHandler