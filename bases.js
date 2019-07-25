import * as THREE from 'three'
import * as HELPER from './helpers.js'
import { Dimension } from './dimensions.js'

class Bases {
  constructor(){
    this.baseMesh = undefined;
  }

  init( props, om ) {
    this.props = props;
    this.objMgr = om;
    this.base = Dimension.getBases();

    // Create each base depending on type.
    let code = this.props.base.code.value.toLowerCase();

    switch (code) {
      case 'ftb':
      case 'ptb':
      case '2fb':
      case '4fb':
      case '6fb':
        this.baseMesh = this.createSolidBase();
        break;
      case 'tmmb':
      case '4x1':
      case '4b':
      case '4ml':
      case '6b':
      case '6ml':
        this.baseMesh = this.createMobileBase();
        break;
      case 'wcb':
        this.baseMesh = this.createWetCleanBase();
        break;
      default:
        break;
    }

    return this.baseMesh;
  } // END init()

  createSolidBase() {
    const baseRecess = this.base.solid.recess,
          baseW = this.props.housingWidth,
          baseH = this.props.base.metricHeight.value,
          baseD = this.props.housingDepth - baseRecess,

          solidBaseMesh = new THREE.Mesh(
            new THREE.BoxGeometry(baseW, baseH, baseD),
            this.objMgr.materialManager.materials.metalPaintedExt
          );

    solidBaseMesh.position.set( 0, -baseH/2, -baseRecess/2 );
    solidBaseMesh.castShadow = true;

    return solidBaseMesh;
  }

  createWetCleanBase() {
    const fittingOffset = this.base.wetClean.mountTopW/2,
          xOffset = this.props.housingWidth/2 - this.base.wetClean.baseXOffset - fittingOffset,
          legPositions = [
            { x: xOffset, z: this.props.housingDepth/2 - fittingOffset },
            { x: xOffset, z: -this.props.housingDepth/2 + fittingOffset },
            { x: -xOffset, z: -this.props.housingDepth/2 + fittingOffset },
            { x: -xOffset, z: this.props.housingDepth/2 - fittingOffset }
          ];
    let legs = new THREE.Group();

    legPositions.forEach(function(lp, i) {
      let l = this.createWetCleanLeg();
      l.position.set( lp.x, -this.base.wetClean.fittingH - 1, lp.z );
      l.name = l.name + "_" + i;
      legs.add( l );
    }, this);

    return legs;
  }

  createWetCleanLeg() {
    const baseH = this.props.base.metricHeight.value,
          footM = new THREE.Mesh( new THREE.CylinderGeometry( this.base.wetClean.footR, this.base.wetClean.footR, this.base.wetClean.footH, this.base.wetClean.radiusSegs )),
          legM = new THREE.Mesh( new THREE.CylinderGeometry( this.base.wetClean.legR, this.base.wetClean.legR, this.base.wetClean.legH, this.base.wetClean.radiusSegs ));

    let meshes = [],
        legMerged,
        mountShape = new THREE.Shape();

    // Create the mount.
    mountShape.autoClose = true;
    mountShape.moveTo( this.base.wetClean.mountTopW/2, this.base.wetClean.mountH/2 );
    mountShape.lineTo( this.base.wetClean.mountBtmW/2, -this.base.wetClean.mountH/2 );
    mountShape.lineTo( -this.base.wetClean.mountBtmW/2, -this.base.wetClean.mountH/2 );
    mountShape.lineTo( -this.base.wetClean.mountTopW/2, this.base.wetClean.mountH/2 );

    const extrudeSettings = {
            steps: 1,
            amount: this.base.wetClean.mountTopW,
            bevelEnabled: false
          },
          mountG = new THREE.ExtrudeGeometry( mountShape, extrudeSettings ),
          mount = new THREE.Mesh( mountG, this.objMgr.materialManager.materials.metalPaintedExt );

    // Position leg elements.
    legM.position.setY( -this.base.wetClean.legH/2 );
    footM.position.setY( -(this.base.wetClean.legH + this.base.wetClean.footH/2) );

    // Merge leg & foot.
    meshes.push( legM, footM );
    legMerged = new THREE.Mesh( HELPER.mergeMeshes( meshes ), this.objMgr.materialManager.materials.accessories );

    // Position leg & mount.
    mount.position.setZ( -this.base.wetClean.mountTopW/2 );
    legMerged.position.setY( -this.base.wetClean.mountH/2 );

    // Wrap it up.
    mount.name = 'legMount';
    legMerged.name = "legMerged";
    legMerged.castShadow = true;

    let leg = new THREE.Group();
    leg.name = "leg";
    leg.add( mount ).add( legMerged );
    leg.visible = true;

    return leg;
  }

/*******************************/
/**** MOBILE BASE & CASTERS ****/
  createMobileBase() {
    let casterAttachOffset = this.props.base.diameter.value/2;

    // Make this persist to support changing base side independently.
    this.casterPositions = [{
              name: "frontLeft",
              x: -this.props.housingWidth/2 + casterAttachOffset,
              z: this.props.housingDepth/2 - casterAttachOffset
            },{
              name: "backLeft",
              x: -this.props.housingWidth/2 + casterAttachOffset,
              z: -this.props.housingDepth/2 + casterAttachOffset
            },{
              name: "backRight",
              x: this.props.housingWidth/2 - casterAttachOffset,
              z: -this.props.housingDepth/2 + casterAttachOffset
            },{
              name: "frontRight",
              x: this.props.housingWidth/2 - casterAttachOffset,
              z: this.props.housingDepth/2 - casterAttachOffset
          }];

    return this.getCasterSides( this.props.handlePosition );
  }

