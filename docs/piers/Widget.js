let Widgets;

class Template {	// {{{
	constructor (e) {
		let self=this;
		console.assert(e,"Widget.constructor(element not available)");
		Object.assign(self.E = e,{
			"_gw":()=>self,
			"value":""
		});
		self.VALUE_TAG=["OPTION","SELECT","INPUT"].indexOf(self.E.tagName)>=0 ? "widgetValue" : "value";
	}
	async set (d) { this.E[self.VALUE_TAG]=d ; return this; }
	get () { return this.E[self.VALUE_TAG]; }
	clear () { this.E[self.VALUE_TAG]=""; return this; }
} 	// }}}

class DateTime extends Template { // {{{
	constructor (e) {
		super(e);
		let self=this;
		this.DE=(function(root){
			let r={};
			try{
				r.D=root.select('input[type="date"]');
			}catch(x){}
			try{
				r.T=root.select('input[type="time"]');
			}catch(x){}
			return r;
		})(Piers.DOM(e));
		this.TZ=((ts)=>(
			ts>9 ? ("+"+ts+":00")
			: ts>=0 ? ("+0"+ts+":00")
			: ts>-10 ? ("-0"+(-ts)+":00")
			: (ts+":00")
		))((new Date).getTimezoneOffset()/(-60));
		this.E.addEventListener("change",()=>self.__sync__());
		this.clear();
		this.__sync__();
	}
	__gDs__(d) {
		if(!d) d=new Date();
		return 	d.getFullYear() + "-" +
				[d.getMonth()+1,d.getDate()]
				.map((v)=>(v+100).toString()
				.substr(1)).join("-");
	}
	__gTs__ (d) {
		if(!d) d=new Date();
		return 	[d.getHours(),d.getMinutes()]
				.map((v)=>(v+100).toString().substr(1))
				.join(":");
	}
	__sync__ () {
		let dt=((this.DE.D&&this.DE.D.value) || this.__gDs__()).split("-")
			.concat(
				((this.DE.T&&this.DE.T.value) || this.__gTs__()).split(":")
			);
		super.set(new Date(
			parseInt(dt[0]),
			parseInt("1"+dt[1])-101,
			parseInt("1"+dt[2])-100,
			parseInt("1"+dt[3])-100,
			parseInt("1"+dt[4])-100
		));
	}
	clear () {
		if(this.DE.D) delete this.DE.D.value;
		if(this.DE.T) delete this.DE.T.value;
	}
	async set (dt) {
		let fz=(v)=>(v<10?"0":"")+v;
		if(this.DE.D)
			this.DE.D.value=dt.getFullYear()+"-"+fz(dt.getMonth()+1)+"-"+fz(dt.getDate());
		if(this.DE.T)
			this.DE.T.value=fz(dt.getHours())+":"+fz(dt.getMinutes());
	}
	get () {
		this.__sync__();
		return super.get();
	}
}	// }}}

class ComboSelect extends Template { // {{{
	constructor (e) {
		super(e);
		let self = this;
		e.__SHADOWED__ = true
		e.value = [];
		e.addEventListener("change", function (evt) {
			let i, s=[];
			self.E.value=[];
			self.E.value = Piers.DOM(self.E).reduce(function(r, e){
				s.push(e);
				r.push(e.value);
				return r;
			}, "select", []);
			self.__sync__(
				0, s,
				self.Options||[],
				self.E.value
			);
			evt.preventDefault();
		});
	}
	config (options) {
		this.__sync__(
			0,
			this.E.querySelectorAll("select"),
			this.Options = options,
			this.E.value
		);
		this.clear();
		return this;
	}
	async set (v) {
		this.__sync__(
			0,
			this.E.querySelectorAll("select"),
			this.Options,
			v
		);
		return super.set(Piers.DOM(this.E).reduce(
			(r, e)=>(r.push(e.value)&&r),
			"select",
			[]
		));
	}
	clear () {
		this.set([]);
	}
	__sync__ (i,s,d,v) {
		try{
			Piers.assert(s[i] && d,"Data error("+i+")");
			let self = this,
				db={},
				p = (new Piers.DOM(s[i])).clear();

			(Array.isArray(d) ? d : Object.keys(d))
			.reduce(function (p, v) {
				let x=v.split('\r');
				if(x.length<2) x.push(x[0]);
				db[x[0]]=v;
				p.add({"T":"option","A":{"value":x[0]},"C":[x[1]]});
				return p;
			}, p);

			if(v[i])
				s[i].value=v[i];
			v[i]=s[i].value;
			self.__sync__(
				i+1,
				s,
				d[db[s[i].value]],
				v
			);
		}catch(x){ }
	}
}	// }}}

