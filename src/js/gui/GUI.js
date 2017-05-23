import Selector from './Selector';
import EnergyShield from './EnergyShield';
import ColorIndicator from './ColorIndicator';
import StatusDisplay from './StatusDisplay';
import Panel from './Panel';
import Minimap from './Minimap';
import ControlPanel from './ControlPanel';
import ResourceDisplay from './ResourceDisplay';
import EntityDetailsDisplay from './EntityDetailsDisplay';

// Frame rate for the click animations
const CLICK_ANIM_FRAMERATE = 20;
const clickAnimations = {
    'click-move': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    'click-enemy': [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
    'click-friendly': [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44],
};

let phaserGame;
let entityManager;
let playerManager;
let map;
let userPointer;
let singleton;

// reference to a Phaser.Group object that incorporate all the GUI elements
let group;

// reference to the Phaser.Image represents the basic panel element
let panel;

// reference to the Minimap object 
let minimap;

// DataObjectProjector
let entityDetailsDisplay;

// reference to the ControlPanel object
let controlPanel;

// reference to the ResourceDisplay object
let resourceDisplay;

// reference to a Phaser.Sprite object that displays the click animation
let clickAnim;

function GUI() {

    initPhaserGroup();
    initClickAnimations();

    // initialise the panel according to which element it should conceal
    initGUIDisplayElements();
}

function initPhaserGroup() {
    group = phaserGame.add.group();
    phaserGame.world.bringToTop(group);
}

/**
 * Initialise the sprite object and link all the animations
 * @return {void}
 */
function initClickAnimations() {
    var anim;
    clickAnim = phaserGame.add.image(0, 0, 'gui');
    clickAnim.visible = false;
    clickAnim.anchor.setTo(0.5, 0.5);

    ['click-move', 'click-enemy', 'click-friendly'].forEach(function(animation) {

        anim = clickAnim.animations.add(animation, clickAnimations[animation]);
        anim.onStart.add(function() {
            this.visible = true;
        }, clickAnim);
        anim.onComplete.add(function() {
            this.visible = false;
        }, clickAnim);

    });

    group.add(clickAnim);
}

function initGUIDisplayElements() {

    // Creating the Panel
    panel = new Panel(phaserGame);
    panel.appendTo(group);

    // Setting up the Minimap and attacing to the Panel
    minimap = new Minimap({ phaserGame, map, entityManager, userPointer, playerManager });
    minimap.appendTo(panel, 0, 61);

    // Setting up the EntityDetailsDisplay and linking it to the Panel
    entityDetailsDisplay = new EntityDetailsDisplay({ entityManager, phaserGame });
    entityDetailsDisplay.appendTo(panel, 200, 110);

    // ControlPanel
    controlPanel = new ControlPanel({ entityManager, phaserGame });
    controlPanel.appendTo(panel, 815, 15);

    // Resource display
    resourceDisplay = new ResourceDisplay({ playerManager, phaserGame });
    resourceDisplay.appendTo(panel, 425, 88);
}


GUI.prototype = {

    /**
     * Placing and triggering the click animation onto the game area
     * @param  {integer} x
     * @param  {integer} y
     * @param  {integer} anim
     * @return {void}
     */
    putClickAnim: function(x, y, anim) {
        if (undefined === anim) {
            anim = 'click-move';
        }
        clickAnim.x = x;
        clickAnim.y = y;
        clickAnim.animations.stop(null, true);
        clickAnim.play(anim, CLICK_ANIM_FRAMERATE);
    },

    /**
     * Updating the renderable elements 
     * @return {void} 
     */
    update: function() {

        if (minimap) {
            minimap.update();
        }

        if (entityDetailsDisplay) {
            entityDetailsDisplay.update();
        }
    },

    /**
     * Linking the Selector object to a Entity
     * @param {Entity} entity 
     */
    addSelector: function(entity) {
        const selector = new Selector(phaserGame);
        selector.appendTo(entity);
        return selector;
    },

    /**
     * Links the given entity to a new EnergyShield instance
     * @param {object} entity Instance of Eneity 
     */
    addEnergyShield: function(entity) {
        const energyShield = new EnergyShield(phaserGame);
        energyShield.appendTo(entity);
        return energyShield;
    },

    /**
     * Links the given entity to a new ColorIndicator instance
     * @param {object} entity Instance of Eneity 
     */
    addColorIndicator: function(entity) {
        const colorIndicator = new ColorIndicator(phaserGame);
        colorIndicator.appendTo(entity);
        return colorIndicator;
    },

    /**
     * Linking the StatusDisplay object to a Entity
     * @param {Entity} entity 
     */
    addStatusDisplay: function(entity) {
        const statusDisplay = new StatusDisplay(phaserGame);
        statusDisplay.appendTo(entity);
        return statusDisplay;
    },

    /**
     * Return a boolean value declaring whether the primary input is however the panel
     * @return {Boolean} [true if the primary input is over the panel sprite]
     */
    isHover: function() {
        return userPointer.isHover(panel);
    }

};

export default {

    /**
     * Passing the ultimate Phaser.Game object in order to access basic Phaser functionality  
     * @param {void}
     */
    setGame: function(game) {
        phaserGame = game;
        return this;
    },

    /**
     * Passing the entityManager object to retrive Entity objects in order to display
     * entity attributes on the Panel
     * @param {objet} [_entityManager] [reference to EntityManager singleton]
     * @param {void}
     */
    setEntityManager: function(_entityManager) {
        entityManager = _entityManager;
        return this;
    },

    /**
     * Passing the Map object to fetch map details mostly for rendering the Minimap 
     * @param {objet} [_map] [reference to Map singleton]
     * @param {void}
     */
    setMap: function(_map) {
        map = _map;
        return this;
    },

    /**
     * UserPointer object to register custom listeners for interactions with the mouse
     * @param {object} _userPointer UserPointer
     */
    setUserPointer: function(_userPointer) {
        userPointer = _userPointer;
        return this;
    },

    /**
     * Registers the playerManager instance into the execution context
     * @param {object} _playerManager [PlayerManager]
     */
    setPlayerManager: function(_playerManager) {
        playerManager = _playerManager;
        return this;
    },

    /**
     * Accessing the singleton instance of the GUI 
     * @param {boolean} forceNewInstance 
     * @return {object} GUI
     */
    getInstance: function(forceNewInstance) {
        if (!phaserGame) {
            throw 'Invoke setGame first to pass the Phaser Game entity!';
        }
        if (!singleton || forceNewInstance) {
            singleton = new GUI();
        }
        return singleton;
    }
}