import * as THREE from 'three'
import * as HELPER from './helpers.js'
import { Dimension } from './dimensions.js'
import { Locks } from './locks.js'
import { Door } from './spaces/doors.js'

class Housings {
  constructor(){
    this.housing = Dimension.getHousing();

    // Bevel shape for housing sides.
    this.triangleSide = this.housing.sides.bevelSide;
    this.triangleShape = new THREE.Shape();
    this.triangleShape.moveTo( 0, 0 );
    this.triangleShape.lineTo( 0, this.triangleSide );
    this.triangleShape.lineTo( this.triangleSide, 0 );
    this.triangleShape.lineTo( 0, 0 );

    // Badges.
    this.logo = this.housing.badges.logo;
    this.miUSA = this.housing.badges.miUSA;

    // Housing lock (having one is standard).
    this.lock = new Locks();
  }

  init( om, props ) {
    // Create Housing.
    this.objMgr = om;
    this.MaterialMgr = this.objMgr.materialManager.materials;
    this.housing.material = this.MaterialMgr.metalPaintedExt;
    this.setColor( props.colorExt );
    this.housing.shadowMat = this.MaterialMgr.floorShadow;

    // Create badges.
    const logoFaceMat = this.MaterialMgr.logoFace,
          // logoGeom = new THREE.BoxGeometry( this.logo.width, this.logo.height, this.logo.thickness ),
          logoGeom = new THREE.PlaneBufferGeometry( this.logo.width, this.housing.badges.height ),
          miUSAFaceMat = this.MaterialMgr.miUSAFace,
          // miUSAGeom = new THREE.BoxGeometry( this.miUSA.width, this.miUSA.height, this.miUSA.thickness );
          miUSAGeom = new THREE.PlaneBufferGeometry( this.miUSA.width, this.housing.badges.height );

    this.logo.mesh = new THREE.Mesh( logoGeom, logoFaceMat );
    this.logo.mesh.name = "logoBadge";
    this.miUSA.mesh = new THREE.Mesh( miUSAGeom, miUSAFaceMat );
    this.miUSA.mesh.name = "miUSABadge";

    return this.createHousing(props);
  }

  createHousing(props) {
    this.props = props;
    this.housing.width = props.housingWidth;
    this.housing.depth = props.housingDepth;
    this.housing.height = props.housingPoints + this.housing.heightDiff;

    // Create geom & meshes for all the sides for later merging.
    const sideGeom = new THREE.BoxGeometry( this.housing.depth - this.housing.sides.inset*2, this.housing.height - this.housing.sides.heightOffset, this.housing.sides.width ),
          backGeom = new THREE.BoxGeometry( this.housing.width - this.housing.sides.inset*2, this.housing.height - this.housing.sides.heightOffset, this.housing.wallThickness ),
          topGeom = new THREE.BoxGeometry( this.housing.width, this.housing.depth, this.housing.ceilingH ),
          bottomGeom = new THREE.BoxGeometry( this.housing.width, this.housing.depth, this.housing.floorH ),
          housingBtm = new THREE.Mesh( bottomGeom ),
          housingBack = new THREE.Mesh( backGeom ),
          housingTop = new THREE.Mesh( topGeom ),
          housingRight = new THREE.Mesh( sideGeom ),
          housingLeft = new THREE.Mesh( sideGeom ),
          extrudeSettings = {
            steps: 1,
            amount: this.housing.height - this.housing.sides.heightOffset,
            bevelEnabled: false
          },
          triangleGeom = new THREE.ExtrudeGeometry( this.triangleShape, extrudeSettings ),
          bevelRight = new THREE.Mesh( triangleGeom ),
          bevelLeft = new THREE.Mesh( triangleGeom );

    let housingMeshes = [],
        housingGrp = new THREE.Group();

    housingGrp.name = "housingGroup";

    // Position all the sides and add them to the meshes array.
    housingBtm.rotation.x = -Math.PI/2;
    housingBtm.position.set(0, this.housing.floorH/2, 0);

    housingBack.position.set(0, this.housing.height/2, -(this.housing.depth/2 - this.housing.wallThickness/2 - this.housing.sides.inset ));

    housingTop.rotation.x = Math.PI/2;
    housingTop.position.set(0, this.housing.height - this.housing.ceilingH/2, 0);

    housingRight.rotation.y = Math.PI/2;
    housingRight.position.set( (this.housing.width/2 - this.housing.sides.width/2 - this.housing.sides.inset ), this.housing.height/2, 0);

    housingLeft.rotation.y = -Math.PI/2;
    housingLeft.position.set( -(this.housing.width/2 - this.housing.sides.width/2 - this.housing.sides.inset ), this.housing.height/2, 0);

    bevelLeft.rotation.x = Math.PI/2;
    bevelLeft.position.set( -(this.housing.width/2 - this.housing.sides.width - this.housing.sides.inset ), this.housing.height - this.housing.sides.heightOffset/2, (this.housing.depth/2 - this.triangleSide - this.housing.sides.inset) );

    bevelRight.rotation.x = Math.PI/2;
    bevelRight.rotation.z = Math.PI/2;
    bevelRight.position.set( (this.housing.width/2 - this.housing.sides.width - this.housing.sides.inset ), this.housing.height - this.housing.sides.heightOffset/2, this.housing.depth/2 - this.triangleSide - this.housing.sides.inset );

    housingMeshes.push( housingBtm, housingBack, housingTop, housingRight, housingLeft, bevelLeft, bevelRight );

    // Create housing by merging meshes & adding material
    this.housing.mesh = new THREE.Mesh(
      HELPER.mergeMeshes( housingMeshes ),
      this.housing.material
    );
    this.housing.mesh.castShadow = true;
    this.housing.mesh.receiveShadow = true;
    this.housing.mesh.name = "housing";

    // Badge positioning.
    let securityCode = props.security !== undefined ? props.security.code.value : null;
    this.positionBadges( securityCode );

    // Update the housing group.
    housingGrp.add( this.housing.mesh ).add( this.logo.mesh ).add( this.miUSA.mesh );

    // Housing lock.
    // Create lock.
    this.lockMesh = this.createLock( this.props.housingLock );

    if ( this.lockMesh ) {
      this.positionLock( housingGrp, this.lockMesh, this.props.housingLock );
    }

    return housingGrp;
  } // END init()

