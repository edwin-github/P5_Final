//Global variables
var infowindow;
var $wikiArticles = [];
var $nytmArticles = [];

//Data Model, limited to 10 to prevent NY Times API call error
var initialSites = [
	{	id: 0,
		name: 'Webster Hall',
		lat: '40.731777',
		lng: '-73.989132',
		keywords: ['Music', ' Club']
	},
	{	id: 1,
		name: 'Blue Note',
		lat: '40.731650', 
		lng: '-74.000703',
		keywords: ['Jazz', ' Club']
	},
	{	id: 2,
		name: 'Gramercy Park',
		lat: '40.737918', 
		lng: '-73.985902',
		keywords: ['Park']
	},
	{	id: 3,
		name: 'Chelsea Inn ',
		lat: '40.738736', 
		lng: '-73.994531',
		keywords: ['Lodging', ' Hotel']
	},
	{	id: 4,
		name: 'AMC Loews',
		lat: '40.738560', 
		lng: '-73.989677',
		keywords: ['Movie House ']
	}, 
	{	id: 5,
		name: 'NYU College of Dentistry',
		lat: '40.737912', 
		lng: '-73.978231',
		keywords: ['NYU', ' University', ' Dentistry', ' School']
	}, 
	{	id: 6,
		name: 'Momofuku Milk Bar',
		lat: '40.731806', 
		lng: '-73.985851',
		keywords: ['Bakery', ' Desserts']
	},	
	{	id: 7,
		name: 'Immaculate Conception Church',
		lat: '40.730749', 
		lng: '-73.982525',
		keywords: ['Catholic', ' Church']
	},	
	{	id: 8,
		name: 'Bellevue Hospital Center',
		lat: '40.738437', 
		lng: '-73.975436',
		keywords: ['Skin', ' Clinic ', ' Dermatology']
	},	
	{	id: 9,
		name: 'Village Vanguard',
		lat: '40.736027', 
		lng: '-74.001684',
		keywords: ['Jazz', ' Club']
	},	
]	

var Sites = function(data, mymap, wikidata) {
	this.id = ko.observable(data.id);
	this.name = ko.observable(data.name);
	this.lat = ko.observable(data.lat);
	this.lng = ko.observable(data.lng);
	this.keywords = ko.observableArray(data.keywords);
	this.wiki = ko.observable(wikidata);
	this.markers = new google.maps.Marker({
		title: data.name,
		position: new google.maps.LatLng(data.lat, data.lng),
		//map: mymap,
		animation: google.maps.Animation.DROP,
		visible: true,
		id: data.id
	});
}

