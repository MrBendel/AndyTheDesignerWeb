// globals
var kNotificationTransitionEnd = "webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend";
var kNotificationClick = "touchstart click";

(function($){

  $.fn.extend({
    setTransform: function(transform) {
      $(this).css({
        '-webkit-transform' : transform,
        '-moz-transform'    : transform,
        '-ms-transform'     : transform,
        '-o-transform'      : transform,
        'transform'         : transform
      });
    }
  });

  $.getStyleForStyleSheet = function(stylesheetName, classOrId, style)  {
        for (var i = document.styleSheets.length - 1; i >= 0; i--) {
            var stylesheet = document.styleSheets[i];
            if (stylesheet.href.indexOf(stylesheetName) >= 0) {
                var rules = stylesheet.rules ? stylesheet.rules : stylesheet.cssRules;
                for (var j = rules.length - 1; j >= 0; j--) {
                    var rule = rules[j];
                    if (rule.selectorText == classOrId) {
                        var cssText = rule.cssText;

                        var regex = "(\\" + style + ")(.*?)(\\;)"
                        var matches = cssText.match(regex);
                        if (matches.length > 0) {
                            var match = matches[0];
                            regex = "([^"+style+"\\:\\s])(.*?)(?=;)"
                            matches = match.match(regex);
                            if (matches.length > 0) {
                                match = matches[0];
                                return match;
                            }
                        }
                    }
                }; 
            } 
        };
    }

})(jQuery);

