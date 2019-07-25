import * as THREE from 'three'
import * as HELPER from '../helpers.js'
import { Dimension } from '../dimensions.js'
import { Locks } from '../locks.js'

export class Door {
  constructor( settings, om ){
    this.doorDims = Dimension.getDoors();
    this.housingDims = Dimension.getHousing();
    this.settings = settings;
    this.objMgr = om;
    // console.log(this.objMgr);
    this.materials = this.objMgr.materialManager.materials;
    // this.matInterior = mat;
    // this.loaded = loaded;

    if ( settings !== undefined ) {
      this.space = this.settings.space;
      this.door = this.settings.door;
      this.flushDepth = this.space.intDepth/2 + this.doorDims.depth + this.doorDims.flushOffset;
    }

    // this.matGray = new THREE.MeshPhongMaterial();
    // this.matGray.color.setHex(0xC0C0C0);
  }

  finishDoor( doorMesh ){
    let doorGrp = new THREE.Group();
    doorGrp.name = "door_" + this.door.type;

    doorMesh.castShadow = true;
    doorMesh.receiveShadow = true;
    doorMesh.name = 'doorBase';

    if ( this.door.type === "retractable" || this.door.type === "flush" ) {
      doorMesh.position.setZ( this.flushDepth - this.doorDims.depth );
    }
    doorGrp.add( doorMesh ).add( this.lock );

    if ( this.knob !== undefined ) {
      this.knob.castShadow = true;
      doorGrp.add( this.knob );
    }

    return doorGrp;
  }

  retractable() {
    const bodyH = this.space.height - this.doorDims.heightSpacer - this.doorDims.retractable.pullBackH,
          doorMeshes = this.createBaseMesh("solid", bodyH, this.space.intWidth ).concat( this.createPullMesh( this.door.type, bodyH, this.space.intWidth ) ),
          doorBaseMesh = new THREE.Mesh( HELPER.mergeMeshes( doorMeshes ), this.materials.metalPaintedInt );

    doorBaseMesh.position.setY( this.doorDims.retractable.pullBackH/2 );

    this.lock = this.getLock("long");
    this.lock.position.setZ( this.flushDepth - this.doorDims.depth + this.doorDims.retractable.lockBaseDepth - this.doorDims.lock.length/2 );
    this.lock.position.setY( -this.space.height/2 + this.doorDims.lock.bottomOffset );

    return this.finishDoor( doorBaseMesh );
  }

  flush(){
    const dbw = this.space.intWidth - this.doorDims.flush.pullBackW,
          dbh = this.space.height - this.doorDims.flush.offsetH,
          doorMeshes = this.createBaseMesh( "solid", dbh, dbw ).concat( this.createPullMesh( this.door.type, dbh, dbw ) );

    let doorBaseMesh,
        lockX = -(dbw/2 - this.doorDims.flush.lockOffset);

    // Create mesh from them.
    doorBaseMesh = new THREE.Mesh( HELPER.mergeMeshes( doorMeshes ), this.materials.metalPaintedInt );

    this.lock = this.getLock("standard");
    const lockBB = new THREE.Box3().setFromObject( this.lock ),
          lockZ = lockBB.max.z + Math.abs( lockBB.min.z );

    this.lock.position.setZ( this.flushDepth - this.doorDims.depth/2 + lockZ/2 );

    if ( this.door.hinge === "left" )
      lockX = -lockX;
    this.lock.position.setX( lockX );

    return this.finishDoor( doorBaseMesh );
  }

