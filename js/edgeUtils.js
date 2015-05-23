
/*
	Edge Utils 
	为多层切换时,需要设置layers与map
*/
var EU = function(sym) {
	var s = this;

	// 总符号
	s.sym = sym;

	// 2015/5/9 config -> {
	// 						layer(str), 
	// 						symbol(str), 
	// 						instart/inover(Function, Array), 
	// 						outstart/outover(Function, Array)}
	s.config = undefined;

	// 动画是否完成
	s.animOver 		 = true;
	s.ignoreAnimOver = false;

	// 层的索引
	s.currentIndex = 0;
	s.nextIndex    = 0;
	s.lastIndex    = 0;

	// 层切换方式: alpha/updwon/leftright
	s.changeLayerType = 'updown';

	// 鼠标数据
	s.isMouseDown  = false;
	s.lastPick     = {x:0, y:0};
	s.touchPick    = {x:0, y:0};
	s.thresholdDis = 200;

	// 屏幕宽高
	s.width  = window.innerWidth;
	s.height = window.innerHeight;

	// stage 参考宽度
	s.baseWidth     = 640;
	s.baseHeight    = 1008;
	
	// 阻止默认事件
	s.preventEvents = false;

	// 一些临时变量
	s.currentPosition = 0;

	// 向上滑动反应
	s.slideReaction = true;

	// 缩放大小
	s.scale = 1;

	console.log('eu created! version:1.0.20150513');
}

/**
 * config is Array
 */
EU.prototype.setConfig = function(config) {
	for (var i = 0; i < config.length; i++) {
		var cfg = config[i];
		cfg.instart = cfg.instart instanceof Array ? cfg.instart : cfg.instart instanceof Function ? [cfg.instart] : [];
		cfg.inover = cfg.inover instanceof Array ? cfg.inover : cfg.inover instanceof Function ? [cfg.inover] : [];		
		cfg.outstart = cfg.outstart instanceof Array ? cfg.outstart : cfg.outstart instanceof Function ? [cfg.outstart] : [];		
		cfg.outover = cfg.outover instanceof Array ? cfg.outover : cfg.outover instanceof Function ? [cfg.outover] : [];
	}
	this.config = config;
};

/**
 * 添加层切换事件
 * @param {int} layerID  config中层所在的index || 层的名称
 * @param {string} type     instart,inover,outstart,outover
 * @param {function} listener 事件处理方法
 */
EU.prototype.addLayerEvent = function(layer, type, listener) {
	if (this.config && this.config.length > 0) {
		try {
			var _layer = this.getLayer(layer);
			if (_layer) {
				_layer[type].push(listener);
			} else {
				console.log('NOT HAVE THIS LAYER: ', layer);
			}
		} catch (e) {
			console.log('EU addLayerEvent ERROR: ', e);	
		}
	}
};

/**
 * 移除层切换事件
 */
EU.prototype.removeLayerEvent = function(layer, type, listener) {
	if (this.config && this.config.lenght > 0) {
		var _layer = this.getLayer(layer);
		if (_layer) {
			removeArrElemnet(_layer[type], listener);
		}
	}
};

function removeArrElemnet (arr, element) {
	for (var i = 0; i < arr.length; i++) {
		if (arr[i] == element) {
			arr.splice(i, 1);
		}
	}
}

/**
 * 通过ID或名称得到Config中的层定义
 * @param  {number|string} layerIdOrName 层的ID或名称
 * @return {layer config}               层在Config中的定义
 */
EU.prototype.getLayer = function(layerIdOrName) {
	if (typeof layerIdOrName == 'number') {
		return this.config[layerIdOrName];
	} else if (typeof layerIdOrName == 'string') {
		for (var i = 0; i < this.config.length; i++) {
			if (this.config[i].layer == layerIdOrName) {
				return this.config[i];
			}
		}
	}
	return null;
};

EU.prototype.init = function(scale) {
	var s = this;

	// 先将其它层隐藏
	if (s.config != undefined && s.config.length > 1) {
		for(var i = 1; i < s.config.length; i++) {
			s.sym.$(s.config[i].layer).hide();
		}
	}

	if (scale == undefined) {scale = true;};

	if (scale) {
		// 缩放Stage
		s.scaleStage();

		// 加入窗口缩放时自适应窗口大小
		window.onresize = function()  {
			s.scaleStage();
		};
	};

	s.addEvents();
};

