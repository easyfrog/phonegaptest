
/**
 * 常用的一些方法
 */
(function(){

	window.ztc = window.ztc || {};
	window.z = window.ztc;

	var tools = tools || {};

	/**
	 * cookie
	 */
	tools.setCookie = function(name,value,days) {
		var date = new Date();
		days = days || 14;
		date.setDate(date.getDate() + days);

		document.cookie = name + '=' + value + '; expires=' + date;
	};

	tools.getCookie = function(name) {
		var arr = document.cookie.split('; ');
		for (var i = 0; i < arr.length; i++) {
			arr2 = arr[i].split('=');
			if (arr2[0] == name) {
				return arr2[1];
			};
		};

		return null;
	};

	tools.removeCookie = function(name) {
		tools.setCookie(name, 1, -1);
	};

	/**
	 * localStorage
	 */
	tools.setItem = function( name, value ) {
		localStorage.setItem(name, value);
	};

	tools.getItem = function( name ) {
		return localStorage.getItem(name);
	};

	tools.removeItem = function( name ) {
		localStorage.removeItem(name);
	};

	/**
	 * Scale to Fix Screen
	 */
	tools.scaleToFixScreen = function( stageElement, baseWidth ) {
		scaleStage(stageElement, baseWidth);
		window.onresize = function() {
			scaleStage(stageElement, baseWidth);
		};
	};

	var scaleStage = function( stageElement, baseWidth ) { 
		val = baseWidth || 640;

		var delta = window.innerHeight / window.innerWidth;
		var baseHeight = val * delta;
		var scale =  window.innerWidth / val;
		stageElement.css('width',val);
		stageElement.css('height',baseHeight);

		stageElement[0].style.transform             = 'scale(' + scale + ')';
		stageElement[0].style.WebkitTransform       = 'scale(' + scale + ')';
		stageElement[0].style.MsTransform           = 'scale(' + scale + ')';
		stageElement[0].style.MozTransform          = 'scale(' + scale + ')';
		
		stageElement[0].style.transformOrigin       = '0 0';
		stageElement[0].style.WebkitTransformOrigin = '0 0';
		stageElement[0].style.MsTransformOrigin     = '0 0';
		stageElement[0].style.MozTransformOrigin    = '0 0';
	};

	/**
	 * Scroll Object
	 */
	tools.scroll = function (element, eventHolder) {
		new scrollClass(element, eventHolder);
	};

	var scrollClass = function(element, eventHolder) {
		var s = this;

		s.ele         = element;
		s.eh          = eventHolder;
		s.isMouseDown = false;
		s.lastPick    = {x:0,y:0};
		s.curPick     = {x:0,y:0};

		s.addEvents();

	};

	scrollClass.prototype.addEvents = function() {
		var s = this;
		s.eh.addEventListener('mousedown', function(e){s.md(e);});
		s.eh.addEventListener('mousemove',  function(e){s.mm(e);});
		s.eh.addEventListener('mouseup',    function(e){s.mu(e);});
		s.eh.addEventListener('touchstart',function(e){s.md(e);});
		s.eh.addEventListener('touchmove',  function(e){s.mm(e);});
		s.eh.addEventListener('touchend',   function(e){s.mu(e);});
	};

	scrollClass.prototype.md = function(e) {
		var s = this;
		
		s.lastPick.x = e.touches ? e.touches[0].pageX : e.pageX;
		s.lastPick.y = e.touches ? e.touches[0].pageY : e.pageY;

		var rect = s.ele.getBoundingClientRect();

		if (s.lastPick.x >= rect.left && s.lastPick.x <= rect.right && 
			s.lastPick.y >= rect.top && s.lastPick.y <= rect.bottom) {
			s.isMouseDown = true;
			s.lastScrollTop = s.ele.scrollTop;
		};
	};

	scrollClass.prototype.mm = function(e) {
		var s = this;

		if (!s.isMouseDown) {return;};

		s.curPick.x = e.touches ? e.touches[0].pageX : e.pageX;
		s.curPick.y = e.touches ? e.touches[0].pageY : e.pageY;

		var delta = s.curPick.y - s.lastPick.y;
		s.ele.scrollTop = s.lastScrollTop - delta;
	};

	scrollClass.prototype.mu = function(e) {
		this.isMouseDown = false;
	};

	/**
	 * 判断是否是在PC端及是否为微信浏览器
	 */
	tools.getPlatform = function() {
		var userAgentInfo = navigator.userAgent;  
         var Agents = new Array("Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod");  
         var isPC = true;  
         var platform = 'PC';
         var isWX = false;
         for (var v = 0; v < Agents.length; v++) {  
             if (userAgentInfo.indexOf(Agents[v]) > 0) { 
             	isPC = false; 
             	platform = Agents[v];

             	if (userAgentInfo.indexOf('MicroMessenger') > 0) {
             		isWX = true;
             	};

             	break; 
             }  
         }  
         return {
         	isPC:isPC,
         	isWX:isWX,
         	platform:platform
         };
	};

	/**
	 * 微信中的一些常用方法
	 */
	tools.wx = tools.wx || {};

	tools.wx.shareData = {};

	/**
	 * 微信分享及初始化
	 * @param  {json} params {
	 *                       	server: default is 'https://general-easyfrog.rhcloud.com/wx' ,
	 *                        	shareData: {
	 *                        		title:'',
	 *                        		desc:'',
	 *                        		link:'url',
	 *                        		imgUrl:'.../xx.jpg',
	 *                        		success:function(),
	 *                        		cancel:function()
	 *                        	},
	 *                        	url:default is sharData.link,
	 *                        	appName: default is 'zhixuan',
	 *                        	debug: default is false,
	 *                        	jsApiList:[],	// default checkApi,frend, timeLine
	 *                        	appendApiList:[],
	 *                        	callback:function(res),	// res: the wx server result.
	 *                        	appendFunctions:[function(params)...], 	// wx.ready callback array
	 *                       }
	 * @return {void}
	 */
	tools.wx.init = function( params ) {
		if (!ztc.jsonp) {
			console.log('not have ztc and ztc.jsonp function.');
			return;
		};

		if (!window.wx) {
			console.log('not have wx sdk: http://res.wx.qq.com/open/js/jweixin-1.0.0.js');
			return;
		};

		var server = params.server || 'https://general-easyfrog.rhcloud.com/wx';

		// define shareData
	    tools.wx.shareData = params.shareData || {
	    	title: '分享标题',
	    	desc: '分享描述',
	    	link: 'http://baidu.com',
	    	imgUrl: 'http://www.easyicon.net/api/resize_png_new.php?id=1185704&size=128',
	    	success: function () { },
	    	cancel: function () { }
	    };

	    params.url = params.url || tools.wx.shareData.link;
	    tools.wx.isReady = false;

		ztc.jsonp(server, {
			appName: params.appName || 'zhixuan',
			url: params.url.split('#')[0]
		}, function(res) {
			// 开始配置微信JS-SDK
			wx.config({
		        debug: params.debug || false,
		        appId: res.appId,
		        timestamp: res.timestamp,
		        nonceStr: res.nonceStr,
		        signature: res.signature,
		        jsApiList: params.jsApiList || [
		            'checkJsApi',
		            'onMenuShareTimeline',
		            'onMenuShareAppMessage',
		        ].concat(params.appendApiList || [])
		    });

		    wx.error(function(res) {
		    	console.log('wx error:', res);
		    });

			// 调用微信API
		    wx.ready(function(){
		    	wx.onMenuShareTimeline(tools.wx.shareData);
				wx.onMenuShareAppMessage(tools.wx.shareData);

				// 调用其它的API方法
				if (params.appendFunctions) {
					for (var i = 0; i < params.appendFunctions.length; i++) {
						params.appendFunctions[i](params);
					};
				};

				tools.wx.isReady = true;
			});

		    // 调用回调
		    if (params.callback) {params.callback(res)};
		});
	};

	window.t = window.ztc.tools = window.ztc.tools || tools;
}());