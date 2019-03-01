/*
* ------------------------------------------------------------------------------------------------
* @author   Leandro Mancini
* @email    contato@leandromancini.com
* @url      http://www.leandromancini.com/
* ------------------------------------------------------------------------------------------------
*/

var LM = LM || {};

LM.preloader = (function () {
    'use strict';

    var config = {
        classes: {
            preloader: '.preloader',
            main: 'main'
        }
    };

    function init() {
        close();

        setTimeout(function(){
            $(config.classes.main).fadeIn();
            
            complete();

            $('html, body').animate({ scrollTop: 0 }, { duration: 500, queue: false, easing: 'easeOutExpo' });
        }, 500);
    }

    function open(){
        $(config.classes.preloader).fadeIn();
    }

    function close(){
        $(config.classes.preloader).find('.logo').addClass('flipOutX animated');

        setTimeout(function(){
            $(config.classes.preloader).fadeOut(function(){
                $(config.classes.preloader).find('.logo').removeClass('flipOutX animated');
            });
        }, 500);
    }

    function complete(){
        LM.menuResponsivo.init();
        LM.scrollParalax.init();
        LM.banner.init();
        LM.habilidades.init();
        LM.portfolio.init();
        LM.curiosidades.init();
        LM.contato.init();
        // LM.map.init();
    }

    return {
        init: init,
        open: open,
        close: close
    };

}());

LM.banner = (function () {
    'use strict';

    var config = {
        classes: {
            banner: '.banner'
        }
    };

    var width, height, largeHeader, canvas, ctx, points, target, animateHeader = true;

    function init() {
        var _bg = $(config.classes.banner).find('img').attr('src');

        $(config.classes.banner).css({ 'background':'url('+ _bg +') no-repeat center top' });
        
        canvas_points();
    }

    function canvas_points(){
        // Main
        initHeader();
        initAnimation();
        addListeners();
    }

    function initHeader() {
        width = window.innerWidth;
        height = window.innerHeight;
        target = { x: width / 2, y: height / 2 };

        largeHeader = document.getElementById('banner');
        largeHeader.style.height = height + 'px';

        canvas = document.getElementById('demo-canvas');
        canvas.width = width;
        canvas.height = height;
        ctx = canvas.getContext('2d');

        // create points
        points = [];
        for (var x = 0; x < width; x = x + width / 15) {
            for (var y = 0; y < height; y = y + height / 15) {
                var px = x + Math.random() * width / 15;
                var py = y + Math.random() * height / 15;
                var p = { x: px, originX: px, y: py, originY: py };
                points.push(p);
            }
        }

        // for each point find the 5 closest points
        for (var i = 0; i < points.length; i++) {
            var closest = [];
            var p1 = points[i];
            for (var j = 0; j < points.length; j++) {
                var p2 = points[j]
                if (!(p1 == p2)) {
                    var placed = false;
                    for (var k = 0; k < 5; k++) {
                        if (!placed) {
                            if (closest[k] == undefined) {
                                closest[k] = p2;
                                placed = true;
                            }
                        }
                    }

                    for (var k = 0; k < 5; k++) {
                        if (!placed) {
                            if (getDistance(p1, p2) < getDistance(p1, closest[k])) {
                                closest[k] = p2;
                                placed = true;
                            }
                        }
                    }
                }
            }
            p1.closest = closest;
        }

        // assign a circle to each point
        for (var i in points) {
            var c = new Circle(points[i], 2 + Math.random() * 2, 'rgba(255,255,255,0.3)');
            points[i].circle = c;
        }
    }

    // Event handling
    function addListeners() {
        if (!('ontouchstart' in window)) {
            window.addEventListener('mousemove', mouseMove);
        }
        window.addEventListener('scroll', scrollCheck);
        window.addEventListener('resize', resize);
    }

    function mouseMove(e) {
        var posx = 0;
        var posy = 0;
        if (e.pageX || e.pageY) {
            posx = e.pageX;
            posy = e.pageY;
        }
        else if (e.clientX || e.clientY) {
            posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }
        target.x = posx;
        target.y = posy;
    }

    function scrollCheck() {
        if (document.body.scrollTop > height) animateHeader = false;
        else animateHeader = true;
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        largeHeader.style.height = height + 'px';
        canvas.width = width;
        canvas.height = height;
    }

    // animation
    function initAnimation() {
        animate();
        for (var i in points) {
            shiftPoint(points[i]);
        }
    }

    function animate() {
        if (animateHeader) {
            ctx.clearRect(0, 0, width, height);
            for (var i in points) {
                // detect points in range
                if (Math.abs(getDistance(target, points[i])) < 4000) {
                    points[i].active = 0.3;
                    points[i].circle.active = 0.6;
                } else if (Math.abs(getDistance(target, points[i])) < 20000) {
                    points[i].active = 0.1;
                    points[i].circle.active = 0.3;
                } else if (Math.abs(getDistance(target, points[i])) < 40000) {
                    points[i].active = 0.02;
                    points[i].circle.active = 0.1;
                } else {
                    points[i].active = 0;
                    points[i].circle.active = 0;
                }

                drawLines(points[i]);
                points[i].circle.draw();
            }
        }
        requestAnimationFrame(animate);
    }

    function shiftPoint(p) {
        TweenLite.to(p, 1 + 1 * Math.random(), {
            x: p.originX - 50 + Math.random() * 100,
            y: p.originY - 50 + Math.random() * 100, ease: Circ.easeInOut,
            onComplete: function () {
                shiftPoint(p);
            }
        });
    }

    // Canvas manipulation
    function drawLines(p) {
        if (!p.active) return;
        for (var i in p.closest) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.closest[i].x, p.closest[i].y);
            ctx.strokeStyle = 'rgba(156,217,249,' + p.active + ')';
            ctx.stroke();
        }
    }

    function Circle(pos, rad, color) {
        var _this = this;

        // constructor
        (function () {
            _this.pos = pos || null;
            _this.radius = rad || null;
            _this.color = color || null;
        })();

        this.draw = function () {
            if (!_this.active) return;
            ctx.beginPath();
            ctx.arc(_this.pos.x, _this.pos.y, _this.radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = 'rgba(255,255,255,' + _this.active + ')';
            ctx.fill();
        };
    }

    // Util
    function getDistance(p1, p2) {
        return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
    }

    return {
        init: init
    };

}());

