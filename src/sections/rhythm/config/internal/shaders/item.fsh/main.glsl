vec3 nearPos = sdk_vec4_b.xyz / sdk_vec4_b.w;
vec3 dir = normalize(sdk_vec4.xyz - nearPos);
vec3 sky;
if (sdk_int == 1) sky = snd_starNest(dir);
else if (sdk_int == 2) sky = snd_skyVoidArena(dir);
else sky = snd_skyRainbowsSunshines(dir);
fragColor = vec4(sky, 1.0);