(function(mrbendel, $, undefined) {

    // constants
    mrbendel.IS_IPAD        = navigator.userAgent.match(/iPad/i) != null;
    mrbendel.IS_IPHONE      = navigator.userAgent.match(/iPhone/i) != null;
    mrbendel.IS_IPOD        = navigator.userAgent.match(/iPod/i) != null;
    mrbendel.IS_ANDROID     = navigator.userAgent.match(/Android/i)  != null;
    mrbendel.IS_TOUCH       = (mrbendel.IS_IPAD || mrbendel.IS_IPHONE || mrbendel.IS_IPOD || mrbendel.IS_ANDROID);

    mrbendel.TOUCH          = (mrbendel.IS_TOUCH) ? 'touchstart' : 'mousedown';
    mrbendel.MOVE           = (mrbendel.IS_TOUCH) ? 'touchmove' : 'mousemove';
    mrbendel.RELEASE        = (mrbendel.IS_TOUCH) ? 'touchend' : 'mouseup mouseleave';

    //Private Property
    var isHot = true;
    var self = mrbendel;

    //Public Property
    mrbendel.ingredient = "Bacon Strips";
    //
    // Public functions
    //

    mrbendel.Class = function(methods) {
        var _class = function() {
            this.initialize.apply(this, arguments);
        };

        for (var property in methods) {
            _class.prototype[property] = methods[property];
        }

        if (!_class.prototype.initialize) _class.prototype.initialize = function() {};
        return _class;
    };

    Math.fmod = function (a,b) { return Number((a - (Math.floor(a / b) * b)).toPrecision(8)); };

    mrbendel.roundToNearest = function(value, nearest) {
        var a = Math.fmod(value, nearest);
        var p = a > nearest * 0.5 ? 1 : 0;
        a = (Math.floor(value / nearest) + p) * nearest;
        return a;
    }

    mrbendel.newElement = function(element, classNames, id) {
        var element = document.createElement(element);
        if (classNames && classNames != "") {
            $(element).addClass(classNames);
        }
        if (id && id != "") {
            $(element).attr("id", id);
        }
        return element;
    };

    mrbendel.newDiv = function(classNames, id) {
        return mrbendel.newElement('div', classNames, id);
    };

    mrbendel.leadByZeros = function(num, places) {
        var zero = places - num.toString().length + 1;
        return Array(+(zero > 0 && zero)).join("0") + num;
    };

    mrbendel.dispatchAsync = function(delay, callback) {
        setTimeout(callback, delay);
    };

    //
    // Private functions
    //

    $(document).ready(function() {
        var jsonpath = "data/data.json";

        var jqxhr = $.getJSON(jsonpath, function(data) {
            $(document).attr('title', data.title);

            $('.top-menu').removeClass('visuallyhidden');
            $('.wrap').removeClass('visuallyhidden');

            var quotebox = data.quotebox;
            buildQuoteBox(quotebox.title, quotebox.text, function(titleDiv, textDiv) {
                $('#main-quote-box').append(titleDiv);
                $('#main-quote-box').append(textDiv);
            })

            self.dispatchAsync(250, function() {
                $('#main-title-bar .title').removeClass('title-initial-state');
            });

            var menu = data.menu;
            for (menuItem of menu) {
                var title = menuItem.title;
                var color = menuItem.color;
                buildMenuItem(title, color, function(li) {
                    $("#menu-bar-ordered-list").append(li);
                });
            }

            var imagepath = data['imagepath'];
            var portfolio = data.portfolio;
            var time = 250;
            var groupCount = 0, projectCount = 0;
            var introAnimationComplete = false;

            for (group of portfolio) {
                ++groupCount;
                projectCount = 0;

                var title = group.title;
                var projects = group.projects;

                buildProjectTitleTage(title, function(tag) {
                	var pre_br = self.newDiv('clear start');
                	var post_br = self.newDiv('clear end');

                    $("#gallery").append(pre_br);
                    $("#gallery").append(tag);
                    $("#gallery").append(post_br);
                });

                for (project of projects) {
                    ++projectCount;

                    var w_project = project;
                    var src = project.src;
                    var title = project.title;
                    var text = project.text;

                    buildBox(imagepath + src, src.split('.')[0], title, text, function(box) {
                        if (box) {
                            $("#gallery").append(box.contents);
                            $(box.contents).addClass('box-initial-state');
                            $(box.contents).addClass('box-initial-state-active');

                            time += 50;
                            self.dispatchAsync(time, function() {
                                var t = text;
                                $(box.contents).removeClass('box-initial-state');
                                var eventTriggered = false;
                                $(box.contents).one(kNotificationTransitionEnd, function(e) {
                                    if (!eventTriggered) {
                                        eventTriggered = true;
                                        $(this).removeClass('box-initial-state-active');
                                        if (!introAnimationComplete && 
                                            groupCount == portfolio.length &&
                                            projectCount == projects.length) {
                                            introAnimationComplete = true;
                                            self.dispatchAsync(100, function() {
                                                // $('.quote-box').css('height', '300px');
                                                $('.box').addClass('box-rollover');
                                            });
                                        }
                                    }
                                });
                            });

                            // last create the project
                            var project = new mrbendel.Project(w_project, box);
                        }
                    });
                }
            }
        }).fail(function(e) {
            console.log("error loading json: " + jsonpath);
            console.log(e);
        })
    });
    
    function buildQuoteBox(title, text, complete) {
        var h1 = self.newElement('h1');

        if (!mrbendel.IS_TOUCH) {
            var buildStr = "";
            var character = "";
            var isCharRun = false;
            for (var i = 0, len = title.length; i < len; i++) {
                character = title[i];
                if (character == "&") {
                    isCharRun = true;
                } else if (character == ";" && isCharRun) {
                    isCharRun = false;
                }
                buildStr += character;
                if (!isCharRun) {
                    var div = self.newElement('div');
                    $(div).append(buildStr);
                    $(h1).append(div);
                    buildStr = "";
                }
            }
        } else {
            $(h1).html(title);
        }
        

        var container = self.newDiv('flex-container');
        var spacerLeft = self.newDiv('flex-spacer');
        $(spacerLeft).html('&nbsp;');
        var spacerRight = spacerLeft.cloneNode(true);
        var p = self.newElement('p');
        $(p).html(text);

        $(container).append(spacerLeft);
        $(container).append(p);
        $(container).append(spacerRight);

        complete(h1, container);
    }

    function buildMenuItem(title, color, complete) {
        var li = self.newElement('li');
        if (!title) {
            $(li).addClass('spacer');
            $(li).css('border-bottom-color', color);
            $(li).html("&nbsp;")
        } else {
            $(li).addClass('transition-all-cubic-ease-out');
            var divFront = self.newDiv('title-front');
            var divTop = self.newDiv('title-top');
            $(divFront).css('border-bottom-color', color);
            $(divTop).css('border-bottom-color', color);

            $(divFront).html(title);
            $(divTop).html(title);

            $(li).append(divTop);
            $(li).append(divFront);
        }
        complete(li);
    }

    function buildProjectTitleTage(title, complete) {
        var tag = self.newDiv("project-tag stt");
        var h1 = self.newElement('h1');
        $(h1).html(title);
        $(tag).append(h1);
        complete(tag);
    }

    function buildBox(src, id, title, text, complete) {
        var box = self.newDiv("box", "box-" + id);
        var boxFrontFace = self.newDiv("box-front-face", "boxFrontFace-" + id);
        var boxBackFace = self.newDiv("box-back-face", "boxFrontFace-" + id);

        var img = new Image();
        $(img).attr('src', src);
        $(img).addClass("unselectable");

        $(box).append(boxFrontFace);
        $(box).append(boxBackFace);
        $(boxFrontFace).append(img);
        $(boxBackFace).append(img.cloneNode(true));

        // title
        var h1 = self.newElement("h1");
        $(h1).append(title);
        $(boxBackFace).append(h1);

        // text
        var p = self.newElement("p");
        $(p).append(text);
        $(boxBackFace).append(p);

        var object = {
            'contents': box,
            'box': box,
            'boxFrontFace': boxFrontFace,
            'boxBackFace': boxBackFace,
            'img': img
        };

        complete(object);
    }

}(window.mrbendel = window.mrbendel || {}, jQuery));