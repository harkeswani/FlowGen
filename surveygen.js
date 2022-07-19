function question(I, T, TY){
    this.id = I;
    this.text = T;
    this.type = TY;
    this.required = true;
    this.options = [];
    this.conditions = [];
    this.state = "";
}

function section(I, T, TY, P){
    this.id = I;
    this.text = T;
    this.type = TY;
    this.nextSection = [];
    this.prereqs = [];
    this.questions = [];
    this.outputs = [];
    this.messages = [];
}

function message(M, F){
    this.message = M;
    this.flags = [];
}

function condition(C, O, F){
    this.state = C;
    this.operation = O;
    this.flag = F;
}

function flag(F, S){
    this.flagName = F;
    this.status = S;
}

function loadXML(fileName) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      init(this);
    }
  };
  xmlhttp.open("GET", fileName, true);
  xmlhttp.send();
}

var surveyData = [];
var cflags = [];
var sectionHistory = [1];

function submit(event){
    if (updateSectionData(sectionHistory[sectionHistory.length-1])){
        var currentSection = getSection(sectionHistory[sectionHistory.length-1]);
        var questions = currentSection.questions;
        for (var i=0;i<questions.length;i++){
            for (var j=0;j<questions[i].conditions.length;j++){
                var state = questions[i].conditions[j].state;
                var operation = questions[i].conditions[j].operation;
                if (operation=="greater"){
                    if (questions[i].state>state){
                        updateFlag(questions[i].conditions[j].flag, true);
                    }
                } else if (operation=="less"){
                    if (questions[i].state<state){
                        updateFlag(questions[i].conditions[j].flag, true);
                    }
                } else if (operation=="equal"){
                    if (questions[i].state==state){
                        updateFlag(questions[i].conditions[j].flag, true);
                    }
                }
            }
        }
        console.log(cflags);
        for (var a=0;a<currentSection.nextSection.length;a++){
            var nextPossible = getSection(currentSection.nextSection[a]);
            var prereqsmet = true;
            for (var b=0;b<nextPossible.prereqs.length;b++){
                if (!getFlag(nextPossible.prereqs[b])){
                    prereqsmet = false;
                }
            }
            if (prereqsmet && !stackContains(sectionHistory, nextPossible.id)){
                document.getElementById("S"+sectionHistory[sectionHistory.length-1]).style.display = "none";
                sectionHistory.push(nextPossible.id);
                for (var out1=0;out1<nextPossible.outputs.length;out1++){
                    var sID = nextPossible.outputs[out1].split(/[SQ]/)[1];
                    var qID = nextPossible.outputs[out1].split(/[SQ]/)[2];
                    if (getQuestion(getSection(sID),qID)!=null){
                        document.getElementById("D"+nextPossible.outputs[out1]).innerHTML = getQuestion(getSection(sID),qID).state;
                    }
                }
                document.querySelectorAll('.message').forEach(e => e.remove());
                for (var m3=0;m3<nextPossible.messages.length;m3++){
                    var flagsTrue = true;
                    for (var m4=0;m4<nextPossible.messages[m3].flags.length;m4++){
                        if (!getFlag(nextPossible.messages[m3].flags[m4])){
                            flagsTrue = false;
                        }
                    }
                    if (flagsTrue){
                        var tree = document.createDocumentFragment();
                        var d3 = document.createElement("h3");
                        d3.classList.add("message");
                        d3.innerHTML = nextPossible.messages[m3].message;
                        d3.id = "message";
                        tree.appendChild(d3);
                        document.getElementById("S"+nextPossible.id).appendChild(tree);
                    }
                }
                document.getElementById("S"+nextPossible.id).style.display = "block";
                return;
            }
        }
    }
    
}

function back(event){
    promptUser("");
    if (sectionHistory.length>1){
        document.getElementById("S"+sectionHistory.pop()).style.display = "none";
        document.getElementById("S"+sectionHistory[sectionHistory.length-1]).style.display = "block";
    }
}

function updateFlag(flagName, set){
    for (var i=0;i<cflags.length;i++){
        if (cflags[i].flagName==flagName){
            cflags[i].status = set;
        }
    }
}

function stackContains(stack, value){
    for (var i=0;i<stack.length;i++){
        if (stack[i]==value){
            return true;
        }
    }
    return false;
}
    
function getFlag(flagName){
    for (var i=0;i<cflags.length;i++){
        if (cflags[i].flagName==flagName){
            if (cflags[i].status==true){
                return true;
            } else {
                return false;
            }
        }
    }
    return false;
}

