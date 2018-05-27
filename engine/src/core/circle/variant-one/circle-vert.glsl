#version 300 es
precision mediump float;

in vec2 a_position;
uniform mat4 u_projectionModelMatrix;

void main() {
  gl_Position = u_projectionModelMatrix * vec4(a_position, 0.0, 1.0);
}
