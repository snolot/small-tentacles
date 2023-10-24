import * as THREE from '../libs/build/three.module.js';
import {createCurl} from './createCurl.js';

const Creature = (scene) => {
	const fns = [createCurl];
	let t = 0;
	let _mesh, _update;

	const randomize = () => {
	  if (_mesh) {
	    scene.remove(scene.getObjectByName('creature'));
	    _mesh.geometry.dispose();
	  }

	  const fn = fns[Math.floor(Math.random() * fns.length)];
	  const res = fn();
	  
	  _mesh = res.mesh;
	  _mesh.name = 'creature'
	  _update = res.update;
	  scene.add(_mesh);
	  _mesh.castShadow = _mesh.receiveShadow = true;
	  //_mesh.frustrumCulled = false;
	  t = 0;
	}

	const update = (dt) => {
		_update(dt);
	}

	randomize();

	const base = {
		update,
		randomize,
	};

	Object.defineProperty(base, 'mesh', {
		get:() => _mesh,
	});

	return base;
};

export { Creature };