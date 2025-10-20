import {REACT_ELEMENT_TYPE} from './common.js'
function ReactElement(type, key, props, owner, debugStack, debugTask) {
  const refProp = props.ref;
  const ref = refProp !== undefined ? refProp : null;
   let element = {
      // This tag allows us to uniquely identify this as a React Element
      $$typeof: REACT_ELEMENT_TYPE,
      // Built-in properties that belong on the element
      type,
      key,
      ref,
      props,
  };
  return element;
}
function createElement(type, config, ...children) {
    const props = {}
    let key = null
    if (config) {
        Object.keys(config).forEach(name => {
            if (name === 'key') {
                key = config[name] + ''
            } else {
                props[name] = config[name]
            }
        })
    }
    if (children.length) {
        props.children = children.length === 1 ? children[0] : children
    }
    return ReactElement(type,key,props)
}
export {
    createElement
}