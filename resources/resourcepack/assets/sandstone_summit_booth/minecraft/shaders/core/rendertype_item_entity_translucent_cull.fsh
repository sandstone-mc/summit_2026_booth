#version 330

#moj_import <minecraft:fog.glsl>
#moj_import <minecraft:dynamictransforms.glsl>
#moj_import <minecraft:globals.glsl>

uniform sampler2D Sampler0;

in float sphericalVertexDistance;
in float cylindricalVertexDistance;
in vec4 vertexColor;
in vec2 texCoord0;
in vec2 texCoord1;
in vec3 vertexPosition;
in float facingCamera;

out vec4 fragColor;

#define STAR_ITERATIONS 17
#define STAR_FORMUPARAM 0.53
#define STAR_VOLSTEPS 15
#define STAR_STEPSIZE 0.13
#define STAR_TILE 0.850
#define STAR_BRIGHTNESS 0.0015
#define STAR_DARKMATTER 0.400
#define STAR_DISTFADING 0.730
#define STAR_SATURATION 0.750

vec3 starNest(vec3 dir) {
    float time = GameTime * 20.0 + 0.25;
    float a1 = 0.5, a2 = 0.8;
    mat2 rot1 = mat2(cos(a1), sin(a1), -sin(a1), cos(a1));
    mat2 rot2 = mat2(cos(a2), sin(a2), -sin(a2), cos(a2));
    dir.xz *= rot1;
    dir.xy *= rot2;

    vec3 from = vec3(1.0, 0.5, 0.5) + vec3(time * 2.0, time, -2.0);
    from.xz *= rot1;
    from.xy *= rot2;

    float s = 0.1, fade = 1.0;
    vec3 v = vec3(0.0);
    for (int r = 0; r < STAR_VOLSTEPS; r++) {
        vec3 p = from + s * dir * 0.5;
        p = abs(vec3(STAR_TILE) - mod(p, vec3(STAR_TILE * 2.0)));
        float pa, a = pa = 0.0;
        for (int i = 0; i < STAR_ITERATIONS; i++) {
            p = abs(p) / dot(p, p) - STAR_FORMUPARAM;
            a += abs(length(p) - pa);
            pa = length(p);
        }
        float dm = max(0.0, STAR_DARKMATTER - a * a * 0.001);
        a *= a * a;
        if (r > 6) fade *= 1.0 - dm;
        v += fade;
        v += vec3(s, s * s, s * s * s * s) * a * STAR_BRIGHTNESS * fade;
        fade *= STAR_DISTFADING;
        s += STAR_STEPSIZE;
    }
    v = mix(vec3(length(v)), v, STAR_SATURATION);
    v *= vec3(0.8, 0.5, 0.9);
    return clamp(v * 0.01, 0.0, 1.0);
}

float caveHash(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
}

vec2 caveVoronoi(vec3 p) {
    vec3 b = floor(p);
    vec3 f = fract(p);
    float dMin = 8.0;
    float dMin2 = 8.0;
    for (int x = -1; x <= 1; x++)
    for (int y = -1; y <= 1; y++)
    for (int z = -1; z <= 1; z++) {
        vec3 offset = vec3(float(x), float(y), float(z));
        vec3 r = offset - f + caveHash(b + offset);
        float d = dot(r, r);
        if (d < dMin) {
            dMin2 = dMin;
            dMin = d;
        } else if (d < dMin2) {
            dMin2 = d;
        }
    }
    return vec2(sqrt(dMin), sqrt(dMin2));
}

float caveFbm(vec3 p) {
    float time = GameTime * 20.0;
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) {
        v += a * (sin(p.x * 1.5 + time * 0.5) * cos(p.z * 1.3 - time * 0.4)
                  + sin(p.y * 2.1 + time * 0.3));
        p = mat3(0.00, 0.80, 0.60,
                -0.80, 0.36,-0.48,
                -0.60,-0.48, 0.64) * p * 2.0;
        a *= 0.5;
    }
    return v;
}

