var lastEvaluatedKey = '';
var lastEvaluatedKeyPrevious = '';
var go_forward = true;
var is_advanced_search = false;
var arrayAdvancedSearch = [];
var arrayAdvancedSearchKey = [];
$( document ).ready(function() {

  $('#send_advanced').addClass('hide');
  $('#use_advanced_search').addClass('hide');
  $('#consolidate_data').click(function(){
    consolidateDataLA($('#collection').val());
  });
  $('#consolidate_data_all').click(function(){
    consolidateDataLA('');
  });
  $('#tables').change(function(){
    lastEvaluatedKey = '';
    $('#advanced_search').html(""); 
    $('#send_advanced').addClass('hide');
    if ($('#tables').val()!='') {
      arrayAdvancedSearch = [];
      arrayAdvancedSearchKey = [];
      $('#advanced_search').html("Loading data structure"); 
      $.ajax({
        type: "GET",
        url: "/describeTable/"+$('#tables').val()
      }).done(function( ret ) {
        if (ret) {
          $('#send_advanced').removeClass('hide');
          $('#use_advanced_search').removeClass('hide');
          var search = '';
          for (var i=0; i<ret.length; i++) {
            search += '<div class="col-md-2"><div class="form-group"><input type="text" name="'+ret[i].AttributeName+'"  id="advanced_search_'+ret[i].AttributeName+'" /><span class="help-block">'+ret[i].AttributeName+' <i>type: '+ret[i].AttributeType+':</i></span> </div></div>';
            arrayAdvancedSearch[arrayAdvancedSearch.length] = ret[i].AttributeName;
            if (ret[i].isKey) {
              arrayAdvancedSearchKey[arrayAdvancedSearchKey.length] = ret[i].AttributeName;
            }
          }
          $('#advanced_search').html(search);          
        }
        else {
          console.error("Error getting tables!", ret);
          $('#advanced_search').html("Error data structure!");
        }

      })
      .fail(function() {
          $('#advanced_search').html("Error data structure"); 
      })
      .always(function() {
          changeStateButtons(false);
      });    
    }
  });

  $('#sendMongo').click(function(){
    launchQueryLA();
  });
  $('#fromNextMongo').click(function(){
    $('#fromMongo').val(parseInt($('#fromMongo').val(),10)+parseInt($('#limitMongo').val(),10));
    launchQueryLA();
  });
  $('#fromPreviousMongo').click(function(){
    var value = parseInt($('#fromMongo').val(),10)-parseInt($('#limitMongo').val(),10);
    if (value<0) {
      value = 0;
    } else {
      lastEvaluatedKey = lastEvaluatedKeyPrevious;
    }
    $('#fromMongo').val(value);
    launchQueryLA();
  });

  $('#send').click(function(){
    is_advanced_search = false;
    $('#from').val(0);
    lastEvaluatedKey = '';
    launchQueryDynamoDB();
  });
  $('#send_advanced').click(function(){
    is_advanced_search = true;
    $('#from').val(0);
    lastEvaluatedKey = '';
    launchQueryDynamoDB();
  });
  $('#fromNext').click(function(){
    $('#from').val(parseInt($('#from').val(),10)+parseInt($('#limit').val(),10));
    launchQueryDynamoDB();
  });
  $('#fromPrevious').click(function(){
    var value = parseInt($('#from').val(),10)-parseInt($('#limit').val(),10);
    if (value<0) {
      value = 0;
    }
    $('#from').val(value);
    launchQueryDynamoDB();
  });
  $('#logout').click(function(){
    document.location.href='/logout';
  });
  $('#go_to_mongo').click(function(){
    document.location.href='/dashboardMongo';
  });
  $('#go_to_dashboard').click(function(){
    document.location.href='/dashboard';
  });
  $('#reload_tables').click(function(){
    loadTables();
  });

  launchQueryLA= function() {
    $('#result').html("Loading ....");
      $('#send').prop('disabled', 'disabled');
      $('#consolidate_data').prop('disabled', 'disabled');
      var data = {
        collection: $('#collection').val(),
        query: $('#query').val(),
        sort: $('#sort').val(),
        sort_order: $('#sort_order').val(),
        from: $('#from').val(),
        limit: $('#limit').val()
      };
      $.post( "/dashboardMongo", data, function(ret) {
        $('#result').html(ret.content);
        /*hljs.highlightBlock($('#result').get(0));*/

      })
      .fail(function() {
          alert("Error");
      })
      .always(function() {
          $('#send').prop('disabled', '');
          $('#consolidate_data').prop('disabled', '');
      });    
  }
  consolidateDataLA = function(collection) {
      $('#result').html("Processing ....");
      $('#send').prop('disabled', 'disabled');
      $('#consolidate_data').prop('disabled', 'disabled');
      var data = {
        
      };
      $.ajax({
        type: "POST",
        url: "/consolidate_data",
        data: { collection: collection },
        timeout: 6000000, //60 min
      }).done(function( ret ) {
        if (ret) {
          $('#result').html("Data consolidated!");
        }
        else {
          $('#result').html("Error consildating data!");
        }

      })
      .fail(function() {
         $('#result').html("Error consildating data!");
      })
      .always(function() {
          $('#send').prop('disabled', '');
          $('#consolidate_data').prop('disabled', '');
      });    

  }
  changeStateButtons = function (disabled) {
      $('#send').prop('disabled', disabled?'disabled':'');
      $('#reload_tables').prop('disabled', disabled?'disabled':'');
      $('#send_advanced').prop('disabled', disabled?'disabled':'');
    
  }

  loadTables = function() {
      $('#result').html("Processing ....");
      changeStateButtons(true);
      $('#tables')
          .find('option')
          .remove()
          .end()
      ;
      var data = {
        
      };
      $.ajax({
        type: "GET",
        url: "/listTables"
      }).done(function( ret ) {
        if (ret) {
          $('#tables')
              .append('<option value="">-- Select Table --</option>')
          ;

          for (var i = 0; i < ret.length; i++) {
            $('#tables')
                .append('<option value="'+ret[i]+'">'+ret[i]+'</option>')
            ;

          }
          $('#result').html("Data loaded successfully");
        }
        else {
          console.error("Error getting tables!", ret);
          $('#result').html("Error getting tables!");
        }

      })
      .fail(function() {
         $('#result').html("Error consildating data!");
      })
      .always(function() {
          changeStateButtons(false);
      });    

  }  
  launchQueryDynamoDB= function() {
    if ($('#tables').val()=='') {
      alert("You have to select a table");
    } else {
      $('#result').html("Loading ....");
        changeStateButtons(true);
        var data = {
          tableName: $('#tables').val(),
          query: $('#query').val(),
          sort: $('#sort').val(),
          sort_order: $('#sort_order').val(),
          lastEvaluatedKey: lastEvaluatedKey,
          go_forward: go_forward,
          is_advanced_search: is_advanced_search,
          operation: $('input[name=queryOperations]:checked').val(),
          limit: $('#limit').val()
        };
        if (is_advanced_search){
          data['advanced_search'] = [];
          for (var i=0; i<arrayAdvancedSearch.length; i++) {
            data['advanced_search'][i] = {id: arrayAdvancedSearch[i], value: $('#advanced_search_'+arrayAdvancedSearch[i]).val()};
          }
        }
        $.post( "/dashboard", data, function(ret) {
          var str = '';
          for (var i=0; i<ret.Items.length; i++) {
            var resource = '{';
            if (ret.Items[i]['resource'] && ret.Items[i]['resource'].S) {
              resource += 'code:'+ret.Items[i]['resource'].S;
            }
            else  {
              if (ret.Items[i]['resource'] && ret.Items[i]['resource'].M) {
                if (ret.Items[i]['resource'].M.code) {
                  resource += (resource!='{'?', ':'')+'code:'+ret.Items[i]['resource'].M.code.S;
                }
                if (ret.Items[i]['resource'].M.credits) {
                  resource += (resource!='{'?', ':'')+'credits:'+ret.Items[i]['resource'].M.credits.N;
                } 
                if (ret.Items[i]['resource'].M.classroom) {
                  resource += (resource!='{'?', ':'')+'classroom:'+ret.Items[i]['resource'].M.classroom.S;
                }
                if (ret.Items[i]['resource'].M.subject) {
                  resource += (resource!='{'?', ':'')+'subject:'+ret.Items[i]['resource'].M.subject.S;
                }
              }
            }
            resource += '}';
            if (resource=='{}') {
              resource = '';
            }
            var result = '{';
            if (ret.Items[i]['result']) {
              if (ret.Items[i]['result'].S) {
                result += ret.Items[i]['result'].S;
              }
              if (ret.Items[i]['result'].N) {
                result += ret.Items[i]['result'].N;
              }
            }
            if (ret.Items[i]['passed']) {
              result += ',passed:'+ret.Items[i]['passed'].N;
            }
            if (ret.Items[i]['failed']) {
              result += ',failed:'+ret.Items[i]['failed'].N;
            }
            if (ret.Items[i]['total']) {
              result += ',total:'+ret.Items[i]['total'].N;
            }
            result += '}';
            var subject = ret.Items[i]['subject']?ret.Items[i]['subject'].S:'';
            var user = ret.Items[i]['user']?ret.Items[i]['user'].S:'';
            var time = ret.Items[i]['time']?ret.Items[i]['time'].S:ret.Items[i]['semester'].S;
            str += //'objectId:'+ ret.Items[i]['objectId'].S+", "+
                  'time:'+ time+", "+
                  (ret.Items[i]['service']?'service:'+ ret.Items[i]['service'].S+", ":"")+
                  (resource.length>0?('resource:'+ resource+", "):"")+
                  (user.length>0?('user:'+ user+", "):"")+
                  (subject.length>0?('subject:'+ subject+", "):"")+
                  'result:'+ result+"<br>"
                  ;
            lastEvaluatedKeyPrevious = lastEvaluatedKey;
            lastEvaluatedKey = ret.LastEvaluatedKey;
          }
          $('#result').html(str);
          hljs.highlightBlock($('#result').get(0));

        })
        .fail(function(err) {
          var error_msg = "Undefined error";
          if (err.responseJSON && err.responseJSON.code && err.responseJSON.message) {
            error_msg = err.responseJSON.message;
          }
          alert(error_msg);
        })
        .always(function() {
            changeStateButtons(false);
        });    
      }
  }
});