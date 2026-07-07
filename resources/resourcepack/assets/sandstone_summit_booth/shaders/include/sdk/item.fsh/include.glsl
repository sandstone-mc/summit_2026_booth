#define STAR_ITERATIONS 10
#define STAR_FORMUPARAM 0.53
#define STAR_VOLSTEPS 7
#define STAR_STEPSIZE 0.23
#define STAR_TILE 0.850
#define STAR_BRIGHTNESS 0.0031
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
    v *= vec3(0.45, 0.7, 1.0);
    return clamp(v * 0.01, 0.0, 1.0);
}

const mat3 voidM3 = mat3(
    0.33338, 0.56034,-0.71817,
   -0.87887, 0.32651,-0.15323,
    0.15162, 0.69596, 0.61339
) * 1.93;

float voidTurbulence(vec3 p, float time) {
    float d = 0.0, z = 1.0, trk = 1.0;
    for (int i = 0; i < 4; i++) {
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
    vec3 col = vec3(0.016, 0.004, 0.003);

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
    vec3 energyCol = mix(vec3(0.55, 0.04, 0.03), vec3(1.0, 0.06, 0.04), colorPhase);
    energyCol = mix(energyCol, vec3(1.0, 0.08, 0.05), pow(energyDensity, 3.0) * 0.4);
    col += energyCol * energyDensity * 0.6;

    vec3 finePos = rd * 6.0 + vec3(time * 1.2, time * -0.8, 0.0);
    float fa = time * 2.0;
    finePos.xy *= mat2(cos(fa), sin(fa), -sin(fa), cos(fa));
    float fineEnergy = voidTurbulence(finePos, time);
    fineEnergy = abs(fineEnergy + 1.0) - 1.2;
    float fineDensity = clamp(-fineEnergy * 3.0, 0.0, 1.0);
    vec3 fineCol = mix(vec3(0.65, 0.06, 0.0), vec3(0.3, 0.05, 0.02), sin(finePos.x * 2.0 + time * 15.0) * 0.5 + 0.5);
    col += fineCol * fineDensity * 0.35;

    for (int layer = 0; layer < 3; layer++) {
        float depth = 10.0 + float(layer) * 8.0;
        vec3 starPos = rd * depth;
        float la = float(layer) * 1.2 + time * 0.5;
        starPos.xy *= mat2(cos(la), sin(la), -sin(la), cos(la));
        starPos += vec3(0.0, 0.0, time * (2.0 + float(layer) * 1.0));
        float star = pow(voidHash(floor(starPos)), 25.0 - float(layer) * 3.0);
        float pulse = sin(time * (20.0 + float(layer) * 5.0) + star * 50.0) * 0.3 + 0.7;
        vec3 starCol = mix(vec3(1.0, 0.06, 0.04), vec3(1.0, 0.18, 0.1), voidHash(floor(starPos) + 77.0));
        col += starCol * star * pulse * (0.8 - float(layer) * 0.2);
    }

    vec3 riftDir = normalize(vec3(0.0, 0.3, 1.0));
    float riftAlign = max(dot(rd, riftDir), 0.0);
    float riftGlow = pow(riftAlign, 8.0);
    float riftPulse = 0.7 + 0.3 * sin(time * 18.0);
    vec3 riftCol = mix(vec3(0.8, 0.05, 0.03), vec3(1.0, 0.1, 0.05), pow(riftAlign, 2.0));
    col += riftCol * riftGlow * riftPulse * 1.5;
    col += vec3(0.32, 0.06, 0.02) * pow(riftAlign, 2.0) * 0.15;

    float edgeDark = 1.0 - pow(1.0 - abs(rd.y), 3.0) * 0.3;
    col *= edgeDark;

    col = col / (col + 0.6);
    col = pow(col, vec3(0.85));
    return col;
}

float skyCaveHash(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
}

vec2 skyCaveVoronoi(vec3 p) {
    vec3 b = floor(p);
    vec3 f = fract(p);
    float dMin = 8.0;
    float dMin2 = 8.0;
    for (int x = -1; x <= 1; x++)
    for (int y = -1; y <= 1; y++)
    for (int z = -1; z <= 1; z++) {
        vec3 offset = vec3(float(x), float(y), float(z));
        vec3 r = offset - f + skyCaveHash(b + offset);
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

float skyCaveFbm(vec3 p) {
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
    vec3 rd = normalize(dir);
    vec3 col = vec3(0.01, 0.005, 0.02);
    float ra = time * 0.4;
    rd.xz *= mat2(cos(ra), sin(ra), -sin(ra), cos(ra));

    vec3 crystalPos = rd * 4.0 + vec3(0.0, time * 1.0, 0.0);
    vec2 vor = skyCaveVoronoi(crystalPos * 3.0);
    float edge = vor.y - vor.x;
    float crystalGlow = exp(-edge * 8.0) * 1.5;
    float hueShift = skyCaveHash(floor(crystalPos * 3.0)) * 0.3;
    vec3 crystalCol = mix(vec3(0.45, 0.15, 0.75), vec3(0.15, 0.35, 0.85), hueShift);

    vec3 crystalPos2 = rd * 7.0 + vec3(time * 0.6, 0.0, time * 0.4);
    vec2 vor2 = skyCaveVoronoi(crystalPos2 * 6.0);
    float crystalGlow2 = exp(-vor2.x * 12.0) * 0.8;
    vec3 crystalCol2 = mix(vec3(0.6, 0.2, 0.9), vec3(0.2, 0.5, 1.0), skyCaveHash(floor(crystalPos2 * 6.0) + 100.0) * 0.4);

    col += crystalCol * crystalGlow;
    col += crystalCol2 * crystalGlow2 * 0.6;

    float upFactor = smoothstep(-0.1, 0.6, rd.y);
    vec3 auroraPos = rd * 2.0 + vec3(0.0, 0.0, time * 1.5);
    float aurora = abs(skyCaveFbm(auroraPos * 1.5));
    aurora = smoothstep(0.0, 1.2, aurora);
    float curtain = pow(sin(rd.x * 12.0 + time * 8.0 + aurora * 3.0) * 0.5 + 0.5, 4.0);
    vec3 auroraCol = mix(vec3(0.3, 0.1, 0.6), vec3(0.1, 0.6, 0.9), sin(aurora * 3.14 + time * 3.0) * 0.5 + 0.5);
    auroraCol = mix(auroraCol, vec3(0.5, 0.2, 0.8), curtain * 0.3);
    col += auroraCol * curtain * aurora * upFactor * 0.7;

    vec3 sparklePos = rd * 20.0;
    float sparkle = pow(skyCaveHash(floor(sparklePos)), 20.0) * 3.0;
    float sparklePulse = sin(time * 30.0 + sparkle * 100.0) * 0.5 + 0.5;
    col += vec3(0.6, 0.5, 1.0) * sparkle * sparklePulse;

    float belowGlow = smoothstep(0.2, -0.5, rd.y);
    col += vec3(0.15, 0.05, 0.25) * belowGlow * 0.5;

    col = col / (col + 0.8);
    col = pow(col, vec3(0.9));
    return col;
}

#define PI 3.14159265

vec2 tunnelPath(float z) {
    return vec2(0.5 * sin(z), 0.5 * sin(z * 0.7));
}

float tunnelMap(vec3 p) {
    float d = -length(p.xy - tunnelPath(p.z)) + 1.2 + 0.3 * sin(p.z * 0.4);
    return d;
}

vec3 tunnelNormal(vec3 p) {
    float d = tunnelMap(p);
    vec2 e = vec2(0.01, 0.0);
    vec3 n = d - vec3(
        tunnelMap(p - e.xyy),
        tunnelMap(p - e.yxy),
        tunnelMap(p - e.yyx)
    );
    return normalize(n);
}

float sMax(float a, float b, float k) {
    return log(exp(k*a) + exp(k*b)) / k;
}

float bumpFunction(vec3 p) {
    vec2 c = tunnelPath(p.z);
    float id = floor(p.z * 4.0 - 0.25);
    float angle = atan(p.y - c.y, p.x - c.x);
    float h = 0.5 + 0.5 * sin(angle * 20.0 + 1.5 * (2.0 * mod(id, 2.0) - 1.0) + GameTime * 20.0 * 5.0);
    h = sMax(h, 0.5 + 0.5 * sin(p.z * 8.0 * PI), 16.0);
    h *= h;
    h *= h * h;
    return 1.0 - h;
}

vec3 bumpNormal(vec3 p, vec3 n, float bumpFactor) {
    vec3 e = vec3(0.01, 0.0, 0.0);
    float f = bumpFunction(p);
    float fx = bumpFunction(p - e.xyy);
    float fy = bumpFunction(p - e.yxy);
    float fz = bumpFunction(p - e.yyx);
    float fx2 = bumpFunction(p + e.xyy);
    float fy2 = bumpFunction(p + e.yxy);
    float fz2 = bumpFunction(p + e.yyx);
    vec3 grad = vec3(fx - fx2, fy - fy2, fz - fz2) / (e.x * 2.0);
    grad -= n * dot(n, grad);
    return normalize(n + grad * bumpFactor);
}



vec3 skyAlienPlanet(vec3 dir) {
    vec3 rd = normalize(dir);
    float time = GameTime * 20.0;

    float upDot = rd.y * 0.5 + 0.5;
    vec3 skyCol = mix(vec3(1.0, 0.6, 0.0), vec3(0.3, 0.3, 1.0), upDot);

    vec3 sunDir = normalize(vec3(3.0, 0.05, 1.0));
    float sunDot = dot(sunDir, rd) * 0.5 + 0.5;
    vec3 sunCol = vec3(0.5, 0.3, 0.0);
    vec3 col = skyCol + sunCol * pow(sunDot, 2.0) * 1.5;

    float angle = atan(rd.x, rd.z);
    float radius = length(rd.xy);
    float ringPattern = sin(radius * 50.0 - time * 2.0) * 0.5 + 0.5;
    ringPattern *= sin(angle * 5.0 - time * 0.5) * 0.5 + 0.5;
    ringPattern *= sin(radius * 20.0 + time * 1.5) * 0.5 + 0.5;
    ringPattern = pow(ringPattern, 3.0);

    if (upDot < 0.3 && upDot > 0.1) {
        col += vec3(0.8, 0.5, 0.2) * ringPattern * (0.3 - upDot) * 2.0;
    }

    float cloudBand = sin(rd.y * 10.0 + time * 0.3) * 0.5 + 0.5;
    cloudBand *= sin(rd.x * 5.0 - time * 0.2) * 0.5 + 0.5;
    cloudBand = pow(cloudBand, 2.0);
    col += vec3(0.9, 0.9, 0.8) * cloudBand * 0.15;

    if (sunDot > 0.95) {
        float strength = pow(sunDot - 0.95, 2.0) * 20.0;
        col += vec3(1.0) * strength;
    }

    return col;
}

#define RS_PI2 6.28318530718
const vec3 RS_UP = vec3(0.0, 1.0, 0.0);
const vec3 RS_WHITE = vec3(1.0, 1.0, 1.0);
const float RS_CAMERA_UPWARD = 7.0;
const float RS_MAX_DIST = 200.0;
const float RS_SUN_THRESHOLD = 1.0 - (3.0 / 1800.0);
// -z = world north, where the walls spawn; slightly +x so the sun sits a bit to the players' right
const vec3 RS_SUN_DIRECTION = normalize(vec3(1.2, 0.05, -3.0));
const vec3 RS_RINGS_NORMAL = normalize(vec3(4.0, 1.0, 1.0));
const vec3 RS_RINGS_POS = vec3(1000.0, 0.0, 0.0);

float rs_saturate(float x) { return clamp(x, 0.0, 1.0); }
vec3 rs_saturate(vec3 x) { return clamp(x, 0.0, 1.0); }

float rs_random(vec2 st, int seed) {
    return fract(sin(dot((st.xy + float(seed)), vec2(12.9898, 78.233))) * 43758.5453123);
}
float rs_getCornerDot(vec2 corner, vec2 pixel, int seed) {
    float angle = RS_PI2 * rs_random(corner, seed);
    vec2 v = vec2(cos(angle), sin(angle));
    return dot(v, pixel - corner) * 0.5 + 0.5;
}
float rs_noise2D(vec2 pixel, int seed) {
    vec2 bl = floor(pixel);
    vec2 tr = ceil(pixel);
    vec2 tl = vec2(bl.x, tr.y);
    vec2 br = vec2(tr.x, bl.y);
    vec2 offset = smoothstep(0.0, 1.0, fract(pixel));
    float blD = rs_getCornerDot(bl, pixel, seed);
    float brD = rs_getCornerDot(br, pixel, seed);
    float tlD = rs_getCornerDot(tl, pixel, seed);
    float trD = rs_getCornerDot(tr, pixel, seed);
    float top = mix(tlD, trD, offset.x);
    float bottom = mix(blD, brD, offset.x);
    return mix(bottom, top, offset.y);
}
float rs_voronoi2D(vec2 grid, int seed) {
    vec2 centerPos = floor(grid);
    float minDist = 1.0;
    for (int x = 0; x <= 2; x++) {
        for (int y = 0; y <= 2; y++) {
            vec2 gridPos = centerPos + vec2(x, y);
            vec2 randOffset = vec2(rs_random(gridPos, seed), rs_random(gridPos, seed + 1));
            float dist = length(grid - gridPos + randOffset);
            if (dist < minDist) minDist = dist;
        }
    }
    return minDist;
}
float rs_smax0(float a, float b, float k) {
    return log(exp(k * a) + exp(k * b)) / k;
}
float rs_map(vec3 pos) {
    return pos.y
    - rs_noise2D(pos.xz, 0) * 0.1
    - rs_smax0(rs_voronoi2D(pos.xz * vec2(0.2, 0.1) * 1.6, 2), 0.5, 6.0)
    - pow(rs_noise2D(pos.xz * 0.02, 7), 1.0) * 40.0
    + 25.0
    - rs_noise2D(pos.xz * 0.07 + RS_WHITE.xy, 3) * 10.0
    - pow(rs_noise2D(pos.xz * 0.34 + RS_WHITE.xy, 3), 6.0) * 1.0
    - rs_noise2D(pos.xz * 0.01, 10) * 40.0 + 20.0
    - rs_noise2D(pos.xz * 0.0004, 12) * 40.0 + 15.0
    + 8.8;
}
vec3 rs_calcMapNormal(vec3 pos, float height) {
    float hX = height - rs_map(pos + vec3(0.001, 0.0, 0.0));
    float hZ = height - rs_map(pos + vec3(0.0, 0.0, 0.001));
    vec3 sX = normalize(vec3(0.001, hX, 0.0));
    vec3 sZ = normalize(vec3(0.0, hZ, 0.001));
    return cross(sZ, sX);
}
float rs_getCloudColor(vec2 pos, float time) {
    float cloudOffset = time * 0.1;
    return rs_noise2D(pos * vec2(0.4, 0.2) + cloudOffset, 2)
    + rs_noise2D(pos / 0.6 + cloudOffset, 2) * 0.1;
}
vec3 rs_calcCloudNormal(vec2 pos, float height, float time) {
    float hX = height - rs_getCloudColor(pos + vec2(0.05, 0.0), time);
    float hZ = height - rs_getCloudColor(pos + vec2(0.0, 0.05), time);
    vec3 sX = normalize(vec3(0.05, hX, 0.0));
    vec3 sZ = normalize(vec3(0.0, hZ, 0.05));
    return cross(sZ, sX);
}
vec3 rs_intersectLinePlane(vec3 lp, vec3 lv, vec3 pp, vec3 pn) {
    float t = dot(pn, (pp - lp)) / dot(pn, lv);
    return lp + t * lv;
}

vec3 skyRainbowsSunshines(vec3 dir) {
    float time = GameTime * 1200.0;
    vec3 rayForward = normalize(dir);
    vec3 camPos = RS_UP * RS_CAMERA_UPWARD;

    float skyDot = dot(RS_UP, rayForward) * 0.5 + 0.5;
    float sunDot = dot(RS_SUN_DIRECTION, rayForward) * 0.5 + 0.5;
    vec3 skyCol = mix(vec3(1.0, 0.6, 0.0), vec3(0.3, 0.3, 1.0), skyDot);
    vec3 sunCol = vec3(0.5, 0.3, 0.0);
    vec3 col = skyCol + sunCol * pow(sunDot, 2.0) * 1.5;

    float totalDist = 0.0;
    vec3 currentPos = camPos;
    for (int i = 0; i < 96 && totalDist < RS_MAX_DIST; i++) {
        if (currentPos.y > 64.0 && rayForward.y > 0.0) {
            totalDist = RS_MAX_DIST;
            break;
        }
        float sdf = rs_map(currentPos);
        if (sdf < 0.04) {
            vec3 normal = rs_calcMapNormal(currentPos, sdf);
            float dotWithSun = dot(normal, RS_SUN_DIRECTION);
            float brightness = mix(0.3, 0.6, dotWithSun);
            float distMul = pow(totalDist / RS_MAX_DIST, 5.0);
            float noise = pow(rs_noise2D(currentPos.xz * 10.0, 1), 0.1) * 0.5 +
                          pow(rs_noise2D(currentPos.xz * 20.0, 1), 0.1) * 0.5;
            float colorRegion = rs_noise2D(currentPos.xz * 0.1, 1) * rs_noise2D(currentPos.xz * 0.01, 1);
            vec3 yellow = mix(vec3(1.0, 1.0, 0.8), vec3(0.87, 0.62, 0.27), colorRegion);
            vec3 grainCol = noise * yellow;
            vec3 sandCol = brightness * grainCol + sunCol * rs_saturate(dotWithSun);
            col = mix(sandCol, col, distMul);
            break;
        }
        currentPos += rayForward * sdf;
        totalDist += sdf;
    }

    bool hitSky = totalDist >= RS_MAX_DIST;
    vec3 sunPos = RS_SUN_DIRECTION * 3000.0;

    if (hitSky) {
        float distToCeiling = (5.0 - camPos.y) / (rayForward.y + 0.00001);
        vec3 cloudPos = rayForward * distToCeiling;
        float dist = rs_saturate(1.0 - (length(cloudPos - camPos) / RS_MAX_DIST));
        float noiseVal = rs_getCloudColor(cloudPos.xz, time);
        vec3 cloudNormal = rs_calcCloudNormal(cloudPos.xz, noiseVal, time);
        col += RS_WHITE * noiseVal * dist * 0.2;
        col += sunCol * rs_saturate(dot(-cloudNormal, normalize(cloudPos - sunPos))) * dist;
        if (sunDot > RS_SUN_THRESHOLD) {
            float strength = 1.0 - ((1.0 - sunDot) / (1.0 - RS_SUN_THRESHOLD));
            strength *= strength;
            col += RS_WHITE * strength;
        }
        vec3 ringPos = rs_intersectLinePlane(camPos, rayForward, RS_RINGS_POS, RS_RINGS_NORMAL);
        float ringDist = length(RS_RINGS_POS - ringPos);
        float brightness = rs_saturate(sin(ringDist / 150.0) + sin(ringDist / 300.0) + sin(ringDist / 20.0) + sin(ringDist / 50.0) + sin(ringDist / 1000.0));
        brightness = brightness * rs_saturate(sin(ringDist / 1500.0)) * 0.6 + brightness * 0.4;
        brightness *= rs_saturate(1.0 - abs(9300.0 - ringDist) / 8000.0);
        brightness *= rs_saturate(ringPos.y / 3000.0);
        col += RS_WHITE * brightness * 0.4;
    }

    col += sunCol * pow(sunDot, 200.0) * 0.2;
    if (!hitSky) col += sunCol * pow(sunDot, 10.0) * 0.7;

    return col;
}
