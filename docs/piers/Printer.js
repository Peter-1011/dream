document.currentScript.value = (async function(){

	return class P {
		constructor () {
			this.lib_html2canvas=Piers.import(Piers.Env.PierPath+"3rdparty/html2canvas.min.js");
			this.lib_jspdf=Piers.import(Piers.Env.PierPath+"3rdparty/jspdf.umd.min.js");
		}
		async getCanvas (elem, scale=2) {
			return (await this.lib_html2canvas)(elem,{scale:scale});
		}
		async savePDF (elem) {
			let jspdf = await this.lib_jspdf;
			let twh=[297,210], doc = new jspdf.jspdf.jsPDF('p','mm',twh);
			let vw=await this.getCanvas(elem);
            let cwh = [vw.width,vw.height], wh=[twh[1]-10,twh[0]-10];
            if( cwh[0]*wh[1] > wh[0]*cwh[1] )
                wh[1] = wh[0]*cwh[1]/cwh[0];
            else
                wh[0] = wh[1]*cwh[0]/cwh[1];
            // doc.addPage( );
			doc.addImage(vw,'Canvas',5,5,wh[0],wh[1]);
			doc.save("verify.pdf");
		}
	};
/*
		(async function(table){
			let twh=[297,210], doc = new jspdf.jsPDF('p','mm',twh);
			let vw=await(html2canvas(table,{scale:2}));
            let cwh = [vw.width,vw.height], wh=[twh[1]-10,twh[0]-10];
            if( cwh[0]*wh[1] > wh[0]*cwh[1] )
                wh[1] = wh[0]*cwh[1]/cwh[0];
            else
                wh[0] = wh[1]*cwh[0]/cwh[1];
            // doc.addPage( );
			doc.addImage(vw,'Canvas',5,5,wh[0],wh[1]);
			doc.save("verify.pdf");
		})(document.body.querySelector("table"));
*/

})();
