$(document).ready(function() {
  // Fancy animation
  $('.tweet-container').each(function(i) {
    $(this).delay(200*i).fadeIn(500);
  });
});
