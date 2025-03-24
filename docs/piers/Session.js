document.currentScript.value = (async function(SE){

	let Session=undefined;

	class PrivateKey { // {{{
		constructor (key) {
			this.jse = new Session.RSA( );
			this.jse.setPrivateKey(key);
		}
		sign (value) {
			return this.jse.sign(value, Session.sha, "sha256");
		}
		decrypt (value) {
			return this.jse.decrypt(value);
		}
	}	// PrivateKey }}}

	class PublicKey { // {{{
		constructor (key) {
			this.jse = new Session.RSA();
			this.jse.setPublicKey(key);
		}
		verify (value) {
			return this.jse.verify(value, Session.sha);
		}
		encrypt (value) {
			return this.jse.encrypt(value);
		}
	}	// PublicKey }}}

	class HomeBase { // {{{
		constructor (handler=()=>{}, options={}) {
			let self=this;
			console.assert("localStorage" in window, "Session/HomeBase: localStorage not enabled or supported!");
			self.Opts=Object.assign({
				"ProfileName":"Current-Session"
			},options);
			self.__onEvent__=handler;
			self.Authorized=false;
			self.Waitings=[];
			try {
				self.Keys=JSON.parse(localStorage.getItem(self.Opts.ProfileName) || "{}");
				if (self.Keys.Profile) {
					let profile = self.Keys.Profile;
					delete self.Keys.Profile;
					self.enter(profile);
				}
			} catch(e) {
				console.log("Exception: ",e);
				localStorage.removeItem(self.Opts.ProfileName);
			}
		}
		get (df=undefined) {
			return this.Keys.Profile || df;
		}
		async enter (profile) {
			let self = this;
			if (profile) {
				if (!self.Keys.Profile || self.Keys.Profile.N!==profile.N) {
					self.Keys.Profile=profile;
					localStorage.setItem(self.Opts.ProfileName, JSON.stringify(self.Keys));
					self.Authorized=true;
					self.Waitings=self.Waitings.filter((a)=>a(profile) && false);
					console.assert(self.Waitings.length<=0,"Session/HomeBase: Failed to flush waiting queue");
					self.__onEvent__("changed");
				}
				return profile;
			}else{
				if ("Profile" in self.Keys)
					return self.Keys.Profile;
				setTimeout(()=>self.__onEvent__("login_required"),100);
				return await new Promise((or,oe)=>self.Waitings.push(or));
			}
		}
		leave () {
			let self=this;
			self.Authorized=false;
			localStorage.removeItem(self.Opts.ProfileName);
			self.Keys={};
			self.__onEvent__("changed");
		}
		async authenticate (user, pass, enroll=false) {
			if (!user) throw("User missing");
			let pf={"R":"OK", "D":{"N":user}};
			this.enter(pf.D);
			return pf;
		}
		async request (url, payload) {
			return await Piers.URL(url).setBody(payload).request()
		}
	}	// HomeBase }}}

	class RSAHome extends HomeBase { // {{{
		constructor (handler=()=>{}, options={}) {
			super(
				handler,
				Object.assign({
					"API":{
						"PREFIX":"/__api__/",
						"GETKEY": "RSAHome/getKey/",
						"AUTH": "RSAHome/auth/verify",
						"ENROLL": "RSAHome/auth/enroll",
						"VERIFY": "RSAHome/listMyKeys/"
					}
				}, options)
			);
		}
		async authenticate (user, pass, enroll=false) {
			try {
				let self=this,
					pubKey=new Piers.Session.PublicKey(
						await Piers.URL(
							self.Opts.API.PREFIX + self.Opts.API.GETKEY
						).request()
					);

				((sk)=>{
					crypto.getRandomValues(sk);
					self.Keys.Session=btoa(sk);
				})(new Unit8Array(16));

				let result=await Piers.URL(
					self.Opts.API.PREFIX + ( enroll
						? self.Opts.API.ENROLL
						: self.Opts.API.AUTH
					)
				).setBody({
					"U": user,
					"K": pubKey.encrypt( self.Keys.Session ),
					"S": pubKey.encrypt( pass ),
					"F": enroll ? "Enroll" : "Auth"
				}).request();
				console.assert(result.D, "RSAHome.authenticate: "+result.E);
				self.enter( result.D );
				return result.D;
			} catch (x) {
				if (self.Keys.Session)
					delete self.Keys.Session;
				throw(x);
			}
		}
		async request (url, payload) {
			let self=this;
			url=Piers.URL(self.Opts.API.PREFIX+url).setBody(payload);
			if (self.Keys.Profile) {
				let xa=JSON.stringify({
					"N": self.Keys.Profile.N,
					"T": new Date().getTime().toString(36)
				});
				url.addHeader(
					"Piers-X-INFO",
					xa
				);
				url.addHeader(
					"Piers-X-AUTH",
					Session.SHA(xa+self.Keys.Session)
				);
			}
			return url.request();
		}
		sign (bs) {
			if(!this.PrivateKey)
				this.PrivateKey = new Session.PrivateKey(this.Keys.private);
			return this.PrivateKey.sign( bs );
		}
	}	// RSAHome }}}

	class MSHome extends HomeBase { // {{{
		constructor (handler=()=>{}, options={}) {
			super(
				handler,
				Object.assign({
					"API":{
						"PREFIX":"api.aspx?task=",
						"LOGIN":"authenticate",
						"ENROLL":"enroll"
					}
				}, options)
			);
		}
		async authenticate (user, pass, enroll=false) {
			let pf = await this.request(this.Opts.API.PREFIX+this.Opts.API[enroll ? "ENROLL" : "LOGIN"], {
				"U":user,
				"S":pass
			})
			this.enter(pf.D);
			return pf;
		}
		async request (url, payload){
			return await Piers.URL(
				this.Opts.API.PREFIX+url
			).setBody(payload).request();
		}
	}	// MSHome }}}

		class LocalHome extends HomeBase { // {{{
			constructor (pfn, eh) { 
				super(pfn, eh);
			}
			enter (profile) {
				this.Profile=profile;
				if(!this.Index)
					this.Index=localStorage.getItem(profile.user);
				if(!this.Index){
					this.Index={"items":{}};
					Object.assign(this.Index,this.Profile);
					localStorage.setItem(profile.user,JSON.stringify(this.Index));
				}
			}
			leave () {
				this.Profile=this.Index={};
			}
			authenticate (user, pass) {
				var self=this;
				return new Promise(function (or,oe) {
					let idx=JSON.parse(localStorage.getItem(user));
					if (idx) {
						if (idx.pass!==pass)
							return oe({"user":user});
						self.Index=idx;
					}
					self.enter({ "user":user, "pass":pass });
					or({"user":user});
				});
			}
			request (url, payload="") {
				// list
				// load:key
				// save:key
				let self=this;
				return new Promise(function (or,oe) {
					if(!self.Index)
						return oe({"E":"NOT_LOGIN"});
					url=url.split(":");
					if ('object'===typeof(payload))
						payload=JSON.stringify(payload);
					switch(url[0]){
						case "list":
							return or(self.Index.items);
						case "load":
							return or(
								localStorage.getItem(self.Profile.user+"."+url[1])
								|| payload
							);
						case "save":
							localStorage.setItem(self.Profile.user+"."+url[1], payload);
							self.Index.items[url[1]]=(new Date()).getTime().toString(36);
							localStorage.setItem(self.Profile.user,JSON.stringify(self.Index));
							return or();
					}
					oe({"E":"BAD_COMMAND"});
				});
			}
		}	// LocalHome }}}

	let libs = await Promise.all([
		Piers.import(Piers.Env.PierPath+"3rdparty/sha256.min.js"),
		Piers.import(Piers.Env.PierPath+"3rdparty/jsencrypt.min.js")
	]);
	return (Session = {
		"SHA": libs[0].sha256,
		"SHA_b64": (s)=>btoa(
			libs[0].sha256(s)
			.match(/[0-9a-f]{2}/g)
			.reduce((r,x)=>r+String.fromCodePoint(parseInt(x,16)),"")
		),
		"RSA": libs[1],

		"createKeyPair":function(){
			var jse = new Session.RSA( { "default_key_size":1024} );
			return { "public":jse.getPublicKey(), "private":jse.getPrivateKey() };
		},
		"PrivateKey": PrivateKey,
		"PublicKey": PublicKey,

		"Home": HomeBase,
		"RSAHome": RSAHome,
		// auth = new RSAHome( profile_name, event_handler() )
		// auth.enter().then( authenticated_works() )
		// ??? ... auth.authenticate( user, pass )
		"MSHome": MSHome,
		"LocalHome": LocalHome
	});
})();
