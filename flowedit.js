function handleFileSelect(evt) {
    let files = evt.target.files; // FileList object

    // use the 1st file from the list
    let f = files[0];
    
    let reader = new FileReader();

    // Closure to capture the file information.
    reader.onload = (function(theFile) {
        return function(e) {
          var x2js = new X2JS();
          var obj = x2js.xml_str2json(e.target.result);
          console.log(obj);
          genGraph(obj);
          jQuery('#editor').val(JSON.stringify(obj));
        };
      })(f);

      // Read in the image file as a data URL.
      reader.readAsText(f);
  }

function parseXml(xml) {
   var dom = null;
   if (window.DOMParser) {
      try { 
         dom = (new DOMParser()).parseFromString(xml, "text/xml"); 
      } 
      catch (e) { dom = null; }
   }
   else if (window.ActiveXObject) {
      try {
         dom = new ActiveXObject('Microsoft.XMLDOM');
         dom.async = false;
         if (!dom.loadXML(xml)) // parse error ..

            window.alert(dom.parseError.reason + dom.parseError.srcText);
      } 
      catch (e) { dom = null; }
   }
   else
      alert("cannot parse xml string!");
   return dom;
}

document.getElementById('upload').addEventListener('change', handleFileSelect, false);

function genGraph(obj){
    const graphComponent = new GraphComponent();
    const builder = new GraphBuilder(obj);
    graphComponent.graph = builder.buildGraph();
}