  doubleHingedDoors() {
    const props = this.settings.props,
          doorMat = this.materials.metalPaintedExtTrans,
          // doorMat = this.materials.metalPaintedExt.clone(),
          housingH = props.housingPoints + this.housingDims.heightDiff,
          housingW = props.housingWidth,
          housingD = props.housingDepth,
          doorWOffset = this.doorDims.dhd.doorWOffset,
          doorW = housingW/2 - doorWOffset,
          doorH = housingH - this.doorDims.dhd.barH*2 - doorWOffset*2,
          doorG = new THREE.BoxGeometry( doorW, doorH, this.doorDims.depth ),
          leftDoorM = new THREE.Mesh( doorG ),
          rightDoorM = new THREE.Mesh( doorG ),
          barG = new THREE.BoxGeometry( housingW, this.doorDims.dhd.barH, this.doorDims.dhd.barD ),
          barTopM = new THREE.Mesh( barG ),
          barBtmM = new THREE.Mesh( barG );

    let doorBaseMesh,
        doorMeshes = [];

    // Position all door meshes.
    barTopM.position.setY( housingH - this.doorDims.dhd.barH/2 );
    barBtmM.position.setY( this.doorDims.dhd.barH/2 );
    leftDoorM.position.set( -(housingW/2 - doorW/2), housingH/2, (this.doorDims.dhd.barD/2 - this.doorDims.depth/2) );
    rightDoorM.position.set( (housingW/2 - doorW/2), housingH/2, (this.doorDims.dhd.barD/2 - this.doorDims.depth/2) );

    // Merge all the meshes.
    doorMeshes.push( leftDoorM, rightDoorM, barTopM, barBtmM );
    doorMat.color.setHex( props.colorExt );
    doorBaseMesh = new THREE.Mesh( HELPER.mergeMeshes( doorMeshes ), doorMat );

    // Create standard or hasp lock.
    this.lock = this.getLock( this.settings.door.lock );

    // Position knob & lock elements.
    let knobY,
        lockY;

    switch( props.housingPoints ) {
      case 1525 :
        knobY = doorH - this.doorDims.dhd.knobHOffsets.h1525;
        break;
      case 1350 :
        knobY = doorH - this.doorDims.dhd.knobHOffsets.h1350;
        break;
      case 1225 :
        knobY = doorH - this.doorDims.dhd.knobHOffsets.h1225;
        break;
      case 1050 :
        knobY = doorH - this.doorDims.dhd.knobHOffsets.h1050;
        break;
      case 900 :
        knobY = doorH - this.doorDims.dhd.knobHOffsets.h900;
        break;
      default :
        knobY = doorH - this.doorDims.dhd.knobHOffsets.hDefault;
        break;
    }

    lockY = knobY + this.doorDims.intKnob.baseH/2 - Dimension.getLocks().cylinder.diameter/2 - this.doorDims.intKnob.lockOffset;

    this.lock.position.set(
      this.doorDims.intKnob.xOffset + this.doorDims.intKnob.baseW/2,
      lockY,
      this.doorDims.dhd.barD/2 + this.doorDims.intKnob.baseD*2 );

    if ( this.settings.door.lock === "standard" ) {
      this.knob = this.createKnob();
      this.knob.position.set( this.doorDims.intKnob.xOffset, knobY - this.doorDims.intKnob.baseH/2, this.doorDims.dhd.barD/2 );
    } else if ( this.settings.door.lock === "hasp" ) {
      this.lock.position.setZ( this.doorDims.dhd.barD/2 );
    }

    // Finish it!
    return this.finishDoor( doorBaseMesh );
  }

