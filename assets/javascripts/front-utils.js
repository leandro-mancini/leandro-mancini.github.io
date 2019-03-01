/*! Tablesaw - v2.0.1 - 2015-10-09
* https://github.com/filamentgroup/tablesaw
* Copyright (c) 2015 Filament Group; Licensed MIT */
/*
* tablesaw: A set of plugins for responsive tables
* Stack and Column Toggle tables
* Copyright (c) 2013 Filament Group, Inc.
* MIT License
*/

if( typeof Tablesaw === "undefined" ) {
    Tablesaw = {
        i18n: {
            modes: [ 'Stack', 'Swipe', 'Toggle' ],
            columns: 'Col<span class=\"a11y-sm\">umn</span>s',
            columnBtnText: 'Columns',
            columnsDialogError: 'No eligible columns.',
            sort: 'Sort'
        },
        // cut the mustard
        mustard: 'querySelector' in document &&
            ( !window.blackberry || window.WebKitPoint ) &&
            !window.operamini
    };
}
if( !Tablesaw.config ) {
    Tablesaw.config = {};
}
if( Tablesaw.mustard ) {
    jQuery( document.documentElement ).addClass( 'tablesaw-enhanced' );
}

;(function( $ ) {
    var pluginName = "table",
        classes = {
            toolbar: "tablesaw-bar"
        },
        events = {
            create: "tablesawcreate",
            destroy: "tablesawdestroy",
            refresh: "tablesawrefresh"
        },
        defaultMode = "stack",
        initSelector = "table[data-tablesaw-mode],table[data-tablesaw-sortable]";

    var Table = function( element ) {
        if( !element ) {
            throw new Error( "Tablesaw requires an element." );
        }

        this.table = element;
        this.$table = $( element );

        this.mode = this.$table.attr( "data-tablesaw-mode" ) || defaultMode;

        this.init();
    };

    Table.prototype.init = function() {
        // assign an id if there is none
        if ( !this.$table.attr( "id" ) ) {
            this.$table.attr( "id", pluginName + "-" + Math.round( Math.random() * 10000 ) );
        }

        this.createToolbar();

        var colstart = this._initCells();

        this.$table.trigger( events.create, [ this, colstart ] );
    };

    Table.prototype._initCells = function() {
        var colstart,
            thrs = this.table.querySelectorAll( "thead tr" ),
            self = this;

        $( thrs ).each( function(){
            var coltally = 0;

            $( this ).children().each( function(){
                var span = parseInt( this.getAttribute( "colspan" ), 10 ),
                    sel = ":nth-child(" + ( coltally + 1 ) + ")";

                colstart = coltally + 1;

                if( span ){
                    for( var k = 0; k < span - 1; k++ ){
                        coltally++;
                        sel += ", :nth-child(" + ( coltally + 1 ) + ")";
                    }
                }

                // Store "cells" data on header as a reference to all cells in the same column as this TH
                this.cells = self.$table.find("tr").not( thrs[0] ).not( this ).children().filter( sel );
                coltally++;
            });
        });

        return colstart;
    };

    Table.prototype.refresh = function() {
        this._initCells();

        this.$table.trigger( events.refresh );
    };

    Table.prototype.createToolbar = function() {
        // Insert the toolbar
        // TODO move this into a separate component
        var $toolbar = this.$table.prev().filter( '.' + classes.toolbar );
        if( !$toolbar.length ) {
            $toolbar = $( '<div>' )
                .addClass( classes.toolbar )
                .insertBefore( this.$table );
        }
        this.$toolbar = $toolbar;

        if( this.mode ) {
            this.$toolbar.addClass( 'mode-' + this.mode );
        }
    };

    Table.prototype.destroy = function() {
        // Donâ€™t remove the toolbar. Some of the table features are not yet destroy-friendly.
        this.$table.prev().filter( '.' + classes.toolbar ).each(function() {
            this.className = this.className.replace( /\bmode\-\w*\b/gi, '' );
        });

        var tableId = this.$table.attr( 'id' );
        $( document ).unbind( "." + tableId );
        $( window ).unbind( "." + tableId );

        // other plugins
        this.$table.trigger( events.destroy, [ this ] );

        this.$table.removeAttr( 'data-tablesaw-mode' );

        this.$table.removeData( pluginName );
    };

    // Collection method.
    $.fn[ pluginName ] = function() {
        return this.each( function() {
            var $t = $( this );

            if( $t.data( pluginName ) ){
                return;
            }

            var table = new Table( this );
            $t.data( pluginName, table );
        });
    };

    $( document ).on( "enhance.tablesaw", function( e ) {
        // Cut the mustard
        if( Tablesaw.mustard ) {
            $( e.target ).find( initSelector )[ pluginName ]();
        }
    });

}( jQuery ));

;(function( win, $, undefined ){

    var classes = {
        stackTable: 'tablesaw-stack',
        cellLabels: 'tablesaw-cell-label',
        cellContentLabels: 'tablesaw-cell-content'
    };

    var data = {
        obj: 'tablesaw-stack'
    };

    var attrs = {
        labelless: 'data-tablesaw-no-labels',
        hideempty: 'data-tablesaw-hide-empty'
    };

    var Stack = function( element ) {

        this.$table = $( element );

        this.labelless = this.$table.is( '[' + attrs.labelless + ']' );
        this.hideempty = this.$table.is( '[' + attrs.hideempty + ']' );

        if( !this.labelless ) {
            // allHeaders references headers, plus all THs in the thead, which may include several rows, or not
            this.allHeaders = this.$table.find( "th" );
        }

        this.$table.data( data.obj, this );
    };

    Stack.prototype.init = function( colstart ) {
        this.$table.addClass( classes.stackTable );

        if( this.labelless ) {
            return;
        }

        // get headers in reverse order so that top-level headers are appended last
        var reverseHeaders = $( this.allHeaders );
        var hideempty = this.hideempty;
        
        // create the hide/show toggles
        reverseHeaders.each(function(){
            var $t = $( this ),
                $cells = $( this.cells ).filter(function() {
                    return !$( this ).parent().is( "[" + attrs.labelless + "]" ) && ( !hideempty || !$( this ).is( ":empty" ) );
                }),
                hierarchyClass = $cells.not( this ).filter( "thead th" ).length && " tablesaw-cell-label-top",
                // TODO reduce coupling with sortable
                $sortableButton = $t.find( ".tablesaw-sortable-btn" ),
                html = $sortableButton.length ? $sortableButton.html() : $t.html();

            if( html !== "" ){
                if( hierarchyClass ){
                    var iteration = parseInt( $( this ).attr( "colspan" ), 10 ),
                        filter = "";

                    if( iteration ){
                        filter = "td:nth-child("+ iteration +"n + " + ( colstart ) +")";
                    }
                    $cells.filter( filter ).prepend( "<b class='" + classes.cellLabels + hierarchyClass + "'>" + html + "</b>"  );
                } else {
                    $cells.wrapInner( "<span class='" + classes.cellContentLabels + "'></span>" );
                    $cells.prepend( "<b class='" + classes.cellLabels + "'>" + html + "</b>"  );
                }
            }
        });
    };

    Stack.prototype.destroy = function() {
        this.$table.removeClass( classes.stackTable );
        this.$table.find( '.' + classes.cellLabels ).remove();
        this.$table.find( '.' + classes.cellContentLabels ).each(function() {
            $( this ).replaceWith( this.childNodes );
        });
    };

    // on tablecreate, init
    $( document ).on( "tablesawcreate", function( e, Tablesaw, colstart ){
        if( Tablesaw.mode === 'stack' ){
            var table = new Stack( Tablesaw.table );
            table.init( colstart );
        }

    } );

    $( document ).on( "tablesawdestroy", function( e, Tablesaw ){

        if( Tablesaw.mode === 'stack' ){
            $( Tablesaw.table ).data( data.obj ).destroy();
        }

    } );

}( this, jQuery ));
;(function( $ ) {
    var pluginName = "tablesawbtn",
        methods = {
            _create: function(){
                return $( this ).each(function() {
                    $( this )
                        .trigger( "beforecreate." + pluginName )
                        [ pluginName ]( "_init" )
                        .trigger( "create." + pluginName );
                });
            },
            _init: function(){
                var oEl = $( this ),
                    sel = this.getElementsByTagName( "select" )[ 0 ];

                if( sel ) {
                    $( this )
                        .addClass( "btn-select" )
                        [ pluginName ]( "_select", sel );
                }
                return oEl;
            },
            _select: function( sel ) {
                var update = function( oEl, sel ) {
                    var opts = $( sel ).find( "option" ),
                        label, el, children;

                    opts.each(function() {
                        var opt = this;
                        if( opt.selected ) {
                            label = document.createTextNode( opt.text );
                        }
                    });

                    children = oEl.childNodes;
                    if( opts.length > 0 ){
                        for( var i = 0, l = children.length; i < l; i++ ) {
                            el = children[ i ];

                            if( el && el.nodeType === 3 ) {
                                oEl.replaceChild( label, el );
                            }
                        }
                    }
                };

                update( this, sel );
                $( this ).bind( "change refresh", function() {
                    update( this, sel );
                });
            }
        };

    // Collection method.
    $.fn[ pluginName ] = function( arrg, a, b, c ) {
        return this.each(function() {

        // if it's a method
        if( arrg && typeof( arrg ) === "string" ){
            return $.fn[ pluginName ].prototype[ arrg ].call( this, a, b, c );
        }

        // don't re-init
        if( $( this ).data( pluginName + "active" ) ){
            return $( this );
        }

        // otherwise, init

        $( this ).data( pluginName + "active", true );
            $.fn[ pluginName ].prototype._create.call( this );
        });
    };

    // add methods
    $.extend( $.fn[ pluginName ].prototype, methods );

}( jQuery ));
;(function( win, $, undefined ){

    var ColumnToggle = function( element ) {

        this.$table = $( element );

        this.classes = {
            columnToggleTable: 'tablesaw-columntoggle',
            columnBtnContain: 'tablesaw-columntoggle-btnwrap tablesaw-advance',
            columnBtn: 'tablesaw-columntoggle-btn tablesaw-nav-btn down',
            popup: 'tablesaw-columntoggle-popup',
            priorityPrefix: 'tablesaw-priority-',
            // TODO duplicate class, also in tables.js
            toolbar: 'tablesaw-bar'
        };

        // Expose headers and allHeaders properties on the widget
        // headers references the THs within the first TR in the table
        this.headers = this.$table.find( 'tr:first > th' );

        this.$table.data( 'tablesaw-coltoggle', this );
    };

    ColumnToggle.prototype.init = function() {

        var tableId,
            id,
            $menuButton,
            $popup,
            $menu,
            $btnContain,
            self = this;

        this.$table.addClass( this.classes.columnToggleTable );

        tableId = this.$table.attr( "id" );
        id = tableId + "-popup";
        $btnContain = $( "<div class='" + this.classes.columnBtnContain + "'></div>" );
        $menuButton = $( "<a href='#" + id + "' class='btn btn-micro " + this.classes.columnBtn +"' data-popup-link>" +
                                        "<span>" + Tablesaw.i18n.columnBtnText + "</span></a>" );
        $popup = $( "<div class='dialog-table-coltoggle " + this.classes.popup + "' id='" + id + "'></div>" );
        $menu = $( "<div class='btn-group'></div>" );

        var hasNonPersistentHeaders = false;
        $( this.headers ).not( "td" ).each( function() {
            var $this = $( this ),
                priority = $this.attr("data-tablesaw-priority"),
                $cells = $this.add( this.cells );

            if( priority && priority !== "persist" ) {
                $cells.addClass( self.classes.priorityPrefix + priority );

                $("<label><input type='checkbox' checked>" + $this.text() + "</label>" )
                    .appendTo( $menu )
                    .children( 0 )
                    .data( "cells", $cells );

                hasNonPersistentHeaders = true;
            }
        });

        if( !hasNonPersistentHeaders ) {
            $menu.append( '<label>' + Tablesaw.i18n.columnsDialogError + '</label>' );
        }

        $menu.appendTo( $popup );

        // bind change event listeners to inputs - TODO: move to a private method?
        $menu.find( 'input[type="checkbox"]' ).on( "change", function(e) {
            var checked = e.target.checked;

            $( e.target ).data( "cells" )
                .toggleClass( "tablesaw-cell-hidden", !checked )
                .toggleClass( "tablesaw-cell-visible", checked );

            self.$table.trigger( 'tablesawcolumns' );
        });

        $menuButton.appendTo( $btnContain );
        $btnContain.appendTo( this.$table.prev().filter( '.' + this.classes.toolbar ) );

        var closeTimeout;
        function openPopup() {
            $btnContain.addClass( 'visible' );
            $menuButton.removeClass( 'down' ).addClass( 'up' );

            $( document ).unbind( 'click.' + tableId, closePopup );

            window.clearTimeout( closeTimeout );
            closeTimeout = window.setTimeout(function() {
                $( document ).one( 'click.' + tableId, closePopup );
            }, 15 );
        }

        function closePopup( event ) {
            // Click came from inside the popup, ignore.
            if( event && $( event.target ).closest( "." + self.classes.popup ).length ) {
                return;
            }

            $( document ).unbind( 'click.' + tableId );
            $menuButton.removeClass( 'up' ).addClass( 'down' );
            $btnContain.removeClass( 'visible' );
        }

        $menuButton.on( "click.tablesaw", function( event ) {
            event.preventDefault();

            if( !$btnContain.is( ".visible" ) ) {
                openPopup();
            } else {
                closePopup();
            }
        });

        $popup.appendTo( $btnContain );

        this.$menu = $menu;

        $(window).on( "resize." + tableId, function(){
            self.refreshToggle();
        });

        this.refreshToggle();
    };

    ColumnToggle.prototype.refreshToggle = function() {
        this.$menu.find( "input" ).each( function() {
            var $this = $( this );

            this.checked = $this.data( "cells" ).eq( 0 ).css( "display" ) === "table-cell";
        });
    };

    ColumnToggle.prototype.refreshPriority = function(){
        var self = this;
        $(this.headers).not( "td" ).each( function() {
            var $this = $( this ),
                priority = $this.attr("data-tablesaw-priority"),
                $cells = $this.add( this.cells );

            if( priority && priority !== "persist" ) {
                $cells.addClass( self.classes.priorityPrefix + priority );
            }
        });
    };

    ColumnToggle.prototype.destroy = function() {
        // table toolbars, document and window .tableId events
        // removed in parent tables.js destroy method

        this.$table.removeClass( this.classes.columnToggleTable );
        this.$table.find( 'th, td' ).each(function() {
            var $cell = $( this );
            $cell.removeClass( 'tablesaw-cell-hidden' )
                .removeClass( 'tablesaw-cell-visible' );

            this.className = this.className.replace( /\bui\-table\-priority\-\d\b/g, '' );
        });
    };

    // on tablecreate, init
    $( document ).on( "tablesawcreate", function( e, Tablesaw ){

        if( Tablesaw.mode === 'columntoggle' ){
            var table = new ColumnToggle( Tablesaw.table );
            table.init();
        }

    } );

    $( document ).on( "tablesawdestroy", function( e, Tablesaw ){
        if( Tablesaw.mode === 'columntoggle' ){
            $( Tablesaw.table ).data( 'tablesaw-coltoggle' ).destroy();
        }
    } );

}( this, jQuery ));
;(function( win, $, undefined ){

    $.extend( Tablesaw.config, {
        swipe: {
            horizontalThreshold: 15,
            verticalThreshold: 30
        }
    });

    function isIE8() {
        var div = document.createElement('div'),
            all = div.getElementsByTagName('i');

        div.innerHTML = '<!--[if lte IE 8]><i></i><![endif]-->';

        return !!all.length;
    }

    function createSwipeTable( $table ){

        var $btns = $( "<div class='tablesaw-advance'></div>" ),
            $prevBtn = $( "<a href='#' class='tablesaw-nav-btn btn btn-micro left' title='Previous Column'></a>" ).appendTo( $btns ),
            $nextBtn = $( "<a href='#' class='tablesaw-nav-btn btn btn-micro right' title='Next Column'></a>" ).appendTo( $btns ),
            hideBtn = 'disabled',
            persistWidths = 'tablesaw-fix-persist',
            $headerCells = $table.find( "thead th" ),
            $headerCellsNoPersist = $headerCells.not( '[data-tablesaw-priority="persist"]' ),
            headerWidths = [],
            $head = $( document.head || 'head' ),
            tableId = $table.attr( 'id' ),
            // TODO switch this to an nth-child feature test
            supportsNthChild = !isIE8();

        if( !$headerCells.length ) {
            throw new Error( "tablesaw swipe: no header cells found. Are you using <th> inside of <thead>?" );
        }

        // Calculate initial widths
        $table.css('width', 'auto');
        $headerCells.each(function() {
            headerWidths.push( $( this ).outerWidth() );
        });
        $table.css( 'width', '' );

        $btns.appendTo( $table.prev().filter( '.tablesaw-bar' ) );

        $table.addClass( "tablesaw-swipe" );

        if( !tableId ) {
            tableId = 'tableswipe-' + Math.round( Math.random() * 10000 );
            $table.attr( 'id', tableId );
        }

        function $getCells( headerCell ) {
            return $( headerCell.cells ).add( headerCell );
        }

        function showColumn( headerCell ) {
            $getCells( headerCell ).removeClass( 'tablesaw-cell-hidden' );
        }

        function hideColumn( headerCell ) {
            $getCells( headerCell ).addClass( 'tablesaw-cell-hidden' );
        }

        function persistColumn( headerCell ) {
            $getCells( headerCell ).addClass( 'tablesaw-cell-persist' );
        }

        function isPersistent( headerCell ) {
            return $( headerCell ).is( '[data-tablesaw-priority="persist"]' );
        }

        function unmaintainWidths() {
            $table.removeClass( persistWidths );
            $( '#' + tableId + '-persist' ).remove();
        }

        function maintainWidths() {
            var prefix = '#' + tableId + '.tablesaw-swipe ',
                styles = [],
                tableWidth = $table.width(),
                hash = [],
                newHash;

            $headerCells.each(function( index ) {
                var width;
                if( isPersistent( this ) ) {
                    width = $( this ).outerWidth();

                    // Only save width on non-greedy columns (take up less than 75% of table width)
                    if( width < tableWidth * 0.75 ) {
                        hash.push( index + '-' + width );
                        styles.push( prefix + ' .tablesaw-cell-persist:nth-child(' + ( index + 1 ) + ') { width: ' + width + 'px; }' );
                    }
                }
            });
            newHash = hash.join( '_' );

            $table.addClass( persistWidths );

            var $style = $( '#' + tableId + '-persist' );
            // If style element not yet added OR if the widths have changed
            if( !$style.length || $style.data( 'hash' ) !== newHash ) {
                // Remove existing
                $style.remove();

                if( styles.length ) {
                    $( '<style>' + styles.join( "\n" ) + '</style>' )
                        .attr( 'id', tableId + '-persist' )
                        .data( 'hash', newHash )
                        .appendTo( $head );
                }
            }
        }

        function getNext(){
            var next = [],
                checkFound;

            $headerCellsNoPersist.each(function( i ) {
                var $t = $( this ),
                    isHidden = $t.css( "display" ) === "none" || $t.is( ".tablesaw-cell-hidden" );

                if( !isHidden && !checkFound ) {
                    checkFound = true;
                    next[ 0 ] = i;
                } else if( isHidden && checkFound ) {
                    next[ 1 ] = i;

                    return false;
                }
            });

            return next;
        }

        function getPrev(){
            var next = getNext();
            return [ next[ 1 ] - 1 , next[ 0 ] - 1 ];
        }

        function nextpair( fwd ){
            return fwd ? getNext() : getPrev();
        }

        function canAdvance( pair ){
            return pair[ 1 ] > -1 && pair[ 1 ] < $headerCellsNoPersist.length;
        }

        function matchesMedia() {
            var matchMedia = $table.attr( "data-tablesaw-swipe-media" );
            return !matchMedia || ( "matchMedia" in win ) && win.matchMedia( matchMedia ).matches;
        }

        function fakeBreakpoints() {
            if( !matchesMedia() ) {
                return;
            }

            var extraPaddingPixels = 20,
                containerWidth = $table.parent().width(),
                persist = [],
                sum = 0,
                sums = [],
                visibleNonPersistantCount = $headerCells.length;

            $headerCells.each(function( index ) {
                var $t = $( this ),
                    isPersist = $t.is( '[data-tablesaw-priority="persist"]' );

                persist.push( isPersist );

                sum += headerWidths[ index ] + ( isPersist ? 0 : extraPaddingPixels );
                sums.push( sum );

                // is persistent or is hidden
                if( isPersist || sum > containerWidth ) {
                    visibleNonPersistantCount--;
                }
            });

            var needsNonPersistentColumn = visibleNonPersistantCount === 0;

            $headerCells.each(function( index ) {
                if( persist[ index ] ) {

                    // for visual box-shadow
                    persistColumn( this );
                    return;
                }

                if( sums[ index ] <= containerWidth || needsNonPersistentColumn ) {
                    needsNonPersistentColumn = false;
                    showColumn( this );
                } else {
                    hideColumn( this );
                }
            });

            if( supportsNthChild ) {
                unmaintainWidths();
            }
            $table.trigger( 'tablesawcolumns' );
        }

        function advance( fwd ){
            var pair = nextpair( fwd );
            if( canAdvance( pair ) ){
                if( isNaN( pair[ 0 ] ) ){
                    if( fwd ){
                        pair[0] = 0;
                    }
                    else {
                        pair[0] = $headerCellsNoPersist.length - 1;
                    }
                }

                if( supportsNthChild ) {
                    maintainWidths();
                }

                hideColumn( $headerCellsNoPersist.get( pair[ 0 ] ) );
                showColumn( $headerCellsNoPersist.get( pair[ 1 ] ) );

                $table.trigger( 'tablesawcolumns' );
            }
        }

        $prevBtn.add( $nextBtn ).click(function( e ){
            advance( !!$( e.target ).closest( $nextBtn ).length );
            e.preventDefault();
        });

        function getCoord( event, key ) {
            return ( event.touches || event.originalEvent.touches )[ 0 ][ key ];
        }

        $table
            .bind( "touchstart.swipetoggle", function( e ){
                var originX = getCoord( e, 'pageX' ),
                    originY = getCoord( e, 'pageY' ),
                    x,
                    y;

                $( win ).off( "resize", fakeBreakpoints );

                $( this )
                    .bind( "touchmove", function( e ){
                        x = getCoord( e, 'pageX' );
                        y = getCoord( e, 'pageY' );
                        var cfg = Tablesaw.config.swipe;
                        if( Math.abs( x - originX ) > cfg.horizontalThreshold && Math.abs( y - originY ) < cfg.verticalThreshold ) {
                            e.preventDefault();
                        }
                    })
                    .bind( "touchend.swipetoggle", function(){
                        var cfg = Tablesaw.config.swipe;
                        if( Math.abs( y - originY ) < cfg.verticalThreshold ) {
                            if( x - originX < -1 * cfg.horizontalThreshold ){
                                advance( true );
                            }
                            if( x - originX > cfg.horizontalThreshold ){
                                advance( false );
                            }
                        }

                        window.setTimeout(function() {
                            $( win ).on( "resize", fakeBreakpoints );
                        }, 300);
                        $( this ).unbind( "touchmove touchend" );
                    });

            })
            .bind( "tablesawcolumns.swipetoggle", function(){
                $prevBtn[ canAdvance( getPrev() ) ? "removeClass" : "addClass" ]( hideBtn );
                $nextBtn[ canAdvance( getNext() ) ? "removeClass" : "addClass" ]( hideBtn );
            })
            .bind( "tablesawnext.swipetoggle", function(){
                advance( true );
            } )
            .bind( "tablesawprev.swipetoggle", function(){
                advance( false );
            } )
            .bind( "tablesawdestroy.swipetoggle", function(){
                var $t = $( this );

                $t.removeClass( 'tablesaw-swipe' );
                $t.prev().filter( '.tablesaw-bar' ).find( '.tablesaw-advance' ).remove();
                $( win ).off( "resize", fakeBreakpoints );

                $t.unbind( ".swipetoggle" );
            });

        fakeBreakpoints();
        $( win ).on( "resize", fakeBreakpoints );
    }



    // on tablecreate, init
    $( document ).on( "tablesawcreate", function( e, Tablesaw ){

        if( Tablesaw.mode === 'swipe' ){
            createSwipeTable( Tablesaw.$table );
        }

    } );

}( this, jQuery ));

