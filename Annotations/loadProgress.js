var loadProgress=new function() {
var pBar = document.getElementById('main-loader');
var tCnt = document.getElementById('prog');
    if(tCnt)
    var title = tCnt.children[0];
this.addValue = function(value) {
if (pBar) {
    var pValue = parseInt(title.innerHTML) + parseInt(value);
   
        title.innerHTML = pValue;
   
    if (pValue >= 100) {
        setTimeout(function() {
            pBar.style.display = 'none';
           // document.getElementById('chart-content').style.visibility = 'visible';
        }, 100);


    }
}
};
}