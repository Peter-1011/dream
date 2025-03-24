document.currentScript.value=async function (w=512,h=512) {
	let QC=await Piers.import(Piers.Env.PierPath+"3rdparty/QRCode.js");
	class QRC {
		constructor (w=512,h=512) {
			this.W=w;
			this.H=h;
		}
		generateSVG (s) {
			var ce = document.createElement("div");
			new QC(
				ce,
				{"width":this.W,"height":this.H,"useSVG":true}
			).makeCode(s||location.href);
			return ce.firstChild;
		}
	}
	return new QRC(w,h);
}
