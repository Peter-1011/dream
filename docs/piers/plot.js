function Plot (v) {
	this.View=v;
	this.Chart=undefined;
}
Object.assign(Plot.prototype, {
	reset: function () {
		if (this.Chart)
			this.Chart.destroy();
		this.Chart = undefined;
	},
	draw_portfolio: function (r) {
		this.reset();
		this.Chart = new Chart(this.View, {
			type: "pie",
			data: {
				labels: ["活期存款","定期存款","保險","基金","股票"],
				datasets: [{
					label: "投資理財組合",
					data: [r.SBR,r.LBR,r.INR,r.FR,r.SR],
					borderWidth: 1,
					backgroundColor: [
						'rgb(205, 155, 155)',
						'rgb(255, 165, 79)',
						'rgb(108, 166, 205)',
						'rgb(60, 179, 113)',
						'rgb(255, 0, 0)'
					]
				}]
			}
		});
	},
	draw_predicts: function (rs) {
		this.reset();
		let index=Piers._.ensureArray(Object.keys(rs)).sort();
		this.Chart=new Chart(this.View, {
			type: 'line',
			data: {
				labels: index,
				datasets: Piers._.ensureArray(Object.keys(rs[index[0]])).reduce(function(r,v){
					r.push({
						label: v,
						data: index.reduce(function(r,vv){
							r.push(rs[vv][v]);
							return r;
						},[]),
						borderWidth: 1
					});
					return r;
				},[])
			}
		});
	}
});
