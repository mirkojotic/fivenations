window.addEventListener('load', function () {
  	'use strict';

	var ns = window.fivenations || (window.fivenations = {});

	// Game specific constants
	ns.window = {
		width: 1024,
		height: 768,
		canvasElmId: 'fivenations-game'
	};

	// resizing the main canvas element in order to make it fit to the current window size
	ns.resize = function(){
		var vendorPrefixes = [
				'webkitTransform',
				'MozTransform',
				'msTransform',
				'OTransform',
				'transform'
			],
			targetRatio = window.innerWidth / ns.window.width,
			transform = 'scale(' + targetRatio + ')';

		vendorPrefixes.forEach(function(prefix){
			document.getElementById(ns.window.canvasElmId).style[prefix] = transform;
		});

	};

	// essential player informations
	ns.players = {
		colors: [
			'0x08A2EA',
			'0x10B308',
			'0xF28209',
			'0xBA10D9',
			'0xD40F0F',
			'0xF8F8F9',
			'0xE5C410',
			'0x65615D'
		]
	};

	// Cache for assets don't required to be loaded more than once
	ns.cache = {};

  	// define the needed configuration for RequireJS
	require.config({
	    baseUrl: 'js/'
	});

	// Kick off the main thread 
	require([
		'Boot',
		'Preloader',
		'Menu',
		'Game'
	], function(Boot, Preloader, Menu, Game){

		var game = new Phaser.Game(ns.window.width, ns.window.height, Phaser.AUTO, ns.window.canvasElmId);
		game.state.add('boot', Boot);
		game.state.add('preloader', Preloader);
		game.state.add('menu', Menu);
		game.state.add('game', Game);

		// publishing the Game object 
		ns.Game = Game;

		/* yo phaser:state new-state-files-put-here */
		game.state.start('boot');

	});

}, false);
