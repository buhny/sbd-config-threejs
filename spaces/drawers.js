import * as THREE from 'three'
import * as HELPER from '../helpers.js'
import { Dimension } from '../dimensions.js'
import { Pull } from './pulls.js'
import { Locks } from '../locks.js'

export class Drawer {
  constructor( settings, om ){
    this.objMgr = om;
    this.drawerDims = Dimension.getDrawers();
    this.latch = settings.latch;

    // Slight flare at bottom of drawer.
    const triangleSide = this.drawerDims.flange.long,
          triangleShortSide = triangleSide - this.drawerDims.flange.shortDiff;

    this.triangleShape = new THREE.Shape();
    this.triangleShape.moveTo( 0, 0 );
    this.triangleShape.lineTo( 0, triangleSide );
    this.triangleShape.lineTo( triangleShortSide, 0 );
    this.triangleShape.lineTo( 0, 0 );

    this.drawer = this.createDrawer( settings, this.objMgr.materialManager.materials.metalPaintedInt );

    return this.drawer;
  }

  createDrawer( settings, mat ) {
    this.wallThickness = this.drawerDims.wallThickness;
    this.height = settings.height;
    this.usableH = settings.usableHeight;
    this.extWidth = settings.intWidth;
    this.intWidth = this.extWidth - (this.wallThickness*2 + this.drawerDims.widthOffset);
    this.intDepth = settings.intDepth;
    this.extDepth = this.intDepth + this.wallThickness;
    this.matPainted = mat;
    this.matUnpainted = new THREE.MeshPhongMaterial();
    this.matUnpainted.color.setHex(0xC0C0C0);

    let drawerGroup = new THREE.Group();
    drawerGroup.name = "drawer";

    // Add required parts to drawer.
    drawerGroup.add( this.createDrawerBody() ).add( this.positionPull() );
    // Add optional parts to drawer. (LILO, Security Panel Lock)
    if ( this.latch === 'lilo' )
      drawerGroup.add( this.getLILO() );

    return drawerGroup;
  }

  changeColor(color){
    // TODO
  }

  getLILO() {
    const lockDims = Dimension.getLocks(),
          lilo = new Locks().lilo();

    lilo.position.setX( this.intWidth/2 - lockDims.lilo.xOffset );
    lilo.position.setY( -this.height/2 + lockDims.lilo.yOffset );
    lilo.position.setZ( this.extDepth/2 + lockDims.lilo.tangW );

    return lilo;
  }

  createDrawerBody(){
    let drawerFaceMeshes = [],
        drawerBodyMeshes = [],
        drawerBody = new THREE.Group();

    // Drawer basket is initial/centered position. Other parts are based on its dimensions.
    // Create drawer basket.
    const sideGeom = new THREE.BoxGeometry(this.wallThickness, this.usableH, this.intDepth),
          backGeom = new THREE.BoxGeometry(this.intWidth, this.usableH, this.wallThickness),
          bottomGeom = new THREE.BoxGeometry(this.intWidth, this.wallThickness, this.intDepth),
          basketBack = new THREE.Mesh( backGeom ),
          basketFront = new THREE.Mesh( backGeom ),
          basketBtm = new THREE.Mesh( bottomGeom ),
          basketRight = new THREE.Mesh( sideGeom ),
          basketLeft = new THREE.Mesh( sideGeom ),
          usableHOffset = this.height - this.usableH;

    basketBack.position.set( 0, usableHOffset/2, -this.intDepth/2 + this.wallThickness/2 );
    basketFront.position.set( 0, usableHOffset/2, this.intDepth/2 - this.wallThickness/2 );
    basketBtm.position.setY( -this.usableH/2 + usableHOffset/2 );
    basketRight.position.set( this.intWidth/2 + this.wallThickness/2, usableHOffset/2, 0 );
    basketLeft.position.set( -this.intWidth/2 - this.wallThickness/2, usableHOffset/2, 0 );

    drawerBodyMeshes.push( basketBack, basketFront, basketBtm, basketRight, basketLeft );

    // Create drawer by merging meshes & adding material
    const basketMesh = new THREE.Mesh( HELPER.mergeMeshes( drawerBodyMeshes ), this.matUnpainted );
    basketMesh.castShadow = true;
    basketMesh.receiveShadow = true;
    basketMesh.name = "drawer basket";

    // Create drawer face.
    const drawerFaceGeom = new THREE.BoxGeometry(this.extWidth, this.height, this.wallThickness),
        drawerFace = new THREE.Mesh( drawerFaceGeom );

    drawerFace.position.setZ( this.intDepth/2 + this.wallThickness/2);

    // Create bottom flange.
    const extrudeSettings = {
            steps: 1,
            amount: this.extWidth,
            bevelEnabled: false
          },
          triangleGeom = new THREE.ExtrudeGeometry( this.triangleShape, extrudeSettings ),
          bottomFlare = new THREE.Mesh( triangleGeom );

    bottomFlare.rotation.y = -Math.PI / 2;
    bottomFlare.position.x = this.extWidth/2;
    bottomFlare.position.y = -this.height/2;
    bottomFlare.position.z = this.extDepth/2 + this.wallThickness/2;
    drawerFaceMeshes.push( drawerFace, bottomFlare );

    // Create drawer face mesh by merging meshes & adding material
    const faceMesh = new THREE.Mesh( HELPER.mergeMeshes( drawerFaceMeshes ), this.matPainted );

    faceMesh.castShadow = true;
    faceMesh.receiveShadow = true;
    faceMesh.name = "drawer face";

    drawerBody.add( faceMesh ).add( basketMesh );
    drawerBody.name = "drawer body";

    return drawerBody;
  }

  positionPull(){
    const pull = new Pull( this.extWidth, this.objMgr ),
          pullBB = new THREE.Box3().setFromObject( pull ),
          pullH = pullBB.max.y + Math.abs( pullBB.min.y );

    pull.position.setY( this.height/2 - pullH/2 );
    pull.position.setZ( this.extDepth/2 + Math.floor( pullBB.max.z/2 ) );

    return pull;
  }

}