class DMZ extends Template { // {{{
	constructor (e, dmzTag) {
		super(e);
		dmzTag = dmzTag || e.getAttribute("WidgetTag") || "DMZ";
		this.Box = Piers.DOM(this.E).reduce(function(r, v){
			r.push([
				v,
				parseInt(v.getAttribute(dmzTag)),
				v.nextSibling,
				v.parentNode
			]);
			return r;
		}, "["+dmzTag+"]", []);
	}
	async set (mask) {
		this.E.value = (mask = parseInt(mask));
		this.Box.forEach(function (v) {
			if (0 != (v[1]&mask)) {
				if (v[0].parentNode) return;
				v[3].insertBefore(v[0], v[2]);
			} else if(v[0].parentNode)
				v[0].parentNode.removeChild(v[0]);
		});
		return this;
	}
}	// }}}

class DPage extends Template { // {{{
	// new DPage(ROOT_ELEMENT)
	// await new DPage.set("url_without_file_extension")
	constructor (e) {
		super(e);
		this.Lock={};
	}
	async set (v={}, a={}) { // v="tab/Prepare.htm"
		let self=this, d=Object.assign({},a);
		if (this.Lock.set) return this.Lock.set;
		super.set(this.Lock.set=v);
		let r=await (async (htm,js)=>{
			await Piers.DOM(self.E).clear().load(htm);
			if (js)
				return await Promise.resolve(
					(await Piers.import(js))(self.E, d)
				);
		}).apply(
			this, // append .htm & .js extenstion automatically
			/.html$/.test(v) ? [v] : [v+".htm",v+".js"]
		);
		delete this.Lock.set;
		return r;
	}
	clear () {
		Piers.DOM(this.E).clear();
	}
}	// }}}

class SlidingTabs extends Template { // {{{
	constructor (e, opt={}) {
		super(e);
		let self=this, rotate=false,
			Ps=Piers.DOM(e).reduce(function(r,e){ // all content elements
				if (1===e.nodeType) r.push(e); return r;
			},'['+(
				self.TG=opt.Tag || e.getAttribute("WidgetTag") || "TabID"
			)+']',[]);

		self.DPAGE_TAG="_"+self.TG;

		switch(opt.Method){
		case "verticalScrollIntoView":
			rotate=true;
		case "scrollIntoView":
			self.scroll=(te)=>te.scrollIntoView({
				behavior:"smooth",
				block:"center"
			});
			function resize(){ self.set(self.get()); }
			window.removeEventListener("resize",resize);
			window.addEventListener("resize",resize);
			break;
		case "vertical":
			rotate=true;
			self.scroll=(te)=>{self.PE.E.style.top=te.PageIndex*(-100)+"%";};
			break;
		default:
			self.scroll=(te)=>{self.PE.E.style.left=te.PageIndex*(-100)+"%";};
			break;
		};
		e.style.overflow="hidden";
		self.PE=Piers.DOM({"T":"div","S":Object.assign({
			position:"absolute", left:0, top:0,
		}, rotate ? {
			height:Ps.length+"00%", width:"100%",
			transition:"top 300ms ease"
		} : {
			width:Ps.length+"00%", height:"100%",
			transition:"left 300ms ease"
		})});
		Ps.forEach(function(e, i){
			if (!i) self.E.value=e.getAttribute(self.TG);
			let wd=100/Ps.length;
			Piers.OBJ(rotate ? {
				position:"absolute", top:(wd*i)+"%", left:0,
				height:wd+"%", width:"100%", overflow:"hidden auto",
			} : {
				position:"absolute", left:(wd*i)+"%", top:0,
				width:wd+"%", height:"100%", overflow:"hidden auto",
			}).forEach((v,k)=>(e.style[k]=v));
			e.PageIndex=i;
			self.PE.E.appendChild(e);
		});
		this.PE.join(e);
	}
	async set (v, args={}) {
		let te=this.PE.select('['+this.TG+'="'+v+'"]'),
			result=this;
		this.scroll(te);
		if (te.hasAttribute(this.DPAGE_TAG)) {
			((oe)=>{ // recycle last DPage
				if(oe&&oe._gw&&oe.__NOREUSE__){
					oe._gw().clear();
					delete oe._gw;
				}
			})(this.PE.select('['+this.TG+'="'+this.E.value+'"]'));

			result=await (async (url) => { // create new DPage
				if(!(te.__NOREUSE__=!url.startsWith("@")))
					url=url.substr(1);
				return await (te._gw ? te._gw() : new DPage(te)).set(url, args);
			})(te.getAttribute(this.DPAGE_TAG));
		}
		if (args.GOTOP) te.scrollTop=0;
		return result;
	}
}	// }}}

