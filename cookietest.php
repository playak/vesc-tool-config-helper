<?php
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Expires: Sat, 26 Jul 1997 05:00:00 GMT");
?><html>
<head>
   <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>
   <script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.3/jquery-ui.min.js"></script>
   <script src="cookies.js"></script>
   <script src="js.storage.js"></script>
<script>
   $(function(){

      console.log("Before init cookie: ", Cookies.get('cookie'));
      $('.setcookie').click(function(){
         Cookies.set('cookie', 'dikkelul');
         console.log(Cookies.get('cookie'));
         showcookie();
      });
      $('.deletecookie').click(function(){
         Cookies.remove('cookie');
         console.log(Cookies.get('cookie'));
         showcookie();
      });
      showcookie();
      console.log("After init cookie: ", Cookies.get('cookie'));

      console.log("Getting non existing var from localstorage: ", storageget('blablabla'));
      let jsondat = { foo: 'bar', baz: 42 };
//      console.log("Before init local: ", StorageJS.get('localstorage'));
      console.log("Before init local: ", storageget('localstorage'));
      $('.setlocal').click(function(){
         storageset('localstorage', jsondat);
         console.log(storageget('localstorage'));
         showlocalstorage();
      });
      $('.deletelocal').click(function(){
         storageremove('localstorage');
         console.log(storageget('localstorage'));
         showlocalstorage();
      });
      showlocalstorage();
      console.log("After init local: ", storageget('localstorage'));
   });

   function showcookie(){
      let cookietext = Cookies.get('cookie');
      if (!cookietext)
         cookietext = "";
      $('#cookiespan').text(cookietext);
   }

   function showlocalstorage(){
      $('#localstoragespan').text(JSON.stringify(storageget('localstorage')));
   }

   function storageget(varname)
   {
      if(!localStorage[varname])
         return null;
      else
         return JSON.parse(localStorage[varname]);
   }
   function storageset(varname, varval)
   {
      localStorage[varname] = JSON.stringify(varval);
   }
   function storageremove(varname)
   {
      localStorage[varname] = JSON.stringify(null);
   }


</script>
</head>

<body>
<h1>cookie tester</h1>
<p class="setcookie">Click here to set cookie.</p>
<p class="deletecookie">Click here to delete cookie.</p>
<p>Cookie: <span id='cookiespan'></span></p>

<h1>localstorage tester</h1>
<p class="setlocal">Click here to set localstorage.</p>
<p class="deletelocal">Click here to delete localstorage.</p>
<p>localstorage: <span id='localstoragespan'></span></p>

