(async function(){
	let XLSX;
	class _C_ {
		constructor () {
			this.Sheets={};
		}
		select (name) {
			this.CSName=name;
			return this;
		}
		set (dobj, name=undefined) {
			this.CSName = name||this.CSName||"Default";
			this.Sheets[this.CSName]=dobj;
			return this;
		}
		get (cb) {
			var n;
			for( n in this.Sheets ){
				cb(n,this.Sheets[n]);
			}
			return this;
		}
		getCNs (table) {
			return Object.keys(table.reduce(function(cns,row){
				for (let k in row) if (!cns[k]) cns[k]=1;
				return cns;
			},{}));
		}
		async download (fn) {
			var self=this, wb,sn;
			if( !fn ) fn="download.xlsx";
			wb = XLSX.utils.book_new();
			for(sn in self.Sheets)
				XLSX.utils.book_append_sheet(
					wb,
					XLSX.utils.json_to_sheet(self.Sheets[sn]),
					sn
				);
			await XLSX.writeFile(wb,fn);
		}
	}
	document.currentScript.value = async function (data){
		let rst = new _C_();
		if (!XLSX)
			XLSX=await Piers.import(Piers.Env.PierPath+"3rdparty/xlsx.full.min.js");
		if (data) {
			if (Array.isArray(data))
				rst.set(data);
			else
				Piers.OBJ(data).forEach((d,k)=>rst.set(d,k));
		} else {
			let du=await Piers.upload(
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,"+
				"application/vnd.ms-excel"
			), r=new FileReader();
			r.readAsBinaryString(new Blob([du[0]], {"type":"application/vnd.ms-excel"}));
			await new Promise(function(on_ready, on_error){
				r.onload=function(){
					let du=XLSX.read(r.result||r.IEResult,{type:"binary",cellDates:true});
					du.SheetNames.forEach(function (sn) {
						rst.select(sn);
						rst.set(XLSX.utils.sheet_to_json(du.Sheets[sn]));
					});
					on_ready();
				};
			});
		}
		return rst;
	}
})();
