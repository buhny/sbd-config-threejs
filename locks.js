import * as THREE from 'three'
import * as HELPER from './helpers.js'
import { Dimension } from './dimensions.js'

export class Locks {
  constructor( ){
    this.lockDims = Dimension.getLocks();
  }

  cylinder( om, l ){
    this.cylinderL = l !== undefined ? l : this.lockDims.cylinder.length;

    const faceG = new THREE.CircleBufferGeometry( this.lockDims.cylinder.diameter/2, this.lockDims.cylinder.radiusSegs ),
          face = new THREE.Mesh( faceG, om.materialManager.materials.lockFace ),
          coreG = new THREE.CylinderBufferGeometry( this.lockDims.cylinder.diameter/2, this.lockDims.cylinder.diameter/2, this.cylinderL, this.lockDims.cylinder.radiusSegs ),
          core = new THREE.Mesh( coreG, om.materialManager.materials.accessories );

    core.rotation.x = Math.PI / 2;
    core.rotation.y = Math.PI / 2;
    core.name = 'core';
    core.castShadow = true;
    face.position.setZ(this.cylinderL/2 + 0.05);
    face.name = 'face';

    let cylinderLock = new THREE.Group();
    cylinderLock.name = "cylinderLock";
    cylinderLock.add( core ).add( face );

    return cylinderLock;
  }

  getCylinderLength() {
    return this.cylinderL;
  }

  // TODO: remove this from usage, switch to cylinder.
  standardLong( face, length ){
    // console.log('REPLACE THIS LOCK');
    let lockGeom = new THREE.CylinderGeometry( this.lockDims.cylinder.diameter/2, this.lockDims.cylinder.diameter/2, length, this.lockDims.cylinder.radiusSegs ),
        lockMesh = new THREE.Mesh( lockGeom, face );

    lockMesh.rotation.x = Math.PI / 2;
    lockMesh.rotation.y = Math.PI / 2;
    lockMesh.castShadow = true;
    lockMesh.name = "standardlongLock";

    return lockMesh;
  }

  hasp( obj ){
    let hasp = obj.meshes.lockHasp;

    hasp.name = "haspLock";
    hasp.rotation.x = Math.PI/2;
    hasp.rotation.y = Math.PI;
    hasp.traverse( m => m.material = obj.materialManager.materials.accessories );

    // Add shadows.
    hasp.traverse(function(m){
      if ( m instanceof THREE.Mesh ){
        m.castShadow = true;
      }
    })

    return hasp;
  }

  keypad( obj, orientation ){
    orientation === null ? 'horiz' : orientation;

    let keypad = obj.meshes.lockKeypadH;
    keypad.name = "keypadLock";
    keypad.traverse( m => m.material = obj.materialManager.materials.lockKeypad );

    // Add shadows.
    keypad.traverse( m => {
      if ( m instanceof THREE.Mesh ){
        m.castShadow = true;
        m.material.needsUpdate = true;
      }
    })

    return keypad;
  }

