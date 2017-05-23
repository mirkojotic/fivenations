import EffectManager from './EffectManager';
import Effects from './Effects';
import Util from '../../common/Util';

/**
 * Constructor function to initialise the MotionManager
 * @param {[object]} entity [The target entity whose coordinates will be altered by the applied effects]
 */
function MotionManager(entity) {

    this.game = entity.game;

    this.dispatcher = new Util.EventDispatcher();
    this.effectManager = new EffectManager(this);

    this.entity = entity;
    this.sprite = entity.getSprite();
    this.animationManager = entity.getAnimationManager();

    this.movement = createMovementObject(entity);
    this.rotation = createRotationObject(entity);
    this.levitation = createLevitationObject(entity);

    this.isEntityArrivedAtDestination = false;
    this.isEntityStoppedAtDestination = false;
    this.isEntityHeadedToDestination = false;

}

/**
 * creates a structure for the helper variables placed into a 
 * namespace
 * @param  {object} entity given Entity needs to be moved
 * @return {object} prototype of movement related helper variables
 */
function createMovementObject(entity) {
    var dataObject = entity.getDataObject();
    return {
        velocity: 0,
        acceleration: 0,
        maxVelocity: dataObject.getSpeed(),
        maxAcceleration: dataObject.getSpeed(),
        maxTargetDragTreshold: dataObject.getSpeed()
    };        
}

/**
 * creates a structure for the helper variables placed into a 
 * namespace
 * @param  {object} entity given Entity needs to be moved
 * @return {object} prototype of rotation related helper variables
 */
function createRotationObject(entity) {
    var dataObject = entity.getDataObject();
    return {
        targetAngleCode: 0,
        currentAngleCode: 0,
        maxAngleCount: dataObject.getDirections(),
        angularVelocity: 0,
        angularVelocityHelper: 0,
        maxAngularVelocity: dataObject.getManeuverability(),
        framePadding: dataObject.getAnimFrame() || 1
    };        
}

/**
 * Creates helper attributes for the idle-like float animation
 * @param  {object} entity given Entity needs to be moved
 * @return {object} prototype of rotation related helper variables
 */
function createLevitationObject(entity) {
    return {
        time: 0,
        defaultAnchorY: entity.getSprite().anchor.y 
    }
}