function containsFlag(flagName){
    for (var i=0;i<cflags.length;i++){
        if (cflags[i].flagName==flagName){
            return true;
        }
    }
    return false;
}

function updateSectionData(id){
    var error = "";
    for (var i=0;i<surveyData.length;i++){
        if (surveyData[i].id==id){
            var s = surveyData[i].questions;
            for (var j=0;j<s.length;j++){
                var e = document.getElementById("S"+id+"Q"+s[j].id);
                var strUser;
                if (s[j].type=="Multiple"){
                    strUser = e.options[e.selectedIndex].text;
                } else {
                    strUser = e.value;
                }
                if ((strUser!=null && strUser!="Please select an option." && strUser!="") || s[j].required===false){
                    s[j].state = strUser;
                } else {
                    error += "Please complete: "+s[j].text+"\n";
                }
            }
        }
    }
    promptUser(error);
    if (error.length>0){
        return false;
    }
    return true;
}

function getSection(id){
    for (var i=0;i<surveyData.length;i++){
        if (surveyData[i].id==id){
            return surveyData[i];
        }
    }
    return null;
}

function getQuestion(section, id){
    if (section!=null){
        for (var i=0;i<section.questions.length;i++){
            if (section.questions[i].id==id){
                return section.questions[i];
            }
        } 
    }
    return null;
}

function promptUser(message){
    var element = document.getElementById("prompt");
    if (element!=null){
        element.parentNode.removeChild(element);
    }
    var tree = document.createDocumentFragment();
    var prompt = document.createElement("h3");
    prompt.id = "prompt";
    prompt.className += "title";
    prompt.style = "color: red";
    prompt.innerHTML = message;
    tree.appendChild(prompt);
    document.getElementById("survey").appendChild(tree)
}

