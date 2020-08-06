let client = null;

/**
 * Safely access fields in an object.
 * @param {Object} options Options for safe entering. Just have an obj/object property in this. 
 * @param  {...any} props Keys to iterate over.
 */
global.safeEnter = function (options = {}, ...props) {
  let obj = options.obj || options.object
  props = props.flat()

  if (!obj) return obj
  if (!props[0]) return obj

  mergeDefault(options, {
    returnLastValue: false,
    valueIsFunction: false,
    functionValue: undefined,
    defaultValue: undefined
  })

  let value = obj

  for (const i of props) {
    if (value[i] != null) value = value[i]
    else {
      options.returnLastValue ? undefined : value = null
      options.valueIsFunction ? value = () => options.functionValue : undefined
      options.defaultValue !== undefined ? value = options.defaultValue : undefined
      break;
    }
  }

  return value
}

/**
 * Merge fields in an object, replacing undefined fields with default values.
 * @param {Object} obj The object to merge.
 * @param {Object} def The values to merge to the object.
 * @returns {Object} The merged object.
 */
global.mergeDefault = function (obj = {}, def = {}) {
  if (!obj) obj = {}

  for (const i in def) {
    if (obj[i] === undefined) obj[i] = def[i]
    if (def[i] === Object(def[i])) obj[i] = mergeDefault(obj[i], def[i])
  }

  return obj
}

const tag = require("command-tags")
/**
 * @param {string|Options} string The string to parse tags from, or options.
 * @param {string} [prefix] The prefix words should have to be matched.
 * @param {...Tag|[...Tag]} tags The tags to parse.
 */
global.Tagify = function (string, prefix, ...tags) {
  if (typeof string === "object") {
    if (prefix) return tag(string, ...tags.concat(prefix))
    else return tag(string, ...tags)
  }

  return tag({ string, prefix }, ...tags)
}

/**
 * Shades a hex color. (-n for dark, +n for light)
 * @param {string} color The hex color to shade.
 * @param {number} percent The amount of light to apply.
 */
global.shadeColor = function (color, percent) {
  if (typeof percent !== "number" || isNaN(percent)) percent = 50
  color = typeof color === "string" ? color.replace("#", "") : color.toString(16)
  color = "00000".slice(color.length) + color

  let R = Math.round(parseInt(color.substring(0, 2), 16) * (100 + percent) / 100)
  let G = Math.round(parseInt(color.substring(2, 4), 16) * (100 + percent) / 100)
  let B = Math.round(parseInt(color.substring(4, 6), 16) * (100 + percent) / 100)

  R = (R < 255 ? R : 255).toString(16)
  G = (G < 255 ? G : 255).toString(16)
  B = (B < 255 ? B : 255).toString(16)

  let RR = R.length === 1 ? "0" + R : R
  let GG = G.length === 1 ? "0" + G : G
  let BB = B.length === 1 ? "0" + B : B

  if ([RR, GG, BB].includes("00") && percent > 0 && percent < 100) {
    let p0 = String(percent)[0]
    return `${RR}${GG}${BB}`.replace(/0/g, p0)
  }
  return RR + GG + BB
}

/**
 * Async setTimeout. You can invert the parameters to run like setTimeout
 * @param {number|Function} [ms=1000] The amount of time to wait.
 * @param {Function|number} [fn=null] The function to call after waiting.
 */
global.waitTimeout = function(ms = 1000, fn, ...args) {
  if (typeof fn === "number" && typeof ms === "function") [ms, fn] = [fn, ms]
  return new Promise(resolve => {
    setTimeout(typeof fn === "function" ? () => resolve(fn(...args)) : resolve, ms, ...args)
  })
}


Object.defineProperties(Object, {
  clear: {
    value: function(obj) {
      if (!obj || obj.constructor !== Object && obj.constructor !== Array) return obj

      if (obj.constructor === Array) {	
        obj.length = 0	
        return obj	
      }
      for (const i in obj) delete obj[i] // json stringifies only enumerable props
      return obj
    },
    writable: true,
    configurable: true
  }
})

Object.defineProperty(Number.prototype, Symbol.iterator, {
  value: function* () {
    if (!isFinite(this) || isNaN(this)) throw new TypeError(`${this} is not iterable`)

    const f = i => this > 0 ? i < this : i > this
    for (let i = 0; f(i); this > 0 ? i++ : i--) yield i;
  },
  writable: true,
  configurable: true
})

