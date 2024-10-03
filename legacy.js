// legacy. programmed once, but not used anymore...

function rendermenuvalues() // legacy. delete asap. this is not only rendering, but also calculating! already split into calcconfig() and rerender() .
{
   $('.calc').each(function(){
      let a = $(this).attr('data-attr'); // html attribute to change
      let f = $(this).attr('data-formula'); // formula
      let d = $(this).attr('data-default'); // default
      var v;
      if (!f)
         return; // no need to do anything. could have been set to default initially by PHP, or manually in form field
      else
         v = safeEval(f);
      if (consolelog > 1)
         console.logsearch(logsearch, "calc: attr formula value: ", a, f, v);
      if (a && v)
         $(this).attr(a, v);
      else if (v)
         $(this).text(v);
   });
   // This function did some rendering, but also changed some vars parameters, so save vars again. yes, it's an ugly function.....
   if (!nostorage)
      storageset('vars', vars);
}


function renderopenclosetriangles()
{
   // Load the previous selections and visibility states from local storage
   $('.componentdropdown').each(function() {
      var component = $(this).data('component');
      var selectedValue = vars.selected[component];
      var isVisible = localStorage.getItem('selected' + component + 'Visible');
      if (selectedValue) {
            $('#selected' + component).text("You selected: " + selectedValue);
            $(this).val(selectedValue);
      }
      if (isVisible === 'true') {
            $('#selected' + component).show();
            $('[data-toggle="' + component + '"]').css('transform', 'rotate(0deg)'); // Point down when open
      } else {
            $('#selected' + component).hide();
            $('[data-toggle="' + component + '"]').css('transform', 'rotate(-90deg)'); // Point right when closed
      }
   });
   // hide or show component compare tables
   $('.componentcompare').each(function() {
      var component = $(this).data('component');
      var isVisible = localStorage.getItem('compare' + component + 'Visible');
      if (isVisible === 'true') {
            $('#compare' + component).show();
            $('[data-toggle="' + component + '"]').css('transform', 'rotate(0deg)'); // Point down when open
      } else {
            $('#compare' + component).hide();
            $('[data-toggle="' + component + '"]').css('transform', 'rotate(-90deg)'); // Point right when closed
      }
   });
}