  createLock( code ) {
    let lockMesh;

    if ( code === 'rg' ) {
      lockMesh = this.lock.cylinder( this.objMgr );
      lockMesh.name = "housingLock";
    } else if ( code === 'kp') {
      lockMesh = this.lock.keypad( this.objMgr );
      lockMesh.name = "housingLock";
    } else {
      lockMesh = undefined;
    }

    return lockMesh;
  }

  positionLock( grp, mesh, code ){
    // OPTIONAL TODO: housing lock is optional & can sometimes be set to the bottom (sliding Doors)

    let lockX = 0,
        lockY = this.housing.badges.y,
        lockZ = this.housing.depth/2;

    if ( code === 'rg' ) {
      lockZ += this.lock.getCylinderLength()/2;
    } else if ( code === 'kp' ) {
      lockZ += 10;
    }

    mesh.position.set( lockX, lockY, lockZ );
    grp.add( mesh )
  }

  housingShadow(w, d, m){
    let housingShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(w*2.2, d*2.1),
      m
    )
    housingShadow.rotateX(-(Math.PI / 2));
    housingShadow.name = "housingShadow";

    return housingShadow;
  }

  setColor( color ){
    this.housing.material.color.setHex( parseInt( color, 16) );
  }

  moveLogosForHandles( side, code ){
    this.handleCode = code;

    if ( side !== null ) {
      if ( side === 0 && this.handleCode === 'mtbh' ) {
        this.logo.x = -(this.housing.width/2 - this.housing.badges.xOffset*2);
        this.miUSA.x = (this.housing.width/2 - this.housing.badges.xOffset);
      } else if ( side === 3 ) {
        this.logo.x = -(this.housing.width/2 - this.housing.badges.xOffset*2);
        this.miUSA.x = (this.housing.width/2 - this.housing.badges.xOffset*2);
      } else if ( side === 2 && this.handleCode === 'mtbh' ){
        this.logo.x = -(this.housing.width/2 - this.housing.badges.xOffset);
        this.miUSA.x = (this.housing.width/2 - this.housing.badges.xOffset*2);
      } else {
        this.logo.x = -(this.housing.width/2 - this.housing.badges.xOffset);
        this.miUSA.x = (this.housing.width/2 - this.housing.badges.xOffset);
      }
    } else {
      this.logo.x = -(this.housing.width/2 - this.housing.badges.xOffset);
      this.miUSA.x = (this.housing.width/2 - this.housing.badges.xOffset);
    }

    this.logo.mesh.position.setX( this.logo.x );
    this.miUSA.mesh.position.setX( this.miUSA.x );
  }

  positionBadges( code, amt ){
    amt === null || undefined ? amt = 0 : amt;

    this.housing.badges.y = this.housing.height - this.housing.ceilingH/2;
    this.logo.x = -(this.housing.width/2 - this.housing.badges.xOffset);
    this.miUSA.x = (this.housing.width/2 - this.housing.badges.xOffset);

    if ( this.props.handle.code.value !== "none") {
      let side = HELPER.convertHandleSide(this.props.handlePosition);
      this.moveLogosForHandles( side, this.handleCode );
    }

    this.housing.badges.z = this.housing.depth/2 + this.housing.badges.zOffset;

    // Move out for double hinged doors.
    if ( code === 'doubledoors' ) {
      this.housing.badges.z += Dimension.getDoors().dhd.barD + this.housing.badges.zOffset;
    }

    // Move out for stainless steel cover top.
    if ( code === 'ssc') {
      this.housing.badges.z += amt + this.housing.badges.zOffset;
    }

    this.logo.mesh.position.set( this.logo.x, this.housing.badges.y, this.housing.badges.z );
    this.miUSA.mesh.position.set( this.miUSA.x, this.housing.badges.y, this.housing.badges.z );
  }

}

export let Housing = new Housings();