LM.habilidades = (function () {
    'use strict';

    var config = {
        classes: {
            container: '.swiper-container',
            pagination: '.swiper-pagination'
        },
        slidesPerView: 3
    };

    function init() {
        carrousel();

        $(window).on('resize', carrousel);
    }

    function carrousel(){
        if($(window).width() > 1200){
            config.slidesPerView = 3;
        } else if($(window).width() > 992){
            config.slidesPerView = 3;
        } else if($(window).width() > 768){
            config.slidesPerView = 2;
        } else{
            config.slidesPerView = 1;
        }

        var swiper = new Swiper(config.classes.container, {
            pagination: config.classes.pagination,
            slidesPerView: config.slidesPerView,
            paginationClickable: true,
            spaceBetween: 30
        });
    }

    return {
        init: init
    };

}());

LM.portfolio = (function () {
    'use strict';

    var config = {
        classes: {
            portfolio: '.portfolio',
            projeto: '.projeto',
            slider: '.md-slider'
        },
        interval: null
    };

    function init() {
        //list_thumbs();

        //$(window).bind('resize', function(){ list_thumbs(); });

        $.each($(config.classes.portfolio).find('ul li'), function(i, item){
            $(item).hoverdir(); 
            $(item).on('click', clickProjeto);
        });
    }

    function clickProjeto(){
        var $this = $(this).find('a');
        var $img = $this.attr('href');
        var $title = $this.data('title');
        var $description = $this.data('description');
        var $devices = JSON.parse($this.attr('data-devices'));
        var $detail = JSON.parse($this.attr('data-detail'));
        
        LM.preloader.open();

        // $(config.classes.projeto).find('img').attr('src', $img);
        // $(config.classes.projeto).find('img').load(function(){
        //     LM.preloader.close();
        // });

        $(config.classes.projeto).find('h3').text($title);
        //$(config.classes.projeto).find('img').attr('src', $img);
        $(config.classes.projeto).find('p').html($description);

        $(config.classes.projeto).find('.detail').html('');

        $.each($detail, function(i, item){
            if(item.Agência){
                $(config.classes.projeto).find('.detail').append('<p><strong>Agência: </strong>'+ item.Agência +'</p>');
            } else{
                $(config.classes.projeto).find('.detail').append('<p><strong>Cliente: </strong>'+ item.Cliente +'</p>');
            }

            $(config.classes.projeto).find('.detail').append('<p><strong>Tenologia: </strong>'+ item.Tecnologia +'</p>');

            if(item.Site){
                $(config.classes.projeto).find('.detail').append('<p><strong>Site: </strong> <a href="'+ item.Site +'" target="_blank">'+ item.Site +'</a></p>');                
            }
        });

        $('.md-device > a').html('');

        $.each($devices, function(i, item){
            var _imgs = $('<img/>').load().attr('src', item.imgUrl);

            $('.md-device > a').append(_imgs);
        });

        $(config.classes.projeto).slideDown();

        LM.preloader.close();

        clearInterval(config.interval);

        animeDevices($devices);

        var $position = $(config.classes.projeto).position().top;
        
        $('html, body').animate({ scrollTop: $position }, { duration: 1000, queue: false, easing: 'easeInQuart' });
        
        return false;
    }

    function animeDevices(devices){
        var current = 0;
        var current_length = devices.length;

        if(current_length > 1){
            config.interval = setInterval(function(){
                current++;

                if(current == current_length){
                    current = 0;
                }

                $('.projeto img').fadeOut();
                $('.projeto img').eq(current).fadeIn();
                $('.md-device').attr('class', 'md-device md-device-'+ current +'');
            }, 3000);
        } else{
            $('.projeto img').fadeOut();
            $('.projeto img').eq(current).fadeIn();
            $('.md-device').attr('class', 'md-device md-device-'+ current +'');
        }
    }

    function list_thumbs(){
        var _width = $(window).width() / 4;

        $(config.classes.portfolio).find('ul li').css({ 'width':_width });
    }

    return {
        init: init
    };

}());

