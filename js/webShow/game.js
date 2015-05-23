
/**
 * 	Game 类
 *  封装Threejs的一些常用方法
 *  并定义了流程框架
 *  author: easyfrog
 *  date:   2015/5/10
 *
 * container: domElement
 * config: {
 * 	debug: false,
 * 	seaStandard: false,
 * 	rendererConfig: {
 * 		antialias: true,
 * 		alpha: true
 * 	}
 * }
 */
(function(parent) {
	var Game = function(container, config) {
		var s = this;

		if (config.seaStandard == undefined) {
			config.seaStandard = false;
		}
		s.container = container;
		var rendererConfig = config.rendererConfig || {
			antialias: true,
			alpha: true
		}
		s.renderer = new THREE.WebGLRenderer(rendererConfig);
		s.container.appendChild(s.renderer.domElement);
		s.camera = new THREE.PerspectiveCamera(45, container.offsetWidth/container.offsetHeight, 0.1, 10000);
		s.camera.position.set(0,50,400);
		if (config.seaStandard) {
			s.camera.scale.set(-1,1,1);
		}
		s.cameraController = new THREE.OrbitControls(s.camera, container);
		s.scene = new THREE.Scene();
		s.sh = new SceneHandler('', s.scene, config.seaStandard);
		s.sea = s.sh.root;
		s.projector = new THREE.Projector();
		// sea文件Map: scene1: 
		s.seaMap = {};

		// 是否暂停
		s.pause = false;
		s.isMouseDown = false;
		s.debug = config.bebug || false;

		// EVENTS: start, update, progress, loadComplete
		s.start = [];
		s.update = [];
		s.progress = [];
		s.loadComplete = [];
		s.picked = [];
		s.keydown = [];
		s.keyup = [];
		s.mousedown = [];
		s.mousemove = [];
		s.mouseup = [];

		s.init();
	};

	Game.START        = 'start';
	Game.UPDATE       = 'update';
	Game.PROGRESS     = 'progress';
	Game.LOADCOMPLETE = 'loadComplete';
	Game.PICKED       = 'picked';
	Game.KEYDOWN      = 'keydown';
	Game.KEYUP        = 'keyup';
	Game.MOUSEDOWN    = 'mousedown';
	Game.MOUSEMOVE    = 'mousemove';
	Game.MOUSEUP      = 'mouseup';

	Game.prototype.init = function() {
		var s = this;

		s.setSize();
		s.addEvents();
		s._start();
		s._update();
	};

	var _lastMousePick;
	Game.prototype.addEvents = function() {
		var s = this;

		// Mouse && Touch
		s.container.addEventListener('mousedown', onMouseDown);
		s.container.addEventListener('mousemove', onMouseMove);
		s.container.addEventListener('mouseup', onMouseUp);

		// Key
		document.addEventListener('keydown', onKeyDown);
		document.addEventListener('keyup', onKeyUp);

		function onKeyUp(e) {
			s.invoke('keyup', e.keyCode);
		}

		function onKeyDown(e) {
			s.invoke('keydown', e.keyCode);
		}

		function onMouseDown(e) {
			e.preventDefault();
			s.isMouseDown = true;
			_lastMousePick = getPick(e);
			s.invoke('mousedown', e);
		}

		function onMouseMove(e) {
			e.preventDefault();
			s.invoke('mousemove', e);
		}

		function onMouseUp(e) {
			e.preventDefault();
			s.invoke('mouseup', e);

			var curMouse = getPick(e);
			// pick object
			if (_lastMousePick.distanceTo(curMouse) < 5) {
				var p = getPick(e);
				var mx = ((p.x - s.container.offsetLeft) / s.container.offsetWidth) * 2 - 1;
				var my = -((p.y - s.container.offsetTop) / s.container.offsetHeight) * 2 + 1;
				var vector = new THREE.Vector3(mx, my, 1);
				s.projector.unprojectVector(vector, s.camera);
				var ray = new THREE.Raycaster(s.camera.position, vector.sub(s.camera.position).normalize());
				
				var intersections = ray.intersectObjects(s.scene.children, true);
				if (intersections.length > 0) {
					s.invoke('picked', intersections[0].object);
				}
			}

			s.isMouseDown = false;
		}
	};

	function getPick(e) {
		return new THREE.Vector2( (e.touches ? e.touches[0].clientX : e.clientX),
							   (e.touches ? e.touches[0].clientY : e.clientY) );
	}

	Game.prototype.setSize = function(w, h) {
		if (w == undefined) {
			w = this.container.offsetWidth;
		}
		if (h == undefined) {
			h = this.container.offsetHeight;
		}

		this.renderer.setSize(w, h);
		this.camera.aspect = w / h;
		this.camera.updateProjectionMatrix();
	};

	Game.prototype.addEventListener = function(type, listener) {
		this[type].push(listener);
	};

	Game.prototype.removeEventListener = function(type, listener) {
		removeElement(this[type], listener);
	};

	function removeElement(arr, elem) {
		for (var i = 0; i < arr.length; i++) {
			if (arr[i] == elem) {
				arr.splice(i, 1);
			}
		}		
	}

	Game.prototype.invoke = function(type, param) {
		var t = this[type];
		if (this.debug && type != Game.UPDATE && type != Game.MOUSEMOVE) {
			console.log('-> ', type, ' event: ', param);
		};
		for (var i = 0; i < t.length; i++) {
			t[i](param);
		}
	};

	Game.prototype._start = function() {
		this.invoke('start');
	};

	Game.prototype._update = function() {
		requestAnimationFrame(this._update.bind(this));

		if (this.pause) {
			return;
		}

		// update functions
		this.invoke('update');

		this.sh.update();
		this.cameraController.update();
		this.renderer.render(this.scene, this.camera);
	};

	// 导入sea文件
	Game.prototype.load = function(url) {
		var s = this;

		s.sh.load(url);
		s.sh.onProgress = function(p) {
			for (var i = 0; i < s.progress.length; i++) {
				s.progress[i](p.progress);
			}			
		};
		s.sh.onComplete = function() {
			for (var i = 0; i < s.loadComplete.length; i++) {
				s.loadComplete[i]();
			}
		};
	};

	/**
	 * 让有贴图的材质自发光
	 * val: 0 ~ 1
	 */
	Game.prototype.letTextureEmissive = function(val) {
		if (!val) {
			val = 1;
		}
		var mats = this.sh.root.materials;
		if (!mats) {
			return;
		}
		for (var i = 0; i < mats.length; i++) {
			if (mats[i].map != null) {
				mats[i].emissive = new THREE.Color(val, val, val);
			}
		}
	};

	/**
	 * 得到相机与控制器的位置数据
	 */
	Game.prototype.printCameraInfo = function() {
		var p = this.camera.position;
		var r = this.camera.rotation;
		var t = this.cameraController.target;
		console.log('position:', p.x.toFixed(2) + ',' + p.y.toFixed(2) + ',' + p.z.toFixed(2), 
					'rotation:', r.x.toFixed(2) + ',' + r.y.toFixed(2) + ',' + r.z.toFixed(2),
					'target:', t.x.toFixed(2) + ',' + t.y.toFixed(2) + ',' + t.z.toFixed(2));
	};

	parent.Game = Game;
})(window);