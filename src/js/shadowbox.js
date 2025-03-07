/**
 * A media-viewer script for web pages that allows content to be viewed without
 * navigating away from the original linking page.
 *
 * This file is part of Shadowbox.
 *
 * Shadowbox is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option)
 * any later version.
 *
 * Shadowbox is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for
 * more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Shadowbox. If not, see <http://www.gnu.org/licenses/>.
 *
 * @author      Michael J. I. Jackson <mjijackson@gmail.com>
 * @copyright   2007 Michael J. I. Jackson
 * @license     http://www.gnu.org/licenses/lgpl-3.0.txt GNU LGPL 3.0
 * @version     SVN: $Id: shadowbox.js 61 2008-01-29 17:16:56Z mjijackson $
 */

if(typeof Shadowbox == 'undefined'){
    throw 'Unable to load Shadowbox, no base library adapter found.';
}

/**
 * The Shadowbox class. Used to display different media on a web page using a
 * Lightbox-like effect.
 *
 * Useful resources:
 * - http://www.alistapart.com/articles/byebyeembed
 * - http://www.w3.org/TR/html401/struct/objects.html
 * - http://www.dyn-web.com/dhtml/iframes/
 * - http://support.microsoft.com/kb/316992
 * - http://www.apple.com/quicktime/player/specs.html
 * - http://www.howtocreate.co.uk/wrongWithIE/?chapter=navigator.plugins
 *
 * @class       Shadowbox
 * @author      Michael J. I. Jackson <mjijackson@gmail.com>
 * @singleton
 * @todo        Find a way to tell when movies and iframes are loaded
 */
