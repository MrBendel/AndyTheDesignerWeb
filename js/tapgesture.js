var GestureRecognizerStatePossible   = 'GestureRecognizer:possible',
    GestureRecognizerStateBegan      = 'GestureRecognizer:began',
    GestureRecognizerStateChanged    = 'GestureRecognizer:changed',
    GestureRecognizerStateEnded      = 'GestureRecognizer:ended',
    GestureRecognizerStateCancelled  = 'GestureRecognizer:cancelled',
    GestureRecognizerStateFailed     = 'GestureRecognizer:failed',
    GestureRecognizerStateRecognized = GestureRecognizerStateEnded;

(function(mrbendel, $, undefined) {

var GestureRecognizerEvents = [
	GestureRecognizerStatePossible, GestureRecognizerStateBegan, GestureRecognizerStateChanged, GestureRecognizerStateEnded, GestureRecognizerStateCancelled, GestureRecognizerStateFailed
];

var TapGestureRecognizer = function(target) {
	// 40px delay
	// 400ms max
	this.target = target;
	this.translation = new mrbendel.Point();
	this.translationOrigin = new mrbendel.Point();
	this.touchstartTime;
	this.minTapDelay = 400;
	this.minTouchRadius = 40;
	this.eventHandlers = { 
		'TOUCH' : this.touchstart.bind(this),
		'MOVE' : this.touchmove.bind(this),
		'RELEASE' : this.touchend.bind(this)
	};
	$(target).on(mrbendel.TOUCH, this.eventHandlers.TOUCH);

	var handler = this.gestureRecognizerEvent.bind(this);
	for (eventName of GestureRecognizerEvents) {
		$(this.target).on(eventName, handler);
	}
}

var p = TapGestureRecognizer.prototype;
p.enabled = true;
p.state = GestureRecognizerStatePossible;
p.callback = null;
p.shouldReceiveEvent = null;

p.touchstart = function(e) {
	var shouldReceiveEvent = true;
	if (this.shouldReceiveEvent) {
		shouldReceiveEvent = this.shouldReceiveEvent(e);
	}
	if (!shouldReceiveEvent) {
		return;
	}

	if (!this.enabled) {
		return;
	}
	if (e.currentTarget == this.target) {
		var originalEvent = e.originalEvent;
		var touch = mrbendel.IS_TOUCH ? originalEvent.targetTouches[0] : e;
		this.translationOrigin.x = touch.pageX;
		this.translationOrigin.y = touch.pageY;
		this.translation.x = 0;
		this.translation.y = 0;
		this.touchstartTime = Date.now();

		// add move and release events
		$(this.target).on(mrbendel.MOVE, this.eventHandlers.MOVE);
		$(this.target).on(mrbendel.RELEASE, this.eventHandlers.RELEASE);

		this.setState(GestureRecognizerStatePossible)
	}
}

p.touchmove = function(e) {
	if (e.currentTarget == this.target) {
		var originalEvent = e.originalEvent;
		var touch = mrbendel.IS_TOUCH ? originalEvent.targetTouches[0] : e;
		this.translation.x = touch.pageX - this.translationOrigin.x;
		this.translation.y = touch.pageY - this.translationOrigin.y;
	}
}

p.touchend = function(e) {
	if (e.currentTarget == this.target) {
		var now = Date.now();
		var len = Math.abs(this.translation.length());
		if (len < this.minTouchRadius && now - this.touchstartTime < this.minTapDelay) {
			this.setState(GestureRecognizerStateRecognized);
		} else {
			this.setState(GestureRecognizerStateFailed);
		}

		// remove the target listeners
		$(this.target).off(mrbendel.MOVE, this.eventHandlers.MOVE);
		$(this.target).off(mrbendel.RELEASE, this.eventHandlers.RELEASE);
	}
}

p.setState = function(e) {
	this.state = e;
	$(this.target).trigger(e, this);
}

p.gestureRecognizerEvent = function(e) {
	if (this.callback) {
		this.callback(this);
	}
}

p.toString = function() {
	return "[object TapGestureRecognizer target=" + this.target + "]";
}

// set the namespace
mrbendel.TapGestureRecognizer = TapGestureRecognizer;

}(window.mrbendel = window.mrbendel || {}, jQuery));