  slidingDoors() {
    // console.log('slidingDoors');
    const props = this.settings.props,
          housingH = props.housingPoints + this.housingDims.heightDiff,
          housingW = props.housingWidth,
          housingD = props.housingDepth,
          trackW = housingW - this.housingDims.sides.width*2 - this.housingDims.sides.bevelSide*2 - this.housingDims.sides.inset*2,
          trackTopG = new THREE.BoxGeometry( trackW, this.doorDims.sd.topH, this.doorDims.sd.depth ),
          trackBtmG = new THREE.BoxGeometry( trackW, this.doorDims.sd.btmH, this.doorDims.sd.depth ),
          trackTopM = new THREE.Mesh( trackTopG ),
          trackBtmM = new THREE.Mesh( trackBtmG ),
          doorW = trackW/2 - this.doorDims.sd.knobW,
          doorH = housingH - this.housingDims.ceilingH - this.housingDims.floorH - this.doorDims.sd.topH - this.doorDims.sd.btmH - this.doorDims.sd.doorHOffset,
          doorY = housingH/2 + ( (this.housingDims.floorH + this.doorDims.sd.btmH) - (this.housingDims.ceilingH + this.doorDims.sd.topH) )/2,
          doorLeftG = new THREE.BoxGeometry( doorW, doorH, this.doorDims.depth ),
          doorLeftM = new THREE.Mesh( doorLeftG ),
          doorRightG = new THREE.BoxGeometry( doorW, doorH, this.doorDims.sd.doorRightD ),
          doorRightM = new THREE.Mesh( doorRightG );

    let doorBaseMesh,
        doorMeshes = [];

    // Knobs.
    let knobLeftShape = new THREE.Shape(),
        knobRightShape = new THREE.Shape(),
        knobExtrudeSettings = { amount : doorH, bevelEnabled : false };

    // Left knob - upside-down "j" shape.
    // Outside points first.
    knobLeftShape.moveTo( 0, 0 );
    knobLeftShape.lineTo( 0, this.doorDims.sd.depth );
    knobLeftShape.lineTo( this.doorDims.sd.knobW, this.doorDims.sd.depth );
    knobLeftShape.lineTo( this.doorDims.sd.knobW, this.doorDims.sd.depth - this.doorDims.depth );
    // Inside points.
    knobLeftShape.lineTo( this.doorDims.sd.knobW - this.doorDims.wallThickness, this.doorDims.sd.depth - this.doorDims.depth );
    knobLeftShape.lineTo( this.doorDims.sd.knobW - this.doorDims.wallThickness, this.doorDims.sd.depth - this.doorDims.wallThickness );
    knobLeftShape.lineTo( this.doorDims.sd.knobT, this.doorDims.sd.depth - this.doorDims.wallThickness );
    knobLeftShape.lineTo( this.doorDims.sd.knobT, 0 );
    knobLeftShape.lineTo( 0, 0 );

    // Right knob - backwards "r" shape.
    knobRightShape.moveTo( 0, 0 );
    // Inside points first.
    knobRightShape.lineTo( -this.doorDims.sd.knobT, 0 );
    knobRightShape.lineTo( -this.doorDims.sd.knobT, this.doorDims.sd.depth - this.doorDims.wallThickness );
    knobRightShape.lineTo( -this.doorDims.sd.knobW, this.doorDims.sd.depth - this.doorDims.wallThickness );
    // Outside points.
    knobRightShape.lineTo( -this.doorDims.sd.knobW, this.doorDims.sd.depth );
    knobRightShape.lineTo( 0, this.doorDims.sd.depth );
    knobRightShape.lineTo( 0, 0 );

    let knobLeftG = new THREE.ExtrudeGeometry( knobLeftShape, knobExtrudeSettings ),
        knobLeftM = new THREE.Mesh( knobLeftG ),
        knobRightG = new THREE.ExtrudeGeometry( knobRightShape, knobExtrudeSettings ),
        knobRightM = new THREE.Mesh( knobRightG );

    // Position meshes.
    trackTopM.position.setY( housingH - this.housingDims.ceilingH - this.doorDims.sd.topH/2 );
    trackBtmM.position.setY( this.housingDims.floorH + this.doorDims.sd.btmH/2 );
    doorLeftM.position.set( -doorW/2, doorY, this.doorDims.sd.depth/2 - this.doorDims.depth/2 );
    knobLeftM.rotation.x = -Math.PI/2;
    knobLeftM.position.set( (-doorW - this.doorDims.sd.knobW + this.doorDims.wallThickness), this.housingDims.floorH + this.doorDims.sd.btmH + this.doorDims.sd.doorHOffset/2, this.doorDims.sd.depth/2 );
    doorRightM.position.set( doorW/2, doorY, -this.doorDims.sd.depth/2 + this.doorDims.sd.doorRightD/2 );
    knobRightM.rotation.x = -Math.PI/2;
    knobRightM.position.set( (doorW + this.doorDims.sd.knobW - this.doorDims.wallThickness), this.housingDims.floorH + this.doorDims.sd.btmH + this.doorDims.sd.doorHOffset/2, this.doorDims.sd.depth/2 );

    // Merge ALL the meshes.
    doorMeshes.push( trackTopM, trackBtmM, doorLeftM, doorRightM, knobLeftM, knobRightM );
    doorBaseMesh = new THREE.Mesh( HELPER.mergeMeshes( doorMeshes ), this.materials.metalPaintedInt );

    // Create integrated knob & lock.
    this.lock = this.getLock("long");
    this.lock.position.set( this.doorDims.sd.lockX, doorY, this.doorDims.sd.depth - this.doorDims.lock.length/2 );

    // Finish it!
    return this.finishDoor( doorBaseMesh );
  }