;(function( $ ) {
    function getSortValue( cell ) {
        return $.map( cell.childNodes, function( el ) {
                var $el = $( el );
                if( $el.is( 'input, select' ) ) {
                    return $el.val();
                } else if( $el.hasClass( 'tablesaw-cell-label' ) ) {
                    return;
                }
                return $.trim( $el.text() );
            }).join( '' );
    }

    var pluginName = "tablesaw-sortable",
        initSelector = "table[data-" + pluginName + "]",
        sortableSwitchSelector = "[data-" + pluginName + "-switch]",
        attrs = {
            defaultCol: "data-tablesaw-sortable-default-col"
        },
        classes = {
            head: pluginName + "-head",
            ascend: pluginName + "-ascending",
            descend: pluginName + "-descending",
            switcher: pluginName + "-switch",
            tableToolbar: 'tablesaw-toolbar',
            sortButton: pluginName + "-btn"
        },
        methods = {
            _create: function( o ){
                return $( this ).each(function() {
                    var init = $( this ).data( "init" + pluginName );
                    if( init ) {
                        return false;
                    }
                    $( this )
                        .data( "init"+ pluginName, true )
                        .trigger( "beforecreate." + pluginName )
                        [ pluginName ]( "_init" , o )
                        .trigger( "create." + pluginName );
                });
            },
            _init: function(){
                var el = $( this ),
                    heads,
                    $switcher;

                var addClassToTable = function(){
                        el.addClass( pluginName );
                    },
                    addClassToHeads = function( h ){
                        $.each( h , function( i , v ){
                            $( v ).addClass( classes.head );
                        });
                    },
                    makeHeadsActionable = function( h , fn ){
                        $.each( h , function( i , v ){
                            var b = $( "<button class='" + classes.sortButton + "'/>" );
                            b.bind( "click" , { col: v } , fn );
                            $( v ).wrapInner( b );
                        });
                    },
                    clearOthers = function( sibs ){
                        $.each( sibs , function( i , v ){
                            var col = $( v );
                            col.removeAttr( attrs.defaultCol );
                            col.removeClass( classes.ascend );
                            col.removeClass( classes.descend );
                        });
                    },
                    headsOnAction = function( e ){
                        if( $( e.target ).is( 'a[href]' ) ) {
                            return;
                        }

                        e.stopPropagation();
                        var head = $( this ).parent(),
                            v = e.data.col,
                            newSortValue = heads.index( head );

                        clearOthers( head.siblings() );
                        if( head.hasClass( classes.descend ) ){
                            el[ pluginName ]( "sortBy" , v , true);
                            newSortValue += '_asc';
                        } else {
                            el[ pluginName ]( "sortBy" , v );
                            newSortValue += '_desc';
                        }
                        if( $switcher ) {
                            $switcher.find( 'select' ).val( newSortValue ).trigger( 'refresh' );
                        }

                        e.preventDefault();
                    },
                    handleDefault = function( heads ){
                        $.each( heads , function( idx , el ){
                            var $el = $( el );
                            if( $el.is( "[" + attrs.defaultCol + "]" ) ){
                                if( !$el.hasClass( classes.descend ) ) {
                                    $el.addClass( classes.ascend );
                                }
                            }
                        });
                    },
                    addSwitcher = function( heads ){
                        $switcher = $( '<div>' ).addClass( classes.switcher ).addClass( classes.tableToolbar ).html(function() {
                            var html = [ '<label>' + Tablesaw.i18n.sort + ':' ];

                            html.push( '<span class="btn btn-small">&#160;<select>' );
                            heads.each(function( j ) {
                                var $t = $( this ),
                                    isDefaultCol = $t.is( "[" + attrs.defaultCol + "]" ),
                                    isDescending = $t.hasClass( classes.descend ),
                                    isNumeric = false;

                                // Check only the first three rows to see if the column is numbers.
                                $( this.cells ).slice( 0, 3 ).each(function() {
                                    if( !isNaN( parseInt( getSortValue( this ), 10 ) ) ) {
                                        isNumeric = true;
                                        return false;
                                    }
                                });

                                html.push( '<option' + ( isDefaultCol && !isDescending ? ' selected' : '' ) + ' value="' + j + '_asc">' + $t.text() + ' ' + ( isNumeric ? '&#x2191;' : '(A-Z)' ) + '</option>' );
                                html.push( '<option' + ( isDefaultCol && isDescending ? ' selected' : '' ) + ' value="' + j + '_desc">' + $t.text() + ' ' + ( isNumeric ? '&#x2193;' : '(Z-A)' ) + '</option>' );
                            });
                            html.push( '</select></span></label>' );

                            return html.join('');
                        });

                        var $toolbar = el.prev().filter( '.tablesaw-bar' ),
                            $firstChild = $toolbar.children().eq( 0 );

                        if( $firstChild.length ) {
                            $switcher.insertBefore( $firstChild );
                        } else {
                            $switcher.appendTo( $toolbar );
                        }
                        $switcher.find( '.btn' ).tablesawbtn();
                        $switcher.find( 'select' ).on( 'change', function() {
                            var val = $( this ).val().split( '_' ),
                                head = heads.eq( val[ 0 ] );

                            clearOthers( head.siblings() );
                            el[ pluginName ]( 'sortBy', head.get( 0 ), val[ 1 ] === 'asc' );
                        });
                    };

                    addClassToTable();
                    heads = el.find( "thead th[data-" + pluginName + "-col]" );
                    addClassToHeads( heads );
                    makeHeadsActionable( heads , headsOnAction );
                    handleDefault( heads );

                    if( el.is( sortableSwitchSelector ) ) {
                        addSwitcher( heads, el.find('tbody tr:nth-child(-n+3)') );
                    }
            },
            getColumnNumber: function( col ){
                return $( col ).prevAll().length;
            },
            getTableRows: function(){
                return $( this ).find( "tbody tr" );
            },
            sortRows: function( rows , colNum , ascending, col ){
                var cells, fn, sorted;
                var getCells = function( rows ){
                        var cells = [];
                        $.each( rows , function( i , r ){
                            cells.push({
                                cell: getSortValue( $( r ).children().get( colNum ) ),
                                rowNum: i
                            });
                        });
                        return cells;
                    },
                    getSortFxn = function( ascending, forceNumeric ){
                        var fn,
                            regex = /[^\-\+\d\.]/g;
                        if( ascending ){
                            fn = function( a , b ){
                                if( forceNumeric || !isNaN( parseFloat( a.cell ) ) ) {
                                    return parseFloat( a.cell.replace( regex, '' ) ) - parseFloat( b.cell.replace( regex, '' ) );
                                } else {
                                    return a.cell.toLowerCase() > b.cell.toLowerCase() ? 1 : -1;
                                }
                            };
                        } else {
                            fn = function( a , b ){
                                if( forceNumeric || !isNaN( parseFloat( a.cell ) ) ) {
                                    return parseFloat( b.cell.replace( regex, '' ) ) - parseFloat( a.cell.replace( regex, '' ) );
                                } else {
                                    return a.cell.toLowerCase() < b.cell.toLowerCase() ? 1 : -1;
                                }
                            };
                        }
                        return fn;
                    },
                    applyToRows = function( sorted , rows ){
                        var newRows = [], i, l, cur;
                        for( i = 0, l = sorted.length ; i < l ; i++ ){
                            cur = sorted[ i ].rowNum;
                            newRows.push( rows[cur] );
                        }
                        return newRows;
                    };

                cells = getCells( rows );
                var customFn = $( col ).data( 'tablesaw-sort' );
                fn = ( customFn && typeof customFn === "function" ? customFn( ascending ) : false ) ||
                    getSortFxn( ascending, $( col ).is( '[data-sortable-numeric]' ) );
                sorted = cells.sort( fn );
                rows = applyToRows( sorted , rows );
                return rows;
            },
            replaceTableRows: function( rows ){
                var el = $( this ),
                    body = el.find( "tbody" );
                body.html( rows );
            },
            makeColDefault: function( col , a ){
                var c = $( col );
                c.attr( attrs.defaultCol , "true" );
                if( a ){
                    c.removeClass( classes.descend );
                    c.addClass( classes.ascend );
                } else {
                    c.removeClass( classes.ascend );
                    c.addClass( classes.descend );
                }
            },
            sortBy: function( col , ascending ){
                var el = $( this ), colNum, rows;

                colNum = el[ pluginName ]( "getColumnNumber" , col );
                rows = el[ pluginName ]( "getTableRows" );
                rows = el[ pluginName ]( "sortRows" , rows , colNum , ascending, col );
                el[ pluginName ]( "replaceTableRows" , rows );
                el[ pluginName ]( "makeColDefault" , col , ascending );
            }
        };

    // Collection method.
    $.fn[ pluginName ] = function( arrg ) {
        var args = Array.prototype.slice.call( arguments , 1),
            returnVal;

        // if it's a method
        if( arrg && typeof( arrg ) === "string" ){
            returnVal = $.fn[ pluginName ].prototype[ arrg ].apply( this[0], args );
            return (typeof returnVal !== "undefined")? returnVal:$(this);
        }
        // check init
        if( !$( this ).data( pluginName + "data" ) ){
            $( this ).data( pluginName + "active", true );
            $.fn[ pluginName ].prototype._create.call( this , arrg );
        }
        return $(this);
    };
    // add methods
    $.extend( $.fn[ pluginName ].prototype, methods );

    $( document ).on( "tablesawcreate", function( e, Tablesaw ) {
        if( Tablesaw.$table.is( initSelector ) ) {
            Tablesaw.$table[ pluginName ]();
        }
    });

}( jQuery ));

;(function( win, $, undefined ){

    var MM = {
        attr: {
            init: 'data-tablesaw-minimap'
        }
    };

    function createMiniMap( $table ){

        var $btns = $( '<div class="tablesaw-advance minimap">' ),
            $dotNav = $( '<ul class="tablesaw-advance-dots">' ).appendTo( $btns ),
            hideDot = 'tablesaw-advance-dots-hide',
            $headerCells = $table.find( 'thead th' );

        // populate dots
        $headerCells.each(function(){
            $dotNav.append( '<li><i></i></li>' );
        });

        $btns.appendTo( $table.prev().filter( '.tablesaw-bar' ) );

        function showMinimap( $table ) {
            var mq = $table.attr( MM.attr.init );
            return !mq || win.matchMedia && win.matchMedia( mq ).matches;
        }

        function showHideNav(){
            if( !showMinimap( $table ) ) {
                $btns.hide();
                return;
            }
            $btns.show();

            // show/hide dots
            var dots = $dotNav.find( "li" ).removeClass( hideDot );
            $table.find( "thead th" ).each(function(i){
                if( $( this ).css( "display" ) === "none" ){
                    dots.eq( i ).addClass( hideDot );
                }
            });
        }

        // run on init and resize
        showHideNav();
        $( win ).on( "resize", showHideNav );


        $table
            .bind( "tablesawcolumns.minimap", function(){
                showHideNav();
            })
            .bind( "tablesawdestroy.minimap", function(){
                var $t = $( this );

                $t.prev().filter( '.tablesaw-bar' ).find( '.tablesaw-advance' ).remove();
                $( win ).off( "resize", showHideNav );

                $t.unbind( ".minimap" );
            });
    }



    // on tablecreate, init
    $( document ).on( "tablesawcreate", function( e, Tablesaw ){

        if( ( Tablesaw.mode === 'swipe' || Tablesaw.mode === 'columntoggle' ) && Tablesaw.$table.is( '[ ' + MM.attr.init + ']' ) ){
            createMiniMap( Tablesaw.$table );
        }

    } );

}( this, jQuery ));

;(function( win, $ ) {

    var S = {
        selectors: {
            init: 'table[data-tablesaw-mode-switch]'
        },
        attributes: {
            excludeMode: 'data-tablesaw-mode-exclude'
        },
        classes: {
            main: 'tablesaw-modeswitch',
            toolbar: 'tablesaw-toolbar'
        },
        modes: [ 'stack', 'swipe', 'columntoggle' ],
        init: function( table ) {
            var $table = $( table ),
                ignoreMode = $table.attr( S.attributes.excludeMode ),
                $toolbar = $table.prev().filter( '.tablesaw-bar' ),
                modeVal = '',
                $switcher = $( '<div>' ).addClass( S.classes.main + ' ' + S.classes.toolbar ).html(function() {
                    var html = [ '<label>' + Tablesaw.i18n.columns + ':' ],
                        dataMode = $table.attr( 'data-tablesaw-mode' ),
                        isSelected;

                    html.push( '<span class="btn btn-small">&#160;<select>' );
                    for( var j=0, k = S.modes.length; j<k; j++ ) {
                        if( ignoreMode && ignoreMode.toLowerCase() === S.modes[ j ] ) {
                            continue;
                        }

                        isSelected = dataMode === S.modes[ j ];

                        if( isSelected ) {
                            modeVal = S.modes[ j ];
                        }

                        html.push( '<option' +
                            ( isSelected ? ' selected' : '' ) +
                            ' value="' + S.modes[ j ] + '">' + Tablesaw.i18n.modes[ j ] + '</option>' );
                    }
                    html.push( '</select></span></label>' );

                    return html.join('');
                });

            var $otherToolbarItems = $toolbar.find( '.tablesaw-advance' ).eq( 0 );
            if( $otherToolbarItems.length ) {
                $switcher.insertBefore( $otherToolbarItems );
            } else {
                $switcher.appendTo( $toolbar );
            }

            $switcher.find( '.btn' ).tablesawbtn();
            $switcher.find( 'select' ).bind( 'change', S.onModeChange );
        },
        onModeChange: function() {
            var $t = $( this ),
                $switcher = $t.closest( '.' + S.classes.main ),
                $table = $t.closest( '.tablesaw-bar' ).nextUntil( $table ).eq( 0 ),
                val = $t.val();

            $switcher.remove();
            $table.data( 'table' ).destroy();

            $table.attr( 'data-tablesaw-mode', val );
            $table.table();
        }
    };

    $( win.document ).on( "tablesawcreate", function( e, Tablesaw ) {
        if( Tablesaw.$table.is( S.selectors.init ) ) {
            S.init( Tablesaw.table );
        }
    });

})( this, jQuery );




/*!
 * jQuery Cookie Plugin v1.4.0
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2013 Klaus Hartl
 * Released under the MIT license
 */
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as anonymous module.
        define(['jquery'], factory);
    } else {
        // Browser globals.
        factory(jQuery);
    }
}(function ($) {

    var pluses = /\+/g;

    function encode(s) {
        return config.raw ? s : encodeURIComponent(s);
    }

    function decode(s) {
        return config.raw ? s : decodeURIComponent(s);
    }

    function stringifyCookieValue(value) {
        return encode(config.json ? JSON.stringify(value) : String(value));
    }

    function parseCookieValue(s) {
        if (s.indexOf('"') === 0) {
            // This is a quoted cookie as according to RFC2068, unescape...
            s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }

        try {
            // Replace server-side written pluses with spaces.
            // If we can't decode the cookie, ignore it, it's unusable.
            // If we can't parse the cookie, ignore it, it's unusable.
            s = decodeURIComponent(s.replace(pluses, ' '));
            return config.json ? JSON.parse(s) : s;
        } catch (e) { }
    }

    function read(s, converter) {
        var value = config.raw ? s : parseCookieValue(s);
        return $.isFunction(converter) ? converter(value) : value;
    }

    var config = $.cookie = function (key, value, options) {

        // Write

        if (value !== undefined && !$.isFunction(value)) {
            options = $.extend({}, config.defaults, options);

            if (typeof options.expires === 'number') {
                var days = options.expires, t = options.expires = new Date();
                t.setTime(+t + days * 864e+5);
            }

            return (document.cookie = [
                encode(key), '=', stringifyCookieValue(value),
                options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
                options.path ? '; path=' + options.path : '',
                options.domain ? '; domain=' + options.domain : '',
                options.secure ? '; secure' : ''
            ].join(''));
        }

        // Read

        var result = key ? undefined : {};

        // To prevent the for loop in the first place assign an empty array
        // in case there are no cookies at all. Also prevents odd result when
        // calling $.cookie().
        var cookies = document.cookie ? document.cookie.split('; ') : [];

        for (var i = 0, l = cookies.length; i < l; i++) {
            var parts = cookies[i].split('=');
            var name = decode(parts.shift());
            var cookie = parts.join('=');

            if (key && key === name) {
                // If second argument (value) is a function it's a converter...
                result = read(cookie, value);
                break;
            }

            // Prevent storing a cookie that we couldn't decode.
            if (!key && (cookie = read(cookie)) !== undefined) {
                result[name] = cookie;
            }
        }

        return result;
    };

    config.defaults = {};

    $.removeCookie = function (key, options) {
        if ($.cookie(key) === undefined) {
            return false;
        }

        // Must not alter options, thus extending a fresh object...
        $.cookie(key, '', $.extend({}, options, { expires: -1 }));
        return !$.cookie(key);
    };

}));


/**
 * jquery.mask.js
 * @version: v1.6.4
 * @author: Igor Escobar
 *
 * Created by Igor Escobar on 2012-03-10. Please report any bug at http://blog.igorescobar.com
 *
 * Copyright (c) 2012 Igor Escobar http://blog.igorescobar.com
 *
 * The MIT License (http://www.opensource.org/licenses/mit-license.php)
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */
/*jshint laxbreak: true */
/* global define */

// UMD (Universal Module Definition) patterns for JavaScript modules that work everywhere.
// https://github.com/umdjs/umd/blob/master/jqueryPlugin.js
(function (factory) {
    if (typeof define === "function" && define.amd) {
        // AMD. Register as an anonymous module.
        define(["jquery"], factory);
    } else {
        // Browser globals
        factory(window.jQuery || window.Zepto);
    }
}(function ($) {
    "use strict";
    var Mask = function (el, mask, options) {
        var jMask = this, old_value;
        el = $(el);

        mask = typeof mask === "function" ? mask(el.val(), undefined, el, options) : mask;

        jMask.init = function () {
            options = options || {};

            jMask.byPassKeys = [9, 16, 17, 18, 36, 37, 38, 39, 40, 91];
            jMask.translation = {
                '0': { pattern: /\d/ },
                '9': { pattern: /\d/, optional: true },
                '#': { pattern: /\d/, recursive: true },
                'A': { pattern: /[a-zA-Z0-9]/ },
                'S': { pattern: /[a-zA-Z]/ }
            };

            jMask.translation = $.extend({}, jMask.translation, options.translation);
            jMask = $.extend(true, {}, jMask, options);

            el.each(function () {
                if (options.maxlength !== false) {
                    el.attr('maxlength', mask.length);
                }

                if (options.placeholder) {
                    el.attr('placeholder', options.placeholder);
                }

                el.attr('autocomplete', 'off');
                p.destroyEvents();
                p.events();

                var caret = p.getCaret();

                p.val(p.getMasked());
                p.setCaret(caret + p.getMaskCharactersBeforeCount(caret, true));
            });
        };

        var p = {
            getCaret: function () {
                var sel,
                    pos = 0,
                    ctrl = el.get(0),
                    dSel = document.selection,
                    cSelStart = ctrl.selectionStart;

                // IE Support
                if (dSel && !~navigator.appVersion.indexOf("MSIE 10")) {
                    sel = dSel.createRange();
                    sel.moveStart('character', el.is("input") ? -el.val().length : -el.text().length);
                    pos = sel.text.length;
                }
                    // Firefox support
                else if (cSelStart || cSelStart === '0') {
                    pos = cSelStart;
                }

                return pos;
            },
            setCaret: function (pos) {
                if (el.is(":focus")) {
                    var range, ctrl = el.get(0);

                    if (ctrl.setSelectionRange) {
                        ctrl.setSelectionRange(pos, pos);
                    } else if (ctrl.createTextRange) {
                        range = ctrl.createTextRange();
                        range.collapse(true);
                        range.moveEnd('character', pos);
                        range.moveStart('character', pos);
                        range.select();
                    }
                }
            },
            events: function () {
                el.on('keydown.mask', function () {
                    old_value = p.val();
                });
                el.on('keyup.mask', p.behaviour);
                el.on("paste.mask drop.mask", function () {
                    setTimeout(function () {
                        el.keydown().keyup();
                    }, 100);
                });
                el.on("change.mask", function () {
                    el.data("changeCalled", true);
                });
                el.on("blur.mask", function (e) {
                    var el = $(e.target);
                    if (el.prop("defaultValue") !== el.val()) {
                        el.prop("defaultValue", el.val());
                        if (!el.data("changeCalled")) {
                            el.trigger("change");
                        }
                    }
                    el.data("changeCalled", false);
                });

                // clear the value if it not complete the mask
                el.on("focusout.mask", function () {
                    if (options.clearIfNotMatch && p.val().length < mask.length) {
                        p.val('');
                    }
                });
            },
            destroyEvents: function () {
                el.off('keydown.mask keyup.mask paste.mask drop.mask change.mask blur.mask focusout.mask').removeData("changeCalled");
            },
            val: function (v) {
                var isInput = el.is('input');
                return arguments.length > 0
                    ? (isInput ? el.val(v) : el.text(v))
                    : (isInput ? el.val() : el.text());
            },
            getMaskCharactersBeforeCount: function (index, onCleanVal) {
                for (var count = 0, i = 0, maskL = mask.length; i < maskL && i < index; i++) {
                    if (!jMask.translation[mask.charAt(i)]) {
                        index = onCleanVal ? index + 1 : index;
                        count++;
                    }
                }
                return count;
            },
            determineCaretPos: function (originalCaretPos, oldLength, newLength, maskDif) {
                var translation = jMask.translation[mask.charAt(Math.min(originalCaretPos - 1, mask.length - 1))];

                return !translation ? p.determineCaretPos(originalCaretPos + 1, oldLength, newLength, maskDif)
                                    : Math.min(originalCaretPos + newLength - oldLength - maskDif, newLength);
            },
            behaviour: function (e) {
                e = e || window.event;
                var keyCode = e.keyCode || e.which;

                if ($.inArray(keyCode, jMask.byPassKeys) === -1) {

                    var caretPos = p.getCaret(),
                        currVal = p.val(),
                        currValL = currVal.length,
                        changeCaret = caretPos < currValL,
                        newVal = p.getMasked(),
                        newValL = newVal.length,
                        maskDif = p.getMaskCharactersBeforeCount(newValL - 1) - p.getMaskCharactersBeforeCount(currValL - 1);

                    if (newVal !== currVal) {
                        p.val(newVal);
                    }

                    // change caret but avoid CTRL+A
                    if (changeCaret && !(keyCode === 65 && e.ctrlKey)) {
                        // Avoid adjusting caret on backspace or delete
                        if (!(keyCode === 8 || keyCode === 46)) {
                            caretPos = p.determineCaretPos(caretPos, currValL, newValL, maskDif);
                        }
                        p.setCaret(caretPos);
                    }

                    return p.callbacks(e);
                }
            },
            getMasked: function (skipMaskChars) {
                var buf = [],
                    value = p.val(),
                    m = 0, maskLen = mask.length,
                    v = 0, valLen = value.length,
                    offset = 1, addMethod = "push",
                    resetPos = -1,
                    lastMaskChar,
                    check;

                if (options.reverse) {
                    addMethod = "unshift";
                    offset = -1;
                    lastMaskChar = 0;
                    m = maskLen - 1;
                    v = valLen - 1;
                    check = function () {
                        return m > -1 && v > -1;
                    };
                } else {
                    lastMaskChar = maskLen - 1;
                    check = function () {
                        return m < maskLen && v < valLen;
                    };
                }

                while (check()) {
                    var maskDigit = mask.charAt(m),
                        valDigit = value.charAt(v),
                        translation = jMask.translation[maskDigit];

                    if (translation) {
                        if (valDigit.match(translation.pattern)) {
                            buf[addMethod](valDigit);
                            if (translation.recursive) {
                                if (resetPos === -1) {
                                    resetPos = m;
                                } else if (m === lastMaskChar) {
                                    m = resetPos - offset;
                                }

                                if (lastMaskChar === resetPos) {
                                    m -= offset;
                                }
                            }
                            m += offset;
                        } else if (translation.optional) {
                            m += offset;
                            v -= offset;
                        }
                        v += offset;
                    } else {
                        if (!skipMaskChars) {
                            buf[addMethod](maskDigit);
                        }

                        if (valDigit === maskDigit) {
                            v += offset;
                        }

                        m += offset;
                    }
                }

                var lastMaskCharDigit = mask.charAt(lastMaskChar);
                if (maskLen === valLen + 1 && !jMask.translation[lastMaskCharDigit]) {
                    buf.push(lastMaskCharDigit);
                }

                return buf.join("");
            },
            callbacks: function (e) {
                var val = p.val(),
                    changed = p.val() !== old_value;
                if (changed === true) {
                    if (typeof options.onChange === "function") {
                        options.onChange(val, e, el, options);
                    }
                }

                if (changed === true && typeof options.onKeyPress === "function") {
                    options.onKeyPress(val, e, el, options);
                }

                if (typeof options.onComplete === "function" && val.length === mask.length) {
                    options.onComplete(val, e, el, options);
                }
            }
        };

        // public methods
        jMask.remove = function () {
            var caret = p.getCaret(),
                maskedCharacterCountBefore = p.getMaskCharactersBeforeCount(caret);

            p.destroyEvents();
            p.val(jMask.getCleanVal()).removeAttr('maxlength');
            p.setCaret(caret - maskedCharacterCountBefore);
        };

        // get value without mask
        jMask.getCleanVal = function () {
            return p.getMasked(true);
        };

        jMask.init();
    };

    $.fn.mask = function (mask, options) {
        this.unmask();
        return this.each(function () {
            $(this).data('mask', new Mask(this, mask, options));
        });
    };

    $.fn.unmask = function () {
        return this.each(function () {
            try {
                $(this).data('mask').remove();
            } catch (e) { }
        });
    };

    $.fn.cleanVal = function () {
        return $(this).data('mask').getCleanVal();
    };

    // looking for inputs with data-mask attribute
    $('*[data-mask]').each(function () {
        var input = $(this),
            options = {},
            prefix = "data-mask-";

        if (input.attr(prefix + 'reverse') === 'true') {
            options.reverse = true;
        }

        if (input.attr(prefix + 'maxlength') === 'false') {
            options.maxlength = false;
        }

        if (input.attr(prefix + 'clearifnotmatch') === 'true') {
            options.clearIfNotMatch = true;
        }

        input.mask(input.attr('data-mask'), options);
    });

}));


