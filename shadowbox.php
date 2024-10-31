<?php
/*
Plugin Name: Shadowbox
Plugin URI: http://ilbonzo.org
Description: Questo plugin integra in wordpress le funzionalità di shadowbox di Michael J. I. Jackson.
Author: Matteo Magni
Version: 0.2
Author URI: http://ilbonzo.org 
 */

/* Copyright 2008 Matteo Magni (email: ilbonzo.org@gmail.com)
  This program is free software; you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation; either version 2 of the License, or
   (at your option) any later version.
   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
   GNU General Public License for more details.
      You should have received a copy of the GNU General Public License
   along with this program; if not, write to the Free Software 
   Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA 
 */

function shadowbox_init() {
	$url = get_bloginfo('wpurl');
?>
<!-- WP shadowbox Plugin version 0.2 -->
<link rel="stylesheet" href="<?php echo $url; ?>/wp-content/plugins/shadowbox/src/css/shadowbox.css" type="text/css" media="screen" />

<?php
/* ############################################### MOOTOOLS ########################################### */
?>


<script type="text/javascript" src="<?php echo $url; ?>/wp-content/plugins/shadowbox/src/js/lib/mootools.js"></script>
<script type="text/javascript" src="<?php echo $url; ?>/wp-content/plugins/shadowbox/src/js/adapter/shadowbox-mootools.js"></script>
<script type="text/javascript" src="<?php echo $url; ?>/wp-content/plugins/shadowbox/src/js/shadowbox.js"></script>

<script type="text/javascript">

window.onload = function(){

    Shadowbox.init();

    var flash_els = [
        document.getElementById('flash1'),
        document.getElementById('flash2'),
        document.getElementById('flash3')
    ];

    Shadowbox.setup(flash_els, {
        gallery:        'Flash',
        continuous:     true,
        counterType:    'skip'
    });

};

</script>


<?php
/* ################################# PROTOTYPE #################################### */
/*
<script type="text/javascript" src="<?php echo $url; ?>/wp-content/plugins/shadowbox/src/js/lib/prototype.js"></script>
<script type="text/javascript" src="<?php echo $url; ?>/wp-content/plugins/shadowbox/src/js/lib/scriptaculous/scriptaculous.js?load=effects"></script>
<script type="text/javascript" src="<?php echo $url; ?>/wp-content/plugins/shadowbox/src/js/adapter/shadowbox-prototype.js"></script>
<script type="text/javascript" src="<?php echo $url; ?>/wp-content/plugins/shadowbox/src/js/shadowbox.js"></script>


<script type="text/javascript">

document.observe('dom:loaded', function(){Shadowbox.init();});

</script>

*/?>

<?php
/* ################################# YUI #################################### */
/*
<script type="text/javascript" src="<?php echo $url; ?>/wp-content/plugins/shadowbox/src/js/lib/yui-utilities.js"></script>
<script type="text/javascript" src="<?php echo $url; ?>/wp-content/plugins/shadowbox/src/js/adapter/shadowbox-yui.js"></script>
<script type="text/javascript" src="<?php echo $url; ?>/wp-content/plugins/shadowbox/src/js/shadowbox.js"></script>


<script type="text/javascript">

YAHOO.util.Event.onDOMReady(Shadowbox.init);

</script>

<script type="text/javascript">

window.onload = Shadowbox.init;

</script>

*/
?>

<?php

}

//add Action
add_action('wp_head', 'shadowbox_init');
?>