function init(doc){
    var x = doc.responseXML;
    var inner = "<h2 style=\"font-weight: bold\" class=\"title\">";
    inner += x.getElementsByTagName("survey")[0].childNodes[0].nodeValue + "<\h2>";
    document.getElementById("survey").innerHTML = inner;
    var y = x.getElementsByTagName("section");
    for (var i=0;i<y.length;i++){
       var newSection = new section(y[i].getElementsByTagName("id")[0].childNodes[0].nodeValue,
                        y[i].getElementsByTagName("text")[0].childNodes[0].nodeValue,
                        y[i].getElementsByTagName("type")[0].childNodes[0].nodeValue);
       var p = y[i].getElementsByTagName("prereq");
       for (var a=0;a<p.length;a++){
           newSection.prereqs.push(p[a].childNodes[0].nodeValue);
       }
       var nOption = y[i].getElementsByTagName("nextOption");
       for (var h=0;h<nOption.length;h++){
           newSection.nextSection.push(nOption[h].childNodes[0].nodeValue);
       }
       if (newSection.type=="Questions"){
          var z = y[i].getElementsByTagName("question");
         for (var j=0;j<z.length;j++){
           var newQuestion = new question(z[j].getElementsByTagName("id")[0].childNodes[0].nodeValue,
                        z[j].getElementsByTagName("text")[0].childNodes[0].nodeValue,
                        z[j].getElementsByTagName("type")[0].childNodes[0].nodeValue);
           if (newQuestion.type=="Multiple"){
               var r = z[j].getElementsByTagName("option");
               for (var g=0;g<r.length;g++){
                   newQuestion.options.push(r[g].childNodes[0].nodeValue);
               }
           }
           if (z[j].getElementsByTagName("required") != null){
               if (z[j].getElementsByTagName("required")[0].childNodes[0].nodeValue == "No"){
                   newQuestion.required = false;
               }
           }
           var c = z[j].getElementsByTagName("condition");
           for (var c1=0;c1<c.length;c1++){
               var newC = new condition(c[c1].getElementsByTagName("state")[0].childNodes[0].nodeValue,
                                        c[c1].getElementsByTagName("operation")[0].childNodes[0].nodeValue,
                                              c[c1].getElementsByTagName("flag")[0].childNodes[0].nodeValue);
               newQuestion.conditions.push(newC);
               var newF = new flag(c[c1].getElementsByTagName("flag")[0].childNodes[0].nodeValue, "false");
               if (!containsFlag(c[c1].getElementsByTagName("flag")[0].childNodes[0].nodeValue)){
                   cflags.push(newF);
               }
           }
           newSection.questions.push(newQuestion);
       }
       } else if (newSection.type=="Output"){
           var z = y[i].getElementsByTagName("output");
           for (var j=0;j<z.length;j++){
               var v = z[j].getElementsByTagName("data");
               for (var w=0;w<v.length;w++){
                   newSection.outputs.push(z[j].getElementsByTagName("data")[w].childNodes[0].nodeValue);
               }
           }
           var z2 = y[i].getElementsByTagName("message");
           for (var j2=0;j2<z2.length;j2++){
               var newM = new message(z2[j2].getElementsByTagName("text")[0].childNodes[0].nodeValue);
               var mflags = z2[j2].getElementsByTagName("prereqFlag");
               for (var j3=0;j3<mflags.length;j3++){
                   newM.flags.push(mflags[j3].childNodes[0].nodeValue);
               }
               newSection.messages.push(newM);
           }
       }
       surveyData.push(newSection);
    }
    
    var tree = document.createDocumentFragment();
    for (var d=0;d<surveyData.length;d++){
        var o = surveyData[d];
        var divSection = document.createElement("div");
        divSection.id = "S"+o.id;
        divSection.className += "col-4";
        if (o.text!=null){
            var sectionText = document.createElement("h2");
            sectionText.className += "title";
            sectionText.innerHTML = o.text;
            divSection.appendChild(sectionText);
        }
        if (o.type=="Questions"){
            for (var e=0;e<o.questions.length;e++){
                var f = o.questions[e];
                var questionText = document.createElement("h3");
                questionText.className += "title";
                questionText.innerHTML = f.text;
                divSection.appendChild(questionText);
                if (f.required===true){
                    var reqText = document.createElement("p");
                    reqText.innerHTML = "*This question is required.";
                    reqText.style = "color:red";
                    divSection.appendChild(reqText);
                }
                if (f.type=="Multiple"){
                    var div1 = document.createElement("div");
                    div1.classList.add("input-group");
                    var div2 = document.createElement("div");
                    div2.className += "rs-select2 js-select-simple select--no-search";
                    var select = document.createElement("select");
                    select.id = "S"+o.id+"Q"+f.id;
                    select.name = "S"+o.id+"Q"+f.id;
                    select.style = "font-size:1.5em";
                    var defaultOption = document.createElement("option");
                    defaultOption.innerHTML = "Please select an option.";
                    defaultOption.disabled = "disabled";
                    defaultOption.selected = "selected";
                    select.appendChild(defaultOption);
                    for (var u=0;u<f.options.length;u++){
                        var option = document.createElement("option");
                        option.innerHTML = f.options[u];
                        select.appendChild(option);
                    }
                    var selectDrop = document.createElement("div");
                    selectDrop.className += "select-dropdown";
                    div2.appendChild(select);
                    div2.appendChild(selectDrop);
                    div1.appendChild(div2);
                    divSection.appendChild(div1);
                } else if (f.type=="Number"){
                    var numDiv = document.createElement("div");
                    numDiv.className += "input-group";
                    var inputDiv = document.createElement("input");
                    inputDiv.className += "input--style-1";
                    inputDiv.type = "number";
                    inputDiv.placeholder = f.text;
                    inputDiv.id = "S"+o.id+"Q"+f.id;
                    inputDiv.name = "S"+o.id+"Q"+f.id;
                    numDiv.append(inputDiv);
                    divSection.appendChild(numDiv);
                } else if (f.type=="Text"){
                    var numDiv = document.createElement("div");
                    numDiv.className += "input-group";
                    var inputDiv = document.createElement("textarea");
                    inputDiv.className += "form-control rounded-0";
                    inputDiv.style = "min-width: 100%";
                    inputDiv.rows = 10;
                    inputDiv.id = "S"+o.id+"Q"+f.id;
                    inputDiv.name = "S"+o.id+"Q"+f.id;
                    numDiv.append(inputDiv);
                    divSection.appendChild(numDiv);
                }
            }
        } else if (o.type=="Output"){
            var outputTable = document.createElement("table");
            for (var l=0;l<o.outputs.length;l++){
                var sID = o.outputs[l].split(/[SQ]/)[1];
                var qID = o.outputs[l].split(/[SQ]/)[2];
                var tableEntry = document.createElement("tr");
                var qEntry = document.createElement("th");
                qEntry.innerHTML = getQuestion(getSection(sID),qID).text;
                tableEntry.appendChild(qEntry);
                var aEntry = document.createElement("th");
                aEntry.id = "D"+"S"+sID+"Q"+qID;
                aEntry.innerHTML = "Blank";
                tableEntry.appendChild(aEntry);
                outputTable.appendChild(tableEntry);
            }
            divSection.appendChild(outputTable);
        }
        tree.appendChild(divSection);
        if (sectionHistory[sectionHistory.length-1]!=o.id){
            divSection.style.display = "none";
        }
        }
        document.getElementById("survey").appendChild(tree);
}