//! moment.js
//! version : 2.5.1
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com
(function (a) { function b() { return { empty: !1, unusedTokens: [], unusedInput: [], overflow: -2, charsLeftOver: 0, nullInput: !1, invalidMonth: null, invalidFormat: !1, userInvalidated: !1, iso: !1 } } function c(a, b) { return function (c) { return k(a.call(this, c), b) } } function d(a, b) { return function (c) { return this.lang().ordinal(a.call(this, c), b) } } function e() { } function f(a) { w(a), h(this, a) } function g(a) { var b = q(a), c = b.year || 0, d = b.month || 0, e = b.week || 0, f = b.day || 0, g = b.hour || 0, h = b.minute || 0, i = b.second || 0, j = b.millisecond || 0; this._milliseconds = +j + 1e3 * i + 6e4 * h + 36e5 * g, this._days = +f + 7 * e, this._months = +d + 12 * c, this._data = {}, this._bubble() } function h(a, b) { for (var c in b) b.hasOwnProperty(c) && (a[c] = b[c]); return b.hasOwnProperty("toString") && (a.toString = b.toString), b.hasOwnProperty("valueOf") && (a.valueOf = b.valueOf), a } function i(a) { var b, c = {}; for (b in a) a.hasOwnProperty(b) && qb.hasOwnProperty(b) && (c[b] = a[b]); return c } function j(a) { return 0 > a ? Math.ceil(a) : Math.floor(a) } function k(a, b, c) { for (var d = "" + Math.abs(a), e = a >= 0; d.length < b;) d = "0" + d; return (e ? c ? "+" : "" : "-") + d } function l(a, b, c, d) { var e, f, g = b._milliseconds, h = b._days, i = b._months; g && a._d.setTime(+a._d + g * c), (h || i) && (e = a.minute(), f = a.hour()), h && a.date(a.date() + h * c), i && a.month(a.month() + i * c), g && !d && db.updateOffset(a), (h || i) && (a.minute(e), a.hour(f)) } function m(a) { return "[object Array]" === Object.prototype.toString.call(a) } function n(a) { return "[object Date]" === Object.prototype.toString.call(a) || a instanceof Date } function o(a, b, c) { var d, e = Math.min(a.length, b.length), f = Math.abs(a.length - b.length), g = 0; for (d = 0; e > d; d++) (c && a[d] !== b[d] || !c && s(a[d]) !== s(b[d])) && g++; return g + f } function p(a) { if (a) { var b = a.toLowerCase().replace(/(.)s$/, "$1"); a = Tb[a] || Ub[b] || b } return a } function q(a) { var b, c, d = {}; for (c in a) a.hasOwnProperty(c) && (b = p(c), b && (d[b] = a[c])); return d } function r(b) { var c, d; if (0 === b.indexOf("week")) c = 7, d = "day"; else { if (0 !== b.indexOf("month")) return; c = 12, d = "month" } db[b] = function (e, f) { var g, h, i = db.fn._lang[b], j = []; if ("number" == typeof e && (f = e, e = a), h = function (a) { var b = db().utc().set(d, a); return i.call(db.fn._lang, b, e || "") }, null != f) return h(f); for (g = 0; c > g; g++) j.push(h(g)); return j } } function s(a) { var b = +a, c = 0; return 0 !== b && isFinite(b) && (c = b >= 0 ? Math.floor(b) : Math.ceil(b)), c } function t(a, b) { return new Date(Date.UTC(a, b + 1, 0)).getUTCDate() } function u(a) { return v(a) ? 366 : 365 } function v(a) { return a % 4 === 0 && a % 100 !== 0 || a % 400 === 0 } function w(a) { var b; a._a && -2 === a._pf.overflow && (b = a._a[jb] < 0 || a._a[jb] > 11 ? jb : a._a[kb] < 1 || a._a[kb] > t(a._a[ib], a._a[jb]) ? kb : a._a[lb] < 0 || a._a[lb] > 23 ? lb : a._a[mb] < 0 || a._a[mb] > 59 ? mb : a._a[nb] < 0 || a._a[nb] > 59 ? nb : a._a[ob] < 0 || a._a[ob] > 999 ? ob : -1, a._pf._overflowDayOfYear && (ib > b || b > kb) && (b = kb), a._pf.overflow = b) } function x(a) { return null == a._isValid && (a._isValid = !isNaN(a._d.getTime()) && a._pf.overflow < 0 && !a._pf.empty && !a._pf.invalidMonth && !a._pf.nullInput && !a._pf.invalidFormat && !a._pf.userInvalidated, a._strict && (a._isValid = a._isValid && 0 === a._pf.charsLeftOver && 0 === a._pf.unusedTokens.length)), a._isValid } function y(a) { return a ? a.toLowerCase().replace("_", "-") : a } function z(a, b) { return b._isUTC ? db(a).zone(b._offset || 0) : db(a).local() } function A(a, b) { return b.abbr = a, pb[a] || (pb[a] = new e), pb[a].set(b), pb[a] } function B(a) { delete pb[a] } function C(a) { var b, c, d, e, f = 0, g = function (a) { if (!pb[a] && rb) try { require("./lang/" + a) } catch (b) { } return pb[a] }; if (!a) return db.fn._lang; if (!m(a)) { if (c = g(a)) return c; a = [a] } for (; f < a.length;) { for (e = y(a[f]).split("-"), b = e.length, d = y(a[f + 1]), d = d ? d.split("-") : null; b > 0;) { if (c = g(e.slice(0, b).join("-"))) return c; if (d && d.length >= b && o(e, d, !0) >= b - 1) break; b-- } f++ } return db.fn._lang } function D(a) { return a.match(/\[[\s\S]/) ? a.replace(/^\[|\]$/g, "") : a.replace(/\\/g, "") } function E(a) { var b, c, d = a.match(vb); for (b = 0, c = d.length; c > b; b++) d[b] = Yb[d[b]] ? Yb[d[b]] : D(d[b]); return function (e) { var f = ""; for (b = 0; c > b; b++) f += d[b] instanceof Function ? d[b].call(e, a) : d[b]; return f } } function F(a, b) { return a.isValid() ? (b = G(b, a.lang()), Vb[b] || (Vb[b] = E(b)), Vb[b](a)) : a.lang().invalidDate() } function G(a, b) { function c(a) { return b.longDateFormat(a) || a } var d = 5; for (wb.lastIndex = 0; d >= 0 && wb.test(a) ;) a = a.replace(wb, c), wb.lastIndex = 0, d -= 1; return a } function H(a, b) { var c, d = b._strict; switch (a) { case "DDDD": return Ib; case "YYYY": case "GGGG": case "gggg": return d ? Jb : zb; case "Y": case "G": case "g": return Lb; case "YYYYYY": case "YYYYY": case "GGGGG": case "ggggg": return d ? Kb : Ab; case "S": if (d) return Gb; case "SS": if (d) return Hb; case "SSS": if (d) return Ib; case "DDD": return yb; case "MMM": case "MMMM": case "dd": case "ddd": case "dddd": return Cb; case "a": case "A": return C(b._l)._meridiemParse; case "X": return Fb; case "Z": case "ZZ": return Db; case "T": return Eb; case "SSSS": return Bb; case "MM": case "DD": case "YY": case "GG": case "gg": case "HH": case "hh": case "mm": case "ss": case "ww": case "WW": return d ? Hb : xb; case "M": case "D": case "d": case "H": case "h": case "m": case "s": case "w": case "W": case "e": case "E": return xb; default: return c = new RegExp(P(O(a.replace("\\", "")), "i")) } } function I(a) { a = a || ""; var b = a.match(Db) || [], c = b[b.length - 1] || [], d = (c + "").match(Qb) || ["-", 0, 0], e = +(60 * d[1]) + s(d[2]); return "+" === d[0] ? -e : e } function J(a, b, c) { var d, e = c._a; switch (a) { case "M": case "MM": null != b && (e[jb] = s(b) - 1); break; case "MMM": case "MMMM": d = C(c._l).monthsParse(b), null != d ? e[jb] = d : c._pf.invalidMonth = b; break; case "D": case "DD": null != b && (e[kb] = s(b)); break; case "DDD": case "DDDD": null != b && (c._dayOfYear = s(b)); break; case "YY": e[ib] = s(b) + (s(b) > 68 ? 1900 : 2e3); break; case "YYYY": case "YYYYY": case "YYYYYY": e[ib] = s(b); break; case "a": case "A": c._isPm = C(c._l).isPM(b); break; case "H": case "HH": case "h": case "hh": e[lb] = s(b); break; case "m": case "mm": e[mb] = s(b); break; case "s": case "ss": e[nb] = s(b); break; case "S": case "SS": case "SSS": case "SSSS": e[ob] = s(1e3 * ("0." + b)); break; case "X": c._d = new Date(1e3 * parseFloat(b)); break; case "Z": case "ZZ": c._useUTC = !0, c._tzm = I(b); break; case "w": case "ww": case "W": case "WW": case "d": case "dd": case "ddd": case "dddd": case "e": case "E": a = a.substr(0, 1); case "gg": case "gggg": case "GG": case "GGGG": case "GGGGG": a = a.substr(0, 2), b && (c._w = c._w || {}, c._w[a] = b) } } function K(a) { var b, c, d, e, f, g, h, i, j, k, l = []; if (!a._d) { for (d = M(a), a._w && null == a._a[kb] && null == a._a[jb] && (f = function (b) { var c = parseInt(b, 10); return b ? b.length < 3 ? c > 68 ? 1900 + c : 2e3 + c : c : null == a._a[ib] ? db().weekYear() : a._a[ib] }, g = a._w, null != g.GG || null != g.W || null != g.E ? h = Z(f(g.GG), g.W || 1, g.E, 4, 1) : (i = C(a._l), j = null != g.d ? V(g.d, i) : null != g.e ? parseInt(g.e, 10) + i._week.dow : 0, k = parseInt(g.w, 10) || 1, null != g.d && j < i._week.dow && k++, h = Z(f(g.gg), k, j, i._week.doy, i._week.dow)), a._a[ib] = h.year, a._dayOfYear = h.dayOfYear), a._dayOfYear && (e = null == a._a[ib] ? d[ib] : a._a[ib], a._dayOfYear > u(e) && (a._pf._overflowDayOfYear = !0), c = U(e, 0, a._dayOfYear), a._a[jb] = c.getUTCMonth(), a._a[kb] = c.getUTCDate()), b = 0; 3 > b && null == a._a[b]; ++b) a._a[b] = l[b] = d[b]; for (; 7 > b; b++) a._a[b] = l[b] = null == a._a[b] ? 2 === b ? 1 : 0 : a._a[b]; l[lb] += s((a._tzm || 0) / 60), l[mb] += s((a._tzm || 0) % 60), a._d = (a._useUTC ? U : T).apply(null, l) } } function L(a) { var b; a._d || (b = q(a._i), a._a = [b.year, b.month, b.day, b.hour, b.minute, b.second, b.millisecond], K(a)) } function M(a) { var b = new Date; return a._useUTC ? [b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate()] : [b.getFullYear(), b.getMonth(), b.getDate()] } function N(a) { a._a = [], a._pf.empty = !0; var b, c, d, e, f, g = C(a._l), h = "" + a._i, i = h.length, j = 0; for (d = G(a._f, g).match(vb) || [], b = 0; b < d.length; b++) e = d[b], c = (h.match(H(e, a)) || [])[0], c && (f = h.substr(0, h.indexOf(c)), f.length > 0 && a._pf.unusedInput.push(f), h = h.slice(h.indexOf(c) + c.length), j += c.length), Yb[e] ? (c ? a._pf.empty = !1 : a._pf.unusedTokens.push(e), J(e, c, a)) : a._strict && !c && a._pf.unusedTokens.push(e); a._pf.charsLeftOver = i - j, h.length > 0 && a._pf.unusedInput.push(h), a._isPm && a._a[lb] < 12 && (a._a[lb] += 12), a._isPm === !1 && 12 === a._a[lb] && (a._a[lb] = 0), K(a), w(a) } function O(a) { return a.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (a, b, c, d, e) { return b || c || d || e }) } function P(a) { return a.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") } function Q(a) { var c, d, e, f, g; if (0 === a._f.length) return a._pf.invalidFormat = !0, a._d = new Date(0 / 0), void 0; for (f = 0; f < a._f.length; f++) g = 0, c = h({}, a), c._pf = b(), c._f = a._f[f], N(c), x(c) && (g += c._pf.charsLeftOver, g += 10 * c._pf.unusedTokens.length, c._pf.score = g, (null == e || e > g) && (e = g, d = c)); h(a, d || c) } function R(a) { var b, c, d = a._i, e = Mb.exec(d); if (e) { for (a._pf.iso = !0, b = 0, c = Ob.length; c > b; b++) if (Ob[b][1].exec(d)) { a._f = Ob[b][0] + (e[6] || " "); break } for (b = 0, c = Pb.length; c > b; b++) if (Pb[b][1].exec(d)) { a._f += Pb[b][0]; break } d.match(Db) && (a._f += "Z"), N(a) } else a._d = new Date(d) } function S(b) { var c = b._i, d = sb.exec(c); c === a ? b._d = new Date : d ? b._d = new Date(+d[1]) : "string" == typeof c ? R(b) : m(c) ? (b._a = c.slice(0), K(b)) : n(c) ? b._d = new Date(+c) : "object" == typeof c ? L(b) : b._d = new Date(c) } function T(a, b, c, d, e, f, g) { var h = new Date(a, b, c, d, e, f, g); return 1970 > a && h.setFullYear(a), h } function U(a) { var b = new Date(Date.UTC.apply(null, arguments)); return 1970 > a && b.setUTCFullYear(a), b } function V(a, b) { if ("string" == typeof a) if (isNaN(a)) { if (a = b.weekdaysParse(a), "number" != typeof a) return null } else a = parseInt(a, 10); return a } function W(a, b, c, d, e) { return e.relativeTime(b || 1, !!c, a, d) } function X(a, b, c) { var d = hb(Math.abs(a) / 1e3), e = hb(d / 60), f = hb(e / 60), g = hb(f / 24), h = hb(g / 365), i = 45 > d && ["s", d] || 1 === e && ["m"] || 45 > e && ["mm", e] || 1 === f && ["h"] || 22 > f && ["hh", f] || 1 === g && ["d"] || 25 >= g && ["dd", g] || 45 >= g && ["M"] || 345 > g && ["MM", hb(g / 30)] || 1 === h && ["y"] || ["yy", h]; return i[2] = b, i[3] = a > 0, i[4] = c, W.apply({}, i) } function Y(a, b, c) { var d, e = c - b, f = c - a.day(); return f > e && (f -= 7), e - 7 > f && (f += 7), d = db(a).add("d", f), { week: Math.ceil(d.dayOfYear() / 7), year: d.year() } } function Z(a, b, c, d, e) { var f, g, h = U(a, 0, 1).getUTCDay(); return c = null != c ? c : e, f = e - h + (h > d ? 7 : 0) - (e > h ? 7 : 0), g = 7 * (b - 1) + (c - e) + f + 1, { year: g > 0 ? a : a - 1, dayOfYear: g > 0 ? g : u(a - 1) + g } } function $(a) { var b = a._i, c = a._f; return null === b ? db.invalid({ nullInput: !0 }) : ("string" == typeof b && (a._i = b = C().preparse(b)), db.isMoment(b) ? (a = i(b), a._d = new Date(+b._d)) : c ? m(c) ? Q(a) : N(a) : S(a), new f(a)) } function _(a, b) { db.fn[a] = db.fn[a + "s"] = function (a) { var c = this._isUTC ? "UTC" : ""; return null != a ? (this._d["set" + c + b](a), db.updateOffset(this), this) : this._d["get" + c + b]() } } function ab(a) { db.duration.fn[a] = function () { return this._data[a] } } function bb(a, b) { db.duration.fn["as" + a] = function () { return +this / b } } function cb(a) { var b = !1, c = db; "undefined" == typeof ender && (a ? (gb.moment = function () { return !b && console && console.warn && (b = !0, console.warn("Accessing Moment through the global scope is deprecated, and will be removed in an upcoming release.")), c.apply(null, arguments) }, h(gb.moment, c)) : gb.moment = db) } for (var db, eb, fb = "2.5.1", gb = this, hb = Math.round, ib = 0, jb = 1, kb = 2, lb = 3, mb = 4, nb = 5, ob = 6, pb = {}, qb = { _isAMomentObject: null, _i: null, _f: null, _l: null, _strict: null, _isUTC: null, _offset: null, _pf: null, _lang: null }, rb = "undefined" != typeof module && module.exports && "undefined" != typeof require, sb = /^\/?Date\((\-?\d+)/i, tb = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/, ub = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/, vb = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|X|zz?|ZZ?|.)/g, wb = /(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g, xb = /\d\d?/, yb = /\d{1,3}/, zb = /\d{1,4}/, Ab = /[+\-]?\d{1,6}/, Bb = /\d+/, Cb = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i, Db = /Z|[\+\-]\d\d:?\d\d/gi, Eb = /T/i, Fb = /[\+\-]?\d+(\.\d{1,3})?/, Gb = /\d/, Hb = /\d\d/, Ib = /\d{3}/, Jb = /\d{4}/, Kb = /[+-]?\d{6}/, Lb = /[+-]?\d+/, Mb = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/, Nb = "YYYY-MM-DDTHH:mm:ssZ", Ob = [["YYYYYY-MM-DD", /[+-]\d{6}-\d{2}-\d{2}/], ["YYYY-MM-DD", /\d{4}-\d{2}-\d{2}/], ["GGGG-[W]WW-E", /\d{4}-W\d{2}-\d/], ["GGGG-[W]WW", /\d{4}-W\d{2}/], ["YYYY-DDD", /\d{4}-\d{3}/]], Pb = [["HH:mm:ss.SSSS", /(T| )\d\d:\d\d:\d\d\.\d{1,3}/], ["HH:mm:ss", /(T| )\d\d:\d\d:\d\d/], ["HH:mm", /(T| )\d\d:\d\d/], ["HH", /(T| )\d\d/]], Qb = /([\+\-]|\d\d)/gi, Rb = "Date|Hours|Minutes|Seconds|Milliseconds".split("|"), Sb = { Milliseconds: 1, Seconds: 1e3, Minutes: 6e4, Hours: 36e5, Days: 864e5, Months: 2592e6, Years: 31536e6 }, Tb = { ms: "millisecond", s: "second", m: "minute", h: "hour", d: "day", D: "date", w: "week", W: "isoWeek", M: "month", y: "year", DDD: "dayOfYear", e: "weekday", E: "isoWeekday", gg: "weekYear", GG: "isoWeekYear" }, Ub = { dayofyear: "dayOfYear", isoweekday: "isoWeekday", isoweek: "isoWeek", weekyear: "weekYear", isoweekyear: "isoWeekYear" }, Vb = {}, Wb = "DDD w W M D d".split(" "), Xb = "M D H h m s w W".split(" "), Yb = { M: function () { return this.month() + 1 }, MMM: function (a) { return this.lang().monthsShort(this, a) }, MMMM: function (a) { return this.lang().months(this, a) }, D: function () { return this.date() }, DDD: function () { return this.dayOfYear() }, d: function () { return this.day() }, dd: function (a) { return this.lang().weekdaysMin(this, a) }, ddd: function (a) { return this.lang().weekdaysShort(this, a) }, dddd: function (a) { return this.lang().weekdays(this, a) }, w: function () { return this.week() }, W: function () { return this.isoWeek() }, YY: function () { return k(this.year() % 100, 2) }, YYYY: function () { return k(this.year(), 4) }, YYYYY: function () { return k(this.year(), 5) }, YYYYYY: function () { var a = this.year(), b = a >= 0 ? "+" : "-"; return b + k(Math.abs(a), 6) }, gg: function () { return k(this.weekYear() % 100, 2) }, gggg: function () { return k(this.weekYear(), 4) }, ggggg: function () { return k(this.weekYear(), 5) }, GG: function () { return k(this.isoWeekYear() % 100, 2) }, GGGG: function () { return k(this.isoWeekYear(), 4) }, GGGGG: function () { return k(this.isoWeekYear(), 5) }, e: function () { return this.weekday() }, E: function () { return this.isoWeekday() }, a: function () { return this.lang().meridiem(this.hours(), this.minutes(), !0) }, A: function () { return this.lang().meridiem(this.hours(), this.minutes(), !1) }, H: function () { return this.hours() }, h: function () { return this.hours() % 12 || 12 }, m: function () { return this.minutes() }, s: function () { return this.seconds() }, S: function () { return s(this.milliseconds() / 100) }, SS: function () { return k(s(this.milliseconds() / 10), 2) }, SSS: function () { return k(this.milliseconds(), 3) }, SSSS: function () { return k(this.milliseconds(), 3) }, Z: function () { var a = -this.zone(), b = "+"; return 0 > a && (a = -a, b = "-"), b + k(s(a / 60), 2) + ":" + k(s(a) % 60, 2) }, ZZ: function () { var a = -this.zone(), b = "+"; return 0 > a && (a = -a, b = "-"), b + k(s(a / 60), 2) + k(s(a) % 60, 2) }, z: function () { return this.zoneAbbr() }, zz: function () { return this.zoneName() }, X: function () { return this.unix() }, Q: function () { return this.quarter() } }, Zb = ["months", "monthsShort", "weekdays", "weekdaysShort", "weekdaysMin"]; Wb.length;) eb = Wb.pop(), Yb[eb + "o"] = d(Yb[eb], eb); for (; Xb.length;) eb = Xb.pop(), Yb[eb + eb] = c(Yb[eb], 2); for (Yb.DDDD = c(Yb.DDD, 3), h(e.prototype, { set: function (a) { var b, c; for (c in a) b = a[c], "function" == typeof b ? this[c] = b : this["_" + c] = b }, _months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"), months: function (a) { return this._months[a.month()] }, _monthsShort: "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"), monthsShort: function (a) { return this._monthsShort[a.month()] }, monthsParse: function (a) { var b, c, d; for (this._monthsParse || (this._monthsParse = []), b = 0; 12 > b; b++) if (this._monthsParse[b] || (c = db.utc([2e3, b]), d = "^" + this.months(c, "") + "|^" + this.monthsShort(c, ""), this._monthsParse[b] = new RegExp(d.replace(".", ""), "i")), this._monthsParse[b].test(a)) return b }, _weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"), weekdays: function (a) { return this._weekdays[a.day()] }, _weekdaysShort: "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"), weekdaysShort: function (a) { return this._weekdaysShort[a.day()] }, _weekdaysMin: "Su_Mo_Tu_We_Th_Fr_Sa".split("_"), weekdaysMin: function (a) { return this._weekdaysMin[a.day()] }, weekdaysParse: function (a) { var b, c, d; for (this._weekdaysParse || (this._weekdaysParse = []), b = 0; 7 > b; b++) if (this._weekdaysParse[b] || (c = db([2e3, 1]).day(b), d = "^" + this.weekdays(c, "") + "|^" + this.weekdaysShort(c, "") + "|^" + this.weekdaysMin(c, ""), this._weekdaysParse[b] = new RegExp(d.replace(".", ""), "i")), this._weekdaysParse[b].test(a)) return b }, _longDateFormat: { LT: "h:mm A", L: "MM/DD/YYYY", LL: "MMMM D YYYY", LLL: "MMMM D YYYY LT", LLLL: "dddd, MMMM D YYYY LT" }, longDateFormat: function (a) { var b = this._longDateFormat[a]; return !b && this._longDateFormat[a.toUpperCase()] && (b = this._longDateFormat[a.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function (a) { return a.slice(1) }), this._longDateFormat[a] = b), b }, isPM: function (a) { return "p" === (a + "").toLowerCase().charAt(0) }, _meridiemParse: /[ap]\.?m?\.?/i, meridiem: function (a, b, c) { return a > 11 ? c ? "pm" : "PM" : c ? "am" : "AM" }, _calendar: { sameDay: "[Today at] LT", nextDay: "[Tomorrow at] LT", nextWeek: "dddd [at] LT", lastDay: "[Yesterday at] LT", lastWeek: "[Last] dddd [at] LT", sameElse: "L" }, calendar: function (a, b) { var c = this._calendar[a]; return "function" == typeof c ? c.apply(b) : c }, _relativeTime: { future: "in %s", past: "%s ago", s: "a few seconds", m: "a minute", mm: "%d minutes", h: "an hour", hh: "%d hours", d: "a day", dd: "%d days", M: "a month", MM: "%d months", y: "a year", yy: "%d years" }, relativeTime: function (a, b, c, d) { var e = this._relativeTime[c]; return "function" == typeof e ? e(a, b, c, d) : e.replace(/%d/i, a) }, pastFuture: function (a, b) { var c = this._relativeTime[a > 0 ? "future" : "past"]; return "function" == typeof c ? c(b) : c.replace(/%s/i, b) }, ordinal: function (a) { return this._ordinal.replace("%d", a) }, _ordinal: "%d", preparse: function (a) { return a }, postformat: function (a) { return a }, week: function (a) { return Y(a, this._week.dow, this._week.doy).week }, _week: { dow: 0, doy: 6 }, _invalidDate: "Invalid date", invalidDate: function () { return this._invalidDate } }), db = function (c, d, e, f) { var g; return "boolean" == typeof e && (f = e, e = a), g = {}, g._isAMomentObject = !0, g._i = c, g._f = d, g._l = e, g._strict = f, g._isUTC = !1, g._pf = b(), $(g) }, db.utc = function (c, d, e, f) { var g; return "boolean" == typeof e && (f = e, e = a), g = {}, g._isAMomentObject = !0, g._useUTC = !0, g._isUTC = !0, g._l = e, g._i = c, g._f = d, g._strict = f, g._pf = b(), $(g).utc() }, db.unix = function (a) { return db(1e3 * a) }, db.duration = function (a, b) { var c, d, e, f = a, h = null; return db.isDuration(a) ? f = { ms: a._milliseconds, d: a._days, M: a._months } : "number" == typeof a ? (f = {}, b ? f[b] = a : f.milliseconds = a) : (h = tb.exec(a)) ? (c = "-" === h[1] ? -1 : 1, f = { y: 0, d: s(h[kb]) * c, h: s(h[lb]) * c, m: s(h[mb]) * c, s: s(h[nb]) * c, ms: s(h[ob]) * c }) : (h = ub.exec(a)) && (c = "-" === h[1] ? -1 : 1, e = function (a) { var b = a && parseFloat(a.replace(",", ".")); return (isNaN(b) ? 0 : b) * c }, f = { y: e(h[2]), M: e(h[3]), d: e(h[4]), h: e(h[5]), m: e(h[6]), s: e(h[7]), w: e(h[8]) }), d = new g(f), db.isDuration(a) && a.hasOwnProperty("_lang") && (d._lang = a._lang), d }, db.version = fb, db.defaultFormat = Nb, db.updateOffset = function () { }, db.lang = function (a, b) { var c; return a ? (b ? A(y(a), b) : null === b ? (B(a), a = "en") : pb[a] || C(a), c = db.duration.fn._lang = db.fn._lang = C(a), c._abbr) : db.fn._lang._abbr }, db.langData = function (a) { return a && a._lang && a._lang._abbr && (a = a._lang._abbr), C(a) }, db.isMoment = function (a) { return a instanceof f || null != a && a.hasOwnProperty("_isAMomentObject") }, db.isDuration = function (a) { return a instanceof g }, eb = Zb.length - 1; eb >= 0; --eb) r(Zb[eb]); for (db.normalizeUnits = function (a) { return p(a) }, db.invalid = function (a) { var b = db.utc(0 / 0); return null != a ? h(b._pf, a) : b._pf.userInvalidated = !0, b }, db.parseZone = function (a) { return db(a).parseZone() }, h(db.fn = f.prototype, { clone: function () { return db(this) }, valueOf: function () { return +this._d + 6e4 * (this._offset || 0) }, unix: function () { return Math.floor(+this / 1e3) }, toString: function () { return this.clone().lang("en").format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ") }, toDate: function () { return this._offset ? new Date(+this) : this._d }, toISOString: function () { var a = db(this).utc(); return 0 < a.year() && a.year() <= 9999 ? F(a, "YYYY-MM-DD[T]HH:mm:ss.SSS[Z]") : F(a, "YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]") }, toArray: function () { var a = this; return [a.year(), a.month(), a.date(), a.hours(), a.minutes(), a.seconds(), a.milliseconds()] }, isValid: function () { return x(this) }, isDSTShifted: function () { return this._a ? this.isValid() && o(this._a, (this._isUTC ? db.utc(this._a) : db(this._a)).toArray()) > 0 : !1 }, parsingFlags: function () { return h({}, this._pf) }, invalidAt: function () { return this._pf.overflow }, utc: function () { return this.zone(0) }, local: function () { return this.zone(0), this._isUTC = !1, this }, format: function (a) { var b = F(this, a || db.defaultFormat); return this.lang().postformat(b) }, add: function (a, b) { var c; return c = "string" == typeof a ? db.duration(+b, a) : db.duration(a, b), l(this, c, 1), this }, subtract: function (a, b) { var c; return c = "string" == typeof a ? db.duration(+b, a) : db.duration(a, b), l(this, c, -1), this }, diff: function (a, b, c) { var d, e, f = z(a, this), g = 6e4 * (this.zone() - f.zone()); return b = p(b), "year" === b || "month" === b ? (d = 432e5 * (this.daysInMonth() + f.daysInMonth()), e = 12 * (this.year() - f.year()) + (this.month() - f.month()), e += (this - db(this).startOf("month") - (f - db(f).startOf("month"))) / d, e -= 6e4 * (this.zone() - db(this).startOf("month").zone() - (f.zone() - db(f).startOf("month").zone())) / d, "year" === b && (e /= 12)) : (d = this - f, e = "second" === b ? d / 1e3 : "minute" === b ? d / 6e4 : "hour" === b ? d / 36e5 : "day" === b ? (d - g) / 864e5 : "week" === b ? (d - g) / 6048e5 : d), c ? e : j(e) }, from: function (a, b) { return db.duration(this.diff(a)).lang(this.lang()._abbr).humanize(!b) }, fromNow: function (a) { return this.from(db(), a) }, calendar: function () { var a = z(db(), this).startOf("day"), b = this.diff(a, "days", !0), c = -6 > b ? "sameElse" : -1 > b ? "lastWeek" : 0 > b ? "lastDay" : 1 > b ? "sameDay" : 2 > b ? "nextDay" : 7 > b ? "nextWeek" : "sameElse"; return this.format(this.lang().calendar(c, this)) }, isLeapYear: function () { return v(this.year()) }, isDST: function () { return this.zone() < this.clone().month(0).zone() || this.zone() < this.clone().month(5).zone() }, day: function (a) { var b = this._isUTC ? this._d.getUTCDay() : this._d.getDay(); return null != a ? (a = V(a, this.lang()), this.add({ d: a - b })) : b }, month: function (a) { var b, c = this._isUTC ? "UTC" : ""; return null != a ? "string" == typeof a && (a = this.lang().monthsParse(a), "number" != typeof a) ? this : (b = this.date(), this.date(1), this._d["set" + c + "Month"](a), this.date(Math.min(b, this.daysInMonth())), db.updateOffset(this), this) : this._d["get" + c + "Month"]() }, startOf: function (a) { switch (a = p(a)) { case "year": this.month(0); case "month": this.date(1); case "week": case "isoWeek": case "day": this.hours(0); case "hour": this.minutes(0); case "minute": this.seconds(0); case "second": this.milliseconds(0) } return "week" === a ? this.weekday(0) : "isoWeek" === a && this.isoWeekday(1), this }, endOf: function (a) { return a = p(a), this.startOf(a).add("isoWeek" === a ? "week" : a, 1).subtract("ms", 1) }, isAfter: function (a, b) { return b = "undefined" != typeof b ? b : "millisecond", +this.clone().startOf(b) > +db(a).startOf(b) }, isBefore: function (a, b) { return b = "undefined" != typeof b ? b : "millisecond", +this.clone().startOf(b) < +db(a).startOf(b) }, isSame: function (a, b) { return b = b || "ms", +this.clone().startOf(b) === +z(a, this).startOf(b) }, min: function (a) { return a = db.apply(null, arguments), this > a ? this : a }, max: function (a) { return a = db.apply(null, arguments), a > this ? this : a }, zone: function (a) { var b = this._offset || 0; return null == a ? this._isUTC ? b : this._d.getTimezoneOffset() : ("string" == typeof a && (a = I(a)), Math.abs(a) < 16 && (a = 60 * a), this._offset = a, this._isUTC = !0, b !== a && l(this, db.duration(b - a, "m"), 1, !0), this) }, zoneAbbr: function () { return this._isUTC ? "UTC" : "" }, zoneName: function () { return this._isUTC ? "Coordinated Universal Time" : "" }, parseZone: function () { return this._tzm ? this.zone(this._tzm) : "string" == typeof this._i && this.zone(this._i), this }, hasAlignedHourOffset: function (a) { return a = a ? db(a).zone() : 0, (this.zone() - a) % 60 === 0 }, daysInMonth: function () { return t(this.year(), this.month()) }, dayOfYear: function (a) { var b = hb((db(this).startOf("day") - db(this).startOf("year")) / 864e5) + 1; return null == a ? b : this.add("d", a - b) }, quarter: function () { return Math.ceil((this.month() + 1) / 3) }, weekYear: function (a) { var b = Y(this, this.lang()._week.dow, this.lang()._week.doy).year; return null == a ? b : this.add("y", a - b) }, isoWeekYear: function (a) { var b = Y(this, 1, 4).year; return null == a ? b : this.add("y", a - b) }, week: function (a) { var b = this.lang().week(this); return null == a ? b : this.add("d", 7 * (a - b)) }, isoWeek: function (a) { var b = Y(this, 1, 4).week; return null == a ? b : this.add("d", 7 * (a - b)) }, weekday: function (a) { var b = (this.day() + 7 - this.lang()._week.dow) % 7; return null == a ? b : this.add("d", a - b) }, isoWeekday: function (a) { return null == a ? this.day() || 7 : this.day(this.day() % 7 ? a : a - 7) }, get: function (a) { return a = p(a), this[a]() }, set: function (a, b) { return a = p(a), "function" == typeof this[a] && this[a](b), this }, lang: function (b) { return b === a ? this._lang : (this._lang = C(b), this) } }), eb = 0; eb < Rb.length; eb++) _(Rb[eb].toLowerCase().replace(/s$/, ""), Rb[eb]); _("year", "FullYear"), db.fn.days = db.fn.day, db.fn.months = db.fn.month, db.fn.weeks = db.fn.week, db.fn.isoWeeks = db.fn.isoWeek, db.fn.toJSON = db.fn.toISOString, h(db.duration.fn = g.prototype, { _bubble: function () { var a, b, c, d, e = this._milliseconds, f = this._days, g = this._months, h = this._data; h.milliseconds = e % 1e3, a = j(e / 1e3), h.seconds = a % 60, b = j(a / 60), h.minutes = b % 60, c = j(b / 60), h.hours = c % 24, f += j(c / 24), h.days = f % 30, g += j(f / 30), h.months = g % 12, d = j(g / 12), h.years = d }, weeks: function () { return j(this.days() / 7) }, valueOf: function () { return this._milliseconds + 864e5 * this._days + this._months % 12 * 2592e6 + 31536e6 * s(this._months / 12) }, humanize: function (a) { var b = +this, c = X(b, !a, this.lang()); return a && (c = this.lang().pastFuture(b, c)), this.lang().postformat(c) }, add: function (a, b) { var c = db.duration(a, b); return this._milliseconds += c._milliseconds, this._days += c._days, this._months += c._months, this._bubble(), this }, subtract: function (a, b) { var c = db.duration(a, b); return this._milliseconds -= c._milliseconds, this._days -= c._days, this._months -= c._months, this._bubble(), this }, get: function (a) { return a = p(a), this[a.toLowerCase() + "s"]() }, as: function (a) { return a = p(a), this["as" + a.charAt(0).toUpperCase() + a.slice(1) + "s"]() }, lang: db.fn.lang, toIsoString: function () { var a = Math.abs(this.years()), b = Math.abs(this.months()), c = Math.abs(this.days()), d = Math.abs(this.hours()), e = Math.abs(this.minutes()), f = Math.abs(this.seconds() + this.milliseconds() / 1e3); return this.asSeconds() ? (this.asSeconds() < 0 ? "-" : "") + "P" + (a ? a + "Y" : "") + (b ? b + "M" : "") + (c ? c + "D" : "") + (d || e || f ? "T" : "") + (d ? d + "H" : "") + (e ? e + "M" : "") + (f ? f + "S" : "") : "P0D" } }); for (eb in Sb) Sb.hasOwnProperty(eb) && (bb(eb, Sb[eb]), ab(eb.toLowerCase())); bb("Weeks", 6048e5), db.duration.fn.asMonths = function () { return (+this - 31536e6 * this.years()) / 2592e6 + 12 * this.years() }, db.lang("en", { ordinal: function (a) { var b = a % 10, c = 1 === s(a % 100 / 10) ? "th" : 1 === b ? "st" : 2 === b ? "nd" : 3 === b ? "rd" : "th"; return a + c } }), rb ? (module.exports = db, cb(!0)) : "function" == typeof define && define.amd ? define("moment", function (b, c, d) { return d.config && d.config() && d.config().noGlobal !== !0 && cb(d.config().noGlobal === a), db }) : cb() }).call(this);





