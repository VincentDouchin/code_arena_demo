import { CanvasTexture, NearestFilter, Vector2, WebGLRenderer } from 'three'

import { CopyShader, EffectComposer, GlitchPass, ShaderPass, TexturePass, UnrealBloomPass } from 'three/examples/jsm/Addons.js'
import { CRTShaderMaterial } from './CRTShader'

const renderer = new WebGLRenderer()
export const width = window.innerWidth
export const height = window.innerHeight
renderer.setSize(width, height)
document.body.appendChild(renderer.domElement)

const canvas = new OffscreenCanvas(width, height)
const ctx = canvas.getContext('2d')!
const canvasTexture = new CanvasTexture(canvas)
canvasTexture.magFilter = NearestFilter
canvasTexture.minFilter = NearestFilter
const composer = new EffectComposer(renderer)
composer.addPass(new TexturePass(canvasTexture))
const CRTPass = new ShaderPass(CRTShaderMaterial)
composer.addPass(new UnrealBloomPass(new Vector2(width, height), 0.2, 0, 0.0))
const glitch = new GlitchPass()
composer.addPass(glitch)
composer.addPass(new ShaderPass(CopyShader))
composer.addPass(CRTPass)
const letters = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F']
ctx.font = '24px sans-serif'
const drawText = () => {
	ctx.fillStyle = 'rgb(8, 32, 58)'
	ctx.fillRect(0, 0, width, height)
	ctx.fillStyle = 'rgb(142, 227, 241)'
	for (let y = 0; y < height; y += 30) {
		for (let x = 0; x < width; x += 30) {
			ctx.fillText(letters[Math.floor(Math.random() * letters.length)], x, y)
		}
	}
	canvasTexture.needsUpdate = true
}
const start = Date.now()
const render = () => {
	composer.render()
	CRTShaderMaterial.uniforms.uTime.value = (start - Date.now()) / 200
	requestAnimationFrame(render)
}
render()
setInterval(drawText, 1000 / 10)