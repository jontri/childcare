$(function(){

  var $window = $(window),
        $header = $('.main-header'),
        $this   = $(this); // <-----here you can cache your selectors

    $window.on('scroll', function(){
      if($this.scrollTop() > 0 && $window.innerWidth() > 990 ){
        $('.navbar_home').addClass('nav-fix-top');
        $('#rv-main-view').addClass('clear-nav-top');
      }else{
        $('.navbar_home').removeClass('nav-fix-top');
        $('#rv-main-view').removeClass('clear-nav-top');
      }
    }).scroll();

	$(document).on( "click", "#toggle-sidemenu", function(){
		$( ".sidemenu-show" ).toggleClass( "sidemenu-hide" );
		$( ".sidemenu" ).toggleClass( "sidemenu-left-go" );
		$( ".nav-sidemenu-show" ).toggleClass( "sidemenu-hide" );
	});

	$(document).on( "click", "#add-message-btn", function(){
		$( "#option1" ).hide();
		$( "#option2" ).hide();
		$( "#option3" ).hide();
		$( "#add-message" ).show();
	});




  var passToggle = 0;
  var passTogglePop = 0;

  //$(document).on( "hover", "ul.nav li.dropdown", function(){
  //  $('.dropdown-menu').stop(true, true).delay(2000).fadeIn();
  //});

  $(document).on( "click", "#show_pass", function(){
    if(passToggle == 0){
      $(' #pass_login ').attr('type','text');
      $(' #show_pass ').text('Hide Password');
      passToggle = 1;
    }else{
      $(' #pass_login ').attr('type','password');
      $(' #show_pass ').text('Show Password');
      passToggle = 0;
    }
  });

  $(document).on("keydown", "#show_pass, #show_pass_pop, #show_pass_edit, #show_pass_reg", function(e){
    if(e.keyCode == 32) {
      e.preventDefault();
      $(this).trigger("click");
    }
  });

  $(document).on( "click", "#show_pass_pop", function(){
    if(passTogglePop == 0){
      $(' #pass_login_pop ').attr('type','text');
      $(' #show_pass_pop ').text('Hide Password');
      passTogglePop = 1;
    }else{
      $(' #pass_login_pop ').attr('type','password');
      $(' #show_pass_pop ').text('Show Password');
      passTogglePop = 0;
    }
  });

  $(document).on( "click", "#show_pass_edit", function(){
    if(passToggle == 0){
      $(' #pass_edit ').attr('type','text');
      $(' #show_pass_edit ').text('Hide Password');
      passToggle = 1;
    }else{
      $(' #pass_edit ').attr('type','password');
      $(' #show_pass_edit ').text('Show Password');
      passToggle = 0;
    }
  });

  $(document).on( "click", "#show_pass_reg", function(){
    if(passToggle == 0){
      $(' #password ').attr('type','text');
      $(' #conf_password ').attr('type','text');
      $(' #show_pass_reg ').text('Hide Password');
      passToggle = 1;
      return;
    }else{
      $(' #password ').attr('type','password');
      $(' #conf_password ').attr('type','password');
      $(' #show_pass_reg ').text('Show Password');
      passToggle = 0;
      return;
    }
  });

  $(document).on( "click", "#changeStatus", function(){
    localStorage.setItem('advance-daycare-status',1);
    console.log("status changed");
  });
	
});