import {
  Color,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Object3D,
  CylinderBufferGeometry,
  OneFactor,
  Quaternion,
  BoxBufferGeometry,
  Vector3,
  MathUtils,
} from "../libs/build/three.module.js";
//import { RoundedBoxGeometry } from "../third_party/RoundedBoxGeometry.js";
//import { clamp, randomInRange } from "../modules/Maf.js";
import { curl, generateNoiseFunction } from "./curl.js";
import { pointsOnSphere } from "./Fibonacci.js";
import { simplex3 } from  './perlin.js';

const minLength = 60;
const maxLength = 120;
let arms;

const up = new Vector3(0, 1, 0);

let fn;

const clamp = MathUtils.clamp;
const randomInRange = MathUtils.randInt;
const cos = Math.cos;
const sin = Math.sin;
let frame = 0;

const SPREAD  = 0.025;
const SPEED   = 30.0;
const ANGLE   = 0.2;
const COUNT   = 50;

const radians = (degrees) => {
    return degrees * Math.PI / 180;
} 

const createArm = (points, o, twistiness, random, mark) => {
  const length = randomInRange(minLength, maxLength);
  let scale = 3;

  const pos = new Vector3();
  const prevPos = new Vector3();
  const m = new Matrix4();
  const q = new Quaternion();
  const prevDir = new Vector3();

  const d = 10;
  const offset = o.clone().multiplyScalar(d);

  pos.set(0, 0, 0);
  prevPos.set(0, 0, 0);

  for (let i = 0; i < length; i += 0.5) {

    const dir = curl(pos.clone().add(offset).multiplyScalar(twistiness), fn);
    dir.normalize().multiplyScalar(0.1 * scale);
    pos.add(dir);

    scale = 1 - i / length;

    if (random) {
      up.set(
        randomInRange(-1, 1),
        randomInRange(-1, 1),
        randomInRange(-1, 1)
      ).normalize();
    }

    m.lookAt(prevPos, pos, up);
    q.setFromRotationMatrix(m);
    prevDir.copy(dir);

    prevPos.copy(pos);
    //console.log(offset);

    points.push({
      up,
      offset,
      twistiness,
      mark,
      position: pos.clone(),
      scale: 3 * scale,
      mat: m,
      rotation: q.clone(), // q.setFromRotationMatrix(m).clone(),
    });
  }

  console.table(points)
}

const createCurl = () => {
  fn = generateNoiseFunction();
  arms = 5;//~~randomInRange(1, 3);
  const seeds = pointsOnSphere(arms);
  const random = Math.random() > 0.75;
  const twistiness = randomInRange(0.1, 0.2);

  const points = [];

  for (let i = 0; i < arms; i++) {
    const mark = i === 0;

    createArm(points, seeds[i], twistiness, random, mark);
  }

  const mat = new MeshStandardMaterial({
    roughness: 0.2,
    metalness: 0,
    color: 0xffffff,
  });

  const geo = new BoxBufferGeometry(0.1, 0.1, 0.1);
  const mesh = new InstancedMesh(geo, mat, points.length);

  const dummy = new Object3D();
  mesh.scale.setScalar(0.1);
  let prevT = -1;

  const finalScale = randomInRange(1.5, 3);

  const updatePos = (idx, x, y, z) => {
    const q = new Quaternion();
    
    const {position, mat, offset, twistiness} = points[idx];
    let rotation = points[idx].rotation;

    var rotMatrix  = new Matrix4();

    rotMatrix.makeRotationX(radians(x));
    mat.multiply(rotMatrix);

    rotMatrix.makeRotationY(radians(y));
    mat.multiply(rotMatrix);

    rotMatrix.makeRotationZ(radians(z));
    mat.multiply(rotMatrix);

    if(idx > 0){
      const prevPosition = points[idx-1].position;

      (position.copy(prevPosition)).add(offset).multiplyScalar(twistiness);
      rotation = q.setFromRotationMatrix(mat);
    }
    //points[idx].identity();
    /*var m = points[idx].mat.clone();
    
    if(idx>0){
      m.multiply(points[idx-1].mat.clone()); 
    }

    var tm = new Matrix4();
    tm.makeTranslation(0,2,0);

    var rotMatrix  = new Matrix4();

    rotMatrix.makeRotationX(radians(x));
    m.multiply(rotMatrix);

    rotMatrix.makeRotationY(radians(y));
    m.multiply(rotMatrix);

    rotMatrix.makeRotationZ(radians(z));
    m.multiply(rotMatrix);

    m.multiply(tm);
    
    if(idx>0){
      points[idx].mat.copy(m);
      points[idx].rotation = q.setFromRotationMatrix(m);
    }*/

  }

  return {
    mesh,
    update: (t) => {

      if (prevT >= 1) return;
      prevT = t;
      const factor = 5 * (1 - t);
      let ptr = 0;

      frame+=.07;

      for (let p of points) {

        /*updatePos(ptr,
          (simplex3( ptr * SPREAD + frame / SPEED, 0, 0) ) * ANGLE,
          (simplex3( 0, ptr * SPREAD + frame / SPEED, 0) )  * ANGLE,
          (simplex3( 0, 0, ptr * SPREAD + frame / SPEED) ) * ANGLE
        );*/

        // position
        dummy.position.copy(p.position).multiplyScalar(clamp(1.5 - 0.05 * p.scale * factor, 0, 100));
        // scale
        dummy.scale.setScalar(clamp(p.scale * finalScale - factor, 0, 100));
        // rotation
        dummy.quaternion.copy(p.rotation);

        dummy.updateMatrix();
        mesh.setMatrixAt(ptr, dummy.matrix);

        ptr++;
      }

      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

export { createCurl };
