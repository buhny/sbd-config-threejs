import * as THREE from 'three'
import * as HELPER from '../helpers.js'
import { Dimension } from '../dimensions.js'
import { Pull } from './pulls.js'

export class Tray {
  constructor(space, om, mats, loaded){
    this.matFront = om.materialManager.materials.metalPaintedInt;
    this.matBtm = om.materialManager.materials.tops.stainless;
    this.objMgr = om;
    // this.loaded = loaded;
    // this.frontW = space.intWidth;
    // this.height = space.height;
    this.intWidth = space.intWidth;
    this.intDepth = space.intDepth;
    // this.matGray = new THREE.MeshPhongMaterial();
    // this.matGray.color.setHex(0xC0C0C0);
    this.dims = Dimension.getTrays();

    return this.createTray();
  }

  createTray() {
    let meshesGrp = new THREE.Group();

    meshesGrp.name = "tray";
    meshesGrp.add( this.createBasket() ).add( this.createFace() ).add( this.positionPull() );

    return meshesGrp;
  }

  createBasket() {
    // Create the 3 retaining walls of the basket.
    const backG = new THREE.BoxGeometry( this.intWidth, this.dims.sidewallH, this.dims.sidewallW ),
          sideG = new THREE.BoxGeometry( this.dims.sidewallW, this.dims.sidewallH, this.intDepth ),
          basketBack = new THREE.Mesh( backG ),
          basketRight = new THREE.Mesh( sideG ),
          basketLeft = new THREE.Mesh( sideG );

    let basketGrp = new THREE.Group,
        meshes = [],
        basketWalls;

    basketBack.position.set( 0, this.dims.sidewallH/2, -(this.intDepth/2 - this.dims.sidewallW/2) );
    basketRight.position.set( this.intWidth/2 - this.dims.sidewallW/2, this.dims.sidewallH/2, 0 );
    basketLeft.position.set( -(this.intWidth/2 - this.dims.sidewallW/2), this.dims.sidewallH/2, 0 );

    meshes.push( basketBack, basketRight, basketLeft );
    basketWalls = new THREE.Mesh( HELPER.mergeMeshes( meshes ), this.matFront );
    basketWalls.name = "trayWalls";
    basketWalls.castShadow = true;
    basketWalls.receiveShadow = true;


    // Create the 3 plates that make up the bottom of the tray basekt.
    // Beveling the plates creates seams.
    let btmShape = new THREE.Shape(),
        btmMeshes = [],
        basketBtm;

    btmShape.moveTo( 0, 0 );
    btmShape.lineTo( 0, this.intDepth/3 - this.dims.bottomGap );
    btmShape.lineTo( this.intWidth - this.dims.sidewallW*2, this.intDepth/3 );
    btmShape.lineTo( this.intWidth - this.dims.sidewallW*2, 0 );
    btmShape.lineTo( 0, 0 );

    const btmExtrude = {
            steps: 1,
            amount: 5,
            bevelEnabled: true,
            bevelThickness  : 2,
            bevelSize       : 2,
            bevelSegments   : 1
          },
          btmShapeG = new THREE.ExtrudeGeometry ( btmShape, btmExtrude ),
          btmBack = new THREE.Mesh( btmShapeG ),
          btmMid = new THREE.Mesh( btmShapeG ),
          btmFront = new THREE.Mesh( btmShapeG );

    btmBack.rotation.x = Math.PI/2;
    btmMid.rotation.x = Math.PI/2;
    btmFront.rotation.x = Math.PI/2;
    btmBack.position.set( -this.intWidth/2 + this.dims.sidewallW, 0, -(this.intDepth/2) );
    btmMid.position.set( -this.intWidth/2 + this.dims.sidewallW, 0,  -(this.intDepth/3)/2 );
    btmFront.position.set( -this.intWidth/2 + this.dims.sidewallW, 0, this.intDepth/2 - (this.intDepth/3) );

    btmMeshes.push( btmBack, btmMid, btmFront );
    basketBtm = new THREE.Mesh( HELPER.mergeMeshes( btmMeshes ), this.matBtm ); // TODO: replace with stainless steel material that can take shadows
    basketBtm.name = "trayBtm";
    basketBtm.castShadow = true;
    basketBtm.receiveShadow = true;

    basketGrp.name = "trayBasket";
    basketGrp.add( basketWalls ).add( basketBtm );

    return basketGrp;
  }

  createFace() {
    const flangeDims = Dimension.getDrawers().flange;

    let faceMeshes = [],
        flangeShape = new THREE.Shape(),
        face;

    // Start with flange on bottom of face.
    flangeShape.moveTo( 0, 0 );
    flangeShape.lineTo( 0, flangeDims.long );
    flangeShape.lineTo( flangeDims.long - flangeDims.shortDiff, 0 );
    flangeShape.lineTo( 0, 0 );

    const faceGeom = new THREE.BoxGeometry(this.intWidth, this.dims.faceH, this.dims.faceD),
          faceMesh = new THREE.Mesh( faceGeom ),
          extrudeSettings = {
            steps: 1,
            amount: this.intWidth,
            bevelEnabled: false
          },
          flangeG = new THREE.ExtrudeGeometry ( flangeShape, extrudeSettings ),
          flangeM = new THREE.Mesh( flangeG );

    faceMesh.position.set( 0, -this.dims.faceH/2 - this.dims.faceOffset, this.intDepth/2 + this.dims.faceD/2 );
    flangeM.rotation.y = -Math.PI / 2;
    flangeM.position.set( this.intWidth/2, -this.dims.faceH - this.dims.faceOffset, this.intDepth/2 + this.dims.faceD );

    // Create tray face mesh by merging meshes & adding material
    faceMeshes.push( faceMesh, flangeM );
    face = new THREE.Mesh( HELPER.mergeMeshes( faceMeshes ), this.matFront );
    face.name = "trayFace";
    face.castShadow = true;
    face.receiveShadow = true;

    return face;
  }

  positionPull(){
    const pull = new Pull( this.intWidth, this.objMgr ),
          pullBB = new THREE.Box3().setFromObject( pull ),
          pullH = pullBB.max.y + Math.abs( pullBB.min.y );

    pull.position.setY( -pullH/2 + this.dims.bottomH/2 );
    pull.position.setZ( this.intDepth/2 + this.dims.faceD/2 + Math.floor( pullBB.max.z/2 ) );

    return pull;
  }
}
