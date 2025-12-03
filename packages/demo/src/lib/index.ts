import { h, createTextVNode, cloneElement } from './vdom';
import { render } from './dom-renderer';
import { scheduleRootUpdate } from './scheduler';
import { Component } from './components';
import { useState, useEffect, useLayoutEffect, useContext, useReducer, useRef, useCallback, useMemo, useImperativeHandle, useDebugValue } from './hooks';

// Fragment常量，用于JSX片段
const Fragment = Symbol('Fragment');

// 导出框架核心API
export {
  // 虚拟DOM相关
  h,
  createTextVNode,
  cloneElement,
  Fragment,
  
  // 渲染相关
  render,
  
  // 组件相关
  Component,
  
  // Hooks相关
  useState,
  useEffect,
  useLayoutEffect,
  useContext,
  useReducer,
  useRef,
  useCallback,
  useMemo,
  useImperativeHandle,
  useDebugValue,
  
  // 内部API（通常不直接使用）
  scheduleRootUpdate,
};

// 版本信息
export const version = '1.0.0';