EU.prototype.addEvents = function() {
	var s = this;
	s.sym.getSymbolElement()[0].addEventListener('mousedown', function(e) {s.onMouseDown(e)});
	s.sym.getSymbolElement()[0].addEventListener('mousemove', function(e) {s.onMouseMove(e)});
	s.sym.getSymbolElement()[0].addEventListener('mouseup', function(e) {s.onMouseUp(e)});
	s.sym.getSymbolElement()[0].addEventListener('touchstart',function(e){s.onMouseDown(e)});
	s.sym.getSymbolElement()[0].addEventListener('touchmove',function(e){s.onMouseMove(e)});
	s.sym.getSymbolElement()[0].addEventListener('touchend',function(e){s.onMouseUp(e)});
};

/*
 	层切换的方法
 		fade:		Alpha过渡
		updown:		上下滑动
		leftright:	左右滑动
 */
EU.prototype.changeLayer = function(cl,nl,boo,time,type,complete) {
	var s = this;

	time = time || 300;
	if (boo == undefined) boo = true;
	type = type || 'updown';

	if (!s.animOver && !s.ignoreAnimOver) return;
	nl.show();

	s.animOver = false;

	// 2015/5/9 config in/out function invoke
	s.invoke(s.currentIndex, 'instart');
	s.invoke(s.lastIndex, 'outstart');

	switch(type) {
		// 淡入淡出
		case 'fade':
			nl.css('opacity',0);

			cl.animate({opacity:0},{
			duration:time,
			step:function(now,fx) {
					nl.css('opacity',1 - now);
				},
			complete:function() {
					cl.hide();
					s.animOver = true;
					if (complete) complete();
					s.invoke(s.lastIndex, 'outover');
					s.invoke(s.currentIndex, 'inover');
				}
			});
		break;
		// 上下页滑动
		case 'updown':
			var to = boo ? -s.baseHeight : s.baseHeight;
			nl.css('top',-to);
			nl.css('left',0);

			cl.animate({top: to},{
			duration:time,
			step:function(now,fx) {
					nl.css('top',now - to);
				},
			complete:function() {
					cl.hide();
					s.animOver = true;
					if (complete) complete();
					s.invoke(s.lastIndex, 'outover');
					s.invoke(s.currentIndex, 'inover');
				}
			});
		break;
		// 左右滑动
		case 'leftright':
			var to = boo ? -s.baseWidth : s.baseWidth;
			nl.css('left',-to);
			nl.css('top',0);

			cl.animate({left:to},{
				duration:time,
				step:function(now,fx) {
					nl.css('left',now - to);
				},
				complete:function() {
					cl.hide();
					s.animOver = true;
					if(complete) complete();
					s.invoke(s.lastIndex, 'outover');
					s.invoke(s.currentIndex, 'inover');
				}			
			});
		break;
	}
};

EU.prototype.invoke = function(index, type) {
	var _m = this.config[index][type];
	if (_m instanceof Array) {
		for (var i = 0; i < _m.length; i++) {
			_m[i]();
		}
	} else if (_m instanceof Function) {
		_m();
	}
};

EU.prototype.onMouseDown = function(e) {
	var s = this;

	// 标记鼠标已经按下
	e.preventDefault();

	if (s.preventEvents) return;

	if (!s.animOver && !s.ignoreAnimOver) return;

	s.isMouseDown = true;

	// 记录当前 Symbol 的时间
	var _sym = s.getCurrentSymbol();
	if (_sym) s.currentPosition = _sym.getPosition();

	// 记录鼠标位置
	s.lastPick.x = e.touches ? e.touches[0].pageX : e.pageX;
	s.lastPick.y = e.touches ? e.touches[0].pageY : e.pageY;
};

EU.prototype.onMouseMove = function(e) {
	var s = this;

	e.preventDefault();

	if (s.preventEvents) return;

	s.touchPick.x = e.touches ? e.touches[0].pageX : e.pageX;
	s.touchPick.y = e.touches ? e.touches[0].pageY : e.pageY;

	// 视差随上下滑动倒放
	if (s.isMouseDown && (s.animOver || s.ignoreAnimOver) && s.slideReaction) {
		var _sym = s.getCurrentSymbol();
		if (_sym) {
			var duration = s.currentPosition;
			var _y = e.touches ? e.touches[0].pageY : e.pageY;
			var len = Math.abs(_y - s.lastPick.y) / s.baseHeight * duration;
			_sym.stop(duration - len);
		}
	}
};

