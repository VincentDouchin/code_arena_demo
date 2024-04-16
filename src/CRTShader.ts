import { ShaderMaterial, Uniform, Vector2, Vector3, Vector4 } from 'three'

export const CRTShaderMaterial = new ShaderMaterial({

	uniforms: {
		uLine: new Uniform(new Vector4(2, 5, 0.5, 0)),
		uNoise: new Uniform(new Vector2(0, 0.1)),
		uVignette: new Uniform(new Vector3(0, 0.8, 0.3)),
		uTime: new Uniform(10),
		uSeed: new Uniform(1),
		uDimensions: new Uniform(new Vector2(window.innerWidth, window.innerHeight)),
		uInputSize: new Uniform(new Vector2(window.innerWidth, window.innerHeight)),

	},
	vertexShader: /* glsl */`
	varying vec2 vUv;
	void main() {
		vUv = uv;
		vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
		gl_Position = projectionMatrix * modelViewPosition;
	}
	`,
	fragmentShader: /* glsl */`
	precision highp float;
	uniform sampler2D tDiffuse;
	varying vec2 vUv;
	uniform vec4 uLine;
	uniform vec2 uNoise;
	uniform vec3 uVignette;
	uniform float uSeed;
	uniform float uTime;
	uniform vec2 uDimensions;
	uniform vec4 uInputSize;
	const float SQRT_2 = 1.414213;

	float rand(vec2 co) {
		return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
	}

	float vignette(vec3 co, vec2 coord)
	{
		float outter = SQRT_2 - uVignette[0] * SQRT_2;
		vec2 dir = vec2(0.5) - coord;
		dir.y *= uDimensions.y / uDimensions.x;
		float darker = clamp((outter - length(dir) * SQRT_2) / ( 0.00001 + uVignette[2] * SQRT_2), 0.0, 1.0);
		return darker + (1.0 - darker) * (1.0 - uVignette[1]);
	}

	float noise(vec2 coord)
	{
		vec2 pixelCoord = coord * uInputSize.xy;
		pixelCoord.x = floor(pixelCoord.x / uNoise[1]);
		pixelCoord.y = floor(pixelCoord.y / uNoise[1]);
		return (rand(pixelCoord * uNoise[1] * uSeed) - 0.5) * uNoise[0];
	}

	vec3 interlaceLines(vec3 co, vec2 coord)
	{
		vec3 color = co;

		float curvature = uLine[0];
		float lineWidth = uLine[1];
		float lineContrast = uLine[2];
		float verticalLine = uLine[3];

		vec2 dir = vec2(coord * uInputSize.xy / uDimensions - 0.5);

		float _c = curvature > 0. ? curvature : 1.;
		float k = curvature > 0. ? (length(dir * dir) * 0.25 * _c * _c + 0.935 * _c) : 1.;
		vec2 uv = dir * k;
		float v = verticalLine > 0.5 ? uv.x * uDimensions.x : uv.y * uDimensions.y;
		v *= min(1.0, 2.0 / lineWidth ) / _c;
		float j = 1. + cos(v * 1.2 - uTime) * 0.5 * lineContrast;
		color *= j;

		float segment = verticalLine > 0.5 ? mod((dir.x + .5) * uDimensions.x, 4.) : mod((dir.y + .5) * uDimensions.y, 4.);
		color *= 0.99 + ceil(segment) * 0.015;

		return color;
	}


	void main(void)	{
		vec2 centered_uv = vUv * 2. - 1.;
		vec2 offset = centered_uv / 3.;
		centered_uv = centered_uv + centered_uv * offset * offset; 
		centered_uv /= 1.1;
		centered_uv = centered_uv * 0.5 + 0.5;
		
		vec4 finalColor = texture2D(tDiffuse, centered_uv);
		vec2 coord = vUv * uInputSize.xy / uDimensions;

		if (uNoise[0] > 0.0 && uNoise[1] > 0.0)
		{
			float n = noise(vUv);
			finalColor += vec4(n, n, n, finalColor.a);
		}

		if (uVignette[0] > 0.)
		{
			float v = vignette(finalColor.rgb, coord);
			finalColor *= vec4(v, v, v, finalColor.a);
		}

		if (uLine[1] > 0.0)
		{
			finalColor = vec4(interlaceLines(finalColor.rgb, vUv), finalColor.a);  
		}
		gl_FragColor = finalColor;

	}
	`,

})