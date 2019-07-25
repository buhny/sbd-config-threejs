import * as THREE from 'three'

class Rooms {
  constructor(){

  }

  init(floor, walls) {
    // this.roomFloor = new THREE.Mesh(
    //   new THREE.CylinderGeometry(6000, 6000 ,this.floorY-1, 32),
    //   floor
    // );
    // //room.receiveShadow = true;
    // this.roomFloor.position.set(0,-305,0);
    // this.roomFloor.receiveShadow = true;
    // this.roomFloor.name = "floor";
    // scene.add( this.roomFloor );

    // this.roomWalls = new THREE.Mesh(
    //   new THREE.CylinderGeometry(7000, 7000 , 8000, 32),
    //   walls
    // );
    // //room.receiveShadow = true;
    // this.roomWalls.position.set(0, 3000 ,0);
    // this.roomWalls.name = "walls";
    // scene.add( this.roomWalls );

    this.roomWalls = new THREE.Mesh(
      new THREE.CylinderBufferGeometry( 5000, 5000, 4000, 32 ),
      walls
    );
    //room.receiveShadow = true;
    this.roomWalls.position.set( 0, 0, 0 );
    this.roomWalls.name = "walls";
    scene.add( this.roomWalls );

    // var helper = new THREE.GridHelper( 20000, 200 );
    // helper.position.y = this.floorY;
    // helper.material.opacity = 0.25;
    // helper.material.transparent = true;
    // scene.add( helper );

    // var imagePrefix = "/textures/envmaps/blurry/";
    // var directions  = ["posx", "negx", "posy", "negy", "posz", "negz"];
    // var imageSuffix = ".jpg";
    // var skyGeometry = new THREE.CubeGeometry( 9000, 9000, 9000 );
    // var loader = new THREE.TextureLoader();
    //
    // var materialArray = [];
    // for (var i = 0; i < 6; i++)
    // 	materialArray.push( new THREE.MeshBasicMaterial({
    // 		map: loader.load( imagePrefix + directions[i] + imageSuffix ),
    // 		side: THREE.BackSide
    // 	}));
    // var skyMaterial = new THREE.MultiMaterial( materialArray );
    // var skyBox = new THREE.Mesh( skyGeometry, skyMaterial );
    // skyBox.position.set(0,0,0);
    // this.scene.add( skyBox );


  } // END init()

  hide(){
    // this.roomFloor.visible = false;
    this.roomWalls.visible = false;
  }

  show(){
    // this.roomFloor.visible = true;
    this.roomWalls.visible = true;
  }

}

export let Room = new Rooms();