/*!
 * Pikaday
 *
 * Copyright Â© 2014 David Bushell | BSD & MIT license | https://github.com/dbushell/Pikaday
 */

(function (root, factory) {
    'use strict';

    var moment;
    if (typeof exports === 'object') {
        // CommonJS module
        // Load moment.js as an optional dependency
        try { moment = require('moment'); } catch (e) { }
        module.exports = factory(moment);
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(function (req) {
            // Load moment.js as an optional dependency
            var id = 'moment';
            moment = req.defined && req.defined(id) ? req(id) : undefined;
            return factory(moment);
        });
    } else {
        root.Pikaday = factory(root.moment);
    }
}(this, function (moment) {
    'use strict';

    /**
     * feature detection and helper functions
     */
    var hasMoment = typeof moment === 'function',

    hasEventListeners = !!window.addEventListener,

    document = window.document,

    sto = window.setTimeout,

    addEvent = function (el, e, callback, capture) {
        if (hasEventListeners) {
            el.addEventListener(e, callback, !!capture);
        } else {
            el.attachEvent('on' + e, callback);
        }
    },

    removeEvent = function (el, e, callback, capture) {
        if (hasEventListeners) {
            el.removeEventListener(e, callback, !!capture);
        } else {
            el.detachEvent('on' + e, callback);
        }
    },

    fireEvent = function (el, eventName, data) {
        var ev;

        if (document.createEvent) {
            ev = document.createEvent('HTMLEvents');
            ev.initEvent(eventName, true, false);
            ev = extend(ev, data);
            el.dispatchEvent(ev);
        } else if (document.createEventObject) {
            ev = document.createEventObject();
            ev = extend(ev, data);
            el.fireEvent('on' + eventName, ev);
        }
    },

    trim = function (str) {
        return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
    },

    hasClass = function (el, cn) {
        return (' ' + el.className + ' ').indexOf(' ' + cn + ' ') !== -1;
    },

    addClass = function (el, cn) {
        if (!hasClass(el, cn)) {
            el.className = (el.className === '') ? cn : el.className + ' ' + cn;
        }
    },

    removeClass = function (el, cn) {
        el.className = trim((' ' + el.className + ' ').replace(' ' + cn + ' ', ' '));
    },

    isArray = function (obj) {
        return (/Array/).test(Object.prototype.toString.call(obj));
    },

    isDate = function (obj) {
        return (/Date/).test(Object.prototype.toString.call(obj)) && !isNaN(obj.getTime());
    },

    isLeapYear = function (year) {
        // solution by Matti Virkkunen: http://stackoverflow.com/a/4881951
        return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
    },

    getDaysInMonth = function (year, month) {
        return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
    },

    setToStartOfDay = function (date) {
        if (isDate(date)) date.setHours(0, 0, 0, 0);
    },

    compareDates = function (a, b) {
        // weak date comparison (use setToStartOfDay(date) to ensure correct result)
        return a.getTime() === b.getTime();
    },

    extend = function (to, from, overwrite) {
        var prop, hasProp;
        for (prop in from) {
            hasProp = to[prop] !== undefined;
            if (hasProp && typeof from[prop] === 'object' && from[prop].nodeName === undefined) {
                if (isDate(from[prop])) {
                    if (overwrite) {
                        to[prop] = new Date(from[prop].getTime());
                    }
                }
                else if (isArray(from[prop])) {
                    if (overwrite) {
                        to[prop] = from[prop].slice(0);
                    }
                } else {
                    to[prop] = extend({}, from[prop], overwrite);
                }
            } else if (overwrite || !hasProp) {
                to[prop] = from[prop];
            }
        }
        return to;
    },

    adjustCalendar = function (calendar) {
        if (calendar.month < 0) {
            calendar.year -= Math.ceil(Math.abs(calendar.month) / 12);
            calendar.month += 12;
        }
        if (calendar.month > 11) {
            calendar.year += Math.floor(Math.abs(calendar.month) / 12);
            calendar.month -= 12;
        }
        return calendar;
    },

    /**
     * defaults and localisation
     */
    defaults = {

        // bind the picker to a form field
        field: null,

        // automatically show/hide the picker on `field` focus (default `true` if `field` is set)
        bound: undefined,

        // position of the datepicker, relative to the field (default to bottom & left)
        // ('bottom' & 'left' keywords are not used, 'top' & 'right' are modifier on the bottom/left position)
        position: 'bottom left',

        // the default output format for `.toString()` and `field` value
        format: 'YYYY-MM-DD',

        // the initial date to view when first opened
        defaultDate: null,

        // make the `defaultDate` the initial selected value
        setDefaultDate: false,

        // first day of week (0: Sunday, 1: Monday etc)
        firstDay: 0,

        // the minimum/earliest date that can be selected
        minDate: null,
        // the maximum/latest date that can be selected
        maxDate: null,

        // number of years either side, or array of upper/lower range
        yearRange: 10,

        // used internally (don't config outside)
        minYear: 0,
        maxYear: 9999,
        minMonth: undefined,
        maxMonth: undefined,

        isRTL: false,

        // Additional text to append to the year in the calendar title
        yearSuffix: '',

        // Render the month after year in the calendar title
        showMonthAfterYear: false,

        // how many months are visible
        numberOfMonths: 1,

        // when numberOfMonths is used, this will help you to choose where the main calendar will be (default `left`, can be set to `right`)
        // only used for the first display or when a selected date is not visible
        mainCalendar: 'left',

        // internationalization
        i18n: {
            previousMonth: 'Previous Month',
            nextMonth: 'Next Month',
            months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        },

        // callback function
        onSelect: null,
        onOpen: null,
        onClose: null,
        onDraw: null
    },


    /**
     * templating functions to abstract HTML rendering
     */
    renderDayName = function (opts, day, abbr) {
        day += opts.firstDay;
        while (day >= 7) {
            day -= 7;
        }
        return abbr ? opts.i18n.weekdaysShort[day] : opts.i18n.weekdays[day];
    },

    renderDay = function (d, m, y, isSelected, isToday, isDisabled, isEmpty) {
        if (isEmpty) {
            return '<td class="is-empty"></td>';
        }
        var arr = [];
        if (isDisabled) {
            arr.push('is-disabled');
        }
        if (isToday) {
            arr.push('is-today');
        }
        if (isSelected) {
            arr.push('is-selected');
        }
        return '<td data-day="' + d + '" class="' + arr.join(' ') + '">' +
                 '<button class="pika-button pika-day" type="button" ' +
                    'data-pika-year="' + y + '" data-pika-month="' + m + '" data-pika-day="' + d + '">' +
                        d +
                 '</button>' +
               '</td>';
    },

    renderRow = function (days, isRTL) {
        return '<tr>' + (isRTL ? days.reverse() : days).join('') + '</tr>';
    },

    renderBody = function (rows) {
        return '<tbody>' + rows.join('') + '</tbody>';
    },

    renderHead = function (opts) {
        var i, arr = [];
        for (i = 0; i < 7; i++) {
            arr.push('<th scope="col"><abbr title="' + renderDayName(opts, i) + '">' + renderDayName(opts, i, true) + '</abbr></th>');
        }
        return '<thead>' + (opts.isRTL ? arr.reverse() : arr).join('') + '</thead>';
    },

    renderTitle = function (instance, c, year, month, refYear) {
        var i, j, arr,
            opts = instance._o,
            isMinYear = year === opts.minYear,
            isMaxYear = year === opts.maxYear,
            html = '<div class="pika-title">',
            monthHtml,
            yearHtml,
            prev = true,
            next = true;

        for (arr = [], i = 0; i < 12; i++) {
            arr.push('<option value="' + (year === refYear ? i - c : 12 + i - c) + '"' +
                (i === month ? ' selected' : '') +
                ((isMinYear && i < opts.minMonth) || (isMaxYear && i > opts.maxMonth) ? 'disabled' : '') + '>' +
                opts.i18n.months[i] + '</option>');
        }
        monthHtml = '<div class="pika-label">' + opts.i18n.months[month] + '<select class="pika-select pika-select-month">' + arr.join('') + '</select></div>';

        if (isArray(opts.yearRange)) {
            i = opts.yearRange[0];
            j = opts.yearRange[1] + 1;
        } else {
            i = year - opts.yearRange;
            j = 1 + year + opts.yearRange;
        }

        for (arr = []; i < j && i <= opts.maxYear; i++) {
            if (i >= opts.minYear) {
                arr.push('<option value="' + i + '"' + (i === year ? ' selected' : '') + '>' + (i) + '</option>');
            }
        }
        yearHtml = '<div class="pika-label">' + year + opts.yearSuffix + '<select class="pika-select pika-select-year">' + arr.join('') + '</select></div>';

        if (opts.showMonthAfterYear) {
            html += yearHtml + monthHtml;
        } else {
            html += monthHtml + yearHtml;
        }

        if (isMinYear && (month === 0 || opts.minMonth >= month)) {
            prev = false;
        }

        if (isMaxYear && (month === 11 || opts.maxMonth <= month)) {
            next = false;
        }

        if (c === 0) {
            html += '<button class="pika-prev' + (prev ? '' : ' is-disabled') + '" type="button">' + opts.i18n.previousMonth + '</button>';
        }
        if (c === (instance._o.numberOfMonths - 1)) {
            html += '<button class="pika-next' + (next ? '' : ' is-disabled') + '" type="button">' + opts.i18n.nextMonth + '</button>';
        }

        return html += '</div>';
    },

    renderTable = function (opts, data) {
        return '<table cellpadding="0" cellspacing="0" class="pika-table">' + renderHead(opts) + renderBody(data) + '</table>';
    },


    /**
     * Pikaday constructor
     */
    Pikaday = function (options) {
        var self = this,
            opts = self.config(options);

        self._onMouseDown = function (e) {
            if (!self._v) {
                return;
            }
            e = e || window.event;
            var target = e.target || e.srcElement;
            if (!target) {
                return;
            }

            if (!hasClass(target, 'is-disabled')) {
                if (hasClass(target, 'pika-button') && !hasClass(target, 'is-empty')) {
                    self.setDate(new Date(target.getAttribute('data-pika-year'), target.getAttribute('data-pika-month'), target.getAttribute('data-pika-day')));
                    if (opts.bound) {
                        sto(function () {
                            self.hide();
                        }, 100);
                    }
                    return;
                }
                else if (hasClass(target, 'pika-prev')) {
                    self.prevMonth();
                }
                else if (hasClass(target, 'pika-next')) {
                    self.nextMonth();
                }
            }
            if (!hasClass(target, 'pika-select')) {
                if (e.preventDefault) {
                    e.preventDefault();
                } else {
                    e.returnValue = false;
                    return false;
                }
            } else {
                self._c = true;
            }
        };

        self._onChange = function (e) {
            e = e || window.event;
            var target = e.target || e.srcElement;
            if (!target) {
                return;
            }
            if (hasClass(target, 'pika-select-month')) {
                self.gotoMonth(target.value);
            }
            else if (hasClass(target, 'pika-select-year')) {
                self.gotoYear(target.value);
            }
        };

        self._onInputChange = function (e) {
            var date;

            if (e.firedBy === self) {
                return;
            }
            if (hasMoment) {
                date = moment(opts.field.value, opts.format);
                date = (date && date.isValid()) ? date.toDate() : null;
            }
            else {
                date = new Date(Date.parse(opts.field.value));
            }
            self.setDate(isDate(date) ? date : null);
            if (!self._v) {
                self.show();
            }
        };

        self._onInputFocus = function () {
            self.show();
        };

        self._onInputClick = function () {
            self.show();
        };

        self._onInputBlur = function () {
            if (!self._c) {
                self._b = sto(function () {
                    self.hide();
                }, 50);
            }
            self._c = false;
        };

        self._onClick = function (e) {
            e = e || window.event;
            var target = e.target || e.srcElement,
                pEl = target;
            if (!target) {
                return;
            }
            if (!hasEventListeners && hasClass(target, 'pika-select')) {
                if (!target.onchange) {
                    target.setAttribute('onchange', 'return;');
                    addEvent(target, 'change', self._onChange);
                }
            }
            do {
                if (hasClass(pEl, 'pika-single')) {
                    return;
                }
            }
            while ((pEl = pEl.parentNode));
            if (self._v && target !== opts.trigger) {
                self.hide();
            }
        };

        self.el = document.createElement('div');
        self.el.className = 'pika-single' + (opts.isRTL ? ' is-rtl' : '');

        addEvent(self.el, 'mousedown', self._onMouseDown, true);
        addEvent(self.el, 'change', self._onChange);

        if (opts.field) {
            if (opts.bound) {
                document.body.appendChild(self.el);
            } else {
                opts.field.parentNode.insertBefore(self.el, opts.field.nextSibling);
            }
            addEvent(opts.field, 'change', self._onInputChange);

            if (!opts.defaultDate) {
                if (hasMoment && opts.field.value) {
                    opts.defaultDate = moment(opts.field.value, opts.format).toDate();
                } else {
                    opts.defaultDate = new Date(Date.parse(opts.field.value));
                }
                opts.setDefaultDate = true;
            }
        }

        var defDate = opts.defaultDate;

        if (isDate(defDate)) {
            if (opts.setDefaultDate) {
                self.setDate(defDate, true);
            } else {
                self.gotoDate(defDate);
            }
        } else {
            self.gotoDate(new Date());
        }

        if (opts.bound) {
            this.hide();
            self.el.className += ' is-bound';
            addEvent(opts.trigger, 'click', self._onInputClick);
            addEvent(opts.trigger, 'focus', self._onInputFocus);
            addEvent(opts.trigger, 'blur', self._onInputBlur);
        } else {
            this.show();
        }

    };


    /**
     * public Pikaday API
     */
    Pikaday.prototype = {


        /**
         * configure functionality
         */
        config: function (options) {
            if (!this._o) {
                this._o = extend({}, defaults, true);
            }

            var opts = extend(this._o, options, true);

            opts.isRTL = !!opts.isRTL;

            opts.field = (opts.field && opts.field.nodeName) ? opts.field : null;

            opts.bound = !!(opts.bound !== undefined ? opts.field && opts.bound : opts.field);

            opts.trigger = (opts.trigger && opts.trigger.nodeName) ? opts.trigger : opts.field;

            var nom = parseInt(opts.numberOfMonths, 10) || 1;
            opts.numberOfMonths = nom > 4 ? 4 : nom;

            if (!isDate(opts.minDate)) {
                opts.minDate = false;
            }
            if (!isDate(opts.maxDate)) {
                opts.maxDate = false;
            }
            if ((opts.minDate && opts.maxDate) && opts.maxDate < opts.minDate) {
                opts.maxDate = opts.minDate = false;
            }
            if (opts.minDate) {
                setToStartOfDay(opts.minDate);
                opts.minYear = opts.minDate.getFullYear();
                opts.minMonth = opts.minDate.getMonth();
            }
            if (opts.maxDate) {
                setToStartOfDay(opts.maxDate);
                opts.maxYear = opts.maxDate.getFullYear();
                opts.maxMonth = opts.maxDate.getMonth();
            }

            if (isArray(opts.yearRange)) {
                var fallback = new Date().getFullYear() - 10;
                opts.yearRange[0] = parseInt(opts.yearRange[0], 10) || fallback;
                opts.yearRange[1] = parseInt(opts.yearRange[1], 10) || fallback;
            } else {
                opts.yearRange = Math.abs(parseInt(opts.yearRange, 10)) || defaults.yearRange;
                if (opts.yearRange > 100) {
                    opts.yearRange = 100;
                }
            }

            return opts;
        },

        /**
         * return a formatted string of the current selection (using Moment.js if available)
         */
        toString: function (format) {
            return !isDate(this._d) ? '' : hasMoment ? moment(this._d).format(format || this._o.format) : this._d.toDateString();
        },

        /**
         * return a Moment.js object of the current selection (if available)
         */
        getMoment: function () {
            return hasMoment ? moment(this._d) : null;
        },

        /**
         * set the current selection from a Moment.js object (if available)
         */
        setMoment: function (date, preventOnSelect) {
            if (hasMoment && moment.isMoment(date)) {
                this.setDate(date.toDate(), preventOnSelect);
            }
        },

        /**
         * return a Date object of the current selection
         */
        getDate: function () {
            return isDate(this._d) ? new Date(this._d.getTime()) : null;
        },

        /**
         * set the current selection
         */
        setDate: function (date, preventOnSelect) {
            if (!date) {
                this._d = null;
                return this.draw();
            }
            if (typeof date === 'string') {
                date = new Date(Date.parse(date));
            }
            if (!isDate(date)) {
                return;
            }

            var min = this._o.minDate,
                max = this._o.maxDate;

            if (isDate(min) && date < min) {
                date = min;
            } else if (isDate(max) && date > max) {
                date = max;
            }

            this._d = new Date(date.getTime());
            setToStartOfDay(this._d);
            this.gotoDate(this._d);

            if (this._o.field) {
                this._o.field.value = this.toString();
                fireEvent(this._o.field, 'change', { firedBy: this });
            }
            if (!preventOnSelect && typeof this._o.onSelect === 'function') {
                this._o.onSelect.call(this, this.getDate());
            }
        },

        /**
         * change view to a specific date
         */
        gotoDate: function (date) {
            var newCalendar = true;

            if (!isDate(date)) {
                return;
            }

            if (this.calendars) {
                var firstVisibleDate = new Date(this.calendars[0].year, this.calendars[0].month, 1),
                    lastVisibleDate = new Date(this.calendars[this.calendars.length - 1].year, this.calendars[this.calendars.length - 1].month, 1),
                    visibleDate = date.getTime();
                // get the end of the month
                lastVisibleDate.setMonth(lastVisibleDate.getMonth() + 1);
                lastVisibleDate.setDate(lastVisibleDate.getDate() - 1);
                newCalendar = (visibleDate < firstVisibleDate.getTime() || lastVisibleDate.getTime() < visibleDate);
            }

            if (newCalendar) {
                this.calendars = [{
                    month: date.getMonth(),
                    year: date.getFullYear()
                }];
                if (this._o.mainCalendar === 'right') {
                    this.calendars[0].month += 1 - this._o.numberOfMonths;
                }
            }

            this.adjustCalendars();
        },

        adjustCalendars: function () {
            this.calendars[0] = adjustCalendar(this.calendars[0]);
            for (var c = 1; c < this._o.numberOfMonths; c++) {
                this.calendars[c] = adjustCalendar({
                    month: this.calendars[0].month + c,
                    year: this.calendars[0].year
                });
            }
            this.draw();
        },

        gotoToday: function () {
            this.gotoDate(new Date());
        },

        /**
         * change view to a specific month (zero-index, e.g. 0: January)
         */
        gotoMonth: function (month) {
            if (!isNaN(month)) {
                this.calendars[0].month = parseInt(month, 10);
                this.adjustCalendars();
            }
        },

        nextMonth: function () {
            this.calendars[0].month++;
            this.adjustCalendars();
        },

        prevMonth: function () {
            this.calendars[0].month--;
            this.adjustCalendars();
        },

        /**
         * change view to a specific full year (e.g. "2012")
         */
        gotoYear: function (year) {
            if (!isNaN(year)) {
                this.calendars[0].year = parseInt(year, 10);
                this.adjustCalendars();
            }
        },

        /**
         * change the minDate
         */
        setMinDate: function (value) {
            this._o.minDate = value;
        },

        /**
         * change the maxDate
         */
        setMaxDate: function (value) {
            this._o.maxDate = value;
        },

        /**
         * refresh the HTML
         */
        draw: function (force) {
            if (!this._v && !force) {
                return;
            }
            var opts = this._o,
                minYear = opts.minYear,
                maxYear = opts.maxYear,
                minMonth = opts.minMonth,
                maxMonth = opts.maxMonth,
                html = '';

            if (this._y <= minYear) {
                this._y = minYear;
                if (!isNaN(minMonth) && this._m < minMonth) {
                    this._m = minMonth;
                }
            }
            if (this._y >= maxYear) {
                this._y = maxYear;
                if (!isNaN(maxMonth) && this._m > maxMonth) {
                    this._m = maxMonth;
                }
            }

            for (var c = 0; c < opts.numberOfMonths; c++) {
                html += '<div class="pika-lendar">' + renderTitle(this, c, this.calendars[c].year, this.calendars[c].month, this.calendars[0].year) + this.render(this.calendars[c].year, this.calendars[c].month) + '</div>';
            }

            this.el.innerHTML = html;

            if (opts.bound) {
                if (opts.field.type !== 'hidden') {
                    sto(function () {
                        opts.trigger.focus();
                    }, 1);
                }
            }

            if (typeof this._o.onDraw === 'function') {
                var self = this;
                sto(function () {
                    self._o.onDraw.call(self);
                }, 0);
            }
        },

        adjustPosition: function () {
            var field = this._o.trigger, pEl = field,
            width = this.el.offsetWidth, height = this.el.offsetHeight,
            viewportWidth = window.innerWidth || document.documentElement.clientWidth,
            viewportHeight = window.innerHeight || document.documentElement.clientHeight,
            scrollTop = window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop,
            left, top, clientRect;

            if (typeof field.getBoundingClientRect === 'function') {
                clientRect = field.getBoundingClientRect();
                left = clientRect.left + window.pageXOffset;
                top = clientRect.bottom + window.pageYOffset;
            } else {
                left = pEl.offsetLeft;
                top = pEl.offsetTop + pEl.offsetHeight;
                while ((pEl = pEl.offsetParent)) {
                    left += pEl.offsetLeft;
                    top += pEl.offsetTop;
                }
            }

            // default position is bottom & left
            if (left + width > viewportWidth ||
                (
                    this._o.position.indexOf('right') > -1 &&
                    left - width + field.offsetWidth > 0
                )
            ) {
                left = left - width + field.offsetWidth;
            }
            if (top + height > viewportHeight + scrollTop ||
                (
                    this._o.position.indexOf('top') > -1 &&
                    top - height - field.offsetHeight > 0
                )
            ) {
                top = top - height - field.offsetHeight;
            }
            this.el.style.cssText = [
                'position: absolute',
                'left: ' + left + 'px',
                'top: ' + top + 'px'
            ].join(';');
        },

        /**
         * render HTML for a particular month
         */
        render: function (year, month) {
            var opts = this._o,
                now = new Date(),
                days = getDaysInMonth(year, month),
                before = new Date(year, month, 1).getDay(),
                data = [],
                row = [];
            setToStartOfDay(now);
            if (opts.firstDay > 0) {
                before -= opts.firstDay;
                if (before < 0) {
                    before += 7;
                }
            }
            var cells = days + before,
                after = cells;
            while (after > 7) {
                after -= 7;
            }
            cells += 7 - after;
            for (var i = 0, r = 0; i < cells; i++) {
                var day = new Date(year, month, 1 + (i - before)),
                    isDisabled = (opts.minDate && day < opts.minDate) || (opts.maxDate && day > opts.maxDate),
                    isSelected = isDate(this._d) ? compareDates(day, this._d) : false,
                    isToday = compareDates(day, now),
                    isEmpty = i < before || i >= (days + before);

                row.push(renderDay(1 + (i - before), month, year, isSelected, isToday, isDisabled, isEmpty));

                if (++r === 7) {
                    data.push(renderRow(row, opts.isRTL));
                    row = [];
                    r = 0;
                }
            }
            return renderTable(opts, data);
        },

        isVisible: function () {
            return this._v;
        },

        show: function () {
            if (!this._v) {
                removeClass(this.el, 'is-hidden');
                this._v = true;
                this.draw();
                if (this._o.bound) {
                    addEvent(document, 'click', this._onClick);
                    this.adjustPosition();
                }
                if (typeof this._o.onOpen === 'function') {
                    this._o.onOpen.call(this);
                }
            }
        },

        hide: function () {
            var v = this._v;
            if (v !== false) {
                if (this._o.bound) {
                    removeEvent(document, 'click', this._onClick);
                }
                this.el.style.cssText = '';
                addClass(this.el, 'is-hidden');
                this._v = false;
                if (v !== undefined && typeof this._o.onClose === 'function') {
                    this._o.onClose.call(this);
                }
            }
        },

        /**
         * GAME OVER
         */
        destroy: function () {
            this.hide();
            removeEvent(this.el, 'mousedown', this._onMouseDown, true);
            removeEvent(this.el, 'change', this._onChange);
            if (this._o.field) {
                removeEvent(this._o.field, 'change', this._onInputChange);
                if (this._o.bound) {
                    removeEvent(this._o.trigger, 'click', this._onInputClick);
                    removeEvent(this._o.trigger, 'focus', this._onInputFocus);
                    removeEvent(this._o.trigger, 'blur', this._onInputBlur);
                }
            }
            if (this.el.parentNode) {
                this.el.parentNode.removeChild(this.el);
            }
        }

    };

    return Pikaday;

}));


