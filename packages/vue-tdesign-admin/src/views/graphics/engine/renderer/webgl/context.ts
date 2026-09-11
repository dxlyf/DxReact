
import {BindFrameBuffer} from './state'

export class GLContext {
  gl: WebGL2RenderingContext;
  bindFramebuffer: BindFrameBuffer;
  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.bindFramebuffer = new BindFrameBuffer(this);
  }

}
