<?php
$defaults['motor']['name'] = "Hypercore";
$defaults['battery']['name'] = "P28A";
$defaults['batterypack']['name'] = "";
$defaults['controller']['name'] = "Little FOCer 3.1";


$instance['battery']['type'] = "";

// placeholders in {} refer to vars in instance
$config['Start']['Setup Motors']['Type'] = "EUC";
$config['Start']['Setup Motors']['Motor'] = "Large Outrunner";
$config['Start']['Setup Motors']['Override']['checked'] = "Yes";
$config['Start']['Setup Motors']['Override']['Max Power Loss'] = "{maxpowerloss}";
$config['Start']['Setup Motors']['Override']['Openloop ERPD'] = "{openlooperpd}";
$config['Start']['Setup Motors']['Override']['Sensorless ERPM'] = "{sensorlesserpm}";
$config['Start']['Setup Motors']['Override']['Motor Poles'] = "{poles}";



