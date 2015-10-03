(function ($) {

	var LadderRoom = this.LadderRoom = this.Room.extend({
		type: 'ladder',
		order: 0x02,
		title: 'Ladder',
		initialize: function () {
			this.$el.addClass('ps-room-light').addClass('scrollable');
			app.on('init:formats', this.update, this);
			this.update();
			app.on('response:laddertop', function (data) {
				var buf = '<div class="ladder pad"><p><button name="selectFormat"><i class="fa fa-chevron-left"></i> Format List</button></p>';
				if (!data) {
					this.$el.html(buf + '<p>error</p></div>');
					return;
				}
				if (this.curFormat !== data[0]) return;
				buf += Tools.sanitizeHTML(data[1]) + '</div>';
				this.$el.html(buf);
			}, this);
		},
		curFormat: '',
		update: function () {
			if (!this.curFormat) {
				var ladderButtons = '';
				if (!window.BattleFormats) {
					this.$el.html('<div class="pad"><em>Loading...</em></div>');
					return;
				}
				var curSection = '';
				for (var i in BattleFormats) {
					var format = BattleFormats[i];
					if (format.section && format.section !== curSection) {
						curSection = format.section;
						ladderButtons += '</ul><h3>' + Tools.escapeHTML(curSection) + '</h3><ul style="list-style:none;margin:0;padding:0">';
					}
					if (!format.searchShow || !format.rated) continue;
					ladderButtons += '<li style="margin:5px"><button name="selectFormat" value="' + i + '" class="button" style="width:320px;height:30px;text-align:left;font:12pt Verdana">' + format.name + '</button></li>';
				}
				this.$el.html('<div class="ladder pad"><p>See a user\'s ranking with <code>/ranking <em>username</em></code></p>' +
					//'<p><strong style="color:red">I\'m really really sorry, but as a warning: we\'re going to reset the ladder again soon to fix some more ladder bugs.</strong></p>' +
					'<p>(btw if you couldn\'t tell the ladder screens aren\'t done yet; they\'ll look nicer than this once I\'m done.)</p><ul>' +
					ladderButtons +
					'</ul></div>');
			} else {
				var format = this.curFormat;
				var self = this;
				this.$el.html('<div class="ladder pad"><p><button name="selectFormat"><i class="fa fa-chevron-left"></i> Format List</button></p><p><em>Loading...</em></p></div>');
				if (app.localLadder) {
					app.send('/cmd laddertop ' + format);
				} else {
					$.get('/ladder.php', {
						format: format,
						server: Config.server.id.split(':')[0],
						output: 'html'
					}, function (data) {
						if (self.curFormat !== format) return;
						var buf = '<div class="ladder pad"><p><button name="selectFormat"><i class="fa fa-chevron-left"></i> Format List</button></p>';
						buf += '<h3>' + Tools.escapeFormat(format) + ' Top 500</h3>';
						buf += data + '</div>';
						self.$el.html(buf);
					}, 'html');
				}
			}
		},
		selectFormat: function (format) {
			this.curFormat = format;
			this.update();
		}
	});

}).call(this, jQuery);
