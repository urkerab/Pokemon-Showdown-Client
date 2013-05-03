(function($) {

	var MainMenuRoom = this.MainMenuRoom = this.Room.extend({
		tinyWidth: 340,
		bestWidth: 628,
		events: {
			'keydown textarea': 'keyPress',
			'click .username': 'clickUsername',
			'click .closebutton': 'closePM',
			'click .pm-window': 'clickPMBackground',
			'focus textarea': 'onFocusPM',
			'blur textarea': 'onBlurPM'
		},
		initialize: function() {
			var buf = '<div class="mainmenuwrapper">';

			// left menu 2 (high-res: right, low-res: top)
			buf += '<div class="leftmenu"><div class="activitymenu"><div class="pmbox"></div></div>';

			// left menu 1 (high-res: left, low-res: bottom)
			buf += '<div class="mainmenu"><div class="menugroup"><p><button class="button big" name="search"><strong>Look for a battle</strong></button></p></div>';
			buf += '<div class="menugroup"><p><button class="button" name="joinRoom" value="teambuilder">Teambuilder</button></p><p><button class="button" name="joinRoom" value="ladder">Ladder</button></p></div></div></div>';

			// right menu
			buf += '<div class="rightmenu"><div class="menugroup"><p><button class="button" name="joinRoom" value="lobby">Join lobby chat</button></p></div></div>';

			// footer
			buf += '<div class="mainmenufooter"><small><a href="//pokemonshowdown.com/" target="_blank">Website</a> | <a href="//pokemonshowdown.com/replay/" target="_blank">Replays</a> | <a href="//pokemonshowdown.com/rules" target="_blank">Rules</a></small></div>';

			buf += '</div>';
			this.$el.html(buf);

			this.$activityMenu = this.$('.activitymenu');
			this.$pmBox = this.$activityMenu.find('.pmbox');

			app.on('init:formats', this.updateSearch, this);
			this.updateSearch();
		},
		addPM: function(name, message, target) {
			var oName = name;
			if (toId(name) === app.user.get('userid')) {
				oName = target;
			}

			var $pmWindow = this.openPM(oName, true);

			var $chatFrame = $pmWindow.find('.pm-log');
			var $chat = $pmWindow.find('.inner');
			if ($chatFrame.scrollTop() + 60 >= $chat.height() - $chatFrame.height()) {
				autoscroll = true;
			}

			var timestamp = ChatRoom.getTimestamp('pms');
			var color = hashColor(toId(name));
			var clickableName = '<span class="username" data-name="' + Tools.escapeHTML(name) + '">' + Tools.escapeHTML(name.substr(1)) + '</span>';
			if (name.substr(0, 1) !== ' ') clickableName = '<small>' + Tools.escapeHTML(name.substr(0, 1)) + '</small>'+clickableName;
			$chat.append('<div class="chat">' + timestamp + '<strong style="' + color + '">' + clickableName + ':</strong> <em' + (target === oName ? ' class="mine"' : '') + '>' + messageSanitize(message) + '</em></div>');

			if (autoscroll) {
				$chatFrame.scrollTop($chat.height());
			}
		},
		openPM: function(name, dontFocus) {
			var userid = toId(name);
			var $pmWindow = this.$pmBox.find('.pm-window-'+userid);
			if (!$pmWindow.length) {
				group = name.charAt(0);
				if (group === ' ') {
					group = '';
				} else {
					group = '<small>'+Tools.escapeHTML(group)+'</small>';
				}
				var buf = '<div class="pm-window pm-window-'+userid+'" data-userid="'+userid+'"><h3><button class="closebutton" href="'+app.root+'teambuilder" tabindex="-1"><i class="icon-remove-sign"></i></button>'+group+Tools.escapeHTML(name.substr(1))+'</h3><div class="pm-log"><div class="inner"></div></div>';
				buf += '<div class="pm-log-add"><form class="chatbox nolabel"><textarea class="textbox" type="text" size="70" autocomplete="off" name="message"></textarea></form></div></div>';
				$pmWindow = $(buf).prependTo(this.$pmBox);
				$pmWindow.find('textarea').autoResize({
					animate: false,
					extraSpace: 0
				});
			} else {
				$pmWindow.show();
				if (!dontFocus) {
					var $chatFrame = $pmWindow.find('.pm-log');
					var $chat = $pmWindow.find('.inner');
					$chatFrame.scrollTop($chat.height());
				}
			}
			if (!dontFocus) this.$el.scrollTop(0);
			return $pmWindow;
		},
		closePM: function(e) {
			var userid;
			if (e.currentTarget) {
				e.preventDefault();
				e.stopPropagation();
				userid = $(e.currentTarget).closest('.pm-window').data('userid');
			} else {
				userid = toId(e);
			}
			$pmWindow = this.$pmBox.find('.pm-window-'+userid)
			$pmWindow.hide();

			var $next = $pmWindow.next();
			while ($next.length && $next.css('display') === 'none') {
				$next = $next.next();
			}
			if ($next.length) {
				$next.find('textarea[name=message]').focus();
				return;
			}

			$next = $pmWindow.prev();
			while ($next.length && $next.css('display') === 'none') {
				$next = $next.prev();
			}
			if ($next.length) {
				$next.find('textarea[name=message]').focus();
				return;
			}

			if (app.curSideRoom) app.curSideRoom.focus();
		},
		focusPM: function(name) {
			this.openPM(name).prependTo(this.$pmBox).find('textarea[name=message]').focus();
		},
		onFocusPM: function(e) {
			$(e.currentTarget).closest('.pm-window').addClass('focused');
		},
		onBlurPM: function(e) {
			$(e.currentTarget).closest('.pm-window').removeClass('focused');
		},
		keyPress: function(e) {
			if (e.keyCode === 13 && !e.shiftKey) { // Enter
				var $target = $(e.currentTarget);
				e.preventDefault();
				e.stopPropagation();
				var text;
				if ((text = $target.val())) {
					// this.tabComplete.reset();
					// this.chatHistory.push(text);
					var userid = $target.closest('.pm-window').data('userid');
					text = ('\n'+text).replace(/\n/g, '\n/pm '+userid+', ').substr(1);
					this.send(text);
					$(e.currentTarget).val('');
				}
			} else if (e.keyCode === 27) { // Esc
				this.closePM(e);
			}
		},
		clickUsername: function(e) {
			e.stopPropagation();
			var name = $(e.currentTarget).data('name');
			app.addPopup('user', UserPopup, {name: name, sourceEl: e.currentTarget});
		},
		clickPMBackground: function(e) {
			if (!e.shiftKey && !e.cmdKey && !e.ctrlKey) {
				if (window.getSelection && !window.getSelection().isCollapsed) {
					return;
				}
				app.dismissPopups();
				$(e.currentTarget).find('textarea[name=message]').focus();
				e.stopPropagation();
			}
		},
		updateSearch: function() {
			if (window.BattleFormats) {
				this.$('.mainmenu button.big').html('<strong>Look for a battle</strong>').removeClass('disabled');
			} else {
				this.$('.mainmenu button.big').html('<em>Connecting...</em>').addClass('disabled');
			}
		},
		updateRightMenu: function() {
			if (app.sideRoom) {
				this.$('.rightmenu').hide();
			} else {
				this.$('.rightmenu').show();
			}
		},

		// buttons
		search: function() {
			alert('we don\'t support battles yet :(');
		},
		joinRoom: function(room) {
				app.joinRoom(room);
		}
	});

}).call(this, jQuery);
