
/**
 * Ajax 功能现实
 */
(function( parent ){

	// ztc namespace
	parent.ztc = parent.ztc || {};

	/**
	 * Ajax 实现
	 *
	 * ajax({
	 * 		url:'http://localhost:27019',
	 * 		success:function(str) {
	 * 			console.log(str);
	 * 		},
	 * 		error:function(status) {
	 * 			console.log('error: ' + status);
	 * 		}
	 * 	})
	 */

	var ajax = function( params ) {
		var xhr = new XMLHttpRequest();

		var url     = params.url;
		var method  = params.method  || 'GET';
		var async   = params.async   || true;
		var success = params.success || null;
		var error   = params.error   || null;
		var data    = params.data    || null;

		// ready state change event handler
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				if (xhr.status == 200) {
					if (success) {success(xhr.responseText);};
				} else {
					if (error) {error(xhr.status);};
				}
			};
		};

		xhr.addEventListener("load", function() {}, false);
		xhr.addEventListener("error", function() {}, false);
		xhr.addEventListener("abort", function() {}, false);

		/*
		// progress event handler
		xhr.upload.addEventListener('progress', function(evt) {
			//evt.lengthComputable,文件是否是空
			//evt.loaded：文件上传的大小   
			//evt.total：文件总的大小 

			if (evt.lengthComputable) {
				var percent = ((evt.loaded / evt.total) * 100).toFixed(1);
			}
			
			if (params.progress) {
				params.progress(evt);
			}
		}, false);
		//*/

		xhr.open(method, url, async);	
		xhr.send(data);
	};

	parent.ztc.ajax = ajax;


	/**
	 * jsonp 实现
	 *
	 * jsonp("http://localhost:27019", {
	 * 	'db':'general',
	 * 	'coll':'project1',
	 * 	'method':'insert',
	 * }, function(str) {
	 * 	console.log(str);
	 * });
	 */
	
	var jsonp = function(url, data, func, timeout) {
		// 回调函数名
		var cbStr = 'cb_' + (new Date().getTime());

		url = url + (url.indexOf('?') == -1 ? '?' : '&') + parseData(data) +
			 '&callback=' + cbStr;

		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = url;
		script.id = 'id_' + cbStr;

		timeout = timeout || 8000;
		var timeout_id = 0;

		window[cbStr] = function(str) {
			clearTimeout(timeout_id);
			jsonpRemove(cbStr);
			func(str);
		}

		var head = document.getElementsByTagName('head');

		if (head && head[0]) {
			head[0].appendChild(script);

			// Timeout
			timeout_id = setTimeout(function(){
				jsonpRemove(cbStr);
				
				// 如果超时,则返回原res为undefined
				func();
			}, timeout);
		};
	};

	var jsonpRemove = function( str ) {
		window[str] = undefined;
		var elem = document.getElementById('id_' + str);
		elem.parentNode.removeChild(elem);
	};

	var parseData = function( data ) {
		var res = '';
		if (typeof data === 'string') {
			res = data;
		} else if (typeof data === 'object') {
			var tmp = false;
			for (var key in data) {
				res += (tmp ? '&' : '') + key + '=' + 
					   encodeURIComponent(typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]);
				tmp = true;
			}
		};

		return res;
	};

	parent.ztc.jsonp = jsonp;

}(window));