  createKnob() {
    // Rounded rectangle
    let roundedRectShape = new THREE.Shape(),
        roundedRectHole = new THREE.Path();

    roundedRectShape = HELPER.roundedRect(
      roundedRectShape,
      0, 0, // X, Y
      this.doorDims.intKnob.baseW, this.doorDims.intKnob.baseH, // width, height
      this.doorDims.intKnob.baseR // curve radius
    );

    // Define holes counter-clockwise.
    roundedRectHole.moveTo( this.doorDims.intKnob.holeInset, this.doorDims.intKnob.holeInset );
    roundedRectHole.lineTo( this.doorDims.intKnob.baseW - this.doorDims.intKnob.holeInset, this.doorDims.intKnob.holeInset );
    roundedRectHole.lineTo( this.doorDims.intKnob.baseW - this.doorDims.intKnob.holeInset, this.doorDims.intKnob.holeInset + this.doorDims.intKnob.holeH );
    roundedRectHole.lineTo( this.doorDims.intKnob.holeInset, this.doorDims.intKnob.holeInset + this.doorDims.intKnob.holeH );
    roundedRectHole.lineTo( this.doorDims.intKnob.holeInset, this.doorDims.intKnob.holeInset );

    // Add hole to Shape.
    roundedRectShape.holes.push( roundedRectHole);

    // Create main part of knob with hole.
    let baseExtrudeSettings = { amount: this.doorDims.intKnob.baseD - this.doorDims.intKnob.backD, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 3, bevelThickness: 3 },
        knobShape = HELPER.extrudeShape( roundedRectShape, baseExtrudeSettings, this.objMgr.materialManager.materials.knobIntTexture, 0, 0, 0, 0, 0, 0, 1 ),
        knobBaseGrp = new THREE.Group(),
        knobBackM = new THREE.Mesh(
          new THREE.BoxGeometry( this.doorDims.intKnob.baseW - 2, this.doorDims.intKnob.holeH + 2, 1 ),
          new THREE.MeshLambertMaterial({ color: 0x555555 })
        );

    knobShape.position.setZ( 1 );
    knobBackM.position.set( this.doorDims.intKnob.baseW/2, this.doorDims.intKnob.holeH/2, 0 );
    knobShape.name = "knobBase";
    knobBackM.name = "knobBack";
    knobBaseGrp.name = "knobBaseGroup";
    knobBaseGrp.add( knobShape ).add( knobBackM );

    return knobBaseGrp;
  }

