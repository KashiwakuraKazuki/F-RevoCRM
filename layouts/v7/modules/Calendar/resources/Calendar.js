/*+***********************************************************************************
 * The contents of this file are subject to the vtiger CRM Public License Version 1.0
 * ("License"); You may not use this file except in compliance with the License
 * The Original Code is: vtiger CRM Open Source
 * The Initial Developer of the Original Code is vtiger.
 * Portions created by vtiger are Copyright (C) vtiger.
 * All Rights Reserved.
 *************************************************************************************/

Vtiger.Class("Calendar_Calendar_Js", {
	calendarViewContainer: false,
	feedsWidgetPostLoadEvent: 'Calendar.Viewtypes.PostLoad.Event',
	disabledFeedsStorageKey: 'calendar.feeds.disabled',
	calendarInstance: false,
	numberOfDaysInAgendaView: 7,
	userPreferenceCache: [],
	sideBarEssentialsState: '',
	getInstance: function () {
		if (!Calendar_Calendar_Js.calendarInstance) {
			if (app.view() == 'SharedCalendar') {
				Calendar_Calendar_Js.calendarInstance = new Calendar_SharedCalendar_Js();
			} else {
				Calendar_Calendar_Js.calendarInstance = new Calendar_Calendar_Js();
			}
		}
		return Calendar_Calendar_Js.calendarInstance;
	},
	showCreateEventModal: function () {
		var instance = Calendar_Calendar_Js.getInstance();
		instance.showCreateEventModal();
	},
	showCreateEventModalforDrag: function () {
		var instance = Calendar_Calendar_Js.getInstance();
		instance.showCreateEventModalforDrag();
	},
	showCreateTaskModal: function () {
		var instance = Calendar_Calendar_Js.getInstance();
		instance.showCreateTaskModal();
	},
	showCalendarSettings: function () {
		var instance = Calendar_Calendar_Js.getInstance();
		instance.showCalendarSettings();
	},
	deleteCalendarEvent: function (eventId, sourceModule, isRecurring) {
		var instance = Calendar_Calendar_Js.getInstance();
		instance.deleteCalendarEvent(eventId, sourceModule, isRecurring);
	},
	editCalendarEvent: function (eventId, isRecurring) {
		var instance = Calendar_Calendar_Js.getInstance();
		instance.editCalendarEvent(eventId, isRecurring);
	},
	copyCalendarEvent: function (eventId, isRecurring) {
		var instance = Calendar_Calendar_Js.getInstance();
		instance.copyCalendarEvent(eventId, isRecurring, true);
	},
	editCalendarTask: function (taskId) {
		var instance = Calendar_Calendar_Js.getInstance();
		instance.editCalendarTask(taskId);
	},
	markAsHeld: function (recordId,sourceModule) {
		var instance = Calendar_Calendar_Js.getInstance();
		instance.markAsHeld(recordId,sourceModule);
	},
	holdFollowUp: function (eventId) {
		var instance = Calendar_Calendar_Js.getInstance();
		instance.holdFollowUp(eventId);
	},
	changeAllDay : function() {
		if(jQuery("#alldayEvent").is(":checked")) {
			$("#Events_editView_fieldName_time_start").parent().hide();
			$("#Events_editView_fieldName_time_end").parent().hide();
			$(".modelContainer #Calendar_editView_fieldName_time_start").parent().hide();
			$(".modelContainer #Calendar_editView_fieldName_time_end").parent().hide();
		} else {
			$("#Events_editView_fieldName_time_start").parent().show();
			$("#Events_editView_fieldName_time_end").parent().show();
			$(".modelContainer #Calendar_editView_fieldName_time_start").parent().show();
			$(".modelContainer #Calendar_editView_fieldName_time_end").parent().show();
		}
		jQuery("#alldayEvent").attr('data-validation-engine','change');
	}

}, {
	init: function () {
		this.addComponents();
	},
	addComponents: function () {
		this.addIndexComponent();
	},
	addIndexComponent: function () {
		this.addModuleSpecificComponent('Index', 'Vtiger', app.getParentModuleName());
	},
	registerCreateFollowUpEvent: function (modalContainer) {
		var thisInstance = this;
		var params = {
			submitHandler: function (form) {
				form = jQuery(form);
				form.find('[type="submit"]').attr('disabled', 'disabled');
				var formData = form.serializeFormData();
				app.helper.showProgress();
				app.request.post({'data': formData}).then(function (err, res) {
					app.helper.hideProgress();
					app.helper.hideModal();
					if (!err && res['created']) {
						jQuery('.vt-notification').remove();
						thisInstance.updateListView();
						thisInstance.updateCalendarView("Event");
					} else {
						app.event.trigger('post.save.failed', err);
					}
				});
			}
		};
		modalContainer.find('form#followupQuickCreate').vtValidate(params);
	},
	holdFollowUp: function (eventId) {
		var thisInstance = this;
		var requestParams = {
			'module': 'Calendar',
			'view': 'QuickCreateFollowupAjax',
			'record': eventId
		};
		app.helper.showProgress();
		app.request.get({'data': requestParams}).then(function (err, resp) {
			app.helper.hideProgress();
			if (!err && resp) {
				app.helper.showModal(resp, {
					'cb': function (modalContainer) {
						thisInstance.registerCreateFollowUpEvent(modalContainer);
					}
				});
			}
		});
	},
	updateListView: function () {
		if (app.view() === 'List') {
			var listInstance = Vtiger_List_Js.getInstance();
			listInstance.loadListViewRecords();
		}
	},
	updateCalendarView: function (activitytype) {
		if (app.view() === 'Calendar' || app.view() === 'SharedCalendar') {
			if (activitytype === 'Event') {
				this.updateAllEventsOnCalendar();
			} else {
				this.updateAllTasksOnCalendar();
			}
		}
	},
	markAsHeld: function (recordId,sourceModule) {
		var thisInstance = this;
		app.helper.showConfirmationBox({
			message: app.vtranslate('JS_CONFIRM_MARK_AS_HELD')
		}).then(function () {
			var requestParams = {
				module: "Calendar",
				action: "SaveFollowupAjax",
				mode: "markAsHeldCompleted",
				record: recordId,
				sourceModule:sourceModule
			};

			app.request.post({'data': requestParams}).then(function (e, res) {
				jQuery('.vt-notification').remove();
				if (e) {
					app.event.trigger('post.save.failed', e);
				} else if (res && res['valid'] === true && res['markedascompleted'] === true) {
					thisInstance.updateListView();
					thisInstance.updateCalendarView(res.activitytype);
				} else {
					app.helper.showAlertNotification({
						'message': app.vtranslate('JS_FUTURE_EVENT_CANNOT_BE_MARKED_AS_HELD')
					});
				}
			});
		});
	},
	registerCalendarSharingTypeChangeEvent: function (modalContainer) {
		var selectedUsersContainer = app.helper.getSelect2FromSelect(
				jQuery('#selectedUsers', modalContainer)
				);
		jQuery('[name="sharedtype"]').on('change', function () {
			var sharingType = jQuery(this).data('sharingtype');

			if (sharingType === 'selectedusers') {
				selectedUsersContainer.show();
				selectedUsersContainer.attr('style', 'display:block;width:90%;');
			} else {
				selectedUsersContainer.hide();
			}
		});
		jQuery('[name="sharedtype"]:checked').trigger('change');
	},
	registerHourFormatChangeEvent: function (modalContainer) {
		var hourFormatConditionMapping = jQuery('input[name="timeFormatOptions"]', modalContainer).data('value');
		var form = modalContainer.find('form');
		form.find('input[name="hour_format"]').on('click', function () {
			var hourFormatVal = jQuery(this).val();
			var startHourElement = jQuery('select[name="start_hour"]', form);
			var conditionSelected = startHourElement.val();
			var list = hourFormatConditionMapping['hour_format'][hourFormatVal]['start_hour'];
			var options = '';
			for (var key in list) {
				if (list.hasOwnProperty(key)) {
					var conditionValue = list[key];
					options += '<option value="' + key + '"';
					if (key === conditionSelected) {
						options += ' selected="selected" ';
					}
					options += '>' + conditionValue + '</option>';
				}
			}
			startHourElement.html(options).trigger("change");
		});
	},
	registerCalendarSettingsShownEvents: function (modalContainer) {
		this.registerCalendarSharingTypeChangeEvent(modalContainer);
		this.registerHourFormatChangeEvent(modalContainer);
		app.helper.showVerticalScroll(jQuery('.modal-body'), {setHeight: '400px'});
		vtUtils.enableTooltips();
		modalContainer.find('button[name="saveButton"]').on('click', function () {
			jQuery(this).attr('disabled', 'disabled');
			modalContainer.find('form').find('[name="sourceView"]').val(app.view());
			modalContainer.find('form').submit();
		});
	},
	showCalendarSettings: function () {
		var thisInstance = this;
		var params = {
			'module': app.getModuleName(),
			'view': 'Calendar',
			'mode': 'Settings'
		};
		app.helper.showProgress();
		app.request.post({'data': params}).then(function (e, data) {
			app.helper.hideProgress();
			if (!e) {
				app.helper.showModal(data, {
					'cb': function (modalContainer) {
						thisInstance.registerCalendarSettingsShownEvents(modalContainer);
					}
				});
			} else {
				console.log("network error : ", e);
			}
		});
	},
	getDisabledFeeds: function () {
		return app.storage.get(Calendar_Calendar_Js.disabledFeedsStorageKey, []);
	},
	disableFeed: function (sourceKey) {
		var disabledFeeds = this.getDisabledFeeds();
		if (disabledFeeds.indexOf(sourceKey) === -1) {
			disabledFeeds.push(sourceKey);
			app.storage.set(Calendar_Calendar_Js.disabledFeedsStorageKey, disabledFeeds);
		}
	},
	enableFeed: function (sourceKey) {
		var disabledFeeds = this.getDisabledFeeds();
		if (disabledFeeds.indexOf(sourceKey) !== -1) {
			disabledFeeds = jQuery.grep(disabledFeeds, function (value) {
				return value !== sourceKey;
			});
			app.storage.set(Calendar_Calendar_Js.disabledFeedsStorageKey, disabledFeeds);
		}
	},
	getFeedRequestParams: function (start, end, feedCheckbox) {
		var dateFormat = 'YYYY-MM-DD';
		var startDate = start.format(dateFormat);
		var endDate = end.format(dateFormat);
		return {
			'start': startDate,
			'end': endDate,
			'type': feedCheckbox.data('calendarFeed'),
			'fieldname': feedCheckbox.data('calendarFieldname'),
			'color': feedCheckbox.data('calendarFeedColor'),
			'textColor': feedCheckbox.data('calendarFeedTextcolor'),
			'conditions': feedCheckbox.data('calendarFeedConditions'),
			'is_own': feedCheckbox.data('calendarIs_own')
		};
	},
	renderEvents: function () {
		var thisInstance = this;
		this.getCalendarViewContainer().fullCalendar('addEventSource',
				function (start, end, timezone, render) {
					thisInstance.getCalendarViewContainer().fullCalendar('removeEvents');
					var activeFeeds = jQuery('input[data-calendar-feed]:checked');
					var activeFeedsRequestParams = {};
					activeFeeds.each(function () {
						var feedCheckbox = jQuery(this);
						var feedRequestParams = thisInstance.getFeedRequestParams(start, end, feedCheckbox);
						activeFeedsRequestParams[feedCheckbox.data('calendarSourcekey')] = feedRequestParams;
					});

					var requestParams = {
						'module': app.getModuleName(),
						'action': 'Feed',
						'mode': 'batch',
						'feedsRequest': activeFeedsRequestParams
					};
					var events = [];
					app.helper.showProgress();
					activeFeeds.attr('disabled', 'disabled');
					app.request.post({'data': requestParams}).then(function (e, data) {
						if (!e) {
							data = JSON.parse(data);
							for (var feedType in data) {
								var feed = JSON.parse(data[feedType]);
								feed.forEach(function (entry) {
									events.push(entry);
								});
							}
						} else {
							console.log("error in response : ", e);
						}
						render(events);
						activeFeeds.removeAttr('disabled');
						app.helper.hideProgress();
					});
				});
	},
	assignFeedTextColor: function (feedCheckbox) {
		var color = feedCheckbox.data('calendarFeedColor');
		var contrast = app.helper.getColorContrast(color);
		var textColor = (contrast === 'dark') ? 'white' : 'black';
		feedCheckbox.data('calendarFeedTextcolor', textColor);
		feedCheckbox.closest('.calendar-feed-indicator').css({'color': textColor});
	},
	colorizeFeed: function (feedCheckbox) {
		this.assignFeedTextColor(feedCheckbox);
	},
	restoreFeedsState: function (widgetContainer) {
		var thisInstance = this;
		var disabledFeeds = this.getDisabledFeeds();
		var feedsList = widgetContainer.find('#calendarview-feeds > ul.feedslist');
		var calendarfeeds = feedsList.find('[data-calendar-feed]');
		var checkedCount = 0;
		calendarfeeds.each(function () {
			var feedCheckbox = jQuery(this);
			var sourceKey = feedCheckbox.data('calendarSourcekey');
			if (disabledFeeds.indexOf(sourceKey) === -1) {
				feedCheckbox.attr('checked', true);
				checkedCount++;
			}
			thisInstance.colorizeFeed(feedCheckbox);
		});
		
		// 全選択チェックボックスを選択する（現時点では共有カレンダーにのみ実装）
		var feedCheckbox = jQuery('#calendarview-feeds-all .toggleCalendarFeed');
		if (feedCheckbox.length > 0 && calendarfeeds.length == checkedCount) {
			feedCheckbox.attr('checked', true);
		}
	},
	fetchEvents: function (feedCheckbox) {
		var thisInstance = this;
		var aDeferred = jQuery.Deferred();
		var view = thisInstance.getCalendarViewContainer().fullCalendar('getView');

		var feedRequestParams = thisInstance.getFeedRequestParams(view.start, view.end, feedCheckbox);
		feedRequestParams.module = app.getModuleName();
		feedRequestParams.action = 'Feed';

		var events = [];
		app.request.post({'data': feedRequestParams}).then(function (e, data) {
			if (!e) {
				events = JSON.parse(data);
				aDeferred.resolve(events);
			} else {
				aDeferred.reject(e);
			}
		});
		return aDeferred.promise();
	},
	addEvents: function (feedCheckbox) {
		var thisInstance = this;
		if (feedCheckbox.is(':checked')) {
			app.helper.showProgress();
			feedCheckbox.attr('disabled', 'disabled');
			thisInstance.fetchEvents(feedCheckbox).then(function (events) {
				thisInstance.getCalendarViewContainer().fullCalendar('addEventSource', events);
				feedCheckbox.removeAttr('disabled');
				app.helper.hideProgress();
			}, function (e) {
				console.log("error while fetching events : ", feedCheckbox, e);
			});
		}
	},
	removeEvents: function (feedCheckbox) {
		var module = feedCheckbox.data('calendarFeed');
		var conditions = feedCheckbox.data('calendarFeedConditions');
		var fieldName = feedCheckbox.data('calendarFieldname');
		this.getCalendarViewContainer().fullCalendar('removeEvents',
				function (eventObj) {
					return module === eventObj.module && eventObj.conditions === conditions && fieldName === eventObj.fieldName;
				});
	},
	getCheckedCheckboxCounts: function () {
		var checkedCount = 0;
		var $area = jQuery("#calendarview-feeds .feedslist");
		$area.children().each(function(){
			var currentTarget = jQuery(this).find("input");
			var sourceKey = currentTarget.data('calendarSourcekey');
			if (sourceKey !== undefined && currentTarget.is(':checked')) {
				checkedCount++;
			}
		})
		return {
			checkboxCount: $area.children().length,
			checkedCount: checkedCount
		}
	},
	registerFeedChangeEvent: function () {
		var thisInstance = this;
		jQuery('#calendarview-feeds').on('change',
				'input[type="checkbox"].toggleCalendarFeed',
				function () {
					var curentTarget = jQuery(this);
					var sourceKey = curentTarget.data('calendarSourcekey');
					var curentTargetIsChecked = curentTarget.is(':checked');
					if (curentTargetIsChecked) {
						thisInstance.enableFeed(sourceKey);
						thisInstance.addEvents(curentTarget);
					} else {
						thisInstance.disableFeed(sourceKey);
						thisInstance.removeEvents(curentTarget);
					}

					// 共有カレンダーの場合はToDoを連動させる
					// toggleTodoFeed(bootstrap-switch)がYesの場合
					if (jQuery('input[type="checkbox"].toggleTodoFeed').bootstrapSwitch('state')) {
						var parent = curentTarget.closest('.calendar-feed-indicator');
						var sharedTodoInput = parent.find('input.toggleSharedTodo');
						if (sharedTodoInput.length > 0) {
							var sharedTodosourceKey = sharedTodoInput.data('calendarSourcekey');
							if (curentTargetIsChecked) {
								sharedTodoInput.attr('checked','checked');
								thisInstance.enableFeed(sharedTodosourceKey);
								thisInstance.addEvents(sharedTodoInput);
							} else {
								sharedTodoInput.removeAttr('checked');
								thisInstance.disableFeed(sharedTodosourceKey);
								thisInstance.removeEvents(sharedTodoInput);
							}
						}
					}

					// 全選択チェックボックスを選択・解除する
					var feedCheckbox = jQuery('#calendarview-feeds-all .toggleCalendarFeed');
					var params = thisInstance.getCheckedCheckboxCounts();
					if (feedCheckbox.length > 0) {
						if (params.checkboxCount > params.checkedCount) {
							feedCheckbox.removeAttr('checked');
						}else if (params.checkboxCount == params.checkedCount) {
							feedCheckbox.attr('checked','checked');
						}
					}
				});

		// TODOチェックボックス
		jQuery('input[type="checkbox"].toggleTodoFeed').on('switchChange.bootstrapSwitch', function (e) {
			var todoCheckbox = jQuery(this).bootstrapSwitch('state');
			var $area = jQuery("#calendarview-feeds .feedslist");

			$area.children().each(function(){
				var eventsTarget = jQuery(this).find('input[type="checkbox"].toggleCalendarFeed:not(.toggleSharedTodo)');
				var todoTarget = jQuery(this).find('input[type="checkbox"].toggleCalendarFeed.toggleSharedTodo');
				var sourceKey = todoTarget.data('calendarSourcekey');
	
				if (sourceKey !== undefined) {
					if (todoCheckbox && eventsTarget.is(':checked') && !todoTarget.is(':checked')) {
						todoTarget.attr('checked','checked');
						thisInstance.enableFeed(sourceKey);
						thisInstance.addEvents(todoTarget);
					} else if (!todoCheckbox && todoTarget.is(':checked')) {
						todoTarget.removeAttr('checked');
						thisInstance.disableFeed(sourceKey);
						thisInstance.removeEvents(todoTarget);
					}
				}
			})
		});

		// 全選択チェックボックス（現時点では共有カレンダーにのみ実装）
		jQuery('#calendarview-feeds-all').on('change',
				'input[type="checkbox"].toggleCalendarFeed',
				function () {
					var feedCheckbox = jQuery(this);
					var todoCheckbox = jQuery('input[type="checkbox"].toggleTodoFeed').bootstrapSwitch('state');
					var $area = jQuery("#calendarview-feeds .feedslist");

					$area.children().each(function(){
						var eventsTarget = jQuery(this).find('input[type="checkbox"].toggleCalendarFeed:not(.toggleSharedTodo)');
						var todoTarget = jQuery(this).find('input[type="checkbox"].toggleCalendarFeed.toggleSharedTodo');
						var sourceKey = eventsTarget.data('calendarSourcekey');
			
						if (sourceKey !== undefined) {
							if (feedCheckbox.is(':checked') && !eventsTarget.is(':checked')) {
								eventsTarget.attr('checked','checked');
								thisInstance.enableFeed(sourceKey);
								thisInstance.addEvents(eventsTarget);
								if (todoCheckbox && !todoTarget.is(':checked')) {
									todoTarget.attr('checked','checked');
									thisInstance.enableFeed(sourceKey);
									thisInstance.addEvents(todoTarget);
								}
							} else if (!feedCheckbox.is(':checked') && eventsTarget.is(':checked')) {
								eventsTarget.removeAttr('checked');
								thisInstance.disableFeed(sourceKey);
								thisInstance.removeEvents(eventsTarget);
								if (todoTarget.is(':checked')) {
									todoTarget.removeAttr('checked');
									thisInstance.disableFeed(sourceKey);
									thisInstance.removeEvents(todoTarget);
								}
							}
						}
					})
				});
	},
	updateRangeFields: function (container, options) {
		var moduleName = container.find('select[name="modulesList"]').val();
		var fieldSelectElement = container.find('select[name="fieldsList"]');

		var sourceFieldSelect = container.find('select[name="sourceFieldsList"]');
		var targetFieldSelect = container.find('select[name="targetFieldsList"]');
		fieldSelectElement.removeAttr('disabled');

		var optionsCount = fieldSelectElement.find('option').not('option[value="birthday"]');

		if (moduleName === 'Events' || moduleName === 'Calendar') {
			optionsCount = fieldSelectElement.find('option').not('option[value="date_start,due_date"]');
		}

		if (optionsCount.length > 1) {
			container.find('[name="rangeFields"]').removeAttr('disabled').trigger('change');
		} else {
			container.find('[name="rangeFields"]').attr('disabled', true).attr('checked', false).trigger('change');
		}

		var selectedValue = fieldSelectElement.find('option:selected').val();
		sourceFieldSelect.select2('destroy').html(options).select2();
		targetFieldSelect.select2('destroy').html(options).select2();

		if (moduleName === 'Events' || moduleName === 'Calendar') {
			sourceFieldSelect.find('option[value="date_start,due_date"]').remove();
			targetFieldSelect.find('option[value="date_start,due_date"]').remove();
		}
		sourceFieldSelect.find('option[value="birthday"]').remove();
		targetFieldSelect.find('option[value="birthday"]').remove();
		if (selectedValue === 'birthday') {
			selectedValue = fieldSelectElement.find('option:selected').next().val();
		}
		var otherOption = targetFieldSelect.find('option').not('option[value="' + selectedValue + '"]');
		sourceFieldSelect.select2('val', selectedValue);
		if (otherOption.length > 0) {
			targetFieldSelect.select2('val', otherOption.val());
		} else {
			targetFieldSelect.select2('destroy').html('').select2();
		}
	},
	updateDateFields: function (container) {
		var fieldMeta = container.find('[name="moduleDateFields"]').data('value');
		var moduleSelectElement = container.find('select[name="modulesList"]');
		var moduleName = moduleSelectElement.val();

		var fieldSelectElement = container.find('select[name="fieldsList"]');

		var options = '';
		for (var key in fieldMeta) {
			if (fieldMeta.hasOwnProperty(key) && key === moduleName) {
				var moduleSpecificFields = fieldMeta[key];
				for (var fieldName in moduleSpecificFields) {
					if (moduleSpecificFields.hasOwnProperty(fieldName)) {
						options += '<option value="' + fieldName + '" data-viewfieldname="' + fieldName + '">' +
								moduleSpecificFields[fieldName] + '</option>';
					}
				}
			}
		}
		if (options === '')
			options = '<option value="">NONE</option>';

		fieldSelectElement.select2('destroy').html(options).select2().trigger('change');

		var editorMode = container.find('.editorMode').val();
		if (editorMode === 'create') {
			this.updateRangeFields(container, options);
		}
	},
	initializeColorPicker: function (element, customParams, onChangeFunc) {
		var params = {
			flat: true,
			onChange: onChangeFunc
		};
		if (typeof customParams !== 'undefined') {
			params = jQuery.extend(params, customParams);
		}
		element.ColorPicker(params);
	},
	getRandomColor: function () {
		return '#' + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6);
	},
	registerDateFieldChangeEvent: function (modalContainer) {
		var thisInstance = this;
		var parentElement = jQuery('#calendarview-feeds');
		var fieldsSelect = modalContainer.find('[name="fieldsList"]');

		fieldsSelect.on('change', function () {
			var moduleName = modalContainer.find('[name="modulesList"]').find('option:selected').val();
			var selectedOption = jQuery(this).find('option:selected');
			var fieldName = selectedOption.val();
			var currentColor = thisInstance.getRandomColor();

			var calendarSourceKey = moduleName + '_' + fieldName;
			if (moduleName === 'Events') {
				var conditions = modalContainer.find('#calendarviewconditions').val();
				conditions = thisInstance._getParsedConditions(conditions);
				if (conditions.hasOwnProperty('value')) {
					calendarSourceKey += '_' + conditions.value;
				}
			}

			var feedCheckbox = jQuery('[data-calendar-sourcekey="' + calendarSourceKey + '"]', parentElement);
			if (feedCheckbox.length) {
				currentColor = feedCheckbox.data('calendarFeedColor');
			}
			modalContainer.find('.selectedColor').val(currentColor);
			modalContainer.find('.calendarColorPicker').ColorPickerSetColor(currentColor);
		});
		modalContainer.find('#calendarviewconditions').on('change', function () {
			fieldsSelect.trigger('change');
		});
	},
	_getParsedConditions: function (conditions) {
		var parsedConditions = {};
		if (conditions !== '') {
			parsedConditions = JSON.parse(conditions);
			if (typeof parsedConditions !== 'object') {
				parsedConditions = JSON.parse(parsedConditions);
			}
		}
		return parsedConditions;
	},
	saveFeedSettings: function (modalContainer, feedIndicator) {
		var thisInstance = this;
		var modulesList = modalContainer.find('select[name="modulesList"]');
		var moduleName = modulesList.val();
		var fieldName = modalContainer.find('select[name="fieldsList"]').val();
		var selectedColor = modalContainer.find('input.selectedColor').val();
		var isOwn = modalContainer.find('input[name="is_own"]').is(':checked') ? 1 : 0;
		var conditions = '';
		if (moduleName === 'Events') {
			conditions = modalContainer.find('[name="conditions"]').val();
			if (conditions !== '') {
				conditions = JSON.stringify(conditions);
			}
		}

		var editorMode = modalContainer.find('.editorMode').val();
		if (editorMode === 'create') {
			var translatedFieldName = modalContainer.find('.selectedType').data('typename');
			if (modalContainer.find('[name="rangeFields"]').is(':checked')) {
				var sourceValue = modalContainer.find('[name="sourceFieldsList"]').val();
				var targetValue = modalContainer.find('[name="targetFieldsList"]').val();
				fieldName = sourceValue + ',' + targetValue;
				translatedFieldName = modalContainer.find('[name="sourceFieldsList"] option:selected').text() + ',' + modalContainer.find('[name="targetFieldsList"] option:selected').text();
			}
		}

		var params = {
			module: 'Calendar',
			action: 'CalendarUserActions',
			mode: 'addCalendarView',
			viewmodule: moduleName,
			viewfieldname: fieldName,
			viewColor: selectedColor,
			viewConditions: conditions,
			viewIsOwn: isOwn
		};

		app.helper.showProgress();
		app.request.post({'data': params}).then(function (e, data) {
			if (!e) {
				var contrast = app.helper.getColorContrast(selectedColor);
				var textColor = (contrast === 'dark') ? 'white' : 'black';
				var message = app.vtranslate('JS_CALENDAR_VIEW_COLOR_UPDATED_SUCCESSFULLY');
				var parsedConditions = thisInstance._getParsedConditions(conditions);
				var feedIndicatorTitle = moduleName + '-' + translatedFieldName;
				var calendarSourceKey = moduleName + '_' + fieldName;

				if (parsedConditions.hasOwnProperty('value')) {
					calendarSourceKey += '_' + parsedConditions.value;
					feedIndicatorTitle = moduleName + '(' + app.vtranslate(parsedConditions.value) + ') -' + translatedFieldName;
				}

				if (editorMode === 'create') {
					var translatedModuleName = modulesList.find('option:selected').text();
					var feedIndicatorTemplate = jQuery('#calendarview-feeds').find('ul.dummy > li.feed-indicator-template');
					feedIndicatorTemplate.removeClass('.feed-indicator-template');
					var newFeedIndicator = feedIndicatorTemplate.clone(true, true);
					//replacing module name prefix with translated module name and concatinating with field name
					feedIndicatorTitle = translatedModuleName + feedIndicatorTitle.substr(feedIndicatorTitle.indexOf('-'));
					newFeedIndicator.find('span:first').text(feedIndicatorTitle);
					var newFeedCheckbox = newFeedIndicator.find('.toggleCalendarFeed');
					newFeedCheckbox.attr('data-calendar-sourcekey', calendarSourceKey).
							attr('data-calendar-feed', moduleName).
							attr('data-calendar-fieldlabel', translatedFieldName).
							attr('data-calendar-fieldname', fieldName).
							attr('data-calendar-is_own', isOwn).
							attr('title', translatedModuleName).
							attr('checked', 'checked');
					if (data['type']) {
						newFeedCheckbox.attr('data-calendar-type', data['type']);
					}
					feedIndicator = newFeedIndicator;
					jQuery('#calendarview-feeds').find('ul:first').append(feedIndicator);
					message = app.vtranslate('JS_CALENDAR_VIEW_ADDED_SUCCESSFULLY');
				} else {
					feedIndicator = jQuery('#calendarview-feeds')
							.find('[data-calendar-sourcekey="' + calendarSourceKey + '"]')
							.data('calendarIs_own', isOwn)
							.closest('.calendar-feed-indicator');
				}

				feedIndicator.css({'background-color': selectedColor, 'color': textColor});
				var feedCheckbox = feedIndicator.find('.toggleCalendarFeed');
				feedCheckbox.data('calendarFeedColor', selectedColor).
						data('calendarFeedTextcolor', textColor).
						data('calendarFeedConditions', conditions);
				thisInstance.refreshFeed(feedCheckbox);

				app.helper.hideProgress();
				app.helper.hideModal();
				app.helper.showSuccessNotification({'message': message});
			} else {
				console.log("error occured while saving : ", params, e);
			}
		});
	},
	registerColorEditorSaveEvent: function (modalContainer, feedIndicator) {
		var thisInstance = this;
		modalContainer.find('[name="saveButton"]').on('click', function () {
			var currentTarget = jQuery(this);
			currentTarget.attr('disabled', 'disabled');
			var modulesSelect = modalContainer.find('select[name="modulesList"]');
			var fieldsSelect = modalContainer.find('select[name="fieldsList"]');
			var selectedType = modalContainer.find('.selectedType');

			var moduleName = modulesSelect.val();
			var fieldName = fieldsSelect.val();

			selectedType.val(fieldName).data(
					'typename',
					fieldsSelect.find('option:selected').text()
					);

			var selectedColor = modalContainer.find('.selectedColor').val(),
					conditions = '';
			if (moduleName === 'Events') {
				conditions = modalContainer.find('[name="conditions"]').val();
				if (conditions !== '') {
					conditions = JSON.stringify(conditions);
				}
			}

			thisInstance.checkDuplicateFeed(moduleName, fieldName, selectedColor, conditions).then(
					function (result) {
						thisInstance.saveFeedSettings(modalContainer, feedIndicator);
					},
					function () {
						app.helper.showErrorNotification({'message': app.vtranslate('JS_CALENDAR_VIEW_YOU_ARE_EDITING_NOT_FOUND')});
						currentTarget.removeAttr('disabled');
					});
		});
	},
	registerColorEditorEvents: function (modalContainer, feedIndicator) {
		var thisInstance = this;
		var feedCheckbox = feedIndicator.find('input[type="checkbox"].toggleCalendarFeed');

		var colorPickerHost = modalContainer.find('.calendarColorPicker');
		var selectedColor = modalContainer.find('.selectedColor');
		thisInstance.initializeColorPicker(colorPickerHost, {}, function (hsb, hex, rgb) {
			var selectedColorCode = '#' + hex;
			selectedColor.val(selectedColorCode);
		});

		modalContainer.find('input[name="is_own"]').attr('checked', feedIndicator.find('.toggleCalendarFeed').data('calendarIs_own') === 1);
		if(feedIndicator.find('.toggleCalendarFeed').data('calendarIsdefault') === 1) {
			modalContainer.find('input[name="is_own"]').parents('.form-group').hide();
		}

		thisInstance.registerDateFieldChangeEvent(modalContainer);

		var modulesSelect = modalContainer.find('[name="modulesList"]');
		modulesSelect.on('change', function () {
			thisInstance.updateDateFields(modalContainer);
//handling eventtype condition element display
			var module = jQuery(this).val();
			if (module === 'Events') {
				modalContainer.find('#js-eventtype-condition').removeClass('hide');
				var feedConditions = feedCheckbox.data('calendarFeedConditions');
				if (feedConditions !== '') {
					modalContainer.find('[name="conditions"]').val(JSON.parse(feedConditions)).trigger('change');
				}
			} else {
				modalContainer.find('#js-eventtype-condition').addClass('hide');
			}
		}).select2('val', feedCheckbox.data('calendarFeed')).trigger('change');

		var fieldSelectElement = modalContainer.find('[name="fieldsList"]');
		fieldSelectElement.select2('val', feedCheckbox.data('calendarFieldname')).trigger('change');

		thisInstance.registerColorEditorSaveEvent(modalContainer, feedIndicator);
	},
	showColorEditor: function (feedIndicator) {
		var thisInstance = this;
		var params = {
			module: app.getModuleName(),
			view: 'ActivityTypeViews',
			mode: 'editActivityType'
		};
		app.helper.showProgress();
		app.request.post({'data': params}).then(function (e, data) {
			app.helper.hideProgress();
			if (!e) {
				app.helper.showModal(data, {
					'cb': function (modalContainer) {
						thisInstance.registerColorEditorEvents(modalContainer, feedIndicator);
					}
				});
			} else {
				console.log("network error : ", e);
			}
		});
	},
	registerFeedsColorEditEvent: function () {
		var thisInstance = this;
		jQuery('#calendarview-feeds').on('click', '.editCalendarFeedColor',
				function () {
					var feedIndicator = jQuery(this).closest('li.calendar-feed-indicator');
					thisInstance.showColorEditor(feedIndicator);
				});
	},
	getFeedDeleteParameters: function (feedCheckbox) {
		return {
			module: 'Calendar',
			action: 'CalendarUserActions',
			mode: 'deleteCalendarView',
			viewmodule: feedCheckbox.data('calendarFeed'),
			viewfieldname: feedCheckbox.data('calendarFieldname'),
			viewfieldlabel: feedCheckbox.data('calendarFieldlabel'),
			viewConditions: feedCheckbox.data('calendarFeedConditions')
		};
	},
	deleteFeed: function (feedIndicator) {
		var thisInstance = this;
		var feedCheckbox = feedIndicator.find('input[type="checkbox"].toggleCalendarFeed');
		var params = thisInstance.getFeedDeleteParameters(feedCheckbox);

		app.helper.showProgress();
		app.request.post({'data': params}).then(function (e) {
			if (!e) {
				thisInstance.removeEvents(feedCheckbox);
				feedIndicator.remove();
				app.helper.showSuccessNotification({
					message: app.vtranslate('JS_CALENDAR_VIEW_DELETED_SUCCESSFULLY')
				});
			} else {
				console.log("error : ", e);
			}
			app.helper.hideProgress();
		});
	},
	registerFeedDeleteEvent: function () {
		var thisInstance = this;
		jQuery('#calendarview-feeds').on('click', '.deleteCalendarFeed',
				function () {
					var feedIndicator = jQuery(this).closest('.calendar-feed-indicator');
					app.helper.showConfirmationBox({
						message: app.vtranslate('JS_CALENDAR_VIEW_DELETE_CONFIRMATION')
					}).then(function () {
						thisInstance.deleteFeed(feedIndicator);
					});
				});
	},
	checkDuplicateFeed: function (moduleName, fieldName, selectedColor, conditions) {
		var aDeferred = jQuery.Deferred();
		var params = {
			'module': 'Calendar',
			'action': 'CalendarUserActions',
			'mode': 'checkDuplicateView',
			'viewmodule': moduleName,
			'viewfieldname': fieldName,
			'viewColor': selectedColor,
			'viewConditions': conditions
		};
		app.request.post({'data': params}).then(function (e, result) {
			if (!e) {
				if (result['success']) {
					aDeferred.resolve(result);
				} else {
					aDeferred.reject(result);
				}
			} else {
				console.log("error : ", e);
			}
		});
		return aDeferred.promise();
	},
	registerAddActivityTypeEvent: function (modalContainer) {
		var thisInstance = this;
		modalContainer.find('[name="saveButton"]').on('click', function () {
			var currentTarget = jQuery(this);
			currentTarget.attr('disabled', 'disabled');
			var fieldSelect = modalContainer.find('select[name="fieldsList"]');
			var selectedType = modalContainer.find('.selectedType');
			selectedType.val(fieldSelect.val()).data(
					'typename',
					fieldSelect.find('option:selected').text()
					);
			var moduleName = modalContainer.find('select[name="modulesList"]').val();
			var fieldName = fieldSelect.val();
			if (modalContainer.find('[name="rangeFields"]').is(':checked')) {
				var sourceValue = modalContainer.find('[name="sourceFieldsList"]').val();
				var targetValue = modalContainer.find('[name="targetFieldsList"]').val();
				fieldName = sourceValue + ',' + targetValue;
			}
			var selectedColor = modalContainer.find('.selectedUserColor').val(),
					conditions = '';
			if (moduleName === 'Events') {
				conditions = modalContainer.find('[name="conditions"]').val();
				if (conditions !== '') {
					conditions = JSON.stringify(conditions);
				}
			}

			thisInstance.checkDuplicateFeed(moduleName, fieldName, selectedColor, conditions).then(
					function (result) {
						app.helper.showErrorNotification({'message': result['message']});
						currentTarget.removeAttr('disabled');
					},
					function () {
						thisInstance.saveFeedSettings(modalContainer);
					});
		});
	},
	registerAddActivityTypeFeedActions: function (modalContainer) {
		var thisInstance = this;
		var colorPickerHost = modalContainer.find('.calendarColorPicker');
		var selectedColor = modalContainer.find('.selectedColor');
		thisInstance.initializeColorPicker(colorPickerHost, {}, function (hsb, hex, rgb) {
			var selectedColorCode = '#' + hex;
			selectedColor.val(selectedColorCode);
		});

		thisInstance.registerDateFieldChangeEvent(modalContainer);

		var modulesSelect = modalContainer.find('[name="modulesList"]');
		modulesSelect.on('change', function () {
			thisInstance.updateDateFields(modalContainer);
//handling eventtype condition element display
			var module = jQuery(this).val();
			if (module === 'Events') {
				modalContainer.find('#js-eventtype-condition').removeClass('hide');
				modalContainer.find('#is_own').parents('.form-group:first').addClass('hide');
			} else {
				modalContainer.find('#js-eventtype-condition').addClass('hide');
				modalContainer.find('#is_own').parents('.form-group:first').removeClass('hide');
			}
		}).trigger('change');

		var sourceFieldsSelect = modalContainer.find('select[name="sourceFieldsList"]');
		sourceFieldsSelect.on('change', function () {
			var selectedValue = sourceFieldsSelect.find('option:selected').val();
			if (selectedValue === targetFieldsSelect.find('option:selected').val()) {
				var otherOption = targetFieldsSelect.find('option').not('option[value="' + selectedValue + '"]');
				targetFieldsSelect.select2('val', otherOption.val());
			}
		});

		var targetFieldsSelect = modalContainer.find('select[name="targetFieldsList"]');
		targetFieldsSelect.on('change', function () {
			var selectedValue = targetFieldsSelect.find('option:selected').val();
			if (selectedValue === sourceFieldsSelect.find('option:selected').val()) {
				var otherOption = sourceFieldsSelect.find('option').not('option[value="' + selectedValue + '"]');
				sourceFieldsSelect.select2('val', otherOption.val());
			}
		});

		var rangeFieldsOption = modalContainer.find('[name="rangeFields"]');
		rangeFieldsOption.on('change', function () {
			var fieldSelectEle = modalContainer.find('select[name="fieldsList"]');
			var sourceFieldsSelect = modalContainer.find('select[name="sourceFieldsList"]');
			var targetFieldsSelect = modalContainer.find('select[name="targetFieldsList"]');
			if (rangeFieldsOption.is(':checked')) {
				fieldSelectEle.attr('disabled', true);
				sourceFieldsSelect.removeAttr('disabled');
				targetFieldsSelect.removeAttr('disabled');
			} else {
				fieldSelectEle.removeAttr('disabled');
				sourceFieldsSelect.attr('disabled', true);
				targetFieldsSelect.attr('disabled', true);
			}

			//after disabling or enabling, set the options and selected value for select2 elements
			var fieldSelectedValue = fieldSelectEle.find('option:selected').val();
			var fieldOptions = fieldSelectEle.find('option');
			fieldSelectEle.select2('destroy').html(fieldOptions).select2();
			fieldSelectEle.select2('val', fieldSelectedValue);

			var sourceOptions = sourceFieldsSelect.find('option');
			sourceFieldsSelect.select2('destroy').html(sourceOptions).select2();
			sourceFieldsSelect.select2('val', fieldSelectedValue);

			var sourceSelectValue = sourceFieldsSelect.find('option:selected').val();
			var otherOption = targetFieldsSelect.find('option').not('option[value="' + sourceSelectValue + '"]');
			var targetOptions = targetFieldsSelect.find('option');
			targetFieldsSelect.select2('destroy').html(targetOptions).select2();
			targetFieldsSelect.select2('val', otherOption.val());
		});

		thisInstance.registerAddActivityTypeEvent(modalContainer);
	},
	showAddActivityTypeFeedView: function () {
		var thisInstance = this;
		var params = {
			module: app.getModuleName(),
			view: 'ActivityTypeViews',
			mode: 'addActivityType'
		};
		app.helper.showProgress();
		app.request.post({'data': params}).then(function (e, data) {
			app.helper.hideProgress();
			if (!e) {
				app.helper.showModal(data, {
					'cb': function (modalContainer) {
						thisInstance.registerAddActivityTypeFeedActions(modalContainer);
					}
				});
			} else {
				console.log("network error : ", e);
			}
		});
	},
	showAddCalendarFeedEditor: function () {
		this.showAddActivityTypeFeedView();
	},
	registerFeedAddEvent: function (widgetContainer) {
		var thisInstance = this;
		widgetContainer.find('.add-calendar-feed').on('click', function () {
			thisInstance.showAddCalendarFeedEditor();
		});
	},
	registerWidgetPostLoadEvent: function () {
		var thisInstance = this;
		app.event.on(Calendar_Calendar_Js.feedsWidgetPostLoadEvent,
				function (e, widgetContainer) {
					thisInstance.restoreFeedsState(widgetContainer);
					thisInstance.renderEvents();
					thisInstance.registerFeedAddEvent(widgetContainer);
					thisInstance.registerFeedChangeEvent();
					thisInstance.registerFeedsColorEditEvent();
					thisInstance.registerFeedDeleteEvent();
					if(thisInstance.registerGroupChangeEvent) {
						thisInstance.registerGroupChangeEvent();
					}
					jQuery('input[type="checkbox"].toggleTodoFeed').bootstrapSwitch();
					jQuery('input[type="checkbox"].toggleTodoFeed').bootstrapSwitch('handleWidth', '37px');
					jQuery('input[type="checkbox"].toggleTodoFeed').bootstrapSwitch('labelWidth', '35px');
					jQuery('input[type="checkbox"].toggleTodoFeed').bootstrapSwitch('disabled', false);
				});
	},
	changeWidgetDisplayState: function (widget, state) {
		var key = widget.data('widgetName') + '_WIDGET_DISPLAY_STATE';
		app.storage.set(key, state);
	},
	registerCollapseEvents: function (widget) {
		var thisInstance = this;
		widget.on('show.bs.collapse hide.bs.collapse', function (e) {
			var widgetStateIndicator = widget.find('i.widget-state-indicator');
			if (e.type === 'hide') {
				widgetStateIndicator.removeClass('fa-chevron-down').addClass('fa-chevron-right');
				thisInstance.changeWidgetDisplayState(widget, 'hide');
			} else {
				widgetStateIndicator.removeClass('fa-chevron-right').addClass('fa-chevron-down');
				thisInstance.changeWidgetDisplayState(widget, 'show');
			}
		});
	},
	getWidgetDisplayState: function (widget) {
		var key = widget.data('widgetName') + '_WIDGET_DISPLAY_STATE';
		var value = app.storage.get(key);
		return (value !== null) ? value : 'show';
	},
	restoreWidgetState: function (widget) {
		if (this.getWidgetDisplayState(widget) === 'show') {
			widget.find('.sidebar-widget-header > a').trigger('click');
		}
	},
	initializeWidgets: function () {
		var thisInstance = this;
		var widgets = jQuery('.sidebar-widget');
		jQuery.each(widgets, function () {
			var widget = jQuery(this);
			var widgetHeader = widget.find('.sidebar-widget-header');
			var dataUrl = widgetHeader.data('url');
			var dataParams = app.convertUrlToDataParams(dataUrl);
			var widgetBody = widget.find('.sidebar-widget-body');
			app.request.post({data: dataParams}).then(function (e, data) {
				if (!e) {
					widgetBody.html(data);
                                        let fullCalendarViewHeight = $('.fc-view-container').height();
                                        widgetBody.css('max-height', (fullCalendarViewHeight - 20) + 'px');
					app.helper.showVerticalScroll(
							widgetBody,
							{
								'autoHideScrollbar': true,
								'scrollbarPosition': 'outside'
							}
					);
//thisInstance.registerCollapseEvents(widget);
//thisInstance.restoreWidgetState(widget);
					app.event.trigger(Calendar_Calendar_Js.feedsWidgetPostLoadEvent, widget);
				} else {
					console.log("error in response : ", e);
				}
			});
		});
	},
	getCalendarViewContainer: function () {
		if (!Calendar_Calendar_Js.calendarViewContainer.length) {
			Calendar_Calendar_Js.calendarViewContainer = jQuery('#mycalendar');
		}
		return Calendar_Calendar_Js.calendarViewContainer;
	},
	getUserPrefered: function (setting) {
		if (typeof Calendar_Calendar_Js.userPreferenceCache[setting] === 'undefined') {
			Calendar_Calendar_Js.userPreferenceCache[setting] = jQuery('#' + setting).val();
		}
		return Calendar_Calendar_Js.userPreferenceCache[setting];
	},
	transformToEventObject: function (eventData, feedCheckbox) {
		var eventObject = {};
		eventObject.id = eventData._recordId;
		eventObject.title = eventData.subject.display_value;

		eventObject.start = eventData.date_start.calendar_display_value;
		eventObject.end = eventData.due_date.calendar_display_value;

		eventObject.url = 'index.php?module=Calendar&view=Detail&record=' + eventData._recordId;

		var module = feedCheckbox.data('calendarFeed');
		var color = feedCheckbox.data('calendarFeedColor');
		var textColor = feedCheckbox.data('calendarFeedTextcolor');

		eventObject.activitytype = eventData.activitytype.value;
		eventObject.status = eventData.eventstatus.value;
		eventObject.allDay = false;
		eventObject.module = module;

		eventObject.color = color;
		eventObject.textColor = textColor;
		return eventObject;
	},
	updateAgendaListView: function () {
		var calendarView = this.getCalendarViewContainer().fullCalendar('getView');
		if (calendarView.name === 'vtAgendaList') {
			this.getCalendarViewContainer().fullCalendar('rerenderEvents');
		}
	},
	updateAllEventsOnCalendar: function () {
		this._updateAllOnCalendar("Events");
		this.updateAgendaListView();
	},
	showEventOnCalendar: function (eventData) {
//method 1
//var feedCheckbox = jQuery('[data-calendar-type="Events_1"]');
//var eventObject = this.transformToEventObject(eventData,feedCheckbox);
//this.getCalendarViewContainer().fullCalendar('renderEvent',eventObject);

//method 2
//var thisInstance = this;
//var eventFeeds = jQuery('[data-calendar-feed="Events"]');
//eventFeeds.each(function(i, eventFeed) {
//thisInstance.refreshFeed(jQuery(eventFeed));
//});

//method 3 - Need to update all events, 
//since support for multiple calendar views for events is enabled
		this.updateAllEventsOnCalendar();
	},
	validateAndSaveEvent: function (modalContainer) {
		var thisInstance = this;
		var params = {
			submitHandler: function (form) {
				if (this.numberOfInvalids() > 0) {
					return false;
				}

				var formData = jQuery(form).serializeFormData();
				jQuery("button[name='saveButton']").attr("disabled", "disabled");
				var e = jQuery.Event(Vtiger_Edit_Js.recordPresaveEvent);
				app.event.trigger(e);
				if (e.isDefaultPrevented()) {
					return false;
				}
				Calendar_Edit_Js.showOverlapEventConfirmationBeforeSave(formData)
				.then(function () {
					app.helper.showProgress();
					app.request.post({data: formData}).then(function (err, data) {
						app.helper.hideProgress();
						if (!err) {
							jQuery('.vt-notification').remove();
							app.helper.hideModal();
							var message = formData.record !== "" ? app.vtranslate('JS_EVENT_UPDATED') : app.vtranslate('JS_RECORD_CREATED');
							app.helper.showSuccessNotification({"message": message});
							thisInstance.showEventOnCalendar(data);
						} else {
							app.event.trigger('post.save.failed', err);
							jQuery("button[name='saveButton']").removeAttr('disabled');
						}
					});
				}).fail(function () {
					app.helper.hideProgress();		
					jQuery("button[name='saveButton']").removeAttr('disabled');
				});
			}
		};
		modalContainer.find('form').vtValidate(params);
	},
	registerCreateEventModalEvents: function (modalContainer) {
		this.validateAndSaveEvent(modalContainer);
	},
	setStartDateTime: function (modalContainer, startDateTime) {
		var startDateElement = modalContainer.find('input[name="date_start"]');
		var startTimeElement = modalContainer.find('input[name="time_start"]');
		var alldayElement = modalContainer.find('input[name="is_allday"]');
		startDateElement.val(startDateTime.format(vtUtils.getMomentDateFormat()));
		startTimeElement.val(startDateTime.format(vtUtils.getMomentTimeFormat()));
		vtUtils.registerEventForDateFields(startDateElement);
		vtUtils.registerEventForTimeFields(startTimeElement);
		/**
			終日エリア、月次カレンダーをクリックした場合は、終日フラグにチェックを入れる
			経緯：これまでは00:00である、または12:00 AMであるを判定基準に使っていたため、00:00をクリックしたときに終日フラグが付いてしまっていた
			
			※ startDateTime._ambigTime: カレンダーの上部終日エリアを押したときtrueになる
		*/
		if(startDateTime._ambigTime) {
			alldayElement.attr('checked', true);
			Calendar_Edit_Js.changeAllDay();
		}
		startDateElement.trigger('change');
	},
	setEndDateTime: function (modalContainer, endDateTime) {
		var endDateElement = modalContainer.find('input[name="due_date"]');
		var endTimeElement = modalContainer.find('input[name="time_end"]');
		//月次カレンダーや週次カレンダー上部の終日エリアをドラッグしたとき、終了側の日にちが１日長くなってしまうので日時を調整する。
		if(endDateTime._ambigTime){
			endDateTime.subtract(1,'days');
		}
		endDateElement.val(endDateTime.format(vtUtils.getMomentDateFormat()));
		endTimeElement.val(endDateTime.format(vtUtils.getMomentTimeFormat()));
		vtUtils.registerEventForDateFields(endDateElement);
		vtUtils.registerEventForTimeFields(endTimeElement);
		endDateElement.trigger('change');
	},
	showCreateModal: function (moduleName, startDateTime) {
		var isAllowed = jQuery('#is_record_creation_allowed').val();
		if (isAllowed) {
			var thisInstance = this;
			var quickCreateNode = jQuery('#quickCreateModules').find('[data-name="' + moduleName + '"]');
			if (quickCreateNode.length <= 0) {
				app.helper.showAlertNotification({
					'message': app.vtranslate('JS_NO_CREATE_OR_NOT_QUICK_CREATE_ENABLED')
				});
			} else {
				quickCreateNode.trigger('click');
			}

			app.event.one('post.QuickCreateForm.show', function (e, form) {
				thisInstance.performingDayClickOperation = false;
				var modalContainer = form.closest('.modal');
				if (typeof startDateTime !== 'undefined' && startDateTime) {
					thisInstance.setStartDateTime(modalContainer, startDateTime);
				}
				if (moduleName === 'Events') {
					thisInstance.registerCreateEventModalEvents(form.closest('.modal'));
				}
			});
		}
	},
	showCreateModalforDrag: function (moduleName, startDateTime, endDateTime) {
		var isAllowed = jQuery('#is_record_creation_allowed').val();
		if (isAllowed) {
			var thisInstance = this;
			var quickCreateNode = jQuery('#quickCreateModules').find('[data-name="' + moduleName + '"]');
			if (quickCreateNode.length <= 0) {
				app.helper.showAlertNotification({
					'message': app.vtranslate('JS_NO_CREATE_OR_NOT_QUICK_CREATE_ENABLED')
				});
			} else {
				quickCreateNode.trigger('click');
			}

			app.event.one('post.QuickCreateForm.show', function (e, form) {
				thisInstance.performingDayClickOperation = false;
				var modalContainer = form.closest('.modal');
				if (typeof endDateTime !== 'undefined' && endDateTime) {
					thisInstance.setStartDateTime(modalContainer, startDateTime);
					thisInstance.setEndDateTime(modalContainer, endDateTime);
				}
				if (moduleName === 'Events') {
					thisInstance.registerCreateEventModalEvents(form.closest('.modal'));
				}
			});
		}
	},	
	_updateAllOnCalendar: function (calendarModule) {
		var thisInstance = this;
		this.getCalendarViewContainer().fullCalendar('addEventSource',
			updateAllOnCalendarEvent = function (start, end, timezone, render) {
					var activeFeeds = jQuery('[data-calendar-feed="' + calendarModule + '"]:checked');

					var activeFeedsRequestParams = {};
					activeFeeds.each(function () {
						var feedCheckbox = jQuery(this);
						var feedRequestParams = thisInstance.getFeedRequestParams(start, end, feedCheckbox);
						activeFeedsRequestParams[feedCheckbox.data('calendarSourcekey')] = feedRequestParams;
					});

					if (activeFeeds.length) {
						var requestParams = {
							'module': app.getModuleName(),
							'action': 'Feed',
							'mode': 'batch',
							'feedsRequest': activeFeedsRequestParams
						};
						var events = [];
						app.helper.showProgress();
						activeFeeds.attr('disabled', 'disabled');
						app.request.post({'data': requestParams}).then(function (e, data) {
							if (!e) {
								data = JSON.parse(data);
								for (var feedType in data) {
									var feed = JSON.parse(data[feedType]);
									feed.forEach(function (entry) {
										events.push(entry);
									});
								}
							} else {
								console.log("error in response : ", e);
							}
							activeFeeds.each(function () {
								var feedCheckbox = jQuery(this);
								thisInstance.removeEvents(feedCheckbox);
							});
							render(events);
							activeFeeds.removeAttr('disabled');
							app.helper.hideProgress();
						});
					}
			});
		this.getCalendarViewContainer().fullCalendar('removeEventSource', updateAllOnCalendarEvent);
		this.getCalendarViewContainer().fullCalendar('refetchEvents');

	},
	showCreateTaskModal: function () {
		this.showCreateModal('Calendar');
	},
	showCreateEventModal: function (startDateTime) {
		this.showCreateModal('Events', startDateTime);
	},
	showCreateTaskModalforDrag: function () {
		this.showCreateModalforDrag('Calendar');
	},
	showCreateEventModalforDrag: function (startDateTime,endDateTime) {
		this.showCreateModalforDrag('Events', startDateTime, endDateTime);
	},
	updateAllTasksOnCalendar: function () {
		this._updateAllOnCalendar("Calendar");
	},
	showTaskOnCalendar: function (data) {
		this.updateAllTasksOnCalendar();
	},
	updateCalendar: function (calendarModule, data) {
		if (calendarModule === 'Events') {
			this.showEventOnCalendar(data);
		} else if (calendarModule === 'Calendar') {
			this.showTaskOnCalendar(data);
		}
	},
	registerPostQuickCreateSaveEvent: function () {
		var thisInstance = this;
		app.event.on("post.QuickCreateForm.save", function (e, data, formData) {
			if (formData.module === 'Calendar' || formData.module === 'Events') {
				thisInstance.updateCalendar(formData.calendarModule, data);
			}
		});
	},
	performingDayClickOperation: false,
	performDayClickAction: function (date, jsEvent, view) {
		if (!this.performingDayClickOperation) {
			this.performingDayClickOperation = true;
			// if (date.hasTime() || view.type == 'month') {
				this.showCreateEventModal(date);
			// } else {
			// 	this.showCreateModal('Calendar', date);
			// }
		}
	},
	performDayDragAction: function (startDate, endDate, jsEvent, view) {
		if (!this.performingDayClickOperation) {
			this.performingDayClickOperation = true;
			// if (date.hasTime() || view.type == 'month') {
				this.showCreateEventModalforDrag(startDate,endDate);
			// } else {
			// 	this.showCreateModal('Calendar', date);
			// }
		}
	},
	daysOfWeek: {
		Sunday: 0,
		Monday: 1,
		Tuesday: 2,
		Wednesday: 3,
		Thursday: 4,
		Friday: 5,
		Saturday: 6
	},
	refreshFeed: function (feedCheckbox) {
		var thisInstance = this;
		if (feedCheckbox.is(':checked')) {
			feedCheckbox.attr('disabled', 'disabled');
			thisInstance.fetchEvents(feedCheckbox).then(function (events) {
				thisInstance.removeEvents(feedCheckbox);
				thisInstance.getCalendarViewContainer().fullCalendar('addEventSource', events);
				feedCheckbox.removeAttr('disabled');
			}, function (e) {
				console.log("error while fetching events : ", feedCheckbox, e);
			});
		}
	},
	_updateEventOnResize: function (postData, revertFunc) {
		var thisInstance = this;
		app.helper.showProgress();
		app.request.post({'data': postData}).then(function (e, resp) {
			app.helper.hideProgress();
			if (!e) {
				jQuery('.vt-notification').remove();
				if (!resp['ispermitted']) {
					revertFunc();
					app.helper.showErrorNotification({
						'message': app.vtranslate('JS_NO_EDIT_PERMISSION')
					});
				} else if (resp['error']) {
					revertFunc();
				} else {
					if (resp['recurringRecords'] === true) {
						thisInstance.updateAllEventsOnCalendar();
					}
					app.helper.showSuccessNotification({
						'message': app.vtranslate('JS_EVENT_UPDATED')
					});
				}
			} else {
				app.event.trigger('post.save.failed', e);
				thisInstance.updateAllEventsOnCalendar();
			}
			if(thisInstance.changeUserList) {
				thisInstance.changeUserList();
			}
		});
	},
	updateEventOnResize: function (event, delta, revertFunc, jsEvent, ui, view) {
		var thisInstance = this;
		if (event.module !== 'Calendar' && event.module !== 'Events') {
			revertFunc();
			return;
		}

		var dateFormat = this.getUserPrefered('date_format').toUpperCase();
		var hourFormat = this.getUserPrefered('time_format');
		var timeFormat = 'HH:mm';
		if (hourFormat === '12') {
			timeFormat = 'hh:mm a';
		}

		var postData = {
			'module': app.getModuleName(),
			'action': 'DragDropAjax',
			'mode': 'updateDeltaOnResize',
			'id': event.id,
			'activitytype': event.activitytype,
			'secondsDelta': delta.asSeconds(),
			'view': view.name,
			'userid': event.userid,
			'allday': event.allDay,
		};

		var overlapData = {
			module: 'Events',
			record: event.id,
			date_start: event.start.format(dateFormat),
			time_start: event.start.format(timeFormat),
			due_date: event.end ? event.end.format(dateFormat) : null,
			time_end: event.end ? event.end.format(timeFormat) : null,
			is_allday: event.allDay
		};
		
		if (event.recurringcheck) {
			app.helper.showConfirmationForRepeatEvents()
			.then(function (recurringData) {
				jQuery.extend(postData, recurringData);
				Calendar_Edit_Js.showOverlapEventConfirmationBeforeSave(overlapData, recurringData)
				.then(function () {
					thisInstance._updateEventOnResize(postData, revertFunc);
				}).fail(function () {
					revertFunc();
				});
			});
		} else {
			Calendar_Edit_Js.showOverlapEventConfirmationBeforeSave(overlapData)
			.then(function () {
				thisInstance._updateEventOnResize(postData, revertFunc);
			}).fail(function () {
				revertFunc();
			});
		}
	},
	updateEventOnDrop: function (event, delta, revertFunc, jsEvent, ui, view) {
		var thisInstance = this;
		if (event.module !== 'Calendar' && event.module !== 'Events') {
			revertFunc();
			return;
		}

		var dateFormat = this.getUserPrefered('date_format').toUpperCase();
		var hourFormat = this.getUserPrefered('time_format');
		var timeFormat = 'HH:mm';
		if (hourFormat === '12') {
			timeFormat = 'hh:mm a';
		}

		var postData = {
			'module': 'Calendar',
			'action': 'DragDropAjax',
			'mode': 'updateDeltaOnDrop',
			'id': event.id,
			'activitytype': event.activitytype,
			'secondsDelta': delta.asSeconds(),
			'view': view.name,
			'userid': event.userid,
			'allday': event.allDay,
		};
		
		var overlapData = {
			module: 'Events',
			record: event.id,
			date_start: event.start.format(dateFormat),
			time_start: event.start.format(timeFormat),
			due_date: event.end ? event.end.format(dateFormat) : null,
			time_end: event.end ? event.end.format(timeFormat) : null,
			is_allday: event.allDay
		};

		if (event.recurringcheck) {
			app.helper.showConfirmationForRepeatEvents().then(function (recurringData) {
				jQuery.extend(postData, recurringData);
				Calendar_Edit_Js.showOverlapEventConfirmationBeforeSave(overlapData, recurringData)
				.then(function () {
					thisInstance._updateEventOnResize(postData, revertFunc);
				}).fail(function () {
					revertFunc();
				});
			});
		} else {
			Calendar_Edit_Js.showOverlapEventConfirmationBeforeSave(overlapData)
			.then(function () {
				thisInstance._updateEventOnResize(postData, revertFunc);
			}).fail(function () {
				revertFunc();
			});
		}
	},
	getActivityTypeClassName: function (activitytype) {
		var className = 'fa fa-calendar';
		switch (activitytype) {
			case 'Meeting' :
				className = 'vicon-meeting';
				break;
			case 'Call' :
				className = 'fa fa-phone';
				break;
			case 'Mobile Call' :
				className = 'fa fa-mobile';
				break;
			case 'Task' :
				className = 'fa fa-check';
				break;
		}
		return className;
	},
	addActivityTypeIcons: function (event, element) {
		if (event.activitytype === 'Task') {
			element.find('.fc-content').prepend(
				'<span>' +
				'<i class="' + this.getTaskCompleteTypeClassName(event.status) + '"></i>' +
				'</span>&nbsp;'
				);
		} else {
			element.find('.fc-content > .fc-time').prepend(
					'<span>' +
					'<i class="' + this.getActivityTypeClassName(event.activitytype) + '"></i>' +
					'</span>&nbsp;'
					);
		}
	},
	getTaskCompleteTypeClassName: function (status) {
		var className = '';
		switch (status) {
			case 'Completed' :
				className = 'fa fa-check-square';
				break;
			default:
				className = 'fa fa-square';
				break;
		}
		return className;
	},
	// 月表示終了時間を追加
	addMonthViewEventEndTime: function (event, element, viewName) {
		if (viewName !== 'month' || !event.end) return;
		
		var endDateTime =  moment(event.end);
		if(!endDateTime.isValid()) return;
		
		var timeFormat = this.getDefaultCalendarTimeFormat();
		var endTimeText = ' - ' + endDateTime.format(timeFormat);
		element.find('.fc-content > .fc-time').append(endTimeText);
	},
	
	_deleteCalendarEvent: function (eventId, sourceModule, extraParams) {
		var thisInstance = this;
		if (typeof extraParams === 'undefined') {
			extraParams = {};
		}
		var params = {
			"module": "Calendar",
			"view": app.view(),
			"action": "DeleteAjax",
			"record": eventId,
			"sourceModule": sourceModule
		};
		jQuery.extend(params, extraParams);

		app.helper.showProgress();
		app.request.post({'data': params}).then(function (e, res) {
			app.helper.hideProgress();
			if (!e) {
				var deletedRecords = res['deletedRecords'];
				for (var key in deletedRecords) {
					var eventId = deletedRecords[key];
					thisInstance.getCalendarViewContainer().fullCalendar('removeEvents', eventId);
				}
				app.helper.showSuccessNotification({
					'message': app.vtranslate('JS_RECORD_DELETED')
				});
			} else {
				app.helper.showErrorNotification({
					'message': app.vtranslate('JS_NO_DELETE_PERMISSION')
				});
			}
		});
	},
	deleteCalendarEvent: function (eventId, sourceModule, isRecurring) {
		var thisInstance = this;
		if (isRecurring) {
			app.helper.showConfirmationForRepeatEvents().then(function (postData) {
				thisInstance._deleteCalendarEvent(eventId, sourceModule, postData);
			});
		} else {
			app.helper.showConfirmationBox({
				message: app.vtranslate('LBL_DELETE_CONFIRMATION')
			}).then(function () {
				thisInstance._deleteCalendarEvent(eventId, sourceModule);
			});
		}
	},
	updateEventOnCalendar: function (eventData) {
		this.updateAllEventsOnCalendar();
	},
	_updateEvent: function (form, extraParams) {
		var formData = jQuery(form).serializeFormData();
		extraParams = extraParams || {};
		jQuery.extend(formData, extraParams);
		app.helper.showProgress();
		app.request.post({data: formData}).then(function (err, data) {
			app.helper.hideProgress();
			if (!err) {
				jQuery('.vt-notification').remove();
				var message = typeof formData.record !== "" ? app.vtranslate('JS_EVENT_UPDATED') : app.vtranslate('JS_RECORD_CREATED');
				app.helper.showSuccessNotification({"message": message});
				app.event.trigger("post.QuickCreateForm.save", data, jQuery(form).serializeFormData());
				app.helper.hideModal();
			} else {
				app.event.trigger('post.save.failed', err);
				jQuery("button[name='saveButton']").removeAttr("disabled");
			}
		});
	},
	validateAndUpdateEvent: function (modalContainer, isRecurring) {
		var thisInstance = this;
		var params = {
			submitHandler: function (form) {
				if (this.numberOfInvalids() > 0) {
					jQuery("button[name='saveButton']").removeAttr("disabled");
					return false;
				}
				
				var overlapData = jQuery(form).serializeFormData();
				var e = jQuery.Event(Vtiger_Edit_Js.recordPresaveEvent);
				app.event.trigger(e);
				
				if (e.isDefaultPrevented()) {
					return false;
				}
				if (isRecurring) {
					app.helper.showConfirmationForRepeatEvents()
					.then(function (postData) {
						Calendar_Edit_Js.showOverlapEventConfirmationBeforeSave(overlapData, postData)
						.then(function () {
							thisInstance._updateEvent(form, postData);
						});
					});
				} else {
					Calendar_Edit_Js.showOverlapEventConfirmationBeforeSave(overlapData)
					.then(function () {
						thisInstance._updateEvent(form);
						jQuery("button[name='saveButton']").prop("disabled", true);
					});
				}
			}
		};
		modalContainer.find('form').vtValidate(params);
	},
	registerEditEventModalEvents: function (modalContainer, isRecurring) {
		this.validateAndUpdateEvent(modalContainer, isRecurring);
	},
	showEditModal: function (moduleName, record, isRecurring, isDuplicate) {
		var thisInstance = this;
		var quickCreateNode = jQuery('#quickCreateModules').find('[data-name="' + moduleName + '"]');
		if (quickCreateNode.length <= 0) {
			app.helper.showAlertNotification({
				'message': app.vtranslate('JS_NO_CREATE_OR_NOT_QUICK_CREATE_ENABLED')
			});
		} else {
			var quickCreateUrl = quickCreateNode.data('url');
			var quickCreateEditUrl = quickCreateUrl + '&mode=edit&record=' + record;
			if(isDuplicate == true) quickCreateEditUrl += "&isDuplicate=true";
			quickCreateNode.data('url', quickCreateEditUrl);
			quickCreateNode.trigger('click');
			quickCreateNode.data('url', quickCreateUrl);
			$(".modal-body").css("max-height", '800px');

			if (moduleName === 'Events') {
				app.event.one('post.QuickCreateForm.show', function (e, form) {
					thisInstance.registerEditEventModalEvents(form.closest('.modal'), isRecurring);
				});
			}
		}
	},
	showEditTaskModal: function (taskId) {
		this.showEditModal('Calendar', taskId);
	},
	editCalendarTask: function (taskId) {
		this.showEditTaskModal(taskId);
	},
	showEditEventModal: function (eventId, isRecurring, isDuplicate) {
		this.showEditModal('Events', eventId, isRecurring, isDuplicate);
	},
	editCalendarEvent: function (eventId, isRecurring) {
		this.showEditEventModal(eventId, isRecurring);
	},
	copyCalendarEvent: function (eventId, isRecurring, isDuplicate) {
		this.showEditEventModal(eventId, isRecurring, isDuplicate);
	},
	registerPopoverEvent: function (event, element, calendarView) {
		var dateFormat = this.getUserPrefered('date_format');
		dateFormat = dateFormat.toUpperCase();
		var hourFormat = this.getUserPrefered('time_format');
		var timeFormat = 'HH:mm';
		if (hourFormat === '12') {
			timeFormat = 'hh:mm a';
		}

		var generatePopoverContentHTML = function (eventObj) {
			var timeString = '';
			if (eventObj.activitytype === 'Task') {
				timeString = moment(eventObj._start._i, eventObj._start._f).format(timeFormat);
			} else if (eventObj.module === "Events") {
				if (eventObj._start && typeof eventObj._start != 'undefined') {
					timeString = eventObj._start.format(timeFormat);
				}
				if (eventObj._end && typeof eventObj._end != 'undefined') {
					timeString += ' - ' + eventObj._end.format(timeFormat);
				}
			} else {
				timeString = eventObj._start.format(dateFormat);
			}
			var sourceModule = eventObj.module;
			if (!sourceModule) {
				sourceModule = 'Calendar';
			}
			if(eventObj.allDay) {
				timeString = '';
			}

			var popOverHTML = '<span>' + timeString;

			if(eventObj.assigned_user_id && eventObj.assigned_user_id != '') {
				popOverHTML += '  ' + eventObj.assigned_user_id;
				popOverHTML += '<br>';
			}

			if(eventObj.parent_id && eventObj.parent_id != '') {
				popOverHTML += '<a href="index.php?module=' + eventObj.related_module + '&view=Detail&record=' + eventObj.related_id + '">'+eventObj.parent_id+'</a>';
				popOverHTML += '<br>';
			}

			if(eventObj.location && eventObj.location != '') {
				popOverHTML += '<a href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(eventObj.location) + '" target="_blank">' + eventObj.location + '</a>';
				popOverHTML += '<br>';
			}

			if(eventObj.description && eventObj.description != '') {
				popOverHTML += eventObj.description;
			}

			if(event.creator && event.creator != '' || event.modifiedby && event.modifiedby != '') {
				popOverHTML += '<div class="calendar-space">';

				if(event.creator && event.creator != '') {
					popOverHTML += '  ' + event.creator_field_label + ': ' + event.creator;
					popOverHTML += '<br>';
				}

				if(event.modifiedby && event.modifiedby != '') {
					popOverHTML += '  ' + event.modifiedby_field_label + ': ' + event.modifiedby;
					popOverHTML += '<br>';
				}
				popOverHTML += '</div>';
			}

			popOverHTML += '</span>';

			if (sourceModule === 'Calendar' || sourceModule == 'Events'||sourceModule =="ProjectTask") {
				popOverHTML += '' +
						'<span class="pull-right cursorPointer" ' +
						'onClick="Calendar_Calendar_Js.deleteCalendarEvent(\'' + eventObj.id +
						'\',\'' + sourceModule + '\',' + eventObj.recurringcheck + ');" title="' + app.vtranslate('JS_DELETE') + '">' +
						'&nbsp;<i class="fa fa-trash"></i>' +
						'</span> &nbsp;&nbsp;';

				if (sourceModule === 'Events') {
					popOverHTML += '' +
							'<span class="pull-right cursorPointer" ' +
							'onClick="Calendar_Calendar_Js.editCalendarEvent(\'' + eventObj.id +
							'\',' + eventObj.recurringcheck + ');" title="' + app.vtranslate('JS_EDIT') + '">' +
							'&nbsp;<i class="fa fa-pencil"></i>&nbsp;' +
							'</span>';
							popOverHTML += '' +
							'<span class="pull-right cursorPointer" ' +
							'onClick="Calendar_Calendar_Js.copyCalendarEvent(\'' + eventObj.id +
							'\',' + eventObj.recurringcheck + ');" title="' + app.vtranslate('JS_COPY') + '">' +
							'&nbsp;<i class="fa fa-copy"></i>&nbsp;' +
							'</span>';
				} else if (sourceModule === 'Calendar') {
					popOverHTML += '' +
							'<span class="pull-right cursorPointer" ' +
							'onClick="Calendar_Calendar_Js.editCalendarTask(\'' + eventObj.id + '\');" title="' + app.vtranslate('JS_EDIT') + '">' +
							'&nbsp;<i class="fa fa-pencil"></i>&nbsp;' +
							'</span>';
				}

				if (eventObj.status !== 'Held' && eventObj.status !== 'Completed') {
					popOverHTML += '' +
							'<span class="pull-right cursorPointer"' +
							'onClick="Calendar_Calendar_Js.markAsHeld(\'' + eventObj.id + '\',\'' + sourceModule + '\');" title="' + app.vtranslate('JS_MARK_AS_HELD') + '">' +
							'<i class="fa fa-check"></i>&nbsp;' +
							'</span>';
				} else if (eventObj.status === 'Held') {
					popOverHTML += '' +
							'<span class="pull-right cursorPointer" ' +
							'onClick="Calendar_Calendar_Js.holdFollowUp(\'' + eventObj.id + '\');" title="' + app.vtranslate('JS_CREATE_FOLLOW_UP') + '">' +
							'<i class="fa fa-flag"></i>&nbsp;' +
							'</span>';
				}
			}
			return popOverHTML;
		};

		var params = {
			'title': event.title,
			'content': generatePopoverContentHTML(event),
			'trigger': 'hover',
			'closeable': true,
			'placement': 'auto',
			'animation': 'fade',
			'delay': {
				show: null,
				hide: 300,
			}
		};
		if (calendarView.name === 'agendaDay') {
			params.constrains = 'vertical';
		}
		if(app.getUserId() == event.userid || event.visibility != "Private"){
			element.webuiPopover(params);
		}
	},
	performPreEventRenderActions: function (event, element) {
		var calendarView = this.getCalendarViewContainer().fullCalendar('getView');
		this.addMonthViewEventEndTime(event, element, calendarView.name);
		this.addActivityTypeIcons(event, element);
		this.registerPopoverEvent(event, element, calendarView);
	},
	performMouseOutActions: function (event, jsEvent, view) {
//var currentTarget = jQuery(jsEvent.currentTarget);
	},
	performMouseOverActions: function (event, jsEvent, view) {
//var currentTarget = jQuery(jsEvent.currentTarget);
	},
	getCalendarHeight: function (view) {
		var portion = 0.86;
		if (typeof view !== 'undefined') {
			if (view === 'AgendaList') {
				portion = 1;
			}
		}
//calendar-height is 86% of window height
		return jQuery(window).height() * portion;
	},
	getDefaultCalendarView: function () {
		var userDefaultActivityView = this.getUserPrefered('activity_view');
		if (userDefaultActivityView === 'Today') {
			userDefaultActivityView = 'agendaDay';
		} else if (userDefaultActivityView === 'This Week') {
			userDefaultActivityView = 'agendaWeek';
		} else if (userDefaultActivityView === 'Agenda') {
			userDefaultActivityView = 'vtAgendaList';
		} else {
			userDefaultActivityView = 'month';
		}
		return userDefaultActivityView;
	},
	getDefaultCalendarTimeFormat: function () {
		var userDefaultTimeFormat = this.getUserPrefered('time_format');
		if (parseInt(userDefaultTimeFormat) === 24) {
			userDefaultTimeFormat = 'H(:mm)';
		} else {
			userDefaultTimeFormat = 'h(:mm)a';
		}
		return userDefaultTimeFormat;
	},
	getCalendarConfigs: function () {
		var thisInstance = this;
		var userDefaultActivityView = thisInstance.getDefaultCalendarView();
		var userDefaultTimeFormat = thisInstance.getDefaultCalendarTimeFormat();
                
		var dateFormat = app.getDateFormat();
		//Converting to fullcalendar accepting date format
		var monthPos = dateFormat.search("mm");
		var datePos = dateFormat.search("dd");
		if (monthPos < datePos) {
			dateFormat = "M/D";
		} else {
			dateFormat = "D/M";
		}
		var monthTitleFormat = 'MMMM YYYY';
		var weekTitleFormat = 'MMM D YYYY';
		var dayTitleFormat = 'MMMM D YYYY';

		var lang = (navigator.language) ? navigator.language : navigator.userLanguage;
		if (lang.toLowerCase().indexOf("ja") !== -1) {
			monthTitleFormat = app.vtranslate('JS_MONTHTITLEFORMAT');
			weekTitleFormat = app.vtranslate('JS_WEEKTITLEFORMAT');
			dayTitleFormat = app.vtranslate('JS_DAYTITLEFORMAT');
		}

		// 縦が短い端末を考慮して，表示するカレンダーの最低の高さを設定(500px)
		var MIN_CALENDAR_HEIGHT = 500;
		var HEADER_HEIGHT = 200;
		var CalendarHeight = $(window).height() - HEADER_HEIGHT;
		CalendarHeight = (CalendarHeight < MIN_CALENDAR_HEIGHT) ? MIN_CALENDAR_HEIGHT : CalendarHeight;
		var defaultDate;
		var defaultView;
		var URL_Search = new URLSearchParams(location.search);
		var URL_Search_PRE = new URLSearchParams(document.referrer);
		if(location.href.match(/default/)){//ヘッダーのカレンダーボタンからの処理
			defaultView = userDefaultActivityView;
			if(URL_Search.get('view') ==  'SharedCalendar'){
				if(userDefaultActivityView == 'vtAgendaList'){
					defaultView = 'month';
				}
			}
			
		}else{
			if(location.href.match(/lastViewDate/)){//リフレッシュしたときの処理
				switch(URL_Search.get('Viewtype')){
					case 'day':
						defaultView = 'agendaDay';
						defaultDate=URL_Search.get('lastViewDate');
						break;
					case 'week':
						defaultView = 'agendaWeek';
						defaultDate=URL_Search.get('lastViewDate');
						break;
					case 'month':
						defaultView = 'month';
						defaultDate=URL_Search.get('lastViewDate');
						break;
					case 'list':
						defaultView = 'vtAgendaList';
						if(URL_Search.get('lastViewDate')){
							defaultDate=URL_Search.get('lastViewDate');
						}
						break
				}

			}else{//個人,共有カレンダー間の遷移
				var quickCreateReturnURL = URL_Search_PRE.get('quickCreateReturnURL');
				// 直接PREでデータを取得できなかったため、返り値の値を確認して取得する
				var _urlSearch = new URLSearchParams(quickCreateReturnURL);
				var _ViewType = _urlSearch.get('Viewtype');
				switch(_ViewType){
					case 'day':
						defaultView = 'agendaDay';
						defaultDate = URL_Search_PRE.get('lastViewDate');
						break;
					case 'week':
						defaultView = 'agendaWeek';
						defaultDate = URL_Search_PRE.get('lastViewDate');
						break;
					case 'month':
						defaultView = 'month';
						defaultDate = URL_Search_PRE.get('lastViewDate');
						break;
					case 'list':
						defaultView = 'month';
						if(URL_Search.get('lastViewDate')){
							defaultDate=URL_Search.get('lastViewDate');
						}
						break;
				}
			}
		}

		// 表示する日付を取得
		var URL_Search = new URLSearchParams(location.search);
		var calendarStartDate = URL_Search.get("calendarStartDate");
		var lastViewDate = URL_Search.get("lastViewDate");
		if (calendarStartDate) {
			var defaultDate = new Date(calendarStartDate);
		} else if(lastViewDate && lastViewDate != 'default') {
			var defaultDate = new Date(lastViewDate);
		} else {
			var defaultDate = new Date(); // 今日
		}
		URL_Search.delete("calendarStartDate");
		history.replaceState('', '', 'index.php?' + URL_Search.toString());

		var calenderConfigs = {
			header: {
				left: 'month,agendaWeek,agendaDay,vtAgendaList',
				center: 'title',
				right: 'today prev,next',
			},
                        columnFormat: {
                            month: 'ddd',
                            week: dateFormat + ' ddd',
                            day: dateFormat + ' dddd'
                        },
			views: {
                            vtAgendaList: {
                                    duration: {days: Calendar_Calendar_Js.numberOfDaysInAgendaView}
                            },
                            month:{
								titleFormat: monthTitleFormat,
                                columnFormat:'ddd'
                            },
                            agendaWeek: {
								titleFormat: weekTitleFormat,
                                columnFormat: dateFormat + ' ddd'
                            },
                            agendaDay: {
								titleFormat: dayTitleFormat,
                                columnFormat: dateFormat + ' dddd'
                            }
			},
			contentHeight: CalendarHeight,
			fixedWeekCount: false,
			firstDay: thisInstance.daysOfWeek[thisInstance.getUserPrefered('start_day')],
			scrollTime: thisInstance.getUserPrefered('start_hour'),
			editable: true,
			eventLimit: false,
			defaultDate:defaultDate,
			defaultView:defaultView,
			slotLabelFormat: userDefaultTimeFormat,
			timeFormat: userDefaultTimeFormat,
			defaultDate: defaultDate,
			events: [],
			monthNames: [
				app.vtranslate('LBL_JANUARY'),
				app.vtranslate('LBL_FEBRUARY'),
				app.vtranslate('LBL_MARCH'),
				app.vtranslate('LBL_APRIL'),
				app.vtranslate('LBL_MAY'),
				app.vtranslate('LBL_JUNE'),
				app.vtranslate('LBL_JULY'),
				app.vtranslate('LBL_AUGUST'),
				app.vtranslate('LBL_SEPTEMBER'),
				app.vtranslate('LBL_OCTOBER'),
				app.vtranslate('LBL_NOVEMBER'),
				app.vtranslate('LBL_DECEMBER')
			],
			monthNamesShort: [
				app.vtranslate('LBL_JAN'),
				app.vtranslate('LBL_FEB'),
				app.vtranslate('LBL_MAR'),
				app.vtranslate('LBL_APR'),
				app.vtranslate('LBL_MAY'),
				app.vtranslate('LBL_JUN'),
				app.vtranslate('LBL_JUL'),
				app.vtranslate('LBL_AUG'),
				app.vtranslate('LBL_SEP'),
				app.vtranslate('LBL_OCT'),
				app.vtranslate('LBL_NOV'),
				app.vtranslate('LBL_DEC')
			],
			dayNames: [
				app.vtranslate('LBL_SUNDAY'),
				app.vtranslate('LBL_MONDAY'),
				app.vtranslate('LBL_TUESDAY'),
				app.vtranslate('LBL_WEDNESDAY'),
				app.vtranslate('LBL_THURSDAY'),
				app.vtranslate('LBL_FRIDAY'),
				app.vtranslate('LBL_SATURDAY')
			],
			dayNamesShort: [
				app.vtranslate('LBL_SUN'),
				app.vtranslate('LBL_MON'),
				app.vtranslate('LBL_TUE'),
				app.vtranslate('LBL_WED'),
				app.vtranslate('LBL_THU'),
				app.vtranslate('LBL_FRI'),
				app.vtranslate('LBL_SAT')
			],
			buttonText: {
				'today': app.vtranslate('LBL_TODAY'),
				'month': app.vtranslate('LBL_MONTH'),
				'week': app.vtranslate('LBL_WEEK'),
				'day': app.vtranslate('LBL_DAY'),
				'vtAgendaList': app.vtranslate('LBL_AGENDA')
			},
			allDayText: app.vtranslate('LBL_ALL_DAY'),
			dayClick: function (date, jsEvent, view) {
				thisInstance.performDayClickAction(date, jsEvent, view);
			},
			eventResize: function (event, delta, revertFunc, jsEvent, ui, view) {
				thisInstance.updateEventOnResize(event, delta, revertFunc, jsEvent, ui, view);
			},
			eventDrop: function (event, delta, revertFunc, jsEvent, ui, view) {
				thisInstance.updateEventOnDrop(event, delta, revertFunc, jsEvent, ui, view);
			},
			select: function (startDate, endDate, jsEvent, view){
				thisInstance.performDayDragAction(startDate, endDate, jsEvent, view);
			},
			eventRender: function (event, element) {
				thisInstance.performPreEventRenderActions(event, element);
			},
			eventMouseover: function (event, jsEvent, view) {
				thisInstance.performMouseOverActions(event, jsEvent, view);
			},
			eventMouseout: function (event, jsEvent, view) {
				thisInstance.performMouseOutActions(event, jsEvent, view);
			},
			viewRender: function (view, element) {
				var lastviewday;
				var URL_Search = new URLSearchParams(location.search);
				var lastviewtype = URL_Search.get('view');
				if(document.getElementsByClassName('fc-day-header').item(1)==null){
					if(document.getElementsByClassName('fc-day-header').item(0)){//表示が日の時の処理
						lastviewday =document.getElementsByClassName('fc-day-header').item(0).dataset.date;
						history.replaceState('', '','index.php?module=Calendar&view='+ lastviewtype +'&lastViewDate=' + lastviewday + "&Viewtype=day");
						thisInstance.updateSideberCalendarLinks('day', lastviewday);
					}
					else{//表示が概要の時の処理
						history.replaceState('', '','index.php?module=Calendar&view='+ lastviewtype +'&lastViewDate=' +"&Viewtype=list");
					}
				}
				else if(document.getElementsByClassName('fc-day-header').item(1).dataset.date==undefined){//表示が月の時の処理
					lastviewday =document.getElementsByClassName('fc-day-top').item(7).dataset.date;
					history.replaceState('', '','index.php?module=Calendar&view='+ lastviewtype +'&lastViewDate=' + lastviewday.substr(0, lastviewday.lastIndexOf('-')) + "&Viewtype=month");
					thisInstance.updateSideberCalendarLinks('month', lastviewday.substr(0, lastviewday.lastIndexOf('-')));
				}
				else if(document.getElementsByClassName('fc-day-header').item(1).dataset.date){//表示が週の時の処理
					lastviewday =document.getElementsByClassName('fc-day-header').item(0).dataset.date;
					history.replaceState('', '','index.php?module=Calendar&view='+ lastviewtype +'&lastViewDate=' + lastviewday + "&Viewtype=week");
					thisInstance.updateSideberCalendarLinks('week', lastviewday);
				}
				if (view.name === 'vtAgendaList') {
					jQuery(".sidebar-essentials").addClass("hide");
					jQuery(".content-area").addClass("full-width");
					jQuery(".essentials-toggle").addClass("hide");
				} else {
					jQuery(".essentials-toggle").removeClass("hide");
					if (Calendar_Calendar_Js.sideBarEssentialsState === 'show') {
						jQuery(".sidebar-essentials").removeClass("hide");
						jQuery(".content-area").removeClass("full-width");
					} else if (Calendar_Calendar_Js.sideBarEssentialsState === 'hidden') {
						jQuery(".sidebar-essentials").addClass("hide");
						jQuery(".content-area").addClass("full-width");
					}
				}
			}
		};
		return calenderConfigs;
	},
	updateSideberCalendarLinks: function(view, date){
		$privateCalendarLinkElm = $('#modules-menu .LBL_CALENDAR_VIEW > a');
		$sharedCalendarLinkElm = $('#modules-menu .LBL_SHARED_CALENDAR > a');
		
		$privateCalendarLinkElm.attr('href', 'index.php?module=Calendar&view=Calendar&lastViewDate='+date+'&Viewtype='+view);
		$sharedCalendarLinkElm.attr('href', 'index.php?module=Calendar&view=SharedCalendar&lastViewDate='+date+'&Viewtype='+view);
	},
	fetchAgendaEvents: function (date) {
		var aDeferred = jQuery.Deferred();

		var dateFormat = this.getUserPrefered('date_format');
		dateFormat = dateFormat.toUpperCase();
		var startDate = date.format(dateFormat);

		var requestParams = {
			'module': app.getModuleName(),
			'action': 'FetchAgendaEvents',
			'startDate': startDate,
			'numOfDays': Calendar_Calendar_Js.numberOfDaysInAgendaView
		};

		app.helper.showProgress();
		app.request.post({'data': requestParams}).then(function (e, res) {
			app.helper.hideProgress();
			if (!e) {
				aDeferred.resolve(res);
			} else {
				aDeferred.reject(e);
			}
		});

		return aDeferred.promise();
	},
	fetchEventDetails: function (eventId) {
		var aDeferred = jQuery.Deferred();

		var requestParams = {
			'module': app.getModuleName(),
			'action': 'CalendarActions',
			'mode': 'fetchAgendaViewEventDetails',
			'id': eventId
		};

		app.helper.showProgress();
		app.request.post({'data': requestParams}).then(function (e, res) {
			app.helper.hideProgress();
			if (!e) {
				aDeferred.resolve(res);
			} else {
				aDeferred.reject(e);
			}
		});

		return aDeferred.promise();
	},
	registerAgendaListView: function () {
		var thisInstance = this;
		var FC = jQuery.fullCalendar;
		var view = FC.View;
		var agendaListView;

		agendaListView = view.extend({
			initialize: function () {
				var dateFormat = thisInstance.getUserPrefered('date_format');
				this.vtDateFormat = dateFormat.toUpperCase();
			},
			getCourseDay: function (date) {
				var today = moment();
				var dateFormat = this.vtDateFormat;
				var todayDate = moment().format(dateFormat);
				if (todayDate === date.format(dateFormat)) {
					return app.vtranslate('LBL_TODAY').toUpperCase();
				} else {
					var tomorrow = today.add(1, 'days');
					if (tomorrow.format(dateFormat) === date.format(dateFormat)) {
						return app.vtranslate('LBL_TOMORROW').toUpperCase();
					}
				}
				return date.format('LL');
			},
			getWeekDay: function (date) {
				var weekDay = date.format('dddd');
				var label = 'LBL_' + weekDay.toUpperCase();
				return app.vtranslate(label).toUpperCase();
			},
			renderHtml: function () {
				var startDate = moment(this.intervalStart);
				var dateFormat = this.vtDateFormat;
				var skeleton = '' +
						'<div class="agendaListView">';
				for (var i = 0; i < Calendar_Calendar_Js.numberOfDaysInAgendaView; i++) {
					var daysToAdd = i ? 1 : 0;
					var date = startDate.add(daysToAdd, 'days').format(dateFormat);
					var day = this.getCourseDay(startDate);
					var weekDay = this.getWeekDay(startDate);
					var part = '' +
							'<div class="agendaListDay" data-date="' + date + '">' +
							'<div class="agendaListViewHeader clearfix">' +
							'<div class="day">' + day + '</div>' +
							'<div class="weekDay">' + weekDay + '</div>' +
							'</div>' +
							'<hr>' +
							'<div class="agendaListViewBody">' +
							'</div>' +
							'</div>';
					skeleton += part;
				}
				skeleton +=
						'</div>';
				return skeleton;
			},
			generateEventDetailsHTML: function (res) {
				var html = '<div class="agenda-table-cell"></div>' +
						'<div class="agenda-table-cell"></div>' +
						'<div class="agenda-table-cell">' +
						'<div class="agenda-table details">';
				for (var fieldLabel in res) {
					var eachItem = '<div class="agenda-details">';
					eachItem += '<span class="detailLabel">' + fieldLabel + '</span>';
					eachItem += '<span class="separator"> : </span>';
					eachItem += '<span class="fieldValue">' + jQuery.trim(res[fieldLabel]) + '</span>';
					eachItem += '</div>';
					html += eachItem;
				}
				html += '</div>' +
						'</div>';
				return html;
			},
			registerToggleMoreDetailsEvent: function (container) {
				var fcInstance = this;
				container.on('click', '.agenda-more-details', function () {
					var target = jQuery(this);
					var indicator = target.find('i');
					var wrapper = target.closest('.agenda-event-wrapper');
					var eventId = wrapper.data('eventId');
					var details = wrapper.find('.agenda-event-details');
					if (indicator.hasClass('fa-plus-square-o')) {
						if (details.data('isDetailsLoaded')) {
							details.removeClass('hide');
						} else {
							thisInstance.fetchEventDetails(eventId).then(function (res) {
								details.append(fcInstance.generateEventDetailsHTML(res));
								details.removeClass('hide');
								details.data('isDetailsLoaded', true)
							});
						}
						indicator.removeClass('fa-plus-square-o').
								addClass('fa-minus-square-o');
					} else {
						details.addClass('hide');
						indicator.removeClass('fa-minus-square-o').
								addClass('fa-plus-square-o');
					}
				});
			},
			registerAgendaViewEvents: function (container) {
				this.registerToggleMoreDetailsEvent(container);
			},
			render: function () {
				this.el.html(this.renderHtml());
				var height = thisInstance.getCalendarHeight('AgendaList') + 'px';
				var agendaListContainer = this.el.find('.agendaListView');
				agendaListContainer.css('max-height', height).css('min-height', height);
				this.registerAgendaViewEvents(agendaListContainer);
			},
			renderEvents: function () {
				this.renderVtAgendaEvents();
			},
			getAgendaActionsHTML: function (event) {
				var actionsMarkup = '' +
						'<div class="agenda-event-actions verticalAlignMiddle">' +
						'<span class="pull-right cursorPointer" ' +
						'onClick="Calendar_Calendar_Js.deleteCalendarEvent(\'' + event.id +
						'\',\'Events\',' + event.recurringcheck + ');" title="' + app.vtranslate('JS_DELETE') + '">' +
						'&nbsp;&nbsp;<i class="fa fa-trash"></i>' +
						'</span>' +
						'<span class="pull-right cursorPointer" ' +
						'onClick="Calendar_Calendar_Js.editCalendarEvent(\'' + event.id +
						'\',' + event.recurringcheck + ');" title="' + app.vtranslate('JS_EDIT') + '">' +
						'&nbsp;&nbsp;<i class="fa fa-pencil"></i>' +
						'</span>' + 
						'<span class="pull-right cursorPointer" ' +
						'onClick="Calendar_Calendar_Js.copyCalendarEvent(\'' + event.id +
						'\',' + event.recurringcheck + ');" title="' + app.vtranslate('JS_COPY') + '">' +
						'&nbsp;&nbsp;<i class="fa fa-copy"></i>' +
						'</span>';

				if (event.status !== 'Held') {
					actionsMarkup += '' +
							'<span class="pull-right cursorPointer"' +
							'onClick="Calendar_Calendar_Js.markAsHeld(\'' + event.id + '\');" title="' + app.vtranslate('JS_MARK_AS_HELD') + '">' +
							'&nbsp;&nbsp;<i class="fa fa-check"></i>' +
							'</span>';
				} else if (event.status === 'Held') {
					actionsMarkup += '' +
							'<span class="pull-right cursorPointer" ' +
							'onClick="Calendar_Calendar_Js.holdFollowUp(\'' + event.id + '\');" title="' + app.vtranslate('JS_CREATE_FOLLOW_UP') + '">' +
							'&nbsp;&nbsp;<i class="fa fa-flag"></i>' +
							'</span>';
				}
				actionsMarkup +=
						'</div>';
				return actionsMarkup;
			},
			getAgendaEventTitle: function (event) {
				return event.status === 'Held' ?
						'<span><strike>' + event.title + '</strike><span>' :
						'<span>' + event.title + '</span>';
			},
			generateEventHTML: function (event) {
				var html = '' +
						'<div class="agenda-event-wrapper" data-event-id="' + event.id + '">' +
						'<div class="agenda-event-info">' +
						'<div class="agenda-event-time verticalAlignMiddle">' +
						'<div>' + event.startTime + ' - ' + event.endTime + '</div>' +
						'</div>' +
						'<div class="agenda-more-details cursorPointer verticalAlignMiddle">' +
						'<i class="fa fa-plus-square-o" title=' + app.vtranslate('JS_DETAILS') + '></i>' +
						'</div>' +
						'<div class="agenda-event-title verticalAlignMiddle">&nbsp;' +
						'<i class="' + thisInstance.getActivityTypeClassName(event.activitytype) + '" title="' + app.vtranslate(event.activitytype) + '"></i>&nbsp;&nbsp;&nbsp;';
				if (event.recurringcheck) {
					html += '<i class="fa fa-repeat" style="font-size:10px;" title="' + app.vtranslate('JS_RECURRING_EVENT') + '"></i>&nbsp;';
				}
				html += this.getAgendaEventTitle(event) +
						'</div>' +
						'<div class="agenda-event-status verticalAlignMiddle">' + app.vtranslate(event.status) + '</div>' +
						this.getAgendaActionsHTML(event) +
						'</div>' +
						'<div class="agenda-event-details hide verticalAlignMiddle">' +
						'</div>' +
						'</div>';
				return html;
			},
			displayNoEventsMessage: function () {
				jQuery('.agendaListViewBody').each(function (i, element) {
					var currentList = jQuery(element);
					var eventsElements = currentList.find('.agenda-event-wrapper');
					if (!eventsElements.length) {
						currentList.html(
								'<div class="agendaNoEvents">' +
								app.vtranslate('JS_NO_EVENTS_F0R_THE_DAY') +
								'</div>'
								);
					}
				});
			},
			renderVtAgendaEvents: function () {
				var fcInstance = this;
				var currentDate = moment(this.intervalStart);
				thisInstance.fetchAgendaEvents(currentDate).then(function (agendaEvents) {
//cleanup before render
					jQuery('.agendaListViewBody').empty();
					for (var key in agendaEvents) {
						var container = jQuery('[data-date="' + key + '"]');
						var containerBody = container.find('.agendaListViewBody');
						var eventsPerDay = agendaEvents[key];
						jQuery.each(eventsPerDay, function (i, event) {
							containerBody.append(fcInstance.generateEventHTML(event));
						});
					}
					fcInstance.displayNoEventsMessage();
				});
			}
		});

		FC.views.vtAgendaList = agendaListView;
	},
	registerGotoDateButtonAction: function (navigationsContainer) {
		var thisInstance = this;
		var gotoButton = navigationsContainer.find('.vt-goto-date');
		var lang = (navigator.language) ? navigator.language : navigator.userLanguage;
		gotoButton.datepicker({
			'autoclose': true,
			'todayBtn': "linked",
			'format': thisInstance.getUserPrefered('date_format'),
			'language': lang,
		}).on('changeDate', function (e) {
			thisInstance.getCalendarViewContainer().fullCalendar('gotoDate', moment(e.date));
		});
	},
	addGotoDateButton: function () {
		var navigationsContainer = this.getCalendarViewContainer().find(
				'.fc-right > .fc-button-group'
				);
		var buttonHTML = '' +
				'<button type="button" class="vt-goto-date fc-button fc-state-default fc-corner-left">' +
				'<span class="fa fa-calendar"></span>' +
				'</button>';
		navigationsContainer.find('.fc-prev-button').after(buttonHTML);
		this.registerGotoDateButtonAction(navigationsContainer);
	},
	performPostRenderCustomizations: function () {
		this.addGotoDateButton();
		
	},
	initializeCalendar: function () {
		this.registerAgendaListView();
		var calendarConfigs = this.getCalendarConfigs();
		this.getCalendarViewContainer().fullCalendar(calendarConfigs);
		this.performPostRenderCustomizations();
		this.performSidebarEssentialsRecognition();
	},
	performSidebarEssentialsRecognition: function () {
		app.event.on("Vtiger.Post.MenuToggle", function () {
			var essentialsHidden = jQuery(".sidebar-essentials").hasClass("hide");
			if (essentialsHidden) {
				Calendar_Calendar_Js.sideBarEssentialsState = 'hidden';
			} else {
				Calendar_Calendar_Js.sideBarEssentialsState = 'show';
			}
		});
		var essentialsHidden = jQuery(".sidebar-essentials").hasClass("hide");
		if (essentialsHidden) {
			Calendar_Calendar_Js.sideBarEssentialsState = 'hidden';
		} else {
			Calendar_Calendar_Js.sideBarEssentialsState = 'show';
		}
	},
	registerEvents: function () {
		this._super();
		this.initializeCalendar();
		this.registerWidgetPostLoadEvent();
		this.initializeWidgets();
		this.registerPostQuickCreateSaveEvent();
	}
});
