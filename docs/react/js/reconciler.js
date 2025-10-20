


export function updateContainer(
  element,
  container,
  parentComponent,
  callback,
) {
  const current = container.current;
  const lane = requestUpdateLane(current);
  updateContainerImpl(
    current,
    lane,
    element,
    container,
    parentComponent,
    callback,
  );
  return lane;
}

export {
    updateContainer
}