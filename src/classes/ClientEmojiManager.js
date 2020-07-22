const { GuildEmoji, ReactionEmoji, Collection, GuildEmojiManager } = require("discord.js")

class ClientEmojiManager {
  constructor(client) {
    Object.defineProperty(this, "client", { value: client })
  }
  
  get cache() { return this }
  
  get guilds() {
    return (function*() {
      for (const guild of this.client.guilds.cache.values()) if (guild.available) yield guild;
    }).bind(this)()
  }
  
  has(id, returnEmoji = false) {
    for (const g of this.guilds) if (g.emojis.cache.has(id)) return returnEmoji ? g.emojis.cache.get(id) : true
    
    return false
  }
  
  get(emoji) {
    if (emoji && emoji.id) emoji = emoji.id
    return this.has(emoji, true)
  }
  
  each(fn, thisArg) {
    if (typeof thisArg !== "undefined") fn = fn.bind(thisArg)
    for (const [id, emoji] of this) fn(emoji, id, this)
    return this
  }
  
  filter(fn, thisArg) {
    if (typeof thisArg !== "undefined") fn = fn.bind(thisArg)
    const results = new Collection()

    for (const [id, emoji] of this) if (fn(emoji, id, this)) results.set(id, emoji)

    return results
  }
  
  random(amount = 0) {
    return this.array().random(amount)
  }
  
  array() {
    return [...this.values()]
  }
  
  load(amount = -1) {
    let added = 0
    
    const emojis = new GuildEmojiManager({ client: this.client })
    if (amount === 0) return emojis
    
    for (const [id, emoji] of this) {
      emojis.cache.set(id, emoji)
      if (emojis.cache.size >= amount) break;
    }
    
    return emojis
  }
  
  resolve(emoji) {
    if (emoji instanceof GuildEmoji || emoji instanceof ReactionEmoji) return emoji
    if (typeof emoji === 'string') return this.get(emoji) || null
    return null
  }
  
  resolveIdentifier(emoji) {
    const emojiResolvable = this.resolve(emoji)
    if (emojiResolvable) return emojiResolvable.identifier
    if (typeof emoji === 'string') {
      if (!emoji.includes('%')) return encodeURIComponent(emoji)
      else return emoji
    }
    return null
  }
  
  resolveID(emoji) {
    if (emoji instanceof GuildEmoji || emoji instanceof ReactionEmoji) return emoji.id;
    if (typeof emoji === 'string') return emoji;
    return null;
  }
  
  get size() {
    let num = 0
    for (const guild of this.guilds) num += guild.emojis.cache.size
    return num
  }
  
  *[Symbol.iterator]() {
    for (const guild of this.guilds) for (const [id, emoji] of guild.emojis.cache) yield [id, emoji]
  }
  
  entries() {
    return this[Symbol.iterator]()
  }
  
  *keys() {
    for (const emoji of this) yield emoji[0]
  }
  
  *values() {
    for (const emoji of this) yield emoji[1]
  }
}


// take functions from collection class
const props = [
  "every",
  "find",
  "first",
  "last",
  "map",
  "reduce",
  "tap" // i dont think i'll use this but 
]

for (const prop of props) Object.defineProperty(ClientEmojiManager.prototype, prop, {
    value: Collection.prototype[prop],
    writable: true,
    configurable: true
  })

module.exports = ClientEmojiManager