//View Model
var ViewModel = function() {
	var self = this;
	var allSites = ko.observableArray();
	var myLatlng = new google.maps.LatLng(40.739174, -74.000236);
	var mapOptions = {
	    zoom: 13,
	    center: myLatlng
	  };
	
	  //map to display the Sites  
    var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
	this.searchSite = ko.observable("");   		// Observable Search String
	
	//API function to the Wikipedia Articles 
	this.getWikipedia = function (item){
		var searchTerm = item.name();
		var index = item.id();

		var articleStr = "";
	    var wikiURL = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + searchTerm + '&format=json&callback=wikiCallback';
	    var wikiRequestTimeout = setTimeout(function(){$wikiArticles = "failed to get wikipedia resources";}, 8000);
	    
		//Ajax call to retrieve the wiki articles
	    $.ajax({
		    url: wikiURL,
		    dataType: "jsonp",
		    jsonp: "callback",
		    success: function( response ) {
			    var articleList = response[1];
			    var itemArticle = "";
			    
			    for (var i = 0; i < articleList.length; i++) {
				    articleStr = articleList[i];
				    var url = 'http://en.wikipedia.org/wiki/' + articleStr;
				    itemArticle = itemArticle.concat('<li><a href="' + url + '">' + articleStr + '</a></li>');
			    	};
			    	
			    $wikiArticles[index] = ((itemArticle.length == 0) ? 'No Wikipedia Article Found.' : itemArticle);
			    clearTimeout(wikiRequestTimeout);
				} // end success()
			}); // end ajax()
		} // end getWikipedia()
	
	//API function to the NY Times Articles
	this.getNYTimes = function (item){
		var searchTerm = item.name();
		var index = item.id();
		var apiKey = "34215ca523656ef513eae99803edec73:18:71736301";
		var apiURL = "http://api.nytimes.com/svc/search/v2/articlesearch.json?q=" + searchTerm + "&api-key=" + apiKey;
		var itemArticle = "";
	
		$.getJSON(apiURL, function(data) {
			var docs = data.response.docs;
			for (var i=0; i < docs.length; i++){
				var doc = docs[i];
				itemArticle = itemArticle.concat('<li class="articles">' +
									'<a href="' + doc.web_url + '">' + doc.headline.main + '</a>' +
								    '</li>');
				}
				$nytmArticles[index] = ((itemArticle.length == 0) ? 'No NY Times Article Found.' : itemArticle);
			})// end getJSON()
		.error(function() {
			$nytmArticles = 'Error on New York Times Articles About ' + searchTerm;
			});
		}// end getNYTimes()

	//Function to get the contents of the infowindow
	this.getContents = function(locale) {
		var idx = locale.id();
		var details = "";
		
		infowindow.close();
		//gather and build the contents of the infowindow
		details = '<div id="infoWinDiv"><h2>' + locale.name() + '</h2>' + locale.keywords() +
	 				 	'<h3 class="infoWindowH3">Wikipedia Articles</h3>' +
						  '<ul class="infoWindowUL">' + $wikiArticles[idx] + '</ul>' + //Display Wiki articles
					 	'<h3 class="infoWindowH3">New York Articles</h3>' +
						  '<ul class="infoWindowUL">' + $nytmArticles[idx] + '</ul>' + //Display NY Times articles
					 '</div>';	 
		    
		//load and display the infowindow   
		infowindow.setContent(details);
	    infowindow.open(map, locale.markers);
		        
	    //Animate the markers - Bounce
	    if (locale.markers.getAnimation() != null) {
			locale.markers.setAnimation(null);
			} 
		else {
		    locale.markers.setAnimation(google.maps.Animation.BOUNCE);
		  	}
		  		
		//Stop bouncing of the markers after 2 secs.
		window.setTimeout(function () { 
		  	locale.markers.setAnimation(null); 
			}, 2000);
		    	
	    } //end getContents()
	    	
	    
	//function to gather the deatils of the site
	this.getDetails = function(locale) {
		var idx = locale.id();
		
		//create the infowindow
		infowindow = new google.maps.InfoWindow({
		    maxWidth: 180
			});
				
		//call to wiki API
		self.getWikipedia(locale);
		
		//call to NYTimes API
		self.getNYTimes(locale);
	   
		//Display the infowIndow when the marker is clicked
		google.maps.event.addListener(locale.markers, 'click', function () {
			//self.getContents(locale, idx);
			self.getContents(locale);
			});

		}; // end getDetails()
	
	//Click event of the site list
	this.showSite = function(id) {
		var idx = id();
		
		//Center map
		map.setCenter(this.siteList()[idx].markers.getPosition());
		//self.getContents(this.siteList()[idx], this.siteList()[idx].id());
		self.getContents(this.siteList()[idx]);
		}; // end showSite() 
	
	// Computed observable function that displays ALL 
	// the Sites that matches the query string
	this.siteList = ko.computed(function() {
		var matchedSites = ko.observableArray();
		var searchStr = self.searchSite().toLowerCase()
		var i=0;
		
		// Loop thru the Sites data
		initialSites.forEach(function(siteItem) {
			allSites.push(new Sites(siteItem, map, $wikiArticles[siteItem.id]));	
			allSites()[i].markers.setMap(map);
			
			if ( siteItem.name.toLowerCase().indexOf(searchStr) != -1) {
				//matchedSites.push(new Sites(siteItem, self.map));	
				matchedSites.push(allSites()[i]);	
				self.getDetails(allSites()[i]);
				}
			else{
				allSites()[i].markers.setMap(null);
				}
			i++;					
			});
			return matchedSites();
		}); // end siteList()
		
	} // end ViewModel()

$(function(){
	// Knockout Bindings
	ko.applyBindings(new ViewModel());
	});