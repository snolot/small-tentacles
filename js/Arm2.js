import {
	Vector3,
	Matrix4,
	MathUtils,
	Quaternion,
	BoxBufferGeometry,
	Mesh,
	Color,
	Group,
	MeshStandardMaterial,
}  from '../libs/build/three.module.js';
import { pointsOnSphere } from "./Fibonacci.js";
import { curl, generateNoiseFunction } from "./curl.js";
import { simplex3 } from  './perlin.js';

const randomInRange = MathUtils.randInt;
const seeds = pointsOnSphere(5);
const twistiness = randomInRange(0.1, 0.2);
const minLength = 40;
const maxLength = 80;
const fn = generateNoiseFunction();
let frame = 0;

const SPREAD  = 0.025;
const SPEED   = 30.0;
const ANGLE   = 20;
let COUNT   = 50;

let armCount = 0;

const radians = (degrees) => {
    return degrees * Math.PI / 180;
};

const Arm = (scene) => {
	const meshes = [];
	const bones = [];
	const datas = [];

	const length = randomInRange(minLength, maxLength);
	const up = new Vector3(0, 1, 0);

	const points = [];
	
	let scale = 0;

	const colA = new Color(1,1,1);
	const colB = new Color(1,.7, 0);

	const pos = new Vector3();
	const prevPos = new Vector3();
	const m = new Matrix4();
	const q = new Quaternion();
	const prevDir = new Vector3();

	const d = 10;
	const seed = seeds[armCount]
	const offset = seed.clone().multiplyScalar(d);
	console.log(offset);

	pos.set(0, 0, 0);
	prevPos.set(0, 0, 0);

	const mat = new MeshStandardMaterial();
	let _shader;

	mat.onBeforeCompile = (shader) => {
		_shader =  shader;
 
		shader.uniforms.uColorA = {type:'v3', value: colA };
		shader.uniforms.uColorB = {type:'v3', value: colB };
		shader.uniforms.uLerp = {type:'f', value: 0.0 };

		shader.fragmentShader = shader.fragmentShader.replace(
			'#include <common>',
			`
			#include <common>
				uniform vec3 uColorA;
				uniform vec3 uColorB;
				uniform float uLerp;
			`
		);

		shader.fragmentShader = shader.fragmentShader.replace(
			'#include <map_fragment>',
			`
			#include <map_fragment>
			diffuseColor = vec4(mix(uColorA, uColorB, uLerp), 1.0);
			`
		)
	};

	const baseMesh = new Mesh(new BoxBufferGeometry(.1,.1,.1), mat);
	let mesh;
	
	const init = () => {
		const group = new Group();
		scene.add(group);
		
		for(let i = 0; i < length; i += .5){

			const mesh = baseMesh.clone();
			mesh.castShadow = mesh.receiveShadow = true;
			meshes.push(mesh);

			//const mat = new Matrix4();

			const dir = curl(pos.clone().add(offset).multiplyScalar(twistiness), fn);
	    	dir.normalize().multiplyScalar(.1 * scale);
	    	pos.add(dir);

	    	const p = pos.clone();

			//bones.push(mat);
			group.add(mesh);

			mesh.position.copy(p);
			const tc = i / length;
			//console.log(_shader);


		    scale = 1 - i / length;	

			mesh.scale.set(scale, scale, scale);

		    up.set(
		        randomInRange(-1, 1),
		        randomInRange(-1, 1),
		        randomInRange(-1, 1)
		    ).normalize();	
		    
		    mesh.lookAt(prevPos, p, up.clone());			    
		    
		    mesh.updateMatrix()
		    mesh.updateWorldMatrix()

		    datas.push({
		    	scale,
		    	length:dir.length(),
		    	mesh,
		    	up:up.clone()
		    });
		    
		    mesh.matrixAutoUpdate = false;
		    mesh.updateMatrix();

		    prevPos.copy(mesh.position.clone());
		}

		armCount++;
	};

	const update = (dt) => {
		COUNT = datas.length;
		//console.log(COUNT)
		for(let i=0; i<COUNT; i++){

			/*const rx = (simplex3( i*SPREAD+frame/SPEED, 0, 0) )*ANGLE;
			const ry = (simplex3( 0, i*SPREAD+frame/SPEED, 0) )*ANGLE;
			const rz = (simplex3( 0, 0, i*SPREAD+frame/SPEED) )*ANGLE;*/

			
			const {mesh,length,scale} = datas[i];

			const dir = curl(mesh.position.clone()/*.add(new THREE.Vector3(rx, ry, rz))*/.multiplyScalar(twistiness), fn);

			dir.normalize();
			//dir.multiplyScalar( 2 *  (1 - scale));

			if(i==0){
				mesh.rotateX(radians(dir.x));
				mesh.rotateY(radians(dir.y));
				mesh.rotateZ(radians(dir.z));

				mesh.updateMatrix();

			}else{
				const m2 = datas[i-1].mesh;
				const _up = datas[i-1].up;

				const pos = m2.position.clone();
				mesh.position.copy(pos);

				//mesh.rotation.copy(m2.rotation.clone());
				mesh.translateZ(length);
				mesh.rotateX(radians(dir.x));
				mesh.rotateY(radians(dir.y));
				mesh.rotateZ(radians(dir.z));
				
				mesh.updateMatrix();
				
			}

			prevPos.copy(mesh.position.clone())
		}
	}

	init();

	const base = {
		update,
	};

	return base;
}

export {Arm}