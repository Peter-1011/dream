// <script type="javascript" PiersEntrance="Main.init" PiersXMods="Forms,UI" src="piers/init.js"></script>
(function(){
	let Piers,OBJ,DOM,URL,DATA,Path,s,i;
	async function __import__ (url) { // {{{
		// __import__ (url.js) => {currentScript.value}
		return await new Promise(function (or, oe) {
			let e = DOM (Object.assign(url.endsWith(".css") ? {
				"T": "link", "A": { "rel": "stylesheet", "href": url }
			} : {
				"T": "script", "V": { "value": {} }, "A": { "src": url }
			},{
				"E": {
					"load": async function () {
						or(await Promise.resolve(this.value));
						e.parentNode.removeChild(e);
					},
					"error": async function (e) {
						oe(await Promise.resolve(e));
						e.parentNode.removeChild(e);
					}
				}
			})).join(document.head).E;
		});
	}	// }}}
	async function __fetch__ (url, options=undefined) { // {{{
		// __fetch__(url, options) => JSON object
		const response=await fetch(url,options), reader=response.body.getReader();
		let c, s="";
		while (!(c=await reader.read()).done)
			s += await new TextDecoder("utf-8").decode(c.value);
		return JSON.parse(s);
	}	// }}}
	async function __upload__ (type, mul) { // {{{
		return await new Promise(function (or, oe) {
			let e = Piers.DOM({
				"T": "input",
				"V": { "multiple": mul },
				"A": {
					"type": "file",
					"accept": type||"*/*"
				},
				"S": {
					"position": "absolute",
					"top": "100%"
				},
				"E": {
					"error": oe,
					"change": function (evt) {
						let i,r=[];
						for(i=0;i<this.files.length;i++) r.push(this.files[i]);
						or(r);
						if (this.parentNode)
							this.parentNode.removeChild(this);
					}
				}
			});
			e.join(document.body);
			e.E.click();
			setTimeout(function () {
				if (e.E.parentNode)
					e.E.parentNode.removeChild(e.E);
			}, 3000);
		});
	}	// }}}

	if( !( "find" in Array.prototype ) ) // {{{
		Array.prototype.find = function( cb, self ){
			var x;
			for( x=0; x<this.length; x++ )
				if( cb.call(self,this[x],x,this) )
					return this[x];
		};
	// }}}
	if( !( "assign" in Object ) ) // {{{
		Object.assign = function(){
			var b,i,j;
			b = arguments[0];
			for( i=1; i<arguments.length; i++ ){
				for( j in arguments[i] )
					b[j] = arguments[i][j];
			}
			return b;
		};
	// }}}
	if( !( "keys" in Object ) ) // {{{
		Object.keys = function(){
			var r=[];
			for (i in r)
				r.push(i);
			return r;
		};
	// }}}
	if( !FileReader.prototype.readAsBinaryString ) // {{{
    	FileReader.prototype.readAsBinaryString = function( fileData ){
			var pt=this,binary="",reader;
			reader = new FileReader();
			reader.onload = function( e ){
				var bytes,length,evt,i;
				bytes = new Uint8Array( reader.result );
				length = bytes.byteLength;
				for( i=0; i<length; i++ )
					binary += String.fromCharCode(bytes[i]);
				pt.content = pt.IEResult = binary;
				Piers.DOM(pt).sendEvent("load");
    		};
			reader.readAsArrayBuffer(fileData);
		};
	// }}}

	RXESC={ "\\":"\\\\",".":"\\." };
	Path={ // {{{
		"join": function (parts, sep="/") {
			let xs=RXESC[sep] || sep;
			return (parts[0].startsWith("/") ? "/" : "") + parts.map(function (v) {
				return (new RegExp("[^"+xs+"].*[^"+xs+"]")).exec(v)[0]
			}).filter(
				(v)=>v
			).join(sep)
		},
		"dirname": function (path, sep="/") {
			let xs=RXESC[sep] || sep;
			try{
				return (new RegExp("(.*)"+xs+"[^"+xs+"]*")).exec(path)[1];
			}catch(x){ return ""; }
		},
		"basename": function (path, sep="/") {
			let xs=RXESC[sep] || sep;
			try{
				return (new RegExp(".*"+xs+"([^"+xs+"]*)")).exec(path)[1];
			}catch(x){ return path; }
		}
	}	// }}}

	OBJ=function (o, t="obj") { // {{{
		class _C_ {
			constructor (o) {
				this.O = o
			}
			keys () {
				Object.keys(this.O);
			}
			isEmpty () {
				return this.keys().length > 0;
			}
			assign (o) {
				Object.assign(this.O, o);
			}
			forEach (cb) {
				for(let k in this.O)
					cb(this.O[k], k)
			}
			reduce (cb, r) {
				for(let k in this.O)
					r=cb(r, this.O[k], k)
				return r;
			}
			filter (cb) {
				this.reduce(function (r,v,k) {
					if (cb(v,k)) r[k]=v;
					return r;
				},{});
			}
			get (p=[], dv="") {
				try{
					if (!Array.isArray(p)) p=p.split(".").filter((v)=>v);
					return (p||[]).reduce(function(r,i){
						return r[i];
					},this.O);
				}catch(e){ return dv; }
			}
			put (p=[], v="") {
				if (!Array.isArray(p)) p=p.split(".").filter((v)=>v);
				let n=p.pop(), o;
				console.assert(p.length>=0, "OBJ.put(empty path("+p+","+v+"))");
				o = p.reduce(function (r, i) {
					if (!r[i])
						r[i]={};
					return r[i];
				}, this.O);
				o[n] = v;
			}
			and (B) {
				// and({OBJECT_B}) => {OBJECT_NEW}
				let self=this;
				console.assert('object'===typeof(this.O), "OBJ(not an object).and(...)");
				console.assert('object'===typeof(B), "OBJ.and(not an object)");

				if (Array.isArray(B))
					return X.assert_array(this.O, "operand A is not an array")
					.reduce(function (r, v) {
						if (B.indexOf(v)>=0) r.push(v);
						return r;
					}, []);

				return self.reduce(function (r, v, k) {
					if (k in B)
						r[k]=('object'===typeof(v) && 'object'===typeof(B[k]))
							? (new _C_(v)).and( B[k]) : v;
					return r;
				}, {});
			}
			or (B) {
				// or({OBJECT_B}) => {OBJECT_NEW}
				let self=this;
				console.assert('object'===typeof(this.O), "OBJ(not an object).or(...)");
				console.assert('object'===typeof(B), "OBJ.or(not an object)");
	
				return (function join (a, b) {
					if (Array.isArray(b)) {
						console.assert(Array.isArray(a), "OBJ.or.join(not an Array,...)");
						return b.reduce(function (r,v) {
							if (r.indexOf(v)<0) r.push(v);
							return r;
						}, [...a]);
					}
					let aa=Object.assign({}, a), k;
					for (k in b)
						switch (typeof(a[k])+"-"+typeof(b[k])) {
						case "object-object":
							aa[k] = join(aa[k], b[k]);
							break;
						default:
							if (b[k]===undefined)
								delete aa[k];
							else
								aa[k] = b[k];
							break;
						}
					return aa;
				})(this.O, B);
			}
			remove (B) {
				let self=this;
				console.assert('object'===typeof(this.O), "OBJ(not an object).remove(...)");
				console.assert('object'===typeof(B), "OBJ.remove(not an object)");

				return (function remove (a, b) {
					if (Array.isArray(b)) {
						console.assert(Array.isArray(a), "OBJ.remove.remove(not an Array,...)");
						a.reduce(function(r, v){
							if (b.indexOf(v)<0) r.push(v);
							return r;
						}, []);
					}
					self.reduce(function(r, v, k){
						switch (typeof(v)+"-"+typeof(b[k])) {
						case "object-object":
							r[k]=remove(v, b[k]);
							break;
						default:
							if (!b[k]) r[k]=v;
							break;
						}
						if (r[k]===undefined) delete r[k];
						return Object.keys(r).length>0 ? r : undefined;
					}, {});
				})(this.O, B);
			}
			copy (deep=false) {
				return deep ? JSON.parse(JSON.stringify(this.O)) : this.assign({}, this.O);
			}
			methodCall (func) {
				return func.apply(this.O, arguments);
			}
			toJSON (replacer=undefined, space=undefined) {
				return JSON.stringify(this.O, replacer, space);
			}
			toQueryString (qo) {
				return this.reduce(function (r,v,k) {
					return r + "&"+k+(v===true?"":("="+encodeURIComponent(v)));
				}, "").replace(/^&/,'?');
			}
		}
		switch(t){
		case "json":
			o=JSON.parse(o);
			break;
		case "querystring":
			o=o.replace(/^\?/, '').split(/&/).reduce(function (r,i) {
				if (i=/^([^=]+)(=(.*)){0,1}/.exec(i))
					r[decodeURIComponent(i[1])] = i[2]
					? decodeURIComponent(i[3]) : true;
				return r;
			}, {})
			break;
		}
		return new _C_(o);
	}; // }}}
	DOM=function (e, t="element") { // {{{
		class _C_ {
			constructor (e) {
				// new _C_ (
				//     <ELEMENT> ||
				//     {
				//         "T":"",
				//         "A":{"border":"1",...},
				//         "S":{"width":"30%",...},
				//         "V":{"value":100,...},
				//         "E":{"click":cb,...},
				//         "C":["Text",{...}]
				//     }
				// ) => {_C_}
				console.assert(e, "DOM(null)");
				this.E=e.nodeType===1 ? e : (function(pf){
					var self=this;
					let e,i;
					if( "string" === typeof(pf) )
						return document.createTextNode(pf);
					console.assert("T" in pf, "DOM(",pf,")");
					if( "T" in pf ) e = document.createElement(pf.T);
					if( "A" in pf ) for( i in pf.A ) e.setAttribute(i,pf.A[i]);
					if( "S" in pf ) for( i in pf.S ) e.style[i] = pf.S[i];
					if( "V" in pf ) for( i in pf.V ) e[i] = pf.V[i];
					if( "E" in pf ) for( i in pf.E ) e.addEventListener(i,pf.E[i]);
					if( "C" in pf ){
						console.assert(Array.isArray(pf.C),"profile.C is not an array");
						pf.C.forEach((i)=>e.appendChild((new _C_(i)).E));
					}
					return e;
				})(e);
			}
			async load (src, type="text/html", reverse=false) {
				// await loadDOM("http://....");
				// await loadDOM("<!DocType:html><html><body>Not found</body></html>","text/html");
				let dom=src.startsWith("<")
					? (new DOMParser()).parseFromString(src, type)
					: await Piers.URL(src).request();
				console.assert(dom,"DOM.load(Parameter Error)");
				return (function(rt){
					console.log(this,rt);
					if(rt)
						return (new _C_(rt)).reduce(function(r,e){
							if (e.nodeType==1) r.add(e, reverse);
							return r;
						}, undefined, this);
					this.add(dom.firstChild);
				}).call(this,dom.querySelector("body"));
			}
			select (qs) {
				// select( "CSS_SELECTOR_STRING" ) => <ELEMENT>
				qs=this.E.querySelector(qs)
				console.assert(qs, "DOM.Select => Failed to select");
				return qs;
			}
			find (qs) {
				// find(
				//    CSS_SELECTOR_STRING ||    // CSS selector query string to match elements
				//    (<ELEMENT>) => true|false // callback to match elements
				// ) => <ELEMENT>
				qs=(function (self, vf) {
					for (let e=self.E; e; e=e.parentNode)
						if (e.nodeType==1 && vf(e)) return e;
				})(this, 'string' === typeof(qs) ? ((i)=>i.matches ? i.matches(qs) : false) : qs );
				console.assert(qs, "DOM.find => Failed to find");
				return qs;
			}
			forEach (cb, qs) {
				// forEach(
				//     (<ELEMENT>),         // callback function for all matched element
				//     CSS_SELECTOR_STRING, // CSS selector compatible query string
				// ) => this
				if (qs)
					for (let i=0,s=this.E.querySelectorAll(qs); i<s.length; i++) cb(s[i]);
				else
					for (let e=this.E.firstChild; e; e=e.nextSibling) cb(e);
				return this;
			}
			reduce (cb, qs, r={}) {
				try {
					if (qs)
						for (let i=0,s=this.E.querySelectorAll(qs); i<s.length; i++){
							let rr=cb(r, s[i]);
							r=rr===undefined ? r : rr;
						}
					else
						for (let e=this.E.firstChild; e; e=e.nextSibling)
							if(e.nodeType===1){
								let rr=cb(r, e);
								r=rr===undefined ? r : rr;
							}
				} catch( x ) {
					console.log("Error",this,x);
				}
				return r;
			}
			dfs (cb, qs, r={}, xself=false) {
				// dfs(
				//     ({OBJECT-R}, <ELEMENT>) => false|true, // callback function for each matched element in dfs traverse and {OBJECT-R},
				//                                            // return true to stop go deep
				//     CSS_SELECTOR_STRING,                   // CSS selector compatible query string to filter elements
				//     {OBJECT-R},                            // object passed to callback function
				//     false|true                             // true if root element called
				// ) => {OBJECT-R}
				if(!xself) cb(r, this.E);
				for (let e=this.E.firstChild; e; e=e.nextSibling) {
					if (e.nodeType!==1) continue;
					if (qs && !e.matches(qs)) continue;
					if (!cb(r,e)) DOM(e).dfs(cb,qs,r);
				}
				return r;
			}
			get () {
				// get() => value
				return "value" in this.E ? this.E.value : this.E.textContent;
			}
			set (val) {
				// set(value) => this
				if ("value" in this.E) this.E.value = val; else this.E.textContent = val || "";
				return this;
			}
			read (an) {
				// get values from DOM
				// read("ATTRIBUTE_NAME") => {DATA}
				// EXAMPLE: ==================================
				// <body>
				//   <input VN="A" value="100"/>
				//   <span VN="B">200</span>
				// </body>
				// (new _C_(document.body)).get("VN") => {"A":"100","B":"200"}
				return this.reduce(function (r, v) {
					r[v.getAttribute(an)] = Piers.DOM(v).get();
					return r;
				}, "["+an+"]", {});
			}
			write (d, an) {
				// set values to DOM
				// write({DATA}, "ATTRIBUTE_NAME") => this
				// EXAMPLE: ==================================
				// (new _C_(document.body)).set({"A":"100","B":"200"}, "VN") => this
				// => <body>
				//   <input VN="A" value="100"/>
				//   <span VN="B">200</span>
				// </body>
				this.forEach(function (v) {
					Piers.DOM(v).set(d[v.getAttribute(an)]);
				}, "["+an+"]");
				return this;
			}
			clear () {
				// remove all child elements
				// clear() => this
				while (this.E.firstChild)
					this.E.removeChild(this.E.firstChild);
				return this;
			}
			join (e, reverse=false) {
				// join as e's children
				// join(<ELEMENT>) => this
				e.insertBefore(this.E, reverse ? e.firstChild : undefined);
				return this;
			}
			add (plan, reverse=false) {
				this.E.insertBefore(
					plan.nodeType===1 ? plan : (new _C_(plan)).E,
					reverse ? this.E.firstChild : undefined
				);
				return this;
			}
			quit () {
				if (this.E.parentNode)
					this.E.parentNode.removeChild(this.E)
			}
			isContained (p) {
				try{
					return !!this.find((v)=>v===p);
				}catch(x){ return false; }
			}
			isSibling (s) {
				return this.E.parentNode === s.parentNode; 
			}
			bind (hndl, options={}) {
				// options.et = "click",
				// options.cs = undefined
				let Opts=Object.assign({"et":"click"},options), e;
				e="string"===typeof(Opts.cs) ? this.select(Opts.cs) : this.E;
				if (e.__BoundHandlers__) {
					console.assert(e.__BoundHandlers__.indexOf(Opts.et) < 0, "DOM.bind => Already bound");
					e.__BoundHandlers__.push(Opts.et);
				} else e.__BoundHandlers__=[Opts.et];
				e.addEventListener(Opts.et, function(event){
					console.log("TRIGGER");
					var e=event.target;
					event.stopPropagation();
					if (e.hasAttribute("Pending")) return;
					e.setAttribute("Pending",e.toString());
					Promise.resolve(hndl(event.target)).then((r)=>e.removeAttribute("Pending"), console.log);
				});
			}
			sendEvent (name, args) {
				let evt = args ? new CustomEvent(name, args) : new Event(name);
				this.E.dispatchEvent(evt);
				return evt;
			}
		}
		switch (t) {
		case "selector":
			e=document.body.querySelector(e);
			break;
		}
		return new _C_(e);
	}; // }}}
	Object.assign(DOM,{
		"updateAttr":(e,an,cb)=>e.setAttribute(an, cb(e.getAttribute(an)))
	});
	URL=function (us) { // {{{
		class UC {
			constructor (proto, host, port, pathname, qs) {
				this.Proto=proto;
				this.Host=host;
				this.Port=port;
				this.Pathname=pathname;
				this.Queries=qs ? OBJ(qs,'querystring').O : {};
				this.Headers={};
				this.Method="GET";
				this.Body=undefined;
			}
			toString () {
				return this.Proto
				?   (this.Proto+"//"+this.Host+(this.Port?(":"+this.Port):"")+this.Pathname)
					+ Piers.OBJ(this.Queries)
						.reduce((r,v,k)=>r+"&"+k+"="+v, "")
						.replace(/^&/,'?')
				:	this.Pathname
					+ Piers.OBJ(this.Queries)
						.reduce((r,v,k)=>r+"&"+k+"="+v, "")
						.replace(/^&/,'?');
			}
			addQS (n, v) {
				if(v===""||v) this.Queries[n]=v; else delete this.Queries[n];
				v = OBJ(this.Queries).toQueryString();
				this.search = v ? ("?"+v) : "";
				return this;
			}
			addHeader (n, v) {
				if(v===""||v) this.Headers[n]=v; else delete this.Headers[n];
				return this;
			}
			setBody (bb) {
				if(bb){
					this.Method="POST";
					if (bb instanceof Blob)
						this.Body=bb;
					else if ('object' === typeof(bb))
						this.Body=new Blob(
							[JSON.stringify(bb)],
							{"type":"application/json"}
						);
					else
						this.Body=new Blob(
							[bb],
							{"type":"plain/text"}
						);
				}else{
					this.Method="GET";
					this.Body=undefined;
				}
				return this;
			}
			async request () {
				let bb=await DATA.request(this);
				try{
					return await bb.decode();
				}catch(x){
					console.log("EXCEPTION:",x);
				}
			}
		}

		let i;
		console.assert(
			i=/^([a-zA-Z]+:)\/\/([^\/:\?]+)(:\d+)?(\/[^\?]+)?(\?.*)?$/.exec(us) ||
			  /^()()()([^\?]+)?(\?.*)?$/.exec(us),
			"Failed to parse URL input:"+us
		);
		i=new UC(
			i[1], // scheme
			i[2], // hostname
			i[3] ? parseInt(i[3].substr(1)) : 80, // port
			i[4], // pathname
			i[5]||"" // query-string
		);
		return i;
	}	// }}}
	DATA=function (b, t) { // {{{
		class BB {
			constructor (b, t) {
				t=t||"application/json";
				if (!(b instanceof Blob)) {
					if ("object"===typeof(b)) {	
						b = JSON.stringify(b);
						t = "application/json";
					}
					b = new Blob([b], {"type":(t||"text/plain")+";charset=utf8"});
				}
				this.B=b;
			}
			getText () {
				return this.B.text();
			}
			getType () {
				return this.B.type.replace(/;.*/,'');
			}
			async getDataURL () {
				let b=this.B, r=new FileReader();
				return await new Promise(function(or,oe){
					try{
						r.addEventListener("load",(e)=>or(e.target.result));
						r.addEventListener("error",oe);
						r.readAsDataURL(b);
					}catch(e){ or( "data:"+b.type+";base64,"+btoa(b.data) ); }
				});
			}
			async decode () {
				let self=this, r=new FileReader(), b=this.B, type=this.getType();
				type = type.replace(/;.*/,'');
				switch(type){
					case "application/json":
						return await (new Promise(function(or,oe){
							r.addEventListener("error", oe);
							r.addEventListener("load",function(event){
								try{
									or(JSON.parse(event.target.result))
								}catch(x){
									console.log(x);
									or(event.target.result);
								}
							});
							r.readAsText(b);
						}));
					case "image/jpeg": case "image/png": case "image/gif":
					case "application/pdf":
						return await this.getDataURL();
					case "text/html": case "image/svg+xml":
						return await (new Promise(function(or,oe){
							r.addEventListener("error", oe);
							r.addEventListener("load", (event)=>or(
								(new DOMParser()).parseFromString(event.target.result, type)
							));
							r.readAsText(b);
						}));
					default:
						return await (new Promise(function(or,oe){
							r.addEventListener("error",oe);
							r.addEventListener("load", (event)=>or(
								event.target.result)
							);
							r.readAsText(b);
						}));
				}
			}
			async saveAs (n) {
				let e=Piers.DOM({
					"T":"A",
					"A":{
						"href": await this.getDataURL(),
						"target": "_blank",
						"download": n||"download"
					},
					"S":{"left":"-100%"}
				}).join(document.body);
				e.E.click();
				setTimeout(function(){ document.body.removeChild(e.E); },500);
			}
		}	// class BB
		return new BB(b, t);
	}	// }}}
	Object.assign(DATA,{ // {{{
		"upload": async function (ct, mul) {
			return (await __upload__(ct, mul)).map(function (f) {
				return DATA(f);
			});
		},
		"fetch": async function (url, options=undefined) {
			return DATA(await (await fetch(url, options)).blob());
		},
		"request": async function (U) {
			let self=this,
				r=new XMLHttpRequest(),
				or, oe, ps;
			ps=new Promise(function(o_r,o_e){ or=o_r; oe=o_e; });

			// r.addEventListener("progress", (event)=>console.log(event.lengthComputable?(event.loaded/event.total):-1));
			r.addEventListener("load", function(){
				r.status !== 200 ? oe("Not found") : or(r.response);
			});
			r.addEventListener("abort",function(){ oe("aborted"); });
			r.addEventListener("error",function(e){ oe(e); });

			r.open(U.Method, U.toString(), true);
			for (let i in U.Headers)
				r.setRequestHeader(i, U.Headers[i]);
			r.responseType="blob";
			if (U.Body) {
				let bb = DATA(U.Body);
				r.setRequestHeader('Content-Type',bb.B.type);
				r.send(bb.B);
			} else r.send();
			return DATA(await ps)
		}
	});	// }}}

	let UID_COUNT=0;
	Piers=window.Piers={
		"Env":{
			"Args" : OBJ( (window.location.search||'?').substr(1), 'querystring' ),
			"Mobile" : /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
			"OnTop" : window.self === window.top,
			"PierPath" : "",
			"PierArgs" : {}
		},
		"Path": Path,
		"OBJ": OBJ, "DOM": DOM, "URL": URL, "DATA": DATA,

		"getUID": function () {
			UID_COUNT++;
			return ((new Date()).getTime()*1000+(UID_COUNT%1000)).toString(36);
		},

		"new": function() {
			let obj,args;
			for (obj=1,args=[]; obj<arguments.length; obj++) args.push(arguments[obj]);
			obj=arguments[0];
			if("string"===typeof(obj)) obj=Piers[obj];
			return ((a,b,c,d,e,f)=>(new obj(a,b,c,d,e,f))).apply(this,arguments);
		},
		"import": __import__,
		"upload": __upload__,
		"sleep": (ms) => (new Promise(
			(or,oe)=>setTimeout(or,ms)
		)),
		"timeout": (ps, ms) => Promise.race([
			ps,
			new Promise((or,oe)=>setTimeout(oe,ms))
		]),
		"nf": ()=>undefined,
		"lf": ()=>console.log(arguments),
		"xf": function (msg="Exception!") { throw new X(msg); },
		"gt": ()=>true,
		"gf": ()=>false
	};

	if(
		(s=document.currentScript) &&
		(i=/(.*)init.js/.exec(s.getAttribute("src")||""))
	){
		Piers.Env.PierPath = i[1];
		Piers.Env.PierArgs = (function(s){
			let r=[];
			for(let i=0;i<s.length;i++) r.push(s[i]);
			return r;
		})(s.attributes).reduce(function (r,i) {
			if(i.value) r[i.name] = i.value;
			return r;
		}, {});
		Piers.Env.Entrance = (s.getAttribute("PierEntrance")||"").split(".").filter((i)=>i);
		Piers.Env.XMods = s.getAttribute("PierXMods");
		Piers.Env.XMods = Piers.Env.XMods ? Piers.Env.XMods.split(",") : [];
	}

	window.addEventListener("error", function (evt) {
		console.trace();
		console.log({
			"c":"error",
			"m":"["+evt.filename+":"+evt.lineno+"."+evt.colno+"]\n"+evt.message
		});
	});

	async function doInit(){
		document.removeEventListener( "DOMContentLoaded", doInit );
		let xs= Piers.Env.XMods ?
				await Promise.all(Piers.Env.XMods.map(
					(v)=>__import__(Piers.Env.PierPath+v+".js")
				)) : [];
		xs.forEach(function(l,x){ Piers[Piers.Env.XMods[x]] = l; });
		if( Piers.Env.Entrance.length>0 ){
			let b=Piers.Env.Entrance, n=b.pop();
			b = OBJ(window).get(b);
			Promise.resolve(b[n].call(b)).then(function(){
				// ALL READY
			},console.log);
		}
	}
	if( document.readyState==="complete" ||
		document.readyState==="loaded" ||
		document.readyState==="interactive" )
		doInit();
	else document.addEventListener( "DOMContentLoaded", doInit );
})();
