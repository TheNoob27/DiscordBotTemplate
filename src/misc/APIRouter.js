/*
 - THIS FILE IS MADE SO THAT ERRORS   -
 - PRODUCED FROM API REQUESTS WILL    -
 - SHOW VALID AND USEFUL INFORMATION. -
*/


const noop = () => {}; // eslint-disable-line no-empty-function
const methods = ['get', 'post', 'delete', 'patch', 'put'];
const reflectors = [
  'toString',
  'valueOf',
  'inspect',
  'constructor',
  Symbol.toPrimitive,
  Symbol.for('nodejs.util.inspect.custom'),
];

function buildRoute(manager) {
  const route = [''];
  const handler = {
    get(target, name) {
      if (reflectors.includes(name)) return () => route.join('/');
      if (methods.includes(name)) {
        // Preserve async stack
        let stackTrace = null;
        if (Error.captureStackTrace) {
          stackTrace = {};
          Error.captureStackTrace(stackTrace, this.get);
        }
        const routeBucket = [];
        for (let i = 0; i < route.length; i++) {
          // Reactions routes and sub-routes all share the same bucket
          if (route[i - 1] === 'reactions') break;
          // Literal IDs should only be taken account if they are the Major ID (the Channel/Guild ID)
          if (/\d{16,19}/g.test(route[i]) && !/channels|guilds/.test(route[i - 1])) routeBucket.push(':id');
          // All other parts of the route should be considered as part of the bucket identifier
          else routeBucket.push(route[i]);
        }
        return options =>
          //(++manager.client.restRequests || true) && // increment rest request counter
          manager.request(
            name,
            route.join('/'),
            Object.assign(
              {
                versioned: manager.versioned,
                route: routeBucket.join('/'),
              },
              options,
            )
        ).catch(error => {
           if (stackTrace && (error instanceof Error)) {
             stackTrace.name = error.name;
             stackTrace.message = error.message;
             error.stack = stackTrace.stack;
           }
           throw error;
         })
      }
      route.push(name);
      return new Proxy(noop, handler);
    },
    apply(target, _, args) {
      route.push(...args.filter(x => x != null)); // eslint-disable-line eqeqeq
      return new Proxy(noop, handler);
    },
  };
  return new Proxy(noop, handler);
}

module.exports = buildRoute;
