<html>
<head>
   <script type="module" src="./index.js"></script>
   <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>
   <script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.3/jquery-ui.min.js"></script>
   <script src="cookies.js"></script>
   <style>
      .heading-table {
         border-collapse: collapse;
         border-spacing: 0;
         width: 100%;
         max-width: 100ch;
      }
      .heading-table caption {
         font-size: 1.1em;
         text-align: left;
         font-weight: bold;
         margin-bottom: 0.5em;
      }
      .heading-table .highlight {
         background: rgba(255, 255, 0, 0.4);
      }
      table, tr, th, td {
         border: thin solid silver;
         text-align: right;
      margin-right: 1em;
      }
      body {
         min-height: 100vh;
         display: grid;
         place-content: center;
      }
   </style>
<?php
// includes
require 'vendor/autoload.php';
use PhpOffice\PhpSpreadsheet\IOFactory;
// initialize
$texts = texts(); // table to translate keywords to texts.
$parsexlsx = parsexlsx();
$data = $parsexlsx['tables'];

$comments = $parsexlsx['tablecomments'];
foreach ($data AS $table=>$rows) // get a flipped version to traverse by html table rows
{
   $flipdata[$table] = flipDiagonally($rows);
}
echo "<script>
let data = ".json_encode($data).";
let flipdata = ".json_encode($flipdata).";
let comments = ".json_encode($comments).";
</script>\n";
?>
</head>

<body>
<h1>VESC Tool Setup Helper</h1>
<p>
   This tool will help you find the key values to configure in VESC Tool, depending on your type of batteries and motor.
</p>
<?php

foreach ($flipdata AS $table=>$fields)
if (substr($table,0,1) != "_") // _sheets are for other purposes
{
   global $texts;
   echo "<table id='$table' class='heading-table'><caption>".totext($table)."</caption>";
   $colgroupset = 0;
   $thset = 0;
   foreach ($fields AS $key=>$val)
   {
      if (!$colgroupset) // use first field to set colgroup cols
      {
         echo "<colgroup><col>";
         $highlightset = 0;
         foreach($val AS $name=>$nameval)
         {
            echo "<col>";
         }
         echo "</colgroup>\n";
         $colgroupset = 1;
      }
      elseif (!$thset) // use second field for name ths
      {
         echo "<thead><tr><th></th>";
         foreach($val AS $name=>$nameval)
         {
            echo "<th>$name</th>";
         }
         echo "</tr></thead><tbody>\n";
         $thset = 1;
      }
      else
      {
         echo "<tr><td title='".htmlentities($texts[$key]['description'])."'>".totext($key)."</td>";
         foreach($val AS $name=>$nameval)
         {
            if (strstr($key, "url"))
            {
               $pu = parse_url($nameval);
               $host = str_replace("www.", "", strtolower($pu['host']));
               $nameval = "<a href='$nameval' target='_blank'>$host</a>";
            }
            echo "<td>$nameval</td>";
         }
         echo "</tr>\n";
      }
   }
   echo "</tbody></table>\n";
}

?>

<p>Serial batteries: <input name="ss" id="ss" class="calc" data-table="batterypacks" data-field="ser" data-calc="data.batterypacks[vars.selected.batterypacks].ser" data-attr="value" value="" /><br/>
Parallel batteries:  <input name="pp" id="pp" class="calc" data-calc="data.batterypacks[vars.selected.batterypacks].par" data-attr="value" value="" / />
</p>

<!--
  <p>TIL: <a href="https://www.matuzo.at/blog/highlighting-columns/" target="_top">https://www.matuzo.at/blog/highlighting-columns/</a></p>
-->


<ul>
<li>/ Start / Setup Motors
<ul>
<li>YES</li>
<li>EUC, x (check) Override, NEXT</li>
<li>Large Outrunner</li>
<li>x Override
<ul>
<li>Max Power Loss: <span class="calc" data-calc="data.motors[vars.selected.motors].maxpowerloss"></span></li>
<li>Openloop ERPM: 1500</li>
<li>Sensorless ERPM: 1500</li>
<li>Motor Poles: 30</li>
</ul>
</li>
</ul>


<p>All battery info from <a href="https://www.nkon.nl/" target="_blank">NKON</a> for consistency.</p>

<?php

if (false) // test array flips
{
   $a['a']['x'] = "ax";
   $a['a']['y'] = "ay";
   $a['a']['z'] = "az";
   $a['a']['z'] = "";
   $a['b']['x'] = "bx";
   $a['b']['y'] = "by";
   //$a['c']['x'] = "";
   echo "<h2>test</h2><pre>".print_r($a, 1)."\n".print_r(flipDiagonally($a),1)."</pre>";   
}
?>

</body>
</html>
<?php
// helper functions
function flipDiagonally($arr) {
   $out = array();
   foreach ($arr as $key => $subarr) {
       foreach ($subarr as $subkey => $subvalue) {
           $out[$subkey][$key] = $subvalue;
       }
   }
   return $out;
}

function texts() 
{
   $toreturn = array();
   $filename = 'texts.csv';
   $handle = fopen($filename, 'r');
   if ($handle) 
   {
       while (($data = fgetcsv($handle)) !== false) 
       {
            $key = $data[0];
            if (!$data[1])
               $data[1] = $data[0];
            $toreturn[$key]['text'] = $data[1];
            $toreturn[$key]['description'] = $data[2];
       }
       fclose($handle);
   }
   else
       echo "Cannot open file: $filename";
   return $toreturn;
}
function totext($abbr)
{
   global $texts;
   $toreturn = $texts[$abbr]['text'];
   if (!$toreturn)
      $toreturn = $abbr;
   return $toreturn;
}

function parsexlsx()
{
    // Specify the path to the XLSX file
    $filePath = 'vesc_config_db.xlsx';
    // Load the XLSX file
    $spreadsheet = IOFactory::load($filePath);
    $tables = []; // Here we will store the data of all sheets
    $tablecomments = []; // Here we will store the comments of all sheets
    foreach ($spreadsheet->getWorksheetIterator() as $worksheet) 
    {
        $worksheetTitle = $worksheet->getTitle();
        $worksheetData = [];
        $highestRow = $worksheet->getHighestRow(); // e.g., 10
        $highestColumnLetter = $worksheet->getHighestColumn(); // e.g., 'F'
        $highestColumn = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($highestColumnLetter);
        // Assuming the first row contains the headers
        $headers = [];
        for ($row = 1; $row <= $highestRow; ++$row) 
        {
            $cellValue = $worksheet->getCellByColumnAndRow(1, $row)->getCalculatedValue();
            $fieldnames[$row] = $cellValue;
        }
        // Start reading data from the 2nd row
        for ($col = 2; $col <= $highestColumn; ++$col) 
        {
            $colData = [];
            for ($row = 1; $row <= $highestRow; ++$row) 
            {
                $cellValue = $worksheet->getCellByColumnAndRow($col, $row)->getCalculatedValue();
                if ($row == 1) // name of this DB entity, use as associative index
                $indexname = $cellValue;
                $fieldname = $fieldnames[$row];
                $colData[$fieldname] = $cellValue;
                $comment = $worksheet->getCommentByColumnAndRow($col, $row)->getText()->getPlainText();
    //            print_r($comment->getText());
                if ($comment)
                    $tablecomments[$worksheetTitle][$indexname][$fieldnames[$row]] =  $comment;
            }
            $worksheetData[$indexname] = $colData;
        }
        $tables[$worksheetTitle] = $worksheetData;
    }
    $toreturn['tables'] = $tables;
    $toreturn['tablecomments'] = $tablecomments;
    return $toreturn;
}