/*!
 * Pikaday jQuery plugin.
 *
 * Copyright Â© 2013 David Bushell | BSD & MIT license | https://github.com/dbushell/Pikaday
 */

(function (root, factory) {
    'use strict';

    if (typeof exports === 'object') {
        // CommonJS module
        factory(require('jquery'), require('../pikaday'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'pikaday'], factory);
    } else {
        // Browser globals
        factory(root.jQuery, root.Pikaday);
    }
}(this, function ($, Pikaday) {
    'use strict';

    $.fn.pikaday = function () {
        var args = arguments;

        if (!args || !args.length) {
            args = [{}];
        }

        return this.each(function () {
            var self = $(this),
                plugin = self.data('pikaday');

            if (!(plugin instanceof Pikaday)) {
                if (typeof args[0] === 'object') {
                    var options = $.extend({}, args[0]);
                    options.field = self[0];
                    self.data('pikaday', new Pikaday(options));
                }
            } else {
                if (typeof args[0] === 'string' && typeof plugin[args[0]] === 'function') {
                    plugin[args[0]].apply(plugin, Array.prototype.slice.call(args, 1));
                }
            }
        });
    };

}));


var frontutils = frontutils || {};

frontutils.tablesaw = (function () {
    'use strict';

    function init() {
        $(document).trigger("enhance.tablesaw");
    }

    return {
        init: init
    };

}());

frontutils.alert = (function () {
    'use strict';

    function init() {
        ariaAlert();
    }

    function ariaAlert() {
        $('[class*="ft-alert"]').attr({ role: 'alert' });
    }

    return {
        init: init
    };

}());

frontutils.breakpoints = (function () {
    'use strict';

    //
    // Sizes of breakpoints Standards
    //
    var config = {
        sm: '768',
        md: '992',
        lg: '1200',
        html: null
    };

    function init(userConfig) {
        config.html = $('html');

        breakpointWindowWidth(userConfig);
        breakpointScreenWidth(userConfig);
        changeClassBreakpoint();
    }

    //
    // Changes the css class in html tag according to the breakpoint size
    //
    function breakpointWindowWidth(userConfig) {
        var documentWidth;

        if (userConfig) {
            documentWidth = userConfig.documentWidth;
        } else {
            documentWidth = $(document).width();
        }

        // If less than 768 - xs
        if (documentWidth < config.sm) {
            config.html.addClass('ft-window-xs');
            frontutils.breakpointClass = "ft-window-xs";
        }

            // If greater than or equal to 768 and less than 992 - sm
        else if (documentWidth >= config.sm && documentWidth < config.md) {
            config.html.addClass('ft-window-sm').removeClass('ft-sidebar-visible ft-notifications-visible ');
            frontutils.breakpointClass = "ft-window-sm";
        }

            // If greater than or equal to 992 and less than 1200 - md
        else if (documentWidth >= config.md && documentWidth < config.lg) {
            config.html.addClass('ft-window-md').removeClass('ft-sidebar-visible ft-notifications-visible ');
            frontutils.breakpointClass = "ft-window-md";
        }

            // If greater than or equal to 1200 - lg
        else {
            config.html.addClass('ft-window-lg').removeClass('ft-sidebar-visible ft-notifications-visible ');
            frontutils.breakpointClass = "ft-window-lg";
        }
    }

    //
    // Changing the class in html tag according to the screen .
    //
    function breakpointScreenWidth(userConfig) {
        var screenWidth;

        if (userConfig) {
            screenWidth = userConfig.documentWidth;
        } else {
            screenWidth = screen.width;
        }

        // If less than 768 - xs
        if (screenWidth < config.sm) {
            config.html.addClass('ft-screen-xs');
            frontutils.breakpointScreenClass = "ft-screen-xs";
        }

            // If greater than or equal to 768 and less than 992 - sm
        else if (screenWidth >= config.sm && screenWidth < config.md) {
            config.html.addClass('ft-screen-sm');
            frontutils.breakpointScreenClass = "ft-screen-sm";
        }

            // If greater than or equal to 992 and less than 1200 - md
        else if (screenWidth >= config.md && screenWidth < config.lg) {
            config.html.addClass('ft-screen-md');
            frontutils.breakpointScreenClass = "ft-screen-md";
        }

            // If greater than or equal to 1200 - lg
        else {
            config.html.addClass('ft-screen-lg');
            frontutils.breakpointScreenClass = "ft-screen-lg";
        }
    }

    //
    // Changing the class in html tag when resized the window.
    //
    function changeClassBreakpoint() {

        var changeClass;

        $(window).resize(function () {
            clearTimeout(changeClass);

            changeClass = setTimeout(function () {

                var breakpointActive = config.html.attr('class').replace(/(^|\s)(ft-window-\S+)|(ft-screen-\S+)/g, '');

                config.html.attr('class', $.trim(breakpointActive));

                breakpointWindowWidth();
                breakpointScreenWidth();

                // event triggers to inform other modules that the breakpoint has been updated
                $.event.trigger("breakpoint-updated");
            }, 300);

        });
    }

    return {
        init: init
    };

}());

frontutils.browserDetect = (function () {
    'use strict';

    var userAgent = navigator.userAgent.toLowerCase();
    function init() {
        browserClass();
    }

    var name;
    function browserName() {
        if (userAgent.match(/(firefox)/)) {
            name = userAgent.match(/(firefox)/)[1];
        } else {
            name = (userAgent.match(/(msie|phantomjs|chrome|version|rv)/))[1];
        }
        return name;
    }

    function browserVersion() {
        return parseInt((userAgent.match(/.+(?:firefox|phantomjs|msie|chrome|version|rv)[\/: ]([\d.]+)/) || [0, 0])[1].split('.')[0], 10);
    }

    function browserClass() {
        $("html").addClass('ft-browser-' + browserName());
    }

    return {
        init: init,
        browserName: browserName,
        browserVersion: browserVersion
    };

}());

frontutils.browserUnsupportedBar = (function () {
    'use strict';

    function init() {
        browserDetect();
        hideBrowserUnsupportedAlert();
    }

    function browserDetect() {
        var version = frontutils.browserDetect.browserVersion();
        var name = frontutils.browserDetect.browserName();
        var minBrowserVersions = {
            'chrome': 34,
            'firefox': 29,
            'version': 5, // Safari
            'msie': 7 // Internet Explorer
            // 'rv'  : 11  // Internet Explorer 11+
        };

        //if (!$.cookie('hideBrowserUnsupportedAlert')) {
            if (version <= minBrowserVersions[name]) {
                openUsupportedBrowserAlert();
            }
        //}

    }

    function openUsupportedBrowserAlert() {
        $('html').addClass('ft-browser-unsupported');
        // $('body').prepend(frontutils.templates.browserUnsupportedBar());

        $('body')
            .append('<div class="ft-modal ft-modal-alert ft-opened" data-modal-blocked style="background-color:#000;">' +
                '<div class="ft-modal-box ft-modal-small">' +
                    '<div class="ft-modal-content">' +
                        '<div class="ft-modal-header">' +
                            '<h4 class="ft-modal-alert-title">Aten&ccedil;&atilde;o</h4>' +
                        '</div>' +
                        '<div class="ft-modal-body">' +
                            '<p class="ft-modal-alert-content" style="font-size:16px;">' +
                                '<strong>Atualize seu navegador!</strong><br>Baixe a vers&atilde;o mais recente:<br>' +
                                '<a target="_blank" href="//www.mozilla.org/en-US/firefox">Firefox</a>, <a target="_blank" href="//www.google.com/intl/en-BR/chrome/browser/">Chrome</a>, ' +
                                '<a target="_blank" class="hidden-sm hidden-xs" href="//windows.microsoft.com/en-us/internet-explorer/download-ie">Internet Explorer</a> ou ' +
                                '<a target="_blank" href="//www.apple.com/safari/">Safari</a>' +
                            '</p>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>');
    }

    function hideBrowserUnsupportedAlert() {
        $('.ft-dismiss[data-ft-module=dismiss]').on('click', function () {
            $('html').removeClass('ft-browser-unsupported');
            $('html .ft-unsupported-bar').remove();
            //$.cookie('hideBrowserUnsupportedAlert', true, { expires: 1 });

        });
    }

    return {
        init: init
    };

}());

frontutils.btnGroup = (function () {
    'use strict';

    function init() {
        checkBreakpoint();
        bindBreakpointUpdateOnChecker();
    }

    function unbind() {
        $(document).off("breakpoint-updated");
    }

    // bind the breakpoint-updated event calls the checker when fired
    function bindBreakpointUpdateOnChecker() {
        unbind();

        $(document).on("breakpoint-updated", function () {
            checkBreakpoint();
        });
    }

    // checks if the breakpoint is mobile, if yes the action is to group
    function checkBreakpoint() {
        if (frontutils.breakpointClass === "ft-window-sm" || frontutils.breakpointClass === "ft-window-xs") {
            $(".ft-regroup").each(function (index, $element) {
                group($($element).find('a, button'));
            });

            // call init in the modules used by dropdown
            frontutils.dropdown.init();
            frontutils.modal.init();
            frontutils.general.init();
        }
    }

    // groups the buttons on a dropdown
    function group($element) {
        var list = $($element).wrap('<li class="hidden-xs hidden-sm">');
        $element.parents('.ft-regroup').find('a[class*="ft-btn"]').removeClass();
        $element.parents('.ft-regroup').html(frontutils.templates.dropdown(list));
    }

    return {
        init: init
    };

}());

