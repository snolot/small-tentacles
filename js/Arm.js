import {
	Vector3,
	Matrix4,
	MathUtils,
	Quaternion,
	BoxBufferGeometry,
	Mesh,
	MeshStandardMaterial,
}  from '../../three.js-131/build/three.module.js';
import { pointsOnSphere } from "./Fibonacci.js";
import { curl, generateNoiseFunction } from "./curl.js";
import { simplex3 } from  './perlin.js';

const randomInRange = MathUtils.randInt;
const seeds = pointsOnSphere(5);
const twistiness = randomInRange(0.1, 0.2);
const minLength = 60;
const maxLength = 120;
const fn = generateNoiseFunction();
let frame = 0;

const SPREAD  = 0.025;
const SPEED   = 30.0;
const ANGLE   = 20;
const COUNT   = 50;

let armCount = 0;

const radians = (degrees) => {
    return degrees * Math.PI / 180;
} 


const Arm = (scene, random = true) => {
	const length = randomInRange(minLength, maxLength);
	const up = new Vector3(0, 1, 0);

	const points = [];
	
	let scale = 3;

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

	const baseMesh = new Mesh(new BoxBufferGeometry(.1,.1,.1), new MeshStandardMaterial());

	const init = () => {
		const m = new Matrix4();

  		for (let i = 0; i < length; i += 0.5) {
  			
  			m.identity();

		    const dir = curl(pos.clone().add(offset).multiplyScalar(twistiness), fn);
		    dir.normalize().multiplyScalar(0.1 * scale);
		    pos.add(dir);

		    const p = pos.clone();
		    //console.log(p);

		    const mesh = baseMesh.clone();
		    
		    scene.add(mesh);

		    mesh.position.copy(p);

		    scale = 1 - i / length;
		    mesh.scale.set(scale, scale, scale);


		    if (random) {
		      up.set(
		        randomInRange(-1, 1),
		        randomInRange(-1, 1),
		        randomInRange(-1, 1)
		      ).normalize();
		    }

		    mesh.lookAt(prevPos, p, up);
		    //q.setFromRotationMatrix(m);
		    prevDir.copy(dir);

		    prevPos.copy(p);
		    //console.log(offset);
		    //mesh.matrixAutoUpdate = false;
		    mesh.updateMatrix();
			mesh.updateWorldMatrix()

			//m.copy(mesh.matrix);

		    points.push({  
		    	pos,
		      	mat: mesh.matrix,
		      	scale,
		     	mesh
		    });
		}

		armCount++;
	};

	const sp = new Vector3();
	const ss = new Vector3();
	const sr = new Quaternion();
	const mr = new Matrix4();
	const mre = new Matrix4();
	const rotate = (idx, x, y, z) =>{

		/*const {scale, pos, mat, mesh} = points[idx];
		
		mesh.rotateX(radians(x));
		mesh.rotateY(radians(y));
		mesh.rotateZ(radians(z));

		mesh.updateMatrix();
		mr.copy(mesh.matrix);

		if(idx > 0){
			const prevMesh = points[idx - 1].mesh;

			//prevMesh.matrix.extractRotation( mre );
			mr.multiply(prevMesh.matrix);

			const direction = new Vector3( 0, 0, 1 );
			mr.multiplyVector3( direction );

			direction.add(offset);
			direction.normalize().multiplyScalar(0.1 * scale)
			mesh.position.copy(direction);
		}
		
		mesh.updateMatrix();
		*/



		points[idx].mat.identity();
		const {scale} = points[idx];

		var m = points[idx].mat.clone();
		
		var tm = new Matrix4();

		if(idx>0){
			m.multiply(points[idx-1].mat.clone());	
			let _pos = points[idx].pos.clone();
			
			//console.log(idx, pos)
			const dir = curl(_pos.clone(), fn);
		    dir.normalize().multiplyScalar(0.1 * scale);
		    _pos.add(dir);

			//tm.setPosition(pos.x, pos.y, pos.z)
			tm.makeTranslation(dir.x, dir.y, dir.z);
		}

		

		var rotMatrix  = new Matrix4();

		rotMatrix.makeRotationX((x));
		m.multiply(rotMatrix);

		rotMatrix.makeRotationY((y));
		m.multiply(rotMatrix);

		rotMatrix.makeRotationZ((z));

		m.multiply(rotMatrix);


		m.multiply(tm);

		/*var scaleMatrix  = new Matrix4();
		scaleMatrix.makeScale(scale, scale, scale);

		m.multiply(scaleMatrix)*/

		if(idx>0){
			points[idx].mat.copy(m);
		}

		//points[idx].mesh.matrix.copy(m);
		
		/*mr.makeRotationFromQuaternion(sr);
		//if(idx === 5)
		//console.log(mr);
		mr.makeRotationX(radians(x));
		//m.multiply(mr);

		mr.makeRotationY(radians(y));
		//m.multiply(mr);

		mr.makeRotationZ(radians(z));
		//m.multiply(mr);

		sr.setFromRotationMatrix(mr);
		m.compose(sp,sr,ss);

		//console.log(m);
		//points[idx].mat.copy(m);
		points[idx].mesh.matrix.copy(m);*/

		
	}

	const update = (dt) => {
		frame += .07;

		for (let i = 0; i < points.length; i ++) {
			rotate(i,
	          (simplex3( i * SPREAD + frame / SPEED, 0, 0) ) * ANGLE,
	          (simplex3( 0, i * SPREAD + frame / SPEED, 0) )  * ANGLE,
	          (simplex3( 0, 0, i * SPREAD + frame / SPEED) ) * ANGLE
	        );
		}
	}

	init();

	const base = {
		update,
	};

	return base;
}

export {Arm};