Object.defineProperty(Date.prototype, "format", {
  value: function(options) {
    if (!options) options = {}
    let style = "ios", date, seconds, hour12 = false
    if (typeof options === "string") style = options
    else if (typeof options === "object") ({style = "ios", date, seconds, hour12 = false} = options)
    
    const [weekday, month, day, hour, minute, second] = this.toLocaleString(undefined, {day: "numeric", weekday: "short", hour: "numeric", minute: "numeric", second: "numeric", hour12, timeZone: "Europe/London", month: "short"}).replace(/AM|PM/g, "").split(/, |:| /)
    if (typeof style !== "string") style = "ios"
    if (!["ios", "normal", "clock"].includes(style.toLowerCase())) {
      return style
        .replace(/DD/g, day)
        .replace(/\/?MM\/?/g, m => m.includes("/") ? m.replace("MM", this.getMonth() + 1) : month)
        .replace(/YY/g, this.getFullYear())
        .replace(/WD/g, weekday)
        .replace(/HH/g, hour)
        .replace(/mm/g, minute)
        .replace(/SS/g, second)
    }

    if (style === "ios") return `${hour}:${minute}${seconds ? ":" + second : ""} ${weekday} ${day} ${month}`
    if (style === "normal") return `${date ? `${weekday}, ${month} ${day}, ` : ""}${hour}${minute}${seconds ? ":" + second : ""}`
    return (seconds ? [hour, minute, second] : [hour, minute]).join(":")
  },
  writable: true,
  configurable: true
})

Object.defineProperty(process.hrtime, "format", {
  value: function (hrtime) {
    if (!(hrtime instanceof Array)) return ""
    return `${hrtime[0] > 0 ? `${hrtime[0]}s ` : ''}${hrtime[1] / 1000000}ms`
  },
  writable: true,
  configurable: true
})

const { words } = require("lodash")
Object.defineProperties(String.prototype, {
  stripIndents: {
    value: function(tabSize) {
      if (!tabSize || typeof tabSize !== "number" || tabSize < 1) return this.trim().replace(/^[\t ]+/gm, "")
      return this.trim().replace(new RegExp(`^[\\t]{0,${tabSize}}`, "gm"), "")
    },
    writable: true,
    configurable: true
  },
  toProperCase: {
    value: function(all = false, words = true) {
      return (words ? this.words() : this.split(" ")).map((str, i) => i && all || !i ? str[0].toUpperCase() + str.slice(1).toLowerCase() : str.toLowerCase()).join(" ")
    },
    writable: true,
    configurable: true
  },
  words: {
    value: function(pattern) { return words(this, pattern) },
    writable: true,
    configurable: true
  }
})

Object.defineProperties(Promise.prototype, {
  default: {
    value: function (val) {
      return this.catch(() => val).then(v => v == null ? val : v) // if a resolved promise returns undefined
    },
    writable: true,
    configurable: true
  },
  silence: {
    value: function (val) {
      // i actually shouldnt be disregarding all errors lol i should be trying to fix them
      return this.catch(err => console.error("Silenced Error:", err && err.stack || err) || val)
    },
    writable: true,
    configurable: true
  }
})

Object.defineProperties(Array.prototype, {
  first: {
    value: function (amount) {
      return !isNaN(amount) && amount > 0 ? this.slice(0, amount) : this[0]
    },
    writable: true,
    configurable: true
  },
  last: {
    value: function (amount) {
      return !isNaN(amount) && amount > 0 ? this.slice(this.length - amount) : this[this.length - 1]
    },
    writable: true,
    configurable: true
  },
  random: {
    value: function (times = 1) {
      if (times == 1) {
        return this[Math.floor(Math.random() * this.length)]
      } else {
        let returnArray = []
        for (var i = 0; i < times; i++) {
          returnArray.push(this[Math.floor(Math.random() * this.length)])
        }
        return returnArray
      }
    },
    writable: true,
    configurable: true
  },
  clone: {
    value: function () {
      return this.slice()
    },
    writable: true,
    configurable: true
  },
  trim: {
    value: function (values) {
      if (!(values instanceof Array)) values = [values]
      return this.filter(el => !values.includes(el))
    },
    writable: true,
    configurable: true
  },
  remove: {
    value: function (...values) {
      if (values.length > 1) {
        for (const val of values) this.remove(val)
        return this
      }

      const [val] = values
      if (this.includes(val)) {
        let i = this.length
        while (i--) if (Object.is(this[i], val)) this.splice(i, 1)
      }
      
      return this
    },
    writable: true,
    configurable: true
  },
  asyncMap: {
    value: function (func) {
      return Promise.all(this.map(func))
    },
    writable: true,
    configurable: true
  }
})

/**
 * Check if an string is an emoji.
 * @param {string} emoji The string to check.
 * @param {boolean} returnMatches Return the regex matches.
 * @returns {boolean|string[]}
 */
