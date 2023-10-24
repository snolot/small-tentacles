import {
	Vector3,
	Matrix4,
	MathUtils,
	Quaternion,
	BoxBufferGeometry,
	InstancedMesh,
	Object3D,
	Mesh,
	Color,
	Group,
	MeshStandardMaterial,
	DynamicDrawUsage
}  from '../../three.js-131/build/three.module.js';
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

	const colA = new Color(29/255, 45/255, 82/255);
	const colB = new Color(163/255, 112/255, 184/255);

	const pos = new Vector3();
	const prevPos = new Vector3();
	const m = new Matrix4();
	const q = new Quaternion();
	const prevDir = new Vector3();

	const d = 10;
	const seed = seeds[armCount]
	const offset = seed.clone().multiplyScalar(d);
	//console.log(offset);

	pos.set(0, 0, 0);
	prevPos.set(0, 0, 0);

	const mat = new MeshStandardMaterial();
	let _shader;

	/*mat.onBeforeCompile = (shader) => {
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
*/
	const baseMesh = new Mesh(new BoxBufferGeometry(.1,.1,.1), mat);
	let mesh;

	const dummy = new Object3D();
	let armID;

	const init = () => {
		const group = new Group();
		//scene.add(group);
		const cnt = length * 2;
		

		const baseGeometry = new BoxBufferGeometry(.1, .1, .1).toNonIndexed();

		mesh = new InstancedMesh(baseGeometry, mat, cnt);
		mesh.instanceMatrix.setUsage(DynamicDrawUsage);

		scene.add(mesh);
		let a = 0;

		for(let i = 0; i < length; i += .5){

			const dir = curl(pos.clone().add(offset).multiplyScalar(twistiness), fn);
	    	dir.normalize().multiplyScalar(0.1 * scale);
	    	pos.add(dir);

	    	const p = pos.clone();
			dummy.position.copy(p);

			const tc = i / length;
			
		    scale = 1 - i / length;	
			dummy.scale.set(scale, scale, scale);

		    up.set(
		        randomInRange(-1, 1),
		        randomInRange(-1, 1),
		        randomInRange(-1, 1)
		    ).normalize();	
		    
		    dummy.lookAt(prevPos, p, up.clone());			    
		    
		    dummy.updateMatrix()
		    //dummy.updateWorldMatrix()		   
		    //dummy.matrixAutoUpdate = false;

		    datas.push({
		    	scale,
		    	length:dir.length(),
		    	mat:dummy.matrix.clone(),
		    	up:up.clone()
		    });
		    mesh.setColorAt(a, colA.lerp(colB, tc));

		    mesh.setMatrixAt(a, dummy.matrix);
		    prevPos.copy(dummy.position.clone());
		    a++;
		}
		if(armCount==0)
			console.log(a);

		mesh.instanceMatrix.needsUpdate = true;
		armID = armCount;

		armCount++;
	};

	const prevDummy = new Object3D();

	const update2 = (dt) => {
		let a = 0;

		for(let i = 0; i < length; i += 1){

			const dir = curl((pos.clone().add(offset).multiplyScalar(twistiness)), fn);
	    	dir.normalize().multiplyScalar(0.1 * scale);
	    	dir.multiplyScalar(frame);
	    	pos.add(dir);

	    	const p = pos.clone();
			dummy.position.copy(p);

			//dummy.rotateX();
			const tc = i / length;
			
		    scale = 1 - i / length;	
			dummy.scale.set(scale, scale, scale);

		    up.set(
		        randomInRange(-1, 1),
		        randomInRange(-1, 1),
		        randomInRange(-1, 1)
		    ).normalize();	
		    
		    dummy.lookAt(prevPos, p, up.clone());			    
		    dummy.matrixAutoUpdate = false;
		    dummy.updateMatrix()
		    //dummy.updateWorldMatrix()		   
		    //dummy.matrixAutoUpdate = false;

		    mesh.setColorAt(a, colA.lerp(colB, tc));

		    mesh.setMatrixAt(a, dummy.matrix);
		    prevPos.copy(dummy.position.clone());
		    
		}

		mesh.instanceMatrix.needsUpdate = true;
	}

	const update = (dt) => {
		COUNT = datas.length;
		//console.log(COUNT)
		

		for(let i=0; i<COUNT; i++){
			
			const {length,scale,up} = datas[i];
			mesh.getMatrixAt(i, dummy.matrix);

			const pos = dummy.position.clone();
			const dir = curl(pos.clone()/*.add(new THREE.Vector3(rx, ry, rz))*/.multiplyScalar(twistiness), fn);

			dir.normalize();
			//pos.add(dir);
			//dir.multiplyScalar(3 * (1 - scale));
			//const dir = new Vector3(.01,.01,.01);


			if(i==0){
				
				dummy.rotateX(radians(dir.x));
				dummy.rotateY(radians(dir.y));
				dummy.rotateZ(radians(dir.z));

				//dummy.matrix.scale(scale);

			}else{


				mesh.getMatrixAt(i, dummy.matrix);
				mesh.getMatrixAt(i-1, prevDummy.matrix);

				const _up = datas[i-1].up;

				const ps = prevDummy.position.clone();
				
				dummy.position.copy(ps);
				
				//mesh.rotation.copy(m2.rotation.clone());
				dummy.translateZ(length);
				
				dummy.rotateX(radians(dir.x));
				dummy.rotateY(radians(dir.y));
				dummy.rotateZ(radians(dir.z));
				
				dummy.matrix.scale(scale);
				//dummy.scale.set(scale,scale,scale);
					
				
			}

			//dummy.matrixAutoUpdate = false;
			dummy.updateMatrix();

			mesh.setMatrixAt(i, dummy.matrix);
		}

		mesh.instanceMatrix.needsUpdate = true;

	}

	init();

	const base = {
		update,
		update2,
	};

	return base;
}

export {Arm}