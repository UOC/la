$( document ).ready(function() {

  $('#consolidate_data').click(function(){
    consolidateDataLA($('#collection').val());
  });
  $('#consolidate_data_all').click(function(){
    consolidateDataLA('');
  });

  $('#send').click(function(){
    launchQueryLA();
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
  $('#fromNext').click(function(){
    $('#from').val(parseInt($('#from').val(),10)+parseInt($('#limit').val(),10));
    launchQueryLA();
  });
  $('#fromPrevious').click(function(){
    var value = parseInt($('#from').val(),10)+parseInt($('#limit').val(),10);
    if (value<0) {
      value = 0;
    }
    $('#from').val(value);
    launchQueryLA();
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
      $.post( "/dashboard", data, function(ret) {
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
  loadTables = function() {
      $('#result').html("Processing ....");
      $('#send').prop('disabled', 'disabled');
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

          for (var i = 0; i < ret.length; i++) {
            console.log(ret[i]);
            $('#tables')
                .append('<option value="'+ret[i]+'">'+ret[i]+'</option>')
            ;

          }
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
          $('#send').prop('disabled', '');
          $('#consolidate_data').prop('disabled', '');
      });    

  }  
});