frontutils.charCounter = (function () {
    'use strict';

    function init() {
        countText();
    }

    function countText() {
        $('[data-ft-module="charCounter"]').each(function (index, field) {
            var limit = $(field).attr('maxlength');
            $(field).removeAttr('maxlength').data().maxlength = limit;
            $(field).after('<p class="ft-help-inline"><small><strong class="ft-char-count ft-number-counter-' + index + '">' + limit + '</strong> caracteres restantes</small></p>');

            $(field).keyup(function () {
                var count = $(this).val().length;
                var limit = $(this).data().maxlength;

                if (count > limit) {
                    $(this).val($(this).val().substring(0, limit));
                } else {
                    updateCounter(index, limit - count);
                }
            });

            $(field).trigger('keyup');
        });
    }

    function updateCounter(index, count) {
        $('.ft-number-counter-' + index).text(count);
    }

    return {
        init: init
    };

}());

frontutils.collapse = (function () {
    'use strict';

    // general config
    var config = {
        trigger: '[data-ft-module="collapse"]',
        classes: {
            header: '.ft-collapse-header',
            content: '.ft-collapse-body',
            groupContainer: '.ft-collapse-group',
            open: 'ft-collapse-open',
            close: 'ft-collapse-close',
            opened: 'ft-collapse-opened',
            alwaysOpened: 'ft-collapse-opened-always'
        }
    };

    function init() {
        // set attributes from all collapses on load
        $(config.classes.header).each(function () {
            ariaCollapse($(this));
        });
        bind();
    }

    function bind() {
        $(config.trigger).each(function (index, element) {
            if (!$(element).hasClass(config.classes.alwaysOpened)) {
                $(element).on('click.ls', function () {
                    groupCollapse($(this));
                    // get target
                    var target = $(this).data('target');
                    // set aria's attributes
                    ariaCollapse($(this));
                    // set event
                    eventsHandler($(this), target);

                });
                // if click on ck-collapse-body no action happens
                $(config.classes.content).on('click.ls', function (event) {
                    event.stopPropagation();
                });
            }
        });
    }

    // if have collapses in group "accordeon"
    function groupCollapse(collapse) {
        var $group = collapse.parents(config.classes.groupContainer);
        if ($group[0]) {
            $group.find(config.trigger).not(collapse).removeClass(config.classes.opened).find(config.classes.content).slideUp();
        }
    }

    function eventsHandler(el, target) {
        if ($(target).parent().hasClass(config.classes.opened)) {
            $(target).parent().removeClass(config.classes.opened);
            el.trigger('collapse:closed');
        } else {
            $(target).parent().addClass(config.classes.opened);
            el.trigger('collapse:opened');
        }
    }


    function ariaCollapse(elem) {
        if ($(elem).hasClass(config.classes.open)) {
            $(config.classes.header).attr({ 'aria-expanded': true });
            $(config.classes.content).attr({ 'aria-hidden': false });
        } else {
            $(config.classes.header).attr({ 'aria-expanded': false });
            $(config.classes.content).attr({ 'aria-hidden': true });
        }
    }

    return {
        init: init
    };

}());

frontutils.datepicker = (function () {
    'use strict';

    var config = {
        selector: '.datepicker',
        rangeSelector: '[data-ft-daterange]',
        pikaday: {
            firstDay: 1,
            minDate: new Date('2000-01-01'),
            maxDate: new Date('2020-12-31'),
            format: 'DD/MM/YYYY',
            yearRange: [2000, 2020],
            i18n: {
                previousMonth: 'Anterior',
                nextMonth: 'PrÃ³ximo',
                months: ['Janeiro', 'Fevereiro', 'MarÃ§o', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
                weekdays: ['Domingo', 'Segunda', 'TerÃ§a', 'Quarta', 'Quinta', 'Sexta', 'SÃ¡bado'],
                weekdaysShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'SÃ¡b']
            }
        }
    };

    function init() {
        // Datepicker without range
        $(config.selector).each(function () {
            if (!$(this).hasClass('ft-daterange')) {
                create($(this));
            }
        });

        // Datepicker with range
        $(config.rangeSelector).each(function () {
            createWithRange($(this));
        });
    }

    function create(el) {
        el.pikaday(config.pikaday);
    }

    function createWithRange(el) {
        var picker1 = null;
        var picker2 = null;

        var pickerStartObj = {
            field: el[0],
            onSelect: function () {
                picker2.setMinDate(this.getDate());
            }
        };

        var pickerEndObj = {
            field: $(el.data('ft-daterange'))[0],
            onSelect: function () {
                picker1.setMaxDate(this.getDate());
            }
        };

        picker1 = new Pikaday($.extend(pickerStartObj, config.pikaday));
        picker2 = new Pikaday($.extend(pickerEndObj, config.pikaday));
    }

    function newDatepicker(selector) {
        create($(selector));
    }

    return {
        init: init,
        newDatepicker: newDatepicker,
        createWithRange: createWithRange
    };

}());

frontutils.dismiss = (function () {
    'use strict';

    var config = {
        trigger: '[data-ft-module=dismiss]',
        triggerClose: 'dismiss:close'
    };

    function init() {
        unbind();
        bindClickOnTriggers();
    }

    function unbind() {
        $(config.trigger).off('click.ls');
    }

    function bindClickOnTriggers() {
        $(config.trigger).on('click.ls', function () {
            checkTarget(this);
            frontutils.topbarCurtain.updateStatusCounter();
        });
    }

    function checkTarget(el) {
        var target = $(el).parents('.ft-dismissable');
        if ($(el).data('target')) {
            target = ($(el).data('target'));
        }
        dismiss(target);
    }

    function dismiss(el) {
        $(el).addClass('ft-dismissed');
        $(el).trigger(config.triggerClose);
    }

    return {
        init: init,
        unbind: unbind
    };

}());

frontutils.dropdown = (function () {
    'use strict';

    var config = {
        area: 'body',
        dropdown: '.ft-dropdown',
        module: '[data-ft-module="dropdown"]',
        button: '[class*="ft-btn"]',
        firstLink: '[data-ft-module="dropdown"] > [class*="ft-btn"]:first-child, .ft-dropdown.ft-user-account > a:first-child',
        nav: '.ft-dropdown-nav'
    };

    function init() {
        unbind();
        bindClickOnTriggers();
        bindClickOutsideTriggers();
        ariaDropdown(config.dropdown);
    }

    function unbind() {
        $(config.firstLink).off("click.ls");
        $(config.area).off("click.ls");
    }

    function bindClickOnTriggers() {
        $(config.firstLink).on("click.ls", function (evt) {
            evt.preventDefault();
            var $target = $($(this).parents(config.module));
            frontutils.dropdown.toggleDropdown($target);
            setPositionVisible($target);
            evt.stopPropagation();
        });
    }

    function bindClickOutsideTriggers() {
        $(config.area).on("click.ls", function () {
            frontutils.dropdown.closeDropdown();
        });
    }

    function toggleDropdown($target) {
        if (!$target.find(config.button).first().hasClass('ft-disabled')) {
            closeDropdown($target);
            $target.toggleClass("ft-active");
            ariaDropdown($target);
            frontutils.topbarCurtain.hideCurtains();
            eventsHandler($target);
        }
    }

    function eventsHandler(el) {
        if ($(el).hasClass("ft-active")) {
            $(el).trigger('dropdown:opened');
        } else {
            $(el).trigger('dropdown:closed');
        }
    }

    function closeDropdown(el) {
        $(config.module).not(el).removeClass("ft-active");
    }

    function setPositionVisible($target) {
        var $main = $(config.area);
        if ($main.get(0).scrollWidth > $main.width()) {
            $($target).addClass('ft-pos-right');
        }
    }

    function ariaDropdown(el) {
        $(config.button).attr({ 'aria-expanded': 'false' });
        $(config.nav).attr({ 'aria-hidden': 'true' });

        $(el).each(function () {
            $(config.nav).find('a').attr({ role: 'option' });
            $(config.button).attr({ role: 'combobox' });

            if ($(this).hasClass('ft-active')) {
                $(config.button, $(this)).attr({ 'aria-expanded': 'true' });
                $(config.nav, $(this)).attr({ 'aria-hidden': 'false' });
            } else {
                $(config.button, $(this)).attr({ 'aria-expanded': 'false' });
                $(config.nav, $(this)).attr({ 'aria-hidden': 'true' });
            }
        });
    }

    return {
        init: init,
        unbind: unbind,
        toggleDropdown: toggleDropdown,
        closeDropdown: closeDropdown
    };

}());

frontutils.form = (function () {
    'use strict';

    var config = {
        selectors: {
            disable: '.ft-form-disable',
            text: '.ft-form-text',
            blank: '.ft-valid'
        }
    };

    function init() {
        unbind();
        formDisable();
        formText();
        masks();
        textareaAutoresize();
        prefixSufix();
        togglePasswordField();
        textareaHeight();
        checkBlank();
        validDate();
        validCNPJ();
        validaCPF();
        validaRG();
        validarEmail();
        changeCEP();
    }

    function changeCEP(){
        $($('.ft-form[data-ft-module="form"]')).each(function (indexContainer, container) {
            var $container = $(container);

            $container.find('.ft-get-cep').on('keyup', function(e){
                var campo = $(e.currentTarget);
                var endereco = campo.data("endereco");
                var numero = campo.data("numero");
                var bairro = campo.data("bairro");
                var estado = campo.data("estado");
                var cidade = campo.data("cidade");
                
                if (campo.val().length==9) {

                    if ($.trim(campo.val()) != "") {
                        $.getScript("http://cep.republicavirtual.com.br/web_cep.php?formato=javascript&cep=" + campo.val(), function () {
                            if (resultadoCEP["resultado"] != 0) {
                                campo.parents('.ft-form').find('#'+ endereco +'').val(unescape(resultadoCEP["tipo_logradouro"]) + ' ' + unescape(resultadoCEP["logradouro"]));
                                campo.parents('.ft-form').find('#'+ bairro +'').val(unescape(resultadoCEP["bairro"]));
                                campo.parents('.ft-form').find('#'+ estado +'').val(unescape(resultadoCEP["uf"]));
                                campo.parents('.ft-form').find('#'+ cidade +'').val(unescape(resultadoCEP["cidade"]));

                                campo.parents('.ft-form').find('#'+ numero +'').focus();
                            } else {
                                campo.parents('.ft-form').find('#'+ endereco +'').val('');
                                campo.parents('.ft-form').find('#'+ bairro +'').val('');
                                campo.parents('.ft-form').find('#'+ estado +'').val('');
                                campo.parents('.ft-form').find('#'+ cidade +'').val('');

                                frontutils.modal.alert({ title: "OOPPSSS!!", content: "Ops! CEP nÃ£o encontrado! Verifique novamente ou entre com os dados manualmente." });
                            }
                        });
                    }

                }

            });
        });
    }

    function validarEmail(){
        $($('.ft-form[data-ft-module="form"]')).each(function (indexContainer, container) {
            var $container = $(container);

            $container.find('.ft-valid-email').on('blur', function(e){
                var campo = $(e.currentTarget);
                
                if (!checkEmail(campo)) {

                    frontutils.modal.alert({title: "OOPPSSS!!", content: "Ops! E-mail invalido!"});
                    campo.val('');
                }

            });
        });
    }

    function checkEmail(obj){
        if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test($(obj).val())) return true;
        else return false
    }

    function validaRG(){
        $($('.ft-form[data-ft-module="form"]')).each(function (indexContainer, container) {
            var $container = $(container);

            $container.find('.ft-valid-rg').on('blur', function(e){
                var campo = $(e.currentTarget);
                var numero = campo.val();

                // if (numero.length == 12) {
                    numero = numero.replace('-', '');
                    numero = numero.replace(/\./g, '');
                    numero = numero.split("");

                    var tamanho = numero.length;
                    var vetor = new Array(tamanho);

                    if(tamanho>=1)
                    {
                        vetor[0] = parseInt(numero[0]) * 2; 
                    }
                    if(tamanho>=2){
                        vetor[1] = parseInt(numero[1]) * 3; 
                    }
                    if(tamanho>=3){
                        vetor[2] = parseInt(numero[2]) * 4; 
                    }
                    if(tamanho>=4){
                        vetor[3] = parseInt(numero[3]) * 5; 
                    }
                    if(tamanho>=5){
                        vetor[4] = parseInt(numero[4]) * 6; 
                    }
                    if(tamanho>=6){
                        vetor[5] = parseInt(numero[5]) * 7; 
                    }
                    if(tamanho>=7){
                        vetor[6] = parseInt(numero[6]) * 8; 
                    }
                    if(tamanho>=8){
                        vetor[7] = parseInt(numero[7]) * 9; 
                    }
                    if(tamanho>=9){
                        vetor[8] = parseInt(numero[8]) * 100; 
                    }

                    var total = 0;

                    if(tamanho>=1){
                        total += vetor[0];
                    }
                    if(tamanho>=2){
                        total += vetor[1]; 
                    }
                    if(tamanho>=3){
                        total += vetor[2]; 
                    }
                    if(tamanho>=4){
                        total += vetor[3]; 
                    }
                    if(tamanho>=5){
                        total += vetor[4]; 
                    }
                    if(tamanho>=6){
                        total += vetor[5]; 
                    }
                    if(tamanho>=7){
                        total += vetor[6];
                    }
                    if(tamanho>=8){
                        total += vetor[7]; 
                    }
                    if(tamanho>=9){
                        total += vetor[8]; 
                    }


                    var resto = total % 11;

                    if(resto!=0){
                        campo.val('');
                        frontutils.modal.alert({title: "OOPPSSS!!", content: "Ops! RG InvÃ¡lido!"});
                    }
                // }

            });
        });
    }

    function validaCPF(){
        $($('.ft-form[data-ft-module="form"]')).each(function (indexContainer, container) {
            var $container = $(container);

            $container.find('.ft-valid-cpf').on('keyup', function(e){
                var campo = $(e.currentTarget);
                var cpf = campo.val();
                var numeros;
                var digitos;
                var soma;
                var i;
                var resultado;
                var digitos_iguais;

                if (cpf.length == 14) {
                    cpf = cpf.replace('-', '');
                    cpf = cpf.replace(/\./g, '');

                    digitos_iguais = 1;

                    if (cpf.length != 11 || cpf == "00000000000" || cpf == "11111111111" || cpf == "22222222222" || cpf == "33333333333" || cpf == "44444444444" || cpf == "55555555555" || cpf == "66666666666" || cpf == "77777777777" || cpf == "88888888888" || cpf == "99999999999"){
                        frontutils.modal.alert({title: "OOPPSSS!!", content: "Ops! CPF invalido!"});
                        $(campo).val('');
                        return false;
                    }            

                    if (cpf.length < 11){
                        frontutils.modal.alert({title: "OOPPSSS!!", content: "Ops! CPF invalido!"});
                        $(campo).val('');

                        return false;
                    }

                    for (i = 0; i < cpf.length - 1; i++){
                        if (cpf.charAt(i) != cpf.charAt(i + 1)) {
                            digitos_iguais = 0;
                            
                            break;
                        }    
                    }

                    if(!digitos_iguais){
                        numeros = cpf.substring(0,9);
                        digitos = cpf.substring(9);
                        soma = 0;

                        for (i = 10; i > 1; i--){
                            soma += numeros.charAt(10 - i) * i;
                        }
                        
                        resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;

                        if (resultado != digitos.charAt(0)){
                            frontutils.modal.alert({title: "OOPPSSS!!", content: "Ops! CPF invalido!"});
                            $(campo).val('');

                            return false;    
                        }
                        
                        numeros = cpf.substring(0,10);
                        soma = 0;

                        for (i = 11; i > 1; i--){
                            soma += numeros.charAt(11 - i) * i;    
                        }
                        
                        resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;

                        if (resultado != digitos.charAt(1)){
                            frontutils.modal.alert({title: "OOPPSSS!!", content: "Ops! CPF invalido!"});
                            $(campo).val('');
                            
                            return false;
                        }
                        
                        return true;
                    } 
                }
            });
        });
    }

    function validCNPJ(){
        $($('.ft-form[data-ft-module="form"]')).each(function (indexContainer, container) {
            var $container = $(container);

            $container.find('.ft-valid-cnpj').on('keyup', function(e){
                var campo = $(e.currentTarget);
                var cnpj = campo.val();

                if(cnpj.length == 18){
                    if(cnpj.length < 18){
                        frontutils.modal.alert({ title: "OOPPSSS!!", content: "Ops! CNPJ Invalido!" });

                        campo.val('');
                    } else{

                        var valida = new Array(6,5,4,3,2,9,8,7,6,5,4,3,2);
                        var dig1 = new Number;
                        var dig2 = new Number;

                        var exp = /\.|\-|\//g
                        cnpj = cnpj.toString().replace( exp, "" ); 
                        var digito = new Number(eval(cnpj.charAt(12)+cnpj.charAt(13)));

                        for(var i = 0; i<valida.length; i++){
                            dig1 += (i>0? (cnpj.charAt(i-1)*valida[i]):0);  
                            dig2 += cnpj.charAt(i)*valida[i];       
                        }
                        dig1 = (((dig1%11)<2)? 0:(11-(dig1%11)));
                        dig2 = (((dig2%11)<2)? 0:(11-(dig2%11)));

                        if(((dig1*10)+dig2) != digito)  {
                            frontutils.modal.alert({ title: "OOPPSSS!!", content: "Ops! CNPJ Invalido!" });

                            campo.val('');
                        }

                    }
                }

            });
        });
    }

    function validDate(){
        $($('.ft-form[data-ft-module="form"]')).each(function (indexContainer, container) {
            var $container = $(container);

            $container.find('.ft-valid-date').on('keyup', function(e){
                var date = $(this).val();
                var ardt = new Array;
                var ExpReg = new RegExp("(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[012])/[12][0-9]{3}");
                var erro = false;

                if (date.length == 10) {
                    ardt = date.split("/");

                    if ( date.search(ExpReg)==-1){
                        erro = true;
                        }
                    else if (((ardt[1]==4)||(ardt[1]==6)||(ardt[1]==9)||(ardt[1]==11))&&(ardt[0]>30))
                        erro = true;
                    else if ( ardt[1]==2) {
                        if ((ardt[0]>28)&&((ardt[2]%4)!=0))
                            erro = true;
                        if ((ardt[0]>29)&&((ardt[2]%4)==0))
                            erro = true;
                    }
                    if (erro) {
                        frontutils.modal.alert({title: "OOPPSSS!!", content: "Ops! O campo Data nÃ£o Ã© uma data vÃ¡lida!"});
                        $(this).val('');

                        return false;
                    }

                    return true;
                }
            });
        });
    }

    function checkBlank(){
        $($('.ft-form[data-ft-module="form"]')).each(function (indexContainer, container) {
            var $container = $(container);

            $container.find('button[data-valid="form"]').on('click', function(e){
                var vCheck = true;
                var _return = $(this).data("return");
                var _valid = $(this).parents('.ft-form[data-ft-module="form"]').find('.ft-valid');

                $.each(_valid, function(i, item){
                    if ($(item).val() === '') {
                        vCheck = false;

                        $(item).parent().addClass('ft-error');
                    } else {
                        $(item).parent().removeClass('ft-error');
                    }
                });

                if (!vCheck) {
                    frontutils.modal.alert({title: "OOPPSSS!!", content: "Preencha todos os campos em vermelho."});
                } else{
                    activateForm(this);

                    return _return;
                }

                return false;
            });
        });
    }

    // activates the flap in accordance with the received arguments
    function activateForm(el) {
        $(el).trigger('form:send');
    }

    function prefixSufix() {
        if (frontutils.breakpointClass === 'ft-window-xs') {
            $('.ft-label-text-sufix').parents('.ft-label').addClass('ft-label-text-has-sufix');
            $('.ft-label-text-prefix').parents('.ft-label').addClass('ft-label-text-has-prefix');
        } else {
            $('.ft-label-text-sufix').prev('[class*="col-"]')
              .addClass('ft-no-padding-right')
              .find(':input').addClass('ft-no-right-radius ft-border');
        }
    }

    function textareaAutoresize() {
        $('textarea.ft-textarea-autoresize', '.ft-label').each(function (index, textarea) {
            var $textarea = $(textarea);
            $textarea.keyup(function () {
                if (!$textarea.prop('scrollTop')) {
                    var scrollHeight;
                    do {
                        scrollHeight = $textarea.prop('scrollHeight');
                        var height = $textarea.height();
                        $textarea.height(height - 5);
                    } while (scrollHeight && (scrollHeight !== $textarea.prop('scrollHeight')));
                }
                $textarea.height($textarea.prop('scrollHeight'));
            });
        });
    }

    function textareaHeight() {
        $('textarea').each(function (index, textarea) {
            var text = $(textarea).val();
            var lines = text.split(/\r|\r\n|\n/);
            var count = lines.length;
            var total = count * 18;
            $(textarea).height(total + 'px');
        });
    }

    function masks() {
        $('.ft-mask-date').mask('00/00/0000');
        $('.ft-mask-time').mask('00:00:00');
        $('.ft-mask-date_time').mask('00/00/0000 00:00:00');
        $('.ft-mask-cep').mask('00000-000');
        $('.ft-mask-phone8').mask('0000-0000');
        $('.ft-mask-phone9').mask('00009-0000');
        $('.ft-mask-phone8_with_ddd').mask('(00) 0000-0000');
        $('.ft-mask-phone9_with_ddd').mask('(00) 00009-0000');
        $('.ft-mask-rg').mask('00.000.000-0', { reverse: true });
        $('.ft-mask-cpf').mask('000.000.000-00', { reverse: true });
        $('.ft-mask-cnpj').mask('00.000.000/0000-00', { reverse: true });
        $('.ft-mask-money').mask("#.##0,00", { reverse: true, maxlength: false });
        $('.ft-mask-number').mask("#.##0", { reverse: true, maxlength: false });
        $('.ft-mask-ip_address').mask('0ZZ.0ZZ.0ZZ.0ZZ', { translation: { 'Z': { pattern: /[0-9]/, optional: true } } });
        $('.ft-mask-percent').mask('##0,00%', { reverse: true });
    }

    function formDisable() {
        $(config.selectors.disable).each(function (indexContainer, container) {
            var $container = $(container);
            $container.find(':input').each(function (indexField, field) {
                var $field = $(field);
                $field.attr('disabled', 'disabled');
                $field.data('original-value', $field.val());
            });
        });

    }

    function formText() {
        $(config.selectors.text).each(function (indexContainer, container) {
            $(container).find(':input').each(function (indexField, field) {
                $(field).addClass('ft-form-text');
            });
            $(container).data('form-text', true);
        });
    }

    function dataToggleClass($element) {
        if ($($element).data('toggle-class') !== undefined) {
            var getClass = $($element).data('toggle-class').split(',');
            $($element).toggleClass(getClass[0]).toggleClass(getClass[1]);
        }
    }

    function togglePasswordField() {
        $('.ft-toggle-pass').on("click", function (e) {
            e.preventDefault();
            var target = $(this).data('target');
            dataToggleClass($(this));
            if ($(target).attr('type') === 'password') {
                $(target).removeAttr('attr').prop('type', 'text');
            } else {
                $(target).removeAttr('attr').prop('type', 'password');
            }
        });
    }

    // remove binds added by the module itself
    function unbind() {
        $('[data-ft-module=form]').off('click.ls');
    }

    return {
        init: init,
        unbind: unbind,
        togglePasswordField: togglePasswordField
    };

}());