EU.prototype.onMouseUp = function(e) {
	var s = this;

	// 鼠标抬起
	s.isMouseDown = false;

	// 当鼠标释放按键时插入的代码将运行
	e.preventDefault();

	if (s.preventEvents) return;

	if (!s.animOver && !s.ignoreAnimOver) return;

	// 如果没有层数据,或层数少于2.则不需要层切换
	if (s.config == undefined || s.config.length < 2) return;

	var y_dis = s.touchPick.y - s.lastPick.y;

	if (y_dis > s.thresholdDis) {  			// 向下拖拽超过200像素
		if (s.currentIndex > 0) {
			s.nextIndex = s.currentIndex - 1;

			// do some works
			var nl = s.sym.$(s.config[s.nextIndex].layer);
			var cl = s.sym.$(s.config[s.currentIndex].layer);
			s.lastIndex = s.currentIndex;

			// 2015/2/11 转换之前将下一层的动画位置归0
			s.getCurrentSymbol(s.nextIndex).stop(0);

			s.currentIndex = s.nextIndex;
			s.changeLayer(cl,nl,false,300,s.changeLayerType,function() {s.playSym();});
			
		} else s.playerCurrentSymbol();
	} else if (y_dis < -s.thresholdDis) { 	// 向上拖拽超过200像素
		if (s.currentIndex < s.config.length - 1) {
			s.nextIndex = s.currentIndex + 1;

			// do some works
			var nl = s.sym.$(s.config[s.nextIndex].layer);
			var cl = s.sym.$(s.config[s.currentIndex].layer);
			s.lastIndex = s.currentIndex;

			// 2015/2/11 转换之前将下一层的动画位置归0
			s.getCurrentSymbol(s.nextIndex).stop(0);

			s.currentIndex = s.nextIndex;
			s.changeLayer(cl,nl,true,300,s.changeLayerType,function() {s.playSym();});
					
		} else s.playerCurrentSymbol();
	} else if (Math.abs(y_dis) > 10){		// 拖拽的Y轴距离小于200像素
		s.playerCurrentSymbol();
	}	
};

EU.prototype.slideLayer = function(isforward) {
	var s = this;
	if (!isforward) {isforward = true;};

	s.nextIndex = s.currentIndex + (isforward ? 1 : -1);
	var nl = s.sym.$(s.config[s.nextIndex].layer);
	var cl = s.sym.$(s.config[s.currentIndex].layer);

	s.lastIndex = s.currentIndex;
	s.getCurrentSymbol(s.nextIndex).stop(0);
	s.currentIndex = s.nextIndex;
	s.changeLayer(cl,nl,true,300,s.changeLayerType,function() {s.playSym();});
};

// 播放层动画
EU.prototype.playSym = function() {
	var s = this;
	s.animOver = false;
	
	var curSym, lastSym;
	if (s.config) {
		curSym = s.sym.getSymbol(s.config[s.currentIndex].symbol);
		lastSym = s.sym.getSymbol(s.config[s.lastIndex].symbol);

		if (lastSym) {lastSym.stop(0);};
		if (curSym) {curSym.play(-1);};
	};
};

EU.prototype.getCurrentSymbol = function(i) {
	var s = this;
	i = i || s.currentIndex;
	return s.sym.getSymbol(s.config[i].symbol); 
};

EU.prototype.playerCurrentSymbol = function(time) {
	var s = this;
	var sym = s.getCurrentSymbol();
	if (sym) sym.play(time);
};

EU.prototype.scaleStage = function(val) { 
	var s = this;

	val = val || s.baseWidth;

	var stage = s.sym.$('Stage');
	var delta = window.innerHeight / window.innerWidth;
	s.baseHeight = val * delta;
	s.scale =  window.innerWidth / val;

	stage.css('width',val);
	stage.css('height',s.baseHeight);

	stage.css('transform','scale(' + s.scale + ')');
	stage.css('-webkit-transform','scale(' + s.scale + ')');
	stage.css('-ms-transform','scale(' + s.scale + ')');
	stage.css('-moz-transform','scale(' + s.scale + ')');

	stage.css('transform-origin','0 0');
	stage.css('-webkit-transform-origin','0 0');
	stage.css('-ms-transform-origin','0 0');
	stage.css('-moz-transform-origin','0 0');
}

EU.prototype.setBaseWidth = function(val) {	
	this.baseWidth = val;
	this.scaleStage();
};

EU.prototype.getPick = function(e,index) {
	index = index || 0;
	var res = {x:0,y:0};
	res.x = e.touches ? e.touches[index].pageX : e.pageX;
	res.y = e.touches ? e.touches[index].pageY : e.pageY;
	return res;
};

EU.prototype.getPickX = function(e,index) {
	index = index || 0;
	return e.touches ? e.touches[index].pageX : e.pageX;
};

EU.prototype.getPickY = function(e,index) {
	index = index || 0;
	return e.touches ? e.touches[index].pageY : e.pageY;
};
