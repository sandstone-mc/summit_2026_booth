vec3 dir = normalize(sdk_vec4.xyz);
if (sdk_vec4.w < 0.0) discard;
vec3 sky;
if (sdk_int == 1) sky = snd_starNest(dir);
else if (sdk_int == 2) sky = snd_skyVoidArena(dir);
else sky = snd_skyRainbowsSunshines(dir);
fragColor = vec4(sky, 1.0);
