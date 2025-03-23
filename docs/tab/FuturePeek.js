document.currentScript.value=async (root,args)=>{

	class YM {
		constructor (yms) {	// {{{
			yms = yms.split("-").map((v)=>parseInt(v));
			this.ms = (yms[0]-2000)*12+yms[1]-1;
		}	// }}}
		toString () {	// {{{
			return (2000+parseInt(this.ms/12)).toString()+"-"+((this.ms%12)+101).toString().substring(1);
		}	// }}}
		diff (b) {	// {{{
			return this.ms - b.ms;
		}	// }}}
		add (v) {	// {{{
			this.ms+=v;
			return this;
		}	// }}}
		match (y, m) {	// {{{
			if(y && parseInt(this.ms/12) != y) return false;
			if(m && ((this.ms%12)+1) != m) return false;
			return true;
		}	// }}}
	}

	class PlanEditor extends _Base_
	{
		constructor (E, cb) {	// {{{
			super(E);
			this.Tag = E.getAttribute("WidgetTag");
			this.set("JOB");
			let lock = false;
			if(!E.OnSelectChange) E.OnSelectChange=(evt)=>{
				if(lock) return;
				lock = true;
				if("SELECT"===evt.target.tagName){
					let filter = evt.target.getAttribute(this.Tag),
						value = evt.target.value;
					this.set(filter.split("-").concat(value.split("-")).filter((x)=>x).join("-"));
					evt.preventDefault();
					evt.stopPropagation();
				}
				lock = false;
			};
			E.addEventListener("change",E.OnSelectChange);
			this.bind((evt,func) => {
				switch(func){
				case "Add":
					((root)=>{
						let rv = Piers.DOM(root).reduce((r,v)=>{
							let n = v.getAttribute("tk").split(":");
							n.reduce((r,k,i)=>{
								if(i<n.length-1){
									if(!r[k]) r[k] = {};
									return r[k];
								}else r[k] = v.value;
								return r;
							},r)
							return r;
						},"[tk]",{});
						cb("add", [rv]); 
						this.set("JOB");
					})(this.query('div[filter="'+this.get()+'"]'));
					break;
				}
				return true;
			});
		}	// }}}
		set (s) {	// {{{
			Piers.DOM(this.Root).forEach((e)=>{
				let filter = e.getAttribute(this.Tag);
				if (s.startsWith(filter)) {
					let nv = s.substring(filter.length).replace(/^-/,'').replace(/-.*$/,'');
					e.value = nv ;
					if (!e.value) e.value = e.getAttribute("defaultValue");
					e.setAttribute("SWITCH","ON");
				} else e.setAttribute("SWITCH","OFF");
			},'['+this.Tag+']');
		}	// }}}
		get () {	// {{{
			return Piers.DOM(this.Root).reduce((r,e)=>{
				if (e.getAttribute("SWITCH") === "OFF") return;
				let key = e.getAttribute(this.Tag)+"-"+(e.value||"");
				return r.length > key.length ? r : key;
			}, 'select['+this.Tag+']', "");
		}	// }}}
	}

	class PlanList extends _Base_
	{
		constructor (EL,EE) {	// {{{
			super(EL);
			this.Form = new Piers.Widget.List(this.Root);
			this.List = [];
			this.bind((evt,func)=>this.dispatch(evt,func));
			this.Editor = new PlanEditor (EE, (func, arg)=>"add"===func?this.add.apply(this,arg):undefined);
		}	// }}}
		add (v) {	// {{{
			this.List.push(v);
			this.Form.clear().set(this.List);
		}	// }}}
		redraw () {	// {{{
			this.Form.clear().set(this.List);
		}	// }}}
		dispatch (evt,func) {	// {{{
			switch(func){
			case "Remove":
				((row)=>{
					this.List.splice(row.getAttribute("__idx__"),1);
					this.Form.clear().set(this.List);
				})(Piers.DOM(evt.target).find("tr"));
				break;
			}
			return true;
		}	// }}}
	}

	class FrameList extends _Base_
	{
		constructor (E) {	// {{{
			super(E);
			this.Form = new Piers.Widget.List(this.Root);
			this.List = [];
			this.Plot=document.body.querySelector('[UIE="Plot"]');

			this.add({
				T:((d)=>d.getFullYear()+"-"+(101+d.getMonth()).toString().substring(1))(new Date()),
				S:100000, I:0, D:0, P:""
			});


			// 目前的計畫
			this.Plans = new PlanList (
				root.querySelector('[WidgetTag="Ps"]'),
				root.querySelector('[WidgetTag="filter"]')
			);

			class MediaControl extends _Base_ {
				constructor (E, cb, step=300) {
					super(E);
					this.Form = new Piers.Widget.Form(E);
					this.bind((evt,func) => {
						switch(func){
						case "Play": E.setAttribute("State",this.State="Playing"); break;
						case "Stop": E.setAttribute("State",this.State="Paused"); break;
						default: cb(func,this); break;
						}
						return true;
					});

					this.State = "Paused";
					this.Timer = setInterval(() => {
						if (this.State==="Paused") return;
						cb("Next",this);
					}, step);
				}
			} // 媒體撥放器宣告
			this.MCtrl = new MediaControl (root.querySelector('[WidgetTag="MC"]'), (func, mc) => {
				switch (func) {
				case "Prev":
					if(this.List.length>1){
						this.remove();
						mc.Form.set(this.current());
					}
					break;
				case "Next":
					(() => {
						let cur = this.current(), ym = new YM(cur.T);
						cur.T = ym.add(1).toString();
						this.Plans.List.reduce((r,v)=>{
							// {{{
							for (let k in v) {
								if ("object" !== typeof(v[k])) continue;
								if ("m" in v[k]) {
									if (!ym.match(0,parseInt(v[k].m))) continue;
								} else if ("b" in v[k]) {
									if (!("a" in v[k])) continue;
									if (ym.ms-parseInt(v[k].b) != parseInt(v[k].a)) continue;
								} else {
									v[k].b = ym.ms - 1;
									if ("a" in v[k]) continue;
								}
								if ("+" in v[k])
									r.S += parseInt(v[k]['+']);
								if ("-" in v[k])
									r.S -= parseInt(v[k]['-']);
								if ("+I" in v[k])
									r.I += parseInt(v[k]['+I']);
								if ("-I" in v[k])
									r.I -= parseInt(v[k]['-I']);
								if ("*I" in v[k])
									r.I = Math.floor(r.I*parseFloat(v[k]['*I']));
								if ("+D" in v[k])
									r.D += parseInt(v[k]['+D']);
								if ("-D" in v[k])
									r.D -= parseInt(v[k]['-D']);
								if ("+P" in v[k]) {
									r.P = r.P.split(",").filter((x)=>x&&v[k]["+P"]!==x);
									r.P.push(v[k]['+P']);
									r.P = r.P.join(",");
								}
								if ("-P" in v[k])
									r.P = r.P.split(",").filter((x)=>x&&v[k]["-P"]!==x).join(",");
								if ("$" in v[k])
									delete v.N;
							}
							return r;
							// }}}
						}, cur);
						this.Plans.List=this.Plans.List.filter((v)=>("N" in v));
						this.Plans.redraw();
						mc.Form.set(cur);
						this.add(cur);
					})();
					break;
				case "Plot":
					this.drawChart();
					break;
				}
			}, 300);
			this.MCtrl.Form.set(this.current());
		}	// }}}
		current () {	// {{{
			return Object.assign({},this.List[0]);
		}	// }}}
		async add (frame) {	// {{{
			let v = Object.assign({},frame), r={};
			this.List.unshift(v);
			r[v.T] = {"活存":v.S,"投資":v.I,"債務":v.D};
			if (!this.Plot.Chart) {
				if (!this.newChart) this.newChart = await Piers.import(Piers.Env.PierPath+"chart.js");
				this.Plot.Chart = new this.newChart(this.Plot.querySelector("canvas"));
			}
			this.Plot.Chart.draw_line(r);
			this.Form.set(this.List);
		}	// }}}
		remove () {	// {{{
			let rv = this.List.shift();
			this.Form.set(this.List);
			return rv;
		}	// }}}
		drawChart () {	// {{{
			this.Plot.setAttribute("SWITCH", this.Plot.getAttribute("SWITCH")==="OFF"?"ON":"OFF");
			if (this.Plot.getAttribute("SWITCH")==="OFF") return;
		}	// }}}
	}

	// fl:畫面 [{"T":{"S","I","D","P"}}]
	let frames = new FrameList (root.querySelector('[WidgetTag="Frame"]'));
};