frontutils.general = (function () {
    'use strict';

    var events = {
        '[data-toggle-class]|click': _toggleClass,
        '.ft-link-smooth|click': _smoothScroll
    };

    function init() {
        _unbind();
        _autoTrigger();
        _loadEvents();
        _elementDisabled();
        _linkPreventDefault();
        _btnGroupActivationToogle();
        _toggleFields();
    }

    jQuery.fn.toggleAttr = function (attr) {
        return this.each(function () {
            var $this = $(this);
            return $this.attr(attr) ? $this.removeAttr(attr) : $this.attr(attr, attr);
        });
    };

    function _loadEvents() {
        $.each(events, function (eventDesc, fn) {
            var selectorEvent = eventDesc.split('|');
            $(selectorEvent[0]).off(selectorEvent[1], selectorEvent[2]);
            $(selectorEvent[0]).on(selectorEvent[1], selectorEvent[2], function (evt) {
                var $this = $(this);
                fn(evt, $this);
            });
        });
    }

    function _autoTrigger() {
        var hash = window.location.hash.replace("!/#", "");
        if (hash !== '') {
            $('[data-target="' + hash + '"], a[href="' + hash + '"]').trigger('click');
        }
    }

    function _toggleFields() {
        $('[data-ft-fields-enable]').on('click.ls', function (evt) {
            evt.preventDefault();
            var $this = $(this);
            var $container = $($this.data('ft-fields-enable'));
            var isFormText = $container.data('form-text') ? 'ft-form-text' : '';
            $container
              .toggleClass('ft-form-disable ft-active ' + isFormText)
              .find(':input').each(function (indexField, field) {
                  var $field = $(field);
                  $field
                    .toggleAttr('disabled')
                    .toggleClass(isFormText)
                    .val($field.data('original-value'));
              });
        });
    }

    function _toggleClass(evt, $this) {
        var $target = $this.data('target') ? $($this.data('target')) : $this,
            cssClass = $this.data('toggle-class');
        if (/(radio)|(checkbox)/.test($this.attr('type'))) {
            $target.toggleClass(cssClass, !$this.prop('checked'));
            $('[name="' + $this.attr('name') + '"]').not($this).each(function () {
                var $that = $(this);
                var $target2 = $that.data('target') ? $($that.data('target')) : $that,
                cssClass2 = $that.data('toggle-class');
                $target2.toggleClass(cssClass2, $this.prop('checked'));
            });
        } else {
            evt.preventDefault();
            $target.toggleClass(cssClass);
        }
    }

    function _smoothScroll(evt, $this) {
        evt.preventDefault();
        var $target = $($this.attr('href'));
        if ($target[0]) {
            $('html,body').animate({
                scrollTop: $target.offset().top - 70
            }, 1000);
        }
    }

    function _elementDisabled() {
        $(".ft-disabled, [disabled='disabled']").on('click', function (evt) {
            if ($(this).hasClass('ft-disabled') || $(this).attr('disabled') === 'disabled') {
                evt.stopImmediatePropagation();
                evt.preventDefault();
                evt.stopPropagation();
                return false;
            }
        });
    }

    function _linkPreventDefault(dom_scope) {
        $("a", dom_scope).on("click.lsPreventDefault", function (e) {
            if ($(this).attr("href") === "" || $(this).attr("href") === "#") {
                e.preventDefault();
            }
        });
    }

    function _btnGroupActivationToogle() {
        $(".ft-group-active [class*='ft-btn']").on("click", function () {
            $(this).siblings().removeClass("ft-active");
            $(this).addClass("ft-active");
        });
    }

    function _unbind() {
        $('[data-ft-fields-enable]').off('click.ls');
        $(".ft-disabled, [disabled='disabled']").off('click');
    }

    return {
        init: init
    };

}());

frontutils.guidedTour = (function () {
    'use strict';

    var jsonTour;

    var config = {
        selectors: {
            init: '.ft-btn-tour',
            tour: '.ft-alerts-list .ft-ico-question'
        }
    };

    function init(jsonSteps) {
        checkTour(jsonSteps);
    }

    // Override default selectors if user provide
    function checkTour(jsonSteps) {
        if (jsonSteps && jsonSteps.selectors && hopscotch) {
            $.each(config.selectors, function (key) {
                jsonSteps.selectors[key] = jsonSteps.selectors[key] || config.selectors[key];
            });
            setTour(jsonSteps);
            setCookie();
        }
    }

    function setTour(tour) {
        jsonTour = tour;
        $(config.selectors.init).on({ click: initTour });
    }

    function openWelcomeTour(e) {
        $(config.selectors.tour).trigger('click');
        $(config.selectors.init).focus().attr('tabindex', '-1');
        return e ? e.preventDefault() : null;
    }

    function initTour() {
        frontutils.topbarCurtain.hideCurtains();
        hopscotch.endTour();
        hopscotch.startTour(jsonTour, 0);
        keyCode();
    }

    function keyCode() {
        var left = 39;
        var right = 37;
        var esc = 27;
        var stepsSize = hopscotch.getCurrTour().steps.length;
        $('body').off('keyup').on('keyup', function (e) {
            var key = e.keyCode;
            if (hopscotch.getCurrStepNum() < stepsSize && hopscotch.getState()) {
                if (key === left) { hopscotch.nextStep(); }
                if (key === right) { hopscotch.prevStep(); }
            }
            if (key === esc) { hopscotch.endTour(); }
        });
    }

    function setCookie() {
        if ($.cookie("cookie_tour") !== "true") {
            $(config.selectors.tour).trigger('click');
            $(config.selectors.init).focus().attr('tabindex', '-1');
            $.cookie('cookie_tour', "true");
        }
    }

    return {
        init: init,
        openWelcomeTour: openWelcomeTour
    };

}());

frontutils.modal = (function () {
    'use strict';

    var config = {
        open: {
            trigger: '[data-ft-module="modal"]',
            triggerOpened: 'modal:opened'
        },
        close: {
            classes: '.ft-modal',
            trigger: '[data-dismiss="modal"]',
            triggerClosed: 'modal:closed'
        },
        classes: {
            open: 'ft-overflow-hidden'
        },
        lsModal: 0
    };

    function init() {
        unbind();
        bindOpen();
    }

    function unbindClose() {
        $(document).off('keyup.ft-esc');
        $(config.close.classes + ", " + config.close.trigger).off('click.ls');
    }

    function unbind() {
        $(config.open.trigger).off('click.ls');
        unbindClose();
    }

    function bindOpen() {
        $(config.open.trigger).on('click.ls', function () {
            frontutils.modal.open($(this));
        });

        if ($('.ft-opened').length > 0) {
            modalBlocked("#" + $('.ft-opened').attr('id'));
        }
    }

    function bindClose() {
        $(document).one('keyup.ft-esc', function (e) {
            if (e.keyCode === 27 && $('.ft-opened')) {
                frontutils.modal.close();
            }
        });

        $(config.close.classes + ", " + config.close.trigger).on('click.ls', function (e) {
            if (e.target !== e.currentTarget) {
                return true;
            }
            frontutils.modal.close();
        });
    }

    function open(button) {
        var $element = button,
            $target = null;

        $('body').addClass(config.classes.open);

        if($element.target){
            $target = $($element.target);

            $target.addClass('ft-opened');

            // This event return two arguments: element clicked and target.
            $target.trigger(config.open.triggerOpened, button);

            ariaModal($($element.target));
            modalBlocked($element.target);
        } else{
            $target = $($element.data().target);

            $target.addClass('ft-opened');

            // This event return two arguments: element clicked and target.
            $target.trigger(config.open.triggerOpened, button);

            ariaModal($($element.data().target));
            modalBlocked($element.data().target);
        }
    }

    function alert(msg) {
        var $element = msg,
            $target = null;

        $('body').addClass(config.classes.open);

        $target = $('.ft-modal-alert');

        $target.addClass('ft-opened');

        $target.find('.ft-modal-header button').remove();
        $target.find('.ft-modal-header').prepend('<button data-dismiss="modal">&times;</button>');
        $target.find('.ft-modal-alert-title').text(msg.title);
        $target.find('.ft-modal-alert-content').html(msg.content);

        ariaModal($('.ft-modal-alert'));
        modalBlocked('.ft-modal-alert');
    }

    function close() {
        var $this = $('.ft-modal.ft-opened');

        $('body').removeClass(config.classes.open);

        $this.attr('aria-hidden', true);
        $this.removeClass('ft-opened');

        unbindClose();

        // This event return one argument: element target.
        $this.trigger(config.close.triggerClosed);

        if ($this.hasClass('ft-modal-template')) {
            $this.remove();
        }
    }

    function modalBlocked($target) {
        $($target).each(function (i, e) {
            if ($(e).data('modal-blocked') !== undefined) {
                $('[data-dismiss="modal"]').remove();
            } else {
                bindClose();
            }
        });
    }

    function ariaModal($modal) {
        var idModal = $modal.find('.ft-modal-title').attr('id') || 'lsModal' + config.lsModal++;
        $modal.find('.ft-modal-title').attr('id', idModal);

        $modal.attr({
            role: 'dialog',
            'aria-hidden': false,
            'aria-labelledby': idModal,
            tabindex: '-1'
        }).focus();
    }

    return {
        init: init,
        open: open,
        alert: alert,
        close: close,
        unbind: unbind
    };

}());

frontutils.popover = (function () {
    'use strict';

    var config = {
        module: '[data-ft-module="popover"]',
        idPopover: '#ft-popover-',
        popoverClass: '.ft-popover',
        trigger: 'click',
        events: {
            clickAnywhere: 'click.clickanywhere',
            opened: 'popover:opened',
            closed: 'popover:closed',
            destroyed: 'popover:destroyed'
        }
    }

    function init() {
        clickAnywhereClose();
        buildPopover();
        bindPopover();
        startOpened();
    }

    // When click or hover elements, show the popovers
    function bindPopover() {
        $(config.module).each(function (index, popoverTrigger) {
            var trigger = $(popoverTrigger).attr('data-trigger') === 'hover' ? 'mouseover' : config.trigger;

            $(popoverTrigger).on(trigger, function (event) {
                event.preventDefault();
                event.stopPropagation();

                var popoverTarget = $(popoverTrigger).data('target');

                if ($(popoverTarget).hasClass('ft-active')) {
                    hide(popoverTarget);
                } else {
                    show(popoverTarget);
                    clickAnywhereClose(popoverTarget)
                }

                if (trigger === 'mouseover') {
                    $(popoverTrigger).on('mouseout', function () {
                        hide(popoverTarget);
                    });
                }

            });
        });

    }

    function clickAnywhereClose(target) {
        $(document).on(config.events.clickAnywhere, function (event) {
            if (!$(event.target).parents('.ft-popover').length) {
                hide(target);
            }
        });
    }

    // When open page, start popover automatically
    function startOpened() {
        $(config.module + '[data-ft-popover="open"]').each(function () {
            show($(this).data('target'));
        });
    }

    // If popover was not created, we build the HTML using a template
    function buildPopover() {
        $(config.module).each(function (index, popoverTrigger) {

            // Add attr data-target to popover triggers
            $(popoverTrigger).attr('data-target', config.idPopover + index);

            if (!$(config.idPopover + index).length) {
                var data = {
                    index: index,
                    title: $(popoverTrigger).data('title'),
                    content: $(popoverTrigger).data('content'),
                    placement: $(popoverTrigger).data('placement'),
                    customClasses: $(popoverTrigger).data('custom-class')
                }

                $('body').append(
                    '<div id="ft-popover-'+ data.index +'" class="ft-popover ft-popover-'+ data.placement +' '+ data.customClasses +'">' +
                        '<div class="ft-popover-header">' +
                            '<h3 class="title-3"> '+ data.title +' </h3>' +
                        '</div>' +
                        '<div class="ft-popover-content"> '+ data.content +' </div>' +
                    '</div>'
                );

                //$('body').append(frontutils.templates.popover(data));

                // Define position of popovers based on his triggers
                setPosition(popoverTrigger);
            }

            $(window).on('breakpoint-updated', function () {
                setPosition(popoverTrigger);
            });

        });
    }

    // Define position of popovers
    function setPosition(popoverTrigger) {
        var data = {
            target: $(popoverTrigger).data('target'),
            top: $(popoverTrigger).offset().top,
            left: $(popoverTrigger).offset().left,
            width: $(popoverTrigger).outerWidth(),
            height: $(popoverTrigger).outerHeight(),
            placement: $(popoverTrigger).data('placement')
        }

        // Define the position of popovers and your elements triggers
        switch (data.placement) {
            case 'right':
                $(data.target).css({
                    top: data.top += (data.height / 2 - 2),
                    left: data.left += (data.width + 12)
                });
                break;
            case 'bottom':
                $(data.target).css({
                    top: data.top += (data.height + 12),
                    left: data.left += (data.width / 2 + 4)
                });
                break;
            case 'left':
                $(data.target).css({
                    top: data.top += (data.height / 2 - 2),
                    left: data.left -= 12
                });
                break;
            default:
            case 'top':
                $(data.target).css({
                    top: data.top -= 12,
                    left: data.left += (data.width / 2 + 4)
                });

        }

    }

    // Show called popover
    function show(target) {
        $(target).addClass('ft-active');
        $(target).off(config.events.closed).trigger(config.events.opened);
    }

    // Hide all or visible popovers
    function hide(target) {
        $(target || '.ft-popover.ft-active').removeClass('ft-active');
        $(target).trigger(config.events.closed).off(config.events.opened)

        if (!$('.ft-popover.ft-active').length) {
            $(document).off(config.events.clickAnywhere)
        }

    }


    // Destroy all created popovers
    function destroy() {
        $(config.popoverClass).remove();

        // Unbind all events.
        $.each(config.events, function (index, event) {
            $(document).unbind(event);
        });

        $(document).trigger(config.events.destroyed);
    }

    return {
        init: init,
        show: show,
        hide: hide,
        destroy: destroy
    };

}());

frontutils.progressBar = (function () {
    'use strict';

    function init() {
        structureProgressBar();
    }

    function structureProgressBar() {
        $("[data-ft-module='progressBar']").each(function (index, element) {
            var percentage = $(element).attr("aria-valuenow");
            $(element).append("<span aria-valuenow='" + percentage + "%'>");
            var $bar = $(element).find('span');
            setProgressBarValue($bar, percentage);
        });
    }

    function setProgressBarValue(target, percentage) {
        $(target).css("width", percentage + "%");
    }

    return {
        init: init
    };

}());

frontutils.sidebarToggle = (function () {
    'use strict';

    function init() {
        unbind();
        checkStatus();
        addArrowToggle();
        sidebarToggling();
        checkStatus();
        maximizeMobile();
    }


    // Add arrow element in sidebar
    function addArrowToggle() {
        if ($('.ft-sidebar').length) {
            $('.ft-sidebar').append('<span class="ft-sidebar-toggle ft-ico-shaft-left"></span>');
        }
    }

    // Check if the cookie exist to maintain the status of sidebar
    function checkStatus() {
        var stateSidebar = localStorage.getItem('stateSidebar');
        if (stateSidebar || $('html').hasClass('ft-sidebar-toggled')) {
            minimizeSidebar();
        } else {
            maximizeSidebar();
        }
    }

    // When click in the arrrow, open or close sidebar
    function sidebarToggling() {
        $('.ft-sidebar-toggle').on('click', function () {
            if ($('html').hasClass('ft-sidebar-toggled')) {
                maximizeSidebar();
            } else {
                minimizeSidebar();
            }
        });
    }

    // minimize sidebar
    function minimizeSidebar() {
        $('html').addClass('ft-sidebar-toggled');
        $('.ft-sidebar-toggle').addClass('ft-active');
        localStorage.setItem('stateSidebar', 'minimized');
        $.event.trigger('sidebar-minimize');
    }

    // maximize sidebar
    function maximizeSidebar() {
        $('html').removeClass('ft-sidebar-toggled');
        $('.ft-sidebar-toggle').removeClass('ft-active');
        localStorage.removeItem('stateSidebar');
        $.event.trigger('sidebar-maximize');
    }

    // When in Mobile, maximize sidebar
    function maximizeMobile() {
        $(window).on("breakpoint-updated", function () {
            if ($('.ft-window-xs').length) {
                maximizeSidebar();
            }
        });
    }

    function unbind() {
        $('.ft-sidebar-toggle').off('click');
    }

    return {
        init: init
    };

}());

frontutils.sidebars = (function () {
    'use strict';

    function init() {
        unbind();
        notificationVerification();
        bindShowSidebar();
        bindShowNotifications();
        userAccountVerification();

        prepareSubmenu();
        submenu();
        openSubmenuItemActive();
        whenSidebarToggling();
        clickAnywhereCloseSubmenu();

        ariaMenu();
        ariaSubmenu();
    }

    // add click bind and call the necessary methods
    function bindShowSidebar() {
        $('.ft-show-sidebar').on('touchstart.ls click.ls', function (evt) {
            evt.preventDefault();
            sidebarVisibleClass();
        });
    }

    // add click bind and call the necessary methods
    function bindShowNotifications() {
        $('.ft-show-notifications').on('touchstart.ls click.ls', function (evt) {
            evt.preventDefault();
            notificationClassVisible();
        });
    }

    // add class in HTML tag when the sidebar is visible
    function sidebarVisibleClass() {
        $('html').toggleClass('ft-sidebar-visible');
    }

    // add class in HTML tag when the notification is visible
    function notificationClassVisible() {
        $('html').toggleClass('ft-notifications-visible');
    }

    function userAccountVerification() {
        if ($('.ft-sidebar .ft-area-account').length === 1) {
            $('.ft-sidebar').addClass('ft-area-account-active');
        }
    }

    function notificationVerification() {
        if ($('.ft-notification').length === 1) {
            if ($('.ft-show-notifications').length === 0) {
                $('.ft-topbar').append('<span class="ft-show-notifications ft-ico-question"/>');
            }
        }
    }

    ////
    // Submenu
    // In sidebar some options of menu have a internal Submenu. Here we treat this scenario, when the menu is Minimized or Maximized.
    ////
    function prepareSubmenu() {
        var hasSubmenu = $('.ft-menu').find('ul li ul');
        $(hasSubmenu).each(function () {
            $(this).addClass('ft-submenu');
            $(this).parent('li').addClass('ft-submenu-parent');
            $(this).find('a').addClass('ft-submenu-item');
        });
    }

    // When click in menu option, open your relative submenu
    function submenu() {
        $('.ft-submenu-parent').on('click', '> a', function (evt) {
            evt.preventDefault();

            if ($(this).parents('.ft-submenu-parent').hasClass('ft-active')) {
                closeSubmenu($(this));
            } else {
                openSubmenu($(this));
            }

        });
    }

    // Open Submenu
    function openSubmenu(el) {
        var $submenu = $(el).parents('.ft-submenu-parent');

        $('.ft-submenu-parent').removeClass('ft-active');
        $submenu.addClass('ft-active');

        ariaSubmenu($submenu);
    }

    // Close Submenu
    function closeSubmenu(el) {
        var $submenu = $(el).parents('.ft-submenu-parent');

        $submenu.removeClass('ft-active');

        ariaSubmenu($submenu);
    }

    // Active the submenu-parent if have a child actived.
    function openSubmenuItemActive() {
        if (!$('.ft-sidebar-toggled').length) {
            $('.ft-submenu li.ft-active').each(function () {
                openSubmenu($(this));
            });
        }
    }

    // When sidebar toggle, close submenu when minimized, open menu when maximize
    function whenSidebarToggling() {

        // When the user toggle sidebar, is fired two triggers: sidebar-minimize when sidebar is minimizing or sidebar-maximize when sidebar is maximizing
        $(window).on('sidebar-minimize', function () {
            $('.ft-submenu li').each(function () {
                closeSubmenu($(this));
            });
        });

        $(window).on('sidebar-maximize', function () {
            $('.ft-submenu li.ft-active').each(function () {
                openSubmenu($(this));
            });
        });
    }

    // If user click anywhere in page, close the submenu when sidebar is Toggled.
    function clickAnywhereCloseSubmenu() {
        $(document).on('click', function (evt) {
            var target = $(evt.target);
            if ($('.ft-sidebar-toggled').length && $('.ft-submenu-parent.ft-active').length) {
                if (!target.is('.ft-submenu-parent.ft-active *')) {
                    closeSubmenu($('.ft-submenu-parent.ft-active > a'));
                }
            }
        });
    }


    ////
    // WAI-ARIA
    ////

    // Add WAI-ARIA in menu items
    function ariaMenu() {
        var $menu = $('.ft-menu');
        $menu.attr({ role: 'navigation' });
        $menu.find('ul').attr({ role: 'menu' });
        $menu.find('a').attr({ role: 'menuitem' });

        $('.ft-submenu-parent').each(function (i, el) {
            ariaSubmenu(el);
        });
    }

    // Add WAI-ARIA in submenu items
    function ariaSubmenu(el) {
        if ($(el).hasClass('ft-active')) {
            $(el).attr({
                'aria-expanded': 'true',
                'aria-hidden': 'false'
            });
        } else {
            $(el).attr({
                'aria-expanded': 'false',
                'aria-hidden': 'true'
            });
        }
    }

    // remove the binds
    function unbind() {
        $('.ft-show-sidebar').off('touchstart.ls click.ls');
        $('.ft-show-notifications').off('touchstart.ls click.ls');
        $('.ft-submenu-parent > a').off('click.ls');
    }


    return {
        init: init,
        unbind: unbind
    };

}());