vec3 skyCrystalCave(vec3 dir) {
    float time = GameTime * 20.0;
    vec3 col = vec3(0.01, 0.005, 0.02);
    vec3 rd = normalize(dir);
    float ra = time * 0.4;
    rd.xz *= mat2(cos(ra), sin(ra), -sin(ra), cos(ra));

    vec3 crystalPos = rd * 4.0 + vec3(0.0, time * 1.0, 0.0);
    vec2 vor = caveVoronoi(crystalPos * 3.0);
    float edge = vor.y - vor.x;
    float crystalGlow = exp(-edge * 8.0) * 1.5;
    float hueShift = caveHash(floor(crystalPos * 3.0)) * 0.3;
    vec3 crystalCol = mix(vec3(0.45, 0.15, 0.75), vec3(0.15, 0.35, 0.85), hueShift);

    vec3 crystalPos2 = rd * 7.0 + vec3(time * 0.6, 0.0, time * 0.4);
    vec2 vor2 = caveVoronoi(crystalPos2 * 6.0);
    float crystalGlow2 = exp(-vor2.x * 12.0) * 0.8;
    vec3 crystalCol2 = mix(vec3(0.6, 0.2, 0.9), vec3(0.2, 0.5, 1.0), caveHash(floor(crystalPos2 * 6.0) + 100.0) * 0.4);

    col += crystalCol * crystalGlow;
    col += crystalCol2 * crystalGlow2 * 0.6;

    float upFactor = smoothstep(-0.1, 0.6, rd.y);
    vec3 auroraPos = rd * 2.0 + vec3(0.0, 0.0, time * 1.5);
    float aurora = abs(caveFbm(auroraPos * 1.5));
    aurora = smoothstep(0.0, 1.2, aurora);
    float curtain = pow(sin(rd.x * 12.0 + time * 8.0 + aurora * 3.0) * 0.5 + 0.5, 4.0);
    vec3 auroraCol = mix(vec3(0.3, 0.1, 0.6), vec3(0.1, 0.6, 0.9), sin(aurora * 3.14 + time * 3.0) * 0.5 + 0.5);
    auroraCol = mix(auroraCol, vec3(0.5, 0.2, 0.8), curtain * 0.3);
    col += auroraCol * curtain * aurora * upFactor * 0.7;

    vec3 sparklePos = rd * 20.0;
    float sparkle = pow(caveHash(floor(sparklePos)), 20.0) * 3.0;
    float sparklePulse = sin(time * 30.0 + sparkle * 100.0) * 0.5 + 0.5;
    col += vec3(0.6, 0.5, 1.0) * sparkle * sparklePulse;

    float belowGlow = smoothstep(0.2, -0.5, rd.y);
    col += vec3(0.15, 0.05, 0.25) * belowGlow * 0.5;

    col = col / (col + 0.8);
    col = pow(col, vec3(0.9));
    return col;
}

const mat3 voidM3 = mat3(
    0.33338, 0.56034,-0.71817,
   -0.87887, 0.32651,-0.15323,
    0.15162, 0.69596, 0.61339
) * 1.93;

float voidTurbulence(vec3 p, float time) {
    float d = 0.0, z = 1.0, trk = 1.0;
    for (int i = 0; i < 5; i++) {
        p += sin(p.zxy * 0.75 * trk + time * 12.0 * trk) * 0.15;
        d -= abs(dot(cos(p), sin(p.yzx)) * z);
        z *= 0.57;
        trk *= 1.4;
        p = voidM3 * p;
    }
    return d;
}

float voidHash(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
}

