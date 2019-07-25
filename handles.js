import * as THREE from 'three'
import * as HELPER from './helpers.js'
import { Dimension } from './dimensions.js'

class Handles {
  constructor(){
    this.yOffset = 0;
    this.handleDims = Dimension.getHandles();
    this.housingDims = Dimension.getHousing();
  }

  init( props, om ){
    this.props = props;
    this.objMgr = om;

    // Create each handle depending on type.
    let code = this.props.handle.code.value.toLowerCase(),
        handleMesh;

    switch (code) {
      case 'mtbh':
          handleMesh = this.steelHandles(
            this.props,  this.objMgr.meshes.handles.steelL.clone(),
            this.objMgr.meshes.handles.steelR.clone()
          );
        break;
      case 'mhan':
          handleMesh = this.blackPlasticHandles(
            this.props,  this.objMgr.meshes.handles.blackPlastic.clone(),
            this.objMgr.meshes.handles.blackPlastic.clone(),
            this.objMgr.materialManager.materials.plasticBlack
          );
        break;
      case 'hsg-hndl':
          handleMesh = this.pushHandle(
            this.props,
            this.objMgr.materialManager.materials.tops.stainless
          );
        break;
      case 'sph':
          handleMesh = this.techSeriesHandle(
            this.props,
            this.objMgr.meshes.handles.techSeriesL.clone(),
            this.objMgr.meshes.handles.techSeriesR.clone(),
            this.objMgr.materialManager.materials.tops.stainless,
            this.objMgr.materialManager.materials.plasticBlack
          );
        break;
      default:
        break;
    }

    return handleMesh;
  }

  getYOffset(){
    return this.yOffset;
  }

  steelHandles(p,l,r) {
    const HANDLES = this.createTwoHandles(p,l,r),
          LEFT_HANDLE = HANDLES.getObjectByName('LEFT_HANDLE'),
          RIGHT_HANDLE = HANDLES.getObjectByName('RIGHT_HANDLE');

    let rightX = RIGHT_HANDLE.position.x;

    this.yOffset = this.handleDims.steel.yOffset;
    this.handleType = "allSides";

    LEFT_HANDLE.rotation.y = this.pos.rotation;
    LEFT_HANDLE.rotation.x = -Math.PI / 2;
    RIGHT_HANDLE.rotation.y = this.pos.rotation;
    RIGHT_HANDLE.rotation.x = -Math.PI / 2;
    RIGHT_HANDLE.position.setX( rightX - this.handleDims.steel.rightXAdjust); // Adjust for different origin point.

    this.getHandleSide( HANDLES );
    HANDLES.position.setY( this.yPos + this.yOffset);

    return HANDLES;
  }

  blackPlasticHandles(p,l,r,mbp) {
    const HANDLES = this.createTwoHandles(p,l,r),
          LEFT_HANDLE = HANDLES.getObjectByName('LEFT_HANDLE'),
          RIGHT_HANDLE = HANDLES.getObjectByName('RIGHT_HANDLE'),
          X_OFFSET = 110,
          Z_POS = this.pos.z;

    this.yOffset = this.handleDims.blackPlastic.yOffset;
    this.handleType = "frontSide";

    // Position handles for different width housings.
    let xPos = this.handleDims.blackPlastic.distanceApart.default/2; // Default for widest housings.
    // Decrease handle distance for 2 smallest widths.
    if (p.housingWidth < 700) {
      p.housingWidth < 500 ? xPos = this.handleDims.blackPlastic.distanceApart.smallest/2 : xPos = this.handleDims.blackPlastic.distanceApart.smaller/2;
    }

    // Initial rotation.
    LEFT_HANDLE.rotation.x = Math.PI / 2;
    RIGHT_HANDLE.rotation.x = Math.PI / 2;

    // Position.
    LEFT_HANDLE.position.set( -xPos, 0, Z_POS );
    RIGHT_HANDLE.position.set( xPos, 0, Z_POS );

    // Change materials.
    LEFT_HANDLE.traverse( m => m.material = mbp );
    RIGHT_HANDLE.traverse( m => m.material = mbp );

    HANDLES.position.setY( this.yPos + this.yOffset);
    return HANDLES;
  }

