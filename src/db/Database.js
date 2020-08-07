const SQLiteDB = require("better-sqlite3")
const { set, get, unset: remove } = require("lodash")
const Query = require("./Query")
const DB = new SQLiteDB(__dirname + "/db.sqlite") // a sqlite file in this directory (src/db/db.sqlite) - change if you wish
const { Collection } = require("discord.js")
const on_change = require("on-change")

const TableCache = {}

class Database {
  constructor({ table, cache, watching, onChange, options, path } = {}) {
    if (typeof path === "function") path = path(__dirname) // idk maybe you might be lazy
    this.db = typeof path === "string" ? new SQLiteDB(path) : DB
    
    this._tableName = this._table(table)
    
    this.caching = cache
    if (this.caching) this.cache = new Collection()
    
    this.watching = watching
    if (this.watching) {
      const change = (key, path, value) => this.set(`${key}${path ? `.${path}` : ""}`, value)
      
      if (typeof onChange !== "function") onChange = null
      this._onChange = onChange // suppose you want the raw version idk
      this.onChange = function(key, path, value, prev) {
        if (path) { // path is "" on some array methods
          const p = path.split(".")
          const [obj, prop] = [on_change.target(p.length > 1 ? get(this, p.slice(0, -1)) : this), p.last()]
          
          const desc = Object.getOwnPropertyDescriptor(obj, prop)
          if (!desc || desc.get || desc.set || desc.configurable !== true || desc.writable !== true) return;
          if (!desc.enumerable && prev === undefined) return; // newly defined via object.defineProperty
          if (!desc.enumerable) Object.defineProperty(obj, prop, { ...desc, enumerable: true })
        }
        
        if (onChange) onChange.bind(this)(key, path, value, prev)
        change(key, path, value)
      }
      if (options && typeof options === "object") this.onChangeOptions = options
    }
  }
  
  get Table() {
    return Table
  }
  
  get query() {
    return Query(this)
  }
  
  set(key, value, table) {
    table = this._table(table)
    
    if (key == null) throw new Error("No key was provided.")
    if (arguments.length === 1) throw new Error("No value was provided.")
    if (value === undefined) value = null
    key = String(key)
    
    let path;
    [key, ...path] = key.split(".")
    
    let data = this.get(key, table, undefined, true)
    if (data === undefined) {
      this.db.prepare(`INSERT INTO ${table} (key, value) VALUES (?, ?)`).run(key, "{}");
      data = JSON.parse(this.db.prepare(`SELECT * FROM ${table} WHERE key = (?)`).get(key).value)
    }
    
    if (path.length) {
      set(data, path.join("."), value)
      value = data
    }
    
    // check table
    //this.db.prepare(`CREATE TABLE IF NOT EXISTS ${table} (key TEXT, value TEXT)`).run()
    
    if (this.caching && !path.length && table === this._tableName) this._patch(key, value)
    this.db.prepare(`UPDATE ${table} SET value = (?) WHERE key = (?)`).run(JSON.stringify(value), key)
    //this.db.prepare(`INSERT OR REPLACE INTO ${table} (key, value) VALUES (?, ?);`).run(key, JSON.stringify(value));
    
    return value
  }
  
  get(key, table, setDefault, raw, force) {
    table = this._table(table)
    
    if (key == null) throw new Error("No key was provided.")
    key = String(key)
    
    let data = !force && this.caching ? this.cache.get(key) : undefined
    let path;
      [key, ...path] = key.split(".")
    if (data === undefined) {
      // check table
      //this.db.prepare(`CREATE TABLE IF NOT EXISTS ${table} (key TEXT, value TEXT)`).run()
      
      data = this.db.prepare(`SELECT * FROM ${table} WHERE key = (?);`).get(key)
      if (!data) return setDefault !== undefined ? this.set([key, ...path].join("."), setDefault, table) : undefined;
      if (data.json && (data.json.startsWith('"{') || data.json.startsWith('"[') || data.json.startsWith('"\\"'))) 
        try { data.json = JSON.parse(data.json) } catch {} // recieved a string of stringified data
      
      data = this._parse(key, data.value)
      
      if (this.caching && table === this._tableName) this._patch(key, data)
    }
    
    if (raw && data) data = on_change.target(data)
    
    return path.length ? get(data, path.join(".")) : data
  }
  
  fetch(key, table, setDefault, raw) {
    return this.get(key, table, setDefault, raw, true)
  }
  
  find(keyword, table) {
    if (typeof keyword === "function") return this.cache.find(keyword)
    
    table = this._table(table)
    
    if (keyword == null) throw new Error("No key was provided.")
    let obj = typeof keyword === "object"
    keyword = obj ? JSON.stringify(keyword).split("}", 1)[0].slice(1) : String(keyword)
    
    // check table
    //this.db.prepare(`CREATE TABLE IF NOT EXISTS ${table} (key TEXT, value TEXT)`).run()
    
    let path;
    [keyword, ...path] = obj ? [keyword] : keyword.split(".")
    
    let data = this.db.prepare(`SELECT * FROM ${table} WHERE value LIKE '%${keyword}%';`).get()
    if (!data) return null
    data.value = this._parse(data.key, data.value)
    
    if (this.caching && table === this._tableName) this._patch(data.key, data.value)
    
    return path.length ? get(data.value, path.join(".")) : data // { key: "", value: "" }
  }
  
