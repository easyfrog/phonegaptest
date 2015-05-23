(function() {
	var Daehandler = function(scene) {
		var s = this;

		s.loader = new THREE.ColladaLoader();
		s.loader.options.convertUpAxis = true;
		s.scene = scene;
		s.root = null;
		s.animations = [];
	};

	Daehandler.prototype.load = function(url, cb, pb, eb) {
		var s = this;
		s.loader.load(url, function(collada) {
			s.root = collada.scene;
			s.root.updateMatrix();
			
			s.root.traverse(function(child) {
				if (child instanceof THREE.SkinnedMesh) {
					var _a = new THREE.Animation(child, child.geometry.animation);
					s.animations.push(_a);
					_a.play();
				}
			});

			s.scene.add(s.root);
			cb();
		}, pb, eb);
	};

	window.Daehandler = Daehandler;
}());