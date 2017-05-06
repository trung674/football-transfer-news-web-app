
$(document).ready(function() {
  // Fancy animation
  $('.tweet-container').each(function(i) {
    $(this).delay(200).fadeIn(500);
  });

/*
  $(".flip").on("click", function(e) {
      var target = $(this).attr("href");
      $(target).slideToggle("fast");
      $(".results-panel").not(target).hide();

      e.preventDefault();
  });
  <div>
   <ul>
      <li><a class="flip" href="#panel1">Home</a></li>
      <li><a class="flip" href="#panel2">Agenda</a></li>
      <li><a class="flip" href="#panel3">Media</a></li>
      <li><a class="flip" href="#panel4">Contact</a></li>
   </ul>
    <div class="results-panel" id="panel1">
        <div>Anatomy</div>
    </div>
    <div hidden class="results-panel" id="panel2">
        <div>Anatomy is</div>
    </div>
    <div hidden class="results-panel" id="panel3">
        <div>Anatomy is destiny.</div>
    </div>
    <div hidden class="results-panel" id="panel4">
        <div>Anatomy is destiny555.</div>
    </div>
  </div>
*/

});
