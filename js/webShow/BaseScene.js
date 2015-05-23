
(function(){

	// ThreeJS 基础场景
	var BaseScene = function() {
		var s = this;

		// 渲染器
		s.renderer = new THREE.WebGLRenderer( {antialias: true} );
		
		// 场景
		s.scene    = new THREE.Scene();
		
		// 相机与控制器
		s.camera   = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 10000);
		s.control  = new THREE.OrbitControls ( s.camera, renderer.domElement );
		s.control.update();

	};

	// set camera position. 
	// target default is THREE.Vector3(0,0,0)
	BaseScene.prototype.setCameraPosition = function( position, target ) {
		this.camera.position.set(position);
		this.camera.target = target || new THREE.Vector3( 0, 0, 0 );
	};

	// attach to window object
	window.BaseScene = BaseScene;

}());