  pushHandle(p,m) {
    this.props = p;
    this.pos = this.getTwoHandlePosition();
    this.yOffset = this.handleDims.pushHandle.yOffset;

    const Z_OFFSET = this.handleDims.pushHandle.z,
          HANDLE_D = this.handleDims.pushHandle.handleD,
          X_POS = this.pos.x + this.handleDims.pushHandle.posX,
          Z_POS = this.pos.z - Z_OFFSET,
          CURVE = new THREE.CatmullRomCurve3([
            new THREE.Vector3( -X_POS, 0, -Z_POS ),
            new THREE.Vector3( -X_POS + HANDLE_D*.67, 0, -Z_POS ),
            new THREE.Vector3( -X_POS + HANDLE_D, 0, -Z_POS - HANDLE_D*.33 ),
            new THREE.Vector3( -X_POS + HANDLE_D, 0, -Z_POS - HANDLE_D*.67 ),
            new THREE.Vector3( -X_POS + HANDLE_D, 0, -Z_POS - HANDLE_D ),
          	new THREE.Vector3( -X_POS + HANDLE_D, 0, 0 ),
            new THREE.Vector3( -X_POS + HANDLE_D, 0, Z_POS + HANDLE_D ),
            new THREE.Vector3( -X_POS + HANDLE_D, 0, Z_POS + HANDLE_D*.67 ),
            new THREE.Vector3( -X_POS + HANDLE_D, 0, Z_POS + HANDLE_D*.33 ),
            new THREE.Vector3( -X_POS + HANDLE_D*.67, 0, Z_POS ),
            new THREE.Vector3( -X_POS, 0, Z_POS )
          ]),
          GEOM = new THREE.TubeBufferGeometry( CURVE, 64, 12, 8, false ),
          MESH = new THREE.Mesh( GEOM, m );

    this.handleType = "twoSides";

    MESH.castShadow = true;
    MESH.position.setY(this.yPos + this.yOffset);
    this.getHandleSide(MESH);

    return MESH;
  }

  techSeriesHandle(p,l,r,mSteel,blackPlasticMat) {
    const HANDLES = this.createTwoHandles(p,l,r),
          LEFT_HANDLE = HANDLES.getObjectByName('LEFT_HANDLE'),
          RIGHT_HANDLE = HANDLES.getObjectByName('RIGHT_HANDLE'),
          Z_OFFSET = this.handleDims.techSeries.zOffset,
          X_POS = this.pos.x + this.handleDims.techSeries.posX,
          Z_POS = this.pos.z - Z_OFFSET,
          BAR_D = this.handleDims.techSeries.barD,
          BAR_L = Z_POS*2,
          GEOM = new THREE.CylinderBufferGeometry( 14, 14, BAR_L, 8 ),
          BAR_MESH = new THREE.Mesh( GEOM, mSteel );

    this.yOffset = this.handleDims.techSeries.yOffset;
    this.handleType = "twoSides";

    // Initial rotation.
    LEFT_HANDLE.rotation.x = Math.PI / 2;
    RIGHT_HANDLE.rotation.x = Math.PI / 2;
    LEFT_HANDLE.rotation.z = Math.PI / 2;
    RIGHT_HANDLE.rotation.z = Math.PI / 2;
    BAR_MESH.rotation.x = Math.PI/2;

    // Position.
    LEFT_HANDLE.position.set( -X_POS, 0, -Z_POS );
    RIGHT_HANDLE.position.set( -X_POS, 0, Z_POS );
    BAR_MESH.position.set( -X_POS - BAR_D, this.handleDims.techSeries.barY, 0 );

    // Change materials.
    LEFT_HANDLE.traverse( m => m.material = blackPlasticMat );
    RIGHT_HANDLE.traverse( m => m.material = blackPlasticMat );

    // Set bar props.
    BAR_MESH.name = "tube";
    BAR_MESH.castShadow = true;

    HANDLES.add(BAR_MESH);
    HANDLES.position.setY(this.yPos + this.yOffset);

    this.getHandleSide(HANDLES);

    return HANDLES;
  }

