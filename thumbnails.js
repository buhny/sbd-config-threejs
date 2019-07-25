import * as THREE from 'three'
import * as HELPER from './helpers.js'
import * as toolBoxHelper from 'Src/helpers';

import { Room } from './room.js'
import { Dimension } from './dimensions.js'

class Thumbnails {
  constructor(){
    this.lookAtDefault = new THREE.Vector3(0,0,0);
    this.cabinetBB = {};
    this.savedImages = {};

    // Create the camera now, we'll set the frustrum per cabinet later.
    // this.cameraOrtho = new THREE.OrthographicCamera( 1, 1, 1, 1, 1, 1 );
  }

  setUpCanvas( controls, scene, renderer, composer, camera, cabinet ) {
    // console.log('setUpCanvas');
    this.scene = scene;
    this.renderer = renderer;
    this.composer = composer;
    this.controls = controls;
    this.cameraPerspective = camera;
    this.activeCamera = this.cameraPerspective;
    this.cabinet = cabinet;

    this.renderer.setPixelRatio(2); // Set for consistent image export size across devices.
    this.composer.passes[2].enabled = false; // Turn off SSAOShader otherwise bg will be black.
    this.composer.passes[4].enabled = false; // Turn off OutlinePass.
    this.controls.enabled = false; // Turn off camera orbit controls.
    Room.hide(); // Hide the floor and walls.

    // Zero out camera & cabinet for calculations.
    this.cameraPerspective.position.set( 0, 0, 0 );
    this.cabinet.position.set( 0, 0, 0 );
    this.cabinet.rotation.y = 0;

    // Remove shadow from cabinet so width is calculated correctly.
    let shadow = this.cabinet.getObjectByName('housingShadow');
    HELPER.removeAndDisposeGeom( this.cabinet, shadow );

    // Get the bounding box of the cabinet + all peripherals.
    this.cabinetBB.bb = new THREE.Box3().setFromObject( this.cabinet ); //bounding box of cabinet
    this.cabinetBB.height = Math.floor( this.cabinetBB.bb.max.y + Math.abs( this.cabinetBB.bb.min.y )); // Total height of cabinet group.
    this.cabinetBB.width = Math.floor( this.cabinetBB.bb.max.x +  Math.abs( this.cabinetBB.bb.min.x )); // Total width of cabinet group.
    this.cabinetBB.depth = Math.floor( this.cabinetBB.bb.max.z +  Math.abs( this.cabinetBB.bb.min.z )); // Total depth of cabinet group.

    // Recenter the cabinet.
    if ( this.cabinetBB.bb.max.x !== Math.abs( this.cabinetBB.bb.min.x )) {
      this.recenterCabinet('x');
    }
    if ( this.cabinetBB.bb.max.y !== Math.abs( this.cabinetBB.bb.min.y ) ) {
       this.recenterCabinet('y');
     }
    if ( this.cabinetBB.bb.max.z !== Math.abs( this.cabinetBB.bb.min.z ) ) {
       this.recenterCabinet('z');
    }

    // Move Directional Light + its target (for shadows)..
    this.dirLight = this.scene.getObjectByName('directionalLight');
    if ( this.dirLightDefaultY === undefined ) { // Only need to get this once.
      this.dirLightDefaultY = this.dirLight.position.y; // Needed later for reset.
    }
    this.dirLight.position.setY( this.dirLightDefaultY - 450 );
    //Set the light's target based on cabinet height.
    this.dirLight.target.name = 'dirLightTarget';
    this.dirLight.target.position.y = -this.cabinetBB.height/2;
    if ( this.scene.getObjectByName('dirLightTarget') === undefined ) {
      this.scene.add( this.dirLight.target ); // Only add the light target once.
    }

  }

  recenterCabinet( xyz ) {
    // console.log('getDimensionOffset()');
    let max = Math.abs( this.cabinetBB.bb.max[ xyz ] ),
        min = Math.abs( this.cabinetBB.bb.min[ xyz ] ),
        offset = ( Math.max( max, min ) - Math.min( max, min ) ) / 2;

    // Reposition the cabinet.
    max > min ? this.cabinet.position[ xyz ] = this.cabinet.position[ xyz ] - offset  : this.cabinet.position[ xyz ] = this.cabinet.position[ xyz ] + offset;
  }