frontutils.steps = (function () {
    'use strict';

    var config = {
        selectors: {
            moduleActive: '.ft-actived [data-ft-module="steps"]',
            nav: '.ft-steps-nav',
            button: '.ft-steps-btn',
            container: '.ft-steps-content',
            steps: '.ft-steps',
            moduleVisible: '.ft-steps-content:visible',
            mobile: '.ft-steps-mobile'
        },
        status: {
            active: 'ft-active',
            actived: 'ft-actived'
        },
        classes: {
            active: '.ft-active'
        },
        actions: {
            next: '.ft-steps-content [data-action="next"]',
            prev: '.ft-steps-content [data-action="prev"]'
        }
    };

    function init() {
        unbind();
        createArrow();
        ariaSteps();
        addAriaLabel();
        addActivedNav();
        mobileInfos();
        bindClickOnTriggers();
        bindMobileMenuClick();
        bindNextStep();
        bindPrevStep();
    }

    // Remove the binds that own module adds
    function unbind() {
        $(config.selectors.nav).off('click.steps');
        $(config.actions.next).off('click.steps');
        $(config.actions.prev).off('click.steps');
    }

    // Create arrow on the navigation
    function createArrow() {
        $('.ft-steps-nav li').prepend('<span class="ft-steps-arrow" />');
    }

    // Add the arias
    function ariaSteps() {
        $(config.selectors.nav).attr('role', 'tablist');
        $(config.selectors.nav).find(config.selectors.button).attr('aria-selected', 'false');
        $(config.selectors.nav).find('.ft-active .ft-steps-btn').attr('aria-selected', 'true');
        $(config.selectors.button).attr('role', 'tab');
        $(config.selectors.container).attr({ 'aria-hidden': true, 'role': 'tabpanel' });
    }

    // Set the mobile infos on data-index and data-title attributes
    function mobileInfos() {
        var steps = $(config.selectors.nav).find('li');

        steps.each(function (index) {
            if ($(this).hasClass(config.status.active)) {
                $(config.selectors.mobile).attr({
                    'data-index': (index + 1) + ' de ' + steps.length,
                    'data-title': $(this).find(config.selectors.button).attr('title')
                });
            }
        });
    }

    function bindMobileMenuClick() {
        $(config.selectors.mobile).on('click.steps', function () {
            $(config.selectors.steps).toggleClass(config.status.active);
        });
    }

    //Add aria-label in the navigation
    function addAriaLabel() {
        var $elem = $(config.selectors.button);
        var elemLength = $elem.length;
        for (var i = 0; i < elemLength; i++) {
            var text = $($elem[i]).attr('title');
            $($elem[i]).attr({ 'aria-label': text });
        }
    }

    // Displays the contents related to the active button
    function addActivedNav() {
        var index = $(config.selectors.nav).find(config.classes.active).index();

        // Checks if there are any enabled button to load the page
        if (index === -1) {
            $(config.selectors.nav).each(function () {
                var $el = $(this).find('li:first').find(config.selectors.button);
                var $target = $el.data('target');
                activateStep($el, $($target));
            });

        } else {
            addActiveContent(index);
            $(config.selectors.nav).find('li:lt(' + index + ')').addClass(config.status.actived);
        }
        var heightStepVisible = $(config.selectors.moduleVisible).height();
        stepsAffix(heightStepVisible);
    }

    //Create the step by activated navigation buttons
    function bindClickOnTriggers() {
        $(config.selectors.nav).on("click.steps", config.selectors.moduleActive, function (evt) {
            evt.preventDefault();
            changeStep($(this));
        });
    }

    // Bind the target to cal the nextStep on click
    function bindNextStep() {
        $(config.actions.next).on('click.steps', function (evt) {
            evt.preventDefault();
            nextStep();
        });
    }

    // Bind the target to call the prevStep on click
    function bindPrevStep() {
        $(config.actions.prev).on('click.steps', function (evt) {
            evt.preventDefault();
            prevStep();
        });
    }

    // Advances to the next step
    function nextStep() {
        // TODO: when change the minor version we can remove this old event.
        var evt = jQuery.Event('NextStepEvent');
        $(document).trigger(evt);

        var beforeEvent = jQuery.Event('BeforeNextStep');
        $(document).trigger(beforeEvent);

        if (!evt.isDefaultPrevented() && !beforeEvent.isDefaultPrevented()) {
            var $el = $(config.selectors.nav).find(config.classes.active).next('li').addClass(config.status.active).find(config.selectors.button);
            changeStep($el);
            $(document).trigger(jQuery.Event('AfterNextStep'));
        }
    }

    // Back to the previous step
    function prevStep() {
        // TODO: when change the minor version we can remove this old event.
        var evt = jQuery.Event('PrevStepEvent');
        $(document).trigger(evt);

        var beforeEvent = jQuery.Event('BeforePrevStep');
        $(document).trigger(beforeEvent);

        if (!evt.isDefaultPrevented() && !beforeEvent.isDefaultPrevented()) {
            var $el = $(config.selectors.nav).find(config.classes.active).prev('li').find(config.selectors.button);
            changeStep($el);
            $(document).trigger(jQuery.Event('AfterPrevStep'));
        }
    }

    // Always visible navigation when the page scrolls
    function stepsAffix(elemVisible) {
        var $steps = $(config.selectors.nav);
        var offset = $steps.offset();
        var $heightNav = $(config.selectors.nav).height();

        $(window).scroll(function () {
            if ($(window).width() < 768) {
                return;
            }
            if ($(window).scrollTop() > offset.top) {
                var $scroll = parseInt($(window).scrollTop() - $heightNav, 10);

                $steps.stop().animate({
                    marginTop: $(window).scrollTop() - offset.top + 20
                });

                if ($scroll + $heightNav >= elemVisible) {
                    $steps.stop().animate({
                        marginTop: 0
                    });
                }
            } else {
                $steps.stop().animate({
                    marginTop: 0
                });
            }
        });
    }

    // Check what the order of the activated button
    function addActiveContent(index) {
        $(config.selectors.container).eq(index).addClass(config.status.active);
    }

    // Change the step
    function changeStep($el) {
        var $target = $($el.attr('href') || $el.data('target'));
        activateStep($el, $target);
        deactivateStep($el, $target);
        anchorSteps();
        mobileInfos();

        if ($('html').hasClass('ft-screen-xs') && $(config.selectors.nav).hasClass(config.status.active)) {
            $(config.selectors.mobile).trigger('click');
        }
    }

    //Active step
    function activateStep(el, $target) {
        $(el).parents("li").addClass(config.status.active);
        $(el).parents("li").prev('li').addClass(config.status.actived);
        $target.addClass(config.status.active).attr({ 'aria-hidden': false });
        $(el).attr('aria-selected', true);
    }

    //Desactive step
    function deactivateStep(el, $target) {
        $(el).parents("li").siblings().removeClass(config.status.active);
        $target.siblings().removeClass(config.status.active).attr({ 'aria-hidden': true });
        $(el).parents("li").siblings().find(config.selectors.button).attr('aria-selected', false);
    }

    // Create scrollTop when to click
    function anchorSteps() {
        $('html, body').stop().animate({ scrollTop: $('.ft-steps').offset().top - 60 }, 300);
        var heightStepVisible = $(config.selectors.moduleVisible).height();
        stepsAffix(heightStepVisible);
    }

    return {
        init: init,
        unbind: unbind,
        nextStep: nextStep,
        prevStep: prevStep
    };

}());

frontutils.switchButton = (function () {
    'use strict';

    var config = {
        switchButton: '[data-ft-module=switchButton]',
        openedClass: 'ft-switch-btn-active'
    };

    function init() {
        bindEventOnChange();
        validateClassExistence();
    }

    function bindEventOnChange() {
        $(config.switchButton).on('click.ls', function (event) {
            if ($(this).find('a').length === 0) {
                toggleClass($(this));
                eventHandler($(this));
                event.stopPropagation();
            }
        });
    }

    function eventHandler(el) {
        if (el.find('input[type=checkbox]').prop('checked')) {
            el.trigger('switchButton:activated');
        } else {
            el.trigger('switchButton:deactivated');
        }
    }

    function toggleClass(el) {
        el.toggleClass(config.openedClass);
    }

    function validateClassExistence() {
        $(config.switchButton).find('input[type=checkbox]').each(function () {
            if ($(this).prop('checked')) {
                $(this).closest(config.switchButton).addClass(config.openedClass);
            }
        });
    }

    return {
        init: init
    };

}());

frontutils.button = (function () {
    'use strict';

    function init() {
        unbind();
        addActivedButton();
        bindClick();
        ariaTabs();
    }

    function unbind() {
        $('[data-ft-module=button]').off('click.button');
    }

    function bindClick() {
        $('[data-ft-module="button"]').on('click.button', function (evt) {
            evt.preventDefault();
            var $target = $($(this).attr('href') || $(this).data('target'));
            var $buttons = '[data-ft-module=button]';
            deactivateElement(this, $target, $buttons);
            activateElement(this, $target);
            removeChecked();
            $(this).find('input').prop('checked', true);
        });
    }

    function removeChecked() {
        $('[data-ft-module="button"] input[type="radio"]').each(function (index, el) {
            $(el).removeAttr('checked');
        });
    }

    function addChecked(el) {
        $(el).each(function (index, el) {
            $(el).attr('checked', 'checked');
        });
    }

    function addActivedButton() {
        $('.ft-tabs-btn-nav li.ft-active').each(function () {
            if ($(this).hasClass('ft-active') === true) {

                var $elem = $(this).find('[data-ft-module="button"]');
                var $target = $elem.attr('href') || $elem.data('target');
                var $buttons = '[data-ft-module=button]';

                addChecked($(this).find('[data-ft-module="button"] input[type="radio"]'));
                deactivateElement($elem, $target, $buttons);
                activateElement($elem, $target);
            }
        });
    }


    function activateElement(el, $target) {
        $(el).parents('li').addClass('ft-active');
        $($target).addClass('ft-active');
        $(el).attr('aria-selected', true);
    }

    function deactivateElement(el, $target, $buttons) {
        $(el).parents('li').siblings().removeClass('ft-active');
        $($target).siblings().removeClass('ft-active');
        $(el).parents('li').siblings().find($buttons).attr('aria-selected', false);
    }

    function ariaTabs() {
        $('.ft-tabs-btn-nav').attr('role', 'tablist');
        $('.ft-tabs-btn-nav .ft-btn').attr('role', 'tab');
        $('.ft-tabs-btn-nav .ft-active .ft-btn').attr('aria-selected', 'true');
        $('.ft-tabs-btn .ft-tab-content').attr('role', 'tabpanel');
    }

    return {
        init: init,
        unbind: unbind
    };

}());

frontutils.tabs = (function () {
    'use strict';

    var config = {
        tab: '.ft-tabs-nav',
        tabLink: '.ft-tabs-nav a',
        tabListActive: '.ft-tabs-nav li.ft-active a',
        tabContent: '.ft-tab-content'
    };

    function init() {
        unbind();
        bindClickOnTriggers();
        bindBreakpointUpdateOnChecker();
        checkBreakpoint();
        ariaTabs();
    }

    // bind click and call the necessary methods
    function bindClickOnTriggers() {
        $('[data-ft-module="tabs"]').on('click.ls', function (evt) {
            evt.preventDefault();
            var $target = $($(this).attr('href') || $(this).data('target'));
            var $closestTabNav = $(this).closest('.ft-tabs-nav');

            deactivateTab(this, $target);
            activateTab(this, $target);

            if (isDropdownMode($closestTabNav)) {
                updateTriggerLink($closestTabNav);
            }
        });
    }

    // bind the breakpoint-updated event calls the checker when fired
    function bindBreakpointUpdateOnChecker() {
        $(window).on('breakpoint-updated', function () {
            frontutils.tabs.checkBreakpoint();
        });
    }

    // check if the tab is in dropdown mode
    function isDropdownMode(el) {
        return $(el).hasClass('in-dropdown');
    }

    // check the breakpoint and if the tab is already in droppdown mode
    function checkBreakpoint() {
        if (frontutils.breakpointClass === 'ft-window-sm' || frontutils.breakpointClass === 'ft-window-xs') {
            $('.ft-tabs-nav').each(function (index, value) {
                if (!isDropdownMode(value)) {
                    dropdownShape(value);
                }
            });
        }
    }

    // update dropdown link with value of active tab
    function updateTriggerLink(tabNav) {
        tabNav.closest('.ft-dropdown-tabs').find('> a').text(tabNav.find('li.ft-active > a').text());
    }

    // changes the tab to the dropdown mode
    function dropdownShape(el) {
        var tabNav = $(el);

        // puts div dropdown around the tab navigation and adds class amending style links used by dropdown toggle
        tabNav.addClass('in-dropdown ft-dropdown-nav').wrap('<div data-ft-module="dropdown" class="ft-dropdown-tabs">');

        // put all dropdown tabs items inside the dropdown mode
        // note this next code block will be ignored if do not exist any element with that class name inside the tab
        tabNav.find('.ft-dropdown-nav').each(function () {
            tabNav.append($(this).html());
            $(this).closest('li').remove();
        });

        // creates the link necessary to control the dropdown with the actived item text
        tabNav.parent('.ft-dropdown-tabs').prepend('<a data-ft-module="tabs" class="ft-btn">' + tabNav.find('li.ft-active > a').text() + '</a>');

        // init the tabs and dropdown modules
        frontutils.tabs.init();
        frontutils.dropdown.init();
    }

    // activates the flap in accordance with the received arguments
    function activateTab(el, $target) {
        $(el).parents('li').addClass('ft-active');
        $(el).trigger('tab:activated');
        $target.addClass('ft-active');
        $(el).attr('aria-selected', true);
    }

    // disable tab according to the received arguments
    function deactivateTab(el, $target) {
        $(el).parents('li').siblings().removeClass('ft-active');
        $(el).trigger('tab:deactivated');
        $target.siblings().removeClass('ft-active');
        $(el).parents('li').siblings().find('a').attr('aria-selected', false);
    }

    // remove binds added by the module itself
    function unbind() {
        $('[data-ft-module=tabs]').off('click.ls');
    }

    function ariaTabs() {
        $(config.tab).attr('role', 'tablist');
        $(config.tabLink).attr('role', 'tab');
        $(config.tabListActive).attr('aria-selected', 'true');
        $(config.tabContent).attr('role', 'tabpanel');
    }

    return {
        init: init,
        unbind: unbind,
        checkBreakpoint: checkBreakpoint
    };

}());

frontutils.templates = (function () {
    'use strict';

    var templatesPath = 'frontutils/templates/_';

    function init() {
    }

    function popover(elementData) {
        return JST[templatesPath + 'popover'](elementData);
    }

    function modal(elementData) {
        return JST[templatesPath + 'modal'](elementData);
    }

    function dropdown(elements) {
        return JST[templatesPath + 'dropdown']({ elements: elements });
    }

    function browserUnsupportedBar() {
        return JST[templatesPath + 'browser-unsupported-bar']();
    }

    return {
        init: init,
        popover: popover,
        modal: modal,
        dropdown: dropdown,
        browserUnsupportedBar: browserUnsupportedBar
    };

}());

frontutils.toggleText = (function () {
    'use strict';

    var config = {
        trigger: '[data-ft-module=toggleText]',
        triggerChange: 'toggleText:change'
    };

    function eventHandler(el, target, text) {
        el.trigger(config.triggerChange, [target, text]);
    }

    function bindToggle(el) {
        var $target = el.data('target-text') ? $(el.data('target-text')) : el;
        var textChange = el.data('toggle-text');
        var textOriginal = $target.text();

        el.data('toggle-text', textOriginal);
        $target.text(textChange);

        eventHandler(el, $target, textChange);
    }

    function bindEventOnClick() {
        $(config.trigger).on('click.ls', function (event) {
            event.preventDefault();
            bindToggle($(this));
            event.stopPropagation();
        });
    }

    function unbind() {
        $(config.trigger).off('click.ls');
    }

    function init() {
        unbind();
        bindEventOnClick();
    }

    return {
        init: init
    };

}());

frontutils.topbarCurtain = (function () {
    'use strict';

    var config = {
        module: '[data-ft-module="topbarCurtain"]'
    };

    function init() {
        unbind();
        positionTarget();
        bindCloseCurtains();
        bindPreventClosing();
        repositionOnResize();
        updateStatusCounter();
        cloneDropdownToSidebar();
    }

    function unbind() {
        $(config.module).off("click.ls, ls.toggleTopCurtain");
        $(".ft-notification-list").off("click.ls");
        $("body").off("click.lsTopCurtain");
    }

    function updateStatusCounter() {
        $(config.module).each(function (index, element) {
            var elem = $(element).data('target');
            var _counter = $(elem + ' .ft-dismissable:not(.ft-dismissed)').length;
            if (_counter !== 0) {
                $('[data-target="' + elem + '"]').attr('data-counter', _counter);
            }
            if (_counter === 0) {
                $('[data-target="' + elem + '"]').removeAttr('data-counter');
                $(elem + ' .ft-no-notification-message').addClass('active');
            }
        });
    }

    function positionTarget() {
        $(config.module).each(function (index, item) {
            var leftDistance = $(item).position().left;
            var iconWidth = (22 / 2);
            var curtainWidth = $($(item).data("target")).width() / 2;

            var ua = window.navigator.userAgent;
            var msie = ua.indexOf('MSIE ');
            var trident = ua.indexOf('Trident/');

            if (msie > 0 || trident > 0) {
                $($(item).data("target")).css({ left: (leftDistance + iconWidth) - curtainWidth + "px", top: "60px" });
            } else {
                $($(item).data("target")).css({ left: (leftDistance + iconWidth) + curtainWidth + "px" });
            }

            bindTopCurtainTrigger(item);
        });
    }

    function bindPreventClosing() {
        $(".ft-notification-list").on("click.ls", function (evt) {
            evt.stopPropagation();
        });
    }

    function bindCloseCurtains() {
        $("body").on("click.lsTopCurtain", function () {
            hideCurtains();
        });
    }

    function bindTopCurtainTrigger(trigger) {
        $(trigger).on("click.ls, ls.toggleTopCurtain", function (evt) {
            evt.stopPropagation();
            var targetState = $($(trigger).data("target")).hasClass("ft-active");
            hideCurtains();
            if (!targetState) {
                $(trigger).addClass("ft-active");
                showCurtain($(trigger).data("target"));
            }
        });
    }

    function showCurtain(curtain) {
        $(curtain).addClass("ft-active");
        frontutils.dropdown.closeDropdown();
    }

    function hideCurtains() {
        $("[data-ft-module='topbarCurtain']").removeClass("ft-active");
        $(".ft-notification-list").removeClass("ft-active");
    }

    function repositionOnResize() {
        var repositionTarget;
        $(window).resize(function () {
            clearTimeout(repositionTarget);
            repositionTarget = setTimeout(function () {
                unbind();
                positionTarget();
                bindCloseCurtains();
                bindPreventClosing();
            }, 300);
        });
    }

    function cloneDropdownToSidebar() {
        var $userAccountTopbar = $('.ft-topbar .ft-user-account');
        if (!$('.ft-sidebar .ft-user-account').length) {
            $userAccountTopbar.clone().prependTo('.ft-sidebar');
        }
    }

    return {
        init: init,
        hideCurtains: hideCurtains,
        unbind: unbind,
        updateStatusCounter: updateStatusCounter
    };

}());

frontutils.trackEvents = (function () {
    'use strict';

    function init() {
        if (window.ga) {
            frontutils.trackEvents.gaPresent = true;
            setCategory(frontutils.trackEvents);
            findTriggers();
        } else {
            frontutils.trackEvents.gaPresent = false;
        }
    }

    function setCategory(module) {
        module.eventCategory = $("body").attr("data-ft-te-category") || window.location.pathname;
    }

    function findTriggers() {
        findLinks();
        findButtons();
        findForms();
        findSelects();
        bindGuidedTour();
    }

    function findLinks() {
        var links = $("a");
        $(links).each(function (index, item) {
            var options = {};
            options.category = $(item).data("ft-te-category") ? $(item).data("ft-te-category") : null;
            options.action = $(item).data("ft-te-action") ? $(item).data("ft-te-action") : 'open_link_#' + $(item).attr("href");
            options.label = $(item).data("ft-te-label") ? $(item).data("ft-te-label") : $(item).text();
            if ($(item).attr("href")) {
                if ($(item).attr("href").indexOf("#") === 0) {
                    options.action = $(item).data("ft-te-action") ? $(item).data("ft-te-action") : 'on_page_link_' + $(item).attr("href");
                }
            }
            if ($(item).attr("data-ft-module") === "tabs") {
                options.action = 'tab_navigation';
            }
            if ($(item).parent().attr("data-ft-module") === "dropdown") {
                if ($(item).parents(".ft-topbar").length > 0) {
                    options.action = 'top_bar_action';
                    options.label = 'Toggle user dropdown';
                } else {
                    options.action = 'dropdown_toggle';
                }
            }
            if ($(item).attr("data-ft-module") === "modal") {
                var modal = $(item).data("target") ? $(item).data("target") : $(item).attr("href");
                options.action = 'open_modal_' + modal;
            }
            if ($(item).parent().attr("data-ft-module") === "collapse") {
                options.type = "collapse";
            }
            if ($(item).attr("data-ft-module") === "topbarCurtain") {
                options.action = "top_bar_action";
            }
            bindClickEvents(item, options);
        });
    }

    function findButtons() {
        var buttons = $("button");
        $(buttons).each(function (index, item) {
            var options = {};
            options.category = $(item).data("ft-te-category") ? $(item).data("ft-te-category") : null;
            options.action = $(item).data("ft-te-action") ? $(item).data("ft-te-action") : 'on_page_button_#';
            options.label = $(item).data("ft-te-label") ? $(item).data("ft-te-label") : $(item).text();
            var modal;
            if ($(item).attr("data-ft-module") === "modal") {
                modal = $(item).data("target") ? $(item).data("target") : $(item).attr("href");
                options.action = 'open_modal_' + modal;
            }
            if ($(item).attr("data-dismiss") === "modal") {
                modal = $($(item).parents(".ft-modal")).attr("id");
                options.action = 'close_modal_#' + modal;
            }
            bindClickEvents(item, options);
        });
    }

    function findForms() {
        var forms = $("form");
        $(forms).each(function (index, item) {
            var options = {};
            if ($(item).parents('.ft-modal').length) {
                options.action = "submit_form_#" + ($(item).data("action") || $(item).attr("id") || $(item).attr("action")) + "#inside_modal#" + $(item).parents('.ft-modal').attr("id");
            } else {
                options.action = "submit_form_#" + ($(item).data("action") || $(item).attr("id") || $(item).attr("action"));
            }
            options.label = $(item).find(":submit[type=submit]").val() || $(item).find(":submit[type=submit]").text();
            bindFormEvents(item, options);
        });
    }

    function findSelects() {
        var selects = $("select");
        $(selects).each(function (index, item) {
            var options = {};
            options.category = $(item).data("ft-te-category") ? $(item).data("ft-te-category") : null;
            options.action = "select_change_#" + ($(item).attr("id") || $(item).attr("name"));
            options.label = "option";
            bindSelects(item, options);
        });
    }

    function bindClickEvents(element, options) {
        $(element).off("click.lsTrackEvent");
        $(element).on("click.lsTrackEvent", function () {
            if (options.type === "collapse") {
                var targetCollapse = $(element).parent().attr("id");
                if ($("#" + targetCollapse).hasClass("ft-collapse-open")) {
                    options.action = 'close_collapse_#' + targetCollapse;
                    options.label = "Close collapse";
                } else {
                    options.action = 'open_collapse_#' + targetCollapse;
                    options.label = "Open collapse";
                }
            }
            ga('send', 'event', options.category || frontutils.trackEvents.eventCategory, options.action, options.label);
        });
    }

    function bindFormEvents(element, options) {
        $(element).find(":submit[type=submit]").off("click.lsTrackEvent");
        $(element).off("submit.ls");
        $(element).on("submit.ls", function () {
            ga('send', 'event', frontutils.trackEvents.eventCategory, options.action, options.label);
        });
    }

    function bindSelects(element, options) {
        $(element).off("change.ls");
        $(element).on("change.ls", function () {
            options.label = $(this).val();
            ga('send', 'event', options.category || frontutils.trackEvents.eventCategory, options.action, options.label);
        });
    }

    function bindGuidedTour() {
        $("body").off("click.lsTrackEvents");
        $("body").on("click.lsTrackEvents", ".hopscotch-bubble .hopscotch-nav-button", function () {
            var currentStep = $(this).parents(".hopscotch-bubble").find(".hopscotch-bubble-number").text();
            ga('send', 'event', frontutils.trackEvents.eventCategory, 'go_to_tour_step[' + currentStep + ']', $(this).text());
        });
    }

    return {
        init: init
    };

}());

frontutils.menuMobile = (function () {
    'use strict';

    function init() {
        $('body').append('<div class="ft-curtina-mobile"></div>');

        $('.ft-nav-mobile').on('touchstart.ls click.ls', function (evt) {
            evt.preventDefault();
            $(evt.currentTarget).toggleClass('ft-opened');
            menuMobileVisibleClass();
        });

        $('.ft-curtina-mobile').on('touchstart.ls click.ls', function (evt) {
            evt.preventDefault();
            $('.ft-nav-mobile').toggleClass('ft-opened');
            menuMobileVisibleClass();
        });
    }

    function menuMobileVisibleClass() {
        $('body').toggleClass('ft-nav-mobile-visible');
    }

    return {
        init: init
    };

}());

$(document).ready(function () {
    'use strict';

    frontutils.sidebarToggle.init();
    frontutils.sidebars.init();

    frontutils.breakpoints.init();
    loadModules();
    frontutils.general.init();
    frontutils.btnGroup.init();
    frontutils.alert.init();
    frontutils.menuMobile.init();
    frontutils.datepicker.init();
    frontutils.form.togglePasswordField();
    checkClassForTrack();
    frontutils.browserDetect.init();
    frontutils.browserUnsupportedBar.init();

    function checkClassForTrack() {
        if ($("html").hasClass("ft-trackevent-on")) {
            frontutils.trackEvents.init();
        }
    }

    function loadModules() {
        var modules = getModules();
        for (var i in modules) {
            if (modules.hasOwnProperty(i)) {
                frontutils[modules[i]].init();
                console.info("frontutils: module [" + modules[i] + "] successfully initialized.");

                $.event.trigger(modules[i] + ':ready');
            }
        }
    }

    function getModules() {
        var modules = [];
        $("[data-ft-module]").each(function () {
            var module = $(this).data("ft-module");
            if (modules.indexOf(module) === -1) {
                modules.push(module);
            }
        });
        return modules;
    }
});


// $(window).load(function () {
//     'use strict';

//     frontutils.breakpoints.init();
//     loadModules();
//     frontutils.general.init();
//     frontutils.btnGroup.init();
//     frontutils.alert.init();
//     frontutils.menuMobile.init();
//     frontutils.datepicker.init();
//     frontutils.form.togglePasswordField();
//     checkClassForTrack();
//     frontutils.browserDetect.init();
//     // frontutils.browserUnsupportedBar.init();

//     function checkClassForTrack() {
//         if ($("html").hasClass("ft-trackevent-on")) {
//             frontutils.trackEvents.init();
//         }
//     }

//     function loadModules() {
//         var modules = getModules();
//         for (var i in modules) {
//             if (modules.hasOwnProperty(i)) {
//                 frontutils[modules[i]].init();
//                 console.info("frontutils: module [" + modules[i] + "] successfully initialized.");

//                 $.event.trigger(modules[i] + ':ready');
//             }
//         }
//     }

//     function getModules() {
//         var modules = [];
//         $("[data-ft-module]").each(function () {
//             var module = $(this).data("ft-module");
//             if (modules.indexOf(module) === -1) {
//                 modules.push(module);
//             }
//         });
//         return modules;
//     }
// });

// $(document).ready(function () {
//     'use strict';

//     frontutils.sidebarToggle.init();
//     frontutils.sidebars.init();
// });
