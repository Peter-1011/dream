document.currentScript.value=async (root,args)=>{
	console.log("Table: ",root,args);

	let Dict={
		"TWD":"臺幣",
		"JPY":"日圓",
		"EUR":"歐元",
		"USD":"美金",
		"C_TWD":"信用卡(隔月台幣支付)",
		"CP_TWD":"預購(臺幣信用卡預付)"
	}

	function gw (e,WN="Form"){
		if("string"===typeof(e)) e=root.querySelector(e);
		return e._gw ? e._gw() : new Piers.Widget[WN](e);
	}

	function o2a(o) {
		return Object.keys(o).reduce((r,v)=>r.push({"K":v,"V":o[v]})&&r,[]);
	}

	let rst = await document.App.request("home/file",{"F":"w","N":"test2","D":{"A":1,"B":2,"C":3}});
	console.log("Write Test Result is ",rst);
	rst = await document.App.request("home/file",{"F":"r","N":"test2"});
	console.log("Data is ",rst.R,rst.D);

	class Book {
		constructor () {
			this.xrate={
				"TWD":1,
				"JPY":0.25,
				"EUR":34,
				"USD":33
			};
			this.budgets={
				"TWD":100000,
				"JPY":100000,
				"EUR":10000,
				"USD":10000,
				"C_TWD":200000,
				"CP_TWD":200000,
				"BW":1000000
			};
			((e)=>{
				while (e.firstChild) e.removeChild(e.firstChild);
				for (let k in this.xrate)
					Piers.DOM({ "T":"option", "A":{"value":k}, "C":[Dict[k]||k] }).join(e);
			})(root.querySelector('[IPT="O.T:Value"]'));
			((e)=>{
				while (e.firstChild) e.removeChild(e.firstChild);
				for (let k in this.budgets)
					Piers.DOM({ "T":"option", "A":{"value":k}, "C":[Dict[k]||k] }).join(e);
			})(root.querySelector('[IPT="M:Value"]'));
			this.doc={
				"CN":{"R":"TWD"},
				"L":[
					{"N":"One Dollar","O":{"EUR":1}},
					{"N":"Two Dollar","O":{"USD":2}},
					{"N":"Three Dollar","O":{"USD":3}},
					{"N":"Five Dollar","O":{"JPY":5}}
				],
				"TT":{}
			};
		}
		mdAdd (ov,nv) {
			for(let t in nv){
				if(t in ov) ov[t] = parseFloat(ov[t]) + parseFloat(nv[t]);
				else ov[t] = parseFloat(nv[t]);
			}
		}
		mdConv (ov, tp) {
			let r=0;
			for(let t in ov)
				r += ov[t]*this.xrate[t]
			return r;
		}
		recalc () {
			let tto={}, self=this;
			this.doc.L.forEach(function(row){
				row.R = self.mdConv(row.O);
				self.mdAdd(tto,row.O);
			});
			this.doc.TT.O=tto;
			this.doc.TT.R=this.mdConv(tto);
		}
		addRecord (r) {
			if (undefined!==r.I){
				let idx=r.I;
				delete r.I;
				this.doc.L[idx]=r;
			}else this.doc.L.push(r);
			this.redraw();
		}
		removeRecord (idx) {
			this.doc.L.splice(idx,1);
			this.redraw();
		}
		redraw () {
			this.recalc();
			function oc(o){
				let no=[],t;
				for(t in o) no.push({"T":t,"A":o[t]});
				return no;
			}
			gw('[UIE="List"] [WidgetTag="cn"]').set(this.doc.CN);
			
			gw('[UIE="List"] [WidgetTag="item"]',"List").set(this.doc.L.reduce(function(r,v){
				r.push({"N":v.N, "O":oc(v.O), "R":v.R});
				return r;
			},[]));
			gw('[UIE="List"] [WidgetTag="tt"]').set({"O":oc(this.doc.TT.O),"R":this.doc.TT.R});
		}
	}

	let B=new Book();
	B.redraw();

	(function(e){
		if(e.CLICK_BIND)
			e.removeEventListener("click",e.CLICK_BIND);
		e.addEventListener("click",e.CLICK_BIND=function(evt){
			try {
				let btn=Piers.DOM(evt.target).find('[func]');
				if (!btn) return;
				switch(btn.getAttribute("func")){
				case "Add":
					(function (doc) {
						doc.O = [doc.O].reduce((r,v)=>{
							r[v.T] = parseFloat(v.A);
							return r;
						},{});
						if (null===doc.I) delete doc.I;
						B.addRecord(JSON.parse(JSON.stringify(doc)));
					})(gw(e).get());
					break;
				case "Clear":
					(function (ie) {
						if (!ie) return;
						ie.removeAttribute("__idx__");
					})(Piers.DOM(btn).find('[__idx__]'));
					break;
				case "Remove":
					(function (ie) {
						if (!ie) return;
						if (window.confirm("Remove item ? ")) {
							ie.removeAttribute("__idx__");
							B.removeRecord(ie);
						}
					})(Piers.DOM(btn).find('[__idx__]'));
					break;
				};
			} catch(x) {
			}
		});
	})(root.querySelector('[WidgetTag="IPT"]'));

	(function(e){
		if(e.CLICK_BIND)
			e.removeEventListener("click",e.CLICK_BIND);
		e.addEventListener("click",e.CLICK_BIND=function(evt){
			try {
				let btn=Piers.DOM(evt.target).find('[func]');
				if (!btn) return;
				switch(btn.getAttribute("func")){
				case "Select":
					(function (e) {
						// TODO the input UI only support one record with one dollar type now.
						let doc = gw(e).get();
						gw('[WidgetTag="IPT"]').set({
							"N":doc.N,
							"O":doc.O[0],
							"I":e.getAttribute("__idx__")
						});
					})(btn);
					break;
				};
			} catch(x) {
			}
		});
	})(root.querySelector('[UIE="List"]'));
};