class List extends Template { // {{{
	constructor (e, fvar=undefined) {
		super(e)
		this.FVar = fvar || e.getAttribute("WidgetTag") || "FVar";
		this.Temp = [];
		e.__SHADOWED__ = true
		while (e.firstChild) {
			if (1===e.firstChild.nodeType) this.Temp.push(e.firstChild);
			e.removeChild(e.firstChild);
		}
	}
	async set (ds=[]) {
		var self = this, e = this.E;
		self.clear();
		super.set(ds);
		ds.forEach(function (d, ix) {
			if(!d) return;
			let ea = {
				"__Idx__":ix,
				"RowType":ix%2==0?"Even":"Odd"
			};
			self.Temp.forEach(function (temp) {
				let ne = Piers.OBJ(ea).reduce(function(r,v,k){
						r.setAttribute(k,v);
						return r;
					}, temp.cloneNode(true)),
					fm = new Widgets.Form(ne, self.FVar);
				self.E.appendChild(fm.E);
				fm.set(d);
			});
		});
		return this;
	}
	get () {
		var self=this, rd=[];
		for (let e=self.E.firstChild; e; e=e.nextSibling) {
			if (1!==e.nodeType) continue;
			if (!e._gw) continue;
			let d = e._gw().get();
			if (e.__Idx__ in rd)
				rd[e.__Idx__]=Object.assign(rd[e.__Idx__],d);
			else
				rd.push(d);
		}
		super.set(rd);
		return super.get();
	}
	clear () {
		while( this.E.firstChild )
			this.E.removeChild(this.E.firstChild);
		return this;
	}
	sort (func) {
		return this.set(this.get().sort(func));
	}
	filter (func) {
		return this.set(this.get().filter(func));
	}
	removeItem (i) {
		let lst=this.get();
		if (1===i.nodeType) i=Piers.DOM(i).find("[__Idx__]").getAttribute("__Idx__")
		console.assert(i>=0&&i<lst.length, "Widget.List.removeItem (Data Index: Out of Range)");
		lst.splice(parseInt(i), 1);
		return this.set(lst);
	}
	insertItem (d, loc=undefined) {
		let lst=this.get();
		if( undefined !== loc )
			lst.splice(loc, 0, d);
		else
			lst.push(d);
		return this.set(lst);
	}
	onEvent (s, e) {
		switch(s){
		case "dragStart":
			this.FX = e.__Idx__;
			break;
		case "dragStep":
			if (this.FX != undefined && this.FX != e.__Idx__) {
				let sw=this.E.value[this.FX];
				this.E.value[this.FX] = this.E.value[e.__Idx__];
				this.E.value[e.__Idx__] = sw;
				this.FX = e.__Idx__;
				this.set(this.E.value);
			}
			break;
		case "dragStop":
			this.FX = undefined;
			break;
		}
	}
}	// }}}

