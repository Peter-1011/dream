(function(){
	let __Handlers__={};

	function __reg__ (n, h) {
		__Handlers__[n]=h;
		return this;
	}

	class _M_ {
		//	M : Message 
		//	M.reg("NAME",function(arg,evt){...});
		//	new M("NAME",{"arg":1}).send();
		//	new M("NAME",{"arg":2}).origin(ORIGIN_WINDOW).to(TARGET_WINDOW).send();
		constructor (n, a) {
			this.N=n;
			this.A=a;
			this.W=parent;
			this.O="*";
		}
		to (w) {
			if (w) this.W=w;
			return this;
		}
		origin (o) {
			if (o) this.O=o;
			return this;
		};
		async send () {
			let self=this,
				msg={
					"N":this.N,
					"A":this.A,
					"R":"__Reply__"+(new Date().getTime().toString(36))+Math.random()
				};
			return await new Promise(function(or,oe){
				__reg__(msg.R, or);
				self.W.postMessage(msg, self.O);
			});
		}
	}
	window.addEventListener("message",async function(evt){
		let d=evt.data,
			h=__Handlers__[d.N];

		if (h) {
			let reply=await Promise.resolve(h(d.A, evt));
			if(d.N.startsWith("__Reply__")){
				delete __Handlers__[d.N];
			}else
				(new _M_(d.R, reply)).to(evt.source).send(true);
		} else if(parent!==window){
			let doc=await (new _M_(
				d.N, d.A
			)).send();
		}
	});
	document.currentScript.value={
		"new":function (name, args) {
			return new _M_(name, args);
		},
		"reg":__reg__
	};
})();
