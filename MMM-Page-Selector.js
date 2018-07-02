Module.register("MMM-Page-Selector", {

	defaults: {
		page: "",
		displayTitle: true,
		pages: {}, //Format: {"name": ["moduleName1", "moduleName2", ...]}
		neverHide: ["alert", "updatenotification"]
	},

	requiresVersion: "2.1.0",

	start: function() {
		this.page = this.config.page;
		this.pages = this.config.pages;
		this.displayTitle = this.config.displayTitle,
		this.neverHide = this.config.neverHide;
		this.neverHide.push(this.name);

		this.setUpPage = this.setUpPage.bind(this);

		setTimeout(this.setUpPage, 0, this.page, this);
	},

	getStyles: function () {
		return [
			"MMM-Page-Selector.css",
		];
	},

	getScripts: function() {
		return[
			this.file("resources/find.js"),
			this.file("resources/numConvert.js"),
		]
	},

	getDom: function() {
		var wrapper = document.createElement("div");
		wrapper.className += "page-title"
		//If the module is configured to show a title, display it... easy enough
		if(this.displayTitle){
			if(this.page !== ''){
				wrapper.innerHTML = `${this.titleCase(this.page)}`;
			}else{
				wrapper.innerHTML = "No Page Selected"
			}
		}

		return wrapper;
	},

	getModuleRef: function(module){
		var moduleRef = document.getElementsByClassName(module.name)[0];
		return moduleRef;
	},

	moveRefToLoc: function(ref, loc){
		//Defines where modules will be with a map between the position string and the css class
		var locations = {
			"top_bar": "region top bar",
			"top_left": "region top left",
			"top_center": "region top center",
			"top_right": "region top right",
			"upper_third": "region upper third",
			"middle_center": "region middle center",
			"lower_third": "region lower third",
			"bottom_left": "region bottom left",
			"bottom_center": "region bottom center",
			"bottom_right": "region bottom right",
			"bottom_bar": "region bottom bar",
			"fullscreen_above": "region fullscreen above",
			"fullscreen_below": "region fullscreen below",
		}

		//Search for the correct container to append the module into
		var moveToRef = document.getElementsByClassName(locations[loc])[0];
		var containers = moveToRef.childNodes;
		var container;
		containers.forEach(node => {
			if (node.className == "container") {
				container = node;
			}
		})
		container.appendChild(ref);
	},

	setUpPage: function(pageName) {
		const self = this;
		var page = self.pages[pageName];
		if(page !== undefined){
			//Set title once the page has been identified
			self.page = pageName;
			self.updateDom(1000);

			//Integration with MMM-page-indicator
			const indexOfPage = Object.keys(self.pages).indexOf(pageName);
			self.sendNotification("PAGE_CHANGED", indexOfPage);

			//Code for moving and changing visibility for certain modules
			var modules = MM.getModules();
			modules.enumerate(function(module) {
				if(findIndex(page, {module: module.name}) === -1 && self.neverHide.indexOf(module.name) === -1){
					//If the module is not in the page object and it is not included in the neverHide object, hide it
					module.hide(500);
				}else if(self.neverHide.indexOf(module.name) === -1){
					//If the module is in the page object and is not included the neverHide object, move it to the correct location
					self.moveRefToLoc(self.getModuleRef(module), page[findIndex(page, {module: module.name})].position);
					module.show(500);
				}
			});
		}
	},

	//If an external module wants to change the page, it sends a notification to PAGE_SELECT with the payload as the page name
	//if the payload is an integer, the index of the page is selected
	notificationReceived: function(notification, payload, sender) {
		const self = this;
		if(notification === "PAGE_SELECT"){
			const payloadToNum = WtoN.convert(payload);
			if(isNaN(payloadToNum)){
				this.sendSocketNotification("RELAY_PAGE_SELECT", payload);
			}else{
				const key = Object.keys(self.pages)[payloadToNum-1];
				if(key !== undefined){
					this.sendSocketNotification("RELAY_PAGE_SELECT", Object.keys(self.pages)[payloadToNum-1]);
				}else{
					Log.log("Tried to go to non-existant page: ",payloadToNum)
				}
			}
		}
	},

	//When the helper sends the PAGE_SELECT notification, start setting up the page cooresponding to the payload
	socketNotificationReceived: function(notification, payload){
		if(notification === 'PAGE_SELECT'){
			this.setUpPage(payload);
		}
	},

	titleCase: function (str) {
		return str.toLowerCase().split(' ').map(function(word) {
			return word.replace(word[0], word[0].toUpperCase());
		}).join(' ');
	}

})