  createBaseMesh( type, bh, bw ) {
    let baseMeshes = [];

    if ( type === "solid" ) {
        let doorGeom = new THREE.BoxGeometry( bw, bh, this.doorDims.depth ),
          doorGVerts = doorGeom.vertices,
          doorM = new THREE.Mesh( doorGeom );

        if ( this.door.type === "flush" ){
          // Offset door body & pull side based on hinge position.
          if ( this.door.hinge === "left") {
            doorM.position.setX( -this.doorDims.flush.pullBackW/2 );
            doorGeom.vertices[0].x += this.doorDims.flush.pullFrontW;
            doorGeom.vertices[2].x += this.doorDims.flush.pullFrontW;
          } else {
            doorM.position.setX( this.doorDims.flush.pullBackW/2 );
            doorGeom.vertices[5].x -= this.doorDims.flush.pullFrontW;
            doorGeom.vertices[7].x -= this.doorDims.flush.pullFrontW;
          }
          doorGeom.verticesNeedUpdate = true;
        }

        baseMeshes.push( doorM );
    }

    return baseMeshes;
  }

  createPullMesh(type, bh, bw ) {
    let pullMeshes = [];

    if ( type === "retractable" ) {
      let pullBackG = new THREE.BoxGeometry(this.space.intWidth, this.doorDims.retractable.pullBackH, this.doorDims.wallThickness),
          pullBtmG = new THREE.BoxGeometry(this.space.intWidth, this.doorDims.wallThickness, this.doorDims.depth),
          pullFrontG = new THREE.BoxGeometry(this.space.intWidth, this.doorDims.retractable.pullFrontH, this.doorDims.wallThickness),
          lockBaseG = new THREE.BoxGeometry(this.doorDims.retractable.lockBaseWidth, (this.doorDims.retractable.pullBackH - this.doorDims.wallThickness), this.doorDims.retractable.lockBaseDepth),
          pullBackM = new THREE.Mesh( pullBackG ),
          pullBtmM = new THREE.Mesh( pullBtmG ),
          pullFrontM = new THREE.Mesh( pullFrontG ),
          lockBaseM = new THREE.Mesh( lockBaseG );

      // Position retractable pull at bottom of door base.
      pullBackM.position.setY( -(bh/2 + this.doorDims.retractable.pullBackH/2) );
      pullBackM.position.setZ( -(this.doorDims.depth/2 - this.doorDims.wallThickness/2) );
      pullBtmM.position.setY( -(bh/2 + this.doorDims.retractable.pullBackH + this.doorDims.wallThickness/2) );
      pullFrontM.position.setY( -(bh/2 + this.doorDims.retractable.pullBackH - this.doorDims.retractable.pullFrontH/2) );
      pullFrontM.position.setZ( (this.doorDims.depth/2 - this.doorDims.wallThickness/2) );
      lockBaseM.position.set( 0, -(bh/2 + (this.doorDims.retractable.pullBackH - this.doorDims.wallThickness)/2), -(this.doorDims.depth/2 - this.doorDims.retractable.lockBaseDepth/2) )

      pullMeshes.push( pullBackM );
      pullMeshes.push( pullBtmM );
      pullMeshes.push( pullFrontM );
      pullMeshes.push( lockBaseM );
    }

    if ( type === "flush" ) {
      let pullBackG = new THREE.BoxGeometry( this.doorDims.flush.pullBackW, bh, this.doorDims.wallThickness ),
          pullBackM = new THREE.Mesh( pullBackG ),
          pullX = -bw/2;

      if ( this.door.hinge === "left")
        pullX = -pullX;

      pullBackM.position.set( pullX, 0, -(this.doorDims.depth/2 - this.doorDims.wallThickness/2) );
      pullMeshes.push( pullBackM );
    }

    return pullMeshes;
  }

  getLock(type) {
    let Lock = new Locks();

    if ( type === "long" ) {
      return Lock.cylinder( this.objMgr, this.doorDims.lock.length );
    } else if ( type === "hasp" ) {
      return Lock.hasp( this.objMgr );
    } else {
      return Lock.cylinder(this.objMgr);
    }
  }
}