LM.curiosidades = (function () {
    'use strict';

    var $animation_elements = $('.animation-element');
    var $window = $(window);

    function init() {
        $window.on('scroll resize', scrollParalaxVideo);
        $window.trigger('scroll');
    }

    function scrollParalaxVideo(e){
        var _this = $(e.currentTarget);
        var _top = _this.scrollTop();

        //$('.curiosidades video').css({'margin-top':-_top});
    }

    return {
        init: init
    };

}());

LM.contato = (function () {
    'use strict';

    function init() {
        $('[data-ft-module="form"]').on('form:send', function(){
            var form = $(this).serialize();

            $.ajax({
                type: 'POST',
                url: 'php/contato.php',
                data: form,
                beforeSend: function(){
                    frontutils.modal.open({target: "#loading"});
                },
                success: function(result) {
                    frontutils.modal.close();
                    frontutils.modal.alert({title: "Atenção", content: result});
                },
                error: function(){
                    frontutils.modal.close();
                    frontutils.modal.alert({title: "OOPPSSS!!!", content: "Ops! Ocorreu um erro, tente novamente mais tarde."});
                },
                complete: function(){
                    setTimeout(function(){
                        frontutils.modal.close();
                    }, 2000);
                }
            });
        });
    }

    return {
        init: init
    };

}());

LM.scrollParalax = (function () {
    'use strict';

    var $animation_elements = $('.animation-element');
    var $window = $(window);

    function init() {
        $window.on('scroll resize', check_if_in_view);
        $window.trigger('scroll');
    }

    function check_if_in_view(){
        var window_height = $window.height();
        var window_top_position = $window.scrollTop();
        var window_bottom_position = (window_top_position + window_height);

        $.each($animation_elements, function() {
        var $element = $(this);
        var element_animate = $element.data('animate');
        var element_height = $element.outerHeight();
        var element_top_position = $element.offset().top;
        var element_bottom_position = (element_top_position + element_height);

        //check to see if this current container is within viewport
        if ((element_bottom_position >= window_top_position) &&
            (element_top_position <= window_bottom_position)) {
                $element.addClass('in-view').addClass(element_animate);
            } else {
                //$element.removeClass('in-view').removeClass(element_animate);
            }
        });
    }

    return {
        init: init
    };

}());

