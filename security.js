import * as THREE from 'three'
// import * as HELPER from './helpers.js'
import { Dimension } from './dimensions.js'
import { Door } from './spaces/doors.js'
import { Locks } from './locks.js'

class SecurityOptions {
  constructor(){
  }

  update( props, om ){
    // console.log('changeSecurity');
    this.props = props;
    this.objManager = om;
    this.materialManager = this.objManager.materialManager;

    const doorDims = Dimension.getDoors();

    let code = this.props.security.code.value,
        haspLockSelected = true, // TODO: needs GUI
        lockType;

    if ( haspLockSelected ) {
      lockType = "hasp";
    }

    switch( code ) {
      case 'doubledoors':
        let lockSelected = haspLockSelected ? this.objManager.meshes.lockHasp.clone() : this.objManager.materialManager.materials.lockFace,
            ddSettings = {
              door : {
                type : 'dhd',
                knob : 'integrated',
                lock : 'standard'
                // lock : 'hasp' // TODO: needs GUI
              },
              space : {},
              props : this.props
            },
            dblDoor = new Door( ddSettings, this.objManager );

        this.securityMesh = dblDoor.doubleHingedDoors();
        this.securityMesh.position.setZ( this.props.housingDepth/2 + doorDims.dhd.barD/2 + doorDims.dhd.doorFrameGap );
        break;
      case 'slidingdoorshelfcabinet':
        let sdSettings = {
          door : {
            type : 'sd',
            knob : 'sliding',
            lock : 'standard'
          },
            space : {},
            props : this.props
          },
          sDoors = new Door( sdSettings, this.objManager );

        this.securityMesh = sDoors.slidingDoors();
        this.securityMesh.position.setZ( this.props.housingDepth/2 - doorDims.sd.depth/2 - doorDims.sd.trackOffset );
        break;
      case 'hingedlockbarleft':
        this.securityMesh = new Locks().lockBar( this.props.housingPoints, this.materialManager.materials.metalPaintedExt );

        this.securityMesh.position.set( -(this.props.housingWidth/2), this.props.housingPoints + Dimension.getHousing().floorH, this.props.housingDepth/2 );
        break;
      case 'hingedlockbarright':
        this.securityMesh = new Locks().lockBar( this.props.housingPoints, this.materialManager.materials.metalPaintedExt );

        this.securityMesh.position.set( this.props.housingWidth/2 - Dimension.getLocks().lockBar.width, this.props.housingPoints + Dimension.getHousing().floorH, this.props.housingDepth/2 );
        break;
      case 'hingelockbarbothsides':
        this.securityMesh = new THREE.Group;
        const leftBar = new Locks().lockBar( this.props.housingPoints, this.materialManager.materials.metalPaintedExt ),
              rightBar = leftBar.clone();

        leftBar.position.set( -(this.props.housingWidth/2), this.props.housingPoints + Dimension.getHousing().floorH, this.props.housingDepth/2 );
        rightBar.position.set( this.props.housingWidth/2 - Dimension.getLocks().lockBar.width, this.props.housingPoints + Dimension.getHousing().floorH, this.props.housingDepth/2 );

        this.securityMesh.add( leftBar ).add( rightBar );
        break;
      default:
        break;
    }

    return this.securityMesh;
  }
}

export let Security = new SecurityOptions();
