$( document ).ready(function() {

  $('#consolidate_data').click(function(){
    $('#result').html("Processing ....");
      $('#send').prop('disabled', 'disabled');
      $('#consolidate_data').prop('disabled', 'disabled');
      var data = {
        collection: $('#collection').val(),
        query: $('#query').val(),
        from: $('#from').val(),
        limit: $('#limit').val()
      };
      $.post( "/consolidate_data", data, function(ret) {
        if (ret) {
          $('#result').html("Data consolidated!");
        }
        else {
          $('#result').html("Error consildating data!");
        }
        //hljs.highlightBlock($('#result').get(0));

      })
      .fail(function() {
         $('#result').html("Error consildating data!");
      })
      .always(function() {
          $('#send').prop('disabled', '');
          $('#consolidate_data').prop('disabled', '');
      });    
  });

  $('#send').click(function(){
    launchQueryLA();
  });
  $('#logout').click(function(){
    document.location.href='/logout';
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
        from: $('#from').val(),
        limit: $('#limit').val()
      };
      $.post( "/dashboard", data, function(ret) {
        $('#result').html(ret.content);
        //hljs.highlightBlock($('#result').get(0));

      })
      .fail(function() {
          alert("Error");
      })
      .always(function() {
          $('#send').prop('disabled', '');
          $('#consolidate_data').prop('disabled', '');
      });    
  }
});