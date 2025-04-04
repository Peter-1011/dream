document.currentScript.value=async (root,args)=>{
	if(root.onClickHandler) root.removeEventListener("click",root.onClickHandler);
	root.addEventListener("click",root.onClickHandler=function(event){
		try {
			switch(Piers.DOM(event.target).find("[func]").getAttribute("func")){
			case "GoP1":
				root.querySelector('[UID="P1"]').scrollIntoView({behavior:'smooth', block:'center'});
				break;
			case "GoP2":
				root.querySelector('[UID="P2"]').scrollIntoView({behavior:'smooth', block:'center'});
				break;
			case "GoApp":
				document.body.querySelector('[func="FuturePeek"]').click();
				break;
			}
		} catch(x) { }
		event.preventDefault();
		event.stopPropagation();
	});
};
