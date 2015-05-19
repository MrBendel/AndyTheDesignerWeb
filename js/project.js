var mrbendel_global_project_is_active = false;

(function(mrbendel, $, undefined) {
// 	$('#buttonId').on('touchstart click', function(e){
//     e.stopPropagation(); e.preventDefault();
//     //your code here

// });

	var imageIsLoaded = mrbendel.imageIsLoaded = function(image) {
		// During the onload event, IE correctly identifies any images that
	    // weren’t downloaded as not complete. Others should too. Gecko-based
	    // browsers act like NS4 in that they report this incorrectly.
	    if (!image.complete) {
	        return false;
	    }

	    // However, they do have two very useful properties: naturalWidth and
	    // naturalHeight. These give the true size of the image. If it failed
	    // to load, either of these should be zero.

	    if (typeof image.naturalWidth !== "undefined" && image.naturalWidth === 0) {
	        return false;
	    }

	    // No other way of checking: assume it’s ok.
	    return true;
	}

	var getWindowSize = function() {
		var width = $(window).width();
		var height = $(window).height();
		console.log(width, height);

		return { 'width' : width, 'height' : height };
	}

	DragDirection = {
		unset 	: 0,
		left 	: 1,
		right 	: 2,
		up 		: 3,
		down 	: 4
	}
	var directionIsHorizontal = function(dir) {
		return dir === DragDirection.left || dir === DragDirection.right;
	}
	var directionIsVertical = function(dir) {
		return dir === DragDirection.up || dir === DragDirection.down;
	}

	mrbendel.Project = mrbendel.Class({
	    initialize: function(data, container) {
	        this.data = data;
	        this.container = container;
	        this.contents  = container.contents;
	        this.project = null;
	        this.projectBackground = null;
	        this.projectDescription = null;
	        this.closeButton  = null;
	        this.navRight = null;
	        this.navLeft = null;
	        this.isClosed = false;
	        this.scrollVelocity = 0;
	        this.listItems = [];
	        this.imageItems = [];
	        this.itemIndex = 0;
	        this.nextItemIndex = 0;
	        this.dragDirection = DragDirection.unset;
	        this.translation;
	        this.startPoint;
	        this.transitioning = false;
	        this.eventHandlers = {};
	        this.tapToHideGesture = null;
	        this.projectDescriptionHidden = false;

	        // mouse wheeling
	        this.deltas = [null, null, null, null, null, null, null, null, null];
		    this.lockMouseWheel = false;

	        var self = this;
	        var tap = new mrbendel.TapGestureRecognizer(this.contents);
	        tap.callback = function(sender) {
	        	if (sender.state === GestureRecognizerStateRecognized) {
	        		self.showProject();
	        	}
	        };
	    },

	    showProject: function() {
	    	if (mrbendel_global_project_is_active) {
	    		return;
	    	}

	    	mrbendel_global_project_is_active = true;

	    	var self = this;

	    	self.project = mrbendel.newDiv('project');
	    	self.projectBackground = mrbendel.newDiv('project-background project-background-initial-state');
	    	self.projectDescription = self.createProjectDescription(self.data);
	    	self.closeButton = self.createCloseButton();
	    	self.navLeft = self.createNavigationButton('left');
	    	self.navRight = self.createNavigationButton('right');

			$('body').append(self.projectBackground);
			$('body').append(self.project);
			$('body').append(self.projectDescription);
			if (!mrbendel.IS_TOUCH) {
				$('body').append(self.navLeft);
				$('body').append(self.navRight);
			}
			$('body').append(self.closeButton);

	    	$('body').addClass('lock-position');
	    	if (mrbendel.IS_TOUCH) {
	    		$('body').on("touchmove", {}, function(event){
		            event.preventDefault();
		        });
	    	}

	    	var ol = mrbendel.newElement('ol');
	    	for (var i = 1; i <= 4; i++) {
	    		var li = mrbendel.newElement('li', 'li-transition-opacity visuallyhidden');
	    		li.size = {
	    			width: 1,
	    			height: 1
	    		}
	    		var img = new Image();
	    		$(img).one('load', function(e) {
	    			var idx = self.imageItems.indexOf(this);
	    			if (idx >= 0) {
	    				self.resizeToFitWindow(idx)
	    			}
	    			$(this).css('opacity', 1);
	    		});
	    		$(img).attr('src', 'images/oliver-00' + i + '.jpg');
	    		$(li).append(img);
	    		$(ol).append(li);

	    		this.listItems.push(li);
	    		this.imageItems.push(img);
	    	};
	    	$(self.project).append(ol);
	    	this.resizeHandler();

	    	mrbendel.dispatchAsync(16.667, function() {
	    		var eventTriggered = false;
	    		$(self.projectBackground).one(kNotificationTransitionEnd, function(e) {
	    			if (!eventTriggered) {
	    				eventTriggered = true;

	    				self.onReady(e);
	    			}
	    		});

	    		$(self.projectBackground).removeClass('project-background-initial-state');
	    		$(self.closeButton).removeClass('project-close-initial-state');
	    	});
	    },

	    resizeHandler: function(e) {
	    	for (var i = this.listItems.length - 1; i >= 0; i--) {
	    		this.resizeToFitWindow(i);
	    	};

	    	var viewWidth = $(window).width();
	    	var navW = parseInt($(this.navLeft).css('margin')) * 2 + parseInt($(this.navLeft).css('width'));
	    	var imgW = this.listItems[this.itemIndex].size.width;
	    	var navLeftOffset = Math.max(-navW - imgW * 0.5, -viewWidth * 0.5);
	    	var navRightOffset = Math.min(imgW * 0.5, viewWidth * 0.5 - navW);
	    	$(this.navLeft).setTransform('translate('+navLeftOffset+'px,-50%)');
	    	$(this.navRight).setTransform('translate('+navRightOffset+'px,-50%)');
	    },

	  	resizeToFitWindow: function(index) {
	  		var viewSize = getWindowSize();
	    	var li = this.listItems[index];
	    	var img = this.imageItems[index];
	    	var width = 1; height = 1;
	    	if (imageIsLoaded(img)) {
	    		width = img.naturalWidth;
	    		height = img.naturalHeight;
	    	}
	    	var scale = Math.min(viewSize.width / width, viewSize.height / height);
	    	
	    	var fWidth = Math.floor(width * scale * 0.85);
	    	var fHeight = Math.floor(height * scale * 0.85);
	    	$(img).attr('width', fWidth);
	    	$(img).attr('height', fHeight);
	    	$(li).css('width', fWidth);
	    	$(li).css('height', fHeight);
	    	li.size.width = fWidth;
	    	li.size.height = fHeight;
	  	},

	    onReady: function(e) {
	    	var self = this;

	    	// add the resize listener
			var resizeHandler = function(e) {
				self.resizeHandler(e);
			}
			$(window).resize(resizeHandler);

			// show the project description
			self.projectDescriptionHidden = false;
			$(self.projectDescription).removeClass('project-description-initial-state');
			// blur the background
	    	$('body').addClass('body-blur-it');
	    	// add the close listener
			$(self.closeButton).one(kNotificationClick, function(e) {
				e.stopPropagation(); e.preventDefault();
				self.onClose(e);
			});

			$(document).on('keydown', function(e) {
				console.log(e.keyCode);
				if(e.keyCode == 37) { // left
					if (self.transitioning) {
						return;
					}
					self.dragDirection = DragDirection.right;
					self.nextItemIndex = self.itemIndex - 1;
					self.prepareAnimation();
				}
				else if(e.keyCode == 39) { // right
					if (self.transitioning) {
						return;
					}
					self.dragDirection = DragDirection.left;
					self.nextItemIndex = self.itemIndex + 1;
					self.prepareAnimation();
				}
			});

			$(self.navLeft).on(kNotificationClick, function(e) {
				e.stopPropagation(); e.preventDefault();
				if (self.transitioning) {
					return;
				}
				self.dragDirection = DragDirection.right;
				self.nextItemIndex = self.itemIndex - 1;
				self.prepareAnimation();
			});

			$(self.navRight).on(kNotificationClick, function(e) {
				e.stopPropagation(); e.preventDefault();
				if (self.transitioning) {
					return;
				}
				self.dragDirection = DragDirection.left;
				self.nextItemIndex = self.itemIndex + 1;
				self.prepareAnimation();
			});

			var li = this.listItems[this.itemIndex];
			$(li).removeClass('visuallyhidden');
			$(li).css('opacity', 1);

			if (!mrbendel.IS_TOUCH) {
				// mousewheel support
				var mousewheelHandler = function(e) {
				    self.mousewheelHandler(e);
				}
				$(this.project).mousewheel(mousewheelHandler);
			}

			// add interactivity
			self.eventHandlers.touchstart = this.touchstart.bind(this);
			self.eventHandlers.touchmove = this.touchmove.bind(this);
			self.eventHandlers.touchend = this.touchend.bind(this);

			$(self.project).on(mrbendel.TOUCH, self.eventHandlers.touchstart);

			// setup the navigation buttons
			$.each([this.navLeft, this.navRight], function() {
				$(this).css('opacity', 1);
			});
			self.moveNavigationButtons();
	    },

	    moveNavigationButtons: function() {

	    },

	    // https://github.com/jquery/jquery-mousewheel/issues/36
	    hasPeak: function() {
		    // Decrement the lock.
		    
		    if (this.lockMouseWheel || this.transitioning) {
		        return false;
		    }
		    
		    // If the oldest delta is null, there can't be a peak yet; so return.
		    
		    if (this.deltas[0] == null) return false;
		    
		    // Otherwise, check for a peak signature where the middle delta (4)
		    // is the highest among all other this.deltas to the left or right.
		    
		    if (
		        this.deltas[0] <  this.deltas[4] &&
		        this.deltas[1] <= this.deltas[4] &&
		        this.deltas[2] <= this.deltas[4] &&
		        this.deltas[3] <= this.deltas[4] &&
		        this.deltas[5] <= this.deltas[4] &&
		        this.deltas[6] <= this.deltas[4] &&
		        this.deltas[7] <= this.deltas[4] &&
		        this.deltas[8] <  this.deltas[4]
		    ) return true;
		    
		    // If no peak is found, return false.
		    return false;
		},

	    mousewheelHandler: function(e) {
	    	// Convert the delta into a usable number (pretty standard).
    		var delta  = e.type == 'mousewheel' ? e.originalEvent.wheelDelta * -1 : 40 * e.originalEvent.detail;

    		// Check for an inertial peak. And if found, lock the peak
		    // checking for 10 more events (decremented in hasPeak on
		    // each new event) to prevent the sample window from registering
		    // true more than once for each peak.
		    if (this.hasPeak()) {
		        this.lockMouseWheel = true;

		        this.handleMousewheelSwipe(e);
		    }
		    // Otherwise, check for normal mouse wheel events by assuming
		    // past and present deltas would be 120 exactly, and skip nulls.
		    else if ((this.deltas[8] == null || this.deltas[8] == 120) && Math.abs(delta) == 120) {

		    }

		    // Shift the deltas backward and add the newest (maintaining the sample window).
		    this.deltas.shift();
		    this.deltas.push(Math.abs(delta));
	    },

	    handleMousewheelSwipe: function(e) {
	    	if (this.dragDirection == DragDirection.unset) {
	    		if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
	    			if (e.deltaX > 0) {
	    				this.dragDirection = DragDirection.left;
	    				this.nextItemIndex = this.itemIndex - 1;
	    			} else {
	    				this.dragDirection = DragDirection.right;
	    				this.nextItemIndex = this.itemIndex + 1;
	    			}
	    		} else {
	    			if (e.deltaY < 0) {
	    				this.dragDirection = DragDirection.up;
	    				this.nextItemIndex = this.itemIndex - 1;
	    			} else {
	    				this.dragDirection = DragDirection.down;
	    				this.nextItemIndex = this.itemIndex + 1;
	    			}
	    		}
	    	}

	    	this.prepareAnimation();
   	    },

   	    touchstart: function(e) {
   	    	if (this.transitioning) {
				return;
			}

			this.translation = new mrbendel.Point();
   	    	var originalEvent = e.originalEvent;
			var touch = mrbendel.IS_TOUCH ? originalEvent.targetTouches[0] : e;
			this.startPoint = new mrbendel.Point(touch.pageX, touch.pageY);
			this.dragDirection = DragDirection.unset;
			this.nextItemIndex = -1;

			$.each([this.navLeft, this.navRight], function() {
				$(this).css('opacity', 0);
			});

			// add additional listeners
			$(this.project).on(mrbendel.MOVE, this.eventHandlers.touchmove);
			$(this.project).on(mrbendel.RELEASE, this.eventHandlers.touchend);
   	    },

   	    touchmove: function(e) {
	   	    var originalEvent = e.originalEvent;
			var touch = mrbendel.IS_TOUCH ? originalEvent.targetTouches[0] : e;
   	    	var lastTrans = this.translation.copy();
   	    	this.translation.x = touch.pageX - this.startPoint.x;
   	    	this.translation.y = touch.pageY - this.startPoint.y;

   	    	var self = this;
   	    	var prepareNextItem = function() {
   	    		if (self.nextItemIndex != -1) {
   	    			var li = self.listItems[self.nextItemIndex];
   	    			$(li).setTransform('transform(-50%,-50%)');
   	    			$(li).css('opacity', 0);
   	    		}
   	    		var offset = 1;
   	    		if (self.dragDirection == DragDirection.right || self.dragDirection == DragDirection.down) {
   	    			offset = -1;
   	    		}
   	    		self.nextItemIndex = self.itemIndex + offset;
   	    		self.nextItemIndex = (self.nextItemIndex + self.listItems.length)%self.listItems.length;

   	    		var nex = self.listItems[self.nextItemIndex];
   	    		$(nex).removeClass('visuallyhidden');
   	    		$(nex).css('opacity', 1);
   	    	}

   	    	var isNewDrag = this.dragDirection == DragDirection.unset && 
   	    				    (lastTrans.x + lastTrans.y == 0) && 
   	    				    Math.abs(this.translation.x) + Math.abs(this.translation.y) > 0;
   	    	var crossedHorz = (lastTrans.x <= 0 && this.translation.x >= 0) ||
   	    					  (lastTrans.x >= 0 && this.translation.x <= 0);
			var crossedVert = (lastTrans.y <= 0 && this.translation.y >= 0) ||
   	    				  	  (lastTrans.y >= 0 && this.translation.y <= 0);

   	    	if (isNewDrag) {
   	    		if (Math.abs(this.translation.x) > Math.abs(this.translation.y)) {
   	    			// horizontal drag
   	    			if (this.translation.x > 0) {
   	    				this.dragDirection = DragDirection.right;
   	    			} else {
   	    				this.dragDirection = DragDirection.left;
   	    			}
   	    		} else {
   	    			// vertical drag
   	    			if (this.translation.y > 0) {
   	    				this.dragDirection = DragDirection.down;
   	    			} else {
   	    				this.dragDirection = DragDirection.up;
   	    			}
   	    		}

   	    		prepareNextItem();
   	    	}

   	    	// when we cross the 0 threshold, start dragging the opposing direction
   	    	if ((directionIsHorizontal(this.dragDirection) && crossedHorz) ||
   	    		(directionIsVertical(this.dragDirection) && crossedVert)) {

   	    		if (directionIsHorizontal(this.dragDirection)) {
   	    			if (this.translation.x > 0) {
   	    				this.dragDirection = DragDirection.right;
   	    			} else {
   	    				this.dragDirection = DragDirection.left;
   	    			} 
   	    		} else {
   	    			if (this.translation.y > 0) {
   	    				this.dragDirection = DragDirection.down;
   	    			} else {
   	    				this.dragDirection = DragDirection.up;
   	    			}
   	    		}
   	    		prepareNextItem();
   	    	}

   	    	var cur = this.listItems[this.itemIndex];
   	    	var nex = this.listItems[this.nextItemIndex];

   	    	// drag it cur
	    	var offsetX = -cur.size.width * 0.5;
	    	var offsetY = -cur.size.height * 0.5;
	    	if (directionIsHorizontal(this.dragDirection)) {
	    		offsetX += this.translation.x;
	    	} else {
	    		offsetY += this.translation.y;
	    	}
	    	$(cur).setTransform('translate('+offsetX+'px,'+offsetY+'px)');

	    	// nex
	    	if (nex) {
	    		var viewSize = getWindowSize();
	    		viewSize.width = viewSize.width * 0.5 + nex.size.width * 0.5;
		    	offsetX = -nex.size.width * 0.5;
		    	offsetY = -nex.size.height * 0.5;
		    	if (directionIsHorizontal(this.dragDirection)) {
		    		offsetX += this.translation.x + viewSize.width * (this.dragDirection == DragDirection.right ? -1 : 1);
		    	} else {
		    		offsetY += this.translation.y + viewSize.height * (this.dragDirection == DragDirection.up ? 1 : -1);
		    	}
		    	$(nex).setTransform('translate('+offsetX+'px,'+offsetY+'px)');
	    	} else {
	    		console.log('next index not found: ' + this.nextItemIndex);
	    	}

	    	// hide on touch
	    	if (mrbendel.IS_TOUCH && !this.projectDescriptionHidden) {
	    		this.projectDescriptionHidden = true;
	    		$(this.projectDescription).addClass('project-description-hidden');
	    	}
   	    },

   	    touchend: function(e) {
   	    	$(this.project).off(mrbendel.MOVE, this.eventHandlers.touchmove);
			$(this.project).off(mrbendel.RELEASE, this.eventHandlers.touchend);

   	    	if (this.dragDirection > DragDirection.unset) {
   	    		var cur = this.listItems[this.itemIndex];
	   	    	var nex = this.listItems[this.nextItemIndex];

	   	    	$.each([cur, nex], function() {
					$(this).removeClass('li-transition-opacity');
					$(this).addClass('li-transition-all');
				});

				this.finishAnimation();
   	    	}

   	    	$.each([this.navLeft, this.navRight], function() {
				$(this).css('opacity', 1);
			});
   	    },

   	    prepareAnimation: function() {
   	    	this.nextItemIndex = (this.nextItemIndex + this.listItems.length)%this.listItems.length;

   	    	var cur = this.listItems[this.itemIndex];
	    	var nex = this.listItems[this.nextItemIndex];
	    	$(nex).removeClass('visuallyhidden');
	    	$(nex).css('opacity', 1);

	    	var viewSize = getWindowSize();
	    	var offsetX = -nex.size.width * 0.5; offsetY = -nex.size.height * 0.5;
	    	if (directionIsHorizontal(this.dragDirection)) {
	    		offsetX += viewSize.width * 0.5 * (this.dragDirection == DragDirection.left ? 1 : -1);
	    	} else if (directionIsVertical(this.dragDirection)) {
	    		offsetY += viewSize.height * 0.5 * (this.dragDirection == DragDirection.up ? 1 : -1);
	    	}
	    	$(nex).setTransform('translate('+offsetX+'px,'+offsetY+'px)');

	    	var self = this;
    		setTimeout(function() {
    			$.each([cur, nex], function() {
					$(this).removeClass('li-transition-opacity');
					$(this).addClass('li-transition-all');
				});

				self.finishAnimation();
				self.lockMouseWheel = false;
			}, 1000/60);
   	    },

	    finishAnimation: function() {
	    	var self = this;
	    	this.transitioning = true;
	    	var dragDirection = this.dragDirection;
	    	this.dragDirection = DragDirection.unset;

	    	var end = 50;
	    	if (dragDirection === DragDirection.left ||
	    		dragDirection === DragDirection.up) {
	    		end = -150;
	    	}

	    	var cur = this.listItems[this.itemIndex];
	    	var nex = this.listItems[this.nextItemIndex];

	    	var eventTriggered = false;
    		$(cur).one(kNotificationTransitionEnd, function(e) {
    			if (!eventTriggered) {
    				eventTriggered = true;

    				self.transitioning = false;
    				self.itemIndex = self.nextItemIndex;

    				$.each([cur, nex], function() {
						$(this).removeClass('li-transition-all');
						$(this).addClass('li-transition-opacity');
					});

    				$(cur).setTransform('translate(-50%,-50%)');
    			}
    		});

    		var viewSize = getWindowSize();
    		viewSize.width = viewSize.width * 0.5 + cur.size.width * 0.5;
    		viewSize.height = viewSize.height * 0.5 + cur.size.height * 0.5;
	    	offsetX = -cur.size.width * 0.5;
	    	offsetY = -cur.size.height * 0.5;
	    	if (directionIsHorizontal(dragDirection)) {
	    		offsetX += viewSize.width * (dragDirection == DragDirection.left ? -1 : 1);
	    	} else {
	    		offsetY += viewSize.height * (dragDirection == DragDirection.up ? -1 : 1);
	    	}
	    	$(cur).setTransform('translate('+offsetX+'px,'+offsetY+'px)');

	    	$(cur).css('opacity', 0);
	    	$(nex).setTransform('translate(-50%,-50%)');

	    	console.log(document.activeElement);
	    	$(document.activeElement).blur();
	    	console.log(document.activeElement);
	    },

	    onClose: function(e) {
	    	var self = this;
	    	// set closed flag
	    	self.isClosed = true;
	    	// remove listeners
	    	$(window).off('resize');
	    	$(window).off('mousewheel');

	    	$('body').removeClass('body-blur-it');
	    	$(self.closeButton).addClass('project-close-initial-state');
	    	$(self.projectBackground).addClass('project-background-initial-state');
	    	$(self.projectDescription).addClass('project-description-initial-state');

	    	$(self.project).find('ol li').each(function() {
				$(this).css('opacity', 0);
			});

			$.each([self.navLeft, self.navRight, self.projectDescription], function() {
				$(this).css('opacity', 0);
			});

	    	var eventTriggered = false;
	    	$(self.projectBackground).one(kNotificationTransitionEnd, function(e) {
	    		if (!eventTriggered) {
	    			eventTriggered = true;

	    			$.each([self.projectBackground, self.project, self.projectDescription, self.closeButton, self.navLeft, self.navRight], function() {
	    				$(this).remove();
	    			});
		    		$(self.project).find('ol li').each(function() {
						$(this).remove();
					});
		    		$('body').removeClass('lock-position');
		    		if (mrbendel.IS_TOUCH) {
			    		$('body').off('touchmove');
			    	}
		    		$.each([self.closeButton, self.navLeft, self.navRight], function() {
		    			$(this).off(kNotificationClick);
		    		});
		    		$(document).off('keydown');
		    		self.closeButton = null;
					self.project = null;
					self.projectBackground = null;
					self.listItems = [];
					self.imageItems = [];
					self.itemIndex = 0;
				}
	    	});

	    	// remove interactivity
	    	$(self.project).off(mrbendel.TOUCH, self.eventHandlers.touchstart);
	    	$(self.project).off(mrbendel.MOVE, self.eventHandlers.touchmove);
	    	$(self.project).off(mrbendel.RELEASE, self.eventHandlers.touchend);

			mrbendel_global_project_is_active = false;
	    },

	   	createCloseButton: function() {
	   		var closeButton = mrbendel.newDiv('project-button project-close project-close-initial-state');
	    	// var close_icon_x = mrbendel.newElement('i', 'fa fa-arrow-left fa-2x');
	    	var close_icon_x = mrbendel.newElement('i', 'fa fa-times fa-2x');
	    	var close_icon_clone = close_icon_x.cloneNode(false);
	    	$(closeButton).append(close_icon_x);
	    	$(closeButton).append(close_icon_clone);
	    	return closeButton;
	  	},

	   	createNavigationButton: function(direction) {
	   		var button = mrbendel.newDiv('project-button project-navigation');
	    	var icon = mrbendel.newElement('i', 'fa fa-arrow-' + direction + ' fa-2x');
	    	var icon_clone = icon.cloneNode(false);
	    	$(button).append(icon);
	    	$(button).append(icon_clone);

	    	var widthStyle = $.getStyleForStyleSheet('screen', '.project-button', 'width');
	    	var marginStyle = $.getStyleForStyleSheet('screen', '.project-button', 'margin');
	    	var margin = parseInt(marginStyle);
	    	var width = parseInt(widthStyle);
    		var viewWidth = $(window).width() * 0.5;
	    	var offsetX = -(width + margin * 2) * 0.5;

	    	if (direction === "left") {
	    		offsetX -= viewWidth + offsetX;
	    	} else if (direction === "right") {
	    		offsetX += viewWidth + offsetX;
	    	}
    		$(button).setTransform('translate('+offsetX+'px,-50%)');

	    	return button;
	   	},

	   	createDownButton: function() {
	   		var button = mrbendel.newDiv('project-button');
	    	var icon = mrbendel.newElement('i', 'fa fa-arrow-down fa-2x');
	    	var icon_clone = icon.cloneNode(false);
	    	$(button).append(icon);
	    	$(button).append(icon_clone);

	    	return button;
	   	},

	   	createProjectDescription: function(htmlData) {
	   		var projectDescription = mrbendel.newDiv('project-description unselectable project-description-initial-state')
	   		var content = mrbendel.newDiv('content');
	   		$(content).append('<h1>Project Title</h1><p>This is a description for a project. It should be relatively short, maybe one to two lines at most. Succinct and to the point.</p><a href="http://localhost:8000" target="_blank" data-hover="link bait"><span>link bait</span></a>');
	   		$(projectDescription).append(content);

	   		var navDow = this.createDownButton();
	   		$(projectDescription).append(navDow);

	   		var self = this;
	   		this.tapToHideGesture = new mrbendel.TapGestureRecognizer(projectDescription);
	   		this.tapToHideGesture.shouldReceiveEvent = function(e) {
	   			var shouldReceiveEvent = true;
	   			if (e.target.nodeName == "A") {
	   				shouldReceiveEvent = false;
	   			}
	   			return shouldReceiveEvent;
	   		}
	        this.tapToHideGesture.callback = function(sender) {
	        	if (sender.state === GestureRecognizerStateRecognized) {
	        		self.toggleProjectDescription();
	        	}
	        };

	    	return projectDescription;
	   	},

	   	toggleProjectDescription: function() {
	   		if (this.projectDescriptionHidden) {
	   			$(this.projectDescription).removeClass('project-description-hidden');
	   		} else {
	   			$(this.projectDescription).addClass('project-description-hidden');
	   		}
	   	  	this.projectDescriptionHidden = !this.projectDescriptionHidden;
	   	}
	});

}(window.mrbendel = window.mrbendel || {}, jQuery));
