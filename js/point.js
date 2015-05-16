(function(mrbendel, $, undefined) {

var Point = function(x,y) {
	this.x = x?x:0;
	this.y = y?y:0;
}

var p = Point.prototype;

p.length = function(point) {
	point = point?point:new Point();
	var xs =0, ys =0;
	xs = point.x - this.x;
	xs = xs * xs;

	ys = point.y - this.y;
	ys = ys * ys;
	return Math.sqrt( xs + ys );
}

p.translate = function(a, b) {
	var x,y;
	if (a === 'number') {
		x = a?a:0;
		y = b?b:0;
	} else {
		x = a.x;
		y = a.y;
	}
	return new Point(this.x + x, this.y + y);
}

p.scale = function(x, y) {
	return new Point(this.x * x, this.y * y);
}

p.copy = function() {
	return new Point(this.x, this.y);
}

p.toString = function() {
	return "[object Point x=" + this.x + ", y=" + this.y + "]";
}

// set the namespace
mrbendel.Point = Point;

}(window.mrbendel = window.mrbendel || {}, jQuery));
