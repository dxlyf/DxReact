
import {REACT_LAZY_TYPE} from '../shared/ReactSymbols.js';

export function lazy(ctor) {
  let lazyType = {
    $$typeof: REACT_LAZY_TYPE,
    _ctor: ctor,
    // React uses these fields to store the result.
    _status: -1,
    _result: null,
  };

  return lazyType;
}