  getCasterSides( hs ) {
    let castersGrp = new THREE.Group(),
        handleSide = HELPER.convertHandleSide( hs );

    for( var i = 0; i < this.casterPositions.length; i++) {
      // Creates an offset that lets us loop back to the start of the array.
      let offsetI = (i + handleSide) % this.casterPositions.length,
          // Create swivel casters first, then fixed casters.
          c = i < 2 ? this.cloneLockingCaster() : this.cloneStationaryCaster();
          c.rotation.x = -Math.PI / 2;
      // Scale it.
      this.scaleCaster(c);
      // Rotate the casters for front & right sides.
      if ( handleSide === 3 ) {
        // c.rotation.y = -Math.PI / 2;
        c.rotation.z = Math.PI / 2;
      } else if ( handleSide === 2 ) {
        c.rotation.y = Math.PI;
        c.rotation.x = Math.PI / 2;
      }
      c.position.set( this.casterPositions[offsetI].x, 0, this.casterPositions[offsetI].z);

      castersGrp.add( c );
      castersGrp.name = "caster group";
    }

    return castersGrp;
  }

  scaleCaster(caster){
    let code = this.props.base.code.value,
        scaledCaster = caster;

    switch (code) {
      case 'tmmb':
        scaledCaster.scale.set(0.59375, 0.59375, 0.59375);
        break;
      case '4x1':
        scaledCaster.scale.set(0.703125, 0.703125, 0.703125);
        break;
      case '4ml':
      case '4b':
        scaledCaster.scale.set(0.78125, 0.78125, 0.78125);
        break;
      default:
        break;
    }

    scaledCaster.traverse( (child) => {
      if ( child instanceof THREE.Mesh ){
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return scaledCaster;
  }

  /**** CREATE THE CASTERS ****/
  cloneLockingCaster(){
    // only call this from within a whenLoaded method
    return this.cloneCaster("lockingCasterBlack", "lockingCasterSilver")
  }
  cloneStationaryCaster(){
    // only call this from within a whenLoaded method
    return this.cloneCaster("casterBlack", "casterSilver")
  }

  cloneCaster(bType, sType){
    // convenience method
    const bMat = this.objMgr.materialManager.materials.casters.black,
          sMat = this.objMgr.materialManager.materials.casters.silver,
          bCaster = this.objMgr.meshes[bType].clone(),
          sCaster = this.objMgr.meshes[sType].clone();

    bCaster.traverse( (m) => { m.material = bMat } );
    sCaster.traverse( (m) => { m.material = sMat } );

    let container = new THREE.Object3D();
    container.name = "caster container";
    container.add(sCaster).add(bCaster);

    return container;
  }

}

export let Base = new Bases();
