/*
 * Project: VESC Tool Config Helper
 * Version: 0.1.15
 * 
 * Copyright (c) 2024 Jeroen Houttuin
 * Company: SUPzero.ch, Zurich, Switzerland
 * Email: info@supzero.ch
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice, including the original 
 * attribution, shall be included in all copies or substantial portions of the Software.
 * 
 * In addition, all branding, including the logo of SUPzero.ch, may not be removed 
 * or altered in any way in any derivative work or redistribution of this Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

var vars;
if (!nostorage)
   vars = storageget('vars'); // use vars instead of let here
if (!vars)
{
   vars = 
   {
      selected:
      {
         motors: "",
         batterypacks: "",
         batteries: "",
         controllers: "",
         tires: ""
      },
      config:
      {
      }
   };
}
window.vars = vars;

// INIT FUNCTIONS & EVENT TRIGGERS
$(function()
{
   // EVENT HANDLERS that affect calculations
   // Handle dropdown change event for all components
   $('.componentdropdown').change(function() {
      var component = $(this).data('component');
      var selectedValue = $(this).val();
      vars.selected[component] = selectedValue;
      vars[component] = sheetsbycol[component][selectedValue];
      setdependents(component);
      calcconfig();
      if (!nostorage)
         storageset('vars', vars);
      rerender();
   });
   // Handle clicks in html table columns. change vars, store vars, and rerender html
   $('.heading-table td, .heading-table th').click(function(){
      var colnr = $(this).index();
      if (!colnr) // first column (0) is just attribute names
         return;
      var tableclicked = $(this).closest('table');
      let tablename = $(tableclicked).attr('id');
      let selectedname = $(tableclicked).find('th:eq('+colnr+')').text();
      if (vars.selected[tablename] != selectedname)
         vars.selected[tablename] = selectedname;
      else
         vars.selected[tablename] = "";
      vars[tablename] = sheetsbycol[tablename][selectedname];
      setdependents(tablename);
      calcconfig();
      if (!nostorage)
         storageset('vars', vars);
      rerender();
   });
   // Handle typing in text input fields
   $('input.calc').on('input', function() {
      const parameter = $(this).attr('data-parameter');
      vars.config[parameter] = $(this).val();
      calcconfig();
      if (!nostorage)
         storageset('vars', vars);
      rerender();
   });
   // EVENT HANDLERS that dont' affect calculations, rather just about display and download stuff
   // Handle click event for all triangle toggles
   $('.triangle').click(function() {
      var component = $(this).data('toggle');
      var contentDiv = $('#' + component);
      // Toggle the visibility of the content div
      contentDiv.toggle();
      // Check visibility and rotate triangle accordingly
      var isVisible = contentDiv.is(':visible');
      $(this).css('transform', isVisible ? 'rotate(0deg)' : 'rotate(-90deg)'); // Right when collapsed, down when expanded
      // Store the visibility state in local storage
      localStorage.setItem(component + 'Visible', isVisible);
   });
   // Handle xml file download clicks. FFS, as it require darker and deeper calculations, normally donw by VESC tool behind the scenes (at least I think so)
   // <p class="xmldownload" data-wraptag="APPConfiguration" data-xmlfile="config" data-xmlfilename=""config.xml"><a href="">Download App config XML</a></p>
   $('.xmldownload').click(function() {
      var wraptag = $(this).attr("data-wraptag");
      var xmlfile = $(this).attr("data-xmlfile"); // app, motor, float, refloat...
      var xmlfilename = $(this).attr("data-xmlfilename");
      // update the xml config for this variable in configxmls[xmlfile]
      updateconfigxmls(xmlfile);
      const xmlstring = `<?xml version="1.0" encoding="UTF-8"?>\n<${wraptag}>\n${jsonToXml(configxmls[xmlfile])}\n</${wraptag}>`;
      const blob = new Blob([xmlstring], { type: 'application/xml' });   
      $(this).find('a').attr('href', URL.createObjectURL(blob));
      $(this).find('a').attr('download', xmlfilename);
   });
    // Event handler for download spans
    $('.srcdownload').on('click', function () {
      const component = $(this).data('component');  // Get data-component attribute value
      const data = sheetsbyrow[component];  // Fetch the corresponding data from 'sheetsbyrow'
      if (data && typeof data === 'object') {
          srcdownloadExcel(data, component);  // Call the srcdownloadExcel function with data and component as file name
      } else {
          console.error('No valid data available for component:', component);
      }
   });
   handleResetButton();
   // do all calculations on first page load as well
   calcconfig();
   // and rerender after that
   rerender();
});

// CALCULATION FUNCTIONS
function calcconfig() // calculate config variables as defined in the _config sheet
{
   let line;
   let def;
   let evalval;
   for (const i in sheetsbyrow._config) 
   {
      def='';
      line = sheetsbyrow._config[i];
      if (line.parameter)
      {
            evalval = safeEval(line.formula);
            if (!evalval) // get explicit default from our config sheet
            {
               if (line.default != null)
                  evalval = line.default;
               else
               {
                  if ((line.parameter in params) && ('default' in params[line.parameter]))
                        evalval = params[line.parameter]['default'];
               }
               // possibly sanitize the default as well, in case we or VESC Tool wrote something out of type or out of bounds as a default. probably not needed. FFS:
               //   evalval = sanitizeparam(line.parameter, evalval);
            }
            else // we calculated a value. make sure it is or becomes valid for VESC Tool
               evalval = sanitizeparam(line.parameter, evalval);
            vars.config[line.parameter] =  evalval; // now we must have an acceptable default or calculated value
      }
   }
   if (!nostorage)
      storageset('vars', vars);
   if (consolelog)
      console.logsearch(logsearch, vars.config);
}

// if choosing one component implies chossing another one, set that one as well.
function setdependents(component)
{
   for (const param in vars[component])
   {
      if (param.includes('.')) // params with a . point to other components
      {
         const parts = param.split('.');
         const dependentcomponent = parts[0];
         const dependentname = vars[component][param];
         if (dependentcomponent && dependentname)
         {
            vars.selected[dependentcomponent] = dependentname;
            vars[dependentcomponent] = sheetsbycol[dependentcomponent][dependentname];
         }
     }
   }
}

// update the config for varname (motor, float, app, ...), so we can generate a correct XML from configxmls[varname]
function updateconfigxmls(xmlfile) 
{
   var newval;
   for (const param in configxmls[xmlfile])
   {
      // if we calculated this param in our current config, copy if to configxmls[xmlfile], so it will show up in the downloadable XML file
      if (param in vars.config)
      {
         configxmls[xmlfile][param] = vars.config[param];
      }
   }
}

// DISPLAY FUNCTIONS
function rerender()
{
//   renderopenclosetriangles(); // legacy
   highlighttables();
   showselectedcomponents();
   let att;
   let tr;
   let condition;
   // rerender table for config menus
   for (const parameter in vars.config)
   {
      $('[data-parameter="'+parameter+'"]').each(function(){ // needs each(), as a parameter can be on more than one line in the sheet (e.g. hertz or observergain)
         att = $(this).attr("data-attr");
         tr = $(this).closest('tr');
         condition = $(this).attr("data-condition");
         if (att == "value")
            $(this).attr('value', vars.config[parameter]);
         else if (att=="span")
            $(this).text(vars.config[parameter]);
         else if (att=="option")
         {
            $(this).val(vars.config[parameter]);
         }
         if (condition)
         {
            if (safeEval(condition))
               tr.show();
            else
               tr.hide();
         }
      });
   }
   // add an Excel style red triangle for elements with comments in the title attribute
   $('td[title]').addClass('red-triangle');
   $('.tooltip').each(function() {
      if (!$(this).hasClass('tooltipstered')) {
         $(this).tooltipster({
               animation: 'fade',
               distance: 2,
               animationDuration: 800,
               contentAsHTML: true,
               theme: 'tooltipster-punk',
               side: 'bottom'
         });
      }
   });
   $('.triangle').each(function() {
      var component = $(this).data('toggle');
      var contentDiv = $('#' + component);
      var isVisible = localStorage.getItem(component + 'Visible') === 'true'; 
      // Set visibility and triangle rotation based on stored state
      contentDiv.toggle(isVisible);
      $(this).css('transform', isVisible ? 'rotate(0deg)' : 'rotate(-90deg)');
  });
  trmouseovers();
}

// highlight the currently selected colums in html tables
function highlighttables()
{
   for (const table in vars.selected) 
   {
      if (vars.selected.hasOwnProperty(table)) 
      {
         const selected = vars.selected[table];
         $("#"+table).find('col').each(function(){
            var colnr = $(this).index();
            if (selected != $("#"+table).find('th:eq('+colnr+')').text())
            {
               $(this).removeClass('highlight');
            }
            else if (colnr>0) // colnr 0 in the variable names. never highlight that
            {
               // highlight column
               $(this).addClass('highlight');
               // select corresponding dropdown
               $('#select'+table).val(selected);
            }
         });
      }
    }
}
function showselectedcomponents()
{
   $('.componentdropdown').each(function() {
      var component = $(this).data('component');
      if (component in vars)
         $('#selected' + component).html(createTable(component));
   });
}

// HELPER FUNCTIONS

function roundToSignificantDigits(num, digits) // round any number to a similar precision
{
   if (num === 0)
      return 0;
   const scientific = num.toExponential(digits - 1);
   const [coefficient, exponent] = scientific.split('e');
   return Number(`${parseFloat(coefficient)}e${exponent}`);
}

////////////////////////////////////////////////////////////
// simple proprietary supzero functions to use local storage
function storageget(varname)
{
   if(!localStorage[varname])
      return null;
   else
      return JSON.parse(localStorage[varname]);
}; window.storageget = storageget;
function storageset(varname, varval)
{
   localStorage[varname] = JSON.stringify(varval);
}; window.storageset = storageset;
function storageremove(varname)
{
   localStorage[varname] = JSON.stringify(null);
   location.reload(true);
}; window.storageremove = storageremove;

// safeEval - proposed by Chad. eval() replacement that also check for syntax and existence of variables and properties.
function safeEval(formula, logit = 0) {
   // Step 1: Parse the formula into an AST
   let ast;
   try {
       ast = acorn.parse(formula, { ecmaVersion: 2020 });
   } catch (error) {
       if (logit) {
           console.log('Invalid formula syntax', error);
       }
       return 0; // or handle the error as needed
   }
   // Step 2: Traverse the AST and check for variable existence
   function checkNode(node, context = window) {
       switch (node.type) {
           case 'Identifier':
               if (!(node.name in context)) {
                   throw new Error(`Variable ${node.name} is not defined`);
               }
               return context[node.name];
           case 'MemberExpression':
               let obj = checkNode(node.object, context);
               let prop;
               if (node.property.type === 'Identifier') {
                   prop = node.property.name;
               } else if (node.property.type === 'Literal') {
                   prop = node.property.value;
               }
               if (!(prop in obj)) {
                   throw new Error(`Property ${prop} is not defined`);
               }
               return obj[prop];
           // Add more cases for other node types as needed
       }
   }
   function traverse(node, context = window) {
       return checkNode(node, context);
   }
   try {
       traverse(ast);
   } catch (error) {
       if (logit) {
           console.log(error.message);
       }
       return 0; // or handle the error as needed
   }
   // Step 3: Evaluate the formula using the global context
   try {
       const func = new Function(`return (${formula});`);
       return func.call(window);
   } catch (error) {
       if (logit) {
           console.log('Error during evaluation', error);
       }
       return 0; // or handle the error as needed
   }
}

function jsonToXml(json) // no calculations, just a recursive format change from JSON to XML
{
   let xml = '';   
   for (let prop in json) 
   {
       if (json.hasOwnProperty(prop)) 
       {
           if (typeof json[prop] === 'object') 
           {
               xml += ` <${prop}>${jsonToXml(json[prop])}</${prop}>\n`; // recusrion for nested tags
           } 
           else 
           {
               xml += ` <${prop}>${json[prop]}</${prop}>\n`;
           }
       }
   }
   return xml;
}

function sanitizeparam(param, val)
{
   // standard VESC parameter - make sure it is within bounds
   let def;
   if ((param in params) && ('type' in params[param]))
   {
      if (params[param]['type'] == "bool" && val!=0 && val!=1) // boolean, but not boolean: correct
      {
         return (def || 0);
      }
      if (params[param]['type'] == "enum" && !val in params[param]['options']) // enum, but value out of range: correct
         return (def || 0);
      if (params[param]['type'] == "string") // string: nothing to check
         return val;
      else // this must be an int or double
      {
         if ('default' in params[param])
            def = params[param]['default'];
         else
            def = 0;
         val = parseFloat(val);
         if (isNaN(val) || val < params[param]['min'] || val > params[param]['max'])
            val = parseFloat(def);
         if (params[param]['type'] == "double" && 'decimals' in params[param])
            val = parseFloat(val.toFixed(params[param]['decimals'])).toString(); 
         return val;
      }      
   }
   else // custom parameter, just assume it's valid
      return val;
}

// downlad a JS variable as a file
function xmldownload(thingy, wraptag, filename='data.xml')
{
   const xmlString = `<?xml version="1.0" encoding="UTF-8"?>\n<${wraptag}>\n${jsonToXml(thingy)}\n</${wraptag}>`;
   // Create a Blob from the XML string
   const blob = new Blob([xmlString], { type: 'application/xml' });   
   // Create a link element
   const link = $('<a></a>');
   link.attr('href', URL.createObjectURL(blob));
   link.attr('download', filename);
   link.text('Download XML');
   // Append the link to the body (or any other element)
   $('body').append(link);
}
function convertColToRow(data) {
   const rowIdentifiers = Object.keys(data); // Get row names from object keys (name, description, etc.)
   const columnHeaders = Object.keys(data[rowIdentifiers[0]]); // Get column headers from the first sub-object
   const rows = [['Property', ...columnHeaders]]; // Start with the "Property" column followed by column headers
   // Build each row
   rowIdentifiers.forEach(rowId => {
       const row = [rowId]; // First cell is the property (e.g., name, description)
       columnHeaders.forEach(colId => {
           row.push(data[rowId][colId]); // Get the value for each row-column combination
       });
       rows.push(row);
   });
   return rows;
}

// console.logsearch(substring, ...args) only outputs to log if substring is contained
console.logsearch = function(substring, ...args)
{
   // Convert each argument to a string
   const message = args.map(arg => 
   {
      if (typeof arg === 'object') 
      {
         return JSON.stringify(arg);
      }
      return String(arg);
   }).join(' ');
   // Check if the buffer contains the desired substring
   if (message.includes(substring)) 
   {
      let showsub = '';
      if (substring)
         showsub = substring + ': ';
      console.log(showsub, ...args);
   }
}

// create a table to only show the selected component
function createTable(component)
{
   const selectedcomponent = vars[component];
   const table = $('<table>').addClass('component');
   const thead = $('<thead>');
   const headerRow = $('<tr>');
   const headerCell = $('<th>').attr('colspan', 2).text(component);
   headerRow.append(headerCell);
   thead.append(headerRow);
   const tbody = $('<tbody>');
   $.each(selectedcomponent, function(key, value) {
      if (value !== null) // don't add empty rows
      {
         const row = $('<tr>');
         let keyval = key;
         let title;
         const comment = sheetcomments[component][key];
         if (comment)
         {
            let carr = comment.split("\n", 2);
            if (carr.length === 2) { // use the whole rest of the string, including possible further newlines.
               carr[1] = comment.substring(comment.indexOf("\n") + 1);
            }
            key = carr[0];
            if (carr[1])
               title = carr[1];
         }
         let keyCell = $('<td>');
         if (title)
         {
            title = title.replace(/\n/g, '<br>');
            keyCell.attr("title", title);
            keyCell.addClass('tooltip');
         }
         keyCell.html(key);
         let cellval = value;
         if ((keyval in params) && (params[keyval]['type']=='enum'))
         {
            cellval = params[keyval]['options'][cellval];
            if (cellval.includes('BATTERY_TYPE')) {
               cellval = cellval.split('_')[2];  // Extract LIION, LIIRON
           }
         }
         const valueCell = $('<td>').html(cellval);
         row.append(keyCell, valueCell);
         tbody.append(row);
      }
   });
   table.append(thead, tbody);
   return table;
}

function indexofkeyinobject(k, o)
{
   if (!(k in o)) 
      return -1;
   let keys = Object.keys(o);
   return keys.indexOf(k);
}

function handleResetButton() {
   // Show the confirmation tooltip
   $('#resetButton').on('click', function(event) {
       let tooltip = $('#confirmTooltip');
       let overlay = $('#overlay');
       let buttonOffset = $(this).offset();
       let tooltipHeight = tooltip.outerHeight();
       // Position the tooltip above the button
       tooltip.css({
           display: 'block',
           top: buttonOffset.top - tooltipHeight - 10 + 'px', // 10px above the button
           left: buttonOffset.left + 'px' // Horizontally aligned with the button
       });
       // Show the overlay
       overlay.show();
       // Add an event listener to close the tooltip on 'Esc' key
       $(document).on('keydown', function(e) {
           if (e.key === 'Escape') {
               cancelReset();
           }
       });
   });
   // Confirm action: clear localStorage and reload the page
   $('#confirmBtn').on('click', function() {
       localStorage.clear();
       location.reload();
   });
   // Cancel action: hide the tooltip
   $('#cancelBtn, #overlay').on('click', cancelReset);
   // Cancel action: hide the tooltip and overlay
   function cancelReset() {
       $('#confirmTooltip').hide();
       $('#overlay').hide();
       $(document).off('keydown'); // Remove the 'Esc' key event listener
   }
}

// Function to generate and download an Excel file directly from sheetsbycol structure
async function srcdownloadExcel(data, baseFileName) {
   const workbook = new ExcelJS.Workbook();
   const worksheet = workbook.addWorksheet('Sheet1');
   const urlPattern = /<a\s+[^>]*href=['"]([^'"]*)['"]/g; // Regex to capture href URLs from anchor tags
   const pureUrlPattern = /https?:\/\/[^\s]+/g;  // Regular expression to find URLs
   // Extract the product names (keys) and the first product's properties
   const productNames = Object.keys(data.name); // ["10.5x...", "11.5x...", "11x..."]
   const properties = Object.keys(data); // ["name", "description", "diameterinch", "diametermm"]
   // Add header row: 'Property' + product names
   worksheet.addRow(['', ...productNames]);
   // Add each property as a row
   properties.forEach(property => {
         const title = propertytitle(baseFileName, property);
         const row = [title]; // Start with the property name or title
         productNames.forEach(product => {
            let propval = data[property][product];
            if (property.endsWith('url'))
            {
               let urls = '';
               let match;
               // Extract all href URLs using the regex
               while ((match = urlPattern.exec(propval)) !== null) 
               {
                   urls += match[1] + '\n'; // Add each URL followed by a newline
               }
               propval = urls.trim();
            }
            row.push(propval); // Push the value for this property and product
         });
         worksheet.addRow(row); // Add the row to the worksheet
   });
   // Increase font size for all cells and set text wrap
   worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
         row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            // Increase font size and enable wrap
            cell.font = { size: 18 };  // Set font size to 18
            cell.alignment = { wrapText: true, vertical: 'top', horizontal: 'right'};  // Enable text wrap and vertical align top
            // Check for URLs in the cell content
            if (typeof cell.value === 'string') 
            {
               const urls = cell.value && cell.value.match(pureUrlPattern);
               if (urls) 
               {
                   // If multiple URLs, create a single clickable link for the first one
                   cell.value = { text: cell.value, hyperlink: urls[0] };
                   cell.font = {size: 12, color: { argb: 'FF0000FF' }, underline: true};
               }
            }
         });
   });
   // Set column widths to fit within 2000 pixels total width
   const totalWidth = 2000; // Total width in pixels
   const columnCount = productNames.length + 1; // Number of columns
   const columnWidth = totalWidth / columnCount / 7; // Approximate width in Excel units (7 pixels per unit)
   worksheet.columns.forEach(column => {
         column.width = columnWidth; // Set each column to the calculated width
   });
   // Apply bold to the first row (headers) and first column (Property names)
   worksheet.getRow(1).font = { bold: true, size: 18 }; // Bold the first row (headers) with larger font
   for (let i = 1; i <= worksheet.rowCount; i++) {
         worksheet.getCell(`A${i}`).font = { bold: true, size: 18 }; // Bold the first column (Property names) with larger font
   }
   // Freeze the first row and first column
   worksheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];
   // Generate the Excel file and trigger download
   const buffer = await workbook.xlsx.writeBuffer();
   const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
   const link = $('<a>').attr({
         href: URL.createObjectURL(blob),
         download: baseFileName + '.xlsx'
   });
   $('body').append(link);
   link[0].click();
   link.remove();
}
// get full title for Excel row
function propertytitle(component, property)
{
   if (!(property in sheetcomments[component]))
      return property;
   return sheetcomments[component][property].split('\n')[0];
}

let deferredPrompt; // Define deferredPrompt globally
// register service worker for mobile web app
if ('serviceWorker' in navigator) {
   window.addEventListener('load', function() {
     navigator.serviceWorker.register('/vesc_config/service-worker.js').then(function(registration) {
//       console.log('ServiceWorker registration successful with scope: ', registration.scope); // no need to show this in log normally
     }).catch(function(err) {
       console.log('ServiceWorker registration failed: ', err);
     });
   });
 }
 $(window).on('beforeinstallprompt', function(e) {
   console.log('beforeinstallprompt event fired');
   e.preventDefault();  // Prevent the default mini-infobar from appearing
   deferredPrompt = e.originalEvent;  // Store the event for later use
   // Show the install button
   $('#installApp').show();
   // Attach a click event listener to the install button
   $('#installApp').off('click').on('click', function() {
       $('#installApp').hide();  // Hide the install button
       deferredPrompt.prompt();  // Show the install prompt
       // Handle the user’s response to the install prompt
       deferredPrompt.userChoice.then(function(choiceResult) {
           if (choiceResult.outcome === 'accepted') {
               console.log('User accepted the install prompt');
           } else {
               console.log('User dismissed the install prompt');
           }
           deferredPrompt = null;  // Clear the deferredPrompt variable
       });
   });
});

// darken table rows on mouseover
function trmouseovers()
{
   $("tr").hover(
     function() {
       // Store the original background color
       var originalColor = $(this).css("background-color");
       // Darken the color slightly
       $(this).css("background-color", darkenColor(originalColor, 0.1));
       // Save the original color in data attribute to restore later
       $(this).data("originalColor", originalColor);
     },
     function() {
       // Restore the original background color
       $(this).css("background-color", $(this).data("originalColor"));
     }
   );
   // Function to darken the color
   function darkenColor(color, percent) {
     // Convert RGB color to an array
     var colorArray = color.match(/\d+/g).map(Number);
     for (var i = 0; i < 3; i++) {
       colorArray[i] = Math.floor(colorArray[i] * (1 - percent));
     }
     return 'rgb(' + colorArray.join(', ') + ')';
   }
 }







