#version 300 es
precision mediump float;

in vec2 a_position;
uniform mat3 u_projectionMatrix;

void main() {
  gl_Position = vec4(u_projectionMatrix * vec3(a_position, 0.0), 1.0);
}
