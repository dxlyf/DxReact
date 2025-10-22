
function memoize<R=any>(func:(...args:any[])=>R, resolver?:(...args:any[])=>string) {

  const memoized = function(this:any,...args:any[]) {
    var 
        key = resolver ? resolver.apply(this, args) : args[0],
        cache = memoized.cache;

    if (cache.has(key)) {
      return cache.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result);
    return result;
  };
  memoized.cache = new memoize.Cache();
  return memoized;
}

// Assign cache to `_.memoize`.
memoize.Cache = Map;


export default memoize
