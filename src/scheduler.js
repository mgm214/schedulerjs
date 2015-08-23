;(function($, window, document, undefined){
    function Scheduler(element, options){
        this.element = element;
        this.opts = $.extend({}, Scheduler.defaults, options);

        /** Smallest time step in minutes */
        this.minMinutes = 0;

        /** Largest time step in minutes */
        this.maxMinutes = 1440;

        this.start = 0;

        this.end = 0;

        /** List of time steps given in minutes */
        this.stepsMinutes = [];

        /** List of names with appointments */
        this.nameList = [];

        this.createView();
        this.setListeners();

        this.start = this.minMinutes + 60;
        this.end = this.start + 60;

        if(this.opts.start !== undefined){
            this.start = this.timeStrToMinutes(this.opts.start);
        }
        if(this.opts.end !== undefined){
            this.end = this.timeStrToMinutes(this.opts.end);
        }

        this.updateSelector();
    }

    Scheduler.defaults = {
        'pixelsPerHour': 200,
        'snapTo': 5,
        'steps': ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
        'list': []
    };

    Scheduler.prototype.public = {
        "selected": function(){
            return {
                'start': this.minutesToTimeStr(this.start),
                'end': this.minutesToTimeStr(this.end)
            }
        },
        "start": function(startTime){
            if(startTime !== undefined){
                this.start = this.timeStrToMinutes(startTime);
                this.updateSelector();
            }

            return this.minutesToTimeStr(this.start);
        },
        "end": function(endTime){
            if(endTime !== undefined){
                this.end = this.timeStrToMinutes(endTime);
                this.updateSelector();
            }

            return this.minutesToTimeStr(this.end);
        },
        "update": function(list){
            this.nameList = [];
            this.opts.list = list;
            this.createView();
            this.updateSelector();
        }
    };

    Scheduler.prototype.setListeners = function(){
        var that = this;

        var $selector = null;
        var $edgeLeft = null;
        var $edgeRight = null;
        var offset = null;

        this.element.on("mousemove", function(e) {
            var newStart, newEnd;
            if($selector){
                newStart = that.pageOffsetToMinutes(e.pageX - offset);
                that.moveSelector(newStart - that.start);
                that.updateSelector();
            }else if($edgeLeft){
                newStart = that.pageOffsetToMinutes(e.pageX - offset);
                that.resizeSelectorLeft(newStart - that.start);
                that.updateSelector();
            }else if($edgeRight){
                newEnd = that.pageOffsetToMinutes(e.pageX - offset);
                that.resizeSelectorRight(newEnd - that.end);
                that.updateSelector();
            }
        });


        this.element.on("mousedown", ".sjs-selector", function (e) {
            e.stopPropagation();
            $selector =  $(this);
            $edgeLeft = null;
            $edgeRight = null;
            offset = e.offsetX;
        });
        this.element.on('mousedown', '.sjs-selector-left', function(e){
            e.stopPropagation();
            $selector = null;
            $edgeLeft = $(this);
            $edgeRight = null;
            offset = e.offsetX;
        });
        this.element.on('mousedown', '.sjs-selector-right', function(e){
            e.stopPropagation();
            $selector = null;
            $edgeLeft = null;
            $edgeRight = $(this);
            offset = e.offsetX - $edgeRight.width();
        });

        this.element.on("mouseup", function (e){
            if($selector || $edgeLeft || $edgeRight){
                that.snapSelector();
                $selector = null;
                $edgeLeft = null;
                $edgeRight = null;
            }
        });
        this.element.on("mouseleave", function(e){
            if($selector || $edgeLeft || $edgeRight){
                that.snapSelector();
                $selector = null;
                $edgeLeft = null;
                $edgeRight = null;
            }
        });
    };

    Scheduler.prototype.updateSelector = function(){
        var $selector = this.element.find('.sjs-selector');

        $selector.offset({left: this.minutesToPageOffset(this.start)});
        $selector.width(this.minutesToPixels(this.end-this.start));

        $selector.find('.sjs-selector-text').html(
            this.minutesToTimeStr(this.start) +
            ' - ' +
            this.minutesToTimeStr(this.end)
        );
    };

    Scheduler.prototype.snapSelector = function(){
        var startSnapOffset = this.start%this.opts.snapTo;
        var endSnapOffset = this.end%this.opts.snapTo;

        startSnapOffset > this.opts.snapTo/2 ?
            this.start += this.opts.snapTo - startSnapOffset :
            this.start -= startSnapOffset;

        endSnapOffset > this.opts.snapTo/2 ?
            this.end += this.opts.snapTo - endSnapOffset :
            this.end -= endSnapOffset;

        this.updateSelector();
    };

    Scheduler.prototype.resizeSelectorLeft = function(deltaMinutes){
       this.start += deltaMinutes;

        if(this.start < this.minMinutes){
            this.start = this.minMinutes;
        }
        if(this.end - this.start < this.opts.snapTo){
            this.start = this.end - this.opts.snapTo;
        }
    };
    Scheduler.prototype.resizeSelectorRight = function(deltaMinutes){
        this.end += deltaMinutes;

        if(this.end > this.maxMinutes){
            this.end = this.maxMinutes;
        }
        if(this.end - this.start < this.opts.snapTo){
            this.end = this.start + this.opts.snapTo;
        }
    };
    Scheduler.prototype.moveSelector = function(deltaMinutes){
        this.start += deltaMinutes;
        this.end += deltaMinutes;

        if(this.start < this.minMinutes){
            this.end += this.minMinutes - this.start;
            this.start = this.minMinutes;
        }

        if(this.end > this.maxMinutes){
            this.start += this.maxMinutes - this.end;
            this.end = this.maxMinutes;
        }

        if(this.end - this.start < this.opts.snapTo){
            this.end = this.start + this.opts.snapTo;
        }
    };

    Scheduler.prototype.pageOffsetToTimeStr = function(pageOffset){
        return this.minutesToTimeStr(this.pageOffsetToMinutes(pageOffset));
    };
    Scheduler.prototype.timeStrToPageOffset = function(timeStr){
        return this.minutesToPageOffset(this.timeStrToMinutes(timeStr));
    };
    Scheduler.prototype.pageOffsetToMinutes = function(pageOffset){
        return this.pixelsToMinutes(pageOffset - this.getGridOffset()) + this.minMinutes;
    };
    Scheduler.prototype.minutesToPageOffset = function(minutes){
        return this.minutesToPixels(minutes - this.minMinutes) + this.getGridOffset();
    };
    Scheduler.prototype.getGridOffset = function(){
        return this.element.find('.sjs-grid').first().offset().left;
    };
    Scheduler.prototype.minutesToPixels = function(minutes){
        return Math.round(minutes*this.opts.pixelsPerHour/60);
    };
    Scheduler.prototype.pixelsToMinutes = function(pixels){
        return Math.round(60*pixels/this.opts.pixelsPerHour);
    };
    Scheduler.prototype.timeStrToMinutes = function(str){
        var split = str.split(':');
        return parseInt(split[0]) * 60 + parseInt(split[1]);
    };
    Scheduler.prototype.minutesToTimeStr = function(minutes){
        var hours = Math.floor(minutes/60);
        var minutesInHour = minutes - hours*60;
        var str = '';

        if(hours < 10){
            str = '0' + String(hours);
        }else{
            str = String(hours);
        }

        if(minutesInHour < 10){
            str += ':0' + String(minutesInHour);
        }else{
            str += ':' + String(minutesInHour);
        }

        return str;
    };

    /**
     * Creates the grid overlay row data that will be used when rendering the layout
     */
    Scheduler.prototype.getGridOverlayRowData = function(){
        var gridOverlayRows = [];
        for (var i = 0; i <  this.opts.list.length; i++) {
            var prevEnd = this.minMinutes;

            var gridOverlayCols = [];
            for (var j = 0; j <  this.opts.list[i].appointments.length; j++) {
                var appointment =  this.opts.list[i].appointments[j];

                var minutesStart = this.timeStrToMinutes(appointment.start);
                var minutesEnd = this.timeStrToMinutes(appointment.end);

                if(minutesEnd < minutesStart){
                    continue;
                }

                if(minutesEnd > this.maxMinutes){
                    minutesEnd = this.maxMinutes;
                }

                if(minutesStart < this.minMinutes){
                    minutesStart = this.minMinutes;
                }

                var length = minutesEnd - minutesStart;

                var lengthSinceLast = minutesStart - prevEnd;
                prevEnd = minutesEnd;

                gridOverlayCols.push({
                    'width': this.minutesToPixels(length),
                    'margin': this.minutesToPixels(lengthSinceLast),
                    'class': appointment.class === undefined ? '' : appointment.class,
                    'title': appointment.title,
                    'start': appointment.start,
                    'end': appointment.end
                });
            }

            gridOverlayRows.push({
                'grid-overlay-cols': gridOverlayCols
            });
        }

        return gridOverlayRows;
    };

    Scheduler.prototype.createView = function(){
        this.nameList = this.opts.list.map(function(elem){
            return {name: elem.name};
        });

        this.stepsMinutes = this.opts.steps.map(this.timeStrToMinutes);
        this.minMinutes = Math.min.apply(Math, this.stepsMinutes);
        this.maxMinutes = Math.max.apply(Math, this.stepsMinutes);

        var gridColsHead = [];
        var gridCols = [];
        for (var i = 0; i < this.stepsMinutes.length - 1; i++) {
            var length = this.stepsMinutes[i + 1] - this.stepsMinutes[i];
            gridColsHead.push({'width': this.minutesToPixels(length), 'time': this.opts.steps[i]});
            gridCols.push({'width': this.minutesToPixels(length)});
        }

        var gridRows = [];
        for(i = 0; i < this.opts.list.length; i++){
            gridRows.push({'grid-cols': gridCols});
        }

        this.element.html(schedulerjsTemplates.layout({
            'names': this.nameList,
            'grid-cols-head': gridColsHead,
            'grid-rows': gridRows,
            'grid-overlay-rows': this.getGridOverlayRowData()
        }));

        // Since the grid and grid overlay are absolutely positioned, they
        // don't take up any height. Therefore we find the height of the grid here,
        // and use a dummy div to fill the area with that height
        // Also adding some pixels to accommodate the selectors
        var gridHeight = this.element.find('.sjs-grid').first().height();
        var extraHeightForSelectors = 22; /* Should be big enough to make room for the selector boxes */
        var selectorsMarginTop = 15; /* Should equal the margin-top of the selectors */
        this.element.find('.sjs-fill-height').first().height(gridHeight + extraHeightForSelectors);
        this.element.find('.sjs-selector').height(gridHeight + extraHeightForSelectors - selectorsMarginTop);
    };

    $.fn.schedulerjs = function(opts){
        var args = Array.prototype.slice.call(arguments, 1);
        var retVal;
        var pluginName = 'schedulerjs';

        this.each(function () {
            var plugin;

            if (!$.data(this, pluginName)) {
                if(typeof opts !== 'object'){
                    $.error(pluginName + " needs an options object for initialization.");
                    return;
                }
                $.data(this, pluginName,
                    new Scheduler( $(this), opts ));
            }

            plugin = $.data(this, pluginName);

            if(typeof opts !== 'object') {
                if(plugin.public[opts]){
                    retVal = plugin.public[opts].apply(plugin, args);
                }else{
                    $.error( 'Method ' +  opts + ' does not exist in ' + pluginName );
                }
            }
        });

        if(retVal !== undefined){
            return retVal;
        }

        return this;
    };
})(jQuery, window, document);
