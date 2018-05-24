#version 300 es
precision mediump float;

in vec4 v_color;
out vec4 outColor;

void main() {
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    float r = dot(cxy, cxy);
    float delta = fwidth(r);
    float max = 1.0 + delta;
    float alpha = 1.0 - smoothstep(1.0 - delta, max, r);
    outColor = v_color * alpha;
}