  delete(key, table) {
    table = this._table(table)
    
    if (key == null) throw new Error("No key was provided.")
    key = String(key)
     
    let path;
    [key, ...path] = key.split(".")
    
    let old = this.get(key, table, undefined, true)
    if (old === undefined) return false;
    
    if (path.length && old && typeof old === "object") {
      remove(old, path.join("."))
      this.set(key, old, table)
      return true
    }
    
    // check table
    //this.db.prepare(`CREATE TABLE IF NOT EXISTS ${table} (key TEXT, value TEXT)`).run()
    
    this.db.prepare(`DELETE FROM ${table} WHERE key = (?)`).run(key)
    if (this.caching) this.cache.delete(key)
    return true
  }
  
  push(key, value, table) {
    if (key == null) throw new Error("No key was provided.")
    if (arguments.length === 1) throw new Error("No value was provided.")
    if (value === undefined) value = null
    key = String(key)
    
    let data = this.get(key, table, undefined, true)
    if (data !== undefined) {
      if (JSON.stringify(data) === "{}") data = []
      if (!Array.isArray(data)) throw new TypeError("The target is not an array.")
      data.push(value)
      return this.set(key, data, table)
    }
    
    return this.set(key, [value], table)
  }
  
  add(key, number, table) {
    if (isNaN(number) || number === Infinity) throw new TypeError("The data must be a number." + (number === Infinity ? " Recieved Infinity." : ""))
    
    let data = this.get(key, table) // no need for raw, it should be a number
    if (data === undefined) return this.set(key, number, table)
    if (isNaN(data)) throw new TypeError("The target is not a number.")
    
    this.set(key, data + number, table)
    return data + number
  }
  
  subtract(key, value, table) {
    return this.add(key, -value, table)
  }
  
  has(key, table, force) {
    table = this._table(table)
    
    if (key == null) throw new Error("No key was provided.")
    key = String(key)
    
    let data = !force && this.caching ? this.cache.get(key) : undefined
    let path;
      [key, ...path] = key.split(".")
    if (data === undefined) {
      // check table
      //this.db.prepare(`CREATE TABLE IF NOT EXISTS ${table} (key TEXT, value TEXT)`).run()
      
      data = this.db.prepare(`SELECT * FROM ${table} WHERE key = (?);`).get(key)
    }
    
    if (data === undefined) return false
    
    return path.length ? get(data, path.join(".")) !== undefined : true
  }
  
  all(cache = true, table) {
    table = this._table(table)
    
    //this.db.prepare(`CREATE TABLE IF NOT EXISTS ${table} (key TEXT, value TEXT)`).run()
    let rows = this.db.prepare(`SELECT * FROM ${table} WHERE key IS NOT NULL`).iterate()
    
    let data = []
    for (const row of rows) {
      let entry = {
        key: row.key,
        value: this._parse(row.key, row.value)
      }
      if (this.caching && cache && table === this._tableName) this.cache.set(entry.key, entry.value)
      data.push(entry)
    }
    
    return data
  }
  
  _table(t) {
    let table;
    if (typeof t === "string" && !t.includes(" ") && t.toLowerCase() !== "table") table = t
    else table = this._tableName || "db" 
    
    if (!(table in TableCache)) TableCache[table] = this.db.prepare(`CREATE TABLE IF NOT EXISTS ${table} (key TEXT, value TEXT)`).run()
    return table
  }
  
  _patch(key, data) {
    let c = this.cache.get(key)
    c = c ? on_change.target(c) : c
    let d = data ? on_change.target(data) : data
    if (c !== undefined && data === c) return // idk why it would be but sure
    
    if (c && typeof c === "object" && d && typeof d === "object") {
      let change = true
      try { change = JSON.stringify(d) !== JSON.stringify(c) } catch {}
        // --silently define the variables, so i wont trigger any "set"s on proxies-- nvm
      if (change) Object.defineProperties(
          Object.clear(c), Object.assign(...Object.entries(d).map(([k, value]) => ({
            [k]: { value, writable: true, configurable: true, enumerable: true }
          })))
        )
    }
    else this.cache.set(key, data)
  }
  
  _parse(key, data) {
    data = JSON.parse(data)
    if (this.watching && data && typeof data === "object") {
      const { onChange } = this
      data = on_change(data, function(...args) { onChange.bind(this, key)(...args) }, this.onChangeOptions)
    }
    return data
  }
}


class Table extends Database {
  constructor(table, cache, onChange, options, path) { // `options` is the onChange options*
    if (!table) throw new Error("You must specify a table.")
    super({ table, cache, watching: typeof onChange === "function" || onChange === true, onChange, options, path })
  }
}


module.exports = new Database()
