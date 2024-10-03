<?php
extract($_GET);
if ($debug)
{
    error_reporting(E_ALL);
    // Display all errors to the browser
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
}
if (!$version)
    $version = "6.05";
$xmlfiles['app']['file'] = "./vesc_tool-master/res/config/$version/parameters_appconf.xml";
$xmlfiles['app']['wraptag'] = "APPConfiguration";
$xmlfiles['motor']['file'] = "./vesc_tool-master/res/config/$version/parameters_mcconf.xml";
$xmlfiles['motor']['wraptag'] = "APPConfiguration";
$xmlfiles['info']['file'] = "./vesc_tool-master/res/config/$version/info.xml";
$xmlfiles['info']['wraptag'] = "APPConfiguration";
$xmlfiles['float']['file'] = "./vesc_pkg-main/float/float/conf/settings.xml";
$xmlfiles['float']['wraptag'] = "APPConfiguration";
$xmlfiles['tnt']['file'] = "./vesc_pkg-main/tnt/tnt/conf/settings.xml";
$xmlfiles['tnt']['wraptag'] = "APPConfiguration";
$xmlfiles['balance']['file'] = "./vesc_pkg-main/balance/balance/conf/settings.xml";
$xmlfiles['balance']['wraptag'] = "APPConfiguration";
// refloat last, to make sure we overwrite old package parameters with refloat ones...
$xmlfiles['refloat']['file'] = "./vesc_pkg-main/refloat/src/conf/settings.xml";
$xmlfiles['refloat']['wraptag'] = "APPConfiguration";


function tosingular($component)
{
    $singular['batteries'] = "batteries";
    $singular['batterypacks'] = "battery pack";
    if ($singular[$component])
        $toreturn = $singular[$component];
    else
        $toreturn = substr($component, 0, -1);
    return $toreturn;
}

function echoarray($a)
{
   echo "<pre>".print_r($a,1)."</pre>";
}

// manipulate URL, adding and removing parameters. 
// add: querystring or assoc.array of vars to add. 
// rem: csv of params to remove. 
// url: any url to manipulate - defaults to this relative REQUEST_URI .
function manipurl($add, $rem="", $url="") 
{
        $relative = 0;
        if (!$url)
        {
                $url = $_SERVER['REQUEST_URI'];
        }
        if (!substr_count($url,".php")) // is SEF url, rebuild the base url first
        {
                $url = "index.php?".http_build_query(JRequest::get( 'REQUEST' ));
        }
        if (!substr_count($url, "://"))
        {
                $relative = 1; // is a relative url
                if (substr($url,0,1) != "/")
                        $url = "/$url";
                $url = "https://".$GLOBALS['domain'].$url;
        }
//      if (adminlevel()) varlog($url);
        $uarr = parse_url($url);
        extract($uarr);
//      scheme - e.g. http
//      host
//      port
//      user
//      pass
//      path
//      query - after the question mark ?
//      fragment - after the hashmark #
        parse_str($query, $qsa);
        if ($add)
        {
                if (!is_array($add)) // $add is formatted as a query string or json literal. turn into array first.
                {
                        $add = trim($add);
                        $firstchar = substr($add,0,1);
                        if ($firstchar == '[' || $firstchar == '{') // must be a json literal string
                                $add = (array) json_decode($add);
                        else // looks like a querystring
                                parse_str($add, $add);
                }
                foreach($add AS $addvar=>$addval)
                {
                        $qsa[$addvar] = $addval;
                }
        }
        if ($rem)
        {
                if (!is_array($rem)) // $add is format of a query string. turn into array first.
                        $rem = explode(",", $rem);
                foreach($rem AS $remvar)
                {
                        unset($qsa[$remvar]);
                }
        }
        if (sizeof($qsa))
        {
                ksort($qsa);
                $qs = http_build_query($qsa);
        }
        else 
                $qs = "";
        $retrequri = $path;
        if ($qs)
                $retrequri .= "?".$qs;
        if ($relative)
        {
//              if (adminlevel()) varlog($retrequri);
                if (substr($retrequri,0,1) == "/")
                        $retrequri = substr($retrequri, 1);
                $manipurl = playakroute($retrequri);
        }
        else
        {
                $manipurl = "$scheme://$host$retrequri";
        }
        if ($fragment)
                $manipurl .= "#".$fragment;
        return $manipurl;
}

function urlstohtml($urls) // turn list of URLs info short html
{
    $urlarr = explode("\n", $urls."\n");
    $htmlarr = array();
    foreach ($urlarr AS $url)
    if ($url)
    {
       $pu = parse_url($url);
       $host = str_replace("www.", "", strtolower($pu['host']));
       $hostarr = explode(".", $host);
       array_pop($hostarr); // remove TLD
       $host = implode(".", $hostarr);
//       $host = $hostarr[0];
       $htmlarr[] = "<a href='$url' target='_blank' title=''>$host</a>";   
    }
    $toreturn = implode("<br>", $htmlarr);
    return $toreturn;
}