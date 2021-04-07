/**
 * modal状态钩子
 * @author fanyonglong
 */
import React, { useCallback, useMemo, useState } from 'react';
import { ModalProps } from 'antd';
export type ModalStateType = { visible: boolean; title: any; dataItem: any };
type ModalType = [
  { props: any; state: ModalStateType },
  {
    show: (title?: any, dataItem?: any) => void;
    close: (e?: any) => void;
    setStateOptions: <S extends any>(
      options: ModalProps | ((prevState: S) => S),
    ) => void;
    setState: (options: any) => void;
  },
];
type useModalProps = {
  stateReducer?: (state: ModalStateType) => any;
} & ModalProps;
export const useModal = (options: useModalProps): ModalType => {
  let { onCancel, stateReducer, ...restOptions } = options;
  let [state, setState] = useState<any>(() => {
    return {
      visible: false,
      title: '',
      dataItem: null,
    };
  });
  let [stateOptions, setStateOptions] = useState({});

  let setStateOptionsHandle = useCallback((state: any) => {
    setStateOptions((prevState) => ({ ...prevState, ...state }));
  }, []);
  let setInnerState = useCallback(
    (state: any) => {
      let newStateOptions = stateReducer ? stateReducer(state) : null;
      if (newStateOptions) {
        setStateOptionsHandle(newStateOptions);
      }
      setState(state);
    },
    [stateReducer, setStateOptionsHandle],
  );
  let showModal = useCallback(
    (title = '', dataItem = null) => {
      setInnerState({
        title: title,
        dataItem: dataItem,
        visible: true,
      });
    },
    [setInnerState],
  );
  let onCancelHandle = useCallback(
    (e) => {
      setInnerState({
        title: '',
        visible: false,
        dataItem: null,
      });
      if (onCancel) {
        onCancel(e);
      }
    },
    [onCancel, setInnerState],
  );
  let modalProps = {
    visible: state.visible,
    title: state.title,
    onCancel: onCancelHandle,
    ...restOptions,
    ...stateOptions,
  };
  return [
    { props: modalProps, state: state },
    {
      show: showModal,
      close: onCancelHandle,
      setState,
      setStateOptions: setStateOptionsHandle,
    },
  ];
};