  positionMainThumb( attributes ) {
    // console.log('positionMainThumb');

    // Size of the thumbnails arbitrated by design.
    let canvasWidth = 488,
        canvasHeight = 274;

    // Move the camera so the cabinet fits in the new canvas dimensions.
    this.cameraPerspective.position.setZ( this.placeCameraForCanvasAndCabinet( canvasWidth, canvasHeight ) );

    // Raise the camera for a top down look.
    let cameraYOffset = 300, // Arbitrary.
        cabinetYModifier = attributes.housingDepth < 725 ? 1.04 : 1.08; // Shallow vs full depth.

    this.cameraPerspective.position.setY( this.cabinetBB.height/2 + ( cameraYOffset * cabinetYModifier ) );

    // If the cabinet is deeper than it is wide or tall, there are problems.
    // TODO: better calculations.
    if (this.cabinetBB.depth > (this.cabinetBB.height || this.cabinetBB.width)) {
      this.cameraPerspective.position.setZ( this.cameraPerspective.position.z + 300);
      this.cameraPerspective.position.setY( this.cameraPerspective.position.y - 300);
    }

    this.cameraPerspective.lookAt( this.lookAtDefault );

    // Grab the image.
    this.savedImages.main = this.getImage();
  }

  positionWallPlanningThumb(){
    // console.log('positionWallPlanningThumb()');

    // Set the canvas to the size of the bounding box,
    // but reduce the size of the canvas for better performance.
    let canvasWidth = this.cabinetBB.width/3,
        canvasHeight = this.cabinetBB.height/3;

    // Camera is centered for this image.
    this.cameraPerspective.position.setY( 0 );

    // Move the camera so the cabinet fills the new canvas dimensions.
    this.cameraPerspective.position.setZ( this.placeCameraForCanvasAndCabinet( canvasWidth, canvasHeight ) );
    this.cameraPerspective.lookAt( this.lookAtDefault );

    // Grab the image.
    this.savedImages.wall = this.getImage();
  }

  placeCameraForCanvasAndCabinet( canvasW, canvasH ) {
    // Set up renderer size and corresponding aspect ratio.
    this.renderer.setSize( canvasW, canvasH );
    this.composer.setSize( canvasW, canvasH );
    this.cameraPerspective.aspect = canvasW / canvasH;
    this.cameraPerspective.updateProjectionMatrix();

    // Using PerspectiveCamera
    let aspect = this.cameraPerspective.aspect,
        vfovRadians = this.cameraPerspective.fov * ( Math.PI / 180 ), // Converts degrees to radians.
        hfovRadians = 2 * Math.atan(Math.tan(vfovRadians / 2) * aspect),  // Converts degrees to radians.
        wdistance = (this.cabinetBB.depth/2) + ( this.cabinetBB.width/2 / (Math.tan( hfovRadians/2 ))), // Calculate distance to fit the cabinet width.
        vdistance = (this.cabinetBB.depth/2) + ( this.cabinetBB.height/2 / (Math.tan( vfovRadians/2 ))); // Calculate distance to fit the cabinet height.

    // Since the canvas aspect ratio is not 1:1, we use the larger distance for Z to make sure the entire cabinet fits.
    return (wdistance >= vdistance ? wdistance : vdistance) * 1.001; //Add some padding to make sure we are getting it all.
  }

  resetCanvasforConfigurator( floorY ){
    // console.log('reset canvas for configurator');
    if( this.cabinet && this.cameraPerspective ){
      this.cameraPerspective.position.set(0, 1200, 4500); // Reset camera position.
      this.composer.passes[2].enabled = true; // Turn SSAOShader back on.
      this.composer.passes[4].enabled = true; // Turn OutlinePass back on.
      Room.show(); // Show floor and walls again.
      this.cabinet.position.setY( floorY ); // Set the cabinet back on the floor.
      this.renderer.setPixelRatio( window.devicePixelRatio ? window.devicePixelRatio : 1 ); // Reset the pixel ratio back to the native device.
      this.controls.enabled = true; // Turn camera orbit controls back on.
      this.controls.update();
      this.dirLight.position.setY( this.dirLightDefaultY ); // Reset the directional light's height.
      this.dirLight.target.position.y = 0; // Reset the directional light's target back to default.
    }
  }

  saveImages( props ) {
    // console.log('saveImages');
    let finishedConfigurating = toolBoxHelper.getShared('saveConfigurationWithImage');

    finishedConfigurating( props.currentConfiguration.configuration, this.savedImages );
  }

  popUpImage(){
    let img = new Image();

    img.src = this.getImage();

    // Display image in a new window for testing.
    let w = window.open('', '');
    if (w) {
      w.document.title = "Screenshot";
      w.document.body.appendChild(img);
    }
  }

  getImage() {
    // console.log('getImage()');
    this.renderer.render( this.scene, this.cameraPerspective );
    this.composer.render();

    return this.renderer.domElement.toDataURL();
  }

}

export let Thumbnail = new Thumbnails();