LM.menuResponsivo = (function () {
    'use strict';

    var config = {
        classes: {
            overlayNav: '.cd-overlay-nav',
            overlayContent: '.cd-overlay-content',
            navigation: '.cd-primary-nav',
            toggleNav: '.cd-nav-trigger'
        }
    };

    var $window = $(window);

    function init() {
        //inizialize navigation and content layers
        layerInit();
        $(window).on('resize', function(){
            window.requestAnimationFrame(layerInit);
        });

        //open/close the menu and cover layers
        $(config.classes.toggleNav).on('click', clickToggleNav);
        $(config.classes.navigation).find('a').on('click', clickNav);
        $('.nav-menu').on('click', clickNav);

        $window.on('scroll resize', scrollRequestPosition);
        $window.trigger('scroll');
    }

    function clickNav(e){
        var _this = $(e.currentTarget);
        var _hash = _this.attr('href');
        var _content = $(''+ _hash +'').position().top;

        if(!_this.hasClass('nav-menu')){
            clickToggleNav();

            $('html, body').scrollTop(_content);
        } else{
            $('html, body').animate({ scrollTop: _content }, { duration: 1000, queue: false, easing: 'easeInQuart' });
        }

        return false;
    }

    function clickToggleNav(){
        if(!$(config.classes.toggleNav).hasClass('close-nav')) {
            //it means navigation is not visible yet - open it and animate navigation layer
            $(config.classes.toggleNav).addClass('close-nav');
            
            $(config.classes.overlayNav).children('span').velocity({
                translateZ: 0,
                scaleX: 1,
                scaleY: 1,
            }, 500, 'easeInCubic', function(){
                $(config.classes.navigation).addClass('fade-in');

                

            });

            var _current = 0;
            var _length = $(config.classes.navigation).find('li').length;

            var _setInterval = setInterval(function () {
                $(config.classes.navigation).find('li').eq(_current).addClass('zoomInDown animated');

                _current++;

                if (_current == _length) {
                    clearInterval(_setInterval);
                }
            }, 100);
        } else {
            //navigation is open - close it and remove navigation layer
            $(config.classes.toggleNav).removeClass('close-nav');
            
            $(config.classes.overlayContent).children('span').velocity({
                translateZ: 0,
                scaleX: 1,
                scaleY: 1,
            }, 500, 'easeInCubic', function(){
                $(config.classes.navigation).removeClass('fade-in');

                $.each($(config.classes.navigation).find('li'), function(i, item){
                    $(item).delay(500).removeClass('zoomInDown animated');
                });
                
                $(config.classes.overlayNav).children('span').velocity({
                    translateZ: 0,
                    scaleX: 0,
                    scaleY: 0,
                }, 0);
                
                $(config.classes.overlayContent).addClass('is-hidden').one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function(){
                    $(config.classes.overlayContent).children('span').velocity({
                        translateZ: 0,
                        scaleX: 0,
                        scaleY: 0,
                    }, 0, function(){$(config.classes.overlayContent).removeClass('is-hidden')});
                });
                if($('html').hasClass('no-csstransitions')) {
                    $(config.classes.overlayContent).children('span').velocity({
                        translateZ: 0,
                        scaleX: 0,
                        scaleY: 0,
                    }, 0, function(){$(config.classes.overlayContent).removeClass('is-hidden')});
                }
            });
        }
    }

    function layerInit(){
        var diameterValue = (Math.sqrt( Math.pow($(window).height(), 2) + Math.pow($(window).width(), 2))*2);

        $(config.classes.overlayNav).children('span').velocity({
            scaleX: 0,
            scaleY: 0,
            translateZ: 0,
        }, 50).velocity({
            height : diameterValue+'px',
            width : diameterValue+'px',
            top : -(diameterValue/2)+'px',
            left : -(diameterValue/2)+'px',
        }, 0);

        $(config.classes.overlayContent).children('span').velocity({
            scaleX: 0,
            scaleY: 0,
            translateZ: 0,
        }, 50).velocity({
            height : diameterValue+'px',
            width : diameterValue+'px',
            top : -(diameterValue/2)+'px',
            left : -(diameterValue/2)+'px',
        }, 0);
    }

    function scrollRequestPosition(){
        var $header = $('header');

        if($window.scrollTop() > $header.height()){
            $(config.classes.toggleNav).addClass('show bounceInDown animated');
        } else{
            $(config.classes.toggleNav).removeClass('show bounceInDown animated');
        }
    }

    return {
        init: init
    };

}());

$(window).load(function () {
    'use strict';

    LM.preloader.init();
});