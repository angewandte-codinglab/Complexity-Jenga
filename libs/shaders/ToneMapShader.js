/**
 * Tone Mapping shader
 * Applies various tone mapping operators to the input
 */
const ToneMapShader = {
    uniforms: {
      "tDiffuse": { value: null },
      "exposure": { value: 1.0 },
      "toneMapping": { value: 3 } // Default to ACESFilmic
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D tDiffuse;
      uniform float exposure;
      uniform int toneMapping;
      varying vec2 vUv;
  
      // ACES filmic tone mapping approximation
      vec3 ACESFilmic(vec3 color) {
        color *= exposure;
        return clamp((color * (2.51 * color + 0.03)) / (color * (2.43 * color + 0.59) + 0.14), 0.0, 1.0);
      }
      
      // Reinhard tone mapping
      vec3 ReinhardToneMapping(vec3 color) {
        color *= exposure;
        return clamp(color / (vec3(1.0) + color), 0.0, 1.0);
      }
      
      // Cineon tone mapping
      vec3 CineonToneMapping(vec3 color) {
        color *= exposure;
        color = max(vec3(0.0), color - 0.004);
        return pow((color * (6.2 * color + 0.5)) / (color * (6.2 * color + 1.7) + 0.06), vec3(2.2));
      }
      
      // AgX tone mapping approximation
      vec3 AgXToneMapping(vec3 color) {
        color *= exposure;
        const vec3 a = vec3(0.231, 0.231, 0.231);
        const vec3 b = vec3(0.267, 0.267, 0.267);
        const vec3 c = vec3(0.042, 0.042, 0.042);
        return color / (color + a) * (b / (color + c));
      }
      
      void main() {
        vec4 tex = texture2D(tDiffuse, vUv);
        vec3 color = tex.rgb;
        
        if (toneMapping == 1) { // LinearToneMapping
          color *= exposure;
        } 
        else if (toneMapping == 2) { // ReinhardToneMapping
          color = ReinhardToneMapping(color);
        }
        else if (toneMapping == 3) { // ACESFilmicToneMapping
          color = ACESFilmic(color);
        }
        else if (toneMapping == 4) { // CineonToneMapping
          color = CineonToneMapping(color);
        }
        else if (toneMapping == 5) { // AgXToneMapping  
          color = AgXToneMapping(color);
        }
        
        gl_FragColor = vec4(color, tex.a);
      }
    `
  };
  
  export { ToneMapShader };