(function(){

    /**
     * Contains the default options for Shadowbox. This object is almost
     * entirely customizable.
     *
     * @property    {Object}        options
     * @private
     */
    var options = {

        // The image to display while loading
        loadingImage:       'wp-content/plugins/shadowbox/images/loading.gif',

        // Enable animations
        animate:            true,

        // The path to flvplayer.swf
        flvPlayer:          'wp-content/plugins/shadowbox/flvplayer.swf',

        // The background color and opacity of the overlay. Note: When viewing
        // movie files on FF Mac, the default background image will be used
        // because that browser has problems displaying movies above layers
        // that aren't 100% opaque
        overlayColor:       '#000',
        overlayOpacity:     0.85,
        overlayBgImage:     'images/overlay-85.png',

        // Automatically play movies
        autoplayMovies:     true,

        // Enable movie controllers on QuickTime and Windows Media players
        showMovieControls:  true,

        // The duration of the resizing animations (in seconds)
        resizeDuration:     0.35,

        // The duration of the overlay fade animation (in seconds)
        fadeDuration:       0.35,

        // Show the navigation controls
        displayNav:         true,

        // Enable continuous galleries. When this is true, users will be able
        // to skip to the first gallery image from the last using next and vice
        // versa.
        continuous:         false,

        // Display the gallery counter
        displayCounter:     true,

        // This option may be either 'default' or 'skip'. The default counter is
        // a simple '1 of 5' message. The skip counter displays a link for each
        // piece in the gallery that enables a user to skip directly to any
        // piece.
        counterType:        'default',

        // The amount of padding to maintain around the viewport edge (in
        // pixels). This only applies when the image is very large and takes up
        // the entire viewport.
        viewportPadding:    20,

        // How to handle images that are too large for the viewport. 'resize'
        // will resize the image while preserving aspect ratio and display it at
        // the smaller resolution. 'drag' will display the image at its native
        // resolution but it will be draggable within the Shadowbox. 'none' will
        // display the image at its native resolution but it may be cropped.
        handleLgImages:     'resize',

        // The initial dimensions of the shadowbox (in pixels)
        initialHeight:      160,
        initialWidth:       320,

        // Enable keyboard control. Note: If you disable the keys, you may want
        // to change the visual styles for the navigation elements that suggest
        // keyboard shortcuts.
        enableKeys:         true,

        // The keys used to control Shadowbox. Note: In order to use these,
        // enableKeys must be true. Also, keys must be separated by a pipe
        // character. Key values or key codes may be used.
        keysClose:          ['c', 'q', 27], // c, q, or esc
        keysNext:           ['n', 39],      // n or right arrow
        keysPrev:           ['p', 37],      // p or left arrow

        // Insert hook functions here that will be fired at various stages in
        // the script execution. The single parameter passed to the function
        // will be a link (DOM) element. In the case of onOpen, it will be the
        // link element that was clicked. In onClose, it will be the link
        // element corresponding to the last gallery piece that was displayed.
        onOpen:             null,
        onFinish:           null,
        onClose:            null,

        // The mode to use when handling unsupported media. May be either
        // 'remove' or 'link'. If it is 'remove', the unsupported gallery item
        // will merely be removed from the gallery. If it is the only item in
        // the gallery, the link will simply be followed. If it is 'link', a
        // link will be provided to the appropriate plugin page in place of the
        // gallery element.
        handleUnsupported:  'link',

        // Skips calling Shadowbox.setup() in init(). This means that it must
        // be called later manually.
        skipSetup:          false,

        // An object containing error message templates and links to browser
        // plugin download pages
        errors:         {

            templates:  {
                single: 'You must install the <a href="{0}">{1}</a> browser plugin to view this content.',
                shared: 'You must install both the <a href="{0}">{1}</a> and <a href="{2}">{3}</a> browser plugins to view this content.',
                either: 'You must install either the <a href="{0}">{1}</a> or the <a href="{2}">{3}</a> browser plugin to view this content.'
            },

            fla:        {
                name:   'Flash',
                url:    'http://www.adobe.com/products/flashplayer/'
            },

            qt:         {
                name:   'QuickTime',
                url:    'http://www.apple.com/quicktime/download/'
            },

            wmp:        {
                name:   'Windows Media Player',
                url:    'http://www.microsoft.com/windows/windowsmedia/'
            },

            f4m:        {
                name:   'Flip4Mac',
                url:    'http://www.flip4mac.com/wmv_download.htm'
            }

        },

        // The HTML to use for Shadowbox. Note: The script depends on most of
        // these elements being present, so don't modify it unless you really
        // know what you're doing.
        skin:           {

            main:       '<div id="shadowbox_overlay"></div>' +
                        '<div id="shadowbox_container">' +
                            '<div id="shadowbox">' +
                                '<div id="shadowbox_title">' +
                                    '<div id="shadowbox_title_inner"></div>' +
                                '</div>' +
                                '<div id="shadowbox_body">' +
                                    '<div id="shadowbox_body_inner"></div>' +
                                    '<div id="shadowbox_loading">' +
                                        '<img src="{loading_img_replace}" alt="loading" />' +
                                        '<span><a href="javascript:Shadowbox.close();">Cancel</a></span>' +
                                    '</div>' +
                                '</div>' +
                                '<div id="shadowbox_toolbar">' +
                                    '<div id="shadowbox_toolbar_inner"></div>' +
                                '</div>' +
                            '</div>' +
                        '</div>',

            counter:    '<div id="shadowbox_counter"></div>',

            nav:        {
                close:  '<div id="shadowbox_nav_close">' +
                            '<a href="javascript:Shadowbox.close();"><span class="shortcut">C</span>lose</a>' +
                        '</div>',
                next:   '<div id="shadowbox_nav_next">' +
                            '<a href="javascript:Shadowbox.next();"><span class="shortcut">N</span>ext</a>' +
                        '</div>',
                prev:   '<div id="shadowbox_nav_previous">' +
                            '<a href="javascript:Shadowbox.previous();"><span class="shortcut">P</span>revious</a>' +
                        '</div>'
            }

        }

    };

    /**
     * Stores the default set of options in case a custom set of options is used
     * on a link-by-link basis so we can restore them later.
     *
     * @property    {Object}    default_options
     * @private
     */
    var default_options = null;

    /**
     * Shorthand for Shadowbox.lib.
     *
     * @property    {Object}        SL
     * @private
     */
    var SL = Shadowbox.lib;

    /**
     * An object containing some regular expressions we'll need later. Compiled
     * up front for speed.
     *
     * @property    {Object}        RE
     * @private
     */
    var RE = {
        resize:         /(img|swf|flv)/, // file types to resize
        swf:            /\.swf\s*$/i, // swf file extension
        flv:            /\.flv\s*$/i, // flv file extension
        domain:         /:\/\/(.*?)[:\/]/, // domain prefix
        rel:            /^shadowbox/i, // rel attribute format
        gallery:        /^shadowbox\[(.*?)\]/i, // rel attribute format for gallery link
        unsupported:    /^unsupported-(\w+)/, // unsupported media type
        param:          /\s*([a-z_]*?)\s*=\s*(.+)\s*/, // rel string parameter
        empty:          /^(?:br|frame|hr|img|input|link|meta|range|spacer|wbr|area|param|col)$/i // elements that don't have children
    };

    /**
     * A cache of options for links that have been set up for use with
     * Shadowbox.
     *
     * @property    {Array}         cache
     * @private
     */
    var cache = [];

    /**
     * An array of pieces currently being viewed. In the case of non-gallery
     * pieces, this will only hold one object.
     *
     * @property    {Array}         current_gallery
     * @private
     */
    var current_gallery = null;

    /**
     * The array index of the current_gallery that is currently being viewed.
     *
     * @property    {Number}        current
     * @private
     */
    var current = null;

    /**
     * Keeps track of the current optimal height of the box. We use this so that
     * if the user resizes the browser window to get a better view, and we're
     * currently at a size smaller than the optimal, we can resize easily.
     *
     * @see         resizeContent()
     * @property    {Number}        optimal_height
     * @private
     */
    var optimal_height = options.initialHeight;

    /**
     * Keeps track of the current optimal width of the box. See optimal_height
     * explanation (above).
     *
     * @property    {Number}        optimal_width
     * @private
     */
    var optimal_width = options.initialWidth;

    /**
     * Keeps track of the current height of the box. This is useful in drag
     * calculations.
     *
     * @property    {Number}        current_height
     * @private
     */
    var current_height = 0;

    /**
     * Keeps track of the current width of the box. Useful in drag calculations.
     *
     * @property    {Number}        current_width
     * @private
     */
    var current_width = 0;

    /**
     * Resource used to preload images. It's class-level so that when a new
     * image is requested, the same resource can be reassigned, cancelling
     * the original's callback.
     *
     * @property    {HTMLElement}   preloader
     * @private
     */
    var preloader = null;

    /**
     * Keeps track of whether or not Shadowbox has been initialized. We never
     * want to initialize twice.
     *
     * @property    {Boolean}       initialized
     * @private
     */
    var initialized = false;

    /**
     * Keeps track of whether or not Shadowbox is activated.
     *
     * @property    {Boolean}       activated
     * @private
     */
    var activated = false;

    /**
     * Keeps track of 4 floating values (x, y, start_x, & start_y) that are used
     * in the drag calculations.
     *
     * @property    {Object}        drag
     * @private
     */
    var drag = null;

    /**
     * Holds the draggable element so we don't have to fetch it every time
     * the mouse moves.
     *
     * @property    {HTMLElement}   draggable
     * @private
     */
    var draggable = null;

    /**
     * Keeps track of whether or not we're currently using the overlay
     * background image to display the current gallery. We do this because we
     * use different methods for fading the overlay in and out. The color fill
     * overlay fades in and out nicely, but the image overlay stutters. By
     * keeping track of the type of overlay in use, we don't have to check again
     * what type of overlay we're using when it's time to get rid of it later.
     *
     * @property    {Boolean}       overlay_img_needed
     * @private
     */
    var overlay_img_needed = null;

    /**
     * These parameters for simple browser detection. Used in Ext.js.
     *
     * @ignore
     */
    var ua = navigator.userAgent.toLowerCase();
    var isStrict = document.compatMode == 'CSS1Compat',
        isOpera = ua.indexOf("opera") > -1,
        isIE = ua.indexOf('msie') > -1,
        isIE7 = ua.indexOf('msie 7') > -1,
        isBorderBox = isIE && !isStrict,
        isSafari = (/webkit|khtml/).test(ua),
        isSafari3 = isSafari && !!(document.evaluate),
        isGecko = !isSafari && ua.indexOf('gecko') > -1,
        isWindows = (ua.indexOf('windows') != -1 || ua.indexOf('win32') != -1),
        isMac = (ua.indexOf('macintosh') != -1 || ua.indexOf('mac os x') != -1),
        isLinux = (ua.indexOf('linux') != -1);

    /**
     * Do we need to hack the position to make Shadowbox appear fixed? We could
     * hack this using CSS, but let's just get over all the hacks and let IE6
     * users get what they deserve! Down with hacks! Hmm...now that I think
     * about it, I should just flash all kinds of alerts and annoying popups on
     * their screens, and then redirect them to some foreign spyware site that
     * will upload a nasty virus...
     *
     * @property    {Boolean}   absolute_pos
     * @private
     */
    var absolute_pos = isIE && !isIE7;

    /**
     * Contains plugin support information. Each property of this object is a
     * boolean indicating whether that plugin is supported.
     *
     * - fla: Flash player
     * - qt: QuickTime player
     * - wmp: Windows Media player
     * - f4m: Flip4Mac plugin
     *
     * @property    {Object}    plugins
     * @private
     */
    var plugins = null;

    // detect plugin support
    if(navigator.plugins && navigator.plugins.length){
        var detectPlugin = function(plugin_name){
            var detected = false;
            for (var i = 0, len = navigator.plugins.length; i < len; ++i){
                if(navigator.plugins[i].name.indexOf(plugin_name) > -1){
                    detected = true;
                    break;
                }
            }
            return detected;
        };
        var f4m = detectPlugin('Flip4Mac');
        var plugins = {
            fla:    detectPlugin('Shockwave Flash'),
            qt:     detectPlugin('QuickTime'),
            wmp:    !f4m && detectPlugin('Windows Media'), // if it's Flip4Mac, it's not really WMP
            f4m:    f4m
        };
    }else{
        var detectPlugin = function(plugin_name){
            var detected = false;
            try {
                var axo = new ActiveXObject(plugin_name);
                if(axo){
                    detected = true;
                }
            } catch (e) {}
            return detected;
        };
        var plugins = {
            fla:    detectPlugin('ShockwaveFlash.ShockwaveFlash'),
            qt:     detectPlugin('QuickTime.QuickTime'),
            wmp:    detectPlugin('wmplayer.ocx'),
            f4m:    false
        };
    }

    /**
     * Applies all properties of ext to orig.
     *
     * @param   {Object}    orig        The original object
     * @param   {Object}    ext         The extension object
     * @return  {Object}                The original object with all properties
     *                                  of the extension object applied
     * @private
     */
    var apply = function(orig, ext){
        for(var p in ext) orig[p] = ext[p];
        return orig;
    };

    /**
     * Gets the height of the viewport in pixels. Note: This function includes
     * scrollbars in Safari 3.
     *
     * @return  {Number}        The height of the viewport
     * @private
     */
     var getViewportHeight = function(){
         var height = window.innerHeight; // Safari
         var mode = document.compatMode;
         if((mode || isIE) && !isOpera){
             height = isStrict ? document.documentElement.clientHeight : document.body.clientHeight;
         }
         return height;
     };

    /**
     * Gets the width of the viewport in pixels. Note: This function includes
     * scrollbars in Safari 3.
     *
     * @return  {Number}        The width of the viewport
     * @private
     */
     var getViewportWidth = function(){
         var width = window.innerWidth;  // Safari
         var mode = document.compatMode;
         if(mode || isIE){
             width = isStrict ? document.documentElement.clientWidth : document.body.clientWidth;
         }
         return width;
     };

    /**
     * Gets the height of the document (body and its margins) in pixels.
     *
     * @return  {Number}        The height of the document
     * @private
     */
    var getDocumentHeight = function(){
        var scrollHeight = isStrict ? document.documentElement.scrollHeight : document.body.scrollHeight;
        return Math.max(scrollHeight, getViewportHeight());
    };

    /**
     * Gets the width of the document (body and its margins) in pixels.
     *
     * @return  {Number}        The width of the document
     * @private
     */
    var getDocumentWidth = function(){
        var scrollWidth = isStrict ? document.documentElement.scrollWidth : document.body.scrollWidth;
        return Math.max(scrollWidth, getViewportWidth());
    };

    /**
     * A utility function used by the fade functions to clear the opacity
     * style setting of the given element. Required in some cases for IE.
     * Based on Ext.Element's clearOpacity.
     *
     * @param   {HTMLElement}   el      The DOM element
     * @return  void
     * @private
     */
    var clearOpacity = function(el){
        if(isIE){
            if(typeof el.style.filter == 'string' && (/alpha/i).test(el.style.filter)){
                el.style.filter = '';
            }
        }else{
            el.style.opacity = '';
            el.style['-moz-opacity'] = '';
            el.style['-khtml-opacity'] = '';
        }
    };

    /**
     * Fades the given element from 0 to the specified opacity.
     *
     * @param   {HTMLElement}   el              The DOM element to fade
     * @param   {Number}        endingOpacity   The final opacity to animate to
     * @param   {Number}        duration        The duration of the animation
     *                                          (in seconds)
     * @param   {Function}      callback        A callback function to call
     *                                          when the animation completes
     * @return  void
     * @private
     */
    var fadeIn = function(el, endingOpacity, duration, callback){
        if(options.animate){
            SL.setStyle(el, 'opacity', 0);
            el.style.visibility = 'visible';
            SL.animate(el, {
                opacity: { to: endingOpacity }
            }, duration, function(){
                if(endingOpacity == 1) clearOpacity(el);
                if(typeof callback == 'function') callback();
            });
        }else{
            if(endingOpacity == 1){
                clearOpacity(el);
            }else{
                SL.setStyle(el, 'opacity', endingOpacity);
            }
            el.style.visibility = 'visible';
            if(typeof callback == 'function') callback();
        }
    };

    /**
     * Fades the given element from its current opacity to 0.
     *
     * @param   {HTMLElement}   el          The DOM element to fade
     * @param   {Number}        duration    The duration of the fade animation
     * @param   {Function}      callback    A callback function to call when
     *                                      the animation completes
     * @return  void
     * @private
     */
    var fadeOut = function(el, duration, callback){
        var cb = function(){
            el.style.visibility = 'hidden';
            clearOpacity(el);
            if(typeof callback == 'function') callback();
        };
        if(options.animate){
            SL.animate(el, {
                opacity: { to: 0 }
            }, duration, cb);
        }else{
            cb();
        }
    };

    /**
     * Appends an HTML fragment to the given element.
     *
     * @param   {String/HTMLElement}    el      The element to append to
     * @param   {String}                html    The HTML fragment to use
     * @return  {HTMLElement}                   The newly appended element
     * @private
     */
    var appendHTML = function(el, html){
        el = SL.get(el);
        if(el.insertAdjacentHTML){
            el.insertAdjacentHTML('BeforeEnd', html);
            return el.lastChild;
        }
        if(el.lastChild){
            var range = el.ownerDocument.createRange();
            range.setStartAfter(el.lastChild);
            var frag = range.createContextualFragment(html);
            el.appendChild(frag);
            return el.lastChild;
        }else{
            el.innerHTML = html;
            return el.lastChild;
        }
    };

    /**
     * Overwrites the HTML of the given element.
     *
     * @param   {String/HTMLElement}    el      The element to overwrite
     * @param   {String}                html    The new HTML to use
     * @return  {HTMLElement}                   The new firstChild element
     * @private
     */
    var overwriteHTML = function(el, html){
        el = SL.get(el);
        el.innerHTML = html;
        return el.firstChild;
    };

    /**
     * Gets either the offsetHeight or the height of the given element plus
     * padding and borders (when offsetHeight is not available). Based on
     * Ext.Element's getComputedHeight.
     *
     * @return  {Number}            The computed height of the element
     * @private
     */
    var getComputedHeight = function(el){
        var h = Math.max(el.offsetHeight, el.clientHeight);
        if(!h){
            h = parseInt(SL.getStyle(el, 'height'), 10) || 0;
            if(!isBorderBox){
                h += parseInt(SL.getStyle(el, 'padding-top'), 10)
                    + parseInt(SL.getStyle(el, 'padding-bottom'), 10)
                    + parseInt(SL.getStyle(el, 'border-top-width'), 10)
                    + parseInt(SL.getStyle(el, 'border-bottom-width'), 10);
            }
        }
        return h;
    };

    /**
     * Gets either the offsetWidth or the width of the given element plus
     * padding and borders (when offsetWidth is not available). Based on
     * Ext.Element's getComputedWidth.
     *
     * @return  {Number}            The computed width of the element
     * @private
     */
    var getComputedWidth = function(el){
        var w = Math.max(el.offsetWidth, el.clientWidth);
        if(!w){
            w = parseInt(SL.getStyle(el, 'width'), 10) || 0;
            if(!isBorderBox){
                w += parseInt(SL.getStyle(el, 'padding-left'), 10)
                    + parseInt(SL.getStyle(el, 'padding-right'), 10)
                    + parseInt(SL.getStyle(el, 'border-left-width'), 10)
                    + parseInt(SL.getStyle(el, 'border-right-width'), 10);
            }
        }
        return w;
    };

    /**
     * Determines the player needed to display the file at the given URL. If
     * the file type is not supported, the return value will be 'unsupported-*'
     * where * will be the player abbreviation.
     *
     * @param   {String}        url     The url of the file
     * @return  {String}                The name of the player to use
     * @private
     */
    var getPlayerType = function(url){
        if(RE.img.test(url)){
            return 'img';
        }
        var this_domain = (domain_match = url.match(RE.domain))
            ? (document.domain == domain_match[1])
            : false;
        var q_index = url.indexOf('?');
        if(q_index > -1){
            url = url.substring(0, q_index);
        }
        if(RE.swf.test(url)){
            return (plugins.fla) ? 'swf' : 'unsupported-swf';
        }else if(RE.flv.test(url)){
            return (plugins.fla) ? 'flv' : 'unsupported-flv';
        }else if(RE.qt.test(url)){
            return (plugins.qt) ? 'qt' : 'unsupported-qt';
        }else if(RE.wmp.test(url)){
            if(plugins.wmp){
                return 'wmp';
            }else if(plugins.f4m){
                return 'qt';
            }else{
                if(isMac){
                    return (plugins.qt ? 'unsupported-f4m' : 'unsupported-qtf4m');
                }
                return 'unsupported-wmp';
            }
        }else if(RE.qtwmp.test(url)){
            if(plugins.qt){
                return 'qt';
            }else if(plugins.wmp){
                return 'wmp';
            }else{
                return (isMac) ? 'unsupported-qt' : 'unsupported-qtwmp';
            }
        }else if(!this_domain || RE.iframe.test(url)){
            return 'iframe';
        }
        return 'unsupported';
    };

    /**
     * Gets an array of information regarding the gallery for the given link
     * element. The first element of this array will itself be an array of link
     * objects that share the same gallery as the given link. The second element
     * of the returned array will be the index in the first array of the given
     * link element. This represents the starting point of the gallery.
     *
     * @param   {HTMLElement}   link    The link that was clicked
     * @return  {Array}                 The gallery information as detailed above
     * @private
     */
    var getGallery = function(link){
        var key = link.shadowboxCacheKey;
        var name = cache[key].gallery;
        if(!name){
            return [[cache[key]], 0]; // single item, no gallery
        }else{
            var gallery = [], index;
            for(var i = 0, len = cache.length; i < len; ++i){
                if(key == i){
                    index = gallery.length; // key element found
                    gallery[gallery.length] = cache[i];
                }else if(cache[i].gallery && cache[i].gallery == name){
                    gallery[gallery.length] = cache[i];
                }
            }
            if(index == null) throw 'No Shadowbox cache item with index ' + key;
            return [gallery, index];
        }
    };

    /**
     * Handles all clicks on links that have been set up to work with Shadowbox.
     * Determines if the type of medium is supported. If so, stops the browser
     * from navigating away and opens Shadowbox.
     *
     * @param   {Event}         ev          The click event object
     * @return  void
     * @private
     */
    var handleClick = function(ev){
        // get link (anchor) element
        var link;
        if(typeof this.tagName == 'string' && this.tagName.toUpperCase() == 'A'){
            link = this; // jQuery, Prototype, YUI
        }else{
            link = SL.getTarget(ev); // Ext
            while(link.tagName.toUpperCase() != 'A' && link.parentNode){
                link = link.parentNode;
            }
        }

        // setup the current gallery
        var gallery_info = getGallery(link);
        current_gallery = gallery_info[0];
        current = gallery_info[1];

        // are any media in the current gallery supported?
        var match;
        for(var i = 0; i < current_gallery.length; ++i){
            // handle unsupported elements
            if(match = RE.unsupported.exec(current_gallery[i].type)){
                if(options.handleUnsupported == 'link'){
                    // generate a link to the appropriate plugin download page(s)
                    current_gallery[i].type = 'msg';
                    switch(match[1]){
                        case 'qtwmp':
                            current_gallery[i].message = String.format(
                                options.errors.templates['either'],
                                options.errors['qt'].url,
                                options.errors['qt'].name,
                                options.errors['wmp'].url,
                                options.errors['wmp'].name);
                        break;
                        case 'qtf4m':
                            current_gallery[i].message = String.format(
                                options.errors.templates['shared'],
                                options.errors['qt'].url,
                                options.errors['qt'].name,
                                options.errors['f4m'].url,
                                options.errors['f4m'].name);
                        break;
                        default:
                            if(match[1] == 'swf' || match[1] == 'flv'){
                                match[1] = 'fla';
                            }
                            current_gallery[i].message = String.format(
                                options.errors.templates['single'],
                                options.errors[match[1]].url,
                                options.errors[match[1]].name);
                    }
                }else{
                    // remove the element from the gallery
                    var removed = current_gallery.splice(i, 1);
                    if(i < current) --current;
                    --i;
                }
            }
        }

        // if so, don't follow the link and open Shadowbox
        if(current_gallery.length){
            SL.preventDefault(ev);
            Shadowbox.open(link);
        }
    };

    /**
     * Hides the title bar and toolbar and populates them with the proper
     * content.
     *
     * @return  void
     * @private
     */
    var buildBars = function(){
        var link = current_gallery[current];
        if(!link) return; // nothing to build

        var title_i = SL.get('shadowbox_title_inner');
        var tool_i = SL.get('shadowbox_toolbar_inner');

        // build the title
        title_i.innerHTML = (link.title) ? link.title : '';

        // empty the toolbar
        tool_i.innerHTML = '';

        // build the nav
        if(options.displayNav){
            tool_i.innerHTML = options.skin.nav.close;
            if(current_gallery.length > 1){
                if(options.continuous){
                    // show both
                    appendHTML(tool_i, options.skin.nav.next);
                    appendHTML(tool_i, options.skin.nav.prev);
                }else{
                    // not last in the gallery, show the next link
                    if((current_gallery.length - 1) > current){
                        appendHTML(tool_i, options.skin.nav.next);
                    }
                    // not first in the gallery, show the previous link
                    if(current > 0){
                        appendHTML(tool_i, options.skin.nav.prev);
                    }
                }
            }
        }

        // build the counter
        if(current_gallery.length > 1 && options.displayCounter){
            // append the counter div
            appendHTML(tool_i, options.skin.counter);
            var counter = '';
            if(options.counterType == 'skip'){
                for(var i = 0, len = current_gallery.length; i < len; ++i){
                    counter += '<a href="javascript:Shadowbox.change(' + i + ');"';
                    if(i == current){
                        counter += ' class="shadowbox_counter_current"';
                    }
                    counter += '>' + (i + 1) + '</a>';
                }
            }else{
                counter = (current + 1) + ' of ' + current_gallery.length;
            }
            overwriteHTML('shadowbox_counter', counter);
        }
    };

    /**
     * Hides the title and tool bars.
     *
     * @param   {Function}  callback        A function to call on finish
     * @return  void
     * @private
     */
    var hideBars = function(callback){
        var title_m = getComputedHeight(SL.get('shadowbox_title'));
        var tool_m = 0 - getComputedHeight(SL.get('shadowbox_toolbar'));
        var title_i = SL.get('shadowbox_title_inner');
        var tool_i = SL.get('shadowbox_toolbar_inner');

        if (callback) {
            // animate the transition
            SL.animate(title_i, {
                marginTop: { to: title_m }
            }, 0.2);
            SL.animate(tool_i, {
                marginTop: { to: tool_m }
            }, 0.2, callback);
        } else {
            SL.setStyle(title_i, 'marginTop', title_m + 'px');
            SL.setStyle(tool_i, 'marginTop', tool_m + 'px');
        }
    };

    /**
     * Shows the title and tool bars.
     *
     * @param   {Function}  callback        A callback function to execute after
     *                                      the animation completes
     * @return  void
     * @private
     */
    var showBars = function(callback){
        var title_i = SL.get('shadowbox_title_inner');
        if(options.animate){
            if(title_i.innerHTML != ''){
                SL.animate(title_i, { marginTop: { to: 0 } }, 0.35);
            }
            SL.animate(SL.get('shadowbox_toolbar_inner'), {
                marginTop: { to: 0 }
            }, 0.35, callback);
        }else{
            if(title_i.innerHTML != ''){
                SL.setStyle(title_i, 'margin-top', '0px');
            }
            SL.setStyle(SL.get('shadowbox_toolbar_inner'), 'margin-top', '0px');
            callback();
        }
    };

    /**
     * Resets the class drag variable.
     *
     * @return  void
     * @private
     */
    var resetDrag = function(){
        drag = {
            x:          0,
            y:          0,
            start_x:    null,
            start_y:    null
        };
    };

    /**
     * Toggles the drag function on and off.
     *
     * @param   {Boolean}   on      True to toggle on, false to toggle off
     * @return  void
     * @private
     */
    var toggleDrag = function(on){
        if(on){
            resetDrag();
            // add drag layer to prevent browser dragging of actual image
            var styles = [
                'position:absolute',
                'cursor:' + (isGecko ? '-moz-grab' : 'move')
            ];
            // make drag layer transparent
            styles.push(isIE ? 'background-color:#fff;filter:alpha(opacity=0)' : 'background-color:transparent');
            appendHTML('shadowbox_body_inner', '<div id="shadowbox_drag_layer" style="' + styles.join(';') + '"></div>');
            SL.addEvent(SL.get('shadowbox_drag_layer'), 'mousedown', listenDrag);
        }else{
            var d = SL.get('shadowbox_drag_layer');
            if(d){
                SL.removeEvent(d, 'mousedown', listenDrag);
                SL.remove(d);
            }
        }
    };

    /**
     * Sets up a drag listener on the document. Called when the mouse button is
     * pressed (mousedown).
     *
     * @param   {mixed}     ev      The mousedown event
     * @return  void
     * @private
     */
    var listenDrag = function(ev){
        drag.start_x = ev.clientX;
        drag.start_y = ev.clientY;
        draggable = SL.get('shadowbox_content');
        SL.addEvent(document, 'mousemove', positionDrag);
        SL.addEvent(document, 'mouseup', unlistenDrag);
        if(isGecko) SL.setStyle(SL.get('shadowbox_drag_layer'), 'cursor', '-moz-grabbing');
    };

    /**
     * Removes the drag listener. Called when the mouse button is released
     * (mouseup).
     *
     * @return  void
     * @private
     */
    var unlistenDrag = function(){
        SL.removeEvent(document, 'mousemove', positionDrag);
        SL.removeEvent(document, 'mouseup', unlistenDrag); // clean up
        if(isGecko) SL.setStyle(SL.get('shadowbox_drag_layer'), 'cursor', '-moz-grab');
    };

    /**
     * Positions an oversized image on drag.
     *
     * @param   {mixed}     ev      The drag event
     * @return  void
     * @private
     */
    var positionDrag = function(ev){
        var move_y = ev.clientY - drag.start_y;
        drag.start_y = drag.start_y + move_y;
        drag.y = Math.max(Math.min(0, drag.y + move_y), current_height - optimal_height); // y boundaries
        SL.setStyle(draggable, 'top', drag.y + 'px');
        var move_x = ev.clientX - drag.start_x;
        drag.start_x = drag.start_x + move_x;
        drag.x = Math.max(Math.min(0, drag.x + move_x), current_width - optimal_width); // x boundaries
        SL.setStyle(draggable, 'left', drag.x + 'px');
    };

    /**
     * Removes old content and sets the new content of the Shadowbox.
     *
     * @param   {Object}        obj     The content to set (appropriate to pass
     *                                  directly to Shadowbox.createHTML())
     * @return  {HTMLElement}           The newly appended element (or null if
     *                                  none is provided)
     * @private
     */
    var setContent = function(obj){
        var id = 'shadowbox_content';
        var content = SL.get(id);
        if(content){
            // remove old content first
            switch(content.tagName.toUpperCase()){
                case 'OBJECT':
                    // if we're in a gallery (i.e. changing and there's a new
                    // object) we want the LAST link object
                    var link = current_gallery[(obj ? current - 1 : current)];
                    if(link.type == 'wmp' && isIE){
                        try{
                            shadowbox_content.controls.stop(); // stop the movie
                            shadowbox_content.URL = 'non-existent.wmv'; // force player refresh
                            window.shadowbox_content = function(){}; // remove from window
                        }catch(e){}
                    }else if(link.type == 'qt' && isSafari){
                        try{
                            document.shadowbox_content.Stop(); // stop QT movie
                        }catch(e){}
                        // stop QT audio stream for movies that have not yet loaded
                        content.innerHTML = '';
                        // console.log(document.shadowbox_content);
                    }
                    setTimeout(function(){ // using setTimeout prevents browser crashes with WMP
                        SL.remove(content);
                    }, 10);
                break;
                case 'IFRAME':
                    SL.remove(content);
                    if(isGecko) delete window.frames[id]; // needed for Firefox
                break;
                default:
                    SL.remove(content);
            }
        }
        if(obj){
            if(!obj.id) obj.id = id;
            return appendHTML('shadowbox_body_inner', Shadowbox.createHTML(obj));
        }
        return null;
    };

    /**
     * Loads the Shadowbox with the current piece.
     *
     * @return  void
     * @private
     */
    var loadContent = function(){
        var link = current_gallery[current];
        if(!link) return; // invalid

        buildBars();

        switch(link.type){
            case 'img':
                // preload the image
                preloader = new Image();
                preloader.onload = function(){
                    // images default to image height and width
                    var h = link.height ? parseInt(link.height, 10) : preloader.height;
                    var w = link.width ? parseInt(link.width, 10) : preloader.width;
                    resizeContent(preloader.height, preloader.width, function(dims){
                        showBars(function(){
                            setContent({
                                tag:    'img',
                                height: dims.i_height,
                                width:  dims.i_width,
                                src:    link.href,
                                style:  'position:absolute'
                            });
                            if(dims.enableDrag && options.handleLgImages == 'drag'){
                                // listen for drag
                                toggleDrag(true);
                                SL.setStyle(SL.get('shadowbox_drag_layer'), {
                                    height:     dims.i_height + 'px',
                                    width:      dims.i_width + 'px'
                                });
                            }
                            finishContent();
                        });
                    });

                    preloader.onload = function(){}; // clear onload for IE
                };
                preloader.src = link.href;
            break;

            case 'swf':
            case 'flv':
            case 'qt':
            case 'wmp':
                var markup = Shadowbox.movieMarkup(link);
                resizeContent(markup.height, markup.width, function(){
                    showBars(function(){
                        setContent(markup);
                        finishContent();
                    });
                });
            break;

            case 'iframe':
                // iframes default to full viewport height and width
                var h = link.height ? parseInt(link.height, 10) : getViewportHeight();
                var w = link.width ? parseInt(link.width, 10) : getViewportWidth();
                var content = {
                    tag:            'iframe',
                    name:           'shadowbox_content',
                    height:         '100%',
                    width:          '100%',
                    frameborder:    '0',
                    marginwidth:    '0',
                    marginheight:   '0',
                    scrolling:      'auto'
                };

                resizeContent(h, w, function(dims){
                    showBars(function(){
                        setContent(content);
                        var win = (isIE)
                            ? SL.get('shadowbox_content').contentWindow
                            : window.frames['shadowbox_content'];
                        win.location = link.href;
                        finishContent();
                    });
                });
            break;

            case 'msg':
                // messages display at initial height and width
                var h = options.initialHeight;
                var w = options.initialWidth;
                var content = {
                    tag:    'div',
                    cls:    'shadowbox_message',
                    html:   link.message
                };
                resizeContent(h, w, function(){
                    showBars(function(){
                        setContent(content);
                        finishContent();
                    });
                });
            break;

            case 'unsupported':
                // should never happen because links to unsupported media are
                // removed or taken care of with an error message
                throw 'Content type cannot be determined for ' + link.href;
            break;
        }

        // preload neighboring images
        if(current_gallery.length > 0){
            var next = current_gallery[current + 1];
            if(!next){
                next = current_gallery[0];
            }
            if(next.type == 'img'){
                var preload_next = new Image();
                preload_next.src = next.href;
            }

            var prev = current_gallery[current - 1];
            if(!prev){
                prev = current_gallery[current_gallery.length - 1];
            }
            if(prev.type == 'img'){
                var preload_prev = new Image();
                preload_prev.src = prev.href;
            }
        }
    };

    /**
     * This function is used as the callback after the Shadowbox has been
     * positioned, resized, and loaded with content.
     *
     * @return  void
     * @private
     */
    var finishContent = function(){
        var link = current_gallery[current];
        if(!link) return; // invalid
        hideLoading(function(){
            listenKeyboard(true);
            // fire onFinish hook
            if(options.onFinish && typeof options.onFinish == 'function'){
                options.onFinish(link.el);
            }
        });
    };

    /**
     * Resizes and positions the content box using the given height and width.
     * If the callback parameter is missing, the transition will not be
     * animated. If the callback parameter is present, it will be passed the
     * new calculated dimensions object as its first parameter. Note: the height
     * and width here should represent the optimal height and width of the box.
     *
     * @param   {Function}  callback    A callback function to use when the
     *                                  resize completes
     * @return  void
     * @private
     */
    var resizeContent = function(height, width, callback){
        // update optimal height and width
        optimal_height = height;
        optimal_width = width;
        var resizable = RE.resize.test(current_gallery[current].type);
        var dims = getDimensions(optimal_height, optimal_width, resizable);
        if(callback){
            adjustWidth(dims.width, true, function(){
                adjustHeight(dims.height, dims.top, true, function(){
                    callback(dims);
                });
            });
        }else{ // window resize
            adjustWidth(dims.width, false);
            adjustHeight(dims.height, dims.top, false);
            // resize content images & flash in 'resize' mode
            if(options.handleLgImages == 'resize' && resizable){
                var content = SL.get('shadowbox_content');
                content.height = dims.i_height;
                content.width = dims.i_width;
            }
        }
    };

    /**
     * Calculates the dimensions for Shadowbox, taking into account the borders,
     * margins, and surrounding elements of the shadowbox_body. If the image
     * is still to large for Shadowbox, and options.handleLgImages is 'resize',
     * the resized dimensions will be returned (preserving the original aspect
     * ratio). Otherwise, the originally calculated dimensions will be returned.
     * The returned object will have the following properties:
     *
     * - height: The height to use for shadowbox_body_inner
     * - width: The width to use for shadowbox
     * - i_height: The height to use for resizable content
     * - i_width: The width to use for resizable content
     * - top: The top to use for shadowbox
     * - enableDrag: True if dragging should be enabled (image is oversized)
     *
     * @param   {Number}    o_height    The optimal height
     * @param   {Number}    o_width     The optimal width
     * @param   {Boolean}   resizable   True if the content is able to be
     *                                  resized. Defaults to false.
     * @return  {Object}                The resize dimensions (see above)
     * @private
     */
    var getDimensions = function(o_height, o_width, resizable){
        if(typeof resizable == 'undefined') resizable = false;

        var height = o_height = parseInt(o_height);
        var width = o_width = parseInt(o_width);
        var shadowbox_b = SL.get('shadowbox_body');

        // calculate the max height
        var view_height = getViewportHeight();
        var extra_height = parseInt(SL.getStyle(shadowbox_b, 'border-top-width'), 10)
            + parseInt(SL.getStyle(shadowbox_b, 'border-bottom-width'), 10)
            + parseInt(SL.getStyle(shadowbox_b, 'margin-top'), 10)
            + parseInt(SL.getStyle(shadowbox_b, 'margin-bottom'), 10)
            + getComputedHeight(SL.get('shadowbox_title'))
            + getComputedHeight(SL.get('shadowbox_toolbar'))
            + (2 * options.viewportPadding);
        if((height + extra_height) >= view_height){
            height = view_height - extra_height;
        }

        // calculate the max width
        var view_width = getViewportWidth();
        var extra_body_width = parseInt(SL.getStyle(shadowbox_b, 'border-left-width'), 10)
            + parseInt(SL.getStyle(shadowbox_b, 'border-right-width'), 10)
            + parseInt(SL.getStyle(shadowbox_b, 'margin-left'), 10)
            + parseInt(SL.getStyle(shadowbox_b, 'margin-right'), 10);
        var extra_width = extra_body_width + (2 * options.viewportPadding);
        if((width + extra_width) >= view_width){
            width = view_width - extra_width;
        }

        // handle oversized images & flash
        var enableDrag = false;
        var i_height = o_height;
        var i_width = o_width;
        var handle = options.handleLgImages;
        if(resizable && (handle == 'resize' || handle == 'drag')){
            var change_h = (o_height - height) / o_height;
            var change_w = (o_width - width) / o_width;
            if(handle == 'resize'){
                if(change_h > change_w){
                    width = Math.round((o_width / o_height) * height);
                }else if(change_w > change_h){
                    height = Math.round((o_height / o_width) * width);
                }
                // adjust image height or width accordingly
                i_width = width;
                i_height = height;
            }else{
                // drag on oversized images only
                var link = current_gallery[current];
                if(link) enableDrag = link.type == 'img' && (change_h > 0 || change_w > 0);
            }
        }

        return {
            height: height,
            width: width + extra_body_width,
            i_height: i_height,
            i_width: i_width,
            top: ((view_height - (height + extra_height)) / 2) + options.viewportPadding,
            enableDrag: enableDrag
        };
    };

    /**
     * Centers Shadowbox vertically in the viewport. Needs to be called on
     * scroll in IE6 because it does not support fixed positioning.
     *
     * @return  void
     * @private
     */
    var centerVertically = function(){
        var shadowbox = SL.get('shadowbox');
        var scroll = document.documentElement.scrollTop;
        var s_top = scroll + Math.round((getViewportHeight() - (shadowbox.offsetHeight || 0)) / 2);
        SL.setStyle(shadowbox, 'top', s_top + 'px');
    };

    /**
     * Adjusts the height of shadowbox_body_inner and centers Shadowbox
     * vertically in the viewport.
     *
     * @param   {Number}    height      The height of shadowbox_body_inner
     * @param   {Number}    top         The top of the Shadowbox
     * @param   {Boolean}   animate     True to animate the transition
     * @param   {Function}  callback    A callback to use when the animation completes
     * @return  void
     * @private
     */
    var adjustHeight = function(height, top, animate, callback){
        height = parseInt(height);

        // update current_height
        current_height = height;

        // adjust the height
        var sbi = SL.get('shadowbox_body_inner');
        if(animate && options.animate){
            SL.animate(sbi, {
                height: { to: height }
            }, options.resizeDuration, callback);
        }else{
            SL.setStyle(sbi, 'height', height + 'px');
            if(typeof callback == 'function') callback();
        }

        // manually adjust the top because we're using fixed positioning in IE6
        if(absolute_pos){
            // listen for scroll so we can adjust
            centerVertically();
            SL.addEvent(window, 'scroll', centerVertically);

            // add scroll to top
            top += document.documentElement.scrollTop;
        }

        // adjust the top
        var shadowbox = SL.get('shadowbox');
        if(animate && options.animate){
            SL.animate(shadowbox, {
                top: { to: top }
            }, options.resizeDuration);
        }else{
            SL.setStyle(shadowbox, 'top', top + 'px');
        }
    };

    /**
     * Adjusts the width of shadowbox.
     *
     * @param   {Number}    width       The width to use
     * @param   {Boolean}   animate     True to animate the transition
     * @param   {Function}  callback    A callback to use when the animation completes
     * @return  void
     * @private
     */
    var adjustWidth = function(width, animate, callback){
        width = parseInt(width);

        // update current_width
        current_width = width;

        var shadowbox = SL.get('shadowbox');
        if(animate && options.animate){
            SL.animate(shadowbox, {
                width: { to: width }
            }, options.resizeDuration, callback);
        }else{
            SL.setStyle(shadowbox, 'width', width + 'px');
            if(typeof callback == 'function') callback();
        }
    };

    /**
     * Sets up a listener on the document for keystrokes.
     *
     * @param   {Boolean}   on      True to enable the listner, false to turn
     *                              it off
     * @return  void
     * @private
     */
    var listenKeyboard = function(on){
        if(!options.enableKeys) return;
        if(on){
            document.onkeydown = handleKey;
        }else{
            document.onkeydown = '';
        }
    };

    /**
     * Asserts the given key or code is present in the array of valid keys.
     *
     * @param   {Array}     valid       An array of valid keys and codes
     * @param   {String}    key         The character that was pressed
     * @param   {Number}    code        The key code that was pressed
     * @return  {Boolean}               True if the key is valid
     * @private
     */
    var assertKey = function(valid, key, code){
        return (valid.indexOf(key) != -1 || valid.indexOf(code) != -1);
    };

    /**
     * A listener function that will act on a key pressed.
     *
     * @param   {Event}     e       The event object
     * @return  void
     * @private
     */
    var handleKey = function(e){
        var code = e ? e.which : event.keyCode;
        var key = String.fromCharCode(code).toLowerCase();
        if(assertKey(options.keysClose, key, code)){
            Shadowbox.close();
        }else if(assertKey(options.keysPrev, key, code)){
            Shadowbox.previous();
        }else if(assertKey(options.keysNext, key, code)){
            Shadowbox.next();
        }
    };

    /**
     * Shows and hides elements that are troublesome for modal overlays.
     *
     * @param   {Boolean}   on      True to show the elements, false otherwise
     * @return  void
     * @private
     */
    var toggleTroubleElements = function(on){
        var vis = (on ? 'visible' : 'hidden');
        var selects = document.getElementsByTagName('select');
        for(i = 0, len = selects.length; i < len; ++i){
            selects[i].style.visibility = vis;
        }
        var objects = document.getElementsByTagName('object');
        for(i = 0, len = objects.length; i < len; ++i){
            objects[i].style.visibility = vis;
        }
        var embeds = document.getElementsByTagName('embed');
        for(i = 0, len = embeds.length; i < len; ++i){
            embeds[i].style.visibility = vis;
        }
    };

    /**
     * Fills the Shadowbox with the loading skin.
     *
     * @return  void
     * @private
     */
    var showLoading = function(){
        SL.get('shadowbox_loading').style.visibility = 'visible';
    };

    /**
     * Hides the Shadowbox loading skin.
     *
     * @param   {Function}  callback        The callback function to call after
     *                                      hiding the loading skin
     * @return  void
     * @private
     */
    var hideLoading = function(callback){
        var content = current_gallery[current];
        var anim = (content.type == 'img'); // fade on images
        var loading = SL.get('shadowbox_loading');
        if(anim){
            fadeOut(loading, 0.35, callback);
        }else{
            loading.style.visibility = 'hidden';
            callback();
        }
    };

    /**
     * Sets the size of the overlay to the size of the document.
     *
     * @return  void
     * @private
     */
    var resizeOverlay = function(){
        var overlay = SL.get('shadowbox_overlay');
        SL.setStyle(overlay, {
            height: '100%',
            width: '100%'
        });
        SL.setStyle(overlay, 'height', getDocumentHeight() + 'px');
        if(!isSafari3){
            // Safari3 includes vertical scrollbar in getDocumentWidth()!
            // Leave overlay width at 100% for now...
            SL.setStyle(overlay, 'width', getDocumentWidth() + 'px');
        }
    };

    /**
     * Used to determine if the pre-made overlay background image is needed
     * instead of using the trasparent background overlay. A pre-made background
     * image is used for all but image pieces in FF Mac because it has problems
     * displaying correctly if the background layer is not 100% opaque. When
     * displaying a gallery, if any piece in the gallery meets these criteria,
     * the pre-made background image will be used.
     *
     * @return  Boolean
     * @private
     */
    var checkOverlayImgNeeded = function(){
        if(!(isGecko && isMac)) return false;
        var type;
        for(var i = 0, len = current_gallery.length; i < len; ++i){
            type = current_gallery[i].type;
            if(type != 'img' && type != 'msg') return true;
        }
        return false;
    };

    /**
     * Activates (or deactivates) the Shadowbox overlay. If a callback function
     * is provided, we know we're activating. Otherwise, deactivate the overlay.
     *
     * @param   {Function}  callback    A callback to call after activation
     * @return  void
     * @private
     */
    var toggleOverlay = function(callback){
        var overlay = SL.get('shadowbox_overlay');
        if(overlay_img_needed == null){
            overlay_img_needed = checkOverlayImgNeeded();
        }

        if(callback){
            resizeOverlay(); // size the overlay before showing
            if(overlay_img_needed){
                SL.setStyle(overlay, {
                    visibility:         'visible',
                    backgroundColor:    'transparent',
                    backgroundImage:    'url(' + options.overlayBgImage + ')',
                    backgroundRepeat:   'repeat',
                    opacity:            1
                });
                callback();
            }else{
                SL.setStyle(overlay, {
                    visibility:         'visible',
                    backgroundColor:    options.overlayColor,
                    backgroundImage:    'none'
                });
                fadeIn(overlay, options.overlayOpacity, options.fadeDuration,
                    callback);
            }
        }else{
            if(overlay_img_needed){
                SL.setStyle(overlay, 'visibility', 'hidden');
            }else{
                fadeOut(overlay, options.fadeDuration);
            }

            // reset for next time
            overlay_img_needed = null;
        }
    };

    /**
     * An object containing arrays of all supported file extensions. Each
     * property of this object contains an array. If this object is to be
     * modified, it must be done before calling setup().
     *
     * - img: Supported image file extensions
     * - qt: Movie file extensions supported by QuickTime
     * - wmp: Movie file extensions supported by Windows Media Player
     * - qtwmp: Movie file extensions supported by both QuickTime and Windows Media Player
     * - iframe: File extensions that will be display in an iframe
     *
     * @property    {Object}    EXTENSIONS
     * @public
     */
    Shadowbox.EXTENSIONS = {
        img:        ['png', 'jpg', 'jpeg', 'gif', 'bmp'],
        qt:         ['dv', 'mov', 'moov', 'movie', 'mp4'],
        wmp:        ['asf', 'wm', 'wmv'],
        qtwmp:      ['avi', 'mpg', 'mpeg'],
        iframe:     ['asp', 'aspx', 'cgi', 'cfm', 'htm', 'html', 'pl', 'php',
                    'php3', 'php4', 'php5', 'phtml', 'rb', 'rhtml', 'shtml',
                    'txt', 'vbs']
    };

    /**
     * Initializes the Shadowbox environment.
     *
     * @param   {Object}    opts    The default options to use
     * @return  void
     * @public
     */
    Shadowbox.init = function(opts){
        if(initialized) return; // don't initialize twice
        options = apply(options, opts || {});

        // add markup
        options.skin.main = options.skin.main.replace(/\{loading_img_replace\}/,
            options.loadingImage);
        appendHTML(document.body, options.skin.main);

        // handle window resize events
        var id = null;
        var resize = function(){
            clearInterval(id);
            id = null;
            resizeOverlay();
            resizeContent(optimal_height, optimal_width);
        };
        SL.addEvent(window, 'resize', function(){
            if(activated){
                // use event buffering to prevent jerky window resizing
                if(id){
                    clearInterval(id);
                    id = null;
                }
                if(!id) id = setInterval(resize, 50);
            }
        });

        // add a listener to the overlay
        SL.addEvent(SL.get('shadowbox_overlay'), 'click', function(){
            Shadowbox.close();
        });

        // adjust some positioning if needed
        if(absolute_pos){
            // give the container absolute positioning
            SL.setStyle(SL.get('shadowbox_container'), 'position', 'absolute');
            // give shadowbox_body "layout"...whatever that is
            SL.setStyle('shadowbox_body', 'zoom', 1);
            // need to listen to the container element because it covers the top
            // half of the page
            SL.addEvent(SL.get('shadowbox_container'), 'click', function(e){
                var target = SL.getTarget(e);
                if(target.id && target.id == 'shadowbox_container') Shadowbox.close();
            });
        }

        // skip setup, will need to be done manually later
        if(!options.skipSetup) Shadowbox.setup();
        initialized = true;
    };

    /**
     * Grabs all relevant anchor elements on the page and sets them up for use
     * with Shadowbox. Note: This method may be used to reset Shadowbox if links
     * on a page change after initialization.
     *
     * @param   {Array}     links       An array (or array-like) list of link
     *                                  elements to set up
     * @param   {Object}    opts        Some options to use for the given links
     * @return  void
     * @public
     */
    Shadowbox.setup = function(links, opts){
        // get links if none specified
        if(!links){
            var links = [];
            var a = document.getElementsByTagName('a'), rel;
            for(var i = 0, len = a.length; i < len; ++i){
                rel = a[i].getAttribute('rel');
                if(rel && RE.rel.test(rel)) links[links.length] = a[i];
            }
        }
        if(!links.length) links = [links]; // one link

        // compile file type regular expressions here for speed
        var SE = Shadowbox.EXTENSIONS;
        RE.img = new RegExp('\.(' + SE.img.join('|') + ')\s*$', 'i');
        RE.qt = new RegExp('\.(' + SE.qt.join('|') + ')\s*$', 'i');
        RE.wmp = new RegExp('\.(' + SE.wmp.join('|') + ')\s*$', 'i');
        RE.qtwmp = new RegExp('\.(' + SE.qtwmp.join('|') + ')\s*$', 'i');
        RE.iframe = new RegExp('\.(' + SE.iframe.join('|') + ')\s*$', 'i');

        var link, key;
        for(var i = 0, len = links.length; i < len; ++i){
            link = links[i];
            if(typeof link.shadowboxCacheKey == 'undefined'){
                // assign cache key expando
                // use integer primitive so no memory leak in IE
                link.shadowboxCacheKey = cache.length;
                SL.addEvent(link, 'click', handleClick); // add listener
            }
            cache[link.shadowboxCacheKey] = this.buildLinkObj(link, opts);
        }
    };

    /**
     * Builds a link object from the original element data. This saves us having
     * to call these same methods over again in different places and ensures
     * consistency. These link objects will be stored in the galleries. Link
     * objects contain (most of) the following keys:
     *
     * - id: the link's id
     * - title: the linked file title
     * - href: the linked file location
     * - type: the linked file type
     * - gallery: the gallery the file belongs to
     * - height: the height of the linked file (only necessary for movies)
     * - width: the width of the linked file (only necessary for movies)
     * - options: custom options to use (optional)
     *
     * @param   {HTMLElement}   link    The link to process
     * @return  {Object}                An object representing the link
     * @public
     */
    Shadowbox.buildLinkObj = function(link, opts){
        var href = link.href; // don't use getAttribute() here
        var o = {
            el:         link,
            title:      link.getAttribute('title'),
            href:       href,
            type:       getPlayerType(href),
            options:    apply({}, opts || {})
        };

        // remove link-level options from top-level options
        var opt, l_opts = ['height', 'width', 'gallery'];
        for(var i = 0, len = l_opts.length; i < len; ++i){
            opt = l_opts[i];
            if(typeof o.options[opt] != 'undefined'){
                o[opt] = o.options[opt];
                delete o.options[opt];
            }
        }

        // HTML options always trump JavaScript options, so do these last
        var rel = link.getAttribute('rel');
        if(rel){
            // extract gallery name from shadowbox[name] format
            var match = rel.match(RE.gallery);
            if(match) o.gallery = escape(match[1]);

            // other parameters
            var params = rel.split(';');
            for(var i = 0, len = params.length; i < len; ++i){
                match = params[i].match(RE.param);
                if(match){
                    if(match[1] == 'options'){
                        eval('o.options = apply(o.options, ' + match[2] + ')');
                    }else{
                        o[match[1]] = match[2];
                    }
                }
            }
        }

        return o;
    };

    /**
     * Activates the Shadowbox.
     *
     * @param   {HTMLElement}   link        The link that was clicked
     * @return  void
     * @public
     */
    Shadowbox.open = function(link){
        if(activated) return; // already open
        activated = true;

        if(default_options){ // revert to default options
            options = default_options;
            default_options = null; // erase for next time
        }
        if(current_gallery[current].options){ // custom options
            default_options = apply({}, options); // store default options
            options = apply(options, current_gallery[current].options);
        }
        // fire onOpen hook
        if(options.onOpen && typeof options.onOpen == 'function'){
            options.onOpen(link);
        }

        // display:block here helps with correct dimension calculations
        SL.setStyle(SL.get('shadowbox'), 'display', 'block');

        toggleTroubleElements(false);
        var dims = getDimensions(options.initialHeight, options.initialWidth);
        adjustHeight(dims.height, dims.top);
        adjustWidth(dims.width);
        hideBars(false);

        // show the overlay and load the content
        toggleOverlay(function(){
            SL.setStyle(SL.get('shadowbox'), 'visibility', 'visible');
            showLoading();
            loadContent();
        });
    };

    /**
     * Changes the view to the picture in the current gallery specified by
     * num.
     *
     * @param   {Number}    num     The gallery index to view
     * @return  void
     * @public
     */
    Shadowbox.change = function(num){
        if(!current_gallery) return; // no current gallery
        if(!current_gallery[num]){ // index does not exist
            if(!options.continuous){
                return;
            }else{
                num = (num < 0) ? (current_gallery.length - 1) : 0; // loop
            }
        }

        // stop listening for drag
        toggleDrag(false);
        // empty the content
        setContent(null);
        // turn this back on when done
        listenKeyboard(false);

        current = num;
        showLoading();
        hideBars(loadContent);
    };

    /**
     * Attempts to forward the gallery to the next image.
     *
     * @return  void
     * @public
     */
    Shadowbox.next = function(){
        this.change(current + 1);
    };

    /**
     * Attempts to rewind the gallery to the previous image.
     *
     * @return  void
     * @public
     */
    Shadowbox.previous = function(){
        this.change(current - 1);
    };

    /**
     * Deactivates the Shadowbox.
     *
     * @return  void
     * @public
     */
    Shadowbox.close = function(){
        if(!activated) return; // already closed

        // stop listening for keys
        listenKeyboard(false);
        // hide
        SL.setStyle(SL.get('shadowbox'), {
            display: 'none',
            visibility: 'hidden'
        });
        // stop listening for scroll on IE
        if(absolute_pos) SL.removeEvent(window, 'scroll', centerVertically);
        // stop listening for drag
        toggleDrag(false);
        // empty the content
        setContent(null);
        // prevent old image requests from loading
        if(preloader){
            preloader.onload = function(){};
            preloader = null;
        }
        // hide the overlay
        toggleOverlay(false);
        // turn on trouble elements
        toggleTroubleElements(true);
        // fire onClose hook
        if(options.onClose && typeof options.onClose == 'function'){
            var link = current_gallery[current];
            if(link) options.onClose(link.el);
        }

        activated = false;
    };

    /**
     * Generates the markup necessary to embed the movie file with the given
     * link element. This markup will be browser-specific. Useful for generating
     * the media test suite.
     *
     * @param   {HTMLElement}   link        The link to the media file
     * @return  {Object}                    The proper markup to use (see above)
     * @public
     */
    Shadowbox.movieMarkup = function(link){
        // movies default to 300x300 pixels
        var h = link.height ? parseInt(link.height, 10) : 300;
        var w = link.width ? parseInt(link.width, 10) : 300;

        var autoplay = options.autoplayMovies;
        var controls = options.showMovieControls;
        if(link.options){
            if(link.options.autoplayMovies != null){
                autoplay = link.options.autoplayMovies;
            }
            if(link.options.showMovieControls != null){
                controls = link.options.showMovieControls;
            }
        }

        var markup = {
            tag:    'object',
            name:   'shadowbox_content'
        };

        switch(link.type){
            case 'swf':
                var dims = getDimensions(h, w, true);
                h = dims.height;
                w = dims.width;
                markup.type = 'application/x-shockwave-flash';
                markup.data = link.href;
                markup.children = [
                    { tag: 'param', name: 'movie', value: link.href }
                ];
            break;
            case 'flv':
                autoplay = autoplay ? 'true' : 'false';
                var showicons = 'false';
                var a = h/w; // aspect ratio
                if(controls){
                    showicons = 'true';
                    h += 20; // height of JW FLV player controller
                }
                var dims = getDimensions(h, h/a, true); // resize
                h = dims.height;
                w = (h-(controls?20:0))/a; // maintain aspect ratio
                var flashvars = [
                    'file=' + link.href,
                    'height=' + h,
                    'width=' + w,
                    'autostart=' + autoplay,
                    'displayheight=' + (h - (controls?20:0)),
                    'showicons=' + showicons,
                    'backcolor=0x000000&amp;frontcolor=0xCCCCCC&amp;lightcolor=0x557722'
                ];
                markup.type = 'application/x-shockwave-flash';
                markup.data = options.flvPlayer;
                markup.children = [
                    { tag: 'param', name: 'movie', value: options.flvPlayer },
                    { tag: 'param', name: 'flashvars', value: flashvars.join('&amp;') },
                    { tag: 'param', name: 'allowfullscreen', value: 'true' }
                ];
            break;
            case 'qt':
                autoplay = autoplay ? 'true' : 'false';
                if(controls){
                    controls = 'true';
                    h += 16; // height of QuickTime controller
                }else{
                    controls = 'false';
                }
                markup.children = [
                    { tag: 'param', name: 'src', value: link.href },
                    { tag: 'param', name: 'scale', value: 'aspect' },
                    { tag: 'param', name: 'controller', value: controls },
                    { tag: 'param', name: 'autoplay', value: autoplay }
                ];
                if(navigator.plugins && navigator.plugins.length){
                    markup.type = 'video/quicktime';
                    markup.data = link.href;
                }else{ // IE
                    markup.classid = 'clsid:02BF25D5-8C17-4B23-BC80-D3488ABDDC6B';
                    markup.codebase = 'http://www.apple.com/qtactivex/qtplugin.cab#version=6,0,2,0';
                }
            break;
            case 'wmp':
                autoplay = autoplay ? 1 : 0;
                markup.children = [
                    { tag: 'param', name: 'autostart', value: autoplay }
                ];
                if(navigator.plugins && navigator.plugins.length){
                    if(controls){
                        controls = 1;
                        h += 45; // height of WMP controller in non-IE
                    }else{
                        controls = 0;
                    }
                    markup.type = 'video/x-ms-wmv';
                    markup.data = link.href;
                    markup.children[markup.children.length] = { tag: 'param', name: 'showcontrols', value: controls };
                }else{ // IE
                    if(controls){
                        controls = 'full';
                        h += 70; // height of WMP controller in IE
                    }else{
                        controls = 'none';
                    }
                    // markup.type = 'application/x-oleobject';
                    markup.classid = 'clsid:6BF52A52-394A-11d3-B153-00C04F79FAA6';
                    markup.children[markup.children.length] = { tag: 'param', name: 'url', value: link.href };
                    markup.children[markup.children.length] = { tag: 'param', name: 'uimode', value: controls };
                }
            break;
        }

        markup.height = h; // new height includes controller
        markup.width = w;

        return markup;
    };

    /**
     * Creates an HTML string from an object representing HTML elements. Based
     * on Ext.DomHelper's createHtml.
     *
     * @param   {Object}    obj     The HTML definition object
     * @return  {String}            An HTML string
     * @public
     */
    Shadowbox.createHTML = function(obj){
        var html = '<' + obj.tag;
        for(var attr in obj){
            if(attr == 'tag' || attr == 'html' || attr == 'children') continue;
            if(attr == 'cls'){
                html += ' class="' + obj['cls'] + '"';
            }else{
                html += ' ' + attr + '="' + obj[attr] + '"';
            }
        }
        if(RE.empty.test(obj.tag)){
            html += '/>\n';
        }else{
            html += '>\n';
            var cn = obj.children;
            if(cn){
                for(var i = 0, len = cn.length; i < len; ++i){
                    html += this.createHTML(cn[i]);
                }
            }
            if(obj.html) html += obj.html;
            html += '</' + obj.tag + '>\n';
        }
        return html;
    };

    /**
     * Gets an object that lists which plugins are supported on this platform.
     * The keys of this object will be:
     *
     * - fla: Adobe Flash Player
     * - qt: QuickTime Player
     * - wmp: Windows Media Player
     * - f4m: Flip4Mac QuickTime Player
     *
     * @return  {Object}        The plugins object
     * @public
     */
    Shadowbox.getPlugins = function(){
        return plugins;
    };

    /**
     * Gets the current options object in use.
     *
     * @return  {Object}        The options object
     * @public
     */
    Shadowbox.getOptions = function(){
        return options;
    };

})();

/**
 * Finds the index of the given object in this array.
 *
 * @param   {mixed}     o   The object to search for
 * @return  {Number}        The index of the given object
 * @public
 */
Array.prototype.indexOf = Array.prototype.indexOf || function(o){
    for (var i = 0, len = this.length; i < len; ++i){
        if(this[i] == o) return i;
    }
    return -1;
};

/**
 * Formats a string with the given parameters. The string for format must have
 * placeholders that correspond to the numerical index of the arguments passed
 * in surrounded by curly braces (e.g. 'Some {0} string {1}').
 *
 * @param   {String}    format      The string to format
 * @param   ...                     The parameters to put inside the string
 * @return  {String}                The string with the specified parameters
 *                                  replaced
 * @public
 * @static
 */
String.format = String.format || function(format){
    var args = Array.prototype.slice.call(arguments, 1);
    return format.replace(/\{(\d+)\}/g, function(m, i){
        return args[i];
    });
};