  createTwoHandles(props, left, right){
    this.props = props;
    this.pos = this.getTwoHandlePosition();

    const HANDLES_WRAPPER = new THREE.Object3D(),
          LEFT_HANDLE = left,
          RIGHT_HANDLE = right;

    LEFT_HANDLE.position.set( -this.pos.x - this.handleDims.twoHandles.xOffset, 0, -this.pos.z )
    RIGHT_HANDLE.position.set( -this.pos.x + this.handleDims.twoHandles.xOffset, 0, this.pos.z )

    LEFT_HANDLE.traverse(function(m){
      if ( m instanceof THREE.Mesh ){
        m.castShadow = true;
      }
    })
    RIGHT_HANDLE.traverse(function(m){
      if ( m instanceof THREE.Mesh ){
        m.castShadow = true;
      }
    })

    HANDLES_WRAPPER.name = "handlesWrapper";
    LEFT_HANDLE.name = "LEFT_HANDLE";
    RIGHT_HANDLE.name = "RIGHT_HANDLE";
    HANDLES_WRAPPER.add(LEFT_HANDLE).add(RIGHT_HANDLE);

    return HANDLES_WRAPPER;
  }

  getTwoHandlePosition(){
    // Left side of the cabinet is default.
    this.yPos = this.props.housingPoints + this.housingDims.heightDiff;

    const SIDE_W = this.handleDims.twoHandles.sideW, // Arbitrary
          SIDE_X = this.props.housingWidth/2 - SIDE_W,
          FRONT_Z = this.props.housingDepth/2,
          TWO_HANDLE_POS = {
            rotation : 0,
            x : SIDE_X,
            y : 0,
            z : FRONT_Z
          };

    this.yOffset = TWO_HANDLE_POS.y;

    return TWO_HANDLE_POS;
  }

  getHandleSide(mesh, hPos){
    if ( hPos === undefined )
      hPos = this.props.handlePosition;

    this.handleSide = HELPER.convertHandleSide( hPos );

    if ( this.handleType === "frontSide" ) {
      mesh.rotation.y = 0;
    } else {
      if ( this.handleSide === 2 ) { // Right side.
        mesh.rotation.y = Math.PI;
      } else if ( this.handleSide === 3 ) {  // Front.
        mesh.rotation.y = Math.PI / 2;
      } else {
        mesh.rotation.y = 0; // Left side is default.
      }
    }

    if ( this.handleType === "allSides" ) {
      const LEFT_HANDLE = mesh.getObjectByName('LEFT_HANDLE'),
            RIGHT_HANDLE = mesh.getObjectByName('RIGHT_HANDLE');

      if ( this.handleSide === 3 ) {
        LEFT_HANDLE.position.setX( -this.pos.z );
        RIGHT_HANDLE.position.setX( -this.pos.z );
        LEFT_HANDLE.position.setZ( -this.pos.x - this.handleDims.sideOffset );
        RIGHT_HANDLE.position.setZ( this.pos.x + this.handleDims.sideOffset );
      } else {
        LEFT_HANDLE.position.setX( -this.pos.x - this.handleDims.sideOffset );
        RIGHT_HANDLE.position.setX( -this.pos.x - this.handleDims.sideOffset );
        LEFT_HANDLE.position.setZ( -this.pos.z );
        RIGHT_HANDLE.position.setZ( this.pos.z );
      }
    }

  }

}

export let Handle = new Handles();
