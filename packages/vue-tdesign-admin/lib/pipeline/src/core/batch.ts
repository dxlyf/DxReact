/**
 * 自动批处理模块。
 *
 * 目标：把"状态完全相同、顶点区间首尾相接"的连续绘制合并成一次原生调用，
 * 而不改变绘制结果。合并的前提是完整的、可判定的，不做任何猜测：
 *
 *   1. 同一管线、同一 VAO、同一组 bind group、同一图元拓扑
 *   2. 非索引绘制（索引绘制需要索引缓冲内偏移连续，语义上更易错，不做合并）
 *   3. 实例下标区间相同（firstInstance 一致）
 *   4. 顶点区间首尾相接：draw[i].firstVertex === draw[i-1].firstVertex + draw[i-1].vertexCount
 *
 * 任何可能破坏前提的操作（换管线 / 换 VAO / 换绑定组 / 改 uniform）都必须先提交
 * 未决批次。RenderPass 负责在正确的时机调用 flush()。
 *
 * 两个适配层共用这份判定逻辑，因此 WebGL 与 WebGPU 的批处理行为完全一致。
 */
import { isSameHandle, type Handle } from './handle.js';
import { PrimitiveTopology } from './types.js';

/** 决定两次绘制能否合并的全部状态。 */
export interface BatchState {
  pipeline: Handle;
  vertexArray: Handle;
  /** 各 bind group 槽位的绑定组标识（未绑定的槽位为 null） */
  groups: readonly (Handle | null)[];
  /** 索引缓冲标识；null 表示非索引绘制 */
  index: Handle | null;
  topology: PrimitiveTopology;
}

/** 一次绘制的区间描述。 */
export interface BatchDraw {
  firstVertex: number;
  vertexCount: number;
  firstInstance: number;
  instanceCount: number;
}

export interface BatchSubmit {
  state: BatchState;
  draw: BatchDraw;
  /** 该批次合并了多少次原始绘制（1 表示没有合并） */
  merged: number;
}

function sameHandleOrNull(a: Handle | null, b: Handle | null): boolean {
  if (a === null || b === null) return a === b;
  return isSameHandle(a, b);
}

function sameGroups(a: readonly (Handle | null)[], b: readonly (Handle | null)[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!sameHandleOrNull(a[i], b[i])) return false;
  }
  return true;
}

/**
 * 批次累加器。
 *
 * 用法（在 RenderPass.draw 中）：
 *   if (!batcher.tryMerge(state, draw)) {
 *     batcher.flush(emit);        // 先提交上一个批次
 *     batcher.start(state, draw); // 再开启新批次
 *   }
 */
export class DrawBatcher {
  /** 关闭后每次 draw 都直接提交，便于与原生行为对照 */
  enabled: boolean;
  private state: BatchState | null = null;
  private draw: BatchDraw | null = null;
  private merged = 0;

  constructor(enabled = true) {
    this.enabled = enabled;
  }

  get pending(): boolean {
    return this.draw !== null;
  }

  /** 当前是否存在与给定状态匹配的未决批次。 */
  matches(state: BatchState): boolean {
    if (!this.enabled || !this.state || !this.draw) return false;
    return sameState(this.state, state);
  }

  /**
   * 尝试把一次绘制并入未决批次。
   * 返回 true 表示已并入（调用方不应再产生原生调用）。
   */
  tryMerge(state: BatchState, draw: BatchDraw): boolean {
    if (!this.enabled || !this.state || !this.draw) return false;
    if (!sameState(this.state, state)) return false;
    if (state.index !== null) return false;
    if (draw.firstInstance !== this.draw.firstInstance) return false;
    // 只有顶点区间首尾相接才能用一次 draw 覆盖两次的效果
    if (draw.firstVertex !== this.draw.firstVertex + this.draw.vertexCount) return false;
    this.draw.vertexCount += draw.vertexCount;
    this.merged++;
    return true;
  }

  /** 开启一个新批次（调用前应确保已 flush）。 */
  start(state: BatchState, draw: BatchDraw): void {
    this.state = state;
    this.draw = { ...draw };
    this.merged = 1;
  }

  /** 提交未决批次。emit 只会被调用一次（若存在未决批次）。 */
  flush(emit: (submit: BatchSubmit) => void): void {
    if (!this.state || !this.draw) return;
    const submit: BatchSubmit = { state: this.state, draw: this.draw, merged: this.merged };
    this.state = null;
    this.draw = null;
    this.merged = 0;
    emit(submit);
  }

  reset(): void {
    this.state = null;
    this.draw = null;
    this.merged = 0;
  }
}

function sameState(a: BatchState, b: BatchState): boolean {
  return (
    isSameHandle(a.pipeline, b.pipeline) &&
    isSameHandle(a.vertexArray, b.vertexArray) &&
    sameHandleOrNull(a.index, b.index) &&
    a.topology === b.topology &&
    sameGroups(a.groups, b.groups)
  );
}
