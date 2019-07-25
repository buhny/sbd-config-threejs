// import OBJLoader from 'three-obj-loader'
import OBJLoader2 from 'vendor/loaders/OBJLoader2.js'
// import SubdivisionModifier from 'three-subdivision-modifier'
import * as THREE from 'three'
OBJLoader2(THREE);

module.exports = function() {

  class ObjManager {
    constructor(materialManager){
      this.manager = new THREE.LoadingManager();
      this.queue = [];
      this.initLoaded = false;
      this.getObjLoaded = false,
      this.materialManager = materialManager;
      this.meshes = {
        drawerHandle: new THREE.Object3D(),
        drawerHandleCap: new THREE.Object3D(),
        lockingCasterBlack: new THREE.Object3D(),
        lockingCasterSilver: new THREE.Object3D(),
        casterBlack: new THREE.Object3D(),
        casterSilver: new THREE.Object3D(),
        handles : {
          steelR : new THREE.Object3D(),
          steelL : new THREE.Object3D(),
          blackPlastic : new THREE.Object3D(),
          techSeriesR : new THREE.Object3D(),
          techSeriesL : new THREE.Object3D()
        },
        lockKeypadH: new THREE.Object3D(),
        lockHasp : new THREE.Object3D()
      }
      this.init();
    }

    init(){
      this.loadObj(this.meshes.drawerHandle, '/obj/handle-smooth-1mm.obj');
      this.loadObj(this.meshes.drawerHandleCap, '/obj/handle-cap-1mm.obj');
      this.loadObj(this.meshes.lockingCasterBlack, '/obj/pivoting_casters_brakeAndRubberPart.obj');
      this.loadObj(this.meshes.lockingCasterSilver, '/obj/pivoting_casters_steelPart.obj');
      this.loadObj(this.meshes.casterBlack, '/obj/stationary_casters_rubberPart.obj');
      this.loadObj(this.meshes.casterSilver, '/obj/stationary_casters_steelPart.obj');
      this.loadObj(this.meshes.handles.steelR, '/obj/side_handles_steelPart_right.obj');
      this.loadObj(this.meshes.handles.steelL, '/obj/side_handles_steelPart_left.obj');
      this.loadObj(this.meshes.handles.blackPlastic, '/obj/handle_black-plastic.obj');
      this.loadObj(this.meshes.handles.techSeriesL, '/obj/handle_tech-series-left.obj');
      this.loadObj(this.meshes.handles.techSeriesR, '/obj/handle_tech-series-right.obj');
      this.loadObj(this.meshes.lockKeypadH, '/obj/lock_keypad-h.obj');
      this.loadObj(this.meshes.lockHasp, '/obj/lock_hasp.obj');

      this.manager.onLoad = () => {
        this.initLoaded = true;
        this.dumpQueue();
      }
    }

    whenLoaded(callback){
      if(!this.manager.isLoading && this.initLoaded){
        callback();
      } else {
        this.queue.push(callback)
      }
    }

    dumpQueue(){
      this.queue.forEach(function(callback){
        callback();
      },this)
    }

    loadObj(parent, ref){
      let loader = new THREE.OBJLoader2( this.manager );
    	loader.load( ref,  object => {
    	  object.traverse( child => {
          if ( child instanceof THREE.Mesh ){
            child.geometry.computeFaceNormals();
            child.geometry.computeVertexNormals();
            let material = this.materialManager.materials.tops.stainless;
            child.material = material;
          }
    	  });
        parent.name = ref;
        parent.add(object);
      }, this.onProgress, this.onError );
    }

    onProgress( xhr ) {
      if ( xhr.lengthComputable ) {
        var percentComplete = xhr.loaded / xhr.total * 100;
        // console.log("OBJ Downloading: " + Math.round(percentComplete, 2) + '% downloaded' );
      }
    };

    onError( xhr ) {
      //console.log("<OBJ LOAD ERROR>")
      //console.log(xhr)
    };
  }

  return ObjManager;
}
