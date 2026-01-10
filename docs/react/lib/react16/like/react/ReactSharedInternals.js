

import ReactCurrentDispatcher from './ReactCurrentDispatcher.js';
import ReactCurrentOwner from './ReactCurrentOwner.js';
const assign = Object.assign;
const ReactSharedInternals = {
  ReactCurrentDispatcher,
  ReactCurrentOwner,
  // Used by renderers to avoid bundling object-assign twice in UMD bundles:
  assign,
};

export default ReactSharedInternals;
