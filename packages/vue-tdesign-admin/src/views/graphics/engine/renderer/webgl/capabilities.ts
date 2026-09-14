

export function getCapabilities(gl: WebGL2RenderingContext) {
    return {
        maxColorAttachments: gl.getParameter(gl.MAX_COLOR_ATTACHMENTS),
        maxVertexUniformBlocks: gl.getParameter(gl.MAX_VERTEX_UNIFORM_BLOCKS),
        maxFragmentUniformBlocks: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_BLOCKS),
        maxVertexUniformComponents: gl.getParameter(gl.MAX_VERTEX_UNIFORM_COMPONENTS),
        maxFragmentUniformComponents: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_COMPONENTS),
        maxSamples: gl.getParameter(gl.MAX_SAMPLES),
        maxUniformBufferBindings: gl.getParameter(gl.MAX_UNIFORM_BUFFER_BINDINGS),
        maxVertexAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    }
}