  lilo() {
    let liloGrp = new THREE.Group,
        tangCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3( 0, 0, 0 ),
          new THREE.Vector3( 0, this.lockDims.lilo.tangH*0.25, 0 ),
          new THREE.Vector3( 0, this.lockDims.lilo.tangH*0.75, 0 ),
          new THREE.Vector3( this.lockDims.lilo.tangW*0.25, this.lockDims.lilo.tangH*0.95, 0 ),
          new THREE.Vector3( this.lockDims.lilo.tangW*0.95, this.lockDims.lilo.tangH, 0 ),
          new THREE.Vector3( this.lockDims.lilo.tangW, this.lockDims.lilo.tangH, 0 )
        ]),
        tangG = new THREE.TubeBufferGeometry( tangCurve, 8, this.lockDims.lilo.tangR, 8, false ),
        tangMat = new THREE.MeshPhongMaterial( {
          color: 0x8d8d8d,
          specular: 0x050505,
          shininess: 100 } ),
        tangM = new THREE.Mesh( tangG, tangMat ),
        coverCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3( 0, this.lockDims.lilo.coverL*0.5, 0 ),
          new THREE.Vector3( this.lockDims.lilo.coverL*0.05, -this.lockDims.lilo.coverL*0.05, 0 ),
          new THREE.Vector3( this.lockDims.lilo.coverL*0.5, -this.lockDims.lilo.coverL*0.5, 0 )
        ]),
        coverG = new THREE.TubeBufferGeometry( coverCurve, 8, this.lockDims.lilo.coverR, 8, false ),
        coverMat = new THREE.MeshPhongMaterial( {
          color : 0xff0000,
          specular: 0x050505,
          shininess: 100 } ),
        coverM = new THREE.Mesh( coverG, coverMat ),
        endM = new THREE.Mesh( new THREE.SphereBufferGeometry( this.lockDims.lilo.coverR, 12, 12 ), coverMat );

    // tangM.position.set( 0, 0, 500 );
    tangM.rotation.y = Math.PI/2;
    tangM.castShadow = true;
    coverM.position.setY( -5 );
    coverM.castShadow = true;
    endM.position.set( this.lockDims.lilo.coverL/2, -this.lockDims.lilo.coverL/2 - 5, 0 );
    endM.castShadow = true;

    liloGrp.add( tangM ).add( coverM ).add( endM );

    return liloGrp;
  }

  lockBar( h, m ) {
    // Draw the shapes in 2D, add holes for the cut-outs, then extrude.
    const barExtrudeSettings = { amount : this.lockDims.lockBar.depth, bevelEnabled : false },
          tangExtrudeSettings = { amount : this.lockDims.lockBar.tangW, bevelEnabled : false };

    let barShape = new THREE.Shape(),
        barHole = new THREE.Path(),
        tangShape = new THREE.Shape();

    barShape.moveTo( 0, 0 );
    barShape.lineTo( this.lockDims.lockBar.width, 0 );
    barShape.lineTo( this.lockDims.lockBar.width, -h );
    barShape.lineTo( 0, -h );
    barShape.lineTo( 0, 0 );

    // Define holes counter-clockwise.
    barHole.moveTo( this.lockDims.lockBar.holeWOffset, -h/2 + this.lockDims.lockBar.holeH/2 );
    barHole.lineTo( this.lockDims.lockBar.holeWOffset, -h/2 - this.lockDims.lockBar.holeH/2 );
    barHole.lineTo( this.lockDims.lockBar.width - this.lockDims.lockBar.holeWOffset, -h/2 - this.lockDims.lockBar.holeH/2 );
    barHole.lineTo( this.lockDims.lockBar.width - this.lockDims.lockBar.holeWOffset, -h/2 + this.lockDims.lockBar.holeH/2 );
    barHole.lineTo( this.lockDims.lockBar.holeWOffset, -h/2 + this.lockDims.lockBar.holeH/2 );

    barShape.holes.push( barHole );

    tangShape.moveTo( 0 , 0 );
    tangShape.lineTo( 0, this.lockDims.lockBar.tangH/4 );
    tangShape.lineTo( this.lockDims.lockBar.depth + this.lockDims.lockBar.tangD/4, this.lockDims.lockBar.tangH/4 );
    tangShape.quadraticCurveTo(
      this.lockDims.lockBar.depth + (this.lockDims.lockBar.tangD/4)*3,
      (this.lockDims.lockBar.tangH/4),
      this.lockDims.lockBar.depth + (this.lockDims.lockBar.tangD/4)*3,
      this.lockDims.lockBar.tangH/2);
    tangShape.quadraticCurveTo(
      this.lockDims.lockBar.depth + (this.lockDims.lockBar.tangD/4)*3,
      (this.lockDims.lockBar.tangH/4)*3,
      this.lockDims.lockBar.depth + this.lockDims.lockBar.tangD/4,
      (this.lockDims.lockBar.tangH/4)*3);
    tangShape.lineTo( 0, (this.lockDims.lockBar.tangH/4)*3 );
    tangShape.lineTo( 0, this.lockDims.lockBar.tangH );
    tangShape.lineTo( this.lockDims.lockBar.depth + this.lockDims.lockBar.tangD/4, this.lockDims.lockBar.tangH );
    tangShape.lineTo( this.lockDims.lockBar.depth + this.lockDims.lockBar.tangD, (this.lockDims.lockBar.tangH/4)*3 );
    tangShape.lineTo( this.lockDims.lockBar.depth + this.lockDims.lockBar.tangD, this.lockDims.lockBar.tangH/4 );
    tangShape.lineTo( this.lockDims.lockBar.depth + this.lockDims.lockBar.tangD/4, 0 );
    tangShape.lineTo( 0, 0 );

    const barG = new THREE.ExtrudeGeometry( barShape, barExtrudeSettings ),
          barM = new THREE.Mesh( barG, m ),
          tangG = new THREE.ExtrudeGeometry( tangShape, tangExtrudeSettings ),
          tangM = new THREE.Mesh( tangG, m );

    barM.castShadow = true;
    barM.name = "lockBar";
    tangM.castShadow = true;
    tangM.name = "lockTang";
    tangM.rotation.y = -Math.PI/2;
    tangM.position.set(this.lockDims.lockBar.width/2, -h/2 - this.lockDims.lockBar.tangH/2, 0 );

    let lockBar = new THREE.Group;
    lockBar.name = "lockbarGrp";
    lockBar.add( barM ).add( tangM );

    return lockBar;
  }

}
