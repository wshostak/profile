/*
  mGraph
  Version: 1.0 r39

  Copyright (c) 2010 Meta100 LLC.
  http://www.meta100.com/

  For licensing please contact Meta100 @ http://www.meta100.com/
*/

(function($){

  var $o, $t, $i,
      mousedown = "mousedown",
      mouseup = "mouseup",
      mousemove = "mousemove";

  $.fn.mGraph = function(options) {

    $o = $.extend($.fn.mGraph.defaults, options);
    $i = $.fn.mGraph.inits;
    $t = $(this);

    if ('ontouchstart' in window) {
  
        mousedown = "touchstart";
        mouseup = "touchend touchcancle";
        mousemove = "touchmove";
        $i.is_touch = true;
    }

    if (!$o.zoom) $o.zoom = $o.init_zoom;
    if (!$o.min_zoom) $o.min_zoom = $o.init_zoom / 10;
    if (!$o.max_zoom) $o.max_zoom = $o.init_zoom * 4;
    if (!$o.zoom_step) $o.zoom_step = Math.round(($o.max_zoom - $o.min_zoom) / $o.init_zoom) * 2;
    if (typeof $o.transition_steps == 'undefined') $o.transition_steps = Math.floor($o.transition_speed / (1000 / $o.fps));

    $o.zoom_animate = false;
    $o.end_zoom = $o.init_zoom;

    $t.addClass('mode_' + $i.mode);

    $.fn.mGraph.drag();
    $.fn.mGraph.resize();

    if (!$i.events) $.fn.mGraph.events();
  };

  $.fn.mGraph.inits = {
    drag: false,
    dragging: false,
    mode: 'graph',
    draw: 'auto',
    node_added_trigger: true,
    mode_change_drag: false,
    is_touch: false,
    pinch_size: false,
    pinch_scale: false,
    moved_again: false,
    events: false,
    first_click: 0,
    postion: {
      x: 0,
      y: 0
    },
    offset: {
      x: 0,
      y: 0
    },
    canvas: {
      height: 0,
      width: 0
    },
    line: {
      x: [],
      y: []
    },
    ctx: false,
    event_active: false,
    spring_length: 0,
    zoom_mod: 1,
    timer: false,
    resize_timer: false,
    center: {
      x: 0,
      y: 0
    },
    border_radius: {
      top_right: 'border-top-right-radius',
      bottom_right: 'border-bottom-right-radius',
      bottom_left: 'border-bottom-left-radius',
      top_left: 'border-top-left-radius'
    },
    browser: 'css3'
  };

  $.fn.mGraph.defaults = {
    fps: 15,
    transition_speed: 1000,
    font_sizes: [100, 80, 64, 40, 30, 25],
    link_opacity: [100, 80, 64, 40, 30, 25],
    image_sizes: [100, 80, 64, 40, 30, 25],
    center_offset: {
      x: 0,
      y: 0
    },
    line_width: 1,
    line_max_width: 2,
    zoom: false,
    init_zoom: 100,
    min_zoom: false,
    max_zoom: false,
    zoom_step: false,
    clear_lines: true,
    show_orbits: 8,
    max_orbit: 6,
    max_size: 3,
    node_class: 'node',
    line_class: 'line',
    old_line_class: 'old_line',
    parent_prefix: 'parent_',
    center_node_class: 'center_node',
    no_center_node_class: 'no_center',
    no_drag_class: 'no_drag',
    hilight_node_class: 'highlight_node',
    line_color: '#fff',
    cursor_line: false,
    draw_line_color: false,
    tight_springs: false,
    start_near_center: false,
    nodes:{}
  };

  $.fn.mGraph.resize = function () {

    clearTimeout($i.resize_timer);

    $i.resize_timer = setTimeout(function () {

      var height = $i.canvas.height,
          width = $i.canvas.width;

      $i.canvas.height = $t.height();
      $i.canvas.width = $t.width();

      $i.spring_length = Math.round(($i.canvas.height + $i.canvas.width) / 40);
      $i.zoom_mod = ($i.canvas.height + $i.canvas.width) * .0008;

      $('body').css({
        'font-size': (100 * $i.zoom_mod) + '%'
      });

      $t.css({
        'font-size': ($o.zoom) + '%',
  	    'position': 'fixed',
  	    'top': 0,
  	    'left': 0
      });

      if ($i.center.x + $i.center.y == 0) {
  
        $i.center.x = Math.round($i.canvas.width / 2);
        $i.center.y = Math.round($i.canvas.height / 2);
      } else {
  
        $i.center.x = Math.round(($i.center.x / width) * $i.canvas.width);
        $i.center.y = Math.round(($i.center.y / height) * $i.canvas.height);
      }
  
      if ($o.center_offset.x != 0) $i.center.x = Math.round($i.center.x * $o.center_offset.x);
      if ($o.center_offset.y != 0) $i.center.y = Math.round($i.center.y * $o.center_offset.y);
  
      $o.center_offset = {x:0,y:0};

      for (var id in $o.nodes) {
  
        $o.nodes[id].height = $('#' + id).outerHeight();
        $o.nodes[id].width = $('#' + id).outerWidth();
      }
  
      $.fn.mGraph.centerNode();
      $.fn.mGraph.draw();

      $t.trigger('resize.mGraph');
    }, 50);
  };

  $.fn.mGraph.fixTextWidth = function (text, max_length) { 

    text = $('<div>').html(text.replace(/[():\/.]/g, '_')).text().replace(/(\r\n|\n|\r)/gm,"").replace(/^(.{128}[^\s]*).*/, "$1") + " ";

    var $b = $('<div>').css({
          'display': 'inline-block',
          'overflow': 'visible'
        }).addClass($.fn.mGraph.defaults.node_class).text(text).appendTo('body'),
        font_size = parseFloat($b.css('font-size')),
        width = Math.ceil($b.width() / (font_size * .95)),
        org_width = width,
        height = $b.height(),
        org_height = height,
        em = Math.floor(height / (font_size * 1.05));

    $b.html('<span id="test_span">' + $b.html() + '</span>')

    for (var i = em; i < org_width; i++) {

      $b.css('width', i + 'em');
      height = $b.height();

      if (height > org_height && $b.width() >= height) {

        width = i;
        org_height = height;
      } else if (height < org_height) {

        break;
      }
    }

    $b.css('width', width + 'em');

    width = ($('#test_span', $b).width() / font_size);

    $b.remove();

    return width < org_width? width: '';
  };

  $.fn.mGraph.addNode = function () {

    var node_count = $.fn.mGraph.size($o.nodes),
        id = $o.node_class + node_count,
        centerNode = false;

    while (typeof $o.nodes[id] !== 'undefined') id = 'node' + (++node_count);

    var defaults = {
        data: {},
        text: id,
        type: 'text',
        link: false,
        image: false,
        audio: false,
        link_to: false,
        line_color: false,
        add_class: false,
        remove_class: false,
        css: false,
        html: false,
        orbit: 0,
        animate: true,
        start_fontSize: 1,
        start_near_center: false,
        links_to_center: false,
        fix_text_width: false,
        step: 0
      };

    var i = 0;

    if (arguments.length == 1 && typeof arguments[0] == 'object') {

      $.extend(defaults, arguments[0]);
    } else {

      for (var d in defaults) {

        if (typeof arguments[i] !== 'undefined') defaults[d] = arguments[i];
        i++;
      }
    }

    if (typeof defaults.link_to == 'string' && defaults.link_to != 'none') {

      var link_to = defaults.link_to;
      defaults.link_to = {};
      defaults.link_to[link_to] = {};
    }

    for (var n in $o.nodes) {

      if ($o.nodes[n].text.toLowerCase() == defaults.text.toLowerCase() && $o.nodes[n].type == defaults.type) id = n;
      if ($o.nodes[n].orbit === 0) centerNode = n;

      if (defaults.link_to !== -1) {

        for (var l in defaults.link_to) {

          if (n != l && $o.nodes[n].text == l) {

            defaults.link_to[n] = defaults.link_to[l];
            delete defaults.link_to[l];
          }
        }
      }
    }

    if (typeof $o.nodes[id] == 'undefined') {

      $o.nodes[id] = {};

      if (node_count > 0) {

        defaults.orbit = 1;

        if (!defaults.link_to) {

          defaults.link_to = {};
          defaults.link_to[centerNode] = {};
        } else if (defaults.link_to == 'none') {

          defaults.link_to = {};
          defaults.orbit = -1;

          $.fn.mGraph.changeMode('edit');
        } else {

          defaults.orbit = $o.max_orbit;

          for (var l in defaults.link_to) {

            if (typeof $o.nodes[l] != 'undefined' && $o.nodes[l].orbit < defaults.orbit) defaults.orbit = $o.nodes[l].orbit + 1;
          }
        }
      } else {

        if (defaults.link_to == 'none') defaults.link_to = {};
      }
    } else {

      if (typeof defaults.data != "string") {

        if (!Object.keys($o.nodes[id].data).length) {
          
          $o.nodes[id].data = defaults.data;
        } else if (defaults.data && $o.nodes[id].data && defaults.data != $o.nodes[id].data) {
  
          if (typeof $o.nodes[id].data.length == 'undefined') {
  
            $o.nodes[id].data = [$o.nodes[id].data]
          }

          for (var i = 0; i < $o.nodes[id].data.length; i++) {
            
            if ($o.nodes[id].data[i] == defaults.data) delete $o.nodes[id].data[i];
          }
  
          $o.nodes[id].data.push(defaults.data);
          delete defaults.data;
        }
      }

      if (defaults.line_color) $o.nodes[id].line_color = defaults.line_color;
    }

    for (var d in defaults) {

      if (d == 'subchannels') {

        var subchannels = defaults[d].slice(0);

        if ($o.nodes[id].hasOwnProperty("subchannels")) {

          $.each($o.nodes[id][d], function(i, el){
            if($.inArray(el, subchannels) === -1 && typeof el == "string") subchannels.push(el);
          });
        }

        $o.nodes[id].subchannels = subchannels;
//        for (var s = 0; s < subchannels.length; s++) $o.nodes[id].subchannels[s] = subchannels[s];
      } else {

        if (typeof defaults[d] == 'object') $o.nodes[id][d] = $.extend(true, defaults[d], $o.nodes[id][d]);
        if (typeof $o.nodes[id][d] == 'undefined' || !$o.nodes[id][d]) $o.nodes[id][d] = defaults[d];
      }
    }

    $o.nodes[id].end_opacity = $o.link_opacity[Math.min(Math.max($o.nodes[id].orbit, 0), $o.link_opacity.length)];

    $.fn.mGraph.centerNode();
    $.fn.mGraph.draw();
    $('#' + id).trigger('nodeAdded.mGraph', [id, $o.nodes[id]]).trigger('autosave.mGraph');

    return id;
  };

  $.fn.mGraph.removeNode = function (node, tree) {

    var orbit = $o.nodes[node].orbit || false;

    if (typeof node == 'undefined' || typeof node != 'string') return false;
    if (typeof tree == 'undefined') tree = false;

    $('#' + $o.parent_prefix + node).html('').remove();

    for (var l in $o.nodes[node].link_to) {

      delete $o.nodes[l].link_from[node];
      if (tree && $.fn.mGraph.graterOrbit(l)) $.fn.mGraph.removeNode(l);
    }

    for (l in $o.nodes[node].link_from) {

      delete $o.nodes[l].link_to[node];
      if (tree && $.fn.mGraph.graterOrbit(l)) $.fn.mGraph.removeNode(l);
    }

    delete $o.nodes[node];

    if (!tree && orbit == 0) {

      for (var id in $o.nodes) {

        if ($o.nodes[id].orbit == 1) {

          $o.nodes[id].orbit == 0;
          $.fn.mGraph.setOrbits(id);
          continue;
        }
      }
    }

    $t.trigger('autosave.mGraph');

    return node;
  };

  $.fn.mGraph.clearAllNodes = function () {

    clearTimeout($.fn.mGraph.inits.timer);

    $.fn.mGraph.defaults.nodes = {};
    $t.html('');

    $t.trigger('autosave.mGraph');

    $i.center.x = Math.round($i.canvas.width / 2);
    $i.center.y = Math.round($i.canvas.height / 2);

    $.fn.mGraph.draw();
    $.fn.mGraph.moveNodes();
  };
 
  $.fn.mGraph.graterOrbit = function (node) {

    var o = $o.nodes[node].orbit;

    for (var m in $o.nodes[node].link_from) {

      if ($o.nodes[m].orbit < o) o = $o.nodes[m].orbit;
    }

    for (m in $o.nodes[node].link_to) {

      if ($o.nodes[m].orbit < o) o = $o.nodes[m].orbit;
    }

    if ($o.nodes[node].orbit == o && o > 0) return true;
    else return false;
  };

  $.fn.mGraph.resizeNode = function (node, size) {

    var id = node.attr('id'),
        parent = '#' + $o.parent_prefix + id;

    $o.nodes[id].animate = true;
    $o.nodes[id].step = 0;
    $o.nodes[id].start_fontSize = ($o.font_sizes[0] * (($i.mode == 'edit')? size: $o.max_size));
    $o.nodes[id].start_opacity = 100;
    $o.nodes[id].end_fontSize = $o.font_sizes[Math.min(Math.max($o.nodes[id].orbit, 0), $o.font_sizes.length)],
    $o.nodes[id].end_opacity = $o.link_opacity[Math.min(Math.max($o.nodes[id].orbit, 0), $o.link_opacity.length)];

    if ($o.nodes[id].mouseover) {

      $o.nodes[id].start_fontSize = $o.nodes[id].end_fontSize;
      $o.nodes[id].start_opacity = $o.nodes[id].end_opacity;
      $o.nodes[id].end_fontSize = ($o.font_sizes[0] * size),
      $o.nodes[id].end_opacity = 100;
    }

    if ($o.nodes[id].start_fontSize == $o.nodes[id].end_fontSize && $o.nodes[id].start_opacity == $o.nodes[id].end_opacity) {
      
      $o.nodes[id].animate = false;
    }
  };

  $.fn.mGraph.events = function (e) {

    if ($i.is_touch) return true;

    $i.events = true;
    $(document).on('mouseenter.mGraph', '.' + $o.node_class, function () {

      var $t = $(this)
          id = $t.attr('id'),
          $parent = $('#' + $o.parent_prefix + id);

      $o.nodes[id].mouseover = true;

      if (!$i.event_active) {

        if ($i.mode == 'edit') { // TODO: remove the graphics and the confirm from here!

          $parent.addClass($o.hilight_node_class).css({
            'top': ($o.nodes[id].top - (($parent.outerHeight() - $o.nodes[id].height) / 2)) + 'px',
            'left': ($o.nodes[id].left - (($parent.outerWidth() - $o.nodes[id].width) / 2)) + 'px'
          });

          $.fn.mGraph.resizeNode($t, 1);
        } else {

          $.fn.mGraph.resizeNode($t, $o.max_size);
        }
      }

      $.fn.mGraph.draw();
    }).on('mouseleave.mGraph', '.' + $o.node_class, function () {

      var $t = $(this)
          id = $t.attr('id'),
          $parent = $('#' + $o.parent_prefix + id);

      $o.nodes[id].mouseover = false;

      if (!$i.event_active) {

        $.fn.mGraph.resizeNode($t, 1);

        if ($i.mode == 'edit') $parent.removeClass($o.hilight_node_class);
        else $('.' + $o.hilight_node_class).removeClass($o.hilight_node_class);

        $parent.css({
          'top': ($o.nodes[id].top - (($parent.outerHeight() - $o.nodes[id].height) / 2)) + 'px',
          'left': ($o.nodes[id].left - (($parent.outerWidth() - $o.nodes[id].width) / 2)) + 'px'
        });
      }

      $.fn.mGraph.draw();
    });

    $t.on('dblclick', function (e) {

      e.stopPropagation();

      if ($i.mode == 'graph') {

        for (var id in $o.nodes) $o.nodes[id].locked = false;
  
        $o.zoom_animate = true;
        $i.center.x = Math.round($i.canvas.width / 2);
        $i.center.y = Math.round($i.canvas.height / 2);
      }
    });

    $(document).on('keydown', function (e) {
  
      e.stopPropagation();
  
      var key = e.which,
          ele = document.activeElement;
  
    	if (key == 38) {
  
      	$.fn.mGraph.zoom(-1, true);
        return false;
      } else if (key == 40) {
  
      	$.fn.mGraph.zoom(1, true);
        return false;
      }
    });
    $.fn.mGraph.centerNode();
  };

  $.fn.mGraph.centerNode = function () {

    $('.' + $o.center_node_class).removeClass($o.center_node_class);    
    $('.' + $o.hilight_node_class).removeClass($o.hilight_node_class);    

    for (var i in $o.nodes) {

      if ($o.nodes[i].orbit === 0) {

        $('#' + i).addClass($o.center_node_class);
        $('#' + i + ' > *').addClass($o.center_node_class);
      }
    }

    $(window).resize($.fn.mGraph.resize);
  };

  $.fn.mGraph.changeMode = function (mode) {

    if (mode != 'edit') mode = 'graph';

    if (mode == 'graph' && $i.mode_change_drag) $t.trigger(mouseup);

    $t.removeClass('mode_' + $i.mode).addClass('mode_' + mode);

    if (mode != $i.mode) {

      $i.mode = mode;
      $t.trigger(mode + '.mGraph').trigger('autosave.mGraph');
    }

    $.fn.mGraph.draw();
  };

  $.fn.mGraph.searchNode = function (key, value) {

    var nodes = [];

    for (var i in $o.nodes) {

      if ($o.nodes[i][key] == value) nodes.push($o.nodes[i]);
    }

    return nodes;
  };

  $.fn.mGraph.triggerNode = function (node) {

    var id = node.attr('id');

    $o.nodes[id].locked = false;
    $i.center.x = Math.round($i.canvas.width / 2);
    $i.center.y = Math.round($i.canvas.height / 2);

    $.fn.mGraph.setOrbits(id);

    node.trigger('selected.mGraph').trigger('search.mGraph', id).trigger('autosave.mGraph');
  };

  $.fn.mGraph.setOrbits = function (node) {

    var orbit = 0;

    $i.event_active = true;
    clearTimeout($i.timer);

    for (var id in $o.nodes) {

      $('#' + id).css({
        'font-size': '100%',
        'opacity': 1
      });

      $o.nodes[id].orbit = -1;
    }

    $o.nodes[node].orbit = orbit;

    for (var i = 0; i < $o.max_orbit; i++) {

      orbit = i + 1;

      for (id in $o.nodes) {

        if ($o.nodes[id].orbit === i) {

          $('#' + id).css({
            'font-size': $o.font_sizes[Math.min(Math.max($o.nodes[id].orbit, 0), $o.font_sizes.length)] + '%',
            'opacity': $o.link_opacity[Math.min(Math.max($o.nodes[id].orbit, 0), $o.link_opacity.length)] / 100
          });

          $o.nodes[id].height = $('#' + id).outerHeight();
          $o.nodes[id].width = $('#' + id).outerWidth();

          for (var l in $o.nodes[id].link_to) {

            if ($o.nodes[l].orbit == -1) $o.nodes[l].orbit = orbit;
          }

          for (l in $o.nodes[id].link_from) {

            if ($o.nodes[l].orbit == -1) $o.nodes[l].orbit = orbit;
          }
        }
      }
    }

    $.fn.mGraph.centerNode();
    $.fn.mGraph.moveNodes();
    $i.event_active = false;
  };

  $.fn.mGraph.startPosition = function (id) {

    if ($o.start_near_center || $o.nodes[id].start_near_center) {

      if (typeof $o.nodes[id].x != 'number' || isNaN($o.nodes[id].x)) $o.nodes[id].x = Math.floor(Math.random() * 10 + $i.center.x + 5);
      if (typeof $o.nodes[id].y != 'number' || isNaN($o.nodes[id].y)) $o.nodes[id].y = Math.floor(Math.random() * 10 + $i.center.y + 5);
    } else {

      if (typeof $o.nodes[id].x != 'number' || isNaN($o.nodes[id].x)) $o.nodes[id].x = Math.floor(Math.random() * ($i.canvas.width - $('#' + id).outerWidth()));
      if (typeof $o.nodes[id].y != 'number' || isNaN($o.nodes[id].y)) $o.nodes[id].y = Math.floor(Math.random() * ($i.canvas.height - $('#' + id).outerHeight()));
    }

    return true;
  };

  $.fn.mGraph.draw = function () {

    $('.' + $o.parent_prefix + $o.line_class).addClass($o.old_line_class);

    if ($o.zoom_animate) {

      if ($o.zoom < $o.end_zoom) {

        $.fn.mGraph.zoom(1);
      } else if ($o.zoom > $o.end_zoom) {

        $.fn.mGraph.zoom(-1);
      } else {

        $o.zoom_animate = false;
        $o.end_zoom = $o.init_zoom;
      }
    }

    for (var id in $o.nodes) {

      var nodeA = $o.nodes[id],
          new_node = false;

      if (nodeA.orbit < $o.show_orbits) {

        if ($('#' + id).length < 1 && typeof nodeA.custom_html != 'undefined') nodeA.html = nodeA.custom_html;

        if (typeof nodeA.html != 'undefined' && nodeA.html) {

          if ($('#' + id).length < 1) new_node = true;

          $t.append('<div id="' + $o.parent_prefix + id + '" class="' + $o.parent_prefix + $o.node_class + '">' + nodeA.html + '</div>');
          $('#' + $o.parent_prefix + id + '>*:first-child').attr('id', id).addClass($o.node_class);
          nodeA.custom_html = $('#' + $o.parent_prefix + id).html();
          nodeA.html = false;
          new_node = true;
        }

        if ($('#' + id).length < 1) {

          if (typeof nodeA.text != 'string') nodeA.text = id;

          var text = nodeA.text;

          switch (nodeA.type.toLowerCase()) {

            case 'audio':

              text = '<img height="' + ($o.image_sizes[Math.min(Math.max(nodeA.orbit, 0), $o.image_sizes.length)] * .3 * ($o.zoom * $i.zoom_mod / 100)) + '" src="/images/mp3_player/playup.png" play="false" song="' + nodeA.text + '" class="audio">';
            break;

            case 'image':

              text = '<img height="' + ($o.image_sizes[Math.min(Math.max(nodeA.orbit, 0), $o.image_sizes.length)] * ($o.zoom * $i.zoom_mod / 100)) + '" src="' + nodeA.text + '">';
            break;
          }

          $t.append('<div class="' + $o.parent_prefix + $o.node_class + '" id="' + $o.parent_prefix + id + '"><div class="' + $o.node_class + '" id="' + id + '">' + text + '</div></div>');

          new_node = true;
        }

        var $node = $('#' + id),
            $parent = $('#' + $o.parent_prefix + id);

        if (new_node) {

          $node.css({
            'font-size': nodeA.start_fontSize + '%',
            'opacity': nodeA.end_opacity / 100
//            'width': nodeA.fix_text_width? $.fn.mGraph.fixTextWidth(nodeA.fix_text_width): ''
          });

          $.fn.mGraph.startPosition(id);

          if (typeof nodeA.add_parent_class != 'undefined' && nodeA.add_parent_class) $parent.addClass(nodeA.add_parent_class);

          nodeA.height = $($node).outerHeight();
          nodeA.width = $($node).outerWidth();
          nodeA.id = id;
          nodeA.end_fontSize = $o.font_sizes[Math.min(Math.max($o.nodes[id].orbit, 0), $o.font_sizes.length)];
          nodeA.transition_steps = 8;
          nodeA.animate = true;

          if (typeof nodeA.locked == 'undefined') nodeA.locked = false;

          $.fn.mGraph.centerNode();
          $t.trigger('newNode.mGraph', id);
        }

        if (typeof nodeA.add_class != 'undefined' && nodeA.add_class) {

          $node.addClass(nodeA.add_class);
          nodeA.custom_html = $parent.html();
          nodeA.add_class = false;
        }

        if (typeof nodeA.remove_class != 'undefined' && nodeA.remove_class) {

          $node.removeClass(nodeA.remove_class);
          nodeA.custom_html = $parent.html();
          nodeA.remove_class = false;
        }

        if (typeof nodeA.css != 'undefined' && nodeA.css) {

          $node.css(nodeA.css);
          nodeA.custom_html = $parent.html();
          nodeA.css = false;
        }

        if (typeof nodeA.line_color == 'undefined' || !nodeA.line_color) nodeA.line_color = $o.line_color;

        if (nodeA.animate == true) {

          var fontSize = nodeA.end_fontSize,
              opacity = nodeA.end_opacity,
              transition_steps = nodeA.transition_steps || $o.transition_steps;

          if (nodeA.step < $o.transition_steps) {

            nodeA.step++;

            fontSize = Math.round((((nodeA.end_fontSize - nodeA.start_fontSize) / $o.transition_steps) * nodeA.step) + nodeA.start_fontSize);
            opacity = Math.round((((nodeA.end_opacity - nodeA.start_opacity) / $o.transition_steps) * nodeA.step) + nodeA.start_opacity);
          } else {

            nodeA.transition_steps = false;
            nodeA.animate = false;
          }

          $node.css({
            'font-size': fontSize + '%',
            'opacity': opacity / 100
          });

          nodeA.height = $node.outerHeight();
          nodeA.width = $node.outerWidth();
        }

        nodeA.top = nodeA.y - (nodeA.height / 2);
        nodeA.right = nodeA.x + (nodeA.width / 2);
        nodeA.bottom = nodeA.top + nodeA.height;
        nodeA.left = nodeA.right - nodeA.width;

        $parent.css({
          'top': Math.round(nodeA.top - (($parent.outerHeight() - nodeA.height) / 2)) + 'px',
          'left': Math.round(nodeA.left - (($parent.outerWidth() - nodeA.width) / 2)) + 'px'
        });

        for (var i in nodeA.link_to) {

          if ($('#' + i)[0] && $o.nodes[i].orbit < $o.show_orbits) {

            var nodeB = $o.nodes[i];

            // Not sure if this is the best way to handle duplicate links
            // but certainly the easiest so we will go with it for now.
            if (typeof nodeB.link_from == 'undefined') nodeB.link_from = {};

            if (typeof nodeB.link_to != 'undefined' && typeof nodeB.link_to[id] != 'undefined') {

              nodeB.link_from[id] = nodeB.link_to[id];
              delete nodeB.link_to[id];
            }

            if (typeof nodeB.link_from[id] == 'undefined') nodeB.link_from[id] = {};

            $i.line.x = [nodeA.x, nodeB.x];
            $i.line.y = [nodeA.y, nodeB.y];
            $i.line.A = nodeA;
            $i.line.B = nodeB;

            $.fn.mGraph.drawLine(nodeA, nodeB, i);
          }
        }
      } else {

        var $parent = $('#' + $o.parent_prefix + id);

        if (nodeA.orbit >= $o.max_orbit) {

          delete $o.nodes[id];
        } else if ($parent[0]) {

          nodeA.custom_html = $parent.html();
          $parent.remove();
        }
      }
    }

    if (!$i.moved_again) $.fn.mGraph.moveNodes();
  };

  $.fn.mGraph.drawLine = function (nodeA, nodeB, i, color, cursor_line) {

    var lines = [$i.line.x[1], $i.line.y[1]]

    if (!cursor_line) cursor_line = false;
    if ($o.clear_lines) $.fn.mGraph.intersectRectangleLine(nodeA, nodeB);

    if (nodeB.links_to_center) {
      $i.line.x[1] = lines[0];
      $i.line.y[1] = lines[1];
    }

    var line_width = Math.max(((nodeA.mouseover || (nodeB && nodeB.mouseover))? $o.line_max_width: $o.line_width) * ($o.zoom * $i.zoom_mod / 100), $o.line_width),
        line_color = (typeof color == 'string')? color: (i && typeof nodeA.link_to[i] != 'undefined' && nodeA.link_to[i].color)? nodeA.link_to[i].color: nodeA.line_color,
        orbitA = Math.max(nodeA.orbit, 0),
        orbitB = (nodeB)? Math.max(nodeB.orbit, 0): orbitA,
        opacity = $o.link_opacity[((nodeA.mouseover || (nodeB && nodeB.mouseover))? 0: Math.min(orbitA, orbitB))] / 100,
        line_x_len = $i.line.x[1] - $i.line.x[0],
        line_y_len = $i.line.y[1] - $i.line.y[0],
        slope = (Math.atan2(line_y_len, line_x_len)*180/Math.PI).toFixed(2),
        neg_slope = ((Math.atan2(line_y_len, line_x_len)*180/Math.PI)*-1).toFixed(2),
        id = nodeA.id + '_' + (cursor_line || nodeB.id),
        $parent_line = $('#' + $o.parent_prefix + id),
        parent_line_width = ($o.line_width * 3 / 16).toFixed(2);
        parent_line_width_half = (parent_line_width / 2).toFixed(2);

    if (line_width > 0) {

      if (!$parent_line[0]) $parent_line = $('<span id="' + $o.parent_prefix + id + '" class="' + $o.parent_prefix + $o.line_class + (cursor_line? ' cursor_line current_line': '') +'"><div class="' + $o.line_class + '" id="' + id + '"></div><div class="left_line_handle" style="left:0;top:-' + parent_line_width_half + 'em;width:' + parent_line_width + 'em;height:' + parent_line_width + 'em;"></div><div class="right_line_handle" style="right:0;top:-' + parent_line_width_half + 'em;width:' + parent_line_width + 'em;height:' + parent_line_width + 'em;"></div></span>').appendTo($t);

      if (line_color == 'transparent') {

        $parent_line.addClass("hide");
      } else {

        $parent_line.removeClass($o.old_line_class + " hide").css({
          'left': $i.line.x[0] + 'px',
          'top': $i.line.y[0] + 'px',
          'transform': 'rotate(' + slope + 'deg)'
        });
        $('#' + id).css({
          'background-color': line_color,
          'opacity': opacity,
          'width': Math.sqrt(Math.pow(line_x_len, 2) + Math.pow(line_y_len, 2)).toFixed(2) + 'px',
          'height': line_width.toFixed(2) + 'px'
        });
      }
    }
  };

  $.fn.mGraph.drawNewLink = function (id, i) {

    if (typeof $o.nodes[id] == 'undefined') return;

    $('.' + $o.hilight_node_class).removeClass($o.hilight_node_class);    
    $('#' + $o.parent_prefix + id).addClass($o.hilight_node_class);

    if (i) $('#' + $o.parent_prefix + i).addClass($o.hilight_node_class);

    $.fn.mGraph.draw();

    $i.line.x = [$o.nodes[id].x, $i.offset.x];
    $i.line.y = [$o.nodes[id].y, $i.offset.y];

    if (i) {

      $i.line.x = [$o.nodes[id].x, $o.nodes[i].x];
      $i.line.y = [$o.nodes[id].y, $o.nodes[i].y];
    }

    $.fn.mGraph.drawLine($o.nodes[id], (i)? $o.nodes[i]: false, (i)? i: false, $o.draw_line_color, 'cursor');
  };

  $.fn.mGraph.alphaColor = function (color, opacity) {

    if (color == 'transparent') return 'rgba(0,0,0,0)';

    var output = [];

    if (color.indexOf('#') > -1) {

      var c = color.replace('#', '');

      if (c.length < 6) c = c.substr(0, 1) + c.substr(0, 1) + c.substr(1, 1) + c.substr(1, 1) + c.substr(2, 1) + c.substr(2, 1);

      output = [
        parseInt(c.substr(0, 2), 16),
        parseInt(c.substr(2, 2), 16),
        parseInt(c.substr(4, 2), 16)
      ];
    }

    if (color.indexOf('rgb') > -1) output = color.replace(/[^0-9,]/g, '').split(",");

    if (output.length < 3) {

      output = [0,0,0];
    }

    return 'rgba(' + output[0] + ', ' + output[1] + ', ' + output[2] + ', ' + opacity + ')';
  };

  $.fn.mGraph.intersectRectangleLine = function (A, B) {

    if (!B) B = {
      width: 0,
      height: 0,
      x: $i.line.x[1],
      y: $i.line.y[1],
      not_real: true
    };

    // , nodeA.top, nodeA.right, nodeA.bottom, nodeA.left
    var slope_x = ($i.line.x[1] - $i.line.x[0]) / ($i.line.y[1] - $i.line.y[0]),
        slope_y = ($i.line.y[1] - $i.line.y[0]) / ($i.line.x[1] - $i.line.x[0]),
        Aw2 = A.width / 2,
        Ah2 = A.height / 2,
        Bw2 = B.width / 2,
        Bh2 = B.height / 2,
        Al = $i.line.A.left,
        At = $i.line.A.top,
        Ar = $i.line.A.right,
        Ab = $i.line.A.bottom,
        Bl = $i.line.B.left,
        Bt = $i.line.B.top,
        Br = $i.line.B.right,
        Bb = $i.line.B.bottom,
        x = [
          Math.round((Math.abs(slope_x) < Math.abs(A.width / A.height))?
            ((At < Bt)? $i.line.x[0] + (Ah2 * slope_x): $i.line.x[0] - (Ah2 * slope_x)):
            ((Al < Bl)? A.width + Al: Al)),
          Math.round((Math.abs(slope_x) < Math.abs(B.width / B.height))?
            ((At > Bt)? $i.line.x[1] + (Bh2 * slope_x): $i.line.x[1] - (Bh2 * slope_x)):
            ((Al > Bl)? B.width + Bl: Bl))
        ],
        y = [
          Math.round((Math.abs(slope_y) < Math.abs(A.height / A.width))?
            ((!B || Al < Bl)? $i.line.y[0] + (Aw2 * slope_y): $i.line.y[0] - (Aw2 * slope_y)):
            ((!B || At < Bt)? A.height + At: At)),
          Math.round((Math.abs(slope_y) < Math.abs(B.height / B.width))?
            ((Al > Bl)? $i.line.y[1] + (Bw2 * slope_y): $i.line.y[1] - (Bw2 * slope_y)):
            ((At > Bt)? B.height + Bt: Bt))
        ],
        r = 0;

    $i.line.x = x;
    $i.line.y = y;

    if (x[0] > A.x && y[0] > A.y) { // Bottom Right

      r = Math.min(parseInt('0' + $('#' + A.id).css($i.border_radius.bottom_right)), Aw2, Ah2);

      if (r > 0 && x[0] > Ar - r && y[0] > Ab - r) $.fn.mGraph.intersectCircleLine({x: Ar - r, y: Ab - r}, r, {x: A.x, y: A.y}, {x: x[0], y: y[0]}, 0, true);
    } else if (x[0] < A.x && y[0] > A.y) { // Bottom Left

      r = Math.min(parseInt('0' + $('#' + A.id).css($i.border_radius.bottom_left)), Aw2, Ah2);

      if (r > 0 && x[0] < Al + r && y[0] > Ab - r) $.fn.mGraph.intersectCircleLine({x: Al + r, y: Ab - r}, r, {x: A.x, y: A.y}, {x: x[0], y: y[0]}, 0, true);
    } else if (x[0] < A.x && y[0] < A.y) { // Top Left

      r = Math.min(parseInt('0' + $('#' + A.id).css($i.border_radius.top_left)), Aw2, Ah2);

      if (r > 0 && x[0] < Al + r && y[0] < At + r) $.fn.mGraph.intersectCircleLine({x: Al + r, y: At + r}, r, {x: A.x, y: A.y}, {x: x[0], y: y[0]}, 0, false);
    } else { // Top Right

      r = Math.min(parseInt('0' + $('#' + A.id).css($i.border_radius.top_right)), Aw2, Ah2);

      if (r > 0 && x[0] > Ar - r && y[0] < At + r) $.fn.mGraph.intersectCircleLine({x: Ar - r, y: At + r}, r, {x: A.x, y: A.y}, {x: x[0], y: y[0]}, 0, false);
    }

    r = 0;

    if (!B.not_real) { // Bottom Right

      if (x[1] > B.x && y[1] > B.y) { // Bottom Right
  
        r = Math.min(parseInt('0' + $('#' + B.id).css($i.border_radius.bottom_right)), Bw2, Bh2);
  
        if (r > 0 && x[1] > Br - r && y[1] > Bb - r) $.fn.mGraph.intersectCircleLine({x: Br - r, y: Bb - r}, r, {x: B.x, y: B.y}, {x: x[1], y: y[1]}, 1, true);
      } else if (x[1] < B.x && y[1] > B.y) { // Bottom Left
  
        r = Math.min(parseInt('0' + $('#' + B.id).css($i.border_radius.bottom_left)), Bw2, Bh2);
  
        if (r > 0 && x[1] < Bl + r && y[1] > Bb - r) $.fn.mGraph.intersectCircleLine({x: Bl + r, y: Bb - r}, r, {x: B.x, y: B.y}, {x: x[1], y: y[1]}, 1, true);
      } else if (x[1] < B.x && y[1] < B.y) { // Top Left
  
        r = Math.min(parseInt('0' + $('#' + B.id).css($i.border_radius.top_left)), Bw2, Bh2);
  
        if (r > 0 && x[1] < Bl + r && y[1] < Bt + r) $.fn.mGraph.intersectCircleLine({x: Bl + r, y: Bt + r}, r, {x: B.x, y: B.y}, {x: x[1], y: y[1]}, 1, false);
      } else { // Top Right
  
        r = Math.min(parseInt('0' + $('#' + B.id).css($i.border_radius.top_right)), Bw2, Bh2);
  
        if (r > 0 && x[1] > Br - r && y[1] < Bt + r) $.fn.mGraph.intersectCircleLine({x: Br - r, y: Bt + r}, r, {x: B.x, y: B.y}, {x: x[1], y: y[1]}, 1, false);
      }
    }
  };

  $.fn.mGraph.intersectCircleLine = function (C, r, A, B, i, w) {

    var a = (B.x - A.x) * (B.x - A.x) + (B.y - A.y) * (B.y - A.y),
        b = 2 * ((B.x - A.x) * (A.x - C.x) + (B.y - A.y) * (A.y - C.y)),
        c = C.x * C.x + C.y * C.y + A.x * A.x + A.y * A.y - 2 * (C.x * A.x + C.y * A.y) - r * r,
        d = b * b - 4 * a * c;

    if (d <= 0) return false;

    var e = Math.sqrt(d),
        u1 = (-b + e) / (2 * a),
        u2 = (-b - e) / (2 * a);

    if ((u1 < 0 || u1 > 1) && (u2 < 0 || u2 > 1)) return false;

    $i.line.x[i] = Math.round(A.x + (B.x - A.x) * u1);
    $i.line.y[i] = Math.round(A.y + (B.y - A.y) * u1);

    var x = Math.round(A.x + (B.x - A.x) * u2),
        y = Math.round(A.y + (B.y - A.y) * u2);

    if ((w && y > $i.line.y[i]) || (!w && y < $i.line.y[i])) {

      $i.line.x[i] = x;
      $i.line.y[i] = y;
    }

    return true;
  };

  $.fn.mGraph.moveNodes = function () {

    var  total_move = 0;
    $i.moved_again = true;

    if ($i.mode == 'graph') {

      var K = $i.spring_length * ($o.zoom * $i.zoom_mod / 100);

      for (var id in $o.nodes) {

        var nodeA = $o.nodes[id];

        if (nodeA.orbit >= $o.show_orbits) continue;

        nodeA.velocity_x = 0;
        nodeA.velocity_y = 0;

        for (var i in $o.nodes) {

          if (nodeA == $o.nodes[i]) continue;
          if ($o.nodes[i].orbit >= $o.show_orbits) continue;

          // Repel
          var nodeB = $o.nodes[i],
              distance_x = nodeA.x - nodeB.x,
              distance_y = nodeA.y - nodeB.y,
              distance,
              spring_x = 0,
              spring_y = 0,
              nodes_linked = nodeA.link_to[i] || nodeB.link_to[id] || false;

          distance_x += ((nodeA.width * $.fn.mGraph.sign(distance_x)) / 2) - ((nodeB.width * $.fn.mGraph.sign(distance_x)) / 2);
          distance_y += ((nodeA.height * $.fn.mGraph.sign(distance_y)) / 2) - ((nodeB.height * $.fn.mGraph.sign(distance_y)) / 2);
          distance = Math.sqrt((distance_x * distance_x) + (distance_y * distance_y));

          if (distance == 0) continue;

          if (distance_x == 0) distance_x = .000001;
          if (distance_y == 0) distance_y = .000001;

//          var mass_1 = ((nodeA.height + nodeA.width) / Math.sqrt(nodeA.height + nodeA.width)) + 100, //play with the mass here
//              mass_2 = ((nodeB.height + nodeB.width) / Math.sqrt(nodeB.height + nodeB.width)) + 100,
          var mass_1 = nodeA.height + nodeA.width, //play with the mass here
              mass_2 = nodeB.height + nodeB.width,
              total_mass = mass_1 + mass_2,
              force_x = (mass_1 * mass_2) / (distance) * .02 * (distance_x / distance),
              force_y = (mass_1 * mass_2) / (distance) * .02 * (distance_y / distance);

          // Spring
          if (nodes_linked) {

            if (!$o.tight_springs) {

              spring_x = (Math.abs(force_x / .02) + (K / distance));
              spring_y = (Math.abs(force_y / .02) + (K / distance));
              force_x = -1 * ((Math.abs(distance_x) - spring_x) / 12) * $.fn.mGraph.sign(distance_x);
              force_y = -1 * ((Math.abs(distance_y) - spring_y) / 12) * $.fn.mGraph.sign(distance_y);
            } else {

              distance_x = nodeA.x - nodeB.x;
              distance_y = nodeA.y - nodeB.y;

              var total_distance = Math.sqrt(distance_x * distance_x + distance_y * distance_y);

              force_x = Math.round(((nodeA.width + nodeB.width + (K / 4) - total_distance) / 16) / (Math.abs(distance_x) + Math.abs(distance_y)) * distance_x);
              force_y = Math.round(((nodeA.height + nodeB.height + (K / 4) - total_distance) / 16) / (Math.abs(distance_x) + Math.abs(distance_y)) * distance_y);
            }
          } else if (nodeB.orbit == 0) {
            
              distance_x = (nodeA.x - nodeB.x) / nodeA.orbit;
              distance_y = (nodeA.y - nodeB.y) / nodeA.orbit;

              var total_distance = Math.sqrt(distance_x * distance_x + distance_y * distance_y);

              force_x = Math.round(((nodeA.width + nodeB.width + (K / 4) - total_distance) / 16) / (Math.abs(distance_x) + Math.abs(distance_y)) * distance_x);
              force_y = Math.round(((nodeA.height + nodeB.height + (K / 4) - total_distance) / 16) / (Math.abs(distance_x) + Math.abs(distance_y)) * distance_y);
          }

          // Overlap
          var overlap = ((nodeA.top < nodeB.bottom && nodeA.top > nodeB.top)? 1: ((nodeA.bottom > nodeB.top && nodeA.bottom < nodeB.bottom)? 4: 0));
          overlap += ((nodeA.right > nodeB.left && nodeA.right < nodeB.right)? 2: ((nodeA.left < nodeB.right && nodeA.left > nodeB.left)? 8: 0));

          if (overlap == 3 || overlap == 5 || overlap == 9 || overlap == 11) force_y -= (((nodeB.height + nodeA.height) / 32) * ((nodeB.y - nodeA.y) / Math.abs(nodeB.y - nodeA.y)));
          if (overlap == 3 || overlap == 6 || overlap == 9 || overlap == 12) force_x -= (((nodeB.width + nodeA.width) / 32) * ((nodeB.x - nodeA.x) / Math.abs(nodeB.x - nodeA.x)));

          if (!nodeA.mouseover && !nodeA.locked) {

            if (isFinite(nodeA.velocity_x + force_x + spring_x)) nodeA.velocity_x += (Math.abs(force_x) > K)? K * (Math.abs(force_x) / force_x): force_x;
            if (isFinite(nodeA.velocity_y + force_y + spring_y)) nodeA.velocity_y += (Math.abs(force_y) > K)? K * (Math.abs(force_y) / force_y): force_y;
          } else if (!nodeB.mouseover && !nodeB.locked) {

            if (isFinite(nodeA.velocity_x + force_x + spring_x)) nodeB.velocity_x -= (Math.abs(force_x) > K)? K * (Math.abs(force_x) / force_x): force_x;
            if (isFinite(nodeA.velocity_y + force_y + spring_y)) nodeB.velocity_y -= (Math.abs(force_y) > K)? K * (Math.abs(force_y) / force_y): force_y;
          }
        }

        if (nodeA.orbit !== 0 && nodeA.orbit !== false) {

          nodeA.velocity_x = Math.floor(nodeA.velocity_x);
          nodeA.velocity_y = Math.floor(nodeA.velocity_y);

          if (nodeA.velocity_x != 0 && $.fn.mGraph.sign(nodeA.velocity_x) != $.fn.mGraph.sign(nodeA.last_velocity_x) && Math.abs(Math.round(nodeA.velocity_x * 100)) == Math.abs(Math.round(nodeA.last_velocity_x * 100))) nodeA.velocity_x = 0;
          if (nodeA.velocity_y != 0 && $.fn.mGraph.sign(nodeA.velocity_y) != $.fn.mGraph.sign(nodeA.last_velocity_y) && Math.abs(Math.round(nodeA.velocity_y * 100)) == Math.abs(Math.round(nodeA.last_velocity_y * 100))) nodeA.velocity_y = 0;

          if (Math.abs(nodeA.velocity_x) > nodeA.width) nodeA.velocity_x = nodeA.width * $.fn.mGraph.sign(nodeA.velocity_x);
          if (Math.abs(nodeA.velocity_y) > nodeA.height) nodeA.velocity_y = nodeA.height * $.fn.mGraph.sign(nodeA.velocity_y);

          if (nodeA.orbit !== -1) {

            nodeA.x += nodeA.velocity_x;
            nodeA.y += nodeA.velocity_y;

            total_move += Math.abs(nodeA.velocity_x) + Math.abs(nodeA.velocity_y);
          }
        } else {

          var left = Math.floor(($i.center.x - nodeA.x) / 8),
              top = Math.floor(($i.center.y - nodeA.y) / 8);

          total_move += Math.abs(left) + Math.abs(top);

          if (left == 0 && top == 0) continue;

          for (var i in $o.nodes) {

            var nodeB = $o.nodes[i];

            if (i != id) {

              if (!nodeB.locked && nodeB.orbit !== -1) {

                nodeB.x += Math.floor(left / 2);
                nodeB.y += Math.floor(top / 2);
              }
            } else {

              nodeB.x += left;
              nodeB.y += top;
            }
          }
        }

        if (nodeA.velocity_x) nodeA.last_velocity_x = nodeA.velocity_x;
        if (nodeA.velocity_y) nodeA.last_velocity_y = nodeA.velocity_y;

        nodeA.velocity_x = 0;
        nodeA.velocity_y = 0;
      }
    }

    if (!$i.mode_change_drag) $.fn.mGraph.draw();

//    if (total_move == 0) {
    if (false) { // ToDo: keep firing while in zoommode! Then pause.

      $t.trigger('autosave.mGraph');
      $i.moved_again = false;
    } else {

      $i.moved_again = true;
      $i.timer = setTimeout(function () {
  
        $.fn.mGraph.moveNodes();
        $('.' + $o.old_line_class).remove();
      }, parseInt(1000 / $o.fps));
    }
  };

  $.fn.mGraph.sign = function(n) {

    if (n < 0) return -1;
    if (n > 0) return 1;

    return 0;
  };

  $.fn.mGraph.size = function(o) {

    var s = 0,
        k = 0;

    for (k in o) {

      if (o.hasOwnProperty(k)) s++;
    }

    return s;
  };

  $.fn.mGraph.drag = function () {

    $t.on(mousedown, $.fn.mGraph.startDrag).on(mouseup, $.fn.mGraph.stopDrag).on('wheel mousewheel DOMMouseScroll', $.fn.mGraph.mousewheel).css('cursor', 'move');
    $('head').append('<style type="text/css">div.' + $o.node_class + ' {cursor: pointer;}</style>');

    return false;
  };

  $.fn.mGraph.mousewheel = function (e) {

    e.stopPropagation();
    e.preventDefault();

    var orgEvent = e.originalEvent,
        delta = 0;

    // Old school scrollwheel delta
    if (e.wheelDelta) delta = e.wheelDelta / 120;
    if (e.detail) delta = -e.detail / 3;

    // New school multidimensional scroll (touchpads) deltas
    deltaY = delta;

    // Gecko
    if (orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS)  delta = -delta;

    // Webkit
    if (orgEvent.wheelDeltaY !== undefined ) delta = orgEvent.wheelDeltaY / 120;

  	if (delta < 0) {

    	$.fn.mGraph.zoom(1, true);
  	} else if (delta > 0) {

    	$.fn.mGraph.zoom(-1, true);
    }

    return false;
  };

  $.fn.mGraph.pinchScale = function (e) {

    var current_pinch_size = $.fn.mGraph.pinchSize(e.originalEvent.targetTouches),
        next_increment = $i.pinch_size + $i.pinch_scale,
        next_decrement = $i.pinch_size - $i.pinch_scale;

    if (current_pinch_size > next_increment) {

      $i.pinch_size = next_increment;
      $.fn.mGraph.zoom(1, true);
    } else if (current_pinch_size < next_decrement) {

      $i.pinch_size = next_decrement;
      $.fn.mGraph.zoom(-1, true);
    }

    return false;
  };

  $.fn.mGraph.pinchSize = function (touches) {

    return Math.sqrt(Math.pow(touches[0].pageX - touches[1].pageX, 2) + Math.pow(touches[0].pageY - touches[1].pageY, 2));
  };

  $.fn.mGraph.clearSelection = function () {

    if (document.selection && document.selection.empty) {

      document.selection.empty();
    } else if (window.getSelection) {

      var sel = window.getSelection();

      if (sel && sel.removeAllRanges) sel.removeAllRanges();
    }

    return false;
  };

  $.fn.mGraph.startPinch = function (touches) {

    $i.pinch_size = $.fn.mGraph.pinchSize(touches);
    $i.pinch_scale = $i.pinch_size / 50;

    $t.off(mousemove);
    $t.on(mousemove, $.fn.mGraph.pinchScale);
  };

  $.fn.mGraph.startDrag = function (e) {

    var node = e.target
        time = Date.now()
        touches = e.originalEvent.targetTouches || [];

    if ((!$i.is_touch && event.which != 1) || $(node).is('video') || $(node).hasClass($o.no_drag_class) || touches.length > 2 || $(node).closest('a')[0]) return true;

    if (touches.length == 2) {

      $.fn.mGraph.startPinch(touches);
      return false;
    }

    if ($i.is_touch) {

      if (time < $i.first_click + 300) {
        
        $t.trigger('dblclick');
        return false;
      }

      $i.first_click = time;

      e.pageX = touches[0].pageX;
      e.pageY = touches[0].pageY;
    }

    e.preventDefault();

    $i.event_active = true;
    $i.mode_change_drag = false;
    $i.dragging = false;

    $i.offset.x = e.pageX;
    $i.offset.y = e.pageY;

    $i.postion.x = $i.center.x;
    $i.postion.y = $i.center.y;

    if ($(node).closest('.' + $o.node_class)[0]) node = $(node).closest('.' + $o.node_class);

    if ($(node).hasClass($o.node_class)) {

      $i.drag = $(node).attr('id');
      $o.nodes[$i.drag].locked = false;
    }

    $(document).css({
      '-webkit-user-select': 'none',
      '-moz-user-select': 'none',
      '-o-user-select': 'none',
      'user-select': 'none'
    }).on('selectstart.mGraph', function() {
      return false;
    });

    $t.on(mousemove, $.fn.mGraph.dragNode);

    return false;
  };

  $.fn.mGraph.dragNode = function (e) {

    var touches = e.originalEvent.targetTouches || [];

    if (touches.length == 2) {

      $.fn.mGraph.startPinch(touches);
      return false;
    }

    if($i.is_touch) {

      e.pageX = touches[0].pageX;
      e.pageY = touches[0].pageY;
    }

    var dx = e.pageX - $i.offset.x,
        dy = e.pageY - $i.offset.y;

    if (dx + dy != 0) {

      $i.offset.x = e.pageX;
      $i.offset.y = e.pageY;

      if ($i.drag && $i.mode == 'edit') {

        var node = e.target;
            e_node = false;

        if ($(node).closest('.' + $o.node_class)[0]) node = $(node).closest('.' + $o.node_class);
        if ($(node).hasClass($o.node_class)) e_node = $(node).attr('id');

        $i.mode_change_drag = true;
        $.fn.mGraph.drawNewLink($i.drag, e_node);
      } else if ($i.drag && $o.nodes[$i.drag].orbit == 0) {

        $i.dragging = true;

        $i.center.x += dx;
        $i.center.y += dy;

        $o.nodes[$i.drag].x += dx;
        $o.nodes[$i.drag].y += dy;
      } else if ($i.drag && $o.nodes[$i.drag].orbit != 0) {

        $i.dragging = true;

        $o.nodes[$i.drag].x += dx;
        $o.nodes[$i.drag].y += dy;

        if ($o.nodes[$i.drag].orbit > -1) $o.nodes[$i.drag].locked = true;
      } else {

        $i.dragging = true;

        $i.center.x += dx;
        $i.center.y += dy;

        for (var id in $o.nodes) {

          $o.nodes[id].x += dx;
          $o.nodes[id].y += dy;
        }
      }
    }

    return false;
  };

  $.fn.mGraph.stopDrag = function (e) {

    var node = $(e.target);
        e_node = false;

    e.stopPropagation();
    if ((!$i.is_touch && event.which != 1) || node.is('video') || node.hasClass($o.no_drag_class) || $(node).closest('a')[0]) return true;

    if (node.closest('.' + $o.node_class)[0]) node = node.closest('.' + $o.node_class);
    if (node.closest('.' + $o.parent_prefix + $o.line_class)[0]) node = node.closest('.' + $o.parent_prefix + $o.line_class);

    var id = node.attr('id');

    if ($i.drag && $i.mode == 'edit' && $i.mode_change_drag) {

      var nodeA = $o.nodes[$i.drag],
          new_node = {
            text: nodeA.text,
            link_to:'none',
            line_color: false
          };

      if (typeof $o.nodes[id] != 'undefined') {

        if ($o.draw_line_color && nodeA.line_color != $o.draw_line_color) {

          new_node.line_color = $o.draw_line_color;

          for (var l in nodeA.link_to) {
  
            if (typeof nodeA.link_to[l].color != 'undefined' && nodeA.link_to[l].color == $o.draw_line_color) delete nodeA.link_to[l].color
            else if (typeof nodeA.link_to[l].color == 'undefined') nodeA.link_to[l].color = nodeA.line_color;
          }
        }

        new_node.link_to = $o.nodes[id].text;
        $.fn.mGraph.addNode(new_node);
      }

      $('.' + $o.hilight_node_class).removeClass($o.hilight_node_class);    
      $i.mode_change_drag = false;
      $.fn.mGraph.setOrbits($('.' + $o.center_node_class).attr('id'));
      $.fn.mGraph.draw();

    } else if ($i.mode_change_drag) {

      $('.' + $o.hilight_node_class).removeClass($o.hilight_node_class);    
      $.fn.mGraph.draw();
    } else if ($i.drag && $i.mode == 'edit') {

      $('#' + $i.drag).trigger('selected.mGraph')
    } else if (node.hasClass($o.node_class) && !$o.nodes[id].locked && $o.nodes[id].orbit > 0) {

      if (!node.hasClass($o.no_center_node_class) && !node.is('video') && !node.is('img')) {

        $.fn.mGraph.resizeNode(node, 1);
        $.fn.mGraph.triggerNode(node);
      }
    } else if (node.hasClass($o.parent_prefix + $o.line_class)) {

      node.trigger('selected.mGraph')
    } else if (node.hasClass($o.node_class) && $o.nodes[id].orbit == 0 && !$i.dragging) {

      node.trigger('selected.mGraph')
    } else if (node.hasClass($o.node_class) && $o.nodes[id].orbit < 0 && !$i.dragging) {

      node.trigger('selected.mGraph')
    } else if (!$i.dragging) {

      $t.trigger('unselected.mGraph')
    }

    $i.event_active = false;
    $i.drag = false;

    $.fn.mGraph.clearSelection();

    $t.off(mousemove);
    $(document).off('select.mGraph selectstart.mGraph').css({
      '-webkit-user-select': 'text',
      '-moz-user-select': 'text',
      '-o-user-select': 'text',
      'user-select': 'text'
    });

    $t.trigger('autosave.mGraph');

    return false;
  };

  $.fn.mGraph.zoom = function (delta, draw) {

    $o.zoom = Math.min(Math.max($o.zoom + ($o.zoom_step * delta), $o.min_zoom), $o.max_zoom);

    if ($o.zoom_animate &&
       ((delta > 0 && $o.zoom > $o.init_zoom) ||
       (delta < 0 && $o.zoom < $o.init_zoom))) {

        $o.zoom = $o.init_zoom;
    }

    $t.css('font-size', $o.zoom + '%');

    for (var id in $o.nodes) {

      $o.nodes[id].height = $('#' + id).outerHeight();
      $o.nodes[id].width = $('#' + id).outerWidth();
    }

    $t.trigger('zoom.mGraph').trigger('autosave.mGraph');

    if (typeof draw != 'undefined' && draw) $.fn.mGraph.draw();
  };
/*
  // Needs to load befor the DOM is finished being built or will not work.
  // Also IE8 will not work with html5 doctype and the "*" selector need to use the specific node.
  if ($.browser.msie && document.namespaces['v'] == null) {
  
    document.namespaces.add('v', 'urn:schemas-microsoft-com:vml','#default#VML');
    $('head').append('<style>v\\:line{behavior:url(#default#VML);margin:auto;}</style>');
  }
*/
})(jQuery);