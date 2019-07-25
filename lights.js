import * as THREE from 'three'
import * as HELPER from './helpers.js'

class Lights {
  constructor(){

  }

  letThereBe() {
    const SPOTLIGHT = {
      angle : Math.PI/5,
      color : 0xfffff5,
      decay : 1.6,
      distance : 3000,
      intensity : 0.85,
      penumbra : 0.17,
      pos : {
        x : 1500,
        y : 1800,
        z : 800
      },
      shadow: {
        bias: 0.0001,
        far: 3200,
        mapSize : 2048,
        near : 1100
      }
    }

    const light1 = new THREE.SpotLight( SPOTLIGHT.color, SPOTLIGHT.intensity, SPOTLIGHT.distance, SPOTLIGHT.angle, SPOTLIGHT.penumbra, SPOTLIGHT.decay );
    light1.name = "spotLightRight"
    light1.position.set( SPOTLIGHT.pos.x, SPOTLIGHT.pos.y, SPOTLIGHT.pos.z );
    // light1.castShadow = true;
    // light1.shadow.mapSize.width = SPOTLIGHT.shadow.mapSize;
    // light1.shadow.mapSize.height = SPOTLIGHT.shadow.mapSize;
    // light1.shadow.camera.near = SPOTLIGHT.shadow.near;
    // light1.shadow.camera.far = SPOTLIGHT.shadow.far;
    // light1.shadow.bias = SPOTLIGHT.shadow.bias;
    scene.add( light1 );
    // let lightHelper1 = new THREE.SpotLightHelper( light1, 0xff0000 );
    // scene.add( lightHelper1 );
    // let spotShadowHelper1 = new THREE.CameraHelper( light1.shadow.camera );
    // scene.add( spotShadowHelper1 );

    const light2 = new THREE.SpotLight( SPOTLIGHT.color, SPOTLIGHT.intensity, SPOTLIGHT.distance, -SPOTLIGHT.angle, SPOTLIGHT.penumbra, SPOTLIGHT.decay );
    light2.name = "spotLightLeft"
    light2.position.set( -SPOTLIGHT.pos.x, SPOTLIGHT.pos.y, SPOTLIGHT.pos.z );
    // light2.castShadow = true;
    // light2.shadow.mapSize.width = SPOTLIGHT.shadow.mapSize;
    // light2.shadow.mapSize.height = SPOTLIGHT.shadow.mapSize;
    // light2.shadow.camera.near = SPOTLIGHT.shadow.near;
    // light2.shadow.camera.far = SPOTLIGHT.shadow.far;
    // light2.shadow.bias = SPOTLIGHT.shadow.bias;
    scene.add( light2 );
    // let lightHelper2 = new THREE.SpotLightHelper( light2, 0x00ff00 );
    // scene.add( lightHelper2 );
    // let spotShadowHelper2 = new THREE.CameraHelper( light2.shadow.camera );
    // scene.add( spotShadowHelper2 );

    const light3 = new THREE.DirectionalLight( 0xfffff5, 0.47 );
    light3.name = 'directionalLight';
    light3.position.set( 0, 2000, 850 );
    light3.castShadow = true;
    light3.shadow.camera.near = 800;
    light3.shadow.camera.far = 2600;
    light3.shadow.camera.left = -800;
    light3.shadow.camera.right = 800;
    light3.shadow.camera.top = 800;
    light3.shadow.camera.bottom = -400;
    light3.shadow.mapSize.width = SPOTLIGHT.shadow.mapSize;
    light3.shadow.mapSize.height = SPOTLIGHT.shadow.mapSize;
    light3.shadow.bias = SPOTLIGHT.shadow.bias;
    scene.add( light3 );
    // let dirLightShadowHelper = new THREE.CameraHelper( light3.shadow.camera );
    // scene.add( dirLightShadowHelper );

    const hemiLight = new THREE.HemisphereLight( 0xF0F8FF, 0xD5D5D0, 0.75 );
    hemiLight.name = 'hemisphereLight';
    scene.add( hemiLight );

    // const ambLight = new THREE.AmbientLight( 0xffffff, 0.10 );
    // ambLight.name = 'ambient light'
    // scene.add( ambLight );
  }
}
export let Light = new Lights();
