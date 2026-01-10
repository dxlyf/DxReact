
// an immutable object with a single mutable value
export function createRef() {
  const refObject = {
    current: null,
  };

  return refObject;
}
