(function($){

  $(document).ready(function () {

    var menu_data = {
          main: ["About", "Experience", "Skills", "Contact"],
          skills: ["JavaScript", "HTML5", "CSS", "SQL", "NoSQL", "Ruby", "PHP", "Perl", "Assembler", "Pascal", "C++", "Forth", "LISP", "COBOL", "RGP II"],
          javascript: ["Polymer", "jQuery", "Underscore.js", "Node.js", "METEOR"],
          html5: ["&lt;canvas&gt;", "&lt;audio&gt;", "&lt;svg&gt;", "&lt;video&gt;"],
          css: ["CSS3", "SCSS", "&#123;less&#125;", "CSS Variables"],
          sql: ["MySQL", "PostgreSQL"],
          nosql: ["MongoDB ", "CouchDB"],
          ruby: ["Rails"],
          contact: [
            {
              name: "MapMyRide",
              url: "http://www.mapmyride.com/profile/wshostak/#user_dashboard"
            },
            {
              name: "facebook",
              url: "https://www.facebook.com/wshostak"
            },
            {
              name: "Linkedin",
              url: "https://www.linkedin.com/in/williamshostak/"
            },
            {
              name: "GitHub",
              url: "https://github.com/wshostak"
            },
            {
              name: "Email"
            }
          ],
          experience: [
            {
              name: "MusicXray",
              url: "https://www.musicxray.com/"
            },
            {
              name: "Cerego",
              url: "https://www.cerego.com/"
            },
            {
              name: "iKnow",
              url: "http://iknow.jp/"
            },
            {
              name: "Housing Japan",
              url: "https://housingjapan.com"
            },
            {
              name: "24Stream",
              url: "http://www.24stream.co.jp/"
            },
            {
              name: "Moholy-Nagy",
              url: "http://moholy-nagy.org/"
            }
          ],
          musicxray: ["JavaScript", "HTML5", "CSS", "SQL", "Ruby", "Polymer", "Rails", "jQuery", "Turbolinks"],
          cerego: ["JavaScript", "HTML5", "CSS", "Ruby", "Rails", "jQuery"],
          iknow: ["JavaScript", "HTML5", "CSS", "Ruby", "Rails", "jQuery"],
          housingjapan: ["JavaScript", "HTML5", "CSS", "MySQL", "PHP", "Word Press", "jQuery"],
          "24stream": ["JavaScript", "HTML5", "CSS", "PHP", "MySQL", "PostgreSQL", "jQuery"],
          moholynagy: ["JavaScript", "HTML5", "CSS", "PHP", "MySQL", "Magento"],
          about: [
            {
              name: "MapMyRide",
              url: "http://www.mapmyride.com/profile/wshostak/#user_dashboard"
            },
            {
              name: "facebook",
              url: "https://www.facebook.com/wshostak"
            },
            {
              name: "HypeMachine",
              url: "http://hypem.com/wshostak"
            },
            {
              name: "Google",
              url: "https://www.google.com/webhp?sourceid=chrome-instant&ion=1&espv=2&ie=UTF-8#q=%22William+Shostak%22+-lawyer+-attorney+-law+-directory"
            },
            {
              name: "about.me",
              url: "https://about.me/williamshostak"
            }
          ]
        };
  
    if (!$('#mPageFade')[0]) $('<div>').attr('id', 'mPageFade').prependTo('body');
  
    setTimeout(function () {
        
      $('#mPageFade').fadeOut(1000, function () {
  
        addNodes("node0");
      });

      $.get("images/wscn-logo-full-em.svg", function(svg) {

        var wscn = $('<div>').attr('id', 'wscn').appendTo('body');
  
        wscn.mGraph({
          line_width: 1,
          max_size: 2,
          line_color: '#dddddd',
          max_orbit: 1000,
          center_offset: {x: 0, y: 0},
          nodes: {},
          start_near_center: false,
          transition_speed: 300,
          zoom: 100
        });
    
        $.fn.mGraph.addNode({
          link: false,
          text: "William Shostak - Computer Nerd",
          custom_html: '<div>' + (new XMLSerializer().serializeToString(svg.documentElement)) + '</div>',
          add_class: 'center_node wscn-logo',
          link_to: 'none',
          links_to_center: true,
          start_near_center: true,
          menu: "main",
          type: "text"
        });
      });
    }, 500);
  
    addNodes = function (node_id) {
      
      if (check_if_loaded(node_id)) return false;
  
      var node = $.fn.mGraph.defaults.nodes[node_id],
          menu = node.menu,
          menus = menu_data[menu];

      menus.forEach(function (menu, i) {

        var name = menu.name || menu,
            url = menu.url || '';
        
        setTimeout(function () {
      
          $.fn.mGraph.addNode({
            link: false,
            text: name,
            custom_html: '<menu-nodes url="' + url + '" menu="' + node.menu + '">' + name + '</menu-nodes>',
            link_to: node_id,
            fix_text_width: name,
            menu: name.replace(/[^a-z0-9]/gi, '').toLowerCase(),
            type: "text"
          });
        }, 200 * i);
      });
    };

    submitForm = function() {

      var form = document.getElementById('contact-form');

      if (form.validate()) {
        
        form.submit();
        document.getElementById('contact-dialog').close();
      }

      return false;
    };
  
    check_if_loaded = function (node) {
  
      if (typeof $.fn.mGraph.defaults.nodes[node].loaded != "undefined") return true;
  
      $.fn.mGraph.defaults.nodes[node].loaded = "true";
  
      return false;
    };
  
    $(this).on('selected.mGraph', '.' + $.fn.mGraph.defaults.node_class, function () {
  
      var $t = $(this),
          tags = '',
          node_id = $t.attr('id'),
          val = $.fn.mGraph.defaults.nodes[node_id].text;

      if (val == "Email") {

        document.getElementById('contact-dialog').open();

        return false;
      }

      $('.current_line').removeClass('current_line');
      $('.current_node').removeClass('current_node');
      $('#' + $.fn.mGraph.defaults.parent_prefix + node_id).addClass('current_node');
  
      addNodes(node_id)
    });
  });
})(jQuery);