class Form extends Template { // {{{
	constructor (e=document.body, fvar=undefined) {
		super(e);
		e.__SHADOWED__=false;
		super.set({});
		this.FVar=fvar || e.getAttribute("WidgetTag") || "FVar";
	}
	async set (d={}) {
		let self=this;
		super.set(d);
		Piers.DOM(self.E).dfs(function (r,e) {
			let w = e._gw ? e._gw() : undefined;
			(e.getAttribute(self.FVar) || "")
				.split(";").filter((i)=>!!i)
				.forEach(function (a) {
					let dd = Piers.OBJ(d).get((a=a.split(":")).shift(), undefined);
					dd === undefined ? (function (e, t, n) { // clear
						switch(t){
						case "Text": case "text":
							e.textContent="";
							break;
						case "Attribute": case "attribute":
							e.removeAttribute(n);
							break;
						case "Value": case "value":
							delete e[n];
							break;
						case "Style": case "style":
							delete e.style[n];
							break;
						case "VF":
							(e.__setValue__||console.log)();
							break;
						default:
							if (w) return w.clear();
						}
					})(e, a[0], a[1]) : (function (e, d, t, n) { // set
						switch(t){
						case "Text": case "text":
							e.textContent=d;
							break;
						case "Attribute": case "attribute":
							e.setAttribute(n||"value", d) ;
							break;
						case "Value": case "value":
							e[n||"value"]=d;
							break;
						case "Checked": case "checked":
							e.checked = !!d;
							break;
						case "Style": case "style":
							e.style[n||"display"]=d;
							break;
						case "VF":
							(e.__setValue__||console.log)(d);
							break;
						default:
							if ((!w) && (t in Widgets))
								w=new Widgets[t](e,e.getAttribute("WidgetTag")||self.FVar);
							if (w && self!=w) return w.set(d);
						}
					})(e, dd, a[0], a[1]);
				});
			if (e.__SHADOWED__) return true;
		}, undefined, {});
		return this;
	}
	get (d) {
		let self = this;
		if(!d)  d = super.get();
		Piers.DOM(self.E).dfs(function (d, e) {
			let w = e._gw ? e._gw() : undefined;
			(e.getAttribute(self.FVar)||"")
				.split(";").filter((i)=>!!i)
				.forEach(function (a) {
					a=a.split(":");
					let k=a.shift(), v=(function (e, t, n) {
						switch (t) {
						case "Text": return e.textContent;
						case "Value": return e[n||"value"];
						case "Checked": console.log("CHECKED",e); return e.checked ? 1 : 0;
						case "Attribute": return e.getAttribute(n||"NoAttr");
						case "Style": return e.style[n||"display"];
						case "VF": return (e.__getValue__||console.log)();
						default:
							if ( w && self != w ) return w.get();
						}
					})(e, a[0], a[1]);
					if(v!==undefined) Piers.OBJ(d).put(k,v);
				});
			if (e.__SHADOWED__) return true;
		}, undefined, d);
		return d;
	}
	clear (l) {
		let self=this;
		Piers.DOM(self.E).dfs(function(r, e){
			let w = e._gw ? e._gw() : undefined;

			(e.getAttribute(self.FVar) || "")
				.split(";").filter((i)=>!!i)
				.forEach(function (a) {
					a=a.split(":");
					a.shift();
					(function(e, t, n){
						switch(t){
						case "Text": case "text":
							e.textContent="";
							break;
						case "Attribute": case "attribute":
							e.removeAttribute(n);
							break;
						case "Value": case "value":
							e[n||"value"]="";
							delete e[n||"value"];
							break;
						case "Style": case "style":
							delete e.style[n];
							break;
						default:
							if (w && self!=w) return w.clear();
						}
					})(e, a[0], a[1]);
				});
		}, undefined, {});
		return this;
	}
}	// }}}

class CSSPieChart extends Template { // {{{
	// (new PieChart(element)).set([4,5,6]);
	constructor (e) {
		super(e);
	}

	async set (v) {
		let i,t,c,n,s = [];
		t = 0; for(i in v) t += list[i]; // total
		c = 0; for(i in v){ // ratio
			n = c+list[i];
			s.push(i+" "+Math.floor(c*360/t)+"deg "+Math.floor(n*360/t)+"deg");
			c = n;
		}
		this.E.style.backgroundImage="conic-gradient("+s+")";
		super.set(v);
	}
}	// }}}

class Dialog extends Template {	// {{{
	// await (new Dialog(ELEMENT)).set(DPAGE_URL);
	constructor (E=document.body, options={}) {
		super(E);

		let self=this;
		self.Opts=Object.assign({
			"nox":false,
			"sty":{}
		},options);
		self.Emask=Piers.DOM({
			"T":"div",
			"S":{
				"position":"fixed",
				"margin":"0",
				"border":"0",
				"padding":"0",
				"left":"0",
				"top":"0",
				"width":"100%",
				"height":"100%",
				"backgroundColor":"rgba(0,0,0,0.5)"
			},
			"C":((r)=>{
				if (!self.Opts.nox)
					r.push({
						"T":"button", "C":["X"],
						"S":{
							"position":"fixed",
							"right":"1%",
							"top":"1%",
							"backgroundColor":"red",
							"color":"gold",
							"cursor":"pointer"
						},
						"E":{
							"click":(event)=>self.cancel()
						}
					});
				return r;
			})([{
				"T":"Content",
				"S":Object.assign({
					"position":"absolute",
					"margin":"0",
					"border":"1px solid silver",
					"left":"10%",
					"top":"10%",
					"width":"80%",
					"height":"80%",
					"background":"white",
					"color":"black"
				},self.Opts.sty)
			}])
		});
	}
	async set (v) {
		let self=this, rv,
			dpe=self.Emask.E.firstChild;
		if (!dpe._gw) new DPage(dpe);
		self.Emask.join(self.E);
		super.set(v);
		rv=await Promise.race([
			new Promise((or)=>(self.cancel=or)),
			dpe._gw().set(v)
		]);
		dpe._gw().clear();
		self.Emask.quit();
		return rv;
	}
}	// }}}

document.currentScript.value=Widgets={
	"Template": Template,
	"Form": Form,
	"List": List,
	"DPage": DPage,
	"Dialog": Dialog,
	"DMZ" : DMZ,
	"SlidingTabs": SlidingTabs,
	"DateTime": DateTime,
	"ComboSelect": ComboSelect,
	"CSSPieChart": CSSPieChart,
	"Dialog" : Dialog
};
