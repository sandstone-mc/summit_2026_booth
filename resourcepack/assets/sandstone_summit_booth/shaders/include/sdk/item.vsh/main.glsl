sdk_int = int(texelFetch(Sampler0, sdk_iuv + ivec2(2, 0), 0).r * 255.0);
sdk_vec4 = vec4(Position, 0.0);
sdk_vec4_b = inverse(ProjMat * ModelViewMat) * gl_Position.xyww;