vec3 skyVoidArena(vec3 dir) {
    float time = GameTime * 20.0;
    vec3 rd = normalize(dir);
    vec3 col = vec3(0.008, 0.003, 0.015);

    vec3 warpedDir = rd;
    float vortexDist = length(rd.xz);
    float va = vortexDist * 2.0 + time * 3.0;
    warpedDir.xz *= mat2(cos(va), sin(va), -sin(va), cos(va));

    vec3 energyPos = warpedDir * 3.0 + vec3(0.0, time * 2.0, 0.0);
    float energy = voidTurbulence(energyPos, time);
    energy = abs(energy + 1.5) - 1.8;
    float energyDensity = clamp(-energy * 2.0, 0.0, 1.0);

    float vortexAngle = atan(rd.x, rd.z);
    float colorPhase = sin(vortexAngle * 3.0 + time * 6.0) * 0.5 + 0.5;
    vec3 energyCol = mix(vec3(0.4, 0.05, 0.5), vec3(0.7, 0.1, 0.4), colorPhase);
    energyCol = mix(energyCol, vec3(0.2, 0.6, 0.7), pow(energyDensity, 3.0) * 0.4);
    col += energyCol * energyDensity * 0.6;

    vec3 finePos = rd * 6.0 + vec3(time * 1.2, time * -0.8, 0.0);
    float fa = time * 2.0;
    finePos.xy *= mat2(cos(fa), sin(fa), -sin(fa), cos(fa));
    float fineEnergy = voidTurbulence(finePos, time);
    fineEnergy = abs(fineEnergy + 1.0) - 1.2;
    float fineDensity = clamp(-fineEnergy * 3.0, 0.0, 1.0);
    vec3 fineCol = mix(vec3(0.5, 0.0, 0.6), vec3(0.15, 0.05, 0.3), sin(finePos.x * 2.0 + time * 15.0) * 0.5 + 0.5);
    col += fineCol * fineDensity * 0.35;

    for (int layer = 0; layer < 3; layer++) {
        float depth = 10.0 + float(layer) * 8.0;
        vec3 starPos = rd * depth;
        float la = float(layer) * 1.2 + time * 0.5;
        starPos.xy *= mat2(cos(la), sin(la), -sin(la), cos(la));
        starPos += vec3(0.0, 0.0, time * (2.0 + float(layer) * 1.0));
        float star = pow(voidHash(floor(starPos)), 25.0 - float(layer) * 3.0);
        float pulse = sin(time * (20.0 + float(layer) * 5.0) + star * 50.0) * 0.3 + 0.7;
        vec3 starCol = mix(vec3(0.6, 0.3, 0.9), vec3(0.9, 0.5, 0.7), voidHash(floor(starPos) + 77.0));
        col += starCol * star * pulse * (0.8 - float(layer) * 0.2);
    }

    vec3 riftDir = normalize(vec3(0.0, 0.3, 1.0));
    float riftAlign = max(dot(rd, riftDir), 0.0);
    float riftGlow = pow(riftAlign, 8.0);
    float riftPulse = 0.7 + 0.3 * sin(time * 18.0);
    vec3 riftCol = mix(vec3(0.5, 0.1, 0.6), vec3(0.8, 0.2, 0.5), pow(riftAlign, 2.0));
    col += riftCol * riftGlow * riftPulse * 1.5;
    col += vec3(0.2, 0.05, 0.3) * pow(riftAlign, 2.0) * 0.15;

    float edgeDark = 1.0 - pow(1.0 - abs(rd.y), 3.0) * 0.3;
    col *= edgeDark;

    col = col / (col + 0.6);
    col = pow(col, vec3(0.85));
    return col;
}

void main() {
    vec4 texColor = texture(Sampler0, texCoord0);
    float texAlpha = texColor.a * 255.0;
    if (abs(texAlpha - 254.0) < 1.0) {
        if (facingCamera < 0.0) discard;
        vec3 viewDir = normalize(vertexPosition);
        vec3 marker = texColor.rgb;
        float r = marker.r * 255.0;
        float g = marker.g * 255.0;
        float b = marker.b * 255.0;
        vec3 sky;
        if (g > 200.0) {
            sky = starNest(viewDir);
        } else if (r > 150.0 && b > 150.0) {
            sky = skyVoidArena(viewDir);
        } else {
            sky = skyCrystalCave(viewDir);
        }
        fragColor = vec4(sky, 1.0);
        return;
    }

    vec4 color = texColor * vertexColor * ColorModulator;
    if (color.a < 0.1) {
        discard;
    }
    fragColor = apply_fog(color, sphericalVertexDistance, cylindricalVertexDistance, FogEnvironmentalStart, FogEnvironmentalEnd, FogRenderDistanceStart, FogRenderDistanceEnd, FogColor);
}
