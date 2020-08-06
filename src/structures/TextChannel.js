module.exports = ({ Structures, Base, Channel, GuildChannel, Constants: { ChannelTypes }, MessageManager, PermissionOverwrites, Collection }, { bypass, applyToClass }) => {
  Object.defineProperty(GuildChannel.prototype, "hasPermission", {
     value: function hasPermission(permission, user) {
       return this.client.hasPermission(this, permission, user)
     },
     writable: true,
     configurable: true
   })
  
  Structures.extend("TextChannel", TChannel => {
    class TextChannel extends Base {
      constructor(guild, data) {
        super(guild.client);
        // Channel
        this.type = (Object.keys(ChannelTypes)[data.type] || "unknown").toLowerCase()
        
        // GuildChannel
        this.guild = guild
        
        // TextChannel
        this.messages = new MessageManager(this);
        
        if (data) this._patch(data);
      }
      
      _patch(data) {
        // Channel
        this.id = data.id;
        
        // GuildChannel
        this.name = data.name;
        this.permissionOverwrites = new Collection();
        if (data.permission_overwrites) {
          for (const overwrite of data.permission_overwrites) {
            this.permissionOverwrites.set(overwrite.id, new PermissionOverwrites(this, overwrite));
          }
        }
        
        // TextChannel
        this.nsfw = data.nsfw;
        if (data.messages) for (const message of data.messages) this.messages.add(message);
      }
      
      
      startTyping(seconds) {
        if (typeof seconds !== "number" || isNaN(seconds)) seconds = 1
        if (this.client.user._typing.has(this.id)) {
          const entry = this.client.user._typing.get(this.id)
          entry.seconds = seconds * 9 || entry.seconds + 9
          return Promise.resolve(entry.seconds)
        }
        
        const endpoint = this.client.api.channels(this.id).typing;
        const entry = {
          seconds: seconds * 9 || Infinity,
          interval: this.client.setInterval(() => {
            if (entry.seconds !== Infinity && (entry.seconds -= 9) <= 0) return this.client.clearInterval(entry.interval)
            endpoint.post().catch(error => {
              this.client.clearInterval(entry.interval);
              this.client.user._typing.delete(this.id);
              throw error
            });
          }, 9000)
        }
        
        this.client.user._typing.set(this.id, entry)
        
        return endpoint.post().then(() => entry).catch(error => {
          this.client.clearInterval(entry.interval)
          this.client.user._typing.delete(this.id)
          throw error;
        })
      }
      
      stopTyping() {
        if (this.client.user._typing.has(this.id)) {
          const entry = this.client.user._typing.get(this.id);
          this.client.clearInterval(entry.interval);
          this.client.user._typing.delete(this.id);
        }
      }
      
      toString() {
        return `<#${this.id}>`
      }
    }
    
    applyToClass(TextChannel, TChannel, [
      "awaitMessages",
      "bulkDelete",
      "createMessageCollector",
      "send",
      "typing"
    ])
    applyToClass(TextChannel, GuildChannel, [
      "equals",
      "hasPermission",
      "overwritesFor",
      "permissionsFor",
      "memberPermissions",
    ])
    
    bypass(TChannel, TextChannel)
    return TextChannel
  })
}
