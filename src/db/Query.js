const other = [
  "toString",
  "valueOf",
  "constructor", 
  "inspect",
  Symbol.toPrimitive
]

const blank = () => {}
module.exports = function Query(db) {
  if (!db) db = require("./Database")
  
  const values = []
  const handler = {
    get(_, name) {
      if (other.includes(name)) return () => db
			
      if (name === "run" || name == "done") return () => values
      if (typeof db[name] === "function") return (...args) => {
        values.push(db[name](...args))
        return p(handler)
      }
      
      return p(handler)
    },
    apply(_t, _, args) {
      return p(handler)
    }
  }
  return p(handler)
}

function p(h){
  return new Proxy(blank, h)
}

module.exports.p = p
