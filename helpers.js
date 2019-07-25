// HELPER FUNCTIONS

// Returns a new geometry by merging meshes.
export function mergeMeshes(meshes) {
  let merged = new THREE.Geometry();

  meshes.forEach(function(mesh){
    mesh.updateMatrix();
    merged.merge(mesh.geometry, mesh.matrix);
  });

  return merged;
}


export function convertHandleSide(side){
  let hPos = side,
      startingSide = 0; // Left
  if (hPos === "right") {
    startingSide = 2;
  } else if (hPos === "front") {
    startingSide = 3;
  }
  return startingSide;
}

/* Create a rounded rectangle Shape */
/*  ctx = THREE.Shape()
    x, y, = INTEGER. placement of Shape, recommend 0, 0
    width, height = INTEGER. dimensions of final shape.
    radius = INTEGER. size of curve.
*/
export function roundedRect( ctx, x, y, width, height, radius ) {
  ctx.moveTo( x, y + radius );
  ctx.lineTo( x, y + height - radius );
  ctx.quadraticCurveTo( x, y + height, x + radius, y + height );
  ctx.lineTo( x + width - radius, y + height );
  ctx.quadraticCurveTo( x + width, y + height, x + width, y + height - radius );
  ctx.lineTo( x + width, y + radius );
  ctx.quadraticCurveTo( x + width, y, x + width - radius, y );
  ctx.lineTo( x + radius, y );
  ctx.quadraticCurveTo( x, y, x, y + radius );

  return ctx;
}

/* Extrude a Shape.
    shape = new THREE.Shape() object
// extrudeSettings = OBJECT ex: { amount: 8, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 }
// color = hex color
// material = material obj
// x position = INTEGER
// y position = INTEGER
// z postion = INTEGER
// rx rotation = INTEGER
// ry rotation = INTEGER
// rz rotation = INTEGER
// s scale = INTEGER
*/
export function extrudeShape( shape, extrudeSettings, material, x, y, z, rx, ry, rz, s ) {
  let geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );
  let mesh = new THREE.Mesh( geometry, material );

  x = x || 0;
  y = y || 0;
  z = z || 0;
  rx = rx || 0;
  ry = ry || 0;
  rz = rz || 0;
  s = s || 0;

  mesh.position.set( x, y, z );
  mesh.rotation.set( rx, ry, rz );
  mesh.scale.set( s, s, s );

  return mesh;
}

export function disposeGeom(obj){
  obj.traverse( (node) => {
    if (node instanceof THREE.Mesh) {
      if (node.geometry) {
        node.geometry.dispose();
      }
    }
  });
}

export function removeAndDisposeGeom( parent, obj ){
  if ( obj ) {
    parent.remove( obj );
    this.disposeGeom( obj );
  }
}

export function disposeMaterials(obj){
  obj.traverse( (node) => {
    if (node instanceof THREE.Mesh) {
      //console.log('NODE NAME: ' + node.name);
      if (node.material) {
        if (node.material instanceof THREE.MeshFaceMaterial || node.material instanceof THREE.MultiMaterial) {
          node.material.materials.forEach(function (mtrl, idx) {
            if (mtrl.map) mtrl.map.dispose();
            if (mtrl.lightMap) mtrl.lightMap.dispose();
            if (mtrl.bumpMap) mtrl.bumpMap.dispose();
            if (mtrl.normalMap) mtrl.normalMap.dispose();
            if (mtrl.specularMap) mtrl.specularMap.dispose();
            if (mtrl.envMap) mtrl.envMap.dispose();

            mtrl.dispose();    // disposes any programs associated with the material
          });
        }
        else {
          if (node.material.map) node.material.map.dispose();
          if (node.material.lightMap) node.material.lightMap.dispose();
          if (node.material.bumpMap) node.material.bumpMap.dispose();
          if (node.material.normalMap) node.material.normalMap.dispose();
          if (node.material.specularMap) node.material.specularMap.dispose();
          if (node.material.envMap) node.material.envMap.dispose();

          node.material.dispose();   // disposes any programs associated with the material
        }
      }
    }
  });
}


export function changeMaterialTransparency( obj, isTrans, opacityAmt ){
  obj.traverse( function( node ) {
    if( node.material ) {
      if ( Array.isArray( node.material )) {
        node.material.forEach( n => {
          n.opacity = opacityAmt;
          n.transparent = isTrans;
        });
      } else {
        node.material.opacity = opacityAmt;
        node.material.transparent = isTrans;
      }
    }
  }); // END traverse

}