global.isEmoji = function (emoji = "", returnMatches = false) {
  if (!emoji) return false;
  if (emoji === "⛓") emoji = "⛓️" // two different chains
  if (["❣️", "❤️", "⛓️"].includes(emoji)) return returnMatches ? [emoji] : true

  let matches = emoji.match(/(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g)
  if (matches) {
    if (returnMatches) return matches
    if (matches.length > 1) return false
    if (matches[0].length !== emoji.length) return false
    return true
  }

  return false
}

/**
 * Get data from an emoji from a string.
 * @param {string} emoji The string to parse.
 * @param {emojis} emojis The emoji cache to use (not important now that i have my own client.emoji cache thing)
 * @returns {Object} The info
 */
global.parseEmoji = function (emoji = "", emojis = client.emojis) {
  let data = {
    emoji: null,

    get id() {
      return this.emoji ? this.emoji.id || this.emoji.name : null
    },
    get identifier() {
      return this.custom ? this.emoji.identifier : this.emoji ? this.emoji.name : null
    },
    get canUse() {
      return this.custom ? emojis.cache.has(this.id) : true
    },
    get custom() {
      return this.emoji && this.emoji.id
    },
    toString() {
      if (!this.emoji) return ""
      return this.emoji.hasOwnProperty("toString") ? this.emoji.toString() :
        this.custom ? `<${this.emoji.animated ? 'a' : ''}:${this.emoji.name}:${this.emoji.id}>` : this.emoji.name
    }
  }

  if (emoji && typeof emoji === "object") {
    if ("name" in emoji && "id" in emoji) {
      data.emoji = emoji
    } else return null
  } else if (typeof emoji !== "string") return null

  else if (!isNaN(emoji) && emojis.cache.has(emoji)) {
    emoji = data.emoji = emojis.cache.get(emoji)
  } else {
    let parsed = parseEmojiToObject(emoji)

    if (parsed && parsed.name) {
      if (!parsed.id) {
        let valid = isEmoji(parsed.name, true)
        if (!valid) return null
        parsed.name = valid[0]
      } else if (emojis.cache.has(parsed.id)) parsed = emojis.cache.get(parsed.id)

      emoji = data.emoji = parsed
    } else return null
  }

  if (!data.emoji) return null
  return data
}

global.isCustomEmoji = function (emoji = "", emojis = client.emojis) {
  if (emojis.cache.has(emoji)) return true;

  let parse = parseEmoji(emoji)
  if (!parse) return false
  if (emojis.cache.has(parse)) return true
  else return false
}

global.parseEmojiToObject = function (text = "") {
  if (text.includes('%')) text = decodeURIComponent(text)
  if (!text.includes(':')) return { animated: false, name: text, id: null }
  const m = text.match(/<?(a:)?(\w{2,32}):(\d{17,19})>?/)
  if (!m) return null;

  return {
    animated: Boolean(m[1]),
    name: m[2],
    id: m[3],

    get identifier() {
      return this.id ? `${this.animated ? "a:" : ""}${this.name}:${this.id}` : encodeURIComponent(this.name)
    }
  }
}

/**
 * Give a number significant digits.
 * @param {number} number The number to transform. e.g 3482
 * @param {number} digits The amount of significant digits the number should have. e.g 1
 * @returns {number} The number with digits amount of significant digits. e.g 3000
 */
Math.significant = (number, digits) => {
  if (isNaN(number)) throw new TypeError("No number was specified.")
  if (isNaN(digits)) throw new TypeError("Second parameter needs to be a number.")
  number = Number(number)
  digits = Number(digits)

  if (number.toString().includes(".") && number.toString().split(".")[1].length >= digits) return number.toFixed(digits)
  let times = number.toString().split(".")[0].length - digits
  return Math.round(number / (10 ** times)) * (10 ** times) || 0
}

/**
 * @param {Client} c The Starboard Client.
 */
function init(c) {
  client = c

  const routeBuilder = require("./APIRouter.js")
  Object.defineProperty(client.rest, "api", {
    get: function () {
      return routeBuilder(this)
    }, configurable: true
  })

  Object.defineProperty(client.actions.ChannelCreate, "handle", {
    value: function (data) { // if you need voice channels or the channelCreate event, delete this
      if (data.type === 2) return {} // voice channel, no thanks

      // i dont actually use the channel create event
      return { channel: this.client.channels.add(data) }
    },
    writable: true,
    configurable: true
  })

  return {
    mergeDefault,
    safeEnter,
    shadeColor,
    Tagify,
    isEmoji,
    isCustomEmoji,
    parseEmoji,
    parseEmojiToObject
  }
}


/*
Object.defineProperty(Object, "propery", {
  value: function() {},
  writable: true,
  configurable: true
})
*/

module.exports = init
