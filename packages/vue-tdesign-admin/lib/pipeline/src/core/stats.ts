/**
 * 调用统计。
 *
 * 脏标记系统省下的每一次调用都会记在这里，便于量化"封装带来的收益"，
 * 也便于发现状态设置热点。所有计数都是普通数字自增，开销可忽略。
 */
export interface DeviceStatsSnapshot {
  /** 实际提交的绘制调用（含批处理合并后的） */
  drawCalls: number;
  instancedDrawCalls: number;
  /** 被批处理合并掉的绘制数 */
  mergedDraws: number;
  pipelineSwitches: number;
  bindGroupWrites: number;
  /** 缓冲上传次数 / 字节数 */
  bufferUploads: number;
  bufferUploadBytes: number;
  textureUploads: number;
  /** uniform 赋值次数 / 被跳过的冗余赋值次数 */
  uniformSets: number;
  uniformSkips: number;
  /** 请求的状态变更 / 因脏标记命中而跳过的状态变更 */
  stateChanges: number;
  stateSkips: number;
  /** 原生 API 调用总数 / 被跳过的原生调用数 */
  nativeCalls: number;
  nativeCallsSkipped: number;
}

export class DeviceStats {
  drawCalls = 0;
  instancedDrawCalls = 0;
  mergedDraws = 0;
  pipelineSwitches = 0;
  bindGroupWrites = 0;
  bufferUploads = 0;
  bufferUploadBytes = 0;
  textureUploads = 0;
  uniformSets = 0;
  uniformSkips = 0;
  stateChanges = 0;
  stateSkips = 0;
  nativeCalls = 0;
  nativeCallsSkipped = 0;

  /** 按状态名统计被跳过的次数，用于精确定位"哪个状态设置最贵" */
  readonly skippedByName = new Map<string, number>();

  reset(): void {
    this.drawCalls = 0;
    this.instancedDrawCalls = 0;
    this.mergedDraws = 0;
    this.pipelineSwitches = 0;
    this.bindGroupWrites = 0;
    this.bufferUploads = 0;
    this.bufferUploadBytes = 0;
    this.textureUploads = 0;
    this.uniformSets = 0;
    this.uniformSkips = 0;
    this.stateChanges = 0;
    this.stateSkips = 0;
    this.nativeCalls = 0;
    this.nativeCallsSkipped = 0;
    this.skippedByName.clear();
  }

  snapshot(): DeviceStatsSnapshot {
    return {
      drawCalls: this.drawCalls,
      instancedDrawCalls: this.instancedDrawCalls,
      mergedDraws: this.mergedDraws,
      pipelineSwitches: this.pipelineSwitches,
      bindGroupWrites: this.bindGroupWrites,
      bufferUploads: this.bufferUploads,
      bufferUploadBytes: this.bufferUploadBytes,
      textureUploads: this.textureUploads,
      uniformSets: this.uniformSets,
      uniformSkips: this.uniformSkips,
      stateChanges: this.stateChanges,
      stateSkips: this.stateSkips,
      nativeCalls: this.nativeCalls,
      nativeCallsSkipped: this.nativeCallsSkipped,
    };
  }

  /** 记录一次被跳过的状态设置。 */
  skipState(name: string): void {
    this.stateSkips++;
    this.nativeCallsSkipped++;
    this.skippedByName.set(name, (this.skippedByName.get(name) ?? 0) + 1);
  }

  format(): string {
    const s = this.snapshot();
    const skipRate = s.nativeCalls + s.nativeCallsSkipped === 0
      ? '0%'
      : `${((s.nativeCallsSkipped / (s.nativeCalls + s.nativeCallsSkipped)) * 100).toFixed(1)}%`;
    return [
      `draws=${s.drawCalls} (instanced=${s.instancedDrawCalls}, merged=${s.mergedDraws})`,
      `pipelineSwitches=${s.pipelineSwitches} stateSkips=${s.stateSkips}`,
      `uniforms=${s.uniformSets} (skipped=${s.uniformSkips})`,
      `uploads=${s.bufferUploads}/${s.bufferUploadBytes}B texUploads=${s.textureUploads}`,
      `nativeCalls=${s.nativeCalls} skipped=${s.nativeCallsSkipped} (${skipRate})`,
    ].join('\n');
  }
}
