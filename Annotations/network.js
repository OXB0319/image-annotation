DrawCore.register('network', function (sandbox) {


    function objectToQueryString(val) {
        var queryString = '';
        var first = true;
        for (p in val) {
            if (first) {
                queryString += '?';
                first = false;
            }
            else {
                queryString += '&';
            }
            queryString += p + '=' + encodeURIComponent(val[p]);
        }
        return queryString;
    }
   function ajax(options) {
  //     var xhr = new XMLHttpRequest();
       JSON2.svcGetData(options.url, options.data, function(data) {
       if (typeof(data) == 'string') {
            //while(data.lastIndexOf("'") > 0)data=data.replace("'", '"');
            var obj = JSON.parse(data, function(key, value) {
                            if ((typeof(value) == 'string') && value.indexOf('/Date(') != -1) {
                                return new Date(value.match(/\d+/)[0] * 1);
                            } else {
                                return value;
                            }
                       });
            options.success(obj); 
       } else {
           options.success(data); 
       }
       
       }, function(error) {
            console.log(error);
       });
   
//        xhr.open(options.type, options.url, true);
//       xhr.addEventListener('readystatechange', function() {
//           if (xhr.readyState == 4) {
//               if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {
//                   if (options.success) {
//                  //validate JSON result
//                       var responseText=xhr.responseText;
//                       var error = false;
//                     while(responseText.lastIndexOf('"{') > 0)responseText= responseText.replace('"{', '{');
//                     while(responseText.lastIndexOf('}"') > 0)  responseText=responseText.replace('}"', '}');
//                   while(responseText.lastIndexOf("'") > 0)  responseText=responseText.replace("'", '"');
//                    
//               
//                      try {
//                          var obj = JSON.parse(responseText, function(key, value) {
//                              if ((typeof(value) == 'string') && value.indexOf('/Date(') != -1) {

//                                  return new Date(value.match(/\d+/)[0] * 1);

//                              } else {
//                                  return value;
//                              }
//                          });
//                      } catch (e) {
//                          error = true;
//                          obj = {obj: {status:1} };
//                      }
//                       if (obj[Object.keys(obj)[0]].status==1 || error==true) {
//                      if (options.error) {
//                     options.error("Something's wrong");
//                 }
//                       } else {
//                       
//                       options.success(obj);}
//                   }
//               } else {
//                 if (options.error) {
//                     options.error("There is thecnical problems, please try again later");
//                 }
//               }
//           }
//           
 //      });
       
//       xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
    
 //      xhr.send(options.data);
   }
    function jsObjectDatesToISO(val) {
        for (var prop in val) {
            if (val[prop] instanceof Date) {
               val[prop].setHours(val[prop].getHours() - val[prop].getTimezoneOffset() / 60);
            }
            else if (!(val[prop] instanceof Date) && (typeof val[prop] == 'object' || Array.isArray(val[prop]))) {
                jsObjectDatesToISO(val[prop]);
            }
        }
        return val;
    }

    return {
        init: function() {

        },
        createRequest: function(method,request,urlParams, callBack) {
            if (method == 'POST' || method == 'PUT') {
         
                request = JSON.stringify({req:jsObjectDatesToISO(request)});
            }
          
            
//            $.ajax({
//                url: '/services/ChartService.svc/' + urlParams,
//                type: method,
//                data: request,
//                dataType: "json",
//                contentType: 'application/json; charset=utf-8',
//                success: function(response) {
//                    if (callBack)
//                        callBack(response);
//                }
//            });

            ajax({
                url: '/services/ChartService.svc/' + urlParams,
                type: method,
                data: request,
                success: function (response) {
                    if (callBack)
                        callBack(response);
                },
                error:function(e) {
                }
            });
        },
       

      
    };
});