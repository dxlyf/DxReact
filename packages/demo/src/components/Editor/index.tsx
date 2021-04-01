import React, { useCallback, useState, useEffect, useRef } from 'react';
import BraftEditor from 'braft-editor';
import 'braft-editor/dist/index.css';

const Editor = React.forwardRef((props: any, ref) => {
  let { value: propValue, onChange, ...restProps } = props;
  let [value, setValue] = useState(null);
  let currentValue = propValue !== undefined ? propValue : value;
  let [editorState, setEditorState] = useState(() =>
    BraftEditor.createEditorState(currentValue),
  );
  const onChangeHandle = useCallback((editorState) => {
    setEditorState(editorState);
    const htmlContent = editorState.toHTML();
    setValue(htmlContent);
    onChange(htmlContent);
  }, []);
  useEffect(() => {
    if (currentValue && currentValue !== value) {
      setEditorState(BraftEditor.createEditorState(currentValue));
    }
  }, [currentValue]);

  return (
    <BraftEditor value={editorState} onChange={onChangeHandle} {...restProps} />
  );
});
export default Editor;