MotionManager.prototype = {

    /**
     * Make the entity move from its current position to the target coords. The operation also 
     * calculates all the required helper variables including the rotoation.
     * @param  {object} activity Reference to the given Activity instance
     * @return {void}
     */
    moveTo: function(activity) {

        this.activity = activity;

        this.effectManager.resetEffects();
        this.effectManager.execute(Effects.get('initMovement'));

        if (this.isRequiredToStopBeforeFurtherAction()) {
            this.effectManager.addEffect(Effects.get('stopping'));
            this.effectManager.addEffect(Effects.get('resetMovement'));
        }

        this.effectManager.addEffect(Effects.get('stopAnimation'));
        this.effectManager.addEffect(Effects.get('rotateToTarget'));
        this.effectManager.addEffect(Effects.get('accelerateToTarget'));
        this.effectManager.addEffect(Effects.get('moveToTarget'));
        this.effectManager.addEffect(Effects.get('stopping'));
        this.effectManager.addEffect(Effects.get('resetMovement'));
        this.effectManager.addEffect(Effects.get('stopAnimation'));

    },

    /**
     * Resets all motion related effects and helper variables 
     * from being effecting the given entity
     * @return {void}
     */
    reset: function() {
        this.effectManager.resetEffects();
    },

    /**
     * Terminate the entity from any further movement by applying a suitable drag on it
     * @return {void}
     */
    stop: function() {
        this.effectManager.resetEffects();
        this.effectManager.addEffect(Effects.get('stopping'));
        this.effectManager.addEffect(Effects.get('resetMovement'));
        this.effectManager.addEffect(Effects.get('stopAnimation'));
    },

    /**
     * Rotates the entity towards the given target that the activity returns
     * @return {void}
     */
    rotateToTarget: function(activity) {
        this.activity = activity;

        this.effectManager.resetEffects();
        this.effectManager.addEffect(Effects.get('initMovement'));

        if (this.isRequiredToStopBeforeFurtherAction()) {
            this.effectManager.addEffect(Effects.get('stopping'));
            this.effectManager.addEffect(Effects.get('resetMovement'));
        }

        this.effectManager.addEffect(Effects.get('rotateToTarget'));
    },

    /**
     * Makes the entity slowly floating up and down
     * @return {void}
     */
    levitate: function() {
        this.effectManager.addEffect(Effects.get('levitating'));
    },

    /**
     * Stops the floating animation
     */
    stopLevitating: function() {
        this.effectManager.resetEffects();
        this.entity.sprite.anchor.setTo(0.5, 0.5);
    },

    /**
     * Tick function for altering the helper variables that determines the effects
     * influence the entity object 
     * @return {void}
     */
    update: function() {
        this.updateVelocity();
        this.updateRotation();
        this.effectManager.updateEffects();
        this.executeChecks();
    },

    /**
     * Updating the velocity according to the applied effects that can alter the coordinates of the Entity
     * @return {void} 
     */
    updateVelocity: function() {

        this.movement.distance = this.game.physics.arcade.distanceToXY(this.sprite, this.movement.targetX, this.movement.targetY);
        this.movement.distanceInverse = this.movement.targetInitialDistance - this.movement.distance;
        this.movement.distanceFromOrigin = this.game.physics.arcade.distanceToXY(this.sprite, this.movement.originX, this.movement.originY);

        if (this.movement.acceleration) {
            this.movement.velocity += this.movement.acceleration * this.game.time.physicsElapsed;
        } else if (this.movement.drag) {
            this.movement.drag *= this.game.time.physicsElapsed;
            if (this.movement.velocity - this.movement.drag > 0) {
                this.movement.velocity -= this.movement.drag;
            } else if (this.movement.velocity + this.movement.drag < 0) {
                this.movement.velocity += this.movement.drag;
            } else {
                this.movement.velocity = 0;
            }
        }

        if (this.movement.velocity > this.movement.maxVelocity) {
            this.movement.velocity = this.movement.maxVelocity;
        } else if (this.movement.velocity < -this.movement.maxVelocity) {
            this.movement.velocity = -this.movement.maxVelocity;
        }

        this.sprite.body.velocity.x = Math.cos(this.movement.currentAngle) * this.movement.velocity;
        this.sprite.body.velocity.y = Math.sin(this.movement.currentAngle) * this.movement.velocity;
    },

    /**
     * Updating the sprite's current frame according to the rotation details
     * @return {void} 
     */
    updateRotation: function() {

        if (this.movement.velocity > 0 && this.entity.hasSlowManeuverability()) {
            return;
        }

        if (this.rotation.currentAngleCode === this.rotation.targetAngleCode) {
            if (!this.isEntityHeadedToDestination) {
                this.isEntityHeadedToDestination = true;
                this.effectManager.addEffectToTop(Effects.get('startMoveAnimation'));
            }
            return;
        }

        this.movement.currentAngle = this.movement.targetAngle;
        this.rotation.angularDirection = this.rotation.stepNumberToLeft < this.rotation.stepNumberToRight ? -1 : 1;

        this.rotation.angularVelocityHelper += this.rotation.angularVelocity * this.game.time.physicsElapsed;
        if (this.rotation.angularVelocityHelper > 1) {
            this.rotation.angularVelocityHelper = 0;
            if (this.rotation.currentAngleCode + this.rotation.angularDirection < 0) {
                this.rotation.currentAngleCode = this.rotation.maxAngleCount;
            }
            this.rotation.currentAngleCode += this.rotation.angularDirection;
            this.rotation.currentAngleCode %= this.rotation.maxAngleCount;
        }

        this.sprite.frame = this.rotation.currentAngleCode * this.rotation.framePadding;

    },

    /**
     * Executes checks after altering the position of the given entity has been ran
     * @return {void}
     */
    executeChecks: function() {
        if (this.isEntityStoppedAtDestination){
            if (this.activity) {
                this.activity.kill();
            }
            this.dispatcher.dispatch('arrive');
            this.isEntityStoppedAtDestination = false;
            this.isEntityArrivedAtDestination = false;
        }
    },

    /**
     * Registers a callback to the given event
     * @param  {string} event
     * @param  {Function} callback 
     * @return {void}            
     */
    on: function(event, callback) {
        this.dispatcher.addEventListener(event, callback);
    },

    /**
     * Registers a callback to the given event that will be called only once
     * @param  {string} event
     * @param  {Function} callback 
     * @return {void}            
     */
    once: function(event, callback) {
        if (typeof callback !== 'function') {
            return;
        }
        this.dispatcher.addEventListener(event, function once() {
            callback();
            this.dispatcher.removeEventListener(event, once);
        }.bind(this));
    },

    /**
     * Checks whether the entity is facing towards it's target
     * @param  {object} targetEntity
     * @return {boolean}
     */
    isEntityFacingTargetEntity: function(targetEntity) {
        var sprite = this.entity.getSprite();
        var targetSprite = targetEntity.getSprite();
        var targetAngle = Math.atan2(targetSprite.y - sprite.y, targetSprite.x - sprite.x);
        var targetAngleCode = this.getTargetAngleCodeByTargetAngle(targetAngle);
        return this.rotation.currentAngleCode === targetAngleCode;
    },

    /**
     * Returns whether the entity needs trigger the stop action
     * before having any further actions added to its motion queue
     * @return {boolean}
     */
    isRequiredToStopBeforeFurtherAction: function() {
        return this.movement.velocity > 0 && this.rotation.currentAngleCode !== this.rotation.targetAngleCode && this.entity.hasSlowManeuverability();
    },

    /**
     * Returns the current angle code determined by the updateRotation method
     * @returns {integer} current angle code that usually goes from 0 to 15
     */
    getCurrentAngleCode: function() {
        return this.rotation.currentAngleCode;
    },

    /**
     * Returns the entity instance linked to the motion manager
     * @return {object} Entity
     */
    getEntity: function() {
        return this.entity;
    },

    /**
     * Returns the calculated target angle code according to the given angle
     * @oaram {float} targetAngle
     * @return {integer}
     */
    getTargetAngleCodeByTargetAngle: function(targetAngle) {
        var rotationOffset = Math.floor(this.rotation.maxAngleCount * 0.75);
        var calculatedAngle;

        if (this.rotation.maxAngleCount === 1) return 0;

        calculatedAngle = Phaser.Math.radToDeg(targetAngle);
        if (calculatedAngle < 0) {
            calculatedAngle = 360 - Math.abs(calculatedAngle);
        }
        return (Math.floor(calculatedAngle / (360 / this.rotation.maxAngleCount)) + rotationOffset) % this.rotation.maxAngleCount;
    },        

};

export default MotionManager;